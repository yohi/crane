import React, { useState, useEffect } from 'react';
import TileGrid from './components/TileGrid';
import TabBar from './components/TabBar';
import Tile from './components/Tile';
import TabCreationModal from './components/TabCreationModal';

interface TileData {
  id: string;
  url: string;
}

const App: React.FC = () => {
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'tab' | 'grid'>('tab');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Listen for IPC message to open modal
    const unsubscribe = window.electronAPI.onShowTabCreationModal(() => {
      setIsModalOpen(true);
    });
    return unsubscribe;
  }, []);

  const handleCreateMultiple = async (count: number) => {
    // Limit total tabs to 9
    const available = 9 - tiles.length;
    if (available <= 0) {
      console.warn("Max tabs reached");
      return;
    }

    const countToCreate = Math.min(count, available);

    try {
      const newTabs = await window.electronAPI.createMultipleTabs(countToCreate, 'https://google.com');
      setTiles(prev => [...prev, ...newTabs]);
      if (newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
        setViewMode('tab');
      }
    } catch (e) {
      console.error("Failed to create multiple tabs:", e);
    }
  };

  const addTab = async (url: string = 'https://google.com') => {
    // Limit total tabs to 9. TileGrid supports up to 9 nicely, so we enforce this hard limit.
    if (tiles.length >= 9) {
        console.warn("Max tabs reached");
        return;
    }

    try {
      const id = await window.electronAPI.createTile(url);
      setTiles(prev => [...prev, { id, url }]);
      setActiveTabId(id);
      setViewMode('tab'); // Switch to tab view on new tab
    } catch (e) {
      console.error("Failed to create tab:", e);
    }
  };

  const closeTab = async (id: string) => {
    try {
      // Call IPC to destroy view
      await window.electronAPI.closeTile(id);

      setTiles(prev => {
        const newTiles = prev.filter(t => t.id !== id);
        // If we closed the active tab, switch to another
        if (id === activeTabId) {
          if (newTiles.length > 0) {
            setActiveTabId(newTiles[newTiles.length - 1].id);
          } else {
            setActiveTabId(null);
          }
        }
        return newTiles;
      });
    } catch (e) {
      console.error("Failed to close tab:", e);
    }
  };

  const handleTabSelect = (id: string) => {
    setActiveTabId(id);
    setViewMode('tab');
  };

  const toggleViewMode = () => {
    setViewMode(prev => (prev === 'tab' ? 'grid' : 'tab'));
  };

  // Listen for shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+T for new tab
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault(); // Prevent standard browser new tab
        addTab();
      }
      // Ctrl+W to close active tab
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        if (activeTabId) closeTab(activeTabId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, tiles]);

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Tab Bar (Always visible? Or only in Tab mode? Usually always visible like Chrome) */}
      {/* If in Grid mode, maybe we hide it or show it differently?
          User said "Tile display is for checking ... on one screen".
          Let's keep TabBar always visible for easy navigation.
      */}
      <TabBar
        tabs={tiles}
        activeTabId={activeTabId}
        onSelect={handleTabSelect}
        onClose={closeTab}
        onAddTab={() => addTab()}
        onToggleGrid={toggleViewMode}
        isGridMode={viewMode === 'grid'}
      />

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {viewMode === 'grid' ? (
          <TileGrid tiles={tiles} onClose={closeTab} />
        ) : (
          /* Tab View: Render only the active tab */
          activeTabId && (
            <div className="w-full h-full">
               {/* We need to find the url for the active tab */}
               {(() => {
                 const activeTile = tiles.find(t => t.id === activeTabId);
                 if (!activeTile) return <div className="p-4">Tab not found</div>;
                 return (
                   <Tile
                     key={activeTile.id} // Key ensures remount on switch? No, we want to persist if possible.
                     // But if we unmount Tile component, we lose the bounds sync.
                     // That's fine, as long as we remount it when switching back.
                     id={activeTile.id}
                     initialUrl={activeTile.url}
                     onClose={closeTab}
                   />
                 );
               })()}
            </div>
          )
        )}

        {tiles.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <p className="mb-4">No tabs open</p>
                <button
                    onClick={() => addTab()}
                    className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-500"
                >
                    Open New Tab
                </button>
            </div>
        )}
      </div>

      <TabCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateMultiple}
      />
    </div>
  );
};

export default App;
