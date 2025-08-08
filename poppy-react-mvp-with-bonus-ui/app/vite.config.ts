import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Run on 3000 to match Supabase email redirect links
  server: { port: 3000 },
  build: { outDir: 'dist' }
})
