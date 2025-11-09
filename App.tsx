import React, { useState } from 'react';
import SpectacleSuggester from './components/SpectacleSuggester';

type View = 'home' | 'suggester';

const HomeView: React.FC<{ setView: (view: View) => void }> = ({ setView }) => {
  return (
    <div className="text-center">
      <h1 className="text-4xl md:text-6xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-blue-500">
        AI Vision Stylist
      </h1>
      <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
        Your personal AI assistant for style recommendations. Click below to get started.
      </p>
      <div className="flex justify-center max-w-4xl mx-auto">
        <div
          onClick={() => setView('suggester')}
          className="bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-blue-500/20 hover:scale-105 transform transition-all duration-300 cursor-pointer border border-gray-700 hover:border-blue-400 max-w-md"
        >
          <h2 className="text-2xl font-bold text-blue-300 mb-4">Spectacle Suggester</h2>
          <p className="text-gray-400">
            Find the perfect frames for your face. Use your camera to get personalized spectacle style recommendations from AI.
          </p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');

  const renderView = () => {
    switch (view) {
      case 'suggester':
        return <SpectacleSuggester onBack={() => setView('home')} />;
      case 'home':
      default:
        return <HomeView setView={setView} />;
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-gray-900">
      {renderView()}
    </main>
  );
};

export default App;