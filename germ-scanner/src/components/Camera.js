// src/components/Camera.js

import React, { useRef, useEffect, forwardRef } from "react";

const Camera = forwardRef(({ onLoaded }, parentRef) => {
  const videoRef = useRef(null);

  // Use forwarded ref (if provided) or local ref
  const actualRef = parentRef || videoRef;

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("Browser API navigator.mediaDevices.getUserMedia not available");
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        actualRef.current.srcObject = stream;
        actualRef.current.onloadedmetadata = () => {
          actualRef.current.play();
          onLoaded && onLoaded();
        };
      })
      .catch(error => {
        console.error("Error accessing webcam:", error);
      });
  }, [onLoaded, actualRef]);

  return <video ref={actualRef} width="640" height="480" ></video>;
});

export default Camera;
