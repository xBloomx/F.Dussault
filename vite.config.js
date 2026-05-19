import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            manifest: false, // manifest.json géré manuellement à la racine
            workbox: {
                globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
                navigateFallback: '/index.html',
                navigateFallbackDenylist: [/^\/login/],
                cleanupOutdatedCaches: true
            }
        })
    ],
    build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
            input: {
                main: 'index.html',
                login: 'login.html'
            }
        }
    }
})
