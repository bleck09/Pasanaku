import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/Pasanaku/',  
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Librerías grandes en archivos aparte: se cachean en el celular y no se vuelven a bajar en cada actualización
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/analytics'],
          graficas: ['recharts'],
        },
      },
    },
  },
})
