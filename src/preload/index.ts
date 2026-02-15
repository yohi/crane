import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export interface ElectronAPI {
  createTile: (url?: string) => Promise<string>;
  updateBounds: (viewId: string, bounds: { x: number; y: number; width: number; height: number }) => Promise<void>;
  navigate: (viewId: string, url: string) => Promise<void>;
  action: (viewId: string, action: 'back' | 'reload' | 'focus') => Promise<void>;
  closeTile: (viewId: string) => Promise<void>;
  hideTile: (viewId: string) => Promise<void>;
  onShowTabCreationModal: (callback: (url: string) => void) => () => void;
  createMultipleTabs: (count: number, url?: string) => Promise<{ id: string; url: string }[]>;
  onPaginate: (callback: (direction: number) => void) => () => void;
}

const electronAPI: ElectronAPI = {
  createTile: (url?: string) => ipcRenderer.invoke('MSTB_CREATE_TILE', { url }),
  createMultipleTabs: (count: number, url?: string) => ipcRenderer.invoke('MSTB_CREATE_MULTIPLE_TABS', { count, url }),
  updateBounds: (viewId: string, bounds) => ipcRenderer.invoke('MSTB_UPDATE_BOUNDS', { viewId, bounds }),
  navigate: (viewId: string, url: string) => ipcRenderer.invoke('MSTB_NAVIGATE', { viewId, url }),
  action: (viewId: string, action: 'back' | 'reload' | 'focus') => ipcRenderer.invoke('MSTB_ACTION', { viewId, action }),
  closeTile: (viewId: string) => ipcRenderer.invoke('MSTB_CLOSE_TILE', { viewId }),
  hideTile: (viewId: string) => ipcRenderer.invoke('MSTB_HIDE_TILE', { viewId }),
  onShowTabCreationModal: (callback: (url: string) => void) => {
    const subscription = (_: any, url: string) => callback(url);
    ipcRenderer.on('MSTB_SHOW_TAB_CREATION_MODAL', subscription);
    return () => {
      ipcRenderer.removeListener('MSTB_SHOW_TAB_CREATION_MODAL', subscription);
    };
  },
  onPaginate: (callback: (direction: number) => void) => {
    const subscription = (_: any, direction: number) => callback(direction);
    ipcRenderer.on('MSTB_PAGINATE', subscription);
    return () => {
      ipcRenderer.removeListener('MSTB_PAGINATE', subscription);
    };
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
