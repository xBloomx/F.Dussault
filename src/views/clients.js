// src/views/clients.js

import { supabase } from '../supabase.js'
import { currentUser, hasPermission } from '../auth.js'
import { sanitize } from '../shared/sanitize.js'
import { friendlyError } from '../shared/errorMsg.js'
import { avatarColor as getAvatarColor } from '../shared/avatarColor.js'

// ── État local ───────────────────────────────────────────────────────────────
let clients = []
let clientToDeleteId = null
let hardDeleteId = null
let clientsPage = 0
const PAGE_SIZE = 25
let clientsHasMore = false
let currentViewingId = null
let _clientSearchDebounce = null

// ── Render principal ──────────────────────────────────────────────────────────
export async function render(container) {
    container.innerHTML = `
    <style>
        /* ── Toolbar / Search (même style que Factures/FdT) ── */
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input { width: 100%; background: var(--bg-sunken,#15161c); border: 1px solid var(--border); color: #fff; padding: 10px 14px 10px 38px; border-radius: var(--r-lg,10px); font-size: 14px; outline: none; transition: border-color var(--t-base); font-family: inherit; }
        .search-box input:focus { border-color: var(--brand-yellow); }
        .search-icon { position: absolute; left: 12px; color: var(--text-faint); pointer-events: none; display: flex; align-items: center; }
        .search-icon svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; }
        .select-wrap { position: relative; display: block; flex-shrink: 0; }
        .select-wrap select { width: 100%; -webkit-appearance: none; appearance: none; padding: 10px 36px 10px 14px; background: var(--bg-sunken,#15161c); border: 1px solid var(--border); color: #fff; border-radius: var(--r-lg,10px); font-size: 13px; outline: none; cursor: pointer; font-family: inherit; transition: border-color var(--t-base); }
        .select-wrap select:focus { border-color: var(--brand-yellow); }
        .sel-chevron { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; width: 16px; height: 16px; stroke: var(--text-faint); fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }

        /* ── Stats pill ── */
        .cli-stats { font-size: 12px; color: var(--text-faint); font-style: italic; padding: 0 4px; }

        /* ── Client rows ── */
        .client-list { display: flex; flex-direction: column; gap: 10px; padding-bottom: 60px; }
        .client-row {
            background: var(--bg-panel); border: 1px solid var(--border);
            border-left: 3px solid transparent;
            padding: 18px 22px; border-radius: var(--r-xl,14px);
            display: grid; grid-template-columns: 170px 1fr auto 44px; gap: 22px; align-items: center;
            cursor: pointer;
            transition: background var(--t-base), transform var(--t-fast);
        }
        .client-row:hover { background: var(--bg-panel-2); border-left-color: var(--brand-yellow) !important; transform: translateX(2px); }
        .client-row.commercial  { border-left-color: var(--status-blue); }
        .client-row.residentiel { border-left-color: var(--status-green); }
        .client-row.prospect    { border-left-color: var(--text-muted); }

        /* Type column (icon + label) */
        .cli-type-section { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 12px; letter-spacing: 0.6px; }
        .cli-type-section svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; flex-shrink: 0; }

        .cli-name-block { display: flex; align-items: center; gap: 12px; min-width: 0; flex-wrap: wrap; }
        .cli-main-name { font-weight: 700; font-size: 18px; color: #fff; letter-spacing: -0.2px; white-space: nowrap; }
        .cli-chip-sub  {
            font-size: 12px; color: #fff; background: var(--bg-sunken,#15161c);
            padding: 4px 11px; border-radius: 6px; font-weight: 600; border: 1px solid var(--border,#2f303a);
            white-space: nowrap;
        }
        .cli-chip-contact {
            font-size: 12px; color: var(--brand-yellow); background: var(--brand-yellow-dim,rgba(252,202,70,0.12));
            padding: 4px 11px; border-radius: 6px; font-weight: 600; border: 1px solid rgba(252,202,70,0.3);
            white-space: nowrap;
        }

        .cli-contact-col { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
        .cli-phone { font-size: 14px; color: #fff; font-weight: 600; font-family: var(--font-mono,'JetBrains Mono',monospace); display: flex; align-items: center; gap: 6px; }
        .cli-phone svg { width: 12px; height: 12px; stroke: var(--text-muted); fill: none; stroke-width: 2; flex-shrink: 0; }
        .cli-phone a { color: inherit; text-decoration: none; }
        .cli-phone a:hover { color: var(--brand-yellow); }
        .cli-addr  { font-size: 12px; color: var(--text-muted); text-align: right; display: flex; align-items: center; gap: 5px; }
        .cli-addr svg { width: 11px; height: 11px; stroke: currentColor; fill: none; stroke-width: 2; flex-shrink: 0; }

        .cli-edit-btn {
            width: 32px; height: 32px; border-radius: var(--r-md,8px);
            background: transparent; border: 1px solid var(--border);
            color: var(--text-muted); display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all var(--t-base); flex-shrink: 0;
        }
        .cli-edit-btn:hover { background: var(--bg-panel-2); color: #fff; border-color: var(--border-strong,#3d3e48); }

        /* ── View modal sections ── */
        .vm-section {
            font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;
            color: var(--text-faint); margin: 16px 0 8px;
            display: flex; align-items: center; gap: 8px;
        }
        .vm-section::after { content:''; flex:1; height:1px; background:var(--border-faint,#25262e); }
        .vm-row { display: flex; gap: 12px; margin-bottom: 8px; font-size: 13px; }
        .vm-label { color: var(--text-faint); width: 130px; flex-shrink: 0; font-size: 12px; }
        .vm-val { color: #fff; font-weight: 500; flex: 1; }
        .vm-alert-box {
            background: var(--tint-red); border: 1px solid var(--status-red);
            color: #fca5a5; padding: 10px 14px; border-radius: var(--r-lg,10px);
            font-size: 13px; font-weight: 600; margin-bottom: 12px;
            display: flex; align-items: center; gap: 8px;
        }
        .vm-note-box {
            background: var(--bg-sunken,#15161c); padding: 12px 14px;
            border-radius: var(--r-lg,10px); border: 1px solid var(--border);
            font-size: 13px; color: var(--text-muted); white-space: pre-wrap; line-height: 1.5;
            min-height: 36px;
        }
        .vm-tarif-box { border-color: rgba(252,202,70,0.35); color: #fff; font-style: normal; }
        .gps-row { display: flex; gap: 10px; margin-top: 8px; }
        .gps-btn {
            flex: 1; text-decoration: none; font-size: 12px; font-weight: 700;
            padding: 7px 10px; border-radius: var(--r-md,8px);
            display: flex; align-items: center; justify-content: center; gap: 5px;
            transition: opacity var(--t-base);
        }
        .gps-btn:hover { opacity: 0.85; }
        .gps-google { background: #4285F4; color: #fff; }
        .gps-apple  { background: #fff; color: #000; }

        /* ── Contact cards ── */
        .contact-card {
            background: var(--bg-sunken,#15161c); border: 1px solid var(--border);
            border-radius: var(--r-lg,10px); padding: 10px 14px; margin-bottom: 8px;
        }
        .contact-card-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .cc-name { font-weight: 700; color: #fff; font-size: 14px; }
        .cc-role { font-size: 11px; color: var(--brand-yellow); background: var(--brand-yellow-dim,rgba(252,202,70,0.12)); padding: 1px 7px; border-radius: 4px; display: inline-block; margin-top: 3px; }
        .cc-notes { color: var(--text-faint); font-size: 12px; margin-top: 6px; font-style: italic; white-space: pre-wrap; }
        .cc-right { text-align: right; }
        .cc-phone a { color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; }
        .cc-email a { color: var(--text-muted); font-size: 11px; text-decoration: none; }

        /* ── Contact avatar ── */
        .contact-card { display: flex; gap: 12px; align-items: flex-start; }
        .cc-avatar {
            width: 38px; height: 38px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-weight: 700; font-size: 13px; color: #fff; flex-shrink: 0; margin-top: 2px;
        }
        .cc-card-body { flex: 1; min-width: 0; }

        /* ── Right-side drawer (view panel) ── */
        .drawer-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.55);
            z-index: 1000; display: flex; justify-content: flex-end;
            animation: fadeInBg 0.18s ease;
        }
        @keyframes fadeInBg { from { opacity: 0 } to { opacity: 1 } }
        .drawer-panel {
            width: 420px; max-width: 100vw;
            background: var(--bg-base,#1a1b22); border-left: 1px solid var(--border);
            display: flex; flex-direction: column; height: 100%;
            animation: slideInRight 0.22s ease;
        }
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
        .drawer-header {
            display: flex; align-items: center; gap: 12px;
            padding: 18px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .drawer-header-icon {
            width: 44px; height: 44px; border-radius: var(--r-lg,10px);
            background: var(--bg-panel,#22232c); border: 1px solid var(--border);
            display: flex; align-items: center; justify-content: center;
            color: var(--brand-yellow); flex-shrink: 0;
        }
        .drawer-header-info { flex: 1; min-width: 0; }
        .drawer-title { font-size: 16px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .drawer-badges { display: flex; gap: 6px; margin-top: 5px; flex-wrap: wrap; }
        .v-badge-type {
            font-size: 11px; font-weight: 600; padding: 2px 8px;
            border-radius: var(--r-sm,6px); background: var(--bg-panel-2,#2a2b34);
            border: 1px solid var(--border); color: var(--text-muted);
            display: inline-flex; align-items: center; gap: 5px;
        }
        .v-badge-type-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .v-badge-cat {
            font-size: 11px; font-weight: 600; padding: 2px 8px;
            border-radius: var(--r-sm,6px); background: var(--bg-panel-2,#2a2b34);
            border: 1px solid var(--border); color: var(--text-faint);
        }
        .drawer-close {
            width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
            background: transparent; border: 1px solid var(--border); border-radius: var(--r-md,8px);
            color: var(--text-faint); font-size: 16px; cursor: pointer; flex-shrink: 0;
            transition: all var(--t-base);
        }
        .drawer-close:hover { background: var(--bg-panel-2); color: #fff; }
        .drawer-body { flex: 1; overflow-y: auto; padding: 16px 20px 20px; }
        .drawer-footer {
            display: flex; justify-content: flex-end; gap: 10px;
            padding: 14px 20px; border-top: 1px solid var(--border); flex-shrink: 0;
        }
        .vm-section-yellow { color: var(--brand-yellow) !important; }
        .vm-section-yellow::after { background: rgba(252,202,70,0.2) !important; }

        /* ── Edit form ── */
        .form-row-2 { display: grid; grid-template-columns: 1fr 2fr; gap: 12px; }
        .form-row-eq { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .contacts-container {
            border: 1px solid var(--border); padding: 10px;
            border-radius: var(--r-lg,10px); background: var(--bg-sunken,#15161c);
            display: flex; flex-direction: column; gap: 8px;
        }
        .contact-edit-row {
            background: var(--bg-panel); border: 1px solid var(--border);
            border-radius: var(--r-md,8px); padding: 10px; display: flex; gap: 8px; align-items: flex-start;
        }
        .contact-inputs { display: flex; gap: 8px; flex: 1; flex-wrap: wrap; }
        .contact-inputs .input { flex: 1; min-width: 80px; }
        .btn-remove-row {
            background: transparent; border: none; color: var(--status-red);
            cursor: pointer; font-size: 18px; line-height: 1; padding: 2px 4px; flex-shrink: 0;
        }
        .btn-add-contact {
            width: 100%; padding: 10px; background: transparent;
            border: 1px dashed var(--border-strong,#3d3e48); color: var(--text-muted);
            border-radius: var(--r-md,8px); cursor: pointer; font-size: 13px;
            transition: border-color var(--t-base); font-family: inherit;
        }
        .btn-add-contact:hover { border-color: var(--brand-yellow); color: var(--brand-yellow); }
        .alert-field { border-color: var(--status-red) !important; }
        .alert-label { color: var(--status-red) !important; display: flex; align-items: center; gap: 5px; }

        /* ── Corbeille ── */
        .corbeille-item {
            background: var(--bg-sunken,#15161c); border: 1px dashed var(--status-red);
            border-radius: var(--r-lg,10px); padding: 12px 14px;
            display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
        }

        .load-more-btn {
            width: 100%; padding: 12px; margin-top: 8px;
            background: transparent; color: var(--text-muted);
            border: 1px dashed var(--border); border-radius: var(--r-lg,10px);
            cursor: pointer; font-size: 13px; font-weight: 600; font-family: inherit;
            transition: border-color var(--t-base);
        }
        .load-more-btn:hover { border-color: var(--brand-yellow); color: var(--brand-yellow); }

        /* ── Mobile header ── */
        .cli-mobile-header { display: none; align-items: center; gap: 10px; }
        .cli-mobile-title  { flex: 1; font-size: 22px; font-weight: 700; color: #fff; margin: 0; }
        .cli-menu-btn      { background: none; border: none; color: var(--text-muted); padding: 4px; cursor: pointer; display: flex; align-items: center; }
        .cli-menu-btn svg  { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 2.2; stroke-linecap: round; }
        .cli-add-btn       { background: var(--brand-yellow); border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .cli-add-btn svg   { width: 18px; height: 18px; stroke: #1a1b22; fill: none; stroke-width: 2.5; }
        .cli-mobile-sub    { display: none; font-size: 12px; color: var(--text-faint); margin-top: -6px; }

        /* ── Mobile card elements ── */
        .cli-mob-ava    { display: none; width: 40px; height: 40px; border-radius: 50%; color: #fff; font-weight: 700; font-size: 13px; align-items: center; justify-content: center; flex-shrink: 0; }
        .cli-mob-body   { display: none; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
        .cli-mob-type   { font-size: 11px; font-weight: 700; letter-spacing: 0.6px; }
        .cli-mob-name   { font-size: 16px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cli-mob-phone  { font-size: 13px; color: var(--text-faint); }
        .cli-mob-chevron { display: none; color: var(--text-faint); font-size: 22px; font-weight: 300; align-self: center; line-height: 1; }

        @media (max-width: 900px) { .clients-main { padding: 16px; } }
        @media (max-width: 768px) {
            .clients-main { padding: 16px 16px 12px; }
            .cli-mobile-header { display: flex; }
            .cli-mobile-sub    { display: block; }
            .view-header       { display: none; }
            #cliFilterWrap { display: block; width: 46px; flex-shrink: 0; }
            #cliFilterWrap select { width: 46px; height: 46px; padding: 0; color: transparent; background: var(--bg-sunken); border: 1px solid var(--border); border-radius: var(--r-xl,14px); -webkit-appearance: none; appearance: none; cursor: pointer; }
            #cliFilterWrap select option { color: var(--text-main); background: var(--bg-panel); }
            #cliFilterWrap .sel-chevron { right: 50%; transform: translate(50%,-50%); }
            .cli-stats         { display: none; }
            .cli-type-section  { display: none; }
            .cli-name-block    { display: none; }
            .cli-contact-col   { display: none; }
            .cli-edit-btn      { display: none; }
            .cli-mob-ava       { display: flex; }
            .cli-mob-body      { display: flex; }
            .cli-mob-chevron   { display: flex; }
            .client-row        { grid-template-columns: auto 1fr auto; gap: 12px; padding: 14px 16px; transform: none !important; }
            .form-row-2, .form-row-eq { grid-template-columns: 1fr; }
            .modal-overlay { align-items: center; }
            .modal {
                width: 92% !important; max-width: 480px !important;
                border-radius: var(--r-xl,14px) !important;
                max-height: 92dvh;
                padding-bottom: 28px !important;
            }
            .modal-overlay.z-high { align-items: center; }
            .modal-overlay.z-high .modal { width: 90% !important; border-radius: var(--r-xl,14px) !important; padding-bottom: 28px !important; }
            .toolbar { padding: 0; background: transparent; border: none; }
            .search-box input { border-radius: var(--r-xl,14px); padding: 12px 14px 12px 40px; }
        }
        .cli-filter-pills { display: none; gap: 6px; flex-wrap: wrap; }
        .cli-fpill { background: var(--bg-panel); border: 1px solid var(--border); border-radius: var(--r-lg,10px); padding: 7px 14px; font-size: 13px; font-weight: 600; color: var(--text-muted); cursor: pointer; font-family: inherit; transition: all var(--t-base); white-space: nowrap; }
        .cli-fpill.active { background: #fff; color: #1a1b22; border-color: #fff; }
    </style>

    <div class="clients-main view">

        <!-- Mobile header -->
        <div class="cli-mobile-header">
            <button class="cli-menu-btn" id="cli-menu-btn" aria-label="Menu">
                <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h2 class="cli-mobile-title">Clients</h2>
            <button class="cli-add-btn" id="btnNewClientMobile" aria-label="Nouveau client">
                <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
        </div>
        <div class="cli-mobile-sub" id="cliMobileSub"></div>

        <!-- Header -->
        <div class="view-header">
            <div>
                <h1>Clients</h1>
                <p class="sub">Répertoire &amp; Historique</p>
            </div>
            <div class="actions">
                <button class="iconbtn" id="btnShowCorbeille" title="Corbeille" style="display:none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
                <button class="btn btn-primary btn-pill" id="btnNewClient">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    Nouveau client
                </button>
            </div>
        </div>

        <!-- Toolbar -->
        <div class="toolbar">
            <div class="search-box">
                <span class="search-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                <input type="text" id="clientSearch" placeholder="Rechercher (Nom, Tél, Ville…)">
            </div>
            <div class="select-wrap" id="cliFilterWrap">
                <select id="statusFilter">
                    <option value="all">Tous les statuts</option>
                    <option value="commercial">Commercial</option>
                    <option value="residentiel">Résidentiel</option>
                    <option value="prospect">Prospect</option>
                </select>
                <svg class="sel-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
        </div>
        <!-- Filtre mobile pills -->
        <div class="cli-filter-pills" id="cliFilterPills">
            <button class="cli-fpill active" data-filter="all">Tous</button>
            <button class="cli-fpill" data-filter="commercial">Commercial</button>
            <button class="cli-fpill" data-filter="residentiel">Résidentiel</button>
            <button class="cli-fpill" data-filter="prospect">Prospect</button>
        </div>

        <div class="cli-stats" id="filterResultText">Total : 0 client(s)</div>
        <div class="client-list" id="clientListContainer"></div>
    </div>

    <!-- Drawer : visualisation fiche -->
    <div class="drawer-overlay" id="viewModal" style="display:none">
        <div class="drawer-panel">
            <div class="drawer-header">
                <div class="drawer-header-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                </div>
                <div class="drawer-header-info">
                    <div class="drawer-title" id="vName">—</div>
                    <div class="drawer-badges">
                        <span class="v-badge-type" id="vTypeBadge">
                            <span class="v-badge-type-dot" id="vTypeDot"></span>
                            <span id="vTypeLabel">-</span>
                        </span>
                        <span class="v-badge-cat" id="vCatBadge" style="display:none"></span>
                    </div>
                </div>
                <button class="drawer-close" id="btnCloseView">✕</button>
            </div>
            <div class="drawer-body">
                <div id="vAlertSection" style="display:none" class="vm-alert-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    ATTENTION : <span id="vAlertText"></span>
                </div>
                <div class="vm-section">Informations générales</div>
                <div class="vm-row"><div class="vm-label">Entreprise</div><div class="vm-val" id="vCompany">-</div></div>
                <div class="vm-row" id="vRowSubcontractor" style="display:none"><div class="vm-label">Sous-traitant</div><div class="vm-val" id="vSubcontractor">-</div></div>
                <div class="vm-row"><div class="vm-label">Contact dossier</div><div class="vm-val" id="vContact">-</div></div>
                <div class="vm-row"><div class="vm-label">Statut</div><div class="vm-val" id="vStatus">-</div></div>
                <div class="vm-row" style="flex-direction:column;gap:6px">
                    <div style="display:flex;gap:12px"><div class="vm-label">Adresse</div><div class="vm-val" id="vAddress">-</div></div>
                    <div class="gps-row">
                        <a href="#" id="vLinkGoogle" target="_blank" class="gps-btn gps-google">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                            Google Maps
                        </a>
                        <a href="#" id="vLinkApple" target="_blank" class="gps-btn gps-apple">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                            Apple Plans
                        </a>
                    </div>
                </div>
                <div class="vm-row" id="vRowVille" style="display:none"><div class="vm-label">Ville</div><div class="vm-val" id="vVille">-</div></div>
                <div class="vm-section vm-section-yellow" id="vContactsSection">Contacts</div>
                <div id="vContactsList"></div>
                <div id="vTarifSection" style="display:none">
                    <div class="vm-section vm-section-yellow">Spécifications tarifaires</div>
                    <div class="vm-note-box vm-tarif-box" id="vTarif"></div>
                </div>
                <div class="vm-section">Notes dossier</div>
                <div class="vm-note-box" id="vNotes"></div>
            </div>
            <div class="drawer-footer">
                <button class="btn btn-secondary" id="btnCloseViewFooter">Fermer</button>
                <button class="btn btn-primary" id="btnSwitchToEdit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Modifier
                </button>
            </div>
        </div>
    </div>

    <!-- Modal : édition client -->
    <div class="modal-overlay" id="editModal" style="display:none">
        <div class="modal" style="max-width:680px">
            <div class="modal-title" id="edModalTitle">Nouveau Client</div>
            <input type="hidden" id="edId">
            <div style="display:flex;flex-direction:column;gap:14px">
                <div>
                    <label class="field-label alert-label">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        Alerte prioritaire (Chien, Mauvais payeur…)
                    </label>
                    <input class="input alert-field" type="text" id="edAlert" placeholder="S'affiche en rouge…">
                </div>
                <div class="form-row-2">
                    <div>
                        <label class="field-label">Statut</label>
                        <select class="select" id="edStatus">
                            <option value="residentiel">Résidentiel</option>
                            <option value="commercial">Commercial</option>
                            <option value="prospect">Prospect / Inconnu</option>
                        </select>
                    </div>
                    <div id="grpCompany">
                        <label class="field-label">Nom de l'entreprise</label>
                        <input class="input" type="text" id="edCompany" placeholder="Ex: Bridgestone">
                    </div>
                </div>
                <div id="grpSubcontractor" style="display:none">
                    <label class="field-label">Nom du sous-traitant <span style="color:var(--text-faint);font-weight:400">(Optionnel)</span></label>
                    <input class="input" type="text" id="edSubcontractor" placeholder="Ex: Equans">
                </div>
                <div>
                    <label class="field-label">Contact principal</label>
                    <input class="input" type="text" id="edContact" placeholder="Ex: Marie Tremblay">
                </div>
                <div class="form-row-eq">
                    <div>
                        <label class="field-label">Adresse principale <span style="color:var(--status-red)">*</span></label>
                        <input class="input" type="text" id="edAddress" placeholder="Adresse complète (obligatoire)">
                    </div>
                    <div>
                        <label class="field-label">Ville</label>
                        <input class="input" type="text" id="edVille" placeholder="Ex: Montréal">
                    </div>
                </div>
                <div>
                    <label class="field-label">Contacts (Téléphones / Courriels) <span style="color:var(--status-red)">*</span></label>
                    <div class="contacts-container" id="edContactsList"></div>
                    <button type="button" class="btn-add-contact" id="btnAddContact">+ Ajouter un contact</button>
                </div>
                <div id="grpTarif" style="display:none">
                    <label class="field-label" style="color:var(--brand-yellow)">Spécifications tarifaires</label>
                    <textarea class="textarea" id="edTarif" rows="3" placeholder="Taux, Déplacement…" style="min-height:80px"></textarea>
                </div>
                <div>
                    <label class="field-label">Notes internes</label>
                    <textarea class="textarea" id="edNotes" rows="3" placeholder="Notes…" style="min-height:80px"></textarea>
                </div>
            </div>
            <div class="modal-actions" id="edModalActions"></div>
        </div>
    </div>

    <!-- Modal : confirmation soft-delete -->
    <div class="modal-overlay z-high" id="confirmModal" style="display:none;z-index:4500">
        <div class="modal" style="max-width:360px;text-align:center">
            <div class="modal-title" style="justify-content:center;border-bottom:none;color:var(--status-red);margin-bottom:8px">Supprimer ce client ?</div>
            <p style="color:var(--text-muted);font-size:14px;margin-bottom:0">Le client sera déplacé dans la corbeille.</p>
            <div class="modal-actions" style="justify-content:center;margin-top:20px">
                <button class="btn btn-secondary" id="btnCancelDelete">Annuler</button>
                <button class="btn btn-danger" id="btnExecuteDelete">Oui, supprimer</button>
            </div>
        </div>
    </div>

    <!-- Modal : hard delete -->
    <div class="modal-overlay z-high" id="hardConfirmModal" style="display:none;z-index:5000">
        <div class="modal" style="max-width:360px;text-align:center">
            <div class="modal-title" style="justify-content:center;border-bottom:none;color:var(--status-red);margin-bottom:8px">Action irréversible</div>
            <p style="color:var(--text-muted);font-size:13px;margin-bottom:0;line-height:1.5">Le client sera détruit à tout jamais. Cette action est impossible à annuler.</p>
            <div class="modal-actions" style="justify-content:center;margin-top:20px">
                <button class="btn btn-secondary" id="btnCancelHard">Annuler</button>
                <button class="btn btn-danger" id="btnExecuteHard">Oui, détruire</button>
            </div>
        </div>
    </div>

    <!-- Modal : corbeille -->
    <div class="modal-overlay" id="corbeilleModal" style="display:none">
        <div class="modal" style="max-width:560px">
            <div class="modal-title" style="color:var(--status-red)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Corbeille de sécurité
            </div>
            <p style="color:var(--text-muted);font-size:13px;margin:0 0 14px">Ces clients ont été supprimés. Vous pouvez les restaurer ou les détruire définitivement.</p>
            <div id="corbeilleList"></div>
            <div class="modal-actions">
                <button class="btn btn-secondary" id="btnCloseCorbeille">Fermer</button>
            </div>
        </div>
    </div>

    <!-- Modal : alerte info -->
    <div class="modal-overlay z-high" id="alertModal" style="display:none;z-index:5000">
        <div class="modal" style="max-width:360px;text-align:center">
            <div class="modal-title" style="justify-content:center;border-bottom:none;color:var(--brand-yellow);margin-bottom:8px">Information</div>
            <p id="alertMessage" style="color:var(--text-muted);font-size:14px;margin-bottom:0;line-height:1.5"></p>
            <div class="modal-actions" style="justify-content:center;margin-top:20px">
                <button class="btn btn-primary btn-pill" id="btnCloseAlert" style="min-width:100px">Compris</button>
            </div>
        </div>
    </div>
    `

    await init()
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
    if (hasPermission('delete_clients'))  document.getElementById('btnShowCorbeille').style.display = 'flex'
    if (!hasPermission('create_clients')) document.getElementById('btnNewClient').style.display = 'none'

    document.getElementById('btnNewClient').addEventListener('click', () => openEditModal())
    document.getElementById('btnNewClientMobile')?.addEventListener('click', () => openEditModal())
    document.getElementById('cli-menu-btn')?.addEventListener('click', () => document.getElementById('topbar-mobile-menu-btn')?.click())
    document.getElementById('btnShowCorbeille').addEventListener('click', openCorbeille)
    document.getElementById('clientSearch').addEventListener('input', () => { clearTimeout(_clientSearchDebounce); _clientSearchDebounce = setTimeout(filterClients, 300) })
    document.getElementById('statusFilter').addEventListener('change', filterClients)
    document.querySelectorAll('.cli-fpill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cli-fpill').forEach(b => b.classList.remove('active'))
            btn.classList.add('active')
            const sf = document.getElementById('statusFilter')
            if (sf) { sf.value = btn.dataset.filter; filterClients() }
        })
    })

    document.getElementById('btnCloseView').addEventListener('click', () => closeModal('viewModal'))
    document.getElementById('btnCloseViewFooter').addEventListener('click', () => closeModal('viewModal'))
    document.getElementById('btnSwitchToEdit').addEventListener('click', () => { closeModal('viewModal'); openEditModal(currentViewingId) })

    document.getElementById('edStatus').addEventListener('change', toggleCommercialFields)
    document.getElementById('btnAddContact').addEventListener('click', () => addContactRow())

    document.getElementById('btnCancelDelete').addEventListener('click', () => closeModal('confirmModal'))
    document.getElementById('btnExecuteDelete').addEventListener('click', executeDeleteClient)
    document.getElementById('btnCancelHard').addEventListener('click', () => { closeModal('hardConfirmModal'); hardDeleteId = null })
    document.getElementById('btnExecuteHard').addEventListener('click', executeHardDelete)
    document.getElementById('btnCloseCorbeille').addEventListener('click', () => closeModal('corbeilleModal'))
    document.getElementById('btnCloseAlert').addEventListener('click', () => closeModal('alertModal'))

    // Fermer sur fond
    ;['viewModal','editModal','corbeilleModal','alertModal'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', e => {
            if (e.target === document.getElementById(id)) closeModal(id)
        })
    })

    await loadClients()
}

// ── Chargement ────────────────────────────────────────────────────────────────
async function loadClients(reset = true) {
    if (reset) { clientsPage = 0; clients = [] }
    const from = clientsPage * PAGE_SIZE, to = from + PAGE_SIZE - 1
    const { data, error } = await supabase
        .from('clients')
        .select('id,nom,type,adresse,ville,contacts,notes,est_supprime,telephone')
        .order('nom', { ascending: true })
        .range(from, to + 1)
    if (error) { console.error('Erreur chargement clients:', error); return }
    clientsHasMore = (data || []).length > PAGE_SIZE
    const pageData = (data || []).slice(0, PAGE_SIZE)
    clients = reset ? pageData : [...clients, ...pageData]

    if (reset) {
        try {
            const { data: facData } = await supabase.from('factures').select('client_id').not('client_id', 'is', null)
            _invoiceCountMap = {}
            if (facData) facData.forEach(f => { if (f.client_id) _invoiceCountMap[f.client_id] = (_invoiceCountMap[f.client_id] || 0) + 1 })
        } catch { _invoiceCountMap = {} }
    }

    updateCorbeilleCount()
    filterClients()
}

async function chargerPlusClients() {
    const btn = document.getElementById('btn-charger-plus-clients')
    if (btn) { btn.disabled = true; btn.textContent = 'Chargement…' }
    clientsPage++
    try { await loadClients(false) }
    catch (e) { console.error('[clients] Erreur page suivante:', e?.message); clientsPage--; if (btn) { btn.disabled = false; btn.textContent = `Charger ${PAGE_SIZE} clients de plus…` } }
}

// ── Sauvegarde ────────────────────────────────────────────────────────────────
async function saveClient() {
    const id           = document.getElementById('edId').value
    const alertVal     = document.getElementById('edAlert').value.trim()
    const company      = document.getElementById('edCompany').value.trim()
    const contact      = document.getElementById('edContact').value.trim()
    const address      = document.getElementById('edAddress').value.trim()
    const ville        = document.getElementById('edVille').value.trim()
    const status       = document.getElementById('edStatus').value
    const notes        = document.getElementById('edNotes').value
    const tarif        = document.getElementById('edTarif').value
    let subcontractor  = document.getElementById('edSubcontractor').value.trim()
    if (status !== 'commercial') subcontractor = ''

    if (!company && !contact && !subcontractor) { openAlertModal("Vous devez entrer au moins un Nom d'entreprise, un Sous-traitant ou un Contact principal."); return }
    if (!address) { openAlertModal("L'adresse est obligatoire pour créer la fiche client."); return }

    let contactsList = [], hasPhone = false
    document.querySelectorAll('#edContactsList .contact-edit-row').forEach(row => {
        const name  = row.querySelector('.inp-name')?.value.trim()  || ''
        const role  = row.querySelector('.inp-role')?.value.trim()  || ''
        const phone = row.querySelector('.inp-phone')?.value.trim() || ''
        const email = row.querySelector('.inp-email')?.value.trim() || ''
        if (phone.length > 0) hasPhone = true
        if (name || phone || email) contactsList.push({ name, role, phone, email })
    })
    if (!hasPhone) { openAlertModal("Il faut ajouter au moins un numéro de téléphone valide."); return }

    const phoneRe = /^[\d\s\(\)\-\+\.]{7,20}$/, emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    for (const ct of contactsList) {
        if (ct.phone && !phoneRe.test(ct.phone)) { openAlertModal(`Numéro de téléphone invalide : "${ct.phone}"`); return }
        if (ct.email && !emailRe.test(ct.email)) { openAlertModal(`Adresse courriel invalide : "${ct.email}"`); return }
    }

    const fullPayload = {
        nom: company || subcontractor || contact,
        type: status,
        telephone: contactsList[0]?.phone || '',
        courriel:  contactsList[0]?.email || '',
        adresse: address, ville,
        contacts: { list: contactsList, company, subcontractor, contact, alert: alertVal, tarif, notes },
        notes, user_id: currentUser.id, est_supprime: false
    }

    let error
    if (id) { const { error: e } = await supabase.from('clients').update(fullPayload).eq('id', id); error = e }
    else    { const { error: e } = await supabase.from('clients').insert([fullPayload]); error = e }

    if (error) { openAlertModal(friendlyError(error)); return }
    await loadClients()
    closeModal('editModal')
}

// ── Suppression ───────────────────────────────────────────────────────────────
async function executeDeleteClient() {
    if (!clientToDeleteId) { closeModal('confirmModal'); return }
    const { data, error } = await supabase.from('clients').update({ est_supprime: true }).eq('id', clientToDeleteId).select()
    closeModal('confirmModal')
    if (error) { openAlertModal(friendlyError(error)); return }
    if (!data || data.length === 0) { openAlertModal("La suppression a été bloquée par les permissions de la base de données."); return }
    closeModal('editModal')
    await loadClients()
    showToastLocal('Client déplacé dans la corbeille')
}

async function restaurerClient(id) {
    const { data, error } = await supabase.from('clients').update({ est_supprime: false }).eq('id', id).select()
    if (error) { openAlertModal(friendlyError(error)); return }
    if (!data || data.length === 0) { openAlertModal("La restauration a été bloquée par les permissions."); return }
    await loadClients()
    showToastLocal('Client restauré')
    openCorbeille()
}

async function executeHardDelete() {
    if (!hardDeleteId) return
    const { error } = await supabase.from('clients').delete().eq('id', hardDeleteId)
    if (error) { openAlertModal(friendlyError(error)) }
    closeModal('hardConfirmModal')
    hardDeleteId = null
    await loadClients()
    openCorbeille()
}

// ── Rendu liste ───────────────────────────────────────────────────────────────
const _cliAvaColors = ['#7c3aed','#2563eb','#059669','#dc2626','#d97706','#0891b2','#9333ea','#db2777','#0d9488','#c2410c']
function cliAvaColor(name) { return _cliAvaColors[(name || '?').charCodeAt(0) % _cliAvaColors.length] }
function cliInitials(name) { return (name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() }

let _invoiceCountMap = {}

function displayPhone(phone) {
    if (!phone) return ''
    const d = phone.replace(/\D/g, '')
    if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
    if (d.length === 11 && d[0] === '1') return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`
    return phone
}

function renderClients(list) {
    const container = document.getElementById('clientListContainer')
    if (!container) return
    container.innerHTML = ''

    if (list.length === 0) {
        container.innerHTML = `<div style="color:var(--text-faint);text-align:center;padding:40px;font-style:italic;font-size:13px">Aucun client trouvé.</div>`
        return
    }

    const TYPE_CFG = {
        commercial:  { color: 'var(--status-blue)',  label: 'COMMERCIAL' },
        residentiel: { color: 'var(--status-green)', label: 'RÉSIDENTIEL' },
        prospect:    { color: 'var(--text-muted)',   label: 'PROSPECT' },
    }
    const PHONE_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.67 12 19.79 19.79 0 0 1 1.5 3.34 2 2 0 0 1 3.48 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.4a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`
    const PIN_SVG  = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`

    list.forEach(c => {
        const extra         = c.contacts || {}
        const contactsList  = extra.list || []
        const company       = extra.company || c.nom || ''
        const subcontractor = extra.subcontractor || ''
        const contact       = extra.contact || ''
        const alertVal      = extra.alert || ''
        const status        = c.type || 'prospect'
        const mainContact   = contactsList[0] || {}
        const mainName      = company || subcontractor || contact || 'Sans nom'
        const cfg           = TYPE_CFG[status] || TYPE_CFG.prospect

        // Chips: dark for sub/contact-only, yellow for contact-with-sub
        let chipsHTML = ''
        if (subcontractor) {
            chipsHTML += `<span class="cli-chip-sub">${sanitize(subcontractor)}</span>`
            if (contact && contact !== mainName)
                chipsHTML += `<span class="cli-chip-contact">${sanitize(contact)}</span>`
        } else if (contact && contact !== mainName) {
            chipsHTML += `<span class="cli-chip-sub">${sanitize(contact)}</span>`
        }

        const addrShort = c.adresse ? c.adresse.substring(0, 40) + (c.adresse.length > 40 ? '…' : '') : '—'
        const mainPhone = mainContact.phone || c.telephone || ''
        const initials = cliInitials(mainName)
        const avaCol = cliAvaColor(mainName)

        const invoiceCount = _invoiceCountMap[c.id] || 0
        const typeLineHTML = invoiceCount > 0
            ? `${cfg.label} <span style="font-weight:400;color:var(--text-faint)">· ${invoiceCount} fact.</span>`
            : cfg.label

        const row = document.createElement('div')
        row.className = `client-row ${status}`
        row.innerHTML = `
            <!-- Mobile avatar + content -->
            <div class="cli-mob-ava" style="background:${avaCol}">${initials}</div>
            <div class="cli-mob-body">
                <div class="cli-mob-type" style="color:${cfg.color}">${typeLineHTML}</div>
                <div class="cli-mob-name">${sanitize(mainName)}</div>
                ${mainPhone ? `<div class="cli-mob-phone">${sanitize(displayPhone(mainPhone))}</div>` : ''}
            </div>
            <div class="cli-mob-chevron">›</div>
            <!-- Desktop columns -->
            <div class="cli-type-section" style="color:${cfg.color}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.67 12 19.79 19.79 0 0 1 1.5 3.34 2 2 0 0 1 3.48 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.4a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                ${cfg.label}
            </div>
            <div class="cli-name-block">
                <span class="cli-main-name">${sanitize(mainName)}</span>
                ${chipsHTML}
            </div>
            <div class="cli-contact-col">
                <div class="cli-phone">
                    ${PHONE_SVG}
                    ${mainContact.phone
                        ? `<a href="tel:${sanitize(mainContact.phone)}" onclick="event.stopPropagation()">${sanitize(mainContact.phone)}</a>`
                        : '—'}
                </div>
                <div class="cli-addr">${PIN_SVG}${sanitize(addrShort)}</div>
            </div>
            <button class="cli-edit-btn" data-edit="${c.id}" title="Modifier">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
        `
        row.addEventListener('click', () => openViewModal(c.id))
        row.querySelector('[data-edit]').addEventListener('click', e => { e.stopPropagation(); openEditModal(c.id) })
        container.appendChild(row)
    })

    ajouterBoutonChargerPlus()
}

function filterClients() {
    const term    = (document.getElementById('clientSearch')?.value || '').toLowerCase()
    const statusF = document.getElementById('statusFilter')?.value || 'all'
    const active  = clients.filter(c => !c.est_supprime)
    const filtered = active.filter(c => {
        const extra = c.contacts || {}
        const matchTerm = !term ||
            (c.nom || '').toLowerCase().includes(term) ||
            (extra.company || '').toLowerCase().includes(term) ||
            (extra.subcontractor || '').toLowerCase().includes(term) ||
            (c.adresse || '').toLowerCase().includes(term) ||
            (c.ville || '').toLowerCase().includes(term) ||
            (c.telephone || '').includes(term) ||
            (extra.list || []).some(ct => (ct.phone || '').includes(term) || (ct.name || '').toLowerCase().includes(term))
        const matchStatus = statusF === 'all' || c.type === statusF
        return matchTerm && matchStatus
    })
    const resText = document.getElementById('filterResultText')
    if (resText) {
        const suffix = clientsHasMore ? ` (${clients.length} chargés — il y en a plus)` : ''
        resText.textContent = (statusF === 'all' && term === '')
            ? `Total : ${filtered.length} client(s) dans le répertoire.${suffix}`
            : `${filtered.length} client(s) affiché(s) selon vos filtres.`
    }
    const mobSub = document.getElementById('cliMobileSub')
    if (mobSub) mobSub.textContent = `${filtered.length} fiche${filtered.length > 1 ? 's' : ''}`
    renderClients(filtered)
}

function ajouterBoutonChargerPlus() {
    const container = document.getElementById('clientListContainer')
    document.getElementById('btn-charger-plus-clients')?.remove()
    if (!clientsHasMore || !container) return
    const btn = document.createElement('button')
    btn.id = 'btn-charger-plus-clients'
    btn.className = 'load-more-btn'
    btn.textContent = `Charger ${PAGE_SIZE} clients de plus…`
    btn.addEventListener('click', chargerPlusClients)
    container.appendChild(btn)
}

function updateCorbeilleCount() {
    const count = clients.filter(c => c.est_supprime).length
    const btn = document.getElementById('btnShowCorbeille')
    if (btn) btn.title = `Corbeille (${count})`
}

// ── Modal visualisation ───────────────────────────────────────────────────────
function _initials(name) {
    return (name||'').trim().split(/\s+/).map(w=>w[0]||'').slice(0,2).join('').toUpperCase() || '?'
}

function openViewModal(id) {
    currentViewingId = id
    const c = clients.find(cl => cl.id === id)
    if (!c) return
    const extra = c.contacts || {}, contactsList = extra.list || []

    // Header
    const clientName = extra.company || extra.subcontractor || c.nom || '-'
    document.getElementById('vName').textContent = clientName

    const TYPE_CONFIG = {
        commercial:  { label: 'Commercial',  dot: '#2563eb' },
        residentiel: { label: 'Résidentiel', dot: '#16a34a' },
        prospect:    { label: 'Prospect',    dot: '#6b7280' },
    }
    const tc = TYPE_CONFIG[c.type] || { label: c.type || '-', dot: '#6b7280' }
    document.getElementById('vTypeDot').style.background = tc.dot
    document.getElementById('vTypeLabel').textContent    = tc.label

    const catBadge = document.getElementById('vCatBadge')
    if (extra.category) { catBadge.style.display = 'inline-flex'; catBadge.textContent = extra.category }
    else catBadge.style.display = 'none'

    document.getElementById('vCompany').textContent  = extra.company || c.nom || '-'
    document.getElementById('vContact').textContent  = extra.contact || '-'
    document.getElementById('vStatus').textContent   = tc.label
    document.getElementById('vAddress').textContent  = c.adresse || '-'
    document.getElementById('vNotes').textContent    = extra.notes || c.notes || 'Aucune note.'

    const rowVille = document.getElementById('vRowVille')
    if (c.ville) { rowVille.style.display = 'flex'; document.getElementById('vVille').textContent = c.ville }
    else rowVille.style.display = 'none'

    const secSub = document.getElementById('vRowSubcontractor')
    if (c.type === 'commercial' && extra.subcontractor) { secSub.style.display = 'flex'; document.getElementById('vSubcontractor').textContent = extra.subcontractor }
    else secSub.style.display = 'none'

    document.getElementById('vLinkGoogle').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.adresse || '')}`
    document.getElementById('vLinkApple').href  = `http://maps.apple.com/?q=${encodeURIComponent(c.adresse || '')}`

    const alertSec = document.getElementById('vAlertSection')
    if (extra.alert) { alertSec.style.display = 'flex'; document.getElementById('vAlertText').textContent = extra.alert }
    else alertSec.style.display = 'none'

    const secTarif = document.getElementById('vTarifSection')
    if (c.type === 'commercial' && extra.tarif) { secTarif.style.display = 'block'; document.getElementById('vTarif').textContent = extra.tarif }
    else secTarif.style.display = 'none'

    const n = contactsList.length
    document.getElementById('vContactsSection').textContent = n > 0 ? `Contacts · ${n}` : 'Contacts'

    const contList = document.getElementById('vContactsList')
    contList.innerHTML = ''
    contactsList.forEach(ct => {
        const phoneLink = ct.phone ? `<a href="tel:${sanitize(ct.phone)}" onclick="event.stopPropagation()">${sanitize(ct.phone)}</a>` : '—'
        const emailLink = ct.email ? `<a href="mailto:${sanitize(ct.email)}" onclick="event.stopPropagation()">${sanitize(ct.email)}</a>` : ''
        const color = getAvatarColor(ct.name)
        const inits = _initials(ct.name)
        contList.insertAdjacentHTML('beforeend', `
            <div class="contact-card">
                <div class="cc-avatar" style="background:${color}">${inits}</div>
                <div class="cc-card-body">
                    <div class="contact-card-top">
                        <div>
                            <div class="cc-name">${sanitize(ct.name)}</div>
                            ${ct.role ? `<div class="cc-role">${sanitize(ct.role)}</div>` : ''}
                        </div>
                        <div class="cc-right">
                            <div class="cc-phone">${phoneLink}</div>
                            <div class="cc-email">${emailLink}</div>
                        </div>
                    </div>
                    ${ct.notes ? `<div class="cc-notes">${sanitize(ct.notes)}</div>` : ''}
                </div>
            </div>`)
    })

    document.getElementById('viewModal').style.display = 'flex'
}

// ── Modal édition ─────────────────────────────────────────────────────────────
function openEditModal(id = null) {
    const actionsDiv = document.getElementById('edModalActions')
    const contList   = document.getElementById('edContactsList')
    contList.innerHTML = ''

    actionsDiv.innerHTML = `
        <button class="btn btn-secondary" id="btnCancelEdit">Annuler</button>
        <button class="btn btn-primary" id="btnSaveClient">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Enregistrer
        </button>
    `
    document.getElementById('btnCancelEdit').addEventListener('click', () => closeModal('editModal'))
    document.getElementById('btnSaveClient').addEventListener('click', saveClient)

    if (id) {
        const c = clients.find(cl => cl.id === id)
        if (!c) return
        const extra = c.contacts || {}
        document.getElementById('edId').value            = c.id
        document.getElementById('edAlert').value         = extra.alert || ''
        document.getElementById('edCompany').value       = extra.company || ''
        document.getElementById('edSubcontractor').value = extra.subcontractor || ''
        document.getElementById('edContact').value       = extra.contact || ''
        document.getElementById('edAddress').value       = c.adresse || ''
        document.getElementById('edVille').value         = c.ville || ''
        document.getElementById('edStatus').value        = c.type || 'residentiel'
        document.getElementById('edNotes').value         = extra.notes || c.notes || ''
        document.getElementById('edTarif').value         = extra.tarif || ''
        const list = extra.list || []
        list.forEach(ct => addContactRow(ct))
        if (list.length === 0) addContactRow()
        toggleCommercialFields()

        if (hasPermission('delete_clients')) {
            const btnDel = document.createElement('button')
            btnDel.className = 'btn btn-danger'
            btnDel.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Supprimer`
            btnDel.addEventListener('click', () => {
                clientToDeleteId = c.id
                document.getElementById('confirmModal').style.display = 'flex'
            })
            actionsDiv.prepend(btnDel)
        }
    } else {
        document.getElementById('edId').value            = ''
        document.getElementById('edAlert').value         = ''
        document.getElementById('edStatus').value        = 'residentiel'
        document.getElementById('edCompany').value       = ''
        document.getElementById('edSubcontractor').value = ''
        document.getElementById('edContact').value       = ''
        document.getElementById('edAddress').value       = ''
        document.getElementById('edVille').value         = ''
        document.getElementById('edNotes').value         = ''
        document.getElementById('edTarif').value         = ''
        toggleCommercialFields()
        addContactRow()
    }

    document.getElementById('edModalTitle').textContent = id ? 'Éditer Client' : 'Nouveau Client'
    document.getElementById('editModal').style.display = 'flex'
}

function toggleCommercialFields() {
    const status = document.getElementById('edStatus').value
    const isCommercial = status === 'commercial'
    document.getElementById('grpCompany').style.display      = status === 'residentiel' ? 'none' : ''
    document.getElementById('grpTarif').style.display        = isCommercial ? 'block' : 'none'
    document.getElementById('grpSubcontractor').style.display = isCommercial ? 'block' : 'none'
}

function addContactRow(data = { name:'', role:'', phone:'', email:'' }) {
    const div = document.createElement('div')
    div.className = 'contact-edit-row'
    div.innerHTML = `
        <div class="contact-inputs">
            <input class="input" type="text"  placeholder="Nom"   class="inp-name"  value="${sanitize(data.name  || '')}">
            <input class="input" type="text"  placeholder="Poste" class="inp-role"  value="${sanitize(data.role  || '')}">
            <input class="input" type="text"  placeholder="Tél"   class="inp-phone" value="${sanitize(data.phone || '')}">
            <input class="input" type="email" placeholder="Email"  class="inp-email" value="${sanitize(data.email || '')}">
        </div>
        <button class="btn-remove-row" title="Retirer">×</button>
    `
    // Reassign class names (innerHTML override workaround)
    const inputs = div.querySelectorAll('.contact-inputs input')
    inputs[0].className = 'input inp-name'
    inputs[1].className = 'input inp-role'
    inputs[2].className = 'input inp-phone'
    inputs[3].className = 'input inp-email'
    div.querySelector('.btn-remove-row').addEventListener('click', () => div.remove())
    div.querySelector('.inp-phone').addEventListener('keyup', e => formatPhone(e.target))
    document.getElementById('edContactsList').appendChild(div)
}

// ── Corbeille ─────────────────────────────────────────────────────────────────
function openCorbeille() {
    const list    = document.getElementById('corbeilleList')
    list.innerHTML = ''
    const deleted = clients.filter(c => c.est_supprime)

    if (deleted.length === 0) {
        list.innerHTML = `<div style="color:var(--text-faint);text-align:center;padding:24px;font-size:13px">La corbeille est vide.</div>`
    } else {
        deleted.forEach(c => {
            const div = document.createElement('div')
            div.className = 'corbeille-item'
            div.innerHTML = `
                <div>
                    <div style="font-weight:700;color:#fff;font-size:14px">${sanitize(c.nom || 'Sans nom')}</div>
                    <div style="font-size:12px;color:var(--text-faint);margin-top:2px">${sanitize(c.adresse || '')}</div>
                </div>
                <div style="display:flex;gap:8px">
                    <button class="btn btn-secondary" style="padding:6px 12px;font-size:12px" data-restore="${c.id}">Restaurer</button>
                    <button class="btn btn-danger"    style="padding:6px 12px;font-size:12px" data-hard="${c.id}">Détruire</button>
                </div>
            `
            list.appendChild(div)
        })
        list.querySelectorAll('[data-restore]').forEach(btn => btn.addEventListener('click', () => restaurerClient(btn.dataset.restore)))
        list.querySelectorAll('[data-hard]').forEach(btn => btn.addEventListener('click', () => {
            hardDeleteId = btn.dataset.hard
            document.getElementById('hardConfirmModal').style.display = 'flex'
        }))
    }
    document.getElementById('corbeilleModal').style.display = 'flex'
}

// ── Utilitaires ───────────────────────────────────────────────────────────────
function showToastLocal(msg) {
    const t = document.createElement('div')
    t.textContent = msg
    t.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--bg-panel);color:#fff;border:1px solid var(--status-green);border-left:3px solid var(--status-green);padding:11px 20px;border-radius:var(--r-lg,10px);font-size:13px;font-weight:500;z-index:9999;box-shadow:var(--shadow-md);pointer-events:none;transition:opacity 0.3s`
    document.body.appendChild(t)
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300) }, 2500)
}

function openAlertModal(msg) {
    document.getElementById('alertMessage').textContent = msg
    document.getElementById('alertModal').style.display = 'flex'
}

function closeModal(id) {
    const el = document.getElementById(id)
    if (el) el.style.display = 'none'
}

function formatPhone(input) {
    let v = input.value.replace(/\D/g, '')
    if (v.length > 3 && v.length <= 6)  v = v.slice(0, 3) + '-' + v.slice(3)
    else if (v.length > 6)              v = v.slice(0, 3) + '-' + v.slice(3, 6) + '-' + v.slice(6, 10)
    input.value = v
}
