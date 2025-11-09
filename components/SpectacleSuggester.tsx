import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ImageData } from '../types';
import { getSpectacleSuggestions, addSpectaclesToImage, SpectacleSuggestion } from '../services/geminiService';
import Loader from './Loader';

interface SpectacleSuggesterProps {
  onBack: () => void;
}

interface SuggestionWithImage extends SpectacleSuggestion {
    image?: ImageData;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};


const SpectacleSuggester: React.FC<SpectacleSuggesterProps> = ({ onBack }) => {
  const [faceImage, setFaceImage] = useState<ImageData | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionWithImage[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setCameraActive(true);
      setIsCameraReady(false);
      setError(null);
      setFaceImage(null);
      setSuggestions(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera or playing video:", err);
      let errorMessage = "Could not access camera. Please ensure permissions are granted.";
      if (err instanceof Error && err.name === "NotAllowedError") {
          errorMessage = "Camera access was denied. Please grant permission in your browser settings.";
      } else if (err instanceof Error && err.name === "NotFoundError") {
          errorMessage = "No camera was found on your device.";
      } else if (err instanceof Error) {
          errorMessage = `An error occurred: ${err.message}`;
      }
      setError(errorMessage);
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setIsCameraReady(false);
  }, []);
  
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const captureFace = () => {
    if (!videoRef.current || videoRef.current.videoWidth === 0) {
      setError("Camera is not ready yet. Please wait a moment and try again.");
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      const base64 = dataUrl.split(',')[1];
      if (base64) {
        setFaceImage({ base64, mimeType: 'image/jpeg' });
        stopCamera();
      } else {
        setError('Failed to capture a valid image. Please try again.');
      }
    } else {
      setError('Could not prepare image for capture.');
    }
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCamera();
      setSuggestions(null);
      setError(null);
      try {
        const base64 = await fileToBase64(file);
        setFaceImage({ base64, mimeType: file.type });
      } catch (err) {
        setError("Failed to read the uploaded image.");
        setFaceImage(null);
      }
    }
  };

  const handleGetSuggestions = async () => {
    if (!faceImage) {
      setError('Please capture or upload an image of your face first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const textSuggestions = await getSpectacleSuggestions(faceImage);
      setSuggestions(textSuggestions);

      textSuggestions.forEach(async (suggestion, index) => {
        try {
          const image = await addSpectaclesToImage(faceImage, suggestion.styleName, suggestion.color);
          setSuggestions(prevSuggestions => {
            if (!prevSuggestions) return null;
            const newSuggestions = [...prevSuggestions];
            newSuggestions[index] = { ...newSuggestions[index], image };
            return newSuggestions;
          });
        } catch (imageError) {
          console.error(`Failed to load image for ${suggestion.styleName}`, imageError);
        }
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 relative">
       {isLoading && <Loader text="Analyzing your style..." />}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-teal-300">Spectacle Suggester</h1>
        <button
          onClick={onBack}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          &larr; Back
        </button>
      </div>

      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        {!suggestions && (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-md aspect-video bg-gray-900 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
              {cameraActive ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover" 
                  onLoadedMetadata={() => setIsCameraReady(true)}
                />
              ) : faceImage ? (
                <img src={`data:${faceImage.mimeType};base64,${faceImage.base64}`} alt="Your face" className="w-full h-full object-cover" />
              ) : (
                  <p className="text-gray-400">Upload or use camera to add your photo</p>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-4 mb-4">
                {!cameraActive && (
                  <>
                      <button onClick={startCamera} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-5 rounded-lg transition-colors">
                          {faceImage ? 'Retake with Camera' : 'Use Camera'}
                      </button>
                      <label htmlFor="faceUpload" className="cursor-pointer bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-5 rounded-lg transition-colors inline-flex items-center">
                          {faceImage ? 'Upload New' : 'Upload Photo'}
                      </label>
                      <input id="faceUpload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </>
                )}
                {cameraActive && (
                  <>
                  <button 
                      onClick={captureFace} 
                      disabled={!isCameraReady} 
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-5 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                  >
                      {isCameraReady ? 'Capture Face' : 'Preparing Camera...'}
                  </button>
                  <button onClick={stopCamera} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-5 rounded-lg transition-colors">
                      Stop Camera
                  </button>
                  </>
                )}
            </div>
            
            {faceImage && (
              <button
                  onClick={handleGetSuggestions}
                  disabled={isLoading}
                  className="w-full max-w-md bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-500"
              >
                Get Style Suggestions
              </button>
            )}
          </div>
        )}

        {error && <div className="mt-6 p-4 bg-red-900 border border-red-700 text-red-200 rounded-lg">{error}</div>}

        {suggestions && (
          <div className="w-full">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-teal-300">Your Style Recommendations</h2>
                <p className="text-gray-400">Here are 5 styles we think you'll love. Your original photo is on the left for comparison.</p>
                 <div className="flex justify-center items-center gap-4 mt-4">
                    <img src={`data:${faceImage?.mimeType};base64,${faceImage?.base64}`} alt="Your original face" className="w-24 h-24 object-cover rounded-full border-2 border-gray-500" />
                    <span className="text-2xl text-gray-500">&rarr;</span>
                 </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="bg-gray-700 rounded-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:bg-gray-600 shadow-lg flex flex-col">
                  <div className="w-full aspect-square bg-gray-800 flex items-center justify-center">
                    {suggestion.image ? (
                      <img 
                        src={`data:${suggestion.image.mimeType};base64,${suggestion.image.base64}`} 
                        alt={`Your face with ${suggestion.color} ${suggestion.styleName} spectacles`} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-gray-400"></div>
                    )}
                  </div>
                  <div className="p-4 flex-grow flex flex-col">
                    <h3 className="text-lg font-bold text-teal-300">{suggestion.styleName}</h3>
                    <p className="text-sm font-semibold text-gray-300">{suggestion.color}</p>
                    <p className="text-gray-300 mt-2 text-sm flex-grow">{suggestion.description}</p>
                    <p className="text-gray-400 mt-2 text-xs italic"><strong>Why it works:</strong> {suggestion.reason}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
                onClick={() => {
                    setSuggestions(null);
                    setFaceImage(null);
                    setError(null);
                }}
                className="w-full mt-8 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpectacleSuggester;