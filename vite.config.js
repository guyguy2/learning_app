import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendPort = process.env.SERVER_PORT || 3001

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': `http://localhost:${backendPort}`,
    },
  },
  test: {
    environment: 'node',
  },
})
