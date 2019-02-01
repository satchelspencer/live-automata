const cv = require("./");
const fs = require("fs");
const _ = require("lodash");
const createRenderer = require("./render");
const player = require('play-sound')(opts = {})


const warnOffset = 6.03*1000
function playWarning(){
  //player.play('./media/123.mp3', () => {})
}

const rseq = JSON.parse(fs.readFileSync("media/seq61081479.75687055.json")),
  framerate = 20,
  period = Math.floor(20 * framerate), //20.57
  transLen = 4 * framerate,
  videoLen = period + transLen,
  config = {
    cellSize: 150,
    outRatio: 1,
    inputSize: [1260, 720],
    fadeRatio: 0.25,
    mask: cv.imread("media/mask.jpg"),
    maskSize: 1209,
    maskVx: 62,
    maskVy: 71,
    maskVsize: 890
  };

const { seq, rois, initCapture, frameBuffer, capture, drawRoi, canvas } = createRenderer(
    rseq,
    config
  ),
  camera = initCapture(0),
  buff = frameBuffer(1),
  toBeUsed = _.last(seq)[1],
  videoBuffers = _.mapValues(toBeUsed, () => frameBuffer(videoLen)),
  warnFrame = Math.floor(period-((warnOffset/1000)*framerate))
console.log(warnFrame)
_.times(10, () => capture(camera, buff[0], buff[0].frame));
videoBuffers["0000-0000"] = frameBuffer(videoLen).map(f => buff[0]); //fill 1st frame

let ft = new Date().getTime();
function render(frame) {
  let t = new Date().getTime();
  console.log(t - ft);
  ft = t;

  const frameCurrent = frame % videoLen,
    stepIndex = Math.floor(frame / videoLen),
    nextStep = seq[stepIndex][0],
    prevStep = seq[stepIndex - 1] && seq[stepIndex - 1][0],
    thisUsed = _.keys(seq[stepIndex][1]),
    lastUsed = prevStep ? _.keys(seq[stepIndex - 1][1]) : [],
    liveCell = _.difference(thisUsed, lastUsed)[0],
    Tfrac = prevStep && frameCurrent < transLen ? frameCurrent / transLen : -1;

  //console.log(stepIndex, frameCurrent, liveCell);
  if(frameCurrent === warnFrame) playWarning()

  capture(
    camera,
    videoBuffers[liveCell][frameCurrent],
    frameCurrent > period && videoBuffers[liveCell][0].frame
  );

  /* draw */
  if (frameCurrent < period) {
    nextStep.forEach((row, j) =>
      row.forEach((cell, i) => {
        const prevCell = prevStep && prevStep[j][i],
          roi = rois[j][i],
          nextFrame = videoBuffers[cell][frameCurrent],
          prevFrame =
            prevCell && videoBuffers[prevCell][Math.min(frameCurrent + period, videoLen)];
        drawRoi(roi, Tfrac, nextFrame, prevFrame);
      })
    );
  }

  cv.imshow("lautmat", canvas);
  cv.waitKey(1);

  let nt = new Date().getTime(),
    diff = nt - t;

  const isLastFrame = frameCurrent + 1 === videoLen,
  desiredDelay = isLastFrame ? 10000 : (1 / framerate) * 1000;
  if(isLastFrame) setTimeout(playWarning, desiredDelay-warnOffset)
  setTimeout(() => render(frame + 1), 0)//desiredDelay - diff);
}
render(0);
