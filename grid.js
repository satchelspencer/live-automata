/*
Use = 0 | 1 | 2 | 3
Io = [Use, Use, Use, Use] //top, left, bottom, right
Cell = [Io, Io] //Input, Output
Grid = Cell[][]
*/
const _ = require("lodash");
const display = require("./display");
const SimplexNoise = require("simplex-noise");
const Alea = require("alea");

let prng = new Alea(7);
const simplex = new SimplexNoise(prng);

function shuffle(arr) {
  for (let i = 0; i < arr.length * 2; i++) {
    const a = Math.floor(prng() * arr.length),
      b = Math.floor(prng() * arr.length);
    const t = arr[a];
    arr[a] = arr[b];
    arr[b] = t;
  }
  return arr;
}

var possibleIos = [
  "1000",
  "1002",
  "1020",
  "1200",
  "2000",
  "2001",
  "2010",
  "2100",
  "3000",
  "0000",
  "0200",
  "0020",
  "0002",
  "0100",
  "0300",
  "0120",
  "0102",
  "0010",
  "0210",
  "0030",
  "0012",
  "0001",
  "0201",
  "0021",
  "0003"
];

function string2io(str) {
  return str.split("").map(s => parseInt(s, 10));
}

function io2string(io) {
  return io.join("");
}

function string2cell(str) {
  return str.split("-").map(string2io);
}

function cell2string(cell) {
  return cell.map(io2string).join("-");
}

function emptyGrid(x, y) {
  return _.range(y).map(i => _.range(x).map(j => [[0, 0, 0, 0], [0, 0, 0, 0]]));
}

function conflicts(a, b) {
  if (!a || !b) return false;
  else if (a === 1) return b === 1 || b === 3;
  else if (a === 2) return b === 2 || b === 3;
  else if (a === 3) return b !== 0;
}

const directions = [[0, -1], [-1, 0], [0, 1], [1, 0]];

function makeValidOutput(grid) {
  const height = grid.length,
    width = grid[0].length;

  const next = emptyGrid(width, height);

  shuffle(_.range(height)).forEach(y => {
    shuffle(_.range(width)).forEach(x => {
      const currentCell = grid[y][x];
      //console.log(x, y, cell2string(currentCell));
      directions.forEach(([dx, dy], direction) => {
        const nx = (x + dx + width) % width,
          ny = (y + dy + height) % height,
          neighbor = grid[ny][nx],
          nextNeighbor = next[ny][nx],
          invDirection = (direction + 2) % 4,
          output = currentCell[1][direction],
          dirname = ["top", "left", "bottom", "right"][direction];

        const tubeIsUsed = output && neighbor[1][invDirection],
          wouldOverflowNext =
            output &&
            _.some(nextNeighbor[0], input => conflicts(input, output));

        if (tubeIsUsed || wouldOverflowNext) {
          // if(tubeIsUsed) console.log('    tube is used', dirname)
          // if(wouldOverflowNext) console.log('    would overflow', direction)
          currentCell[1][direction] = 0;
        } else {
          nextNeighbor[0][invDirection] = output; //mark it in next as being used
        }
      });
    });
  });
}

function randomGrid(x, y) {
  const grid = emptyGrid(x, y).map(row =>
    row.map(cell => [
      cell[0],
      string2io(possibleIos[Math.floor(prng() * possibleIos.length)])
    ])
  );
  makeValidOutput(grid);
  return grid;
}

function getNoiseDir(x, y, z) {
  const n = (simplex.noise3D(x, y, z) + 1) / 2;
  return Math.floor(n * 4);
}

function noiseGrid(x, y, z) {
  const scale = 1 / 10;
  const grid = _.range(y).map(i =>
    _.range(x).map(j => {
      const nx = j * scale,
        ny = i * scale;
      const a = getNoiseDir(nx, ny, z + 0.4),
        b = getNoiseDir(nx, ny, z + 0.5);
      const out = [0, 0, 0, 0];
      out[a] += 1;
      out[b] += 2;
      return [[0, 0, 0, 0], out];
    })
  );
  //makeValidOutput(grid)
  return grid;
}

function applyOutputs(prevGrid, grid) {
  const height = grid.length,
    width = grid[0].length;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const prevCell = prevGrid[y][x];
      directions.forEach(([dx, dy], direction) => {
        const nx = (x + dx + width) % width,
          ny = (y + dy + height) % height,
          neighbor = grid[ny][nx],
          invDirection = (direction + 2) % 4;

        neighbor[0][invDirection] = prevCell[1][direction];
      });
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ocell = grid[y][x];
      if (io2string(ocell[0]) === "0000") ocell[1] = [0, 0, 0, 0];
    }
  }
}

function getNextInSeq(used, x, y, prev, z, d = 0) {
  if (d > 100) {
    return false;
  }
  let unknowns = 0;
  const grid = noiseGrid(x, y, z);
  if (prev) applyOutputs(prev, grid);
  makeValidOutput(grid);

  const nextUsed = { ...used };

  grid.forEach(row =>
    row.forEach(cell => {
      const str = cell2string(cell);
      if (str == "0000-0000") return;
      if (!used[str]) {
        nextUsed[str] = 1;
        unknowns++;
      } else {
        nextUsed[str]++;
      }
    })
  );

  if (unknowns > 1) return getNextInSeq(used, x, y, prev, z + 3.1, d + 1);
  else {
    // console.log(unknowns, used)
    // console.log(display.asciiGrid(grid))
    Object.assign(used, nextUsed);
    return grid;
  }
}

function eliminateDoubles(grid, used) {
  grid.forEach(row =>
    row.forEach(cell => {
      if (_.sum(cell[1]) > 0 && prng() < 0.1) {
        const beforeStr = cell2string(cell);
        cell[1] = cell[1].map(val => {
          return Math.max(val - (prng() > 0.5 ? 1 : 2), 0);
        });
        const afterStr = cell2string(cell);
        if (used[beforeStr]) {
          used[beforeStr]--;
          used[afterStr] = used[afterStr] || 0;
          used[afterStr]++;
        }
      }
    })
  );
}

function makeGridSeq(x, y, n, seq = []) {
  const used = {};
  const initlen = seq.length;
  _.range(n).forEach(i => {
    //console.log('making', i, ':')
    const prev = initlen + i && seq[initlen + i - 1];

    let scratchPrev = prev;
    let scratchUsed = used;
    let grid;
    while (!grid) {
      grid = getNextInSeq(used, x, y, scratchPrev, i / 1);
      if (!grid) {
        scratchPrev = JSON.parse(JSON.stringify(prev));
        scratchUsed = { ...used };
        eliminateDoubles(scratchPrev, scratchUsed);
      } else {
        Object.assign(used, scratchUsed);
        seq[initlen + i - 1] = scratchPrev;
      }
    }

    seq.push(grid);
  });
  return seq;
}

// let found = false;
// while (!found) {
//   const r = Math.random()
//   prng = new Alea(0.7461085417387205);
//   console.log(r)
//   const start = emptyGrid(8, 8);
//   start[2][2][1] = [0, 0, 0, 3];

//   const seq = makeGridSeq(8, 8, 40, [start]);

//   const used = {};
//   let failed = false
//   seq.forEach((grid, i) => {
//     console.log(i, ":");
//     console.log( display.asciiGrid(grid));
//     let unknowns = 0
//     grid.forEach(row =>
//       row.forEach(cell => {
//         const str = cell2string(cell);
//         if (str == "0000-0000") return;
//         if (!used[str]) {
//           used[str] = 1;
//           unknowns++
//           //console.log(str);
//         } else {
//           used[str]++;
//         }
//       })
//     );
//     if(unknowns > 1) failed = true
//   });
//   if(Object.keys(used).length > 36 && !failed) console.log(r, Object.keys(used).length, failed)
//   if(Object.keys(used).length == 41 && !failed) found = true
//  found = true
// }

module.exports = {
  makeGridSeq
};

//0.37535614549252383 @ 39 gaddamn

//0.9819904224313882 @ 40

//0.7461085417387205

//0.75476958377544

//0.9145277172864754 39