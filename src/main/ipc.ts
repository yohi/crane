import { ipcMain } from 'electron';
import { viewManager } from './view-manager';
import crypto from 'crypto';

export function registerIpc() {
  ipcMain.handle('MSTB_CREATE_TILE', async (_, { url } = {}) => {
    const id = crypto.randomUUID();
    const view = viewManager.createView(id, url || 'about:blank');
    // We return the ID so the renderer can map its tile to this view
    return id;
  });

  ipcMain.handle('MSTB_UPDATE_BOUNDS', async (_, { viewId, bounds }) => {
    if (viewId && bounds) {
      viewManager.updateBounds(viewId, bounds);
    }
  });

  ipcMain.handle('MSTB_NAVIGATE', async (_, { viewId, url }) => {
    if (viewId && url) {
      viewManager.navigate(viewId, url);
    }
  });

  ipcMain.handle('MSTB_ACTION', async (_, { viewId, action }) => {
    if (viewId && action) {
      viewManager.action(viewId, action);
    }
  });

  ipcMain.handle('MSTB_CLOSE_TILE', async (_, { viewId }) => {
    if (viewId) {
      await viewManager.destroyView(viewId);
    }
  });
}
