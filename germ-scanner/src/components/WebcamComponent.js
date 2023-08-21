// src/components/WebcamComponent.js
import React, { useRef, useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import * as handpose from '@tensorflow-models/handpose';
import './WebcamComponent.scss';
// eslint-disable-next-line no-unused-vars
import * as tf from '@tensorflow/tfjs';
import germImage1 from '../assets/Germ1.svg';
import germImage2 from '../assets/Germ2.svg';
import germImage3 from '../assets/Germ3.svg';
import germImage4 from '../assets/Germ4.svg';




const WebcamComponent = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const isDetectionRunning = useRef(true);

  const germImages = [germImage1, germImage2, germImage3, germImage4];  // ... add all germ images


  const [isFrozen, setIsFrozen] = useState(false);
  const [model, setModel] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [germCount, setGermCount] = useState(11);
  const [predictions, setPredictions] = useState([]);
  const [germLandmarkIndices, setGermLandmarkIndices] = useState([]);
  const [germImageIndex, setGermImageIndex] = useState(0);
  const [facingMode, setFacingMode] = useState({ exact: 'environment' });





  const updateGermLandmarks = (landmarkCount) => {
    if (germLandmarkIndices.length !== germCount) {
      const indices = Array.from({ length: landmarkCount }, (_, i) => i);
      shuffleArray(indices);
      setGermLandmarkIndices(indices.slice(0, germCount));
    }
  };

  const incrementGermIndex = () => {
    setGermImageIndex((prevIndex) => (prevIndex + 1) % germImages.length);
  };


  const drawHands = () => {
    const container = document.querySelector('.video-container');
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const ScaleFactor = containerWidth / containerHeight > videoRef.current.width / videoRef.current.height ? containerWidth / videoRef.current.width : containerHeight / videoRef.current.height;

    document.querySelectorAll('.germImage').forEach(img => img.remove());

    predictions.forEach(prediction => {
      germLandmarkIndices.forEach(index => {
        const point = prediction.landmarks[index];
        const img = document.createElement('img');
        img.src = germImages[germImageIndex];
        img.style.position = 'absolute';
        img.style.left = `${(point[0] - videoRef.current.width / 2) * ScaleFactor + (containerWidth / 2)}px`;
        img.style.top = `${(point[1] - videoRef.current.height / 2) * ScaleFactor + (containerHeight / 2)}px`;
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
          facingMode: facingMode.exact
        }
      };


      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;

      // Set video and canvas dimensions once metadata is loaded
      videoRef.current.onloadedmetadata = (e) => {
        videoRef.current.width = e.target.videoWidth;
        videoRef.current.height = e.target.videoHeight;
        canvasRef.current.width = e.target.videoWidth;
        canvasRef.current.height = e.target.videoHeight;
      };

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
    const newFacingMode = facingMode.exact === 'environment' ? { exact: 'user' } : { exact: 'environment' };
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
    if (predictions && predictions.length > 0) {
      updateGermLandmarks(predictions[0].landmarks.length);
      drawHands();
    }
  }, [germCount, predictions]);


  return (
    <div className="video-container">
      {showWelcome ? (
        <div className="welcome-screen">
          <button onClick={startWebcam}>START NOW</button>
        </div>
      ) : (
        <>
          <video ref={videoRef} playsInline></video>
          <canvas ref={canvasRef} ></canvas>
          {!isFrozen && <div className="laser-scanner"></div>}
          {isFrozen ? (
            germCount === 0 ? (<div className="toast clean">✓ Your Hands are clean!</div>) : (<div className="toast dirty">⚠ Germs are detected!</div>)
          ) : (
            <div className="slider">
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
            <>
              <button onClick={toggleFreeze}>⟳ TRY IT AGAIN</button>
              {germCount === 0 && <Confetti />}
            </>
          ) : (
            <>
              <div className='backdrop'></div>

              <button
                className="germButton"
                style={{ backgroundImage: `url(${germImages[germImageIndex]})` }}
                onClick={incrementGermIndex}
              />


              <button className="freezeButton" onClick={toggleFreeze}>
              </button>

              <button id="toggleCameraBtn" onClick={toggleCamera}>

              </button>

            </>
          )}

        </>
      )}
    </div>
  );
};

export default WebcamComponent;
