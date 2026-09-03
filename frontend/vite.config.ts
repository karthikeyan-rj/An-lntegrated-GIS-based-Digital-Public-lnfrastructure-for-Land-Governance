import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Proxy API calls to the LandStack backend during development.
      // Use a trailing slash so the SPA route `/apis` (Integrations page) is NOT
      // intercepted/proxied — only real `/api/<resource>` calls reach the backend.
      '/api/': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
