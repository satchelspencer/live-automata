const cv = require('bindings')('opencv');
const fs = require("fs");
const _ = require("lodash");
const createRenderer = require("./render");
const grid = require("./grid");
const async = require("async");
const { spawn } = require("child_process");
const express = require("express");
const socketIo = require("socket.io");

/* webserver */
const server = express();
server.use(express.static("static"));

let playing = [],
  going = false,
  frame = 0,
  delays = [],
  currentRender = null;

const http = server.listen(1111),
  sockets = {},
  io = socketIo(http);

console.log("control server listening on http://localhost:1111");

io.on("connection", socket => {
  console.log("connect", socket.id);
  sockets[socket.id] = socket;

  socket.on("playdone", () => {
    playing.forEach(cb => cb());
    playing = [];
  });

  socket.on("playpause", () => {
    if (!going) {
      going = true;
      currentRender && currentRender();
    } else {
      going = false;
      delays = [];
    }
  });

  socket.on("disconnect", () => {
    delete sockets[socket.id];
    going = false;
    delays = [];
  });
});

function emit(name, value) {
  _.each(sockets, socket => socket.emit(name, value));
}

/* audio controls */
function play(file, cb) {
  emit("play", file);
  if (cb) playing.push(cb);
}

const warnOffset = 7.03 * 1000;
function playWarning(cb = () => {}) {
  play("123", cb);
}

function speak(text, cb = () => {}) {
  async.eachSeries(text.split(" "), play, cb);
}

/* renderer config */
const framerate = 15,
  period = Math.floor(16 * framerate),
  pauseDelay = 10000,
  transLen = 4 * framerate,
  videoLen = period + transLen,
  targetSize = 1085,
  cutoffIndex = 50;

config = {
  cellSize: Math.ceil(targetSize / 7),
  outRatio: 1,
  inputSize: [1260, 720],
  fadeRatio: 0.1,
  mask: new cv.Mat(),
  liveMask: new cv.Mat(),
  blackMask: new cv.Mat(),
  maskSize: 1390,
  maskVx: 62,
  maskVy: 71,
  maskVsize: 890
};

cv.imread("media/mask-desat-w.jpg", config.mask)
cv.imread("media/mask-desat-w-live.jpg", config.liveMask)
cv.imread("media/mask-desat-w-black.jpg", config.blackMask)

/* video out */
const pipename = "/tmp/myfifo";
const args = [
  "-f",
  "rawvideo",
  "-an",
  "-pixel_format",
  "bgr24",
  `-video_size`,
  `${targetSize}x${targetSize}`,
  "-infbuf",
  "-sync",
  "ext",
  "-framerate",
  framerate * 2,
  `-i`,
  `${pipename}`
];

spawn("ffplay", args, { stdio: "ignore" });

const pipe = new cv.PipeWriter(pipename);
const writer = new cv.VideoWriter("liveout.mpeg", targetSize, targetSize);

function renderSequence(rseq, callback) {
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
    toBeUsedKeys = _.keys(toBeUsed),
    videoBuffers = _.mapValues(toBeUsed, (_, cell) =>
      frameBuffer(videoLen, toBeUsedKeys.indexOf(cell))
    ),
    warnFrame = Math.floor(period - (warnOffset / 1000) * framerate);

  console.log("size:", width, height);

  _.times(10, () => capture(camera, buff[0], buff[0].frame));
  videoBuffers["0000-0000"] = frameBuffer(videoLen, "bg").map(f => buff[0]); //fill 1st frame

  let ft = new Date().getTime();
  function render() {
    if (frame === 1) {
      frame++;
      const first = _.keys(seq[0][1])[0];
      speak(grid.cell2text(grid.string2cell(first))[0].join(" "));
      setTimeout(() => {
        playWarning();
        setTimeout(() => {
          render();
        }, warnOffset - 1000);
      }, 3000);
      return;
    }

    let t = new Date().getTime();
    delays.push(t - ft);
    if (delays.length > framerate) delays.shift();
    if (frame % Math.floor(framerate / 5) === 0) {
      emit("delay", _.mean(delays));
      emit("frameNumber", frame);
    }
    ft = t;

    const frameCurrent = frame % videoLen,
      stepIndex = Math.floor(frame / videoLen), // + 48,
      isCutoff = stepIndex > cutoffIndex;

    if (!seq[stepIndex]) {
      emit("stopMusic");
      callback();
      going = false;
      frame = 0;
      return;
    }

    const nextStep = seq[stepIndex][0],
      prevStep = seq[stepIndex - 1] && seq[stepIndex - 1][0],
      prevPrevStep = seq[stepIndex - 2],
      thisUsed = _.keys(seq[stepIndex][1]),
      nextNextStep = seq[stepIndex + 1],
      nextUsed = nextNextStep ? _.keys(nextNextStep[1]) : [],
      lastUsed = prevStep ? _.keys(seq[stepIndex - 1][1]) : [],
      lastLastUsed = prevPrevStep ? _.keys(prevPrevStep[1]) : [],
      prevLive = _.difference(lastUsed, lastLastUsed)[0],
      liveCell = _.difference(thisUsed, lastUsed)[0],
      nextLive = _.difference(nextUsed, thisUsed)[0],
      Tfrac = prevStep && frameCurrent < transLen ? frameCurrent / transLen : -1;
    if (frameCurrent === 1) {
      emit("dancerState", "entering");
      emit("stepIndex", stepIndex);
    }
    if (frameCurrent === warnFrame && !isCutoff) playWarning();
    if (frameCurrent === transLen) {
      emit("dancerState", "in box");
      if (!isCutoff)
        speak(
          liveCell ? grid.cell2text(grid.string2cell(liveCell))[1].join(" ") : "stay stay"
        );
    }
    if (frameCurrent === period) emit("dancerState", "exiting");

    if (liveCell)
      capture(
        camera,
        videoBuffers[liveCell][frameCurrent],
        frameCurrent > period && videoBuffers[liveCell][0].frame
      );
    else if (prevLive && frameCurrent < transLen)
      capture(
        camera,
        videoBuffers[prevLive][frameCurrent + period],
        videoBuffers[prevLive][0].frame
      );

    /* draw */
    const fadeOut = !stepIndex
      ? 1 - frameCurrent / period
      : nextNextStep
      ? 0
      : frameCurrent / period;
    if (frameCurrent < period) {
      nextStep.forEach((row, j) =>
        row.forEach((cell, i) => {
          const prevCell = prevStep && prevStep[j][i],
            roi = rois[j][i],
            nextFrame = videoBuffers[cell][frameCurrent],
            prevFrame =
              prevCell &&
              videoBuffers[prevCell][Math.min(frameCurrent + period, videoLen)];
          drawRoi(roi, Tfrac, nextFrame, prevFrame, cell === liveCell, fadeOut);
        })
      );
      writer.write(canvas);
    }

    pipe.write(canvas);

    let nt = new Date().getTime(),
      diff = nt - t;
    const isLastFrame = frameCurrent + 1 === videoLen,
      desiredDelay = isLastFrame && nextLive ? pauseDelay : (1 / framerate) * 1000;

    //console.log(frameCurrent, isLastFrame, nextLive)

    if (isLastFrame && stepIndex === cutoffIndex - 1) emit("startMusic");

    if (isLastFrame && nextLive && stepIndex < cutoffIndex) {
      setTimeout(playWarning, desiredDelay - warnOffset);
      speak(
        nextLive ? grid.cell2text(grid.string2cell(nextLive))[0].join(" ") : "stay stay"
      );
      emit("dancerState", "outside");
    }
    if (!nextLive && frameCurrent + 1 === period) frame += transLen;
    else frame++;

    if (going) setTimeout(render, desiredDelay - diff - 2);
  }

  currentRender = render;
  frame = 0;
  delays = [];
  going = false;
  render();
}
//test copy 2
const sequences = [
  "media/88284009.json",
  "media/119.json",
  "media/88284009.json",
  "media/119.json",
  "media/88284009.json",
  "media/119.json"
].map(path => {
  return JSON.parse(fs.readFileSync(path));
});

async.eachSeries(sequences, renderSequence, () => {
  console.log("all done");
});

//cat cam_settings.json | uvcc --vendor 0x5a3 --product 0x9310 import
