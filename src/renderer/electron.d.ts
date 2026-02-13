export interface ElectronAPI {
  createTile: (url?: string) => Promise<string>;
  updateBounds: (viewId: string, bounds: { x: number; y: number; width: number; height: number }) => Promise<void>;
  navigate: (viewId: string, url: string) => Promise<void>;
  action: (viewId: string, action: 'back' | 'reload' | 'focus') => Promise<void>;
  closeTile: (viewId: string) => Promise<void>;
  createMultipleTabs: (count: number, url: string) => Promise<{ id: string; url: string }[]>;
  onShowTabCreationModal: (callback: (url: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
