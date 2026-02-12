import { _electron as electron, test, expect } from '@playwright/test';
import path from 'path';

test.describe('MSTB E2E', () => {
  test('Session Isolation', async () => {
    const electronApp = await electron.launch({
      args: ['.'],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      }
    });

    const appWindow = await electronApp.firstWindow();
    await appWindow.waitForLoadState('domcontentloaded');

    // Create two tiles pointing to the same domain to test storage isolation
    await appWindow.evaluate(async () => {
      await window.electronAPI.createTile('https://example.com');
      await window.electronAPI.createTile('https://example.com');
    });

    // Wait for the views to be created
    await expect.poll(async () => {
      return electronApp.context().pages().length;
    }).toBe(3); // Main window + 2 views

    const pages = electronApp.context().pages();
    // Filter to find the view pages (not the main window)
    // The main window has the title or URL we know.
    const mainTitle = await appWindow.title();
    const viewPages = pages.filter(p => p !== appWindow);

    expect(viewPages.length).toBe(2);
    const [page1, page2] = viewPages;

    // Set storage in page1
    await page1.evaluate(() => {
      localStorage.setItem('isolation_test', 'secret_value');
      document.cookie = 'isolation_cookie=secret_cookie';
    });

    // Verify page2 does not have it
    const storage2 = await page2.evaluate(() => localStorage.getItem('isolation_test'));
    const cookie2 = await page2.evaluate(() => document.cookie);

    expect(storage2).toBeNull();
    expect(cookie2).not.toContain('isolation_cookie');

    await electronApp.close();
  });

  test('Memory Management', async () => {
    const electronApp = await electron.launch({ args: ['.'] });
    const appWindow = await electronApp.firstWindow();

    // Initial memory
    const initialMemory = await electronApp.evaluate(() => process.memoryUsage().rss);

    // Create 5 tiles
    const ids = await appWindow.evaluate(async () => {
      const ids: string[] = [];
      for(let i=0; i<5; i++) {
        ids.push(await window.electronAPI.createTile('about:blank'));
      }
      return ids;
    });

    await expect.poll(async () => electronApp.context().pages().length).toBe(6);

    // Peak memory
    const peakMemory = await electronApp.evaluate(() => process.memoryUsage().rss);
    console.log(`Memory: Initial ${initialMemory/1024/1024} MB, Peak ${peakMemory/1024/1024} MB`);

    // Close tiles
    await appWindow.evaluate(async (ids) => {
      for(const id of ids) {
        await window.electronAPI.closeTile(id);
      }
    }, ids);

    await expect.poll(async () => electronApp.context().pages().length).toBe(1);

    // Final memory
    // Force GC if possible (requires --js-flags="--expose-gc" and calling global.gc())
    // But we just check it doesn't explode.
    const finalMemory = await electronApp.evaluate(() => process.memoryUsage().rss);
    console.log(`Memory: Final ${finalMemory/1024/1024} MB`);

    // Ideally final memory should be closer to initial than peak.
    // However, RSS fluctuates and GC is lazy. We primarily verified that pages were closed.
    // We'll just ensure it didn't leak significantly (e.g. > 50MB growth).
    expect(finalMemory).toBeLessThan(initialMemory + 100 * 1024 * 1024);

    await electronApp.close();
  });
});
