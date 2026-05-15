// src/shared/consoleFilter.js
// Filtre anti-bruit Supabase Lock
// À appeler UNE seule fois au démarrage (dans index.html ou main.js)
//
// La SPA utilise un seul client Supabase, mais le lock localStorage
// 'fdussault-auth-v1' peut générer des erreurs cosmétiques si l'app
// est ouverte dans plusieurs onglets simultanément.

export function installConsoleFilter() {
    const _origWarn = console.warn.bind(console)
    const _origError = console.error.bind(console)

    function isLockNoise(args) {
        try {
            const text = Array.from(args).map(a => {
                if (a === null || a === undefined) return ''
                if (typeof a === 'string') return a
                if (typeof a === 'object') {
                    let s = ''
                    if (a.message) s += a.message + ' '
                    if (a.name) s += a.name + ' '
                    if (a.stack) s += a.stack
                    if (!s) { try { s = JSON.stringify(a) } catch { s = String(a) } }
                    return s
                }
                return String(a)
            }).join(' ')

            return text.includes('Lock not released within') ||
                   text.includes('lock:fdussault-auth') ||
                   (text.includes('AbortError') && text.includes('Lock broken')) ||
                   (text.includes('AbortError') && text.includes('steal'))
        } catch { return false }
    }

    console.warn = function(...args) { if (isLockNoise(args)) return; _origWarn(...args) }
    console.error = function(...args) { if (isLockNoise(args)) return; _origError(...args) }

    window.addEventListener('unhandledrejection', function(event) {
        try {
            const reason = event.reason
            const msg = (reason && (reason.message || String(reason))) || ''
            const name = (reason && reason.name) || ''
            if (msg.includes('Lock broken') ||
                msg.includes('Lock not released') ||
                (name === 'AbortError' && msg.includes('steal'))) {
                event.preventDefault()
                event.stopImmediatePropagation()
            }
        } catch { /* ignore */ }
    }, true)

    window.addEventListener('error', function(event) {
        try {
            const msg = (event.message || '') + ' ' + (event.error?.message || '')
            if (msg.includes('Lock broken') || msg.includes('Lock not released')) {
                event.preventDefault()
                event.stopPropagation()
            }
        } catch { /* ignore */ }
    }, true)
}