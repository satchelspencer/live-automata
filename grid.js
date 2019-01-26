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
const fs = require("fs");

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

function clone(grid) {
  return JSON.parse(JSON.stringify(grid));
}

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

function getNoiseDir(x, y, z) {
  const n = (simplex.noise3D(x, y, z) + 1) / 2;
  return Math.floor(n * 4);
}

function noiseGrid(x, y, z) {
  const scale = 1 / 2;
  const grid = _.range(y).map(i =>
    _.range(x).map(j => {
      const nx = j * scale,
        ny = i * scale;
      const a = getNoiseDir(nx, ny, z + 0.4),
        b = getNoiseDir(nx, ny, z + 0.8);
      const out = [0, 0, 0, 0];
      out[a] += 1;
      out[b] += 2;
      return [[0, 0, 0, 0], out];
    })
  );
  //makeValidOutput(grid)
  return grid;
}

function getSize(grid) {
  return [grid[0].length, grid.length];
}

function applyOutputs(prevGrid, grid, allowCreation) {
  const [width, height] = getSize(prevGrid);
  /* take outputs and feed them into adjacent cells */
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
  /* make sire that empty inputs have no output (no 0000-xxxx) */
  if (!allowCreation) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const ocell = grid[y][x];
        if (io2string(ocell[0]) === "0000") ocell[1] = [0, 0, 0, 0];
      }
    }
  }
}

function getNextInSeq(prev, z, allowCreation) {
  const [prevGrid, prevUsed] = prev,
    [width, height] = getSize(prevGrid);

  const grid = noiseGrid(width, height, z);
  applyOutputs(prevGrid, grid, allowCreation);
  makeValidOutput(grid);

  const nextUsed = { ...prevUsed };
  grid.forEach(row =>
    row.forEach(cell => {
      const str = cell2string(cell);
      if (str == "0000-0000") return;
      if (!prevUsed[str]) nextUsed[str] = 1;
      else nextUsed[str]++;
    })
  );
  return [grid, nextUsed];
}

function getUnknowns(prev, next) {
  return _.difference(
    _.keys(_.pickBy(next[1], n => n)),
    _.keys(_.pickBy(prev[1], n => n))
  );
}

function updateUsed(prev, next) {
  const [prevGrid] = prev,
    [nextGrid, nextUsed] = next;

  nextGrid.forEach((row, y) =>
    row.forEach((cell, x) => {
      const newStr = cell2string(cell),
        oldStr = cell2string(prevGrid[y][x]);
      if (newStr !== oldStr) {
        nextUsed[oldStr]--;
        if (!nextUsed[oldStr]) delete nextUsed[oldStr];
        nextUsed[newStr] = nextUsed[newStr] || 0;
        nextUsed[newStr]++;
      }
    })
  );
}

function prevent(parent, victim, toPrevent) {
  const newParent = clone(parent),
    [parentGrid] = parent,
    [newParentGrid] = newParent,
    [victimGrid] = victim,
    [width, height] = getSize(parentGrid);

  victimGrid.forEach((row, y) =>
    row.forEach((cell, x) => {
      const str = cell2string(cell);
      if (toPrevent.includes(str)) {
        directions.forEach(([dx, dy], direction) => {
          const nx = (x + dx + width) % width,
            ny = (y + dy + height) % height,
            invDirection = (direction + 2) % 4;
          newParentGrid[ny][nx][1][invDirection] = 0;
        });
      }
    })
  );
  //dont have to make valid, since removal only is always valid
  updateUsed(parent, newParent);
  return newParent;
}

function insertNew(step) {
  const [grid] = step,
    [width, height] = getSize(grid),
    newStep = clone(step),
    [newGrid, newUsed] = newStep;

  const tx = Math.floor(prng() * width),
    ty = Math.floor(prng() * height),
    output = string2io(possibleIos[Math.floor(prng() * possibleIos.length)]);

  const nextCell = newGrid[ty][tx];

  if (cell2string(nextCell) === "0000-0000") {
    nextCell[1] = output;
    makeValidOutput(newGrid);
    updateUsed(step, newStep);
  }
  return newStep;
}

function addAlreadyKnown(step) {
  const [grid, used] = step,
    entrances = _.keys(used).filter(
      v => v.split("-")[0] === "0000" && v.split("-")[1] !== "0000"
    );

  if (entrances.length < 2) return step;
  else {
    const [width, height] = getSize(grid),
      newStep = clone(step),
      [newGrid, newUsed] = newStep;

    grid.forEach((row, y) =>
      row.forEach((cell, x) => {
        const str = cell2string(cell);
        if (str === "0000-0000" && prng() < 0.05) {
          const newValue = entrances[Math.floor(prng() * entrances.length)];
          newGrid[y][x] = string2cell(newValue);
        }
      })
    );

    makeValidOutput(newGrid);
    updateUsed(step, newStep);

    return newStep;
  }
}

function makeGridSeq(start, n, ec, z = 0) {
  let seq = [start];
  while (seq.length < n) {
    const targetUnknowns = n - seq.length < ec ? 0 : 1;

    let prev = seq[seq.length - 1],
      next = getNextInSeq(prev, n + z),
      unknowns = getUnknowns(prev, next);

    let tries = 0;
    while (unknowns.length > targetUnknowns && tries++ < 100) {
      next = getNextInSeq(prev, n + z + tries);
      unknowns = getUnknowns(prev, next);
    }

    //console.log(seq.length, unknowns);
    if (unknowns.length > targetUnknowns) {
      let victim = next;
      while (unknowns.length > targetUnknowns) {
        const parent = seq.pop(),
          prev = seq[seq.length - 1],
          toPrevent = unknowns.slice(targetUnknowns);

        //console.log("preventing", toPrevent);
        next = prevent(parent, victim, toPrevent);
        unknowns = getUnknowns(prev, next);
        victim = next;
        //console.log("now has unknowns", unknowns);
      }
    }

    let added = next,
      a = 0;
    while (unknowns.length !== targetUnknowns && a++ < 100) {
      added = insertNew(next);
      unknowns = getUnknowns(prev, added);
      //console.log("adding", unknowns);
    }

    added = addAlreadyKnown(added);

    seq.push(added);
  }
  return seq;
}

function evaluate(seq, print) {
  const used = {};
  let failed = false;
  seq.forEach(([grid, _], i) => {
    print && console.log(i, ":");

    let unknowns = 0;
    grid.forEach(row =>
      row.forEach(cell => {
        const str = cell2string(cell);
        if (str == "0000-0000") return;
        if (!used[str]) {
          used[str] = 1;
          unknowns++;
          print && console.log(str);
        } else {
          used[str]++;
        }
      })
    );
    print && console.log(display.asciiGrid(grid));
    if (unknowns > 1) {
      failed = true;
      //throw "oh";
    }
  });

  const count = _.sum(_.values(used)),
    avg = count / _.values(used).length;

  let vari = 0;
  _.values(used).forEach(val => {
    vari += Math.abs(val - avg);
  });

  return {
    failed,
    count,
    avg,
    vari: vari,
    score: _.values(used).filter(v => v > 10).length + avg / 2,
    used: _.values(used)
  };
}

function makeRandSeq(start, n) {
  let seq = [start];
  while (seq.length < n) {
    let prev = seq[seq.length - 1],
      next = getNextInSeq(prev, n, true);

    seq.push(next);
  }
  return seq;
}

// const start = emptyGrid(7, 7);
// start[2][2][1] = [0, 0, 0, 3];
// const s = makeRandSeq([start, { "0000-0003": 1 }], 10);
// s.forEach((step, i) => {
//   console.log(display.asciiGrid(step[0]));
// });
// fs.writeFileSync('media/rseq.json', JSON.stringify(s))



// if (false) {
//   let max = 0;
//   while (1) {
//     try {
//       let r = Math.random() * 100000000;
//       prng = new Alea(r);
//       const start = emptyGrid(7, 7);
//       start[2][2][1] = [0, 0, 0, 3];
//       const seq = makeGridSeq([start, { "0000-0003": 1 }], 60, 20, r);

//       const { failed, score, used } = evaluate(seq);
//       if (/*used.length === 40 && */ !failed && score > max) {
//         max = score;
//         console.log(r, score);
//       }
//     } catch (e) {}
//   }
// } else {
//   let r = 96594309.23851529;
//   prng = new Alea(r);
//   const start = emptyGrid(7, 7);
//   start[2][2][1] = [0, 0, 0, 3];
//   const seq = makeGridSeq([start, { "0000-0003": 1 }], 60, 20, r);

//   console.log(evaluate(seq, 1));
//   //fs.writeFileSync('seq.json', JSON.stringify(seq))

// }

module.exports = {
  makeGridSeq,
  cell2string,
  string2cell
};
