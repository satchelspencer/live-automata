const cv = require("./");
const fs = require("fs");
const _ = require("lodash");
const createRenderer = require("./render");

const rootDir = "../FINALS_200",//"/Volumes/POST_VERBAL/FINALS_892"//
  varCounts = _.mapValues(
    _.groupBy(fs.readdirSync(rootDir), p =>
      p
        .split("-")
        .slice(0, 2)
        .join("-")
        .replace(".mp4", "")
    ),
    g => g.length
  ),
  rseq = JSON.parse(fs.readFileSync("media/130.json")).slice(0),
  framerate = 15,
  period = Math.floor(20.57 * framerate),
  transLen = 4 * framerate;
config = {
  cellSize: 50,
  outRatio: 1,
  inputSize: [200, 200],
  fadeRatio: 0.1,
  mask: cv.imread("media/mask.jpg"),
  maskSize: 1209,
  maskVx: 62,
  maskVy: 71,
  maskVsize: 895,
  vout: "out.mpeg"
};

const {
  seq,
  rois,
  initCapture,
  frameBuffer,
  capture,
  drawRoi,
  canvas,
  width,
  height
} = createRenderer(rseq, config, varCounts);
const writer = new cv.VideoWriter("media/outtest.mpeg", width, height);
let prevVideos = {},
  nextVideos = {};

let ft = new Date().getTime();
function render(frame) {
  let t = new Date().getTime();
  //console.log(t - ft);
  ft = t;

  const frameCurrent = frame % period,
    stepIndex = Math.floor(frame / period),
    nextStep = seq[stepIndex][0],
    prevStep = seq[stepIndex - 1] && seq[stepIndex - 1][0],
    thisUsed = _.keys(seq[stepIndex][1]),
    lastUsed = prevStep ? _.keys(seq[stepIndex - 1][1]) : [],
    liveCell = _.difference(thisUsed, lastUsed)[0],
    Tfrac = prevStep && frameCurrent < transLen ? frameCurrent / transLen : -1;

  if (frameCurrent === 0) {
    console.log(stepIndex)
    _.values(prevVideos).forEach(video => video.video.capture.release());
    prevVideos = nextVideos;

    nextVideos = {};
    nextStep.forEach(row =>
      row.forEach(cell => {
        if (!nextVideos[cell])
          nextVideos[cell] = {
            video: initCapture(`${rootDir}/${cell}.mp4`),
            buffer: frameBuffer(1)
          };
      })
    );
  }

  _.values(nextVideos).forEach(video =>
    capture(
      video.video,
      video.buffer[0],
      prevStep && frameCurrent < transLen && video.video.firstFrame
    )
  );
  if (prevStep && frameCurrent < transLen)
    _.values(prevVideos).forEach(video =>
      capture(video.video, video.buffer[0], video.video.firstFrame)
    );

  /* draw */
  nextStep.forEach((row, j) =>
    row.forEach((cell, i) => {
      const prevCell = prevStep && prevStep[j][i],
        nextFrame = nextVideos[cell].buffer[0],
        prevFrame = prevStep && prevVideos[prevCell].buffer[0],
        roi = rois[j][i];
      drawRoi(roi, Tfrac, nextFrame, prevFrame);
      //if(cell === liveCell)cv.invert(roi.bg, roi.bg);
    })
  );


  writer.write(canvas);
  // cv.imshow("lautmat", canvas);
  // cv.waitKey(1);

  let nt = new Date().getTime(),
    diff = nt - t;

  setTimeout(() => render(frame + 1), 0);
}
render(0);
