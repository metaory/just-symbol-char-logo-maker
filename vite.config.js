import { defineConfig } from 'vite'

export default defineConfig({
  base: '/symbol-logo-maker/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
})
