const cv = require("./");
const grid = require("./grid");
const fs = require("fs");
const display = require("./display");
const _ = require("lodash");
cv.namedWindow("rendertest");

const seq = JSON.parse(fs.readFileSync("media/rseq.json")).slice(0),
  mask = cv.imread("media/mask.jpg"),
  maskSize = 1209,
  maskVx = 62,
  maskVy = 71;
maskVsize = 890;

const x = 7,
  y = 7,
  cs = 200,
  outRatio = 1//1.6,
  s = cs * (maskVsize / maskSize),
  maskScale = cs / maskSize,
  ins = 200, //input size
  rate = 15,
  period = Math.floor(20.57 * rate),
  T = 4 * rate,
  len = period + T,
  F = 1 * rate;

const frameBorder = new cv.Mat(cs, cs, 16);
cv.resize(mask, frameBorder);

const width = x * cs * outRatio, height = y * cs ,
 canvas = new cv.Mat(height, width, 16),
 oleft = (width-height)/2
console.log(oleft)
const rois = _.range(y).map(j =>
  _.range(x).map(i => {
    const frameRoi = canvas.roi(oleft+i * cs, j * cs, cs, cs);
    cv.add(frameBorder, frameRoi, frameRoi);

    return {
      bg: canvas.roi(
        oleft+Math.floor(i * cs + maskVx * maskScale),
        Math.floor(j * cs + maskVy * maskScale),
        s,
        s
      ),
      fg: new cv.Mat(s, s, 16),
      mask: new cv.Mat(s, s, 16)
    };
  })
);

function getMask(firstFrame, thisFrame, dest) {
  cv.absdiff(thisFrame, firstFrame, dest);
  cv.cvtColor(dest, 6);
  cv.cvtColor(dest, 8);
  cv.blur(dest, dest, 20);
  cv.threshold(dest, dest, 5, 255);
  cv.blur(dest, dest, 30);
}

let prevVideos = {},
  nextVideos = {};

  let t = new Date().getTime()
function renderFrame(frame){
  t = new Date().getTime()
  const frameCurrent = frame % period,
    stepIndex = Math.floor(frame / period),
    nextStep = seq[stepIndex],
    prevStep = seq[stepIndex - 1];

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
            firstFrame: new cv.Mat(s, s, 16),
            mask: new cv.Mat(s, s, 16),
            masked: new cv.Mat(s, s, 16)
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
      getMask(video.firstFrame, video.sizedFrame, video.mask);
      cv.multiply(video.sizedFrame, video.mask, video.masked, 1 / 255);
    });

  /* read next frames */
  _.values(nextVideos).forEach(video => {
    video.capture.read(video.capFrame);
    cv.resize(video.capFrame, video.sizedFrame);
    if (frameCurrent === 0) video.sizedFrame.copyTo(video.firstFrame);
    if (prevStep && frameCurrent < T) {
      getMask(video.firstFrame, video.sizedFrame, video.mask);
      cv.multiply(video.sizedFrame, video.mask, video.masked, 1 / 255);
    }
  });

  /* draw */
  nextStep[0].forEach((row, j) =>
    row.forEach((cell, i) => {
      const nextStr = grid.cell2string(cell);

      if (prevStep && frameCurrent < T) {
        const prevStr = grid.cell2string(prevStep[0][j][i]),
          Tfrac = frameCurrent / T,
          nextVid = nextVideos[nextStr],
          prevVid = prevVideos[prevStr];

        cv.add(nextVid.mask, prevVid.mask, rois[j][i].mask);
        cv.invert(rois[j][i].mask, rois[j][i].mask);

        cv.addWeighted(
          prevVid.firstFrame,
          1 - Tfrac,
          nextVid.firstFrame,
          Tfrac,
          0,
          rois[j][i].bg
        );
        if(frameCurrent < F){
          const Ffrac = frameCurrent/F
          cv.addWeighted(rois[j][i].bg, Ffrac, prevVid.sizedFrame, 1-Ffrac, 0, rois[j][i].bg)
        }
        
        cv.multiply(rois[j][i].bg, rois[j][i].mask, rois[j][i].bg, 1 / 255);

        cv.add(nextVid.masked, prevVid.masked, rois[j][i].fg);

        cv.add(rois[j][i].fg, rois[j][i].bg, rois[j][i].bg);
      } else nextVideos[nextStr].sizedFrame.copyTo(rois[j][i].bg);
    })
  );
  
  cv.imshow("6", canvas);
  cv.waitKey(1)
 
  renderFrame(frame+1);
  
}
renderFrame(0)