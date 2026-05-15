// src/auth.js
// Gestion centralisée de la session, du rôle et des permissions
// Remplace : initApp() + loadRolesCacheIndex() + hasPermission() de l'ancien index.html

import { supabase } from './supabase.js'
import { showToast } from './shared/toast.js'

// ── État global de session ──────────────────────────────────────────────────
export let currentUser = null
export let currentRole = 'A3'
export let currentProfil = null

let _cachedRolesConfig = null

const defaultRolesConfig = {
    A0: { label: 'Super Admin',    perms: [] },
    A1: { label: 'Administrateur', perms: [] },
    A2: { label: 'Employé senior', perms: [] },
    A3: { label: 'Employé',        perms: [] }
}

// ── Chargement de la config des rôles depuis Supabase ──────────────────────
async function loadRolesConfig() {
    if (_cachedRolesConfig) return
    try {
        const { data } = await supabase
            .from('parametres_globaux')
            .select('valeur')
            .eq('cle', 'roles_config')
            .maybeSingle()
        _cachedRolesConfig = data?.valeur
            ? JSON.parse(data.valeur)
            : defaultRolesConfig
    } catch {
        _cachedRolesConfig = defaultRolesConfig
    }
}

// ── Invalider le cache des rôles (appelé quand l'admin change les permissions) ─
export function invalidateRolesCache() {
    _cachedRolesConfig = null
}

// ── Recharger la config des rôles depuis Supabase ──────────────────────────
export async function reloadRolesConfig() {
    _cachedRolesConfig = null
    await loadRolesConfig()
}

// ── Vérification de permission ──────────────────────────────────────────────
export function hasPermission(permId) {
    if (currentRole === 'A0') return true
    const roles = _cachedRolesConfig || defaultRolesConfig
    const roleData = roles[currentRole]
    return roleData?.perms?.includes(permId) ?? false
}

// ── Chargement de la session au démarrage ───────────────────────────────────
export async function loadSession() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    currentUser = user

    await loadRolesConfig()

    const { data: profil } = await supabase
        .from('profils')
        .select('role, prenom_nom')
        .eq('id', user.id)
        .limit(1)

    if (profil && profil.length > 0) {
        currentRole = profil[0].role
        currentProfil = profil[0]
    }

    // Logger la connexion une seule fois par session
    try {
        if (!sessionStorage.getItem('fd_login_logged')) {
            await supabase.from('logs_systeme').insert([{
                type_erreur: 'connexion',
                action: 'connexion',
                message: 'Connexion de ' + (currentProfil?.prenom_nom || 'utilisateur'),
                utilisateur_nom: currentProfil?.prenom_nom || 'Utilisateur',
                user_id: user.id,
                table_name: 'profils',
                doc_id: user.id
            }])
            sessionStorage.setItem('fd_login_logged', '1')
        }
    } catch { /* silencieux */ }

    return currentUser
}

// ── Déconnexion ─────────────────────────────────────────────────────────────
export async function logout() {
    sessionStorage.removeItem('fd_login_logged')
    await supabase.auth.signOut()
    window.location.href = '/login.html'
}

// ── Écoute des changements de session ───────────────────────────────────────
export function watchSession(onExpired) {
    supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            if (event === 'SIGNED_OUT') {
                currentUser = null
                currentRole = 'A3'
                currentProfil = null
                if (onExpired) onExpired()
            }
        }
    })
}