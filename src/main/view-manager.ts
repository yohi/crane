import { BrowserView, BrowserWindow, Rectangle } from 'electron';
import { sessionManager } from './session-manager';

export class ViewManager {
  private views: Map<string, BrowserView> = new Map();
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  createView(id: string, url: string = 'about:blank') {
    if (!this.mainWindow) {
      console.error('Main window not set, cannot create view');
      return;
    }

    // specific handling for existing view
    if (this.views.has(id)) {
      console.warn(`View ${id} already exists`);
      return this.views.get(id);
    }

    const session = sessionManager.createSession(id);
    const view = new BrowserView({
      webPreferences: {
        session: session,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        backgroundThrottling: false, // Important for tiles to stay active
      },
    });

    this.mainWindow.addBrowserView(view);
    view.webContents.loadURL(url);

    // Handle new window requests (e.g. target="_blank")
    view.webContents.setWindowOpenHandler(({ url }) => {
      view.webContents.loadURL(url);
      return { action: 'deny' };
    });

    this.views.set(id, view);
    return view;
  }

  updateBounds(id: string, bounds: Rectangle) {
    const view = this.views.get(id);
    if (view) {
      try {
        // Adjust bounds relative to window content if needed,
        // but normally bounds from renderer are client coordinates.
        // If the window has a title bar, we might need offset?
        // Electron BrowserView setBounds is relative to the window's content area (below title bar on macOS? check docs).
        // Actually setBounds is relative to the window's client area.
        view.setBounds(bounds);
      } catch (error) {
        console.error(`Failed to update bounds for view ${id}:`, error);
      }
    }
  }

  navigate(id: string, url: string) {
    const view = this.views.get(id);
    if (view) {
      // Basic validation or protocol addition
      let targetUrl = url;
      if (!/^https?:\/\//i.test(url) && !/^about:/.test(url)) {
        targetUrl = 'https://' + url;
      }
      view.webContents.loadURL(targetUrl).catch(e => {
        console.error(`Failed to load URL ${targetUrl} in view ${id}:`, e);
      });
    }
  }

  action(id: string, action: 'back' | 'reload' | 'focus') {
    const view = this.views.get(id);
    if (view) {
      if (action === 'back' && view.webContents.canGoBack()) {
        view.webContents.goBack();
      } else if (action === 'reload') {
        view.webContents.reload();
      } else if (action === 'focus') {
        view.webContents.focus();
      }
    }
  }

  destroyView(id: string) {
    const view = this.views.get(id);
    if (view && this.mainWindow) {
      this.mainWindow.removeBrowserView(view);

      // Explicitly destroy webContents to free resources immediately
      if (!view.webContents.isDestroyed()) {
        try {
          (view.webContents as any).destroy();
        } catch (e) {
          console.error(`Failed to destroy WebContents for ${id}:`, e);
        }
      }

      this.views.delete(id);
      sessionManager.destroySession(id);
    }
  }

  destroyAll() {
    for (const id of this.views.keys()) {
      this.destroyView(id);
    }
  }
}

export const viewManager = new ViewManager();
