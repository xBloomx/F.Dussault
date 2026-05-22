// src/views/admin.js
// Migré fidèlement depuis code_admin/code_admin.html

import { supabase } from '../supabase.js'
import { currentUser, currentRole, hasPermission } from '../auth.js'
import { sanitize } from '../shared/sanitize.js'
import { friendlyError } from '../shared/errorMsg.js'

// ── État local ──────────────────────────────────────────────────────────────
let allLogs = []
let roleDefinitions = {}
let suppliersData = []
let toolsListData = []
let currentToolSettingsId = null
let maintenanceActive = false
let confirmAdminCallback = null
let allFormationsData = []

const DEFAULT_SUPPLIERS = ['Deschênes', 'Wolseley', 'Plomberie Provinciale']

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
    { id: 'transfer_tools',        label: "Transfert d'outils (Terrain)",         desc: 'Transférer un outil entre employés.' },
    { id: 'create_clients',        label: 'Créer un nouveau client',              desc: 'Autorise la création de fiches clients.' },
    { id: 'delete_clients',        label: 'Supprimer un client',                  desc: 'Autorise la suppression de clients.' },
    { id: 'manage_calendar',       label: 'Gérer le calendrier global',           desc: 'Créer, modifier ou supprimer des événements partagés.' },
    { id: 'manage_news',           label: 'Publier des annonces',                 desc: 'Afficher des notes sur le tableau de bord.' },
    { id: 'view_admin',            label: "Accès panneau d'administration",       desc: 'Création de comptes et nettoyage annuel.' },
    { id: 'manage_suppliers',      label: 'Gérer les fournisseurs récurrents',    desc: 'Ajouter ou supprimer des fournisseurs.' },
    { id: 'view_archives_all',     label: 'Voir toutes les archives',             desc: 'Accès aux archives de tous les utilisateurs.' },
    { id: 'delete_documents',      label: 'Supprimer définitivement un document', desc: 'Suppression définitive sans archivage.' }
]

const defaultRolesConfig = {
    'A0': { name: 'A0 - Développeur',     isSystem: true, perms: allPermissions.map(p => p.id) },
    'A1': { name: 'A1 - Administrateur',  isSystem: true, perms: allPermissions.map(p => p.id) },
    'A2': { name: 'A2 - Bureau',          isSystem: true, perms: ['view_all_invoices','view_all_quotes','view_all_timesheets','view_all_po','access_po_tab','access_soumissions_tab','access_courriel_tab','approve_timesheets','manage_tools','create_clients','delete_clients','manage_calendar','manage_news'] },
    'A3': { name: 'A3 - Employé Terrain', isSystem: true, perms: ['transfer_tools','access_po_tab','access_soumissions_tab','create_clients'] }
}

// ── Render principal ────────────────────────────────────────────────────────
export async function render(container) {
    container.innerHTML = `
    <style>
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input:focus { border-color: var(--accent) !important; }
        .search-icon { position: absolute; left: 15px; color: #888; pointer-events: none; display: flex; align-items: center; }
        .admin-main { flex: 1; display: flex; flex-direction: column; padding: 30px; max-width: 1200px; margin: 0 auto; width: 100%; overflow-y: auto; min-height: 100%; overscroll-behavior-y: contain; }
        .dash-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .settings-card { background-color: var(--bg-panel); padding: 25px; border-radius: 15px; border: 1px solid #333; display: flex; flex-direction: column; transition: all 0.3s ease; }
        .expanded-logs-panel { position: fixed !important; top: 30px !important; left: 30px !important; right: 30px !important; bottom: 30px !important; z-index: 5000 !important; background-color: var(--bg-panel) !important; box-shadow: 0 10px 40px rgba(0,0,0,0.8) !important; border: 2px solid var(--btn-blue) !important; max-width: none !important; margin: 0 !important; overflow: auto; }
        .expanded-logs-panel .logs-scroll-area { max-height: calc(100vh - 160px) !important; }
        @media (max-width: 768px) { .expanded-logs-panel { top: 10px !important; left: 10px !important; right: 10px !important; bottom: 10px !important; } .settings-card { min-width: 0 !important; } }
        .card-header { display: flex; align-items: center; justify-content: space-between; gap: 15px; font-size: 18px; font-weight: bold; margin-bottom: 20px; border-bottom: 1px solid #444; padding-bottom: 10px; flex-wrap: wrap; }
        .header-with-icon { display: flex; align-items: center; gap: 10px; }
        .header-with-icon svg { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-add-small { background: #444; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold; transition: 0.2s; display: flex; align-items: center; gap: 6px; }
        .btn-add-small svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-add-small:hover { background: #555; }
        .formation-list { display: flex; flex-direction: column; gap: 10px; max-height: 350px; overflow-y: auto; padding-right: 5px; }
        .formation-item { background: #1a1b23; border: 1px solid #444; border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 12px; }
        .role-badge { background: rgba(255,152,0,0.2); color: #ff9800; border: 1px solid #ff9800; font-size: 11px; font-weight: bold; padding: 3px 6px; border-radius: 4px; }
        .btn-del-emp { background: rgba(255,77,77,0.1); color: var(--btn-red); border: 1px solid transparent; width: 30px; height: 30px; border-radius: 6px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
        .btn-del-emp svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-del-emp:hover { background: var(--btn-red); color: white; }
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
        .tabs-container { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #444; padding-top: 4px; padding-bottom: 10px; overflow-x: auto; scrollbar-width: none; touch-action: pan-x; overscroll-behavior-x: contain; flex-shrink: 0; }
        .tabs-container::-webkit-scrollbar { display: none; }
        .btn-tab { background: transparent; color: #888; border: none; padding: 10px 20px; font-weight: bold; font-size: 15px; cursor: pointer; transition: 0.2s; border-bottom: 3px solid transparent; display: flex; align-items: center; gap: 8px; white-space: nowrap; flex-shrink: 0; }
        .btn-tab svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-tab.active { color: white; border-bottom-color: var(--accent); }
        .admin-section { display: none; flex-direction: column; gap: 20px; }
        .admin-section.active { display: flex; }
        .perm-form-group { margin-bottom: 15px; }
        .perm-form-group label { display: block; color: var(--text-main); font-size: 14px; font-weight: bold; margin-bottom: 8px; }
        .cert-emp-group { margin-bottom:15px; }
        .cert-emp-name { color:#ff9800;font-weight:bold;font-size:13px;margin-bottom:7px;padding-bottom:4px;border-bottom:1px dashed #333; }
        .cert-row { display:flex;align-items:center;gap:10px;padding:8px 12px;background:#1a1b23;border:1px solid #444;border-radius:6px;margin-bottom:5px; }
        .cert-dot { width:10px;height:10px;border-radius:50%;flex-shrink:0; }
        .cert-ok { background:var(--btn-green); }
        .cert-soon { background:var(--btn-orange); }
        .cert-exp { background:var(--btn-red); }
        .cert-nodate { background:#555; }
        @media (min-width: 769px) and (max-width: 1024px) { .admin-main { padding: 20px; } }
        @media (max-width: 768px) { .admin-main { padding: 15px; } .dash-header { padding-right: 70px; } .tabs-container { margin-right: 0; } .settings-grid { grid-template-columns: 1fr; } .admin-danger-row { flex-direction: column; } .admin-danger-row .settings-card { min-width: 0 !important; flex: none !important; width: 100%; } }
    </style>

    <div class="admin-main">
        <div class="dash-header">
            <div class="dash-title">
                <h1>Administration Système</h1>
                <p>Gestion des accès et de la sécurité</p>
            </div>
        </div>

        <div class="tabs-container">
            <button class="btn-tab active" data-tab="users">
                <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Utilisateurs
            </button>
            <button class="btn-tab" data-tab="email" id="tab-email" style="display:none">
                <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Boîte Email (A0)
            </button>
            <button class="btn-tab" data-tab="maintenance" id="tab-dev" style="display:none">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Permissions & Système (A0)
            </button>
        </div>

        <!-- Section Utilisateurs -->
        <div class="settings-grid admin-section active" id="sec-users">

            <div class="settings-card" style="border-color:#ff9800;grid-column:1/-1" id="employeesPanel">
                <div class="card-header" style="color:#ff9800">
                    <div class="header-with-icon"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Gestion du Personnel</div>
                    <button class="btn-add-small" id="btnOpenNewUser" style="background:#ff9800;color:black">
                        <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                        Créer un profil
                    </button>
                </div>
                <div class="formation-list" id="employeeList">
                    <div style="color:#888;font-style:italic;text-align:center;padding:20px">Chargement de l'équipe...</div>
                </div>
            </div>

            <div class="settings-card" style="border-color:var(--btn-blue);grid-column:1/-1" id="suppliersPanel">
                <div class="card-header" style="color:var(--btn-blue)">
                    <div class="header-with-icon"><svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/></svg> Fournisseurs récurrents</div>
                </div>
                <p style="color:#aaa;font-size:13px;margin-bottom:12px">Liste utilisée dans le menu déroulant lors de la création d'un Bon de Commande.</p>
                <div style="display:flex;gap:8px;margin-bottom:15px">
                    <input type="text" id="newSupplierInput" placeholder="Nom du fournisseur..." style="flex:1;background:#1a1b23;border:1px solid #444;color:white;padding:10px;border-radius:6px;font-size:14px">
                    <button class="btn-add-small" id="btnAddSupplier" style="background:var(--btn-blue);color:white">
                        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Ajouter
                    </button>
                </div>
                <div id="suppliersList"><div style="color:#888;font-style:italic;text-align:center;padding:20px">Chargement…</div></div>
            </div>

            <div class="settings-card" style="border-color:var(--btn-green);grid-column:1/-1" id="toolsPanel">
                <div class="card-header" style="color:var(--btn-green)">
                    <div class="header-with-icon"><svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> Outils — Inventaire</div>
                </div>
                <p style="color:#aaa;font-size:13px;margin-bottom:12px">Ajoute ici les outils que tu viens d'acheter. Ils apparaîtront dans le module Outils, prêts à être assignés.</p>
                <div style="display:flex;gap:8px;margin-bottom:15px">
                    <input type="text" id="newToolInput" placeholder="Nom de l'outil (ex: Perceuse Milwaukee)..." style="flex:1;background:#1a1b23;border:1px solid #444;color:white;padding:10px;border-radius:6px;font-size:14px">
                    <button class="btn-add-small" id="btnAddTool" style="background:var(--btn-green);color:white">
                        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Ajouter
                    </button>
                </div>
                <div id="toolsList"><div style="color:#888;font-style:italic;text-align:center;padding:20px">Chargement…</div></div>
            </div>

            <div class="settings-card" style="border-color:var(--accent);grid-column:1/-1" id="countersPanel">
                <div class="card-header" style="color:var(--accent)">
                    <div class="header-with-icon"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> Compteurs</div>
                </div>
                <p style="color:#aaa;font-size:13px;margin-bottom:15px">État actuel de la numérotation des factures et des bons de commande.</p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px">
                    <div style="background:#1a1b23;border:1px solid #444;border-radius:8px;padding:15px">
                        <div style="color:#888;font-size:12px;text-transform:uppercase;margin-bottom:5px">Dernière facture</div>
                        <div id="lastInvoiceNumber" style="color:var(--accent);font-size:24px;font-weight:bold;font-family:monospace">…</div>
                        <div id="nextInvoiceNumber" style="color:#aaa;font-size:13px;margin-top:5px">Prochaine : …</div>
                    </div>
                    <div style="background:#1a1b23;border:1px solid #444;border-radius:8px;padding:15px">
                        <div style="color:#888;font-size:12px;text-transform:uppercase;margin-bottom:5px">Dernier PO</div>
                        <div id="lastPoNumber" style="color:var(--btn-green);font-size:18px;font-weight:bold;font-family:monospace;word-break:break-all">…</div>
                        <div id="totalPoCount" style="color:#aaa;font-size:13px;margin-top:5px">Total : …</div>
                    </div>
                </div>
            </div>

            <div class="settings-card" style="border-color:#ff9800;grid-column:1/-1" id="SupportPanel">
                <div class="card-header" style="color:#ff9800">
                    <div class="header-with-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg> Tickets de Support</div>
                </div>
                <div style="background:#1a1b23;border:1px solid #444;border-radius:8px;overflow:hidden">
                    <div style="max-height:250px;overflow-y:auto;padding:10px" id="supportTicketsList">
                        <div style="color:#888;font-style:italic;text-align:center;padding:20px">Aucun ticket.</div>
                    </div>
                </div>
            </div>

            <div class="settings-card" id="a0ArchivesPanel" style="border-color:#ff9800;grid-column:1/-1">
                <div class="card-header" style="color:#ff9800">
                    <div class="header-with-icon"><svg viewBox="0 0 24 24"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> Nettoyer Archives</div>
                </div>
                <p style="color:#aaa;font-size:13px;margin-bottom:15px;line-height:1.4">Supprime <b>définitivement</b> les documents archivés depuis plus d'un an.</p>
                <div id="archivesExpiredCount" style="font-size:13px;color:#aaa;margin-bottom:10px">Chargement…</div>
                <button id="btnCleanArchives" style="width:100%;padding:12px;background:transparent;border:2px solid #ff9800;color:#ff9800;border-radius:8px;font-weight:bold;cursor:pointer;transition:0.2s">Nettoyer</button>
            </div>

            <div class="settings-card" style="border-color:#2ecc71;grid-column:1/-1" id="certificationsPanel">
                <div class="card-header" style="color:#2ecc71">
                    <div class="header-with-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> Certifications du personnel</div>
                    <button class="btn-add-small" id="btnOpenAddFormation" style="background:#2ecc71;color:black">
                        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Ajouter formation
                    </button>
                </div>
                <div id="certificationsList">
                    <div style="color:#888;font-style:italic;text-align:center;padding:20px">Chargement…</div>
                </div>
            </div>

        </div>

        <!-- Section Boîte Email Externe (A0) -->
        <div class="settings-grid admin-section" id="sec-email" style="grid-template-columns:1fr">

            <div class="settings-card" style="border-color:var(--btn-blue)">
                <div class="card-header" style="color:var(--btn-blue)">
                    <div class="header-with-icon">
                        <svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        Connexion Boîte Email Externe
                    </div>
                </div>
                <p style="color:#aaa;font-size:13px;margin-bottom:20px;line-height:1.5">
                    Connectez la boîte courriel de la compagnie pour que les vrais emails apparaissent dans l'onglet Courriel.<br>
                    Chaque employé avec accès verra les messages dans l'interface web.
                </p>

                <!-- Statut actuel -->
                <div id="emailProviderStatus" style="display:flex;align-items:center;gap:10px;padding:12px 15px;background:#1a1b23;border-radius:8px;border:1px solid #444;margin-bottom:20px">
                    <div style="width:10px;height:10px;border-radius:50%;background:#666;flex-shrink:0" id="emailStatusDot"></div>
                    <span style="color:#aaa;font-size:14px" id="emailStatusText">Non connectée</span>
                </div>

                <!-- Formulaire de configuration -->
                <div style="display:flex;flex-direction:column;gap:15px">
                    <div>
                        <label style="display:block;color:white;font-size:13px;font-weight:bold;margin-bottom:6px">Type de fournisseur</label>
                        <select id="emailProviderType" style="width:100%;padding:12px;background:#2b2c36;border:1px solid #555;color:white;border-radius:6px;outline:none;font-size:14px">
                            <option value="">-- Choisir --</option>
                            <option value="gmail">Gmail / Google Workspace</option>
                            <option value="outlook">Outlook / Microsoft 365</option>
                            <option value="imap">IMAP / SMTP (autre)</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block;color:white;font-size:13px;font-weight:bold;margin-bottom:6px">Adresse email de la compagnie</label>
                        <input type="email" id="emailProviderAddress" placeholder="ex: info@fdussault.com" style="width:100%;padding:12px;background:#2b2c36;border:1px solid #555;color:white;border-radius:6px;outline:none;font-size:14px;box-sizing:border-box">
                    </div>
                    <div id="imapFields" style="display:none;flex-direction:column;gap:10px">
                        <div>
                            <label style="display:block;color:white;font-size:13px;font-weight:bold;margin-bottom:6px">Serveur IMAP</label>
                            <input type="text" id="emailImapHost" placeholder="ex: mail.fdussault.com" style="width:100%;padding:12px;background:#2b2c36;border:1px solid #555;color:white;border-radius:6px;outline:none;font-size:14px;box-sizing:border-box">
                        </div>
                        <div>
                            <label style="display:block;color:white;font-size:13px;font-weight:bold;margin-bottom:6px">Mot de passe / App Password</label>
                            <input type="password" id="emailImapPass" placeholder="••••••••" style="width:100%;padding:12px;background:#2b2c36;border:1px solid #555;color:white;border-radius:6px;outline:none;font-size:14px;box-sizing:border-box">
                        </div>
                    </div>
                    <button id="btnConnectEmail" style="padding:12px 20px;background:var(--btn-blue);color:white;border:none;border-radius:8px;font-weight:bold;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:0.2s;opacity:0.5;pointer-events:none" disabled>
                        <svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        Connecter — disponible prochainement
                    </button>
                </div>

                <div style="margin-top:20px;padding:12px;background:rgba(52,152,219,0.08);border:1px dashed var(--btn-blue);border-radius:8px">
                    <p style="color:#aaa;font-size:12px;margin:0;line-height:1.6">
                        <strong style="color:var(--btn-blue)">Comment ça fonctionne :</strong> Une fois connectée, une Edge Function Supabase récupère les nouveaux courriels toutes les 5 minutes et les stocke dans la table <code style="background:#1a1b23;padding:2px 5px;border-radius:3px">courriels</code>. Les employés avec accès les voient instantanément. Les réponses envoyées depuis l'app passent par le serveur SMTP de la compagnie.
                    </p>
                </div>
            </div>

        </div>

        <!-- Section Maintenance (A0) -->
        <div class="settings-grid admin-section" id="sec-maintenance">

            <div class="settings-card" id="a0PermissionsPanel" style="border-color:var(--accent)">
                <div class="card-header" style="color:var(--accent);border-bottom:none;margin-bottom:0">
                    <div class="header-with-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    Rôles & Permissions Dynamiques</div>
                    <button class="btn-add-small" id="btnOpenNewRole" style="background:var(--btn-blue);color:white">
                        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Nouveau Rôle
                    </button>
                </div>
                <p style="color:#aaa;font-size:13px;margin-bottom:15px;line-height:1.4">Sélectionnez un rôle pour modifier ses accès globaux dans l'application.</p>
                <div style="background:#1a1b23;padding:15px;border-radius:8px;display:flex;flex-direction:column;gap:15px;border:1px solid #444">
                    <div class="perm-form-group"><label>Rôle à modifier :</label><select id="roleSelect" style="width:100%;padding:12px;background:#2b2c36;border:1px solid #555;color:white;border-radius:6px;outline:none;font-weight:bold"></select></div>
                    <div class="perm-form-group"><label>Nom d'affichage du rôle :</label><input type="text" id="editRoleName" style="width:100%;padding:12px;background:#2b2c36;border:1px solid #555;color:white;border-radius:6px;outline:none;box-sizing:border-box"></div>
                    <hr style="border:none;border-top:1px dashed #333;margin:0">
                    <div id="permissionsList" style="display:flex;flex-direction:column;gap:15px;max-height:250px;overflow-y:auto;padding-right:5px"></div>
                    <button class="btn-add-small" id="btnSavePermissions" style="background:var(--btn-green);color:white;justify-content:center;padding:12px">
                        <svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        Enregistrer les modifications
                    </button>
                </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:20px">
                <div class="admin-danger-row" style="display:flex;gap:20px;flex-wrap:wrap">
                    <div class="settings-card" style="flex:1;border-color:var(--btn-red);min-width:250px">
                        <div class="card-header" style="color:var(--btn-red);border-bottom:none;margin-bottom:0">
                            <div class="header-with-icon"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Mode Maintenance</div>
                        </div>
                        <p style="color:#aaa;font-size:13px;margin-bottom:15px;flex:1">Bloque l'accès à tous les utilisateurs (sauf A0).</p>
                        <button id="btnToggleMaintenance" style="width:100%;padding:12px;background:transparent;border:2px solid var(--btn-red);color:var(--btn-red);border-radius:8px;font-weight:bold;cursor:pointer;transition:0.2s">Activer le Mode Maintenance</button>
                    </div>
                    <div class="settings-card" style="flex:1;border-color:var(--btn-purple);min-width:250px">
                        <div class="card-header" style="color:var(--btn-purple);border-bottom:none;margin-bottom:0">
                            <div class="header-with-icon"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Identité (A0)</div>
                        </div>
                        <p style="color:#aaa;font-size:13px;margin-bottom:15px;flex:1">Nom utilisé lors de la publication d'annonces.</p>
                        <div style="display:flex;gap:10px">
                            <button id="btnAliasNom" style="flex:1;padding:10px;border-radius:8px;border:2px solid #555;background:transparent;color:#aaa;font-weight:bold;cursor:pointer">Mon Nom</button>
                            <button id="btnAliasSys" style="flex:1;padding:10px;border-radius:8px;border:2px solid #555;background:transparent;color:#aaa;font-weight:bold;cursor:pointer">Système</button>
                        </div>
                    </div>
                    <div class="settings-card" style="flex:1;border-color:var(--btn-purple);min-width:250px">
                        <div class="card-header" style="color:var(--btn-purple);border-bottom:none;margin-bottom:0">
                            <div class="header-with-icon"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> Nettoyer Journal</div>
                        </div>
                        <p style="color:#aaa;font-size:13px;margin-bottom:15px;flex:1">Supprime <b>définitivement</b> les entrées du journal datant de plus d'un an.</p>
                        <div id="logsExpiredCount" style="font-size:13px;color:#aaa;margin-bottom:10px">Chargement…</div>
                        <button id="btnCleanLogs" style="width:100%;padding:12px;background:transparent;border:2px solid #9b59b6;color:var(--btn-purple);border-radius:8px;font-weight:bold;cursor:pointer">Nettoyer</button>
                    </div>
                </div>

                <div class="settings-card" id="a0LogsPanel" style="border-color:var(--btn-blue)">
                    <div class="card-header" style="color:var(--btn-blue)">
                        <div class="header-with-icon"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> Journal d'Audit</div>
                        <div style="display:flex;gap:5px">
                            <button id="btnExportLogs" style="background:transparent;border:none;color:#888;cursor:pointer;padding:5px;transition:0.2s" title="Exporter en CSV">
                                <svg width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </button>
                            <button id="btnExpandLogs" style="background:transparent;border:none;color:#888;cursor:pointer;padding:5px;transition:0.2s" title="Agrandir/Réduire">
                                <svg id="icon-expand-logs" width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                            </button>
                        </div>
                    </div>
                    <div class="log-filters-wrapper">
                        <div class="search-box">
                            <span class="search-icon"><svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                            <input type="text" id="logSearch" placeholder="Rechercher..." style="width:100%;background:#1a1b23;border:1px solid #444;color:white;padding:14px 15px 14px 45px;border-radius:8px;font-size:16px;outline:none;transition:0.2s;box-sizing:border-box">
                        </div>
                        <div class="log-filter-grid">
                            <div class="log-select-wrap">
                                <select id="logActionFilter">
                                    <option value="">Toutes actions</option>
                                    <option value="creation">Création</option>
                                    <option value="modification">Modification</option>
                                    <option value="suppression">Suppression</option>
                                    <option value="archivage">Archivage</option>
                                    <option value="restauration">Restauration</option>
                                    <option value="role_change">Changement rôle</option>
                                    <option value="connexion">Connexion</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                                <svg class="sel-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                            <div class="log-select-wrap">
                                <select id="logTableFilter">
                                    <option value="">Toutes tables</option>
                                    <option value="factures">Factures</option>
                                    <option value="soumissions">Soumissions</option>
                                    <option value="feuilles_de_temps">Feuilles temps</option>
                                    <option value="clients">Clients</option>
                                    <option value="bons_de_commande">PO</option>
                                    <option value="profils">Profils</option>
                                </select>
                                <svg class="sel-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                            <div class="log-select-wrap">
                                <select id="logUserFilter">
                                    <option value="">Tous utilisateurs</option>
                                </select>
                                <svg class="sel-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                            <div class="log-select-wrap">
                                <select id="logDateFilter">
                                    <option value="">Toutes dates</option>
                                    <option value="today">Aujourd'hui</option>
                                    <option value="week">Cette semaine</option>
                                    <option value="month">Ce mois-ci</option>
                                </select>
                                <svg class="sel-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                        </div>
                    </div>
                    <div style="background:#1a1b23;border:1px solid #444;border-radius:8px;overflow-x:auto">
                        <div class="logs-scroll-area">
                            <table class="logs-table">
                                <thead><tr><th width="130">Date</th><th width="100">Action</th><th width="130">Utilisateur</th><th>Détails</th></tr></thead>
                                <tbody id="logsTableBody"><tr><td colspan="4" style="text-align:center;padding:20px;color:#888">Chargement...</td></tr></tbody>
                            </table>
                        </div>
                    </div>
                    <div id="logsCountText" style="color:#888;font-size:12px;margin-top:8px;text-align:right"></div>
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
            <div class="modal-actions">
                <button class="btn-modal-gray" id="btnCloseNewRole">Annuler</button>
                <button class="btn-modal-green" style="flex:1" id="btnCreateRole">Créer le rôle</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="newUserModal">
        <div class="modal-card-basic">
            <h2 style="color:#ff9800;margin-top:0;margin-bottom:20px;border-bottom:1px solid #444;padding-bottom:10px">Nouveau Profil</h2>
            <div class="form-group"><label>Prénom et Nom</label><input type="text" id="newUserName" placeholder="Jean Tremblay"></div>
            <div class="form-group"><label>Rôle assigné</label><select id="newUserRole"></select></div>
            <div class="form-group"><label>Courriel</label><input type="email" id="newUserEmail" placeholder="jean@entreprise.com"></div>
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
            <div class="form-group"><label>Prénom et Nom</label><input type="text" id="editUserName"></div>
            <div class="form-group"><label>Rôle assigné</label><select id="editUserRole"></select></div>
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

    <div class="modal-overlay" id="addFormationAdminModal">
        <div class="modal-card-basic">
            <h2 style="color:#2ecc71;margin-top:0;margin-bottom:20px;border-bottom:1px solid #444;padding-bottom:10px">Ajouter une formation</h2>
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

    // Certifications modal
    document.getElementById('btnCloseAddFormation')?.addEventListener('click', () => closeModal('addFormationAdminModal'))
    document.getElementById('btnSaveFormationAdmin')?.addEventListener('click', saveFormationAdmin)

    // Fournisseurs
    document.getElementById('btnAddSupplier').addEventListener('click', addSupplier)
    document.getElementById('newSupplierInput').addEventListener('keydown', e => { if (e.key === 'Enter') addSupplier() })

    // Outils
    document.getElementById('btnAddTool').addEventListener('click', addTool)
    document.getElementById('newToolInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTool() })

    // Archives
    document.getElementById('btnCleanArchives').addEventListener('click', cleanExpiredArchives)

    // A0 uniquement
    if (currentRole === 'A0') {
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
        document.getElementById('btnToggleMaintenance').addEventListener('click', toggleMaintenance)
        document.getElementById('btnAliasNom').addEventListener('click', () => setAlias('nom'))
        document.getElementById('btnAliasSys').addEventListener('click', () => setAlias('systeme'))
        document.getElementById('btnCleanLogs').addEventListener('click', cleanExpiredLogs)
        document.getElementById('btnExportLogs').addEventListener('click', exportLogsCSV)
        document.getElementById('btnExpandLogs').addEventListener('click', toggleLogsExpand)
        document.getElementById('logSearch').addEventListener('keyup', filterLogs)
        document.getElementById('logActionFilter').addEventListener('change', filterLogs)
        document.getElementById('logTableFilter').addEventListener('change', filterLogs)
        document.getElementById('logUserFilter').addEventListener('change', filterLogs)
        document.getElementById('logDateFilter').addEventListener('change', filterLogs)
        document.getElementById('customRoleId').addEventListener('input', e => {
            e.target.value = e.target.value.toUpperCase().replace(/\s+/g, '_')
        })

        loadTechnicalLogs()
        loadRolePermissions()
        initAliasUI()
        loadMaintenanceState()
        loadArchivesExpiredCount()
        loadLogsExpiredCount()
    }

    updateRoleSelects()
    chargerListeEmployes()

    if (hasPermission('manage_suppliers')) {
        loadSuppliers()
    } else {
        const sp = document.getElementById('suppliersPanel')
        if (sp) sp.style.display = 'none'
    }

    if (currentRole === 'A0' || currentRole === 'A1') {
        loadTools()
        loadCounters()
        initSupportUI()
        loadAllFormations()
        document.getElementById('btnOpenAddFormation')?.addEventListener('click', openAddFormationModal)
    } else {
        ;['toolsPanel', 'countersPanel', 'SupportPanel', 'certificationsPanel'].forEach(id => {
            const el = document.getElementById(id)
            if (el) el.style.display = 'none'
        })
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
    const list = document.getElementById('permissionsList')
    if (!list) return
    list.innerHTML = allPermissions.map(p => `
        <label style="display:flex;align-items:flex-start;gap:12px;cursor:pointer">
            <input type="checkbox" class="perm-cb" value="${p.id}" ${currentPerms.includes(p.id) ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--accent);flex-shrink:0;margin-top:2px">
            <div style="flex:1"><span style="font-weight:bold;color:var(--accent)">${p.label}</span><div style="color:#aaa;font-size:12px">${p.desc}</div></div>
        </label>`).join('')
}

async function saveRolePermissions() {
    const roleId = document.getElementById('roleSelect')?.value
    if (!roleId || !roleDefinitions[roleId]) return
    roleDefinitions[roleId].name = document.getElementById('editRoleName')?.value.trim() || roleId
    roleDefinitions[roleId].perms = Array.from(document.querySelectorAll('.perm-cb:checked')).map(cb => cb.value)
    await saveRolesToSupabase()
    updateRoleSelects()
    document.getElementById('roleSelect').value = roleId
    showAlert('Permissions sauvegardées !')
    // Notifier le router que les permissions ont changé
    window.dispatchEvent(new CustomEvent('permissions_updated'))
}

function openCustomRoleModal() {
    const idEl = document.getElementById('customRoleId')
    const nameEl = document.getElementById('customRoleName')
    if (idEl) idEl.value = ''
    if (nameEl) nameEl.value = ''
    document.getElementById('newCustomRoleModal').classList.add('open')
}

async function createNewCustomRole() {
    const roleId = document.getElementById('customRoleId')?.value.trim()
    const roleName = document.getElementById('customRoleName')?.value.trim()
    if (!roleId || !roleName) return
    if (roleDefinitions[roleId] || roleId === 'A0') return
    roleDefinitions[roleId] = { name: roleName, isSystem: false, perms: [] }
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
    const { data: profils, error } = await supabase.from('profils').select('id,prenom_nom,role').order('role')
    if (error) { list.innerHTML = `<div style="color:var(--btn-red)">Erreur BD</div>`; return }

    if (currentRole !== 'A0' && profils?.length === 1) {
        list.innerHTML = `<div style="background:#3a2424;border:1px solid var(--btn-red);border-radius:8px;padding:14px;color:#ffb3b3;font-size:13px;line-height:1.5"><strong style="color:var(--btn-red)">Liste incomplète</strong><br>La politique de sécurité Supabase t'empêche de voir les autres collègues.</div>`
        return
    }

    list.innerHTML = ''
    profils.forEach(emp => {
        const item = document.createElement('div')
        item.className = 'formation-item'
        let btnEdit = '', btnDel = ''
        if (currentRole === 'A0' || (emp.role !== 'A0' && hasPermission('view_admin'))) {
            btnEdit = `<button class="btn-add-small" style="background:#444" data-edit-id="${emp.id}" data-edit-name="${sanitize(emp.prenom_nom || '')}" data-edit-role="${emp.role}"><svg viewBox="0 0 24 24" width="14" height="14" style="stroke:currentColor;fill:none;stroke-width:2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Éditer</button>`
        }
        if (emp.role !== 'A0' && (currentRole === 'A0' || currentRole === 'A1')) {
            btnDel = `<button class="btn-del-emp" data-del-id="${emp.id}" data-del-name="${sanitize(emp.prenom_nom || '')}"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>`
        }
        item.innerHTML = `
            <div style="width:40px;height:40px;border-radius:50%;background:#444;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px">${sanitize((emp.prenom_nom || '?').charAt(0).toUpperCase())}</div>
            <div style="flex:1">
                <div style="color:white;font-weight:bold">${sanitize(emp.prenom_nom || 'Sans nom')}</div>
                <div style="display:flex;align-items:center;gap:10px"><span class="role-badge">${sanitize(roleDefinitions[emp.role]?.name || emp.role)}</span>${btnEdit}</div>
            </div>
            ${btnDel}
        `
        list.appendChild(item)
    })

    list.querySelectorAll('[data-edit-id]').forEach(btn => {
        btn.addEventListener('click', () => openEditUserModal(btn.dataset.editId, btn.dataset.editName, btn.dataset.editRole))
    })
    list.querySelectorAll('[data-del-id]').forEach(btn => {
        btn.addEventListener('click', () => deleteEmploye(btn.dataset.delId, btn.dataset.delName))
    })
}

function openNewUserModal() {
    document.getElementById('newUserName').value = ''
    document.getElementById('newUserEmail').value = ''
    document.getElementById('newUserPassword').value = ''
    document.getElementById('newUserModal').classList.add('open')
}

function openEditUserModal(id, name, role) {
    document.getElementById('editUserId').value = id
    document.getElementById('editUserName').value = name
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
    const id = document.getElementById('editUserId').value
    const name = document.getElementById('editUserName').value.trim()
    const role = document.getElementById('editUserRole').value
    if (!name) return
    const updateData = { prenom_nom: name }
    if (role !== 'A0') updateData.role = role
    const { error } = await supabase.from('profils').update(updateData).eq('id', id)
    if (error) { showAlert(friendlyError(error)) } else { closeModal('editUserModal'); chargerListeEmployes() }
}

async function creerEmploye() {
    const nom = document.getElementById('newUserName').value.trim()
    const role = document.getElementById('newUserRole').value
    const email = document.getElementById('newUserEmail').value.trim()
    const password = document.getElementById('newUserPassword').value
    if (!nom || !email || !password || !role || role === 'A0') return
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
    const { error: profileError } = await supabase.from('profils').insert([{ id: authData.user.id, role, prenom_nom: nom }])
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
    container.innerHTML = '<div style="color:#888;font-style:italic;text-align:center;padding:20px">Chargement...</div>'
    const { data: tickets } = await supabase.from('tickets_support').select('id,created_at,author_nom,message,statut').eq('statut', 'ouvert').order('created_at', { ascending: false })
    container.innerHTML = ''
    if (!tickets?.length) { container.innerHTML = '<div style="color:#888;font-style:italic;text-align:center;padding:20px">Aucun ticket.</div>'; return }
    tickets.forEach(t => {
        const date = new Date(t.created_at).toLocaleString('fr-CA')
        const div = document.createElement('div')
        div.style.cssText = 'background:#2b2c36;border:1px solid #444;padding:15px;border-radius:8px;margin-bottom:10px'
        div.innerHTML = `
            <div style="display:flex;justify-content:space-between;margin-bottom:10px"><span style="font-weight:bold">${sanitize(t.author_nom)}</span><span style="color:#888;font-size:12px">${date}</span></div>
            <div style="color:#ccc;line-height:1.5">${sanitize(t.message)}</div>
            <div style="text-align:right;margin-top:10px"><button class="btn-modal-green" style="padding:5px 10px" data-ticket-id="${t.id}">Réglé</button></div>
        `
        div.querySelector('[data-ticket-id]').addEventListener('click', async btn => {
            const id = btn.currentTarget.dataset.ticketId
            const { error } = await supabase.from('tickets_support').update({ statut: 'resolu' }).eq('id', id)
            if (error) { showAlert('❌ ' + friendlyError(error)) } else { initSupportUI() }
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
    if (suppliersData.length === 0) { list.innerHTML = '<div style="color:#888;font-style:italic;text-align:center;padding:20px">Aucun fournisseur.</div>'; return }
    list.innerHTML = suppliersData.map((f, idx) => `
        <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:#1a1b23;border:1px solid #444;border-radius:6px;margin-bottom:6px">
            <div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0">
                <button data-sup-up="${idx}" ${idx === 0 ? 'disabled' : ''} style="background:${idx === 0 ? '#222' : '#333'};color:${idx === 0 ? '#444' : '#bbb'};border:none;border-radius:4px;width:28px;height:22px;display:flex;align-items:center;justify-content:center;cursor:${idx === 0 ? 'default' : 'pointer'};padding:0">▲</button>
                <button data-sup-down="${idx}" ${idx === suppliersData.length - 1 ? 'disabled' : ''} style="background:${idx === suppliersData.length - 1 ? '#222' : '#333'};color:${idx === suppliersData.length - 1 ? '#444' : '#bbb'};border:none;border-radius:4px;width:28px;height:22px;display:flex;align-items:center;justify-content:center;cursor:${idx === suppliersData.length - 1 ? 'default' : 'pointer'};padding:0">▼</button>
            </div>
            <span style="flex:1;color:#ddd;font-size:14px">${sanitize(f)}</span>
            <button class="btn-del-emp" data-sup-del="${idx}"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
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
    list.querySelectorAll('[data-sup-del]').forEach(btn => btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.supDel)
        showConfirmAdmin(`Retirer "${suppliersData[i]}" ?`, async () => {
            suppliersData.splice(i, 1); await saveSuppliers(); renderSuppliers()
        })
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
    if (toolsListData.length === 0) { list.innerHTML = '<div style="color:#888;font-style:italic;text-align:center;padding:20px">Aucun outil.</div>'; return }

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

    list.innerHTML = uniqueTools.map((t, idx) => {
        let statusText
        if (t.status === 'hors_service') {
            statusText = `<span style="color:#ff6b6b;font-size:12px;font-weight:bold">⚠ Hors service</span>`
        } else if (t.status === 'active' && t.assignee_nom) {
            statusText = `<span style="color:var(--accent);font-size:12px">→ ${sanitize(t.assignee_nom)}</span>`
        } else {
            statusText = `<span style="color:#888;font-size:12px;font-style:italic">Disponible</span>`
        }
        const isFirst = idx === 0, isLast = idx === uniqueTools.length - 1
        const gearSvg = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
        return `
            <div class="tool-item" data-tool-id="${sanitize(t.id)}" data-tool-name="${sanitize(t.nom || '')}" style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:#1a1b23;border:1px solid ${t.status === 'hors_service' ? '#ff6b6b44' : '#444'};border-radius:6px;margin-bottom:6px">
                <div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0">
                    <button data-tool-up="${idx}" ${isFirst ? 'disabled' : ''} style="background:${isFirst ? '#222' : '#333'};color:${isFirst ? '#444' : '#bbb'};border:none;border-radius:4px;width:28px;height:22px;display:flex;align-items:center;justify-content:center;cursor:${isFirst ? 'default' : 'pointer'};padding:0">▲</button>
                    <button data-tool-down="${idx}" ${isLast ? 'disabled' : ''} style="background:${isLast ? '#222' : '#333'};color:${isLast ? '#444' : '#bbb'};border:none;border-radius:4px;width:28px;height:22px;display:flex;align-items:center;justify-content:center;cursor:${isLast ? 'default' : 'pointer'};padding:0">▼</button>
                </div>
                <div style="flex:1;display:flex;flex-direction:column;gap:4px;min-width:0"><span style="color:#ddd;font-size:14px;font-weight:bold;word-break:break-word">${sanitize(t.nom || 'Sans nom')}</span>${statusText}</div>
                <button class="btn-gear-tool" data-tool-settings="${sanitize(t.id)}">${gearSvg}</button>
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
    renderLogs(allLogs)
}

function populateUserFilter(logs) {
    const sel = document.getElementById('logUserFilter')
    if (!sel) return
    const current = sel.value
    const users = [...new Set(logs.map(l => l.user).filter(u => u && u !== 'Système'))].sort()
    sel.innerHTML = '<option value="">Tous utilisateurs</option>' + users.map(u => `<option value="${sanitize(u)}">${sanitize(u)}</option>`).join('')
    if (current && users.includes(current)) sel.value = current
}

function renderLogs(data) {
    const tbody = document.getElementById('logsTableBody')
    if (!tbody) return
    tbody.innerHTML = data.length === 0
        ? '<tr><td colspan="4" style="text-align:center;padding:20px;color:#888">Aucun résultat</td></tr>'
        : data.map(log => `<tr>
            <td style="color:#888;font-family:monospace;font-size:11px">${sanitize(log.date)}</td>
            <td><span style="color:${log.color};font-weight:bold;font-size:12px">${sanitize(log.actionLabel)}</span></td>
            <td style="color:#ddd;font-size:12px">${sanitize(log.user)}</td>
            <td style="color:#ccc;font-size:12px">${sanitize(log.message)}</td>
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
        const profMap = {}
        ;(profRes.data || []).forEach(p => { profMap[p.id] = p.prenom_nom })
        allFormationsData = (formRes.data || []).map(f => ({ ...f, prenom_nom: profMap[f.user_id] || 'Inconnu' }))
        renderAllFormations(container)
    } catch (e) {
        container.innerHTML = `<div style="color:var(--btn-red)">Erreur : ${sanitize(e.message)}</div>`
    }
}

function renderAllFormations(container) {
    if (!container) return
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (!allFormationsData.length) {
        container.innerHTML = '<div style="color:#888;font-style:italic;text-align:center;padding:20px">Aucune certification enregistrée.</div>'
        return
    }
    const byUser = {}
    allFormationsData.forEach(f => {
        if (!byUser[f.user_id]) byUser[f.user_id] = { name: f.prenom_nom, items: [] }
        byUser[f.user_id].items.push(f)
    })
    container.innerHTML = Object.values(byUser).map(grp => {
        const rows = grp.items.map(f => {
            let dotClass = 'cert-nodate', statusText = 'Pas de date'
            if (f.date_expiration) {
                const exp = new Date(f.date_expiration); exp.setHours(0, 0, 0, 0)
                const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24))
                if (diff < 0)       { dotClass = 'cert-exp';  statusText = `Expirée le ${exp.toLocaleDateString('fr-CA')}` }
                else if (diff <= 30) { dotClass = 'cert-soon'; statusText = `Expire dans ${diff} j` }
                else                 { dotClass = 'cert-ok';   statusText = `Valide jusqu'au ${exp.toLocaleDateString('fr-CA')}` }
            }
            return `<div class="cert-row">
                <span class="cert-dot ${dotClass}"></span>
                <span style="flex:1;color:#ddd;font-size:14px">${sanitize(f.nom)}</span>
                <span style="font-size:12px;color:#aaa">${sanitize(statusText)}</span>
                <button class="btn-del-emp" data-cert-del="${f.id}" title="Supprimer"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </div>`
        }).join('')
        return `<div class="cert-emp-group"><div class="cert-emp-name">${sanitize(grp.name)}</div>${rows}</div>`
    }).join('')
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