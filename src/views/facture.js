// src/views/facture.js
// Migré fidèlement depuis code_facture/code_facture.html

import { supabase } from '../supabase.js'
import { currentUser, currentRole, currentProfil, hasPermission } from '../auth.js'
import { createAutosave } from '../shared/autosave.js'
import { canArchive, canSeeAllArchives, canRestore, confirmAndArchive, confirmAndRestore } from '../shared/archive.js'
import { openPdfPreview } from '../shared/pdfExport.js'
import { attachAll, watchContainer, refreshIndicators } from '../shared/signature.js'
import { withRetry } from '../shared/withRetry.js'
import { createZoomController } from '../shared/zoom.js'

// ── État local ──────────────────────────────────────────────────────────────
let myUserName = 'Employé'
let currentInvTab = 'mine'
let invoicesData = []
let currentPage = 0
const PAGE_SIZE = 25
let hasMore = false
let currentInvoiceId = null
let autosave = null
let confirmCallback = null
let zoomCtrl = null        // contrôleur zoom interne (zoom.js)
let isPaperMode = false
let paperPages = []
let invoicePageCount = 0
let globalSigCount = 0
// Références aux window listeners pour cleanup propre
let _onResizeFact = null
let _onClickFact = null

// ── Render principal ────────────────────────────────────────────────────────
export async function render(container) {
    myUserName = currentProfil?.prenom_nom || 'Employé'

    container.innerHTML = `
    <style>
        /* --blue-bg défini dans styles.css : #d1e9ff */
        .fact-main { font-family: 'Segoe UI', Arial, sans-serif; background: var(--bg-dark); color: var(--text-main); height: 100%; display: flex; flex-direction: column; overflow: hidden; }
        .badge-status { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; display: inline-flex; align-items: center; gap: 5px; color: white; }
        .b-brouillon { background: #444; } .b-envoye { background: #3498db; } .b-traite { background: var(--btn-purple); } .b-paye { background: #28a745; } .b-renvoye { background: #fd7e14; }
        .b-paper { background: rgba(91,192,235,0.15); color: #5bc0eb; border: 1px solid rgba(91,192,235,0.4); }
        .badges-wrap { display: inline-flex; flex-wrap: wrap; gap: 6px; align-items: center; }
        #view-dashboard { padding: 30px; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .dash-header { display: flex; justify-content: space-between; align-items: center; }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .toolbar { display: flex; gap: 15px; align-items: center; background: var(--bg-panel); padding: 15px; border-radius: 12px; }
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input { width: 100%; background: #1e1f26; border: 1px solid #444; color: white; padding: 12px 15px 12px 40px; border-radius: 8px; font-size: 16px; outline: none; }
        .search-icon { position: absolute; left: 12px; color: #888; pointer-events: none; display: flex; align-items: center; }
        .search-icon svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .tabs-container { display: flex; gap: 10px; margin-bottom: 5px; }
        .btn-tab { background: #1a1b23; color: #aaa; border: 1px solid #444; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
        .btn-tab svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-tab.active { background: var(--btn-blue); color: white; border-color: var(--btn-blue); }
        .invoice-list { display: flex; flex-direction: column; gap: 10px; padding-bottom: 30px; }
        .invoice-item { background: var(--bg-panel); padding: 12px 20px; border-radius: 10px; display: grid; grid-template-columns: 80px 1fr 140px 130px 100px 44px; align-items: center; gap: 15px; cursor: pointer; border: 1px solid transparent; border-left: 4px solid transparent; transition: 0.2s; }
        .invoice-item:hover { transform: translateX(5px); background: #343542; border-left-color: var(--accent); background-color: #30313c; border-color: #555;}
        .inv-id { font-weight: bold; color: var(--accent); font-size: 15px; }
        .inv-client { font-weight: bold; font-size: 16px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .inv-author { font-size: 14px; color: #888; font-style: italic; }
        .inv-status { display: flex; align-items: center; }
        .inv-date { color: #aaa; font-size: 14px; text-align: right; }
        .inv-actions { display: flex; justify-content: flex-end; }
        .btn-icon { background: #444; border: none; width: 36px; height: 36px; border-radius: 8px; display: flex; justify-content: center; align-items: center; cursor: pointer; color: white; }
        .btn-delete { background: rgba(255,77,77,0.1); color: var(--btn-red); border: 1px solid transparent; }
        .btn-delete:hover { background: var(--btn-red); color: white; }
        #view-editor { display: none; flex-direction: column; height: 100%; }
        .top-bar { height: auto; min-height: 80px; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 10px 20px; background: rgba(30,31,38,0.95); border-bottom: 1px solid #333; z-index: 101; flex-wrap: wrap; }
        .action-btn { background: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; white-space: nowrap; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3);}
        .action-btn:hover { background: var(--accent-hover); transform: translateY(-1px); background-color: var(--accent-hover);}
        .action-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-back { background: #6c757d !important; color: white !important; }
        .btn-save { background: var(--btn-green) !important; color: white !important; }
        .btn-send { background: var(--btn-blue) !important; color: white !important; }
        .btn-unlock { background: var(--btn-orange) !important; color: white !important; }
        .btn-return { background: var(--btn-red) !important; color: white !important; }
        @media (max-width: 1024px) {
            .top-bar { padding: 10px 85px 10px 10px; gap: 10px; height: 65px; overflow-x: auto; justify-content: flex-start; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; }
            .top-bar::-webkit-scrollbar { display: none; }
            .top-bar .action-btn, .office-status-panel { flex-shrink: 0; width: auto; margin-bottom: 0; }
            .top-bar .action-btn { font-size: 11px; padding: 8px 15px; }
        }
        .office-status-panel { background: #1a1b23; border: 1px solid #555; padding: 9px 20px; border-radius: 50px; display: flex; align-items: center; gap: 8px; white-space: nowrap; flex-shrink: 0; cursor: pointer; color: white; font-weight: bold; font-size: 14px; }
        .office-status-panel svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .status-dropdown { position: fixed; background: rgba(43,44,54,0.98); backdrop-filter: blur(10px); border: 1px solid #555; border-radius: 16px; overflow: hidden; display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 9999; min-width: 200px; flex-direction: column; }
        .status-dropdown.show { display: flex; }
        .status-option { padding: 16px 20px; color: white; cursor: pointer; transition: 0.2s; font-size: 15px; font-weight: bold; border-bottom: 1px solid #3a3b46; }
        .status-option:hover { background: #3a3b46; color: var(--accent); }
        .correction-banner { background: rgba(255,77,77,0.15); border: 1px dashed var(--btn-red); padding: 15px; margin: 20px auto 0; max-width: 8.5in; border-radius: 8px; color: white; line-height: 1.5; font-size: 14px; display: flex; gap: 10px; }
        .scroll-area { flex: 1; overflow: auto; padding: 15px 0; display: flex; flex-direction: column; align-items: center; touch-action: auto; }
        #invoice-container { display: block; width: 8.5in; transform-origin: top center; transition: transform 0.1s ease-out; padding-bottom: 50px; }
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
        .desc-textarea { width: 100%; min-height: 18px; background: transparent; border: none; padding: 0 5px; box-sizing: border-box; font-size: 12px; color: black; font-weight: bold; resize: none; overflow: hidden; line-height: 1.4; font-family: inherit; display: block; }
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
        .zoom-controls { position: fixed; bottom: 20px; right: 20px; background: rgba(30,31,38,0.95); padding: 5px 10px; border-radius: 50px; display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); z-index: 2000; border: 1px solid #555; }
        .zoom-controls button { background: var(--accent); border: none; width: 32px; height: 32px; border-radius: 50%; font-weight: bold; font-size: 18px; cursor: pointer; color: #1e1f26; display: flex; align-items: center; justify-content: center; }
        .zoom-controls span { color: white; font-size: 12px; font-weight: bold; min-width: 45px; text-align: center; }
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.75); display: none; z-index: 4000; justify-content: center; align-items: center; }
        .custom-modal-overlay.open { display: flex; }
        .custom-modal-card { background: var(--bg-panel); width: 350px; padding: 25px; border-radius: 12px; border: 1px solid #555; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5);}
        .custom-modal-title { font-size: 20px; color: var(--btn-red); margin-bottom: 15px; font-weight: bold; }
        .custom-modal-msg { color: var(--text-main); margin-bottom: 25px; font-size: 15px; line-height: 1.4; }
        .custom-modal-actions { display: flex; justify-content: center; gap: 10px; }
        .btn-modal-cancel { background: #444; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
        .btn-modal-confirm { background: var(--btn-red); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
        .btn-modal-ok { background: var(--accent); color: black; border: none; padding: 10px 30px; border-radius: 6px; cursor: pointer; font-weight: bold; }
        /* Mode papier */
        .paper-mode-container { background: #fff; margin: 20px auto; max-width: 800px; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); overflow: hidden; }
        .paper-mode-header { display: flex; gap: 0; background: #fff; border-bottom: 1px solid #e0e0e0; }
        .paper-mode-header .pmh-field { flex: 1; padding: 10px 14px; border-right: 1px solid #e8e8e8; min-width: 0; }
        .paper-mode-header .pmh-field:last-child { border-right: none; }
        .paper-mode-header label { display: block; font-size: 9px; color: #888; font-weight: 700; letter-spacing: 0.8px; margin-bottom: 4px; text-transform: uppercase; }
        .paper-mode-header input { width: 100%; border: none; outline: none; background: transparent; font-size: 13px; color: #222; font-family: Arial, sans-serif; box-sizing: border-box; }
        .paper-mode-header input.paper-numero-input { color: #dc3545; font-weight: 700; }
        .paper-mode-body { padding: 30px 20px; background: #fff; min-height: 400px; }
        .paper-drop-zone { background: #fff; color: #222; border: 1.5px dashed #c4d4dd; border-radius: 14px; padding: 24px 20px; text-align: center; max-width: 360px; margin: 60px auto; }
        .paper-drop-zone .pdz-text { color: #333; font-weight: 600; font-size: 13px; margin-bottom: 18px; line-height: 1.4; }
        .paper-drop-zone .pdz-actions { display: flex; align-items: center; justify-content: center; gap: 12px; }
        .paper-drop-zone .pdz-camera { background: #cfe6f5; color: #2a7da8; width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; }
        .paper-drop-zone .pdz-camera svg { width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 2; }
        .paper-drop-zone .pdz-deposer { background: #5bc0eb; color: white; border: none; padding: 12px 22px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .paper-pages-list { padding: 16px 20px; background: #f8f9fa; border-top: 1px solid #e8e8e8; }
        .paper-page-display { position: relative; background: #fff; border-radius: 6px; margin-bottom: 12px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.15); border: 1px solid #e0e0e0; }
        .paper-page-display img { width: 100%; height: auto; display: block; }
        .paper-page-display .ppd-num { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.7); color: white; font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight: 600; pointer-events: none; }
        .paper-page-display .ppd-remove { position: absolute; top: 8px; right: 8px; background: var(--btn-red); color: white; border: none; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .paper-page-display .ppd-remove svg { width: 12px; height: 12px; stroke: currentColor; fill: none; stroke-width: 2; }
        .paper-add-page-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: calc(100% - 40px); margin: 16px 20px; padding: 14px; background: rgba(91,192,235,0.08); border: 1.5px dashed #5bc0eb; border-radius: 10px; color: #5bc0eb; font-weight: 600; font-size: 14px; cursor: pointer; font-family: inherit; }
        .paper-add-page-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        #paper-progress { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); background: #1f2027; color: white; padding: 20px 30px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.6); z-index: 9999; text-align: center; display: none; border: 1px solid #3a3b46; }
        #paper-progress.show { display: block; }
        #paper-progress .pp-spinner { width: 32px; height: 32px; margin: 0 auto 12px; border: 3px solid #444; border-top-color: #5bc0eb; border-radius: 50%; animation: pp-spin 0.8s linear infinite; }
        @keyframes pp-spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
            #view-dashboard { padding: 15px; }
            .dash-header { flex-direction: column; align-items: flex-start; gap: 15px; width: 100%; }
            .dash-title { padding-right: 80px; width: 100%; }
            .dash-header .action-btn { width: 100%; justify-content: center; font-size: 14px; }
            .tabs-container { flex-direction: column; width: 100%; }
            .btn-tab { width: 100%; justify-content: center; }
            .invoice-item { grid-template-columns: 1fr auto; grid-template-areas: "id id" "client client" "author author" "status date"; gap: 4px 12px; padding: 16px; border-radius: 12px; border: 1px solid #3a3b46; border-left: 1px solid #3a3b46; margin-bottom: 12px; position: relative; }
            .inv-id { grid-area: id; } .inv-client { grid-area: client; } .inv-author { grid-area: author; } .inv-status { grid-area: status; } .inv-date { grid-area: date; text-align: right; }
            .inv-actions { position: absolute; top: 16px; right: 16px; }
            .zoom-controls { display: none !important; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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
        <div id="view-dashboard">
            <div class="dash-header">
                <div class="dash-title"><h1>Facturation</h1><p>Création et suivi comptable</p></div>
                <button class="action-btn" id="btnNewInvoice">
                    <svg viewBox="0 0 24 24"><use href="#fic-plus"/></svg> Nouvelle Facture
                </button>
            </div>

            <div class="tabs-container" id="invoice-tabs" style="display:none">
                <button id="tab-mine" class="btn-tab active">
                    <svg viewBox="0 0 24 24"><use href="#fic-user"/></svg> Mes Factures
                </button>
                <button id="tab-all" class="btn-tab">
                    <svg viewBox="0 0 24 24"><use href="#fic-inbox"/></svg> Boîte de réception
                </button>
                <button id="tab-archives" class="btn-tab">
                    <svg viewBox="0 0 24 24"><use href="#fic-archive"/></svg> Archives
                </button>
            </div>

            <div class="toolbar">
                <div class="search-box">
                    <span class="search-icon"><svg viewBox="0 0 24 24"><use href="#fic-search"/></svg></span>
                    <input type="text" id="searchInput" placeholder="Rechercher (Client, N°...)">
                </div>
            </div>
            <div id="inv-compteur" style="color:#888;font-size:12px;padding:5px 10px"></div>
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
                <button class="action-btn" id="btnPaper" style="background:#e8730a;color:white">
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
                    <svg viewBox="0 0 24 24" style="width:24px;height:24px;stroke:var(--btn-red);fill:none;stroke-width:2;margin-top:3px;flex-shrink:0"><use href="#fic-alert"/></svg>
                    <div>
                        <strong style="color:var(--btn-red)">Facture renvoyée par le bureau pour correction :</strong><br>
                        <span id="correction-note-text" style="display:inline-block;margin-top:5px"></span>
                    </div>
                </div>
                <div id="invoice-container"></div>
            </div>

            <div class="zoom-controls">
                <button id="btnZoomOut">−</button>
                <span id="zoom-level">100%</span>
                <button id="btnZoomIn">+</button>
                <button id="btnZoomReset" style="font-size:14px">↺</button>
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
        <div class="custom-modal-card">
            <div class="custom-modal-title">↩️ Renvoyer pour correction</div>
            <div style="text-align:left;margin-bottom:15px">
                <label style="color:#aaa;display:block;margin-bottom:10px;font-size:13px;font-weight:bold">Note pour l'employé :</label>
                <textarea id="returnNote" placeholder="Ex: Il manque le tarif horaire..." style="width:100%;height:100px;background:#1e1f26;color:white;border:1px solid #555;padding:10px;border-radius:5px;font-family:sans-serif;outline:none;resize:none;box-sizing:border-box"></textarea>
            </div>
            <div style="display:flex;justify-content:center;gap:10px;margin-top:15px">
                <button class="btn-modal-cancel" id="btnCloseReturnModal">Annuler</button>
                <button style="background:var(--btn-red);color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:bold" id="btnExecuteReturn">Renvoyer la facture</button>
            </div>
        </div>
    </div>

    <!-- Modal confirmation -->
    <div class="custom-modal-overlay" id="confirmModal">
        <div class="custom-modal-card">
            <div style="font-size:20px;margin-bottom:15px;font-weight:bold">Confirmation</div>
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
            <div style="color:var(--accent);font-size:20px;margin-bottom:15px;font-weight:bold">Information</div>
            <div id="alertMsg" class="custom-modal-msg"></div>
            <div class="custom-modal-actions">
                <button class="btn-modal-ok" id="btnAlertOk">Compris</button>
            </div>
        </div>
    </div>
    `

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
    if (hasPermission('view_all_invoices')) {
        container.querySelector('#invoice-tabs').style.display = 'flex'
    } else {
        container.querySelector('#invoice-tabs').style.display = 'flex'
        container.querySelector('#tab-all').style.display = 'none'
    }
    container.querySelector('#tab-mine').addEventListener('click', () => switchTab('mine', container))
    container.querySelector('#tab-all').addEventListener('click', () => switchTab('all', container))
    container.querySelector('#tab-archives').addEventListener('click', () => switchTab('archives', container))
    container.querySelector('#searchInput').addEventListener('keyup', () => renderInvoiceList(container, invoiceContainer))

    // Dashboard
    container.querySelector('#btnNewInvoice').addEventListener('click', () => openNewInvoice(viewDash, viewEditor, invoiceContainer, zoomDisplay, container))

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
            container.querySelector('#statusOptionsMenu').classList.remove('show')
            const status = opt.dataset.status
            const labels = { envoye: 'Reçu (À traiter)', traite: 'Traité', attente: 'À corriger', paye: 'Facture payée' }
            container.querySelector('#current-status-text').textContent = labels[status] || status
            if (currentInvoiceId) {
                const { error } = await supabase.from('factures').update({ status }).eq('id', currentInvoiceId)
                if (error) showAlertModal('Erreur : ' + error.message, container)
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

    // Textarea auto-resize
    invoiceContainer.addEventListener('input', e => { if (e.target?.classList.contains('desc-textarea')) autoResizeTextarea(e.target) })

    // Signature
    watchContainer(invoiceContainer)
    attachAll(invoiceContainer)

    await loadData(true, container)
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

    let query = supabase.from('factures').select('*')
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

function switchTab(tab, container) {
    currentInvTab = tab
    container.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'))
    container.querySelector(`#tab-${tab}`)?.classList.add('active')
    loadData(true, container)
}

// ── Rendu liste ─────────────────────────────────────────────────────────────
function renderInvoiceList(container, invoiceContainer) {
    const listContainer = container.querySelector('#invoiceListContainer')
    listContainer.innerHTML = ''
    const searchText = container.querySelector('#searchInput')?.value.toLowerCase() || ''
    const isBureau = hasPermission('view_all_invoices')

    let base = currentInvTab === 'archives' ? invoicesData
        : (!isBureau || currentInvTab === 'mine') ? invoicesData.filter(inv => inv.authorId === currentUser.id)
        : invoicesData.filter(inv => inv.status !== 'brouillon')

    const filtered = base.filter(inv => (inv.client || '').toLowerCase().includes(searchText) || String(inv.id).toLowerCase().includes(searchText))

    const compteur = container.querySelector('#inv-compteur')
    if (compteur) compteur.textContent = `${invoicesData.length} facture(s) chargée(s)${hasMore ? ' — il y en a plus' : ''}`

    if (!filtered.length) { listContainer.innerHTML = '<div style="color:#888;text-align:center;padding:20px">Aucune facture trouvée.</div>'; return }

    filtered.forEach(inv => {
        let badgeHTML = ''
        const st = inv.status || 'brouillon'
        if (inv.isArchived) { badgeHTML = `<span class="badge-status" style="background:#555">Archivé</span>` }
        else if (st === 'brouillon') { badgeHTML = `<span class="badge-status b-brouillon">Brouillon</span>` }
        else if (!isBureau) {
            if (st === 'envoye') badgeHTML = `<span class="badge-status b-envoye">Envoyé au bureau</span>`
            else if (st === 'traite' || st === 'paye') badgeHTML = `<span class="badge-status b-traite">Traité</span>`
            else if (st === 'attente') badgeHTML = `<span class="badge-status b-renvoye">À corriger</span>`
        } else {
            if (st === 'envoye') badgeHTML = `<span class="badge-status b-envoye">Reçu (À traiter)</span>`
            else if (st === 'traite') badgeHTML = `<span class="badge-status b-traite">Traité</span>`
            else if (st === 'attente') badgeHTML = `<span class="badge-status b-renvoye">À corriger</span>`
            else if (st === 'paye') badgeHTML = `<span class="badge-status b-paye">Facture payée</span>`
        }
        if (inv.isPaper) badgeHTML = `<span class="badges-wrap">${badgeHTML}<span class="badge-status b-paper"><svg style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><use href="#fic-camera"/></svg> Papier</span></span>`

        let displayDate = inv.date || ''
        if (!displayDate) { const d = new Date(inv.timestamp || Date.now()); displayDate = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}` }
        else if (displayDate.includes('-')) { const p = displayDate.split('-'); if (p.length === 3) displayDate = `${p[2]}/${p[1]}/${p[0]}` }

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
            <div class="inv-id">#${inv.id}</div>
            <div class="inv-client">${inv.client || ''}</div>
            <div class="inv-author">${inv.authorName || 'Inconnu'}</div>
            <div class="inv-status">${badgeHTML}</div>
            <div class="inv-date">${displayDate}</div>
            <div class="inv-actions">${actionsHTML}</div>
        `
        div.addEventListener('click', e => { if (e.target.closest('[data-delete],[data-restore]')) return; openExistingInvoice(inv.id, container, invoiceContainer) })
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
        btn.style.cssText = 'width:100%;padding:14px;margin-top:10px;background:#2b2c36;color:#aaa;border:1px dashed #444;border-radius:10px;cursor:pointer;font-size:14px;font-weight:bold'
        btn.addEventListener('click', async () => { currentPage++; await loadData(false, container) })
        listContainer.appendChild(btn)
    }
}

// ── Éditeur ─────────────────────────────────────────────────────────────────
async function openNewInvoice(viewDash, viewEditor, invoiceContainer, zoomDisplay, container) {
    try { localStorage.removeItem('fdussault_draft_facture_new') } catch {}
    currentInvoiceId = null
    isPaperMode = false; paperPages = []
    invoicePageCount = 0; globalSigCount = 0
    viewDash.style.display = 'none'; viewEditor.style.display = 'flex'
    invoiceContainer.innerHTML = ''
    invoiceContainer.appendChild(createInvoicePageHTML(invoiceContainer))

    let nextNum = 'F-XXXX'
    try {
        const { data, error } = await supabase.rpc('next_facture_number')
        if (!error && data) nextNum = data
    } catch { nextNum = 'F-' + Date.now().toString().slice(-4) }

    currentInvoiceId = nextNum
    const numInput = invoiceContainer.querySelector('.red-invoice-input')
    if (numInput) { numInput.value = nextNum; numInput.readOnly = true; numInput.style.backgroundColor = 'transparent' }

    applyEditorSecurity(null, invoiceContainer, container)
    zoomCtrl?.fitToScreen()
    watchContainer(invoiceContainer); attachAll(invoiceContainer)
    startAutosave(invoiceContainer)
}

function openExistingInvoice(id, container, invoiceContainer) {
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

    const allInputs = invoiceContainer.querySelectorAll('input, textarea.desc-textarea')
    if (invoice.inputValues) allInputs.forEach((inp, idx) => { if (invoice.inputValues[idx] !== undefined) inp.value = invoice.inputValues[idx] })
    const allSigs = invoiceContainer.querySelectorAll('.display-sig')
    if (invoice.sigValues) allSigs.forEach((img, idx) => { if (invoice.sigValues[idx]) img.src = invoice.sigValues[idx] })

    invoiceContainer.querySelectorAll('.desc-textarea').forEach(autoResizeTextarea)

    const numInput = invoiceContainer.querySelector('.red-invoice-input')
    if (numInput) { numInput.readOnly = true; numInput.style.backgroundColor = 'transparent' }

    applyEditorSecurity(invoice, invoiceContainer, container)
    zoomCtrl?.fitToScreen()
    refreshIndicators(invoiceContainer)
    watchContainer(invoiceContainer); attachAll(invoiceContainer)

    if (!invoice.isArchived && (invoice.status === 'brouillon' || invoice.status === 'corrige')) startAutosave(invoiceContainer)
}

function showDashboard(viewDash, viewEditor, container) {
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
    if (error) { showAlertModal('Erreur : ' + error.message, container); return }
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
    if (!invoiceNum) {
        try { const { data } = await supabase.rpc('next_facture_number'); invoiceNum = data || ('F-' + Date.now().toString().slice(-4)) } catch { invoiceNum = 'F-' + Date.now().toString().slice(-4) }
    }

    const inputValues = Array.from(invoiceContainer.querySelectorAll('input, textarea.desc-textarea')).map(i => i.value)
    const sigValues = Array.from(invoiceContainer.querySelectorAll('.display-sig')).map(img => img.getAttribute('src'))
    const pageCount = invoiceContainer.querySelectorAll('.page').length
    const existing = invoicesData.find(inv => inv.id === currentInvoiceId || inv.id === invoiceNum)
    let currentStatus = existing?.status || 'brouillon'
    if (isSending) currentStatus = 'envoye'

    const { error } = await withRetry(() => supabase.from('factures').upsert({
        id: invoiceNum, client: clientName, date: dateVal, input_values: inputValues, sig_values: sigValues,
        page_count: pageCount, status: currentStatus,
        author_id: existing ? existing.authorId : currentUser.id,
        author_name: existing ? existing.authorName : myUserName,
        return_note: existing ? existing.returnNote : ''
    }))

    if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = origHTML }

    if (error) { showAlertModal('❌ Erreur : ' + error.message, container); return }

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

    const wrap = document.createElement('div')
    wrap.className = 'paper-mode-container'
    wrap.innerHTML = `
        <div class="paper-mode-header">
            <div class="pmh-field"><label>Client</label><input type="text" class="paper-client-input" placeholder="Nom du client"></div>
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
            <button type="button" class="ppd-remove" data-remove="${idx}"><svg viewBox="0 0 24 24"><use href="#fic-x"/></svg></button>
            <img src="${p.dataUrl || p.url}" alt="Page ${idx + 1}">
        `
        pageEl.querySelector('[data-remove]').addEventListener('click', () => { paperPages.splice(idx, 1); renderPaperPagesInEditor(invoiceContainer, container) })
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
        if (!invoiceNum) { try { const { data } = await supabase.rpc('next_facture_number'); invoiceNum = data || ('F-' + Date.now().toString().slice(-4)) } catch { invoiceNum = 'F-' + Date.now().toString().slice(-4) } }

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
        // On crée un container temporaire avec des images pour openPdfPreview
        const tempDiv = document.createElement('div')
        paperPages.forEach(p => {
            const page = document.createElement('div')
            page.className = 'page'
            page.style.cssText = 'display:flex;align-items:center;justify-content:center;padding:0;background:white'
            const img = document.createElement('img')
            img.src = p.dataUrl || p.url
            img.style.cssText = 'width:100%;height:100%;object-fit:contain'
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

// ── Page HTML ────────────────────────────────────────────────────────────────
function createInvoicePageHTML(invoiceContainer) {
    invoicePageCount++; globalSigCount++
    const page = document.createElement('div')
    page.className = 'page invoice-style'
    const inputAttrs = `type="text" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false"`
    const taAttrs = `autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" rows="1"`
    let rows = ''
    for (let i = 0; i < 20; i++) rows += `<tr><td><input ${inputAttrs}></td><td><textarea class="desc-textarea" ${taAttrs}></textarea></td><td><input ${inputAttrs}></td><td><input ${inputAttrs}></td></tr>`
    page.innerHTML = `
        <div class="top-section">
            <div class="header-main"><img src="/assets/logo_dussault.png" alt="F. Dussault" onerror="this.style.display='none'"></div>
            <div class="info-section">
                <div class="info-column">
                    <div class="field"><label>M.</label><input ${inputAttrs}></div>
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
function autoResizeTextarea(ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px' }

function showConfirmModal(msg, callback, container, title = 'Confirmation') {
    container.querySelector('#confirmMsg').innerHTML = msg
    confirmCallback = callback
    container.querySelector('#confirmModal').classList.add('open')
}

function closeConfirmModal(container) {
    container.querySelector('#confirmModal').classList.remove('open')
    confirmCallback = null
}

function showAlertModal(msg, container) {
    container.querySelector('#alertMsg').innerHTML = msg
    container.querySelector('#alertModal').classList.add('open')
}

function closeModal(id, container) {
    container.querySelector(`#${id}`)?.classList.remove('open')
}