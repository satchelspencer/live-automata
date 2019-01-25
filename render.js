const cv = require("./");
const grid = require("./grid");
const fs = require("fs");
const display = require("./display");
const _ = require("lodash");
cv.namedWindow("rendertest");

const seq = JSON.parse(fs.readFileSync("media/seq.json")).slice(0);
const mask = cv.imread("media/mask.jpg");
cv.invert(mask, mask);

const x = 7,
  y = 7,
  s = 200,
  ins = 200,
  rate = 15,
  period = Math.floor(20.57 * rate),
  T = 4 * rate,
  len = period + T,
  F = 1 * rate;

console.log(period, T, len, F);

const canvas = new cv.Mat(y * s, x * s, 16);

const rois = _.range(y).map(j =>
  _.range(x).map(i => {
    return canvas.roi(i * s, j * s, s, s);
  })
);

let prevVideos = {},
  nextVideos = {};

for (let frame = 0; frame < 10000; frame++) {
  const frameCurrent = frame % period,
    framePrev = Math.min(frameCurrent + period, len),
    stepIndex = Math.floor(frame / period),
    nextStep = seq[stepIndex],
    prevStep = seq[stepIndex - 1];

  //console.log("**", stepIndex, frameCurrent, framePrev);

  if (frameCurrent === 0) {
    _.values(prevVideos).forEach(video => video.capture.release());
    prevVideos = nextVideos;

    nextVideos = {};
    nextStep[0].forEach(row =>
      row.forEach(cell => {
        const str = grid.cell2string(cell);
        if (!nextVideos[str]) {
          nextVideos[str] = {
            capture: new cv.VideoCapture(`../FINALS_200/${str}.mp4`),
            capFrame: new cv.Mat(ins, ins, 16),
            sizedFrame: new cv.Mat(s, s, 16),
            firstFrame: new cv.Mat(s, s, 16)
          };
        }
      })
    );
  }

  /* read prev frames */
  if (prevStep && frameCurrent < T)
    _.values(prevVideos).forEach(video => {
      video.capture.read(video.capFrame);
      cv.resize(video.capFrame, video.sizedFrame);
      //cv.multiply(video.sizedFrame, 0.5, video.sizedFrame);
    });

  /* read next frames */
  _.values(nextVideos).forEach(video => {
    video.capture.read(video.capFrame);
    cv.resize(video.capFrame, video.sizedFrame);
    if (frameCurrent === 0) video.sizedFrame.copyTo(video.firstFrame);
    // cv.absdiff(video.sizedFrame, video.firstFrame, video.sizedFrame);
    // cv.cvtColor(video.sizedFrame, 6);
    // cv.cvtColor(video.sizedFrame, 8);
    // cv.blur(video.sizedFrame, video.sizedFrame, 20)
    // cv.threshold(video.sizedFrame, video.sizedFrame, 5, 255);
    // cv.blur(video.sizedFrame, video.sizedFrame, 10)
    // cv.invert(video.sizedFrame,video.sizedFrame)


    //if (prevStep && frameCurrent < T) cv.multiply(video.sizedFrame, 0.5, video.sizedFrame);
  });

  /* draw */
  nextStep[0].forEach((row, j) =>
    row.forEach((cell, i) => {
      const str = grid.cell2string(cell);
      nextVideos[str].sizedFrame.copyTo(rois[j][i]);
    })
  );

  if (prevStep && frameCurrent < T)
    prevStep[0].forEach((row, j) =>
      row.forEach((cell, i) => {
        const str = grid.cell2string(cell);
        cv.add(rois[j][i], prevVideos[str].sizedFrame, rois[j][i]);
        // nextVideos[str].sizedFrame.copyTo(rois[j][i]);
      })
    );

  cv.imshow("rendertest", canvas);
  if (cv.waitKey(1) >= 0) break;
}
