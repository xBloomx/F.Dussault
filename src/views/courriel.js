// src/views/courriel.js

import { supabase } from '../supabase.js'
import { currentUser } from '../auth.js'
import { sanitize } from '../shared/sanitize.js'
import { avatarColor as getAvatarColor } from '../shared/avatarColor.js'

// ── État local ───────────────────────────────────────────────────────────────
let myUserEmail = ''
let emailsData = []
let currentFolder = 'inbox'
let currentEmailId = null
let confirmCallback = null
let refreshInterval = null

// ── Render principal ──────────────────────────────────────────────────────────
export async function render(container) {
    container.innerHTML = `
    <style>
        .courriel-main {
            display: flex; flex-direction: column; height: 100%;
            padding: 20px 24px; gap: 14px; overflow: hidden;
        }

        /* ── Layout email 3 colonnes ── */
        .email-layout {
            display: flex; flex: 1; overflow: hidden;
            background: var(--bg-panel); border-radius: var(--r-xl,14px);
            border: 1px solid var(--border); min-height: 0; position: relative;
        }

        /* ── Sidebar dossiers ── */
        .email-folders {
            width: 220px; background: var(--bg-sunken,#15161c);
            border-right: 1px solid var(--border);
            display: flex; flex-direction: column;
            padding: 16px 8px; flex-shrink: 0; gap: 2px; overflow-y: auto;
        }
        .label-section-title { font-size: 10px; font-weight: 700; color: var(--text-faint); text-transform: uppercase; letter-spacing: 1px; padding: 10px 12px 4px; }
        .label-item { padding: 8px 12px; display: flex; align-items: center; gap: 10px; color: var(--text-muted); cursor: pointer; border-radius: var(--r-lg,10px); font-size: 13px; font-weight: 500; transition: all var(--t-base); }
        .label-item:hover { background: var(--bg-panel-2); color: #fff; }
        .label-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
        .folder-item {
            padding: 9px 12px; display: flex; align-items: center;
            justify-content: space-between; color: var(--text-muted);
            cursor: pointer; border-radius: var(--r-lg,10px);
            font-weight: 600; font-size: 13px;
            transition: all var(--t-base,180ms); border: 1px solid transparent;
        }
        .folder-item:hover { background: var(--bg-panel-2); }
        .folder-item.active { background: var(--brand-yellow-dim); color: var(--brand-yellow); }
        .folder-item-left { display: flex; align-items: center; gap: 10px; }
        .folder-item svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }
        .badge-unread {
            background: var(--status-red); color: #fff;
            font-size: 10px; font-weight: 700; padding: 2px 7px;
            border-radius: 999px; line-height: 1.4;
        }

        /* ── Liste courriels ── */
        .email-list-col {
            width: 340px; border-right: 1px solid var(--border);
            display: flex; flex-direction: column; flex-shrink: 0; overflow: hidden;
        }
        .email-toolbar {
            padding: 12px; border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .email-search-wrap { position: relative; display: flex; align-items: center; }
        .email-search-wrap svg { position: absolute; left: 12px; color: var(--text-faint); pointer-events: none; width: 15px; height: 15px; }
        .email-search-input { padding-left: 36px; background: var(--bg-sunken,#15161c); }
        .email-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
        .email-item {
            padding: 13px 16px; border-bottom: 1px solid var(--border-faint,#25262e);
            cursor: pointer; transition: background var(--t-fast,120ms); position: relative;
            border-left: 3px solid transparent;
        }
        .email-item:hover { background: var(--bg-panel-2); }
        .email-item.active { background: var(--bg-panel-2); border-left-color: var(--brand-yellow); }
        .email-item.unread .email-subject { font-weight: 700; color: #fff; }
        .email-item.unread .email-sender  { font-weight: 700; color: #fff; }
        .email-item.unread::after {
            content: ''; position: absolute; top: 16px; right: 14px;
            width: 7px; height: 7px; background: var(--status-blue); border-radius: 50%;
        }
        .email-sender      { font-size: 13px; color: var(--text-muted); margin-bottom: 3px; padding-right: 22px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .email-subject     { font-size: 12px; color: var(--text-muted); margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .email-preview-text{ font-size: 11px; color: var(--text-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .email-date        { font-size: 10px; color: var(--text-faint); position: absolute; top: 13px; right: 14px; }

        /* ── Volet lecture ── */
        .email-view-col { flex: 1; display: flex; flex-direction: column; background: var(--bg-dark); overflow: hidden; }
        .empty-view {
            flex: 1; display: flex; flex-direction: column;
            align-items: center; justify-content: center; color: var(--text-faint);
            gap: 10px; font-size: 13px;
        }
        .empty-view svg { width: 48px; height: 48px; opacity: 0.4; stroke: currentColor; fill: none; stroke-width: 1.5; }
        .reading-pane { display: none; flex-direction: column; height: 100%; overflow: hidden; }
        .reading-toolbar {
            padding: 12px 16px; border-bottom: 1px solid var(--border);
            display: flex; justify-content: space-between; align-items: center; gap: 10px;
            background: var(--bg-panel); flex-shrink: 0;
        }
        .reading-toolbar-left { display: flex; gap: 6px; }
        .reading-actions { display: flex; gap: 8px; margin-left: auto; }
        .btn-tool {
            background: transparent; border: 1px solid var(--border);
            color: var(--text-muted); width: 34px; height: 34px;
            border-radius: var(--r-md,8px); cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all var(--t-base,180ms);
        }
        .btn-tool:hover { background: var(--bg-panel-2); color: #fff; border-color: var(--border-strong,#3d3e48); }
        .btn-tool svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .btn-tool-danger { color: var(--status-red); border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.08); }
        .btn-tool-danger:hover { background: var(--status-red); color: #fff; border-color: transparent; }
        .btn-tool-text {
            background: transparent; border: 1px solid var(--border); color: var(--text-muted);
            padding: 7px 14px; border-radius: var(--r-md,8px); cursor: pointer;
            display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600;
            transition: all var(--t-base); font-family: inherit;
        }
        .btn-tool-text:hover { background: var(--bg-panel-2); color: #fff; border-color: var(--border-strong,#3d3e48); }
        .btn-tool-text svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .reading-header { padding: 20px 24px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .reading-subject { font-size: 18px; font-weight: 700; color: #fff; margin: 0 0 14px; letter-spacing: -0.2px; }
        .reading-meta { display: flex; justify-content: space-between; align-items: center; }
        .reading-sender-info { display: flex; align-items: center; gap: 10px; }
        .sender-avatar {
            width: 38px; height: 38px; background: var(--bg-panel-3);
            border-radius: 50%; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-weight: 700; color: #fff; font-size: 13px;
        }
        .sender-name       { color: #fff; font-weight: 600; font-size: 13px; }
        .sender-email-addr { color: var(--text-faint); font-size: 11px; margin-top: 1px; }
        .reading-date      { color: var(--text-faint); font-size: 12px; }
        .reading-body {
            padding: 24px; flex: 1; overflow-y: auto;
            color: var(--text-muted); line-height: 1.65; font-size: 14px; white-space: pre-wrap;
        }
        .reading-body a { color: var(--status-blue); }

        /* ── Bouton retour mobile ── */
        .btn-mobile-back {
            display: flex; background: transparent; border: none;
            color: var(--brand-yellow); cursor: pointer;
            align-items: center; gap: 5px; font-weight: 600;
            font-size: 13px; padding: 0; margin-right: 12px; font-family: inherit;
        }
        .btn-mobile-back svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2.5; }

        /* ── Compose modal ── */
        .compose-card {
            background: var(--bg-panel); width: 90%; max-width: 580px;
            border-radius: var(--r-xl,14px); border: 1px solid var(--border);
            display: flex; flex-direction: column; overflow: hidden;
            box-shadow: var(--shadow-lg,0 12px 32px rgba(0,0,0,0.45));
        }
        .compose-header {
            background: var(--bg-panel-2); padding: 14px 18px;
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid var(--border);
        }
        .compose-header h3 { margin: 0; color: #fff; font-size: 15px; font-weight: 700; }
        .btn-close-compose {
            background: none; border: none; color: var(--text-faint);
            font-size: 22px; cursor: pointer; line-height: 1; padding: 0;
            transition: color var(--t-fast,120ms);
        }
        .btn-close-compose:hover { color: #fff; }
        .compose-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 0; }
        .compose-field {
            display: flex; border-bottom: 1px solid var(--border);
            padding: 10px 0; align-items: center; gap: 10px;
        }
        .compose-field label { width: 56px; color: var(--text-faint); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; }
        .compose-field input { flex: 1; background: transparent; border: none; color: #fff; outline: none; font-size: 14px; font-family: inherit; }
        .compose-textarea {
            flex: 1; background: transparent; border: none; color: var(--text-muted);
            outline: none; font-size: 14px; min-height: 180px; resize: none;
            font-family: inherit; line-height: 1.55; margin-top: 12px;
        }
        .compose-footer {
            padding: 12px 18px; border-top: 1px solid var(--border);
            display: flex; justify-content: flex-end; align-items: center;
            background: var(--bg-panel-2);
        }

        /* ── Mobile header ── */
        .cour-mobile-header { display: none; align-items: center; gap: 10px; padding: 16px 16px 8px; flex-shrink: 0; }
        .cour-mobile-title  { flex: 1; font-size: 26px; font-weight: 800; color: #fff; margin: 0; }
        .cour-menu-btn      { background: none; border: none; color: var(--text-muted); padding: 4px; cursor: pointer; display: flex; align-items: center; }
        .cour-menu-btn svg  { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 2.2; stroke-linecap: round; }
        .cour-compose-btn   { background: var(--brand-yellow); border: none; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .cour-compose-btn svg { width: 16px; height: 16px; stroke: #1a1b22; fill: none; stroke-width: 2.5; }
        .cour-mobile-sub    { display: none; font-size: 12px; color: var(--text-faint); padding: 0 16px 10px; flex-shrink: 0; }
        .cour-mob-search    { display: none; padding: 0 16px 10px; flex-shrink: 0; }
        .email-star-icon    { width: 11px; height: 11px; fill: var(--brand-yellow); vertical-align: -1px; display: inline; margin-right: 3px; }
        .fl-mob   { display: none; }
        .fl-count { opacity: 0.55; margin-left: 5px; font-size: 0.9em; font-weight: 700; }

        /* ── Email item avec avatar ── */
        .email-item-ava { display: none; width: 36px; height: 36px; border-radius: 50%; color: #fff; font-weight: 700; font-size: 14px; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
        .email-item-info { flex: 1; min-width: 0; }
        .email-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }

        /* ── Folder count badge ── */
        .folder-tab-count { background: rgba(26,27,34,0.14); font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 10px; margin-left: 4px; }
        .folder-item.active .folder-tab-count { background: rgba(26,27,34,0.25); }

        /* ── Responsive mobile ── */
        @media (max-width: 900px) {
            .courriel-main { padding: 0; gap: 0; }
            .email-layout { flex-direction: column; background: transparent; border: none; border-radius: 0; }
            .email-folders {
                width: 100%; flex-direction: row; padding: 10px 16px 6px;
                border-right: none; border-bottom: none; background: transparent;
                overflow-x: auto; gap: 8px; flex-shrink: 0; scrollbar-width: none;
            }
            .email-folders::-webkit-scrollbar { display: none; }
            .folder-item { white-space: nowrap; flex-shrink: 0; border-radius: 999px; border-color: var(--border); padding: 7px 14px; font-size: 13px; font-weight: 600; justify-content: center; }
            .folder-item svg { display: none; }
            .folder-item-left { gap: 0; }
            .folder-item.active { background: #fff; color: #1a1b22; border-color: #fff; }
            .folder-item[data-folder="inbox"]     { order: 1; }
            .folder-item[data-folder="important"] { order: 2; }
            .folder-item[data-folder="sent"]      { order: 3; }
            .folder-item[data-folder="draft"]     { order: 4; }
            .folder-item[data-folder="trash"]     { display: none; }
            .fl-full { display: none; }
            .fl-mob  { display: inline; }
            .email-list-col { width: 100%; border-right: none; flex: 1; }
            .email-view-col { display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; }
            .show-reading .email-list-col { display: none; }
            .show-reading .email-folders  { display: none; }
            .show-reading .email-view-col { display: flex; }
        }
        @media (max-width: 768px) {
            .modal-overlay { align-items: flex-end; }
            .compose-card { width: 100%; border-radius: var(--r-2xl,18px) var(--r-2xl,18px) 0 0; }
            .view-header { display: none; }
            .cour-mobile-header { display: flex; }
            .cour-mobile-sub    { display: block; }
            .cour-mob-search    { display: block; }
            .email-toolbar      { display: none; }
            [data-mob-hide]     { display: none !important; }
            [data-mob-show]     { display: flex !important; }
            .email-item { display: flex; gap: 10px; align-items: flex-start; border-left-width: 3px; }
            .email-item-ava { display: flex; }
            .email-date { position: static; }
            .email-sender { padding-right: 0; }
            .email-item.unread { border-left-color: var(--brand-yellow); }
            .email-item.unread::after { display: none; }
            .courriel-main.show-reading .cour-mob-search { display: none; }
            .courriel-main.show-reading .cour-mobile-header { display: none; }
            .courriel-main.show-reading .cour-mobile-sub { display: none; }
            .email-search-input { border-radius: var(--r-xl,14px); padding: 12px 14px 12px 40px; font-size: 14px; }
            .email-list { gap: 8px; padding: 12px; }
            .email-item { background: var(--bg-panel); border-radius: var(--r-xl,14px); border: 1px solid var(--border); border-left: 3px solid transparent; }
            .email-item.unread { border-left-color: var(--brand-yellow); }
            .email-sender { font-size: 15px; font-weight: 700; color: #fff; }
        }
    </style>

    <div class="courriel-main">

        <!-- Mobile header -->
        <div class="cour-mobile-header">
            <button class="cour-menu-btn" id="cour-menu-btn" aria-label="Menu">
                <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h2 class="cour-mobile-title">Boîte courriel</h2>
            <button class="cour-compose-btn" id="btnComposeMobile" aria-label="Rédiger">
                <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
        </div>
        <div class="cour-mobile-sub" id="courMobileSub"></div>

        <!-- Recherche mobile (au-dessus des onglets) -->
        <div class="cour-mob-search">
            <div class="email-search-wrap" style="width:100%">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input class="input email-search-input" type="text" id="emailSearchMob" placeholder="Rechercher…">
            </div>
        </div>

        <!-- Header -->
        <div class="view-header" style="flex-shrink:0">
            <div>
                <h1>Boîte courriel</h1>
                <p class="sub" id="headerStats">Messagerie interne</p>
            </div>
            <div class="actions">
                <button class="btn btn-secondary btn-pill" id="btnActualiser">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    <span>Actualiser</span>
                </button>
                <button class="btn btn-primary btn-pill" id="btnCompose">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    <span>Rédiger</span>
                </button>
            </div>
        </div>

        <!-- Layout 3 colonnes -->
        <div class="email-layout" id="emailLayout">

            <!-- Sidebar dossiers -->
            <div class="email-folders">
                <div class="folder-item active" data-folder="inbox">
                    <div class="folder-item-left">
                        <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>
                        <span class="fl-full">Boîte de réception</span><span class="fl-mob">Réception</span><span class="fl-count" id="inboxTabCount"></span>
                    </div>
                    <span class="badge-unread" id="unreadCount" style="display:none">0</span>
                </div>
                <div class="folder-item" data-folder="sent">
                    <div class="folder-item-left">
                        <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        Envoyés
                    </div>
                </div>
                <div class="folder-item" data-folder="draft">
                    <div class="folder-item-left">
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Brouillons<span class="badge-unread" id="draftCount" style="display:none;margin-left:auto"></span>
                    </div>
                </div>
                <div class="folder-item" data-folder="important">
                    <div class="folder-item-left">
                        <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        Importants<span class="fl-count" id="importantTabCount"></span><span class="badge-unread" id="importantCount" style="display:none;margin-left:auto"></span>
                    </div>
                </div>
                <div class="folder-item" data-folder="trash">
                    <div class="folder-item-left">
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Corbeille
                    </div>
                </div>
            </div>

            <!-- Liste -->
            <div class="email-list-col">
                <div class="email-toolbar">
                    <div class="email-search-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input class="input email-search-input" type="text" id="emailSearch" placeholder="Rechercher dans les courriels…">
                    </div>
                </div>
                <div class="email-list" id="emailList"></div>
            </div>

            <!-- Volet lecture -->
            <div class="email-view-col">
                <div class="empty-view" id="emptyView">
                    <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>
                    <p>Sélectionnez un message</p>
                </div>
                <div class="reading-pane" id="readingPane">
                    <div class="reading-toolbar">
                        <button class="btn-mobile-back" id="btnMobileBack">
                            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                            Retour
                        </button>
                        <div class="reading-toolbar-left">
                            <button class="btn-tool" id="btnArchive" title="Archiver">
                                <svg viewBox="0 0 24 24"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                            </button>
                            <button class="btn-tool btn-tool-danger" id="btnDelete" title="Supprimer">
                                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                            <button class="btn-tool" id="btnStar" title="Marquer important">
                                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            </button>
                        </div>
                        <div class="reading-actions">
                            <button class="btn-tool-text" id="btnReply">
                                <svg viewBox="0 0 24 24"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                                Répondre
                            </button>
                            <button class="btn-tool-text" id="btnForward">
                                <svg viewBox="0 0 24 24"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>
                                Transférer
                            </button>
                        </div>
                    </div>
                    <div class="reading-header">
                        <h2 class="reading-subject" id="readSubject">Sujet</h2>
                        <div class="reading-meta">
                            <div class="reading-sender-info">
                                <div class="sender-avatar" id="readAvatar">?</div>
                                <div>
                                    <div class="sender-name" id="readSender">Nom</div>
                                    <div class="sender-email-addr" id="readEmailAddress">email</div>
                                </div>
                            </div>
                            <div class="reading-date" id="readDate">Date</div>
                        </div>
                    </div>
                    <div class="reading-body" id="readBody"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal : rédiger un courriel -->
    <div class="modal-overlay" id="composeModal" style="display:none">
        <div class="compose-card">
            <div class="compose-header">
                <h3>Nouveau message</h3>
                <button class="btn-close-compose" id="btnCloseCompose">&times;</button>
            </div>
            <div class="compose-body">
                <div class="compose-field">
                    <label>À</label>
                    <input type="email" id="composeTo" placeholder="adresse@exemple.com">
                </div>
                <div class="compose-field">
                    <label>Sujet</label>
                    <input type="text" id="composeSubject" placeholder="Objet du message">
                </div>
                <textarea class="compose-textarea" id="composeBody" placeholder="Votre message…"></textarea>
            </div>
            <div class="compose-footer">
                <button class="btn btn-primary" id="btnSendEmail">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Envoyer
                </button>
            </div>
        </div>
    </div>

    <!-- Modal : confirmation suppression -->
    <div class="modal-overlay" id="confirmModal" style="display:none">
        <div class="modal" style="max-width:360px;text-align:center">
            <div class="modal-title" style="justify-content:center;border-bottom:none;color:var(--status-red);margin-bottom:8px">Confirmation</div>
            <p id="confirmMsg" style="color:var(--text-muted);font-size:14px;margin-bottom:0;line-height:1.5">Êtes-vous sûr ?</p>
            <div class="modal-actions" style="justify-content:center;margin-top:20px">
                <button class="btn btn-secondary" id="btnCancelConfirm">Annuler</button>
                <button class="btn btn-danger" id="btnYesConfirm">Supprimer</button>
            </div>
        </div>
    </div>
    `

    await init()
    return cleanup
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
    if (!currentUser) return
    myUserEmail = currentUser.email.toLowerCase()

    document.querySelectorAll('.folder-item[data-folder]').forEach(item => {
        item.addEventListener('click', () => switchFolder(item.dataset.folder, item))
    })

    document.getElementById('emailSearch').addEventListener('keyup', () => renderEmailList())
    document.getElementById('emailSearchMob')?.addEventListener('keyup', e => {
        document.getElementById('emailSearch').value = e.target.value
        renderEmailList()
    })

    document.getElementById('btnCompose').addEventListener('click', openComposeModal)
    document.getElementById('btnComposeMobile')?.addEventListener('click', openComposeModal)
    document.getElementById('cour-menu-btn')?.addEventListener('click', () => document.getElementById('topbar-mobile-menu-btn')?.click())
    document.getElementById('btnCloseCompose').addEventListener('click', closeComposeModal)
    document.getElementById('btnSendEmail').addEventListener('click', sendEmail)

    document.getElementById('btnActualiser').addEventListener('click', chargerCourriels)
    document.getElementById('btnMobileBack').addEventListener('click', closeReadingPane)
    document.getElementById('btnReply').addEventListener('click', replyEmail)
    document.getElementById('btnForward').addEventListener('click', forwardEmail)
    document.getElementById('btnDelete').addEventListener('click', deleteCurrentEmail)
    document.getElementById('btnArchive').addEventListener('click', archiveCurrentEmail)
    document.getElementById('btnStar').addEventListener('click', toggleStarCurrentEmail)

    document.getElementById('btnCancelConfirm').addEventListener('click', closeConfirmModal)
    document.getElementById('btnYesConfirm').addEventListener('click', () => {
        if (confirmCallback) confirmCallback()
        closeConfirmModal()
    })

    // Fermer modales sur fond
    ;['composeModal','confirmModal'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', e => {
            if (e.target === document.getElementById(id)) closeModal(id)
        })
    })

    await chargerCourriels()
    refreshInterval = setInterval(chargerCourriels, 30000)
    return cleanup
}

function cleanup() {
    if (refreshInterval) clearInterval(refreshInterval)
    refreshInterval = null
}

// ── Formatage date compact ────────────────────────────────────────────────────
function formatEmailDate(d) {
    const now = new Date()
    const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    if (isToday) return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0')
    const diffDays = Math.floor((now - d) / 86400000)
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.'][d.getDay()]
    const months = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.']
    return `${d.getDate()} ${months[d.getMonth()]}`
}

// ── Chargement ────────────────────────────────────────────────────────────────
async function chargerCourriels() {
    const { data, error } = await supabase
        .from('courriels')
        .select('id,expediteur,destinataire,sujet,contenu,created_at,est_lu')
        .or(`destinataire.eq.${myUserEmail},expediteur.eq.${myUserEmail}`)
        .order('created_at', { ascending: false })

    if (error) { console.error('Erreur chargement courriels:', error); return }

    emailsData = (data || []).map(dbMail => {
        const folder  = dbMail.expediteur?.toLowerCase() === myUserEmail ? 'sent' : 'inbox'
        const dateObj = new Date(dbMail.created_at)
        const fullDate = dateObj.toLocaleDateString('fr-FR') + ' ' + dateObj.getHours() + ':' + String(dateObj.getMinutes()).padStart(2, '0')
        return {
            id: dbMail.id, folder,
            sender: dbMail.expediteur || '',
            emailAddress: dbMail.expediteur || '',
            subject: dbMail.sujet || '(Sans objet)',
            body: dbMail.contenu || '',
            date: formatEmailDate(dateObj), fullDate,
            unread: !dbMail.est_lu && folder === 'inbox',
            important: dbMail.est_important === true,
        }
    })

    renderEmailList()
    updateUnreadCount()
}


// ── Rendu liste ───────────────────────────────────────────────────────────────
function renderEmailList() {
    const container = document.getElementById('emailList')
    if (!container) return
    container.innerHTML = ''

    const query = document.getElementById('emailSearch')?.value.toLowerCase() || ''
    const matchSearch = e => e.subject.toLowerCase().includes(query) || e.sender.toLowerCase().includes(query) || (e.body||'').toLowerCase().includes(query)
    let filtered
    if (currentFolder === 'important') {
        filtered = emailsData.filter(e => e.important && matchSearch(e))
    } else if (currentFolder === 'draft') {
        filtered = []
    } else {
        filtered = emailsData.filter(e => e.folder === currentFolder && matchSearch(e))
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div style="padding:32px;text-align:center;color:var(--text-faint);font-size:13px;font-style:italic">Vide</div>`
        return
    }

    filtered.forEach(email => {
        const div = document.createElement('div')
        div.className = `email-item ${email.id === currentEmailId ? 'active' : ''} ${email.unread ? 'unread' : ''}`
        const senderName = email.fromName || email.sender
        const avaInitials = senderName.split(/[@._-]/).map(w=>w[0]).filter(Boolean).slice(0,2).join('').toUpperCase() || '?'
        const starSVG = email.important ? `<svg class="email-star-icon" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` : ''
        div.innerHTML = `
            <div class="email-item-ava" style="background:${getAvatarColor(senderName)}">${avaInitials}</div>
            <div class="email-item-info">
                <div class="email-item-header">
                    <span class="email-sender">${sanitize(senderName)}</span>
                    <span class="email-date">${sanitize(email.date)}</span>
                </div>
                <div class="email-subject">${starSVG}${sanitize(email.subject)}</div>
                <div class="email-preview-text">${sanitize((email.bodyPlain || email.body).substring(0, 80))}</div>
            </div>
        `
        div.addEventListener('click', () => openEmail(email.id))
        container.appendChild(div)
    })
}

// ── Rendu corps (texte brut + liens cliquables) ────────────────────────────
function renderEmailBody(el, text) {
    el.textContent = ''
    if (!text) return
    const urlRe = /(https?:\/\/[^\s]+)/g
    let last = 0, match
    while ((match = urlRe.exec(text)) !== null) {
        if (match.index > last) el.appendChild(document.createTextNode(text.slice(last, match.index)))
        try {
            const parsed = new URL(match[0])
            if (['https:', 'http:'].includes(parsed.protocol)) {
                const a = document.createElement('a')
                a.href = match[0]; a.textContent = match[0]
                a.target = '_blank'; a.rel = 'noopener noreferrer'
                el.appendChild(a)
            } else { el.appendChild(document.createTextNode(match[0])) }
        } catch { el.appendChild(document.createTextNode(match[0])) }
        last = match.index + match[0].length
    }
    if (last < text.length) el.appendChild(document.createTextNode(text.slice(last)))
}

// ── Ouverture courriel ────────────────────────────────────────────────────────
async function openEmail(id) {
    currentEmailId = id
    const email = emailsData.find(e => e.id === id)
    if (!email) return

    if (email.unread && email.folder === 'inbox') {
        email.unread = false
        updateUnreadCount()
        await supabase.from('courriels').update({ est_lu: true }).eq('id', email.id)
    }

    renderEmailList()

    document.getElementById('readSubject').textContent   = email.subject
    document.getElementById('readSender').textContent    = email.fromName || email.sender
    document.getElementById('readEmailAddress').textContent = email.emailAddress
    document.getElementById('readDate').textContent      = email.fullDate
    const senderForAva = email.fromName || email.sender
    const avaInitialsFull = senderForAva.split(/[\s@._-]+/).map(w => w[0]).filter(Boolean).slice(0,2).join('').toUpperCase() || '?'
    const avatarEl = document.getElementById('readAvatar')
    avatarEl.textContent = avaInitialsFull
    avatarEl.style.background = getAvatarColor(senderForAva)
    avatarEl.style.color = '#fff'
    renderEmailBody(document.getElementById('readBody'), email.bodyPlain || email.body)

    document.getElementById('emptyView').style.display   = 'none'
    document.getElementById('readingPane').style.display = 'flex'
    document.getElementById('emailLayout').classList.add('show-reading')
    document.querySelector('.courriel-main')?.classList.add('show-reading')
}

// ── Dossiers ──────────────────────────────────────────────────────────────────
function switchFolder(folder, el) {
    currentFolder = folder
    document.querySelectorAll('.folder-item').forEach(f => f.classList.remove('active'))
    if (el) el.classList.add('active')
    closeReadingPane()
}

function closeReadingPane() {
    document.getElementById('emptyView').style.display   = 'flex'
    document.getElementById('readingPane').style.display = 'none'
    document.getElementById('emailLayout').classList.remove('show-reading')
    document.querySelector('.courriel-main')?.classList.remove('show-reading')
    currentEmailId = null
    renderEmailList()
}

// ── Envoi ─────────────────────────────────────────────────────────────────────
async function sendEmail() {
    const to      = document.getElementById('composeTo').value.trim().toLowerCase()
    const subject = document.getElementById('composeSubject').value.trim()
    const body    = document.getElementById('composeBody').value.trim()
    if (!to) { alert('Destinataire requis.'); return }

    const btn = document.getElementById('btnSendEmail')
    btn.disabled = true

    emailsData.unshift({
        id: Date.now(), folder: 'sent', sender: 'Moi',
        emailAddress: to, subject, body,
        date: "À l'instant", fullDate: "Aujourd'hui", unread: false
    })
    renderEmailList()
    closeModal('composeModal')

    const { error } = await supabase.from('courriels').insert([{
        expediteur: myUserEmail, destinataire: to,
        sujet: subject, contenu: body, est_lu: false
    }])

    if (error) console.error('Erreur envoi:', error)
    else await chargerCourriels()

    btn.disabled = false
}

// ── Suppression ───────────────────────────────────────────────────────────────
async function deleteCurrentEmail() {
    const email = emailsData.find(e => e.id === currentEmailId)
    if (!email) return
    if (email.folder === 'trash') {
        showConfirm('Supprimer définitivement ce courriel ?', async () => {
            const { error } = await supabase.from('courriels').delete().eq('id', currentEmailId)
            if (error) { console.error('Erreur suppression:', error); return }
            emailsData = emailsData.filter(e => e.id !== currentEmailId)
            closeReadingPane()
        })
    } else {
        email.folder = 'trash'
        closeReadingPane()
    }
}

function replyEmail() {
    const email = emailsData.find(e => e.id === currentEmailId)
    if (email) {
        document.getElementById('composeTo').value      = email.emailAddress
        document.getElementById('composeSubject').value = 'Re: ' + email.subject
        document.getElementById('composeBody').value    = ''
    }
    openComposeModal()
}

function forwardEmail() {
    const email = emailsData.find(e => e.id === currentEmailId)
    if (email) {
        document.getElementById('composeTo').value      = ''
        document.getElementById('composeSubject').value = 'Tr: ' + email.subject
        document.getElementById('composeBody').value    = `\n\n-------- Message transféré --------\nDe : ${email.sender}\n\n${email.body || ''}`
    }
    openComposeModal()
}

function archiveCurrentEmail() {
    const email = emailsData.find(e => e.id === currentEmailId)
    if (!email) return
    email.folder = 'trash'
    closeReadingPane()
}

function toggleStarCurrentEmail() {
    const email = emailsData.find(e => e.id === currentEmailId)
    if (!email) return
    email.important = !email.important
    const btn = document.getElementById('btnStar')
    if (btn) btn.querySelector('svg polygon')?.setAttribute('fill', email.important ? 'var(--brand-yellow)' : 'none')
    updateUnreadCount()
}

// ── Modales ───────────────────────────────────────────────────────────────────
function openComposeModal() {
    document.getElementById('composeModal').style.display = 'flex'
    document.getElementById('btnSendEmail').disabled = false
}

function closeComposeModal() {
    closeModal('composeModal')
    document.getElementById('composeTo').value      = ''
    document.getElementById('composeSubject').value = ''
    document.getElementById('composeBody').value    = ''
}

function updateUnreadCount() {
    const count          = emailsData.filter(e => e.folder === 'inbox' && e.unread).length
    const importantCount = emailsData.filter(e => e.important).length

    const badge = document.getElementById('unreadCount')
    if (badge) { badge.style.display = count > 0 ? 'inline-block' : 'none'; badge.textContent = count }

    const importBadge = document.getElementById('importantCount')
    if (importBadge) { importBadge.style.display = importantCount > 0 ? 'inline-block' : 'none'; importBadge.textContent = importantCount }

    const inboxTabCount = document.getElementById('inboxTabCount')
    if (inboxTabCount) inboxTabCount.textContent = count > 0 ? count : ''
    const importantTabCount = document.getElementById('importantTabCount')
    if (importantTabCount) importantTabCount.textContent = importantCount > 0 ? importantCount : ''

    // Sous-titre header desktop
    const statsEl = document.getElementById('headerStats')
    if (statsEl) {
        const parts2 = []
        if (count > 0) parts2.push(`${count} non lu${count > 1 ? 's' : ''}`)
        if (importantCount > 0) parts2.push(`${importantCount} marqué${importantCount > 1 ? 's' : ''} importants`)
        statsEl.textContent = parts2.length > 0 ? parts2.join(' · ') : 'Messagerie interne'
    }

    const sub = document.getElementById('courMobileSub')
    if (sub) {
        const total = emailsData.filter(e => e.folder === 'inbox').length
        const parts = []
        if (count > 0) parts.push(`${count} non lu${count > 1 ? 's' : ''}`)
        if (importantCount > 0) parts.push(`${importantCount} important${importantCount > 1 ? 's' : ''}`)
        sub.textContent = parts.length > 0 ? parts.join(' · ') : `${total} message${total > 1 ? 's' : ''}`
    }
    window.dispatchEvent(new CustomEvent('sidebar_courriel_count', { detail: { count } }))
}

function showConfirm(msg, callback) {
    document.getElementById('confirmMsg').textContent = msg
    confirmCallback = callback
    document.getElementById('confirmModal').style.display = 'flex'
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none'
    confirmCallback = null
}

function closeModal(id) {
    const el = document.getElementById(id)
    if (el) el.style.display = 'none'
}
