const cv = require("./");
const fs = require("fs");
const _ = require("lodash");
const createRenderer = require("./render");
const grid = require("./grid");
const async = require("async");
const { spawn } = require("child_process");

const Speaker = require("speaker");
const st = require("streamifier");

const samples = "top stay right left bottom back 123",
  sbuffs = samples.split(" ").reduce((memo, name) => {
    const path = "media/" + name + ".wav",
      { size } = fs.statSync(path),
      fd = fs.openSync(path),
      buffer = Buffer.alloc(size - 100);
    fs.readSync(fd, buffer, 0, size - 100, 100);
    fs.closeSync(fd)
    return { ...memo,[name]: buffer};
  }, {});

const empty = Buffer.alloc(60000).fill(0);

const speaker = new Speaker({
  channels: 2,
  bitDepth: 16,
  sampleRate: 44100,
  highWaterMark: 0
});
let strm = null;

function play(file, cb = () => {}) {
  strm && strm.removeAllListeners("data");
  strm = st.createReadStream(sbuffs[file]);
  strm.on("data", d => speaker.write(d));
  speaker.once("drain", () => {
    speaker.write(empty);
    cb();
  });
}

const warnOffset = 7.03 * 1000;
function playWarning(cb = () => {}) {
  play("123", cb);
}

function speak(text, cb = () => {}) {
  async.eachSeries(text.split(" "), play, cb);
}

const rseq = JSON.parse(fs.readFileSync("media/seq61081479.75687055.json")).slice(0),
  framerate = 30,
  period = Math.floor(15 * framerate), //20.57
  pauseDelay = 10000,
  transLen = 4 * framerate,
  videoLen = period + transLen,
  config = {
    cellSize: Math.ceil(1080 / 7),
    outRatio: 1,
    inputSize: [1260, 720],
    fadeRatio: 0.1,
    mask: cv.imread("media/mask-desat-w.jpg"),
    maskSize: 1390,
    maskVx: 62,
    maskVy: 71,
    maskVsize: 890
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
  } = createRenderer(rseq, config),
  camera = initCapture(0),
  buff = frameBuffer(1),
  toBeUsed = seq.reduce((memo, step) => {
    return { ...memo, ...step[1] };
  }, {}),
  videoBuffers = _.mapValues(toBeUsed, () => frameBuffer(videoLen)),
  warnFrame = Math.floor(period - (warnOffset / 1000) * framerate);
_.times(10, () => capture(camera, buff[0], buff[0].frame));
videoBuffers["0000-0000"] = frameBuffer(videoLen).map(f => buff[0]); //fill 1st frame

//const writer = new cv.VideoWriter("liveout.mpeg", width, height);
const pipename = "/tmp/myfifo";
const ls = spawn(
  "ffplay",
  [
    "-f",
    "rawvideo",
    "-an",
    "-pixel_format",
    "bgr24",
    `-video_size`,
    `${width}x${height}`,
    "-infbuf",
    "-sync",
    "ext",
    "-framerate",
    framerate * 2,
    `-i`,
    `${pipename}`
  ],
  { stdio: "ignore" }
);

const pipe = new cv.PipeWriter(pipename);

let ft = new Date().getTime();
function render(frame) {
  let t = new Date().getTime();
  //console.log(t - ft);
  ft = t;

  const frameCurrent = frame % videoLen,
    stepIndex = Math.floor(frame / videoLen),
    nextStep = seq[stepIndex][0],
    prevStep = seq[stepIndex - 1] && seq[stepIndex - 1][0],
    thisUsed = _.keys(seq[stepIndex][1]),
    nextUsed = seq[stepIndex + 1] ? _.keys(seq[stepIndex + 1][1]) : [],
    lastUsed = prevStep ? _.keys(seq[stepIndex - 1][1]) : [],
    liveCell = _.difference(thisUsed, lastUsed)[0],
    nextLive = _.difference(nextUsed, thisUsed)[0],
    Tfrac = prevStep && frameCurrent < transLen ? frameCurrent / transLen : -1;

  if (frameCurrent === warnFrame) playWarning();
  if (frameCurrent === transLen)
    speak(
      liveCell ? grid.cell2text(grid.string2cell(liveCell))[1].join(" ") : "stay stay"
    );

  if (liveCell)
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
    // writer.write(canvas);
  }

  pipe.write(canvas);
  // cv.imshow("lautmat", canvas);
  // cv.waitKey(1);

  let nt = new Date().getTime(),
    diff = nt - t;

  const isLastFrame = frameCurrent + 1 === videoLen,
    desiredDelay = isLastFrame ? pauseDelay : (1 / framerate) * 1000;
  if (isLastFrame) {
    setTimeout(playWarning, desiredDelay - warnOffset);
    speak(grid.cell2text(grid.string2cell(nextLive))[0].join(" "));
  }
  setTimeout(() => render(frame + 1), desiredDelay - diff);
}
render(0);

//cat cam_settings.json | uvcc --vendor 0x5a3 --product 0x9310 import
// REMEMBER: npm install speaker --mpg123-backend=openal
