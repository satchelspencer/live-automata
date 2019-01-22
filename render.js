const cv = require("./");
const grid = require("./grid");
const display = require('./display')
const _ = require("lodash");

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

cv.namedWindow("rendertest");

const x = 7,
  y = 7,
  s = 200,
  ins = 200
const canvas = new cv.Mat(y * s, x * s, 16);

// const grids = grid.makeGridSeq(x, y, 3, );
// console.log(display.asciiGrid(grids[0]))

const rois = _.range(y).map(j =>
  _.range(x).map(i => {
    return canvas.roi(i * s, j * s, s, s);
  })
);

const captures = {},
  capFrames = {},
  sizedFrames = {}

const gridsx = grid.randomGrid(x,y)

gridsx.forEach(row =>
  row.forEach(cell => {
    const str = cell2string(cell);
    captures[str] =
      captures[str] || new cv.VideoCapture(`../FINALS_200/${str}.mp4`);
    capFrames[str] = capFrames[str] || new cv.Mat(ins, ins, 16),
    sizedFrames[str] = sizedFrames[str] || new cv.Mat(s, s, 16);
  })
);

while(1){

  for(let str in captures){
    captures[str].read(capFrames[str])
    cv.resize(capFrames[str], sizedFrames[str])
  }

  gridsx.forEach((row, j) =>
    row.forEach((cell, i) => {
      const str = cell2string(cell);
      sizedFrames[str].copyTo(rois[j][i])
    })
  );

  cv.imshow('rendertest', canvas)
  if(cv.waitKey(1) >= 0) break;
}
