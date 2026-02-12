import React, { useEffect, useRef, useState } from 'react';

interface TileProps {
  id: string;
  initialUrl?: string;
  onClose: (id: string) => void;
}

const Tile: React.FC<TileProps> = ({ id, initialUrl, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState(initialUrl || '');

  useEffect(() => {
    // Navigate to initial URL if provided
    if (initialUrl) {
      window.electronAPI.navigate(id, initialUrl);
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { x, y, width, height } = entry.contentRect;
        // We need screen coordinates, but contentRect is relative to element?
        // Actually we need client rect relative to window.
        // Electron BrowserView setBounds is relative to the window content area.
        // So element.getBoundingClientRect() is what we want.

        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          // We also need to account for the toolbar height if the BrowserView should be below it.
          // Let's assume the Toolbar is part of the React component and the BrowserView
          // fills the rest of the space.
          // So we should have a container for the BrowserView specifically.

          // However, ResizeObserver observes the container size.
          // We can use the container's rect.

          window.electronAPI.updateBounds(id, {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      // Ensure we clean up the view when component unmounts
      window.electronAPI.closeTile(id);
    };
  }, [id, initialUrl]);

  // Handle periodic updates because scrolling or window resize might not trigger ResizeObserver on the element if it's fixed?
  // ResizeObserver handles size changes. Position changes (e.g. flow) might not trigger it if size is constant.
  // But in a grid, size usually changes with window resize.
  // We should also listen to window resize just in case.
  useEffect(() => {
    const handleResize = () => {
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
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [id]);

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
        // The browser view will be placed here by the main process.
        // We make it transparent-ish to debug layout.
      >
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
          Loading View...
        </div>
      </div>
    </div>
  );
};

export default Tile;
