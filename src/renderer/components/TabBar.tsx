import React from 'react';

interface TabBarProps {
  tabs: { id: string; url: string }[];
  activeTabId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onAddTab: () => void;
  onToggleGrid: () => void;
  isGridMode: boolean;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelect,
  onClose,
  onAddTab,
  onToggleGrid,
  isGridMode,
}) => {
  return (
    <div className="h-10 bg-gray-900 border-b border-gray-700 flex items-center px-2 space-x-1 overflow-x-auto select-none">
      {/* Grid Toggle Button */}
      <button
        onClick={onToggleGrid}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          isGridMode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
        title="Toggle Grid View"
      >
        {isGridMode ? 'Show Tabs' : 'Grid View'}
      </button>

      {/* Tabs */}
      <div className="flex-1 flex space-x-1 overflow-hidden">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`group flex items-center min-w-[120px] max-w-[200px] h-8 px-2 rounded-t text-sm cursor-pointer transition-colors relative ${
              tab.id === activeTabId && !isGridMode
                ? 'bg-gray-800 text-white border-t border-l border-r border-gray-700'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <span className="flex-1 truncate pr-6">{tab.url || 'New Tab'}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.id);
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add Tab Button */}
      <button
        onClick={onAddTab}
        className="px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
        title="New Tab"
      >
        +
      </button>
    </div>
  );
};

export default TabBar;
