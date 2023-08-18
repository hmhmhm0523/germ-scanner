// src/components/WebcamComponent.js

import React, { useRef, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import './WebcamComponent.scss';
import germImage from '../assets/Germ.png'; // Adjust the relative path to where your Germ.png is located within the src directory



const WebcamComponent = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const isDetectionRunning = useRef(true);

  const [isFrozen, setIsFrozen] = useState(false);
  const [model, setModel] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [germCount, setGermCount] = useState(1);
  const [predictions, setPredictions] = useState([]);


  const originalWidth = 640;
  const originalHeight = 480;

  const [germLandmarkIndices, setGermLandmarkIndices] = useState([]);

  useEffect(() => {
    if (predictions && predictions.length > 0) {
      updateGermLandmarks(predictions[0].landmarks.length);
    }
  }, [germCount, predictions]);

  const updateGermLandmarks = (landmarkCount) => {
    const indices = Array.from({ length: landmarkCount }, (_, i) => i);
    shuffleArray(indices);
    setGermLandmarkIndices(indices.slice(0, germCount));
  };

  function shuffleArray(array) {
    let curId = array.length;
    while (0 !== curId) {
      let randId = Math.floor(Math.random() * curId);
      curId -= 1;
      [array[curId], array[randId]] = [array[randId], array[curId]];
    }
  }

  // useEffect(() => {
  //   if (predictions && predictions.length > 0) {
  //     updateGermLandmarks(predictions[0].landmarks.length);
  //   }
  // }, [germCount]);

  // useEffect(() => {
  //   // Load the Handpose model
  //   handpose.load().then(model => {
  //     setModel(model);
  //   });
  // }, []);

  // useEffect(() => {
  //   if (!showWelcome && model) {
  //     detectHands();
  //   }
  // }, [germCount, model, showWelcome]);



  const startWebcam = async () => {
    setShowWelcome(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;

      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(async () => {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
          detectHands();
        }).catch(error => {
          console.error("Auto-play was prevented:", error);
        });
      }

    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  };


  const checkVideoReady = () => {
    if (videoRef.current.readyState < 3) {
      console.log("Video is not ready");
      setTimeout(checkVideoReady, 500);
    } else {
      detectHands();
    }
  };

  const detectHands = async () => {
    if (!videoRef.current) return;

    if (videoRef.current.readyState < 3) {
      console.log("Video is not ready");
      return;
    }

    if (videoRef.current.videoWidth <= 0 || videoRef.current.videoHeight <= 0) {
      console.log("Video dimensions are not valid");
      return;
    }

    try {
      const predictions = await model.estimateHands(videoRef.current);
      drawHands(predictions, germCount);
      setPredictions(predictions);
      if (isDetectionRunning.current) {
        requestAnimationFrame(detectHands);
      }
    } catch (error) {
      console.error("An error occurred:", error.message);
    }
  };




  useEffect(() => {
    // Load the Handpose model
    handpose.load().then(model => {
      setModel(model);
    });
  }, []);

  useEffect(() => {
    if (!showWelcome && model) {
      detectHands();
    }
  }, [germCount, model, showWelcome]);



  const drawHands = (predictions, germCount) => {
    const canvas = canvasRef.current;

    const handImages = document.querySelectorAll('.germImage');
    handImages.forEach(img => img.remove());

    const container = document.querySelector('.video-container');
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const ScaleFactor = containerWidth / containerHeight > canvas.width / canvas.height ? containerWidth / canvas.width : containerHeight / canvas.height;

    predictions.forEach(prediction => {
      germLandmarkIndices.forEach(index => {
        const point = prediction.landmarks[index];

        const img = document.createElement('img');
        img.src = germImage; // Path to your PNG image in the public folder
        img.style.position = 'absolute';
        img.style.left = `${(point[0] - canvas.width / 2) * ScaleFactor + (containerWidth / 2)}px`;
        img.style.top = `${(point[1] - canvas.height / 2) * ScaleFactor + (containerHeight / 2)}px`;
        img.style.transform = 'translate(-50%, -50%)'; // Center the image on the point
        img.style.zIndex = '10'; // Ensure it's above the video and canvas
        img.className = 'germImage'; // For easy selection and removal
        container.appendChild(img);
      });
    });
  };

  const toggleFreeze = () => {
    if (!isFrozen) {
      videoRef.current.pause();
      isDetectionRunning.current = false; // Stop detection
    } else {
      videoRef.current.play();
      isDetectionRunning.current = true;  // Restart detection
      detectHands();
    }
    setIsFrozen(!isFrozen);
  };


  return (
    <div className="video-container">
      {showWelcome ? (
        <div className="welcome-screen">
          <h1>Germs Scanner</h1>
          <button onClick={startWebcam}>Start Webcam</button>

        </div>
      ) : (
        <>
          <video ref={videoRef} width={originalWidth} height={originalHeight}></video>
          <canvas ref={canvasRef} width={originalWidth} height={originalHeight}></canvas>

          {!isFrozen && <div className="laser-scanner"></div>}

          {isFrozen ? (
            <div className="toast">Found {germCount} germs!</div>
          ) : (
            <label>
              Number of Germs: {germCount}
              <input
                type="range"
                min="0"
                max={predictions[0]?.landmarks.length - 1 || 4}

                value={germCount}
                onChange={(e) => setGermCount(Number(e.target.value))}
              />
            </label>
          )}


          {isFrozen ? (
            <button onClick={toggleFreeze}>Retry</button>
          ) : (
            <button className="freeze-button" onClick={toggleFreeze}>
              Freeze
            </button>
          )}

        </>
      )}
    </div>
  );

};

export default WebcamComponent;
