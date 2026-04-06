import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  // FIX: Use '/' (absolute) instead of './' (relative) for base.
  //
  // base: './' generates asset URLs like:
  //   <script src="./assets/index-abc.js">
  //   <link href="./assets/index-abc.css">
  //
  // When a user navigates to any sub-path (e.g. /#/app) and the browser
  // tries to resolve those relative paths, it resolves them relative to
  // the CURRENT URL — not the root. So:
  //   https://zawadijrn.vercel.app/#/app  +  ./assets/index.js
  //   → https://zawadijrn.vercel.app/assets/index.js   ✓  (works on root)
  //
  // BUT for static hosting (Vercel/Netlify), when Vite's modulepreload
  // injects <link rel="modulepreload"> tags at runtime, the relative
  // path gets resolved against document.baseURI, which can be the CDN
  // edge URL — not the origin. The browser then fetches the .js file,
  // gets the Vercel SPA fallback HTML (404 → index.html), and rejects
  // it as "text/html" instead of a JavaScript module.
  //
  // base: '/' generates absolute asset paths (/assets/index-abc.js)
  // which always resolve correctly regardless of navigation depth.
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
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
});
