// src/components/WebcamComponent.js
import React, { useRef, useState, useEffect } from 'react';
import * as handpose from '@tensorflow-models/handpose';
import './WebcamComponent.scss';
// eslint-disable-next-line no-unused-vars
import * as tf from '@tensorflow/tfjs';
import germImage from '../assets/Germ.png';
import germImage1 from '../assets/Germ1.png';
import germImage2 from '../assets/Germ2.png';
import germImage3 from '../assets/Germ3.png';



const WebcamComponent = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const isDetectionRunning = useRef(true);

  const germImages = [germImage1, germImage2, germImage3];  // ... add all germ images


  const [isFrozen, setIsFrozen] = useState(false);
  const [model, setModel] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [germCount, setGermCount] = useState(1);
  const [predictions, setPredictions] = useState([]);
  const [germLandmarkIndices, setGermLandmarkIndices] = useState([]);
  const [germImageIndex, setGermImageIndex] = useState(0);
  const [facingMode, setFacingMode] = useState('user'); // 'user' for front, 'environment' for back




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
        img.src = germImages[germImageIndex];
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
      const constraints = {
        video: {
          facingMode: facingMode,
          torch: facingMode === 'environment' // Only activate torch for back camera
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
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

  const toggleCamera = async () => {
    // Toggle between 'user' and 'environment'
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);

    // Stop all tracks of the current stream
    if (videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }

    // Restart the webcam with the new facing mode
    startWebcam();
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

  useEffect(() => {
    const newIndex = Math.floor(Math.random() * germImages.length);
    setGermImageIndex(newIndex);
  }, [germCount]);


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
            <div className="slider">
              {/* Number of Germs: {germCount} */}
              <input
                type="range"
                min="0"
                max="21"
                value={germCount}
                onChange={(e) => setGermCount(Number(e.target.value))}
              />
            </div>
          )}
          {isFrozen ? (
            <button onClick={toggleFreeze}>Retry</button>
          ) : (
            <>
            <div className='backdrop'></div>
              <button className="freeze-button" onClick={toggleFreeze}>
              </button>

              <button id="toggleCameraBtn" onclick={toggleCamera}>
                {/* Toggle to {facingMode === 'user' ? 'Back Camera' : 'Front Camera'} */}

                <div class="cameraIcon"></div>
              </button>

            </>
          )}

        </>
      )}
    </div>
  );
};

export default WebcamComponent;
