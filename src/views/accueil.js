// src/views/accueil.js
import { supabase } from '../supabase.js'
import { currentUser, currentRole, currentProfil, hasPermission } from '../auth.js'
import { showToast } from '../shared/toast.js'
import { sanitize } from '../shared/sanitize.js'
import { friendlyError } from '../shared/errorMsg.js'
import { makeAvatar } from '../shared/avatarColor.js'

// ── Navigation locale ────────────────────────────────────────────────────────
const NAV_ALIAS = {
    factures: 'facture', temps: 'feuilleTemps', feuilles: 'feuilleTemps',
    soumissions: 'soumissions', messagerie: 'messagerie', courriel: 'courriel',
    calendrier: 'calendrier', clients: 'clients', po: 'po',
    outils: 'outils', admin: 'admin', profil: 'profil', accueil: 'accueil'
}
function navigateTo(key) {
    const btn = document.querySelector(`.nav-btn[data-view="${NAV_ALIAS[key] || key}"]`)
    if (btn && !btn.classList.contains('hidden')) btn.click()
}

// ── État local ───────────────────────────────────────────────────────────────
let newsData = []
let confirmCallback = null

// ── SVG inline helpers ───────────────────────────────────────────────────────
const IC = {
    megaphone: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
    zap:       `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    fileText:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    clock:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    cart:      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
    calendar:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    pin:       `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 1 0-6 0v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>`,
    trash:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    alertTriangle: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    alertCircle:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    checkCircle:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    award:         `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
    briefcase:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    info:          `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    send:          `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
    tool:          `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    activity:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
}

// ── Render principal ─────────────────────────────────────────────────────────
export async function render(container) {
    newsData = []
    container.innerHTML = `
    <style>
        /* ── Accueil layout ── */
        .dashboard-grid {
            display: grid;
            grid-template-columns: 1.7fr 1fr;
            gap: 20px;
            align-items: start;
        }

        /* ── Eyebrow section header ── */
        .acc-eyebrow {
            font-size: 11px; font-weight: 700;
            text-transform: uppercase; letter-spacing: 1.2px;
            color: var(--brand-yellow); margin: 0 0 12px;
            display: flex; align-items: center; gap: 8px;
        }
        .acc-eyebrow::after {
            content: ''; flex: 1; height: 1px; background: var(--border-faint, #25262e);
        }

        /* ── News cards ── */
        .news-list { display: flex; flex-direction: column; gap: 12px; }
        .news-card {
            background: var(--bg-panel);
            border: 1px solid var(--border);
            border-left: 3px solid var(--status-blue);
            border-radius: var(--r-xl, 14px);
            padding: 18px 20px;
            position: relative;
            transition: background var(--t-base), transform var(--t-fast);
        }
        .news-card:hover { background: var(--bg-panel-2); transform: translateX(2px); }
        .news-card.important { border-left-color: var(--status-red); }
        .news-card.info      { border-left-color: var(--brand-yellow); }
        .news-card.pinned              { background: linear-gradient(145deg, var(--bg-panel) 0%, var(--bg-panel-2) 100%); }
        .news-card.important.pinned    { border-color: var(--status-red); }
        .news-card.normal.pinned       { border-color: var(--status-blue); }
        .news-card.info.pinned         { border-color: var(--brand-yellow); }

        .news-card-header { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; padding-right: 0; }
        .news-card-title  { font-size: 16px; font-weight: 700; color: #fff; margin: 0; line-height: 1.35; }
        .news-card-meta   { font-size: 11px; color: var(--text-faint); display: flex; align-items: center; gap: 6px; }
        .news-card-body   { font-size: 13px; color: var(--text-muted); line-height: 1.6; white-space: pre-wrap; }
        .news-card-author { font-size: 12px; color: var(--text-faint); margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border); font-style: italic; }
        .news-card-actions { position: absolute; top: 16px; right: 16px; display: flex; gap: 6px; }
        .news-icon-btn {
            width: 32px; height: 32px; border-radius: var(--r-md, 8px);
            background: var(--bg-sunken, #15161c); border: 1px solid var(--border);
            color: var(--text-muted); display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all var(--t-base);
        }
        .news-icon-btn:hover { color: #fff; border-color: var(--border-strong); background: var(--bg-panel-2); }
        .news-icon-btn.pin-active { color: var(--brand-yellow); border-color: var(--brand-yellow); background: var(--brand-yellow-dim, rgba(252,202,70,0.12)); }
        .news-icon-btn.danger:hover { color: var(--status-red); border-color: var(--status-red); background: var(--tint-red); }
        .news-empty {
            background: var(--bg-panel); border: 1px dashed var(--border);
            border-radius: var(--r-xl, 14px); color: var(--text-faint);
            text-align: center; padding: 40px; font-size: 13px; font-style: italic;
        }

        /* ── Quick actions ── */
        .quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .quick-card {
            background: var(--bg-panel); border: 1px solid var(--border);
            border-radius: var(--r-xl, 14px); padding: 20px 16px;
            display: flex; flex-direction: column; align-items: flex-start; gap: 14px;
            cursor: pointer; text-align: left; font-family: inherit;
            transition: all var(--t-base);
        }
        .quick-card:hover {
            background: var(--bg-panel-2);
            border-color: rgba(252,202,70,0.4);
            transform: translateY(-2px);
        }
        .quick-icon {
            width: 40px; height: 40px; border-radius: 10px;
            background: var(--bg-sunken, #15161c); border: 1px solid var(--border);
            display: flex; align-items: center; justify-content: center;
            color: var(--text-main);
            transition: all var(--t-base);
        }
        .quick-card:hover .quick-icon {
            background: var(--brand-yellow-dim, rgba(252,202,70,0.12));
            border-color: rgba(252,202,70,0.3);
            color: var(--brand-yellow);
        }
        .quick-footer { display: flex; justify-content: space-between; align-items: center; width: 100%; }
        .quick-label  { font-size: 14px; font-weight: 700; color: #fff; }
        .quick-badge  {
            background: var(--tint-amber, rgba(245,158,11,0.14));
            color: var(--status-amber); font-size: 11px;
            font-weight: 700; padding: 2px 8px; border-radius: 999px;
        }

        /* ── Bilan stats ── */
        .bilan-card {
            background: var(--bg-panel); border: 1px solid var(--border);
            border-radius: var(--r-xl, 14px); padding: 18px;
            margin-bottom: 0;
        }
        .bilan-title {
            font-size: 14px; font-weight: 700; color: #fff;
            display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
        }
        .bilan-title::after {
            content: ''; flex: 1; height: 1px; background: var(--border-faint, #25262e);
        }
        .bilan-item {
            display: none; justify-content: space-between; align-items: center;
            background: var(--bg-sunken, #15161c); padding: 12px 14px;
            border-radius: var(--r-lg, 10px); border: 1px solid var(--border);
            cursor: pointer; margin-bottom: 8px; transition: border-color var(--t-base);
        }
        .bilan-item:hover { border-color: var(--brand-yellow); }
        .bilan-item-label { font-size: 13px; color: var(--text-muted); font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .bilan-badge {
            font-size: 12px; font-weight: 700;
            min-width: 26px; height: 22px; border-radius: 6px;
            display: flex; align-items: center; justify-content: center; padding: 0 6px;
        }
        .bilan-badge.alert { background: var(--tint-red);   color: var(--status-red); }
        .bilan-badge.warn  { background: var(--tint-amber); color: var(--status-amber); }
        .bilan-empty {
            display: none; text-align: center; padding: 14px;
            background: var(--tint-green, rgba(34,197,94,0.14));
            border: 1px dashed var(--status-green); border-radius: var(--r-lg, 10px);
            color: var(--text-main); font-size: 13px; line-height: 1.5;
        }

        /* ── Certifications / alertes ── */
        .certif-card {
            background: var(--bg-panel); border: 1px solid var(--border);
            border-radius: var(--r-xl, 14px); padding: 18px;
        }
        .certif-title {
            font-size: 14px; font-weight: 700; color: #fff;
            display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
        }
        .certif-title::after {
            content: ''; flex: 1; height: 1px; background: var(--border-faint, #25262e);
        }
        .certif-list { display: flex; flex-direction: column; gap: 8px; }
        .certif-item {
            background: var(--bg-sunken, #15161c); border: 1px solid var(--border);
            border-radius: var(--r-lg, 10px); padding: 11px 14px;
            font-size: 13px; display: flex; align-items: center; gap: 12px; font-weight: 500;
        }
        .certif-item.danger  { border-left: 3px solid var(--status-red);   color: #fca5a5; }
        .certif-item.warning { border-left: 3px solid var(--status-amber); color: #fcd34d; }
        .certif-item.ok      { border-left: 3px solid var(--status-green); color: var(--text-main); }
        .certif-item .ci-icon { flex-shrink: 0; display: flex; align-items: center; }
        .certif-item.danger  .ci-icon { color: var(--status-red); }
        .certif-item.warning .ci-icon { color: var(--status-amber); }
        .certif-item.ok      .ci-icon { color: var(--status-green); }

        /* ── Modal annonce ── */
        .type-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 6px; }
        .type-btn {
            background: transparent; border: 1px solid var(--border);
            color: var(--text-muted); padding: 10px 12px;
            border-radius: var(--r-lg, 10px); font-size: 13px; font-weight: 600;
            cursor: pointer; font-family: inherit; text-align: left;
            transition: all var(--t-base);
        }
        .type-btn.active-info      { border-color: var(--brand-yellow); border-left-width: 3px; color: #fff; background: var(--bg-sunken); }
        .type-btn.active-important { border-color: var(--status-red);    border-left-width: 3px; color: #fff; background: var(--bg-sunken); }
        .type-btn.active-normal    { border-color: var(--status-blue);   border-left-width: 3px; color: #fff; background: var(--bg-sunken); }
        #type-info      { border-left: 3px solid var(--brand-yellow); }
        #type-important { border-left: 3px solid var(--status-red); }
        #type-normal    { border-left: 3px solid var(--status-blue); }
        .pinned-toggle {
            display: flex; align-items: center; gap: 12px;
            background: var(--bg-sunken, #15161c); border: 1px dashed var(--border);
            padding: 12px; border-radius: var(--r-lg, 10px); cursor: pointer;
            transition: border-color var(--t-base);
        }
        .pinned-toggle:hover { border-color: var(--brand-yellow); }
        .news-pin-toggle {
            width: 36px; height: 20px; border-radius: 999px;
            background: var(--bg-sunken); border: 1px solid var(--border-strong);
            position: relative; flex-shrink: 0; cursor: pointer;
            transition: background var(--t-base), border-color var(--t-base);
        }
        .news-pin-toggle::after {
            content: ''; position: absolute; top: 2px; left: 2px;
            width: 14px; height: 14px; border-radius: 50%;
            background: #fff; transition: left var(--t-base);
        }
        .news-pin-toggle[data-on="1"] { background: var(--brand-yellow); border-color: var(--brand-yellow); }
        .news-pin-toggle[data-on="1"]::after { left: 18px; }
        .pinned-toggle span { font-size: 13px; color: #fff; font-weight: 500; }

        /* ── Mobile header ── */
        .acc-mobile-header {
            display: none;
            align-items: center; gap: 12px;
            padding: 14px 16px 0;
        }
        .acc-mob-menu-btn {
            width: 36px; height: 36px; flex-shrink: 0;
            background: none; border: none; padding: 0;
            display: flex; align-items: center; justify-content: center;
            color: var(--text-muted); cursor: pointer;
        }
        .acc-mob-greeting {
            flex: 1; font-size: 27px; font-weight: 800; color: #fff;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .acc-mob-publish-btn {
            background: var(--brand-yellow); color: #1a1b22;
            border: none; border-radius: 18px;
            padding: 7px 12px; font-size: 13px; font-weight: 700;
            display: flex; align-items: center; gap: 5px;
            cursor: pointer; flex-shrink: 0;
        }
        .acc-mobile-sub {
            display: none;
            padding: 5px 16px 0;
            font-size: 12px; color: var(--text-faint);
        }

        /* ── News card type badge ── */
        .news-card-top {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 10px; padding-right: 80px;
        }
        .nc-type-pill {
            font-size: 11px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.7px; display: inline-flex; align-items: center; gap: 4px;
            border-radius: 4px;
        }
        .nc-pinned   { background: rgba(252,202,70,0.18); color: var(--brand-yellow); padding: 2px 8px; border-radius: 4px; }
        .nc-urgent   { background: rgba(220,38,38,0.18); color: #f87171; padding: 2px 8px; border-radius: 4px; }
        .nc-chantier { background: rgba(59,130,246,0.18); color: #93c5fd; padding: 2px 8px; border-radius: 4px; }
        .nc-info     { background: rgba(252,202,70,0.12); color: var(--brand-yellow); padding: 2px 8px; border-radius: 4px; }
        .nc-date          { font-size: 11px; font-weight: 600; color: var(--text-faint); }
        .nc-author   { font-size: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border); display: flex; align-items: center; gap: 8px; }

        @media (max-width: 900px) { .dashboard-grid { grid-template-columns: 1fr; } }
        @media (max-width: 768px) {
            .accueil-main { padding: 12px 16px 16px; }
            .quick-grid { grid-template-columns: 1fr 1fr; }
            .view-header { display: none; }
            .acc-mobile-header { display: flex; }
            .acc-mobile-sub { display: block; }
            .news-card-actions { display: none; }
            .news-card-header { padding-right: 0; }
            .news-card-top { padding-right: 0; }
            .nc-full-date { display: none; }
            .nc-author { display: none; }
        }
    </style>

    <!-- Mobile header -->
    <div class="acc-mobile-header">
        <button class="acc-mob-menu-btn" id="accMenuBtn" aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <span class="acc-mob-greeting" id="accMobGreeting">Bonjour…</span>
        <button class="acc-mob-publish-btn" id="btnAddNewsMobile" style="display:none">
            ${IC.megaphone} Publier
        </button>
    </div>
    <div class="acc-mobile-sub" id="accMobSub"></div>

    <div class="accueil-main view">

        <!-- Header (desktop) -->
        <div class="view-header">
            <div>
                <h1 id="greeting">Chargement…</h1>
                <p class="sub" id="roleText" style="margin-top:6px">${IC.briefcase} Vérification des accès</p>
            </div>
            <div class="actions">
                <button class="btn btn-primary btn-pill" id="btn-add-news" style="display:none">
                    ${IC.megaphone} Publier une annonce
                </button>
            </div>
        </div>

        <!-- Grille principale -->
        <div class="dashboard-grid">

            <!-- Colonne gauche : tableau d'affichage -->
            <div>
                <div class="acc-eyebrow">${IC.megaphone} Tableau d'affichage <span id="news-count"></span></div>
                <div class="news-list" id="newsList"></div>
            </div>

            <!-- Colonne droite -->
            <div style="display:flex;flex-direction:column;gap:20px">

                <!-- Accès rapides -->
                <div>
                    <div class="acc-eyebrow">${IC.zap} Accès rapides</div>
                    <div class="quick-grid">
                        <button class="quick-card" data-nav="factures">
                            <div class="quick-icon">${IC.fileText}</div>
                            <div class="quick-footer">
                                <span class="quick-label">Factures</span>
                            </div>
                        </button>
                        <button class="quick-card" data-nav="temps">
                            <div class="quick-icon">${IC.clock}</div>
                            <div class="quick-footer">
                                <span class="quick-label">Heures</span>
                            </div>
                        </button>
                        <button class="quick-card" data-nav="po">
                            <div class="quick-icon">${IC.cart}</div>
                            <div class="quick-footer">
                                <span class="quick-label">Bons (PO)</span>
                            </div>
                        </button>
                        <button class="quick-card" data-nav="calendrier">
                            <div class="quick-icon">${IC.calendar}</div>
                            <div class="quick-footer">
                                <span class="quick-label">Agenda</span>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Bilan -->
                <div class="bilan-card">
                    <div class="bilan-title">
                        <span style="color:#06b6d4">${IC.activity}</span> Activité de l'équipe
                    </div>
                    <div>
                        <div class="bilan-item" id="item-inv" data-nav="factures">
                            <span class="bilan-item-label">${IC.fileText} Factures non envoyées</span>
                            <span class="bilan-badge alert" id="stat-inv">0</span>
                        </div>
                        <div class="bilan-item" id="item-ts" data-nav="temps">
                            <span class="bilan-item-label">${IC.clock} Feuilles de temps en attente</span>
                            <span class="bilan-badge warn" id="stat-ts">0</span>
                        </div>
                        <div class="bilan-item" id="item-tools" data-nav="outils">
                            <span class="bilan-item-label">${IC.tool} Outils dans mon camion</span>
                            <span class="bilan-badge warn" id="stat-tools">0</span>
                        </div>
                        <div id="bilan-empty-msg" class="bilan-empty">
                            ${IC.checkCircle} Tu es à jour — rien d'oublié !
                        </div>
                    </div>
                </div>

                <!-- Certifications -->
                <div class="certif-card">
                    <div class="certif-title">
                        <span style="color:#22c55e">${IC.award}</span> Rappels & certifications
                    </div>
                    <div class="certif-list" id="alertsList"></div>
                </div>

            </div>
        </div>
    </div>

    <!-- Modal : publier une annonce -->
    <div class="modal-overlay" id="newsModal" style="display:none">
        <div class="modal">
            <div class="modal-title" style="justify-content:space-between">${IC.megaphone} Publier une annonce<button id="btnCloseNewsX" style="background:none;border:none;color:var(--text-faint);cursor:pointer;padding:4px;display:flex;align-items:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
            <div style="display:flex;flex-direction:column;gap:16px">
                <div>
                    <label class="field-label">Niveau d'importance</label>
                    <div class="type-grid">
                        <button class="type-btn active-info" data-type="info" id="type-info">Information</button>
                        <button class="type-btn" data-type="important" id="type-important">Urgent</button>
                        <button class="type-btn" data-type="normal" id="type-normal">Chantier</button>
                    </div>
                </div>
                <div>
                    <label class="field-label">Titre principal</label>
                    <input class="input" type="text" id="newsTitle" placeholder="Ex : Rappel feuilles de temps">
                </div>
                <div>
                    <label class="field-label">Message complet</label>
                    <textarea class="textarea" id="newsBody" placeholder="Détails de l'annonce…"></textarea>
                </div>
                <div class="pinned-toggle" id="pinnedGroup">
                    <button class="news-pin-toggle" id="newsPinned" data-on="0"></button>
                    <span>Épingler cette annonce tout en haut</span>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" id="btnCancelNews">Annuler</button>
                <button class="btn btn-primary" id="btnSaveNews">${IC.send} Publier</button>
            </div>
        </div>
    </div>

    <!-- Modal : confirmation suppression -->
    <div class="modal-overlay" id="confirmModal" style="display:none">
        <div class="modal" style="max-width:400px;text-align:center">
            <div class="modal-title" style="color:var(--status-red);justify-content:center;border-bottom:none;padding-bottom:0;margin-bottom:10px">
                Confirmation
            </div>
            <p id="confirmMsg" style="color:var(--text-muted);margin-bottom:8px;font-size:14px"></p>
            <div class="modal-actions" style="justify-content:center">
                <button class="btn btn-secondary" id="btnCancelConfirm">Annuler</button>
                <button class="btn btn-danger" id="btnYesConfirm">Oui, supprimer</button>
            </div>
        </div>
    </div>
    `

    return await init()
}

// ── Init ─────────────────────────────────────────────────────────────────────
async function init() {
    // Date dans le greeting
    const prenom = currentProfil?.prenom_nom?.split(' ')[0] || 'vous'
    document.getElementById('greeting').textContent = `Bonjour, ${prenom}.`

    const roleLabelMap = { A0: 'Développeur', A1: 'Administrateur', A2: 'Gestion & Bureau', A3: 'Employé terrain' }
    const _fullDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    const _months   = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
    const _now      = new Date()
    const _dateLabel = `${_fullDays[_now.getDay()]} ${_now.getDate()} ${_months[_now.getMonth()]} ${_now.getFullYear()}`
    document.getElementById('roleText').textContent = `${roleLabelMap[currentRole] || 'Utilisateur'} · ${_dateLabel}`

    // Bouton publier
    const canPublish = hasPermission('manage_news')
    document.getElementById('btn-add-news').style.display = canPublish ? 'flex' : 'none'

    // Mobile header
    const mobGreeting = document.getElementById('accMobGreeting')
    if (mobGreeting) mobGreeting.textContent = `Bonjour, ${prenom}.`

    const _days    = ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.']
    const _dateStr = `${_days[_now.getDay()]} ${_now.getDate()} ${_months[_now.getMonth()]} ${_now.getFullYear()}`
    const mobSub = document.getElementById('accMobSub')
    if (mobSub) mobSub.textContent = `${roleLabelMap[currentRole] || 'Utilisateur'} · ${_dateStr}`

    const btnMobPublish = document.getElementById('btnAddNewsMobile')
    if (btnMobPublish) {
        btnMobPublish.style.display = canPublish ? 'flex' : 'none'
        btnMobPublish.addEventListener('click', openNewsModal)
    }
    document.getElementById('accMenuBtn')?.addEventListener('click', () => {
        document.getElementById('topbar-mobile-menu-btn')?.click()
    })

    // Accès rapides — navigation
    document.querySelectorAll('.quick-card[data-nav]').forEach(card => {
        card.addEventListener('click', () => navigateTo(card.dataset.nav))
    })

    // Bilan — navigation
    document.querySelectorAll('.bilan-item[data-nav]').forEach(item => {
        item.addEventListener('click', () => navigateTo(item.dataset.nav))
    })

    // Type-selector dans la modal
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.type-btn').forEach(b =>
                b.className = 'type-btn'
            )
            btn.className = `type-btn active-${btn.dataset.type}`
        })
    })

    // Modales
    document.getElementById('btn-add-news').addEventListener('click', openNewsModal)
    document.getElementById('btnCancelNews').addEventListener('click', closeNewsModal)
    document.getElementById('btnCloseNewsX').addEventListener('click', closeNewsModal)
    document.getElementById('btnSaveNews').addEventListener('click', saveNews)
    document.getElementById('btnCancelConfirm').addEventListener('click', closeConfirmModal)
    document.getElementById('btnYesConfirm').addEventListener('click', () => {
        if (confirmCallback) confirmCallback()
        closeConfirmModal()
    })
    document.getElementById('pinnedGroup').addEventListener('click', () => {
        const tog = document.getElementById('newsPinned')
        tog.dataset.on = tog.dataset.on === '1' ? '0' : '1'
    })

    // Fermer modales sur fond
    ;['newsModal', 'confirmModal'].forEach(id => {
        document.getElementById(id).addEventListener('click', e => {
            if (e.target === document.getElementById(id)) {
                if (id === 'newsModal') closeNewsModal()
                else closeConfirmModal()
            }
        })
    })

    // Charger les données
    await Promise.all([loadNews(), checkCertifications(), loadDashboardStats()])

    const onFormationsUpdated = () => checkCertifications()
    window.addEventListener('formations_updated', onFormationsUpdated)

    const onFocus = () => loadDashboardStats()
    window.addEventListener('focus', onFocus)

    return function cleanup() {
        window.removeEventListener('formations_updated', onFormationsUpdated)
        window.removeEventListener('focus', onFocus)
    }
}

// ── News ─────────────────────────────────────────────────────────────────────

async function loadNews() {
    try {
        const { data, error } = await supabase
            .from('annonces')
            .select('id,type,titre,contenu,auteur,created_at,is_pinned')
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false })
        if (error) throw error
        newsData = (data || []).map(n => ({
            id: n.id, type: n.type, title: n.titre,
            body: n.contenu, author: n.auteur,
            date: n.created_at, isPinned: n.is_pinned
        }))
    } catch { newsData = [] }
    renderNews()
}

function renderNews() {
    const container = document.getElementById('newsList')
    const countEl   = document.getElementById('news-count')
    if (!container) return

    const sorted = [...newsData].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return new Date(b.date) - new Date(a.date)
    })

    if (countEl) countEl.textContent = `· ${sorted.length} annonce${sorted.length !== 1 ? 's' : ''}`

    if (sorted.length === 0) {
        container.innerHTML = '<div class="news-empty">Aucune annonce pour le moment.</div>'
        return
    }

    container.innerHTML = ''
    const canManage = hasPermission('manage_news')
    const _ncMonths = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.']

    sorted.forEach(news => {
        const d = new Date(news.date)
        const dateStr  = d.toLocaleDateString('fr-CA') + ' à ' + d.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
        const shortDate = `${d.getDate()} ${_ncMonths[d.getMonth()]}`

        const typeTag = news.type === 'important'
            ? `<span class="nc-type-pill nc-urgent">URGENT</span>`
            : news.type === 'normal'
            ? `<span class="nc-type-pill nc-chantier">CHANTIER</span>`
            : `<span class="nc-type-pill nc-info">${IC.megaphone} INFO</span>`

        const actionsHTML = canManage ? `
            <div class="news-card-actions">
                <button class="news-icon-btn ${news.isPinned ? 'pin-active' : ''}" data-pin="${news.id}" title="${news.isPinned ? 'Désépingler' : 'Épingler'}">
                    ${IC.pin}
                </button>
                <button class="news-icon-btn danger" data-delete="${news.id}" title="Supprimer">
                    ${IC.trash}
                </button>
            </div>` : ''

        const div = document.createElement('div')
        div.className = `news-card ${news.type}${news.isPinned ? ' pinned' : ''}`
        div.innerHTML = `
            <div class="news-card-top">
                ${typeTag}
            </div>
            <div class="news-card-header">
                <h3 class="news-card-title">${sanitize(news.title)}</h3>
            </div>
            <div class="news-card-body">${sanitize(news.body)}</div>
            ${news.author ? `<div class="nc-author">${makeAvatar(news.author, 22)}<span><span style="color:var(--text-faint)">Publié par</span> <strong style="color:var(--text-main)">${sanitize(news.author)}</strong></span></div>` : ''}
            ${actionsHTML}
        `
        container.appendChild(div)
    })

    container.querySelectorAll('[data-pin]').forEach(btn =>
        btn.addEventListener('click', () => togglePin(btn.dataset.pin))
    )
    container.querySelectorAll('[data-delete]').forEach(btn =>
        btn.addEventListener('click', () => deleteNews(btn.dataset.delete))
    )
}

async function togglePin(id) {
    const idx = newsData.findIndex(n => n.id === id)
    if (idx > -1) {
        newsData[idx].isPinned = !newsData[idx].isPinned
        await supabase.from('annonces').update({ is_pinned: newsData[idx].isPinned }).eq('id', id)
        renderNews()
    }
}

function openNewsModal() {
    if (!hasPermission('manage_news')) { showToast("Vous n'avez pas la permission.", 'warning'); return }
    document.getElementById('newsTitle').value = ''
    document.getElementById('newsBody').value = ''
    document.getElementById('newsPinned').dataset.on = '0'
    document.querySelectorAll('.type-btn').forEach(b => b.className = 'type-btn')
    document.getElementById('type-info').className = 'type-btn active-info'
    document.getElementById('newsModal').style.display = 'flex'
}

function closeNewsModal() {
    document.getElementById('newsModal').style.display = 'none'
}

async function saveNews() {
    if (!hasPermission('manage_news')) return
    const title    = document.getElementById('newsTitle').value.trim()
    const body     = document.getElementById('newsBody').value.trim()
    const type     = document.querySelector('.type-btn[class*="active-"]')?.dataset.type || 'info'
    const isPinned = document.getElementById('newsPinned').dataset.on === '1'

    if (!title || !body) { showToast('Veuillez remplir le titre et le message.', 'warning'); return }

    const btn = document.getElementById('btnSaveNews')
    if (btn?.disabled) return
    if (btn) { btn.disabled = true; btn.style.opacity = '0.6' }

    let authorName = currentProfil?.prenom_nom || 'Utilisateur'
    if (currentRole === 'A0') {
        try { const alias = localStorage.getItem('dussault_a0_alias'); if (alias === 'systeme') authorName = 'Système' } catch { /* ok */ }
    }

    try {
        const { error } = await supabase.from('annonces').insert([{
            type, titre: title, contenu: body, auteur: authorName, is_pinned: isPinned
        }])
        if (error) { showToast(friendlyError(error), 'error'); return }
        await loadNews()
        closeNewsModal()
    } finally {
        if (btn) { btn.disabled = false; btn.style.opacity = '' }
    }
}

function deleteNews(id) {
    showConfirm('Voulez-vous vraiment supprimer cette annonce pour tout le monde ?', async () => {
        const { error } = await supabase.from('annonces').delete().eq('id', id)
        if (error) { showToast(friendlyError(error), 'error'); return }
        newsData = newsData.filter(n => n.id !== id)
        renderNews()
    })
}

// ── Bilan ────────────────────────────────────────────────────────────────────
async function loadDashboardStats() {
    if (!currentUser) return
    try {
        const [invRes, tsRes, toolsRes] = await Promise.all([
            supabase.from('factures').select('*', { count: 'exact', head: true }).eq('author_id', currentUser.id).in('status', ['brouillon', 'renvoye']),
            supabase.from('feuilles_de_temps').select('*', { count: 'exact', head: true }).eq('author_id', currentUser.id).eq('status', 'brouillon'),
            supabase.from('outils').select('*', { count: 'exact', head: true }).eq('assignee_nom', currentProfil?.prenom_nom).eq('status', 'active')
        ])
        const inv   = invRes.count ?? 0
        const ts    = tsRes.count ?? 0
        const tools = toolsRes.count ?? 0

        const itemInv   = document.getElementById('item-inv')
        const itemTs    = document.getElementById('item-ts')
        const itemTools = document.getElementById('item-tools')
        const emptyMsg  = document.getElementById('bilan-empty-msg')

        if (itemInv)   { document.getElementById('stat-inv').textContent = inv;     itemInv.style.display = inv > 0 ? 'flex' : 'none' }
        if (itemTs)    { document.getElementById('stat-ts').textContent = ts;       itemTs.style.display = ts > 0 ? 'flex' : 'none' }
        if (itemTools) { document.getElementById('stat-tools').textContent = tools; itemTools.style.display = tools > 0 ? 'flex' : 'none' }
        if (emptyMsg)  { emptyMsg.style.display = (inv === 0 && ts === 0 && tools === 0) ? 'block' : 'none' }

    } catch (e) {
        console.error('Erreur stats bilan:', e)
    }
}

// ── Certifications ────────────────────────────────────────────────────────────
async function checkCertifications() {
    const container = document.getElementById('alertsList')
    if (!container || !currentUser) return
    container.innerHTML = ''
    let hasAlerts = false

    const { data } = await supabase.from('formations').select('nom,date_expiration').eq('user_id', currentUser.id)
    const formations = data || []
    const today = new Date()

    formations.forEach(f => {
        const expDate  = new Date(f.date_expiration)
        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))
        const nom      = sanitize(f.nom || f.name || 'Formation')

        if (diffDays < 0) {
            hasAlerts = true
            container.insertAdjacentHTML('beforeend', `
                <div class="certif-item danger">
                    <span class="ci-icon">${IC.alertTriangle}</span>
                    <div><b>${nom}</b> est expirée !</div>
                </div>`)
        } else if (diffDays <= 30) {
            hasAlerts = true
            container.insertAdjacentHTML('beforeend', `
                <div class="certif-item warning">
                    <span class="ci-icon">${IC.alertCircle}</span>
                    <div><b>${nom}</b> expire dans ${diffDays}j.</div>
                </div>`)
        }
    })

    if (!hasAlerts) {
        container.innerHTML = `
            <div class="certif-item ok">
                <span class="ci-icon">${IC.award}</span>
                <div>Toutes vos cartes sont à jour.</div>
            </div>`
    }
}

// ── Confirm modal ─────────────────────────────────────────────────────────────
function showConfirm(msg, callback) {
    document.getElementById('confirmMsg').textContent = msg
    confirmCallback = callback
    document.getElementById('confirmModal').style.display = 'flex'
}
function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none'
    confirmCallback = null
}

