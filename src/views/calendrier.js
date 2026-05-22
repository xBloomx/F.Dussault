// src/views/calendrier.js
// Migré fidèlement depuis code_calendrier/code_calendrier.html

import { supabase } from '../supabase.js'
import { currentUser, currentRole, currentProfil, hasPermission } from '../auth.js'
import { withRetry } from '../shared/withRetry.js'
import { sanitize } from '../shared/sanitize.js'
import { friendlyError } from '../shared/errorMsg.js'
import { showToast } from '../shared/toast.js'

// ── État local ──────────────────────────────────────────────────────────────
let myUserName = ''
let currentCalId = 'perso'
let teamMembers = []
let selectedDayForAdd = ''
let allData = [], calDefs = [], events = []
let calDate = new Date()
let currentViewId = null
let editingEventId = null
let isUrgenceMode = false
let isSystemEvent = false
let userFormations = []
let currentSysEvents = []
let confirmCallback = null

const FIXED_CATEGORIES = [
    { id: 'ferie',     name: 'Congé Férié',          color: '#ffc107' },
    { id: 'ccq',       name: 'Congés CCQ',           color: '#ff4d4d' },
    { id: 'job',       name: 'Job / Chantier',       color: '#007bff' },
    { id: 'perso',     name: 'Congés personnel',     color: 'var(--btn-purple)' },
    { id: 'note',      name: 'Note',                 color: '#6c757d' },
    { id: 'urgence',   name: 'Garde Urgence',        color: '#ff4757' },
    { id: 'formation', name: 'Expiration Formation', color: '#28a745' }
]
const ALLOWED_ADD_CATS = ['job', 'perso', 'note']

// ── Render principal ────────────────────────────────────────────────────────
export async function render(container) {
    container.innerHTML = `
    <style>
        :root { --cal-grid-border: #444; --cal-header-bg: #333; }
        .cal-main { padding: 30px; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .dash-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 15px; flex-wrap: wrap; }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .action-btn { background-color: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; white-space: nowrap; }
        .action-btn:hover { background-color: var(--accent-hover); transform: translateY(-2px); }
        .action-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .tabs-container { display: flex; gap: 10px; flex-wrap: wrap; }
        .btn-tab { background: #1a1b23; color: #aaa; border: 1px solid #444; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
        .btn-tab svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-tab.active { background: var(--btn-blue); color: white; border-color: var(--btn-blue); }
        .btn-tab-dashed { border: 1px dashed #888; background: transparent; color: #888; }
        .btn-tab-dashed:hover { border-color: white; color: white; }
        .cal-controls { display: flex; justify-content: space-between; align-items: center; background-color: var(--bg-panel); padding: 15px; border-radius: 12px; }
        .cal-nav-btn { background: #444; color: white; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .cal-nav-btn svg { width: 20px; height: 20px; stroke: currentColor; fill: none; stroke-width: 2; }
        .cal-nav-btn:hover { background: var(--accent); color: black; }
        .cal-month-title { font-size: 24px; font-weight: bold; color: white; text-transform: capitalize; }
        .calendar-wrapper { flex: none; background: var(--bg-panel); border-radius: 12px; border: 1px solid var(--cal-grid-border); overflow-x: auto; display: flex; flex-direction: column; }
        .day-headers { display: grid; grid-template-columns: repeat(7, 1fr); min-width: 700px; }
        .day-header { background: var(--cal-header-bg); color: #aaa; display: flex; align-items: center; justify-content: center; font-weight: bold; border-bottom: 1px solid var(--cal-grid-border); border-right: 1px solid var(--cal-grid-border); padding: 10px 0; }
        .cal-days-container { display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: 100px; align-content: start; min-width: 700px; }
        .cal-day { border-right: 1px solid var(--cal-grid-border); border-bottom: 1px solid var(--cal-grid-border); padding: 5px; position: relative; background: var(--bg-panel); cursor: pointer; transition: background 0.2s; height: 100px; max-height: 100px; overflow-y: auto; -ms-overflow-style: none; scrollbar-width: none; }
        .cal-day::-webkit-scrollbar { display: none; }
        .cal-day:hover { background: #343542; }
        .cal-day.today { background: rgba(252,202,70,0.05); }
        .cal-day.today .day-num { background: var(--accent); color: black; }
        .cal-day.other-month { opacity: 0.4; background: #222; pointer-events: none; }
        .day-num { font-weight: bold; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin-bottom: 5px; font-size: 14px; pointer-events: none; color: #ddd; }
        .event-bar { font-size: 11px; padding: 2px 6px; margin-bottom: 3px; border-radius: 4px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; position: relative; display: flex; justify-content: space-between; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
        .event-bar:hover { opacity: 0.9;  transform: scale(1.01); }
        .event-mine { border-left: 3px solid var(--accent); }
        .urgence-badge { position: absolute; top: 5px; right: 5px; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; box-shadow: 0 2px 5px rgba(0,0,0,0.5); z-index: 10; cursor: pointer; transition: transform 0.2s; }
        .urgence-badge svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .urgence-badge:hover { transform: scale(1.15); }
        .urgence-badge.filled { background: #ff4757; color: white; border: 1px solid rgba(255,255,255,0.3); }
        .urgence-badge.empty { background: rgba(255,255,255,0.1); color: #777; border: 1px dashed #555; }
        .legend-container { display: flex; gap: 15px; font-size: 12px; color: #aaa; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.2); padding: 4px 10px; border-radius: 20px; }
        .legend-dot { width: 12px; height: 12px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; z-index: 3000; justify-content: center; align-items: center; padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px); box-sizing: border-box; }
        .modal-overlay.open { display: flex; }
        .modal-card { background: var(--bg-panel); width: 90%; max-width: 450px; padding: 25px; border-radius: 15px; border: 1px solid #555; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-height: 90vh; overflow-y: auto; }
        .modal-title { font-size: 20px; color: white; margin-bottom: 20px; font-weight: bold; border-bottom: 1px solid #444; padding-bottom: 10px; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; color: #aaa; margin-bottom: 5px; font-size: 14px; font-weight: bold; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; background: var(--bg-dark); border: 1px solid var(--border); color: white; border-radius: 5px; font-family: sans-serif; outline: none; transition: 0.2s; box-sizing: border-box; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--accent); }
        .form-group input[type="date"] { color-scheme: dark; cursor: pointer; }
        .select-wrap { position: relative; display: block; }
        .select-wrap select { -webkit-appearance: none; appearance: none; padding-right: 42px; cursor: pointer; }
        .select-wrap .sel-chevron { position: absolute; right: 13px; top: 50%; transform: translateY(-50%); pointer-events: none; width: 18px; height: 18px; stroke: #888; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
        .form-group textarea { resize: vertical; min-height: 80px; }
        .guest-list-container { background: var(--bg-dark); border: 1px solid var(--border); border-radius: 5px; padding: 10px; max-height: 120px; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; }
        .guest-item { display: flex; align-items: center; gap: 10px; color: white; font-size: 14px; cursor: pointer; }
        .guest-item input { width: 16px; height: 16px; cursor: pointer; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
        .btn-cancel { background: #444; color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; transition: 0.2s;}
        .btn-submit { background: var(--btn-green); color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 6px; transition: 0.2s;}
        .btn-submit svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-delete-evt { background: var(--btn-red); color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 6px; }
        .btn-delete-evt svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .view-row { margin-bottom: 12px; font-size: 14px; }
        .view-label { color: #aaa; font-size: 12px; font-weight: bold; margin-bottom: 4px; }
        .view-value { color: white; font-weight: bold; font-size: 16px; margin-top: 2px; }
        .note-box { background: var(--bg-dark); padding: 12px; border-radius: 8px; border: 1px solid var(--border); font-weight: normal; font-size: 14px; white-space: pre-wrap; line-height: 1.4; }
        .day-detail-item { padding: 12px; background: var(--bg-dark); border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: 0.2s; display: flex; flex-direction: column; gap: 4px; border: 1px solid var(--border); }
        .day-detail-item:hover { background: #343542; border-color: var(--btn-blue); }
        @media (min-width: 769px) and (max-width: 1024px) {
            .cal-main { padding: 20px; gap: 15px; }
        }
        @media (max-width: 768px) {
            .cal-main { padding: 12px; gap: 10px; }
            .dash-header { flex-direction: column; align-items: flex-start; gap: 15px; width: 100%; }
            .dash-title { padding-right: 80px; width: 100%; }
            .dash-title h1 { font-size: 28px; }
            .dash-title p { font-size: 13px; margin: 3px 0 0; }
            .dash-header > div:last-child { width: 100%; gap: 8px; }
            .dash-header .action-btn { width: 100%; justify-content: center; border-radius: 12px; }
            .tabs-container { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .btn-tab { justify-content: center; padding: 11px 8px; font-size: 13px; border-radius: 10px; }
            .btn-tab-dashed { grid-column: 1 / -1; justify-content: center; }
            .cal-month-title { font-size: 18px; }
            .day-header { font-size: 11px; padding: 8px 0; }
            .cal-day { padding: 5px; height: 100px; max-height: 100px; }
            .day-num { width: 22px; height: 22px; font-size: 11px; }
            .event-bar { font-size: 10px; padding: 3px 5px; }
            .urgence-badge { top: 4px; right: 4px; width: 20px; height: 20px; font-size: 10px; }
            .modal-card { width: 95%; padding: 20px; }
        }
    </style>

    <div class="cal-main">
        <div class="dash-header">
            <div class="dash-title">
                <h1>Calendriers</h1>
                <p>Personnel, Global et Équipes</p>
            </div>
            <div style="display:flex;gap:10px;">
                <button class="action-btn" id="btnDeleteCal" style="display:none;background:var(--btn-red);color:white;flex-shrink:0">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Effacer ce calendrier
                </button>
                <button class="action-btn" id="btnAddEvent">
                    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Événement
                </button>
            </div>
        </div>

        <div class="tabs-container" id="calTabsContainer"></div>
        <div class="legend-container" id="legendContainer"></div>

        <div class="cal-controls">
            <button class="cal-nav-btn" id="btnPrevMonth">
                <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="cal-month-title" id="calTitle">...</div>
            <button class="cal-nav-btn" id="btnNextMonth">
                <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
        </div>

        <div class="calendar-wrapper">
            <div class="day-headers">
                <div class="day-header">Dim</div><div class="day-header">Lun</div><div class="day-header">Mar</div>
                <div class="day-header">Mer</div><div class="day-header">Jeu</div><div class="day-header">Ven</div><div class="day-header">Sam</div>
            </div>
            <div class="cal-days-container" id="calendarDays"></div>
        </div>
    </div>

    <!-- Modal nouveau calendrier -->
    <div class="modal-overlay" id="newCalModal">
        <div class="modal-card">
            <div class="modal-title">Créer un calendrier partagé</div>
            <div class="form-group">
                <label>Nom du calendrier</label>
                <input type="text" id="newCalName" placeholder="Ex: Équipe Chantier B">
            </div>
            <div class="form-group">
                <label>Partager avec :</label>
                <div class="guest-list-container" id="calGuestListContainer"></div>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" id="btnCloseNewCal">Annuler</button>
                <button class="btn-submit" id="btnSaveNewCal">
                    <svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Créer
                </button>
            </div>
        </div>
    </div>

    <!-- Modal détails du jour -->
    <div class="modal-overlay" id="dayModal">
        <div class="modal-card">
            <div class="modal-title" id="dayModalTitle">Événements du ...</div>
            <div id="dayModalContent" style="display:flex;flex-direction:column;max-height:50vh;overflow-y:auto;margin-bottom:15px"></div>
            <div class="modal-actions" style="justify-content:space-between">
                <button class="btn-cancel" id="btnCloseDayModal">Fermer</button>
                <button class="action-btn" id="btnAddFromDay">
                    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Ajouter ici
                </button>
            </div>
        </div>
    </div>

    <!-- Modal ajout/édition événement -->
    <div class="modal-overlay" id="addModal">
        <div class="modal-card">
            <div class="modal-title" id="modalTitle">Nouvel Événement</div>
            <div class="form-group" id="grpCalendar">
                <label>Calendrier de destination</label>
                <div class="select-wrap">
                    <select id="evtCalendarId"></select>
                    <svg class="sel-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
            </div>
            <div class="form-group" id="grpCategory">
                <label>Catégorie</label>
                <div class="select-wrap">
                    <select id="evtCategory"></select>
                    <svg class="sel-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
            </div>
            <div class="form-group">
                <label>Titre / Nom du chantier</label>
                <input type="text" id="evtTitle" placeholder="Ex: Rénovation école">
            </div>
            <div style="display:flex;gap:15px">
                <div class="form-group" style="flex:1">
                    <label>Début</label>
                    <input type="date" id="evtStart">
                </div>
                <div class="form-group" style="flex:1">
                    <label>Fin (Inclus)</label>
                    <input type="date" id="evtEnd">
                </div>
            </div>
            <div class="form-group" id="grpGuests">
                <label>Assigner / Partager l'événement avec :</label>
                <div class="guest-list-container" id="guestListContainer"></div>
            </div>
            <div class="form-group">
                <label>Notes & Adresse</label>
                <textarea id="evtNote" placeholder="Détails du travail, informations..."></textarea>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" id="btnCloseAddModal">Annuler</button>
                <button class="btn-submit" id="btnSaveEvent">
                    <svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Sauvegarder
                </button>
            </div>
        </div>
    </div>

    <!-- Modal vue événement -->
    <div class="modal-overlay" id="viewModal">
        <div class="modal-card">
            <div class="modal-title" style="display:flex;justify-content:space-between;align-items:center">
                <span>Détails de l'événement</span>
                <span id="viewAuthorBadge" style="font-size:11px;background:#444;padding:3px 8px;border-radius:10px;font-weight:normal"></span>
            </div>
            <div class="view-row"><div class="view-label">TITRE</div><div class="view-value" id="viewTitle">...</div></div>
            <div class="view-row"><div class="view-label">CATÉGORIE</div><div class="view-value" id="viewCat" style="display:flex;align-items:center;gap:8px">...</div></div>
            <div class="view-row"><div class="view-label">DATES</div><div class="view-value" id="viewDates">...</div></div>
            <div class="view-row" id="viewGuestsContainer" style="display:none;margin-top:15px">
                <div class="view-label">ASSIGNÉ(S) À</div>
                <div class="view-value" id="viewGuests" style="font-size:14px;color:#66b2ff">...</div>
            </div>
            <div class="view-row" id="viewNoteContainer" style="display:none;margin-top:15px">
                <div class="view-label">NOTES / DÉTAILS / ADRESSE</div>
                <div class="view-value note-box" id="viewNote">...</div>
            </div>
            <div class="modal-actions" style="justify-content:space-between;margin-top:25px">
                <button class="btn-delete-evt" id="btnDeleteEvent" style="display:none">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Supprimer
                </button>
                <div style="display:flex;gap:10px">
                    <button class="btn-cancel" id="btnCloseViewModal">Fermer</button>
                    <button class="action-btn" id="btnEditEvent" style="display:none">
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Modifier
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal alerte -->
    <div class="modal-overlay" id="alertModal" style="z-index:5000">
        <div class="modal-card" style="width:320px;text-align:center">
            <div class="modal-title" style="color:var(--accent);margin-bottom:10px;border:none">Information</div>
            <p id="alertMessage" style="color:#e0e0e0;margin-bottom:25px;font-size:15px"></p>
            <button class="action-btn" style="width:100%;justify-content:center" id="btnCloseAlert">Compris</button>
        </div>
    </div>

    <!-- Modal confirmation -->
    <div class="modal-overlay" id="confirmModal" style="z-index:6000">
        <div class="modal-card" style="width:320px;text-align:center">
            <div class="modal-title" style="color:var(--btn-red);margin-bottom:10px;border:none">Attention</div>
            <p id="confirmMessage" style="color:#e0e0e0;margin-bottom:25px;font-size:15px"></p>
            <div style="display:flex;gap:10px">
                <button class="btn-cancel" style="flex:1" id="btnCancelConfirm">Non</button>
                <button class="btn-delete-evt" style="flex:1;justify-content:center" id="btnExecuteConfirm">Oui</button>
            </div>
        </div>
    </div>
    `

    await init()

    // ── Écouter les mises à jour de formations (depuis Profil) ─────────────
    const onFormationsUpdated = async () => {
        // Recharger les formations depuis la DB et rafraîchir le calendrier
        try {
            const { data: formData } = await supabase
                .from('formations')
                .select('id, nom, date_expiration')
                .eq('user_id', currentUser.id)
            userFormations = formData || []
        } catch { userFormations = [] }
        renderCalendar()
    }
    window.addEventListener('formations_updated', onFormationsUpdated)

    // Retourner la fonction de cleanup
    return function cleanup() {
        window.removeEventListener('formations_updated', onFormationsUpdated)
    }
}

// ── Init ────────────────────────────────────────────────────────────────────
async function init() {
    if (!currentUser) return
    myUserName = currentProfil?.prenom_nom || 'Moi'

    // Navigation
    document.getElementById('btnPrevMonth').addEventListener('click', () => changeMonth(-1))
    document.getElementById('btnNextMonth').addEventListener('click', () => changeMonth(1))
    document.getElementById('btnAddEvent').addEventListener('click', () => openAddModal())
    document.getElementById('btnDeleteCal').addEventListener('click', deleteCurrentCalendar)

    // Modales
    document.getElementById('btnCloseNewCal').addEventListener('click', () => closeModal('newCalModal'))
    document.getElementById('btnSaveNewCal').addEventListener('click', saveNewCalendar)
    document.getElementById('btnCloseDayModal').addEventListener('click', () => closeModal('dayModal'))
    document.getElementById('btnAddFromDay').addEventListener('click', () => { closeModal('dayModal'); openAddModal(selectedDayForAdd) })
    document.getElementById('btnCloseAddModal').addEventListener('click', () => closeModal('addModal'))
    document.getElementById('btnSaveEvent').addEventListener('click', saveEvent)
    document.getElementById('btnCloseViewModal').addEventListener('click', () => closeModal('viewModal'))
    document.getElementById('btnEditEvent').addEventListener('click', editCurrentEvent)
    document.getElementById('btnDeleteEvent').addEventListener('click', deleteCurrentEvent)
    document.getElementById('btnCloseAlert').addEventListener('click', () => closeModal('alertModal'))
    document.getElementById('btnCancelConfirm').addEventListener('click', () => closeModal('confirmModal'))
    document.getElementById('btnExecuteConfirm').addEventListener('click', () => {
        if (confirmCallback) confirmCallback()
        closeModal('confirmModal')
    })

    await fetchTeamMembers()
    await loadData()
}

// ── Chargement ──────────────────────────────────────────────────────────────
async function fetchTeamMembers() {
    const { data, error } = await supabase.from('profils').select('id, prenom_nom').order('role')
    if (error) { console.warn('[calendrier] fetchTeamMembers:', error.message); return }
    if (data) teamMembers = data
}

async function loadData() {
    const { data } = await supabase.from('evenements').select('id,type_entite,calendar_id,calendar_name,title,start_date,end_date,cat_id,note,author_id,author_name,shared_with')
    if (data) {
        allData = data
        calDefs = data.filter(d => d.type_entite === 'calendar_def')
        events = data.filter(d => d.type_entite === 'event')
    }
    try {
        const { data: formData } = await supabase.from('formations').select('id, nom, date_expiration').eq('user_id', currentUser.id)
        userFormations = formData || []
    } catch { userFormations = [] }

    renderTabs()
    renderLegend()
    renderCalendar()
    checkUpcomingReminders()
}

// ── Onglets ─────────────────────────────────────────────────────────────────
function switchCalTab(calId) {
    currentCalId = calId
    renderTabs()
    renderCalendar()
    document.getElementById('btnDeleteCal').style.display = currentCalId.startsWith('cal-') ? 'flex' : 'none'
}

function renderTabs() {
    const c = document.getElementById('calTabsContainer')
    if (!c) return

    const tabs = [
        { id: 'perso', label: 'Mon Horaire', icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
        { id: 'global', label: 'Calendrier Global', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' }
    ]

    let html = tabs.map(t => `
        <button class="btn-tab ${currentCalId === t.id ? 'active' : ''}" data-tabid="${t.id}">
            <svg viewBox="0 0 24 24">${t.icon}</svg> ${t.label}
        </button>`).join('')

    calDefs.forEach(cal => {
        const sharedIds = cal.shared_with ? cal.shared_with.map(s => s.id) : []
        if (cal.author_id === currentUser.id || sharedIds.includes(currentUser.id)) {
            html += `<button class="btn-tab ${currentCalId === cal.id ? 'active' : ''}" data-tabid="${cal.id}">
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                ${cal.calendar_name}
            </button>`
        }
    })

    html += `<button class="btn-tab btn-tab-dashed" id="btnNewCalendar">
        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Créer calendrier
    </button>`

    c.innerHTML = html

    c.querySelectorAll('[data-tabid]').forEach(btn => {
        btn.addEventListener('click', () => switchCalTab(btn.dataset.tabid))
    })
    document.getElementById('btnNewCalendar')?.addEventListener('click', openNewCalendarModal)
}

function renderLegend() {
    const leg = document.getElementById('legendContainer')
    if (!leg) return
    const noteAndFormation = ['note', 'formation']
    const others = FIXED_CATEGORIES.filter(cat => cat.id !== 'urgence' && !noteAndFormation.includes(cat.id))
    const grouped = FIXED_CATEGORIES.filter(cat => noteAndFormation.includes(cat.id))
    const itemHTML = cat => `<div class="legend-item"><div class="legend-dot" style="background:${cat.color}"></div> ${cat.name}</div>`
    leg.innerHTML = others.map(itemHTML).join('') +
        `<div style="display:flex;gap:8px;flex-shrink:0">${grouped.map(itemHTML).join('')}</div>`
}

// ── Calendrier ──────────────────────────────────────────────────────────────
function changeMonth(delta) {
    calDate.setMonth(calDate.getMonth() + delta)
    renderCalendar()
}

function getSystemEvents(year) {
    const f = Math.floor
    const G = year % 19, C = f(year / 100)
    const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30
    const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11))
    const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7
    const L = I - J, m = 3 + f((L + 40) / 44), d = L + 28 - 31 * f(m / 4)
    const easter = new Date(year, m - 1, d)
    const getVal = date => { const nd = new Date(date); return nd.getFullYear() + '-' + String(nd.getMonth() + 1).padStart(2, '0') + '-' + String(nd.getDate()).padStart(2, '0') }
    const addDay = (date, days) => { const r = new Date(date); r.setDate(r.getDate() + days); return r }

    const list = [
        { id: 'sys-1', d: `${year}-01-01`, t: "Jour de l'An", type: 'ferie' },
        { id: 'sys-2', d: `${year}-06-24`, t: 'St-Jean-Baptiste', type: 'ferie' },
        { id: 'sys-3', d: `${year}-07-01`, t: 'Fête du Canada', type: 'ferie' },
        { id: 'sys-4', d: `${year}-12-25`, t: 'Noël', type: 'ferie' },
        { id: 'sys-5', d: getVal(addDay(easter, -2)), t: 'Vendredi Saint', type: 'ferie' },
        { id: 'sys-6', d: getVal(addDay(easter, 1)), t: 'Lundi de Pâques', type: 'ferie' }
    ]

    let sStart = new Date(year, 6, 19)
    while (sStart.getDay() !== 0) sStart.setDate(sStart.getDate() + 1)
    const sEnd = new Date(sStart); sEnd.setDate(sStart.getDate() + 13)
    list.push({ id: 'sys-7', start: getVal(sStart), end: getVal(sEnd), t: 'Vacances CCQ', type: 'ccq' })
    list.push({ id: 'sys-8', start: `${year}-12-21`, end: `${year + 1}-01-04`, t: 'Vacances Hiver', type: 'ccq' })

    userFormations.forEach((form, idx) => {
        if (!form.date_expiration) return
        const [ey, em, ed] = form.date_expiration.split('-').map(Number)
        const expDate = new Date(ey, em - 1, ed)
        if (isNaN(expDate.getTime()) || expDate.getFullYear() !== year) return
        list.push({ id: 'sys-form-' + (form.id || idx), d: getVal(expDate), t: 'Expiration : ' + (form.nom || 'Formation'), type: 'formation' })
    })

    return list
}

function renderCalendar() {
    const year = calDate.getFullYear(), month = calDate.getMonth()
    const titleEl = document.getElementById('calTitle')
    if (titleEl) titleEl.textContent = new Date(year, month).toLocaleString('fr-FR', { month: 'long', year: 'numeric' })

    const container = document.getElementById('calendarDays')
    if (!container) return
    container.innerHTML = ''

    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const prevMonthDays = new Date(year, month, 0).getDate()
    currentSysEvents = getSystemEvents(year)

    for (let i = firstDay - 1; i >= 0; i--) {
        const div = document.createElement('div')
        div.className = 'cal-day other-month'
        div.innerHTML = `<div class="day-num">${prevMonthDays - i}</div>`
        container.appendChild(div)
    }

    const todayStr = new Date().toISOString().split('T')[0]

    for (let d = 1; d <= daysInMonth; d++) {
        const curDt = new Date(year, month, d)
        const dateStr = curDt.getFullYear() + '-' + String(curDt.getMonth() + 1).padStart(2, '0') + '-' + String(curDt.getDate()).padStart(2, '0')
        const div = document.createElement('div')
        div.className = 'cal-day' + (dateStr === todayStr ? ' today' : '')

        let html = `<div class="day-num">${d}</div>`

        // Urgence
        const urgEvent = events.find(e => e.cat_id === 'urgence' && dateStr >= e.start_date && dateStr <= e.end_date)
        if (urgEvent) {
            const letter = urgEvent.title ? urgEvent.title.trim().charAt(0).toUpperCase() : 'U'
            html += `<div class="urgence-badge filled" data-urgid="${urgEvent.id}" title="Garde: ${sanitize(urgEvent.title)}">${letter}</div>`
        } else if (hasPermission('manage_calendar')) {
            html += `<div class="urgence-badge empty" data-urgdate="${dateStr}" title="Ajouter Garde d'urgence">
                <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>`
        }

        // Événements système
        currentSysEvents.forEach(sys => {
            let show = (sys.d && sys.d === dateStr) || (sys.start && dateStr >= sys.start && dateStr <= sys.end)
            if (show) {
                const cat = FIXED_CATEGORIES.find(c => c.id === sys.type) || { color: '#888' }
                const textColor = ['#ffc107', '#ffffff'].includes(cat.color) ? 'black' : 'white'
                html += `<div class="event-bar" data-sysid="${sys.id}" style="background:${cat.color};color:${textColor};font-weight:bold" title="${sanitize(sys.t)}">${sys.t}</div>`
            }
        })

        // Événements normaux
        events.filter(e => dateStr >= e.start_date && dateStr <= e.end_date).forEach(evt => {
            if (evt.cat_id === 'urgence') return
            const sIds = evt.shared_with ? evt.shared_with.map(s => s.id) : []
            let canSee = false
            if (currentCalId === 'perso') { canSee = (evt.calendar_id === 'perso' && evt.author_id === currentUser.id) || sIds.includes(currentUser.id) }
            else if (currentCalId === 'global') { canSee = evt.calendar_id === 'global' }
            else { canSee = evt.calendar_id === currentCalId }

            if (canSee) {
                const cat = FIXED_CATEGORIES.find(c => c.id === evt.cat_id) || { color: '#333' }
                const isMine = evt.author_id === currentUser.id
                html += `<div class="event-bar ${isMine ? 'event-mine' : ''}" data-evtid="${evt.id}" style="background:${cat.color}" title="${sanitize(evt.title)}">${evt.title}</div>`
            }
        })

        div.innerHTML = html
        div.addEventListener('click', e => {
            if (e.target === div || e.target.classList.contains('day-num')) openDayDetails(dateStr)
        })

        // Event listeners sur les badges
        div.querySelectorAll('[data-urgid]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); openViewEvent(el.dataset.urgid, false) }))
        div.querySelectorAll('[data-urgdate]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); openAddModal(el.dataset.urgdate, true) }))
        div.querySelectorAll('[data-sysid]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); openViewEvent(el.dataset.sysid, true) }))
        div.querySelectorAll('[data-evtid]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); openViewEvent(el.dataset.evtid, false) }))

        container.appendChild(div)
    }

    const totalCells = firstDay + daysInMonth
    const remainingCells = 42 - totalCells
    for (let i = 1; i <= remainingCells; i++) {
        const div = document.createElement('div')
        div.className = 'cal-day other-month'
        div.innerHTML = `<div class="day-num">${i}</div>`
        container.appendChild(div)
    }
}

// ── Détails du jour ─────────────────────────────────────────────────────────
function formatDateFR(isoDate) {
    if (!isoDate) return ''
    const parts = isoDate.split('-')
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : isoDate
}

function openDayDetails(dateStr) {
    selectedDayForAdd = dateStr
    document.getElementById('dayModalTitle').textContent = `Le ${formatDateFR(dateStr)}`
    const content = document.getElementById('dayModalContent')
    content.innerHTML = ''
    let dayEvents = []

    const urgEvent = events.find(e => e.cat_id === 'urgence' && dateStr >= e.start_date && dateStr <= e.end_date)
    if (urgEvent) dayEvents.push({ ...urgEvent, isUrg: true })

    currentSysEvents.forEach(sys => {
        const show = (sys.d && sys.d === dateStr) || (sys.start && dateStr >= sys.start && dateStr <= sys.end)
        if (show) dayEvents.push({ ...sys, isSys: true })
    })

    events.filter(e => dateStr >= e.start_date && dateStr <= e.end_date).forEach(evt => {
        if (evt.cat_id === 'urgence') return
        const sIds = evt.shared_with ? evt.shared_with.map(s => s.id) : []
        let canSee = false
        if (currentCalId === 'perso') { canSee = (evt.calendar_id === 'perso' && evt.author_id === currentUser.id) || sIds.includes(currentUser.id) }
        else if (currentCalId === 'global') { canSee = evt.calendar_id === 'global' }
        else { canSee = evt.calendar_id === currentCalId }
        if (canSee) dayEvents.push(evt)
    })

    if (dayEvents.length === 0) {
        content.innerHTML = '<div style="color:#aaa;font-style:italic;padding:15px 0;text-align:center">Rien de prévu pour cette journée.</div>'
    } else {
        dayEvents.forEach(evt => {
            const cId = evt.type || evt.cat_id
            const cat = FIXED_CATEGORIES.find(c => c.id === cId) || { color: '#888', name: '' }
            const div = document.createElement('div')
            div.className = 'day-detail-item'
            div.style.borderLeft = `4px solid ${cat.color}`
            let subtitle = cat.name
            if (evt.isUrg && evt.author_name) subtitle += ` - Assuré par ${evt.author_name}`
            div.innerHTML = `<div style="font-weight:bold;color:white;font-size:15px">${sanitize(evt.t || evt.title || '')}</div><div style="font-size:12px;color:#aaa">${sanitize(subtitle)}</div>`
            div.addEventListener('click', () => { closeModal('dayModal'); openViewEvent(evt.id, evt.isSys) })
            content.appendChild(div)
        })
    }

    document.getElementById('dayModal').classList.add('open')
}

// ── Gestion des modales calendrier ──────────────────────────────────────────
function openNewCalendarModal() {
    document.getElementById('newCalName').value = ''
    const gList = document.getElementById('calGuestListContainer')
    gList.innerHTML = ''
    teamMembers.forEach(tm => {
        if (tm.id === currentUser.id) return
        const label = document.createElement('label')
        label.className = 'guest-item'
        label.innerHTML = `<input type="checkbox" class="cal-cb" value="${sanitize(tm.id)}" data-name="${sanitize(tm.prenom_nom)}"> ${sanitize(tm.prenom_nom)}`
        gList.appendChild(label)
    })
    document.getElementById('newCalModal').classList.add('open')
}

async function saveNewCalendar() {
    const name = document.getElementById('newCalName').value.trim()
    if (!name) { openAlert('Nom du calendrier requis.'); return }
    const sharedWith = []
    document.querySelectorAll('.cal-cb:checked').forEach(cb => { sharedWith.push({ id: cb.value, name: cb.getAttribute('data-name') }) })
    const payload = { id: 'cal-' + Date.now(), type_entite: 'calendar_def', calendar_name: name, author_id: currentUser.id, author_name: myUserName, shared_with: sharedWith }
    const { error } = await withRetry(() => supabase.from('evenements').upsert(payload))
    if (error) { openAlert(friendlyError(error)); return }
    closeModal('newCalModal')
    await loadData()
}

async function deleteCurrentCalendar() {
    const cal = calDefs.find(c => c.id === currentCalId)
    if (!cal || cal.author_id !== currentUser.id) { openAlert('Vous ne pouvez pas supprimer ce calendrier.'); return }
    showConfirm(`Supprimer le calendrier partagé "${cal.calendar_name}" et tous ses événements ?`, async () => {
        const r1 = await withRetry(() => supabase.from('evenements').delete().eq('calendar_id', currentCalId))
        const r2 = await withRetry(() => supabase.from('evenements').delete().eq('id', currentCalId))
        if (r1.error || r2.error) { openAlert('❌ Erreur de suppression : ' + ((r1.error || r2.error).message)); return }
        currentCalId = 'perso'
        await loadData()
    })
}

// ── Ajout/édition événement ──────────────────────────────────────────────────
function openAddModal(dateStart = '', isUrgence = false, evtToEdit = null) {
    editingEventId = evtToEdit ? evtToEdit.id : null
    isUrgenceMode = isUrgence

    document.getElementById('evtTitle').value = evtToEdit ? evtToEdit.title : ''
    document.getElementById('evtNote').value = evtToEdit ? evtToEdit.note : ''
    document.getElementById('evtStart').value = evtToEdit ? evtToEdit.start_date : dateStart
    document.getElementById('evtEnd').value = evtToEdit ? evtToEdit.end_date : dateStart

    const grpCat = document.getElementById('grpCategory')
    const selCat = document.getElementById('evtCategory')
    const grpCal = document.getElementById('grpCalendar')
    const selCal = document.getElementById('evtCalendarId')
    const grpGuests = document.getElementById('grpGuests')

    if (isUrgence) {
        document.getElementById('modalTitle').textContent = "Service d'urgence"
        grpCat.style.display = 'none'; grpGuests.style.display = 'none'; grpCal.style.display = 'none'
        document.getElementById('evtTitle').value = ''
    } else {
        document.getElementById('modalTitle').textContent = evtToEdit ? "Modifier l'événement" : 'Nouvel Événement'
        grpCat.style.display = 'block'; grpGuests.style.display = 'block'; grpCal.style.display = 'block'

        selCat.innerHTML = ALLOWED_ADD_CATS.map(id => {
            const cat = FIXED_CATEGORIES.find(c => c.id === id)
            return `<option value="${cat.id}">${cat.name}</option>`
        }).join('')
        if (evtToEdit) selCat.value = evtToEdit.cat_id

        selCal.innerHTML = `<option value="perso">Mon Horaire</option>`
        if (hasPermission('manage_calendar')) selCal.innerHTML += `<option value="global">Calendrier Global</option>`
        calDefs.forEach(c => {
            const sIds = c.shared_with ? c.shared_with.map(s => s.id) : []
            if (c.author_id === currentUser.id || sIds.includes(currentUser.id)) {
                selCal.innerHTML += `<option value="${sanitize(c.id)}">${sanitize(c.calendar_name)}</option>`
            }
        })
        if (evtToEdit) selCal.value = evtToEdit.calendar_id
        else selCal.value = (currentCalId === 'global' && !hasPermission('manage_calendar')) ? 'perso' : currentCalId

        const gList = document.getElementById('guestListContainer')
        gList.innerHTML = ''
        teamMembers.forEach(tm => {
            if (tm.id === currentUser.id) return
            const checked = evtToEdit?.shared_with?.find(s => s.id === tm.id) ? 'checked' : ''
            const label = document.createElement('label')
            label.className = 'guest-item'
            label.innerHTML = `<input type="checkbox" class="evt-guest-cb" value="${sanitize(tm.id)}" data-name="${sanitize(tm.prenom_nom)}" ${checked}> ${sanitize(tm.prenom_nom)}`
            gList.appendChild(label)
        })
    }

    document.getElementById('addModal').classList.add('open')
}

async function saveEvent() {
    const title = document.getElementById('evtTitle').value.trim()
    const start = document.getElementById('evtStart').value
    const end = document.getElementById('evtEnd').value
    const note = document.getElementById('evtNote').value.trim()
    if (!title || !start || !end) { openAlert('Remplir Titre et Dates !'); return }
    if (end < start) { openAlert('Date de fin invalide.'); return }

    let sharedWith = []
    if (!isUrgenceMode) {
        document.querySelectorAll('.evt-guest-cb:checked').forEach(cb => { sharedWith.push({ id: cb.value, name: cb.getAttribute('data-name') }) })
    }

    const existingEvt = editingEventId ? events.find(e => e.id === editingEventId) : null
    const payload = {
        id: editingEventId || 'evt-' + Date.now(), type_entite: 'event',
        calendar_id: isUrgenceMode ? 'global' : document.getElementById('evtCalendarId').value,
        title, start_date: start, end_date: end,
        cat_id: isUrgenceMode ? 'urgence' : document.getElementById('evtCategory').value,
        note,
        author_id: existingEvt ? existingEvt.author_id : currentUser.id,
        author_name: existingEvt ? existingEvt.author_name : myUserName,
        shared_with: sharedWith
    }

    const btn = document.getElementById('btnSaveEvent')
    const origHTML = btn.innerHTML
    btn.disabled = true; btn.textContent = 'Sauvegarde...'

    const { error } = await withRetry(() => supabase.from('evenements').upsert(payload))
    btn.disabled = false; btn.innerHTML = origHTML

    if (error) {
        const msg = (error.message || '').toLowerCase()
        let userMsg
        if (msg.includes('lock broken') || error.name === 'AbortError') userMsg = '❌ Une autre opération est en cours. Attends 2 secondes et réessaie.'
        else if (msg.includes('failed to fetch') || msg.includes('network')) userMsg = "❌ Pas de connexion internet."
        else if (msg.includes('row-level security') || error.code === '42501') userMsg = "❌ Tu n'as pas la permission de créer cet événement."
        else userMsg = friendlyError(error)
        openAlert(userMsg); return
    }

    closeModal('addModal')
    await loadData()
}

// ── Vue événement ───────────────────────────────────────────────────────────
function openViewEvent(id, isSys) {
    isSystemEvent = isSys
    const evt = isSys ? currentSysEvents.find(ev => ev.id === id) : events.find(ev => ev.id === id)
    if (!evt) return
    currentViewId = id

    const canEdit = !isSys && (
        evt.author_id === currentUser.id ||
        (evt.calendar_id === 'global' && hasPermission('manage_calendar')) ||
        evt.calendar_id?.startsWith('cal-')
    )

    document.getElementById('btnEditEvent').style.display = canEdit ? 'flex' : 'none'
    document.getElementById('btnDeleteEvent').style.display = canEdit ? 'flex' : 'none'
    document.getElementById('viewAuthorBadge').textContent = isSys ? 'Système' : (evt.author_name ? 'Créé par ' + evt.author_name : '')
    document.getElementById('viewAuthorBadge').style.background = isSys ? '#555' : 'var(--btn-blue)'

    const cat = FIXED_CATEGORIES.find(c => c.id === (evt.type || evt.cat_id)) || { color: '#ccc', name: 'Inconnu' }
    document.getElementById('viewTitle').textContent = evt.t || evt.title
    document.getElementById('viewCat').innerHTML = `<div style="width:12px;height:12px;background:${cat.color};border-radius:50%"></div> ${cat.name}`
    document.getElementById('viewDates').textContent = evt.d
        ? `Le ${formatDateFR(evt.d)}`
        : `Du ${formatDateFR(evt.start_date || evt.start)} au ${formatDateFR(evt.end_date || evt.end)}`

    const gCont = document.getElementById('viewGuestsContainer')
    if (evt.shared_with?.length > 0) {
        document.getElementById('viewGuests').textContent = evt.shared_with.map(s => s.name).join(', ')
        gCont.style.display = 'block'
    } else { gCont.style.display = 'none' }

    const nCont = document.getElementById('viewNoteContainer')
    if (evt.note?.trim()) {
        document.getElementById('viewNote').textContent = evt.note
        nCont.style.display = 'block'
    } else { nCont.style.display = 'none' }

    document.getElementById('viewModal').classList.add('open')
}

function editCurrentEvent() {
    const evt = events.find(e => e.id === currentViewId)
    closeModal('viewModal')
    openAddModal('', evt.cat_id === 'urgence', evt)
}

function deleteCurrentEvent() {
    if (!currentViewId || isSystemEvent) return
    showConfirm('Supprimer cet événement ?', async () => {
        const { error } = await withRetry(() => supabase.from('evenements').delete().eq('id', currentViewId))
        if (error) { openAlert(friendlyError(error)); return }
        closeModal('viewModal')
        await loadData()
    })
}

// ── Rappels ──────────────────────────────────────────────────────────────────
function checkUpcomingReminders() {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]
    const tomorrowStr = (() => { const t = new Date(today); t.setDate(today.getDate() + 1); return t.toISOString().split('T')[0] })()

    // Show at most once per day per user
    const storageKey = `cal_reminders_${todayStr}_${currentUser?.id || ''}`
    if (localStorage.getItem(storageKey)) return
    localStorage.setItem(storageKey, '1')

    // Events starting today or tomorrow that involve the current user
    const relevant = events.filter(e => {
        if (e.cat_id === 'urgence') return false
        if (e.start_date !== todayStr && e.start_date !== tomorrowStr) return false
        const sharedIds = e.shared_with ? e.shared_with.map(s => s.id) : []
        return e.author_id === currentUser.id || sharedIds.includes(currentUser.id)
    })
    const todayEvts    = relevant.filter(e => e.start_date === todayStr)
    const tomorrowEvts = relevant.filter(e => e.start_date === tomorrowStr)

    if (todayEvts.length)    showToast(`Aujourd'hui : ${todayEvts.map(e => sanitize(e.title)).join(', ')}`, 'warning', 6000)
    if (tomorrowEvts.length) showToast(`Demain : ${tomorrowEvts.map(e => sanitize(e.title)).join(', ')}`, 'warning', 5000)
}

// ── Utilitaires ─────────────────────────────────────────────────────────────
function openAlert(msg) {
    document.getElementById('alertMessage').textContent = msg
    document.getElementById('alertModal').classList.add('open')
}

function showConfirm(msg, callback) {
    document.getElementById('confirmMessage').textContent = msg
    confirmCallback = callback
    document.getElementById('confirmModal').classList.add('open')
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('open')
}

function autoFormatDate(input) {
    let v = input.value.replace(/\D/g, '')
    if (v.length >= 3 && v.length <= 4) v = v.slice(0, 2) + '/' + v.slice(2)
    else if (v.length >= 5) v = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4, 8)
    input.value = v
}