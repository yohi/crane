import React, { useEffect, useRef, useState } from 'react';

interface TileProps {
  id: string;
  initialUrl?: string;
  onClose: (id: string) => void;
  // We might want to notify when the user navigates, to update the tab title/url
  // but for now let's keep it simple.
}

const Tile: React.FC<TileProps> = ({ id, initialUrl, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState(initialUrl || '');

  useEffect(() => {
    // Navigate to initial URL if provided.
    // Note: If we remount an existing tile (e.g. switch back to grid),
    // we don't necessarily want to navigate again if it's already there.
    // But the view is persistent in main. Calling navigate again might reload.
    // We should probably check if it's a *new* tile.
    // However, for now, let's assume the main process handles "navigate to same url" gracefully
    // or we can rely on the fact that 'initialUrl' is passed only on creation?
    // No, it's passed from state.

    // Better approach: The main process knows the state of the view.
    // If we just want to ensure it exists and has bounds, we focus on bounds.
    // Navigation should ideally happen only once.
    // Let's rely on the creation step in App.tsx to navigate.
    // But `Tile` was doing it.

    // If we leave it here, every time we switch views and remount `Tile`, it might reload.
    // Let's remove navigation from here and let the creator handle initial navigation.
    // OR, we keep it but ensure Main doesn't reload if same URL?
    // Let's keep it for now but be aware.
    if (initialUrl) {
       // We can't easily check if it's already loaded here without IPC query.
       // Let's move navigation responsibility to the `addTile` function in App.
    }

    const updateBounds = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          window.electronAPI.updateBounds(id, {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
    };

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
         updateBounds();
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
      // Initial bounds update
      updateBounds();
    }

    // Also listen to window resize
    window.addEventListener('resize', updateBounds);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateBounds);
      // Hide the view when component unmounts (e.g. switching tabs)
      // but do not destroy it (unless onClose is called by parent).
      window.electronAPI.hideTile(id);
    };
  }, [id]); // Removed initialUrl dependency to avoid re-navigating if prop changes slightly

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    window.electronAPI.navigate(id, url);
  };

  const handleAction = (action: 'back' | 'reload') => {
    window.electronAPI.action(id, action);
  };

  return (
    <div className="flex flex-col h-full w-full border border-gray-700 bg-gray-800 overflow-hidden relative">
      {/* Toolbar */}
      <div className="h-10 bg-gray-900 flex items-center px-2 space-x-2 shrink-0 z-10">
        <button onClick={() => handleAction('back')} className="text-gray-400 hover:text-white px-2">
          &larr;
        </button>
        <button onClick={() => handleAction('reload')} className="text-gray-400 hover:text-white px-2">
          &#x21bb;
        </button>
        <form onSubmit={handleNavigate} className="flex-1">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter URL..."
          />
        </form>
        <button onClick={() => onClose(id)} className="text-red-400 hover:text-red-200 px-2 font-bold">
          &times;
        </button>
      </div>

      {/* BrowserView Placeholder */}
      <div
        ref={containerRef}
        className="flex-1 w-full bg-white/5 relative"
      >
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
          {/* This is just a placeholder. The actual view is an overlay. */}
        </div>
      </div>
    </div>
  );
};

export default Tile;
