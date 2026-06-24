// src/views/feuilleTemps.js

import { supabase } from '../supabase.js'
import { currentUser, currentRole, currentProfil, hasPermission } from '../auth.js'
import { sanitize } from '../shared/sanitize.js'
import { friendlyError } from '../shared/errorMsg.js'
import { makeAvatar } from '../shared/avatarColor.js'
import { createAutosave } from '../shared/autosave.js'
import { canArchive, canSeeAllArchives, canRestore, confirmAndArchive, confirmAndRestore } from '../shared/archive.js'
import { openPdfPreview } from '../shared/pdfExport.js'
import { withRetry } from '../shared/withRetry.js'
import { enqueueOfflineSave } from '../shared/offlineQueue.js'
import { createZoomController } from '../shared/zoom.js'

// ── État local ───────────────────────────────────────────────────────────────
let myUserName = 'Employé'
let currentInvTab = 'mine'
let timesheetsData = []
let currentSheetId = null
let autosave = null
let tsPage = 0
const TS_PAGE_SIZE = 25
let tsHasMore = false
let confirmCallback = null
let zoomCtrl = null
let _onResizeTS = null
let archiveSelection = new Set()
let isPaperMode = false
let paperPages = []
let fdtPeriodMode = 0

const FDT_PERIODS = [
    { label: 'SEMAINE EN COURS' },
    { label: 'MOIS EN COURS' },
    { label: 'TRIMESTRE EN COURS' },
    { label: 'ANNÉE EN COURS' },
    { label: 'ANNÉE PRÉCÉDENTE' },
]

function parseTimesheetStart(periode) {
    if (!periode || periode === 'Semaine en cours') return new Date()
    const m = periode.match(/Du\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (!m) return new Date()
    return new Date(+m[3], +m[2] - 1, +m[1])
}

function calcPeriodTotal(mode) {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const q = Math.floor(m / 3)
    const mine = timesheetsData.filter(s => !s.isArchived && s.authorId === currentUser?.id)
    return mine.filter(s => {
        const d = parseTimesheetStart(s.periode)
        if (mode === 0) {
            const day = now.getDay() || 7
            const mon = new Date(now); mon.setDate(now.getDate() - day + 1); mon.setHours(0,0,0,0)
            const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999)
            return d >= mon && d <= sun
        }
        if (mode === 1) return d.getFullYear() === y && d.getMonth() === m
        if (mode === 2) return d.getFullYear() === y && Math.floor(d.getMonth() / 3) === q
        if (mode === 3) return d.getFullYear() === y
        if (mode === 4) return d.getFullYear() === y - 1
        return false
    }).reduce((sum, s) => sum + (s.total_heures || 0), 0)
}

function periodSubtitle(mode) {
    const now = new Date()
    const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
    if (mode === 0) {
        const day = now.getDay() || 7
        const mon = new Date(now); mon.setDate(now.getDate() - day + 1)
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
        return `${mon.getDate()} ${MOIS[mon.getMonth()]} – ${sun.getDate()} ${MOIS[sun.getMonth()]} ${sun.getFullYear()}`
    }
    if (mode === 1) return `${MOIS[now.getMonth()]} ${now.getFullYear()}`
    if (mode === 2) {
        const q = Math.floor(now.getMonth() / 3)
        const starts = [[0,'Jan','Mar'],[3,'Avr','Jun'],[6,'Jul','Sep'],[9,'Oct','Déc']]
        const [,s,e] = starts[q]
        return `T${q+1} · ${s}–${e} ${now.getFullYear()}`
    }
    if (mode === 3) return `Jan–Déc ${now.getFullYear()}`
    if (mode === 4) return `${now.getFullYear() - 1}`
    return ''
}

function canViewAllTimesheets() {
    return hasPermission('view_all_timesheets') || hasPermission('approve_timesheets')
}

const DOT = `<svg width="7" height="7" viewBox="0 0 7 7" style="vertical-align:middle;margin-right:5px;flex-shrink:0"><circle cx="3.5" cy="3.5" r="3.5" fill="currentColor"/></svg>`

function formatPeriode(periode) {
    if (!periode || periode === 'Semaine en cours') return periode || 'Semaine en cours'
    const m = periode.match(/Du\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+au\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (!m) return periode
    const [,d1,mo1,y1,d2,mo2] = m
    const start = new Date(+y1, +mo1-1, +d1)
    const end   = new Date(+y1, +mo2-1, +d2)
    const thu = new Date(start); thu.setDate(thu.getDate() + 4 - (thu.getDay() || 7))
    const yearStart = new Date(thu.getFullYear(), 0, 1)
    const weekNum = Math.ceil((((thu - yearStart) / 86400000) + 1) / 7)
    const MOIS = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc']
    const dayRange = start.getMonth() === end.getMonth()
        ? `${+d1}–${+d2} ${MOIS[start.getMonth()]}`
        : `${+d1} ${MOIS[start.getMonth()]} – ${+d2} ${MOIS[end.getMonth()]}`
    return `Sem. ${weekNum} · ${dayRange}`
}

// ── Render principal ──────────────────────────────────────────────────────────
export async function render(container) {
    myUserName = currentProfil?.prenom_nom || 'Employé'
    currentInvTab = 'mine'
    isPaperMode = false
    paperPages = []
    currentSheetId = null
    archiveSelection = new Set()

    container.innerHTML = `
    <style>
        /* ── Layout de base ── */
        .fdt-main { background: var(--bg-dark); color: var(--text-main); height: 100%; display: flex; flex-direction: column; overflow: hidden; font-family: var(--font-sans); }

        /* Badges définis dans styles.css (.badge .badge-grey etc.) */

        /* ── Tabs ── */
        .tabs-container { display: flex; gap: 8px; flex-wrap: wrap; }

        /* ── Entête colonnes ── */
        .ft-list-header { display:grid; grid-template-columns:220px 1fr 150px 90px 80px; gap:14px; padding:0 18px; margin-bottom:-2px; margin-top:-14px; }
        #ts-compteur { margin-top: -14px; }
        .ft-list-header span { font-size:10.5px; font-weight:700; color:var(--text-faint); text-transform:uppercase; letter-spacing:0.6px; }
        .ft-list-header .ft-h-right { text-align:right; }

        /* ── Toolbar ── */
        .toolbar { display: flex; gap: 10px; align-items: center; background: var(--bg-panel); border: 1px solid var(--border); padding: 10px; border-radius: var(--r-xl,14px); }
        .select-wrap { position: relative; display: block; min-width: 180px; flex-shrink: 0; }
        .select-wrap select { width: 100%; -webkit-appearance: none; appearance: none; padding: 10px 36px 10px 14px; background: var(--bg-sunken,#15161c); border: 1px solid var(--border); color: #fff; border-radius: var(--r-lg,10px); font-size: 13px; outline: none; cursor: pointer; font-family: inherit; transition: border-color var(--t-base); }
        .select-wrap select:focus { border-color: var(--brand-yellow); }
        .select-wrap .sel-chevron { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; width: 16px; height: 16px; stroke: var(--text-faint); fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input { width: 100%; background: var(--bg-sunken,#15161c); border: 1px solid var(--border); color: #fff; padding: 10px 14px 10px 38px; border-radius: var(--r-lg,10px); font-size: 14px; outline: none; transition: border-color var(--t-base); font-family: inherit; }
        .search-box input:focus { border-color: var(--brand-yellow); }
        .search-icon { position: absolute; left: 12px; color: var(--text-faint); pointer-events: none; display: flex; align-items: center; }
        .search-icon svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; }

        /* ── Liste feuilles ── */
        .invoice-list { display: flex; flex-direction: column; gap: 8px; padding-bottom: 30px; }
        .invoice-item {
            background: var(--bg-panel); padding: 12px 18px; border-radius: var(--r-lg,10px);
            display: grid; grid-template-columns: 220px 1fr 150px 90px 80px;
            align-items: center; gap: 14px; cursor: pointer;
            border: 1px solid var(--border); border-left: 3px solid transparent;
            transition: background var(--t-base), border-color var(--t-base), transform var(--t-fast);
        }
        .invoice-item:hover { transform: translateX(3px); background: var(--bg-panel-2); border-left-color: var(--brand-yellow); }
        .inv-id     { font-weight: 500; color: var(--text-main); font-size: 13px; white-space: nowrap; }
        .inv-client { font-weight: 700; font-size: 14px; color: #fff; display: flex; align-items: center; gap: 10px; }
        .inv-hours  { font-weight: 700; font-size: 17px; color: var(--brand-yellow); text-align: center; }
        .inv-status { display: flex; align-items: center; }
        .inv-actions { display: flex; justify-content: flex-end; gap: 6px; }
        .btn-icon   { background: var(--bg-panel-2); border: 1px solid var(--border); width: 32px; height: 32px; border-radius: var(--r-md,8px); display: flex; justify-content: center; align-items: center; cursor: pointer; color: var(--text-muted); transition: all var(--t-base); }
        .btn-icon svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-delete { background: var(--tint-red); color: var(--status-red); border-color: transparent; }
        .btn-delete:hover { background: var(--status-red); color: #fff; }

        /* Archive selection */
        .arc-selectable { position: relative; padding-left: 48px !important; }
        .arc-check { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--border-strong,#3d3e48); background: transparent; display: flex; align-items: center; justify-content: center; transition: all var(--t-fast); pointer-events: none; }
        .arc-selected .arc-check { border-color: var(--status-blue); background: var(--status-blue); }
        .arc-selected { background: rgba(59,130,246,0.05) !important; border-left-color: var(--status-blue) !important; }

        /* Compteur */
        #ts-compteur { color: var(--text-faint); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 2px 4px; }

        /* ── Éditeur ── */
        #view-editor { display: none; flex-direction: column; height: 100%; }
        #note-refus-box { display: none; background: var(--tint-red); border: 1px solid var(--status-red); border-radius: var(--r-lg,10px); padding: 12px 16px; margin: 10px 20px 0; color: var(--status-red); font-size: 13px; }

        .top-bar {
            height: auto; min-height: 70px; display: flex; align-items: center;
            justify-content: center; gap: 8px; padding: 10px 18px;
            background: var(--bg-panel); border-bottom: 1px solid var(--border);
            z-index: 101; flex-wrap: wrap;
        }
        .action-btn {
            background: var(--brand-yellow); color: var(--text-on-yellow,#1a1b22);
            border: 1px solid transparent; padding: 8px 14px; border-radius: var(--r-pill,999px);
            font-weight: 600; font-size: 12px; cursor: pointer;
            display: flex; align-items: center; gap: 7px; white-space: nowrap;
            transition: all var(--t-base); font-family: inherit;
        }
        .action-btn:hover { background: var(--brand-yellow-hover); }
        .action-btn svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-back   { background: var(--bg-panel-2) !important; color: var(--text-muted) !important; border: 1px solid var(--border) !important; }
        .btn-back:hover { background: var(--bg-panel-3) !important; color: #fff !important; }
        .btn-send   { background: var(--status-green)  !important; color: #fff !important; border-color: transparent !important; }
        .btn-send:hover { background: #16a34a !important; }
        .btn-paper  { background: #e8730a !important; color: #fff !important; border-color: transparent !important; }
        .btn-unlock  { background: var(--status-orange); color: #1a1b22; border-color: transparent; }

        @media (max-width: 1024px) {
            .top-bar { padding: 10px 80px 10px 10px; gap: 8px; height: 60px; overflow-x: auto; justify-content: flex-start; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; }
            .top-bar::-webkit-scrollbar { display: none; }
            .top-bar .action-btn { flex-shrink: 0; font-size: 11px; padding: 7px 12px; }
        }

        /* ── Zone scroll / papier ── */
        .scroll-area { flex: 1; overflow: auto; padding: 15px 0; display: block; touch-action: none; }
        #zoom-wrapper { display: block; width: 8.5in; transform-origin: 0 0; padding-bottom: 50px; }

        /* ── Contrôles zoom ── */
        .zoom-controls {
            position: fixed; bottom: 20px; right: 20px;
            background: var(--bg-panel-2); padding: 5px 14px;
            border-radius: 999px; display: flex; align-items: center; gap: 14px;
            box-shadow: var(--shadow-md); z-index: 2000; border: 1px solid var(--border);
        }
        .zoom-controls button { background: var(--brand-yellow); border: none; width: 28px; height: 28px; border-radius: 50%; font-weight: bold; font-size: 16px; cursor: pointer; display: flex; justify-content: center; align-items: center; color: #1a1b22; }
        .zoom-controls span { color: #fff; font-size: 12px; font-weight: 700; min-width: 44px; text-align: center; }

        /* ── Paper mode ── */
        .paper-mode-container { background: #fff; margin: 20px auto; max-width: 800px; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); overflow: hidden; }
        .paper-mode-header { display: flex; gap: 0; background: #fff; border-bottom: 1px solid #e0e0e0; }
        .paper-mode-header .pmh-field { flex: 1; padding: 10px 14px; border-right: 1px solid #e8e8e8; min-width: 0; }
        .paper-mode-header .pmh-field:last-child { border-right: none; }
        .paper-mode-header label { display: block; font-size: 9px; color: #888; font-weight: 700; letter-spacing: 0.8px; margin-bottom: 4px; text-transform: uppercase; }
        .paper-mode-header input { width: 100%; border: none; outline: none; background: transparent; font-size: 13px; color: #222; font-family: Arial, sans-serif; box-sizing: border-box; }
        .paper-mode-body { padding: 30px 20px; background: #fff; min-height: 400px; }
        .paper-add-page-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: calc(100% - 40px); margin: 16px 20px; padding: 14px; background: rgba(91,192,235,0.08); border: 1.5px dashed #5bc0eb; border-radius: 10px; color: #5bc0eb; font-weight: 600; font-size: 14px; cursor: pointer; font-family: inherit; }
        .paper-add-page-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .paper-page-display { position: relative; background: #fff; border-radius: 6px; margin-bottom: 12px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.15); border: 1px solid #e0e0e0; }
        .paper-page-display img { width: 100%; height: auto; display: block; }
        .paper-page-display .ppd-num { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.7); color: white; font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight: 600; pointer-events: none; }
        .pim-progress { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9000; justify-content: center; align-items: center; }
        .pim-progress.show { display: flex; }
        .pim-progress-card { background: var(--bg-panel); padding: 30px 40px; border-radius: var(--r-xl,14px); text-align: center; color: #fff; font-size: 16px; border: 1px solid var(--border); }

        /* ── Page papier format lettre (inchangé — document physique) ── */
        .page { width: 8.5in; height: 11in; background: white; color: black; padding: 0.5in; box-shadow: 0 0 20px rgba(0,0,0,0.5); box-sizing: border-box; display: flex; flex-direction: column; position: relative; margin: 0 auto 20px; flex-shrink: 0; }
        .page input { outline: none; font-family: inherit; }
        .page input:focus { border-bottom: 2px solid #000 !important; background: transparent !important; }
        .header-main { width: 100%; margin-bottom: 15px; }
        .header-main img { max-width: 100%; height: auto; display: inline-block; }
        .ts-title { text-align: center; font-size: 22px; font-weight: bold; text-decoration: underline; margin-bottom: 30px; text-transform: uppercase; color: black; }
        .ts-emp-info { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; font-size: 13px; font-weight: bold; color: black; }
        .ts-row { display: flex; align-items: center; gap: 10px; width: 100%; }
        .ts-field { background: var(--blue-bg); border: none; border-bottom: 1px solid #000; height: 26px; padding: 0 5px; font-weight: bold; flex: 1; color: black; font-size: 14px; }
        .temps-table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid black; }
        .temps-table th { border: 1px solid black; padding: 8px; font-size: 12px; text-align: center; background: #fff; color: black; font-weight: bold; }
        .temps-table td { border: 1px solid black; padding: 0; height: 28px; background: var(--blue-bg); }
        .cell-input { width: 100%; height: 100%; border: none !important; background: transparent; text-align: center; font-size: 13px; color: black; font-weight: bold; }
        .heure-input::-webkit-inner-spin-button, .heure-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .heure-input { -moz-appearance: textfield; padding-right: 16px !important; }
        .td-heure { position: relative; }
        .h-suffix { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); font-size: 11px; color: #555; pointer-events: none; font-weight: bold; }

        /* ── Modales ── */
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; z-index: 4000; justify-content: center; align-items: center; padding: env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px); box-sizing: border-box; }
        .custom-modal-overlay.open { display: flex; }
        .custom-modal-card { background: var(--bg-panel); width: 360px; padding: 24px; border-radius: var(--r-xl,14px); border: 1px solid var(--border); text-align: center; box-shadow: var(--shadow-lg); }
        .custom-modal-title { font-size: 17px; color: var(--status-red); margin-bottom: 14px; font-weight: 700; }
        .custom-modal-msg { color: var(--text-muted); margin-bottom: 22px; font-size: 14px; line-height: 1.5; }
        .custom-modal-actions { display: flex; justify-content: center; gap: 10px; }
        .btn-modal-cancel  { background: var(--bg-panel-2); color: var(--text-muted); border: 1px solid var(--border); padding: 10px 18px; border-radius: var(--r-lg,10px); cursor: pointer; font-weight: 600; font-size: 13px; font-family: inherit; }
        .btn-modal-confirm { background: var(--status-red); color: #fff; border: none; padding: 10px 18px; border-radius: var(--r-lg,10px); cursor: pointer; font-weight: 700; font-size: 13px; font-family: inherit; }
        .btn-modal-ok { background: var(--brand-yellow); color: #1a1b22; border: none; padding: 10px 28px; border-radius: var(--r-lg,10px); cursor: pointer; font-weight: 700; font-size: 13px; font-family: inherit; }

        /* ── Load more ── */
        .load-more-btn { width: 100%; padding: 12px; background: transparent; color: var(--text-muted); border: 1px dashed var(--border); border-radius: var(--r-lg,10px); cursor: pointer; font-size: 13px; font-weight: 600; margin-top: 4px; font-family: inherit; transition: border-color var(--t-base); }
        .load-more-btn:hover { border-color: var(--brand-yellow); color: var(--brand-yellow); }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* ── Mobile header ── */
        .fdt-mobile-header { display: none; align-items: center; gap: 10px; }
        .fdt-mobile-title { flex: 1; font-size: 22px; font-weight: 700; color: #fff; margin: 0; }
        .fdt-mobile-menu-btn { background: none; border: none; color: var(--text-muted); padding: 4px; cursor: pointer; display: flex; align-items: center; }
        .fdt-mobile-menu-btn svg { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 2.2; stroke-linecap: round; }
        .fdt-mobile-add-btn { background: var(--brand-yellow); border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .fdt-mobile-add-btn svg { width: 18px; height: 18px; stroke: #1a1b22; fill: none; stroke-width: 2.5; }
        .fdt-mobile-stats { display: none; font-size: 12px; color: var(--text-faint); margin-top: -6px; }
        .tab-count { background: rgba(255,255,255,0.12); color: inherit; font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 10px; min-width: 18px; text-align: center; }
        .tab.active .tab-count { background: rgba(26,27,34,0.14); }
        /* ── Total banner ── */
        .fdt-total-banner { display: none; background: var(--brand-yellow); border-radius: var(--r-xl,14px); padding: 18px 20px; flex-direction: column; gap: 4px; cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent; }
        .fdt-total-banner:active { opacity: 0.9; transform: scale(0.99); }
        .fdt-total-label { font-size: 10px; font-weight: 700; color: #1a1b22; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; }
        .fdt-total-hours { font-size: 40px; font-weight: 800; color: #1a1b22; line-height: 1; }
        .fdt-total-sub { font-size: 13px; color: rgba(26,27,34,0.65); font-weight: 500; }

        @media (min-width: 769px) and (max-width: 1024px) { #view-dashboard { padding: 20px; } }
        @media (max-width: 768px) {
            #view-dashboard { padding: 16px 16px 12px; gap: 10px; }
            .fdt-mobile-header { display: flex; }
            .fdt-mobile-stats { display: block; }
            .view-header { display: none; }
            .fdt-total-banner { display: flex; }
            .tab svg { display: none; }
            .ft-list-header { display: none; }
            .tabs-container { flex-wrap: nowrap; overflow-x: auto; }
            .tabs-container::-webkit-scrollbar { display: none; }
            .invoice-item { grid-template-columns: 1fr auto; grid-template-areas: "id status" "client hours"; gap: 3px 10px; padding: 14px 16px; position: static; }
            .inv-id { grid-area: id; align-self: center; }
            .inv-client { grid-area: client; align-self: end; }
            .inv-status { grid-area: status; justify-content: flex-end; align-self: start; }
            .inv-hours { grid-area: hours; text-align: right; align-self: end; font-size: 15px; }
            .inv-actions { display: none; }
            #ts-compteur { display: none; }
            .zoom-controls { display: none !important; }
            .toolbar { padding: 0; background: transparent; border: none; }
            .search-box input { border-radius: var(--r-xl,14px); padding: 12px 14px 12px 40px; }
            /* ── Filtre employé compact (visible seulement sur onglet Toutes) ── */
            #employeeFilterWrap { width: 42px; flex-shrink: 0; }
            #employeeFilterWrap select { width: 42px; height: 42px; padding: 0; color: transparent; background: var(--bg-sunken); border: 1px solid var(--border); border-radius: var(--r-xl,14px); -webkit-appearance: none; appearance: none; cursor: pointer; }
            #employeeFilterWrap select option { color: var(--text-main); background: var(--bg-panel); }
            #employeeFilterWrap .sel-chevron { right: 50%; transform: translate(50%,-50%); }
        }
    </style>

    <div class="fdt-main">
        <div id="view-dashboard" class="view">
            <!-- En-tête mobile -->
            <div class="fdt-mobile-header">
                <button class="fdt-mobile-menu-btn" id="fdt-menu-btn" aria-label="Menu">
                    <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </button>
                <h2 class="fdt-mobile-title">Feuille de temps</h2>
                <button class="fdt-mobile-add-btn" id="btnNewSheetMobile" aria-label="Nouvelle feuille">
                    <svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
            </div>
            <div class="fdt-mobile-stats" id="fdt-mobile-stats"></div>

            <!-- Banner total période (mobile uniquement) -->
            <div class="fdt-total-banner" id="fdt-total-banner" style="display:none">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <span class="fdt-total-label" id="fdt-total-label">SEMAINE EN COURS</span>
                    <div id="fdt-period-dots" style="display:flex;gap:4px"></div>
                </div>
                <span class="fdt-total-hours" id="fdt-total-hours">— h</span>
                <span class="fdt-total-sub" id="fdt-total-sub"></span>
            </div>

            <!-- En-tête desktop -->
            <div class="view-header">
                <div>
                    <h1>Feuille de temps</h1>
                    <p class="sub" id="fdt-header-stats"></p>
                </div>
                <div class="actions">
                    <button class="btn btn-primary btn-pill" id="btnNewSheet">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Nouvelle feuille
                    </button>
                </div>
            </div>

            <div class="toolbar">
                <div class="search-box">
                    <span class="search-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                    <input type="text" id="searchInput" placeholder="Rechercher par employé ou semaine…">
                </div>
                <div class="select-wrap" id="employeeFilterWrap">
                    <select id="employeeFilter">
                        <option value="">Tous les employés</option>
                    </select>
                    <svg class="sel-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
            </div>

            <div class="tabs-container" id="timesheet-tabs" style="display:none">
                <button id="tab-mine" class="tab active">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Mes feuilles <span class="tab-count" id="tab-count-mine" style="display:none"></span>
                </button>
                <button id="tab-all" class="tab">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                    Toutes <span class="tab-count" id="tab-count-all" style="display:none"></span>
                </button>
                <button id="tab-archives" class="tab">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                    Archives
                </button>
            </div>
            <div id="ts-compteur"></div>
            <div class="ft-list-header">
                <span>Semaine</span><span>Employé</span><span>Statut</span>
                <span class="ft-h-right">Heures</span><span>Actions</span>
            </div>
            <div class="invoice-list" id="timesheetListContainer"></div>
        </div>

        <div id="note-refus-box">
            <strong>↩️ Renvoyé pour correction :</strong>
            <div id="note-refus-text" style="margin-top:5px;font-size:13px"></div>
        </div>

        <div id="view-editor">
            <div class="top-bar">
                <button class="action-btn btn-back" id="btnBack">
                    <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    Retour
                </button>
                <button class="action-btn" id="btnApprove" style="display:none;background:var(--status-green)!important;color:#fff!important;border-color:transparent!important">
                    <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Approuver
                </button>
                <button class="action-btn" id="btnReturn" style="display:none;background:var(--status-red)!important;color:#fff!important;border-color:transparent!important">
                    <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    Renvoyer
                </button>
                <button class="action-btn btn-save" id="btnSave">
                    <svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Sauvegarder
                </button>
                <button class="action-btn btn-send" id="btnSend">
                    <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Envoyer au bureau
                </button>
                <button class="action-btn btn-paper" id="btnPaper">
                    <svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <span id="btnPaperLabel">Feuille papier</span>
                </button>
                <button class="action-btn btn-unlock" id="btnUnlock" style="display:none">
                    <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                    Débloquer
                </button>
                <div style="flex:1"></div>
                <button class="action-btn" id="btnPdf">
                    <svg viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    PDF / Imprimer
                </button>
                <button class="action-btn" id="btnAddPage">
                    <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                    Page
                </button>
                <button class="action-btn" id="btnDupPage">
                    <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Dupliquer
                </button>
                <button class="action-btn" id="btnDelPage">
                    <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                    Page
                </button>
                <button class="action-btn" id="btnClear">
                    <svg viewBox="0 0 24 24"><path d="M20 20H7l-3-3a2.828 2.828 0 0 1 0-4l10-10a2.828 2.828 0 0 1 4 0l3 3a2.828 2.828 0 0 1 0 4l-7 7"/><line x1="10" y1="10" x2="17" y2="17"/></svg>
                    Effacer
                </button>
            </div>
            <div class="scroll-area" id="scrollArea"><div id="zoom-wrapper"></div></div>
            <div class="zoom-controls">
                <button id="btnZoomOut">−</button>
                <span id="zoom-level">100%</span>
                <button id="btnZoomIn">+</button>
                <button id="btnZoomReset" style="font-size:13px">↺</button>
            </div>
        </div>
    </div>

    <!-- Modal confirmation -->
    <div class="custom-modal-overlay" id="confirmModal">
        <div class="custom-modal-card">
            <div class="custom-modal-title" id="confirmTitle">Confirmation</div>
            <div class="custom-modal-msg" id="confirmMsg"></div>
            <div class="custom-modal-actions">
                <button class="btn-modal-cancel" id="btnConfirmNo">Non</button>
                <button class="btn-modal-confirm" id="btnConfirmYes">Oui</button>
            </div>
        </div>
    </div>

    <!-- Modal alerte -->
    <div class="custom-modal-overlay" id="alertModal">
        <div class="custom-modal-card">
            <div class="custom-modal-title" style="color:var(--brand-yellow)">Information</div>
            <div class="custom-modal-msg" id="alertMsg"></div>
            <div class="custom-modal-actions"><button class="btn-modal-ok" id="btnAlertOk">Compris</button></div>
        </div>
    </div>

    <!-- Modal refus -->
    <div class="custom-modal-overlay" id="refusModal">
        <div class="custom-modal-card" style="width:430px;text-align:left">
            <div class="custom-modal-title">↩️ Renvoyer pour correction</div>
            <p style="color:var(--text-muted);font-size:13px;margin-bottom:14px">Expliquez à l'employé ce qui doit être corrigé :</p>
            <textarea id="refusNote" placeholder="Ex: Il manque les heures du mercredi 15…"
                style="width:100%;height:100px;background:var(--bg-sunken,#15161c);color:#fff;border:1px solid var(--border);padding:12px;border-radius:var(--r-lg,10px);font-family:inherit;font-size:14px;outline:none;resize:none;box-sizing:border-box;transition:border-color var(--t-base)"></textarea>
            <div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">
                <button class="btn-modal-cancel" id="btnCloseRefus">Annuler</button>
                <button class="btn-modal-confirm" id="btnConfirmRefus">↩️ Renvoyer</button>
            </div>
        </div>
    </div>

    <input type="file" id="pim-gallery-input" accept="image/*" multiple style="display:none">
    <div class="pim-progress" id="pimProgress"><div class="pim-progress-card"><div id="pimProgressText">Téléversement…</div></div></div>
    `
    await init(container)
    return cleanup
}

// ── Init ────────────────────────────────────────────────────────────────────
async function init(container) {
    const viewDash = container.querySelector('#view-dashboard')
    const viewEditor = container.querySelector('#view-editor')
    const wrapper = container.querySelector('#zoom-wrapper')
    const zoomDisplay = container.querySelector('#zoom-level')

    // Tabs
    if (canViewAllTimesheets()) {
        container.querySelector('#timesheet-tabs').style.display = 'flex'
    } else {
        container.querySelector('#timesheet-tabs').style.display = 'flex'
        container.querySelector('#tab-all').style.display = 'none'
    }

    container.querySelector('#tab-mine').addEventListener('click', () => switchTab('mine', container))
    container.querySelector('#tab-all').addEventListener('click', () => switchTab('all', container))
    container.querySelector('#tab-archives').addEventListener('click', () => switchTab('archives', container))
    container.querySelector('#searchInput').addEventListener('keyup', () => filterTimesheets(container))
    container.querySelector('#employeeFilter')?.addEventListener('change', () => filterTimesheets(container))

    // Dashboard
    container.querySelector('#btnNewSheet').addEventListener('click', () => openNewTimesheet(viewDash, viewEditor, wrapper, zoomDisplay, container))
    container.querySelector('#btnNewSheetMobile')?.addEventListener('click', () => openNewTimesheet(viewDash, viewEditor, wrapper, zoomDisplay, container))
    container.querySelector('#fdt-menu-btn')?.addEventListener('click', () => document.getElementById('topbar-mobile-menu-btn')?.click())
    container.querySelector('#fdt-total-banner')?.addEventListener('click', () => {
        fdtPeriodMode = (fdtPeriodMode + 1) % FDT_PERIODS.length
        refreshTotalBanner(container)
    })

    // Éditeur
    container.querySelector('#btnBack').addEventListener('click', () => askGoBack(wrapper, viewDash, viewEditor, container))
    container.querySelector('#btnSave').addEventListener('click', () => saveCurrentTimesheet(false, wrapper, viewDash, viewEditor, container))
    container.querySelector('#btnSend').addEventListener('click', () => {
        showConfirmModal("Une fois envoyée, vous ne pourrez plus la modifier. L'envoyer pour la paie ?", () => saveCurrentTimesheet(true, wrapper, viewDash, viewEditor, container), container, 'Envoyer au bureau')
    })
    container.querySelector('#btnApprove').addEventListener('click', () => approuverFeuille(viewDash, viewEditor, container))
    container.querySelector('#btnReturn').addEventListener('click', () => {
        container.querySelector('#refusNote').value = ''
        container.querySelector('#refusModal').classList.add('open')
    })
    container.querySelector('#btnUnlock').addEventListener('click', () => unlockTimesheet(wrapper, container))
    container.querySelector('#btnPdf').addEventListener('click', () => exportPdf(wrapper, container))
    container.querySelector('#btnPaper').addEventListener('click', () => togglePaperMode(wrapper, viewDash, viewEditor, container))
    container.querySelector('#pim-gallery-input').addEventListener('change', e => { addPaperPages(e.target.files, wrapper); e.target.value = '' })
    container.querySelector('#btnAddPage').addEventListener('click', () => { const p = createTimePageHTML(); wrapper.appendChild(p); setupInputLogic(p); zoomCtrl?.applyZoom(zoomCtrl?.current ?? 1.0) })
    container.querySelector('#btnDupPage').addEventListener('click', () => duplicatePage(wrapper, zoomDisplay))
    container.querySelector('#btnDelPage').addEventListener('click', () => deletePage(wrapper, container))
    container.querySelector('#btnClear').addEventListener('click', () => {
        showConfirmModal('Effacer tout le contenu ?', () => { wrapper.querySelectorAll('input').forEach(i => i.value = '') }, container)
    })

    // Zoom
    // Zoom — contrôleur interne indépendant du navigateur
    const scrollAreaTS = container.querySelector('#scrollArea')
    zoomCtrl = createZoomController({
        container: wrapper,
        scrollArea: scrollAreaTS,
        zoomDisplay,
        docWidthPx: 816
    })
    zoomCtrl.attach()
    container.querySelector('#btnZoomOut').addEventListener('click', () => zoomCtrl.zoomOut())
    container.querySelector('#btnZoomIn').addEventListener('click', () => zoomCtrl.zoomIn())
    container.querySelector('#btnZoomReset').addEventListener('click', () => zoomCtrl.zoomReset())
    _onResizeTS = () => { if (viewEditor.style.display === 'flex') zoomCtrl?.fitToScreen() }
    window.addEventListener('resize', _onResizeTS)

    // Modales
    container.querySelector('#btnConfirmNo').addEventListener('click', () => closeConfirmModal(container))
    container.querySelector('#btnConfirmYes').addEventListener('click', () => { if (confirmCallback) confirmCallback(); closeConfirmModal(container) })
    container.querySelector('#btnAlertOk').addEventListener('click', () => container.querySelector('#alertModal').classList.remove('open'))
    container.querySelector('#btnCloseRefus').addEventListener('click', () => container.querySelector('#refusModal').classList.remove('open'))
    container.querySelector('#btnConfirmRefus').addEventListener('click', () => confirmerRefus(viewDash, viewEditor, container))

    await loadData(true, container)
    return cleanup
}

function cleanup() {
    stopAutosave()
    if (zoomCtrl) { zoomCtrl.destroy(); zoomCtrl = null }
    if (_onResizeTS) { window.removeEventListener('resize', _onResizeTS); _onResizeTS = null }
}

// ── Données ─────────────────────────────────────────────────────────────────
async function loadData(reset = true, container) {
    if (reset) { tsPage = 0; timesheetsData = [] }
    const from = tsPage * TS_PAGE_SIZE
    const to = from + TS_PAGE_SIZE - 1

    let query = supabase.from('feuilles_de_temps').select('id, employe_nom, periode, status, total_heures, total_heures_sup, author_id, author_name, return_note, is_archived, is_paper, paper_pages')
    if (currentInvTab === 'archives') {
        query = query.eq('is_archived', true)
        if (!canSeeAllArchives(currentRole)) query = query.eq('author_id', currentUser.id)
    } else {
        query = query.eq('is_archived', false)
        if (currentInvTab === 'mine') query = query.eq('author_id', currentUser.id)
        else query = query.neq('status', 'brouillon')
    }

    const { data } = await query.order('created_at', { ascending: false }).range(from, to + 1)
    if (data) {
        tsHasMore = data.length > TS_PAGE_SIZE
        const mapped = data.slice(0, TS_PAGE_SIZE).map(db => ({
            id: db.id, employe: db.employe_nom, periode: db.periode, status: db.status,
            pagesData: [], total_heures: db.total_heures || 0, total_heures_sup: db.total_heures_sup || 0,
            authorId: db.author_id, authorName: db.author_name, return_note: db.return_note,
            isArchived: db.is_archived === true,
            isPaper: db.is_paper === true, paperPages: db.paper_pages || null
        }))
        timesheetsData = reset ? mapped : [...timesheetsData, ...mapped]
    }
    filterTimesheets(container)
}

function switchTab(tab, container) {
    archiveSelection.clear()
    currentInvTab = tab
    container.querySelectorAll('.tab').forEach(b => b.classList.remove('active'))
    container.querySelector(`#tab-${tab}`)?.classList.add('active')
    container.querySelector('#view-dashboard').style.display = 'flex'
    loadData(true, container)
}

function refreshTotalBanner(container) {
    const total = calcPeriodTotal(fdtPeriodMode)
    const period = FDT_PERIODS[fdtPeriodMode]
    const labelEl = container.querySelector('#fdt-total-label')
    const hoursEl = container.querySelector('#fdt-total-hours')
    const subEl   = container.querySelector('#fdt-total-sub')
    const dotsEl  = container.querySelector('#fdt-period-dots')
    if (labelEl) labelEl.textContent = period.label
    if (hoursEl) hoursEl.textContent = `${total} h`
    if (subEl)   subEl.textContent   = periodSubtitle(fdtPeriodMode)
    if (dotsEl)  dotsEl.innerHTML    = FDT_PERIODS.map((_, i) =>
        `<span style="width:5px;height:5px;border-radius:50%;background:rgba(26,27,34,${i === fdtPeriodMode ? '0.6' : '0.25'});display:inline-block"></span>`
    ).join('')
}

// ── Rendu liste ─────────────────────────────────────────────────────────────
function renderTimesheetList(list, container) {
    const listContainer = container.querySelector('#timesheetListContainer')
    listContainer.innerHTML = ''
    const isBureau = canViewAllTimesheets()

    const totalAll = timesheetsData.length
    const compteur = container.querySelector('#ts-compteur')
    if (compteur) compteur.textContent = ''
    const headerStats = container.querySelector('#fdt-header-stats')
    if (headerStats) {
        const total = list.length
        const pending = list.filter(s => s.status === 'envoye').length
        const approved = list.filter(s => s.status === 'approuve').length
        headerStats.textContent = `${total} feuille${total !== 1 ? 's' : ''} · ${pending} en attente · ${approved} approuvée${approved !== 1 ? 's' : ''}`
    }

    // Mobile stats & tab counts
    const mobileStats = container.querySelector('#fdt-mobile-stats')
    if (mobileStats) mobileStats.textContent = `${totalAll} feuille${totalAll > 1 ? 's' : ''} chargée${totalAll > 1 ? 's' : ''}`
    const countMine = container.querySelector('#tab-count-mine')
    const countAll  = container.querySelector('#tab-count-all')
    if (countMine) countMine.textContent = currentInvTab === 'mine' ? (list?.length ?? total) : ''
    if (countAll)  countAll.textContent  = currentInvTab === 'all'  ? (list?.length ?? total) : ''

    // Mobile total banner — total par période
    const banner = container.querySelector('#fdt-total-banner')
    if (banner && window.innerWidth <= 768) {
        const mine = timesheetsData.filter(s => !s.isArchived && s.authorId === currentUser?.id)
        if (mine.length > 0) {
            banner.style.display = 'flex'
            refreshTotalBanner(container)
        } else {
            banner.style.display = 'none'
        }
    }

    if (list.length === 0) { listContainer.innerHTML = '<div style="color:#888;text-align:center;padding:20px;font-style:italic">Aucune feuille trouvée.</div>'; return }

    if (currentInvTab === 'archives') {
        const allIds = list.map(s => s.id)
        const allSel = allIds.length > 0 && allIds.every(id => archiveSelection.has(id))
        const selBar = document.createElement('div')
        selBar.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px 16px;margin-bottom:4px;border-bottom:1px solid var(--border,#333);cursor:pointer;user-select:none;'
        const dotHtml = `<div style="width:22px;height:22px;border-radius:50%;border:2px solid ${allSel ? 'var(--btn-blue,#007bff)' : '#555'};background:${allSel ? 'var(--btn-blue,#007bff)' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s">${allSel ? '<svg viewBox="0 0 24 24" width="11" height="11" style="stroke:white;fill:none;stroke-width:3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}</div>`
        selBar.innerHTML = `${dotHtml}<span style="font-size:13px;color:var(--text-muted,#aaa);font-weight:500">Tout sélectionner</span>${archiveSelection.size > 0 ? `<span style="margin-left:auto;font-size:12px;font-weight:700;color:var(--btn-blue,#007bff);background:rgba(0,120,255,0.12);padding:2px 8px;border-radius:20px">${archiveSelection.size}</span>` : ''}`
        selBar.addEventListener('click', () => {
            if (allSel) allIds.forEach(id => archiveSelection.delete(id))
            else allIds.forEach(id => archiveSelection.add(id))
            filterTimesheets(container)
        })
        listContainer.appendChild(selBar)
    }

    list.forEach(sheet => {
        let badgeHTML = ''
        if (sheet.isArchived)                        badgeHTML = `<span class="badge badge-grey">${DOT}Archivée</span>`
        else if (currentInvTab === 'mine') {
            if      (sheet.status === 'brouillon')   badgeHTML = `<span class="badge badge-grey">${DOT}Brouillon</span>`
            else if (sheet.status === 'renvoye')     badgeHTML = `<span class="badge badge-orange">${DOT}À corriger</span>`
            else                                     badgeHTML = `<span class="badge badge-blue">${DOT}Envoyé</span>`
        } else {
            if      (sheet.status === 'brouillon')   badgeHTML = `<span class="badge badge-grey">${DOT}Brouillon</span>`
            else if (sheet.status === 'envoye')      badgeHTML = `<span class="badge badge-blue">${DOT}${!isBureau ? 'Envoyée' : 'En attente'}</span>`
            else if (sheet.status === 'approuve')    badgeHTML = `<span class="badge badge-green">${DOT}Approuvée</span>`
            else if (sheet.status === 'renvoye')     badgeHTML = `<span class="badge badge-orange">${DOT}Renvoyée</span>`
        }

        let actionsHTML = '<div style="width:36px"></div>'
        if (sheet.isArchived) {
            if (canRestore(currentRole)) actionsHTML = `<button class="btn-icon" style="background:rgba(40,167,69,0.15);color:#28a745" data-restore="${sheet.id}">↺</button>`
        } else if (isBureau && (sheet.status === 'envoye' || sheet.status === 'attente')) {
            actionsHTML = `<button class="btn-icon" style="color:var(--status-green);border-color:var(--status-green)" title="Approuver" data-approve="${sheet.id}"><svg viewBox="0 0 24 24" width="14" height="14" style="stroke:currentColor;fill:none;stroke-width:2.5"><polyline points="20 6 9 17 4 12"/></svg></button>`
        } else {
            const verdict = canArchive(sheet, currentRole, currentUser.id)
            if (verdict.allowed) actionsHTML = `<button class="btn-icon btn-delete" data-delete="${sheet.id}">
                <svg viewBox="0 0 24 24" width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>`
        }

        const empName = sheet.employe || sheet.authorName || 'Employé'
        const div = document.createElement('div')
        div.className = 'invoice-item'
        div.innerHTML = `
            <div class="inv-id">${sanitize(formatPeriode(sheet.periode || 'Période inconnue'))}</div>
            <div class="inv-client">${makeAvatar(empName)} ${sanitize(empName)}</div>
            <div class="inv-status">${badgeHTML}</div>
            <div class="inv-hours">${sanitize(String(sheet.total_heures ?? ''))} h</div>
            <div class="inv-actions">${actionsHTML}</div>
        `
        if (sheet.isArchived) {
            const isSel = archiveSelection.has(sheet.id)
            div.classList.add('arc-selectable')
            if (isSel) div.classList.add('arc-selected')
            const check = document.createElement('div')
            check.className = 'arc-check'
            if (isSel) check.innerHTML = '<svg viewBox="0 0 24 24" width="11" height="11" style="stroke:white;fill:none;stroke-width:3"><polyline points="20 6 9 17 4 12"/></svg>'
            div.appendChild(check)
            div.addEventListener('click', e => {
                if (e.target.closest('[data-restore]')) return
                if (archiveSelection.has(sheet.id)) archiveSelection.delete(sheet.id)
                else archiveSelection.add(sheet.id)
                filterTimesheets(container)
            })
        } else {
            div.addEventListener('click', e => { if (e.target.closest('[data-delete],[data-restore],[data-approve]')) return; openExistingTimesheet(sheet.id, container) })
        }
        div.querySelector('[data-delete]')?.addEventListener('click', e => {
            e.stopPropagation()
            confirmAndArchive({ table: 'feuilles_de_temps', id: sheet.id, item: sheet, role: currentRole, userId: currentUser.id, userName: myUserName, onSuccess: () => loadData(true, container), showConfirm: (msg, cb) => showConfirmModal(msg, cb, container), showAlert: msg => showAlertModal(msg, container) })
        })
        div.querySelector('[data-restore]')?.addEventListener('click', e => {
            e.stopPropagation()
            confirmAndRestore({ table: 'feuilles_de_temps', id: sheet.id, role: currentRole, onSuccess: () => loadData(true, container), showConfirm: (msg, cb) => showConfirmModal(msg, cb, container), showAlert: msg => showAlertModal(msg, container) })
        })
        div.querySelector('[data-approve]')?.addEventListener('click', async e => {
            e.stopPropagation()
            const { error } = await supabase.from('feuilles_de_temps').update({ status: 'approuve', return_note: null }).eq('id', sheet.id)
            if (error) { showAlertModal(friendlyError(error), container); return }
            loadData(true, container)
        })
        listContainer.appendChild(div)
    })

    if (tsHasMore) {
        const btn = document.createElement('button')
        btn.textContent = `Charger ${TS_PAGE_SIZE} feuilles de plus...`
        btn.style.cssText = 'width:100%;padding:14px;margin-top:10px;background:var(--bg-panel);color:var(--text-muted);border:1px dashed var(--border);border-radius:10px;cursor:pointer;font-size:14px;font-weight:bold'
        btn.addEventListener('click', async () => {
            if (btn.disabled) return
            btn.disabled = true; btn.textContent = 'Chargement...'
            tsPage++
            try { await loadData(false, container) }
            catch (e) { console.error('[feuilleTemps] Erreur pagination:', e?.message); tsPage--; btn.disabled = false; btn.textContent = `Charger ${TS_PAGE_SIZE} feuilles de plus...` }
        })
        listContainer.appendChild(btn)
    }
    updateTsArchiveBar(container)
}

function updateTsArchiveBar(container) {
    let bar = container.querySelector('#ts-archive-action-bar')
    if (!bar) {
        bar = document.createElement('div')
        bar.id = 'ts-archive-action-bar'
        container.querySelector('#view-dashboard').appendChild(bar)
    }
    if (archiveSelection.size === 0 || currentInvTab !== 'archives') {
        bar.style.display = 'none'
        return
    }
    const canRes = canRestore(currentRole)
    bar.style.cssText = 'display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--bg-card,#23243a);border-top:2px solid var(--btn-blue,#007bff);flex-wrap:wrap;position:sticky;bottom:0;z-index:50;'
    bar.innerHTML = `
        <span style="font-size:14px;font-weight:bold;color:var(--text-main,#eee)">${archiveSelection.size} sélectionné(s)</span>
        ${canRes ? `<button id="bar-ts-restore" style="background:rgba(40,167,69,0.18);color:#28a745;border:1px solid rgba(40,167,69,0.3);padding:7px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">↺ Restaurer</button>` : ''}
        ${hasPermission('delete_documents') ? '<button id="bar-ts-delete" style="background:rgba(220,53,69,0.18);color:#dc3545;border:1px solid rgba(220,53,69,0.3);padding:7px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;margin-left:auto">Supprimer définitivement</button>' : ''}
    `
    bar.querySelector('#bar-ts-delete')?.addEventListener('click', () => {
        const ids = [...archiveSelection]
        showConfirmModal(`Supprimer définitivement ${ids.length} feuille(s) de temps ? Cette action est irréversible.`, async () => {
            const { error } = await supabase.from('feuilles_de_temps').delete().in('id', ids)
            if (error) { showAlertModal('Erreur: ' + error.message, container); return }
            archiveSelection.clear()
            loadData(true, container)
        }, container, 'Suppression définitive')
    })
    if (canRes) {
        bar.querySelector('#bar-ts-restore').addEventListener('click', () => {
            const ids = [...archiveSelection]
            showConfirmModal(`Restaurer ${ids.length} feuille(s) de temps ?`, async () => {
                const { error } = await supabase.from('feuilles_de_temps').update({ is_archived: false }).in('id', ids)
                if (error) { showAlertModal('Erreur: ' + error.message, container); return }
                archiveSelection.clear()
                loadData(true, container)
            }, container, 'Restauration')
        })
    }
}

function filterTimesheets(container) {
    const term = container.querySelector('#searchInput')?.value.toLowerCase() || ''
    const empFilter = container.querySelector('#employeeFilter')?.value || ''
    const isBureau = canViewAllTimesheets()

    const empWrap = container.querySelector('#employeeFilterWrap')
    const empSelect = container.querySelector('#employeeFilter')
    if (empSelect && empWrap) {
        if (isBureau && currentInvTab !== 'mine') {
            empWrap.style.display = ''
            const currentVal = empSelect.value
            const names = [...new Set(timesheetsData.map(s => s.employe || s.authorName || '').filter(Boolean))].sort()
            empSelect.innerHTML = '<option value="">Tous les employés</option>' + names.map(n => `<option value="${n}"${n === currentVal ? ' selected' : ''}>${n}</option>`).join('')
        } else {
            empWrap.style.display = 'none'
        }
    }

    let base = currentInvTab === 'archives' ? timesheetsData
        : (!isBureau || currentInvTab === 'mine') ? timesheetsData.filter(s => s.authorId === currentUser.id || !s.authorId)
        : timesheetsData.filter(s => s.status !== 'brouillon')
    let filtered = base.filter(s => (s.employe || s.authorName || '').toLowerCase().includes(term) || (s.periode || '').toLowerCase().includes(term))
    if (empFilter) filtered = filtered.filter(s => (s.employe || s.authorName || '') === empFilter)
    renderTimesheetList(filtered, container)
}

// ── Éditeur ─────────────────────────────────────────────────────────────────
function openNewTimesheet(viewDash, viewEditor, wrapper, zoomDisplay, container) {
    document.body.classList.add('detail-mode')
    try { localStorage.removeItem('fdussault_draft_feuille_de_temps_new') } catch {}
    currentSheetId = null
    viewDash.style.display = 'none'
    viewEditor.style.display = 'flex'
    wrapper.innerHTML = ''
    const p = createTimePageHTML()
    wrapper.appendChild(p)
    setupInputLogic(p)
    applyEditorSecurity(null, wrapper, container)
    zoomCtrl?.fitToScreen()
    startAutosave(wrapper)
}

async function openExistingTimesheet(id, container) {
    document.body.classList.add('detail-mode')
    const sheet = timesheetsData.find(s => s.id === id)
    if (!sheet) return
    currentSheetId = id

    const viewDash = container.querySelector('#view-dashboard')
    const viewEditor = container.querySelector('#view-editor')
    const wrapper = container.querySelector('#zoom-wrapper')
    const zoomDisplay = container.querySelector('#zoom-level')

    viewDash.style.display = 'none'
    viewEditor.style.display = 'flex'
    wrapper.innerHTML = ''
    isPaperMode = false; paperPages = []

    if (sheet.isPaper && sheet.paperPages?.length) {
        restorePaperMode(sheet, wrapper, container)
        applyEditorSecurity(sheet, wrapper, container)
        return
    }

    // Load pages_data on demand (excluded from list query for performance)
    const { data: fullRow } = await supabase.from('feuilles_de_temps').select('pages_data').eq('id', id).single()
    const pagesData = fullRow?.pages_data || []

    if (pagesData.length) {
        pagesData.forEach(pageData => {
            const newPage = createTimePageHTML()
            wrapper.appendChild(newPage)
            setupInputLogic(newPage)
            const inputs = newPage.querySelectorAll('input')
            pageData.forEach((val, idx) => { if (inputs[idx]) inputs[idx].value = val })
        })
    } else {
        const p = createTimePageHTML()
        wrapper.appendChild(p)
        setupInputLogic(p)
    }

    applyEditorSecurity(sheet, wrapper, container)
    zoomCtrl?.fitToScreen()

    if (!sheet.isArchived && (!sheet.status || sheet.status === 'brouillon')) startAutosave(wrapper)
}

function showDashboard(viewDash, viewEditor, container) {
    document.body.classList.remove('detail-mode')
    stopAutosave()
    isPaperMode = false; paperPages = []
    updatePaperToggleButton(container)
    viewDash.style.display = 'flex'
    viewEditor.style.display = 'none'
    currentInvTab = 'mine'
    container.querySelectorAll('.tab').forEach(b => b.classList.remove('active'))
    container.querySelector('#tab-mine')?.classList.add('active')
    loadData(true, container)
}

function askGoBack(wrapper, viewDash, viewEditor, container) {
    const hasDraft = autosave?.hasDraft?.()
    if (hasDraft) {
        showConfirmModal('Des modifications non sauvegardées seront perdues. Quitter quand même ?', () => showDashboard(viewDash, viewEditor, container), container, 'Modifications non sauvegardées')
    } else {
        showDashboard(viewDash, viewEditor, container)
    }
}

function applyEditorSecurity(sheet, wrapper, container) {
    const isApprover = hasPermission('approve_timesheets')
    const status = sheet?.status || 'brouillon'
    const isAuthor = sheet ? (sheet.authorId === currentUser.id || !sheet.authorId) : true
    const isArchived = sheet?.isArchived === true

    let canEdit = isAuthor && (status === 'brouillon' || status === 'renvoye' || status === 'attente')
    if (isArchived) canEdit = false

    const usePaper = sheet?.isPaper === true || isPaperMode
    const show = (id, v) => { const el = container.querySelector(id); if (el) el.style.display = v ? 'flex' : 'none' }

    if (usePaper) {
        show('#btnSave', canEdit)
        show('#btnSend', canEdit)
        show('#btnPaper', canEdit)
        show('#btnAddPage', false)
        show('#btnDupPage', false)
        show('#btnDelPage', false)
        show('#btnClear', false)
        show('#btnApprove', !isArchived && isApprover && (status === 'envoye' || status === 'attente'))
        show('#btnReturn', !isArchived && isApprover && (status === 'envoye' || status === 'attente'))
        show('#btnUnlock', false)
        updatePaperToggleButton(container)
        const refusBox = container.querySelector('#note-refus-box')
        const refusText = container.querySelector('#note-refus-text')
        if (refusBox && sheet?.return_note) { refusBox.style.display = 'block'; if (refusText) refusText.textContent = sheet.return_note }
        else if (refusBox) refusBox.style.display = 'none'
        return
    }

    show('#btnSave', canEdit)
    show('#btnSend', canEdit)
    show('#btnAddPage', canEdit)
    show('#btnDupPage', canEdit)
    show('#btnDelPage', canEdit)
    show('#btnClear', canEdit)
    show('#btnUnlock', isApprover && status !== 'brouillon' && status !== 'renvoye' && status !== 'attente' && !isArchived)
    show('#btnApprove', !isArchived && isApprover && (status === 'envoye' || status === 'attente'))
    show('#btnReturn', !isArchived && isApprover && (status === 'envoye' || status === 'attente'))

    const refusBox = container.querySelector('#note-refus-box')
    const refusText = container.querySelector('#note-refus-text')
    if (refusBox && sheet?.return_note) { refusBox.style.display = 'block'; if (refusText) refusText.textContent = sheet.return_note }
    else if (refusBox) refusBox.style.display = 'none'

    wrapper.querySelectorAll('input').forEach(inp => {
        if (!canEdit) { inp.setAttribute('readonly', true); inp.style.pointerEvents = 'none' }
        else { inp.removeAttribute('readonly'); inp.style.pointerEvents = 'auto' }
    })
}

function unlockTimesheet(wrapper, container) {
    wrapper.querySelectorAll('input').forEach(inp => { inp.removeAttribute('readonly'); inp.style.pointerEvents = 'auto' })
    ;['#btnSave', '#btnAddPage', '#btnDupPage', '#btnDelPage', '#btnClear'].forEach(sel => {
        const el = container.querySelector(sel); if (el) el.style.display = 'flex'
    })
    container.querySelector('#btnUnlock').style.display = 'none'
    showAlertModal("Feuille de temps débloquée. N'oubliez pas de sauvegarder.", container)
}

// ── Sauvegarde ────────────────────────────────────────────────────────────────
async function saveCurrentTimesheet(isSending, wrapper, viewDash, viewEditor, container) {
    if (isPaperMode) { await saveCurrentPaperTimesheet(isSending, wrapper, viewDash, viewEditor, container); return }
    const firstPage = wrapper.querySelector('.page')
    if (!firstPage) return

    const btnSave = container.querySelector('#btnSave')
    const origHTML = btnSave?.innerHTML
    if (btnSave) { btnSave.disabled = true; btnSave.textContent = 'Sauvegarde...' }

    // Compactage des lignes vides
    wrapper.querySelectorAll('.page').forEach(page => {
        page.querySelectorAll('table.temps-table tbody').forEach(tbody => {
            const rows = Array.from(tbody.querySelectorAll('tr'))
            const data = rows.map(tr => {
                const values = Array.from(tr.querySelectorAll('input')).map(i => i.value)
                return { values, isEmpty: values.every(v => !v?.trim()) }
            })
            const ordered = [...data.filter(d => !d.isEmpty), ...data.filter(d => d.isEmpty)]
            rows.forEach((tr, idx) => {
                tr.querySelectorAll('input').forEach((inp, j) => { inp.value = ordered[idx].values[j] || '' })
            })
        })
    })

    const nameInput = firstPage.querySelector('.input-nom')
    const weekInput = firstPage.querySelector('.input-semaine-debut')
    const weekEndInput = firstPage.querySelector('.input-semaine-fin')
    let empName = nameInput?.value.trim() || myUserName
    if (nameInput && !nameInput.value.trim()) nameInput.value = empName
    const dateStr = (weekInput?.value && weekEndInput?.value) ? `Du ${weekInput.value} au ${weekEndInput.value}` : 'Semaine en cours'

    const allPagesData = []
    wrapper.querySelectorAll('.page').forEach(page => {
        allPagesData.push(Array.from(page.querySelectorAll('input')).map(i => i.value))
    })

    let totalGlobal = 0
    wrapper.querySelectorAll('.heure-input').forEach(inp => { const v = parseFloat(inp.value); if (!isNaN(v)) totalGlobal += v })

    const tsId = currentSheetId || 'TS-' + Date.now()
    const existing = timesheetsData.find(s => s.id === currentSheetId || s.id === tsId)
    let currentStatus = existing?.status || 'brouillon'
    if (isSending) currentStatus = 'envoye'

    const payload = {
        id: tsId, employe_nom: empName, periode: dateStr, pages_data: allPagesData,
        total_heures: totalGlobal, total_heures_sup: 0, status: currentStatus,
        author_id: existing ? existing.authorId : currentUser.id,
        author_name: existing ? existing.authorName : myUserName
    }

    const { error } = await withRetry(() => supabase.from('feuilles_de_temps').upsert(payload))

    if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = origHTML }

    if (error) {
        if (error.offline) {
            enqueueOfflineSave('feuilles_de_temps', payload)
            showAlertModal('Hors ligne — la feuille sera synchronisée automatiquement à la reconnexion.', container)
            return
        }
        const msg = (error.message || '').toLowerCase()
        showAlertModal(msg.includes('lock broken') ? '❌ Réessayez dans 2 secondes.' : friendlyError(error), container)
        return
    }

    currentSheetId = tsId
    clearAutosaveCurrent()
    try { localStorage.removeItem('fdussault_draft_feuille_de_temps_new') } catch {}
    await loadData(true, container)

    if (isSending) {
        showAlertModal('Feuille de temps envoyée au bureau avec succès !', container)
        showDashboard(viewDash, viewEditor, container)
    } else {
        showAlertModal('Feuille de temps sauvegardée !', container)
        applyEditorSecurity(payload, wrapper, container)
    }
}

async function approuverFeuille(viewDash, viewEditor, container) {
    if (!currentSheetId) return
    showConfirmModal('Approuver cette feuille de temps ?', async () => {
        const { error } = await supabase.from('feuilles_de_temps').update({ status: 'approuve', return_note: null }).eq('id', currentSheetId)
        if (error) { showAlertModal(friendlyError(error), container); return }
        await loadData(true, container)
        showDashboard(viewDash, viewEditor, container)
        showAlertModal('Feuille de temps approuvée !', container)
    }, container)
}

async function confirmerRefus(viewDash, viewEditor, container) {
    const note = container.querySelector('#refusNote')?.value.trim()
    if (!note) { if (container.querySelector('#refusNote')) container.querySelector('#refusNote').style.borderColor = 'var(--btn-red)'; return }
    if (!currentSheetId) return
    const { error } = await supabase.from('feuilles_de_temps').update({ status: 'renvoye', return_note: note }).eq('id', currentSheetId)
    if (error) { showAlertModal(friendlyError(error), container); return }
    container.querySelector('#refusModal').classList.remove('open')
    await loadData(true, container)
    showDashboard(viewDash, viewEditor, container)
    showAlertModal("↩️ Feuille renvoyée à l'employé pour correction.", container)
}

function exportPdf(wrapper, container) {
    if (isPaperMode) {
        if (!paperPages.length) { showAlertModal("Ajoutez au moins une photo avant d'exporter.", container); return }
        const empInp = wrapper.querySelector('.paper-emp-input')
        const weekInp = wrapper.querySelector('.paper-week-input')
        const empName = empInp?.value.trim() || myUserName
        const weekDate = weekInp?.value || new Date().toISOString().split('T')[0]
        const tempDiv = document.createElement('div')
        tempDiv.style.cssText = 'position:fixed;left:-9999px;top:0;width:8.5in'
        paperPages.forEach(p => {
            const page = document.createElement('div')
            page.className = 'page'
            page.style.cssText = 'width:8.5in;height:11in;display:flex;align-items:center;justify-content:center;padding:0.2in;background:white;box-sizing:border-box;overflow:hidden'
            const img = document.createElement('img')
            img.src = p.dataUrl || p.url
            img.style.cssText = 'max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block'
            page.appendChild(img)
            tempDiv.appendChild(page)
        })
        document.body.appendChild(tempDiv)
        openPdfPreview({ container: tempDiv, docType: 'feuille', docNumber: currentSheetId || null, clientName: empName, date: weekDate })
        setTimeout(() => document.body.removeChild(tempDiv), 3000)
        return
    }
    const firstPage = wrapper.querySelector('.page')
    if (!firstPage) return
    const nameInput = firstPage.querySelector('.input-nom')
    const weekInput = firstPage.querySelector('.input-semaine-debut')
    const empName = nameInput?.value.trim() || myUserName
    let weekDate = weekInput?.value.trim() || ''
    const m = weekDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (m) weekDate = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
    if (!weekDate) weekDate = new Date().toISOString().split('T')[0]
    openPdfPreview({ container: wrapper, docType: 'feuille', docNumber: currentSheetId || null, clientName: empName, date: weekDate })
}

// ── Mode papier ─────────────────────────────────────────────────────────────
function togglePaperMode(wrapper, viewDash, viewEditor, container) {
    if (isPaperMode) {
        if (paperPages.length > 0) {
            showConfirmModal('Revenir au mode numérique va retirer les photos ajoutées.', () => {
                isPaperMode = false; paperPages = []
                wrapper.innerHTML = ''
                const p = createTimePageHTML()
                wrapper.appendChild(p)
                setupInputLogic(p)
                updatePaperToggleButton(container)
                applyEditorSecurity(null, wrapper, container)
                zoomCtrl?.fitToScreen()
            }, container)
        } else {
            isPaperMode = false; paperPages = []
            wrapper.innerHTML = ''
            const p = createTimePageHTML()
            wrapper.appendChild(p)
            setupInputLogic(p)
            updatePaperToggleButton(container)
            applyEditorSecurity(null, wrapper, container)
            zoomCtrl?.fitToScreen()
        }
    } else {
        isPaperMode = true; paperPages = []
        renderPaperEditor(wrapper, container)
        updatePaperToggleButton(container)
        applyEditorSecurity({ isPaper: true, status: 'brouillon', authorId: currentUser.id }, wrapper, container)
    }
}

function updatePaperToggleButton(container) {
    const label = container.querySelector('#btnPaperLabel')
    if (isPaperMode) {
        if (label) label.textContent = 'Mode numérique'
    } else {
        if (label) label.textContent = 'Feuille papier'
    }
}

function renderPaperEditor(wrapper, container) {
    wrapper.innerHTML = ''
    const savedDate = new Date().toISOString().split('T')[0]
    const wrap = document.createElement('div')
    wrap.className = 'paper-mode-container'
    wrap.innerHTML = `
        <div class="paper-mode-header">
            <div class="pmh-field"><label>Employé</label><input type="text" class="paper-emp-input" placeholder="${myUserName}" value="${myUserName}"></div>
            <div class="pmh-field"><label>Semaine du</label><input type="date" class="paper-week-input" value="${savedDate}"></div>
            <div class="pmh-field"><label>Total heures</label><input type="number" step="0.5" class="paper-hours-input" placeholder="Ex: 40"></div>
        </div>
        <div class="paper-mode-body" id="paper-mode-body"></div>
        <button type="button" class="paper-add-page-btn" id="paper-add-page-btn">
            <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Ajouter une page
        </button>
    `
    wrapper.appendChild(wrap)
    wrap.querySelector('#paper-add-page-btn').addEventListener('click', () => container.querySelector('#pim-gallery-input').click())
    renderPaperPagesInEditor(wrapper)
}

function renderPaperPagesInEditor(wrapper) {
    const body = wrapper.querySelector('#paper-mode-body')
    if (!body) return
    body.innerHTML = ''
    if (paperPages.length === 0) {
        body.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#aaa">
            <svg viewBox="0 0 24 24" width="48" height="48" style="stroke:#555;fill:none;stroke-width:1.5;margin-bottom:16px"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <p style="font-size:15px;font-weight:600;margin:0 0 8px">Aucune photo ajoutée</p>
            <p style="font-size:13px;margin:0">Importez une photo de votre feuille de temps papier.</p>
        </div>`
        return
    }
    const list = document.createElement('div')
    paperPages.forEach((p, idx) => {
        const pageEl = document.createElement('div')
        pageEl.className = 'paper-page-display'
        pageEl.innerHTML = `
            <span class="ppd-num">Page ${idx + 1} / ${paperPages.length}</span>
            <img src="${p.dataUrl || p.url}" alt="Page ${idx + 1}">
        `
        list.appendChild(pageEl)
    })
    body.appendChild(list)
}

async function addPaperPages(fileList, wrapper) {
    if (!fileList?.length || !isPaperMode) return
    for (const file of Array.from(fileList)) {
        if (!file.type.startsWith('image/')) continue
        const dataUrl = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file) })
        paperPages.push({ file, dataUrl, uploaded: false })
    }
    renderPaperPagesInEditor(wrapper)
}

async function uploadAllTsPaperPages(container) {
    const progress = container.querySelector('#pimProgress')
    const progressText = container.querySelector('#pimProgressText')
    progress?.classList.add('show')
    try {
        for (let i = 0; i < paperPages.length; i++) {
            const p = paperPages[i]
            if (p.uploaded) continue
            if (progressText) progressText.textContent = `Téléversement page ${i + 1}/${paperPages.length}…`
            const ext = (p.file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg'
            const filePath = `feuilles-papier/${currentUser.id}/paper_${Date.now()}_${i}.${ext}`
            const { error } = await supabase.storage.from('pieces_jointes').upload(filePath, p.file, { contentType: p.file.type })
            if (error) throw error
            const { data: { publicUrl } } = supabase.storage.from('pieces_jointes').getPublicUrl(filePath)
            paperPages[i] = { ...p, url: publicUrl, name: p.file.name, path: filePath, uploaded: true }
        }
    } finally { progress?.classList.remove('show') }
}

async function saveCurrentPaperTimesheet(isSending, wrapper, viewDash, viewEditor, container) {
    if (paperPages.length === 0) { showAlertModal('Veuillez ajouter au moins une page (photo).', container); return }
    const btnSave = container.querySelector('#btnSave')
    const origHTML = btnSave?.innerHTML
    if (btnSave) { btnSave.disabled = true; btnSave.textContent = 'Sauvegarde...' }
    try {
        await uploadAllTsPaperPages(container)
        const empInp = wrapper.querySelector('.paper-emp-input')
        const weekInp = wrapper.querySelector('.paper-week-input')
        const hoursInp = wrapper.querySelector('.paper-hours-input')
        const empName = empInp?.value.trim() || myUserName
        const weekDate = weekInp?.value || new Date().toISOString().split('T')[0]
        const totalH = parseFloat(hoursInp?.value) || 0
        const periode = `Semaine du ${weekDate}`
        const tsId = currentSheetId || 'TS-' + Date.now()
        const existing = timesheetsData.find(s => s.id === currentSheetId)
        let currentStatus = existing?.status || 'brouillon'
        if (isSending) currentStatus = 'envoye'
        const { error } = await withRetry(() => supabase.from('feuilles_de_temps').upsert({
            id: tsId, employe_nom: empName, periode, pages_data: [], total_heures: totalH, total_heures_sup: 0,
            status: currentStatus,
            author_id: existing ? existing.authorId : currentUser.id,
            author_name: existing ? existing.authorName : myUserName,
            is_paper: true,
            paper_pages: paperPages.map(p => ({ url: p.url, name: p.name || 'page.jpg', path: p.path }))
        }))
        if (error) throw error
        currentSheetId = tsId
        await loadData(true, container)
        if (isSending) { showAlertModal('Feuille de temps papier envoyée au bureau !', container); showDashboard(viewDash, viewEditor, container) }
        else showAlertModal('Feuille de temps papier sauvegardée !', container)
    } catch (e) { showAlertModal('❌ Erreur : ' + (e.message || 'scroll'), container) }
    finally { if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = origHTML } }
}

function restorePaperMode(sheet, wrapper, container) {
    isPaperMode = true
    paperPages = (sheet.paperPages || []).map(p => ({ url: p.url, name: p.name, path: p.path, uploaded: true }))
    renderPaperEditor(wrapper, container)
    updatePaperToggleButton(container)
    const hoursInp = wrapper.querySelector('.paper-hours-input')
    if (hoursInp && sheet.total_heures) hoursInp.value = sheet.total_heures
    const empInp = wrapper.querySelector('.paper-emp-input')
    if (empInp && sheet.employe) empInp.value = sheet.employe
}

// ── Page HTML ────────────────────────────────────────────────────────────────
function createTimePageHTML() {
    const page = document.createElement('div')
    page.className = 'page'
    let rows = ''
    for (let i = 0; i < 15; i++) {
        rows += `<tr>
            <td><input type="text" class="cell-input date-input" placeholder="JJ/MM/AAAA"></td>
            <td><input type="text" class="cell-input"></td>
            <td><input type="text" class="cell-input" style="text-align:left;padding-left:10px"></td>
            <td class="td-heure"><input type="number" step="0.5" class="cell-input heure-input"><span class="h-suffix">h</span></td>
        </tr>`
    }
    page.innerHTML = `
        <div class="header-main"><img src="/assets/logo_dussault.png" alt="F. Dussault" onerror="this.style.display='none'"></div>
        <div class="ts-title">FEUILLE DE TEMPS</div>
        <div class="ts-emp-info">
            <div class="ts-row">
                <span style="width:130px">Nom de l'employé:</span>
                <input type="text" class="input-nom ts-field" value="${myUserName}">
            </div>
            <div class="ts-row" style="margin-top:5px">
                <span style="width:90px">Semaine du:</span>
                <input type="text" class="input-semaine-debut ts-field date-input" placeholder="JJ/MM/AAAA">
                <span style="margin:0 10px">au</span>
                <input type="text" class="input-semaine-fin ts-field date-input" placeholder="JJ/MM/AAAA">
            </div>
        </div>
        <table class="temps-table">
            <thead><tr><th style="width:13%">Date</th><th style="width:12%"># Bon</th><th style="width:61%">Adresse</th><th style="width:14%">Heures</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
    `
    return page
}

function setupInputLogic(pageElement) {
    function enforceDateFormat(e) {
        let v = e.target.value.replace(/\D/g, '').substring(0, 8)
        if (v.length > 4) v = v.substring(0, 2) + '/' + v.substring(2, 4) + '/' + v.substring(4, 8)
        else if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2)
        e.target.value = v
    }

    pageElement.querySelectorAll('.date-input').forEach(inp => inp.addEventListener('input', enforceDateFormat))


    const startInput = pageElement.querySelector('.input-semaine-debut')
    const endInput = pageElement.querySelector('.input-semaine-fin')
    const firstDateInput = pageElement.querySelector('.temps-table tbody tr:first-child .date-input')

    if (firstDateInput && startInput && endInput) {
        firstDateInput.addEventListener('input', function () {
            if (this.value.length !== 10) return
            const parts = this.value.split('/')
            if (parts.length !== 3) return
            const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
            if (isNaN(d.getTime())) return
            const start = new Date(d); start.setDate(d.getDate() - d.getDay())
            const end = new Date(start); end.setDate(start.getDate() + 6)
            const fmt = dt => `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
            startInput.value = fmt(start); endInput.value = fmt(end)
        })
    }

    const inputs = Array.from(pageElement.querySelectorAll('input'))
    inputs.forEach((input, index) => {
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault()
                const td = input.closest('td')
                if (td) {
                    const tr = td.closest('tr')
                    const colIdx = Array.from(tr.children).indexOf(td)
                    const nextTr = tr.nextElementSibling
                    if (nextTr) { const nextInp = nextTr.children[colIdx]?.querySelector('input'); if (nextInp) { nextInp.focus(); return } }
                }
                if (index + 1 < inputs.length) inputs[index + 1].focus()
            } else if (e.key === 'Backspace' && input.value === '') {
                if (index - 1 >= 0) inputs[index - 1].focus()
            }
        })

        input.addEventListener('paste', e => {
            e.preventDefault()
            const text = (e.clipboardData || window.clipboardData).getData('text')
            const rows = text.split(/\r\n|\n|\r/)
            const td = input.closest('td')
            if (!td) { input.value = text.trim(); return }
            const tr = td.closest('tr')
            const table = tr.closest('table')
            const startRow = Array.from(table.querySelectorAll('tbody tr')).indexOf(tr)
            const startCol = Array.from(tr.children).indexOf(td)
            const tableRows = table.querySelectorAll('tbody tr')
            rows.forEach((rowText, i) => {
                if (startRow + i >= tableRows.length || !rowText.trim()) return
                rowText.split('\t').forEach((cell, j) => {
                    const targetInp = tableRows[startRow + i].children[startCol + j]?.querySelector('input')
                    if (targetInp) { targetInp.value = cell.trim(); if (targetInp.classList.contains('date-input')) targetInp.dispatchEvent(new Event('input')) }
                })
            })
        })
    })
}

function duplicatePage(wrapper, zoomDisplay) {
    const pages = wrapper.querySelectorAll('.page')
    if (!pages.length) return
    const source = pages[pages.length - 1]
    const newPage = createTimePageHTML()
    wrapper.appendChild(newPage)
    setupInputLogic(newPage)
    const sourceInputs = source.querySelectorAll('input')
    const newInputs = newPage.querySelectorAll('input')
    sourceInputs.forEach((inp, i) => { if (newInputs[i]) newInputs[i].value = inp.value })
    zoomCtrl?.applyZoom(zoomCtrl?.current ?? 1.0)
}

function deletePage(wrapper, container) {
    if (wrapper.children.length > 1) { wrapper.removeChild(wrapper.lastElementChild) }
    else showAlertModal('Impossible de supprimer la dernière page.', container)
}

// ── Autosave ────────────────────────────────────────────────────────────────
function startAutosave(wrapper) {
    if (autosave) { try { autosave.stop() } catch {} }
    autosave = createAutosave({ module: 'feuille_de_temps', containerSelector: '#zoom-wrapper', draftIdGetter: () => currentSheetId })
    autosave.start()
    if (autosave.hasDraft()) autosave.restore()
}

function stopAutosave() {
    if (autosave) { try { autosave.stop() } catch {}; autosave = null }
}

function clearAutosaveCurrent() {
    if (autosave) { try { autosave.clear() } catch {} }
}

// ── Zoom — géré par zoomCtrl (zoom.js) ────────────────────────────────────────
// Voir createZoomController() dans render()

// ── Utilitaires ───────────────────────────────────────────────────────────────
function showConfirmModal(msg, callback, container, title = 'Confirmation') {
    container.querySelector('#confirmTitle').textContent = title
    container.querySelector('#confirmMsg').textContent = msg
    confirmCallback = callback
    container.querySelector('#confirmModal').classList.add('open')
}

function closeConfirmModal(container) {
    container.querySelector('#confirmModal').classList.remove('open')
    confirmCallback = null
}

function showAlertModal(msg, container) {
    container.querySelector('#alertMsg').textContent = msg
    container.querySelector('#alertModal').classList.add('open')
}
