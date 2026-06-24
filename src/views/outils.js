// src/views/outils.js

import { supabase } from '../supabase.js'
import { currentUser, currentRole, currentProfil, hasPermission } from '../auth.js'
import { sanitize } from '../shared/sanitize.js'
import { friendlyError } from '../shared/errorMsg.js'
import { avatarColor as getAvatarColor } from '../shared/avatarColor.js'

// ── État local ───────────────────────────────────────────────────────────────
let myUserName = 'Employé'
let toolsLog = []
let toolsPage = 0
const TOOLS_PAGE_SIZE = 25
let toolsHasMore = false
let teamMembers = []
let itemToProcess = null
let actionType = null
let pendingTransfersQueue = []
let currentPendingTransfer = null

// ── Render principal ──────────────────────────────────────────────────────────
export async function render(container) {
    container.innerHTML = `
    <style>
        /* ── Section eyebrows ── */
        .tool-section-title {
            font-size: 11px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 1.2px; color: var(--text-faint);
            display: flex; align-items: center; gap: 8px; margin: 8px 0 4px;
        }
        .tool-section-title::after { content:''; flex:1; height:1px; background:var(--border-faint,#25262e); }
        .tool-section-title.repair { color: var(--status-orange); }
        .tool-section-title.history { color: var(--text-faint); }

        /* ── Tool rows ── */
        .tool-list { display: flex; flex-direction: column; gap: 10px; padding-bottom: 8px; }
        .tool-row {
            background: var(--bg-panel); border: 1px solid var(--border);
            border-left: 3px solid var(--brand-yellow);
            padding: 14px 18px; border-radius: var(--r-lg,10px);
            display: flex; justify-content: space-between; align-items: center;
            gap: 16px; position: relative;
            transition: background var(--t-base), transform var(--t-fast);
        }
        .tool-row:hover { background: var(--bg-panel-2); transform: translateX(2px); }
        .tool-row.returned      { border-left-color: var(--status-green); opacity: 0.75; }
        .tool-row.en-reparation { border-left-color: var(--status-orange); }

        .tool-info { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 0; }
        .tool-name-line {
            display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
            font-size: 15px; font-weight: 700; color: #fff;
        }
        .tool-name-icon { color: var(--text-faint); flex-shrink: 0; }
        .tool-name-icon svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; display: block; }

        /* Status badges */
        .tool-badge {
            font-size: 10px; font-weight: 700; padding: 2px 9px;
            border-radius: 999px; white-space: nowrap;
        }
        .tool-badge.out    { background: var(--brand-yellow-dim); color: var(--brand-yellow); }
        .tool-badge.in     { background: var(--tint-green);  color: var(--status-green); }
        .tool-badge.rep    { background: var(--tint-orange); color: var(--status-orange); }
        .tool-badge.transfer { background: var(--tint-blue); color: var(--status-blue); }

        .tool-details-line {
            display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
            color: var(--text-muted); font-size: 12px; margin-top: 2px;
        }
        .tool-detail { display: flex; align-items: center; gap: 5px; }
        .tool-detail svg { width: 12px; height: 12px; stroke: var(--text-faint); fill: none; stroke-width: 2; flex-shrink: 0; }

        .tool-actions { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }

        /* Action buttons */
        .btn-tool-action {
            padding: 7px 12px; border-radius: var(--r-md,8px);
            font-size: 12px; font-weight: 600; cursor: pointer;
            display: flex; align-items: center; gap: 5px;
            white-space: nowrap; border: 1px solid transparent; font-family: inherit;
            transition: all var(--t-base);
        }
        .btn-tool-action svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; }
        .bta-return   { background: var(--tint-green);  color: var(--status-green); border-color: rgba(34,197,94,0.3); }
        .bta-return:hover { background: var(--status-green); color: #fff; }
        .bta-transfer { background: var(--tint-blue);   color: var(--status-blue);  border-color: rgba(59,130,246,0.3); }
        .bta-transfer:hover { background: var(--status-blue); color: #fff; }
        .bta-cancel   { background: var(--bg-panel-2);  color: var(--text-muted);   border-color: var(--border); }
        .bta-cancel:hover { color: #fff; border-color: var(--border-strong); }
        .bta-brise    { background: var(--tint-orange); color: var(--status-orange); border-color: rgba(251,146,60,0.3); }
        .bta-brise:hover { background: var(--status-orange); color: #1a1b22; }
        .bta-repare   { background: var(--tint-green);  color: var(--status-green); border-color: rgba(34,197,94,0.3); }
        .bta-repare:hover { background: var(--status-green); color: #fff; }

        /* Delete button */
        .btn-del-tool {
            position: absolute; top: 50%; right: 12px; transform: translateY(-50%);
            width: 30px; height: 30px; border-radius: var(--r-md,8px);
            background: transparent; border: 1px solid var(--border);
            color: var(--text-faint); display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all var(--t-base);
        }
        .btn-del-tool svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-del-tool { opacity: 0; transition: opacity var(--t-fast), background var(--t-base), color var(--t-base), border-color var(--t-base); }
        .btn-del-tool:hover { background: var(--tint-red); color: var(--status-red); border-color: var(--status-red); }
        .tool-row:hover .btn-del-tool { opacity: 1; }
        .tool-row.has-delete { padding-right: 54px; }

        .tool-empty { color: var(--text-faint); font-style: italic; padding: 20px 0; font-size: 13px; }

        /* ── Tabs ── */
        .tool-tabs { display: flex; gap: 8px; flex-shrink: 0; }
        .tab.active .tab-badge { background: rgba(26,27,34,0.15); color: #1a1b22; }

        /* ── Modal form card (emprunt, transfert, brisé) ── */
        .tool-modal-card {
            background: var(--bg-panel); width: 90%; max-width: 420px;
            border-radius: var(--r-xl,14px); border: 1px solid var(--border);
            box-shadow: var(--shadow-lg); overflow-y: auto; max-height: 92vh;
        }
        .tool-modal-header {
            padding: 20px 24px 0; display: flex; align-items: center; justify-content: space-between;
        }
        .tool-modal-title {
            display: flex; align-items: center; gap: 10px;
            font-size: 17px; font-weight: 700; color: #fff;
        }
        .tool-modal-title svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; flex-shrink: 0; }
        .tool-modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
        .btn-close-tool { background: none; border: none; color: var(--text-faint); font-size: 22px; cursor: pointer; padding: 0; line-height: 1; transition: color var(--t-fast); }
        .btn-close-tool:hover { color: #fff; }

        /* Load more */
        .load-more-btn { width: 100%; padding: 12px; background: transparent; color: var(--text-muted); border: 1px dashed var(--border); border-radius: var(--r-lg,10px); cursor: pointer; font-size: 13px; font-weight: 600; font-family: inherit; transition: border-color var(--t-base); }
        .load-more-btn:hover { border-color: var(--brand-yellow); color: var(--brand-yellow); }

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

        /* ── Mobile header ── */
        .ou-mobile-header { display: none; align-items: center; gap: 10px; }
        .ou-mobile-title  { flex: 1; font-size: 26px; font-weight: 800; color: #fff; margin: 0; }
        .ou-menu-btn      { background: none; border: none; color: var(--text-muted); padding: 4px; cursor: pointer; display: flex; align-items: center; }
        .ou-menu-btn svg  { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 2.2; stroke-linecap: round; }
        .ou-add-btn       { background: var(--brand-yellow); border: none; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .ou-add-btn svg   { width: 20px; height: 20px; stroke: #1a1b22; fill: none; stroke-width: 2.5; }
        .ou-mobile-sub    { display: none; font-size: 13px; color: var(--text-faint); margin-top: -4px; }

        /* ── Mobile status text ── */
        .tool-mob-status { display: none; font-size: 11px; font-weight: 700; letter-spacing: 0.6px; align-self: center; flex-shrink: 0; }
        .tool-mob-status.out { color: var(--brand-yellow); }
        .tool-mob-status.in  { color: var(--status-green); }
        .tool-mob-status.rep { color: var(--status-orange); }

        @media (max-width: 900px) { .outils-main { padding: 16px; } }
        @media (max-width: 768px) {
            .outils-main { padding: 16px 16px 12px; }
            .ou-mobile-header { display: flex; }
            .ou-mobile-sub    { display: block; }
            .view-header      { display: none; }
            .toolbar          { display: flex; padding: 0; background: transparent; border: none; gap: 8px; align-items: center; }
            .search-box input { border-radius: var(--r-xl,14px); padding: 12px 14px 12px 40px; }
            #ouFilterWrap     { display: none; }
            .tab svg          { display: none; }
            .tool-row { gap: 12px; transform: none !important; border-radius: var(--r-xl,14px); padding: 12px 14px; }
            .tool-row.has-delete { padding-right: 14px; }
            .tool-name-main { font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .btn-del-tool { display: none; }
            .tool-date-col { display: none; }
            .tool-actions { display: none !important; }
            .tool-badge { display: none; }
            .tool-mob-status { display: flex; font-size: 11px; font-weight: 700; letter-spacing: 0.6px; flex-shrink: 0; }
            .modal-overlay { align-items: center; }
            .tool-modal-card { width: 92%; max-width: 480px; border-radius: var(--r-xl,14px); max-height: 92dvh; }
        }

        /* ── Tool icon box ── */
        .tool-icon-box {
            width: 44px; height: 44px; border-radius: var(--r-lg,10px);
            background: var(--bg-panel-2,#2a2b34); border: 1px solid var(--border);
            display: flex; align-items: center; justify-content: center;
            color: var(--brand-yellow); flex-shrink: 0;
        }
        .tool-icon-box svg { width: 20px; height: 20px; stroke: currentColor; fill: none; stroke-width: 2; }
        .tool-icon-box.returned { color: var(--status-green); }
        .tool-icon-box.rep      { color: var(--status-orange); }

        /* ── Updated tool row ── */
        .tool-row { cursor: pointer; }
        .tool-info { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
        .tool-name-main { font-size: 14px; font-weight: 700; color: #fff; }
        .tool-meta { display: flex; align-items: center; gap: 8px; color: var(--text-faint); font-size: 12px; flex-wrap: wrap; }
        .tool-meta-item { display: flex; align-items: center; gap: 4px; }
        .tool-meta-item svg { width: 11px; height: 11px; stroke: currentColor; fill: none; stroke-width: 2; flex-shrink: 0; }

        /* Date column */
        .tool-date-col { font-size: 12px; color: var(--text-faint); white-space: nowrap; padding: 0 6px; }
        .tool-date-col strong { color: var(--text-muted); }

        /* Updated status badges */
        .tool-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; white-space: nowrap; }
        .tool-badge.out  { background: rgba(252,202,70,0.15); color: var(--brand-yellow); }
        .tool-badge.in   { background: var(--tint-green,rgba(34,197,94,0.12)); color: var(--status-green); }
        .tool-badge.rep  { background: var(--tint-orange,rgba(251,146,60,0.12)); color: var(--status-orange); }
        .tool-badge.pend { background: var(--tint-blue,rgba(59,130,246,0.12)); color: var(--status-blue); font-size: 10px; }

        /* Simplified row action buttons */
        .btn-row-return {
            padding: 6px 11px; border-radius: var(--r-md,8px); font-size: 12px; font-weight: 600;
            border: 1px solid var(--border); background: var(--bg-panel-2,#2a2b34); color: var(--text-muted);
            cursor: pointer; display: flex; align-items: center; gap: 5px; white-space: nowrap;
            font-family: inherit; transition: all var(--t-base); flex-shrink: 0;
        }
        .btn-row-return:hover { background: var(--tint-green); color: var(--status-green); border-color: rgba(34,197,94,0.3); }
        .btn-row-return svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-row-icon {
            width: 32px; height: 32px; border-radius: var(--r-md,8px); flex-shrink: 0;
            background: transparent; border: 1px solid var(--border); color: var(--text-faint);
            display: flex; align-items: center; justify-content: center; cursor: pointer;
            transition: all var(--t-base);
        }
        .btn-row-icon:hover { background: var(--tint-blue); color: var(--status-blue); border-color: rgba(59,130,246,0.3); }
        .btn-row-icon svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; }

        /* Tab count badges */
        .tab-badge {
            display: inline-flex; align-items: center; justify-content: center;
            min-width: 20px; height: 20px; border-radius: 999px; padding: 0 6px;
            font-size: 11px; font-weight: 700; background: var(--bg-sunken,#15161c);
            color: var(--text-faint); margin-left: 6px;
        }
        .tool-tab.active .tab-badge { background: rgba(252,202,70,0.15); color: var(--brand-yellow); }

        /* Stats subtitle */
        .outils-stats { display: flex; gap: 6px; align-items: center; font-size: 13px; color: var(--text-faint); }

        /* ── Shared drawer utilities ── */
        @keyframes fadeInBg  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
        .drawer-close {
            width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
            background: transparent; border: 1px solid var(--border); border-radius: var(--r-md,8px);
            color: var(--text-faint); font-size: 16px; cursor: pointer; flex-shrink: 0;
            transition: all var(--t-base);
        }
        .drawer-close:hover { background: var(--bg-panel-2); color: #fff; }
        .vm-section {
            font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;
            color: var(--text-faint); margin: 16px 0 8px;
            display: flex; align-items: center; gap: 8px;
        }
        .vm-section::after { content:''; flex:1; height:1px; background:var(--border-faint,#25262e); }
        .vm-section-yellow { color: var(--brand-yellow) !important; }
        .vm-section-yellow::after { background: rgba(252,202,70,0.2) !important; }

        /* ── Tool detail drawer ── */
        .tool-drawer-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.55);
            z-index: 1000; display: flex; justify-content: flex-end;
            animation: fadeInBg 0.18s ease;
        }
        .tool-drawer-panel {
            width: 440px; max-width: 100vw;
            background: var(--bg-base,#1a1b22); border-left: 1px solid var(--border);
            display: flex; flex-direction: column; height: 100%;
            animation: slideInRight 0.22s ease;
        }
        .tool-drawer-header {
            display: flex; align-items: flex-start; gap: 12px;
            padding: 18px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .tool-drawer-title-area { flex: 1; min-width: 0; padding-top: 2px; }
        .tool-drawer-name { font-size: 15px; font-weight: 700; color: #fff; line-height: 1.3; margin-bottom: 6px; }
        .tool-drawer-body { flex: 1; overflow-y: auto; padding: 16px 20px 20px; }
        .td-state-card {
            background: var(--bg-panel,#22232c); border: 1px solid var(--border);
            border-radius: var(--r-lg,10px); padding: 14px 16px;
            display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
        }
        .td-avatar {
            width: 42px; height: 42px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-weight: 700; font-size: 14px; color: #fff; flex-shrink: 0;
        }
        .td-holder-name { font-weight: 700; color: #fff; font-size: 14px; }
        .td-holder-meta { font-size: 12px; color: var(--text-faint); margin-top: 3px; display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
        .td-holder-meta svg { width: 11px; height: 11px; stroke: currentColor; fill: none; stroke-width: 2; }
        .td-action-row { display: flex; gap: 8px; margin-bottom: 4px; }
        .btn-td-return, .btn-td-transfer {
            flex: 1; padding: 9px 12px; border-radius: var(--r-md,8px); font-size: 13px; font-weight: 600;
            background: var(--bg-panel,#22232c); border: 1px solid var(--border); color: var(--text-muted);
            cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
            font-family: inherit; transition: all var(--t-base);
        }
        .btn-td-return:hover  { background: var(--tint-green); color: var(--status-green); border-color: rgba(34,197,94,0.3); }
        .btn-td-transfer:hover{ background: var(--tint-blue);  color: var(--status-blue);  border-color: rgba(59,130,246,0.3); }
        .btn-td-return svg, .btn-td-transfer svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-td-bris {
            padding: 9px 14px; border-radius: var(--r-md,8px); font-size: 13px; font-weight: 600;
            background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: var(--status-red);
            cursor: pointer; display: flex; align-items: center; gap: 6px;
            font-family: inherit; transition: all var(--t-base); flex-shrink: 0;
        }
        .btn-td-bris:hover { background: var(--status-red); color: #fff; }
        .btn-td-bris svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }

        /* History entries */
        .hist-entry { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border-faint,#25262e); }
        .hist-entry:last-child { border-bottom: none; }
        .hist-icon { width: 22px; display: flex; flex-direction: column; align-items: center; padding-top: 3px; flex-shrink: 0; }
        .hist-dot { width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; }
        .hist-line { width: 1px; flex: 1; background: var(--border-faint,#25262e); margin-top: 4px; }
        .hist-sortie  .hist-dot { background: var(--brand-yellow); }
        .hist-retour  .hist-dot { background: var(--status-green); }
        .hist-transfer .hist-dot { background: var(--status-blue); }
        .hist-brise   .hist-dot { background: var(--status-orange); }
        .hist-repare  .hist-dot { background: var(--status-green); }
        .hist-type { font-size: 10px; font-weight: 800; letter-spacing: 0.7px; text-transform: uppercase; }
        .hist-sortie  .hist-type { color: var(--brand-yellow); }
        .hist-retour  .hist-type { color: var(--status-green); }
        .hist-transfer .hist-type { color: var(--status-blue); }
        .hist-brise   .hist-type { color: var(--status-orange); }
        .hist-repare  .hist-type { color: var(--status-green); }
        .hist-who { font-size: 13px; color: var(--text-main); font-weight: 600; }
        .hist-arrow { color: var(--text-faint); font-weight: 400; }
        .hist-date { font-size: 11px; color: var(--text-faint); margin-top: 2px; }
        .hist-note { font-size: 11px; color: var(--text-faint); font-style: italic; margin-top: 2px; }
    </style>

    <div class="outils-main view">

        <!-- Mobile header -->
        <div class="ou-mobile-header">
            <button class="ou-menu-btn" id="ou-menu-btn" aria-label="Menu">
                <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h2 class="ou-mobile-title">Banque d'outils</h2>
            <button class="ou-add-btn" id="btnBorrowMobile" aria-label="Sortir un outil">
                <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
        </div>
        <div class="ou-mobile-sub" id="ouMobileSub"></div>

        <!-- Header -->
        <div class="view-header">
            <div>
                <h1>Banque d'outils</h1>
                <p class="sub outils-stats" id="outilsStats">Chargement…</p>
            </div>
            <div class="actions">
                <button class="btn btn-primary btn-pill" id="btnBorrow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Sortir un outil
                </button>
            </div>
        </div>

        <!-- Toolbar recherche + filtre employé -->
        <div class="toolbar">
            <div class="search-box">
                <span class="search-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                <input type="text" id="toolSearch" placeholder="Rechercher un outil…">
            </div>
            <div class="select-wrap" id="ouFilterWrap">
                <select id="employeeFilter" style="width:220px">
                    <option value="">Tous les employés</option>
                </select>
                <svg class="sel-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
        </div>

        <!-- Onglets -->
        <div class="tool-tabs">
            <button class="tab active" id="tabTous">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                Tous les outils
            </button>
            <button class="tab" id="tabHistorique">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Historique
            </button>
        </div>

        <!-- Panel : Tous les outils -->
        <div id="panelTous" style="display:flex;flex-direction:column;gap:10px">
            <div class="tool-list" id="activeListContainer"></div>
            <div class="tool-section-title repair" id="reparationSectionTitle" style="display:none">En réparation</div>
            <div class="tool-list" id="reparationListContainer"></div>
        </div>

        <!-- Panel : Historique -->
        <div id="panelHistorique" style="display:none;flex-direction:column;gap:10px">
            <div class="tool-list" id="historyListContainer"></div>
        </div>
    </div>

    <!-- Drawer : détail outil -->
    <div class="tool-drawer-overlay" id="toolDrawer" style="display:none">
        <div class="tool-drawer-panel">
            <div class="tool-drawer-header">
                <div class="tool-icon-box" id="tdIconBox">
                    <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                </div>
                <div class="tool-drawer-title-area">
                    <div class="tool-drawer-name" id="tdName">—</div>
                    <span class="tool-badge out" id="tdBadge">● Sorti</span>
                </div>
                <button class="drawer-close" id="btnCloseToolDrawer">✕</button>
            </div>
            <div class="tool-drawer-body">
                <div class="vm-section vm-section-yellow">État actuel</div>
                <div class="td-state-card" id="tdStateCard"></div>
                <div id="tdActions"></div>
                <div class="vm-section vm-section-yellow" id="tdHistoryTitle">Historique</div>
                <div id="tdHistoryList"></div>
            </div>
        </div>
    </div>

    <!-- Modal : emprunt -->
    <div class="modal-overlay" id="borrowModal" style="display:none">
        <div class="tool-modal-card">
            <div class="tool-modal-header">
                <div class="tool-modal-title" style="color:var(--brand-yellow)">
                    <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                    Sortir un outil
                </div>
                <button class="btn-close-tool" id="btnCloseBorrow">×</button>
            </div>
            <div class="tool-modal-body">
                <div>
                    <label class="field-label">Nom du plombier</label>
                    <input class="input" type="text" id="inpPlombier" placeholder="Ex: François">
                </div>
                <div>
                    <label class="field-label">Outil</label>
                    <select class="select" id="inpOutil">
                        <option value="" disabled selected hidden>Sélectionner une machine…</option>
                        <option value="Autre...">Autre (Préciser en note)</option>
                    </select>
                </div>
                <div id="grpOutilAutre" style="display:none">
                    <label class="field-label">Préciser l'outil <span style="color:var(--status-red)">*</span></label>
                    <input class="input" type="text" id="inpOutilAutre" placeholder="Ex: Perceuse, Caméra d'inspection…">
                </div>
                <div>
                    <label class="field-label">Adresse / Lieu</label>
                    <input class="input" type="text" id="inpAdresse" placeholder="Ex: Camion #4">
                </div>
                <div>
                    <label class="field-label">Date</label>
                    <input class="input" type="date" id="inpDate" style="color-scheme:dark">
                </div>
                <button class="btn btn-primary" id="btnSaveBorrow" style="width:100%;padding:13px;justify-content:center;font-size:14px">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Sortir l'outil
                </button>
            </div>
        </div>
    </div>

    <!-- Modal : transfert -->
    <div class="modal-overlay" id="transferModal" style="display:none">
        <div class="tool-modal-card">
            <div class="tool-modal-header">
                <div class="tool-modal-title" style="color:var(--status-blue)">
                    <svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                    Transférer l'outil
                </div>
                <button class="btn-close-tool" id="btnCloseTransfer">×</button>
            </div>
            <div class="tool-modal-body">
                <div>
                    <label class="field-label">Outil sélectionné</label>
                    <div id="transferToolName" style="font-size:15px;font-weight:700;color:#fff;padding:10px 14px;background:var(--bg-sunken);border-radius:var(--r-md,8px);border:1px solid var(--border)"></div>
                </div>
                <div>
                    <label class="field-label">Nouveau responsable</label>
                    <select class="select" id="inpTransferTo">
                        <option value="" disabled selected hidden>Choisir un collègue…</option>
                    </select>
                </div>
                <button class="btn btn-primary" id="btnExecuteTransfer" style="width:100%;padding:13px;justify-content:center;font-size:14px;background:var(--status-blue)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/></svg>
                    Confirmer le transfert
                </button>
            </div>
        </div>
    </div>

    <!-- Modal : réception transfert -->
    <div class="modal-overlay" id="receiveTransferModal" style="display:none">
        <div class="tool-modal-card">
            <div class="tool-modal-header">
                <div class="tool-modal-title" style="color:var(--status-blue)">
                    <svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                    Transfert reçu
                </div>
            </div>
            <div class="tool-modal-body">
                <div style="background:var(--bg-sunken);border:1px solid var(--border);border-radius:var(--r-lg,10px);padding:14px">
                    <div style="font-size:12px;color:var(--text-faint);margin-bottom:6px">
                        <span id="receiveTransferFrom" style="color:var(--brand-yellow);font-weight:700">Quelqu'un</span>
                        souhaite vous transférer :
                    </div>
                    <div id="receiveTransferToolName" style="font-size:16px;font-weight:700;color:#fff"></div>
                </div>
                <div>
                    <label class="field-label">Lieu actuel</label>
                    <div id="receiveTransferOldLocation" style="font-size:13px;color:var(--text-muted);padding:8px 0"></div>
                </div>
                <div>
                    <label class="field-label">Nouveau lieu de l'outil <span style="color:var(--status-red)">*</span></label>
                    <input class="input" type="text" id="inpReceiveNewLocation" placeholder="Ex: Camion, Atelier, Adresse du chantier…">
                </div>
                <div style="display:flex;gap:10px">
                    <button class="btn btn-secondary" id="btnRefuseTransfer" style="flex:1;justify-content:center">Refuser</button>
                    <button class="btn btn-primary"   id="btnAcceptTransfer" style="flex:1;justify-content:center;background:var(--status-green)">Accepter</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal : signaler brisé -->
    <div class="modal-overlay" id="briseModal" style="display:none">
        <div class="tool-modal-card">
            <div class="tool-modal-header">
                <div class="tool-modal-title" style="color:var(--status-orange)">
                    <svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Signaler brisé
                </div>
                <button class="btn-close-tool" id="btnCloseBrise">×</button>
            </div>
            <div class="tool-modal-body">
                <div>
                    <label class="field-label">Outil</label>
                    <div id="briseToolName" style="font-size:15px;font-weight:700;color:#fff;padding:10px 14px;background:var(--bg-sunken);border-radius:var(--r-md,8px);border:1px solid var(--border)"></div>
                </div>
                <div>
                    <label class="field-label">Note de réparation <span style="color:var(--text-faint);font-weight:400">(optionnel)</span></label>
                    <textarea class="textarea" id="inpBriseNote" placeholder="Ex: La lame est cassée, nécessite une inspection…" style="min-height:90px"></textarea>
                </div>
                <button class="btn" id="btnConfirmBrise" style="width:100%;padding:13px;justify-content:center;font-size:14px;background:var(--status-orange);color:#1a1b22;border:none;border-radius:var(--r-lg,10px);font-weight:700;font-family:inherit;cursor:pointer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
                    Signaler comme brisé
                </button>
            </div>
        </div>
    </div>

    <!-- Modal : alerte -->
    <div class="modal-overlay" id="alertModal" style="display:none">
        <div class="modal" style="max-width:360px;text-align:center">
            <div class="modal-title" style="justify-content:center;border-bottom:none;color:var(--brand-yellow);margin-bottom:8px">Information</div>
            <p id="alertMsg" style="color:var(--text-muted);font-size:14px;margin-bottom:0;line-height:1.5"></p>
            <div class="modal-actions" style="justify-content:center;margin-top:20px">
                <button class="btn btn-primary btn-pill" id="btnCloseAlert" style="min-width:100px">Compris</button>
            </div>
        </div>
    </div>

    <!-- Modal : confirmation -->
    <div class="modal-overlay" id="confirmModal" style="display:none">
        <div class="modal" style="max-width:360px;text-align:center">
            <div class="modal-title" style="justify-content:center;border-bottom:none;margin-bottom:8px" id="confirmTitle">Action</div>
            <p id="confirmMsg" style="color:var(--text-muted);font-size:14px;margin-bottom:0;line-height:1.5">Êtes-vous sûr ?</p>
            <div class="modal-actions" style="justify-content:center;margin-top:20px">
                <button class="btn btn-secondary" id="btnCancelConfirm">Annuler</button>
                <button class="btn" id="btnConfirmAction" style="min-width:90px">Confirmer</button>
            </div>
        </div>
    </div>
    `

    await init()
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
    if (!currentUser) return
    myUserName = currentProfil?.prenom_nom || currentUser.email.split('@')[0]

    document.getElementById('tabTous').addEventListener('click', () => switchToolTab('tous'))
    document.getElementById('tabHistorique').addEventListener('click', () => switchToolTab('historique'))
    document.getElementById('btnBorrow').addEventListener('click', openBorrowModal)
    document.getElementById('btnBorrowMobile')?.addEventListener('click', openBorrowModal)
    document.getElementById('ou-menu-btn')?.addEventListener('click', () => document.getElementById('topbar-mobile-menu-btn')?.click())
    document.getElementById('btnCloseBorrow').addEventListener('click', () => closeModal('borrowModal'))
    document.getElementById('btnSaveBorrow').addEventListener('click', saveBorrow)
    document.getElementById('inpOutil').addEventListener('change', toggleOutilAutre)
    document.getElementById('btnCloseTransfer').addEventListener('click', () => closeModal('transferModal'))
    document.getElementById('btnExecuteTransfer').addEventListener('click', executeTransfer)
    document.getElementById('btnRefuseTransfer').addEventListener('click', refuseTransfer)
    document.getElementById('btnAcceptTransfer').addEventListener('click', acceptTransfer)
    document.getElementById('btnCloseBrise').addEventListener('click', () => closeModal('briseModal'))
    document.getElementById('btnConfirmBrise').addEventListener('click', confirmSignalerBrise)
    document.getElementById('btnCloseAlert').addEventListener('click', () => closeModal('alertModal'))
    document.getElementById('btnCancelConfirm').addEventListener('click', closeConfirmModal)
    document.getElementById('btnConfirmAction').addEventListener('click', async () => {
        if (!itemToProcess) return
        if (actionType === 'return')  await confirmReturn()
        else if (actionType === 'delete') await confirmDelete()
        else if (actionType === 'repare') await confirmMarquerRepare()
    })
    document.getElementById('toolSearch').addEventListener('keyup', filterTools)
    document.getElementById('employeeFilter')?.addEventListener('change', filterTools)
    document.getElementById('btnCloseToolDrawer').addEventListener('click', closeDrawer)
    document.getElementById('toolDrawer').addEventListener('click', e => {
        if (e.target === document.getElementById('toolDrawer')) closeDrawer()
    })

    // Fermer modales sur fond
    ;['borrowModal','transferModal','briseModal','alertModal','confirmModal'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', e => {
            if (e.target === document.getElementById(id)) closeModal(id)
        })
    })

    await fetchTeamMembers()
    await loadTools()
    await checkPendingTransfers()
}

// ── Chargement ────────────────────────────────────────────────────────────────
async function fetchTeamMembers() {
    const { data, error } = await supabase.from('profils').select('prenom_nom, role').order('role')
    if (error) { console.warn('[outils] fetchTeamMembers:', error.message); return }
    if (data) {
        teamMembers = data
        const sel = document.getElementById('employeeFilter')
        if (sel) {
            sel.innerHTML = '<option value="">Tous les employés</option>' +
                data.filter(m => m.prenom_nom).map(m => `<option value="${sanitize(m.prenom_nom)}">${sanitize(m.prenom_nom)}</option>`).join('')
        }
    }
}

async function loadTools(reset = true) {
    if (reset) { toolsPage = 0; toolsLog = [] }
    const from = toolsPage * TOOLS_PAGE_SIZE, to = from + TOOLS_PAGE_SIZE - 1

    const { data, error } = await supabase
        .from('outils')
        .select('id,created_at,nom,assignee_nom,notes,date_transfert,status,pending_transfer_to,pending_transfer_at,historique_transferts')
        .order('created_at', { ascending: false })
        .range(from, to + 1)

    if (error) { console.error('Erreur chargement outils:', error); return }

    if (reset && data?.length) {
        const orphans = data.filter(t => t.status === 'active' && (!t.assignee_nom || !t.assignee_nom.trim()) && !t.date_transfert)
        if (orphans.length > 0) {
            const ids = orphans.map(o => o.id)
            await supabase.from('outils').update({ status: 'available' }).in('id', ids)
            data.forEach(t => { if (ids.includes(t.id)) t.status = 'available' })
        }
    }

    toolsHasMore = (data || []).length > TOOLS_PAGE_SIZE
    const pageData = (data || []).slice(0, TOOLS_PAGE_SIZE)
    toolsLog = reset ? pageData : [...toolsLog, ...pageData]
    renderTools()
}

async function chargerPlusOutils() {
    const btn = document.getElementById('btn-charger-plus-outils')
    if (btn) { btn.disabled = true; btn.textContent = 'Chargement…' }
    toolsPage++
    try { await loadTools(false) }
    catch (e) { console.error('[outils] Erreur page suivante:', e?.message); toolsPage--; if (btn) { btn.disabled = false; btn.textContent = `Charger ${TOOLS_PAGE_SIZE} entrées de plus…` } }
}

// ── Rendu ─────────────────────────────────────────────────────────────────────
const MOIS_FR = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.']
function formatDateLong(isoDate) {
    if (!isoDate) return '—'
    const p = isoDate.split('-')
    return `${parseInt(p[2])} ${MOIS_FR[parseInt(p[1])-1]} ${p[0]}`
}

function _initials(name) { return (name||'').trim().split(/\s+/).map(w=>w[0]||'').slice(0,2).join('').toUpperCase()||'?' }

function renderTools(list = toolsLog) {
    const activeC    = document.getElementById('activeListContainer')
    const reparC     = document.getElementById('reparationListContainer')
    const histC      = document.getElementById('historyListContainer')
    const reparTitle = document.getElementById('reparationSectionTitle')
    if (!activeC || !histC || !reparC) return

    activeC.innerHTML = ''; reparC.innerHTML = ''; histC.innerHTML = ''
    const canManage = hasPermission('manage_tools')
    let cntActive = 0, cntHist = 0, hasReparation = false

    list.forEach(t => {
        if (t.status === 'available') return

        const hasPending = !!t.pending_transfer_to
        const isMyTool   = (t.assignee_nom || '').trim() === (myUserName || '').trim()

        // Status badge
        let badgeHTML = ''
        if (t.status === 'active')         badgeHTML = `<span class="tool-badge out">● Sorti</span>`
        else if (t.status === 'en_reparation') badgeHTML = `<span class="tool-badge rep">⚠ Réparation</span>`
        else                               badgeHTML = `<span class="tool-badge in">↑ Au shop</span>`
        if (hasPending) badgeHTML += ` <span class="tool-badge pend">↗ ${sanitize(t.pending_transfer_to)}</span>`

        // Simplified row actions
        let rowActHTML = ''
        if (t.status === 'active') {
            if (hasPending) {
                rowActHTML = `<button class="btn-row-return" data-cancel="${t.id}">
                    <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Annuler</button>`
            } else if (isMyTool || currentRole === 'A0') {
                rowActHTML = `<button class="btn-row-return" data-return="${t.id}">
                    <svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>Retourner</button>`
                if (isMyTool) rowActHTML += `<button class="btn-row-icon" data-transfer="${t.id}" title="Transférer">
                    <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>`
            }
        }

        const dateFmt = formatDateLong(t.date_transfert)
        const dateLabel = t.status === 'returned' ? 'Retourné le' : 'Sorti le'

        const mobStatusClass = t.status === 'active' ? 'out' : t.status === 'en_reparation' ? 'rep' : 'in'
        const mobStatusText  = t.status === 'active' ? 'SORTI' : t.status === 'en_reparation' ? 'RÉP.' : 'SHOP'

        const row = document.createElement('div')
        row.className = `tool-row ${t.status === 'returned' ? 'returned' : t.status === 'en_reparation' ? 'en-reparation' : ''} ${canManage ? 'has-delete' : ''}`.trim()
        row.dataset.id = t.id
        const iconClass = t.status === 'returned' ? 'returned' : t.status === 'en_reparation' ? 'rep' : ''
        row.innerHTML = `
            <div class="tool-icon-box ${iconClass}">
                <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <div class="tool-info">
                <div class="tool-name-main">${sanitize(t.nom || '')}</div>
                <div class="tool-meta">
                    <span class="tool-meta-item"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${sanitize(t.assignee_nom || '—')}</span>
                    ${t.notes ? `<span style="color:var(--border-strong)">·</span><span class="tool-meta-item"><svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>${sanitize(t.notes)}</span>` : ''}
                </div>
            </div>
            <span class="tool-mob-status ${mobStatusClass}">${mobStatusText}</span>
            <div class="tool-date-col">${dateLabel} <strong>${dateFmt}</strong></div>
            ${badgeHTML}
            <div class="tool-actions" style="display:flex;gap:6px;flex-shrink:0">${rowActHTML}</div>
            ${canManage ? `<button class="btn-del-tool" data-delete="${t.id}" title="Supprimer"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>` : ''}
        `

        row.addEventListener('click', e => {
            if (e.target.closest('[data-return],[data-transfer],[data-cancel],[data-delete]')) return
            openToolDrawer(t.id)
        })

        let target = histC
        if (t.status === 'active')             { target = activeC; cntActive++ }
        else if (t.status === 'en_reparation') { target = reparC;  hasReparation = true; cntActive++ }
        else cntHist++
        target.appendChild(row)
    })

    activeC.querySelectorAll('[data-return]').forEach(btn   => btn.addEventListener('click', e => { e.stopPropagation(); askReturn(btn.dataset.return) }))
    activeC.querySelectorAll('[data-transfer]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); openTransferModal(btn.dataset.transfer) }))
    activeC.querySelectorAll('[data-cancel]').forEach(btn   => btn.addEventListener('click', e => { e.stopPropagation(); cancelPendingTransfer(btn.dataset.cancel) }))
    document.querySelectorAll('[data-delete]').forEach(btn  => btn.addEventListener('click', e => { e.stopPropagation(); askDelete(btn.dataset.delete) }))

    if (!cntActive)     activeC.innerHTML = '<div class="tool-empty">Aucun outil actuellement en utilisation.</div>'
    if (!cntHist)       histC.innerHTML   = '<div class="tool-empty">Aucun historique de retour.</div>'
    if (reparTitle)     reparTitle.style.display = hasReparation ? '' : 'none'
    if (!hasReparation) reparC.innerHTML  = ''

    // Counts in tabs

    // Stats subtitle (from full toolsLog)
    const totalOut  = toolsLog.filter(t => t.status === 'active').length
    const totalShop = toolsLog.filter(t => t.status === 'returned').length
    const statsEl   = document.getElementById('outilsStats')
    if (statsEl) statsEl.textContent = `${totalOut} outils sortis · ${totalShop} au shop`
    const mobSub = document.getElementById('ouMobileSub')
    if (mobSub) mobSub.textContent = `${totalOut} sorti${totalOut > 1 ? 's' : ''} · ${totalShop} au shop`

    ajouterBoutonPlusOutils()
}

function ajouterBoutonPlusOutils() {
    const histC = document.getElementById('historyListContainer')
    document.getElementById('btn-charger-plus-outils')?.remove()
    if (!toolsHasMore || !histC) return
    const btn = document.createElement('button')
    btn.id = 'btn-charger-plus-outils'; btn.className = 'load-more-btn'
    btn.textContent = `Charger ${TOOLS_PAGE_SIZE} entrées de plus…`
    btn.addEventListener('click', chargerPlusOutils)
    histC.appendChild(btn)
}

// ── Tiroir détail outil ───────────────────────────────────────────────────────
let currentDrawerToolId = null

function openToolDrawer(id) {
    currentDrawerToolId = id
    const t = toolsLog.find(x => x.id === id)
    if (!t) return
    const canManage = hasPermission('manage_tools')
    const isMyTool  = (t.assignee_nom || '').trim() === (myUserName || '').trim()

    // Header
    document.getElementById('tdName').textContent = t.nom || '—'
    const tdBadge = document.getElementById('tdBadge')
    const tdIcon  = document.getElementById('tdIconBox')
    if (t.status === 'active')         { tdBadge.textContent = '● Sorti'; tdBadge.className = 'tool-badge out'; tdIcon.className = 'tool-icon-box active' }
    else if (t.status === 'en_reparation') { tdBadge.textContent = '⚠ Réparation'; tdBadge.className = 'tool-badge rep'; tdIcon.className = 'tool-icon-box rep' }
    else                               { tdBadge.textContent = '↑ Au shop'; tdBadge.className = 'tool-badge in'; tdIcon.className = 'tool-icon-box returned' }

    // State card
    const stateCard = document.getElementById('tdStateCard')
    if (t.status === 'active' || t.status === 'en_reparation') {
        const color = getAvatarColor(t.assignee_nom || '')
        const inits = _initials(t.assignee_nom || '')
        stateCard.innerHTML = `
            <div class="td-avatar" style="background:${color}">${inits}</div>
            <div>
                <div class="td-holder-name">${sanitize(t.assignee_nom || '—')}</div>
                <div class="td-holder-meta">
                    <svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                    ${sanitize(t.notes || '—')} · depuis ${formatDateLong(t.date_transfert)}
                </div>
            </div>`
    } else {
        stateCard.innerHTML = `<div style="color:var(--text-faint);font-style:italic;font-size:13px">Outil disponible au shop.</div>`
    }

    // Actions
    const actDiv = document.getElementById('tdActions')
    actDiv.innerHTML = ''
    if (t.status === 'active' && (isMyTool || currentRole === 'A0')) {
        actDiv.innerHTML = `<div class="td-action-row" style="margin-bottom:12px">
            <button class="btn-td-return" id="tdBtnReturn"><svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>Retourner</button>
            ${isMyTool ? `<button class="btn-td-transfer" id="tdBtnTransfer"><svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Transférer</button>` : ''}
            <button class="btn-td-bris" id="tdBtnBris"><svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>Bris</button>
        </div>`
        document.getElementById('tdBtnReturn')?.addEventListener('click', () => { closeDrawer(); askReturn(id) })
        document.getElementById('tdBtnTransfer')?.addEventListener('click', () => { closeDrawer(); openTransferModal(id) })
        document.getElementById('tdBtnBris')?.addEventListener('click', () => { closeDrawer(); openBriseModal(id) })
    } else if (t.status === 'en_reparation' && (isMyTool || currentRole === 'A0')) {
        actDiv.innerHTML = `<div class="td-action-row" style="margin-bottom:12px">
            <button class="btn-td-return" id="tdBtnRepare"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>Marquer réparé</button>
        </div>`
        document.getElementById('tdBtnRepare')?.addEventListener('click', () => { closeDrawer(); askMarquerRepare(id) })
    }

    // History
    const hist = Array.isArray(t.historique_transferts) ? [...t.historique_transferts].reverse() : []
    const histTitle = document.getElementById('tdHistoryTitle')
    histTitle.textContent = hist.length > 0 ? `Historique · ${hist.length} mouvement${hist.length > 1 ? 's' : ''}` : 'Historique'

    const histList = document.getElementById('tdHistoryList')
    histList.innerHTML = ''
    if (!hist.length) {
        histList.innerHTML = '<div style="color:var(--text-faint);font-style:italic;font-size:13px">Aucun historique.</div>'
    } else {
        hist.forEach((entry, i) => {
            const action = entry.action || ''
            let cls = 'hist-sortie', typeLabel = 'SORTIE', whoHTML = '', noteHTML = ''
            if (action.includes('retourné')) {
                cls = 'hist-retour'; typeLabel = 'RETOUR'
                whoHTML = `${sanitize(entry.par || '—')} <span class="hist-arrow">→ Shop</span>`
            } else if (action.includes('transféré')) {
                cls = 'hist-transfer'; typeLabel = 'TRANSFERT'
                whoHTML = `${sanitize(entry.de||'—')} → ${sanitize(entry.vers||'—')} <span class="hist-arrow">→ ${sanitize(entry.lieu||'')}</span>`
            } else if (action.includes('brisé')) {
                cls = 'hist-brise'; typeLabel = 'BRISÉ'
                whoHTML = sanitize(entry.par || '—')
                if (entry.note) noteHTML = `<div class="hist-note">${sanitize(entry.note)}</div>`
            } else if (action.includes('réparé')) {
                cls = 'hist-repare'; typeLabel = 'RÉPARÉ'
                whoHTML = sanitize(entry.par || '—')
            } else {
                whoHTML = `${sanitize(entry.par||'—')} <span class="hist-arrow">→ ${sanitize(entry.lieu||'')}</span>`
            }
            histList.insertAdjacentHTML('beforeend', `
                <div class="hist-entry ${cls}">
                    <div class="hist-icon">
                        <div class="hist-dot"></div>
                        ${i < hist.length - 1 ? '<div class="hist-line"></div>' : ''}
                    </div>
                    <div style="flex:1;min-width:0">
                        <div><span class="hist-type">${typeLabel}</span> <span class="hist-who">${whoHTML}</span></div>
                        <div class="hist-date">${formatDateLong(entry.date)}</div>
                        ${noteHTML}
                    </div>
                </div>`)
        })
    }

    document.getElementById('toolDrawer').style.display = 'flex'
}

function closeDrawer() {
    document.getElementById('toolDrawer').style.display = 'none'
    currentDrawerToolId = null
}

function filterTools() {
    const term = (document.getElementById('toolSearch')?.value || '').toLowerCase()
    const emp  = document.getElementById('employeeFilter')?.value || ''
    const filtered = toolsLog.filter(t => {
        const matchTerm = !term ||
            (t.assignee_nom || '').toLowerCase().includes(term) ||
            (t.nom || '').toLowerCase().includes(term) ||
            (t.notes || '').toLowerCase().includes(term)
        const matchEmp = !emp || (t.assignee_nom || '') === emp
        return matchTerm && matchEmp
    })
    renderTools(filtered)
}

function switchToolTab(tab) {
    const isTous = tab === 'tous'
    const panelTous = document.getElementById('panelTous')
    const panelHist = document.getElementById('panelHistorique')
    if (panelTous) panelTous.style.display = isTous ? 'flex' : 'none'
    if (panelHist) panelHist.style.display = isTous ? 'none' : 'flex'
    document.getElementById('tabTous')?.classList.toggle('active', isTous)
    document.getElementById('tabHistorique')?.classList.toggle('active', !isTous)
}

// ── Dropdown outils ───────────────────────────────────────────────────────────
async function updateToolDropdown() {
    const select = document.getElementById('inpOutil')
    if (!select) return
    let toolNames = []
    try {
        const { data } = await supabase.from('outils').select('nom, position').order('position', { ascending: true, nullsFirst: false }).order('nom', { ascending: true })
        const seen = new Set()
        ;(data || []).forEach(t => { if (!t.nom) return; const k = t.nom.toLowerCase().trim(); if (seen.has(k)) return; seen.add(k); toolNames.push(t.nom) })
    } catch { /* fallback */ }
    const activeTools = toolsLog.filter(t => t.status === 'active').map(t => t.nom)
    let html = '<option value="" disabled selected hidden>Sélectionner une machine…</option>'
    toolNames.forEach(name => {
        const isActive = activeTools.includes(name)
        const safe = name.replace(/"/g, '&quot;')
        html += `<option value="${safe}"${isActive ? ' disabled' : ''}>${safe}${isActive ? ' — Indisponible' : ''}</option>`
    })
    html += '<option value="Autre...">Autre (Préciser en note)</option>'
    select.innerHTML = html
}

function toggleOutilAutre() {
    const sel = document.getElementById('inpOutil'), grp = document.getElementById('grpOutilAutre'), inp = document.getElementById('inpOutilAutre')
    if (sel.value === 'Autre...') { grp.style.display = ''; inp?.focus() }
    else { grp.style.display = 'none'; if (inp) inp.value = '' }
}

// ── Emprunt ───────────────────────────────────────────────────────────────────
async function openBorrowModal() {
    await updateToolDropdown()
    document.getElementById('inpPlombier').value = myUserName
    document.getElementById('inpOutil').value    = ''
    document.getElementById('inpAdresse').value  = ''
    document.getElementById('inpDate').value     = new Date().toISOString().split('T')[0]
    const inpA = document.getElementById('inpOutilAutre'), grpA = document.getElementById('grpOutilAutre')
    if (inpA) inpA.value = ''; if (grpA) grpA.style.display = 'none'
    document.getElementById('borrowModal').style.display = 'flex'
}

async function saveBorrow() {
    const plumber = document.getElementById('inpPlombier').value.trim()
    const toolSel = document.getElementById('inpOutil').value
    const address = document.getElementById('inpAdresse').value.trim()
    const dateOut = document.getElementById('inpDate').value
    if (!plumber || !toolSel || !address || !dateOut) { showAlert('Merci de remplir tous les champs.'); return }
    let tool = toolSel
    if (toolSel === 'Autre...') { const c = document.getElementById('inpOutilAutre').value.trim(); if (!c) { showAlert("Veuillez préciser le nom de l'outil."); return }; tool = c }
    const activeTools = toolsLog.filter(t => t.status === 'active').map(t => t.nom)
    if (toolSel !== 'Autre...' && activeTools.includes(tool)) { showAlert("Cet outil est déjà emprunté et n'a pas encore été retourné."); return }
    const { error } = await supabase.from('outils').insert([{ nom: tool, assignee_nom: plumber, notes: address, date_transfert: dateOut, status: 'active', historique_transferts: [{ action: 'emprunté', par: plumber, lieu: address, date: dateOut }] }])
    if (error) { showAlert(friendlyError(error)); return }
    await loadTools(); closeModal('borrowModal')
}

// ── Retour ────────────────────────────────────────────────────────────────────
function askReturn(id) {
    itemToProcess = id; actionType = 'return'
    const titleEl = document.getElementById('confirmTitle'), btn = document.getElementById('btnConfirmAction')
    titleEl.textContent = "Retour d'outil"; titleEl.style.color = 'var(--status-green)'
    document.getElementById('confirmMsg').textContent = 'Confirmer que cet outil a été ramené ?'
    btn.textContent = 'Oui, retourné'; btn.style.background = 'var(--status-green)'; btn.style.color = '#fff'
    document.getElementById('confirmModal').style.display = 'flex'
}

async function confirmReturn() {
    const today = new Date().toISOString().split('T')[0]
    const tool = toolsLog.find(t => t.id === itemToProcess)
    const hist = Array.isArray(tool?.historique_transferts) ? tool.historique_transferts : []
    hist.push({ action: 'retourné', par: tool?.assignee_nom || '', date: today })
    const { error } = await supabase.from('outils').update({ status: 'returned', notes: (tool?.notes || '') + ' | Retourné: ' + today, historique_transferts: hist }).eq('id', itemToProcess)
    if (error) { showAlert(friendlyError(error)); return }
    await loadTools(); closeConfirmModal()
}

// ── Suppression ───────────────────────────────────────────────────────────────
function askDelete(id) {
    itemToProcess = id; actionType = 'delete'
    const titleEl = document.getElementById('confirmTitle'), btn = document.getElementById('btnConfirmAction')
    titleEl.textContent = 'Supprimer'; titleEl.style.color = 'var(--status-red)'
    document.getElementById('confirmMsg').textContent = 'Effacer définitivement cet enregistrement ?'
    btn.textContent = 'Supprimer'; btn.style.background = 'var(--status-red)'; btn.style.color = '#fff'
    document.getElementById('confirmModal').style.display = 'flex'
}

async function confirmDelete() {
    const { error } = await supabase.from('outils').delete().eq('id', itemToProcess)
    if (error) { showAlert(friendlyError(error)); return }
    await loadTools(); closeConfirmModal()
}

// ── Transfert ─────────────────────────────────────────────────────────────────
function openTransferModal(toolId) {
    itemToProcess = toolId
    const t = toolsLog.find(x => x.id === toolId)
    if (!t) return
    if (t.pending_transfer_to) { showAlert(`Un transfert vers ${t.pending_transfer_to} est déjà en attente.`); return }
    document.getElementById('transferToolName').textContent = t.nom
    const sel = document.getElementById('inpTransferTo')
    sel.innerHTML = '<option value="" disabled selected hidden>Choisir un collègue…</option>' +
        teamMembers.filter(emp => emp.prenom_nom && emp.prenom_nom !== t.assignee_nom)
            .map(emp => `<option value="${sanitize(emp.prenom_nom)}">${sanitize(emp.prenom_nom)}</option>`).join('')
    document.getElementById('transferModal').style.display = 'flex'
}

async function executeTransfer() {
    const newPlumber = document.getElementById('inpTransferTo').value
    if (!newPlumber) { showAlert('Veuillez sélectionner un employé.'); return }
    const { error } = await supabase.from('outils').update({ pending_transfer_to: newPlumber, pending_transfer_at: new Date().toISOString() }).eq('id', itemToProcess)
    if (error) { showAlert(friendlyError(error)); return }
    await loadTools(); closeModal('transferModal')
    showAlert(`Demande de transfert envoyée à ${newPlumber}. L'outil restera à votre nom tant qu'il n'aura pas confirmé.`)
}

async function cancelPendingTransfer(toolId) {
    const t = toolsLog.find(x => x.id === toolId)
    if (!t?.pending_transfer_to) return
    const { error } = await supabase.from('outils').update({ pending_transfer_to: null, pending_transfer_at: null }).eq('id', toolId)
    if (error) { showAlert(friendlyError(error)); return }
    await loadTools(); showAlert(`Demande de transfert à ${t.pending_transfer_to} annulée.`)
}

// ── Réception transfert ───────────────────────────────────────────────────────
async function checkPendingTransfers() {
    const { data, error } = await supabase.from('outils').select('id, nom, assignee_nom, notes, pending_transfer_to, pending_transfer_at, historique_transferts').eq('pending_transfer_to', myUserName).eq('status', 'active')
    if (error || !data?.length) return
    pendingTransfersQueue = data; showNextPendingTransfer()
}

function showNextPendingTransfer() {
    if (pendingTransfersQueue.length === 0) { currentPendingTransfer = null; return }
    currentPendingTransfer = pendingTransfersQueue.shift()
    document.getElementById('receiveTransferFrom').textContent = currentPendingTransfer.assignee_nom || 'Quelqu\'un'
    document.getElementById('receiveTransferToolName').textContent = currentPendingTransfer.nom || '-'
    document.getElementById('receiveTransferOldLocation').textContent = currentPendingTransfer.notes || '-'
    document.getElementById('inpReceiveNewLocation').value = ''
    document.getElementById('receiveTransferModal').style.display = 'flex'
}

async function acceptTransfer() {
    if (!currentPendingTransfer) return
    const newLocation = document.getElementById('inpReceiveNewLocation').value.trim()
    if (!newLocation) { showAlert("Veuillez indiquer le nouveau lieu de l'outil avant d'accepter."); return }
    const today = new Date().toISOString().split('T')[0], fromName = currentPendingTransfer.assignee_nom
    const hist = Array.isArray(currentPendingTransfer.historique_transferts) ? currentPendingTransfer.historique_transferts : []
    hist.push({ action: 'transféré', de: fromName, vers: myUserName, lieu: newLocation, date: today })
    const { error } = await supabase.from('outils').update({ assignee_nom: myUserName, notes: newLocation, pending_transfer_to: null, pending_transfer_at: null, historique_transferts: hist }).eq('id', currentPendingTransfer.id)
    if (error) { showAlert(friendlyError(error)); return }
    const toolName = currentPendingTransfer.nom; closeModal('receiveTransferModal')
    await loadTools(); showAlert(`Transfert accepté. L'outil "${toolName}" vous a été transmis par ${fromName}.`)
    setTimeout(showNextPendingTransfer, 500)
}

async function refuseTransfer() {
    if (!currentPendingTransfer) return
    const { error } = await supabase.from('outils').update({ pending_transfer_to: null, pending_transfer_at: null }).eq('id', currentPendingTransfer.id)
    if (error) { showAlert(friendlyError(error)); return }
    const fromName = currentPendingTransfer.assignee_nom, toolName = currentPendingTransfer.nom
    closeModal('receiveTransferModal'); await loadTools()
    showAlert(`Transfert refusé. L'outil "${toolName}" reste assigné à ${fromName}.`)
    setTimeout(showNextPendingTransfer, 500)
}

// ── Signaler brisé ────────────────────────────────────────────────────────────
function openBriseModal(toolId) {
    itemToProcess = toolId
    const t = toolsLog.find(x => x.id === toolId); if (!t) return
    document.getElementById('briseToolName').textContent = t.nom || ''
    document.getElementById('inpBriseNote').value = ''
    document.getElementById('briseModal').style.display = 'flex'
}

async function confirmSignalerBrise() {
    if (!itemToProcess) return
    const note = document.getElementById('inpBriseNote').value.trim(), today = new Date().toISOString().split('T')[0]
    const tool = toolsLog.find(t => t.id === itemToProcess)
    const hist = Array.isArray(tool?.historique_transferts) ? tool.historique_transferts : []
    hist.push({ action: 'signalé brisé', par: myUserName, note: note || '', date: today })
    const { error } = await supabase.from('outils').update({ status: 'en_reparation', historique_transferts: hist }).eq('id', itemToProcess)
    if (error) { showAlert(friendlyError(error)); return }
    closeModal('briseModal'); itemToProcess = null; await loadTools()
}

// ── Marquer réparé ────────────────────────────────────────────────────────────
function askMarquerRepare(toolId) {
    itemToProcess = toolId; actionType = 'repare'
    const t = toolsLog.find(x => x.id === toolId)
    const titleEl = document.getElementById('confirmTitle'), btn = document.getElementById('btnConfirmAction')
    titleEl.textContent = 'Outil réparé'; titleEl.style.color = 'var(--status-green)'
    document.getElementById('confirmMsg').textContent = `Marquer "${t?.nom || 'cet outil'}" comme réparé et disponible ?`
    btn.textContent = 'Oui, réparé'; btn.style.background = 'var(--status-green)'; btn.style.color = '#fff'
    document.getElementById('confirmModal').style.display = 'flex'
}

async function confirmMarquerRepare() {
    const today = new Date().toISOString().split('T')[0]
    const tool = toolsLog.find(t => t.id === itemToProcess)
    const hist = Array.isArray(tool?.historique_transferts) ? tool.historique_transferts : []
    hist.push({ action: 'réparé', par: myUserName, date: today })
    const { error } = await supabase.from('outils').update({ status: 'available', historique_transferts: hist }).eq('id', itemToProcess)
    if (error) { showAlert(friendlyError(error)); return }
    await loadTools(); closeConfirmModal()
}

// ── Utilitaires ───────────────────────────────────────────────────────────────
function showAlert(msg) { document.getElementById('alertMsg').textContent = msg; document.getElementById('alertModal').style.display = 'flex' }
function closeModal(id) { const el = document.getElementById(id); if (el) el.style.display = 'none' }
function closeConfirmModal() { closeModal('confirmModal'); itemToProcess = null; actionType = null }
