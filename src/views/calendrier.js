// src/views/calendrier.js

import { supabase } from '../supabase.js'
import { currentUser, currentRole, currentProfil, hasPermission } from '../auth.js'
import { withRetry } from '../shared/withRetry.js'
import { sanitize } from '../shared/sanitize.js'
import { friendlyError } from '../shared/errorMsg.js'
import { showToast } from '../shared/toast.js'

// ── État local ───────────────────────────────────────────────────────────────
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
    { id: 'ferie',     name: 'Congé férié',          color: '#f59e0b' },
    { id: 'ccq',       name: 'Congé CCQ',            color: '#ef4444' },
    { id: 'job',       name: 'Job / Chantier',       color: '#3b82f6' },
    { id: 'perso',     name: 'Congé personnel',      color: '#a855f7' },
    { id: 'note',      name: 'Note',                 color: '#6b7280' },
    { id: 'urgence',   name: "Service d'urgence",     color: '#f97316' },
    { id: 'formation', name: 'Expiration formation', color: '#22c55e' }
]
const ALLOWED_ADD_CATS = ['job', 'perso', 'note']

// ── Render principal ──────────────────────────────────────────────────────────
export async function render(container) {
    container.innerHTML = `
    <style>
        .cal-view { overflow: hidden; }
        @media (max-width: 768px) { .cal-view { overflow-y: auto !important; overflow-x: hidden !important; } }

        /* ── Tabs ── */
        .cal-tab {
            border: 1px solid var(--border); background: var(--bg-panel); color: var(--text-muted);
            padding: 9px 16px; border-radius: var(--r-lg); font-weight: 600; font-size: 13px;
            display: inline-flex; align-items: center; gap: 7px; cursor: pointer; font-family: inherit;
            transition: background var(--t-base), border-color var(--t-base), color var(--t-base);
            white-space: nowrap;
        }
        .cal-tab svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .cal-tab:hover { background: var(--bg-panel-2); color: #fff; }
        .cal-tab.active { color: #fff; }
        .cal-tab-dashed { border-style: dashed; border-color: var(--border-strong); color: var(--text-faint); background: transparent; }
        .cal-tab-dashed:hover { border-color: var(--brand-yellow); color: var(--brand-yellow); background: transparent; }

        /* ── Navigation boutons ── */
        .cal-navbtn {
            background: transparent; color: var(--text-muted); border: none;
            width: 28px; height: 28px; border-radius: var(--r-md); cursor: pointer;
            display: inline-flex; align-items: center; justify-content: center; transition: all var(--t-base);
            flex-shrink: 0;
        }
        .cal-navbtn:hover { background: var(--bg-panel-2); color: #fff; }
        .cal-navbtn svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .cal-month-title { font-size: 17px; font-weight: 700; color: #fff; letter-spacing: -0.3px; min-width: 150px; text-align: center; text-transform: capitalize; }

        /* ── Légende pills ── */
        .cal-legend-pill {
            display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px;
            border-radius: 999px; background: var(--bg-panel); border: 1px solid var(--border);
            font-size: 11.5px; color: var(--text-muted); font-weight: 600;
        }

        /* ── Grille wrapper ── */
        .cal-grid-wrap {
            background: var(--bg-panel); border-radius: var(--r-xl); border: 1px solid var(--border);
            overflow: auto; flex: 1; min-height: 0; display: flex; flex-direction: column;
        }

        /* ── En-têtes jours ── */
        .cal-dow {
            padding: 9px 0; font-size: 11.5px; font-weight: 700; color: var(--text-muted);
            text-align: center; letter-spacing: 0.5px; border-bottom: 1px solid var(--border-strong);
        }

        /* ── Cellules jours ── */
        .cal-days-grid > div { border-right: 1px solid var(--border-strong); }
        .cal-days-grid > div:nth-child(7n) { border-right: none; }
        .cal-day {
            padding: 7px 8px 6px; border-bottom: 1px solid var(--border-strong);
            position: relative; overflow: hidden;
            display: flex; flex-direction: column; gap: 3px;
            transition: background var(--t-fast); background: transparent; height: auto; overflow-y: auto;
        }
        .cal-day:not(.other-month) { cursor: pointer; }
        .cal-day:not(.other-month):hover { background: rgba(255,255,255,0.03); }
        .cal-day.today { background: rgba(252,202,70,0.05); }
        .cal-day.other-month { opacity: 0.32; background: var(--bg-sunken); pointer-events: none; }

        /* ── Numéro du jour ── */
        .day-num {
            display: inline-flex; align-items: center; justify-content: center;
            width: 26px; height: 26px; font-size: 13px; font-weight: 600;
            color: var(--text-main); pointer-events: none; margin-bottom: 2px; flex-shrink: 0;
        }
        .cal-day.today .day-num {
            border-radius: 50%; background: var(--brand-yellow); color: #1a1b22; font-weight: 800;
        }

        /* ── Barres d'événements ── */
        .event-bar {
            font-size: 10.5px; padding: 2px 8px; border-radius: 3px;
            color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            cursor: pointer; display: block; font-weight: 600;
            text-shadow: 0 1px 2px rgba(0,0,0,0.35); transition: opacity var(--t-fast);
            margin-left: -8px; margin-right: -8px;
            border-right: 2px solid var(--bg-panel);
        }
        .event-bar:hover { opacity: 0.82; }


        /* ── Détail jour ── */
        .day-detail-item {
            padding: 11px 14px; background: var(--bg-sunken);
            border-radius: var(--r-lg); margin-bottom: 8px;
            cursor: pointer; transition: background var(--t-base);
            border: 1px solid var(--border); border-left: 3px solid var(--border);
        }
        .day-detail-item:hover { background: var(--bg-panel-2); }

        /* ── Vue événement ── */
        .view-row { margin-bottom: 14px; }
        .view-label { color: var(--text-faint); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .view-value { color: #fff; font-weight: 600; font-size: 15px; }
        .note-box { background: var(--bg-sunken); padding: 12px 14px; border-radius: var(--r-lg); border: 1px solid var(--border); font-weight: 400; font-size: 13px; white-space: pre-wrap; line-height: 1.5; color: var(--text-muted); }

        /* ── Invités ── */
        .guest-list-container { background: var(--bg-sunken); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 10px; max-height: 130px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
        .guest-item { display: flex; align-items: center; gap: 10px; color: var(--text-main); font-size: 13px; cursor: pointer; padding: 2px 0; }
        .guest-item input { width: 15px; height: 15px; cursor: pointer; flex-shrink: 0; accent-color: var(--brand-yellow); }

        /* ── Auteur badge ── */
        .author-badge { font-size: 11px; background: var(--bg-panel-2); border: 1px solid var(--border); padding: 3px 9px; border-radius: 999px; font-weight: 600; color: var(--text-muted); }

        /* ── Day header short/full ── */
        .dh-short { display: none; }
        .dh-full  { display: inline; }

        /* ── Mobile header ── */
        .cal-mobile-header { display: none; align-items: center; gap: 10px; }
        .cal-mobile-title { flex: 1; font-size: 26px; font-weight: 800; color: #fff; margin: 0; }
        .cal-mobile-subtitle { display: none; font-size: 13px; color: var(--text-faint); margin-top: -4px; }
        .cal-mobile-menu-btn { background: none; border: none; color: var(--text-muted); padding: 4px; cursor: pointer; display: flex; align-items: center; }
        .cal-mobile-menu-btn svg { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 2.2; stroke-linecap: round; }
        .cal-mobile-add-btn { background: var(--brand-yellow); border: none; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .cal-mobile-add-btn svg { width: 20px; height: 20px; stroke: #1a1b22; fill: none; stroke-width: 2.5; }

        /* ── Dots mobile ── */
        .cal-dots-row { display: none; justify-content: center; gap: 2px; margin-top: 3px; flex-wrap: nowrap; }
        .cal-evt-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

        /* ── Agenda mobile ── */
        .cal-agenda { display: none; flex-direction: column; gap: 4px; }
        .cal-agenda-today-header { display: flex; align-items: center; justify-content: space-between; padding: 4px 0 6px; }
        .cal-agenda-date-label { font-size: 14px; font-weight: 700; color: #fff; text-transform: capitalize; }
        .cal-agenda-count { font-size: 12px; color: var(--text-faint); }
        .cal-agenda-section-header { font-size: 10px; font-weight: 700; color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.8px; margin: 10px 0 4px; }
        .cal-agenda-item { background: var(--bg-panel); border: 1px solid var(--border); border-left: 3px solid #888; border-radius: var(--r-lg); padding: 12px 14px; position: relative; cursor: pointer; display: flex; flex-direction: column; gap: 3px; transition: background var(--t-fast); }
        .cal-agenda-item:hover { background: var(--bg-panel-2); }
        .cal-agenda-title { font-size: 14px; font-weight: 600; color: #fff; }
        .cal-agenda-meta { font-size: 12px; color: var(--text-faint); }
        .cal-agenda-cat { position: absolute; right: 14px; top: 13px; font-size: 10px; font-weight: 700; color: var(--text-faint); letter-spacing: 0.5px; }
        .cal-agenda-empty { font-size: 13px; color: var(--text-faint); font-style: italic; padding: 8px 0; }

        @media (max-width: 768px) {
            .view { padding: 16px 16px 12px !important; gap: 10px !important; overflow-y: auto !important; }
            .cal-mobile-header { display: flex; }
            .cal-mobile-subtitle { display: block; }
            .view-header { display: none; }
            .cal-legend-row { display: flex; flex-wrap: wrap; gap: 6px; }
            .cal-tab-list { width: 100%; flex-wrap: nowrap; overflow-x: auto; gap: 8px; scrollbar-width: none; }
            .cal-tab-list::-webkit-scrollbar { display: none; }
            .cal-tab { flex-shrink: 0; padding: 7px 12px; font-size: 12px; }
            .cal-legend-pill { font-size: 11px; padding: 3px 8px; }
            /* Nav : flèches visibles, mois centré */
            .cal-nav-row { padding: 0 !important; background: transparent !important; border: none !important; border-radius: 0 !important; justify-content: space-between; width: 100%; }
            .cal-navbtn { background: var(--bg-panel); border: 1px solid var(--border); width: 36px; height: 36px; border-radius: var(--r-lg,10px); }
            .cal-month-title { min-width: 0; font-size: 17px; font-weight: 700; }
            /* Grille calendrier : fond card */
            .cal-grid-wrap { background: var(--bg-panel) !important; border: 1px solid var(--border) !important; border-radius: var(--r-xl,14px) !important; overflow: hidden; flex: unset; flex-shrink: 0; }
            .cal-dow { font-size: 10px; letter-spacing: 0; padding: 6px 0; }
            .cal-days-grid { min-width: 0 !important; grid-auto-rows: minmax(44px, auto) !important; }
            .cal-day { padding: 4px 2px; }
            .cal-day:not(.other-month):hover { background: rgba(255,255,255,0.04); }
            .day-num { font-size: 11px; min-width: 22px; height: 22px; }
            /* Aujourd'hui : carré arrondi au lieu du cercle */
            .cal-day.today .day-num { border-radius: var(--r-md,8px); }
            .event-bar { display: none; }
            .cal-dots-row { display: flex; }
            .cal-agenda { display: flex; }
            .dh-short { display: inline; }
            .dh-full  { display: none; }
            /* Cartes agenda arrondies */
            .cal-agenda-item { border-radius: var(--r-xl,14px); }
        }
    </style>

    <div class="view cal-view">

        <!-- Mobile header -->
        <div class="cal-mobile-header">
            <button class="cal-mobile-menu-btn" id="cal-menu-btn" aria-label="Menu">
                <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h2 class="cal-mobile-title">Calendrier</h2>
            <button class="cal-mobile-add-btn" id="btnAddEventMobile" aria-label="Nouvel événement">
                <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
        </div>
        <div class="cal-mobile-subtitle" id="calMobileSubtitle"></div>

        <!-- Header desktop -->
        <div class="view-header">
            <div>
                <h1>Calendriers</h1>
                <p class="sub">Personnel, Global et Équipes</p>
            </div>
            <div class="actions">
                <button class="btn btn-danger" id="btnDeleteCal" style="display:none">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Effacer ce calendrier
                </button>
                <button class="btn btn-primary btn-pill" id="btnAddEvent">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Événement
                </button>
            </div>
        </div>

        <!-- Onglets + navigation mois (une seule rangée) -->
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
            <div class="cal-tab-list" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center" id="calTabsContainer"></div>
            <div style="flex:1"></div>
            <div class="cal-nav-row" style="display:flex;align-items:center;gap:6px;background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--r-lg);padding:4px 10px">
                <button class="cal-navbtn" id="btnPrevMonth">
                    <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div class="cal-month-title" id="calTitle">…</div>
                <button class="cal-navbtn" id="btnNextMonth">
                    <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
            </div>
        </div>

        <!-- Légende -->
        <div class="cal-legend-row" style="display:flex;gap:7px;flex-wrap:wrap" id="legendContainer"></div>

        <!-- Grille calendrier -->
        <div class="cal-grid-wrap">
            <div style="display:grid;grid-template-columns:repeat(7,1fr);flex-shrink:0">
                <div class="cal-dow" style="border-right:1px solid var(--border-strong)"><span class="dh-full">Dim</span><span class="dh-short">D</span></div>
                <div class="cal-dow" style="border-right:1px solid var(--border-strong)"><span class="dh-full">Lun</span><span class="dh-short">L</span></div>
                <div class="cal-dow" style="border-right:1px solid var(--border-strong)"><span class="dh-full">Mar</span><span class="dh-short">M</span></div>
                <div class="cal-dow" style="border-right:1px solid var(--border-strong)"><span class="dh-full">Mer</span><span class="dh-short">M</span></div>
                <div class="cal-dow" style="border-right:1px solid var(--border-strong)"><span class="dh-full">Jeu</span><span class="dh-short">J</span></div>
                <div class="cal-dow" style="border-right:1px solid var(--border-strong)"><span class="dh-full">Ven</span><span class="dh-short">V</span></div>
                <div class="cal-dow"><span class="dh-full">Sam</span><span class="dh-short">S</span></div>
            </div>
            <div class="cal-days-grid" id="calendarDays" style="display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:minmax(130px,1fr);min-width:700px;flex-shrink:0"></div>
        </div>

        <!-- Agenda mobile -->
        <div class="cal-agenda" id="calAgenda"></div>
    </div>

    <!-- Modal : nouveau calendrier partagé -->
    <div class="modal-overlay" id="newCalModal" style="display:none">
        <div class="modal">
            <div class="modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Créer un calendrier partagé
            </div>
            <div style="display:flex;flex-direction:column;gap:14px">
                <div>
                    <label class="field-label">Nom du calendrier</label>
                    <input class="input" type="text" id="newCalName" placeholder="Ex: Équipe Chantier B">
                </div>
                <div>
                    <label class="field-label">Partager avec</label>
                    <div class="guest-list-container" id="calGuestListContainer"></div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" id="btnCloseNewCal">Annuler</button>
                <button class="btn btn-primary" id="btnSaveNewCal">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Créer
                </button>
            </div>
        </div>
    </div>

    <!-- Modal : détails du jour -->
    <div class="modal-overlay" id="dayModal" style="display:none">
        <div class="modal">
            <div class="modal-title" id="dayModalTitle">Événements du …</div>
            <div id="dayModalContent" style="display:flex;flex-direction:column;max-height:50vh;overflow-y:auto;margin-bottom:4px"></div>
            <div class="modal-actions" style="justify-content:space-between">
                <button class="btn btn-secondary" id="btnCloseDayModal">Fermer</button>
                <button class="btn btn-primary btn-pill" id="btnAddFromDay">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Ajouter ici
                </button>
            </div>
        </div>
    </div>

    <!-- Modal : ajout / édition événement -->
    <div class="modal-overlay" id="addModal" style="display:none">
        <div class="modal">
            <div class="modal-title" id="modalTitle">Nouvel Événement</div>
            <div style="display:flex;flex-direction:column;gap:14px">
                <div id="grpCalendar">
                    <label class="field-label">Calendrier de destination</label>
                    <select class="select" id="evtCalendarId"></select>
                </div>
                <div id="grpCategory">
                    <label class="field-label">Catégorie</label>
                    <select class="select" id="evtCategory"></select>
                </div>
                <div id="grpTitle">
                    <label class="field-label">Titre / Nom du chantier</label>
                    <input class="input" type="text" id="evtTitle" placeholder="Ex: Rénovation école">
                </div>
                <div id="grpEmployee" style="display:none">
                    <label class="field-label">Employé en service</label>
                    <select class="select" id="evtEmployee"></select>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div>
                        <label class="field-label">Début</label>
                        <input class="input" type="date" id="evtStart" style="color-scheme:dark">
                    </div>
                    <div>
                        <label class="field-label">Fin (inclus)</label>
                        <input class="input" type="date" id="evtEnd" style="color-scheme:dark">
                    </div>
                </div>
                <div id="grpGuests">
                    <label class="field-label">Assigner / Partager avec</label>
                    <div class="guest-list-container" id="guestListContainer"></div>
                </div>
                <div>
                    <label class="field-label">Notes &amp; Adresse</label>
                    <textarea class="textarea" id="evtNote" placeholder="Détails, informations…" style="min-height:80px"></textarea>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" id="btnCloseAddModal">Annuler</button>
                <button class="btn btn-primary" id="btnSaveEvent">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Sauvegarder
                </button>
            </div>
        </div>
    </div>

    <!-- Modal : vue événement -->
    <div class="modal-overlay" id="viewModal" style="display:none">
        <div class="modal">
            <div class="modal-title" style="justify-content:space-between">
                <span>Détails de l'événement</span>
                <span class="author-badge" id="viewAuthorBadge"></span>
            </div>
            <div class="view-row"><div class="view-label">Titre</div><div class="view-value" id="viewTitle">…</div></div>
            <div class="view-row"><div class="view-label">Catégorie</div><div class="view-value" id="viewCat" style="display:flex;align-items:center;gap:8px">…</div></div>
            <div class="view-row"><div class="view-label">Dates</div><div class="view-value" id="viewDates">…</div></div>
            <div class="view-row" id="viewGuestsContainer" style="display:none">
                <div class="view-label">Assigné(s) à</div>
                <div class="view-value" id="viewGuests" style="color:var(--status-blue)">…</div>
            </div>
            <div class="view-row" id="viewNoteContainer" style="display:none">
                <div class="view-label">Notes / Détails / Adresse</div>
                <div class="view-value note-box" id="viewNote">…</div>
            </div>
            <div class="modal-actions" style="justify-content:space-between;margin-top:20px">
                <button class="btn btn-danger" id="btnDeleteEvent" style="display:none">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Supprimer
                </button>
                <div style="display:flex;gap:10px">
                    <button class="btn btn-secondary" id="btnCloseViewModal">Fermer</button>
                    <button class="btn btn-primary" id="btnEditEvent" style="display:none">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Modifier
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal : alerte info -->
    <div class="modal-overlay" id="alertModal" style="display:none;z-index:5000">
        <div class="modal" style="max-width:360px;text-align:center">
            <div class="modal-title" style="justify-content:center;border-bottom:none;margin-bottom:8px;color:var(--brand-yellow)">Information</div>
            <p id="alertMessage" style="color:var(--text-muted);margin-bottom:0;font-size:14px;line-height:1.5"></p>
            <div class="modal-actions" style="justify-content:center;margin-top:20px">
                <button class="btn btn-primary btn-pill" id="btnCloseAlert" style="min-width:100px">Compris</button>
            </div>
        </div>
    </div>

    <!-- Modal : confirmation -->
    <div class="modal-overlay" id="confirmModal" style="display:none;z-index:6000">
        <div class="modal" style="max-width:360px;text-align:center">
            <div class="modal-title" style="justify-content:center;border-bottom:none;margin-bottom:8px;color:var(--status-red)">Attention</div>
            <p id="confirmMessage" style="color:var(--text-muted);margin-bottom:0;font-size:14px;line-height:1.5"></p>
            <div class="modal-actions" style="justify-content:center;gap:10px;margin-top:20px">
                <button class="btn btn-secondary" id="btnCancelConfirm" style="min-width:90px">Non</button>
                <button class="btn btn-danger" id="btnExecuteConfirm" style="min-width:90px">Oui</button>
            </div>
        </div>
    </div>
    `

    await init()

    const onFormationsUpdated = async () => {
        try {
            const { data: formData } = await supabase
                .from('formations').select('id, nom, date_expiration').eq('user_id', currentUser.id)
            userFormations = formData || []
        } catch { userFormations = [] }
        renderCalendar()
    }
    window.addEventListener('formations_updated', onFormationsUpdated)

    return function cleanup() {
        window.removeEventListener('formations_updated', onFormationsUpdated)
    }
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
    if (!currentUser) return
    myUserName = currentProfil?.prenom_nom || 'Moi'

    document.getElementById('btnPrevMonth').addEventListener('click', () => changeMonth(-1))
    document.getElementById('btnNextMonth').addEventListener('click', () => changeMonth(1))
    document.getElementById('btnAddEvent').addEventListener('click', () => openAddModal('', currentCalId === 'urgence'))
    document.getElementById('btnAddEventMobile')?.addEventListener('click', () => openAddModal())
    document.getElementById('cal-menu-btn')?.addEventListener('click', () => document.getElementById('topbar-mobile-menu-btn')?.click())
    document.getElementById('btnDeleteCal').addEventListener('click', deleteCurrentCalendar)

    document.getElementById('btnCloseNewCal').addEventListener('click', () => closeModal('newCalModal'))
    document.getElementById('btnSaveNewCal').addEventListener('click', saveNewCalendar)
    document.getElementById('btnCloseDayModal').addEventListener('click', () => closeModal('dayModal'))
    document.getElementById('btnAddFromDay').addEventListener('click', () => { closeModal('dayModal'); openAddModal(selectedDayForAdd, currentCalId === 'urgence') })
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

    ;['newCalModal','dayModal','addModal','viewModal','alertModal','confirmModal'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', e => {
            if (e.target === document.getElementById(id)) closeModal(id)
        })
    })

    await fetchTeamMembers()
    await loadData()
}

// ── Chargement ────────────────────────────────────────────────────────────────
async function fetchTeamMembers() {
    const { data, error } = await supabase.from('profils').select('id, prenom_nom').order('role')
    if (error) { console.warn('[calendrier] fetchTeamMembers:', error.message); return }
    if (data) teamMembers = data
}

async function loadData() {
    const { data } = await supabase.from('evenements').select('id,type_entite,calendar_id,calendar_name,title,start_date,end_date,cat_id,note,author_id,author_name,shared_with')
    if (data) {
        allData   = data
        calDefs   = data.filter(d => d.type_entite === 'calendar_def')
        events    = data.filter(d => d.type_entite === 'event')
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

// ── Onglets ───────────────────────────────────────────────────────────────────
function canManageUrgence() {
    return ['A0', 'A1', 'A2'].includes(currentRole)
}

function switchCalTab(calId) {
    currentCalId = calId
    renderTabs()
    renderLegend()
    renderCalendar()
    document.getElementById('btnDeleteCal').style.display = currentCalId.startsWith('cal-') ? 'flex' : 'none'
    const _hideAdd = (currentCalId === 'urgence' && !canManageUrgence()) || (currentCalId === 'global' && !hasPermission('manage_calendar'))
    document.getElementById('btnAddEvent').style.display = _hideAdd ? 'none' : ''
    const _mobAdd = document.getElementById('btnAddEventMobile')
    if (_mobAdd) _mobAdd.style.display = _hideAdd ? 'none' : ''
}

const TAB_COLORS = {
    perso:  'var(--status-blue)',
    global: 'var(--brand-yellow)',
}

function renderTabs() {
    const c = document.getElementById('calTabsContainer')
    if (!c) return

    const userSVG = `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
    const teamSVG = `<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
    const calSVG  = `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
    const plusSVG = `<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`

    const urgSVG  = `<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`

    let html = [
        { id: 'perso',   label: 'Mon horaire',  svg: userSVG, color: 'var(--status-blue)' },
        { id: 'global',  label: 'Global',       svg: teamSVG, color: 'var(--brand-yellow)' },
        { id: 'urgence', label: "Service d'urgence", svg: urgSVG, color: '#f97316' },
    ].map(t => `<button class="cal-tab${currentCalId === t.id ? ' active' : ''}" data-tabid="${t.id}" data-color="${t.color}">${t.svg} ${t.label}</button>`).join('')

    calDefs.forEach(cal => {
        const sharedIds = cal.shared_with ? cal.shared_with.map(s => s.id) : []
        if (cal.author_id === currentUser.id || sharedIds.includes(currentUser.id)) {
            const color = 'var(--status-purple)'
            html += `<button class="cal-tab${currentCalId === cal.id ? ' active' : ''}" data-tabid="${cal.id}" data-color="${color}">${calSVG} ${sanitize(cal.calendar_name)}</button>`
        }
    })

    html += `<button class="cal-tab cal-tab-dashed" id="btnNewCalendar">${plusSVG} Créer calendrier</button>`
    c.innerHTML = html

    c.querySelectorAll('[data-tabid]').forEach(btn =>
        btn.addEventListener('click', () => switchCalTab(btn.dataset.tabid))
    )
    document.getElementById('btnNewCalendar')?.addEventListener('click', openNewCalendarModal)

    // Coloriser l'onglet actif
    const activeTab = c.querySelector('[data-tabid].active')
    if (activeTab) {
        const color = activeTab.dataset.color || 'var(--status-blue)'
        activeTab.style.background   = color
        activeTab.style.borderColor  = color
        activeTab.style.color        = '#fff'
    }
}

function renderLegend() {
    const leg = document.getElementById('legendContainer')
    if (!leg) return
    if (currentCalId === 'urgence') { leg.style.display = 'none'; return }
    leg.style.display = 'flex'
    const visible = FIXED_CATEGORIES.filter(c => c.id !== 'urgence')
    leg.innerHTML = visible.map(cat =>
        `<div class="cal-legend-pill"><span style="width:8px;height:8px;border-radius:50%;background:${cat.color};flex-shrink:0"></span>${cat.name}</div>`
    ).join('')
}

// ── Calendrier ────────────────────────────────────────────────────────────────
function getTabLabel(calId) {
    if (calId === 'perso')  return 'Mon horaire'
    if (calId === 'global') return 'Global'
    const cal = calDefs.find(c => c.id === calId)
    return cal ? cal.calendar_name : 'Calendrier'
}

function updateMobileSubtitle() {
    const el = document.getElementById('calMobileSubtitle')
    if (!el) return
    const monthLabel = new Date(calDate.getFullYear(), calDate.getMonth())
        .toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
    el.textContent = `${getTabLabel(currentCalId)} · ${monthLabel}`
}

function isEventVisible(evt) {
    const sIds = evt.shared_with ? evt.shared_with.map(s => s.id) : []
    if (currentCalId === 'perso')  return (evt.calendar_id === 'perso' && evt.author_id === currentUser.id) || sIds.includes(currentUser.id)
    if (currentCalId === 'global') return evt.calendar_id === 'global'
    return evt.calendar_id === currentCalId
}

function renderMobileAgenda() {
    updateMobileSubtitle()
    const agenda = document.getElementById('calAgenda')
    if (!agenda) return

    const todayStr = new Date().toISOString().split('T')[0]
    const todayEvts = []
    const upcomingByDate = {}

    currentSysEvents.forEach(sys => {
        const show = (sys.d && sys.d === todayStr) || (sys.start && todayStr >= sys.start && todayStr <= sys.end)
        if (show) todayEvts.push({ title: sys.t, type: sys.type, isSys: true, id: sys.id })
    })
    events.filter(e => e.cat_id !== 'urgence' && todayStr >= e.start_date && todayStr <= e.end_date).forEach(evt => {
        if (isEventVisible(evt)) {
            const assignedTo = evt.shared_with?.map(s => s.prenom_nom || s.email).filter(Boolean).join(' + ') || ''
            todayEvts.push({ title: evt.title, type: evt.cat_id, isSys: false, id: evt.id, assignedTo })
        }
    })

    for (let d = 1; d <= 14; d++) {
        const dt = new Date(); dt.setDate(dt.getDate() + d)
        const ds = dt.toISOString().split('T')[0]
        currentSysEvents.forEach(sys => {
            const show = (sys.d && sys.d === ds) || (sys.start && ds >= sys.start && ds <= sys.end)
            if (show) {
                if (!upcomingByDate[ds]) upcomingByDate[ds] = []
                upcomingByDate[ds].push({ title: sys.t, type: sys.type, isSys: true, id: sys.id, assignedTo: '' })
            }
        })
        events.filter(e => e.cat_id !== 'urgence' && ds >= e.start_date && ds <= e.end_date).forEach(evt => {
            if (isEventVisible(evt)) {
                if (!upcomingByDate[ds]) upcomingByDate[ds] = []
                const assignedTo = evt.shared_with?.map(s => s.prenom_nom || s.email).filter(Boolean).join(' + ') || ''
                upcomingByDate[ds].push({ title: evt.title, type: evt.cat_id, isSys: false, id: evt.id, assignedTo })
            }
        })
    }

    const todayLabel = new Date().toLocaleString('fr-FR', { day: 'numeric', month: 'long' })
    let html = `<div class="cal-agenda-today-header">
        <span class="cal-agenda-date-label">Aujourd'hui · ${todayLabel}</span>
        <span class="cal-agenda-count">${todayEvts.length} événement${todayEvts.length !== 1 ? 's' : ''}</span>
    </div>`

    if (todayEvts.length === 0) {
        html += `<div class="cal-agenda-empty">Aucun événement aujourd'hui</div>`
    } else {
        todayEvts.forEach(evt => {
            const cat = FIXED_CATEGORIES.find(c => c.id === evt.type) || { color: '#888', name: '' }
            const assignees = evt.assignedTo ? `<br><span style="font-size:11px;color:var(--text-faint)">${sanitize(evt.assignedTo)}</span>` : ''
            html += `<div class="cal-agenda-item" data-agendaid="${evt.id}" data-sys="${evt.isSys}" style="border-left-color:${cat.color}">
                <div class="cal-agenda-title">${sanitize(evt.title)}</div>
                <div class="cal-agenda-meta">Toute la journée${assignees}</div>
                <span class="cal-agenda-cat">${sanitize(cat.name.toUpperCase())}</span>
            </div>`
        })
    }

    const upcomingDates = Object.keys(upcomingByDate).sort().slice(0, 6)
    if (upcomingDates.length > 0) {
        html += `<div class="cal-agenda-section-header">Prochains jours</div>`
        upcomingDates.forEach(ds => {
            upcomingByDate[ds].forEach(evt => {
                const cat = FIXED_CATEGORIES.find(c => c.id === evt.type) || { color: '#888', name: '' }
                const dateLabel = new Date(ds + 'T12:00:00').toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
                const assignees = evt.assignedTo ? ` · ${sanitize(evt.assignedTo)}` : ''
                html += `<div class="cal-agenda-item" data-agendaid="${evt.id}" data-sys="${evt.isSys}" style="border-left-color:${cat.color}">
                    <div class="cal-agenda-title">${sanitize(evt.title)}</div>
                    <div class="cal-agenda-meta">${sanitize(dateLabel)}${assignees}</div>
                    <span class="cal-agenda-cat">${sanitize(cat.name.toUpperCase())}</span>
                </div>`
            })
        })
    }

    agenda.innerHTML = html
    agenda.querySelectorAll('[data-agendaid]').forEach(el =>
        el.addEventListener('click', () => openViewEvent(el.dataset.agendaid, el.dataset.sys === 'true'))
    )
}

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
        { id: 'sys-1', d: `${year}-01-01`, t: "Jour de l'An",    type: 'ferie' },
        { id: 'sys-2', d: `${year}-06-24`, t: 'St-Jean-Baptiste', type: 'ferie' },
        { id: 'sys-3', d: `${year}-07-01`, t: 'Fête du Canada',   type: 'ferie' },
        { id: 'sys-4', d: `${year}-12-25`, t: 'Noël',             type: 'ferie' },
        { id: 'sys-5', d: getVal(addDay(easter, -2)), t: 'Vendredi Saint',  type: 'ferie' },
        { id: 'sys-6', d: getVal(addDay(easter,  1)), t: 'Lundi de Pâques', type: 'ferie' },
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

    const firstDay      = new Date(year, month, 1).getDay()
    const daysInMonth   = new Date(year, month + 1, 0).getDate()
    const prevMonthDays = new Date(year, month, 0).getDate()
    currentSysEvents    = getSystemEvents(year)

    for (let i = firstDay - 1; i >= 0; i--) {
        const div = document.createElement('div')
        div.className = 'cal-day other-month'
        div.innerHTML = `<div class="day-num">${prevMonthDays - i}</div>`
        container.appendChild(div)
    }

    const todayStr = new Date().toISOString().split('T')[0]

    for (let d = 1; d <= daysInMonth; d++) {
        const curDt   = new Date(year, month, d)
        const dateStr = curDt.getFullYear() + '-' + String(curDt.getMonth() + 1).padStart(2, '0') + '-' + String(curDt.getDate()).padStart(2, '0')
        const div     = document.createElement('div')
        div.className = 'cal-day' + (dateStr === todayStr ? ' today' : '')

        let html = `<div class="day-num">${d}</div>`

        // Événements système
        const dotCatIds = new Set()
        currentSysEvents.forEach(sys => {
            const show = (sys.d && sys.d === dateStr) || (sys.start && dateStr >= sys.start && dateStr <= sys.end)
            if (!show) return
            if (currentCalId === 'urgence' && !['ferie', 'ccq'].includes(sys.type)) return
            const cat       = FIXED_CATEGORIES.find(c => c.id === sys.type) || { color: '#888' }
            const textColor = ['#f59e0b', '#ffffff'].includes(cat.color) ? '#1a1b22' : '#fff'
            html += `<div class="event-bar" data-sysid="${sys.id}" style="background:${cat.color};color:${textColor}" title="${sanitize(sys.t)}">${sys.t}</div>`
            dotCatIds.add(sys.type + '|' + cat.color)
        })

        // Événements normaux
        events.filter(e => dateStr >= e.start_date && dateStr <= e.end_date).forEach(evt => {
            const sIds = evt.shared_with ? evt.shared_with.map(s => s.id) : []
            let canSee = false
            if (currentCalId === 'urgence')     { canSee = evt.cat_id === 'urgence' }
            else if (evt.cat_id === 'urgence')  { canSee = false }
            else if (currentCalId === 'perso')  { canSee = (evt.calendar_id === 'perso' && evt.author_id === currentUser.id) || sIds.includes(currentUser.id) }
            else if (currentCalId === 'global') { canSee = evt.calendar_id === 'global' }
            else                                { canSee = evt.calendar_id === currentCalId }
            if (canSee) {
                const cat    = FIXED_CATEGORIES.find(c => c.id === evt.cat_id) || { color: '#444' }
                html += `<div class="event-bar" data-evtid="${evt.id}" style="background:${cat.color}" title="${sanitize(evt.title)}">${sanitize(evt.title)}</div>`
                dotCatIds.add(evt.cat_id + '|' + cat.color)
            }
        })

        // Dots mobile
        if (dotCatIds.size > 0) {
            const dots = [...dotCatIds].slice(0, 4).map(key => key.split('|')[1])
            html += `<div class="cal-dots-row">${dots.map(c => `<div class="cal-evt-dot" style="background:${c}"></div>`).join('')}</div>`
        }

        div.innerHTML = html
        div.addEventListener('click', e => {
            if (e.target === div || e.target.classList.contains('day-num')) {
                if (currentCalId === 'urgence' && !canManageUrgence()) return
                openDayDetails(dateStr)
            }
        })

        div.querySelectorAll('[data-sysid]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); openViewEvent(el.dataset.sysid, true) }))
        div.querySelectorAll('[data-evtid]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); openViewEvent(el.dataset.evtid, false) }))

        container.appendChild(div)
    }

    const totalCells     = firstDay + daysInMonth
    const remainingCells = 42 - totalCells
    for (let i = 1; i <= remainingCells; i++) {
        const div = document.createElement('div')
        div.className = 'cal-day other-month'
        div.innerHTML = `<div class="day-num">${i}</div>`
        container.appendChild(div)
    }

    renderMobileAgenda()
}

// ── Détails du jour ───────────────────────────────────────────────────────────
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

    const btnAdd = document.getElementById('btnAddFromDay')

    if (currentCalId === 'urgence') {
        document.getElementById('dayModalTitle').textContent = `Service d'urgence — ${formatDateFR(dateStr)}`
        btnAdd.style.display = canManageUrgence() ? '' : 'none'
        const urgEvent = events.find(e => e.cat_id === 'urgence' && dateStr >= e.start_date && dateStr <= e.end_date)
        if (urgEvent) dayEvents.push({ ...urgEvent, isUrg: true })
    } else {
        btnAdd.style.display = ''
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
            if (currentCalId === 'perso')       { canSee = (evt.calendar_id === 'perso' && evt.author_id === currentUser.id) || sIds.includes(currentUser.id) }
            else if (currentCalId === 'global') { canSee = evt.calendar_id === 'global' }
            else                                { canSee = evt.calendar_id === currentCalId }
            if (canSee) dayEvents.push(evt)
        })
    }

    if (dayEvents.length === 0) {
        content.innerHTML = `<div style="color:var(--text-faint);font-style:italic;padding:20px 0;text-align:center;font-size:13px">Rien de prévu pour cette journée.</div>`
    } else {
        dayEvents.forEach(evt => {
            const cId = evt.type || evt.cat_id
            const cat = FIXED_CATEGORIES.find(c => c.id === cId) || { color: 'var(--border-strong)', name: '' }
            const div = document.createElement('div')
            div.className = 'day-detail-item'
            div.style.borderLeftColor = cat.color
            let subtitle = cat.name
            if (evt.isUrg && evt.author_name) subtitle += ` · Assuré par ${evt.author_name}`
            div.innerHTML = `
                <div style="font-weight:700;color:#fff;font-size:14px">${sanitize(evt.t || evt.title || '')}</div>
                <div style="font-size:11px;color:var(--text-faint);margin-top:2px">${sanitize(subtitle)}</div>
            `
            div.addEventListener('click', () => { closeModal('dayModal'); openViewEvent(evt.id, evt.isSys) })
            content.appendChild(div)
        })
    }

    document.getElementById('dayModal').style.display = 'flex'
}

// ── Nouveau calendrier partagé ────────────────────────────────────────────────
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
    document.getElementById('newCalModal').style.display = 'flex'
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
        if (r1.error || r2.error) { openAlert('Erreur de suppression : ' + ((r1.error || r2.error).message)); return }
        currentCalId = 'perso'
        await loadData()
    })
}

// ── Ajout / édition événement ─────────────────────────────────────────────────
function openAddModal(dateStart = '', isUrgence = false, evtToEdit = null) {
    editingEventId = evtToEdit ? evtToEdit.id : null
    isUrgenceMode  = isUrgence

    document.getElementById('evtTitle').value = evtToEdit ? evtToEdit.title : ''
    document.getElementById('evtNote').value  = evtToEdit ? evtToEdit.note  : ''
    document.getElementById('evtStart').value = evtToEdit ? evtToEdit.start_date : dateStart
    document.getElementById('evtEnd').value   = evtToEdit ? evtToEdit.end_date   : dateStart

    const grpCat    = document.getElementById('grpCategory')
    const selCat    = document.getElementById('evtCategory')
    const grpCal    = document.getElementById('grpCalendar')
    const selCal    = document.getElementById('evtCalendarId')
    const grpGuests = document.getElementById('grpGuests')

    const grpTitle    = document.getElementById('grpTitle')
    const grpEmployee = document.getElementById('grpEmployee')
    const selEmployee = document.getElementById('evtEmployee')

    if (isUrgence) {
        document.getElementById('modalTitle').textContent = "Service d'urgence"
        grpCat.style.display = grpGuests.style.display = grpCal.style.display = 'none'
        grpTitle.style.display    = 'none'
        grpEmployee.style.display = 'block'
        selEmployee.innerHTML = [currentProfil, ...teamMembers.filter(m => m.id !== currentUser.id)]
            .filter(Boolean)
            .map(m => `<option value="${sanitize(m.id)}" data-name="${sanitize(m.prenom_nom)}">${sanitize(m.prenom_nom)}</option>`)
            .join('')
        if (evtToEdit) {
            const opt = [...selEmployee.options].find(o => o.dataset.name === evtToEdit.title)
            if (opt) selEmployee.value = opt.value
        }
    } else {
        document.getElementById('modalTitle').textContent = evtToEdit ? "Modifier l'événement" : 'Nouvel Événement'
        grpCat.style.display = grpGuests.style.display = grpCal.style.display = 'block'
        grpTitle.style.display    = 'block'
        grpEmployee.style.display = 'none'

        selCat.innerHTML = ALLOWED_ADD_CATS.map(id => {
            const cat = FIXED_CATEGORIES.find(c => c.id === id)
            return `<option value="${cat.id}">${cat.name}</option>`
        }).join('')
        if (evtToEdit) selCat.value = evtToEdit.cat_id

        selCal.innerHTML = `<option value="perso">Mon Horaire</option>`
        if (hasPermission('manage_calendar')) selCal.innerHTML += `<option value="global">Calendrier Global</option>`
        calDefs.forEach(c => {
            const sIds = c.shared_with ? c.shared_with.map(s => s.id) : []
            if (c.author_id === currentUser.id || sIds.includes(currentUser.id))
                selCal.innerHTML += `<option value="${sanitize(c.id)}">${sanitize(c.calendar_name)}</option>`
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

    document.getElementById('addModal').style.display = 'flex'
}

async function saveEvent() {
    const selEmp = document.getElementById('evtEmployee')
    const title = isUrgenceMode
        ? (selEmp.options[selEmp.selectedIndex]?.dataset.name || '').trim()
        : document.getElementById('evtTitle').value.trim()
    const start = document.getElementById('evtStart').value
    const end   = document.getElementById('evtEnd').value
    const note  = document.getElementById('evtNote').value.trim()
    if (!title || !start || !end) { openAlert('Remplir Employé et Dates !'); return }
    if (end < start) { openAlert('Date de fin invalide.'); return }

    let sharedWith = []
    if (!isUrgenceMode)
        document.querySelectorAll('.evt-guest-cb:checked').forEach(cb => { sharedWith.push({ id: cb.value, name: cb.getAttribute('data-name') }) })

    const existingEvt = editingEventId ? events.find(e => e.id === editingEventId) : null
    const payload = {
        id: editingEventId || 'evt-' + Date.now(), type_entite: 'event',
        calendar_id: isUrgenceMode ? 'global' : document.getElementById('evtCalendarId').value,
        title, start_date: start, end_date: end,
        cat_id: isUrgenceMode ? 'urgence' : document.getElementById('evtCategory').value,
        note,
        author_id:   existingEvt ? existingEvt.author_id   : currentUser.id,
        author_name: existingEvt ? existingEvt.author_name : myUserName,
        shared_with: sharedWith
    }

    const btn = document.getElementById('btnSaveEvent')
    const origHTML = btn.innerHTML
    btn.disabled = true; btn.textContent = 'Sauvegarde…'

    const { error } = await withRetry(() => supabase.from('evenements').upsert(payload))
    btn.disabled = false; btn.innerHTML = origHTML

    if (error) {
        const msg = (error.message || '').toLowerCase()
        let userMsg
        if (msg.includes('lock broken') || error.name === 'AbortError') userMsg = 'Une autre opération est en cours. Attends 2 secondes et réessaie.'
        else if (msg.includes('failed to fetch') || msg.includes('network')) userMsg = "Pas de connexion internet."
        else if (msg.includes('row-level security') || error.code === '42501') userMsg = "Tu n'as pas la permission de créer cet événement."
        else userMsg = friendlyError(error)
        openAlert(userMsg); return
    }

    closeModal('addModal')
    await loadData()
}

// ── Vue événement ─────────────────────────────────────────────────────────────
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

    document.getElementById('btnEditEvent').style.display   = canEdit ? 'flex' : 'none'
    document.getElementById('btnDeleteEvent').style.display  = canEdit ? 'flex' : 'none'
    const badge = document.getElementById('viewAuthorBadge')
    badge.textContent      = isSys ? 'Système' : (evt.author_name ? 'Créé par ' + evt.author_name : '')
    badge.style.background = isSys ? 'var(--bg-panel-2)' : 'var(--tint-blue)'
    badge.style.color      = isSys ? 'var(--text-faint)' : 'var(--status-blue)'

    const cat = FIXED_CATEGORIES.find(c => c.id === (evt.type || evt.cat_id)) || { color: 'var(--border-strong)', name: 'Inconnu' }
    document.getElementById('viewTitle').textContent = evt.t || evt.title
    document.getElementById('viewCat').innerHTML = `<div style="width:10px;height:10px;background:${cat.color};border-radius:50%"></div> ${cat.name}`
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

    document.getElementById('viewModal').style.display = 'flex'
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

// ── Rappels ───────────────────────────────────────────────────────────────────
function checkUpcomingReminders() {
    const today      = new Date(); today.setHours(0, 0, 0, 0)
    const todayStr   = today.toISOString().split('T')[0]
    const tomorrowStr = (() => { const t = new Date(today); t.setDate(today.getDate() + 1); return t.toISOString().split('T')[0] })()

    const storageKey = `cal_reminders_${todayStr}_${currentUser?.id || ''}`
    if (localStorage.getItem(storageKey)) return
    localStorage.setItem(storageKey, '1')

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

// ── Utilitaires ───────────────────────────────────────────────────────────────
function openAlert(msg) {
    document.getElementById('alertMessage').textContent = msg
    document.getElementById('alertModal').style.display = 'flex'
}
function showConfirm(msg, callback) {
    document.getElementById('confirmMessage').textContent = msg
    confirmCallback = callback
    document.getElementById('confirmModal').style.display = 'flex'
}
function closeModal(id) {
    const el = document.getElementById(id)
    if (el) el.style.display = 'none'
}

