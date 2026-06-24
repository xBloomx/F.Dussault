// src/views/facture.js

import { supabase } from '../supabase.js'
import { currentUser, currentRole, currentProfil, hasPermission } from '../auth.js'
import { sanitize } from '../shared/sanitize.js'
import { friendlyError } from '../shared/errorMsg.js'
import { createAutosave } from '../shared/autosave.js'
import { canArchive, canSeeAllArchives, canRestore, confirmAndArchive, confirmAndRestore } from '../shared/archive.js'
import { openPdfPreview } from '../shared/pdfExport.js'
import { attachAll, watchContainer, refreshIndicators } from '../shared/signature.js'
import { withRetry } from '../shared/withRetry.js'
import { enqueueOfflineSave } from '../shared/offlineQueue.js'
import { createZoomController } from '../shared/zoom.js'

// ── État local ───────────────────────────────────────────────────────────────
let myUserName = 'Employé'
let currentInvTab = 'mine'
let invoicesData = []
let currentPage = 0
const PAGE_SIZE = 25
let hasMore = false
let currentInvoiceId = null
let autosave = null
let confirmCallback = null
let zoomCtrl = null
let isPaperMode = false
let paperPages = []
let invoicePageCount = 0
let globalSigCount = 0
let archiveSelection = new Set()
let _onResizeFact = null
let _onClickFact = null
let _searchDebounce = null
let clientNameList = []

// ── Render principal ──────────────────────────────────────────────────────────
export async function render(container) {
    myUserName = currentProfil?.prenom_nom || 'Employé'
    currentInvTab = 'mine'
    currentInvoiceId = null
    isPaperMode = false
    paperPages = []
    invoicePageCount = 0
    globalSigCount = 0
    archiveSelection = new Set()
    stopAutosave()

    container.innerHTML = `
    <style>
        /* --blue-bg défini dans styles.css : #d1e9ff */
        .fact-main { background: var(--bg-dark); color: var(--text-main); height: 100%; display: flex; flex-direction: column; overflow: hidden; font-family: var(--font-sans); }

        /* ── Badges statut (extra — les globaux sont dans styles.css) ── */
        .b-paper     { background: rgba(91,192,235,0.14); color: #5bc0eb; }
        .badges-wrap { display: inline-flex; flex-wrap: wrap; gap: 6px; align-items: center; }

        /* ── Tabs ── */
        .tabs-container { display: flex; gap: 8px; flex-wrap: wrap; }
        .tab-count { background: rgba(255,255,255,0.12); color: inherit; font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 10px; min-width: 18px; text-align: center; }
        .tab.active .tab-count { background: rgba(26,27,34,0.14); }

        /* ── En-tête colonnes ── */
        .inv-list-header { display: grid; grid-template-columns: 100px 1fr 150px 90px 38px; gap: 14px; padding: 0 18px; margin-bottom: -2px; margin-top: -14px; }
        #inv-compteur { margin-top: -14px; }
        .inv-list-header span { font-size: 10.5px; font-weight: 700; color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.6px; }
        .inv-list-header .inv-h-right { text-align: right; }

        /* ── Toolbar ── */
        .toolbar { display: flex; flex-direction: row; align-items: center; gap: 10px; background: var(--bg-panel); border: 1px solid var(--border); padding: 10px; border-radius: var(--r-xl,14px); }
        .toolbar .select-wrap { min-width: 180px; flex-shrink: 0; }
        .select-wrap { position: relative; display: block; }
        .select-wrap select { width: 100%; -webkit-appearance: none; appearance: none; padding: 10px 36px 10px 14px; background: var(--bg-sunken,#15161c); border: 1px solid var(--border); color: #fff; border-radius: var(--r-lg,10px); font-size: 13px; outline: none; cursor: pointer; font-family: inherit; transition: border-color var(--t-base); }
        .select-wrap select:focus { border-color: var(--brand-yellow); }
        .select-wrap .sel-chevron { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; width: 16px; height: 16px; stroke: var(--text-faint); fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
        .discrete-stats { color: var(--text-faint); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 2px 4px; }
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input { width: 100%; background: var(--bg-sunken,#15161c); border: 1px solid var(--border); color: #fff; padding: 10px 14px 10px 38px; border-radius: var(--r-lg,10px); font-size: 14px; outline: none; transition: border-color var(--t-base); font-family: inherit; }
        .search-box input:focus { border-color: var(--brand-yellow); }
        .search-icon { position: absolute; left: 12px; color: var(--text-faint); pointer-events: none; display: flex; align-items: center; }
        .search-icon svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; }

        /* ── Liste factures ── */
        .invoice-list { display: flex; flex-direction: column; gap: 8px; padding-bottom: 30px; }
        .invoice-item { background: var(--bg-panel); padding: 12px 18px; border-radius: var(--r-lg,10px); display: grid; grid-template-columns: 100px 1fr 150px 90px 38px; align-items: center; gap: 14px; cursor: pointer; border: 1px solid var(--border); border-left: 3px solid transparent; transition: background var(--t-base), border-color var(--t-base), transform var(--t-fast); }
        .invoice-item:hover { transform: translateX(3px); background: var(--bg-panel-2); border-left-color: var(--brand-yellow); }
        .inv-id          { font-weight: 700; color: var(--brand-yellow); font-size: 13px; font-family: var(--font-mono); }
        .inv-col-client  { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .inv-client      { font-weight: 700; font-size: 14px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .inv-author      { font-size: 12px; color: var(--text-faint); }
        .inv-status      { display: flex; align-items: center; }
        .inv-date        { color: var(--text-muted); font-size: 13px; text-align: right; }
        .inv-actions     { display: flex; justify-content: flex-end; }
        .btn-icon   { background: var(--bg-panel-2); border: 1px solid var(--border); width: 32px; height: 32px; border-radius: var(--r-md,8px); display: flex; justify-content: center; align-items: center; cursor: pointer; color: var(--text-muted); transition: all var(--t-base); }
        .btn-icon svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-delete { background: var(--tint-red); color: var(--status-red); border-color: transparent; }
        .btn-delete:hover { background: var(--status-red); color: #fff; }

        /* Archive selection */
        .arc-selectable { position: relative; padding-left: 48px !important; }
        .arc-check { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--border-strong,#3d3e48); background: transparent; display: flex; align-items: center; justify-content: center; transition: all var(--t-fast); pointer-events: none; }
        .arc-selected .arc-check { border-color: var(--status-blue); background: var(--status-blue); }
        .arc-selected { background: rgba(59,130,246,0.05) !important; border-left-color: var(--status-blue) !important; }

        /* Load more */
        .load-more-btn { width: 100%; padding: 12px; background: transparent; color: var(--text-muted); border: 1px dashed var(--border); border-radius: var(--r-lg,10px); cursor: pointer; font-size: 13px; font-weight: 600; margin-top: 4px; font-family: inherit; transition: border-color var(--t-base); }
        .load-more-btn:hover { border-color: var(--brand-yellow); color: var(--brand-yellow); }

        /* ── Éditeur ── */
        #view-editor { display: none; flex-direction: column; height: 100%; }
        .top-bar { height: auto; min-height: 70px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 18px; background: var(--bg-panel); border-bottom: 1px solid var(--border); z-index: 101; flex-wrap: wrap; }
        .action-btn { background: var(--brand-yellow); color: var(--text-on-yellow,#1a1b22); border: 1px solid transparent; padding: 8px 14px; border-radius: var(--r-pill,999px); font-weight: 600; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 7px; white-space: nowrap; transition: all var(--t-base); font-family: inherit; }
        .action-btn:hover { background: var(--brand-yellow-hover); }
        .action-btn svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-back   { background: var(--bg-panel-2) !important; color: var(--text-muted) !important; border: 1px solid var(--border) !important; }
        .btn-back:hover { background: var(--bg-panel-3) !important; color: #fff !important; }
        .btn-send   { background: var(--status-green)  !important; color: #fff !important; border-color: transparent !important; }
        .btn-send:hover { background: #16a34a !important; }
        .btn-paper  { background: #e8730a !important; color: #fff !important; border-color: transparent !important; }
        .btn-unlock { background: var(--status-orange) !important; color: #1a1b22 !important; border-color: transparent !important; }
        .btn-return { background: var(--status-red) !important; color: #fff !important; border-color: transparent !important; }
        @media (max-width: 1024px) {
            .top-bar { padding: 10px 80px 10px 10px; gap: 8px; height: 60px; overflow-x: auto; justify-content: flex-start; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; }
            .top-bar::-webkit-scrollbar { display: none; }
            .top-bar .action-btn, .office-status-panel { flex-shrink: 0; font-size: 11px; padding: 7px 12px; }
        }

        /* Office status panel */
        .office-status-panel { background: var(--bg-sunken,#15161c); border: 1px solid var(--border); padding: 8px 16px; border-radius: var(--r-pill,999px); display: flex; align-items: center; gap: 8px; white-space: nowrap; flex-shrink: 0; cursor: pointer; color: #fff; font-weight: 600; font-size: 12px; transition: background var(--t-base); }
        .office-status-panel:hover { background: var(--bg-panel-2); }
        .office-status-panel svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .status-dropdown { position: fixed; background: var(--bg-panel-2); backdrop-filter: blur(10px); border: 1px solid var(--border); border-radius: var(--r-xl,14px); overflow: hidden; display: none; box-shadow: var(--shadow-lg); z-index: 9999; min-width: 200px; flex-direction: column; }
        .status-dropdown.show { display: flex; }
        .status-option { padding: 14px 18px; color: var(--text-muted); cursor: pointer; transition: background var(--t-fast); font-size: 13px; font-weight: 600; border-bottom: 1px solid var(--border); }
        .status-option:last-child { border-bottom: none; }
        .status-option:hover { background: var(--bg-panel-3); color: #fff; }

        /* ── Scroll/zoom ── */
        .scroll-area { flex: 1; overflow: auto; padding: 15px 0; display: block; touch-action: none; }
        #invoice-container { display: block; width: 8.5in; transform-origin: 0 0; padding-bottom: 50px; }
        .zoom-controls { position: fixed; bottom: 20px; right: 20px; background: var(--bg-panel-2); padding: 5px 14px; border-radius: 999px; display: flex; align-items: center; gap: 14px; box-shadow: var(--shadow-md); z-index: 2000; border: 1px solid var(--border); }
        .zoom-controls button { background: var(--brand-yellow); border: none; width: 28px; height: 28px; border-radius: 50%; font-weight: bold; font-size: 16px; cursor: pointer; display: flex; justify-content: center; align-items: center; color: #1a1b22; }
        .zoom-controls span { color: #fff; font-size: 12px; font-weight: 700; min-width: 44px; text-align: center; }

        /* Bannière correction */
        .correction-banner { background: var(--tint-red); border: 1px solid var(--status-red); border-radius: var(--r-lg,10px); padding: 12px 16px; margin: 0 0 14px; color: var(--status-red); font-size: 13px; display: flex; align-items: flex-start; gap: 10px; }

        /* Paper progress */
        #paper-progress { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); background: var(--bg-panel); color: #fff; padding: 24px 36px; border-radius: var(--r-xl,14px); box-shadow: var(--shadow-lg); z-index: 9999; text-align: center; display: none; border: 1px solid var(--border); }
        #paper-progress.show { display: block; }
        #paper-progress .pp-spinner { width: 32px; height: 32px; margin: 0 auto 12px; border: 3px solid var(--border); border-top-color: var(--status-blue); border-radius: 50%; animation: pp-spin 0.8s linear infinite; }
        @keyframes pp-spin { to { transform: rotate(360deg); } }

        /* ── Page papier ── */
        .page { width: 8.5in; height: 11in; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.5); box-sizing: border-box; display: flex; flex-direction: column; position: relative; margin: 0 auto 20px; color: black; padding: 0.25in; flex-shrink: 0; }
        input { outline: none; border-radius: 0; }
        input:focus { background-color: transparent !important; border-bottom: 2px solid #000 !important; }
        .top-section { width: 100%; }
        .header-main { width: 100%; margin-top: -15px; margin-bottom: 0; }
        .header-main img { width: 100%; height: auto; display: block; }
        .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 2px; }
        .info-column { display: flex; flex-direction: column; gap: 1px; }
        .field { display: flex; align-items: flex-end; font-size: 12px; font-weight: bold; min-height: 22px; }
        .field label { white-space: nowrap; margin-right: 5px; }
        .field input { background: var(--blue-bg) !important; border: none; border-bottom: 1px solid black; flex-grow: 1; height: 18px; padding: 0 5px; }
        .banner-cmmtq { width: 100%; margin: 7px 0 5px; text-align: center; }
        .banner-cmmtq img { width: 100%; height: auto; display: block; }
        .main-table { width: 100%; border-collapse: collapse; border: none; margin-bottom: 10px; }
        .main-table thead { border-top: 4px double black; }
        .main-table th { border: 1px solid black; font-size: 9px; background: #eee; padding: 2px; }
        .main-table td { border: 1px solid black; height: 24px; background: var(--blue-bg); padding: 0; }
        .main-table tbody tr:last-child td { border-bottom: 4px double black; }
        .main-table input { width: 100%; height: 100%; background: transparent; border: none; padding: 0 5px; box-sizing: border-box; font-size: 12px; color: black; font-weight: bold; }
        .desc-textarea { width: 100%; height: 22px; background: transparent; border: none; padding: 0 5px; box-sizing: border-box; font-size: 12px; color: black; font-weight: bold; resize: none; overflow: hidden; line-height: 22px; font-family: inherit; display: block; white-space: nowrap; }
        .bottom-section { margin-top: auto; width: 100%; }
        .time-wrapper { width: 100%; border: 1px solid black; border-collapse: collapse; table-layout: fixed; }
        .time-label-col { width: 110px; border-right: 1px solid black; padding: 5px; vertical-align: top; }
        .time-label-col span { font-size: 8px; font-weight: bold; }
        .time-label-col h2 { font-size: 18px; margin: 5px 0 0; font-weight: 900; }
        .inner-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .row-headers td { border-right: 1px solid black; border-bottom: 1px solid black; height: 30px; font-size: 8px; font-weight: bold; text-align: center; vertical-align: top; padding-top: 2px; }
        .row-sublabels td { font-size: 9px; font-weight: bold; text-align: center; padding: 2px 0; }
        .row-inputs td { padding: 2px 5px; vertical-align: middle; height: 26px; }
        .input-box { background: var(--blue-bg); border-bottom: 1px solid black; display: flex; align-items: center; padding: 0 3px; height: 18px; }
        .input-box input { background: transparent; border: none; width: 100%; height: 100%; text-align: center; font-size: 10px; font-weight: bold; color: black; }
        .flex-group { display: flex; align-items: center; gap: 4px; font-size: 9px; font-weight: bold; }
        .last-col { border-right: none !important; }
        .footer-grid { display: grid; grid-template-columns: 1fr 1fr 150px; align-items: end; margin-top: 5px; gap: 10px; }
        .sig-box { width: 100%; text-align: center; }
        .display-sig { border: none; border-bottom: 1px solid #000; background: var(--blue-bg); width: 100%; height: 50px; cursor: pointer; object-fit: contain; }
        .sig-text { font-size: 10px; font-weight: bold; margin-top: 2px; }
        .invoice-num-box { text-align: right; padding-bottom: 5px; display: flex; justify-content: flex-end; align-items: flex-end; }
        .red-invoice-input { color: #dc3545; font-weight: bold; font-size: 18px; font-family: 'Courier New', monospace; text-align: right; border: none; background: var(--blue-bg); width: 100%; margin: 0; padding: 0 5px; }

        /* ── Modales ── */
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; z-index: 4000; justify-content: center; align-items: center; padding: env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px); box-sizing: border-box; }
        .custom-modal-overlay.open { display: flex; }
        .custom-modal-card { background: var(--bg-panel); width: 360px; padding: 24px; border-radius: var(--r-xl,14px); border: 1px solid var(--border); text-align: center; box-shadow: var(--shadow-lg); }
        .custom-modal-title { font-size: 17px; color: var(--brand-yellow); margin-bottom: 14px; font-weight: 700; }
        .custom-modal-msg { color: var(--text-muted); margin-bottom: 22px; font-size: 14px; line-height: 1.5; }
        .custom-modal-actions { display: flex; justify-content: center; gap: 10px; }
        .btn-modal-cancel  { background: var(--bg-panel-2); color: var(--text-muted); border: 1px solid var(--border); padding: 10px 18px; border-radius: var(--r-lg,10px); cursor: pointer; font-weight: 600; font-size: 13px; font-family: inherit; }
        .btn-modal-confirm { background: var(--status-red); color: #fff; border: none; padding: 10px 18px; border-radius: var(--r-lg,10px); cursor: pointer; font-weight: 700; font-size: 13px; font-family: inherit; }
        .btn-modal-ok { background: var(--brand-yellow); color: #1a1b22; border: none; padding: 10px 28px; border-radius: var(--r-lg,10px); cursor: pointer; font-weight: 700; font-size: 13px; font-family: inherit; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (min-width: 769px) and (max-width: 1024px) {
            #view-dashboard { padding: 20px; }
            .invoice-item { grid-template-columns: 1fr auto; grid-template-areas: "id id" "clientcell clientcell" "status date"; gap: 4px 12px; padding: 16px; position: relative; }
            .inv-id { grid-area: id; } .inv-col-client { grid-area: clientcell; }
            .inv-status { grid-area: status; } .inv-date { grid-area: date; text-align: right; }
            .inv-actions { position: absolute; top: 14px; right: 14px; }
        }
        /* ── Mobile header ── */
        .fact-mobile-header { display: none; align-items: center; gap: 10px; }
        .fact-mobile-title { flex: 1; font-size: 22px; font-weight: 700; color: #fff; margin: 0; }
        .fact-mobile-menu-btn { background: none; border: none; color: var(--text-muted); padding: 4px; cursor: pointer; display: flex; align-items: center; }
        .fact-mobile-menu-btn svg { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 2.2; stroke-linecap: round; }
        .fact-mobile-add-btn { background: var(--brand-yellow); border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .fact-mobile-add-btn svg { width: 18px; height: 18px; stroke: #1a1b22; fill: none; stroke-width: 2.5; }
        .fact-mobile-stats { display: none; font-size: 12px; color: var(--text-faint); margin-top: -6px; }

        @media (max-width: 768px) {
            /* ── Layout général ── */
            #view-dashboard { padding: 16px 16px 12px; gap: 12px; }
            .fact-mobile-header { display: flex; align-items: center; }
            .fact-mobile-title { font-size: 26px; font-weight: 800; }
            .fact-mobile-add-btn { width: 42px; height: 42px; border-radius: 50%; }
            .fact-mobile-add-btn svg { width: 20px; height: 20px; }
            .fact-mobile-stats { display: block; font-size: 13px; color: var(--text-faint); margin-top: -4px; }
            .view-header { display: none; }
            .inv-list-header { display: none; }
            #inv-compteur { display: none; }
            .zoom-controls { display: none !important; }

            /* ── Toolbar mobile : search pleine largeur ── */
            .toolbar { padding: 0; background: transparent; border: none; gap: 8px; align-items: center; }
            .search-box input { border-radius: var(--r-xl,14px); font-size: 14px; padding: 12px 14px 12px 40px; }
            /* ── Filtre statut compact (visible seulement sur onglet Toutes) ── */
            #statusFilterWrap { display: none; width: 42px; flex-shrink: 0; }
            #statusFilterWrap select { width: 42px; height: 42px; padding: 0; color: transparent; background: var(--bg-sunken); border: 1px solid var(--border); border-radius: var(--r-xl,14px); -webkit-appearance: none; appearance: none; cursor: pointer; }
            #statusFilterWrap select option { color: var(--text-main); background: var(--bg-panel); }
            #statusFilterWrap .sel-chevron { right: 50%; transform: translate(50%,-50%); }
            /* ── Tabs : pills avec compteurs ── */
            #invoice-tabs { display: flex !important; flex-direction: row; flex-wrap: nowrap; overflow-x: auto; gap: 8px; scrollbar-width: none; }
            #invoice-tabs::-webkit-scrollbar { display: none; }
            #invoice-tabs .tab { padding: 7px 16px; font-size: 13px; border-radius: 999px; cursor: pointer; background: var(--bg-panel-2, #2b2c36); border: 1.5px solid var(--border-strong, #3d3e48); color: var(--text-muted); gap: 6px; }
            #invoice-tabs .tab.active { background: #fff; color: #1a1b22; border-color: #fff; font-weight: 700; }
            #invoice-tabs .tab svg { display: none; }
            #invoice-tabs .tab .tab-count { background: rgba(0,0,0,0.12); color: inherit; font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 999px; }
            #invoice-tabs .tab.active .tab-count { background: rgba(26,27,34,0.14); }

            /* ── Carte facture mobile ── */
            .invoice-item {
                display: grid;
                grid-template-columns: 1fr auto;
                grid-template-rows: auto auto auto;
                gap: 2px 8px;
                padding: 14px 16px;
                border-radius: var(--r-xl,14px);
            }
            .inv-id    { grid-column: 1; grid-row: 1; align-self: center; font-size: 12px; }
            .inv-status { grid-column: 2; grid-row: 1; justify-content: flex-end; align-self: start; }
            .inv-col-client { grid-column: 1; grid-row: 2 / 4; display: flex; flex-direction: column; justify-content: space-between; gap: 2px; }
            .inv-client { font-size: 15px; font-weight: 700; white-space: normal; }
            .inv-author { font-size: 12px; margin-top: 2px; }
            .inv-date  { grid-column: 2; grid-row: 3; text-align: right; font-size: 12px; align-self: end; color: var(--text-faint); }
            .inv-actions { display: none; }
        }
    </style>

    <svg style="display:none">
        <symbol id="fic-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></symbol>
        <symbol id="fic-plus" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></symbol>
        <symbol id="fic-user" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></symbol>
        <symbol id="fic-inbox" viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></symbol>
        <symbol id="fic-archive" viewBox="0 0 24 24"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></symbol>
        <symbol id="fic-trash" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></symbol>
        <symbol id="fic-back" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></symbol>
        <symbol id="fic-save" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></symbol>
        <symbol id="fic-send" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></symbol>
        <symbol id="fic-print" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></symbol>
        <symbol id="fic-camera" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></symbol>
        <symbol id="fic-file-plus" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></symbol>
        <symbol id="fic-copy" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></symbol>
        <symbol id="fic-file-minus" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></symbol>
        <symbol id="fic-eraser" viewBox="0 0 24 24"><path d="M20 20H7l-3-3a2.828 2.828 0 0 1 0-4l10-10a2.828 2.828 0 0 1 4 0l3 3a2.828 2.828 0 0 1 0 4l-7 7"/><line x1="10" y1="10" x2="17" y2="17"/></symbol>
        <symbol id="fic-unlock" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></symbol>
        <symbol id="fic-return" viewBox="0 0 24 24"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></symbol>
        <symbol id="fic-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></symbol>
        <symbol id="fic-chevron-down" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></symbol>
        <symbol id="fic-alert" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></symbol>
        <symbol id="fic-file-text" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></symbol>
        <symbol id="fic-x" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></symbol>
    </svg>

    <div class="fact-main">
        <div id="view-dashboard" class="view">
            <!-- En-tête mobile -->
            <div class="fact-mobile-header">
                <button class="fact-mobile-menu-btn" id="fact-menu-btn" aria-label="Menu">
                    <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </button>
                <h2 class="fact-mobile-title">Factures</h2>
                <button class="fact-mobile-add-btn" id="btnNewInvoiceMobile" aria-label="Nouvelle facture">
                    <svg viewBox="0 0 24 24"><use href="#fic-plus"/></svg>
                </button>
            </div>
            <div class="fact-mobile-stats" id="fact-mobile-stats"></div>

            <!-- En-tête desktop -->
            <div class="view-header">
                <div>
                    <h1>Factures</h1>
                    <p class="sub" id="fact-header-stats"></p>
                </div>
                <div class="actions">
                    <button class="btn btn-primary btn-pill" id="btnNewInvoice">
                        <svg viewBox="0 0 24 24"><use href="#fic-plus"/></svg>
                        Nouvelle facture
                    </button>
                </div>
            </div>

            <div class="toolbar">
                <div class="search-box">
                    <span class="search-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                    <input type="text" id="searchInput" placeholder="Rechercher (Nom, Tél, Adresse…)">
                </div>
                <div class="select-wrap" id="statusFilterWrap">
                    <select id="statusFilter">
                        <option value="">Tous les statuts</option>
                        <option value="envoye">Reçu (À traiter)</option>
                        <option value="traite">Traité</option>
                        <option value="attente">À corriger</option>
                        <option value="paye">Facture payée</option>
                    </select>
                    <svg class="sel-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
            </div>

            <div id="invoice-tabs" style="display:flex;gap:8px;flex-shrink:0;flex-wrap:nowrap;min-height:38px;padding:2px 0">
                <button id="tab-mine" style="display:inline-flex;align-items:center;gap:6px;padding:7px 16px;font-size:13px;font-weight:700;border-radius:999px;cursor:pointer;background:#ffffff;color:#1a1b22;border:2px solid #ffffff;white-space:nowrap;font-family:inherit;flex-shrink:0">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Mes factures <span id="tab-count-mine" style="display:none"></span>
                </button>
                <button id="tab-all" style="display:inline-flex;align-items:center;gap:6px;padding:7px 16px;font-size:13px;font-weight:600;border-radius:999px;cursor:pointer;background:#2b2c36;color:#a0a0b0;border:1.5px solid #3d3e48;white-space:nowrap;font-family:inherit;flex-shrink:0">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                    Toutes <span id="tab-count-all" style="display:none"></span>
                </button>
                <button id="tab-archives" style="display:inline-flex;align-items:center;gap:6px;padding:7px 16px;font-size:13px;font-weight:600;border-radius:999px;cursor:pointer;background:#2b2c36;color:#a0a0b0;border:1.5px solid #3d3e48;white-space:nowrap;font-family:inherit;flex-shrink:0">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                    Archives
                </button>
            </div>
            <div id="inv-compteur" class="discrete-stats"></div>
            <div class="inv-list-header">
                <span>Numéro</span>
                <span>Client / Auteur</span>
                <span>Statut</span>
                <span class="inv-h-right">Date</span>
                <span></span>
            </div>
            <div class="invoice-list" id="invoiceListContainer"></div>
        </div>

        <!-- Dropdown statut bureau -->
        <div class="status-dropdown" id="statusOptionsMenu">
            <div class="status-option" data-status="envoye">Reçu (À traiter)</div>
            <div class="status-option" data-status="traite">Traité</div>
            <div class="status-option" data-status="attente">À corriger</div>
            <div class="status-option" data-status="paye">Facture payée</div>
        </div>

        <div id="view-editor">
            <div class="top-bar" id="editor-top-bar">
                <button class="action-btn btn-back" id="btnBack">
                    <svg viewBox="0 0 24 24"><use href="#fic-back"/></svg> Retour
                </button>
                <button class="action-btn btn-save" id="btnSave">
                    <svg viewBox="0 0 24 24"><use href="#fic-save"/></svg> Sauvegarder
                </button>
                <button class="action-btn btn-send" id="btnSend">
                    <svg viewBox="0 0 24 24"><use href="#fic-send"/></svg> Envoyer au bureau
                </button>
                <button class="action-btn btn-paper" id="btnPaper">
                    <svg viewBox="0 0 24 24" id="btnPaperIcon"><use href="#fic-camera"/></svg>
                    <span id="btnPaperLabel">Facture papier</span>
                </button>
                <button class="action-btn btn-unlock" id="btnUnlock" style="display:none">
                    <svg viewBox="0 0 24 24"><use href="#fic-unlock"/></svg> Débloquer
                </button>
                <button class="action-btn btn-return" id="btnReturn" style="display:none">
                    <svg viewBox="0 0 24 24"><use href="#fic-return"/></svg> Renvoyer (Correction)
                </button>
                <div id="office-status-div" class="office-status-panel" style="display:none">
                    <svg viewBox="0 0 24 24"><use href="#fic-check"/></svg>
                    <span id="current-status-text">Reçu (À traiter)</span>
                    <svg viewBox="0 0 24 24" style="width:12px;height:12px;margin-left:auto"><use href="#fic-chevron-down"/></svg>
                </div>
                <div style="flex:1"></div>
                <button class="action-btn" id="btnPdf">
                    <svg viewBox="0 0 24 24"><use href="#fic-print"/></svg> PDF / Imprimer
                </button>
                <button class="action-btn" id="btnAddPage">
                    <svg viewBox="0 0 24 24"><use href="#fic-file-plus"/></svg> Page
                </button>
                <button class="action-btn" id="btnDupPage">
                    <svg viewBox="0 0 24 24"><use href="#fic-copy"/></svg> Dupliquer
                </button>
                <button class="action-btn" id="btnDelPage">
                    <svg viewBox="0 0 24 24"><use href="#fic-file-minus"/></svg> Page
                </button>
                <button class="action-btn" id="btnClear">
                    <svg viewBox="0 0 24 24"><use href="#fic-eraser"/></svg> Effacer
                </button>
            </div>

            <div class="scroll-area" id="scrollArea">
                <div id="correction-banner" class="correction-banner" style="display:none">
                    <svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:var(--status-red);fill:none;stroke-width:2;margin-top:2px;flex-shrink:0"><use href="#fic-alert"/></svg>
                    <div>
                        <strong style="color:var(--status-red)">Facture renvoyée par le bureau pour correction :</strong><br>
                        <span id="correction-note-text" style="display:inline-block;margin-top:4px;color:var(--text-muted)"></span>
                    </div>
                </div>
                <div id="invoice-container"></div>
            </div>

            <div class="zoom-controls">
                <button id="btnZoomOut">−</button>
                <span id="zoom-level">100%</span>
                <button id="btnZoomIn">+</button>
                <button id="btnZoomReset" style="font-size:13px">↺</button>
            </div>
        </div>
    </div>

    <!-- Inputs cachés mode papier -->
    <input type="file" id="pim-camera-input" accept="image/*" capture="environment" style="display:none">
    <input type="file" id="pim-gallery-input" accept="image/*" multiple style="display:none">

    <!-- Progress papier -->
    <div id="paper-progress">
        <div class="pp-spinner"></div>
        <div id="paper-progress-text">Téléversement…</div>
    </div>

    <!-- Modal retour -->
    <div class="custom-modal-overlay" id="returnModal">
        <div class="custom-modal-card" style="text-align:left">
            <div class="custom-modal-title">↩️ Renvoyer pour correction</div>
            <div style="margin-bottom:14px">
                <label class="field-label">Note pour l'employé</label>
                <textarea id="returnNote" placeholder="Ex: Il manque le tarif horaire…"
                    style="width:100%;height:100px;background:var(--bg-sunken,#15161c);color:#fff;border:1px solid var(--border);padding:12px;border-radius:var(--r-lg,10px);font-family:inherit;font-size:14px;outline:none;resize:none;box-sizing:border-box"></textarea>
            </div>
            <div style="display:flex;justify-content:center;gap:10px;margin-top:14px">
                <button class="btn-modal-cancel" id="btnCloseReturnModal">Annuler</button>
                <button style="background:var(--status-red);color:#fff;border:none;padding:10px 18px;border-radius:var(--r-lg,10px);cursor:pointer;font-weight:700;font-size:13px;font-family:inherit" id="btnExecuteReturn">Renvoyer la facture</button>
            </div>
        </div>
    </div>

    <!-- Modal confirmation -->
    <div class="custom-modal-overlay" id="confirmModal">
        <div class="custom-modal-card">
            <div style="font-size:17px;font-weight:700;color:#fff;margin-bottom:14px">Confirmation</div>
            <div id="confirmMsg" class="custom-modal-msg"></div>
            <div class="custom-modal-actions">
                <button class="btn-modal-cancel" id="btnConfirmNo">Non</button>
                <button class="btn-modal-confirm" id="btnConfirmYes">Oui</button>
            </div>
        </div>
    </div>

    <!-- Modal alerte -->
    <div class="custom-modal-overlay" id="alertModal">
        <div class="custom-modal-card">
            <div style="color:var(--brand-yellow);font-size:17px;font-weight:700;margin-bottom:14px">Information</div>
            <div id="alertMsg" class="custom-modal-msg"></div>
            <div class="custom-modal-actions">
                <button class="btn-modal-ok" id="btnAlertOk">Compris</button>
            </div>
        </div>
    </div>
    `
    const _vd = container.querySelector('#view-dashboard')
    const _ve = container.querySelector('#view-editor')
    if (_vd) _vd.style.display = 'flex'
    if (_ve) _ve.style.display = 'none'

    await init(container)
    return cleanup
}

// ── Init ────────────────────────────────────────────────────────────────────
async function init(container) {
    const viewDash = container.querySelector('#view-dashboard')
    const viewEditor = container.querySelector('#view-editor')
    const invoiceContainer = container.querySelector('#invoice-container')
    const zoomDisplay = container.querySelector('#zoom-level')

    // Tabs
    if (!hasPermission('view_all_invoices')) {
        const tabAll = container.querySelector('#tab-all')
        if (tabAll) tabAll.style.display = 'none'
    }
    applyTabStyles(container)
    container.querySelector('#tab-mine').addEventListener('click', () => switchTab('mine', container))
    container.querySelector('#tab-all').addEventListener('click', () => switchTab('all', container))
    container.querySelector('#tab-archives').addEventListener('click', () => switchTab('archives', container))
    container.querySelector('#searchInput').addEventListener('keyup', () => { clearTimeout(_searchDebounce); _searchDebounce = setTimeout(() => renderInvoiceList(container, invoiceContainer), 300) })
    container.querySelector('#statusFilter').addEventListener('change', () => renderInvoiceList(container, invoiceContainer))

    // Dashboard
    container.querySelector('#btnNewInvoice').addEventListener('click', () => openNewInvoice(viewDash, viewEditor, invoiceContainer, zoomDisplay, container))
    container.querySelector('#btnNewInvoiceMobile')?.addEventListener('click', () => openNewInvoice(viewDash, viewEditor, invoiceContainer, zoomDisplay, container))
    container.querySelector('#fact-menu-btn')?.addEventListener('click', () => document.getElementById('topbar-mobile-menu-btn')?.click())

    // Éditeur
    container.querySelector('#btnBack').addEventListener('click', () => showDashboard(viewDash, viewEditor, container))
    container.querySelector('#btnSave').addEventListener('click', () => saveCurrentInvoice(false, invoiceContainer, viewDash, viewEditor, container))
    container.querySelector('#btnSend').addEventListener('click', () => {
        showConfirmModal("Une fois envoyée, cette facture sera verrouillée. L'envoyer au bureau ?", () => saveCurrentInvoice(true, invoiceContainer, viewDash, viewEditor, container), container)
    })
    container.querySelector('#btnPaper').addEventListener('click', () => togglePaperMode(invoiceContainer, viewDash, viewEditor, container))
    container.querySelector('#btnUnlock').addEventListener('click', () => unlockInvoice(invoiceContainer, container))
    container.querySelector('#btnReturn').addEventListener('click', () => openReturnModal(container))
    container.querySelector('#btnPdf').addEventListener('click', () => exporterPDF(invoiceContainer, container))
    container.querySelector('#btnAddPage').addEventListener('click', () => { invoiceContainer.appendChild(createInvoicePageHTML(invoiceContainer)); zoomCtrl?.applyZoom(zoomCtrl.current) })
    container.querySelector('#btnDupPage').addEventListener('click', () => duplicatePage(invoiceContainer, zoomDisplay))
    container.querySelector('#btnDelPage').addEventListener('click', () => deletePage(invoiceContainer, container))
    container.querySelector('#btnClear').addEventListener('click', () => {
        showConfirmModal('Effacer tout le contenu de la facture ?', () => {
            invoiceContainer.querySelectorAll('input, textarea.desc-textarea').forEach(i => i.value = '')
            invoiceContainer.querySelectorAll('.display-sig').forEach(img => img.src = '')
        }, container)
    })

    // Zoom — contrôleur interne indépendant du navigateur
    const scrollArea = container.querySelector('#scrollArea')
    zoomCtrl = createZoomController({
        container: invoiceContainer,
        scrollArea,
        zoomDisplay,
        docWidthPx: 816  // 8.5in @ 96dpi
    })
    zoomCtrl.attach()

    container.querySelector('#btnZoomOut').addEventListener('click', () => zoomCtrl.zoomOut())
    container.querySelector('#btnZoomIn').addEventListener('click', () => zoomCtrl.zoomIn())
    container.querySelector('#btnZoomReset').addEventListener('click', () => zoomCtrl.zoomReset())

    // Resize fenêtre — géré par zoomCtrl, mais garder la ref pour le cas éditeur ouvert
    const _onResizeFact_ = () => { if (viewEditor.style.display === 'flex') zoomCtrl.fitToScreen() }
    _onResizeFact = _onResizeFact_
    window.addEventListener('resize', _onResizeFact)

    // Statut bureau
    container.querySelector('#office-status-div').addEventListener('click', e => toggleStatusMenu(e, container))
    container.querySelectorAll('.status-option').forEach(opt => {
        opt.addEventListener('click', async () => {
            if (!hasPermission('view_all_invoices')) return
            container.querySelector('#statusOptionsMenu').classList.remove('show')
            const status = opt.dataset.status
            const labels = { envoye: 'Reçu (À traiter)', traite: 'Traité', attente: 'À corriger', paye: 'Facture payée' }
            container.querySelector('#current-status-text').textContent = labels[status] || status
            if (currentInvoiceId) {
                const { error } = await supabase.from('factures').update({ status }).eq('id', currentInvoiceId)
                if (error) showAlertModal(friendlyError(error), container)
                else { await loadData(true, container); showAlertModal('Statut mis à jour.', container) }
            }
        })
    })
    _onClickFact = () => container.querySelector('#statusOptionsMenu').classList.remove('show')
    window.addEventListener('click', _onClickFact)

    // Modal retour
    container.querySelector('#btnCloseReturnModal').addEventListener('click', () => closeModal('returnModal', container))
    container.querySelector('#btnExecuteReturn').addEventListener('click', () => executeReturnInvoice(viewDash, viewEditor, container))

    // Modales
    container.querySelector('#btnConfirmNo').addEventListener('click', () => closeConfirmModal(container))
    container.querySelector('#btnConfirmYes').addEventListener('click', () => { if (confirmCallback) confirmCallback(); closeConfirmModal(container) })
    container.querySelector('#btnAlertOk').addEventListener('click', () => closeModal('alertModal', container))

    // Mode papier inputs
    container.querySelector('#pim-camera-input').addEventListener('change', e => { addPaperPages(e.target.files, invoiceContainer); e.target.value = '' })
    container.querySelector('#pim-gallery-input').addEventListener('change', e => { addPaperPages(e.target.files, invoiceContainer); e.target.value = '' })

    // Textarea auto-jump à la cellule suivante quand ligne pleine
    setupDescTextareaJump(invoiceContainer)

    // Signature
    watchContainer(invoiceContainer)
    attachAll(invoiceContainer)

    await loadData(true, container)
    return cleanup
}

function cleanup() {
    stopAutosave()
    if (zoomCtrl) { zoomCtrl.destroy(); zoomCtrl = null }
    if (_onResizeFact) { window.removeEventListener('resize', _onResizeFact); _onResizeFact = null }
    if (_onClickFact) { window.removeEventListener('click', _onClickFact); _onClickFact = null }
}

// ── Données ─────────────────────────────────────────────────────────────────
async function loadData(reset = true, container) {
    if (reset) { currentPage = 0; invoicesData = [] }
    const from = currentPage * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase.from('factures').select('id,client,date,status,author_id,author_name,return_note,is_archived,input_values,sig_values,page_count,is_paper,paper_pages,created_at')
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
        hasMore = data.length > PAGE_SIZE
        const mapped = data.slice(0, PAGE_SIZE).map(db => ({
            id: db.id, client: db.client, date: db.date, status: db.status,
            inputValues: db.input_values || [], sigValues: db.sig_values || [],
            pageCount: db.page_count || 1, authorId: db.author_id, authorName: db.author_name,
            returnNote: db.return_note, isArchived: db.is_archived === true,
            isPaper: db.is_paper === true, paperPages: db.paper_pages || null,
            timestamp: new Date(db.created_at).getTime()
        }))
        invoicesData = reset ? mapped : [...invoicesData, ...mapped]
    }
    const inv = container.querySelector('#invoice-container')
    renderInvoiceList(container, inv)
}

const TAB_ACTIVE   = 'background:#ffffff;color:#1a1b22;border:2px solid #ffffff;font-weight:700'
const TAB_INACTIVE = 'background:#2b2c36;color:#a0a0b0;border:1.5px solid #3d3e48;font-weight:600'
const TAB_BASE     = 'display:inline-flex;align-items:center;gap:6px;padding:7px 16px;font-size:13px;border-radius:999px;cursor:pointer;white-space:nowrap;font-family:inherit;flex-shrink:0'

function applyTabStyles(container) {
    ;['mine','all','archives'].forEach(id => {
        const btn = container.querySelector(`#tab-${id}`)
        if (!btn) return
        const isActive = id === currentInvTab
        btn.style.cssText = TAB_BASE + ';' + (isActive ? TAB_ACTIVE : TAB_INACTIVE)
    })
}

function switchTab(tab, container) {
    archiveSelection.clear()
    currentInvTab = tab
    applyTabStyles(container)
    const sfEl = container.querySelector('#statusFilter')
    if (sfEl) sfEl.value = ''
    const fw = container.querySelector('#statusFilterWrap')
    if (fw) fw.style.display = tab === 'all' ? 'block' : 'none'
    loadData(true, container)
}

// ── Rendu liste ─────────────────────────────────────────────────────────────
function renderInvoiceList(container, invoiceContainer) {
    const listContainer = container.querySelector('#invoiceListContainer')
    listContainer.innerHTML = ''
    const searchText = container.querySelector('#searchInput')?.value.toLowerCase() || ''
    const statusFilter = container.querySelector('#statusFilter')?.value || ''
    const isBureau = hasPermission('view_all_invoices')

    let base = currentInvTab === 'archives' ? invoicesData
        : (!isBureau || currentInvTab === 'mine') ? invoicesData.filter(inv => inv.authorId === currentUser.id)
        : invoicesData.filter(inv => inv.status !== 'brouillon')

    let filtered = base.filter(inv =>
        (inv.client || '').toLowerCase().includes(searchText) ||
        String(inv.id).toLowerCase().includes(searchText)
    )

    // Filtre par statut (seulement dans Boîte de réception)
    if (statusFilter && currentInvTab === 'all') {
        filtered = filtered.filter(inv => inv.status === statusFilter)
    }

    const total = filtered.length
    const paid = filtered.filter(i => i.status === 'paye').length
    const toTraiter = filtered.filter(i => i.status === 'envoye' || i.status === 'traite' || i.status === 'attente').length
    const headerStats = container.querySelector('#fact-header-stats')
    if (headerStats) headerStats.textContent = `${total} affichée${total !== 1 ? 's' : ''} · ${paid} payée${paid !== 1 ? 's' : ''} · ${toTraiter} à traiter`
    const mobileStats = container.querySelector('#fact-mobile-stats')
    if (mobileStats) mobileStats.textContent = `${total} affichée${total !== 1 ? 's' : ''} · ${paid} payée${paid !== 1 ? 's' : ''}`
    const countMine = container.querySelector('#tab-count-mine')
    const countAll = container.querySelector('#tab-count-all')
    const mineCount = invoicesData.filter(inv => inv.authorId === currentUser.id).length
    const allCount = invoicesData.length
    if (countMine) countMine.textContent = mineCount || ''
    if (countAll) countAll.textContent = allCount || ''

    if (!filtered.length) { listContainer.innerHTML = '<div style="color:#888;text-align:center;padding:20px">Aucune facture trouvée.</div>'; return }

    if (currentInvTab === 'archives') {
        const allIds = filtered.map(inv => inv.id)
        const allSel = allIds.length > 0 && allIds.every(id => archiveSelection.has(id))
        const selBar = document.createElement('div')
        selBar.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px 16px;margin-bottom:4px;border-bottom:1px solid var(--border,#333);cursor:pointer;user-select:none;'
        const dotHtml = `<div style="width:22px;height:22px;border-radius:50%;border:2px solid ${allSel ? 'var(--btn-blue,#007bff)' : '#555'};background:${allSel ? 'var(--btn-blue,#007bff)' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s">${allSel ? '<svg viewBox="0 0 24 24" width="11" height="11" style="stroke:white;fill:none;stroke-width:3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}</div>`
        selBar.innerHTML = `${dotHtml}<span style="font-size:13px;color:var(--text-muted,#aaa);font-weight:500">Tout sélectionner</span>${archiveSelection.size > 0 ? `<span style="margin-left:auto;font-size:12px;font-weight:700;color:var(--btn-blue,#007bff);background:rgba(0,120,255,0.12);padding:2px 8px;border-radius:20px">${archiveSelection.size}</span>` : ''}`
        selBar.addEventListener('click', () => {
            if (allSel) allIds.forEach(id => archiveSelection.delete(id))
            else allIds.forEach(id => archiveSelection.add(id))
            renderInvoiceList(container, invoiceContainer)
        })
        listContainer.appendChild(selBar)
    }

    filtered.forEach(inv => {
        const DOT = `<svg width="7" height="7" viewBox="0 0 7 7" style="vertical-align:middle;margin-right:5px;flex-shrink:0"><circle cx="3.5" cy="3.5" r="3.5" fill="currentColor"/></svg>`
        let badgeHTML = ''
        const st = inv.status || 'brouillon'
        if (inv.isArchived) { badgeHTML = `<span class="badge badge-grey">${DOT}Archivé</span>` }
        else if (currentInvTab === 'mine') {
            if      (st === 'brouillon')                   badgeHTML = `<span class="badge badge-grey">${DOT}Brouillon</span>`
            else if (st === 'attente' || st === 'renvoye') badgeHTML = `<span class="badge badge-orange">${DOT}À corriger</span>`
            else                                           badgeHTML = `<span class="badge badge-blue">${DOT}Envoyée</span>`
        } else {
            if      (st === 'brouillon')                   badgeHTML = `<span class="badge badge-grey">${DOT}Brouillon</span>`
            else if (st === 'envoye')                      badgeHTML = `<span class="badge badge-blue">${DOT}${isBureau ? 'À traiter' : 'Envoyée'}</span>`
            else if (st === 'traite')                      badgeHTML = `<span class="badge badge-purple">${DOT}Traitée</span>`
            else if (st === 'paye')                        badgeHTML = `<span class="badge badge-green">${DOT}Payée</span>`
            else if (st === 'attente' || st === 'renvoye') badgeHTML = `<span class="badge badge-orange">${DOT}À corriger</span>`
        }
        if (inv.isPaper) badgeHTML = `<span class="badges-wrap">${badgeHTML}<span class="badge b-paper"><svg style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><use href="#fic-camera"/></svg> Papier</span></span>`

        let displayDate = inv.date || ''
        if (!displayDate) { const d = new Date(inv.timestamp || Date.now()); displayDate = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(-2)}` }
        else if (displayDate.includes('-')) { const p = displayDate.split('-'); if (p.length === 3) displayDate = `${p[2]}/${p[1]}/${p[0].slice(-2)}` }

        let actionsHTML = '<div style="width:36px"></div>'
        if (inv.isArchived) {
            if (canRestore(currentRole)) actionsHTML = `<button class="btn-icon" style="background:rgba(40,167,69,0.15);color:#28a745" data-restore="${inv.id}">↺</button>`
        } else {
            const verdict = canArchive(inv, currentRole, currentUser.id)
            if (verdict.allowed) actionsHTML = `<button class="btn-icon btn-delete" data-delete="${inv.id}"><svg viewBox="0 0 24 24" width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:2"><use href="#fic-trash"/></svg></button>`
        }

        const div = document.createElement('div')
        div.className = 'invoice-item'
        div.innerHTML = `
            <div class="inv-id">#${sanitize(inv.id)}</div>
            <div class="inv-col-client">
                <div class="inv-client">${sanitize(inv.client)}</div>
                <div class="inv-author">${sanitize(inv.authorName) || 'Inconnu'}</div>
            </div>
            <div class="inv-status">${badgeHTML}</div>
            <div class="inv-date">${displayDate}</div>
            <div class="inv-actions">${actionsHTML}</div>
        `
        if (inv.isArchived) {
            const isSel = archiveSelection.has(inv.id)
            div.classList.add('arc-selectable')
            if (isSel) div.classList.add('arc-selected')
            const check = document.createElement('div')
            check.className = 'arc-check'
            if (isSel) check.innerHTML = '<svg viewBox="0 0 24 24" width="11" height="11" style="stroke:white;fill:none;stroke-width:3"><polyline points="20 6 9 17 4 12"/></svg>'
            div.appendChild(check)
            div.addEventListener('click', e => {
                if (e.target.closest('[data-restore]')) return
                if (archiveSelection.has(inv.id)) archiveSelection.delete(inv.id)
                else archiveSelection.add(inv.id)
                renderInvoiceList(container, container.querySelector('#invoice-container'))
            })
        } else {
            div.addEventListener('click', e => { if (e.target.closest('[data-delete],[data-restore]')) return; openExistingInvoice(inv.id, container, invoiceContainer) })
        }
        div.querySelector('[data-delete]')?.addEventListener('click', e => {
            e.stopPropagation()
            confirmAndArchive({ table: 'factures', id: inv.id, item: inv, role: currentRole, userId: currentUser.id, userName: myUserName, onSuccess: () => loadData(true, container), showConfirm: (msg, cb) => showConfirmModal(msg, cb, container), showAlert: msg => showAlertModal(msg, container) })
        })
        div.querySelector('[data-restore]')?.addEventListener('click', e => {
            e.stopPropagation()
            confirmAndRestore({ table: 'factures', id: inv.id, role: currentRole, onSuccess: () => loadData(true, container), showConfirm: (msg, cb) => showConfirmModal(msg, cb, container), showAlert: msg => showAlertModal(msg, container) })
        })
        listContainer.appendChild(div)
    })

    if (hasMore) {
        const btn = document.createElement('button')
        btn.textContent = `Charger ${PAGE_SIZE} factures de plus...`
        btn.style.cssText = 'width:100%;padding:14px;margin-top:10px;background:var(--bg-panel);color:var(--text-muted);border:1px dashed var(--border);border-radius:10px;cursor:pointer;font-size:14px;font-weight:bold'
        btn.addEventListener('click', async () => {
            if (btn.disabled) return
            btn.disabled = true; btn.textContent = 'Chargement...'
            currentPage++
            try { await loadData(false, container) }
            catch (e) { console.error('[facture] Erreur pagination:', e?.message); currentPage--; btn.disabled = false; btn.textContent = `Charger ${PAGE_SIZE} factures de plus...` }
        })
        listContainer.appendChild(btn)
    }
    updateInvArchiveBar(container)
}

function updateInvArchiveBar(container) {
    let bar = container.querySelector('#inv-archive-action-bar')
    if (!bar) {
        bar = document.createElement('div')
        bar.id = 'inv-archive-action-bar'
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
        ${canRes ? `<button id="bar-inv-restore" style="background:rgba(40,167,69,0.18);color:#28a745;border:1px solid rgba(40,167,69,0.3);padding:7px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">↺ Restaurer</button>` : ''}
        <button id="bar-inv-delete" style="background:rgba(220,53,69,0.18);color:#dc3545;border:1px solid rgba(220,53,69,0.3);padding:7px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;margin-left:auto">Supprimer définitivement</button>
    `
    bar.querySelector('#bar-inv-delete').addEventListener('click', () => {
        const ids = [...archiveSelection]
        showConfirmModal(`Supprimer définitivement ${ids.length} facture(s) ? Cette action est irréversible.`, async () => {
            const { error } = await supabase.from('factures').delete().in('id', ids)
            if (error) { showAlertModal('Erreur: ' + error.message, container); return }
            archiveSelection.clear()
            loadData(true, container)
        }, container, 'Suppression définitive')
    })
    if (canRes) {
        bar.querySelector('#bar-inv-restore').addEventListener('click', () => {
            const ids = [...archiveSelection]
            showConfirmModal(`Restaurer ${ids.length} facture(s) ?`, async () => {
                const { error } = await supabase.from('factures').update({ is_archived: false }).in('id', ids)
                if (error) { showAlertModal('Erreur: ' + error.message, container); return }
                archiveSelection.clear()
                loadData(true, container)
            }, container, 'Restauration')
        })
    }
}

// ── Éditeur ─────────────────────────────────────────────────────────────────
async function openNewInvoice(viewDash, viewEditor, invoiceContainer, zoomDisplay, container) {
    document.body.classList.add('detail-mode')
    try { localStorage.removeItem('fdussault_draft_facture_new') } catch {}
    currentInvoiceId = null
    isPaperMode = false; paperPages = []
    invoicePageCount = 0; globalSigCount = 0
    viewDash.style.display = 'none'; viewEditor.style.display = 'flex'
    invoiceContainer.innerHTML = ''
    invoiceContainer.appendChild(createInvoicePageHTML(invoiceContainer))
    loadClientNames().then(injectClientDatalist)

    let nextNum = null
    try {
        const { data, error } = await supabase.rpc('next_facture_number')
        if (error || !data) throw new Error(error?.message || 'Numéro vide')
        nextNum = data
    } catch (e) {
        console.error('[facture] Impossible d\'obtenir le numéro de facture:', e?.message)
        viewDash.style.display = ''; viewEditor.style.display = 'none'
        showAlertModal('Impossible de créer une nouvelle facture : connexion à la base de données échouée. Vérifiez votre connexion et réessayez.', container)
        return
    }

    currentInvoiceId = nextNum
    const numInput = invoiceContainer.querySelector('.red-invoice-input')
    if (numInput) { numInput.value = nextNum; numInput.readOnly = false; numInput.style.backgroundColor = '' }

    applyEditorSecurity(null, invoiceContainer, container)
    zoomCtrl?.fitToScreen()
    watchContainer(invoiceContainer); attachAll(invoiceContainer)
    startAutosave(invoiceContainer)
}

function openExistingInvoice(id, container, invoiceContainer) {
    document.body.classList.add('detail-mode')
    const invoice = invoicesData.find(inv => inv.id === id)
    if (!invoice) return
    currentInvoiceId = id
    isPaperMode = false; paperPages = []

    const viewDash = container.querySelector('#view-dashboard')
    const viewEditor = container.querySelector('#view-editor')
    const zoomDisplay = container.querySelector('#zoom-level')

    viewDash.style.display = 'none'; viewEditor.style.display = 'flex'
    invoiceContainer.innerHTML = ''
    invoicePageCount = 0; globalSigCount = 0

    if (invoice.isPaper && invoice.paperPages?.length) {
        restorePaperMode(invoice, invoiceContainer, container)
        applyEditorSecurity(invoice, invoiceContainer, container)
        return
    }

    for (let i = 0; i < (invoice.pageCount || 1); i++) invoiceContainer.appendChild(createInvoicePageHTML(invoiceContainer))
    loadClientNames().then(injectClientDatalist)

    const allInputs = invoiceContainer.querySelectorAll('input, textarea.desc-textarea')
    if (invoice.inputValues) allInputs.forEach((inp, idx) => { if (invoice.inputValues[idx] !== undefined) inp.value = invoice.inputValues[idx] })
    const allSigs = invoiceContainer.querySelectorAll('.display-sig')
    if (invoice.sigValues) allSigs.forEach((img, idx) => { if (invoice.sigValues[idx]) img.src = invoice.sigValues[idx] })

    invoiceContainer.querySelectorAll('.desc-textarea').forEach(autoResizeTextarea)

    const numInput = invoiceContainer.querySelector('.red-invoice-input')
    if (numInput) { numInput.readOnly = false; numInput.style.backgroundColor = '' }

    applyEditorSecurity(invoice, invoiceContainer, container)
    zoomCtrl?.fitToScreen()
    refreshIndicators(invoiceContainer)
    watchContainer(invoiceContainer); attachAll(invoiceContainer)

    if (!invoice.isArchived && (invoice.status === 'brouillon' || invoice.status === 'corrige')) startAutosave(invoiceContainer)
}

function showDashboard(viewDash, viewEditor, container) {
    document.body.classList.remove('detail-mode')
    stopAutosave(); resetPaperMode(container)
    viewDash.style.display = 'flex'; viewEditor.style.display = 'none'
    loadData(true, container)
}

function applyEditorSecurity(invoice, invoiceContainer, container) {
    const isBureau = hasPermission('view_all_invoices')
    const status = invoice?.status || 'brouillon'
    const isAuthor = invoice ? (invoice.authorId === currentUser.id || !invoice.authorId) : true
    const isArchived = invoice?.isArchived === true
    const usePaper = invoice?.isPaper === true || isPaperMode

    const show = (id, v) => { const el = container.querySelector(id); if (el) el.style.display = v ? 'flex' : 'none' }

    if (usePaper) {
        let canEditPaper = !isBureau ? (status === 'brouillon' || status === 'attente') : (isAuthor && (status === 'brouillon' || status === 'attente'))
        if (isArchived) canEditPaper = false
        ;['#btnAddPage', '#btnDupPage', '#btnDelPage', '#btnClear'].forEach(id => show(id, false))
        show('#btnPaper', canEditPaper)
        show('#btnSave', canEditPaper)
        show('#btnSend', canEditPaper)
        show('#btnUnlock', isBureau && status !== 'brouillon' && status !== 'attente' && !isArchived)
        show('#btnReturn', isBureau && status !== 'brouillon' && status !== 'attente' && !isArchived)
        updatePaperToggleButton(container)
        const statusDiv = container.querySelector('#office-status-div')
        if (statusDiv) {
            statusDiv.style.display = isBureau && status !== 'brouillon' && status !== 'attente' ? 'flex' : 'none'
            const labels = { envoye: 'Reçu (À traiter)', traite: 'Traité', attente: 'À corriger', paye: 'Facture payée', brouillon: 'Brouillon' }
            const stEl = container.querySelector('#current-status-text')
            if (stEl) stEl.textContent = labels[status] || status
        }
        const banner = container.querySelector('#correction-banner')
        if (banner) {
            if (status === 'attente' && invoice?.returnNote) { banner.style.display = 'flex'; container.querySelector('#correction-note-text').textContent = invoice.returnNote }
            else banner.style.display = 'none'
        }
        return
    }

    let canEdit = !isBureau ? (status === 'brouillon' || status === 'attente') : (isAuthor && (status === 'brouillon' || status === 'attente'))
    if (isArchived) canEdit = false

    show('#btnSave', canEdit); show('#btnSend', canEdit); show('#btnPaper', canEdit)
    show('#btnAddPage', canEdit); show('#btnDupPage', canEdit); show('#btnDelPage', canEdit); show('#btnClear', canEdit)
    show('#btnUnlock', isBureau && status !== 'brouillon' && status !== 'attente' && !isArchived)
    show('#btnReturn', isBureau && status !== 'brouillon' && status !== 'attente' && !isArchived)

    const statusDiv = container.querySelector('#office-status-div')
    if (statusDiv) {
        statusDiv.style.display = isBureau && status !== 'brouillon' && status !== 'attente' ? 'flex' : 'none'
        const labels = { envoye: 'Reçu (À traiter)', traite: 'Traité', attente: 'À corriger', paye: 'Facture payée' }
        const stEl = container.querySelector('#current-status-text')
        if (stEl) stEl.textContent = labels[status] || status
    }

    const banner = container.querySelector('#correction-banner')
    if (banner) {
        if (status === 'attente' && invoice?.returnNote) { banner.style.display = 'flex'; container.querySelector('#correction-note-text').textContent = invoice.returnNote }
        else banner.style.display = 'none'
    }

    toggleInputs(canEdit, invoiceContainer)
}

function toggleInputs(canEdit, invoiceContainer) {
    invoiceContainer.querySelectorAll('input, textarea.desc-textarea').forEach(inp => {
        if (!canEdit) { inp.setAttribute('readonly', true); inp.style.pointerEvents = 'none' }
        else { inp.removeAttribute('readonly'); inp.style.pointerEvents = 'auto' }
    })
    invoiceContainer.querySelectorAll('.display-sig').forEach(img => { img.style.pointerEvents = canEdit ? 'auto' : 'none' })
}

function unlockInvoice(invoiceContainer, container) {
    toggleInputs(true, invoiceContainer)
    ;['#btnSave', '#btnAddPage', '#btnDupPage', '#btnDelPage', '#btnClear'].forEach(id => { const el = container.querySelector(id); if (el) el.style.display = 'flex' })
    container.querySelector('#btnUnlock').style.display = 'none'
    showAlertModal("Facture débloquée. N'oubliez pas de sauvegarder.", container)
}

function openReturnModal(container) {
    container.querySelector('#returnNote').value = ''
    container.querySelector('#returnModal').classList.add('open')
}

async function executeReturnInvoice(viewDash, viewEditor, container) {
    const note = container.querySelector('#returnNote').value.trim()
    if (!note) { showAlertModal('Veuillez inscrire une note pour expliquer ce qui manque.', container); return }
    if (!currentInvoiceId) return
    const { error } = await supabase.from('factures').update({ status: 'attente', return_note: note }).eq('id', currentInvoiceId)
    if (error) { showAlertModal(friendlyError(error), container); return }
    closeModal('returnModal', container)
    await loadData(true, container)
    showDashboard(viewDash, viewEditor, container)
    showAlertModal('La facture a été renvoyée à l\'employé pour correction.', container)
}

// ── Sauvegarde ────────────────────────────────────────────────────────────────
async function saveCurrentInvoice(isSending, invoiceContainer, viewDash, viewEditor, container) {
    if (isPaperMode) { await saveCurrentPaperInvoice(isSending, invoiceContainer, viewDash, viewEditor, container); return }

    const firstPage = invoiceContainer.querySelector('.page')
    if (!firstPage) return

    const btnSave = container.querySelector('#btnSave')
    const origHTML = btnSave?.innerHTML
    if (btnSave) { btnSave.disabled = true; btnSave.textContent = 'Sauvegarde...' }

    const inputs = firstPage.querySelectorAll('.top-section input')
    const clientName = inputs[0]?.value.trim() || 'Client Inconnu'
    let dateVal = inputs[4]?.value.trim() || new Date().toISOString().split('T')[0]

    let invoiceNum = currentInvoiceId
    const numInput = firstPage.querySelector('.red-invoice-input')
    const typedNum = numInput?.value.trim()
    if (typedNum && typedNum !== currentInvoiceId) {
        // L'utilisateur a modifié le numéro manuellement
        invoiceNum = typedNum
    }
    if (!invoiceNum) {
        try { const { data, error } = await supabase.rpc('next_facture_number'); if (error) throw error; invoiceNum = data || ('F-' + Date.now().toString().slice(-4)) } catch (e) { console.warn('[facture] Impossible d\'obtenir le numéro (mode papier):', e?.message); invoiceNum = 'F-' + Date.now().toString().slice(-4) }
        if (numInput) numInput.value = invoiceNum
    }

    const inputValues = Array.from(invoiceContainer.querySelectorAll('input, textarea.desc-textarea')).map(i => i.value)
    const sigValues = Array.from(invoiceContainer.querySelectorAll('.display-sig')).map(img => img.getAttribute('src'))
    const pageCount = invoiceContainer.querySelectorAll('.page').length
    const existing = invoicesData.find(inv => inv.id === currentInvoiceId || inv.id === invoiceNum)
    let currentStatus = existing?.status || 'brouillon'
    if (isSending) currentStatus = 'envoye'

    const facturePayload = {
        id: invoiceNum, client: clientName, date: dateVal, input_values: inputValues, sig_values: sigValues,
        page_count: pageCount, status: currentStatus,
        author_id: existing ? existing.authorId : currentUser.id,
        author_name: existing ? existing.authorName : myUserName,
        return_note: existing ? existing.returnNote : ''
    }
    const { error } = await withRetry(() => supabase.from('factures').upsert(facturePayload))

    if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = origHTML }

    if (error) {
        if (error.offline) {
            enqueueOfflineSave('factures', facturePayload)
            showAlertModal('Hors ligne — la facture sera synchronisée automatiquement à la reconnexion.', container)
            return
        }
        showAlertModal(friendlyError(error), container)
        return
    }

    currentInvoiceId = invoiceNum
    clearAutosaveCurrent()
    await loadData(true, container)

    if (isSending) { showAlertModal('Document envoyé au bureau avec succès !', container); showDashboard(viewDash, viewEditor, container) }
    else {
        showAlertModal('Facture sauvegardée.', container)
        const updated = invoicesData.find(inv => inv.id === currentInvoiceId)
        applyEditorSecurity(updated, invoiceContainer, container)
    }
}

// ── Mode papier ───────────────────────────────────────────────────────────────
function togglePaperMode(invoiceContainer, viewDash, viewEditor, container) {
    if (isPaperMode) {
        if (paperPages.length > 0) {
            showConfirmModal(`Revenir au mode numérique va retirer les ${paperPages.length} photo(s) ajoutée(s).`, () => {
                isPaperMode = false; paperPages = []
                invoiceContainer.innerHTML = ''
                invoicePageCount = 0; globalSigCount = 0
                invoiceContainer.appendChild(createInvoicePageHTML(invoiceContainer))
                ;['#btnAddPage', '#btnDupPage', '#btnDelPage', '#btnClear'].forEach(id => { const el = container.querySelector(id); if (el) el.style.display = 'flex' })
                updatePaperToggleButton(container)
                applyEditorSecurity({ status: 'brouillon', authorId: currentUser.id }, invoiceContainer, container)
                zoomCtrl?.fitToScreen()
                watchContainer(invoiceContainer); attachAll(invoiceContainer)
            }, container, 'Retour au mode numérique')
            return
        }
        isPaperMode = false; paperPages = []
        invoiceContainer.innerHTML = ''
        invoicePageCount = 0; globalSigCount = 0
        invoiceContainer.appendChild(createInvoicePageHTML(invoiceContainer))
        ;['#btnAddPage', '#btnDupPage', '#btnDelPage', '#btnClear'].forEach(id => { const el = container.querySelector(id); if (el) el.style.display = 'flex' })
        updatePaperToggleButton(container)
        applyEditorSecurity({ status: 'brouillon', authorId: currentUser.id }, invoiceContainer, container)
        zoomCtrl?.fitToScreen()
        watchContainer(invoiceContainer); attachAll(invoiceContainer)
    } else {
        const allInputs = invoiceContainer.querySelectorAll('input:not(.red-invoice-input):not([type="date"])')
        const hasContent = Array.from(allInputs).some(i => i.value?.trim())
        if (hasContent) {
            showConfirmModal("Passer en mode 'facture papier' va supprimer le contenu du formulaire.", () => switchToPaperMode(invoiceContainer, container), container)
            return
        }
        switchToPaperMode(invoiceContainer, container)
    }
}

function switchToPaperMode(invoiceContainer, container) {
    isPaperMode = true; paperPages = []
    renderPaperEditor(invoiceContainer, container)
    ;['#btnAddPage', '#btnDupPage', '#btnDelPage', '#btnClear'].forEach(id => { const el = container.querySelector(id); if (el) el.style.display = 'none' })
    updatePaperToggleButton(container)
    applyEditorSecurity({ isPaper: true, status: 'brouillon', authorId: currentUser.id }, invoiceContainer, container)
}

function updatePaperToggleButton(container) {
    const label = container.querySelector('#btnPaperLabel')
    const icon = container.querySelector('#btnPaperIcon use')
    if (isPaperMode) {
        if (label) label.textContent = 'Mode numérique'
        if (icon) icon.setAttribute('href', '#fic-file-text')
    } else {
        if (label) label.textContent = 'Facture papier'
        if (icon) icon.setAttribute('href', '#fic-camera')
    }
}

function resetPaperMode(container) {
    isPaperMode = false; paperPages = []
    updatePaperToggleButton(container)
}

function renderPaperEditor(invoiceContainer, container) {
    const savedNumero = currentInvoiceId || ''
    const savedDate = new Date().toISOString().split('T')[0]
    invoiceContainer.innerHTML = ''
    loadClientNames().then(injectClientDatalist)

    const wrap = document.createElement('div')
    wrap.className = 'paper-mode-container'
    wrap.innerHTML = `
        <div class="paper-mode-header">
            <div class="pmh-field"><label>Client</label><input type="text" class="paper-client-input" placeholder="Nom du client" list="fact-client-datalist"></div>
            <div class="pmh-field"><label>Date</label><input type="date" class="paper-date-input" value="${savedDate}"></div>
            <div class="pmh-field"><label>No. facture</label><input type="text" class="paper-numero-input red-invoice-input" value="${savedNumero}"></div>
        </div>
        <div class="paper-mode-body" id="paper-mode-body"></div>
        <button type="button" class="paper-add-page-btn" id="paper-add-page-btn">
            <svg viewBox="0 0 24 24"><use href="#fic-plus"/></svg> Ajouter une page
        </button>
    `
    invoiceContainer.appendChild(wrap)
    wrap.querySelector('#paper-add-page-btn').addEventListener('click', () => container.querySelector('#pim-gallery-input').click())
    renderPaperPagesInEditor(invoiceContainer, container)
}

function renderPaperPagesInEditor(invoiceContainer, container) {
    const body = invoiceContainer.querySelector('#paper-mode-body')
    if (!body) return
    body.innerHTML = ''
    if (paperPages.length === 0) {
        body.innerHTML = `
            <div class="paper-drop-zone">
                <div class="pdz-text">Déposer une image ou prendre une photo</div>
                <div class="pdz-actions">
                    <button type="button" class="pdz-camera" id="pdz-camera-btn"><svg viewBox="0 0 24 24"><use href="#fic-camera"/></svg></button>
                    <button type="button" class="pdz-deposer" id="pdz-deposer-btn">Déposer</button>
                </div>
            </div>
        `
        body.querySelector('#pdz-camera-btn').addEventListener('click', () => container.querySelector('#pim-camera-input').click())
        body.querySelector('#pdz-deposer-btn').addEventListener('click', () => container.querySelector('#pim-gallery-input').click())
        return
    }
    const list = document.createElement('div')
    list.className = 'paper-pages-list'
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

async function addPaperPages(fileList, invoiceContainer) {
    if (!fileList?.length || !isPaperMode) return
    for (const file of Array.from(fileList)) {
        if (!file.type.startsWith('image/')) continue
        const dataUrl = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file) })
        paperPages.push({ file, dataUrl, uploaded: false })
    }
    const ic = document.querySelector('#invoice-container')
    if (ic) renderPaperPagesInEditor(ic, document.querySelector('.fact-main')?.parentElement || document.body)
}

async function uploadAllPaperPages() {
    const progress = document.getElementById('paper-progress')
    const progressText = document.getElementById('paper-progress-text')
    progress?.classList.add('show')
    try {
        for (let i = 0; i < paperPages.length; i++) {
            const p = paperPages[i]
            if (p.uploaded) continue
            if (progressText) progressText.textContent = `Téléversement page ${i + 1}/${paperPages.length}…`
            const ext = (p.file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg'
            const filePath = `factures-papier/${currentUser.id}/paper_${Date.now()}_${i}.${ext}`
            const { error } = await supabase.storage.from('pieces_jointes').upload(filePath, p.file, { contentType: p.file.type })
            if (error) throw error
            const { data: { publicUrl } } = supabase.storage.from('pieces_jointes').getPublicUrl(filePath)
            paperPages[i] = { ...p, url: publicUrl, name: p.file.name, path: filePath, uploaded: true }
        }
    } finally { progress?.classList.remove('show') }
}

async function saveCurrentPaperInvoice(isSending, invoiceContainer, viewDash, viewEditor, container) {
    if (paperPages.length === 0) { showAlertModal('Veuillez ajouter au moins une page (photo).', container); return }

    const btnSave = container.querySelector('#btnSave')
    const btnSend = container.querySelector('#btnSend')
    const origSave = btnSave?.innerHTML
    if (btnSave) { btnSave.disabled = true; btnSave.textContent = 'Sauvegarde...' }
    if (btnSend) btnSend.disabled = true

    try {
        await uploadAllPaperPages()

        const clientInp = invoiceContainer.querySelector('.paper-client-input')
        const dateInp = invoiceContainer.querySelector('.paper-date-input')
        const numInp = invoiceContainer.querySelector('.paper-numero-input')
        const client = clientInp?.value.trim() || 'Facture papier'
        const date = dateInp?.value || new Date().toISOString().split('T')[0]
        let invoiceNum = numInp?.value.trim() || currentInvoiceId
        if (!invoiceNum) {
            try {
                const { data, error } = await supabase.rpc('next_facture_number')
                if (error || !data) throw new Error(error?.message || 'Numéro vide')
                invoiceNum = data
            } catch (e) {
                console.error('[facture papier] Impossible d\'obtenir le numéro:', e?.message)
                showAlertModal('Impossible d\'enregistrer : connexion à la base de données échouée. Vérifiez votre connexion et réessayez.', container)
                return
            }
        }

        const existing = invoicesData.find(inv => inv.id === currentInvoiceId || inv.id === invoiceNum)
        let currentStatus = existing?.status || 'brouillon'
        if (isSending) currentStatus = 'envoye'

        const { error } = await withRetry(() => supabase.from('factures').upsert({
            id: invoiceNum, client, date,
            input_values: [], sig_values: [], page_count: paperPages.length, status: currentStatus,
            author_id: existing ? existing.authorId : currentUser.id,
            author_name: existing ? existing.authorName : myUserName,
            return_note: existing ? existing.returnNote : '',
            is_paper: true,
            paper_pages: paperPages.map(p => ({ url: p.url, name: p.name || 'page.jpg', path: p.path }))
        }))
        if (error) throw error

        currentInvoiceId = invoiceNum
        clearAutosaveCurrent()
        await loadData(true, container)

        if (isSending) { showAlertModal(`Facture papier #${invoiceNum} envoyée au bureau !`, container); showDashboard(viewDash, viewEditor, container) }
        else showAlertModal(`Facture papier #${invoiceNum} sauvegardée.`, container)
    } catch (e) { showAlertModal('❌ Erreur : ' + (e.message || 'inconnue'), container) }
    finally {
        if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = origSave }
        if (btnSend) btnSend.disabled = false
    }
}

function restorePaperMode(invoice, invoiceContainer, container) {
    isPaperMode = true
    paperPages = (invoice.paperPages || []).map(p => ({ url: p.url, name: p.name, path: p.path, uploaded: true }))
    renderPaperEditor(invoiceContainer, container)
    ;['#btnAddPage', '#btnDupPage', '#btnDelPage', '#btnClear'].forEach(id => { const el = container.querySelector(id); if (el) el.style.display = 'none' })
    updatePaperToggleButton(container)
}

// ── PDF ───────────────────────────────────────────────────────────────────────
function exporterPDF(invoiceContainer, container) {
    if (isPaperMode) {
        if (!paperPages.length) { showAlertModal("Ajoutez au moins une photo avant d'exporter.", container); return }
        const clientName = invoiceContainer.querySelector('.paper-client-input')?.value.trim() || ''
        const dateVal = invoiceContainer.querySelector('.paper-date-input')?.value.trim() || new Date().toISOString().split('T')[0]
        const invoiceNum = invoiceContainer.querySelector('.paper-numero-input')?.value.trim() || currentInvoiceId || ''
        // Pour les factures papier, on génère un PDF à partir des dataUrls des pages
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
        openPdfPreview({ container: tempDiv, docType: 'facture', docNumber: invoiceNum, clientName, date: dateVal })
            .finally(() => { try { document.body.removeChild(tempDiv) } catch {} })
        return
    }

    const firstPage = invoiceContainer.querySelector('.page')
    if (!firstPage) return
    const inputs = firstPage.querySelectorAll('.top-section input')
    const clientName = inputs[0]?.value.trim() || ''
    const dateVal = inputs[4]?.value.trim() || new Date().toISOString().split('T')[0]
    const invoiceNum = currentInvoiceId || invoiceContainer.querySelector('.red-invoice-input')?.value.trim()
    openPdfPreview({ container: invoiceContainer, docType: 'facture', docNumber: invoiceNum, clientName, date: dateVal })
}

// ── Autocomplétion client ────────────────────────────────────────────────────
async function loadClientNames() {
    if (clientNameList.length) return
    try {
        const { data } = await supabase.from('clients').select('nom').neq('est_supprime', true).order('nom')
        if (data) clientNameList = data.map(c => c.nom).filter(Boolean)
    } catch {}
}

function injectClientDatalist() {
    let dl = document.getElementById('fact-client-datalist')
    if (!dl) { dl = document.createElement('datalist'); dl.id = 'fact-client-datalist'; document.body.appendChild(dl) }
    dl.innerHTML = clientNameList.map(n => `<option value="${sanitize(n)}">`).join('')
}

// ── Page HTML ────────────────────────────────────────────────────────────────
function createInvoicePageHTML(invoiceContainer) {
    invoicePageCount++; globalSigCount++
    const page = document.createElement('div')
    page.className = 'page invoice-style'
    const inputAttrs = `type="text" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false"`
    const clientAttrs = `type="text" autocorrect="off" autocapitalize="sentences" spellcheck="false" list="fact-client-datalist"`
    const taAttrs = `autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" rows="1"`
    let rows = ''
    for (let i = 0; i < 20; i++) rows += `<tr><td><input ${inputAttrs}></td><td><textarea class="desc-textarea" ${taAttrs}></textarea></td><td><input ${inputAttrs}></td><td><input ${inputAttrs}></td></tr>`
    page.innerHTML = `
        <div class="top-section">
            <div class="header-main"><img src="/assets/logo_dussault.png" alt="F. Dussault" onerror="this.style.display='none'"></div>
            <div class="info-section">
                <div class="info-column">
                    <div class="field"><label>M.</label><input ${clientAttrs}></div>
                    <div class="field"><input ${inputAttrs}></div>
                    <div class="field"><label>Po client:</label><input ${inputAttrs}></div>
                    <div class="field"><label>Tél:</label><input ${inputAttrs}></div>
                </div>
                <div class="info-column">
                    <div class="field"><label>Date:</label><input ${inputAttrs}></div>
                    <div class="field"><label>Travail à:</label><input ${inputAttrs}></div>
                    <div class="field"><label>Adresse:</label><input ${inputAttrs}></div>
                    <div class="field"><label>Po:</label><input ${inputAttrs}></div>
                </div>
            </div>
            <div class="banner-cmmtq"><img src="/assets/cmmtq_et_slogan.png" alt="CMMTQ" onerror="this.style.display='none'"></div>
        </div>
        <table class="main-table">
            <thead><tr><th width="45">QUANT.</th><th>DESCRIPTION</th><th width="75">MONTANT</th><th width="75">TOTAL</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="bottom-section">
            <table class="time-wrapper"><tr>
                <td class="time-label-col"><span>1 1/2% après 30 jours</span><h2># TEMPS</h2></td>
                <td><table class="inner-table">
                    <tr class="row-headers">
                        <td style="width:25%">TARIF PAR HRE</td><td style="width:15%">CHARGE MIN.</td>
                        <td style="width:25%">TRANSPORT</td><td style="width:20%">HRE ARRIVÉE</td>
                        <td class="last-col" style="width:15%">INITIALE</td>
                    </tr>
                    <tr class="row-inputs">
                        <td><div class="flex-group">DE <div class="input-box"><input ${inputAttrs}></div> À <div class="input-box"><input ${inputAttrs}></div></div></td>
                        <td><div class="input-box"><input ${inputAttrs}></div></td>
                        <td><div class="flex-group">DE <div class="input-box"><input ${inputAttrs}></div> À <div class="input-box"><input ${inputAttrs}></div></div></td>
                        <td><div class="flex-group">TOTAL <div class="input-box"><input ${inputAttrs}></div></div></td>
                        <td class="last-col"><div class="input-box"><input ${inputAttrs}></div></td>
                    </tr>
                    <tr class="row-inputs">
                        <td><div class="flex-group">DE <div class="input-box"><input ${inputAttrs}></div> À <div class="input-box"><input ${inputAttrs}></div></div></td>
                        <td><div class="input-box"><input ${inputAttrs}></div></td>
                        <td><div class="flex-group">DE <div class="input-box"><input ${inputAttrs}></div> À <div class="input-box"><input ${inputAttrs}></div></div></td>
                        <td><div class="flex-group">TOTAL <div class="input-box"><input ${inputAttrs}></div></div></td>
                        <td class="last-col"><div class="input-box"><input ${inputAttrs}></div></td>
                    </tr>
                </table></td>
            </tr></table>
            <div class="footer-grid">
                <div class="sig-box"><img id="sig-p-${globalSigCount}" class="display-sig"><div class="sig-text">Signature du plombier</div></div>
                <div class="sig-box"><img id="sig-c-${globalSigCount}" class="display-sig"><div class="sig-text">Signature du client</div></div>
                <div class="invoice-num-box"><input type="text" class="red-invoice-input" placeholder="No."></div>
            </div>
        </div>
    `
    return page
}

function duplicatePage(invoiceContainer, zoomDisplay) {
    const pages = invoiceContainer.querySelectorAll('.page')
    if (!pages.length) return
    const source = pages[pages.length - 1]
    const newPage = createInvoicePageHTML(invoiceContainer)
    invoiceContainer.appendChild(newPage)
    const sourceInputs = source.querySelectorAll('.top-section input')
    const newInputs = newPage.querySelectorAll('.top-section input')
    sourceInputs.forEach((inp, i) => { if (newInputs[i]) newInputs[i].value = inp.value })
    zoomCtrl?.applyZoom(zoomCtrl?.current ?? 1.0)
}

function deletePage(invoiceContainer, container) {
    if (invoiceContainer.children.length > 1) { invoiceContainer.removeChild(invoiceContainer.lastElementChild); invoicePageCount-- }
    else showAlertModal('Impossible de supprimer la dernière page.', container)
}

// ── Autosave ──────────────────────────────────────────────────────────────────
function startAutosave(invoiceContainer) {
    if (autosave) { try { autosave.stop() } catch {} }
    autosave = createAutosave({ module: 'facture', containerSelector: '#invoice-container', draftIdGetter: () => currentInvoiceId })
    autosave.start()
    if (autosave.hasDraft()) autosave.restore()
}

function stopAutosave() { if (autosave) { try { autosave.stop() } catch {}; autosave = null } }
function clearAutosaveCurrent() { if (autosave) { try { autosave.clear() } catch {} } }

// ── Zoom — géré par zoomCtrl (zoom.js) ────────────────────────────────────────
// Les fonctions fitToScreen/updateZoom sont remplacées par createZoomController()
// Voir l'initialisation dans render() après showDashboard()

// ── Statut menu ───────────────────────────────────────────────────────────────
function toggleStatusMenu(e, container) {
    e.stopPropagation()
    const menu = container.querySelector('#statusOptionsMenu')
    if (menu.classList.contains('show')) { menu.classList.remove('show'); return }
    const btn = container.querySelector('#office-status-div')
    const rect = btn.getBoundingClientRect()
    menu.style.top = (rect.bottom + 8) + 'px'
    let left = rect.left; if (left + 220 > window.innerWidth) left = window.innerWidth - 230
    menu.style.left = left + 'px'
    menu.classList.add('show')
}

// ── Utilitaires ───────────────────────────────────────────────────────────────
function autoResizeTextarea(ta) {
    // Ne pas grandir — hauteur fixe
    ta.style.height = '22px'
}

function setupDescTextareaJump(invoiceContainer) {
    invoiceContainer.addEventListener('input', e => {
        const ta = e.target
        if (!ta.classList.contains('desc-textarea')) return

        // Mesure si le texte dépasse la largeur de la cellule
        const canvas = setupDescTextareaJump._canvas || (setupDescTextareaJump._canvas = document.createElement('canvas'))
        const ctx = canvas.getContext('2d')
        const style = window.getComputedStyle(ta)
        ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`

        const maxW = ta.clientWidth - 10 // padding
        const text = ta.value
        const w = ctx.measureText(text).width

        if (w > maxW) {
            // Trouver le dernier espace pour couper proprement
            const words = text.split(' ')
            let line1 = ''
            let overflow = ''
            for (let i = 0; i < words.length; i++) {
                const test = line1 ? line1 + ' ' + words[i] : words[i]
                if (ctx.measureText(test).width > maxW) {
                    overflow = words.slice(i).join(' ')
                    break
                }
                line1 = test
            }

            if (!overflow) {
                // Pas d'espace — couper au caractère
                overflow = text.slice(-1)
                line1 = text.slice(0, -1)
            }

            ta.value = line1

            // Aller à la cellule desc suivante
            const allDesc = Array.from(invoiceContainer.querySelectorAll('.desc-textarea'))
            const idx = allDesc.indexOf(ta)
            if (idx !== -1 && idx + 1 < allDesc.length) {
                const next = allDesc[idx + 1]
                next.value = overflow + next.value
                next.focus()
                next.setSelectionRange(overflow.length, overflow.length)
            }
        }
    })
}

function showConfirmModal(msg, callback, container, title = 'Confirmation') {
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

function closeModal(id, container) {
    container.querySelector(`#${id}`)?.classList.remove('open')
}
