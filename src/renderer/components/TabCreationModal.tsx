import React, { useState } from 'react';

interface TabCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (count: number) => void;
}

const TabCreationModal: React.FC<TabCreationModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [count, setCount] = useState(2);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(count);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded shadow-lg border border-gray-700 w-80">
        <h2 className="text-xl font-bold mb-4 text-white">Open Multiple Tabs</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-400 text-sm font-bold mb-2">
              Number of Tabs
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded py-2 px-3 leading-tight focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              Open
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TabCreationModal;
