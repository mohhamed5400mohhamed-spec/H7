import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const isHmrDisabled = process.env.DISABLE_HMR === 'true';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      // HMR options configured cleanly to prevent developer websocket connection errors during preview
      hmr: isHmrDisabled ? false : undefined,
      watch: isHmrDisabled ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 1600,
    },
  };
});
