// src/shared/globalSearch.js
import { supabase } from '../supabase.js'

let debounceTimer = null
let panel = null
let navFn = null
let lastQuery = ''
let focusedIndex = -1

const HISTORY_KEY = 'gs_history'
const MAX_HISTORY = 5

// ── Icônes SVG ───────────────────────────────────────────────────────────────
const ICONS = {
    clients:     `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    facture:     `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    soumissions: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
    po:          `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
    feuilles:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    history:     `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>`,
}

const CAT_COLORS  = { clients: '#3b82f6', facture: '#f59e0b', soumissions: '#10b981', po: '#8b5cf6', feuilles: '#06b6d4' }
const CAT_LABELS  = { clients: 'Clients', facture: 'Factures', soumissions: 'Soumissions', po: 'Bons de commande', feuilles: 'Feuilles de temps' }
const CAT_ORDER   = ['clients', 'facture', 'soumissions', 'po', 'feuilles']

const STATUS_FR = {
    brouillon: 'Brouillon', envoye: 'Envoyée', approuve: 'Approuvée', attente: 'À corriger', rejete: 'Refusée',
    'Brouillon': 'Brouillon', 'En attente': 'En attente', 'Envoyée': 'Envoyée',
    'Payée': 'Payée', 'Convertie': 'Convertie', 'Refusée': 'Refusée',
}
const sf = s => STATUS_FR[s] || s || ''

// ── Historique ────────────────────────────────────────────────────────────────
function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
function addToHistory(q) {
    if (!q || q.length < 2) return
    let h = getHistory().filter(x => x !== q)
    h.unshift(q)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, MAX_HISTORY)))
}

// ── Fuzzy search ──────────────────────────────────────────────────────────────
function norm(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function trigramSet(s) {
    const set = new Set()
    const p = '  ' + s + '  '
    for (let i = 0; i < p.length - 2; i++) set.add(p.slice(i, i + 3))
    return set
}

function trigramSim(a, b) {
    if (!a || !b) return 0
    const ta = trigramSet(a), tb = trigramSet(b)
    let common = 0
    for (const t of ta) if (tb.has(t)) common++
    return (2 * common) / (ta.size + tb.size)
}

function fuzzyScore(text, query) {
    const t = norm(text), q = norm(query)
    if (!t || !q) return 0
    if (t === q) return 1.0
    if (t.startsWith(q)) return 0.95
    if (t.includes(q)) return 0.9

    // Multi-mot: chaque mot du query dans le texte
    const words = q.split(/\s+/).filter(Boolean)
    if (words.length > 1) {
        const matched = words.filter(w => t.includes(w)).length
        if (matched === words.length) return 0.85
        if (matched / words.length >= 0.5) return 0.4
    }

    // Sous-séquence (tolérance aux lettres manquantes)
    let j = 0
    for (let i = 0; i < t.length && j < q.length; i++) {
        if (t[i] === q[j]) j++
    }
    if (j === q.length) {
        return 0.4 + (q.length / t.length) * 0.3
    }

    // Trigrammes (tolérance aux fautes de frappe)
    const sim = trigramSim(t, q)
    return sim >= 0.25 ? sim * 0.6 : 0
}

function bestScore(r, fields, q) {
    return Math.max(...fields.map(f => fuzzyScore(r[f], q)))
}

// ── Requêtes Supabase + scoring ───────────────────────────────────────────────
async function qClients(q) {
    // Requête large avec préfixe pour capter les fautes de frappe
    const broad = q.length >= 3 ? q.slice(0, 3) : q
    const { data } = await supabase.from('clients')
        .select('id, nom, type, ville, telephone')
        .or(`nom.ilike.%${broad}%,telephone.ilike.%${q}%`)
        .neq('est_supprime', true)
        .limit(20)

    return (data || [])
        .map(r => ({ ...r, _s: bestScore(r, ['nom', 'telephone'], q) }))
        .filter(r => r._s >= 0.25)
        .sort((a, b) => b._s - a._s)
        .slice(0, 4)
        .map(c => ({
            key: 'clients', view: 'clients',
            title: c.nom,
            sub: [c.type, c.ville, c.telephone].filter(Boolean).join(' · '),
        }))
}

async function qFactures(q) {
    const broad = q.length >= 3 ? q.slice(0, 3) : q
    const { data } = await supabase.from('factures')
        .select('id, client, date, status')
        .or(`client.ilike.%${broad}%,id.ilike.%${q}%`)
        .eq('is_archived', false)
        .limit(20)

    return (data || [])
        .map(r => ({ ...r, _s: bestScore(r, ['client', 'id'], q) }))
        .filter(r => r._s >= 0.25)
        .sort((a, b) => b._s - a._s)
        .slice(0, 4)
        .map(f => ({
            key: 'facture', view: 'facture',
            title: f.id,
            sub: [f.client, sf(f.status)].filter(Boolean).join(' · '),
        }))
}

async function qSoumissions(q) {
    const broad = q.length >= 3 ? q.slice(0, 3) : q
    const { data } = await supabase.from('soumissions')
        .select('id, client, date, status')
        .or(`client.ilike.%${broad}%,id.ilike.%${q}%`)
        .eq('is_archived', false)
        .limit(20)

    return (data || [])
        .map(r => ({ ...r, _s: bestScore(r, ['client', 'id'], q) }))
        .filter(r => r._s >= 0.25)
        .sort((a, b) => b._s - a._s)
        .slice(0, 4)
        .map(s => ({
            key: 'soumissions', view: 'soumissions',
            title: s.id,
            sub: [s.client, sf(s.status)].filter(Boolean).join(' · '),
        }))
}

async function qPO(q) {
    const broad = q.length >= 3 ? q.slice(0, 3) : q
    const { data } = await supabase.from('bons_de_commande')
        .select('id, numero, fournisseur, description')
        .or(`fournisseur.ilike.%${broad}%,numero.ilike.%${q}%,description.ilike.%${broad}%`)
        .limit(20)

    return (data || [])
        .map(r => ({ ...r, _s: bestScore(r, ['fournisseur', 'numero', 'description'], q) }))
        .filter(r => r._s >= 0.25)
        .sort((a, b) => b._s - a._s)
        .slice(0, 4)
        .map(p => ({
            key: 'po', view: 'po',
            title: p.numero ? `#PO-${p.numero}` : 'Bon de commande',
            sub: [p.fournisseur, p.description].filter(Boolean).join(' · '),
        }))
}

async function qFeuilles(q) {
    const broad = q.length >= 3 ? q.slice(0, 3) : q
    const { data } = await supabase.from('feuilles_de_temps')
        .select('id, employe_nom, periode, status, total_heures')
        .or(`employe_nom.ilike.%${broad}%,periode.ilike.%${q}%`)
        .eq('is_archived', false)
        .limit(20)

    return (data || [])
        .map(r => ({ ...r, _s: bestScore(r, ['employe_nom', 'periode'], q) }))
        .filter(r => r._s >= 0.25)
        .sort((a, b) => b._s - a._s)
        .slice(0, 4)
        .map(f => ({
            key: 'feuilles', view: 'feuilleTemps',
            title: f.employe_nom || 'Employé',
            sub: [f.periode || 'Semaine en cours', f.total_heures != null ? `${f.total_heures} h` : null].filter(Boolean).join(' · '),
        }))
}

// ── Moteur ────────────────────────────────────────────────────────────────────
async function runSearch(q) {
    lastQuery = q
    showLoading()

    const settled = await Promise.allSettled([qClients(q), qFactures(q), qSoumissions(q), qPO(q), qFeuilles(q)])
    if (lastQuery !== q) return

    const allResults = settled.flatMap(r => r.status === 'fulfilled' ? r.value : [])
    addToHistory(q)
    renderPanel(allResults, q)
}

// ── Rendu ─────────────────────────────────────────────────────────────────────
function esc(s) { return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) }

function highlight(text, q) {
    if (!text || !q) return esc(text || '')
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return esc(text).replace(new RegExp(`(${esc(escaped)})`, 'gi'), '<mark>$1</mark>')
}

function renderPanel(results, q) {
    ensurePanel()
    focusedIndex = -1

    if (results.length === 0) {
        panel.innerHTML = `<div class="gs-empty">Aucun résultat pour <strong>"${esc(q)}"</strong></div>`
        positionPanel(); panel.style.display = 'block'
        return
    }

    const groups = {}
    for (const r of results) {
        if (!groups[r.key]) groups[r.key] = []
        groups[r.key].push(r)
    }

    let html = ''
    for (const key of CAT_ORDER) {
        if (!groups[key]?.length) continue
        html += `<div class="gs-section">
            <div class="gs-section-label" style="color:${CAT_COLORS[key]}">${ICONS[key]} ${CAT_LABELS[key]}</div>`
        for (const r of groups[key]) {
            html += `<button class="gs-result" data-view="${r.view}" tabindex="0">
                <span class="gs-result-title">${highlight(r.title, q)}</span>
                ${r.sub ? `<span class="gs-result-sub">${highlight(r.sub, q)}</span>` : ''}
            </button>`
        }
        html += `</div>`
    }

    panel.innerHTML = html
    positionPanel(); panel.style.display = 'block'
    wireResults()
}

function showHistory() {
    const hist = getHistory()
    ensurePanel()
    focusedIndex = -1

    if (!hist.length) { panel.style.display = 'none'; return }

    panel.innerHTML = `
        <div class="gs-history-header">
            <span>${ICONS.history} Recherches récentes</span>
            <button class="gs-clear-btn" id="gsClearHistory">Effacer</button>
        </div>
        ${hist.map(h => `<button class="gs-result gs-hist-item" data-query="${esc(h)}" tabindex="0">
            <span class="gs-result-title">${esc(h)}</span>
        </button>`).join('')}
    `
    positionPanel(); panel.style.display = 'block'

    document.getElementById('gsClearHistory')?.addEventListener('click', e => {
        e.stopPropagation()
        localStorage.removeItem(HISTORY_KEY)
        hidePanel()
    })

    panel.querySelectorAll('.gs-hist-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const q = btn.dataset.query
            const inp = document.querySelector('.topbar-search')
            if (inp) { inp.value = q; inp.focus() }
            runSearch(q)
        })
    })
}

function showLoading() {
    ensurePanel()
    panel.innerHTML = `<div class="gs-loading"><span class="gs-spinner"></span> Recherche…</div>`
    positionPanel(); panel.style.display = 'block'
}

function wireResults() {
    panel.querySelectorAll('.gs-result').forEach((btn, i) => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view
            hidePanel()
            const inp = document.querySelector('.topbar-search')
            if (inp) inp.value = ''
            if (navFn) navFn(view)
        })
        btn.addEventListener('keydown', e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus(1) }
            if (e.key === 'ArrowUp')   { e.preventDefault(); moveFocus(-1) }
            if (e.key === 'Escape')    { hidePanel(); document.querySelector('.topbar-search')?.focus() }
        })
    })
}

// ── Navigation clavier ────────────────────────────────────────────────────────
function getResults() {
    if (!panel || panel.style.display === 'none') return []
    return Array.from(panel.querySelectorAll('.gs-result'))
}

function moveFocus(dir) {
    const results = getResults()
    if (!results.length) return
    focusedIndex = Math.max(-1, Math.min(results.length - 1, focusedIndex + dir))
    if (focusedIndex === -1) document.querySelector('.topbar-search')?.focus()
    else results[focusedIndex]?.focus()
}

// ── Positionnement ────────────────────────────────────────────────────────────
function positionPanel() {
    const input = document.querySelector('.topbar-search')
    if (!input || !panel) return
    const rect = input.getBoundingClientRect()

    if (window.innerWidth <= 768) {
        panel.style.cssText += `;top:${rect.bottom + 8}px;left:12px;right:12px;width:auto`
    } else {
        const w = Math.max(rect.width, 380)
        const left = Math.min(rect.left, window.innerWidth - w - 16)
        panel.style.cssText += `;top:${rect.bottom + 8}px;left:${left}px;width:${w}px;right:auto`
    }
}

function ensurePanel() {
    if (panel) return
    panel = document.createElement('div')
    panel.className = 'gs-panel'
    panel.style.cssText = 'display:none;position:fixed;z-index:600'
    document.body.appendChild(panel)
}

export function hidePanel() {
    if (panel) panel.style.display = 'none'
    lastQuery = ''
    focusedIndex = -1
}

// ── Styles ────────────────────────────────────────────────────────────────────
function injectStyles() {
    if (document.getElementById('gs-styles')) return
    const s = document.createElement('style')
    s.id = 'gs-styles'
    s.textContent = `
        .gs-panel {
            background: var(--bg-panel, #24252e);
            border: 1px solid var(--border, #2e2f38);
            border-radius: 14px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.55);
            overflow: hidden;
            max-height: 72vh; overflow-y: auto;
            scrollbar-width: none;
        }
        .gs-panel::-webkit-scrollbar { display: none; }

        .gs-section { padding: 8px 0 4px; }
        .gs-section + .gs-section { border-top: 1px solid var(--border-faint, #25262e); }
        .gs-section-label {
            display: flex; align-items: center; gap: 6px;
            font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase;
            padding: 0 14px 6px; opacity: 0.85;
        }

        .gs-result {
            display: flex; flex-direction: column; gap: 2px;
            width: 100%; text-align: left;
            background: none; border: none; cursor: pointer;
            padding: 9px 14px; transition: background 0.1s;
            font-family: inherit; outline: none;
        }
        .gs-result:hover, .gs-result:focus { background: var(--bg-panel-2, #2b2c36); }
        .gs-result:active { background: var(--bg-panel-3, #34353f); }
        .gs-result-title { font-size: 13px; font-weight: 600; color: #fff; }
        .gs-result-sub   { font-size: 11px; color: var(--text-muted, #888); margin-top: 1px; }
        .gs-result mark  { background: none; color: var(--brand-yellow, #fcca46); font-weight: 700; }

        .gs-history-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 10px 14px 6px; border-bottom: 1px solid var(--border-faint, #25262e);
            font-size: 11px; font-weight: 600; color: var(--text-muted, #888);
            display: flex; align-items: center; gap: 6px;
        }
        .gs-history-header > span { display: flex; align-items: center; gap: 6px; }
        .gs-clear-btn {
            background: none; border: none; color: var(--text-faint, #555);
            font-size: 11px; cursor: pointer; padding: 2px 6px;
            border-radius: 4px; font-family: inherit;
            transition: color 0.1s, background 0.1s;
        }
        .gs-clear-btn:hover { color: var(--status-red, #ef4444); background: var(--tint-red, rgba(239,68,68,0.1)); }

        .gs-empty {
            padding: 20px 16px; font-size: 13px;
            color: var(--text-muted, #888); text-align: center;
        }
        .gs-empty strong { color: #fff; }

        .gs-loading {
            display: flex; align-items: center; gap: 10px;
            padding: 16px 14px; font-size: 13px; color: var(--text-muted, #888);
        }
        .gs-spinner {
            width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0;
            border: 2px solid var(--border, #2e2f38);
            border-top-color: var(--brand-yellow, #fcca46);
            animation: gs-spin 0.6s linear infinite;
        }
        @keyframes gs-spin { to { transform: rotate(360deg); } }
    `
    document.head.appendChild(s)
}

// ── Init publique ─────────────────────────────────────────────────────────────
export function initGlobalSearch(navigateFn) {
    navFn = navigateFn
    injectStyles()

    const input = document.querySelector('.topbar-search')
    if (!input) return

    // Frappe : recherche avec debounce
    input.addEventListener('input', () => {
        clearTimeout(debounceTimer)
        const q = input.value.trim()
        if (!q || q.length < 2) { hidePanel(); return }
        debounceTimer = setTimeout(() => runSearch(q), 320)
    })

    // Focus sur champ vide → historique (seulement si le panel n'affiche pas déjà des résultats)
    input.addEventListener('focus', () => {
        if (!input.value.trim() && (!panel || panel.style.display === 'none')) showHistory()
    })

    // Navigation clavier depuis l'input
    input.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); focusedIndex = -1; moveFocus(1) }
        if (e.key === 'Escape')    { hidePanel(); input.blur() }
    })

    // Fermer sur clic extérieur
    document.addEventListener('click', e => {
        if (!panel || panel.style.display === 'none') return
        const wrap = document.querySelector('.topbar-search-wrap')
        if (!panel.contains(e.target) && !wrap?.contains(e.target)) hidePanel()
    }, true)
}
