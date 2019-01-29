const cv = require("./");
const grid = require("./grid");
const fs = require("fs");
const display = require("./display");
const _ = require("lodash");
cv.namedWindow("rendertest");

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
//media/seq1828505.660673585.json
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
  cs = 100,
  outRatio = 1; //1.6,
(s = cs * (maskVsize / maskSize)),
  (maskScale = cs / maskSize),
  (ins = 200), //input size
  (rate = 15),
  (period = Math.floor(20.57 * rate)),
  (T = 4 * rate),
  (len = period + T),
  (F = 2 * rate);

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
  cv.blur(dest, dest, cs / 7);
}

let prevVideos = {},
  nextVideos = {},
  futureVideos = {},
  fvKeys = []

function showImage(canvas){
  cv.imshow("6", canvas);
  cv.waitKey(1);
}

function copyTo(a, b){
  a.copyTo(b)
}

function initCapture(cell){
  const video = {
    capture: new cv.VideoCapture(`${rootDir}/${cell}.mp4`),
    capFrame: new cv.Mat(ins, ins, 16),
    sizedFrame: new cv.Mat(s, s, 16),
    firstFrame: new cv.Mat(s, s, 16),
    mask: new cv.Mat(s, s, 16),
    masked: new cv.Mat(s, s, 16)
  }
  return video;
}

function render(frame){  
  let t = new Date().getTime()
  const frameCurrent = frame % period,
    stepIndex = Math.floor(frame / period),
    nextStep = seq[stepIndex],
    prevStep = seq[stepIndex - 1],
    futureStep = seq[stepIndex+1];

  if (frameCurrent === 0) {
    _.values(prevVideos).forEach(video => video.capture.release());
    prevVideos = nextVideos;

    nextVideos = {};
    nextStep.forEach(row =>
      row.forEach(cell => {
        if (!nextVideos[cell]) {
          nextVideos[cell] = futureVideos[cell] || initCapture(cell);
        }
      })
    );
    futureVideos = {}
    fvKeys = []
    futureStep.forEach(row =>
      row.forEach(cell => {
        if(futureVideos[cell] === undefined){
          futureVideos[cell] = 0
          fvKeys.push(cell)
        }
      })
    );
    
  }

  if(frameCurrent > T){
    const fvIndex = Math.floor(((frameCurrent-T)/(period-T)) * fvKeys.length),
    cell = fvKeys[fvIndex]
    if(!futureVideos[cell]){
      futureVideos[cell] = initCapture(cell)
    }
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
  nextStep.forEach((row, j) =>
    row.forEach((cell, i) => {
      if (prevStep && frameCurrent < T) {
        const prevCell = prevStep[j][i],
          Tfrac = frameCurrent / T,
          nextVid = nextVideos[cell],
          prevVid = prevVideos[prevCell];

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
        if (frameCurrent < F) {
          const Ffrac = frameCurrent / F;
          cv.addWeighted(
            rois[j][i].bg,
            Ffrac,
            prevVid.sizedFrame,
            1 - Ffrac,
            0,
            rois[j][i].bg
          );
        }

        if (frameCurrent > T - F) {
          const Ffrac = Math.max((T - frameCurrent) / F, 0);
          cv.addWeighted(
            rois[j][i].bg,
            Ffrac,
            nextVid.sizedFrame,
            1 - Ffrac,
            0,
            rois[j][i].bg
          );
        }

        /* get composite of bg and fg */
        cv.multiply(rois[j][i].bg, rois[j][i].mask, rois[j][i].bg, 1 / 255);
        cv.add(nextVid.masked, prevVid.masked, rois[j][i].fg);
        cv.add(rois[j][i].fg, rois[j][i].bg, rois[j][i].bg);
        
        /* find overlapping areas */
        cv.addWeighted(nextVid.mask, 0.5, prevVid.mask, 0.5, -128, rois[j][i].overlapMask)
        cv.mulConstant(rois[j][i].overlapMask, 2, rois[j][i].overlapMask);
        cv.invert( rois[j][i].overlapMask,  rois[j][i].invOverlapMask)

        /* compute cossfade of prevand next and mask it to overlapped areas */
        cv.addWeighted(nextVid.masked, Tfrac, prevVid.masked, 1-Tfrac, 0, rois[j][i].fg);
        cv.multiply(rois[j][i].fg, rois[j][i].overlapMask, rois[j][i].fg, 1 / 255);
        
        /* remove overlapped areas from bg and replace them with crossfaded */
        cv.multiply(rois[j][i].bg, rois[j][i].invOverlapMask, rois[j][i].bg, 1 / 255);
        cv.add(rois[j][i].fg, rois[j][i].bg, rois[j][i].bg);

      } else copyTo(nextVideos[cell].sizedFrame, rois[j][i].bg);
    })
  );

  showImage(canvas)

  let nt = new Date().getTime(),
  diff = nt-t
  //if(t) console.log(diff)

  setTimeout(() => render(frame+1), 0)
}
render(0)

