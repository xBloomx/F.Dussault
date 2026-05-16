const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/dist-B9vqMAd8.js","assets/dist-DIBucx4m.js"])))=>i.map(i=>d[i]);
import{t as e}from"./supabase-BHP_DPH_.js";import{i as t,n,r}from"./auth-BoJf8KxA.js";import{t as i}from"./preload-helper-Dd-HcVz_.js";function a(e){return e?String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`):``}var o=[],s={},c=[],l=[],u=!1,d=null,f=[`Deschênes`,`Wolseley`,`Plomberie Provinciale`],p=[{id:`view_all_invoices`,label:`Voir toutes les factures`,desc:`Accès à la boîte de réception des factures.`},{id:`view_all_quotes`,label:`Voir toutes les soumissions`,desc:`Accès à toutes les soumissions.`},{id:`view_all_timesheets`,label:`Voir toutes les feuilles de temps`,desc:`Accès à toutes les feuilles de temps.`},{id:`view_all_po`,label:`Voir tous les bons de commande`,desc:`Accès à tous les PO.`},{id:`access_po_tab`,label:`Accès à l'onglet PO`,desc:`Affiche/masque le bouton Bons de commande.`},{id:`access_soumissions_tab`,label:`Accès à l'onglet Soumissions`,desc:`Affiche/masque le bouton Soumissions.`},{id:`access_courriel_tab`,label:`Accès à l'onglet Courriel`,desc:`Affiche/masque le bouton Courriel.`},{id:`approve_timesheets`,label:`Traiter les feuilles de temps`,desc:`Voir et changer le statut des feuilles.`},{id:`manage_tools`,label:`Gérer la banque d'outils`,desc:`Ajouter, modifier ou supprimer des outils.`},{id:`transfer_tools`,label:`Transfert d'outils (Terrain)`,desc:`Transférer un outil entre employés.`},{id:`create_clients`,label:`Créer un nouveau client`,desc:`Autorise la création de fiches clients.`},{id:`delete_clients`,label:`Supprimer un client`,desc:`Autorise la suppression de clients.`},{id:`manage_calendar`,label:`Gérer le calendrier global`,desc:`Créer, modifier ou supprimer des événements partagés.`},{id:`manage_news`,label:`Publier des annonces`,desc:`Afficher des notes sur le tableau de bord.`},{id:`view_admin`,label:`Accès panneau d'administration`,desc:`Création de comptes et nettoyage annuel.`},{id:`manage_suppliers`,label:`Gérer les fournisseurs récurrents`,desc:`Ajouter ou supprimer des fournisseurs.`},{id:`view_archives_all`,label:`Voir toutes les archives`,desc:`Accès aux archives de tous les utilisateurs.`},{id:`delete_documents`,label:`Supprimer définitivement un document`,desc:`Suppression définitive sans archivage.`}],m={A0:{name:`A0 - Développeur`,isSystem:!0,perms:p.map(e=>e.id)},A1:{name:`A1 - Administrateur`,isSystem:!0,perms:p.map(e=>e.id)},A2:{name:`A2 - Bureau`,isSystem:!0,perms:[`view_all_invoices`,`view_all_quotes`,`view_all_timesheets`,`view_all_po`,`access_po_tab`,`access_soumissions_tab`,`access_courriel_tab`,`approve_timesheets`,`manage_tools`,`create_clients`,`delete_clients`,`manage_calendar`,`manage_news`]},A3:{name:`A3 - Employé Terrain`,isSystem:!0,perms:[`transfer_tools`,`access_po_tab`,`access_soumissions_tab`,`create_clients`]}};async function h(e){e.innerHTML=`
    <style>
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
        .admin-main { flex: 1; display: flex; flex-direction: column; padding: 30px; max-width: 1200px; margin: 0 auto; width: 100%; overflow-y: auto; min-height: 100%; }
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
        .logs-table { width: 100%; border-collapse: collapse; font-size: 13px; color: #ccc; min-width: 400px; }
        .logs-table th { text-align: left; padding: 12px; color: #aaa; font-weight: bold; border-bottom: 1px solid #444; position: sticky; top: 0; background: #2b2c36; z-index: 10; }
        .logs-table td { padding: 12px; border-bottom: 1px dashed #333; vertical-align: top; }
        .logs-scroll-area { max-height: 250px; overflow-y: auto; overflow-x: auto; }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: none; z-index: 4000; justify-content: center; align-items: center; }
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
        .tabs-container { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #444; padding-bottom: 10px; }
        .btn-tab { background: transparent; color: #888; border: none; padding: 10px 20px; font-weight: bold; font-size: 15px; cursor: pointer; transition: 0.2s; border-bottom: 3px solid transparent; display: flex; align-items: center; gap: 8px; }
        .btn-tab svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-tab.active { color: white; border-bottom-color: var(--accent); }
        .admin-section { display: none; flex-direction: column; gap: 20px; }
        .admin-section.active { display: flex; }
        .perm-form-group { margin-bottom: 15px; }
        .perm-form-group label { display: block; color: var(--text-main); font-size: 14px; font-weight: bold; margin-bottom: 8px; }
        @media (max-width: 768px) { .admin-main { padding: 15px; } .settings-grid { grid-template-columns: 1fr; } .admin-danger-row { flex-direction: column; } .admin-danger-row .settings-card { min-width: 0 !important; flex: none !important; width: 100%; } }
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
                    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
                        <input type="text" id="logSearch" placeholder="Rechercher..." style="flex:1;min-width:180px;background:#1a1b23;border:1px solid #444;color:white;padding:10px;border-radius:6px;font-size:13px;outline:none">
                        <select id="logActionFilter" style="background:#1a1b23;border:1px solid #444;color:white;padding:10px;border-radius:6px;font-size:13px;outline:none">
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
                        <select id="logTableFilter" style="background:#1a1b23;border:1px solid #444;color:white;padding:10px;border-radius:6px;font-size:13px;outline:none">
                            <option value="">Toutes tables</option>
                            <option value="factures">Factures</option>
                            <option value="soumissions">Soumissions</option>
                            <option value="feuilles_de_temps">Feuilles temps</option>
                            <option value="clients">Clients</option>
                            <option value="bons_de_commande">PO</option>
                            <option value="profils">Profils</option>
                        </select>
                        <select id="logUserFilter" style="background:#1a1b23;border:1px solid #444;color:white;padding:10px;border-radius:6px;font-size:13px;outline:none">
                            <option value="">Tous utilisateurs</option>
                        </select>
                    </div>
                    <div style="background:#1a1b23;border:1px solid #444;border-radius:8px;overflow:hidden">
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
    `,await ee()}async function ee(){if(r){if(await g(),!(n===`A0`||s[n]?.perms?.includes(`view_admin`))){document.querySelector(`.admin-main`).innerHTML=`<h2 style='color:var(--btn-red);text-align:center;margin-top:50px'>Accès Refusé.</h2>`;return}if(document.querySelectorAll(`.btn-tab[data-tab]`).forEach(e=>{e.addEventListener(`click`,()=>te(e.dataset.tab,e))}),document.getElementById(`btnOpenNewUser`).addEventListener(`click`,re),document.getElementById(`btnCloseNewUser`).addEventListener(`click`,()=>Z(`newUserModal`)),document.getElementById(`btnCreateUser`).addEventListener(`click`,T),document.getElementById(`btnCloseEditUser`).addEventListener(`click`,()=>Z(`editUserModal`)),document.getElementById(`btnUpdateUser`).addEventListener(`click`,w),document.getElementById(`btnCloseAlert`).addEventListener(`click`,()=>Z(`alertModal`)),document.getElementById(`btnCancelConfirmAdmin`).addEventListener(`click`,$),document.getElementById(`btnYesConfirmAdmin`).addEventListener(`click`,()=>{d&&d(),$()}),document.getElementById(`btnAddSupplier`).addEventListener(`click`,L),document.getElementById(`newSupplierInput`).addEventListener(`keydown`,e=>{e.key===`Enter`&&L()}),document.getElementById(`btnAddTool`).addEventListener(`click`,V),document.getElementById(`newToolInput`).addEventListener(`keydown`,e=>{e.key===`Enter`&&V()}),document.getElementById(`btnCleanArchives`).addEventListener(`click`,N),n===`A0`&&(document.getElementById(`tab-dev`).style.display=`flex`,document.getElementById(`btnOpenNewRole`).addEventListener(`click`,x),document.getElementById(`btnCloseNewRole`).addEventListener(`click`,()=>Z(`newCustomRoleModal`)),document.getElementById(`btnCreateRole`).addEventListener(`click`,ne),document.getElementById(`roleSelect`).addEventListener(`change`,y),document.getElementById(`btnSavePermissions`).addEventListener(`click`,b),document.getElementById(`btnToggleMaintenance`).addEventListener(`click`,k),document.getElementById(`btnAliasNom`).addEventListener(`click`,()=>j(`nom`)),document.getElementById(`btnAliasSys`).addEventListener(`click`,()=>j(`systeme`)),document.getElementById(`btnCleanLogs`).addEventListener(`click`,oe),document.getElementById(`btnExportLogs`).addEventListener(`click`,ae),document.getElementById(`btnExpandLogs`).addEventListener(`click`,J),document.getElementById(`logSearch`).addEventListener(`keyup`,q),document.getElementById(`logActionFilter`).addEventListener(`change`,q),document.getElementById(`logTableFilter`).addEventListener(`change`,q),document.getElementById(`logUserFilter`).addEventListener(`change`,q),document.getElementById(`customRoleId`).addEventListener(`input`,e=>{e.target.value=e.target.value.toUpperCase().replace(/\s+/g,`_`)}),W(),y(),A(),D(),M(),Y()),v(),S(),t(`manage_suppliers`))ie();else{let e=document.getElementById(`suppliersPanel`);e&&(e.style.display=`none`)}n===`A0`||n===`A1`?(R(),U(),P()):[`toolsPanel`,`countersPanel`,`SupportPanel`].forEach(e=>{let t=document.getElementById(e);t&&(t.style.display=`none`)})}}function te(e,t){document.querySelectorAll(`.btn-tab`).forEach(e=>e.classList.remove(`active`)),document.querySelectorAll(`.admin-section`).forEach(e=>e.classList.remove(`active`)),t&&t.classList.add(`active`);let n=document.getElementById(`sec-`+e);n&&n.classList.add(`active`)}async function g(){try{let{data:t}=await e.from(`parametres_globaux`).select(`valeur`).eq(`cle`,`roles_config`).maybeSingle();s=t?.valeur?JSON.parse(t.valeur):{...m}}catch{s={...m}}}async function _(){await e.from(`parametres_globaux`).upsert({cle:`roles_config`,valeur:JSON.stringify(s)},{onConflict:`cle`})}function v(){let e=n===`A0`;[`roleSelect`,`newUserRole`,`editUserRole`].forEach(t=>{let n=document.getElementById(t);if(n){n.innerHTML=``;for(let[t,r]of Object.entries(s))t===`A0`&&!e||(n.innerHTML+=`<option value="${a(t)}">${a(r.name)}</option>`)}})}function y(){let e=document.getElementById(`roleSelect`)?.value;if(!e)return;let t=s[e]?.perms||[],n=document.getElementById(`editRoleName`);n&&(n.value=s[e]?.name||e);let r=document.getElementById(`permissionsList`);r&&(r.innerHTML=p.map(e=>`
        <label style="display:flex;align-items:flex-start;gap:12px;cursor:pointer">
            <input type="checkbox" class="perm-cb" value="${e.id}" ${t.includes(e.id)?`checked`:``} style="width:20px;height:20px;accent-color:var(--accent);flex-shrink:0;margin-top:2px">
            <div style="flex:1"><span style="font-weight:bold;color:var(--accent)">${e.label}</span><div style="color:#aaa;font-size:12px">${e.desc}</div></div>
        </label>`).join(``))}async function b(){let e=document.getElementById(`roleSelect`)?.value;!e||!s[e]||(s[e].name=document.getElementById(`editRoleName`)?.value.trim()||e,s[e].perms=Array.from(document.querySelectorAll(`.perm-cb:checked`)).map(e=>e.value),await _(),v(),document.getElementById(`roleSelect`).value=e,X(`Permissions sauvegardées !`),window.dispatchEvent(new CustomEvent(`permissions_updated`)))}function x(){let e=document.getElementById(`customRoleId`),t=document.getElementById(`customRoleName`);e&&(e.value=``),t&&(t.value=``),document.getElementById(`newCustomRoleModal`).classList.add(`open`)}async function ne(){let e=document.getElementById(`customRoleId`)?.value.trim(),t=document.getElementById(`customRoleName`)?.value.trim();if(!e||!t||s[e]||e===`A0`)return;s[e]={name:t,isSystem:!1,perms:[]},await _(),v();let n=document.getElementById(`roleSelect`);n&&(n.value=e),y(),Z(`newCustomRoleModal`)}async function S(){let r=document.getElementById(`employeeList`),{data:i,error:o}=await e.from(`profils`).select(`*`).order(`role`);if(o){r.innerHTML=`<div style="color:var(--btn-red)">Erreur BD</div>`;return}if(n!==`A0`&&i?.length===1){r.innerHTML=`<div style="background:#3a2424;border:1px solid var(--btn-red);border-radius:8px;padding:14px;color:#ffb3b3;font-size:13px;line-height:1.5"><strong style="color:var(--btn-red)">Liste incomplète</strong><br>La politique de sécurité Supabase t'empêche de voir les autres collègues.</div>`;return}r.innerHTML=``,i.forEach(e=>{let i=document.createElement(`div`);i.className=`formation-item`;let o=``,c=``;(n===`A0`||e.role!==`A0`&&t(`view_admin`))&&(o=`<button class="btn-add-small" style="background:#444" data-edit-id="${e.id}" data-edit-name="${a(e.prenom_nom||``)}" data-edit-role="${e.role}"><svg viewBox="0 0 24 24" width="14" height="14" style="stroke:currentColor;fill:none;stroke-width:2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Éditer</button>`),e.role!==`A0`&&(n===`A0`||n===`A1`)&&(c=`<button class="btn-del-emp" data-del-id="${e.id}" data-del-name="${a(e.prenom_nom||``)}"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>`),i.innerHTML=`
            <div style="width:40px;height:40px;border-radius:50%;background:#444;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px">${a((e.prenom_nom||`?`).charAt(0).toUpperCase())}</div>
            <div style="flex:1">
                <div style="color:white;font-weight:bold">${a(e.prenom_nom||`Sans nom`)}</div>
                <div style="display:flex;align-items:center;gap:10px"><span class="role-badge">${a(s[e.role]?.name||e.role)}</span>${o}</div>
            </div>
            ${c}
        `,r.appendChild(i)}),r.querySelectorAll(`[data-edit-id]`).forEach(e=>{e.addEventListener(`click`,()=>C(e.dataset.editId,e.dataset.editName,e.dataset.editRole))}),r.querySelectorAll(`[data-del-id]`).forEach(e=>{e.addEventListener(`click`,()=>E(e.dataset.delId,e.dataset.delName))})}function re(){document.getElementById(`newUserName`).value=``,document.getElementById(`newUserEmail`).value=``,document.getElementById(`newUserPassword`).value=``,document.getElementById(`newUserModal`).classList.add(`open`)}function C(e,t,n){document.getElementById(`editUserId`).value=e,document.getElementById(`editUserName`).value=t;let r=document.getElementById(`editUserRole`),i=Array.from(r.options).some(e=>e.value===`A0`);if(n===`A0`&&!i&&s.A0){let e=document.createElement(`option`);e.value=`A0`,e.textContent=s.A0.name||`A0 - Développeur`,r.insertBefore(e,r.firstChild)}r.value=n,r.disabled=n===`A0`,document.getElementById(`editUserModal`).classList.add(`open`)}async function w(){let t=document.getElementById(`editUserId`).value,n=document.getElementById(`editUserName`).value.trim(),r=document.getElementById(`editUserRole`).value;if(!n)return;let i={prenom_nom:n};r!==`A0`&&(i.role=r);let{error:a}=await e.from(`profils`).update(i).eq(`id`,t);a?X(a.message):(Z(`editUserModal`),S())}async function T(){let t=document.getElementById(`newUserName`).value.trim(),n=document.getElementById(`newUserRole`).value,r=document.getElementById(`newUserEmail`).value.trim(),a=document.getElementById(`newUserPassword`).value;if(!t||!r||!a||!n||n===`A0`)return;let{createClient:o}=await i(async()=>{let{createClient:e}=await import(`./dist-B9vqMAd8.js`);return{createClient:e}},__vite__mapDeps([0,1])),{data:s,error:c}=await o(`https://ipxmloqgoukieuerbxtl.supabase.co`,`sb_publishable_jVOmm2g3WLxtIrr-rVRvtA_aWaUtB-E`,{auth:{persistSession:!1}}).auth.signUp({email:r,password:a});if(c){X(c.message);return}let{error:l}=await e.from(`profils`).insert([{id:s.user.id,role:n,prenom_nom:t}]);l&&X(l.message),Z(`newUserModal`),S()}async function E(t,n){Q(`Voulez-vous supprimer le compte de ${a(n)} ?`,async()=>{let{error:n}=await e.from(`profils`).delete().eq(`id`,t);n?X(n.message):(X(`Compte supprimé avec succès.`),S())})}async function D(){let{data:t}=await e.from(`parametres_globaux`).select(`valeur`).eq(`cle`,`mode_maintenance`).maybeSingle();u=t?.valeur===`true`,O()}function O(){let e=document.getElementById(`btnToggleMaintenance`);e&&(u?(e.textContent=`Désactiver le Mode Maintenance`,e.style.background=`rgba(40,167,69,0.1)`,e.style.borderColor=`var(--btn-green)`,e.style.color=`var(--btn-green)`):(e.textContent=`Activer le Mode Maintenance`,e.style.background=`transparent`,e.style.borderColor=`var(--btn-red)`,e.style.color=`var(--btn-red)`))}async function k(){let t=document.getElementById(`btnToggleMaintenance`);t&&(t.disabled=!0,t.textContent=`Sauvegarde...`);let n=!u,{error:r}=await e.from(`parametres_globaux`).upsert({cle:`mode_maintenance`,valeur:String(n)},{onConflict:`cle`});if(r){X(`❌ Erreur : `+r.message),t&&(t.disabled=!1,O());return}u=n,t&&(t.disabled=!1),O(),window.dispatchEvent(new CustomEvent(`toggle_maintenance`,{detail:{active:u}})),X(u?`Mode maintenance activé.`:`Mode maintenance désactivé.`)}function A(){let e=localStorage.getItem(`dussault_a0_alias`)||`nom`,t=document.getElementById(`btnAliasSys`),n=document.getElementById(`btnAliasNom`);!t||!n||(e===`systeme`?(t.style.background=`#9b59b6`,t.style.color=`white`):(n.style.background=`#9b59b6`,n.style.color=`white`))}function j(e){localStorage.setItem(`dussault_a0_alias`,e),A()}async function M(){let t=document.getElementById(`archivesExpiredCount`);if(t)try{let{data:n,error:r}=await e.rpc(`count_archives_expired`);if(r)throw r;let i=(n||[]).reduce((e,t)=>e+Number(t.nb||0),0);if(i===0){t.innerHTML=`<span style='color:var(--btn-green)'>✓ Aucune archive expirée.</span>`;return}t.innerHTML=`<b style='color:#ff9800'>${i}</b> document(s) à supprimer (${(n||[]).filter(e=>Number(e.nb)>0).map(e=>`${e.nb} ${e.table_name}`).join(`, `)}).`}catch(e){t.textContent=`Erreur : `+(e.message||e)}}async function N(){Q(`Supprimer DÉFINITIVEMENT toutes les archives de plus d'un an ? Cette action est irréversible.`,async()=>{let t=document.getElementById(`btnCleanArchives`);t&&(t.disabled=!0,t.textContent=`Nettoyage...`);try{let{data:t,error:n}=await e.rpc(`delete_expired_archives`);if(n)throw n;X(`Nettoyage terminé : <b>`+(t||[]).reduce((e,t)=>e+Number(t.nb_deleted||0),0)+`</b> document(s) supprimé(s).`),await M()}catch(e){X(`❌ Erreur : `+(e.message||e))}finally{t&&(t.disabled=!1,t.textContent=`Nettoyer`)}})}async function P(){let t=document.getElementById(`supportTicketsList`);if(!t)return;t.innerHTML=`<div style="color:#888;font-style:italic;text-align:center;padding:20px">Chargement...</div>`;let{data:n}=await e.from(`tickets_support`).select(`*`).eq(`statut`,`ouvert`).order(`created_at`,{ascending:!1});if(t.innerHTML=``,!n?.length){t.innerHTML=`<div style="color:#888;font-style:italic;text-align:center;padding:20px">Aucun ticket.</div>`;return}n.forEach(n=>{let r=new Date(n.created_at).toLocaleString(`fr-CA`),i=document.createElement(`div`);i.style.cssText=`background:#2b2c36;border:1px solid #444;padding:15px;border-radius:8px;margin-bottom:10px`,i.innerHTML=`
            <div style="display:flex;justify-content:space-between;margin-bottom:10px"><span style="font-weight:bold">${a(n.author_nom)}</span><span style="color:#888;font-size:12px">${r}</span></div>
            <div style="color:#ccc;line-height:1.5">${a(n.message)}</div>
            <div style="text-align:right;margin-top:10px"><button class="btn-modal-green" style="padding:5px 10px" data-ticket-id="${n.id}">Réglé</button></div>
        `,i.querySelector(`[data-ticket-id]`).addEventListener(`click`,async t=>{let n=t.currentTarget.dataset.ticketId,{error:r}=await e.from(`tickets_support`).update({statut:`resolu`}).eq(`id`,n);r?X(`❌ Erreur : `+r.message):P()}),t.appendChild(i)})}async function ie(){try{let{data:t}=await e.from(`parametres_globaux`).select(`valeur`).eq(`cle`,`fournisseurs_recurrents`).maybeSingle();if(t?.valeur){let e=JSON.parse(t.valeur);c=Array.isArray(e)?e:[...f]}else c=[...f],await F()}catch{c=[...f]}I()}async function F(){let{error:t}=await e.from(`parametres_globaux`).upsert({cle:`fournisseurs_recurrents`,valeur:JSON.stringify(c)},{onConflict:`cle`});return t?(X(`Erreur sauvegarde : `+t.message),!1):!0}function I(){let e=document.getElementById(`suppliersList`);if(e){if(c.length===0){e.innerHTML=`<div style="color:#888;font-style:italic;text-align:center;padding:20px">Aucun fournisseur.</div>`;return}e.innerHTML=c.map((e,t)=>`
        <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:#1a1b23;border:1px solid #444;border-radius:6px;margin-bottom:6px">
            <div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0">
                <button data-sup-up="${t}" ${t===0?`disabled`:``} style="background:${t===0?`#222`:`#333`};color:${t===0?`#444`:`#bbb`};border:none;border-radius:4px;width:28px;height:22px;display:flex;align-items:center;justify-content:center;cursor:${t===0?`default`:`pointer`};padding:0">▲</button>
                <button data-sup-down="${t}" ${t===c.length-1?`disabled`:``} style="background:${t===c.length-1?`#222`:`#333`};color:${t===c.length-1?`#444`:`#bbb`};border:none;border-radius:4px;width:28px;height:22px;display:flex;align-items:center;justify-content:center;cursor:${t===c.length-1?`default`:`pointer`};padding:0">▼</button>
            </div>
            <span style="flex:1;color:#ddd;font-size:14px">${a(e)}</span>
            <button class="btn-del-emp" data-sup-del="${t}"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        </div>`).join(``),e.querySelectorAll(`[data-sup-up]`).forEach(e=>e.addEventListener(`click`,async()=>{let t=parseInt(e.dataset.supUp);t<=0||([c[t-1],c[t]]=[c[t],c[t-1]],I(),await F())})),e.querySelectorAll(`[data-sup-down]`).forEach(e=>e.addEventListener(`click`,async()=>{let t=parseInt(e.dataset.supDown);t>=c.length-1||([c[t],c[t+1]]=[c[t+1],c[t]],I(),await F())})),e.querySelectorAll(`[data-sup-del]`).forEach(e=>e.addEventListener(`click`,()=>{let t=parseInt(e.dataset.supDel);Q(`Retirer "${c[t]}" ?`,async()=>{c.splice(t,1),await F(),I()})}))}}async function L(){let e=document.getElementById(`newSupplierInput`),t=e?.value.trim();if(!t){X(`Veuillez entrer un nom de fournisseur.`);return}if(c.some(e=>e.toLowerCase()===t.toLowerCase())){X(`Ce fournisseur est déjà dans la liste.`);return}c.push(t),await F()?(e&&(e.value=``),I()):c.pop()}async function R(){try{let{data:t}=await e.from(`outils`).select(`id, nom, assignee_nom, status, created_at, position`).order(`position`,{ascending:!0,nullsFirst:!1}).order(`created_at`,{ascending:!1});l=t||[]}catch{l=[]}z()}function z(){let e=document.getElementById(`toolsList`);if(!e)return;if(l.length===0){e.innerHTML=`<div style="color:#888;font-style:italic;text-align:center;padding:20px">Aucun outil.</div>`;return}let t=new Map,n={active:3,available:2,returned:1};l.forEach(e=>{let r=(e.nom||``).toLowerCase().trim();if(!r)return;let i=t.get(r);(!i||(n[e.status]||0)>(n[i.status]||0))&&t.set(r,e)});let r=Array.from(t.values()).sort((e,t)=>{let n=e.position??999999,r=t.position??999999;return n===r?(e.nom||``).localeCompare(t.nom||``,`fr`):n-r});e.innerHTML=r.map((e,t)=>{let n=e.status===`active`&&e.assignee_nom?`<span style="color:var(--accent);font-size:12px">→ ${a(e.assignee_nom)}</span>`:`<span style="color:#888;font-size:12px;font-style:italic">Disponible</span>`,i=t===0,o=t===r.length-1;return`
            <div class="tool-item" data-tool-id="${a(e.id)}" data-tool-name="${a(e.nom||``)}" style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:#1a1b23;border:1px solid #444;border-radius:6px;margin-bottom:6px">
                <div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0">
                    <button data-tool-up="${t}" ${i?`disabled`:``} style="background:${i?`#222`:`#333`};color:${i?`#444`:`#bbb`};border:none;border-radius:4px;width:28px;height:22px;display:flex;align-items:center;justify-content:center;cursor:${i?`default`:`pointer`};padding:0">▲</button>
                    <button data-tool-down="${t}" ${o?`disabled`:``} style="background:${o?`#222`:`#333`};color:${o?`#444`:`#bbb`};border:none;border-radius:4px;width:28px;height:22px;display:flex;align-items:center;justify-content:center;cursor:${o?`default`:`pointer`};padding:0">▼</button>
                </div>
                <div style="flex:1;display:flex;flex-direction:column;gap:4px;min-width:0"><span style="color:#ddd;font-size:14px;font-weight:bold;word-break:break-word">${a(e.nom||`Sans nom`)}</span>${n}</div>
                <button class="btn-del-emp" data-tool-del-id="${a(e.id)}" data-tool-del-name="${a(e.nom||``)}"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </div>`}).join(``),e.querySelectorAll(`[data-tool-up]`).forEach(t=>t.addEventListener(`click`,async()=>{let n=parseInt(t.dataset.toolUp),r=Array.from(e.querySelectorAll(`.tool-item`));n<=0||n>=r.length||(e.insertBefore(r[n],r[n-1]),await B(),z())})),e.querySelectorAll(`[data-tool-down]`).forEach(t=>t.addEventListener(`click`,async()=>{let n=parseInt(t.dataset.toolDown),r=Array.from(e.querySelectorAll(`.tool-item`));n>=r.length-1||(e.insertBefore(r[n+1],r[n]),await B(),z())})),e.querySelectorAll(`[data-tool-del-id]`).forEach(e=>e.addEventListener(`click`,()=>H(e.dataset.toolDelId,e.dataset.toolDelName)))}async function B(){let t=document.getElementById(`toolsList`);if(!t)return;let n=Array.from(t.querySelectorAll(`.tool-item`));for(let t=0;t<n.length;t++){let r=(n[t].dataset.toolName||``).toLowerCase().trim();r&&await e.from(`outils`).update({position:(t+1)*10}).ilike(`nom`,r)}let{data:r}=await e.from(`outils`).select(`id, nom, assignee_nom, status, created_at, position`).order(`position`,{ascending:!0,nullsFirst:!1}).order(`created_at`,{ascending:!1});r&&(l=r)}async function V(){let t=document.getElementById(`newToolInput`),n=t?.value.trim();if(!n){X(`Veuillez entrer un nom d'outil.`);return}if(l.some(e=>(e.nom||``).toLowerCase()===n.toLowerCase())){X(`Un outil avec ce nom existe déjà.`);return}let r=l.reduce((e,t)=>{let n=t.position??0;return n>e?n:e},0),{error:i}=await e.from(`outils`).insert([{nom:n,status:`available`,position:r+10}]);if(i){X(`Erreur : `+i.message);return}t&&(t.value=``),await R()}async function H(t,n){Q(`Retirer définitivement "${n}" de l'inventaire ?`,async()=>{let{error:t}=await e.from(`outils`).delete().eq(`nom`,n);t?X(`Erreur : `+t.message):await R()})}async function U(){try{let{data:t}=await e.from(`factures`).select(`id`).order(`id`,{ascending:!1}).limit(50),n=document.getElementById(`lastInvoiceNumber`),r=document.getElementById(`nextInvoiceNumber`);if(n&&t?.length){let e=0;t.forEach(t=>{let n=(t.id||``).match(/^F-(\d+)$/);if(n){let t=parseInt(n[1],10);t>e&&(e=t)}}),e>0?(n.textContent=`F-${String(e).padStart(4,`0`)}`,r&&(r.textContent=`Prochaine : F-${String(e+1).padStart(4,`0`)}`)):(n.textContent=`Aucune`,r&&(r.textContent=`Prochaine : F-0001`))}else n&&(n.textContent=`Aucune`,r&&(r.textContent=`Prochaine : F-0001`))}catch{let e=document.getElementById(`lastInvoiceNumber`);e&&(e.textContent=`—`)}try{let{data:t}=await e.from(`bons_de_commande`).select(`numero, created_at`).order(`created_at`,{ascending:!1}),n=document.getElementById(`lastPoNumber`),r=document.getElementById(`totalPoCount`);t?.length?(n&&(n.textContent=t[0].numero||`—`),r&&(r.textContent=`Total : ${t.length} PO créé(s)`)):(n&&(n.textContent=`Aucun`),r&&(r.textContent=`Total : 0`))}catch{let e=document.getElementById(`lastPoNumber`);e&&(e.textContent=`—`)}}async function W(){let t=document.getElementById(`logsTableBody`),{data:n,error:r}=await e.from(`logs_systeme`).select(`*`).order(`created_at`,{ascending:!1}).limit(500);if(r){t&&(t.innerHTML=`<tr><td colspan="4" style="text-align:center;padding:20px;color:#ff4d4d">Erreur de chargement</td></tr>`);return}let i={creation:`var(--btn-green)`,modification:`var(--btn-blue)`,suppression:`var(--btn-red)`,archivage:`var(--btn-orange)`,restauration:`var(--accent)`,role_change:`#9b59b6`,connexion:`#888`,maintenance:`#9b59b6`},a={creation:`Création`,modification:`Modification`,suppression:`Suppression`,archivage:`Archivage`,restauration:`Restauration`,role_change:`Rôle`,connexion:`Connexion`,maintenance:`Maintenance`};o=(n||[]).map(e=>{let t=new Date(e.created_at||Date.now()),n=e.action||e.type_erreur||`Info`;return{date:t.toLocaleDateString()+` `+t.toLocaleTimeString(),rawDate:e.created_at,action:n,actionLabel:a[n]||n,user:e.utilisateur_nom||`Système`,userId:e.user_id||``,table:e.table_name||``,docId:e.doc_id||``,message:e.message||``,color:i[n]||`var(--btn-blue)`}}),G(o),K(o)}function G(e){let t=document.getElementById(`logUserFilter`);if(!t)return;let n=t.value,r=[...new Set(e.map(e=>e.user).filter(e=>e&&e!==`Système`))].sort();t.innerHTML=`<option value="">Tous utilisateurs</option>`+r.map(e=>`<option value="${a(e)}">${a(e)}</option>`).join(``),n&&r.includes(n)&&(t.value=n)}function K(e){let t=document.getElementById(`logsTableBody`);if(!t)return;t.innerHTML=e.length===0?`<tr><td colspan="4" style="text-align:center;padding:20px;color:#888">Aucun résultat</td></tr>`:e.map(e=>`<tr>
            <td style="color:#888;font-family:monospace;font-size:11px">${a(e.date)}</td>
            <td><span style="color:${e.color};font-weight:bold;font-size:12px">${a(e.actionLabel)}</span></td>
            <td style="color:#ddd;font-size:12px">${a(e.user)}</td>
            <td style="color:#ccc;font-size:12px">${a(e.message)}</td>
        </tr>`).join(``);let n=document.getElementById(`logsCountText`);n&&(n.textContent=`${e.length} entrée(s) affichée(s) — total ${o.length} chargée(s)`)}function q(){let e=(document.getElementById(`logSearch`)?.value||``).toLowerCase(),t=document.getElementById(`logActionFilter`)?.value||``,n=document.getElementById(`logTableFilter`)?.value||``,r=document.getElementById(`logUserFilter`)?.value||``;K(o.filter(i=>!(t&&i.action!==t||n&&i.table!==n||r&&i.user!==r||e&&!(i.message+` `+i.user+` `+i.table+` `+i.docId).toLowerCase().includes(e))))}function J(){let e=document.getElementById(`a0LogsPanel`),t=document.getElementById(`icon-expand-logs`);e.classList.contains(`expanded-logs-panel`)?(e.classList.remove(`expanded-logs-panel`),t.innerHTML=`<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>`,window.dispatchEvent(new CustomEvent(`toggle_menu`,{detail:{action:`show`}}))):(e.classList.add(`expanded-logs-panel`),t.innerHTML=`<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>`,window.dispatchEvent(new CustomEvent(`toggle_menu`,{detail:{action:`hide`}})))}function ae(){let e=(document.getElementById(`logSearch`)?.value||``).toLowerCase(),t=document.getElementById(`logActionFilter`)?.value||``,n=document.getElementById(`logTableFilter`)?.value||``,r=document.getElementById(`logUserFilter`)?.value||``,i=o.filter(i=>!(t&&i.action!==t||n&&i.table!==n||r&&i.user!==r||e&&!(i.message+` `+i.user+` `+i.table+` `+i.docId).toLowerCase().includes(e))),a=e=>`"`+String(e??``).replace(/"/g,`""`)+`"`,s=`﻿`+[[`Date`,`Action`,`Utilisateur`,`Table`,`Doc ID`,`Message`],...i.map(e=>[e.rawDate||e.date,e.actionLabel,e.user,e.table,e.docId,e.message])].map(e=>e.map(a).join(`,`)).join(`
`),c=new Blob([s],{type:`text/csv;charset=utf-8;`}),l=URL.createObjectURL(c),u=document.createElement(`a`);u.href=l,u.download=`journal_audit_${new Date().toISOString().slice(0,10)}.csv`,document.body.appendChild(u),u.click(),u.remove(),setTimeout(()=>URL.revokeObjectURL(l),1e3)}async function Y(){let t=document.getElementById(`logsExpiredCount`),n=document.getElementById(`btnCleanLogs`);if(t)try{let{data:r,error:i}=await e.rpc(`count_logs_expired`);if(i){t.innerHTML=`<span style="color:#888;font-style:italic">Fonction non disponible</span>`,n&&(n.disabled=!0,n.style.opacity=`0.5`);return}let a=Number(r||0);a===0?(t.innerHTML=`<span style="color:var(--btn-green)">✓ Aucun log expiré</span>`,n&&(n.disabled=!0,n.style.opacity=`0.5`)):(t.innerHTML=`<b style="color:var(--btn-purple)">${a}</b> log(s) datent de plus d'un an.`,n&&(n.disabled=!1,n.style.opacity=`1`))}catch{t.textContent=`Erreur de chargement`}}async function oe(){Q(`Supprimer DÉFINITIVEMENT tous les logs de plus d'un an ? Cette action est irréversible.`,async()=>{let{data:t,error:n}=await e.rpc(`delete_expired_logs`);if(n){X(`Erreur : `+n.message);return}X(`${Number(t||0)} log(s) supprimé(s) avec succès.`),await Y(),await W()})}function X(e){let t=document.getElementById(`alertMessageText`);t&&(t.innerHTML=e),document.getElementById(`alertModal`)?.classList.add(`open`)}function Z(e){document.getElementById(e)?.classList.remove(`open`)}function Q(e,t){let n=document.getElementById(`confirmAdminMsg`);n&&(n.innerHTML=e),d=t,document.getElementById(`confirmAdminModal`)?.classList.add(`open`)}function $(){Z(`confirmAdminModal`),d=null}export{h as render};