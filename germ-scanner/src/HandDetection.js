// src/HandDetection.js

/* global cv */

let isCvReady = false;

const onOpenCvReady = () => {
  isCvReady = true;
};

// Make sure this is added somewhere in the initialization phase of your app
if (window.cv) {
  cv.onRuntimeInitialized = onOpenCvReady;
}

const detectHand = (videoElement, canvasElement) => {
  if (!isCvReady) {
    console.error("OpenCV is not initialized yet.");
    return;
  }

  const cap = new cv.VideoCapture(videoElement);
  const frame = new cv.Mat(videoElement.height, videoElement.width, cv.CV_8UC4);
  const hsv = new cv.Mat();
  const lowerRange = new cv.Mat(frame.rows, frame.cols, frame.type(), [0, 20, 70, 0]);
  const upperRange = new cv.Mat(frame.rows, frame.cols, frame.type(), [20, 255, 255, 255]);
  const mask = new cv.Mat();

  cap.read(frame);
  cv.cvtColor(frame, hsv, cv.COLOR_RGBA2RGB);
  cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
  cv.inRange(hsv, lowerRange, upperRange, mask);
  cv.imshow(canvasElement, mask);

  frame.delete();
  hsv.delete();
  mask.delete();
};

export default detectHand;
