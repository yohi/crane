import React, { useState, useEffect, useRef } from 'react';
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
  const [modalTargetUrl, setModalTargetUrl] = useState<string>('');
  const pendingCreationsRef = useRef(0);

  useEffect(() => {
    // Listen for IPC message to open modal
    const unsubscribe = window.electronAPI.onShowTabCreationModal((url) => {
      setModalTargetUrl(url);
      setIsModalOpen(true);
    });
    return unsubscribe;
  }, []);

  const handleCreateMultiple = async (count: number) => {
    // Limit total tabs to 9
    const parsed = Number(count);
    const normalizedCount = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;

    if (normalizedCount === 0) return;
    const available = 9 - (tiles.length + pendingCreationsRef.current);
    if (available <= 0) {
      console.warn("Max tabs reached");
      return;
    }

    const countToCreate = Math.min(normalizedCount, available);
    pendingCreationsRef.current += countToCreate;

    try {
      const targetUrl = modalTargetUrl || 'https://google.com';
      const newTabs = await window.electronAPI.createMultipleTabs(countToCreate, targetUrl);
      setTiles(prev => [...prev, ...newTabs]);
      if (newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
        setViewMode('tab');
      }
    } catch (e) {
      console.error("Failed to create multiple tabs:", e);
    } finally {
      if (Number.isFinite(countToCreate)) {
        pendingCreationsRef.current -= countToCreate;
      }
    }
  };

  const addTab = async (url: string = 'https://google.com') => {
    // Limit total tabs to 9. TileGrid supports up to 9 nicely, so we enforce this hard limit.
    if (tiles.length + pendingCreationsRef.current >= 9) {
        console.warn("Max tabs reached");
        return;
    }

    pendingCreationsRef.current += 1;

    try {
      const id = await window.electronAPI.createTile(url);
      setTiles(prev => [...prev, { id, url }]);
      setActiveTabId(id);
      setViewMode('tab'); // Switch to tab view on new tab
    } catch (e) {
      console.error("Failed to create tab:", e);
    } finally {
      pendingCreationsRef.current -= 1;
    }
  };

  const closeTab = async (id: string) => {
    try {
      // Call IPC to destroy view
      await window.electronAPI.closeTile(id);

      setTiles(prev => {
        const newTiles = prev.filter(t => t.id !== id);
        // If we closed the active tab, switch to another
        setActiveTabId(prevActive => {
          if (prevActive === id) {
            return newTiles.length ? newTiles[newTiles.length - 1].id : null;
          }
          return prevActive;
        });
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
      // Ctrl+T or Cmd+T for new tab
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault(); // Prevent standard browser new tab
        addTab();
      }
      // Ctrl+W or Cmd+W to close active tab
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
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
        {/*
          Hide tile content when modal is open to prevent native WebContentsView
          from obscuring the React modal. Unmounting triggers cleanup which calls hideTile.
        */}
        {!isModalOpen && (
          viewMode === 'grid' ? (
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
        url={modalTargetUrl}
      />
    </div>
  );
};

export default App;
