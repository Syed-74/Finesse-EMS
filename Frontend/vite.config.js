import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const VITE_API_BASE_URL = process.env.VITE_API_BASE_URL;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port:3000,
    // host: VITE_API_BASE_URL,
  },
})
