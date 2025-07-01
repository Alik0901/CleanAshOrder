import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['ton-inpage-provider']
  },
  // Для SSR (если у вас используется) — не выносить из бандла
  ssr: {
    noExternal: ['ton-inpage-provider']
  },
});
