const cv = require("./");
const grid = require("./grid");
const fs = require("fs");
const display = require("./display");
const _ = require("lodash");
cv.namedWindow("rendertest");

const seq = JSON.parse(fs.readFileSync("media/seq.json"));
const mask = cv.imread('media/mask.jpg')

const x = 7,
  y = 7,
  s = 200,
  ins = 200;
const canvas = new cv.Mat(y * s, x * s, 16);

const rois = _.range(y).map(j =>
  _.range(x).map(i => {
    return canvas.roi(i * s, j * s, s, s);
  })
);

seq.forEach(([thisGrid]) => {
  const captures = {},
    capFrames = {},
    sizedFrames = {};

    thisGrid.forEach(row =>
    row.forEach(cell => {
      const str = grid.cell2string(cell);
      captures[str] =
        captures[str] || new cv.VideoCapture(`../FINALS_200/${str}.mp4`);
      (capFrames[str] = capFrames[str] || new cv.Mat(ins, ins, 16)),
        (sizedFrames[str] = sizedFrames[str] || new cv.Mat(s, s, 16));
    })
  );

  for (let frame = 1; frame <= 392; frame++) {
    for (let str in captures) {
      captures[str].read(capFrames[str]);
      if(frame === 392) captures[str].release()
      cv.resize(capFrames[str], sizedFrames[str]);
    }

    thisGrid.forEach((row, j) =>
      row.forEach((cell, i) => {
        const str = grid.cell2string(cell);
        sizedFrames[str].copyTo(rois[j][i]);
      })
    );

    cv.imshow("rendertest", canvas);
    if (cv.waitKey(1) >= 0) break;
  }
});
