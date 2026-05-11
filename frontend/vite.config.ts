import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  // Use absolute asset URLs so the app works when FastAPI serves it on nested routes
  base: '/',
  plugins: [inspectAttr(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Make frontend dev work without requiring `VITE_API_URL`.
    proxy: {
      '/auth': 'http://localhost:8000',
      '/videos': 'http://localhost:8000',
      '/processing': 'http://localhost:8000',
      '/transcripts': 'http://localhost:8000',
      '/lectures': 'http://localhost:8000',
      '/quiz': 'http://localhost:8000',
    },
  },
});
