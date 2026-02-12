import React from 'react';
import TileGrid from './components/TileGrid';

const App: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-gray-900 text-white overflow-hidden">
      <TileGrid />
    </div>
  );
};

export default App;
