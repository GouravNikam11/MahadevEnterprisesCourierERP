import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'Mahadev Enterprises Courier ERP',
      short_name: 'Courier ERP',
      description: 'Mahadev Enterprises Courier ERP System',
      theme_color: '#0f172a',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      icons: [{ src: '/vite.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
    },
  }), cloudflare()],
})