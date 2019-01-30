const cv = require("./");
const grid = require("./grid");
const fs = require("fs");
const _ = require("lodash");

const rootDir = "../FINALS_200",
  varCounts = _.mapValues(
    _.groupBy(fs.readdirSync(rootDir), p =>
      p
        .split("-")
        .slice(0, 2)
        .join("-")
        .replace(".mp4", "")
    ),
    g => g.length
  );
usages = {};

const seq = JSON.parse(fs.readFileSync("media/rseq.json"))
    .slice(3)
    .map(step => {
      return step[0].map(row =>
        row.map(cell => {
          const str = grid.cell2string(cell);
          usages[str] = usages[str] === undefined ? -1 : usages[str];
          usages[str] = (usages[str] + 1) % varCounts[str];
          return str + (usages[str] ? "-" + usages[str] : "");
        })
      );
    }),
  mask = cv.imread("media/mask.jpg"),
  maskSize = 1209,
  maskVx = 62,
  maskVy = 71;
maskVsize = 890;

const x = seq[0][0].length,
  y = seq[0].length,
  cs = 200,
  outRatio = 1; //1.6,
(s = cs * (maskVsize / maskSize)),
  (maskScale = cs / maskSize),
  (ins = 200), //input size
  (rate = 15),
  (period = Math.floor(20.57 * rate)),
  (T = 4 * rate),
  (len = period + T),
  (F = 0.25);

const frameBorder = new cv.Mat(cs, cs, 16);
cv.resize(mask, frameBorder);

const width = x * cs * outRatio,
  height = y * cs,
  canvas = new cv.Mat(height, width, 16),
  oleft = (width - height) / 2;
const rois = _.range(y).map(j =>
  _.range(x).map(i => {
    const frameRoi = canvas.roi(oleft + i * cs, j * cs, cs, cs);
    frameBorder.copyTo(frameRoi);
    return {
      bg: canvas.roi(
        oleft + Math.floor(i * cs + maskVx * maskScale),
        Math.floor(j * cs + maskVy * maskScale),
        s,
        s
      ),
      fg: new cv.Mat(s, s, 16),
      mask: new cv.Mat(s, s, 16),
      overlapMask: new cv.Mat(s, s, 16),
      invOverlapMask: new cv.Mat(s, s, 16)
    };
  })
);

function getMask(firstFrame, thisFrame, dest) {
  cv.absdiff(thisFrame, firstFrame, dest);
  cv.cvtColor(dest, 6);
  cv.cvtColor(dest, 8);
  cv.blur(dest, dest, cs / 10);
  cv.threshold(dest, dest, 5, 255);
  cv.blur(dest, dest, cs / 8);
}

function applyMask(src, mask, dest) {
  cv.multiply(src, mask, dest, 1 / 255);
}

function initCapture(cap, length) {
  const video = {
    capture: new cv.VideoCapture(cap),
    capFrame: new cv.Mat(ins, ins, 16),
    firstFrame: new cv.Mat(s, s, 16),
    buffer: _.range(length).map(() => {
      return {
        frame: new cv.Mat(s, s, 16),
        mask: new cv.Mat(s, s, 16),
        masked: new cv.Mat(s, s, 16)
      };
    })
  };
  video.capture.read(video.capFrame);
  cv.resize(video.capFrame, video.firstFrame);
  return video;
}

function capture(video, frameNumber, mask){
  const thisFrame = video.buffer[frameNumber];
  video.capture.read(video.capFrame);
  cv.resize(video.capFrame, thisFrame.frame);
  if (mask) {
    getMask(video.firstFrame, thisFrame.frame, thisFrame.mask);
    applyMask(thisFrame.frame, thisFrame.mask, thisFrame.masked);
  }
}

function drawRoi(roi, Tfrac, nextFrame, prevFrame) {
  if (Tfrac !== -1) {
    const ITfrac = 1 - Tfrac,
      { bg, fg, mask, overlapMask, invOverlapMask } = roi;

    cv.add(nextFrame.mask, prevFrame.mask, mask);
    cv.invert(mask, mask);

    nextFrame.frame.copyTo(bg);

    if (Tfrac < F) {
      const Ffrac = Tfrac / F;
      cv.addWeighted(bg, Ffrac, prevFrame.frame, 1 - Ffrac, 0, bg);
    }

    if (Tfrac > 1 - F) {
      const Ffrac = Math.max(ITfrac / F, 0);
      cv.addWeighted(bg, Ffrac, nextFrame.frame, 1 - Ffrac, 0, bg);
    }

    /* get composite of bg and fg */
    applyMask(bg, mask, bg);
    cv.add(nextFrame.masked, prevFrame.masked, fg);
    cv.add(fg, bg, bg);

    /* find overlapping areas */
    cv.addWeighted(nextFrame.mask, 0.5, prevFrame.mask, 0.5, -128, overlapMask);
    cv.mulConstant(overlapMask, 2, overlapMask);
    cv.invert(overlapMask, invOverlapMask);

    /* compute cossfade of prevand next and mask it to overlapped areas */
    cv.addWeighted(nextFrame.masked, Tfrac, prevFrame.masked, ITfrac, 0, fg);
    applyMask(fg, overlapMask, fg);

    /* remove overlapped areas from bg and replace them with crossfaded */
    applyMask(bg, invOverlapMask, bg);
    cv.add(fg, bg, bg);
  } else nextFrame.frame.copyTo(roi.bg);
}

let prevVideos = {},
  nextVideos = {};

let ft = new Date().getTime();
function render(frame) {
  let t = new Date().getTime();
  console.log(t - ft);
  ft = t;

  const frameCurrent = frame % period,
    stepIndex = Math.floor(frame / period),
    nextStep = seq[stepIndex],
    prevStep = seq[stepIndex - 1],
    Tfrac = prevStep && frameCurrent < T ? frameCurrent / T : -1;

  if (frameCurrent === 0) {
    _.values(prevVideos).forEach(video => video.capture.release());
    prevVideos = nextVideos;

    nextVideos = {};
    nextStep.forEach(row =>
      row.forEach(cell => {
        if (!nextVideos[cell]) nextVideos[cell] = initCapture(`${rootDir}/${cell}.mp4`, 1);
      })
    );
  }

  if (prevStep && frameCurrent < T) _.values(prevVideos).forEach(video => capture(video, 0, true));
  _.values(nextVideos).forEach(video => capture(video, 0,  prevStep && frameCurrent < T))

  /* draw */
  nextStep.forEach((row, j) =>
    row.forEach((cell, i) => {
      const prevCell = prevStep && prevStep[j][i],
        nextFrame = nextVideos[cell].buffer[0],
        prevFrame = prevStep && prevVideos[prevCell].buffer[0],
        roi = rois[j][i];

      drawRoi(roi, Tfrac, nextFrame, prevFrame);
    })
  );

  cv.imshow("lautmat", canvas);
  cv.waitKey(1);

  let nt = new Date().getTime(),
    diff = nt - t;

  setTimeout(() => render(frame + 1), 0);
}
render(0);
