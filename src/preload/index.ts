import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export interface ElectronAPI {
  createTile: (url?: string) => Promise<string>;
  updateBounds: (viewId: string, bounds: { x: number; y: number; width: number; height: number }) => Promise<void>;
  navigate: (viewId: string, url: string) => Promise<void>;
  action: (viewId: string, action: 'back' | 'reload' | 'focus') => Promise<void>;
  closeTile: (viewId: string) => Promise<void>;
}

const electronAPI: ElectronAPI = {
  createTile: (url?: string) => ipcRenderer.invoke('MSTB_CREATE_TILE', { url }),
  updateBounds: (viewId: string, bounds) => ipcRenderer.invoke('MSTB_UPDATE_BOUNDS', { viewId, bounds }),
  navigate: (viewId: string, url: string) => ipcRenderer.invoke('MSTB_NAVIGATE', { viewId, url }),
  action: (viewId: string, action: 'back' | 'reload' | 'focus') => ipcRenderer.invoke('MSTB_ACTION', { viewId, action }),
  closeTile: (viewId: string) => ipcRenderer.invoke('MSTB_CLOSE_TILE', { viewId }),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
