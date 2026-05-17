import{t as e}from"./supabase-BHP_DPH_.js";import{c as t,i as n,n as r,r as i,t as a}from"./auth-BoJf8KxA.js";var o={factures:`facture`,temps:`feuilleTemps`,feuilles:`feuilleTemps`,soumissions:`soumissions`,messagerie:`messagerie`,courriel:`courriel`,calendrier:`calendrier`,clients:`clients`,po:`po`,outils:`outils`,admin:`admin`,profil:`profil`,accueil:`accueil`};function s(e){let t=o[e]||e,n=document.querySelector(`.nav-btn[data-view="${t}"]`);n&&!n.classList.contains(`hidden`)&&n.click()}function c(e){return e?String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`):``}var l=[],u=null;async function d(e){e.innerHTML=`
    <style>
        .main-content {
            flex: 1; display: flex; flex-direction: column;
            background-color: var(--bg-dark); padding: 30px;
            width: 100%; gap: 20px;
            min-height: 100%; overflow-y: auto;
        }
        .dash-header { display: flex; justify-content: space-between; align-items: center; }
        .dash-title-area { display: flex; flex-direction: column; gap: 5px; }
        .dash-title-area h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title-area p { margin: 5px 0 0; color: #aaa; font-size: 14px; display: flex; align-items: center; gap: 8px; }
        .header-actions { display: flex; align-items: center; gap: 15px; }
        .date-text { font-size: 14px; color: #888; font-weight: 500; background: #1a1b23; padding: 10px 15px; border-radius: 8px; border: 1px solid #444; }
        .action-btn { background-color: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; white-space: nowrap; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3);}
        .action-btn:hover { background-color: var(--accent-hover); transform: translateY(-2px); }

        .dashboard-grid { display: grid; grid-template-columns: 1.8fr 1fr; gap: 30px; align-items: start; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .section-title { font-size: 20px; color: white; font-weight: bold; display: flex; align-items: center; gap: 10px; }
        /* News */
        .news-container { display: flex; flex-direction: column; gap: 15px; margin-bottom: 30px; }
        .news-card { background-color: var(--bg-panel); padding: 25px; border-radius: 15px; border: 1px solid #333; position: relative; transition: transform 0.2s; }
        .news-card:hover { transform: translateY(-2px); border-color: #555; }
        .news-card.pinned { border: 1px solid var(--accent); background: linear-gradient(145deg, #2b2c36 0%, #30313c 100%); }
        .news-card::before { content: ''; position: absolute; left: -1px; top: 20px; bottom: 20px; width: 4px; border-radius: 0 4px 4px 0; background-color: var(--btn-blue); }
        .news-card.important::before { background-color: var(--btn-red); }
        .news-card.info::before { background-color: var(--accent); }
        .news-header { display: flex; flex-direction: column; gap: 5px; margin-bottom: 15px; padding-right: 90px; }
        .news-title { font-size: 19px; font-weight: bold; color: white; margin: 0; padding-left: 15px; display: flex; align-items: flex-start; gap: 8px; }
        .news-date { font-size: 12px; color: #888; padding-left: 15px; display: flex; align-items: center; gap: 5px; }
        .news-body { font-size: 15px; color: #ccc; line-height: 1.6; white-space: pre-wrap; padding-left: 15px; }
        .news-author { font-size: 13px; color: #777; margin-top: 20px; padding-left: 15px; font-style: italic; border-top: 1px dashed #444; padding-top: 15px; }
        .news-actions { position: absolute; top: 20px; right: 20px; display: flex; gap: 8px; }
        .btn-news-icon { background: #1e1f26; color: #888; border: 1px solid #333; width: 35px; height: 35px; border-radius: 8px; cursor: pointer; transition: all 0.2s; display: flex; justify-content: center; align-items: center; }
        .btn-news-icon:hover { color: white; border-color: #666; background: #333; }
        .btn-news-icon.delete:hover { color: var(--btn-red); border-color: var(--btn-red); background: rgba(255,77,77,0.1); }
        .btn-news-icon.pin-active { color: var(--accent); border-color: var(--accent); background: rgba(252,202,70,0.1); }

        /* Quick actions */
        .quick-actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
        .quick-action-card { background-color: var(--bg-panel); border: 1px solid #333; border-radius: 15px; padding: 25px 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; cursor: pointer; transition: all 0.2s ease; }
        .quick-action-card:hover { transform: translateY(-5px); background-color: #343542; border-color: var(--accent); }
        .icon-bubble { background-color: #1e1f26; width: 60px; height: 60px; border-radius: 15px; display: flex; align-items: center; justify-content: center; color: #aaa; border: 1px solid #444; transition: 0.2s; }
        .icon-bubble svg { width: 32px; height: 32px; stroke: currentColor; fill: none; stroke-width: 1.5; }
        .quick-action-card:hover .icon-bubble { border-color: var(--accent); background-color: rgba(252,202,70,0.1); color: var(--accent); }
        .quick-action-text { font-size: 15px; font-weight: bold; color: white; text-align: center; }

        /* Bilan */
        .alerts-wrapper { background-color: var(--bg-panel); border-radius: 15px; border: 1px solid #333; padding: 25px; margin-bottom: 30px; }
        .stats-container { display: flex; flex-direction: column; gap: 10px; }
        .stat-item { display: none; justify-content: space-between; align-items: center; background: #1a1b23; padding: 15px; border-radius: 10px; border: 1px solid #444; cursor: pointer; transition: 0.2s; }
        .stat-item:hover { border-color: var(--btn-blue); background: #23242d; }
        .stat-label { font-size: 14px; color: #ccc; font-weight: bold; display: flex; align-items: center; gap: 10px; }
        .stat-badge { background: #444; color: white; font-weight: bold; font-size: 14px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
        .stat-badge.alert { background: var(--btn-red); }
        .stat-badge.warn { background: var(--accent); color: black; }
        .bilan-empty { display: none; text-align: center; padding: 15px; background: rgba(40,167,69,0.1); border: 1px dashed var(--btn-green); border-radius: 8px; color: #e0e0e0; font-size: 14px; line-height: 1.5; }

        /* Certifications */
        .alerts-container { display: flex; flex-direction: column; gap: 12px; }
        .alert-item { background-color: #1e1f26; border: 1px solid #444; padding: 15px; border-radius: 10px; font-size: 14px; display: flex; align-items: center; gap: 15px; font-weight: 500; }
        .alert-icon { display: flex; align-items: center; justify-content: center; }
        .alert-icon svg { width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 1.5; }
        .alert-danger { border-left: 4px solid var(--btn-red); color: #ffcccc; }
        .alert-danger .alert-icon { color: var(--btn-red); }
        .alert-warning { border-left: 4px solid #ffc107; color: #ffe69c; }
        .alert-warning .alert-icon { color: #ffc107; }
        .alert-certif-ok { border-left: 4px solid var(--btn-green); color: white; }
        .alert-certif-ok .alert-icon { color: var(--btn-green); }

        /* Modales */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: none; z-index: 4000; justify-content: center; align-items: center; }
        .modal-overlay.open { display: flex; }
        .modal-card { background: var(--bg-panel); width: 90%; max-width: 550px; padding: 30px; border-radius: 15px; border: 1px solid #555; box-shadow: 0 15px 35px rgba(0,0,0,0.5); }
        .modal-title { font-size: 22px; color: white; margin-top: 0; margin-bottom: 25px; font-weight: bold; border-bottom: 1px solid #444; padding-bottom: 15px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; color: #aaa; margin-bottom: 8px; font-size: 14px; font-weight: bold; }
        .form-group input[type="text"], .form-group textarea, .form-group select { width: 100%; padding: 12px 15px; background: #1a1b23; border: 1px solid #444; color: white; border-radius: 8px; font-size: 15px; outline: none; font-family: inherit; transition: 0.2s; }
        .form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: var(--accent); }
        .form-group textarea { resize: vertical; min-height: 120px; line-height: 1.5; }
        .checkbox-group { display: flex; align-items: center; gap: 10px; background: #1a1b23; padding: 15px; border-radius: 8px; border: 1px dashed #555; cursor: pointer; transition: 0.2s; }
        .checkbox-group:hover { border-color: var(--accent); }
        .checkbox-group input { width: 20px; height: 20px; cursor: pointer; }
        .checkbox-group label { margin: 0; color: white; cursor: pointer; font-size: 15px; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 15px; margin-top: 30px; }
        .btn-modal-cancel { background: #444; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; transition: 0.2s; }
        .btn-modal-cancel:hover { background: #555; }
        .btn-modal-submit { background: var(--btn-blue); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
        .btn-modal-submit:hover { background: #2980b9; }

        @media (max-width: 900px) { .dashboard-grid { grid-template-columns: 1fr; } }
        @media (max-width: 768px) {
            .main-content { padding: 15px; }
            .dash-header { flex-direction: column; gap: 15px; align-items: flex-start; }
            .dash-title { padding-right: 80px; }
            .header-actions { width: 100%; }
            .date-text { width: 100%; text-align: center; }
            .section-header { flex-direction: column; align-items: flex-start; gap: 10px; }
            .section-header .action-btn { width: 100%; justify-content: center; }
            .quick-action-card { min-height: 130px; padding: 25px 15px; }
        }
    </style>

    <!-- SVG Sprites -->
    <svg style="display:none">
        <symbol id="ic-briefcase" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></symbol>
        <symbol id="ic-code" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></symbol>
        <symbol id="ic-crown" viewBox="0 0 24 24"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></symbol>
        <symbol id="ic-building" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></symbol>
        <symbol id="ic-plus" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></symbol>
        <symbol id="ic-megaphone" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></symbol>
        <symbol id="ic-zap" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></symbol>
        <symbol id="ic-file-text" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></symbol>
        <symbol id="ic-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></symbol>
        <symbol id="ic-cart" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></symbol>
        <symbol id="ic-calendar" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></symbol>
        <symbol id="ic-bar-chart" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></symbol>
        <symbol id="ic-tool" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></symbol>
        <symbol id="ic-check-circle" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></symbol>
        <symbol id="ic-award" viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></symbol>
        <symbol id="ic-alert-triangle" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></symbol>
        <symbol id="ic-alert-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></symbol>
        <symbol id="ic-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></symbol>
        <symbol id="ic-pin" viewBox="0 0 24 24"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 1 0-6 0v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"/></symbol>
        <symbol id="ic-trash" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></symbol>
        <symbol id="ic-edit" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></symbol>
    </svg>

    <div class="main-content">

        <div class="dash-header">
            <div class="dash-title-area">
                <h1 id="greeting">Chargement...</h1>
                <p id="roleText"><svg width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><use href="#ic-briefcase"/></svg> Vérification des accès</p>
            </div>
            <div class="header-actions">
                <div class="date-text" id="todayDate"></div>
            </div>
        </div>

        <div class="dashboard-grid">

            <div class="col-main">
                <div class="section-header">
                    <div class="section-title">
                        <svg width="24" height="24" style="stroke:var(--accent);fill:none;stroke-width:2"><use href="#ic-megaphone"/></svg>
                        Tableau d'affichage
                    </div>
                    <button class="action-btn" id="btn-add-news" style="display:none">
                        <svg width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><use href="#ic-plus"/></svg> Publier une annonce
                    </button>
                </div>
                <div class="news-container" id="newsList"></div>
            </div>

            <div class="col-side">

                <div class="section-header">
                    <div class="section-title">
                        <svg width="24" height="24" style="stroke:var(--accent);fill:none;stroke-width:2"><use href="#ic-zap"/></svg>
                        Accès Rapides
                    </div>
                </div>

                <div class="quick-actions-grid">
                    <div class="quick-action-card" data-nav="factures">
                        <div class="icon-bubble"><svg><use href="#ic-file-text"/></svg></div>
                        <div class="quick-action-text">Factures</div>
                    </div>
                    <div class="quick-action-card" data-nav="temps">
                        <div class="icon-bubble"><svg><use href="#ic-clock"/></svg></div>
                        <div class="quick-action-text">Heures</div>
                    </div>
                    <div class="quick-action-card" data-nav="po">
                        <div class="icon-bubble"><svg><use href="#ic-cart"/></svg></div>
                        <div class="quick-action-text">Bons (PO)</div>
                    </div>
                    <div class="quick-action-card" data-nav="calendrier">
                        <div class="icon-bubble"><svg><use href="#ic-calendar"/></svg></div>
                        <div class="quick-action-text">Agenda</div>
                    </div>
                </div>

                <div class="alerts-wrapper">
                    <div class="section-title" style="margin-bottom:20px;font-size:18px">
                        <svg width="20" height="20" style="stroke:var(--btn-blue);fill:none;stroke-width:2"><use href="#ic-bar-chart"/></svg>
                        Mon Bilan
                    </div>
                    <div class="stats-container">
                        <div class="stat-item" id="item-inv" data-nav="factures">
                            <span class="stat-label"><svg width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:2"><use href="#ic-file-text"/></svg> Factures non envoyées</span>
                            <span class="stat-badge alert" id="stat-inv">0</span>
                        </div>
                        <div class="stat-item" id="item-ts" data-nav="temps">
                            <span class="stat-label"><svg width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:2"><use href="#ic-clock"/></svg> Feuilles de temps en attente</span>
                            <span class="stat-badge warn" id="stat-ts">0</span>
                        </div>
                        <div class="stat-item" id="item-tools" data-nav="outils">
                            <span class="stat-label"><svg width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:2"><use href="#ic-tool"/></svg> Outils dans mon camion</span>
                            <span class="stat-badge warn" id="stat-tools">0</span>
                        </div>
                        <div id="bilan-empty-msg" class="bilan-empty">
                            <svg width="24" height="24" style="stroke:var(--btn-green);fill:none;stroke-width:2;display:block;margin:0 auto 5px"><use href="#ic-check-circle"/></svg>
                            Tu es à jour et tu n'as rien oublié !
                        </div>
                    </div>
                </div>

                <div class="alerts-wrapper">
                    <div class="section-title" style="margin-bottom:20px;font-size:18px">
                        <svg width="20" height="20" style="stroke:var(--btn-green);fill:none;stroke-width:2"><use href="#ic-award"/></svg>
                        Mes Certifications
                    </div>
                    <div class="alerts-container" id="alertsList"></div>
                </div>

            </div>
        </div>
    </div>

    <!-- Modal annonce -->
    <div class="modal-overlay" id="newsModal">
        <div class="modal-card">
            <h2 class="modal-title">Publier une annonce</h2>
            <div class="form-group">
                <label>Niveau d'importance</label>
                <select id="newsType">
                    <option value="info">Information (Affichage standard)</option>
                    <option value="important">Urgent (Affichage Rouge)</option>
                    <option value="normal">Note de chantier (Affichage Bleu)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Titre principal</label>
                <input type="text" id="newsTitle" placeholder="Ex: Rappel pour les feuilles de temps">
            </div>
            <div class="form-group">
                <label>Message complet</label>
                <textarea id="newsBody" placeholder="Écrivez les détails de votre annonce ici..."></textarea>
            </div>
            <div class="form-group">
                <div class="checkbox-group" id="pinnedGroup">
                    <input type="checkbox" id="newsPinned">
                    <label for="newsPinned">Épingler cette annonce tout en haut</label>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-modal-cancel" id="btnCancelNews">Annuler</button>
                <button class="btn-modal-submit" id="btnSaveNews">
                    <svg width="16" height="16" style="stroke:white;fill:none;stroke-width:2"><use href="#ic-megaphone"/></svg> Publier
                </button>
            </div>
        </div>
    </div>

    <!-- Modal confirmation -->
    <div class="modal-overlay" id="confirmModal">
        <div class="modal-card" style="max-width:400px;text-align:center">
            <h2 class="modal-title" style="color:var(--btn-red);border:none;margin-bottom:10px;padding-bottom:0">Confirmation</h2>
            <p id="confirmMsg" style="color:#e0e0e0;margin-bottom:25px;font-size:15px"></p>
            <div class="modal-actions" style="justify-content:center">
                <button class="btn-modal-cancel" id="btnCancelConfirm">Annuler</button>
                <button class="btn-modal-submit" id="btnYesConfirm" style="background:var(--btn-red)">Oui, supprimer</button>
            </div>
        </div>
    </div>
    `,await f()}async function f(){let e=new Date().toLocaleDateString(`fr-CA`,{weekday:`long`,year:`numeric`,month:`long`,day:`numeric`});document.getElementById(`todayDate`).textContent=e.charAt(0).toUpperCase()+e.slice(1);let t=a?.prenom_nom?.split(` `)[0]||`vous`;document.getElementById(`greeting`).textContent=`Bonjour, ${t} !`;let i={A0:`<svg width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><use href="#ic-code"/></svg> DÉVELOPPEUR SYSTÈME`,A1:`<svg width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><use href="#ic-crown"/></svg> Administrateur`,A2:`<svg width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><use href="#ic-building"/></svg> Gestion &amp; Bureau`,A3:`<svg width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><use href="#ic-briefcase"/></svg> Employé sur le terrain`};document.getElementById(`roleText`).innerHTML=i[r]||i.A3,n(`manage_news`)?document.getElementById(`btn-add-news`).style.display=`flex`:document.getElementById(`btn-add-news`).style.display=`none`,document.querySelectorAll(`.quick-action-card[data-nav]`).forEach(e=>{e.addEventListener(`click`,()=>s(e.dataset.nav))}),document.querySelectorAll(`.stat-item[data-nav]`).forEach(e=>{e.addEventListener(`click`,()=>s(e.dataset.nav))}),document.getElementById(`btn-add-news`).addEventListener(`click`,g),document.getElementById(`btnCancelNews`).addEventListener(`click`,_),document.getElementById(`btnSaveNews`).addEventListener(`click`,v),document.getElementById(`btnCancelConfirm`).addEventListener(`click`,C),document.getElementById(`btnYesConfirm`).addEventListener(`click`,()=>{u&&u(),C()}),document.getElementById(`pinnedGroup`).addEventListener(`click`,e=>{e.target.id!==`newsPinned`&&document.getElementById(`newsPinned`).click()}),await Promise.all([p(),x(),b()]);let o=()=>x();window.addEventListener(`formations_updated`,o);let c=()=>b();return window.addEventListener(`focus`,c),function(){window.removeEventListener(`formations_updated`,o),window.removeEventListener(`focus`,c)}}async function p(){try{let{data:t,error:n}=await e.from(`annonces`).select(`*`).order(`is_pinned`,{ascending:!1}).order(`created_at`,{ascending:!1});if(n)throw n;l=(t||[]).map(e=>({id:e.id,type:e.type,title:e.titre,body:e.contenu,author:e.auteur,date:e.created_at,isPinned:e.is_pinned}))}catch{l=[]}m()}function m(){let e=document.getElementById(`newsList`);if(e){if(e.innerHTML=``,l.length===0){e.innerHTML=`<div style="background:var(--bg-panel);border-radius:12px;border:1px dashed #444;color:#888;text-align:center;padding:40px;font-style:italic">Aucune annonce pour le moment.</div>`;return}[...l].sort((e,t)=>e.isPinned&&!t.isPinned?-1:!e.isPinned&&t.isPinned?1:new Date(t.date)-new Date(e.date)).forEach(t=>{let r=new Date(t.date),i=r.toLocaleDateString(`fr-CA`)+` à `+r.toLocaleTimeString(`fr-CA`,{hour:`2-digit`,minute:`2-digit`}),a=``;if(n(`manage_news`)){let e=t.isPinned?`pin-active`:``,n=t.isPinned?`Désépingler`:`Épingler en haut`;a=`
                <div class="news-actions">
                    <button class="btn-news-icon ${e}" data-pin="${t.id}" title="${n}">
                        <svg width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><use href="#ic-pin"/></svg>
                    </button>
                    <button class="btn-news-icon delete" data-delete="${t.id}" title="Supprimer">
                        <svg width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><use href="#ic-trash"/></svg>
                    </button>
                </div>`}let o=`ic-info`;t.type===`important`&&(o=`ic-alert-circle`),t.type===`normal`&&(o=`ic-edit`),t.isPinned&&(o=`ic-pin`);let s=document.createElement(`div`);s.className=`news-card ${t.type} ${t.isPinned?`pinned`:``}`,s.innerHTML=`
            <div class="news-header">
                <h3 class="news-title">
                    <svg width="20" height="20" style="stroke:currentColor;fill:none;stroke-width:2;margin-top:2px"><use href="#${c(o)}"/></svg>
                    ${c(t.title)}
                </h3>
                <div class="news-date">
                    <svg width="14" height="14" style="stroke:currentColor;fill:none;stroke-width:2"><use href="#ic-calendar"/></svg>
                    Publié le ${c(i)}
                </div>
            </div>
            <div class="news-body">${c(t.body)}</div>
            <div class="news-author">Auteur : <strong>${c(t.author)}</strong></div>
            ${a}
        `,e.appendChild(s)}),e.querySelectorAll(`[data-pin]`).forEach(e=>{e.addEventListener(`click`,()=>h(e.dataset.pin))}),e.querySelectorAll(`[data-delete]`).forEach(e=>{e.addEventListener(`click`,()=>y(e.dataset.delete))})}}async function h(t){let n=l.findIndex(e=>e.id===t);n>-1&&(l[n].isPinned=!l[n].isPinned,await e.from(`annonces`).update({is_pinned:l[n].isPinned}).eq(`id`,t),m())}function g(){if(!n(`manage_news`)){t(`Vous n'avez pas la permission.`,`warning`);return}document.getElementById(`newsTitle`).value=``,document.getElementById(`newsBody`).value=``,document.getElementById(`newsType`).value=`info`,document.getElementById(`newsPinned`).checked=!1,document.getElementById(`newsModal`).classList.add(`open`)}function _(){document.getElementById(`newsModal`).classList.remove(`open`)}async function v(){if(!n(`manage_news`))return;let i=document.getElementById(`newsTitle`).value.trim(),o=document.getElementById(`newsBody`).value.trim(),s=document.getElementById(`newsType`).value,c=document.getElementById(`newsPinned`).checked;if(!i||!o){t(`Veuillez remplir le titre et le message.`,`warning`);return}let l=a?.prenom_nom||`Utilisateur`;r===`A0`&&localStorage.getItem(`dussault_a0_alias`)===`systeme`&&(l=`Système`);let{error:u}=await e.from(`annonces`).insert([{type:s,titre:i,contenu:o,auteur:l,is_pinned:c}]);if(u){t(`Erreur de publication : `+u.message,`error`);return}await p(),_()}function y(n){S(`Voulez-vous vraiment supprimer cette annonce pour tout le monde ?`,async()=>{let{error:r}=await e.from(`annonces`).delete().eq(`id`,n);if(r){t(`Erreur suppression : `+r.message,`error`);return}l=l.filter(e=>e.id!==n),m()})}async function b(){if(i)try{let[t,n,r]=await Promise.all([e.from(`factures`).select(`id`).eq(`author_id`,i.id).in(`status`,[`brouillon`,`renvoye`]),e.from(`feuilles_de_temps`).select(`id`).eq(`author_id`,i.id).eq(`status`,`brouillon`),e.from(`outils`).select(`id`).eq(`assignee_nom`,a?.prenom_nom).eq(`status`,`active`)]),o=(t.data||[]).length,s=(n.data||[]).length,c=(r.data||[]).length,l=document.getElementById(`item-inv`),u=document.getElementById(`item-ts`),d=document.getElementById(`item-tools`),f=document.getElementById(`bilan-empty-msg`);l&&(document.getElementById(`stat-inv`).textContent=o,l.style.display=o>0?`flex`:`none`),u&&(document.getElementById(`stat-ts`).textContent=s,u.style.display=s>0?`flex`:`none`),d&&(document.getElementById(`stat-tools`).textContent=c,d.style.display=c>0?`flex`:`none`),f&&(f.style.display=o===0&&s===0&&c===0?`block`:`none`)}catch(e){console.error(`Erreur stats:`,e)}}async function x(){let t=document.getElementById(`alertsList`);if(!t||!i)return;t.innerHTML=``;let n=!1,{data:r}=await e.from(`formations`).select(`*`).eq(`user_id`,i.id),a=r||[],o=new Date;a.forEach(e=>{let r=new Date(e.date_expiration),i=Math.ceil((r-o)/(1e3*60*60*24)),a=c(e.nom||e.name||`Formation`);i<0?(n=!0,t.innerHTML+=`
                <div class="alert-item alert-danger">
                    <span class="alert-icon"><svg width="24" height="24" style="stroke:currentColor;fill:none;stroke-width:2"><use href="#ic-alert-triangle"/></svg></span>
                    <div><b>${a}</b> est expirée !</div>
                </div>`):i<=30&&(n=!0,t.innerHTML+=`
                <div class="alert-item alert-warning">
                    <span class="alert-icon"><svg width="24" height="24" style="stroke:currentColor;fill:none;stroke-width:2"><use href="#ic-clock"/></svg></span>
                    <div><b>${a}</b> expire dans ${i}j.</div>
                </div>`)}),n||(t.innerHTML=`
            <div class="alert-item alert-certif-ok">
                <span class="alert-icon"><svg width="24" height="24" style="stroke:currentColor;fill:none;stroke-width:2"><use href="#ic-award"/></svg></span>
                <div>Toutes vos cartes sont à jour.</div>
            </div>`)}function S(e,t){document.getElementById(`confirmMsg`).textContent=e,u=t,document.getElementById(`confirmModal`).classList.add(`open`)}function C(){document.getElementById(`confirmModal`).classList.remove(`open`),u=null}export{d as render};