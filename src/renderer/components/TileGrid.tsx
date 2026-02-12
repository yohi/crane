import React, { useState, useEffect } from 'react';
import Tile from './Tile';

interface TileData {
  id: string;
  url: string;
}

const TileGrid: React.FC = () => {
  const [tiles, setTiles] = useState<TileData[]>([]);

  const addTile = async (url: string = 'https://google.com') => {
    if (tiles.length >= 9) return;
    try {
      const id = await window.electronAPI.createTile(url);
      setTiles(prev => [...prev, { id, url }]);
    } catch (e) {
      console.error("Failed to create tile:", e);
    }
  };

  const removeTile = (id: string) => {
    setTiles(prev => prev.filter(t => t.id !== id));
    // The Tile component's cleanup effect will call closeTile(id)
    // But if we remove it from state, the component unmounts.
    // So cleanup happens.
  };

  const generateBulk = async () => {
    const currentCount = tiles.length;
    const toAdd = 9 - currentCount;
    if (toAdd <= 0) return;

    for (let i = 0; i < toAdd; i++) {
      await addTile('https://google.com');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+1..9
      if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (tiles[index]) {
          // Focus the tile (BrowserView)
          window.electronAPI.action(tiles[index].id, 'focus');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tiles]);

  // Grid classes based on tile count
  const getGridClass = (count: number) => {
    if (count <= 1) return 'grid-cols-1 grid-rows-1';
    if (count <= 2) return 'grid-cols-2 grid-rows-1';
    if (count <= 4) return 'grid-cols-2 grid-rows-2';
    if (count <= 6) return 'grid-cols-3 grid-rows-2';
    return 'grid-cols-3 grid-rows-3';
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 text-white">
      {/* Top Bar */}
      <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 space-x-4">
        <h1 className="text-xl font-bold">MSTB</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => addTile()}
            className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={tiles.length >= 9}
          >
            Add Tile
          </button>
          <button
            onClick={generateBulk}
            className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={tiles.length >= 9}
          >
            Fill Grid (9)
          </button>
        </div>
        <div className="text-xs text-gray-400">
          {tiles.length} / 9 Sessions Active
        </div>
      </div>

      {/* Grid */}
      <div className={`flex-1 grid ${getGridClass(tiles.length)} gap-1 p-1 overflow-hidden`}>
        {tiles.map(tile => (
          <div key={tile.id} className="relative w-full h-full min-h-0 min-w-0">
             <Tile
               id={tile.id}
               initialUrl={tile.url}
               onClose={() => removeTile(tile.id)}
             />
          </div>
        ))}
        {tiles.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            No active sessions. Click "Add Tile" to start.
          </div>
        )}
      </div>
    </div>
  );
};

export default TileGrid;
