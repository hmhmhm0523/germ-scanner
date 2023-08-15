// src/components/HandMaskCanvas.js

import React, { useRef, useEffect } from "react";

const HandMaskCanvas = ({ videoRef, processFrame }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (videoRef && videoRef.current && processFrame) {
      requestAnimationFrame(() => processFrame(videoRef.current, canvasRef.current));
    }
  }, [videoRef, processFrame]);

  return <canvas ref={canvasRef} width="640" height="480"></canvas>;
};

export default HandMaskCanvas;
