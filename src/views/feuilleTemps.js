// src/views/feuilleTemps.js
// Migré fidèlement depuis code_feuille_de_temps/code_feuille_de_temps.html

import { supabase } from '../supabase.js'
import { currentUser, currentRole, currentProfil, hasPermission } from '../auth.js'
import { sanitize } from '../shared/sanitize.js'
import { friendlyError } from '../shared/errorMsg.js'
import { createAutosave } from '../shared/autosave.js'
import { canArchive, canSeeAllArchives, canRestore, confirmAndArchive, confirmAndRestore } from '../shared/archive.js'
import { openPdfPreview } from '../shared/pdfExport.js'
import { withRetry } from '../shared/withRetry.js'
import { enqueueOfflineSave } from '../shared/offlineQueue.js'
import { createZoomController } from '../shared/zoom.js'

// ── État local ──────────────────────────────────────────────────────────────
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

function canViewAllTimesheets() {
    return hasPermission('view_all_timesheets') || hasPermission('approve_timesheets')
}

// ── Render principal ────────────────────────────────────────────────────────
export async function render(container) {
    myUserName = currentProfil?.prenom_nom || 'Employé'
    currentInvTab = 'mine'

    container.innerHTML = `
    <style>
        /* --blue-bg défini dans styles.css : #d1e9ff */
        .fdt-main { font-family: 'Segoe UI', Arial, sans-serif; background: var(--bg-dark); color: var(--text-main); height: 100%; display: flex; flex-direction: column; overflow: hidden; }
        .badge-status { padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; display: inline-flex; align-items: center; gap: 5px; }
        .b-brouillon { background: rgba(136,136,136,0.15); color: #888; }
        .b-envoye    { background: rgba(52,152,219,0.15);  color: var(--btn-blue); }
        .b-attente   { background: rgba(252,202,70,0.15);  color: var(--accent); }
        .b-paye      { background: rgba(40,167,69,0.15);   color: var(--btn-green); }
        .b-renvoye   { background: rgba(255,77,77,0.15);   color: var(--btn-red); }
        #view-dashboard { padding: 30px; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .dash-header { display: flex; justify-content: space-between; align-items: center; }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .tabs-container { display: flex; gap: 10px; margin-bottom: 5px; }
        .btn-tab { background: #1a1b23; color: #aaa; border: 1px solid #444; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
        .btn-tab svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-tab.active { background: var(--btn-blue); color: white; border-color: var(--btn-blue); }
        .toolbar { display: flex; gap: 15px; align-items: center; background: var(--bg-panel); padding: 15px; border-radius: 12px; }
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input { width: 100%; background: var(--bg-dark); border: 1px solid var(--border); color: white; padding: 14px 15px 14px 45px; border-radius: 8px; font-size: 16px; outline: none; transition: 0.2s; }
        .search-box input:focus { border-color: var(--accent); }
        .search-icon { position: absolute; left: 15px; color: #888; pointer-events: none; display: flex; align-items: center; }
        .search-icon svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .invoice-list { display: flex; flex-direction: column; gap: 10px; padding-bottom: 30px; }
        .invoice-item { background: var(--bg-panel); padding: 12px 20px; border-radius: 10px; display: grid; grid-template-columns: 240px 1fr 130px 100px 44px; align-items: center; gap: 15px; cursor: pointer; border: 1px solid transparent; border-left: 4px solid transparent; transition: 0.2s; }
        .invoice-item:hover { transform: translateX(5px); background: #343542; border-left-color: var(--accent); background-color: #30313c; border-color: #555;}
        .inv-id { font-weight: bold; color: var(--accent); font-size: 14px; white-space: nowrap; }
        .inv-client { font-weight: bold; font-size: 16px; color: white; display: flex; align-items: center; gap: 6px; }
        .inv-client svg { width: 16px; height: 16px; stroke: #aaa; fill: none; stroke-width: 2; }
        .inv-hours { font-weight: bold; font-size: 18px; color: var(--accent); text-align: center; }
        .inv-status { display: flex; align-items: center; }
        .inv-actions { display: flex; justify-content: flex-end; }
        .btn-icon { background: #444; border: none; width: 36px; height: 36px; border-radius: 8px; display: flex; justify-content: center; align-items: center; cursor: pointer; color: white; }
        .btn-delete { background: rgba(255,77,77,0.1); color: var(--btn-red); border: 1px solid transparent; }
        .btn-delete:hover { background: var(--btn-red); color: white; }
        .arc-selectable { position: relative; padding-left: 48px !important; }
        .arc-check { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; border-radius: 50%; border: 2px solid #444; background: transparent; display: flex; align-items: center; justify-content: center; transition: border-color 0.15s, background 0.15s; pointer-events: none; }
        .arc-selected .arc-check { border-color: var(--btn-blue,#007bff); background: var(--btn-blue,#007bff); }
        .arc-selected { background: rgba(0,120,255,0.05) !important; border-left-color: var(--btn-blue,#007bff) !important; }
        #view-editor { display: none; flex-direction: column; height: 100%; }
        #note-refus-box { display: none; background: rgba(255,77,77,0.1); border: 1px solid var(--btn-red); border-radius: 8px; padding: 12px 16px; margin: 10px 20px 0; color: var(--btn-red); }
        .top-bar { height: auto; min-height: 80px; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 10px 20px; background: rgba(30,31,38,0.95); border-bottom: 1px solid #333; z-index: 101; flex-wrap: wrap; }
        .action-btn { background: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; white-space: nowrap; transition: 0.2s; }
        .action-btn:hover { background: var(--accent-hover); transform: translateY(-1px); background-color: var(--accent-hover);}
        .action-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-back { background: #6c757d !important; color: white !important; }
        .btn-save { background: var(--btn-green) !important; color: white !important; }
        .btn-send { background: var(--btn-blue) !important; color: white !important; }
        .btn-unlock { background: var(--btn-orange) !important; color: white !important; }
        @media (max-width: 1024px) {
            .top-bar { padding: 10px 85px 10px 10px; gap: 10px; height: 65px; overflow-x: auto; justify-content: flex-start; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; }
            .top-bar::-webkit-scrollbar { display: none; }
            .top-bar .action-btn { flex-shrink: 0; width: auto; margin-bottom: 0; font-size: 11px; padding: 8px 15px; }
        }
        .scroll-area { flex: 1; overflow: auto; padding: 15px 0; display: block; touch-action: none; }
        #zoom-wrapper { display: block; width: 8.5in; transform-origin: 0 0; padding-bottom: 50px; }
        .zoom-controls { position: fixed; bottom: 20px; right: 20px; background: rgba(30,31,38,0.95); padding: 5px 15px; border-radius: 50px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); z-index: 2000; border: 1px solid #555; }
        .zoom-controls button { background: var(--accent); border: none; width: 32px; height: 32px; border-radius: 50%; font-weight: bold; font-size: 18px; cursor: pointer; display: flex; justify-content: center; align-items: center; color: #1e1f26; }
        .zoom-controls span { color: white; font-size: 12px; font-weight: bold; min-width: 45px; text-align: center; }
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
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; z-index: 4000; justify-content: center; align-items: center; padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px); box-sizing: border-box; }
        .custom-modal-overlay.open { display: flex; }
        .custom-modal-card { background: var(--bg-panel); width: 350px; padding: 25px; border-radius: 12px; border: 1px solid #555; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5);}
        .custom-modal-title { font-size: 20px; color: var(--btn-red); margin-bottom: 15px; font-weight: bold; }
        .custom-modal-msg { color: var(--text-main); margin-bottom: 25px; font-size: 15px; line-height: 1.4; }
        .custom-modal-actions { display: flex; justify-content: center; gap: 10px; }
        .btn-modal-cancel { background: #444; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
        .btn-modal-confirm { background: var(--btn-red); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
        .btn-modal-ok { background: var(--accent); color: black; border: none; padding: 10px 30px; border-radius: 6px; cursor: pointer; font-weight: bold; }
        @media (min-width: 769px) and (max-width: 1024px) { #view-dashboard { padding: 20px; } }
        @media (max-width: 768px) {
            #view-dashboard { padding: 15px; }
            .dash-header { flex-direction: column; align-items: flex-start; gap: 15px; width: 100%; }
            .dash-title { padding-right: 80px; width: 100%; }
            .dash-header .action-btn { width: 100%; justify-content: center; font-size: 14px; }
            .tabs-container { flex-direction: column; width: 100%; }
            .btn-tab { width: 100%; justify-content: center; }
            .invoice-item { grid-template-columns: 1fr auto; grid-template-areas: "id id" "client client" "status hours"; gap: 4px 12px; padding: 16px; border-radius: 12px; border: 1px solid #3a3b46; border-left: 1px solid #3a3b46; margin-bottom: 12px; position: relative; }
            .inv-id { grid-area: id; } .inv-client { grid-area: client; } .inv-status { grid-area: status; } .inv-hours { grid-area: hours; text-align: right; }
            .inv-actions { position: absolute; top: 16px; right: 16px; }
            .zoom-controls { display: none !important; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    </style>

    <div class="fdt-main">
        <div id="view-dashboard">
            <div class="dash-header">
                <div class="dash-title"><h1>Feuilles de Temps</h1><p>Création et suivi de vos heures</p></div>
                <button class="action-btn" id="btnNewSheet">
                    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Nouvelle Feuille
                </button>
            </div>

            <div class="tabs-container" id="timesheet-tabs" style="display:none">
                <button id="tab-mine" class="btn-tab active">
                    <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Mes Feuilles
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
                    <input type="text" id="searchInput" placeholder="Rechercher (Nom, Date...)">
                </div>
            </div>
            <div id="ts-compteur" style="color:#888;font-size:12px;padding:5px 10px"></div>
            <div class="invoice-list" id="timesheetListContainer"></div>
        </div>


        <div id="note-refus-box">
            <strong>↩️ Renvoyé pour correction :</strong>
            <div id="note-refus-text" style="color:#ffaaaa;margin-top:5px;font-size:14px"></div>
        </div>

        <div id="view-editor">
            <div class="top-bar">
                <button class="action-btn btn-back" id="btnBack">
                    <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    Retour
                </button>
                <button class="action-btn" id="btnApprove" style="display:none;background:var(--btn-green);color:white">
                    <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Approuver
                </button>
                <button class="action-btn" id="btnReturn" style="display:none;background:var(--btn-red);color:white">
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
            <div class="custom-modal-title" style="color:var(--accent)">Information</div>
            <div class="custom-modal-msg" id="alertMsg"></div>
            <div class="custom-modal-actions"><button class="btn-modal-ok" id="btnAlertOk">Compris</button></div>
        </div>
    </div>

    <!-- Modal refus -->
    <div class="custom-modal-overlay" id="refusModal">
        <div class="custom-modal-card" style="width:420px;text-align:left">
            <div class="custom-modal-title">↩️ Renvoyer pour correction</div>
            <p style="color:#aaa;font-size:14px;margin-bottom:15px">Expliquez à l'employé ce qui doit être corrigé :</p>
            <textarea id="refusNote" placeholder="Ex: Il manque les heures du mercredi 15..." style="width:100%;height:100px;background:var(--bg-dark);color:white;border:1px solid var(--border);padding:12px;border-radius:8px;font-family:sans-serif;font-size:14px;outline:none;resize:none;box-sizing:border-box"></textarea>
            <div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end">
                <button style="background:#444;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer" id="btnCloseRefus">Annuler</button>
                <button style="background:var(--btn-red);color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold" id="btnConfirmRefus">↩️ Renvoyer</button>
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

    // Dashboard
    container.querySelector('#btnNewSheet').addEventListener('click', () => openNewTimesheet(viewDash, viewEditor, wrapper, zoomDisplay, container))

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
    container.querySelector('#btnPdf').addEventListener('click', () => exportPdf(wrapper))
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

    let query = supabase.from('feuilles_de_temps').select('id, employe_nom, periode, status, total_heures, total_heures_sup, author_id, author_name, return_note, is_archived')
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
            isArchived: db.is_archived === true
        }))
        timesheetsData = reset ? mapped : [...timesheetsData, ...mapped]
    }
    filterTimesheets(container)
}

function switchTab(tab, container) {
    archiveSelection.clear()
    currentInvTab = tab
    container.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'))
    container.querySelector(`#tab-${tab}`)?.classList.add('active')
    container.querySelector('#view-dashboard').style.display = 'flex'
    loadData(true, container)
}

// ── Rendu liste ─────────────────────────────────────────────────────────────
function renderTimesheetList(list, container) {
    const listContainer = container.querySelector('#timesheetListContainer')
    listContainer.innerHTML = ''
    const isBureau = canViewAllTimesheets()

    const compteur = container.querySelector('#ts-compteur')
    if (compteur) compteur.textContent = `${timesheetsData.length} feuille(s) chargée(s)${tsHasMore ? ' — il y en a plus' : ''}`

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
        if (sheet.isArchived) badgeHTML = `<span class="badge-status" style="background:#555">Archivée</span>`
        else if (sheet.status === 'brouillon') badgeHTML = `<span class="badge-status b-brouillon">Brouillon</span>`
        else if (sheet.status === 'envoye') badgeHTML = `<span class="badge-status b-envoye">${!isBureau ? 'Envoyée' : 'En attente'}</span>`
        else if (sheet.status === 'approuve') badgeHTML = `<span class="badge-status b-paye">Approuvée</span>`
        else if (sheet.status === 'renvoye') badgeHTML = `<span class="badge-status b-renvoye">Renvoyée</span>`

        let actionsHTML = '<div style="width:36px"></div>'
        if (sheet.isArchived) {
            if (canRestore(currentRole)) actionsHTML = `<button class="btn-icon" style="background:rgba(40,167,69,0.15);color:#28a745" data-restore="${sheet.id}">↺</button>`
        } else {
            const verdict = canArchive(sheet, currentRole, currentUser.id)
            if (verdict.allowed) actionsHTML = `<button class="btn-icon btn-delete" data-delete="${sheet.id}">
                <svg viewBox="0 0 24 24" width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>`
        }

        const div = document.createElement('div')
        div.className = 'invoice-item'
        div.innerHTML = `
            <div class="inv-id">${sanitize(sheet.periode || 'Période inconnue')}</div>
            <div class="inv-client"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${sanitize(sheet.employe || sheet.authorName || 'Employé')}</div>
            <div class="inv-hours">
                ${sanitize(String(sheet.total_heures ?? ''))} h
            </div>
            <div class="inv-status">${badgeHTML}</div>
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
            div.addEventListener('click', e => { if (e.target.closest('[data-delete],[data-restore]')) return; openExistingTimesheet(sheet.id, container) })
        }
        div.querySelector('[data-delete]')?.addEventListener('click', e => {
            e.stopPropagation()
            confirmAndArchive({ table: 'feuilles_de_temps', id: sheet.id, item: sheet, role: currentRole, userId: currentUser.id, userName: myUserName, onSuccess: () => loadData(true, container), showConfirm: (msg, cb) => showConfirmModal(msg, cb, container), showAlert: msg => showAlertModal(msg, container) })
        })
        div.querySelector('[data-restore]')?.addEventListener('click', e => {
            e.stopPropagation()
            confirmAndRestore({ table: 'feuilles_de_temps', id: sheet.id, role: currentRole, onSuccess: () => loadData(true, container), showConfirm: (msg, cb) => showConfirmModal(msg, cb, container), showAlert: msg => showAlertModal(msg, container) })
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
        <button id="bar-ts-delete" style="background:rgba(220,53,69,0.18);color:#dc3545;border:1px solid rgba(220,53,69,0.3);padding:7px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;margin-left:auto">Supprimer définitivement</button>
    `
    bar.querySelector('#bar-ts-delete').addEventListener('click', () => {
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
    const isBureau = canViewAllTimesheets()
    let base = currentInvTab === 'archives' ? timesheetsData
        : (!isBureau || currentInvTab === 'mine') ? timesheetsData.filter(s => s.authorId === currentUser.id || !s.authorId)
        : timesheetsData.filter(s => s.status !== 'brouillon')
    const filtered = base.filter(s => (s.employe || s.authorName || '').toLowerCase().includes(term) || (s.periode || '').toLowerCase().includes(term))
    renderTimesheetList(filtered, container)
}

// ── Éditeur ─────────────────────────────────────────────────────────────────
function openNewTimesheet(viewDash, viewEditor, wrapper, zoomDisplay, container) {
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
    stopAutosave()
    viewDash.style.display = 'flex'
    viewEditor.style.display = 'none'
    currentInvTab = 'mine'
    container.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'))
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

    const show = (id, v) => { const el = container.querySelector(id); if (el) el.style.display = v ? 'flex' : 'none' }
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

function exportPdf(wrapper) {
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
            <td><input type="number" step="0.5" class="cell-input heure-input"></td>
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