import { WebContentsView, BrowserWindow, Rectangle, Menu, MenuItem } from 'electron';
import { sessionManager } from './session-manager';

export class ViewManager {
  private views: Map<string, WebContentsView> = new Map();
  private visibleViews: Set<string> = new Set();
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  createView(id: string, url: string = 'about:blank'): WebContentsView | undefined {
    if (!this.mainWindow) {
      console.error('Main window not set, cannot create view');
      return undefined;
    }

    // specific handling for existing view
    if (this.views.has(id)) {
      console.warn(`View ${id} already exists`);
      return undefined;
    }

    const session = sessionManager.createSession(id);
    const view = new WebContentsView({
      webPreferences: {
        session: session,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        backgroundThrottling: false, // Important for tiles to stay active
      },
    });

    this.mainWindow.contentView.addChildView(view);
    this.visibleViews.add(id);
    view.webContents.loadURL(url);

    // Handle new window requests (e.g. target="_blank")
    view.webContents.setWindowOpenHandler(({ url }) => {
      view.webContents.loadURL(url);
      return { action: 'deny' };
    });

    // Context Menu
    view.webContents.on('context-menu', (_, params) => {
      const menu = new Menu();

      menu.append(new MenuItem({ label: 'Cut', role: 'cut' }));
      menu.append(new MenuItem({ label: 'Copy', role: 'copy' }));
      menu.append(new MenuItem({ label: 'Paste', role: 'paste' }));
      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({ label: 'Select All', role: 'selectAll' }));
      menu.append(new MenuItem({ type: 'separator' }));

      // Custom item: Open multiple tabs
      menu.append(new MenuItem({
        label: '別セッションでタブを複数開く',
        click: () => {
          if (this.mainWindow) {
            const targetUrl = params.linkURL || params.pageURL || '';
            try {
              this.mainWindow.webContents.send('MSTB_SHOW_TAB_CREATION_MODAL', targetUrl);
            } catch (e) {
              console.error('Failed to send IPC message:', e);
            }
          } else {
            console.error('Main window reference is missing in ViewManager');
          }
        }
      }));

      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({
        label: 'Inspect Element',
        click: () => {
          view.webContents.inspectElement(params.x, params.y);
        }
      }));

      if (this.mainWindow) {
        menu.popup({ window: this.mainWindow });
      } else {
        menu.popup();
      }
    });

    this.views.set(id, view);
    return view;
  }

  updateBounds(id: string, bounds: Rectangle) {
    const view = this.views.get(id);
    if (view && this.mainWindow) {
      try {
        if (!this.visibleViews.has(id)) {
          this.mainWindow.contentView.addChildView(view);
          this.visibleViews.add(id);
        }
        view.setBounds(bounds);
      } catch (error) {
        console.error(`Failed to update bounds for view ${id}:`, error);
      }
    }
  }

  hideView(id: string) {
    const view = this.views.get(id);
    if (view && this.mainWindow) {
      try {
        this.mainWindow.contentView.removeChildView(view);
        this.visibleViews.delete(id);
      } catch (error) {
        console.error(`Failed to hide view ${id}:`, error);
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
      this.mainWindow.contentView.removeChildView(view);

      // Explicitly destroy webContents to free resources immediately
      if (!view.webContents.isDestroyed()) {
        try {
          // view.webContents.close({ waitForBeforeUnload: false });
          // Note: WebContentsView destruction might need close() or just removeChildView
          // For now, let's try close() if available, otherwise just letting it go.
          // Electron 34 WebContentsView
          (view.webContents as any).close({ waitForBeforeUnload: false });
        } catch (e) {
          console.error(`Failed to destroy WebContents for ${id}:`, e);
        }
      }

      this.views.delete(id);
      this.visibleViews.delete(id);
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
