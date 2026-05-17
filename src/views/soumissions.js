// src/views/soumissions.js
// Migré fidèlement depuis code_soumissions/code_soumissions.html

import { supabase } from '../supabase.js'
import { currentUser, currentRole, currentProfil, hasPermission } from '../auth.js'
import { sanitize } from '../shared/sanitize.js'
import { createAutosave } from '../shared/autosave.js'
import { canArchive, canSeeAllArchives, canRestore, confirmAndArchive, confirmAndRestore } from '../shared/archive.js'
import { openPdfPreview } from '../shared/pdfExport.js'
import { attachAll, watchContainer, refreshIndicators } from '../shared/signature.js'
import { withRetry } from '../shared/withRetry.js'
import { createZoomController } from '../shared/zoom.js'

// ── État local ──────────────────────────────────────────────────────────────
let myUserName = 'Employé'
let currentQuoteTab = 'mine'
let quotesData = []
let currentQuoteId = null
let autosave = null
let quotesPage = 0
const PAGE_SIZE = 25
let quotesHasMore = false
let confirmCallback = null
let quotePageCount = 0
let globalSigCount = 0
let zoomCtrl = null
let _onResizeSoum = null

// ── Render principal ────────────────────────────────────────────────────────
export async function render(container) {
    myUserName = currentProfil?.prenom_nom || 'Employé'

    container.innerHTML = `
    <style>
        /* --blue-bg défini dans styles.css : #d1e9ff */
        .soum-main { font-family: 'Segoe UI', Arial, sans-serif; background: var(--bg-dark); color: var(--text-main); height: 100%; display: flex; flex-direction: column; overflow: hidden; }
        #view-dashboard { padding: 30px; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .dash-header { display: flex; justify-content: space-between; align-items: center; }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .toolbar { display: flex; gap: 15px; align-items: center; background: var(--bg-panel); padding: 15px; border-radius: 12px; }
        .discrete-stats { color: #aaa; font-size: 13px; font-style: italic; margin: 1px 0; padding-left: 10px; }
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input { width: 100%; background: var(--bg-dark); border: 1px solid var(--border); color: white; padding: 14px 15px 14px 45px; border-radius: 8px; font-size: 16px; outline: none; transition: 0.2s; }
        .search-box input:focus { border-color: var(--accent); }
        .search-icon { position: absolute; left: 15px; color: #888; pointer-events: none; display: flex; align-items: center; }
        .search-icon svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .tabs-container { display: flex; gap: 10px; margin-bottom: 5px; }
        .btn-tab { background: #1a1b23; color: #aaa; border: 1px solid #444; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
        .btn-tab svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-tab.active { background: var(--btn-blue); color: white; border-color: var(--btn-blue); }
        .quote-list { display: flex; flex-direction: column; gap: 10px; padding-bottom: 30px; }
        .quote-item { background: var(--bg-panel); padding: 12px 20px; border-radius: 10px; display: grid; grid-template-columns: 120px 1fr 140px 130px 100px 44px; align-items: center; gap: 15px; cursor: pointer; border: 1px solid transparent; border-left: 4px solid transparent; transition: 0.2s; }
        .quote-item:hover { transform: translateX(5px); background: #343542; border-left-color: var(--accent); background-color: #30313c; border-color: #555;}
        .inv-id { font-weight: bold; color: var(--accent); font-size: 15px; }
        .inv-client { font-weight: bold; font-size: 16px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .inv-author { font-size: 14px; color: #888; font-style: italic; }
        .inv-date { color: #aaa; font-size: 14px; text-align: right; }
        .inv-status span { font-size: 12px; padding: 3px 10px; border-radius: 6px; font-weight: bold; display: inline-flex; align-items: center; }
        .status-attente   { background: rgba(255,193,7,0.15);  color: #ffc107; }
        .status-convertie { background: rgba(40,167,69,0.15);  color: var(--btn-green); }
        .status-brouillon { background: rgba(136,136,136,0.15); color: #888; }
        .status-archivee  { background: rgba(85,85,85,0.15);   color: #777; }
        .inv-actions { display: flex; justify-content: flex-end; }
        .btn-icon { background: #444; border: none; width: 36px; height: 36px; border-radius: 8px; display: flex; justify-content: center; align-items: center; cursor: pointer; color: white; flex-shrink: 0; transition: 0.2s;}
        .btn-delete { background: rgba(255,77,77,0.1); color: var(--btn-red); border: 1px solid transparent; }
        .btn-delete:hover { background: var(--btn-red); color: white; }
        #view-editor { display: none; flex-direction: column; height: 100%; }
        .top-bar { height: auto; min-height: 80px; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 10px 20px; background: rgba(30,31,38,0.95); border-bottom: 1px solid #333; z-index: 101; flex-wrap: wrap; }
        .action-btn { background: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; white-space: nowrap; transition: 0.2s; }
        .action-btn:hover { background: var(--accent-hover); transform: translateY(-1px); background-color: var(--accent-hover);}
        .action-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-back { background: #6c757d !important; color: white !important; }
        .btn-save { background: var(--btn-green) !important; color: white !important; }
        .btn-send { background: var(--btn-blue) !important; color: white !important; }
        .btn-convert { background: var(--btn-blue) !important; color: white !important; }
        .btn-unlock { background: var(--btn-orange) !important; color: white !important; }
        @media (max-width: 1024px) {
            .top-bar { padding: 10px 85px 10px 10px; gap: 10px; height: 65px; overflow-x: auto; justify-content: flex-start; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; }
            .top-bar::-webkit-scrollbar { display: none; }
            .top-bar .action-btn { flex-shrink: 0; width: auto; margin-bottom: 0; font-size: 11px; padding: 8px 15px; }
        }
        .scroll-area { flex: 1; overflow: auto; padding: 15px 0; display: block; touch-action: none; }
        .page { width: 8.5in; height: 11in; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.5); box-sizing: border-box; display: flex; flex-direction: column; position: relative; margin: 0 auto 20px; color: black; padding: 0.25in; flex-shrink: 0; }
        input { outline: none; border-radius: 0; }
        input:focus { background-color: transparent !important; border-bottom: 2px solid #000 !important; }
        #quote-container { display: block; width: 8.5in; transform-origin: 0 0; padding-bottom: 50px; }
        .top-section { width: 100%; }
        .header-main { width: 100%; margin-top: -15px; margin-bottom: 0; text-align: center; }
        .header-main img { width: 100%; height: auto; display: block; }
        .header-main h2 { margin: 2px 0; font-family: Arial, sans-serif; letter-spacing: 6px; font-weight: 900; color: #333; font-size: 20px; text-transform: uppercase; }
        .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 2px; }
        .info-column { display: flex; flex-direction: column; gap: 1px; }
        .field { display: flex; align-items: flex-end; font-size: 12px; font-weight: bold; min-height: 22px; }
        .field label { white-space: nowrap; margin-right: 5px; }
        .field input { background: var(--blue-bg) !important; border: none; border-bottom: 1px solid black; flex-grow: 1; height: 18px; padding: 0 5px; }
        .banner-cmmtq { width: 100%; margin: 4px 0; text-align: center; }
        .banner-cmmtq img { width: 100%; height: auto; display: block; margin: 0 auto; }
        .main-table { width: 100%; border-collapse: collapse; border: none; margin-bottom: 5px; }
        .main-table thead { border-top: 4px double black; }
        .main-table th { border: 1px solid black; font-size: 9px; background: #eee; padding: 2px; }
        .main-table td { border: 1px solid black; height: 23px; background: var(--blue-bg); padding: 0; }
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
        .display-sig { border: none; border-bottom: 1px solid #000; background: var(--blue-bg); width: 100%; height: 45px; cursor: pointer; object-fit: contain; }
        .sig-text { font-size: 10px; font-weight: bold; margin-top: 2px; }
        .quote-num-box { text-align: right; padding-bottom: 5px; display: flex; justify-content: flex-end; align-items: flex-end; }
        .red-quote-input { color: #dc3545; font-weight: bold; font-size: 18px; font-family: 'Courier New', monospace; text-align: right; border: none; background: var(--blue-bg); width: 100%; margin: 0; padding: 0 5px; }
        .zoom-controls { position: fixed; bottom: 20px; right: 20px; background: rgba(30,31,38,0.95); padding: 5px 10px; border-radius: 50px; display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); z-index: 2000; border: 1px solid #555; }
        .zoom-controls button { background: var(--accent); border: none; width: 32px; height: 32px; border-radius: 50%; font-weight: bold; font-size: 18px; cursor: pointer; display: flex; justify-content: center; align-items: center; color: #1e1f26; }
        .zoom-controls span { color: white; font-size: 12px; font-weight: bold; min-width: 45px; text-align: center; }
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; z-index: 4000; justify-content: center; align-items: center; }
        .custom-modal-overlay.open { display: flex; }
        .custom-modal-card { background: var(--bg-panel); width: 350px; padding: 25px; border-radius: 12px; border: 1px solid #555; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5);}
        .custom-modal-title { font-size: 20px; color: var(--accent); margin-bottom: 15px; font-weight: bold; }
        .custom-modal-msg { color: var(--text-main); margin-bottom: 25px; font-size: 15px; line-height: 1.4; }
        .custom-modal-actions { display: flex; justify-content: center; gap: 10px; }
        .btn-modal-cancel { background: #444; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
        .btn-modal-confirm { background: var(--btn-green); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
        .btn-modal-ok { background: var(--accent); color: black; border: none; padding: 10px 30px; border-radius: 6px; cursor: pointer; font-weight: bold; }
        @media (max-width: 768px) {
            #view-dashboard { padding: 15px; }
            .dash-header { flex-direction: column; align-items: flex-start; gap: 15px; width: 100%; }
            .dash-title { padding-right: 80px; width: 100%; }
            .dash-header .action-btn { width: 100%; justify-content: center; font-size: 14px; }
            .tabs-container { flex-direction: column; width: 100%; }
            .btn-tab { width: 100%; justify-content: center; }
            .quote-item { grid-template-columns: 1fr auto; grid-template-areas: "id id" "client client" "author author" "status date"; gap: 4px 12px; padding: 16px; border-radius: 12px; border: 1px solid #3a3b46; border-left: 1px solid #3a3b46; margin-bottom: 12px; position: relative; }
            .inv-id { grid-area: id; } .inv-client { grid-area: client; } .inv-author { grid-area: author; }
            .inv-status { grid-area: status; } .inv-date { grid-area: date; text-align: right; }
            .inv-actions { position: absolute; top: 16px; right: 16px; }
            .zoom-controls { display: none !important; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    </style>

    <div class="soum-main">
        <div id="view-dashboard">
            <div class="dash-header">
                <div class="dash-title"><h1>Mes Soumissions</h1><p>Gérez vos estimations</p></div>
                <button class="action-btn" id="btnNewQuote">
                    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Nouvelle Soumission
                </button>
            </div>

            <div class="tabs-container" id="quote-tabs" style="display:none">
                <button id="tab-mine" class="btn-tab active">
                    <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Mes Soumissions
                </button>
                <button id="tab-all" class="btn-tab">
                    <svg viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                    Boîte de réception
                </button>
                <button id="tab-archives" class="btn-tab">
                    <svg viewBox="0 0 24 24"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                    Archives
                </button>
            </div>

            <div class="toolbar">
                <div class="search-box">
                    <span class="search-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                    <input type="text" id="searchInput" placeholder="Rechercher (Client, N°...)">
                </div>
            </div>
            <select id="statusFilter" style="display:none; background:var(--bg-dark); border:1px solid var(--border); color:white; padding:10px 12px; border-radius:8px; font-size:14px; outline:none; cursor:pointer; align-self:flex-start;">
                <option value="">Tous les statuts</option>
                <option value="envoye">Envoyé au bureau</option>
                <option value="traite">Traité</option>
                <option value="attente">À corriger</option>
                <option value="paye">Approuvé</option>
            </select>
            <div id="quote-compteur" class="discrete-stats"></div>
            <div class="quote-list" id="quoteListContainer"></div>
        </div>

        <div id="view-editor">
            <div class="top-bar">
                <button class="action-btn btn-back" id="btnBack">
                    <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    Retour
                </button>
                <button class="action-btn btn-save" id="btnSave">
                    <svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Sauvegarder
                </button>
                <button class="action-btn btn-send" id="btnSend">
                    <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Envoyer au bureau
                </button>
                <button class="action-btn btn-convert" id="btnConvert">
                    <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    Convertir en facture
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
            <div class="scroll-area"><div id="quote-container"></div></div>
            <div class="zoom-controls">
                <button id="btnZoomOut">−</button>
                <span id="zoom-level">100%</span>
                <button id="btnZoomIn">+</button>
                <button id="btnZoomReset" style="font-size:14px">↺</button>
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
            <div class="custom-modal-title">Information</div>
            <div class="custom-modal-msg" id="alertMsg"></div>
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
    const quoteContainer = container.querySelector('#quote-container')
    const zoomDisplay = container.querySelector('#zoom-level')

    // Tabs
    if (hasPermission('view_all_quotes')) {
        container.querySelector('#quote-tabs').style.display = 'flex'
    } else {
        container.querySelector('#quote-tabs').style.display = 'flex'
        container.querySelector('#tab-all').style.display = 'none'
    }

    container.querySelector('#tab-mine').addEventListener('click', () => switchTab('mine', container))
    container.querySelector('#tab-all').addEventListener('click', () => switchTab('all', container))
    container.querySelector('#tab-archives').addEventListener('click', () => switchTab('archives', container))
    container.querySelector('#searchInput').addEventListener('keyup', () => filterQuotes(container))
    container.querySelector('#statusFilter').addEventListener('change', () => filterQuotes(container))

    // Boutons dashboard
    container.querySelector('#btnNewQuote').addEventListener('click', () => openNewQuote(viewDash, viewEditor, quoteContainer, zoomDisplay))

    // Boutons éditeur
    container.querySelector('#btnBack').addEventListener('click', () => showDashboard(viewDash, viewEditor, container))
    container.querySelector('#btnSave').addEventListener('click', () => saveCurrentQuote(false, quoteContainer, container))
    container.querySelector('#btnSend').addEventListener('click', () => {
        showConfirm('Une fois envoyée, cette soumission sera verrouillée. L\'envoyer au bureau ?', () => saveCurrentQuote(true, quoteContainer, container), container)
    })
    container.querySelector('#btnConvert').addEventListener('click', () => convertToInvoice(quoteContainer, container))
    container.querySelector('#btnUnlock').addEventListener('click', () => unlockQuote(container))
    container.querySelector('#btnPdf').addEventListener('click', () => exportPdf(quoteContainer))
    container.querySelector('#btnAddPage').addEventListener('click', () => { quoteContainer.appendChild(createQuotePageHTML()); zoomCtrl?.applyZoom(zoomCtrl?.current ?? 1.0) })
    container.querySelector('#btnDupPage').addEventListener('click', () => duplicatePage(quoteContainer, zoomDisplay))
    container.querySelector('#btnDelPage').addEventListener('click', () => deletePage(quoteContainer, container))
    container.querySelector('#btnClear').addEventListener('click', () => {
        showConfirm('Effacer tout le contenu de la soumission ?', () => {
            quoteContainer.querySelectorAll('input, textarea.desc-textarea').forEach(i => i.value = '')
            quoteContainer.querySelectorAll('.display-sig').forEach(img => img.src = '')
        }, container)
    })

    // Zoom
    // Zoom — contrôleur interne indépendant du navigateur
    const scrollAreaSoum = container.querySelector('#scrollArea')
    zoomCtrl = createZoomController({
        container: quoteContainer,
        scrollArea: scrollAreaSoum,
        zoomDisplay,
        docWidthPx: 816
    })
    zoomCtrl.attach()
    container.querySelector('#btnZoomOut').addEventListener('click', () => zoomCtrl.zoomOut())
    container.querySelector('#btnZoomIn').addEventListener('click', () => zoomCtrl.zoomIn())
    container.querySelector('#btnZoomReset').addEventListener('click', () => zoomCtrl.zoomReset())

    _onResizeSoum = () => { if (viewEditor.style.display === 'flex') zoomCtrl?.fitToScreen() }
    window.addEventListener('resize', _onResizeSoum)

    // Modales
    container.querySelector('#btnConfirmNo').addEventListener('click', () => closeConfirmModal(container))
    container.querySelector('#btnConfirmYes').addEventListener('click', () => {
        if (confirmCallback) confirmCallback()
        closeConfirmModal(container)
    })
    container.querySelector('#btnAlertOk').addEventListener('click', () => container.querySelector('#alertModal').classList.remove('open'))

    // Textarea auto-resize
    quoteContainer.addEventListener('input', e => {
        if (e.target?.classList.contains('desc-textarea')) autoResizeTextarea(e.target)
    })

    // Signature
    watchContainer(quoteContainer)
    attachAll(quoteContainer)

    await loadData(true, container)
}

function cleanup() {
    stopAutosave()
    if (zoomCtrl) { zoomCtrl.destroy(); zoomCtrl = null }
    if (_onResizeSoum) { window.removeEventListener('resize', _onResizeSoum); _onResizeSoum = null }
}

// ── Données ─────────────────────────────────────────────────────────────────
async function loadData(reset = true, container) {
    if (reset) { quotesPage = 0; quotesData = [] }
    const from = quotesPage * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase.from('soumissions').select('*')
    if (currentQuoteTab === 'archives') {
        query = query.eq('is_archived', true)
        if (!canSeeAllArchives(currentRole)) query = query.eq('author_id', currentUser.id)
    } else {
        query = query.eq('is_archived', false)
        if (currentQuoteTab === 'mine') query = query.eq('author_id', currentUser.id)
        else query = query.neq('status', 'brouillon')
    }

    const { data } = await query.order('created_at', { ascending: false }).range(from, to + 1)
    if (data) {
        quotesHasMore = data.length > PAGE_SIZE
        quotesData = reset
            ? data.slice(0, PAGE_SIZE).map(mapQuote)
            : [...quotesData, ...data.slice(0, PAGE_SIZE).map(mapQuote)]
    }
    renderQuoteList(container)
}

function mapQuote(db) {
    return {
        id: db.id, client: db.client, date: db.date, status: db.status,
        inputValues: db.input_values || [], sigValues: db.sig_values || [],
        pageCount: db.page_count || 1, authorId: db.author_id, authorName: db.author_name,
        isArchived: db.is_archived === true
    }
}

function switchTab(tab, container) {
    currentQuoteTab = tab
    container.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'))
    const tabEl = container.querySelector(`#tab-${tab}`)
    if (tabEl) tabEl.classList.add('active')
    const statusFilter = container.querySelector('#statusFilter')
    if (statusFilter) { statusFilter.style.display = tab === 'all' ? 'block' : 'none'; statusFilter.value = '' }
    loadData(true, container)
}

// ── Rendu liste ─────────────────────────────────────────────────────────────
function renderQuoteList(container) {
    const listContainer = container.querySelector('#quoteListContainer')
    listContainer.innerHTML = ''
    const isBureau = hasPermission('view_all_quotes')

    let baseList = currentQuoteTab === 'archives' ? quotesData
        : (!isBureau || currentQuoteTab === 'mine') ? quotesData.filter(q => q.authorId === currentUser.id || !q.authorId)
        : quotesData.filter(q => q.status !== 'brouillon')

    const compteur = container.querySelector('#quote-compteur')
    if (compteur) compteur.textContent = `${quotesData.length} soumission(s) chargée(s)${quotesHasMore ? ' — il y en a plus' : ''}`

    if (baseList.length === 0) {
        listContainer.innerHTML = '<div style="color:#888;text-align:center;padding:20px;font-style:italic">Aucune soumission trouvée.</div>'
        return
    }

    baseList.forEach(q => {
        let statusHTML = ''
        if (q.isArchived) statusHTML = `<span class="inv-status status-archivee" style="display:inline-flex">Archivée</span>`
        else if (q.status === 'Convertie') statusHTML = `<span class="status-convertie">Convertie</span>`
        else if (q.status === 'brouillon') statusHTML = `<span class="status-brouillon">Brouillon</span>`
        else statusHTML = `<span class="status-attente">${!isBureau ? 'Envoyée' : 'En attente'}</span>`

        let actionsHTML = '<div style="width:36px"></div>'
        if (q.isArchived) {
            if (canRestore(currentRole)) {
                actionsHTML = `<button class="btn-icon" style="background:rgba(40,167,69,0.15);color:#28a745" data-restore="${q.id}">↺</button>`
            }
        } else {
            const verdict = canArchive(q, currentRole, currentUser.id)
            if (verdict.allowed) {
                actionsHTML = `<button class="btn-icon btn-delete" data-delete="${q.id}">
                    <svg viewBox="0 0 24 24" width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>`
            }
        }

        const div = document.createElement('div')
        div.className = 'quote-item'
        div.innerHTML = `
            <div class="inv-id">${q.id}</div>
            <div class="inv-client">${q.client}</div>
            <div class="inv-author">${q.authorName || 'Inconnu'}</div>
            <div class="inv-status">${statusHTML}</div>
            <div class="inv-date">${q.date}</div>
            <div class="inv-actions">${actionsHTML}</div>
        `
        div.addEventListener('click', e => {
            if (e.target.closest('[data-delete],[data-restore]')) return
            openExistingQuote(q.id, container)
        })
        div.querySelector('[data-delete]')?.addEventListener('click', e => {
            e.stopPropagation()
            confirmAndArchive({ table: 'soumissions', id: q.id, item: q, role: currentRole, userId: currentUser.id, userName: myUserName, onSuccess: () => loadData(true, container), showConfirm: (msg, cb) => showConfirm(msg, cb, container), showAlert: msg => showAlertModal(msg, container) })
        })
        div.querySelector('[data-restore]')?.addEventListener('click', e => {
            e.stopPropagation()
            confirmAndRestore({ table: 'soumissions', id: q.id, role: currentRole, onSuccess: () => loadData(true, container), showConfirm: (msg, cb) => showConfirm(msg, cb, container), showAlert: msg => showAlertModal(msg, container) })
        })
        listContainer.appendChild(div)
    })

    if (quotesHasMore) {
        const btn = document.createElement('button')
        btn.textContent = `Charger ${PAGE_SIZE} soumissions de plus...`
        btn.style.cssText = 'width:100%;padding:14px;margin-top:10px;background:#2b2c36;color:#aaa;border:1px dashed #444;border-radius:10px;cursor:pointer;font-size:14px;font-weight:bold'
        btn.addEventListener('click', async () => {
            if (btn.disabled) return
            btn.disabled = true; btn.textContent = 'Chargement...'
            quotesPage++
            try { await loadData(false, container) }
            catch (e) { console.error('[soumissions] Erreur pagination:', e?.message); quotesPage--; btn.disabled = false; btn.textContent = `Charger ${PAGE_SIZE} soumissions de plus...` }
        })
        listContainer.appendChild(btn)
    }
}

function filterQuotes(container) {
    const term = container.querySelector('#searchInput').value.toLowerCase()
    const statusFilter = container.querySelector('#statusFilter')?.value || ''
    const isBureau = hasPermission('view_all_quotes')
    let baseList = currentQuoteTab === 'archives' ? quotesData
        : (!isBureau || currentQuoteTab === 'mine') ? quotesData.filter(q => q.authorId === currentUser.id || !q.authorId)
        : quotesData.filter(q => q.status !== 'brouillon')
    let filtered = baseList.filter(q => q.client.toLowerCase().includes(term) || String(q.id).toLowerCase().includes(term))
    if (statusFilter && currentQuoteTab === 'all') filtered = filtered.filter(q => q.status === statusFilter)
    const listContainer = container.querySelector('#quoteListContainer')
    listContainer.innerHTML = ''
    if (filtered.length === 0) { listContainer.innerHTML = '<div style="color:#888;text-align:center;padding:20px;font-style:italic">Aucun résultat.</div>'; return }
    filtered.forEach(q => {
        const div = document.createElement('div')
        div.className = 'quote-item'
        div.innerHTML = `<div class="inv-id">${sanitize(q.id)}</div><div class="inv-client">${sanitize(q.client)}</div><div class="inv-author">${sanitize(q.authorName)}</div><div class="inv-status"><span class="status-brouillon">${sanitize(q.status)}</span></div><div class="inv-date">${sanitize(q.date)}</div><div class="inv-actions"></div>`
        div.addEventListener('click', () => openExistingQuote(q.id, container))
        listContainer.appendChild(div)
    })
}

// ── Éditeur ─────────────────────────────────────────────────────────────────
function openExistingQuote(id, container) {
    const quote = quotesData.find(q => q.id === id)
    if (!quote) return
    currentQuoteId = id
    const viewDash = container.querySelector('#view-dashboard')
    const viewEditor = container.querySelector('#view-editor')
    const quoteContainer = container.querySelector('#quote-container')
    const zoomDisplay = container.querySelector('#zoom-level')

    viewDash.style.display = 'none'
    viewEditor.style.display = 'flex'
    quoteContainer.innerHTML = ''
    quotePageCount = 0; globalSigCount = 0

    for (let i = 0; i < (quote.pageCount || 1); i++) quoteContainer.appendChild(createQuotePageHTML())

    const allInputs = quoteContainer.querySelectorAll('input, textarea.desc-textarea')
    if (quote.inputValues) allInputs.forEach((inp, idx) => { if (quote.inputValues[idx] !== undefined) inp.value = quote.inputValues[idx] })
    const allSigs = quoteContainer.querySelectorAll('.display-sig')
    if (quote.sigValues) allSigs.forEach((img, idx) => { if (quote.sigValues[idx]) img.src = quote.sigValues[idx] })

    resizeAllDescTextareas(quoteContainer)
    applyEditorSecurity(quote, container)
    zoomCtrl?.fitToScreen()
    refreshIndicators(quoteContainer)
    watchContainer(quoteContainer)
    attachAll(quoteContainer)

    if (!quote.isArchived && (!quote.status || quote.status === 'brouillon')) startAutosave(quoteContainer)
}

function openNewQuote(viewDash, viewEditor, quoteContainer, zoomDisplay) {
    try { localStorage.removeItem('fdussault_draft_soumission_new') } catch {}
    currentQuoteId = null
    viewDash.style.display = 'none'
    viewEditor.style.display = 'flex'
    quoteContainer.innerHTML = ''
    quotePageCount = 0; globalSigCount = 0
    quoteContainer.appendChild(createQuotePageHTML())
    const numInput = quoteContainer.querySelector('.red-quote-input')
    if (numInput) numInput.value = 'S-' + Date.now().toString().slice(-4)

    const container = quoteContainer.closest('.soum-main').parentElement
    applyEditorSecurity(null, container)
    zoomCtrl?.fitToScreen()
    watchContainer(quoteContainer)
    attachAll(quoteContainer)
    startAutosave(quoteContainer)
}

function showDashboard(viewDash, viewEditor, container) {
    stopAutosave()
    viewDash.style.display = 'flex'
    viewEditor.style.display = 'none'
    loadData(true, container)
}

function applyEditorSecurity(quote, container) {
    const isBureau = hasPermission('view_all_quotes')
    const status = quote?.status || 'brouillon'
    const isAuthor = quote ? (quote.authorId === currentUser.id || !quote.authorId) : true
    const isArchived = quote?.isArchived === true
    let canEdit = status === 'brouillon' && isAuthor
    if (isArchived) canEdit = false

    const show = el => { if (el) el.style.display = canEdit ? 'flex' : 'none' }
    show(container.querySelector('#btnSave'))
    show(container.querySelector('#btnSend'))
    show(container.querySelector('#btnAddPage'))
    show(container.querySelector('#btnDupPage'))
    show(container.querySelector('#btnDelPage'))
    show(container.querySelector('#btnClear'))

    const btnConvert = container.querySelector('#btnConvert')
    if (btnConvert) btnConvert.style.display = (status === 'En attente' && isBureau) ? 'flex' : 'none'

    const btnUnlock = container.querySelector('#btnUnlock')
    if (btnUnlock) btnUnlock.style.display = (isBureau && status !== 'brouillon' && status !== 'Convertie' && !isArchived) ? 'flex' : 'none'

    toggleInputs(canEdit, container)
}

function toggleInputs(canEdit, container) {
    const qc = container.querySelector('#quote-container')
    qc?.querySelectorAll('input, textarea.desc-textarea').forEach(inp => {
        if (!canEdit) { inp.setAttribute('readonly', true); inp.style.pointerEvents = 'none' }
        else { inp.removeAttribute('readonly'); inp.style.pointerEvents = 'auto' }
    })
    qc?.querySelectorAll('.display-sig').forEach(img => { img.style.pointerEvents = canEdit ? 'auto' : 'none' })
}

function unlockQuote(container) {
    toggleInputs(true, container)
    const btnSave = container.querySelector('#btnSave')
    const btnUnlock = container.querySelector('#btnUnlock')
    if (btnSave) btnSave.style.display = 'flex'
    if (btnUnlock) btnUnlock.style.display = 'none'
    ;['#btnAddPage', '#btnDupPage', '#btnDelPage', '#btnClear'].forEach(sel => {
        const el = container.querySelector(sel)
        if (el) el.style.display = 'flex'
    })
    showAlertModal("Soumission débloquée. N'oubliez pas de sauvegarder.", container)
}

// ── Sauvegarde ───────────────────────────────────────────────────────────────
async function saveCurrentQuote(isSending, quoteContainer, container) {
    const firstPage = quoteContainer.querySelector('.page')
    if (!firstPage) return false

    const btnSave = container.querySelector('#btnSave')
    const origHTML = btnSave?.innerHTML
    if (btnSave) { btnSave.disabled = true; btnSave.innerHTML = '<svg style="animation:spin 1s linear infinite" viewBox="0 0 24 24" width="16" height="16" style="stroke:white;fill:none;stroke-width:2"><circle cx="12" cy="12" r="10" stroke-dasharray="40" stroke-dashoffset="10"/></svg> Sauvegarde...' }

    const inputs = firstPage.querySelectorAll('.top-section input')
    const clientName = inputs[0]?.value.trim() || 'Client Inconnu'
    const dateVal = inputs[4]?.value.trim() || new Date().toLocaleDateString()
    const quoteNumInput = firstPage.querySelector('.red-quote-input')
    const quoteNum = (quoteNumInput?.value.trim()) || 'S-Draft-' + Date.now().toString().slice(-4)

    const inputValues = Array.from(quoteContainer.querySelectorAll('input, textarea.desc-textarea')).map(i => i.value)
    const sigValues = Array.from(quoteContainer.querySelectorAll('.display-sig')).map(img => img.getAttribute('src'))
    const pageCount = quoteContainer.querySelectorAll('.page').length

    const existing = quotesData.find(q => q.id === currentQuoteId || q.id === quoteNum)
    let currentStatus = existing?.status || 'brouillon'
    if (isSending) currentStatus = 'En attente'

    const payload = {
        id: quoteNum, client: clientName, date: dateVal, status: currentStatus,
        input_values: inputValues, sig_values: sigValues, page_count: pageCount,
        author_id: existing ? existing.authorId : currentUser.id,
        author_name: existing ? existing.authorName : myUserName
    }

    const { error } = await withRetry(() => supabase.from('soumissions').upsert(payload))

    if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = origHTML }

    if (error) {
        const msg = (error.message || '').toLowerCase()
        let userMsg = msg.includes('lock broken') ? '❌ Réessayez dans 2 secondes.'
            : msg.includes('failed to fetch') ? '❌ Pas de connexion internet.'
            : '❌ Erreur : ' + error.message
        showAlertModal(userMsg, container)
        return false
    }

    currentQuoteId = quoteNum
    clearAutosaveCurrent()
    try { localStorage.removeItem('fdussault_draft_soumission_new') } catch {}
    await loadData(true, container)

    if (isSending) {
        showAlertModal('Soumission envoyée au bureau avec succès !', container)
        showDashboard(container.querySelector('#view-dashboard'), container.querySelector('#view-editor'), container)
    } else {
        showAlertModal('Brouillon sauvegardé avec succès !', container)
        applyEditorSecurity(payload.status ? { status: payload.status, authorId: payload.author_id, isArchived: false } : null, container)
    }
    return true
}

async function convertToInvoice(quoteContainer, container) {
    showConfirm('Convertir cette soumission en facture ?', async () => {
        await saveCurrentQuote(false, quoteContainer, container)
        const quote = quotesData.find(q => q.id === currentQuoteId)
        if (!quote) return

        const { data: invs } = await supabase.from('factures').select('id')
        let maxId = 1000
        if (invs) invs.forEach(i => { const n = parseInt(i.id); if (!isNaN(n) && n > maxId) maxId = n })
        const nextInvNum = (maxId + 1).toString()

        const { error } = await supabase.from('factures').insert([{
            id: nextInvNum, client: quote.client, date: new Date().toLocaleDateString(),
            status: 'brouillon', input_values: quote.inputValues, sig_values: quote.sigValues,
            page_count: quote.pageCount, author_id: currentUser.id, author_name: myUserName
        }])

        if (!error) {
            await supabase.from('soumissions').update({ status: 'Convertie' }).eq('id', currentQuoteId)
            showAlertModal(`Succès ! La facture #${nextInvNum} a été générée.`, container)
            showDashboard(container.querySelector('#view-dashboard'), container.querySelector('#view-editor'), container)
        } else {
            showAlertModal('❌ Erreur : ' + error.message, container)
        }
    }, container, 'Convertir en Facture', true)
}

function exportPdf(quoteContainer) {
    const firstPage = quoteContainer.querySelector('.page')
    if (!firstPage) return
    const inputs = firstPage.querySelectorAll('.top-section input')
    const clientName = inputs[0]?.value.trim() || ''
    const dateVal = inputs[4]?.value.trim() || new Date().toISOString().split('T')[0]
    const numInput = firstPage.querySelector('.red-quote-input')
    openPdfPreview({ container: quoteContainer, docType: 'soumission', docNumber: currentQuoteId || numInput?.value.trim(), clientName, date: dateVal })
}

// ── Page HTML ────────────────────────────────────────────────────────────────
function createQuotePageHTML() {
    quotePageCount++; globalSigCount++
    const page = document.createElement('div')
    page.className = 'page quote-style'
    const inputAttrs = `type="text" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false"`
    const taAttrs = `autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" rows="1"`
    let rows = ''
    for (let i = 0; i < 20; i++) {
        rows += `<tr><td><input ${inputAttrs}></td><td><textarea class="desc-textarea" ${taAttrs}></textarea></td><td><input ${inputAttrs}></td><td><input ${inputAttrs}></td></tr>`
    }
    page.innerHTML = `
        <div class="top-section">
            <div class="header-main">
                <img src="/assets/logo_dussault.png" alt="F. Dussault" onerror="this.style.display='none'">
                <h2>SOUMISSION / ESTIMATION</h2>
            </div>
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
                <td class="time-label-col"><span>Valide pour 30 jours</span><h2># TEMPS</h2></td>
                <td><table class="inner-table">
                    <tr class="row-headers">
                        <td style="width:25%">TARIF ESTIMÉ</td><td style="width:15%">CHARGE MIN.</td>
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
                <div class="sig-box"><img id="sig-p-${globalSigCount}" class="display-sig"><div class="sig-text">Signature (Approbation)</div></div>
                <div class="sig-box"><img id="sig-c-${globalSigCount}" class="display-sig"><div class="sig-text">Signature du client (Acception)</div></div>
                <div class="quote-num-box"><input type="text" class="red-quote-input" placeholder="No."></div>
            </div>
        </div>
    `
    return page
}

function duplicatePage(quoteContainer, zoomDisplay) {
    const pages = quoteContainer.querySelectorAll('.page')
    if (pages.length === 0) return
    const source = pages[pages.length - 1]
    const newPage = createQuotePageHTML()
    quoteContainer.appendChild(newPage)
    const sourceInputs = source.querySelectorAll('.top-section input')
    const newInputs = newPage.querySelectorAll('.top-section input')
    sourceInputs.forEach((inp, i) => { if (newInputs[i]) newInputs[i].value = inp.value })
    zoomCtrl?.applyZoom(zoomCtrl?.current ?? 1.0)
}

function deletePage(quoteContainer, container) {
    if (quoteContainer.children.length > 1) {
        quoteContainer.removeChild(quoteContainer.lastElementChild)
        quotePageCount--
    } else {
        showAlertModal('Impossible de supprimer la dernière page.', container)
    }
}

// ── Autosave ─────────────────────────────────────────────────────────────────
function startAutosave(quoteContainer) {
    if (autosave) { try { autosave.stop() } catch {} }
    autosave = createAutosave({
        module: 'soumission',
        containerSelector: '#quote-container',
        draftIdGetter: () => currentQuoteId
    })
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
function autoResizeTextarea(ta) {
    ta.style.height = 'auto'
    ta.style.height = ta.scrollHeight + 'px'
}

function resizeAllDescTextareas(container) {
    container.querySelectorAll('.desc-textarea').forEach(autoResizeTextarea)
}

function showConfirm(msg, callback, container, title = 'Confirmation', isConvert = false) {
    const modal = container.querySelector('#confirmModal')
    const titleEl = container.querySelector('#confirmTitle')
    const msgEl = container.querySelector('#confirmMsg')
    const yesBtn = container.querySelector('#btnConfirmYes')
    if (titleEl) titleEl.textContent = title
    if (msgEl) msgEl.innerHTML = msg
    if (yesBtn) {
        yesBtn.style.background = isConvert ? 'var(--btn-blue)' : 'var(--btn-red)'
        yesBtn.textContent = isConvert ? 'Convertir' : 'Oui'
    }
    confirmCallback = callback
    modal?.classList.add('open')
}

function closeConfirmModal(container) {
    container.querySelector('#confirmModal')?.classList.remove('open')
    confirmCallback = null
}

function showAlertModal(msg, container) {
    const modal = container.querySelector('#alertModal')
    const msgEl = container.querySelector('#alertMsg')
    if (msgEl) msgEl.innerHTML = msg
    modal?.classList.add('open')
}