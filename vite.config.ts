import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: 'localhost',
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  base: process.env.NODE_ENV === 'production' ? '/doctorcar-app/' : '/'
})