import{t as e}from"./supabase-BHP_DPH_.js";import{i as t,r as n}from"./auth-BoJf8KxA.js";function r(e){return e?String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`):``}var i=[],a=null,o=null,s=0,c=25,l=!1,u=null;async function d(e){e.innerHTML=`
    <style>
        .clients-main { padding: 30px; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .dash-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .header-actions { display: flex; align-items: center; gap: 15px; }
        .btn-action { background-color: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; white-space: nowrap; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3);}
        .btn-action:hover { background-color: var(--accent-hover); transform: translateY(-2px); }
        .btn-action svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-header-icon { background: #444; border: none; width: 38px; height: 38px; border-radius: 8px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; color: #ccc; flex-shrink: 0; }
        .btn-header-icon svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-header-icon:hover { background: var(--btn-red); color: white; }
        .toolbar { display: flex; gap: 15px; align-items: center; background-color: var(--bg-panel); padding: 15px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input { width: 100%; background: #1e1f26; border: 1px solid #444; color: white; padding: 14px 15px 14px 45px; border-radius: 8px; font-size: 16px; outline: none; transition: 0.2s; }
        .search-box input:focus { border-color: var(--accent); }
        .search-icon { position: absolute; left: 15px; color: #888; pointer-events: none; display: flex; align-items: center; }
        .search-icon svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .filter-select { background: #1e1f26; border: 1px solid #444; color: white; padding: 14px 15px; border-radius: 8px; font-size: 15px; outline: none; cursor: pointer; min-width: 180px; font-family: inherit; }
        .filter-select:focus { border-color: var(--accent); }
        .discrete-stats { color: #aaa; font-size: 13px; font-style: italic; margin-top: 5px; margin-bottom: 5px; padding-left: 10px; }
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
        .cli-chip-sub { font-size: 13px; color: white; background: #3a3b46; padding: 4px 12px; border-radius: 6px; font-weight: bold; border: 1px solid #555; }
        .cli-chip-contact { font-size: 12px; color: var(--accent); background: rgba(252,202,70,0.15); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(252,202,70,0.3); }
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

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.75); display: none; z-index: 4000; justify-content: center; align-items: center; }
        .modal-overlay.open { display: flex; }
        .modal-overlay.z-high { z-index: 4500; background: rgba(0,0,0,0.85); }
        .modal-card { background: var(--bg-panel); width: 850px; padding: 30px; border-radius: 15px; border: 1px solid #555; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-height: 90vh; overflow-y: auto; }
        .modal-card.small-card { width: 350px; text-align: center; }
        .modal-title { font-size: 28px; color: white; margin-bottom: 20px; font-weight: bold; border-bottom: 2px solid var(--accent); padding-bottom: 10px; display: inline-block; }
        .form-group { margin-bottom: 15px; text-align: left; }
        .form-group label { display: block; color: #aaa; margin-bottom: 5px; font-size: 14px; font-weight: bold; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 12px; background: #1e1f26; border: 1px solid #555; color: white; border-radius: 8px; font-family: sans-serif; font-size: 14px; outline: none; box-sizing: border-box; }
        .form-group input:focus, .form-group textarea:focus { border-color: var(--accent); }
        .form-row { display: flex; gap: 15px; }
        .contacts-container { border: 1px solid #444; padding: 10px; border-radius: 8px; background: #1e1f26; margin-bottom: 15px; }
        .contact-row { display: flex; gap: 8px; margin-bottom: 10px; align-items: center; }
        .contact-row input { flex: 1; background: #1e1f26; border: 1px solid #555; color: white; padding: 10px; border-radius: 6px; font-size: 14px; outline: none; }
        .contact-row input:focus { border-color: var(--accent); }
        .btn-add-contact { background: #444; color: white; width: 100%; padding: 10px; border: 1px dashed #666; border-radius: 8px; cursor: pointer; font-size: 13px; margin-top: 5px; }
        .btn-add-contact:hover { background: #555; }
        .btn-remove-row { background: transparent; border: none; color: #ff4d4d; cursor: pointer; font-weight: bold; font-size: 20px; display: flex; align-items: center; justify-content: center; }
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
        .box-note { background: #1e1f26; padding: 10px; border-radius: 8px; color: #ddd; font-style: italic; min-height: 40px; white-space: pre-wrap; border: 1px solid #444; }
        .box-alert { background: rgba(255,77,77,0.1); border: 1px solid var(--btn-red); color: var(--btn-red); padding: 10px; border-radius: 8px; font-weight: bold; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
        .box-alert svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .contact-item { background: #333; padding: 12px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
        .ci-name { font-weight: bold; color: white; font-size: 15px; }
        .ci-role { font-size: 12px; color: var(--accent); font-style: italic; background: rgba(252,202,70,0.1); padding: 1px 6px; border-radius: 4px; display: inline-block; }
        .corbeille-item { background: #1a1b23; border: 1px dashed var(--btn-red); padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }

        @media (max-width: 768px) {
            .clients-main { padding: 15px; }
            .dash-header { flex-direction: column; align-items: flex-start; gap: 15px; }
            .header-actions { width: 100%; }
            .btn-action { flex: 1; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: 0.2s;}
            .discrete-stats { margin-top: -5px; margin-bottom: 0; text-align: center; padding-left: 0; }
            .toolbar { flex-direction: column; align-items: stretch; gap: 10px; width: 100%; }
            .filter-select { width: 100%; }
            .client-item { flex-direction: column; align-items: flex-start; gap: 15px; }
            .cli-info { flex-direction: column; align-items: flex-start; gap: 5px; width: 100%; }
            .cli-status { width: auto; }
            .cli-contact { width: 100%; align-items: flex-start; }
            .cli-contact-item { justify-content: flex-start; text-align: left; }
            .cli-actions { align-self: flex-end; margin-left: 0; margin-top: -35px; }
            .modal-card { width: 95% !important; padding: 20px !important; box-shadow: 0 10px 25px rgba(0,0,0,0.5);}
            .form-row { flex-direction: column; gap: 0; }
            .contact-row { flex-wrap: wrap; }
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
                    <select id="edStatus">
                        <option value="residentiel">Résidentiel</option>
                        <option value="commercial">Commercial</option>
                        <option value="prospect">Prospect / Inconnu</option>
                    </select>
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
    `,await f()}async function f(){t(`delete_clients`)&&(document.getElementById(`btnShowCorbeille`).style.display=`flex`),t(`create_clients`)||(document.getElementById(`btnNewClient`).style.display=`none`),document.getElementById(`btnNewClient`).addEventListener(`click`,()=>T()),document.getElementById(`btnShowCorbeille`).addEventListener(`click`,O),document.getElementById(`clientSearch`).addEventListener(`keyup`,b),document.getElementById(`statusFilter`).addEventListener(`change`,b),document.getElementById(`btnCloseView`).addEventListener(`click`,()=>A(`viewModal`)),document.getElementById(`btnSwitchToEdit`).addEventListener(`click`,()=>{A(`viewModal`),T(u)}),document.getElementById(`edStatus`).addEventListener(`change`,E),document.getElementById(`btnAddContact`).addEventListener(`click`,()=>D()),document.getElementById(`btnCancelDelete`).addEventListener(`click`,()=>A(`confirmModal`)),document.getElementById(`btnExecuteDelete`).addEventListener(`click`,g),document.getElementById(`btnCancelHard`).addEventListener(`click`,()=>{A(`hardConfirmModal`),o=null}),document.getElementById(`btnExecuteHard`).addEventListener(`click`,v),document.getElementById(`btnCloseCorbeille`).addEventListener(`click`,()=>A(`corbeilleModal`)),document.getElementById(`btnCloseAlert`).addEventListener(`click`,()=>A(`alertModal`)),await p()}async function p(t=!0){t&&(s=0,i=[]);let n=s*c,r=n+c-1,{data:a,error:o}=await e.from(`clients`).select(`*`).order(`nom`,{ascending:!0}).range(n,r+1);if(o){console.error(`Erreur chargement clients:`,o);return}l=(a||[]).length>c;let u=(a||[]).slice(0,c);i=t?u:[...i,...u],S(),b()}async function m(){let e=document.getElementById(`btn-charger-plus-clients`);e&&(e.disabled=!0,e.textContent=`Chargement...`),s++,await p(!1)}async function h(){let t=document.getElementById(`edId`).value,r=document.getElementById(`edAlert`).value.trim(),i=document.getElementById(`edCompany`).value.trim(),a=document.getElementById(`edContact`).value.trim(),o=document.getElementById(`edAddress`).value.trim(),s=document.getElementById(`edStatus`).value,c=document.getElementById(`edNotes`).value,l=document.getElementById(`edTarif`).value,u=document.getElementById(`edSubcontractor`).value.trim();if(s!==`commercial`&&(u=``),!i&&!a&&!u){k(`Vous devez entrer au moins un Nom d'entreprise, un Sous-traitant ou un Contact principal.`);return}if(!o){k(`L'adresse est obligatoire pour créer la fiche client.`);return}let d=[],f=!1;if(document.querySelectorAll(`#edContactsList .contact-row`).forEach(e=>{let t=e.querySelector(`.inp-name`)?.value.trim()||``,n=e.querySelector(`.inp-role`)?.value.trim()||``,r=e.querySelector(`.inp-phone`)?.value.trim()||``,i=e.querySelector(`.inp-email`)?.value.trim()||``;r.length>0&&(f=!0),(t||r||i)&&d.push({name:t,role:n,phone:r,email:i})}),!f){k(`Il faut ajouter au moins un numéro de téléphone valide.`);return}let m={nom:i||u||a,type:s,telephone:d[0]?.phone||``,courriel:d[0]?.email||``,adresse:o,contacts:{list:d,company:i,subcontractor:u,contact:a,alert:r,tarif:l,notes:c},notes:c,user_id:n.id,est_supprime:!1},h;if(t){let{error:n}=await e.from(`clients`).update(m).eq(`id`,t);h=n}else{let{error:t}=await e.from(`clients`).insert([m]);h=t}if(h){k(`Erreur lors de la sauvegarde : `+h.message);return}await p(),A(`editModal`)}async function g(){if(!a){A(`confirmModal`);return}let{data:t,error:n}=await e.from(`clients`).update({est_supprime:!0}).eq(`id`,a).select();if(A(`confirmModal`),n){k(`Erreur lors de la suppression : `+(n.message||`inconnue`));return}if(!t||t.length===0){k(`La suppression a été bloquée par les permissions de la base de données.`);return}A(`editModal`),await p()}async function _(t){let{data:n,error:r}=await e.from(`clients`).update({est_supprime:!1}).eq(`id`,t).select();if(r){k(`Erreur lors de la restauration : `+(r.message||`inconnue`));return}if(!n||n.length===0){k(`La restauration a été bloquée par les permissions.`);return}await p(),O()}async function v(){if(!o)return;let{error:t}=await e.from(`clients`).delete().eq(`id`,o);t&&k(`Erreur lors de la suppression : `+t.message),A(`hardConfirmModal`),o=null,await p(),O()}function y(e){let t=document.getElementById(`clientListContainer`);if(t){if(t.innerHTML=``,e.length===0){t.innerHTML=`<div style="color:#aaa;text-align:center;padding:30px;font-style:italic">Aucun client trouvé.</div>`;return}e.forEach(e=>{let n=e.contacts||{},i=n.list||[],a=n.company||e.nom||``,o=n.subcontractor||``,s=n.contact||``,c=n.alert||``,l=e.type||`prospect`,u=i[0]||{phone:``},d={commercial:`<svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01"/></svg> Commercial`,residentiel:`<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Résidentiel`,prospect:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Prospect`},f=a||o||s||`Sans nom`,p=``;l===`commercial`&&a&&o&&(p+=`<span class="cli-chip-sub"><strong>${r(o)}</strong></span>`),l===`commercial`&&s&&s!==f&&(p+=`<span class="cli-chip-contact">${r(s)}</span>`);let m=document.createElement(`div`);m.className=`client-item status-${l}`,m.innerHTML=`
            <div class="cli-info">
                <div class="cli-status ${l}">${d[l]||d.prospect}</div>
                <div class="cli-name">
                    <div class="cli-name-container">
                        ${r(f)} ${p}
                        ${c?`<span class="cli-alert-badge"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ALERTE</span>`:``}
                    </div>
                </div>
                <div class="cli-contact">
                    <div class="cli-contact-item">
                        <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.19 11.9 19.79 19.79 0 0 1 1.12 3.23 2 2 0 0 1 3.11 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        <span>${u.phone?`<a href="tel:${r(u.phone)}" style="color:inherit;text-decoration:none" onclick="event.stopPropagation()">${r(u.phone)}</a>`:`---`}</span>
                    </div>
                    <div class="cli-contact-item address">
                        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span style="line-height:1.3">${r(e.adresse?e.adresse.length>40?e.adresse.substring(0,40)+`...`:e.adresse:`---`)}</span>
                    </div>
                </div>
            </div>
            <div class="cli-actions">
                <button class="btn-icon" data-edit="${e.id}" title="Modifier">
                    <svg viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
            </div>
        `,m.addEventListener(`click`,()=>C(e.id)),m.querySelector(`[data-edit]`).addEventListener(`click`,t=>{t.stopPropagation(),T(e.id)}),t.appendChild(m)}),x()}}function b(){let e=document.getElementById(`clientSearch`)?.value.toLowerCase()||``,t=document.getElementById(`statusFilter`)?.value||`all`,n=i.filter(e=>!e.est_supprime).filter(n=>{let r=n.contacts||{},i=(n.nom||``).toLowerCase().includes(e)||(r.company||``).toLowerCase().includes(e)||(r.subcontractor||``).toLowerCase().includes(e)||(n.adresse||``).toLowerCase().includes(e)||(n.telephone||``).includes(e)||(r.list||[]).some(t=>(t.phone||``).includes(e)),a=t===`all`||n.type===t;return i&&a}),r=document.getElementById(`filterResultText`);if(r){let a=l?` (${i.length} chargés — il y en a plus)`:``;r.textContent=t===`all`&&e===``?`Total : ${n.length} client(s) dans le répertoire.${a}`:`${n.length} client(s) affiché(s) selon vos filtres.`}y(n)}function x(){let e=document.getElementById(`clientListContainer`),t=document.getElementById(`btn-charger-plus-clients`);if(t&&t.remove(),!l||!e)return;let n=document.createElement(`button`);n.id=`btn-charger-plus-clients`,n.textContent=`Charger ${c} clients de plus...`,n.style.cssText=`width:100%;padding:14px;margin-top:10px;background:#2b2c36;color:#aaa;border:1px dashed #444;border-radius:10px;cursor:pointer;font-size:14px;font-weight:bold`,n.addEventListener(`click`,m),e.appendChild(n)}function S(){let e=i.filter(e=>e.est_supprime).length,t=document.getElementById(`btnShowCorbeille`);t&&(t.title=`Corbeille (${e})`)}function C(e){u=e;let t=i.find(t=>t.id===e);if(!t)return;let n=t.contacts||{},a=n.list||[];document.getElementById(`vCompany`).textContent=n.company||t.nom||`-`,document.getElementById(`vContact`).textContent=n.contact||`-`,document.getElementById(`vStatus`).textContent=t.type||`-`,document.getElementById(`vAddress`).textContent=t.adresse||`-`,document.getElementById(`vNotes`).textContent=n.notes||t.notes||`Aucune note.`;let o=document.getElementById(`vRowSubcontractor`);t.type===`commercial`&&n.subcontractor?(o.style.display=`flex`,document.getElementById(`vSubcontractor`).textContent=n.subcontractor):o.style.display=`none`,document.getElementById(`vLinkGoogle`).href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.adresse||``)}`,document.getElementById(`vLinkApple`).href=`http://maps.apple.com/?q=${encodeURIComponent(t.adresse||``)}`;let s=document.getElementById(`vAlertSection`);n.alert?(s.style.display=`flex`,document.getElementById(`vAlertText`).textContent=n.alert):s.style.display=`none`;let c=document.getElementById(`vTarifSection`);t.type===`commercial`&&n.tarif?(c.style.display=`block`,document.getElementById(`vTarif`).textContent=n.tarif):c.style.display=`none`;let l=document.getElementById(`vContactsList`);l.innerHTML=``,a.forEach(e=>{let t=e.phone?`<a href="tel:${r(e.phone)}" style="color:white;text-decoration:none;font-weight:bold" onclick="event.stopPropagation()">${r(e.phone)}</a>`:`---`,n=e.email?`<a href="mailto:${r(e.email)}" style="color:#aaa;font-size:11px;text-decoration:none" onclick="event.stopPropagation()">${r(e.email)}</a>`:``;l.innerHTML+=`<div class="contact-item"><div><div class="ci-name">${r(e.name)}</div>${e.role?`<div class="ci-role" style="margin-top:4px">${r(e.role)}</div>`:``}</div><div style="text-align:right"><div>${t}</div><div>${n}</div></div></div>`});let d=n.company||t.nom||``;if(d)w(d);else{let e=document.getElementById(`vFacturesSection`);e&&(e.style.display=`none`)}document.getElementById(`viewModal`).classList.add(`open`)}async function w(t){let n=document.getElementById(`vFacturesSection`),i=document.getElementById(`vFacturesList`);if(!n||!i)return;i.innerHTML=`<div style="color:#888;font-size:13px">Chargement...</div>`,n.style.display=`block`;let{data:a}=await e.from(`factures`).select(`id, date, status`).ilike(`client`,`%${t}%`).order(`created_at`,{ascending:!1}).limit(10);if(!a||a.length===0){i.innerHTML=`<div style="color:#888;font-size:13px;font-style:italic">Aucune facture trouvée pour ce client.</div>`;return}let o={brouillon:`#aaa`,envoyee:`#3498db`,approuvee:`#28a745`,renvoye:`#ff4d4d`,Convertie:`#9b59b6`};i.innerHTML=a.map(e=>`
        <div style="background:#1e1f26;border-radius:8px;padding:10px 15px;display:flex;justify-content:space-between;align-items:center;border-left:3px solid ${o[e.status]||`#aaa`}">
            <span style="color:white;font-weight:bold;font-family:monospace">${r(e.id)}</span>
            <span style="color:#aaa;font-size:13px">${r(e.date||``)}</span>
            <span style="font-size:12px;padding:2px 8px;border-radius:4px;background:rgba(255,255,255,0.1);color:${o[e.status]||`#aaa`}">${r(e.status||``)}</span>
        </div>`).join(``)}function T(e=null){let n=document.getElementById(`edModalActions`),r=document.getElementById(`edContactsList`);if(r.innerHTML=``,n.innerHTML=`
        <button class="btn-cancel" id="btnCancelEdit">Annuler</button>
        <button class="btn-submit" id="btnSaveClient">
            <svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Enregistrer
        </button>
    `,document.getElementById(`btnCancelEdit`).addEventListener(`click`,()=>A(`editModal`)),document.getElementById(`btnSaveClient`).addEventListener(`click`,h),e){let r=i.find(t=>t.id===e);if(!r)return;let o=r.contacts||{};if(document.getElementById(`edId`).value=r.id,document.getElementById(`edAlert`).value=o.alert||``,document.getElementById(`edCompany`).value=o.company||``,document.getElementById(`edSubcontractor`).value=o.subcontractor||``,document.getElementById(`edContact`).value=o.contact||``,document.getElementById(`edAddress`).value=r.adresse||``,document.getElementById(`edStatus`).value=r.type||`residentiel`,document.getElementById(`edNotes`).value=o.notes||r.notes||``,document.getElementById(`edTarif`).value=o.tarif||``,(o.list||[]).forEach(e=>D(e)),E(),t(`delete_clients`)){let e=document.createElement(`button`);e.className=`btn-delete`,e.innerHTML=`<svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Supprimer`,e.addEventListener(`click`,()=>{a=r.id,document.getElementById(`confirmModal`).classList.add(`open`)}),n.prepend(e)}}else document.getElementById(`edId`).value=``,document.getElementById(`edAlert`).value=``,document.getElementById(`edStatus`).value=`residentiel`,document.getElementById(`edCompany`).value=``,document.getElementById(`edSubcontractor`).value=``,document.getElementById(`edContact`).value=``,document.getElementById(`edAddress`).value=``,document.getElementById(`edNotes`).value=``,document.getElementById(`edTarif`).value=``,E(),D();document.getElementById(`edModalTitle`).textContent=e?`Éditer Client`:`Nouveau Client`,document.getElementById(`editModal`).classList.add(`open`)}function E(){let e=document.getElementById(`edStatus`).value===`commercial`;document.getElementById(`grpTarif`).style.display=e?`block`:`none`,document.getElementById(`grpSubcontractor`).style.display=e?`block`:`none`}function D(e={name:``,role:``,phone:``,email:``}){let t=document.createElement(`div`);t.className=`contact-row`,t.innerHTML=`
        <input type="text" placeholder="Nom" class="inp-name" value="${r(e.name||``)}">
        <input type="text" placeholder="Poste" class="inp-role" value="${r(e.role||``)}">
        <input type="text" placeholder="Tél" class="inp-phone" value="${r(e.phone||``)}">
        <input type="email" placeholder="Email" class="inp-email" value="${r(e.email||``)}">
        <button class="btn-remove-row">×</button>
    `,t.querySelector(`.btn-remove-row`).addEventListener(`click`,()=>t.remove()),t.querySelector(`.inp-phone`).addEventListener(`keyup`,e=>j(e.target)),document.getElementById(`edContactsList`).appendChild(t)}function O(){let e=document.getElementById(`corbeilleList`);e.innerHTML=``;let t=i.filter(e=>e.est_supprime);t.length===0?e.innerHTML=`<div style="color:#aaa;text-align:center;padding:20px">La corbeille est vide.</div>`:(t.forEach(t=>{let n=document.createElement(`div`);n.className=`corbeille-item`,n.innerHTML=`
                <div>
                    <div style="color:white;font-weight:bold">${r(t.nom||`Sans nom`)}</div>
                    <div style="color:#888;font-size:12px">${r(t.adresse||``)}</div>
                </div>
                <div style="display:flex;gap:10px">
                    <button style="background:var(--btn-green);color:white;border:none;padding:8px 12px;border-radius:5px;cursor:pointer;font-weight:bold" data-restore="${t.id}">Restaurer</button>
                    <button style="background:var(--btn-red);color:white;border:none;padding:8px 12px;border-radius:5px;cursor:pointer;font-weight:bold" data-hard="${t.id}">Détruire</button>
                </div>
            `,e.appendChild(n)}),e.querySelectorAll(`[data-restore]`).forEach(e=>e.addEventListener(`click`,()=>_(e.dataset.restore))),e.querySelectorAll(`[data-hard]`).forEach(e=>e.addEventListener(`click`,()=>{o=e.dataset.hard,document.getElementById(`hardConfirmModal`).classList.add(`open`)}))),document.getElementById(`corbeilleModal`).classList.add(`open`)}function k(e){document.getElementById(`alertMessage`).textContent=e,document.getElementById(`alertModal`).classList.add(`open`)}function A(e){document.getElementById(e).classList.remove(`open`)}function j(e){let t=e.value.replace(/\D/g,``);t.length>3&&t.length<=6?t=t.slice(0,3)+`-`+t.slice(3):t.length>6&&(t=t.slice(0,3)+`-`+t.slice(3,6)+`-`+t.slice(6,10)),e.value=t}export{d as render};