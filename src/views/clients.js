// src/views/clients.js
// Migré fidèlement depuis code_clients/code_clients.html

import { supabase } from '../supabase.js'
import { currentUser, currentRole, currentProfil, hasPermission } from '../auth.js'
import { sanitize } from '../shared/sanitize.js'

// ── État local ──────────────────────────────────────────────────────────────
let clients = []
let clientToDeleteId = null
let hardDeleteId = null
let clientsPage = 0
const PAGE_SIZE = 25
let clientsHasMore = false
let currentViewingId = null

// ── Render principal ────────────────────────────────────────────────────────
export async function render(container) {
    container.innerHTML = `
    <style>
        .clients-main { padding: 30px; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .dash-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .header-actions { display: flex; align-items: center; gap: 15px; }
        .btn-action { background-color: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; white-space: nowrap; transition: 0.2s; }
        .btn-action:hover { background-color: var(--accent-hover); transform: translateY(-2px); }
        .btn-action svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-header-icon { background: #444; border: none; width: 38px; height: 38px; border-radius: 8px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; color: #ccc; flex-shrink: 0; }
        .btn-header-icon svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-header-icon:hover { background: var(--btn-red); color: white; }
        .toolbar { display: flex; gap: 15px; align-items: center; background-color: var(--bg-panel); padding: 15px; border-radius: 12px; }
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input { width: 100%; background: var(--bg-dark); border: 1px solid var(--border); color: white; padding: 14px 15px 14px 45px; border-radius: 8px; font-size: 16px; outline: none; transition: 0.2s; }
        .search-box input:focus { border-color: var(--accent); }
        .search-icon { position: absolute; left: 15px; color: #888; pointer-events: none; display: flex; align-items: center; }
        .search-icon svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .filter-select { background: var(--bg-dark); border: 1px solid var(--border); color: white; padding: 14px 15px; border-radius: 8px; font-size: 15px; outline: none; cursor: pointer; min-width: 180px; font-family: inherit; }
        .filter-select:focus { border-color: var(--accent); }
        .discrete-stats { color: #aaa; font-size: 13px; font-style: italic; margin-top: 1px; margin-bottom: 1px; padding-left: 10px; }
        .client-list { display: flex; flex-direction: column; gap: 15px; padding-bottom: 80px; }
        .client-item { background-color: var(--bg-panel); padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; transition: 0.2s; cursor: pointer; border-left: 5px solid transparent; }
        .client-item:hover { transform: translateY(-3px); background-color: #343542; }
        .client-item.status-residentiel { border-left-color: #28a745; }
        .client-item.status-commercial { border-left-color: #007bff; }
        .client-item.status-prospect { border-left-color: #6c757d; }
        .cli-info { display: flex; gap: 20px; align-items: center; flex: 1; }
        .cli-status { font-weight: bold; font-size: 13px; width: 140px; display: flex; align-items: center; gap: 6px; text-transform: uppercase; }
        .cli-status svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .cli-status.commercial { color: #007bff; }
        .cli-status.residentiel { color: #28a745; }
        .cli-status.prospect { color: #6c757d; }
        .cli-name { font-weight: bold; font-size: 18px; color: white; flex: 1; }
        .cli-name-container { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .cli-chip-sub { font-size: 13px; color: white; background: #3a3b46; padding: 4px 12px; border-radius: 6px; font-weight: bold; border: 1px solid #555; white-space: nowrap; }
        .cli-chip-contact { font-size: 12px; color: var(--accent); background: rgba(252,202,70,0.15); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(252,202,70,0.3); white-space: nowrap; }
        .cli-alert-badge { background: var(--btn-red); color: white; font-size: 10px; padding: 4px 8px; border-radius: 6px; font-weight: bold; white-space: nowrap; border: 1px solid #ff7b7b; display: flex; align-items: center; gap: 4px; }
        .cli-alert-badge svg { width: 12px; height: 12px; stroke: currentColor; fill: none; stroke-width: 2; }
        .cli-contact { color: #aaa; font-size: 14px; width: 250px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
        .cli-contact-item { display: flex; align-items: flex-start; gap: 6px; justify-content: flex-end; text-align: right; }
        .cli-contact-item svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; flex-shrink: 0; }
        .cli-contact-item.address { font-size: 12px; color: #888; margin-top: 2px; }
        .cli-actions { display: flex; gap: 10px; margin-left: 20px; }
        .btn-icon { background: #444; border: none; width: 36px; height: 36px; border-radius: 8px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; color: white; flex-shrink: 0; }
        .btn-icon svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-icon:hover { background: var(--accent); color: black; }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; z-index: 4000; justify-content: center; align-items: center; padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px); box-sizing: border-box; }
        .modal-overlay.open { display: flex; }
        .modal-overlay.z-high { z-index: 4500; background: rgba(0,0,0,0.7); }
        .modal-card { background: var(--bg-panel); width: 850px; padding: 30px; border-radius: 15px; border: 1px solid #555; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-height: 90vh; overflow-y: auto; }
        .modal-card.small-card { width: 350px; text-align: center; }
        .modal-title { font-size: 28px; color: white; margin-bottom: 20px; font-weight: bold; border-bottom: 2px solid var(--accent); padding-bottom: 10px; display: inline-block; }
        .form-group { margin-bottom: 18px; text-align: left; }
        .form-group label { display: block; color: #aaa; margin-bottom: 5px; font-size: 14px; font-weight: bold; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 14px 15px; background: var(--bg-dark); border: 1px solid var(--border); color: white; border-radius: 10px; font-family: sans-serif; font-size: 15px; outline: none; box-sizing: border-box; }
        .form-group input:focus, .form-group textarea:focus { border-color: var(--accent); }
        .form-row { display: flex; gap: 15px; }
        .contacts-container { border: 1px solid var(--border); padding: 12px; border-radius: 10px; background: var(--bg-dark); margin-bottom: 18px; }
        .contact-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .contact-inputs { display: flex; gap: 8px; flex: 1; }
        .contact-inputs input { flex: 1; background: #1a1b23; border: 1px solid var(--border); color: white; padding: 12px 10px; border-radius: 8px; font-size: 14px; outline: none; }
        .contact-inputs input:focus { border-color: var(--accent); }
        .btn-add-contact { background: #333; color: #ccc; width: 100%; padding: 12px; border: 1px dashed #555; border-radius: 8px; cursor: pointer; font-size: 14px; margin-top: 5px; transition: 0.2s; }
        .btn-add-contact:hover { background: #555; }
        .btn-remove-row { background: transparent; border: none; color: #ff4d4d; cursor: pointer; font-weight: bold; font-size: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .select-wrap { position: relative; display: block; }
        .select-wrap select { -webkit-appearance: none; appearance: none; padding-right: 42px; cursor: pointer; }
        .select-wrap .sel-chevron { position: absolute; right: 13px; top: 50%; transform: translateY(-50%); pointer-events: none; width: 18px; height: 18px; stroke: #888; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; }
        .modal-actions.center { justify-content: center; }
        .btn-cancel { background: #444; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
        .btn-submit { background: var(--btn-green); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 6px; }
        .btn-submit svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-delete { background: var(--btn-red); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .btn-delete svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .view-section-title { color: var(--accent); font-size: 14px; font-weight: bold; margin: 15px 0 5px 0; text-transform: uppercase; border-bottom: 1px solid #444; padding-bottom: 5px; }
        .view-row { margin-bottom: 8px; display: flex; align-items: center; }
        .view-label { color: #888; width: 140px; font-size: 13px; }
        .view-val { color: white; font-weight: 500; flex: 1; }
        .gps-options { display: flex; gap: 10px; width: 100%; }
        .gps-btn { text-decoration: none; font-size: 13px; padding: 6px 12px; border-radius: 6px; font-weight: bold; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 5px; flex: 1; }
        .gps-google { background: #4285F4; color: white; }
        .gps-apple { background: #ffffff; color: black; }
        .box-note { background: var(--bg-dark); padding: 10px; border-radius: 8px; color: #ddd; font-style: italic; min-height: 40px; white-space: pre-wrap; border: 1px solid var(--border); }
        .box-alert { background: rgba(255,77,77,0.1); border: 1px solid var(--btn-red); color: var(--btn-red); padding: 10px; border-radius: 8px; font-weight: bold; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
        .box-alert svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .contact-item { background: #333; padding: 12px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
        .ci-name { font-weight: bold; color: white; font-size: 15px; }
        .ci-role { font-size: 12px; color: var(--accent); font-style: italic; background: rgba(252,202,70,0.1); padding: 1px 6px; border-radius: 4px; display: inline-block; }
        .corbeille-item { background: #1a1b23; border: 1px dashed var(--btn-red); padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }

        @media (min-width: 769px) and (max-width: 1200px) {
            .clients-main { padding: 20px; }
            .form-row { flex-direction: column; gap: 0; }
            .client-item { flex-direction: column; align-items: stretch; gap: 8px; position: relative; }
            .cli-info { flex-direction: column; gap: 6px; }
            .cli-status { width: auto; flex-shrink: 0; }
            .cli-name-container { flex-wrap: nowrap; }
            .cli-contact { width: auto; align-items: flex-start; flex-direction: column; gap: 4px; padding-right: 50px; }
            .cli-contact-item { justify-content: flex-start; text-align: left; }
            .cli-contact-item.address { margin-top: 0; }
            .cli-actions { position: absolute; right: 20px; top: 15px; margin-left: 0; }
        }
        @media (max-width: 768px) {
            .clients-main { padding: 15px; }
            .dash-header { flex-direction: column; align-items: flex-start; gap: 15px; }
            .header-actions { width: 100%; }
            .btn-action { flex: 1; justify-content: center; transition: 0.2s; }
            .discrete-stats { margin-top: -5px; margin-bottom: 0; text-align: center; padding-left: 0; }
            .toolbar { flex-direction: column; align-items: stretch; gap: 10px; width: 100%; }
            .filter-select { width: 100%; }
            .client-item { flex-direction: column; align-items: flex-start; gap: 15px; }
            .cli-info { flex-direction: column; align-items: flex-start; gap: 5px; width: 100%; }
            .cli-status { width: auto; }
            .cli-contact { width: 100%; align-items: flex-start; }
            .cli-contact-item { justify-content: flex-start; text-align: left; }
            .cli-actions { align-self: flex-end; margin-left: 0; margin-top: -35px; }
            .modal-overlay { align-items: flex-end; }
            .modal-card { width: 100% !important; max-height: calc(100dvh - max(env(safe-area-inset-top, 0px), 60px) - env(safe-area-inset-bottom, 0px)) !important; border-radius: 24px !important; padding: 25px 20px calc(max(env(safe-area-inset-bottom, 0px), 20px) + 20px) 20px !important; box-shadow: 0 -8px 30px rgba(0,0,0,0.5) !important; }
            .modal-overlay.z-high { align-items: center; }
            .modal-card.small-card { width: 90% !important; max-height: none !important; border-radius: 15px !important; padding: 25px !important; }
            .form-row { flex-direction: column; gap: 0; }
        }
    </style>

    <div class="clients-main">
        <div class="dash-header">
            <div class="dash-title">
                <h1>Clients</h1>
                <p>Répertoire & Historique</p>
            </div>
            <div class="header-actions">
                <button class="btn-action" id="btnNewClient">
                    <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    Nouveau client
                </button>
                <button class="btn-header-icon" id="btnShowCorbeille" title="Ouvrir la corbeille" style="display:none">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>
        </div>

        <div class="toolbar">
            <div class="search-box">
                <span class="search-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                <input type="text" id="clientSearch" placeholder="Rechercher (Nom, Tél, Adresse...)">
            </div>
            <select id="statusFilter" class="filter-select">
                <option value="all">Tous les statuts</option>
                <option value="commercial">Commercial</option>
                <option value="residentiel">Résidentiel</option>
                <option value="prospect">Prospect</option>
            </select>
        </div>

        <div class="discrete-stats" id="filterResultText">Total : 0 client(s) dans le répertoire.</div>
        <div class="client-list" id="clientListContainer"></div>
    </div>

    <!-- Modal visualisation -->
    <div class="modal-overlay" id="viewModal">
        <div class="modal-card">
            <div class="modal-title" id="viewModalTitle">Fiche Client</div>
            <div id="vAlertSection" style="display:none" class="box-alert">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>ATTENTION : <span id="vAlertText"></span></span>
            </div>
            <div class="view-section-title">Informations Générales</div>
            <div class="view-row"><div class="view-label">Entreprise</div><div class="view-val" id="vCompany">-</div></div>
            <div class="view-row" id="vRowSubcontractor" style="display:none"><div class="view-label">Sous-traitant</div><div class="view-val" id="vSubcontractor">-</div></div>
            <div class="view-row"><div class="view-label">Contact Dossier</div><div class="view-val" id="vContact">-</div></div>
            <div class="view-row"><div class="view-label">Statut</div><div class="view-val" id="vStatus">-</div></div>
            <div class="view-row" style="flex-direction:column;align-items:flex-start;gap:10px">
                <div style="display:flex;width:100%"><div class="view-label">Adresse</div><div class="view-val" id="vAddress">-</div></div>
                <div class="gps-options">
                    <a href="#" id="vLinkGoogle" target="_blank" class="gps-btn gps-google">📍 Google Maps</a>
                    <a href="#" id="vLinkApple" target="_blank" class="gps-btn gps-apple">🗺 Apple Plans</a>
                </div>
            </div>
            <div class="view-section-title">Liste des Contacts</div>
            <div id="vContactsList"></div>
            <div id="vTarifSection" style="display:none">
                <div class="view-section-title">Spécifications Tarifaires</div>
                <div class="box-note" id="vTarif" style="border-color:var(--accent);color:#fff;font-style:normal"></div>
            </div>
            <div class="view-section-title">Notes Dossier</div>
            <div class="box-note" id="vNotes"></div>
            <div id="vFacturesSection" style="display:none">
                <div class="view-section-title" style="color:var(--btn-blue)">Factures associées</div>
                <div id="vFacturesList" style="display:flex;flex-direction:column;gap:8px"></div>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" id="btnCloseView">Fermer</button>
                <button class="btn-submit" id="btnSwitchToEdit">
                    <svg viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                    Modifier
                </button>
            </div>
        </div>
    </div>

    <!-- Modal édition -->
    <div class="modal-overlay" id="editModal">
        <div class="modal-card">
            <div class="modal-title" id="edModalTitle">Éditer Client</div>
            <input type="hidden" id="edId">
            <div class="form-group">
                <label style="color:var(--btn-red);font-weight:bold;display:flex;align-items:center;gap:5px">
                    <svg width="14" height="14" style="stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Alerte Prioritaire (Chien, Mauvais payeur...)
                </label>
                <input type="text" id="edAlert" placeholder="S'affiche en rouge..." style="border-color:var(--btn-red)">
            </div>
            <div class="form-row">
                <div class="form-group" style="flex:2">
                    <label>Nom de l'entreprise</label>
                    <input type="text" id="edCompany" placeholder="Ex: Bridgestone">
                </div>
                <div class="form-group" style="flex:1">
                    <label>Statut</label>
                    <div class="select-wrap">
                        <select id="edStatus">
                            <option value="residentiel">Résidentiel</option>
                            <option value="commercial">Commercial</option>
                            <option value="prospect">Prospect / Inconnu</option>
                        </select>
                        <svg class="sel-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                </div>
            </div>
            <div class="form-group" id="grpSubcontractor" style="display:none">
                <label>Nom du sous-traitant <span style="color:#aaa;font-weight:normal;font-size:12px">(Optionnel)</span></label>
                <input type="text" id="edSubcontractor" placeholder="Ex: Equans">
            </div>
            <div class="form-group">
                <label>Contact principal</label>
                <input type="text" id="edContact" placeholder="Ex: Marie Tremblay">
            </div>
            <div class="form-group">
                <label>Adresse principale <span style="color:var(--btn-red)">*</span></label>
                <input type="text" id="edAddress" placeholder="Adresse complète (Obligatoire)">
            </div>
            <div class="form-group">
                <label>Contacts (Téléphones / Courriels) <span style="color:var(--btn-red)">*</span></label>
                <div class="contacts-container" id="edContactsList"></div>
                <button type="button" class="btn-add-contact" id="btnAddContact">+ Ajouter un contact</button>
            </div>
            <div class="form-group" id="grpTarif" style="display:none">
                <label style="color:var(--accent);font-weight:bold">Spécifications tarifaires</label>
                <textarea id="edTarif" rows="3" placeholder="Taux, Déplacement..."></textarea>
            </div>
            <div class="form-group">
                <label>Notes internes</label>
                <textarea id="edNotes" rows="3" placeholder="Notes..."></textarea>
            </div>
            <div class="modal-actions" id="edModalActions"></div>
        </div>
    </div>

    <!-- Modal confirmation suppression -->
    <div class="modal-overlay z-high" id="confirmModal">
        <div class="modal-card small-card">
            <div class="modal-title" style="color:var(--btn-red);text-decoration:none;border:none">Supprimer ce client ?</div>
            <div style="color:#aaa;margin-bottom:20px">Le client sera déplacé dans la corbeille.</div>
            <div class="modal-actions center">
                <button class="btn-cancel" id="btnCancelDelete">Annuler</button>
                <button class="btn-delete" id="btnExecuteDelete">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Oui, supprimer
                </button>
            </div>
        </div>
    </div>

    <!-- Modal hard delete -->
    <div class="modal-overlay z-high" id="hardConfirmModal" style="z-index:5000">
        <div class="modal-card small-card">
            <div class="modal-title" style="color:var(--btn-red);text-decoration:none;border:none">Action irréversible</div>
            <div style="color:#aaa;margin-bottom:20px;font-size:14px;line-height:1.5">Le client sera détruit à tout jamais. Cette action est impossible à annuler.</div>
            <div class="modal-actions center">
                <button class="btn-cancel" id="btnCancelHard">Annuler</button>
                <button class="btn-delete" id="btnExecuteHard">Oui, détruire</button>
            </div>
        </div>
    </div>

    <!-- Modal corbeille -->
    <div class="modal-overlay" id="corbeilleModal">
        <div class="modal-card">
            <div class="modal-title" style="color:var(--btn-red);display:flex;align-items:center;justify-content:center;gap:8px">
                <svg width="24" height="24" style="stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Corbeille de Sécurité
            </div>
            <p style="color:#aaa;text-align:center;margin-bottom:20px;font-size:13px">Ces clients ont été supprimés. Vous pouvez les restaurer ou les détruire définitivement.</p>
            <div id="corbeilleList"></div>
            <div class="modal-actions" style="margin-top:30px">
                <button class="btn-cancel" id="btnCloseCorbeille">Fermer</button>
            </div>
        </div>
    </div>

    <!-- Modal alerte -->
    <div class="modal-overlay z-high" id="alertModal" style="z-index:5000">
        <div class="modal-card small-card">
            <div class="modal-title" style="color:var(--accent);border:none;margin-bottom:10px">Information</div>
            <p id="alertMessage" style="color:#e0e0e0;margin-bottom:25px;font-size:15px"></p>
            <button class="btn-action" style="width:100%;justify-content:center" id="btnCloseAlert">Compris</button>
        </div>
    </div>
    `

    await init()
}

// ── Init ────────────────────────────────────────────────────────────────────
async function init() {
    // Permissions
    if (hasPermission('delete_clients')) {
        document.getElementById('btnShowCorbeille').style.display = 'flex'
    }
    if (!hasPermission('create_clients')) {
        document.getElementById('btnNewClient').style.display = 'none'
    }

    // Boutons header
    document.getElementById('btnNewClient').addEventListener('click', () => openEditModal())
    document.getElementById('btnShowCorbeille').addEventListener('click', openCorbeille)

    // Recherche et filtres
    document.getElementById('clientSearch').addEventListener('keyup', filterClients)
    document.getElementById('statusFilter').addEventListener('change', filterClients)

    // Modal view
    document.getElementById('btnCloseView').addEventListener('click', () => closeModal('viewModal'))
    document.getElementById('btnSwitchToEdit').addEventListener('click', () => {
        closeModal('viewModal')
        openEditModal(currentViewingId)
    })

    // Modal edit
    document.getElementById('edStatus').addEventListener('change', toggleCommercialFields)
    document.getElementById('btnAddContact').addEventListener('click', () => addContactRow())

    // Modal confirm delete
    document.getElementById('btnCancelDelete').addEventListener('click', () => closeModal('confirmModal'))
    document.getElementById('btnExecuteDelete').addEventListener('click', executeDeleteClient)

    // Modal hard delete
    document.getElementById('btnCancelHard').addEventListener('click', () => { closeModal('hardConfirmModal'); hardDeleteId = null })
    document.getElementById('btnExecuteHard').addEventListener('click', executeHardDelete)

    // Modal corbeille
    document.getElementById('btnCloseCorbeille').addEventListener('click', () => closeModal('corbeilleModal'))

    // Alerte
    document.getElementById('btnCloseAlert').addEventListener('click', () => closeModal('alertModal'))

    await loadClients()
}

// ── Chargement ──────────────────────────────────────────────────────────────
async function loadClients(reset = true) {
    if (reset) { clientsPage = 0; clients = [] }
    const from = clientsPage * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('nom', { ascending: true })
        .range(from, to + 1)

    if (error) { console.error('Erreur chargement clients:', error); return }

    clientsHasMore = (data || []).length > PAGE_SIZE
    const pageData = (data || []).slice(0, PAGE_SIZE)
    clients = reset ? pageData : [...clients, ...pageData]

    updateCorbeilleCount()
    filterClients()
}

async function chargerPlusClients() {
    const btn = document.getElementById('btn-charger-plus-clients')
    if (btn) { btn.disabled = true; btn.textContent = 'Chargement...' }
    clientsPage++
    try {
        await loadClients(false)
    } catch (e) {
        console.error('[clients] Erreur chargement page suivante:', e?.message)
        clientsPage--
        if (btn) { btn.disabled = false; btn.textContent = `Charger ${PAGE_SIZE} clients de plus...` }
    }
}

// ── Sauvegarde ──────────────────────────────────────────────────────────────
async function saveClient() {
    const id = document.getElementById('edId').value
    const alertVal = document.getElementById('edAlert').value.trim()
    const company = document.getElementById('edCompany').value.trim()
    const contact = document.getElementById('edContact').value.trim()
    const address = document.getElementById('edAddress').value.trim()
    const status = document.getElementById('edStatus').value
    const notes = document.getElementById('edNotes').value
    const tarif = document.getElementById('edTarif').value
    let subcontractor = document.getElementById('edSubcontractor').value.trim()
    if (status !== 'commercial') subcontractor = ''

    if (!company && !contact && !subcontractor) { openAlertModal("Vous devez entrer au moins un Nom d'entreprise, un Sous-traitant ou un Contact principal."); return }
    if (!address) { openAlertModal("L'adresse est obligatoire pour créer la fiche client."); return }

    let contactsList = []
    let hasPhone = false
    document.querySelectorAll('#edContactsList .contact-row').forEach(row => {
        const name = row.querySelector('.inp-name')?.value.trim() || ''
        const role = row.querySelector('.inp-role')?.value.trim() || ''
        const phone = row.querySelector('.inp-phone')?.value.trim() || ''
        const email = row.querySelector('.inp-email')?.value.trim() || ''
        if (phone.length > 0) hasPhone = true
        if (name || phone || email) contactsList.push({ name, role, phone, email })
    })

    if (!hasPhone) { openAlertModal("Il faut ajouter au moins un numéro de téléphone valide."); return }

    const phoneRe = /^[\d\s\(\)\-\+\.]{7,20}$/
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    for (const ct of contactsList) {
        if (ct.phone && !phoneRe.test(ct.phone)) { openAlertModal(`Numéro de téléphone invalide : "${ct.phone}"`); return }
        if (ct.email && !emailRe.test(ct.email)) { openAlertModal(`Adresse courriel invalide : "${ct.email}"`); return }
    }

    const fullPayload = {
        nom: company || subcontractor || contact,
        type: status,
        telephone: contactsList[0]?.phone || '',
        courriel: contactsList[0]?.email || '',
        adresse: address,
        contacts: {
            list: contactsList,
            company, subcontractor, contact,
            alert: alertVal, tarif, notes
        },
        notes,
        user_id: currentUser.id,
        est_supprime: false
    }

    let error
    if (id) {
        const { error: e } = await supabase.from('clients').update(fullPayload).eq('id', id)
        error = e
    } else {
        const { error: e } = await supabase.from('clients').insert([fullPayload])
        error = e
    }

    if (error) { openAlertModal('Erreur lors de la sauvegarde : ' + error.message); return }
    await loadClients()
    closeModal('editModal')
}

// ── Suppression ─────────────────────────────────────────────────────────────
async function executeDeleteClient() {
    if (!clientToDeleteId) { closeModal('confirmModal'); return }
    const { data, error } = await supabase.from('clients').update({ est_supprime: true }).eq('id', clientToDeleteId).select()
    closeModal('confirmModal')
    if (error) { openAlertModal('Erreur lors de la suppression : ' + (error.message || 'inconnue')); return }
    if (!data || data.length === 0) { openAlertModal("La suppression a été bloquée par les permissions de la base de données."); return }
    closeModal('editModal')
    await loadClients()
    showToast('✓ Client déplacé dans la corbeille')
}

async function restaurerClient(id) {
    const { data, error } = await supabase.from('clients').update({ est_supprime: false }).eq('id', id).select()
    if (error) { openAlertModal('Erreur lors de la restauration : ' + (error.message || 'inconnue')); return }
    if (!data || data.length === 0) { openAlertModal("La restauration a été bloquée par les permissions."); return }
    await loadClients()
    showToast('✓ Client restauré')
    openCorbeille()
}

async function executeHardDelete() {
    if (!hardDeleteId) return
    const { error } = await supabase.from('clients').delete().eq('id', hardDeleteId)
    if (error) { openAlertModal('Erreur lors de la suppression : ' + error.message) }
    closeModal('hardConfirmModal')
    hardDeleteId = null
    await loadClients()
    openCorbeille()
}

// ── Rendu liste ─────────────────────────────────────────────────────────────
function renderClients(list) {
    const container = document.getElementById('clientListContainer')
    if (!container) return
    container.innerHTML = ''

    if (list.length === 0) {
        container.innerHTML = '<div style="color:#aaa;text-align:center;padding:30px;font-style:italic">Aucun client trouvé.</div>'
        return
    }

    list.forEach(c => {
        const extra = c.contacts || {}
        const contactsList = extra.list || []
        const company = extra.company || c.nom || ''
        const subcontractor = extra.subcontractor || ''
        const contact = extra.contact || ''
        const alertVal = extra.alert || ''
        const status = c.type || 'prospect'
        const mainContact = contactsList[0] || { phone: '' }

        const statusIcons = {
            commercial: `<svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01"/></svg> Commercial`,
            residentiel: `<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Résidentiel`,
            prospect: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Prospect`
        }

        const mainName = company || subcontractor || contact || 'Sans nom'
        let chipsHTML = ''
        if (status === 'commercial' && company && subcontractor) chipsHTML += `<span class="cli-chip-sub"><strong>${sanitize(subcontractor)}</strong></span>`
        if (status === 'commercial' && contact && contact !== mainName) chipsHTML += `<span class="cli-chip-contact">${sanitize(contact)}</span>`

        const card = document.createElement('div')
        card.className = `client-item status-${status}`
        card.innerHTML = `
            <div class="cli-info">
                <div class="cli-status ${status}">${statusIcons[status] || statusIcons.prospect}</div>
                <div class="cli-name">
                    <div class="cli-name-container">
                        ${sanitize(mainName)} ${chipsHTML}
                        ${alertVal ? `<span class="cli-alert-badge"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ALERTE</span>` : ''}
                    </div>
                </div>
                <div class="cli-contact">
                    <div class="cli-contact-item">
                        <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.19 11.9 19.79 19.79 0 0 1 1.12 3.23 2 2 0 0 1 3.11 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        <span>${mainContact.phone ? `<a href="tel:${sanitize(mainContact.phone)}" style="color:inherit;text-decoration:none" onclick="event.stopPropagation()">${sanitize(mainContact.phone)}</a>` : '---'}</span>
                    </div>
                    <div class="cli-contact-item address">
                        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span style="line-height:1.3">${sanitize(c.adresse ? (c.adresse.length > 40 ? c.adresse.substring(0, 40) + '...' : c.adresse) : '---')}</span>
                    </div>
                </div>
            </div>
            <div class="cli-actions">
                <button class="btn-icon" data-edit="${c.id}" title="Modifier">
                    <svg viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
            </div>
        `

        card.addEventListener('click', () => openViewModal(c.id))
        card.querySelector('[data-edit]').addEventListener('click', e => {
            e.stopPropagation()
            openEditModal(c.id)
        })

        container.appendChild(card)
    })

    ajouterBoutonChargerPlus()
}

function filterClients() {
    const term = document.getElementById('clientSearch')?.value.toLowerCase() || ''
    const statusF = document.getElementById('statusFilter')?.value || 'all'
    const activeClients = clients.filter(c => !c.est_supprime)

    const filtered = activeClients.filter(c => {
        const extra = c.contacts || {}
        const matchTerm = (c.nom || '').toLowerCase().includes(term) ||
            (extra.company || '').toLowerCase().includes(term) ||
            (extra.subcontractor || '').toLowerCase().includes(term) ||
            (c.adresse || '').toLowerCase().includes(term) ||
            (c.telephone || '').includes(term) ||
            (extra.list || []).some(ct => (ct.phone || '').includes(term))
        const matchStatus = statusF === 'all' || c.type === statusF
        return matchTerm && matchStatus
    })

    const resText = document.getElementById('filterResultText')
    if (resText) {
        const suffixe = clientsHasMore ? ` (${clients.length} chargés — il y en a plus)` : ''
        resText.textContent = (statusF === 'all' && term === '')
            ? `Total : ${filtered.length} client(s) dans le répertoire.${suffixe}`
            : `${filtered.length} client(s) affiché(s) selon vos filtres.`
    }

    renderClients(filtered)
}

function ajouterBoutonChargerPlus() {
    const container = document.getElementById('clientListContainer')
    const old = document.getElementById('btn-charger-plus-clients')
    if (old) old.remove()
    if (!clientsHasMore || !container) return
    const btn = document.createElement('button')
    btn.id = 'btn-charger-plus-clients'
    btn.textContent = `Charger ${PAGE_SIZE} clients de plus...`
    btn.style.cssText = 'width:100%;padding:14px;margin-top:10px;background:var(--bg-panel);color:var(--text-muted);border:1px dashed var(--border);border-radius:10px;cursor:pointer;font-size:14px;font-weight:bold'
    btn.addEventListener('click', chargerPlusClients)
    container.appendChild(btn)
}

function updateCorbeilleCount() {
    const count = clients.filter(c => c.est_supprime).length
    const btn = document.getElementById('btnShowCorbeille')
    if (btn) btn.title = `Corbeille (${count})`
}

// ── Modal visualisation ─────────────────────────────────────────────────────
function openViewModal(id) {
    currentViewingId = id
    const c = clients.find(cl => cl.id === id)
    if (!c) return

    const extra = c.contacts || {}
    const contactsList = extra.list || []

    document.getElementById('vCompany').textContent = extra.company || c.nom || '-'
    document.getElementById('vContact').textContent = extra.contact || '-'
    document.getElementById('vStatus').textContent = c.type || '-'
    document.getElementById('vAddress').textContent = c.adresse || '-'
    document.getElementById('vNotes').textContent = extra.notes || c.notes || 'Aucune note.'

    const secSub = document.getElementById('vRowSubcontractor')
    if (c.type === 'commercial' && extra.subcontractor) {
        secSub.style.display = 'flex'
        document.getElementById('vSubcontractor').textContent = extra.subcontractor
    } else { secSub.style.display = 'none' }

    document.getElementById('vLinkGoogle').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.adresse || '')}`
    document.getElementById('vLinkApple').href = `http://maps.apple.com/?q=${encodeURIComponent(c.adresse || '')}`

    const alertSec = document.getElementById('vAlertSection')
    if (extra.alert) { alertSec.style.display = 'flex'; document.getElementById('vAlertText').textContent = extra.alert }
    else { alertSec.style.display = 'none' }

    const secTarif = document.getElementById('vTarifSection')
    if (c.type === 'commercial' && extra.tarif) { secTarif.style.display = 'block'; document.getElementById('vTarif').textContent = extra.tarif }
    else { secTarif.style.display = 'none' }

    const contList = document.getElementById('vContactsList')
    contList.innerHTML = ''
    contactsList.forEach(ct => {
        const phoneLink = ct.phone ? `<a href="tel:${sanitize(ct.phone)}" style="color:white;text-decoration:none;font-weight:bold" onclick="event.stopPropagation()">${sanitize(ct.phone)}</a>` : '---'
        const emailLink = ct.email ? `<a href="mailto:${sanitize(ct.email)}" style="color:#aaa;font-size:11px;text-decoration:none" onclick="event.stopPropagation()">${sanitize(ct.email)}</a>` : ''
        contList.insertAdjacentHTML('beforeend', `<div class="contact-item"><div><div class="ci-name">${sanitize(ct.name)}</div>${ct.role ? `<div class="ci-role" style="margin-top:4px">${sanitize(ct.role)}</div>` : ''}</div><div style="text-align:right"><div>${phoneLink}</div><div>${emailLink}</div></div></div>`)
    })

    const nomClient = extra.company || c.nom || ''
    if (nomClient) loadFacturesClient(nomClient)
    else { const s = document.getElementById('vFacturesSection'); if (s) s.style.display = 'none' }

    document.getElementById('viewModal').classList.add('open')
}

async function loadFacturesClient(clientNom) {
    const section = document.getElementById('vFacturesSection')
    const list = document.getElementById('vFacturesList')
    if (!section || !list) return
    list.innerHTML = '<div style="color:#888;font-size:13px">Chargement...</div>'
    section.style.display = 'block'

    const { data: factures } = await supabase
        .from('factures')
        .select('id, date, status')
        .ilike('client', `%${clientNom}%`)
        .order('created_at', { ascending: false })
        .limit(10)

    if (!factures || factures.length === 0) {
        list.innerHTML = '<div style="color:#888;font-size:13px;font-style:italic">Aucune facture trouvée pour ce client.</div>'
        return
    }

    const statusColors = { 'brouillon': '#888', 'envoyee': 'var(--btn-blue)', 'approuvee': 'var(--btn-green)', 'renvoye': 'var(--btn-red)', 'Convertie': 'var(--btn-purple)' }
    const statusBg = { 'brouillon': 'rgba(136,136,136,0.15)', 'envoyee': 'rgba(52,152,219,0.15)', 'approuvee': 'rgba(40,167,69,0.15)', 'renvoye': 'rgba(255,77,77,0.15)', 'Convertie': 'rgba(156,39,176,0.15)' }
    list.innerHTML = factures.map(f => {
        const color = statusColors[f.status] || '#888'
        const bg = statusBg[f.status] || 'rgba(136,136,136,0.15)'
        return `
        <div style="background:var(--bg-dark);border-radius:8px;padding:10px 15px;display:flex;justify-content:space-between;align-items:center;border-left:4px solid ${color}">
            <span style="color:white;font-weight:bold;font-family:monospace">${sanitize(f.id)}</span>
            <span style="color:var(--text-muted);font-size:13px">${sanitize(f.date || '')}</span>
            <span style="font-size:12px;padding:3px 10px;border-radius:6px;background:${bg};color:${color};font-weight:bold">${sanitize(f.status || '')}</span>
        </div>`
    }).join('')
}

// ── Modal édition ───────────────────────────────────────────────────────────
function openEditModal(id = null) {
    const actionsDiv = document.getElementById('edModalActions')
    const contList = document.getElementById('edContactsList')
    contList.innerHTML = ''

    actionsDiv.innerHTML = `
        <button class="btn-cancel" id="btnCancelEdit">Annuler</button>
        <button class="btn-submit" id="btnSaveClient">
            <svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Enregistrer
        </button>
    `
    document.getElementById('btnCancelEdit').addEventListener('click', () => closeModal('editModal'))
    document.getElementById('btnSaveClient').addEventListener('click', saveClient)

    if (id) {
        const c = clients.find(cl => cl.id === id)
        if (!c) return
        const extra = c.contacts || {}
        document.getElementById('edId').value = c.id
        document.getElementById('edAlert').value = extra.alert || ''
        document.getElementById('edCompany').value = extra.company || ''
        document.getElementById('edSubcontractor').value = extra.subcontractor || ''
        document.getElementById('edContact').value = extra.contact || ''
        document.getElementById('edAddress').value = c.adresse || ''
        document.getElementById('edStatus').value = c.type || 'residentiel'
        document.getElementById('edNotes').value = extra.notes || c.notes || ''
        document.getElementById('edTarif').value = extra.tarif || ''
        const list = extra.list || []
        list.forEach(ct => addContactRow(ct))
        if (list.length === 0) addContactRow()
        toggleCommercialFields()

        if (hasPermission('delete_clients')) {
            const btnDel = document.createElement('button')
            btnDel.className = 'btn-delete'
            btnDel.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Supprimer`
            btnDel.addEventListener('click', () => {
                clientToDeleteId = c.id
                document.getElementById('confirmModal').classList.add('open')
            })
            actionsDiv.prepend(btnDel)
        }
    } else {
        document.getElementById('edId').value = ''
        document.getElementById('edAlert').value = ''
        document.getElementById('edStatus').value = 'residentiel'
        document.getElementById('edCompany').value = ''
        document.getElementById('edSubcontractor').value = ''
        document.getElementById('edContact').value = ''
        document.getElementById('edAddress').value = ''
        document.getElementById('edNotes').value = ''
        document.getElementById('edTarif').value = ''
        toggleCommercialFields()
        addContactRow()
    }

    document.getElementById('edModalTitle').textContent = id ? 'Éditer Client' : 'Nouveau Client'
    document.getElementById('editModal').classList.add('open')
}

function toggleCommercialFields() {
    const isCommercial = document.getElementById('edStatus').value === 'commercial'
    document.getElementById('grpTarif').style.display = isCommercial ? 'block' : 'none'
    document.getElementById('grpSubcontractor').style.display = isCommercial ? 'block' : 'none'
}

function addContactRow(data = { name: '', role: '', phone: '', email: '' }) {
    const div = document.createElement('div')
    div.className = 'contact-row'
    div.innerHTML = `
        <div class="contact-inputs">
            <input type="text" placeholder="Nom" class="inp-name" value="${sanitize(data.name || '')}">
            <input type="text" placeholder="Poste" class="inp-role" value="${sanitize(data.role || '')}">
            <input type="text" placeholder="Tél" class="inp-phone" value="${sanitize(data.phone || '')}">
            <input type="email" placeholder="Email" class="inp-email" value="${sanitize(data.email || '')}">
        </div>
        <button class="btn-remove-row">×</button>
    `
    div.querySelector('.btn-remove-row').addEventListener('click', () => div.remove())
    div.querySelector('.inp-phone').addEventListener('keyup', e => formatPhone(e.target))
    document.getElementById('edContactsList').appendChild(div)
}

// ── Corbeille ───────────────────────────────────────────────────────────────
function openCorbeille() {
    const list = document.getElementById('corbeilleList')
    list.innerHTML = ''
    const deleted = clients.filter(c => c.est_supprime)

    if (deleted.length === 0) {
        list.innerHTML = '<div style="color:#aaa;text-align:center;padding:20px">La corbeille est vide.</div>'
    } else {
        deleted.forEach(c => {
            const div = document.createElement('div')
            div.className = 'corbeille-item'
            div.innerHTML = `
                <div>
                    <div style="color:white;font-weight:bold">${sanitize(c.nom || 'Sans nom')}</div>
                    <div style="color:#888;font-size:12px">${sanitize(c.adresse || '')}</div>
                </div>
                <div style="display:flex;gap:10px">
                    <button style="background:var(--btn-green);color:white;border:none;padding:8px 12px;border-radius:5px;cursor:pointer;font-weight:bold" data-restore="${c.id}">Restaurer</button>
                    <button style="background:var(--btn-red);color:white;border:none;padding:8px 12px;border-radius:5px;cursor:pointer;font-weight:bold" data-hard="${c.id}">Détruire</button>
                </div>
            `
            list.appendChild(div)
        })
        list.querySelectorAll('[data-restore]').forEach(btn => btn.addEventListener('click', () => restaurerClient(btn.dataset.restore)))
        list.querySelectorAll('[data-hard]').forEach(btn => btn.addEventListener('click', () => {
            hardDeleteId = btn.dataset.hard
            document.getElementById('hardConfirmModal').classList.add('open')
        }))
    }
    document.getElementById('corbeilleModal').classList.add('open')
}

function showToast(msg, color = 'var(--btn-green)') {
    const t = document.createElement('div')
    t.textContent = msg
    t.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${color};color:white;padding:10px 22px;border-radius:8px;font-weight:bold;font-size:14px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.4);pointer-events:none;transition:opacity 0.4s`
    document.body.appendChild(t)
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400) }, 2500)
}

// ── Utilitaires ─────────────────────────────────────────────────────────────
function openAlertModal(msg) {
    document.getElementById('alertMessage').textContent = msg
    document.getElementById('alertModal').classList.add('open')
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open')
}

function formatPhone(input) {
    let v = input.value.replace(/\D/g, '')
    if (v.length > 3 && v.length <= 6) v = v.slice(0, 3) + '-' + v.slice(3)
    else if (v.length > 6) v = v.slice(0, 3) + '-' + v.slice(3, 6) + '-' + v.slice(6, 10)
    input.value = v
}