import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'sistema-gestion-solicitudes-production-1bf0.up.railway.app',
      '.up.railway.app'  // Permite cualquier subdominio de Railway
    ]
  }
})