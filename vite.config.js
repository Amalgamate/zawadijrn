import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    svgr(),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      // Manual aliases if tsconfig paths support requires explicit alias
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'build', // Match CRA output dir
    sourcemap: true,
  },
});
