import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as { version: string }

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
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
