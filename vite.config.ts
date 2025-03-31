import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/__/auth': {
        target: 'https://chattie-455301.firebaseapp.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})
