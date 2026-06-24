// src/views/admin.js
// Migré fidèlement depuis code_admin/code_admin.html

import { supabase } from '../supabase.js'
import { currentUser, currentRole, hasPermission } from '../auth.js'
import { sanitize } from '../shared/sanitize.js'
import { friendlyError } from '../shared/errorMsg.js'
import { avatarColor as getAvatarColor, avatarInitials } from '../shared/avatarColor.js'

// ── État local ──────────────────────────────────────────────────────────────
let allLogs = []
let roleDefinitions = {}
let suppliersData = []
let metiersData = []
let toolsListData = []
let currentToolSettingsId = null
let maintenanceActive = false
let confirmAdminCallback = null
let allFormationsData = []

const DEFAULT_SUPPLIERS = ['Deschênes', 'Wolseley', 'Plomberie Provinciale']
const DEFAULT_METIERS = ['Plombier — Apprenti', 'Plombier — Compagnon', 'Plombier — Maître', 'Tuyauteur — Apprenti', 'Tuyauteur — Compagnon', 'Tuyauteur — Maître']

const allPermissions = [
    { id: 'view_all_invoices',     label: 'Voir toutes les factures',             desc: 'Accès à la boîte de réception des factures.' },
    { id: 'view_all_quotes',       label: 'Voir toutes les soumissions',          desc: 'Accès à toutes les soumissions.' },
    { id: 'view_all_timesheets',   label: 'Voir toutes les feuilles de temps',    desc: 'Accès à toutes les feuilles de temps.' },
    { id: 'view_all_po',           label: 'Voir tous les bons de commande',       desc: 'Accès à tous les PO.' },
    { id: 'access_po_tab',         label: "Accès à l'onglet PO",                  desc: 'Affiche/masque le bouton Bons de commande.' },
    { id: 'access_soumissions_tab',label: "Accès à l'onglet Soumissions",         desc: 'Affiche/masque le bouton Soumissions.' },
    { id: 'access_courriel_tab',   label: "Accès à l'onglet Courriel",            desc: 'Affiche/masque le bouton Courriel.' },
    { id: 'approve_timesheets',    label: 'Traiter les feuilles de temps',        desc: 'Voir et changer le statut des feuilles.' },
    { id: 'manage_tools',          label: "Gérer la banque d'outils",             desc: 'Ajouter, modifier ou supprimer des outils.' },
    { id: 'create_clients',        label: 'Créer un nouveau client',              desc: 'Autorise la création de fiches clients.' },
    { id: 'delete_clients',        label: 'Supprimer un client',                  desc: 'Autorise la suppression de clients.' },
    { id: 'manage_calendar',       label: 'Gérer le calendrier global',           desc: 'Créer, modifier ou supprimer des événements partagés.' },
    { id: 'manage_news',           label: 'Publier des annonces',                 desc: 'Afficher des notes sur le tableau de bord.' },
    { id: 'view_admin',            label: "Accès panneau d'administration",       desc: 'Création de comptes et nettoyage annuel.' },
    { id: 'manage_suppliers',      label: 'Gérer les fournisseurs récurrents',    desc: 'Ajouter ou supprimer des fournisseurs.' },
    { id: 'delete_documents',      label: 'Supprimer définitivement un document', desc: 'Suppression définitive sans archivage.' }
]

const defaultRolesConfig = {
    'A0': { name: 'A0 - Développeur',     isSystem: true, color: '#3b82f6', perms: allPermissions.map(p => p.id) },
    'A1': { name: 'A1 - Administrateur',  isSystem: true, color: '#ef4444', perms: allPermissions.map(p => p.id) },
    'A2': { name: 'A2 - Bureau',          isSystem: true, color: '#b45309', perms: ['view_all_invoices','view_all_quotes','view_all_timesheets','view_all_po','access_po_tab','access_soumissions_tab','access_courriel_tab','approve_timesheets','manage_tools','create_clients','delete_clients','manage_calendar','manage_news','view_admin','manage_suppliers'] },
    'A3': { name: 'A3 - Employé Terrain', isSystem: true, color: '#22c55e', perms: ['access_po_tab','access_soumissions_tab','create_clients'] }
}

const ROLE_COLORS = [
    { hex: '#ef4444', label: 'Rouge' },
    { hex: '#f43f5e', label: 'Corail' },
    { hex: '#f97316', label: 'Orange' },
    { hex: '#eab308', label: 'Jaune' },
    { hex: '#84cc16', label: 'Lime' },
    { hex: '#22c55e', label: 'Vert' },
    { hex: '#14b8a6', label: 'Turquoise' },
    { hex: '#06b6d4', label: 'Cyan' },
    { hex: '#3b82f6', label: 'Bleu' },
    { hex: '#6366f1', label: 'Indigo' },
    { hex: '#8b5cf6', label: 'Violet' },
    { hex: '#ec4899', label: 'Rose' },
    { hex: '#b45309', label: 'Brun' },
    { hex: '#6b7280', label: 'Gris' },
    { hex: '#4b5563', label: 'Gris foncé' },
]
let selectedRoleColor = ''
let editRoleSelectedColor = '#6b7280'

// ── Render principal ────────────────────────────────────────────────────────
export async function render(container) {
    container.innerHTML = `
    <style>
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input:focus { border-color: var(--accent) !important; }
        .search-icon { position: absolute; left: 15px; color: #888; pointer-events: none; display: flex; align-items: center; }
        .admin-main { width: 100%; overscroll-behavior-y: contain; box-sizing: border-box; }
        .dash-header { display: flex; justify-content: space-between; align-items: center; }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .settings-card { background-color: var(--bg-panel); padding: 25px; border-radius: var(--r-xl, 14px); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 16px; transition: all 0.3s ease; }
        .expanded-logs-panel { position: fixed !important; top: 30px !important; left: 30px !important; right: 30px !important; bottom: 30px !important; z-index: 5000 !important; background-color: var(--bg-panel) !important; box-shadow: 0 10px 40px rgba(0,0,0,0.8) !important; border: 2px solid var(--btn-blue) !important; max-width: none !important; margin: 0 !important; overflow: auto; }
        .expanded-logs-panel .logs-scroll-area { max-height: calc(100vh - 160px) !important; }
        @media (max-width: 768px) { .expanded-logs-panel { top: 10px !important; left: 10px !important; right: 10px !important; bottom: 10px !important; } .settings-card { min-width: 0 !important; } .btn-csv-desktop { display: none !important; } }
        .card-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 17px; font-weight: 700; flex-wrap: wrap; }
        .header-with-icon { display: flex; align-items: center; gap: 10px; color: var(--text-main, #fff); }
        .header-with-icon svg { width: 22px; height: 22px; stroke: var(--icon-color, currentColor); fill: none; stroke-width: 2; }
        .btn-add-small { background: #444; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold; transition: 0.2s; display: flex; align-items: center; gap: 6px; }
        .btn-add-small svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-add-small:hover { background: #555; }
        .formation-list { display: flex; flex-direction: column; gap: 10px; max-height: 350px; overflow-y: auto; padding-right: 5px; }
        .formation-item { background: #1a1b23; border: 1px solid #444; border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 12px; }
        .btn-del-emp { background: rgba(255,77,77,0.1); color: var(--btn-red); border: 1px solid transparent; width: 30px; height: 30px; border-radius: 6px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
        .btn-del-emp svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-del-emp:hover { background: var(--btn-red); color: white; }
        /* ── Emp row (nouveau style) ── */
        .emp-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--bg-sunken,#15161c); border-radius: var(--r-lg,10px); border: 1px solid var(--border); transition: background var(--t-base); }
        .emp-row:hover { background: var(--bg-panel-2); }
        .emp-avatar { position: relative; flex-shrink: 0; }
        .emp-avatar-circle { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: #fff; letter-spacing: 0.3px; }
        .emp-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .emp-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .emp-name { font-weight: 700; font-size: 14px; color: #fff; }
        .emp-role-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
        .emp-contact { font-size: 12px; color: var(--text-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .emp-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .btn-emp-edit { width: 30px; height: 30px; border-radius: var(--r-md,8px); border: 1px solid var(--border); background: transparent; color: var(--text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--t-base); }
        .btn-emp-edit:hover { background: var(--bg-panel-2); color: #fff; }
        .btn-emp-edit svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        #employeeList { display: flex; flex-direction: column; gap: 8px; }
        .btn-gear-tool { background: rgba(255,255,255,0.07); color: #888; border: 1px solid transparent; width: 36px; height: 36px; border-radius: 8px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; flex-shrink: 0; -webkit-tap-highlight-color: transparent; }
        .btn-gear-tool svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-gear-tool:hover { background: #444; color: white; }
        .tool-settings-section { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #333; }
        .tool-settings-label { color: #aaa; font-size: 12px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .tool-histo-item { background: #252636; border-radius: 6px; padding: 8px 10px; font-size: 12px; color: #ccc; display: flex; justify-content: space-between; align-items: center; }
        .logs-table { width: 100%; border-collapse: collapse; font-size: 13px; color: #ccc; min-width: 400px; }
        .logs-table th { text-align: left; padding: 12px; color: #aaa; font-weight: bold; border-bottom: 1px solid #444; position: sticky; top: 0; background: #2b2c36; z-index: 10; }
        .logs-table td { padding: 12px; border-bottom: 1px dashed #333; vertical-align: top; }
        .logs-scroll-area { max-height: 250px; overflow-y: auto; overflow-x: auto; }
        .log-filters-wrapper { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
        .log-filter-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .log-select-wrap { position: relative; display: block; }
        .log-select-wrap select { width: 100%; -webkit-appearance: none; appearance: none; background: #1a1b23; border: 1px solid #444; color: white; padding: 10px 32px 10px 12px; border-radius: 6px; font-size: 13px; outline: none; cursor: pointer; font-family: inherit; box-sizing: border-box; }
        .log-select-wrap select:focus { border-color: var(--btn-blue); }
        .log-select-wrap .sel-chevron { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; width: 15px; height: 15px; stroke: #888; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; z-index: 4000; justify-content: center; align-items: center; padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px); box-sizing: border-box; }
        .modal-overlay.open { display: flex; }
        .modal-card-basic { background: var(--bg-panel); width: 90%; max-width: 400px; padding: 25px; border-radius: 15px; text-align: left; border: 1px solid #555; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-height: 90vh; overflow-y: auto; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; color: #aaa; margin-bottom: 5px; font-size: 13px; font-weight: bold; }
        .form-group input, .form-group select { width: 100%; padding: 12px; background: #1a1b23; border: 1px solid #444; color: white; border-radius: 8px; font-size: 15px; outline: none; box-sizing: border-box; }
        .form-group input:focus, .form-group select:focus { border-color: var(--accent); }
        .form-group select:disabled { opacity: 0.6; cursor: not-allowed; }
        .modal-actions { display: flex; justify-content: center; gap: 10px; margin-top: 20px; }
        .btn-modal-gray  { background: #444; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
        .btn-modal-green { background: var(--btn-green); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .btn-modal-red   { background: var(--btn-red); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .btn-modal-orange { background: var(--btn-orange); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .tabs-container { display: flex; gap: 0; margin-bottom: 20px; border-bottom: 1px solid var(--border); overflow-x: auto; scrollbar-width: none; touch-action: pan-x; overscroll-behavior-x: contain; flex-shrink: 0; }
        .tabs-container::-webkit-scrollbar { display: none; }
        .btn-tab { background: transparent; color: var(--text-faint); border: none; border-bottom: 2px solid transparent; padding: 10px 18px; font-weight: 600; font-size: 13px; cursor: pointer; transition: color 0.2s, border-color 0.2s; display: flex; align-items: center; gap: 8px; white-space: nowrap; flex-shrink: 0; font-family: inherit; margin-bottom: -1px; }
        .btn-tab svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-tab:hover { color: #fff; }
        .btn-tab.active { color: #fff; border-bottom-color: var(--brand-yellow); }
        .admin-section { display: none; flex-direction: column; gap: 20px; }
        .admin-section.active { display: flex; }
        .perm-form-group { margin-bottom: 0; }
        .perm-form-group label { display: block; font-size: 11px; font-weight: 700; color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
        .perm-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
        @media (max-width: 768px) { .perm-grid { grid-template-columns: repeat(2, 1fr); } }
        .perm-card { display: flex; align-items: center; gap: 9px; padding: 10px 12px; border-radius: var(--r-lg,10px); cursor: pointer; font-size: 13px; font-weight: 500; border: 1px solid var(--border); background: var(--bg-sunken,#15161c); color: var(--text-faint); transition: all var(--t-base,0.18s); user-select: none; }
        .perm-card.checked { background: rgba(34,197,94,0.12); border-color: rgba(34,197,94,0.3); color: #fff; }
        .perm-card-check { width: 17px; height: 17px; border-radius: 4px; border: 2px solid var(--border); flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all var(--t-base,0.18s); }
        .perm-card.checked .perm-card-check { background: var(--status-green,#22c55e); border-color: var(--status-green,#22c55e); }
        .log-badge { display:inline-block; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; white-space: nowrap; }
        .cert-filter-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .cert-select-wrap { position: relative; }
        .cert-select-wrap select { -webkit-appearance: none; appearance: none; background: var(--bg-sunken,#15161c); border: 1px solid var(--border); color: #fff; padding: 8px 32px 8px 12px; border-radius: var(--r-lg,10px); font-size: 13px; font-family: inherit; outline: none; cursor: pointer; }
        .cert-select-wrap select:focus { border-color: var(--btn-green); }
        .cert-select-wrap .sel-chevron { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; width: 14px; height: 14px; stroke: var(--text-faint); fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
        .cert-count { margin-left: auto; font-size: 12px; color: var(--text-faint); font-weight: 600; white-space: nowrap; }
        .cert-list-flat { display: flex; flex-direction: column; gap: 8px; }
        .cert-row-new { display: flex; align-items: center; gap: 14px; padding: 12px 16px; background: var(--bg-sunken,#15161c); border: 1px solid var(--border); border-left: 3px solid var(--border); border-radius: var(--r-lg,10px); transition: background var(--t-base); }
        .cert-row-new:hover { background: var(--bg-panel-2); }
        .cert-row-new.cert-soon { border-left-color: var(--status-amber,#f59e0b); }
        .cert-row-new.cert-exp  { border-left-color: var(--status-red,#ef4444); }
        .cert-row-new.cert-ok   { border-left-color: var(--status-green,#22c55e); }
        .cert-icon { flex-shrink: 0; display: flex; align-items: center; }
        .cert-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .cert-name-line { font-size: 14px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .cert-emp-label { font-size: 13px; color: var(--text-faint); font-weight: 400; }
        .cert-expiry { font-size: 12px; color: var(--text-faint); }
        .cert-status-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }
        /* ── Système sections ── */
        .sys-input-row { display: flex; gap: 8px; margin-bottom: 16px; }
        .sys-input-row input { flex: 1; background: var(--bg-sunken,#15161c); border: 1px solid var(--border); color: #fff; padding: 10px 14px; border-radius: var(--r-lg,10px); font-size: 14px; outline: none; font-family: inherit; transition: border-color var(--t-base); }
        .sys-input-row input:focus { border-color: var(--brand-yellow); }
        .sys-add-btn { display: flex; align-items: center; gap: 6px; padding: 10px 16px; border: none; border-radius: var(--r-lg,10px); font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; white-space: nowrap; flex-shrink: 0; transition: opacity 0.15s; }
        .sys-add-btn:hover { opacity: 0.85; }
        .sys-list { display: flex; flex-direction: column; gap: 8px; }
        .sys-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--bg-sunken,#15161c); border: 1px solid var(--border); border-radius: var(--r-lg,10px); transition: background var(--t-base); }
        .sys-item:hover { background: var(--bg-panel-2); }
        .sys-arrows { display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; }
        .sys-arrow-btn { background: var(--bg-panel-2); border: 1px solid var(--border); color: var(--text-faint); border-radius: 4px; width: 22px; height: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; font-size: 9px; transition: all 0.15s; line-height: 1; }
        .sys-arrow-btn:hover:not(:disabled) { color: #fff; border-color: var(--border-strong); }
        .sys-arrow-btn:disabled { opacity: 0.25; cursor: default; }
        .sys-item-icon { color: var(--text-faint); flex-shrink: 0; display: flex; align-items: center; }
        .sys-item-icon svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; }
        .sys-item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .sys-item-name { font-size: 14px; color: #fff; font-weight: 600; }
        .sys-item-sub  { font-size: 12px; color: var(--text-faint); font-style: italic; }
        .sys-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .sys-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .sys-chip { display: flex; align-items: center; gap: 6px; padding: 9px 12px; background: var(--bg-sunken,#15161c); border: 1px solid var(--border); border-radius: var(--r-lg,10px); transition: background var(--t-base); }
        .sys-chip:hover { background: var(--bg-panel-2); }
        .sys-chip-name { flex: 1; font-size: 13px; color: #fff; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        /* ── Tickets ── */
        .ticket-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; background: var(--bg-sunken,#15161c); border: 1px solid var(--border); border-radius: var(--r-lg,10px); transition: background var(--t-base); cursor: pointer; }
        .ticket-item:hover { background: var(--bg-panel-2); }
        .ticket-avatar { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; color: #fff; flex-shrink: 0; letter-spacing: 0.3px; }
        .ticket-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .ticket-title { font-size: 13px; font-weight: 600; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ticket-meta  { font-size: 11px; color: var(--text-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ticket-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }
        .ticket-badge.ouvert  { background: rgba(245,158,11,0.15); color: var(--status-amber,#f59e0b); }
        .ticket-badge.resolu  { background: rgba(34,197,94,0.15);  color: var(--status-green,#22c55e); }
        /* Modal ticket détail */
        .ticket-detail-msg { background: var(--bg-sunken,#15161c); border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; color: #e0e0e0; font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; margin: 14px 0; }
        @media (max-width: 768px) { .sys-grid-4 { grid-template-columns: repeat(2, minmax(0,1fr)); } .sys-grid-3 { grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 480px) { .sys-grid-4 { grid-template-columns: 1fr; } }
        .color-palette { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
        .color-swatch { width: 34px; height: 34px; border-radius: 50%; cursor: pointer; border: 3px solid transparent; transition: all 0.18s; flex-shrink: 0; outline: none; }
        .color-swatch.selected { border-color: #fff; transform: scale(1.15); box-shadow: 0 0 0 2px rgba(255,255,255,0.4); }
        .color-swatch.used { opacity: 0.22; cursor: not-allowed; }
        .color-swatch:not(.used):not(.selected):hover { transform: scale(1.12); border-color: rgba(255,255,255,0.5); }
        @media (min-width: 769px) and (max-width: 1024px) { .admin-main { padding: 20px; } }
        #adminMenuBtn { display: none; width: 36px; height: 36px; flex-shrink: 0; background: none; border: none; padding: 0; align-items: center; justify-content: center; color: var(--text-muted); cursor: pointer; }
        @media (max-width: 768px) { #adminMenuBtn { display: flex; } .admin-main { padding: 15px; } .dash-header { padding-right: 0; justify-content: flex-start; gap: 10px; } .tabs-container { margin-right: 0; } .settings-grid { grid-template-columns: 1fr; } .admin-danger-row { flex-direction: column; } .admin-danger-row .settings-card { min-width: 0 !important; flex: none !important; width: 100%; } }
    </style>

    <div class="admin-main view">
        <div class="dash-header">
            <button id="adminMenuBtn" aria-label="Menu">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div class="dash-title">
                <h1>Administration Système</h1>
                <p>Gestion des accès et de la sécurité</p>
            </div>
        </div>

        <div class="tabs-container">
            <button class="btn-tab active" data-tab="users">
                <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Personnel
            </button>
            <button class="btn-tab" data-tab="systeme">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Système
            </button>
            <button class="btn-tab" data-tab="email" id="tab-email" style="display:none">
                <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Boîte email
            </button>
            <button class="btn-tab" data-tab="maintenance" id="tab-dev" style="display:none">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Permissions & Système
            </button>
        </div>

        <!-- Section Personnel -->
        <div class="settings-grid admin-section active" id="sec-users">

            <div class="settings-card" style="border-left:3px solid var(--btn-orange);grid-column:1/-1" id="employeesPanel">
                <div class="card-header">
                    <div class="header-with-icon" style="--icon-color:var(--btn-orange)"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> <span id="personnelTitle">Gestion du personnel</span></div>
                    <button class="btn-add-small" id="btnOpenNewUser" style="background:var(--btn-orange);color:#fff">
                        <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                        Créer un profil
                    </button>
                </div>
                <div id="employeeList">
                    <div style="color:#888;font-style:italic;text-align:center;padding:20px">Chargement de l'équipe...</div>
                </div>
            </div>

            <div class="settings-card" style="border-left:3px solid var(--btn-green);grid-column:1/-1" id="certificationsPanel">
                <div class="card-header" style="--icon-color:var(--btn-green)">
                    <div class="header-with-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> Certifications du personnel</div>
                    <button class="btn-add-small" id="btnOpenAddFormation" style="background:var(--btn-green);color:white">
                        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Ajouter formation
                    </button>
                </div>
                <div class="cert-filter-bar">
                    <div class="cert-select-wrap">
                        <select id="certFilterEmp"><option value="">Tous les employés</option></select>
                        <svg class="sel-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                    <div class="cert-select-wrap">
                        <select id="certFilterStatus">
                            <option value="">Tous les statuts</option>
                            <option value="ok">À jour</option>
                            <option value="soon">Bientôt</option>
                            <option value="exp">Expirée</option>
                        </select>
                        <svg class="sel-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                </div>
                <div class="cert-list-flat" id="certificationsList">
                    <div style="color:#888;font-style:italic;text-align:center;padding:20px">Chargement…</div>
                </div>
            </div>

        </div>

        <!-- Section Système -->
        <div class="settings-grid admin-section" id="sec-systeme">

            <div class="settings-card" style="border-left:3px solid var(--btn-blue);grid-column:1/-1" id="suppliersPanel">
                <div class="card-header" style="--icon-color:var(--btn-blue)">
                    <div class="header-with-icon"><svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> Fournisseurs récurrents</div>
                </div>
                <p style="color:var(--text-faint);font-size:13px;margin:-4px 0 12px">Liste utilisée dans le menu déroulant lors de la création d'un Bon de Commande.</p>
                <div class="sys-input-row">
                    <input type="text" id="newSupplierInput" placeholder="Nom du fournisseur…">
                    <button class="sys-add-btn" id="btnAddSupplier" style="background:var(--btn-blue);color:white">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Ajouter
                    </button>
                </div>
                <div class="sys-list" id="suppliersList"><div style="color:#888;font-style:italic;text-align:center;padding:20px">Chargement…</div></div>
            </div>

            <div class="settings-card" style="border-left:3px solid #9b59b6;grid-column:1/-1" id="metiersPanel">
                <div class="card-header" style="--icon-color:#9b59b6">
                    <div class="header-with-icon"><svg viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> Métiers CCQ</div>
                </div>
                <p style="color:var(--text-faint);font-size:13px;margin:-4px 0 12px">Liste des métiers disponibles dans le profil de chaque employé.</p>
                <div class="sys-input-row">
                    <input type="text" id="newMetierInput" placeholder="Ex : Plombier — Apprenti…">
                    <button class="sys-add-btn" id="btnAddMetier" style="background:#9b59b6;color:white">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Ajouter
                    </button>
                </div>
                <div class="sys-grid-4" id="metiersList"><div style="color:#888;font-style:italic;text-align:center;padding:20px;grid-column:1/-1">Chargement…</div></div>
            </div>

            <div class="settings-card" style="border-left:3px solid #17a2b8;grid-column:1/-1" id="toolsPanel">
                <div class="card-header" style="--icon-color:#17a2b8">
                    <div class="header-with-icon"><svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> Outils — inventaire</div>
                </div>
                <p style="color:var(--text-faint);font-size:13px;margin:-4px 0 12px">Ajoute ici les outils que tu viens d'acheter. Ils apparaîtront dans le module Outils, prêts à être assignés.</p>
                <div class="sys-input-row">
                    <input type="text" id="newToolInput" placeholder="Nom de l'outil (ex : Perceuse Milwaukee)…">
                    <button class="sys-add-btn" id="btnAddTool" style="background:#17a2b8;color:white">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Ajouter
                    </button>
                </div>
                <div class="sys-list" id="toolsList"><div style="color:#888;font-style:italic;text-align:center;padding:20px">Chargement…</div></div>
            </div>

            <div class="settings-card" style="border-left:3px solid var(--brand-yellow);grid-column:1/-1" id="countersPanel">
                <div class="card-header" style="--icon-color:var(--brand-yellow)">
                    <div class="header-with-icon"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> Compteurs</div>
                </div>
                <p style="color:var(--text-faint);font-size:13px;margin:-4px 0 12px">État actuel de la numérotation des factures et des bons de commande.</p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div style="background:var(--bg-sunken,#15161c);border:1px solid var(--border);border-left:3px solid var(--brand-yellow);border-radius:var(--r-lg,10px);padding:16px">
                        <div style="color:var(--text-faint);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px">Dernière facture</div>
                        <div id="lastInvoiceNumber" style="color:var(--brand-yellow);font-size:26px;font-weight:800;font-family:monospace;letter-spacing:-0.5px">…</div>
                        <div id="nextInvoiceNumber" style="color:var(--text-faint);font-size:12px;margin-top:6px">Prochaine : …</div>
                    </div>
                    <div style="background:var(--bg-sunken,#15161c);border:1px solid var(--border);border-left:3px solid var(--status-green,#22c55e);border-radius:var(--r-lg,10px);padding:16px">
                        <div style="color:var(--text-faint);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px">Dernier PO</div>
                        <div id="lastPoNumber" style="color:var(--status-green,#22c55e);font-size:22px;font-weight:800;font-family:monospace;word-break:break-all">…</div>
                        <div id="totalPoCount" style="color:var(--text-faint);font-size:12px;margin-top:6px">Total : …</div>
                    </div>
                </div>
            </div>

            <div class="settings-card" style="border-left:3px solid var(--btn-orange);grid-column:1/-1" id="SupportPanel">
                <div class="card-header" style="--icon-color:var(--btn-orange)">
                    <div class="header-with-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="7" x2="12" y2="13"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/></svg> <span id="supportTitle">Tickets de support</span></div>
                </div>
                <div class="sys-list" id="supportTicketsList">
                    <div style="color:#888;font-style:italic;text-align:center;padding:20px">Aucun ticket.</div>
                </div>
            </div>

        </div>

        <!-- Section Boîte Email Externe (A0) -->
        <div class="settings-grid admin-section" id="sec-email" style="grid-template-columns:1fr">

            <div class="settings-card" style="border-left:3px solid var(--btn-blue)">
                <div class="card-header" style="--icon-color:var(--btn-blue)">
                    <div class="header-with-icon">
                        <svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:none;stroke-width:2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="19.5" y1="14.5" x2="22" y2="17"/><line x1="19.5" y1="19.5" x2="22" y2="17"/></svg>
                        Connexion boîte email externe
                    </div>
                </div>
                <p style="color:var(--text-faint);font-size:13px;margin:-4px 0 16px;line-height:1.5">
                    Connectez la boîte courriel de la compagnie pour que les vrais emails apparaissent dans l'onglet Courriel. Chaque employé avec accès verra les messages dans l'interface web.
                </p>

                <!-- Statut actuel -->
                <div id="emailProviderStatus" style="display:flex;align-items:center;gap:10px;padding:11px 14px;background:var(--bg-sunken,#15161c);border-radius:var(--r-lg,10px);border:1px solid var(--border);margin-bottom:18px">
                    <div style="width:9px;height:9px;border-radius:50%;background:#555;flex-shrink:0" id="emailStatusDot"></div>
                    <span style="color:var(--text-faint);font-size:13px" id="emailStatusText">Non connectée</span>
                </div>

                <!-- Formulaire de configuration -->
                <div style="display:flex;flex-direction:column;gap:14px">
                    <div>
                        <label style="display:block;font-size:11px;font-weight:700;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:7px">Type de fournisseur</label>
                        <select id="emailProviderType" style="width:100%;padding:11px 14px;background:var(--bg-sunken,#15161c);border:1px solid var(--border);color:#fff;border-radius:var(--r-lg,10px);outline:none;font-size:14px;font-family:inherit">
                            <option value="">— Choisir —</option>
                            <option value="gmail">Gmail / Google Workspace</option>
                            <option value="outlook">Outlook / Microsoft 365</option>
                            <option value="imap">IMAP / SMTP (autre)</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block;font-size:11px;font-weight:700;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:7px">Adresse email de la compagnie</label>
                        <input type="email" id="emailProviderAddress" placeholder="ex : info@fdussault.com" style="width:100%;padding:11px 14px;background:var(--bg-sunken,#15161c);border:1px solid var(--border);color:#fff;border-radius:var(--r-lg,10px);outline:none;font-size:14px;box-sizing:border-box;font-family:inherit">
                    </div>
                    <div id="imapFields" style="display:none;flex-direction:column;gap:10px">
                        <div>
                            <label style="display:block;font-size:11px;font-weight:700;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:7px">Serveur IMAP</label>
                            <input type="text" id="emailImapHost" placeholder="ex : mail.fdussault.com" style="width:100%;padding:11px 14px;background:var(--bg-sunken,#15161c);border:1px solid var(--border);color:#fff;border-radius:var(--r-lg,10px);outline:none;font-size:14px;box-sizing:border-box;font-family:inherit">
                        </div>
                        <div>
                            <label style="display:block;font-size:11px;font-weight:700;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:7px">Mot de passe / App Password</label>
                            <input type="password" id="emailImapPass" placeholder="••••••••" style="width:100%;padding:11px 14px;background:var(--bg-sunken,#15161c);border:1px solid var(--border);color:#fff;border-radius:var(--r-lg,10px);outline:none;font-size:14px;box-sizing:border-box;font-family:inherit">
                        </div>
                    </div>
                    <button id="btnConnectEmail" style="padding:11px 20px;background:var(--bg-panel-2,#1e1f28);color:var(--text-faint);border:1px solid var(--border);border-radius:var(--r-lg,10px);font-weight:600;font-size:13px;cursor:default;display:flex;align-items:center;justify-content:center;gap:8px;font-family:inherit" disabled>
                        <svg viewBox="0 0 24 24" style="width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2;flex-shrink:0"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                        Connecter — disponible prochainement
                    </button>
                </div>

                <div style="margin-top:16px;padding:13px 16px;background:rgba(59,130,246,0.06);border-left:3px solid var(--btn-blue);border-radius:var(--r-lg,10px);display:flex;gap:10px;align-items:flex-start">
                    <svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:var(--btn-blue);fill:none;stroke-width:2;flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="7" x2="12" y2="13"/><circle cx="12" cy="17" r="1" fill="var(--btn-blue)" stroke="none"/></svg>
                    <p style="color:var(--text-muted,#a0a0b0);font-size:12px;margin:0;line-height:1.6">
                        <strong style="color:var(--btn-blue)">Comment ça fonctionne :</strong> une fois connectée, une Edge Function Supabase récupère les nouveaux courriels toutes les 5 minutes et les stocke dans la table <code style="background:var(--bg-sunken);padding:1px 5px;border-radius:4px;font-size:11px">courriels</code>. Les employés avec accès les voient instantanément.
                    </p>
                </div>
            </div>

        </div>

        <!-- Section Maintenance (A0) -->
        <div class="settings-grid admin-section" id="sec-maintenance">

            <div class="settings-card" id="a0PermissionsPanel" style="border-color:var(--accent)">
                <div class="card-header" style="--icon-color:var(--accent);border-bottom:none;margin-bottom:0">
                    <div class="header-with-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    Rôles & Permissions Dynamiques</div>
                    <button class="btn-add-small" id="btnOpenNewRole" style="background:var(--btn-blue);color:white">
                        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Nouveau Rôle
                    </button>
                </div>
                <p style="color:#aaa;font-size:13px;margin-bottom:15px;line-height:1.4">Sélectionnez un rôle pour modifier ses accès globaux dans l'application.</p>
                <div style="display:flex;flex-direction:column;gap:14px">
                    <div class="perm-form-group">
                        <label>Rôle à modifier</label>
                        <select id="roleSelect" style="width:100%;padding:11px 14px;background:var(--bg-sunken,#15161c);border:1px solid var(--border);color:#fff;border-radius:var(--r-lg,10px);outline:none;font-size:14px;font-family:inherit;font-weight:600"></select>
                    </div>
                    <div class="perm-form-group">
                        <label>Nom d'affichage du rôle</label>
                        <input type="text" id="editRoleName" style="width:100%;padding:11px 14px;background:var(--bg-sunken,#15161c);border:1px solid var(--border);color:#fff;border-radius:var(--r-lg,10px);outline:none;font-size:14px;box-sizing:border-box;font-family:inherit">
                    </div>
                    <div class="perm-form-group">
                        <label>Couleur du badge</label>
                        <div id="editRoleColorPicker" style="display:flex;flex-wrap:wrap;gap:7px;align-items:center;margin-top:6px"></div>
                        <div style="font-size:11px;color:var(--text-faint);margin-top:6px">Le gris est partageable entre plusieurs rôles. Les autres couleurs sont exclusives.</div>
                    </div>
                    <div id="permissionsList" class="perm-grid"></div>
                    <button class="sys-add-btn" id="btnSavePermissions" style="background:var(--btn-green);color:white;justify-content:center;padding:13px;font-size:14px">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                        Enregistrer les modifications
                    </button>
                </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:20px">
                <div class="admin-danger-row" id="danger-zone-panel" style="display:flex;gap:20px;flex-wrap:wrap">
                    <div class="settings-card" style="flex:1;border-color:var(--btn-red);min-width:250px">
                        <div class="card-header" style="--icon-color:var(--btn-red);border-bottom:none;margin-bottom:0">
                            <div class="header-with-icon"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Mode Maintenance</div>
                        </div>
                        <p style="color:#aaa;font-size:13px;margin-bottom:15px;flex:1">Bloque l'accès à tous les utilisateurs (sauf A0).</p>
                        <button id="btnToggleMaintenance" style="width:100%;padding:12px;background:transparent;border:2px solid var(--btn-red);color:var(--btn-red);border-radius:8px;font-weight:bold;cursor:pointer;transition:0.2s">Activer le Mode Maintenance</button>
                    </div>
                    <div class="settings-card" style="flex:1;border-color:var(--btn-purple);min-width:250px">
                        <div class="card-header" style="--icon-color:var(--btn-purple);border-bottom:none;margin-bottom:0">
                            <div class="header-with-icon"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Identité (A0)</div>
                        </div>
                        <p style="color:#aaa;font-size:13px;margin-bottom:15px;flex:1">Nom utilisé lors de la publication d'annonces.</p>
                        <div style="display:flex;gap:10px">
                            <button id="btnAliasNom" style="flex:1;padding:10px;border-radius:8px;border:2px solid #555;background:transparent;color:#aaa;font-weight:bold;cursor:pointer">Mon Nom</button>
                            <button id="btnAliasSys" style="flex:1;padding:10px;border-radius:8px;border:2px solid #555;background:transparent;color:#aaa;font-weight:bold;cursor:pointer">Système</button>
                        </div>
                    </div>
                </div>

                <div class="settings-card" id="a0LogsPanel" style="border-left:3px solid var(--btn-blue)">
                    <div class="card-header" style="--icon-color:var(--btn-blue)">
                        <div class="header-with-icon">
                            <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                            Journal d'audit
                        </div>
                        <div style="display:flex;align-items:center;gap:8px">
                            <button id="btnExportLogs" class="btn-csv-desktop" style="display:flex;align-items:center;gap:6px;background:var(--bg-sunken,#15161c);border:1px solid var(--border);color:var(--text-faint);cursor:pointer;padding:6px 12px;border-radius:var(--r-lg,10px);font-size:12px;font-weight:700;font-family:inherit;transition:0.2s" title="Exporter en CSV">
                                <svg width="13" height="13" style="stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                CSV
                            </button>
                            <button id="btnExpandLogs" style="display:flex;align-items:center;justify-content:center;background:var(--bg-sunken,#15161c);border:1px solid var(--border);color:var(--text-faint);cursor:pointer;padding:6px 8px;border-radius:var(--r-lg,10px);transition:0.2s" title="Agrandir le journal">
                                <svg id="icon-expand-logs" width="15" height="15" style="stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                            </button>
                        </div>
                    </div>
                    <!-- Barre de recherche + filtres -->
                    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
                        <div style="display:flex;gap:8px;align-items:center">
                            <div style="position:relative;flex:1;min-width:0">
                                <svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none;stroke:var(--text-faint);fill:none;stroke-width:2" width="14" height="14" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                <input type="text" id="logSearch" placeholder="Rechercher…" style="width:100%;padding:8px 12px 8px 32px;background:var(--bg-sunken);border:1px solid var(--border);border-radius:var(--r-lg);color:var(--text-main);font-size:13px;font-family:inherit;outline:none;box-sizing:border-box">
                            </div>
                            <button id="btnDeleteLogsOpen" title="Supprimer des logs par période" style="display:flex;align-items:center;gap:6px;padding:8px 13px;background:transparent;border:1px solid rgba(239,68,68,0.4);color:#ef4444;border-radius:var(--r-lg);font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:0.2s">
                                <svg width="13" height="13" style="stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                Supprimer
                            </button>
                        </div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap">
                            <select id="logActionFilter" style="flex:1;min-width:110px;padding:7px 10px;background:var(--bg-sunken);border:1px solid var(--border);border-radius:var(--r-lg);color:var(--text-muted);font-size:13px;font-family:inherit;outline:none">
                                <option value="">Tous les types</option>
                            </select>
                            <select id="logUserFilter" style="flex:1;min-width:130px;padding:7px 10px;background:var(--bg-sunken);border:1px solid var(--border);border-radius:var(--r-lg);color:var(--text-muted);font-size:13px;font-family:inherit;outline:none">
                                <option value="">Tous les utilisateurs</option>
                            </select>
                            <select id="logDateFilter" style="flex:1;min-width:120px;padding:7px 10px;background:var(--bg-sunken);border:1px solid var(--border);border-radius:var(--r-lg);color:var(--text-muted);font-size:13px;font-family:inherit;outline:none">
                                <option value="">Toutes les dates</option>
                                <option value="today">Aujourd'hui</option>
                                <option value="week">7 derniers jours</option>
                                <option value="month">30 derniers jours</option>
                            </select>
                        </div>
                    </div>
                    <!-- Éléments cachés conservés pour compatibilité JS -->
                    <select id="logTableFilter" style="display:none"><option value=""></option></select>
                    <div style="max-height:400px;overflow-y:auto;overflow-x:auto;border-radius:var(--r-lg,10px);border:1px solid var(--border)">
                        <table class="logs-table" style="width:100%;border-collapse:collapse">
                            <thead>
                                <tr style="border-bottom:1px solid var(--border)">
                                    <th style="width:110px;padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.7px;text-align:left;background:var(--bg-sunken,#15161c);position:sticky;top:0;z-index:2">Date</th>
                                    <th style="width:130px;padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.7px;text-align:left;background:var(--bg-sunken,#15161c);position:sticky;top:0;z-index:2">Action</th>
                                    <th style="width:120px;padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.7px;text-align:left;background:var(--bg-sunken,#15161c);position:sticky;top:0;z-index:2">Utilisateur</th>
                                    <th style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.7px;text-align:left;background:var(--bg-sunken,#15161c);position:sticky;top:0;z-index:2">Détails</th>
                                </tr>
                            </thead>
                            <tbody id="logsTableBody"><tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-faint)">Chargement…</td></tr></tbody>
                        </table>
                    </div>
                    <div id="logsCountText" style="color:var(--text-faint);font-size:12px;margin-top:8px;text-align:right"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modales -->
    <div class="modal-overlay" id="newCustomRoleModal">
        <div class="modal-card-basic">
            <h2 style="color:var(--btn-blue);margin-top:0;margin-bottom:20px;border-bottom:1px solid #444;padding-bottom:10px">Nouveau Rôle</h2>
            <div class="form-group"><label>Identifiant du rôle</label><input type="text" id="customRoleId" placeholder="Ex: SUB_TRAITANT"></div>
            <div class="form-group"><label>Nom d'affichage</label><input type="text" id="customRoleName" placeholder="Ex: Sous-traitant externe"></div>
            <div class="form-group">
                <label>Couleur du rôle</label>
                <div class="color-palette" id="roleColorPalette"></div>
                <div id="roleColorError" style="color:var(--btn-red);font-size:12px;margin-top:6px;display:none">Veuillez choisir une couleur.</div>
            </div>
            <div class="modal-actions">
                <button class="btn-modal-gray" id="btnCloseNewRole">Annuler</button>
                <button class="btn-modal-green" style="flex:1" id="btnCreateRole">Créer le rôle</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="newUserModal">
        <div class="modal-card-basic">
            <h2 style="color:#ff9800;margin-top:0;margin-bottom:20px;border-bottom:1px solid #444;padding-bottom:10px">Nouveau Profil</h2>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div class="form-group" style="margin:0"><label>Prénom</label><input type="text" id="newUserPrenom" placeholder="Jean"></div>
                <div class="form-group" style="margin:0"><label>Nom de famille</label><input type="text" id="newUserNom" placeholder="Tremblay"></div>
            </div>
            <div class="form-group"><label>Rôle assigné</label><select id="newUserRole"></select></div>
            <div class="form-group"><label>Métier</label><select id="newUserMetier"><option value="">— Aucun —</option></select></div>
            <div class="form-group"><label>Courriel</label><input type="email" id="newUserEmail" placeholder="jean@entreprise.com"></div>
            <div class="form-group"><label>Téléphone</label><input type="tel" id="newUserPhone" placeholder="Ex: 514-527-2119"></div>
            <div class="form-group"><label>Mot de passe</label><input type="text" id="newUserPassword" placeholder="Min 6 caractères"></div>
            <div class="modal-actions">
                <button class="btn-modal-gray" id="btnCloseNewUser">Annuler</button>
                <button class="btn-modal-orange" style="flex:1" id="btnCreateUser">Créer le compte</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="editUserModal">
        <div class="modal-card-basic">
            <h2 style="color:var(--btn-blue);margin-top:0;margin-bottom:20px;border-bottom:1px solid #444;padding-bottom:10px">Modifier Profil</h2>
            <input type="hidden" id="editUserId">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div class="form-group" style="margin:0"><label>Prénom</label><input type="text" id="editUserPrenom" placeholder="Jean"></div>
                <div class="form-group" style="margin:0"><label>Nom de famille</label><input type="text" id="editUserNom" placeholder="Tremblay"></div>
            </div>
            <div class="form-group"><label>Rôle assigné</label><select id="editUserRole"></select></div>
            <div class="form-group"><label>Métier</label><select id="editUserMetier"><option value="">— Aucun —</option></select></div>
            <div class="form-group"><label>Courriel</label><input type="email" id="editUserEmail" placeholder="jean@entreprise.com"></div>
            <div class="form-group"><label>Téléphone</label><input type="tel" id="editUserPhone" placeholder="Ex: 514-527-2119"></div>
            <div class="modal-actions">
                <button class="btn-modal-gray" id="btnCloseEditUser">Annuler</button>
                <button class="btn-modal-green" style="flex:1" id="btnUpdateUser">Enregistrer</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="alertModal" style="z-index:5000">
        <div class="modal-card-basic">
            <h2 style="color:var(--accent);margin-top:0;margin-bottom:15px">Information</h2>
            <p id="alertMessageText" style="color:#fff;line-height:1.5;margin-bottom:20px"></p>
            <div class="modal-actions"><button class="btn-modal-gray" style="width:100%" id="btnCloseAlert">Fermer</button></div>
        </div>
    </div>

    <div class="modal-overlay" id="confirmAdminModal" style="z-index:5000">
        <div class="modal-card-basic">
            <div style="font-size:20px;color:var(--btn-red);font-weight:bold;margin-bottom:15px">Confirmation</div>
            <div style="color:#e0e0e0;margin-bottom:25px;line-height:1.4" id="confirmAdminMsg">Êtes-vous sûr ?</div>
            <div class="modal-actions">
                <button class="btn-modal-gray" id="btnCancelConfirmAdmin">Annuler</button>
                <button class="btn-modal-red" id="btnYesConfirmAdmin">Confirmer</button>
            </div>
        </div>
    </div>

    <!-- Modal détail ticket -->
    <div class="modal-overlay" id="ticketDetailModal">
        <div class="modal-card-basic" style="max-width:420px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;border-bottom:1px solid #444;padding-bottom:12px">
                <div id="ticketDetailAvatar" class="ticket-avatar" style="width:38px;height:38px;font-size:14px"></div>
                <div style="flex:1;min-width:0">
                    <div id="ticketDetailName" style="font-size:15px;font-weight:700;color:#fff"></div>
                    <div id="ticketDetailDate" style="font-size:11px;color:var(--text-faint);margin-top:2px"></div>
                </div>
                <span id="ticketDetailBadge" class="ticket-badge"></span>
            </div>
            <div id="ticketDetailMsg" class="ticket-detail-msg"></div>
            <div class="modal-actions">
                <button class="btn-modal-gray" id="btnCloseTicketDetail">Fermer</button>
                <button class="btn-modal-green" id="btnTicketRegle" style="display:none">Marquer Réglé</button>
                <button class="btn-modal-red" id="btnTicketDel" style="display:none">Supprimer</button>
            </div>
        </div>
    </div>

    <!-- Modal paramètres outil -->
    <div class="modal-overlay" id="toolSettingsModal">
        <div class="modal-card-basic" style="max-width:440px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;border-bottom:1px solid #444;padding-bottom:14px">
                <svg viewBox="0 0 24 24" width="22" height="22" style="stroke:var(--btn-green);fill:none;stroke-width:2;flex-shrink:0"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <h2 id="toolSettingsTitle" style="color:var(--btn-green);margin:0;font-size:18px;word-break:break-word;flex:1">Outil</h2>
            </div>

            <div class="tool-settings-section">
                <div class="tool-settings-label">Renommer</div>
                <div style="display:flex;gap:8px">
                    <input type="text" id="toolSettingsName" style="flex:1;padding:10px;background:#1a1b23;border:1px solid #444;color:white;border-radius:8px;font-size:15px;outline:none;box-sizing:border-box">
                    <button class="btn-modal-green" id="btnSaveToolName" style="white-space:nowrap;padding:10px 14px">Renommer</button>
                </div>
            </div>

            <div class="tool-settings-section">
                <div class="tool-settings-label">Note</div>
                <textarea id="toolSettingsNote" rows="3" style="width:100%;background:#1a1b23;border:1px solid #444;color:white;border-radius:8px;padding:10px;font-family:inherit;font-size:14px;resize:vertical;outline:none;box-sizing:border-box" placeholder="Remarques, état général, maintenances effectuées..."></textarea>
                <button class="btn-modal-gray" id="btnSaveToolNote" style="width:100%;margin-top:8px">Sauvegarder la note</button>
            </div>

            <div class="tool-settings-section">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                    <div class="tool-settings-label" style="margin:0">Utilisations (transferts)</div>
                    <button class="btn-modal-orange" id="btnResetUsage" style="font-size:12px;padding:6px 12px">⟳ Reset</button>
                </div>
                <div style="display:flex;align-items:baseline;gap:6px">
                    <span id="toolUsageCount" style="font-size:22px;font-weight:bold;color:white;line-height:1">0</span>
                    <span style="color:#666;font-size:13px">fois</span>
                </div>
                <div style="font-size:11px;color:#555;margin-top:4px">Le reset efface l'historique des transferts.</div>
            </div>

            <div class="tool-settings-section" style="border:none;margin-bottom:0;padding-bottom:0">
                <div class="tool-settings-label">Historique des transferts</div>
                <div id="toolHistoriqueList" style="max-height:140px;overflow-y:auto;display:flex;flex-direction:column;gap:4px"></div>
            </div>

            <div style="display:flex;gap:8px;margin-top:20px;padding-top:15px;border-top:1px solid #444">
                <button class="btn-modal-gray" id="btnToggleService" style="flex:1">Mettre hors service</button>
                <button class="btn-modal-red" id="btnDeleteToolFromSettings">Supprimer</button>
            </div>
            <button class="btn-modal-gray" id="btnCloseToolSettings" style="width:100%;margin-top:8px">Fermer</button>
        </div>
    </div>

    <!-- Modal édition fournisseur -->
    <div class="modal-overlay" id="supplierEditModal">
        <div class="modal-card-basic" style="max-width:380px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;border-bottom:1px solid #444;padding-bottom:14px">
                <svg viewBox="0 0 24 24" width="20" height="20" style="stroke:var(--btn-blue);fill:none;stroke-width:2;flex-shrink:0"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <h2 style="color:var(--btn-blue);margin:0;font-size:17px;flex:1">Modifier le fournisseur</h2>
            </div>
            <div class="form-group">
                <label>Nom</label>
                <input type="text" id="supplierEditInput" placeholder="Nom du fournisseur…">
            </div>
            <div style="display:flex;gap:8px;margin-top:20px;padding-top:15px;border-top:1px solid #444">
                <button class="btn-modal-red" id="btnDeleteSupplierFromModal">Supprimer</button>
                <div style="flex:1"></div>
                <button class="btn-modal-gray" id="btnCancelSupplierEdit">Annuler</button>
                <button class="btn-modal-green" id="btnSaveSupplierEdit">Enregistrer</button>
            </div>
        </div>
    </div>

    <!-- Modal édition métier -->
    <div class="modal-overlay" id="metierEditModal">
        <div class="modal-card-basic" style="max-width:380px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;border-bottom:1px solid #444;padding-bottom:14px">
                <svg viewBox="0 0 24 24" width="20" height="20" style="stroke:#9b59b6;fill:none;stroke-width:2;flex-shrink:0"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                <h2 style="color:#9b59b6;margin:0;font-size:17px;flex:1">Modifier le métier</h2>
            </div>
            <div class="form-group">
                <label>Nom</label>
                <input type="text" id="metierEditInput" placeholder="Nom du métier…">
            </div>
            <div style="display:flex;gap:8px;margin-top:20px;padding-top:15px;border-top:1px solid #444">
                <button class="btn-modal-red" id="btnDeleteMetierFromModal">Supprimer</button>
                <div style="flex:1"></div>
                <button class="btn-modal-gray" id="btnCancelMetierEdit">Annuler</button>
                <button class="btn-modal-green" id="btnSaveMetierEdit">Enregistrer</button>
            </div>
        </div>
    </div>

    <!-- Modal suppression logs par période -->
    <div class="modal-overlay" id="deleteLogsModal">
        <div class="modal-card-basic" style="max-width:380px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;border-bottom:1px solid #444;padding-bottom:14px">
                <span style="width:36px;height:36px;border-radius:50%;background:rgba(239,68,68,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <svg width="17" height="17" style="stroke:#ef4444;fill:none;stroke-width:2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </span>
                <div>
                    <div style="font-weight:700;font-size:15px;color:#fff">Supprimer des logs</div>
                    <div style="font-size:12px;color:var(--text-faint);margin-top:2px">Cette action est irréversible</div>
                </div>
            </div>
            <div class="form-group">
                <label>Supprimer les logs de plus de</label>
                <select id="deleteLogsPeriod" style="width:100%;padding:11px 12px;background:var(--bg-sunken);border:1px solid var(--border);border-radius:var(--r-lg);color:var(--text-main);font-size:14px;font-family:inherit;outline:none">
                    <option value="7">7 jours</option>
                    <option value="30" selected>30 jours</option>
                    <option value="90">3 mois</option>
                    <option value="180">6 mois</option>
                    <option value="365">1 an</option>
                    <option value="all">Tout supprimer (sans limite)</option>
                </select>
            </div>
            <div style="display:flex;gap:8px;margin-top:18px">
                <button id="btnDeleteLogsCancel" style="flex:1;padding:11px;background:var(--bg-sunken);border:1px solid var(--border);border-radius:var(--r-lg);color:var(--text-muted);font-size:14px;font-family:inherit;cursor:pointer">Annuler</button>
                <button id="btnDeleteLogsConfirm" style="flex:1;padding:11px;background:#ef4444;border:none;border-radius:var(--r-lg);color:#fff;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer">Supprimer</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="addFormationAdminModal">
        <div class="modal-card-basic">
            <h2 style="color:var(--btn-green);margin-top:0;margin-bottom:20px;border-bottom:1px solid #444;padding-bottom:10px">Ajouter une formation</h2>
            <div class="form-group"><label>Employé</label><select id="formAdminUserId"></select></div>
            <div class="form-group"><label>Nom de la formation / certification</label><input type="text" id="formAdminNom" placeholder="Ex: Secourisme, Travail en hauteur..."></div>
            <div class="form-group"><label>Date d'expiration (optionnel)</label><input type="date" id="formAdminDateExp" style="padding:18px 12px;font-size:16px;min-height:52px"></div>
            <div class="modal-actions">
                <button class="btn-modal-gray" id="btnCloseAddFormation">Annuler</button>
                <button class="btn-modal-green" style="flex:1" id="btnSaveFormationAdmin">Ajouter</button>
            </div>
        </div>
    </div>
    `

    await init()
}

// ── Init ────────────────────────────────────────────────────────────────────
async function init() {
    if (!currentUser) return

    // Vérification accès
    await loadRolesFromSupabase()
    const localHasPerm = currentRole === 'A0' || (roleDefinitions[currentRole]?.perms?.includes('view_admin'))
    if (!localHasPerm) {
        document.querySelector('.admin-main').innerHTML = "<h2 style='color:var(--btn-red);text-align:center;margin-top:50px'>Accès Refusé.</h2>"
        return
    }

    document.getElementById('adminMenuBtn')?.addEventListener('click', () => document.getElementById('topbar-mobile-menu-btn')?.click())

    // Tabs
    document.querySelectorAll('.btn-tab[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab, btn))
    })

    // Boutons header
    document.getElementById('btnOpenNewUser').addEventListener('click', openNewUserModal)

    // Modales
    document.getElementById('btnCloseNewUser').addEventListener('click', () => closeModal('newUserModal'))
    document.getElementById('btnCreateUser').addEventListener('click', creerEmploye)
    document.getElementById('btnCloseEditUser').addEventListener('click', () => closeModal('editUserModal'))
    document.getElementById('btnUpdateUser').addEventListener('click', updateEmploye)
    document.getElementById('btnCloseAlert').addEventListener('click', () => closeModal('alertModal'))
    document.getElementById('btnCancelConfirmAdmin').addEventListener('click', closeConfirmAdminModal)
    document.getElementById('btnYesConfirmAdmin').addEventListener('click', async () => {
        const btn = document.getElementById('btnYesConfirmAdmin')
        if (btn?.disabled) return
        if (btn) { btn.disabled = true; btn.style.opacity = '0.6' }
        try { if (confirmAdminCallback) await confirmAdminCallback() }
        finally { if (btn) { btn.disabled = false; btn.style.opacity = '' }; closeConfirmAdminModal() }
    })

    // Modal paramètres outil
    document.getElementById('btnCloseToolSettings').addEventListener('click', () => closeModal('toolSettingsModal'))
    document.getElementById('btnSaveToolName').addEventListener('click', saveToolName)
    document.getElementById('btnSaveToolNote').addEventListener('click', saveToolNote)
    document.getElementById('btnToggleService').addEventListener('click', toggleToolService)
    document.getElementById('btnResetUsage').addEventListener('click', resetToolUsage)
    document.getElementById('btnDeleteToolFromSettings').addEventListener('click', deleteToolFromSettings)

    // Modal édition fournisseur
    document.getElementById('btnCancelSupplierEdit').addEventListener('click', () => closeModal('supplierEditModal'))
    document.getElementById('btnSaveSupplierEdit').addEventListener('click', saveSupplierEdit)
    document.getElementById('btnDeleteSupplierFromModal').addEventListener('click', deleteSupplierFromModal)
    document.getElementById('supplierEditInput').addEventListener('keydown', e => { if (e.key === 'Enter') saveSupplierEdit() })

    // Modal édition métier
    document.getElementById('btnCancelMetierEdit').addEventListener('click', () => closeModal('metierEditModal'))
    document.getElementById('btnSaveMetierEdit').addEventListener('click', saveMetierEdit)
    document.getElementById('btnDeleteMetierFromModal').addEventListener('click', deleteMetierFromModal)
    document.getElementById('metierEditInput').addEventListener('keydown', e => { if (e.key === 'Enter') saveMetierEdit() })

    // Certifications modal
    document.getElementById('btnCloseAddFormation')?.addEventListener('click', () => closeModal('addFormationAdminModal'))
    document.getElementById('btnSaveFormationAdmin')?.addEventListener('click', saveFormationAdmin)

    // Fournisseurs
    document.getElementById('btnAddSupplier').addEventListener('click', addSupplier)
    document.getElementById('newSupplierInput').addEventListener('keydown', e => { if (e.key === 'Enter') addSupplier() })

    // Outils
    document.getElementById('btnAddTool').addEventListener('click', addTool)
    document.getElementById('newToolInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTool() })


    // A0 + A1 : onglets email + permissions (A1 sans maintenance ni identité)
    if (currentRole === 'A0' || currentRole === 'A1') {
        document.getElementById('tab-dev').style.display = 'flex'
        document.getElementById('tab-email').style.display = 'flex'
        document.getElementById('emailProviderType').addEventListener('change', e => {
            document.getElementById('imapFields').style.display = e.target.value === 'imap' ? 'flex' : 'none'
            const btn = document.getElementById('btnConnectEmail')
            if (e.target.value) { btn.disabled = false; btn.style.opacity = ''; btn.style.pointerEvents = '' }
            else { btn.disabled = true; btn.style.opacity = '0.5'; btn.style.pointerEvents = 'none' }
        })
        document.getElementById('btnOpenNewRole').addEventListener('click', openCustomRoleModal)
        document.getElementById('btnCloseNewRole').addEventListener('click', () => closeModal('newCustomRoleModal'))
        document.getElementById('btnCreateRole').addEventListener('click', createNewCustomRole)
        document.getElementById('roleSelect').addEventListener('change', loadRolePermissions)
        document.getElementById('btnSavePermissions').addEventListener('click', saveRolePermissions)
        document.getElementById('btnExportLogs').addEventListener('click', exportLogsCSV)
        document.getElementById('btnExpandLogs').addEventListener('click', toggleLogsExpand)
        document.getElementById('logSearch').addEventListener('input', filterLogs)
        document.getElementById('logActionFilter').addEventListener('change', filterLogs)
        document.getElementById('logTableFilter').addEventListener('change', filterLogs)
        document.getElementById('logUserFilter').addEventListener('change', filterLogs)
        document.getElementById('logDateFilter').addEventListener('change', filterLogs)
        document.getElementById('btnDeleteLogsOpen').addEventListener('click', openDeleteLogsModal)
        document.getElementById('btnDeleteLogsCancel').addEventListener('click', () => closeModal('deleteLogsModal'))
        document.getElementById('btnDeleteLogsConfirm').addEventListener('click', confirmDeleteLogs)
        document.getElementById('customRoleId').addEventListener('input', e => {
            e.target.value = e.target.value.toUpperCase().replace(/\s+/g, '_')
        })
        loadTechnicalLogs()
        loadArchivesExpiredCount()

        if (currentRole === 'A0') {
            // A0 uniquement : maintenance + identité
            document.getElementById('btnToggleMaintenance').addEventListener('click', toggleMaintenance)
            document.getElementById('btnAliasNom').addEventListener('click', () => setAlias('nom'))
            document.getElementById('btnAliasSys').addEventListener('click', () => setAlias('systeme'))
            initAliasUI()
            loadMaintenanceState()
        } else {
            // A1 : masquer mode maintenance et identité
            const dz = document.getElementById('danger-zone-panel')
            if (dz) dz.style.display = 'none'
        }
    }

    updateRoleSelects()
    loadRolePermissions()
    chargerListeEmployes()

    const realtimeChannel = supabase.getChannels().find(ch => ch.topic === 'realtime:admin-personnel-sync')
        ?? supabase.channel('admin-personnel-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profils' }, () => chargerListeEmployes())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'formations' }, () => {
                if (currentRole === 'A0' || currentRole === 'A1' || currentRole === 'A2') loadAllFormations()
            })
            .subscribe()

    if (hasPermission('manage_suppliers')) {
        loadSuppliers()
        loadAdminMetiers()
        document.getElementById('btnAddMetier').addEventListener('click', addMetier)
        document.getElementById('newMetierInput').addEventListener('keydown', e => { if (e.key === 'Enter') addMetier() })
    } else {
        const sp = document.getElementById('suppliersPanel')
        if (sp) sp.style.display = 'none'
        const mp = document.getElementById('metiersPanel')
        if (mp) mp.style.display = 'none'
    }

    if (currentRole === 'A0' || currentRole === 'A1') {
        loadTools()
        loadCounters()
        initSupportUI()
        loadAllFormations()
        document.getElementById('btnOpenAddFormation')?.addEventListener('click', openAddFormationModal)
    } else {
        // Cacher outils, compteurs et tickets pour tous sauf A0/A1
        ;['countersPanel', 'SupportPanel'].forEach(id => {
            const el = document.getElementById(id)
            if (el) el.style.display = 'none'
        })
        if (hasPermission('manage_tools')) {
            loadTools()
        } else {
            const tp = document.getElementById('toolsPanel')
            if (tp) tp.style.display = 'none'
        }
        if (currentRole === 'A2') {
            // A2 voit les certifications
            loadAllFormations()
            document.getElementById('btnOpenAddFormation')?.addEventListener('click', openAddFormationModal)
        } else {
            const cp = document.getElementById('certificationsPanel')
            if (cp) cp.style.display = 'none'
        }
        // Cacher l'onglet Système si rien n'est visible
        const tabSys = document.querySelector('[data-tab="systeme"]')
        if (tabSys && !hasPermission('manage_suppliers') && !hasPermission('manage_tools')) tabSys.style.display = 'none'
    }

    return function cleanup() {
        supabase.removeChannel(realtimeChannel)
    }
}

// ── Tabs ────────────────────────────────────────────────────────────────────
function switchTab(tabId, btn) {
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'))
    if (btn) btn.classList.add('active')
    const sec = document.getElementById('sec-' + tabId)
    if (sec) sec.classList.add('active')
}

// ── Rôles ───────────────────────────────────────────────────────────────────
async function loadRolesFromSupabase() {
    try {
        const { data } = await supabase.from('parametres_globaux').select('valeur').eq('cle', 'roles_config').maybeSingle()
        if (data?.valeur) roleDefinitions = JSON.parse(data.valeur)
        else roleDefinitions = { ...defaultRolesConfig }
        // Migration : ajouter/corriger les couleurs des rôles système
        const SYS_COLORS = { A0: '#3b82f6', A1: '#ef4444', A2: '#b45309', A3: '#22c55e' }
        const OLD_COLORS  = { A0: '#6366f1', A1: '#3b82f6' }
        let needsSave = false
        Object.entries(SYS_COLORS).forEach(([id, color]) => {
            if (!roleDefinitions[id]) return
            const cur = roleDefinitions[id].color
            if (!cur || OLD_COLORS[id] === cur) { roleDefinitions[id].color = color; needsSave = true }
        })
        if (needsSave) await saveRolesToSupabase()
    } catch { roleDefinitions = { ...defaultRolesConfig } }
}

async function saveRolesToSupabase() {
    await supabase.from('parametres_globaux').upsert({ cle: 'roles_config', valeur: JSON.stringify(roleDefinitions) }, { onConflict: 'cle' })
}

function updateRoleSelects() {
    const isA0 = currentRole === 'A0'
    ;['roleSelect', 'newUserRole', 'editUserRole'].forEach(sid => {
        const el = document.getElementById(sid)
        if (!el) return
        el.innerHTML = Object.entries(roleDefinitions)
            .filter(([id]) => id !== 'A0' || isA0)
            .map(([id, data]) => `<option value="${sanitize(id)}">${sanitize(data.name)}</option>`)
            .join('')
    })
}

function loadRolePermissions() {
    const roleId = document.getElementById('roleSelect')?.value
    if (!roleId) return
    const currentPerms = roleDefinitions[roleId]?.perms || []
    const nameEl = document.getElementById('editRoleName')
    if (nameEl) nameEl.value = roleDefinitions[roleId]?.name || roleId
    editRoleSelectedColor = roleDefinitions[roleId]?.color || '#6b7280'
    renderEditRoleColorPicker(roleId)
    const list = document.getElementById('permissionsList')
    if (!list) return
    const checkSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
    list.innerHTML = ''
    allPermissions.forEach(p => {
        const isChecked = currentPerms.includes(p.id)
        const card = document.createElement('label')
        card.className = `perm-card${isChecked ? ' checked' : ''}`
        card.innerHTML = `
            <input type="checkbox" class="perm-cb" value="${sanitize(p.id)}" ${isChecked ? 'checked' : ''} style="display:none">
            <span class="perm-card-check">${isChecked ? checkSvg : ''}</span>
            <span>${sanitize(p.label)}</span>
        `
        const inp = card.querySelector('input')
        const checkEl = card.querySelector('.perm-card-check')
        inp.addEventListener('change', e => {
            card.classList.toggle('checked', e.target.checked)
            checkEl.innerHTML = e.target.checked ? checkSvg : ''
        })
        list.appendChild(card)
    })
}

async function saveRolePermissions() {
    const roleId = document.getElementById('roleSelect')?.value
    if (!roleId || !roleDefinitions[roleId]) return
    roleDefinitions[roleId].name = document.getElementById('editRoleName')?.value.trim() || roleId
    roleDefinitions[roleId].color = editRoleSelectedColor
    roleDefinitions[roleId].perms = Array.from(document.querySelectorAll('.perm-cb:checked')).map(cb => cb.value)
    await saveRolesToSupabase()
    updateRoleSelects()
    document.getElementById('roleSelect').value = roleId
    showAlert('Permissions sauvegardées !')
    // Notifier le router que les permissions ont changé
    window.dispatchEvent(new CustomEvent('permissions_updated'))
}

function renderRoleColorPalette() {
    const container = document.getElementById('roleColorPalette')
    if (!container) return
    const usedColors = new Set(Object.values(roleDefinitions).map(r => r.color).filter(Boolean))
    container.innerHTML = ''
    ROLE_COLORS.forEach(c => {
        const isUsed = usedColors.has(c.hex)
        const isSelected = c.hex === selectedRoleColor
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = `color-swatch${isUsed ? ' used' : ''}${isSelected ? ' selected' : ''}`
        btn.style.background = c.hex
        btn.title = isUsed ? `${c.label} (déjà utilisée)` : c.label
        btn.dataset.color = c.hex
        if (!isUsed) {
            btn.addEventListener('click', () => { selectedRoleColor = c.hex; renderRoleColorPalette() })
        } else {
            btn.disabled = true
        }
        container.appendChild(btn)
    })
}

function renderEditRoleColorPicker(activeRoleId) {
    const container = document.getElementById('editRoleColorPicker')
    if (!container) return
    const GREY = '#6b7280'
    const usedColors = new Set(
        Object.entries(roleDefinitions)
            .filter(([id]) => id !== activeRoleId)
            .map(([, r]) => r.color)
            .filter(c => c && c !== GREY)
    )
    container.innerHTML = ''
    ROLE_COLORS.forEach(c => {
        const isGrey = c.hex === GREY
        const isUsed = !isGrey && usedColors.has(c.hex)
        const isSelected = editRoleSelectedColor === c.hex
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = `color-swatch${isUsed ? ' used' : ''}${isSelected ? ' selected' : ''}`
        btn.style.background = c.hex
        btn.title = isGrey ? `${c.label} — partageable` : isUsed ? `${c.label} (déjà utilisée)` : c.label
        if (!isUsed) {
            btn.addEventListener('click', () => { editRoleSelectedColor = c.hex; renderEditRoleColorPicker(activeRoleId) })
        } else {
            btn.disabled = true
        }
        container.appendChild(btn)
    })
}

function openCustomRoleModal() {
    const idEl = document.getElementById('customRoleId')
    const nameEl = document.getElementById('customRoleName')
    if (idEl) idEl.value = ''
    if (nameEl) nameEl.value = ''
    selectedRoleColor = ''
    const errEl = document.getElementById('roleColorError')
    if (errEl) errEl.style.display = 'none'
    renderRoleColorPalette()
    document.getElementById('newCustomRoleModal').classList.add('open')
}

async function createNewCustomRole() {
    const roleId   = document.getElementById('customRoleId')?.value.trim()
    const roleName = document.getElementById('customRoleName')?.value.trim()
    const errEl    = document.getElementById('roleColorError')
    if (!roleId || !roleName) return
    if (roleDefinitions[roleId] || roleId === 'A0') return
    if (!selectedRoleColor) {
        if (errEl) errEl.style.display = 'block'
        return
    }
    if (errEl) errEl.style.display = 'none'
    roleDefinitions[roleId] = { name: roleName, isSystem: false, color: selectedRoleColor, perms: [] }
    await saveRolesToSupabase()
    updateRoleSelects()
    const sel = document.getElementById('roleSelect')
    if (sel) sel.value = roleId
    loadRolePermissions()
    closeModal('newCustomRoleModal')
}

// ── Employés ────────────────────────────────────────────────────────────────
async function chargerListeEmployes() {
    const list = document.getElementById('employeeList')
    const { data: profils, error } = await supabase.from('profils').select('id,prenom,nom,prenom_nom,role,courriel,telephone,metier').order('role')
    if (error) { list.innerHTML = `<div style="color:var(--btn-red)">Erreur BD</div>`; return }

    if (currentRole !== 'A0' && profils?.length === 1) {
        list.innerHTML = `<div style="background:#3a2424;border:1px solid var(--btn-red);border-radius:8px;padding:14px;color:#ffb3b3;font-size:13px;line-height:1.5"><strong style="color:var(--btn-red)">Liste incomplète</strong><br>La politique de sécurité Supabase t'empêche de voir les autres collègues.</div>`
        return
    }

    const titleEl = document.getElementById('personnelTitle')
    if (titleEl) titleEl.textContent = `Gestion du personnel · ${profils.length}`

    list.innerHTML = ''
    profils.forEach(emp => {
        const item = document.createElement('div')
        item.className = 'emp-row'
        let btnEdit = '', btnDel = ''
        if (currentRole === 'A0' || (emp.role !== 'A0' && hasPermission('view_admin'))) {
            btnEdit = `<button class="btn-emp-edit" data-edit-id="${emp.id}" data-edit-prenom="${sanitize(emp.prenom || '')}" data-edit-nom="${sanitize(emp.nom || '')}" data-edit-name="${sanitize(emp.prenom_nom || '')}" data-edit-role="${emp.role}" data-edit-email="${sanitize(emp.courriel || '')}" data-edit-phone="${sanitize(emp.telephone || '')}" data-edit-metier="${sanitize(emp.metier || '')}" title="Éditer"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>`
        }
        if (emp.role !== 'A0' && (currentRole === 'A0' || currentRole === 'A1')) {
            btnDel = `<button class="btn-del-emp" data-del-id="${emp.id}" data-del-name="${sanitize(emp.prenom_nom || '')}"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>`
        }
        const avatarColor = getAvatarColor(emp.prenom_nom)
        const roleColor   = roleDefinitions[emp.role]?.color || '#6b7280'
        const r = parseInt(roleColor.slice(1,3), 16)
        const g = parseInt(roleColor.slice(3,5), 16)
        const b = parseInt(roleColor.slice(5,7), 16)
        const badgeStyle  = `background:rgba(${r},${g},${b},0.15);color:${roleColor}`
        const roleName    = (roleDefinitions[emp.role]?.name || emp.role).replace(' - ', ' · ')
        const initial     = avatarInitials(emp.prenom_nom)
        const contact     = [emp.courriel, emp.telephone].filter(Boolean).join(' · ')
        item.innerHTML = `
            <div class="emp-avatar">
                <div class="emp-avatar-circle" style="background:${avatarColor}">${sanitize(initial)}</div>
            </div>
            <div class="emp-info">
                <div class="emp-name-row">
                    <span class="emp-name">${sanitize(emp.prenom_nom || 'Sans nom')}</span>
                    <span class="emp-role-badge" style="${badgeStyle}">${sanitize(roleName)}</span>
                </div>
                ${contact ? `<div class="emp-contact">${sanitize(contact)}</div>` : ''}
            </div>
            <div class="emp-actions">${btnEdit}${btnDel}</div>
        `
        list.appendChild(item)
    })

    list.querySelectorAll('[data-edit-id]').forEach(btn => {
        btn.addEventListener('click', () => openEditUserModal(btn.dataset.editId, btn.dataset.editPrenom, btn.dataset.editNom, btn.dataset.editRole, btn.dataset.editEmail, btn.dataset.editPhone, btn.dataset.editMetier))
    })
    list.querySelectorAll('[data-del-id]').forEach(btn => {
        btn.addEventListener('click', () => deleteEmploye(btn.dataset.delId, btn.dataset.delName))
    })
}

async function peuplerMetierSelect(selectId, selectedValue = '') {
    const sel = document.getElementById(selectId)
    if (!sel) return
    let metiers = metiersData
    if (!metiers.length) {
        try {
            const { data } = await supabase.from('parametres_globaux').select('valeur').eq('cle', 'metiers_liste').maybeSingle()
            metiers = data?.valeur ? JSON.parse(data.valeur) : [...DEFAULT_METIERS]
        } catch { metiers = [...DEFAULT_METIERS] }
    }
    sel.innerHTML = '<option value="">— Aucun —</option>' +
        metiers.map(m => `<option value="${sanitize(m)}"${m === selectedValue ? ' selected' : ''}>${sanitize(m)}</option>`).join('')
}

function openNewUserModal() {
    document.getElementById('newUserPrenom').value = ''
    document.getElementById('newUserNom').value = ''
    document.getElementById('newUserEmail').value = ''
    document.getElementById('newUserPhone').value = ''
    document.getElementById('newUserPassword').value = ''
    peuplerMetierSelect('newUserMetier')
    document.getElementById('newUserModal').classList.add('open')
}

function openEditUserModal(id, prenom = '', nom = '', role, email = '', phone = '', metier = '') {
    document.getElementById('editUserId').value = id
    document.getElementById('editUserPrenom').value = prenom
    document.getElementById('editUserNom').value = nom
    document.getElementById('editUserEmail').value = email
    document.getElementById('editUserPhone').value = phone
    peuplerMetierSelect('editUserMetier', metier)
    const select = document.getElementById('editUserRole')
    const hasA0 = Array.from(select.options).some(o => o.value === 'A0')
    if (role === 'A0' && !hasA0 && roleDefinitions['A0']) {
        const opt = document.createElement('option')
        opt.value = 'A0'; opt.textContent = roleDefinitions['A0'].name || 'A0 - Développeur'
        select.insertBefore(opt, select.firstChild)
    }
    select.value = role
    select.disabled = role === 'A0'
    document.getElementById('editUserModal').classList.add('open')
}

async function updateEmploye() {
    const id        = document.getElementById('editUserId').value
    const prenom    = document.getElementById('editUserPrenom').value.trim()
    const nom       = document.getElementById('editUserNom').value.trim()
    const role      = document.getElementById('editUserRole').value
    const courriel  = document.getElementById('editUserEmail').value.trim()
    const telephone = document.getElementById('editUserPhone').value.trim()
    const metier    = document.getElementById('editUserMetier').value
    if (!prenom && !nom) return
    const prenom_nom = `${prenom} ${nom}`.trim()
    const updateData = { prenom, nom, prenom_nom, courriel, telephone, metier }
    if (role !== 'A0') updateData.role = role
    const { error } = await supabase.from('profils').update(updateData).eq('id', id)
    if (error) { showAlert(friendlyError(error)) } else { closeModal('editUserModal'); chargerListeEmployes() }
}

async function creerEmploye() {
    const prenom   = document.getElementById('newUserPrenom').value.trim()
    const nomVal   = document.getElementById('newUserNom').value.trim()
    const nom      = `${prenom} ${nomVal}`.trim()
    const metier   = document.getElementById('newUserMetier').value
    const role     = document.getElementById('newUserRole').value
    const email    = document.getElementById('newUserEmail').value.trim()
    const password = document.getElementById('newUserPassword').value
    if (!prenom || !nomVal || !email || !password || !role || role === 'A0') return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showAlert('L\'adresse courriel n\'est pas valide.'); return }
    if (password.length < 8) { showAlert('Le mot de passe doit contenir au moins 8 caractères.'); return }
    if (nom.length > 100) { showAlert('Le nom ne peut pas dépasser 100 caractères.'); return }

    const { createClient } = await import('@supabase/supabase-js')
    const tempSup = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY, { auth: { persistSession: false } })
    const { data: authData, error: authError } = await tempSup.auth.signUp({ email, password })
    if (authError) { showAlert(authError.message); return }
    if (!authData?.user) {
        showAlert('Compte créé — en attente de confirmation par courriel.')
        closeModal('newUserModal')
        return
    }
    const tel = document.getElementById('newUserPhone').value.trim()
    const { error: profileError } = await supabase.from('profils').insert([{ id: authData.user.id, role, prenom, nom: nomVal, prenom_nom: nom, courriel: email, telephone: tel, metier }])
    if (profileError) { showAlert('Compte auth créé mais profil non sauvegardé : ' + profileError.message); return }
    closeModal('newUserModal')
    chargerListeEmployes()
}

async function deleteEmploye(id, nom) {
    showConfirmAdmin(`Voulez-vous supprimer le compte de ${sanitize(nom)} ?`, async () => {
        const { error } = await supabase.from('profils').delete().eq('id', id)
        if (error) { showAlert(friendlyError(error)) } else { showAlert('Compte supprimé avec succès.'); chargerListeEmployes() }
    })
}

// ── Maintenance ─────────────────────────────────────────────────────────────
async function loadMaintenanceState() {
    const { data } = await supabase.from('parametres_globaux').select('valeur').eq('cle', 'mode_maintenance').maybeSingle()
    maintenanceActive = data?.valeur === 'true'
    updateMaintenanceBtn()
}

function updateMaintenanceBtn() {
    const btn = document.getElementById('btnToggleMaintenance')
    if (!btn) return
    if (maintenanceActive) {
        btn.textContent = 'Désactiver le Mode Maintenance'
        btn.style.background = 'rgba(40,167,69,0.1)'; btn.style.borderColor = 'var(--btn-green)'; btn.style.color = 'var(--btn-green)'
    } else {
        btn.textContent = 'Activer le Mode Maintenance'
        btn.style.background = 'transparent'; btn.style.borderColor = 'var(--btn-red)'; btn.style.color = 'var(--btn-red)'
    }
}

async function toggleMaintenance() {
    const btn = document.getElementById('btnToggleMaintenance')
    if (btn) { btn.disabled = true; btn.textContent = 'Sauvegarde...' }
    const newState = !maintenanceActive
    const { error } = await supabase.from('parametres_globaux').upsert({ cle: 'mode_maintenance', valeur: String(newState) }, { onConflict: 'cle' })
    if (error) { showAlert('❌ ' + friendlyError(error)); if (btn) { btn.disabled = false; updateMaintenanceBtn() }; return }
    maintenanceActive = newState
    if (btn) btn.disabled = false
    updateMaintenanceBtn()
    // Broadcast live vers index.html — tous les utilisateurs connectés voient le changement immédiatement
    window.dispatchEvent(new CustomEvent('toggle_maintenance', { detail: { active: maintenanceActive } }))
    showAlert(maintenanceActive ? 'Mode maintenance activé.' : 'Mode maintenance désactivé.')
}

// ── Alias ────────────────────────────────────────────────────────────────────
function initAliasUI() {
    const alias = localStorage.getItem('dussault_a0_alias') || 'nom'
    const btnSys = document.getElementById('btnAliasSys')
    const btnNom = document.getElementById('btnAliasNom')
    if (!btnSys || !btnNom) return
    if (alias === 'systeme') { btnSys.style.background = '#9b59b6'; btnSys.style.color = 'white' }
    else { btnNom.style.background = '#9b59b6'; btnNom.style.color = 'white' }
}

function setAlias(type) {
    localStorage.setItem('dussault_a0_alias', type)
    initAliasUI()
}

// ── Archives ─────────────────────────────────────────────────────────────────
async function loadArchivesExpiredCount() {
    const out = document.getElementById('archivesExpiredCount')
    if (!out) return
    try {
        const { data, error } = await supabase.rpc('count_archives_expired')
        if (error) throw error
        const total = (data || []).reduce((acc, r) => acc + Number(r.nb || 0), 0)
        if (total === 0) { out.innerHTML = "<span style='color:var(--btn-green)'>✓ Aucune archive expirée.</span>"; return }
        const detail = (data || []).filter(r => Number(r.nb) > 0).map(r => `${r.nb} ${r.table_name}`).join(', ')
        out.innerHTML = `<b style='color:#ff9800'>${total}</b> document(s) à supprimer (${detail}).`
    } catch (e) { out.textContent = 'Erreur : ' + (e.message || e) }
}

async function cleanExpiredArchives() {
    showConfirmAdmin("Supprimer DÉFINITIVEMENT toutes les archives de plus d'un an ? Cette action est irréversible.", async () => {
        const btn = document.getElementById('btnCleanArchives')
        if (btn) { btn.disabled = true; btn.textContent = 'Nettoyage...' }
        try {
            const { data, error } = await supabase.rpc('delete_expired_archives')
            if (error) throw error
            const total = (data || []).reduce((acc, r) => acc + Number(r.nb_deleted || 0), 0)
            showAlert('Nettoyage terminé : <b>' + total + '</b> document(s) supprimé(s).')
            await loadArchivesExpiredCount()
        } catch (e) { showAlert('❌ Erreur : ' + (e.message || e)) }
        finally { if (btn) { btn.disabled = false; btn.textContent = 'Nettoyer' } }
    })
}

// ── Support tickets ──────────────────────────────────────────────────────────
async function initSupportUI() {
    const container = document.getElementById('supportTicketsList')
    if (!container) return
    container.innerHTML = '<div style="color:var(--text-faint);font-style:italic;text-align:center;padding:20px">Chargement…</div>'
    const { data: tickets } = await supabase.from('tickets_support').select('id,created_at,author_nom,message,statut').order('created_at', { ascending: false })
    const titleEl = document.getElementById('supportTitle')
    if (!tickets?.length) {
        container.innerHTML = '<div style="color:var(--text-faint);font-style:italic;text-align:center;padding:20px">Aucun ticket.</div>'
        if (titleEl) titleEl.textContent = 'Tickets de support'
        return
    }
    const openCount = tickets.filter(t => t.statut !== 'resolu').length
    if (titleEl) titleEl.textContent = `Tickets de support${openCount ? ` (${openCount} ouvert${openCount > 1 ? 's' : ''})` : ''}`
    container.innerHTML = ''

    // Initialiser le modal ticket (une seule fois)
    const ticketModal = document.getElementById('ticketDetailModal')
    if (ticketModal && !ticketModal._ticketInit) {
        ticketModal._ticketInit = true
        document.getElementById('btnCloseTicketDetail').addEventListener('click', () => ticketModal.classList.remove('open'))
        ticketModal.addEventListener('click', e => { if (e.target === ticketModal) ticketModal.classList.remove('open') })
    }

    tickets.forEach(t => {
        const dateFmt = new Date(t.created_at).toLocaleString('fr-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        const name = t.author_nom || '?'
        const initials = avatarInitials(name)
        const avatarColor = getAvatarColor(name)
        const isOpen = t.statut !== 'resolu'
        const div = document.createElement('div')
        div.className = 'ticket-item'
        div.innerHTML = `
            <div class="ticket-avatar" style="background:${avatarColor}">${initials}</div>
            <div class="ticket-body">
                <div class="ticket-title">${sanitize(name)}</div>
                <div class="ticket-meta">${sanitize(t.message)}</div>
            </div>
            <span class="ticket-badge ${isOpen ? 'ouvert' : 'resolu'}">${isOpen ? 'Ouvert' : 'Résolu'}</span>
        `
        div.addEventListener('click', () => {
            if (!ticketModal) return
            document.getElementById('ticketDetailAvatar').textContent = initials
            document.getElementById('ticketDetailAvatar').style.background = avatarColor
            document.getElementById('ticketDetailName').textContent = name
            document.getElementById('ticketDetailDate').textContent = dateFmt
            const badge = document.getElementById('ticketDetailBadge')
            badge.textContent = isOpen ? 'Ouvert' : 'Résolu'
            badge.className = `ticket-badge ${isOpen ? 'ouvert' : 'resolu'}`
            document.getElementById('ticketDetailMsg').textContent = t.message

            const btnRegle = document.getElementById('btnTicketRegle')
            const btnDel = document.getElementById('btnTicketDel')
            btnRegle.style.display = isOpen ? '' : 'none'
            btnDel.style.display = isOpen ? 'none' : ''

            const newRegle = btnRegle.cloneNode(true)
            const newDel = btnDel.cloneNode(true)
            btnRegle.replaceWith(newRegle)
            btnDel.replaceWith(newDel)

            newRegle.addEventListener('click', async () => {
                const { error } = await supabase.from('tickets_support').update({ statut: 'resolu' }).eq('id', t.id)
                ticketModal.classList.remove('open')
                if (error) { showAlert('❌ ' + friendlyError(error)) } else { initSupportUI() }
            })
            newDel.addEventListener('click', () => {
                ticketModal.classList.remove('open')
                showConfirmAdmin('Supprimer ce ticket définitivement ?', async () => {
                    const { error } = await supabase.from('tickets_support').delete().eq('id', t.id)
                    if (error) { showAlert('❌ ' + friendlyError(error)) } else { initSupportUI() }
                })
            })
            ticketModal.classList.add('open')
        })
        container.appendChild(div)
    })
}

// ── Fournisseurs ─────────────────────────────────────────────────────────────
async function loadSuppliers() {
    try {
        const { data } = await supabase.from('parametres_globaux').select('valeur').eq('cle', 'fournisseurs_recurrents').maybeSingle()
        if (data?.valeur) {
            const parsed = JSON.parse(data.valeur)
            suppliersData = Array.isArray(parsed) ? parsed : [...DEFAULT_SUPPLIERS]
        } else {
            suppliersData = [...DEFAULT_SUPPLIERS]
            await saveSuppliers()
        }
    } catch { suppliersData = [...DEFAULT_SUPPLIERS] }
    renderSuppliers()
}

async function saveSuppliers() {
    const { error } = await supabase.from('parametres_globaux').upsert({ cle: 'fournisseurs_recurrents', valeur: JSON.stringify(suppliersData) }, { onConflict: 'cle' })
    if (error) { showAlert(friendlyError(error)); return false }
    return true
}

function renderSuppliers() {
    const list = document.getElementById('suppliersList')
    if (!list) return
    if (suppliersData.length === 0) { list.innerHTML = '<div style="color:var(--text-faint);font-style:italic;text-align:center;padding:20px">Aucun fournisseur.</div>'; return }
    const cartSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`
    const gearSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
    list.innerHTML = suppliersData.map((f, idx) => `
        <div class="sys-item">
            <div class="sys-arrows">
                <button class="sys-arrow-btn" data-sup-up="${idx}" ${idx === 0 ? 'disabled' : ''}>▲</button>
                <button class="sys-arrow-btn" data-sup-down="${idx}" ${idx === suppliersData.length - 1 ? 'disabled' : ''}>▼</button>
            </div>
            <div class="sys-item-body"><span class="sys-item-name">${sanitize(f)}</span></div>
            <button class="btn-gear-tool" data-sup-edit="${idx}" title="Modifier">${gearSvg}</button>
        </div>`).join('')

    list.querySelectorAll('[data-sup-up]').forEach(btn => btn.addEventListener('click', async () => {
        const i = parseInt(btn.dataset.supUp)
        if (i <= 0) return
        ;[suppliersData[i - 1], suppliersData[i]] = [suppliersData[i], suppliersData[i - 1]]
        renderSuppliers(); await saveSuppliers()
    }))
    list.querySelectorAll('[data-sup-down]').forEach(btn => btn.addEventListener('click', async () => {
        const i = parseInt(btn.dataset.supDown)
        if (i >= suppliersData.length - 1) return
        ;[suppliersData[i], suppliersData[i + 1]] = [suppliersData[i + 1], suppliersData[i]]
        renderSuppliers(); await saveSuppliers()
    }))
    list.querySelectorAll('[data-sup-edit]').forEach(btn => btn.addEventListener('click', () => {
        openSupplierEdit(parseInt(btn.dataset.supEdit))
    }))
}

async function addSupplier() {
    const inp = document.getElementById('newSupplierInput')
    const name = inp?.value.trim()
    if (!name) { showAlert('Veuillez entrer un nom de fournisseur.'); return }
    if (suppliersData.some(s => s.toLowerCase() === name.toLowerCase())) { showAlert('Ce fournisseur est déjà dans la liste.'); return }
    suppliersData.push(name)
    const ok = await saveSuppliers()
    if (ok) { if (inp) inp.value = ''; renderSuppliers() }
    else suppliersData.pop()
}

// ── Métiers ──────────────────────────────────────────────────────────────────
async function loadAdminMetiers() {
    try {
        const { data } = await supabase.from('parametres_globaux').select('valeur').eq('cle', 'metiers_liste').maybeSingle()
        if (data?.valeur) {
            const parsed = JSON.parse(data.valeur)
            metiersData = Array.isArray(parsed) ? parsed : [...DEFAULT_METIERS]
        } else {
            metiersData = [...DEFAULT_METIERS]
            await saveMetiers()
        }
    } catch { metiersData = [...DEFAULT_METIERS] }
    renderMetiers()
}

async function saveMetiers() {
    const { error } = await supabase.from('parametres_globaux').upsert({ cle: 'metiers_liste', valeur: JSON.stringify(metiersData) }, { onConflict: 'cle' })
    if (error) { showAlert(friendlyError(error)); return false }
    return true
}

function renderMetiers() {
    const list = document.getElementById('metiersList')
    if (!list) return
    if (metiersData.length === 0) { list.innerHTML = '<div style="color:var(--text-faint);font-style:italic;text-align:center;padding:20px;grid-column:1/-1">Aucun métier.</div>'; return }
    const gearSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
    list.innerHTML = metiersData.map((m, idx) => `
        <div class="sys-chip">
            <div class="sys-arrows">
                <button class="sys-arrow-btn" data-met-up="${idx}" ${idx === 0 ? 'disabled' : ''}>▲</button>
                <button class="sys-arrow-btn" data-met-down="${idx}" ${idx === metiersData.length - 1 ? 'disabled' : ''}>▼</button>
            </div>
            <span class="sys-chip-name" title="${sanitize(m)}">${sanitize(m)}</span>
            <button class="btn-gear-tool" style="width:28px;height:28px;flex-shrink:0" data-met-edit="${idx}" title="Modifier">${gearSvg}</button>
        </div>`).join('')

    list.querySelectorAll('[data-met-up]').forEach(btn => btn.addEventListener('click', async () => {
        const i = parseInt(btn.dataset.metUp)
        if (i <= 0) return
        ;[metiersData[i - 1], metiersData[i]] = [metiersData[i], metiersData[i - 1]]
        renderMetiers(); await saveMetiers()
    }))
    list.querySelectorAll('[data-met-down]').forEach(btn => btn.addEventListener('click', async () => {
        const i = parseInt(btn.dataset.metDown)
        if (i >= metiersData.length - 1) return
        ;[metiersData[i], metiersData[i + 1]] = [metiersData[i + 1], metiersData[i]]
        renderMetiers(); await saveMetiers()
    }))
    list.querySelectorAll('[data-met-edit]').forEach(btn => btn.addEventListener('click', () => {
        openMetierEdit(parseInt(btn.dataset.metEdit))
    }))
}

async function addMetier() {
    const inp = document.getElementById('newMetierInput')
    const name = inp?.value.trim()
    if (!name) { showAlert('Veuillez entrer un nom de métier.'); return }
    if (metiersData.some(m => m.toLowerCase() === name.toLowerCase())) { showAlert('Ce métier est déjà dans la liste.'); return }
    metiersData.push(name)
    const ok = await saveMetiers()
    if (ok) { if (inp) inp.value = ''; renderMetiers() }
    else metiersData.pop()
}

// ── Modal édition fournisseur ─────────────────────────────────────────────────
let currentSupplierEditIdx = -1

function openSupplierEdit(idx) {
    currentSupplierEditIdx = idx
    document.getElementById('supplierEditInput').value = suppliersData[idx] || ''
    document.getElementById('supplierEditModal').classList.add('open')
    setTimeout(() => document.getElementById('supplierEditInput').focus(), 80)
}

async function saveSupplierEdit() {
    const newName = document.getElementById('supplierEditInput').value.trim()
    if (!newName) { showAlert('Le nom ne peut pas être vide.'); return }
    if (suppliersData.some((s, i) => i !== currentSupplierEditIdx && s.toLowerCase() === newName.toLowerCase())) {
        showAlert('Ce fournisseur est déjà dans la liste.'); return
    }
    suppliersData[currentSupplierEditIdx] = newName
    const ok = await saveSuppliers()
    if (ok) { closeModal('supplierEditModal'); renderSuppliers() }
}

async function deleteSupplierFromModal() {
    const name = suppliersData[currentSupplierEditIdx]
    showConfirmAdmin(`Retirer "${name}" de la liste ?`, async () => {
        suppliersData.splice(currentSupplierEditIdx, 1)
        const ok = await saveSuppliers()
        if (ok) { closeModal('supplierEditModal'); renderSuppliers() }
        else suppliersData.splice(currentSupplierEditIdx, 0, name)
    })
}

// ── Modal édition métier ──────────────────────────────────────────────────────
let currentMetierEditIdx = -1

function openMetierEdit(idx) {
    currentMetierEditIdx = idx
    document.getElementById('metierEditInput').value = metiersData[idx] || ''
    document.getElementById('metierEditModal').classList.add('open')
    setTimeout(() => document.getElementById('metierEditInput').focus(), 80)
}

async function saveMetierEdit() {
    const newName = document.getElementById('metierEditInput').value.trim()
    if (!newName) { showAlert('Le nom ne peut pas être vide.'); return }
    if (metiersData.some((m, i) => i !== currentMetierEditIdx && m.toLowerCase() === newName.toLowerCase())) {
        showAlert('Ce métier est déjà dans la liste.'); return
    }
    metiersData[currentMetierEditIdx] = newName
    const ok = await saveMetiers()
    if (ok) { closeModal('metierEditModal'); renderMetiers() }
}

async function deleteMetierFromModal() {
    const name = metiersData[currentMetierEditIdx]
    showConfirmAdmin(`Retirer "${name}" de la liste ?`, async () => {
        metiersData.splice(currentMetierEditIdx, 1)
        const ok = await saveMetiers()
        if (ok) { closeModal('metierEditModal'); renderMetiers() }
        else metiersData.splice(currentMetierEditIdx, 0, name)
    })
}

// ── Outils ───────────────────────────────────────────────────────────────────
async function loadTools() {
    try {
        const { data } = await supabase.from('outils').select('id, nom, assignee_nom, status, created_at, position').order('position', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false })
        toolsListData = data || []
    } catch { toolsListData = [] }
    renderTools()
}

function renderTools() {
    const list = document.getElementById('toolsList')
    if (!list) return
    if (toolsListData.length === 0) { list.innerHTML = '<div style="color:var(--text-faint);font-style:italic;text-align:center;padding:20px">Aucun outil.</div>'; return }

    const byName = new Map()
    const priority = { 'active': 3, 'available': 2, 'returned': 1 }
    toolsListData.forEach(t => {
        const key = (t.nom || '').toLowerCase().trim()
        if (!key) return
        const existing = byName.get(key)
        if (!existing || (priority[t.status] || 0) > (priority[existing.status] || 0)) byName.set(key, t)
    })

    const uniqueTools = Array.from(byName.values()).sort((a, b) => {
        const pa = a.position ?? 999999, pb = b.position ?? 999999
        return pa !== pb ? pa - pb : (a.nom || '').localeCompare(b.nom || '', 'fr')
    })

    const wrenchSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`
    const gearSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`

    list.innerHTML = uniqueTools.map((t, idx) => {
        const isFirst = idx === 0, isLast = idx === uniqueTools.length - 1
        let statusSub
        if (t.status === 'hors_service') {
            statusSub = `<span class="sys-item-sub" style="color:var(--status-red,#ef4444);font-style:normal;font-weight:600">⚠ Hors service</span>`
        } else if (t.status === 'active' && t.assignee_nom) {
            statusSub = `<span class="sys-item-sub">→ ${sanitize(t.assignee_nom)}</span>`
        } else {
            statusSub = `<span class="sys-item-sub">Disponible</span>`
        }
        return `
        <div class="sys-item tool-item" data-tool-id="${sanitize(t.id)}" data-tool-name="${sanitize(t.nom || '')}"
             ${t.status === 'hors_service' ? 'style="border-color:rgba(239,68,68,0.3)"' : ''}>
            <div class="sys-arrows">
                <button class="sys-arrow-btn" data-tool-up="${idx}" ${isFirst ? 'disabled' : ''}>▲</button>
                <button class="sys-arrow-btn" data-tool-down="${idx}" ${isLast ? 'disabled' : ''}>▼</button>
            </div>
            <div class="sys-item-body">
                <span class="sys-item-name">${sanitize(t.nom || 'Sans nom')}</span>
                ${statusSub}
            </div>
            <button class="btn-gear-tool" data-tool-settings="${sanitize(t.id)}" title="Paramètres">${gearSvg}</button>
        </div>`
    }).join('')

    list.querySelectorAll('[data-tool-up]').forEach(btn => btn.addEventListener('click', async () => {
        const i = parseInt(btn.dataset.toolUp)
        const items = Array.from(list.querySelectorAll('.tool-item'))
        if (i <= 0 || i >= items.length) return
        list.insertBefore(items[i], items[i - 1])
        await saveToolsOrder(); renderTools()
    }))
    list.querySelectorAll('[data-tool-down]').forEach(btn => btn.addEventListener('click', async () => {
        const i = parseInt(btn.dataset.toolDown)
        const items = Array.from(list.querySelectorAll('.tool-item'))
        if (i >= items.length - 1) return
        list.insertBefore(items[i + 1], items[i])
        await saveToolsOrder(); renderTools()
    }))
    list.querySelectorAll('[data-tool-settings]').forEach(btn => btn.addEventListener('click', () => openToolSettings(btn.dataset.toolSettings)))
}

async function saveToolsOrder() {
    const list = document.getElementById('toolsList')
    if (!list) return
    const items = Array.from(list.querySelectorAll('.tool-item'))
    for (let i = 0; i < items.length; i++) {
        const name = (items[i].dataset.toolName || '').toLowerCase().trim()
        if (!name) continue
        await supabase.from('outils').update({ position: (i + 1) * 10 }).ilike('nom', name)
    }
    const { data } = await supabase.from('outils').select('id, nom, assignee_nom, status, created_at, position').order('position', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false })
    if (data) toolsListData = data
}

async function addTool() {
    const inp = document.getElementById('newToolInput')
    const name = inp?.value.trim()
    if (!name) { showAlert("Veuillez entrer un nom d'outil."); return }
    if (toolsListData.some(t => (t.nom || '').toLowerCase() === name.toLowerCase())) { showAlert('Un outil avec ce nom existe déjà.'); return }
    const maxPos = toolsListData.reduce((max, t) => { const p = t.position ?? 0; return p > max ? p : max }, 0)
    const { error } = await supabase.from('outils').insert([{ nom: name, status: 'available', position: maxPos + 10 }])
    if (error) { showAlert(friendlyError(error)); return }
    if (inp) inp.value = ''
    await loadTools()
}

async function removeTool(id, name) {
    showConfirmAdmin(`Retirer définitivement "${name}" de l'inventaire ?`, async () => {
        const { error } = await supabase.from('outils').delete().eq('nom', name)
        if (error) { showAlert(friendlyError(error)) } else { await loadTools() }
    })
}

async function openToolSettings(toolId) {
    currentToolSettingsId = toolId
    const { data: tool, error } = await supabase.from('outils').select('id,nom,notes,status,historique_transferts').eq('id', toolId).single()
    if (error || !tool) { showAlert('Outil introuvable.'); return }

    document.getElementById('toolSettingsTitle').textContent = tool.nom || 'Outil'
    document.getElementById('toolSettingsName').value = tool.nom || ''
    document.getElementById('toolSettingsNote').value = tool.notes || ''

    const hist = Array.isArray(tool.historique_transferts) ? tool.historique_transferts : []
    document.getElementById('toolUsageCount').textContent = hist.length

    const histList = document.getElementById('toolHistoriqueList')
    if (hist.length === 0) {
        histList.innerHTML = '<div style="color:#555;font-size:13px;font-style:italic;padding:8px 0">Aucun transfert enregistré.</div>'
    } else {
        histList.innerHTML = [...hist].reverse().map(h => {
            const nom = sanitize(h.to || h.nom || h.name || '?')
            const date = h.date ? new Date(h.date).toLocaleDateString('fr-CA') : ''
            return `<div class="tool-histo-item"><span>${nom}</span><span style="color:#555;font-size:11px">${date}</span></div>`
        }).join('')
    }

    const toggleBtn = document.getElementById('btnToggleService')
    if (tool.status === 'hors_service') {
        toggleBtn.textContent = '✓ Remettre en service'
        toggleBtn.className = 'btn-modal-green'
    } else {
        toggleBtn.textContent = 'Mettre hors service'
        toggleBtn.className = 'btn-modal-gray'
    }
    toggleBtn.style.flex = '1'

    document.getElementById('toolSettingsModal').classList.add('open')
}

async function saveToolName() {
    const newName = document.getElementById('toolSettingsName').value.trim()
    if (!newName) { showAlert('Le nom ne peut pas être vide.'); return }
    const { error } = await supabase.from('outils').update({ nom: newName }).eq('id', currentToolSettingsId)
    if (error) { showAlert(friendlyError(error)); return }
    document.getElementById('toolSettingsTitle').textContent = newName
    await loadTools()
    showAlert('✓ Nom modifié.')
}

async function saveToolNote() {
    const note = document.getElementById('toolSettingsNote').value
    const { error } = await supabase.from('outils').update({ notes: note }).eq('id', currentToolSettingsId)
    if (error) { showAlert(friendlyError(error)); return }
    showAlert('✓ Note sauvegardée.')
}

async function toggleToolService() {
    const { data: tool } = await supabase.from('outils').select('status').eq('id', currentToolSettingsId).single()
    if (!tool) return
    const newStatus = tool.status === 'hors_service' ? 'available' : 'hors_service'
    const { error } = await supabase.from('outils').update({ status: newStatus }).eq('id', currentToolSettingsId)
    if (error) { showAlert(friendlyError(error)); return }
    await loadTools()
    closeModal('toolSettingsModal')
}

async function resetToolUsage() {
    showConfirmAdmin("Réinitialiser le compteur ? L'historique des transferts sera effacé.", async () => {
        const { error } = await supabase.from('outils').update({ historique_transferts: [] }).eq('id', currentToolSettingsId)
        if (error) { showAlert(friendlyError(error)); return }
        document.getElementById('toolUsageCount').textContent = '0'
        document.getElementById('toolHistoriqueList').innerHTML = '<div style="color:#555;font-size:13px;font-style:italic;padding:8px 0">Aucun transfert enregistré.</div>'
    })
}

async function deleteToolFromSettings() {
    const name = document.getElementById('toolSettingsTitle').textContent
    showConfirmAdmin(`Retirer définitivement "${name}" de l'inventaire ?`, async () => {
        const { error } = await supabase.from('outils').delete().eq('id', currentToolSettingsId)
        if (error) { showAlert(friendlyError(error)); return }
        closeModal('toolSettingsModal')
        await loadTools()
    })
}

// ── Compteurs ─────────────────────────────────────────────────────────────────
async function loadCounters() {
    try {
        const { data: factures } = await supabase.from('factures').select('id').order('id', { ascending: false }).limit(50)
        const lastEl = document.getElementById('lastInvoiceNumber')
        const nextEl = document.getElementById('nextInvoiceNumber')
        if (lastEl && factures?.length) {
            let maxNum = 0
            factures.forEach(f => { const m = (f.id || '').match(/^F-(\d+)$/); if (m) { const n = parseInt(m[1], 10); if (n > maxNum) maxNum = n } })
            if (maxNum > 0) {
                lastEl.textContent = `F-${String(maxNum).padStart(4, '0')}`
                if (nextEl) nextEl.textContent = `Prochaine : F-${String(maxNum + 1).padStart(4, '0')}`
            } else {
                lastEl.textContent = 'Aucune'
                if (nextEl) nextEl.textContent = 'Prochaine : F-0001'
            }
        } else if (lastEl) {
            lastEl.textContent = 'Aucune'
            if (nextEl) nextEl.textContent = 'Prochaine : F-0001'
        }
    } catch { const el = document.getElementById('lastInvoiceNumber'); if (el) el.textContent = '—' }

    try {
        const { data: pos } = await supabase.from('bons_de_commande').select('numero, created_at').order('created_at', { ascending: false })
        const lastEl = document.getElementById('lastPoNumber')
        const totalEl = document.getElementById('totalPoCount')
        if (pos?.length) {
            if (lastEl) lastEl.textContent = pos[0].numero || '—'
            if (totalEl) totalEl.textContent = `Total : ${pos.length} PO créé(s)`
        } else {
            if (lastEl) lastEl.textContent = 'Aucun'
            if (totalEl) totalEl.textContent = 'Total : 0'
        }
    } catch { const el = document.getElementById('lastPoNumber'); if (el) el.textContent = '—' }
}

// ── Logs ─────────────────────────────────────────────────────────────────────
async function loadTechnicalLogs() {
    const tbody = document.getElementById('logsTableBody')
    const { data, error } = await supabase.from('logs_systeme').select('id,created_at,action,type_erreur,utilisateur_nom,user_id,table_name,doc_id,message').order('created_at', { ascending: false }).limit(500)
    if (error) { if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#ff4d4d">Erreur de chargement</td></tr>'; return }

    const actionColors = { creation: 'var(--btn-green)', modification: 'var(--btn-blue)', suppression: 'var(--btn-red)', archivage: 'var(--btn-orange)', restauration: 'var(--accent)', role_change: '#9b59b6', connexion: '#888', maintenance: '#9b59b6' }
    const actionLabels = { creation: 'Création', modification: 'Modification', suppression: 'Suppression', archivage: 'Archivage', restauration: 'Restauration', role_change: 'Rôle', connexion: 'Connexion', maintenance: 'Maintenance' }

    allLogs = (data || []).map(log => {
        const d = new Date(log.created_at || Date.now())
        const action = log.action || log.type_erreur || 'Info'
        return {
            date: d.toLocaleDateString() + ' ' + d.toLocaleTimeString(),
            rawDate: log.created_at,
            action, actionLabel: actionLabels[action] || action,
            user: log.utilisateur_nom || 'Système', userId: log.user_id || '',
            table: log.table_name || '', docId: log.doc_id || '',
            message: log.message || '',
            color: actionColors[action] || 'var(--btn-blue)'
        }
    })

    populateUserFilter(allLogs)
    populateLogActionFilter(allLogs)
    renderLogs(allLogs)
}

function populateLogActionFilter(logs) {
    const sel = document.getElementById('logActionFilter')
    if (!sel) return
    const current = sel.value
    const actionLabels = { creation: 'Création', modification: 'Modification', suppression: 'Suppression', archivage: 'Archivage', restauration: 'Restauration', role_change: 'Rôle', connexion: 'Connexion', maintenance: 'Maintenance' }
    const actions = [...new Set(logs.map(l => l.action).filter(Boolean))].sort()
    sel.innerHTML = '<option value="">Tous les types</option>' + actions.map(a => `<option value="${sanitize(a)}"${current === a ? ' selected' : ''}>${sanitize(actionLabels[a] || a)}</option>`).join('')
}

function populateUserFilter(logs) {
    const sel = document.getElementById('logUserFilter')
    if (!sel) return
    const current = sel.value
    const users = [...new Set(logs.map(l => l.user).filter(u => u && u !== 'Système'))].sort()
    sel.innerHTML = '<option value="">Tous utilisateurs</option>' + users.map(u => `<option value="${sanitize(u)}">${sanitize(u)}</option>`).join('')
    if (current && users.includes(current)) sel.value = current
}

function formatLogDate(rawDate) {
    if (!rawDate) return '—'
    const d = new Date(rawDate)
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const hm = d.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
    if (d >= todayStart) return hm
    if (d >= yesterdayStart) return `Hier ${hm}`
    const day = d.getDate()
    const month = d.toLocaleDateString('fr-CA', { month: 'short' })
    if (d.getFullYear() === now.getFullYear()) return `${day} ${month} ${hm}`
    return `${day} ${month} ${d.getFullYear()}`
}

function getLogBadgeStyle(action, color) {
    const bg = { creation: 'rgba(34,197,94,0.15)', modification: 'rgba(59,130,246,0.15)', suppression: 'rgba(239,68,68,0.15)', archivage: 'rgba(249,115,22,0.15)', role_change: 'rgba(168,85,247,0.15)', connexion: 'rgba(107,114,128,0.15)', maintenance: 'rgba(168,85,247,0.15)' }
    return `background:${bg[action] || 'rgba(59,130,246,0.15)'};color:${color}`
}

function renderLogs(data) {
    const tbody = document.getElementById('logsTableBody')
    if (!tbody) return
    const rowStyle = 'border-bottom:1px solid var(--border)'
    const tdBase = 'padding:10px 14px;font-size:13px;vertical-align:middle'
    tbody.innerHTML = data.length === 0
        ? `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-faint)">Aucun résultat</td></tr>`
        : data.map(log => `<tr style="${rowStyle}">
            <td style="${tdBase};color:var(--text-faint);font-size:12px;white-space:nowrap">${formatLogDate(log.rawDate)}</td>
            <td style="${tdBase}"><span class="log-badge" style="${getLogBadgeStyle(log.action, log.color)}">${sanitize(log.actionLabel)}</span></td>
            <td style="${tdBase};color:#ddd;font-size:13px">${sanitize(log.user)}</td>
            <td style="${tdBase};color:var(--text-muted,#a0a0b0);font-size:13px">${sanitize(log.message)}</td>
        </tr>`).join('')
    const countText = document.getElementById('logsCountText')
    if (countText) countText.textContent = `${data.length} entrée(s) affichée(s) — total ${allLogs.length} chargée(s)`
}

function getDateFilterStart(fDate) {
    if (!fDate) return null
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (fDate === 'week') start.setDate(start.getDate() - 7)
    else if (fDate === 'month') start.setMonth(start.getMonth() - 1)
    return start
}

function filterLogs() {
    const q = (document.getElementById('logSearch')?.value || '').toLowerCase()
    const fAction = document.getElementById('logActionFilter')?.value || ''
    const fTable = document.getElementById('logTableFilter')?.value || ''
    const fUser = document.getElementById('logUserFilter')?.value || ''
    const fDate = document.getElementById('logDateFilter')?.value || ''
    const dateStart = getDateFilterStart(fDate)
    const filtered = allLogs.filter(l => {
        if (fAction && l.action !== fAction) return false
        if (fTable && l.table !== fTable) return false
        if (fUser && l.user !== fUser) return false
        if (q && !(l.message + ' ' + l.user + ' ' + l.table + ' ' + l.docId).toLowerCase().includes(q)) return false
        if (dateStart && l.rawDate && new Date(l.rawDate) < dateStart) return false
        return true
    })
    renderLogs(filtered)
}

// ── Expand/Réduire panel logs ────────────────────────────────────────────────
function toggleLogsExpand() {
    const panel = document.getElementById('a0LogsPanel')
    const icon = document.getElementById('icon-expand-logs')
    const isExpanded = panel.classList.contains('expanded-logs-panel')
    if (isExpanded) {
        panel.classList.remove('expanded-logs-panel')
        // Icône maximize
        icon.innerHTML = '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>'
        window.dispatchEvent(new CustomEvent('toggle_menu', { detail: { action: 'show' } }))
    } else {
        panel.classList.add('expanded-logs-panel')
        // Icône minimize
        icon.innerHTML = '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>'
        window.dispatchEvent(new CustomEvent('toggle_menu', { detail: { action: 'hide' } }))
    }
}

function exportLogsCSV() {
    const q = (document.getElementById('logSearch')?.value || '').toLowerCase()
    const fAction = document.getElementById('logActionFilter')?.value || ''
    const fTable = document.getElementById('logTableFilter')?.value || ''
    const fUser = document.getElementById('logUserFilter')?.value || ''
    const fDate = document.getElementById('logDateFilter')?.value || ''
    const dateStart = getDateFilterStart(fDate)
    const filtered = allLogs.filter(l => {
        if (fAction && l.action !== fAction) return false
        if (fTable && l.table !== fTable) return false
        if (fUser && l.user !== fUser) return false
        if (q && !(l.message + ' ' + l.user + ' ' + l.table + ' ' + l.docId).toLowerCase().includes(q)) return false
        if (dateStart && l.rawDate && new Date(l.rawDate) < dateStart) return false
        return true
    })
    const esc = s => '"' + String(s ?? '').replace(/"/g, '""') + '"'
    const header = ['Date', 'Action', 'Utilisateur', 'Table', 'Doc ID', 'Message']
    const rows = filtered.map(l => [l.rawDate || l.date, l.actionLabel, l.user, l.table, l.docId, l.message])
    const csv = '\uFEFF' + [header, ...rows].map(r => r.map(esc).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `journal_audit_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function openDeleteLogsModal() {
    document.getElementById('deleteLogsPeriod').value = '30'
    document.getElementById('deleteLogsModal').classList.add('open')
}

async function confirmDeleteLogs() {
    const sel = document.getElementById('deleteLogsPeriod')
    const period = sel?.value || '30'
    const label = period === 'all'
        ? 'TOUS les logs (sans limite de date)'
        : `les logs de plus de ${sel.options[sel.selectedIndex].text}`
    closeModal('deleteLogsModal')
    showConfirmAdmin(`Supprimer définitivement ${label} ? Cette action est irréversible.`, async () => {
        let query = supabase.from('logs_systeme').delete()
        if (period === 'all') {
            query = query.not('id', 'is', null)
        } else {
            const cutoff = new Date()
            cutoff.setDate(cutoff.getDate() - parseInt(period))
            query = query.lt('created_at', cutoff.toISOString())
        }
        const { error } = await query
        if (error) { showAlert(friendlyError(error)); return }
        showAlert('Logs supprimés avec succès.')
        await loadTechnicalLogs()
    })
}

async function loadLogsExpiredCount() {
    const out = document.getElementById('logsExpiredCount')
    const btn = document.getElementById('btnCleanLogs')
    if (!out) return
    try {
        const { data, error } = await supabase.rpc('count_logs_expired')
        if (error) { out.innerHTML = '<span style="color:#888;font-style:italic">Fonction non disponible</span>'; if (btn) { btn.disabled = true; btn.style.opacity = '0.5' }; return }
        const n = Number(data || 0)
        if (n === 0) { out.innerHTML = '<span style="color:var(--btn-green)">✓ Aucun log expiré</span>'; if (btn) { btn.disabled = true; btn.style.opacity = '0.5' } }
        else { out.innerHTML = `<b style="color:var(--btn-purple)">${n}</b> log(s) datent de plus d'un an.`; if (btn) { btn.disabled = false; btn.style.opacity = '1' } }
    } catch { out.textContent = 'Erreur de chargement' }
}

async function cleanExpiredLogs() {
    showConfirmAdmin("Supprimer DÉFINITIVEMENT tous les logs de plus d'un an ? Cette action est irréversible.", async () => {
        const { data, error } = await supabase.rpc('delete_expired_logs')
        if (error) { showAlert(friendlyError(error)); return }
        showAlert(`${Number(data || 0)} log(s) supprimé(s) avec succès.`)
        await loadLogsExpiredCount(); await loadTechnicalLogs()
    })
}

// ── Certifications ──────────────────────────────────────────────────────────
async function loadAllFormations() {
    const container = document.getElementById('certificationsList')
    if (!container) return
    try {
        const [formRes, profRes] = await Promise.all([
            supabase.from('formations').select('id,user_id,nom,date_expiration').order('date_expiration', { ascending: true, nullsFirst: false }),
            supabase.from('profils').select('id,prenom_nom').order('prenom_nom')
        ])
        const profils = profRes.data || []
        const profMap = {}
        profils.forEach(p => { profMap[p.id] = p.prenom_nom })
        allFormationsData = (formRes.data || []).map(f => ({ ...f, prenom_nom: profMap[f.user_id] || 'Inconnu' }))

        const empSel = document.getElementById('certFilterEmp')
        if (empSel) {
            const prev = empSel.value
            empSel.innerHTML = '<option value="">Tous les employés</option>' +
                profils.filter(p => p.prenom_nom).map(p => `<option value="${p.id}">${sanitize(p.prenom_nom)}</option>`).join('')
            if (prev) empSel.value = prev
            empSel.onchange = () => renderAllFormations(container)
        }
        const statusSel = document.getElementById('certFilterStatus')
        if (statusSel) statusSel.onchange = () => renderAllFormations(container)

        renderAllFormations(container)
    } catch (e) {
        container.innerHTML = `<div style="color:var(--btn-red)">Erreur : ${sanitize(e.message)}</div>`
    }
}

function renderAllFormations(container) {
    if (!container) return
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const MOIS = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.']

    const empFilter    = document.getElementById('certFilterEmp')?.value    || ''
    const statusFilter = document.getElementById('certFilterStatus')?.value || ''

    let data = allFormationsData
    if (empFilter) data = data.filter(f => f.user_id === empFilter)

    data = data.map(f => {
        let statusClass = '', statusText = 'À jour', iconColor = 'var(--text-faint)', expiryText = ''
        if (f.date_expiration) {
            const exp = new Date(f.date_expiration); exp.setHours(0, 0, 0, 0)
            const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24))
            const dp = f.date_expiration.split('-')
            const dateStr = dp.length === 3 ? `${parseInt(dp[2])} ${MOIS[parseInt(dp[1])-1]} ${dp[0]}` : f.date_expiration
            if (diff < 0)        { statusClass = 'cert-exp';  statusText = 'Expirée'; iconColor = 'var(--status-red,#ef4444)';    expiryText = `Expirée le ${dateStr}` }
            else if (diff <= 30) { statusClass = 'cert-soon'; statusText = 'Bientôt'; iconColor = 'var(--status-amber,#f59e0b)'; expiryText = `Expire ${dateStr}` }
            else                 { statusClass = 'cert-ok';   statusText = 'À jour';  iconColor = 'var(--status-green,#22c55e)'; expiryText = `Expire ${dateStr}` }
        }
        return { ...f, statusClass, statusText, iconColor, expiryText }
    })

    if (statusFilter) data = data.filter(f => f.statusClass === `cert-${statusFilter}`)


    if (!data.length) {
        container.innerHTML = '<div style="color:#888;font-style:italic;text-align:center;padding:20px">Aucune certification trouvée.</div>'
        return
    }

    container.innerHTML = ''
    data.forEach(f => {
        const badgeStyle = f.statusClass === 'cert-exp'  ? 'background:rgba(239,68,68,0.15);color:var(--status-red,#ef4444)'
                         : f.statusClass === 'cert-soon' ? 'background:rgba(245,158,11,0.15);color:var(--status-amber,#f59e0b)'
                         : f.statusClass === 'cert-ok'   ? 'background:rgba(34,197,94,0.15);color:var(--status-green,#22c55e)'
                         : 'background:rgba(107,114,128,0.15);color:#6b7280'
        const row = document.createElement('div')
        row.className = `cert-row-new ${f.statusClass}`
        row.innerHTML = `
            <div class="cert-icon" style="color:${f.iconColor}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
            </div>
            <div class="cert-info">
                <div class="cert-name-line">
                    <span>${sanitize(f.nom)}</span>
                    <span class="cert-emp-label">· ${sanitize(f.prenom_nom)}</span>
                </div>
                ${f.expiryText ? `<div class="cert-expiry">${sanitize(f.expiryText)}</div>` : ''}
            </div>
            <span class="cert-status-badge" style="${badgeStyle}">${f.statusText}</span>
            <button class="btn-del-emp" data-cert-del="${f.id}" title="Supprimer"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        `
        container.appendChild(row)
    })

    container.querySelectorAll('[data-cert-del]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.certDel
            const item = allFormationsData.find(f => String(f.id) === String(id))
            showConfirmAdmin(`Supprimer "${sanitize(item?.nom || '')}" ?`, async () => {
                const { error } = await supabase.from('formations').delete().eq('id', id)
                if (error) showAlert(friendlyError(error))
                else loadAllFormations()
            })
        })
    })
}

async function openAddFormationModal() {
    const sel = document.getElementById('formAdminUserId')
    if (!sel) return
    const { data } = await supabase.from('profils').select('id,prenom_nom').order('prenom_nom')
    sel.innerHTML = (data || []).filter(p => p.prenom_nom).map(p => `<option value="${sanitize(p.id)}">${sanitize(p.prenom_nom)}</option>`).join('')
    const nomEl = document.getElementById('formAdminNom')
    const dateEl = document.getElementById('formAdminDateExp')
    if (nomEl) nomEl.value = ''
    if (dateEl) dateEl.value = ''
    document.getElementById('addFormationAdminModal')?.classList.add('open')
}

async function saveFormationAdmin() {
    const userId = document.getElementById('formAdminUserId')?.value
    const nom = document.getElementById('formAdminNom')?.value.trim()
    const dateExp = document.getElementById('formAdminDateExp')?.value || null
    if (!userId || !nom) { showAlert('Veuillez sélectionner un employé et entrer un nom de formation.'); return }
    const payload = { user_id: userId, nom }
    if (dateExp) payload.date_expiration = dateExp
    const { error } = await supabase.from('formations').insert([payload])
    if (error) { showAlert(friendlyError(error)); return }
    closeModal('addFormationAdminModal')
    await loadAllFormations()
}

// ── Utilitaires ─────────────────────────────────────────────────────────────
function showAlert(msg) {
    const el = document.getElementById('alertMessageText')
    if (el) el.innerHTML = msg
    document.getElementById('alertModal')?.classList.add('open')
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('open')
}

function showConfirmAdmin(msg, callback) {
    const el = document.getElementById('confirmAdminMsg')
    if (el) el.innerHTML = msg
    confirmAdminCallback = callback
    document.getElementById('confirmAdminModal')?.classList.add('open')
}

function closeConfirmAdminModal() {
    closeModal('confirmAdminModal')
    confirmAdminCallback = null
}
