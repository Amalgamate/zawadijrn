import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  // base: '/' generates absolute asset paths (/assets/index-abc.js)
  // which always resolve correctly on Vercel regardless of navigation depth.
  // NOTE: Do NOT change to './' — relative paths break modulepreload on Vercel
  // because the SPA catch-all rewrite returns index.html for all paths,
  // causing the browser to receive text/html instead of JavaScript.
  base: '/',

  plugins: [
    react(),
    svgr(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    open: true,
    strictPort: true,
    // Explicit HMR WebSocket endpoint — avoids failed ws:// connections on some Windows / IPv6 setups
    hmr: {
      protocol: 'ws',
      port: 3000,
      clientPort: 3000,
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true,
    // Explicitly set assetsDir to ensure absolute paths in HTML output
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Ensure asset file names use absolute base path
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      }
    }
  },
});
