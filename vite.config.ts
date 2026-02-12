import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const csp = mode === 'development'
    ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://localhost:5173 ws://localhost:5173;"
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;";

  return {
    plugins: [
      react(),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace('%VITE_CSP%', csp);
        }
      }
    ],
    base: './',
    root: path.join(__dirname, 'src/renderer'),
    publicDir: 'public',
    server: {
      port: 5173,
    },
    build: {
      outDir: path.join(__dirname, 'dist/renderer'),
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src'),
      },
    },
  };
});
