import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    open: true,
    allowedHosts: ['.railway.app'],
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
