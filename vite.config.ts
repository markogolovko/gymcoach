import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [preact(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
    manifest: {
      name: 'FORM · AI Gym Coach', short_name: 'FORM', description: 'A thoughtful training plan that fits your day.',
      theme_color: '#111210', background_color: '#111210', display: 'standalone', orientation: 'portrait',
      start_url: './', scope: './',
      icons: [{ src: './icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
    },
    workbox: { globPatterns: ['**/*.{js,css,html,svg,png,jpg,json,woff2}'], navigateFallback: 'index.html', cleanupOutdatedCaches: true },
  })],
})
