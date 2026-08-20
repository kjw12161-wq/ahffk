import path from 'node:path'
import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function includePokerGame(): import('vite').Plugin {
  return {
    name: 'include-poker-game',
    generateBundle() {
      const sourcePath = path.resolve(import.meta.dirname, './ai-dealer-poker (1).html')
      this.emitFile({
        type: 'asset',
        fileName: 'ai-dealer-poker.html',
        source: fs.readFileSync(sourcePath, 'utf8'),
      })
    },
  }
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), tailwindcss(), includePokerGame()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '5173'),
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '4173'),
  },
})
