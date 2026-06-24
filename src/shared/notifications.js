// src/shared/notifications.js
import { supabase } from '../supabase.js'
import { currentUser, currentRole, hasPermission } from '../auth.js'

const LS_KEY = 'notif_last_seen'
let _navigateFn = null
let _panelOpen = false
let _counts = { messages: 0, emails: 0, factures: 0, timesheets: 0, tickets: 0 }
let _refreshTimer = null

// ── LocalStorage ─────────────────────────────────────────────────────────────
function getLastSeen() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}
function setLastSeen(key) {
    const seen = getLastSeen()
    seen[key] = new Date().toISOString()
    localStorage.setItem(LS_KEY, JSON.stringify(seen))
}

// ── Badge cloche ─────────────────────────────────────────────────────────────
function totalCount() {
    return Object.values(_counts).reduce((a, b) => a + (b || 0), 0)
}

function updateBadge() {
    const total = totalCount()
    const badge = document.getElementById('topbar-notif-badge')
    if (badge) {
        badge.textContent = total > 99 ? '99+' : String(total)
        badge.style.display = total > 0 ? 'flex' : 'none'
    }
    // Titre de l'onglet
    const base = document.title.replace(/^\(\d+\+?\)\s*/, '')
    document.title = total > 0 ? `(${total > 99 ? '99+' : total}) ${base}` : base
}

// ── Refresh ───────────────────────────────────────────────────────────────────
export async function refreshNotifs() {
    if (!currentUser) return
    const seen = getLastSeen()
    const counts = { messages: 0, emails: 0, factures: 0, timesheets: 0, tickets: 0 }

    // Messages : lire depuis le badge sidebar
    const msgBadge = document.getElementById('badge-messagerie')
    if (msgBadge && msgBadge.style.display !== 'none') {
        counts.messages = parseInt(msgBadge.textContent) || 0
    }

    // Courriels : lire depuis le count sidebar
    const emailEl = document.getElementById('sidebar-count-courriel')
    if (emailEl && emailEl.style.display !== 'none') {
        counts.emails = parseInt(emailEl.textContent) || 0
    }

    // Factures en attente (bureau / admin)
    if (hasPermission('view_all_invoices')) {
        const since = seen.factures || '2000-01-01T00:00:00Z'
        const { count } = await supabase
            .from('factures')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'envoye')
            .gt('created_at', since)
        counts.factures = count || 0
    }

    // Feuilles de temps en attente d'approbation (bureau / admin)
    if (hasPermission('approve_timesheets')) {
        const since = seen.timesheets || '2000-01-01T00:00:00Z'
        const { count } = await supabase
            .from('feuilles_de_temps')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'envoye')
            .gt('created_at', since)
        counts.timesheets = count || 0
    }

    // Tickets ouverts (admin)
    if (currentRole === 'A0' || currentRole === 'A1') {
        const since = seen.tickets || '2000-01-01T00:00:00Z'
        const { count } = await supabase
            .from('tickets_support')
            .select('id', { count: 'exact', head: true })
            .neq('statut', 'resolu')
            .gt('created_at', since)
        counts.tickets = count || 0
    }

    _counts = counts
    updateBadge()
    if (_panelOpen) renderPanel()
}

// ── Marquer comme vu ─────────────────────────────────────────────────────────
export function markNotifSeen(view) {
    let changed = false
    if (view === 'messagerie' && _counts.messages > 0) {
        _counts.messages = 0; changed = true
    } else if (view === 'courriel' && _counts.emails > 0) {
        _counts.emails = 0; changed = true
    } else if (view === 'facture' && _counts.factures > 0) {
        setLastSeen('factures'); _counts.factures = 0; changed = true
    } else if (view === 'feuilleTemps' && _counts.timesheets > 0) {
        setLastSeen('timesheets'); _counts.timesheets = 0; changed = true
    } else if (view === 'admin' && _counts.tickets > 0) {
        setLastSeen('tickets'); _counts.tickets = 0; changed = true
    }
    if (changed) { updateBadge(); if (_panelOpen) renderPanel() }
}

// ── Panel ─────────────────────────────────────────────────────────────────────
const ITEMS_DEF = [
    {
        key: 'messages', view: 'messagerie',
        title: 'Nouveaux messages',
        desc: n => `${n} message${n > 1 ? 's' : ''} non lu${n > 1 ? 's' : ''}`,
        color: '#3b82f6',
        icon: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    },
    {
        key: 'emails', view: 'courriel',
        title: 'Courriels non lus',
        desc: n => `${n} courriel${n > 1 ? 's' : ''} non lu${n > 1 ? 's' : ''}`,
        color: '#8b5cf6',
        icon: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    },
    {
        key: 'factures', view: 'facture',
        title: 'Factures à traiter',
        desc: n => `${n} facture${n > 1 ? 's' : ''} en attente`,
        color: '#f97316',
        icon: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    },
    {
        key: 'timesheets', view: 'feuilleTemps',
        title: 'Feuilles à approuver',
        desc: n => `${n} feuille${n > 1 ? 's' : ''} en attente d'approbation`,
        color: '#22c55e',
        icon: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    },
    {
        key: 'tickets', view: 'admin',
        title: 'Tickets de support',
        desc: n => `${n} ticket${n > 1 ? 's' : ''} ouvert${n > 1 ? 's' : ''}`,
        color: '#ef4444',
        icon: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    },
]

function renderPanel() {
    const panel = document.getElementById('notif-panel')
    if (!panel) return
    const active = ITEMS_DEF.filter(it => (_counts[it.key] || 0) > 0)
    const total = totalCount()

    panel.innerHTML = `
        <div class="np-header">
            <span class="np-title">Notifications</span>
            ${total > 0 ? `<button class="np-clear-all" id="np-clear-all">Tout effacer</button>` : ''}
        </div>
        <div class="np-body">
            ${active.length === 0 ? `
                <div class="np-empty">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.25"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    <p>Aucune notification</p>
                </div>
            ` : active.map(it => {
                const n = _counts[it.key]
                return `
                <div class="np-item" data-view="${it.view}" data-key="${it.key}">
                    <div class="np-icon" style="background:${it.color}20;color:${it.color}">${it.icon}</div>
                    <div class="np-info">
                        <div class="np-item-title">${it.title}</div>
                        <div class="np-item-desc">${it.desc(n)}</div>
                    </div>
                    <span class="np-count">${n > 99 ? '99+' : n}</span>
                </div>`
            }).join('')}
        </div>
    `

    panel.querySelectorAll('.np-item').forEach(el => {
        el.addEventListener('click', () => {
            const view = el.dataset.view
            closePanel()
            markNotifSeen(view)
            if (_navigateFn) _navigateFn(view)
        })
    })

    panel.querySelector('#np-clear-all')?.addEventListener('click', e => {
        e.stopPropagation()
        dismissAll()
    })
}

function dismissAll() {
    setLastSeen('factures')
    setLastSeen('timesheets')
    setLastSeen('tickets')
    _counts = { messages: 0, emails: 0, factures: 0, timesheets: 0, tickets: 0 }
    // Vider les badges sidebar
    const msgBadge = document.getElementById('badge-messagerie')
    if (msgBadge) { msgBadge.textContent = ''; msgBadge.style.display = 'none' }
    const bnavBadge = document.getElementById('bnav-badge-messagerie')
    if (bnavBadge) { bnavBadge.textContent = ''; bnavBadge.style.display = 'none' }
    window.dispatchEvent(new CustomEvent('sidebar_courriel_count', { detail: { count: 0 } }))
    updateBadge()
    renderPanel()
}

function openPanel() {
    const panel = document.getElementById('notif-panel')
    if (!panel) return
    renderPanel()
    panel.classList.add('open')
    _panelOpen = true
}

export function closePanel() {
    const panel = document.getElementById('notif-panel')
    if (panel) panel.classList.remove('open')
    _panelOpen = false
}

function togglePanel(e) {
    e.stopPropagation()
    _panelOpen ? closePanel() : openPanel()
}

// ── Styles ────────────────────────────────────────────────────────────────────
function injectStyles() {
    if (document.getElementById('notif-styles')) return
    const s = document.createElement('style')
    s.id = 'notif-styles'
    s.textContent = `
        #topbar-notif-badge {
            position: absolute; top: 0px; right: 0px;
            min-width: 16px; height: 16px; border-radius: 999px;
            background: #ef4444; color: #fff;
            font-size: 10px; font-weight: 800; line-height: 1;
            display: none; align-items: center; justify-content: center;
            padding: 0 4px; border: 2px solid var(--bg-dark,#1a1b22);
            pointer-events: none; z-index: 2; letter-spacing: 0;
        }
        #notif-panel {
            position: fixed; z-index: 9100;
            top: 58px; right: 10px;
            width: 304px;
            background: var(--bg-panel-2,#2b2c36);
            border: 1px solid var(--border);
            border-radius: var(--r-xl,14px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.5);
            display: none; flex-direction: column; overflow: hidden;
            max-height: calc(100dvh - 80px);
        }
        #notif-panel.open { display: flex; }
        .np-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 14px 16px 12px; border-bottom: 1px solid var(--border);
            flex-shrink: 0;
        }
        .np-title { font-size: 14px; font-weight: 700; color: #fff; }
        .np-clear-all {
            font-size: 12px; color: var(--text-faint); background: none; border: none;
            cursor: pointer; font-family: inherit; padding: 3px 8px;
            border-radius: var(--r-md,6px); transition: all var(--t-fast,0.12s);
        }
        .np-clear-all:hover { color: #fff; background: var(--bg-panel-3,#34353f); }
        .np-body { display: flex; flex-direction: column; overflow-y: auto; }
        .np-item {
            display: flex; align-items: center; gap: 12px;
            padding: 13px 16px; cursor: pointer;
            transition: background var(--t-fast,0.12s);
            border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .np-item:last-child { border-bottom: none; }
        .np-item:hover { background: var(--bg-panel-3,#34353f); }
        .np-icon {
            width: 36px; height: 36px; border-radius: var(--r-lg,10px);
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .np-info { flex: 1; min-width: 0; }
        .np-item-title { font-size: 13px; font-weight: 600; color: #fff; }
        .np-item-desc { font-size: 11.5px; color: var(--text-faint); margin-top: 2px; }
        .np-count {
            min-width: 22px; height: 22px; border-radius: 999px;
            background: #ef4444; color: #fff; font-size: 11px; font-weight: 700;
            display: flex; align-items: center; justify-content: center;
            padding: 0 6px; flex-shrink: 0;
        }
        .np-empty {
            padding: 36px 16px; text-align: center;
            color: var(--text-faint); font-size: 13px;
            display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .np-empty p { margin: 0; }
        @media (max-width: 768px) {
            #notif-panel { right: 8px; width: calc(100vw - 16px); max-width: 340px; top: 56px; }
        }
    `
    document.head.appendChild(s)
}

// ── Init ──────────────────────────────────────────────────────────────────────
export function initNotifications(navigateFn) {
    _navigateFn = navigateFn
    injectStyles()

    // Créer le panel
    if (!document.getElementById('notif-panel')) {
        const el = document.createElement('div')
        el.id = 'notif-panel'
        document.body.appendChild(el)
    }

    // Ajouter le badge numérique sur la cloche
    const btn = document.getElementById('topbar-notif-btn')
    if (btn) {
        btn.style.position = 'relative'
        if (!document.getElementById('topbar-notif-badge')) {
            const badge = document.createElement('span')
            badge.id = 'topbar-notif-badge'
            btn.appendChild(badge)
        }
        btn.addEventListener('click', togglePanel)
    }

    // Fermer si clic extérieur
    document.addEventListener('click', e => {
        if (!_panelOpen) return
        const panel = document.getElementById('notif-panel')
        if (panel && !panel.contains(e.target) && e.target.id !== 'topbar-notif-btn' && !btn?.contains(e.target)) {
            closePanel()
        }
    })
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel() })

    // Écouter les nouveaux messages
    window.addEventListener('new_message_notif', () => {
        setTimeout(() => {
            const msgBadge = document.getElementById('badge-messagerie')
            _counts.messages = (msgBadge && msgBadge.style.display !== 'none') ? (parseInt(msgBadge.textContent) || 0) : 0
            updateBadge()
            if (_panelOpen) renderPanel()
        }, 80)
    })

    // Écouter les mises à jour courriel
    window.addEventListener('sidebar_courriel_count', e => {
        _counts.emails = e.detail?.count || 0
        updateBadge()
        if (_panelOpen) renderPanel()
    })

    // Fetch initial + polling toutes les 60s
    refreshNotifs()
    clearInterval(_refreshTimer)
    _refreshTimer = setInterval(refreshNotifs, 60000)
}
