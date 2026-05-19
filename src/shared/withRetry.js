// src/shared/withRetry.js
// Helper de retry pour les erreurs transitoires Supabase
// Remplace window.SharedFD.withRetry de l'ancien shared.js

function isTransientError(error) {
    if (!error) return false
    const msg = (error.message || '').toLowerCase()
    const name = error.name || ''
    if (name === 'AbortError') return true
    if (msg.includes('lock broken')) return true
    if (msg.includes('failed to fetch')) return true
    if (msg.includes('network')) return true
    if (error.code && /^5\d\d$/.test(String(error.code))) return true
    return false
}

export async function withRetry(operation, options = {}) {
    if (!navigator.onLine) return { error: { message: 'Hors ligne — vos données sont sauvegardées localement.', offline: true } }
    const delay = options.delay || 600
    const maxAttempts = options.maxAttempts || 2

    let lastResult = null

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            lastResult = await operation()
            if (lastResult?.error) {
                if (attempt < maxAttempts && isTransientError(lastResult.error)) {
                    await new Promise(r => setTimeout(r, delay))
                    continue
                }
                return lastResult
            }
            return lastResult
        } catch (e) {
            if (attempt < maxAttempts && isTransientError(e)) {
                await new Promise(r => setTimeout(r, delay))
                continue
            }
            return { error: e }
        }
    }
    return lastResult
}