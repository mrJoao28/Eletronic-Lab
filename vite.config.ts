import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  define: { __LAB_PRODUCTION__: JSON.stringify(process.env.NODE_ENV === 'production') },
  build: {
    rollupOptions: {
      output: {
        manualChunks: { 'react-vendor': ['react', 'react-dom'], 'three-vendor': ['three'] },
      },
    },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
} as Parameters<typeof defineConfig>[0]);
