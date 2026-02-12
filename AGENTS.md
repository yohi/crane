# Multi-Session Tile Browser (MSTB) Implementation Plan

## Architecture Overview

### Main Process
- **SessionManager**: Responsible for creating and managing Electron `Session` objects.
  - Generates unique partition strings: `z-session-${uniqueId}`.
  - Ensures strict isolation (no shared storage).
  - Configures `webPreferences` (contextIsolation: true, nodeIntegration: false).
- **ViewManager**: Responsible for `BrowserView` lifecycle.
  - Creates `BrowserView` instances attached to the main window.
  - Maps `viewId` to `BrowserView` instance.
  - Handles resizing via IPC `MSTB_UPDATE_BOUNDS` from Renderer.
  - Handles navigation and control via IPC.

### Renderer Process
- **App**: Main React component.
- **TileGrid**: A CSS Grid container for tiles.
- **Tile**: A React component representing a single browser session.
  - Renders a placeholder `div` to determine bounds.
  - Uses `ResizeObserver` to monitor `div` size and position.
  - Sends bounds to Main process.
  - Renders a `Toolbar` (URL, Back, Refresh) overlay.

### IPC Messages

| Channel | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `MSTB_CREATE_TILE` | Renderer -> Main | `{ url?: string }` | Requests creation of a new tile. Returns `viewId`. |
| `MSTB_UPDATE_BOUNDS` | Renderer -> Main | `{ viewId: string, bounds: { x, y, width, height } }` | Updates the `BrowserView` bounds to match the placeholder. |
| `MSTB_NAVIGATE` | Renderer -> Main | `{ viewId: string, url: string }` | Navigates the tile to a URL. |
| `MSTB_ACTION` | Renderer -> Main | `{ viewId: string, action: 'back' \| 'reload' \| 'focus' }` | Performs browser action. |
| `MSTB_CLOSE_TILE` | Renderer -> Main | `{ viewId: string }` | Closes the tile and destroys the session. |

## Test Cases

### 1. Session Isolation
- **Goal**: Verify that cookies and local storage are not shared between tiles.
- **Steps**:
  1. Create Tile A and Tile B.
  2. In Tile A, navigate to a test page (e.g., a local server) that sets a cookie `session_id=A`.
  3. In Tile B, navigate to the same test page.
  4. Verify that Tile B does not have the cookie `session_id=A`.
  5. Set `session_id=B` in Tile B.
  6. Verify Tile A still has `session_id=A`.

### 2. Memory Management (Ephemeral)
- **Goal**: Verify that closing a tile releases resources and does not persist data.
- **Steps**:
  1. Measure memory usage (approximate).
  2. Create 9 tiles.
  3. Load heavy pages.
  4. Close all tiles.
  5. Force garbage collection (if possible via devtools protocol) or wait.
  6. Verify memory usage returns to near baseline.
  7. Verify no session data files are left in the user data directory (since `partition` is in-memory).

### 3. Layout Stability
- **Goal**: Verify `BrowserView` follows the placeholder.
- **Steps**:
  1. Create a tile.
  2. Resize the main window.
  3. Verify the `BrowserView` bounds update to match the new placeholder coordinates.

## Implementation Steps

1.  **Session & View Managers**: Implement `SessionManager` and `ViewManager` in `src/main`.
2.  **IPC Setup**: Register handlers in `src/main/ipc.ts`.
3.  **Renderer UI**: specific `Tile` and `TileGrid` components.
4.  **Bulk Generation**: Logic to spawn 9 tiles.
5.  **Shortcuts**: Global or local shortcuts.
