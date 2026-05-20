// src/shared/offlineQueue.js
// File d'attente pour synchroniser les sauvegardes Supabase après reconnexion

const QUEUE_KEY = 'fdussault_offline_queue'
const MAX_QUEUE_SIZE = 100
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours

function getQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') } catch { return [] }
}

function saveQueue(q) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)) } catch {}
}

// Ajoute ou remplace une entrée dans la file (dédupliqué par table+id)
export function enqueueOfflineSave(table, payload) {
    let q = getQueue()
    // Supprimer les entrées trop vieilles
    const cutoff = Date.now() - MAX_AGE_MS
    q = q.filter(e => e.enqueuedAt > cutoff)
    // Remplacer ou ajouter
    const idx = q.findIndex(e => e.table === table && e.payload.id === payload.id)
    const entry = { table, payload, enqueuedAt: Date.now() }
    if (idx >= 0) q[idx] = entry
    else q.push(entry)
    // Respecter la limite max (garder les plus récents)
    if (q.length > MAX_QUEUE_SIZE) q = q.slice(-MAX_QUEUE_SIZE)
    saveQueue(q)
}

export function hasPendingOfflineSaves() {
    return getQueue().length > 0
}

export function getPendingCount() {
    return getQueue().length
}

// upsertFn = async (table, payload) => { error }
export async function flushOfflineQueue(upsertFn) {
    const q = getQueue()
    if (!q.length) return { flushed: 0, failed: 0 }

    let flushed = 0, failed = 0
    const remaining = []

    for (const entry of q) {
        try {
            const { error } = await upsertFn(entry.table, entry.payload)
            if (error) { remaining.push(entry); failed++ }
            else flushed++
        } catch { remaining.push(entry); failed++ }
    }

    saveQueue(remaining)
    return { flushed, failed }
}
