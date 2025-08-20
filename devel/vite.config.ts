import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import path from 'path';

export default defineConfig({
  base: 'devel/',
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    exclude: ['stores']
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  css: {
    postcss: './postcss.config.js'
  }
});