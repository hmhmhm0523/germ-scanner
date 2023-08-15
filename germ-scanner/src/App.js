// src/App.js

import React, { useRef } from "react";
import Camera from "./components/Camera";
import HandMaskCanvas from "./components/HandMaskCanvas";
import detectHand from "./HandDetection";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const processFrame = (videoElement, canvasElement) => {
    detectHand(videoElement, canvasElement);
    requestAnimationFrame(() => processFrame(videoElement, canvasElement));
  };

  return (
    <div>
      <Camera onLoaded={() => processFrame(videoRef.current, canvasRef.current)} ref={videoRef} />
      <HandMaskCanvas videoRef={videoRef} processFrame={processFrame} />
    </div>
  );
}

export default App;
