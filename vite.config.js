// vite.config.js
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['assets/*.png', 'assets/*.webp'],
            manifest: {
                name: 'F.Dussault',
                short_name: 'F.Dussault',
                description: 'Interface de gestion F.Dussault Plomberie',
                theme_color: '#1e1f26',
                background_color: '#1e1f26',
                display: 'standalone',
                orientation: 'portrait-primary',
                scope: '/',
                start_url: '/',
                icons: [
                    {
                        src: '/assets/logo_app.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: '/assets/logo_app.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: '/assets/logo_app_maskable.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ],
                // ── PWA Shortcuts — reproduits fidèlement depuis l'ancienne version ──
                shortcuts: [
                    {
                        name: 'Nouvelle facture',
                        short_name: 'Facture',
                        url: '/?view=factures',
                        icons: [{ src: '/assets/logo_facture.png', sizes: '96x96' }]
                    },
                    {
                        name: 'Feuille de temps',
                        short_name: 'Temps',
                        url: '/?view=temps',
                        icons: [{ src: '/assets/logo_feuille_de_temps.png', sizes: '96x96' }]
                    },
                    {
                        name: 'Messagerie',
                        short_name: 'Messages',
                        url: '/?view=messagerie',
                        icons: [{ src: '/assets/logo_messagerie.png', sizes: '96x96' }]
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,png,webp,svg}'],
                navigateFallback: 'index.html',
                runtimeCaching: [
                    {
                        // Supabase — toujours réseau (jamais mis en cache)
                        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
                        handler: 'NetworkOnly'
                    },
                    {
                        // CDN libs (html2canvas, jsPDF) — cache puis réseau
                        urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'cdn-libs',
                            expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 }
                        }
                    }
                ]
            }
        })
    ],
    build: {
        outDir: 'dist',
        sourcemap: false
    }
})