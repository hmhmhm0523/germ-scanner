// src/components/WebcamComponent.js
import React, { useRef, useState, useEffect } from 'react';
import * as handpose from '@tensorflow-models/handpose';
import './WebcamComponent.scss';
// eslint-disable-next-line no-unused-vars
import * as tf from '@tensorflow/tfjs';
import germImage from '../assets/Germ.png';

const WebcamComponent = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const isDetectionRunning = useRef(true);

  const [isFrozen, setIsFrozen] = useState(false);
  const [model, setModel] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [germCount, setGermCount] = useState(1);
  const [predictions, setPredictions] = useState([]);
  const [germLandmarkIndices, setGermLandmarkIndices] = useState([]);


  const updateGermLandmarks = (landmarkCount) => {
    if (germLandmarkIndices.length !== germCount) {
      const indices = Array.from({ length: landmarkCount }, (_, i) => i);
      shuffleArray(indices);
      setGermLandmarkIndices(indices.slice(0, germCount));
    }
  };


  const drawHands = () => {
    const container = document.querySelector('.video-container');
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const ScaleFactor = containerWidth / containerHeight > 640 / 480 ? containerWidth / 640 : containerHeight / 480;

    document.querySelectorAll('.germImage').forEach(img => img.remove());

    predictions.forEach(prediction => {
      germLandmarkIndices.forEach(index => {
        const point = prediction.landmarks[index];
        const img = document.createElement('img');
        img.src = germImage;
        img.style.position = 'absolute';
        img.style.left = `${(point[0] - 640 / 2) * ScaleFactor + (containerWidth / 2)}px`;
        img.style.top = `${(point[1] - 480 / 2) * ScaleFactor + (containerHeight / 2)}px`;
        img.style.transform = 'translate(-50%, -50%)';
        img.className = 'germImage';
        container.appendChild(img);
      });
    });
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  const startWebcam = async () => {
    setShowWelcome(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play().then(() => detectHands());
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  };

  const detectHands = async () => {
    if (!videoRef.current) return;
    try {
      const predictions = await model.estimateHands(videoRef.current);
      setPredictions(predictions);
      if (isDetectionRunning.current) requestAnimationFrame(detectHands);
    } catch (error) {
      console.error("An error occurred:", error.message);
    }
  };

  const toggleFreeze = () => {
    if (!isFrozen) {
      videoRef.current.pause();
      isDetectionRunning.current = false;
    } else {
      videoRef.current.play();
      isDetectionRunning.current = true;
      detectHands();
    }
    setIsFrozen(!isFrozen);
  };

  useEffect(() => {
    handpose.load().then(model => setModel(model));
  }, []);

  useEffect(() => {
    if (!showWelcome && model) detectHands();
  }, [showWelcome, model]);

  useEffect(() => {
    if (predictions && predictions.length > 0) {
      updateGermLandmarks(predictions[0].landmarks.length);
      drawHands();
    }
  }, [germCount, predictions]);

  return (
    <div className="video-container">
      {showWelcome ? (
        <div className="welcome-screen">
          <h1>Germs Scanner</h1>
          <button onClick={startWebcam}>Start Webcam</button>
        </div>
      ) : (
        <>
          <video ref={videoRef} width="640" height="480"></video>
          <canvas ref={canvasRef} width="640" height="480"></canvas>
          {!isFrozen && <div className="laser-scanner"></div>}
          {isFrozen ? (
            <div className="toast">Found {germCount} germs!</div>
          ) : (
            <label>
              Number of Germs: {germCount}
              <input
                type="range"
                min="0"
                max="21"
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
