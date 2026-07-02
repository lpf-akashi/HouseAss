import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: false,
  },
});