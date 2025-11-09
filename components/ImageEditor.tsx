
import React, { useState } from 'react';
import type { ImageData } from '../types';
import { editImageWithPrompt } from '../services/geminiService';
import Loader from './Loader';

interface ImageEditorProps {
  onBack: () => void;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

const ImageEditor: React.FC<ImageEditorProps> = ({ onBack }) => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [editedImage, setEditedImage] = useState<ImageData | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditedImage(null);
      setError(null);
      const base64 = await fileToBase64(file);
      setOriginalImage({ base64, mimeType: file.type });
    }
  };

  const handleGenerate = async () => {
    if (!originalImage || !prompt) {
      setError('Please upload an image and enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImage(null);
    try {
      const result = await editImageWithPrompt(originalImage, prompt);
      setEditedImage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 relative">
      {isLoading && <Loader text="Applying your edits..." />}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-teal-300">Image Editor</h1>
        <button
          onClick={onBack}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          &larr; Back
        </button>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col items-center justify-center bg-gray-700 p-4 rounded-lg min-h-[300px]">
            {!originalImage ? (
              <div className="text-center">
                <label htmlFor="imageUpload" className="cursor-pointer bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                  Upload an Image
                </label>
                <input id="imageUpload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <p className="text-gray-400 mt-4">Select a photo to start editing.</p>
              </div>
            ) : (
                <div className="w-full">
                    <img src={`data:${originalImage.mimeType};base64,${originalImage.base64}`} alt="Original" className="max-w-full max-h-96 rounded-lg object-contain mx-auto" />
                     <label htmlFor="imageUpload" className="cursor-pointer mt-4 inline-block w-full text-center bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Change Image
                    </label>
                    <input id="imageUpload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>
            )}
          </div>
          
          <div className="flex flex-col space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your edits, e.g., 'Add a retro filter' or 'Make the sky look like a sunset'"
              className="w-full h-32 p-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none placeholder-gray-400 resize-none"
              disabled={!originalImage}
            />
            <button
              onClick={handleGenerate}
              disabled={!originalImage || !prompt || isLoading}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              Generate
            </button>
          </div>
        </div>
        
        {error && <div className="mt-6 p-4 bg-red-900 border border-red-700 text-red-200 rounded-lg">{error}</div>}
        
        {editedImage && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-center mb-4 text-teal-300">Result</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-center mb-2">Original</h3>
                    <img src={`data:${originalImage?.mimeType};base64,${originalImage?.base64}`} alt="Original" className="w-full rounded-lg shadow-md" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-center mb-2">Edited</h3>
                    <img src={`data:${editedImage.mimeType};base64,${editedImage.base64}`} alt="Edited" className="w-full rounded-lg shadow-md" />
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageEditor;
