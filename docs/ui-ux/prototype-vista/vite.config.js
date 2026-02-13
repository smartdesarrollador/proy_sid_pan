import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Enable SPA fallback for client-side routing
    // This ensures /tarjeta/username routes work in dev mode
    historyApiFallback: true,
  },
})
