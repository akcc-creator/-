
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // === Vercel / Vite Configuration Strategy ===
  // 1. On Vercel, use 'VITE_API_KEY' (Visible in screenshot).
  // 2. Locally, 'API_KEY' might be used in .env.
  // We prioritize VITE_API_KEY to ensure the client bundle gets the key.
  const apiKey = env.VITE_API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY so the Google GenAI SDK can use it in the browser
      // This injects the actual key string into the built javascript files.
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})
