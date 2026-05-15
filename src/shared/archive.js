// src/shared/archive.js
// Converti depuis assets/shared/archive.js — ES module

import { supabase } from '../supabase.js'
import { currentRole, currentUser, currentProfil, hasPermission } from '../auth.js'

const STATUSES_NEEDING_STRONG_CONFIRM = ['envoye', 'envoyé', 'traite', 'traité', 'paye', 'payé', 'En attente', 'Convertie', 'approuve', 'approuvé']

export function canArchive(item, role, userId) {
    if (!item) return { allowed: false, needsStrongConfirm: false, reason: 'Document introuvable' }
    const status = (item.status || 'brouillon').toString()
    const isAuthor = item.authorId === userId
    if (role === 'A2') return { allowed: false, needsStrongConfirm: false, reason: "Votre rôle ne permet pas d'archiver" }
    if (role === 'A3') {
        if (!isAuthor) return { allowed: false, needsStrongConfirm: false, reason: "Vous n'êtes pas l'auteur de ce document" }
        if (status !== 'brouillon') return { allowed: false, needsStrongConfirm: false, reason: "Votre rôle ne permet d'archiver que les brouillons" }
        return { allowed: true, needsStrongConfirm: false, reason: '' }
    }
    if (role === 'A0' || role === 'A1') {
        return { allowed: true, needsStrongConfirm: STATUSES_NEEDING_STRONG_CONFIRM.includes(status), reason: '' }
    }
    return { allowed: false, needsStrongConfirm: false, reason: 'Rôle non autorisé' }
}

export function canSeeAllArchives(role) {
    return hasPermission('view_archives_all') || role === 'A0' || role === 'A1'
}

export function canRestore(role) {
    return role === 'A0'
}

export async function archiveDoc(table, id, userId, userName, reason = null) {
    const { error } = await supabase.from(table).update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: userId || null,
        archived_by_name: userName || null,
        archive_reason: reason
    }).eq('id', id)
    return error ? { success: false, error: error.message } : { success: true, error: null }
}

export async function restoreDoc(table, id) {
    const { error } = await supabase.from(table).update({
        is_archived: false, archived_at: null, archived_by: null, archived_by_name: null, archive_reason: null
    }).eq('id', id)
    return error ? { success: false, error: error.message } : { success: true, error: null }
}

// Helper haut-niveau — showConfirm/showAlert sont passés en paramètre
export function confirmAndArchive({ table, id, item, role, userId, userName, onSuccess, showConfirm, showAlert }) {
    const verdict = canArchive(item, role, userId)
    if (!verdict.allowed) { if (showAlert) showAlert('❌ ' + verdict.reason); return }
    const msg = verdict.needsStrongConfirm
        ? `⚠️ Document <b>#${id}</b> déjà traité/envoyé.<br><br>Il sera archivé. Restaurable pendant 1 an (admin).<br><br>Confirmer ?`
        : `Le document <b>#${id}</b> sera archivé.<br>Restaurable pendant 1 an (admin).<br><br>Confirmer ?`
    if (!showConfirm) { console.error('[archive] showConfirm manquant'); return }
    showConfirm(msg, async () => {
        const res = await archiveDoc(table, id, userId, userName)
        if (!res.success) { if (showAlert) showAlert('❌ Erreur : ' + res.error); return }
        if (onSuccess) onSuccess()
    }, 'Supprimer')
}

export function confirmAndRestore({ table, id, role, onSuccess, showConfirm, showAlert }) {
    if (!canRestore(role)) { if (showAlert) showAlert("❌ La restauration est réservée à l'administrateur (A0)."); return }
    const msg = `Restaurer <b>#${id}</b> depuis les archives ?`
    if (!showConfirm) return
    showConfirm(msg, async () => {
        const res = await restoreDoc(table, id)
        if (!res.success) { if (showAlert) showAlert('❌ Erreur : ' + res.error); return }
        if (onSuccess) onSuccess()
    }, 'Restaurer')
}