import { session, Session } from 'electron';

export class SessionManager {
  private sessions: Map<string, Session> = new Map();

  /**
   * Creates or retrieves a session for the given ID.
   * Uses an in-memory partition 'z-session-${id}'.
   */
  createSession(id: string): Session {
    if (this.sessions.has(id)) {
      return this.sessions.get(id)!;
    }

    const partition = `z-session-${id}`;
    const sess = session.fromPartition(partition, { cache: false });

    // Set a default User-Agent to avoid detection issues or mobile views
    sess.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MSTB/1.0');

    // Ensure permissions are handled strictly (deny all by default)
    sess.setPermissionRequestHandler((webContents, permission, callback) => {
      // Allow nothing by default
      callback(false);
    });

    this.sessions.set(id, sess);
    return sess;
  }

  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  /**
   * Cleans up session data.
   * Since it's in-memory, just clearing references might be enough,
   * but explicitly clearing data helps with memory pressure.
   */
  async destroySession(id: string): Promise<void> {
    const sess = this.sessions.get(id);
    if (sess) {
      try {
        await sess.clearCache();
        await sess.clearStorageData();
      } catch (e) {
        console.error(`Failed to clear session data for ${id}:`, e);
      }
      this.sessions.delete(id);
    }
  }
}

export const sessionManager = new SessionManager();
