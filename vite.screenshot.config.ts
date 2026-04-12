import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist-screenshot',
    emptyOutDir: true,
    modulePreload: false,   // no preload polyfill — keeps the HTML simple
    rollupOptions: {
      input: 'index-screenshot.html',
    },
  },
});
