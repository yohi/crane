import React from 'react';
import Tile from './Tile';

interface TileData {
  id: string;
  url: string;
}

interface TileGridProps {
  tiles: TileData[];
  onClose: (id: string) => void;
}

const TileGrid: React.FC<TileGridProps> = ({ tiles, onClose }) => {
  // Grid classes based on tile count
  const getGridClass = (count: number) => {
    if (count <= 1) return 'grid-cols-1 grid-rows-1';
    if (count <= 2) return 'grid-cols-2 grid-rows-1';
    if (count <= 4) return 'grid-cols-2 grid-rows-2';
    if (count <= 6) return 'grid-cols-3 grid-rows-2';
    return 'grid-cols-3 grid-rows-3';
  };

  return (
    <div className={`w-full h-full grid ${getGridClass(tiles.length)} gap-1 p-1 overflow-hidden bg-gray-900`}>
      {tiles.map(tile => (
        <div key={tile.id} className="relative w-full h-full min-h-0 min-w-0">
           <Tile
             id={tile.id}
             initialUrl={tile.url}
             onClose={onClose}
           />
        </div>
      ))}
      {tiles.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-500 w-full col-span-full">
          No active sessions. Add a tab to start.
        </div>
      )}
    </div>
  );
};

export default TileGrid;
