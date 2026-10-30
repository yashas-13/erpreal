import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: { globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'] },
      manifest: false,
      injectRegister: false,
      devOptions: { enabled: false }
    })
  ],
  base: '/erpreal/',
  server: { host: '0.0.0.0' }
});