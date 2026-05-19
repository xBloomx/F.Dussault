import{t as e}from"./supabase-BHP_DPH_.js";import{i as t,r as n,t as r}from"./auth-wlrJYOzK.js";import{t as i}from"./sanitize-CY3yUbkZ.js";import{t as a}from"./withRetry-DqM7w1cb.js";var o=``,s=`perso`,c=[],l=``,u=[],d=[],f=new Date,p=null,m=null,h=!1,g=!1,_=[],v=[],y=null,b=[{id:`ferie`,name:`Congé Férié`,color:`#ffc107`},{id:`ccq`,name:`Congés CCQ`,color:`#ff4d4d`},{id:`job`,name:`Job / Chantier`,color:`#007bff`},{id:`perso`,name:`Congés personnel`,color:`var(--btn-purple)`},{id:`note`,name:`Note`,color:`#6c757d`},{id:`urgence`,name:`Garde Urgence`,color:`#ff4757`},{id:`formation`,name:`Expiration Formation`,color:`#28a745`}],x=[`job`,`perso`,`note`];async function S(t){t.innerHTML=`
    <style>
        :root { --cal-grid-border: #444; --cal-header-bg: #333; }
        .cal-main { padding: 30px; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .dash-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 15px; flex-wrap: wrap; }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .action-btn { background-color: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; white-space: nowrap; }
        .action-btn:hover { background-color: var(--accent-hover); transform: translateY(-2px); }
        .action-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .tabs-container { display: flex; gap: 10px; flex-wrap: wrap; }
        .btn-tab { background: #1a1b23; color: #aaa; border: 1px solid #444; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
        .btn-tab svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-tab.active { background: var(--btn-blue); color: white; border-color: var(--btn-blue); }
        .btn-tab-dashed { border: 1px dashed #888; background: transparent; color: #888; }
        .btn-tab-dashed:hover { border-color: white; color: white; }
        .cal-controls { display: flex; justify-content: space-between; align-items: center; background-color: var(--bg-panel); padding: 15px; border-radius: 12px; }
        .cal-nav-btn { background: #444; color: white; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .cal-nav-btn svg { width: 20px; height: 20px; stroke: currentColor; fill: none; stroke-width: 2; }
        .cal-nav-btn:hover { background: var(--accent); color: black; }
        .cal-month-title { font-size: 24px; font-weight: bold; color: white; text-transform: capitalize; }
        .calendar-wrapper { flex: none; background: var(--bg-panel); border-radius: 12px; border: 1px solid var(--cal-grid-border); overflow-x: auto; display: flex; flex-direction: column; }
        .day-headers { display: grid; grid-template-columns: repeat(7, 1fr); min-width: 700px; }
        .day-header { background: var(--cal-header-bg); color: #aaa; display: flex; align-items: center; justify-content: center; font-weight: bold; border-bottom: 1px solid var(--cal-grid-border); border-right: 1px solid var(--cal-grid-border); padding: 10px 0; }
        .cal-days-container { display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: 100px; align-content: start; min-width: 700px; }
        .cal-day { border-right: 1px solid var(--cal-grid-border); border-bottom: 1px solid var(--cal-grid-border); padding: 5px; position: relative; background: var(--bg-panel); cursor: pointer; transition: background 0.2s; height: 100px; max-height: 100px; overflow-y: auto; -ms-overflow-style: none; scrollbar-width: none; }
        .cal-day::-webkit-scrollbar { display: none; }
        .cal-day:hover { background: #343542; }
        .cal-day.today { background: rgba(252,202,70,0.05); }
        .cal-day.today .day-num { background: var(--accent); color: black; }
        .cal-day.other-month { opacity: 0.4; background: #222; pointer-events: none; }
        .day-num { font-weight: bold; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin-bottom: 5px; font-size: 14px; pointer-events: none; color: #ddd; }
        .event-bar { font-size: 11px; padding: 2px 6px; margin-bottom: 3px; border-radius: 4px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; position: relative; display: flex; justify-content: space-between; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
        .event-bar:hover { opacity: 0.9;  transform: scale(1.01); }
        .event-mine { border-left: 3px solid var(--accent); }
        .urgence-badge { position: absolute; top: 5px; right: 5px; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; box-shadow: 0 2px 5px rgba(0,0,0,0.5); z-index: 10; cursor: pointer; transition: transform 0.2s; }
        .urgence-badge svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .urgence-badge:hover { transform: scale(1.15); }
        .urgence-badge.filled { background: #ff4757; color: white; border: 1px solid rgba(255,255,255,0.3); }
        .urgence-badge.empty { background: rgba(255,255,255,0.1); color: #777; border: 1px dashed #555; }
        .legend-container { display: flex; gap: 15px; font-size: 12px; color: #aaa; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.2); padding: 4px 10px; border-radius: 20px; }
        .legend-dot { width: 12px; height: 12px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; z-index: 3000; justify-content: center; align-items: center; }
        .modal-overlay.open { display: flex; }
        .modal-card { background: var(--bg-panel); width: 90%; max-width: 450px; padding: 25px; border-radius: 15px; border: 1px solid #555; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-height: 90vh; overflow-y: auto; }
        .modal-title { font-size: 20px; color: white; margin-bottom: 20px; font-weight: bold; border-bottom: 1px solid #444; padding-bottom: 10px; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; color: #aaa; margin-bottom: 5px; font-size: 14px; font-weight: bold; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; background: var(--bg-dark); border: 1px solid var(--border); color: white; border-radius: 5px; font-family: sans-serif; outline: none; transition: 0.2s; box-sizing: border-box; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--accent); }
        .form-group textarea { resize: vertical; min-height: 80px; }
        .guest-list-container { background: var(--bg-dark); border: 1px solid var(--border); border-radius: 5px; padding: 10px; max-height: 120px; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; }
        .guest-item { display: flex; align-items: center; gap: 10px; color: white; font-size: 14px; cursor: pointer; }
        .guest-item input { width: 16px; height: 16px; cursor: pointer; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
        .btn-cancel { background: #444; color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; transition: 0.2s;}
        .btn-submit { background: var(--btn-green); color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 6px; transition: 0.2s;}
        .btn-submit svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-delete-evt { background: var(--btn-red); color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 6px; }
        .btn-delete-evt svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .view-row { margin-bottom: 12px; font-size: 14px; }
        .view-label { color: #aaa; font-size: 12px; font-weight: bold; margin-bottom: 4px; }
        .view-value { color: white; font-weight: bold; font-size: 16px; margin-top: 2px; }
        .note-box { background: var(--bg-dark); padding: 12px; border-radius: 8px; border: 1px solid var(--border); font-weight: normal; font-size: 14px; white-space: pre-wrap; line-height: 1.4; }
        .day-detail-item { padding: 12px; background: var(--bg-dark); border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: 0.2s; display: flex; flex-direction: column; gap: 4px; border: 1px solid var(--border); }
        .day-detail-item:hover { background: #343542; border-color: var(--btn-blue); }
        @media (max-width: 768px) {
            .cal-main { padding: 15px; gap: 12px; }
            .dash-header { flex-direction: column; align-items: stretch; gap: 12px; }
            .dash-header .dash-title { margin-bottom: 0; }
            .dash-header > div:last-child { display: flex; gap: 10px; }
            .dash-header .action-btn { flex: 1; justify-content: center; border-radius: 12px; }
            .tabs-container { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .btn-tab { justify-content: center; padding: 11px 8px; font-size: 13px; border-radius: 10px; }
            .btn-tab-dashed { grid-column: 1 / -1; justify-content: center; }
            .cal-month-title { font-size: 18px; }
            .day-header { font-size: 11px; padding: 8px 0; }
            .cal-day { padding: 5px; height: 100px; max-height: 100px; }
            .day-num { width: 22px; height: 22px; font-size: 11px; }
            .event-bar { font-size: 10px; padding: 3px 5px; }
            .urgence-badge { top: 4px; right: 4px; width: 20px; height: 20px; font-size: 10px; }
            .modal-card { width: 95%; padding: 20px; }
        }
    </style>

    <div class="cal-main">
        <div class="dash-header">
            <div class="dash-title">
                <h1>Calendriers</h1>
                <p>Personnel, Global et Équipes</p>
            </div>
            <div style="display:flex;gap:10px;">
                <button class="action-btn" id="btnDeleteCal" style="display:none;background:var(--btn-red);color:white;flex-shrink:0">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Effacer ce calendrier
                </button>
                <button class="action-btn" id="btnAddEvent">
                    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Événement
                </button>
            </div>
        </div>

        <div class="tabs-container" id="calTabsContainer"></div>
        <div class="legend-container" id="legendContainer"></div>

        <div class="cal-controls">
            <button class="cal-nav-btn" id="btnPrevMonth">
                <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="cal-month-title" id="calTitle">...</div>
            <button class="cal-nav-btn" id="btnNextMonth">
                <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
        </div>

        <div class="calendar-wrapper">
            <div class="day-headers">
                <div class="day-header">Dim</div><div class="day-header">Lun</div><div class="day-header">Mar</div>
                <div class="day-header">Mer</div><div class="day-header">Jeu</div><div class="day-header">Ven</div><div class="day-header">Sam</div>
            </div>
            <div class="cal-days-container" id="calendarDays"></div>
        </div>
    </div>

    <!-- Modal nouveau calendrier -->
    <div class="modal-overlay" id="newCalModal">
        <div class="modal-card">
            <div class="modal-title">Créer un calendrier partagé</div>
            <div class="form-group">
                <label>Nom du calendrier</label>
                <input type="text" id="newCalName" placeholder="Ex: Équipe Chantier B">
            </div>
            <div class="form-group">
                <label>Partager avec :</label>
                <div class="guest-list-container" id="calGuestListContainer"></div>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" id="btnCloseNewCal">Annuler</button>
                <button class="btn-submit" id="btnSaveNewCal">
                    <svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Créer
                </button>
            </div>
        </div>
    </div>

    <!-- Modal détails du jour -->
    <div class="modal-overlay" id="dayModal">
        <div class="modal-card">
            <div class="modal-title" id="dayModalTitle">Événements du ...</div>
            <div id="dayModalContent" style="display:flex;flex-direction:column;max-height:50vh;overflow-y:auto;margin-bottom:15px"></div>
            <div class="modal-actions" style="justify-content:space-between">
                <button class="btn-cancel" id="btnCloseDayModal">Fermer</button>
                <button class="action-btn" id="btnAddFromDay">
                    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Ajouter ici
                </button>
            </div>
        </div>
    </div>

    <!-- Modal ajout/édition événement -->
    <div class="modal-overlay" id="addModal">
        <div class="modal-card">
            <div class="modal-title" id="modalTitle">Nouvel Événement</div>
            <div class="form-group" id="grpCalendar">
                <label>Calendrier de destination</label>
                <select id="evtCalendarId"></select>
            </div>
            <div class="form-group" id="grpCategory">
                <label>Catégorie</label>
                <select id="evtCategory"></select>
            </div>
            <div class="form-group">
                <label>Titre / Nom du chantier</label>
                <input type="text" id="evtTitle" placeholder="Ex: Rénovation école">
            </div>
            <div style="display:flex;gap:15px">
                <div class="form-group" style="flex:1">
                    <label>Début</label>
                    <input type="text" id="evtStart" placeholder="JJ/MM/AAAA" inputmode="numeric" maxlength="10">
                </div>
                <div class="form-group" style="flex:1">
                    <label>Fin (Inclus)</label>
                    <input type="text" id="evtEnd" placeholder="JJ/MM/AAAA" inputmode="numeric" maxlength="10">
                </div>
            </div>
            <div class="form-group" id="grpGuests">
                <label>Assigner / Partager l'événement avec :</label>
                <div class="guest-list-container" id="guestListContainer"></div>
            </div>
            <div class="form-group">
                <label>Notes & Adresse</label>
                <textarea id="evtNote" placeholder="Détails du travail, informations..."></textarea>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" id="btnCloseAddModal">Annuler</button>
                <button class="btn-submit" id="btnSaveEvent">
                    <svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Sauvegarder
                </button>
            </div>
        </div>
    </div>

    <!-- Modal vue événement -->
    <div class="modal-overlay" id="viewModal">
        <div class="modal-card">
            <div class="modal-title" style="display:flex;justify-content:space-between;align-items:center">
                <span>Détails de l'événement</span>
                <span id="viewAuthorBadge" style="font-size:11px;background:#444;padding:3px 8px;border-radius:10px;font-weight:normal"></span>
            </div>
            <div class="view-row"><div class="view-label">TITRE</div><div class="view-value" id="viewTitle">...</div></div>
            <div class="view-row"><div class="view-label">CATÉGORIE</div><div class="view-value" id="viewCat" style="display:flex;align-items:center;gap:8px">...</div></div>
            <div class="view-row"><div class="view-label">DATES</div><div class="view-value" id="viewDates">...</div></div>
            <div class="view-row" id="viewGuestsContainer" style="display:none;margin-top:15px">
                <div class="view-label">ASSIGNÉ(S) À</div>
                <div class="view-value" id="viewGuests" style="font-size:14px;color:#66b2ff">...</div>
            </div>
            <div class="view-row" id="viewNoteContainer" style="display:none;margin-top:15px">
                <div class="view-label">NOTES / DÉTAILS / ADRESSE</div>
                <div class="view-value note-box" id="viewNote">...</div>
            </div>
            <div class="modal-actions" style="justify-content:space-between;margin-top:25px">
                <button class="btn-delete-evt" id="btnDeleteEvent" style="display:none">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Supprimer
                </button>
                <div style="display:flex;gap:10px">
                    <button class="btn-cancel" id="btnCloseViewModal">Fermer</button>
                    <button class="action-btn" id="btnEditEvent" style="display:none">
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Modifier
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal alerte -->
    <div class="modal-overlay" id="alertModal" style="z-index:5000">
        <div class="modal-card" style="width:320px;text-align:center">
            <div class="modal-title" style="color:var(--accent);margin-bottom:10px;border:none">Information</div>
            <p id="alertMessage" style="color:#e0e0e0;margin-bottom:25px;font-size:15px"></p>
            <button class="action-btn" style="width:100%;justify-content:center" id="btnCloseAlert">Compris</button>
        </div>
    </div>

    <!-- Modal confirmation -->
    <div class="modal-overlay" id="confirmModal" style="z-index:6000">
        <div class="modal-card" style="width:320px;text-align:center">
            <div class="modal-title" style="color:var(--btn-red);margin-bottom:10px;border:none">Attention</div>
            <p id="confirmMessage" style="color:#e0e0e0;margin-bottom:25px;font-size:15px"></p>
            <div style="display:flex;gap:10px">
                <button class="btn-cancel" style="flex:1" id="btnCancelConfirm">Non</button>
                <button class="btn-delete-evt" style="flex:1;justify-content:center" id="btnExecuteConfirm">Oui</button>
            </div>
        </div>
    </div>
    `,await C();let r=async()=>{try{let{data:t}=await e.from(`formations`).select(`id, nom, date_expiration`).eq(`user_id`,n.id);_=t||[]}catch{_=[]}j()};return window.addEventListener(`formations_updated`,r),function(){window.removeEventListener(`formations_updated`,r)}}async function C(){n&&(o=r?.prenom_nom||`Moi`,document.getElementById(`btnPrevMonth`).addEventListener(`click`,()=>k(-1)),document.getElementById(`btnNextMonth`).addEventListener(`click`,()=>k(1)),document.getElementById(`btnAddEvent`).addEventListener(`click`,()=>L()),document.getElementById(`btnDeleteCal`).addEventListener(`click`,I),document.getElementById(`btnCloseNewCal`).addEventListener(`click`,()=>W(`newCalModal`)),document.getElementById(`btnSaveNewCal`).addEventListener(`click`,F),document.getElementById(`btnCloseDayModal`).addEventListener(`click`,()=>W(`dayModal`)),document.getElementById(`btnAddFromDay`).addEventListener(`click`,()=>{W(`dayModal`),L(l)}),document.getElementById(`btnCloseAddModal`).addEventListener(`click`,()=>W(`addModal`)),document.getElementById(`btnSaveEvent`).addEventListener(`click`,R),document.getElementById(`btnCloseViewModal`).addEventListener(`click`,()=>W(`viewModal`)),document.getElementById(`btnEditEvent`).addEventListener(`click`,B),document.getElementById(`btnDeleteEvent`).addEventListener(`click`,V),document.getElementById(`btnCloseAlert`).addEventListener(`click`,()=>W(`alertModal`)),document.getElementById(`btnCancelConfirm`).addEventListener(`click`,()=>W(`confirmModal`)),document.getElementById(`btnExecuteConfirm`).addEventListener(`click`,()=>{y&&y(),W(`confirmModal`)}),document.getElementById(`evtStart`).addEventListener(`keyup`,e=>G(e.target)),document.getElementById(`evtEnd`).addEventListener(`keyup`,e=>G(e.target)),await w(),await T())}async function w(){let{data:t,error:n}=await e.from(`profils`).select(`id, prenom_nom`).order(`role`);if(n){console.warn(`[calendrier] fetchTeamMembers:`,n.message);return}t&&(c=t)}async function T(){let{data:t}=await e.from(`evenements`).select(`*`);t&&(u=t.filter(e=>e.type_entite===`calendar_def`),d=t.filter(e=>e.type_entite===`event`));try{let{data:t}=await e.from(`formations`).select(`id, nom, date_expiration`).eq(`user_id`,n.id);_=t||[]}catch{_=[]}D(),O(),j()}function E(e){s=e,D(),j(),document.getElementById(`btnDeleteCal`).style.display=s.startsWith(`cal-`)?`flex`:`none`}function D(){let e=document.getElementById(`calTabsContainer`);if(!e)return;let t=[{id:`perso`,label:`Mon Horaire`,icon:`<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`},{id:`global`,label:`Calendrier Global`,icon:`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`}].map(e=>`
        <button class="btn-tab ${s===e.id?`active`:``}" data-tabid="${e.id}">
            <svg viewBox="0 0 24 24">${e.icon}</svg> ${e.label}
        </button>`).join(``);u.forEach(e=>{let r=e.shared_with?e.shared_with.map(e=>e.id):[];(e.author_id===n.id||r.includes(n.id))&&(t+=`<button class="btn-tab ${s===e.id?`active`:``}" data-tabid="${e.id}">
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                ${e.calendar_name}
            </button>`)}),t+=`<button class="btn-tab btn-tab-dashed" id="btnNewCalendar">
        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Créer calendrier
    </button>`,e.innerHTML=t,e.querySelectorAll(`[data-tabid]`).forEach(e=>{e.addEventListener(`click`,()=>E(e.dataset.tabid))}),document.getElementById(`btnNewCalendar`)?.addEventListener(`click`,P)}function O(){let e=document.getElementById(`legendContainer`);e&&(e.innerHTML=b.filter(e=>e.id!==`urgence`).map(e=>`<div class="legend-item"><div class="legend-dot" style="background:${e.color}"></div> ${e.name}</div>`).join(``))}function k(e){f.setMonth(f.getMonth()+e),j()}function A(e){let t=Math.floor,n=e%19,r=t(e/100),i=(r-t(r/4)-t((8*r+13)/25)+19*n+15)%30,a=i-t(i/28)*(1-t(29/(i+1))*t((21-n)/11)),o=a-(e+t(e/4)+a+2-r+t(r/4))%7,s=3+t((o+40)/44),c=o+28-31*t(s/4),l=new Date(e,s-1,c),u=e=>{let t=new Date(e);return t.getFullYear()+`-`+String(t.getMonth()+1).padStart(2,`0`)+`-`+String(t.getDate()).padStart(2,`0`)},d=(e,t)=>{let n=new Date(e);return n.setDate(n.getDate()+t),n},f=[{id:`sys-1`,d:`${e}-01-01`,t:`Jour de l'An`,type:`ferie`},{id:`sys-2`,d:`${e}-06-24`,t:`St-Jean-Baptiste`,type:`ferie`},{id:`sys-3`,d:`${e}-07-01`,t:`Fête du Canada`,type:`ferie`},{id:`sys-4`,d:`${e}-12-25`,t:`Noël`,type:`ferie`},{id:`sys-5`,d:u(d(l,-2)),t:`Vendredi Saint`,type:`ferie`},{id:`sys-6`,d:u(d(l,1)),t:`Lundi de Pâques`,type:`ferie`}],p=new Date(e,6,19);for(;p.getDay()!==0;)p.setDate(p.getDate()+1);let m=new Date(p);return m.setDate(p.getDate()+13),f.push({id:`sys-7`,start:u(p),end:u(m),t:`Vacances CCQ`,type:`ccq`}),f.push({id:`sys-8`,start:`${e}-12-21`,end:`${e+1}-01-04`,t:`Vacances Hiver`,type:`ccq`}),_.forEach((t,n)=>{if(!t.date_expiration)return;let r=new Date(t.date_expiration);isNaN(r.getTime())||r.getFullYear()!==e||f.push({id:`sys-form-`+(t.id||n),d:u(r),t:`Expiration : `+(t.nom||`Formation`),type:`formation`})}),f}function j(){let e=f.getFullYear(),r=f.getMonth(),a=document.getElementById(`calTitle`);a&&(a.textContent=new Date(e,r).toLocaleString(`fr-FR`,{month:`long`,year:`numeric`}));let o=document.getElementById(`calendarDays`);if(!o)return;o.innerHTML=``;let c=new Date(e,r,1).getDay(),l=new Date(e,r+1,0).getDate(),u=new Date(e,r,0).getDate();v=A(e);for(let e=c-1;e>=0;e--){let t=document.createElement(`div`);t.className=`cal-day other-month`,t.innerHTML=`<div class="day-num">${u-e}</div>`,o.appendChild(t)}let p=new Date().toISOString().split(`T`)[0];for(let a=1;a<=l;a++){let c=new Date(e,r,a),l=c.getFullYear()+`-`+String(c.getMonth()+1).padStart(2,`0`)+`-`+String(c.getDate()).padStart(2,`0`),u=document.createElement(`div`);u.className=`cal-day`+(l===p?` today`:``);let f=`<div class="day-num">${a}</div>`,m=d.find(e=>e.cat_id===`urgence`&&l>=e.start_date&&l<=e.end_date);if(m){let e=m.title?m.title.trim().charAt(0).toUpperCase():`U`;f+=`<div class="urgence-badge filled" data-urgid="${m.id}" title="Garde: ${i(m.title)}">${e}</div>`}else t(`manage_calendar`)&&(f+=`<div class="urgence-badge empty" data-urgdate="${l}" title="Ajouter Garde d'urgence">
                <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>`);v.forEach(e=>{if(e.d&&e.d===l||e.start&&l>=e.start&&l<=e.end){let t=b.find(t=>t.id===e.type)||{color:`#888`},n=[`#ffc107`,`#ffffff`].includes(t.color)?`black`:`white`;f+=`<div class="event-bar" data-sysid="${e.id}" style="background:${t.color};color:${n};font-weight:bold" title="${i(e.t)}">${e.t}</div>`}}),d.filter(e=>l>=e.start_date&&l<=e.end_date).forEach(e=>{if(e.cat_id===`urgence`)return;let t=e.shared_with?e.shared_with.map(e=>e.id):[],r=!1;if(r=s===`perso`?e.calendar_id===`perso`&&e.author_id===n.id||t.includes(n.id):s===`global`?e.calendar_id===`global`:e.calendar_id===s,r){let t=b.find(t=>t.id===e.cat_id)||{color:`#333`},r=e.author_id===n.id;f+=`<div class="event-bar ${r?`event-mine`:``}" data-evtid="${e.id}" style="background:${t.color}" title="${i(e.title)}">${e.title}</div>`}}),u.innerHTML=f,u.addEventListener(`click`,e=>{(e.target===u||e.target.classList.contains(`day-num`))&&N(l)}),u.querySelectorAll(`[data-urgid]`).forEach(e=>e.addEventListener(`click`,t=>{t.stopPropagation(),z(e.dataset.urgid,!1)})),u.querySelectorAll(`[data-urgdate]`).forEach(e=>e.addEventListener(`click`,t=>{t.stopPropagation(),L(e.dataset.urgdate,!0)})),u.querySelectorAll(`[data-sysid]`).forEach(e=>e.addEventListener(`click`,t=>{t.stopPropagation(),z(e.dataset.sysid,!0)})),u.querySelectorAll(`[data-evtid]`).forEach(e=>e.addEventListener(`click`,t=>{t.stopPropagation(),z(e.dataset.evtid,!1)})),o.appendChild(u)}let m=42-(c+l);for(let e=1;e<=m;e++){let t=document.createElement(`div`);t.className=`cal-day other-month`,t.innerHTML=`<div class="day-num">${e}</div>`,o.appendChild(t)}}function M(e){if(!e)return``;let t=e.split(`-`);return t.length===3?`${t[2]}/${t[1]}/${t[0]}`:e}function N(e){l=e,document.getElementById(`dayModalTitle`).textContent=`Le ${M(e)}`;let t=document.getElementById(`dayModalContent`);t.innerHTML=``;let r=[],i=d.find(t=>t.cat_id===`urgence`&&e>=t.start_date&&e<=t.end_date);i&&r.push({...i,isUrg:!0}),v.forEach(t=>{(t.d&&t.d===e||t.start&&e>=t.start&&e<=t.end)&&r.push({...t,isSys:!0})}),d.filter(t=>e>=t.start_date&&e<=t.end_date).forEach(e=>{if(e.cat_id===`urgence`)return;let t=e.shared_with?e.shared_with.map(e=>e.id):[],i=!1;i=s===`perso`?e.calendar_id===`perso`&&e.author_id===n.id||t.includes(n.id):s===`global`?e.calendar_id===`global`:e.calendar_id===s,i&&r.push(e)}),r.length===0?t.innerHTML=`<div style="color:#aaa;font-style:italic;padding:15px 0;text-align:center">Rien de prévu pour cette journée.</div>`:r.forEach(e=>{let n=e.type||e.cat_id,r=b.find(e=>e.id===n)||{color:`#888`,name:``},i=document.createElement(`div`);i.className=`day-detail-item`,i.style.borderLeft=`4px solid ${r.color}`;let a=r.name;e.isUrg&&e.author_name&&(a+=` - Assuré par ${e.author_name}`),i.innerHTML=`<div style="font-weight:bold;color:white;font-size:15px">${e.t||e.title}</div><div style="font-size:12px;color:#aaa">${a}</div>`,i.addEventListener(`click`,()=>{W(`dayModal`),z(e.id,e.isSys)}),t.appendChild(i)}),document.getElementById(`dayModal`).classList.add(`open`)}function P(){document.getElementById(`newCalName`).value=``;let e=document.getElementById(`calGuestListContainer`);e.innerHTML=``,c.forEach(t=>{if(t.id===n.id)return;let r=document.createElement(`label`);r.className=`guest-item`,r.innerHTML=`<input type="checkbox" class="cal-cb" value="${t.id}" data-name="${t.prenom_nom}"> ${t.prenom_nom}`,e.appendChild(r)}),document.getElementById(`newCalModal`).classList.add(`open`)}async function F(){let t=document.getElementById(`newCalName`).value.trim();if(!t){H(`Nom du calendrier requis.`);return}let r=[];document.querySelectorAll(`.cal-cb:checked`).forEach(e=>{r.push({id:e.value,name:e.getAttribute(`data-name`)})});let i={id:`cal-`+Date.now(),type_entite:`calendar_def`,calendar_name:t,author_id:n.id,author_name:o,shared_with:r},{error:s}=await a(()=>e.from(`evenements`).upsert(i));if(s){H(`❌ Erreur de sauvegarde : `+s.message);return}W(`newCalModal`),await T()}async function I(){let t=u.find(e=>e.id===s);if(!t||t.author_id!==n.id){H(`Vous ne pouvez pas supprimer ce calendrier.`);return}U(`Supprimer le calendrier partagé "${t.calendar_name}" et tous ses événements ?`,async()=>{let t=await a(()=>e.from(`evenements`).delete().eq(`calendar_id`,s)),n=await a(()=>e.from(`evenements`).delete().eq(`id`,s));if(t.error||n.error){H(`❌ Erreur de suppression : `+(t.error||n.error).message);return}s=`perso`,await T()})}function L(e=``,r=!1,i=null){m=i?i.id:null,h=r;let a=e=>{if(!e)return``;let t=e.split(`-`);return t.length===3?`${t[2]}/${t[1]}/${t[0]}`:e};document.getElementById(`evtTitle`).value=i?i.title:``,document.getElementById(`evtNote`).value=i?i.note:``,document.getElementById(`evtStart`).value=a(i?i.start_date:e),document.getElementById(`evtEnd`).value=a(i?i.end_date:e);let o=document.getElementById(`grpCategory`),l=document.getElementById(`evtCategory`),d=document.getElementById(`grpCalendar`),f=document.getElementById(`evtCalendarId`),p=document.getElementById(`grpGuests`);if(r)document.getElementById(`modalTitle`).textContent=`Service d'urgence`,o.style.display=`none`,p.style.display=`none`,d.style.display=`none`,document.getElementById(`evtTitle`).value=``;else{document.getElementById(`modalTitle`).textContent=i?`Modifier l'événement`:`Nouvel Événement`,o.style.display=`block`,p.style.display=`block`,d.style.display=`block`,l.innerHTML=x.map(e=>{let t=b.find(t=>t.id===e);return`<option value="${t.id}">${t.name}</option>`}).join(``),i&&(l.value=i.cat_id),f.innerHTML=`<option value="perso">Mon Horaire</option>`,t(`manage_calendar`)&&(f.innerHTML+=`<option value="global">Calendrier Global</option>`),u.forEach(e=>{let t=e.shared_with?e.shared_with.map(e=>e.id):[];(e.author_id===n.id||t.includes(n.id))&&(f.innerHTML+=`<option value="${e.id}">${e.calendar_name}</option>`)}),i?f.value=i.calendar_id:f.value=s===`global`&&!t(`manage_calendar`)?`perso`:s;let e=document.getElementById(`guestListContainer`);e.innerHTML=``,c.forEach(t=>{if(t.id===n.id)return;let r=i?.shared_with?.find(e=>e.id===t.id)?`checked`:``,a=document.createElement(`label`);a.className=`guest-item`,a.innerHTML=`<input type="checkbox" class="evt-guest-cb" value="${t.id}" data-name="${t.prenom_nom}" ${r}> ${t.prenom_nom}`,e.appendChild(a)})}document.getElementById(`addModal`).classList.add(`open`)}async function R(){let t=document.getElementById(`evtTitle`).value.trim(),r=e=>{if(!e)return``;let t=e.split(`/`);return t.length===3?`${t[2]}-${t[1]}-${t[0]}`:e},i=r(document.getElementById(`evtStart`).value),s=r(document.getElementById(`evtEnd`).value),c=document.getElementById(`evtNote`).value.trim();if(!t||!i||!s){H(`Remplir Titre et Dates !`);return}if(s<i){H(`Date de fin invalide.`);return}let l=[];h||document.querySelectorAll(`.evt-guest-cb:checked`).forEach(e=>{l.push({id:e.value,name:e.getAttribute(`data-name`)})});let u=m?d.find(e=>e.id===m):null,f={id:m||`evt-`+Date.now(),type_entite:`event`,calendar_id:h?`global`:document.getElementById(`evtCalendarId`).value,title:t,start_date:i,end_date:s,cat_id:h?`urgence`:document.getElementById(`evtCategory`).value,note:c,author_id:u?u.author_id:n.id,author_name:u?u.author_name:o,shared_with:l},p=document.getElementById(`btnSaveEvent`),g=p.innerHTML;p.disabled=!0,p.textContent=`Sauvegarde...`;let{error:_}=await a(()=>e.from(`evenements`).upsert(f));if(p.disabled=!1,p.innerHTML=g,_){let e=(_.message||``).toLowerCase(),t;t=e.includes(`lock broken`)||_.name===`AbortError`?`❌ Une autre opération est en cours. Attends 2 secondes et réessaie.`:e.includes(`failed to fetch`)||e.includes(`network`)?`❌ Pas de connexion internet.`:e.includes(`row-level security`)||_.code===`42501`?`❌ Tu n'as pas la permission de créer cet événement.`:`❌ Erreur de sauvegarde : `+_.message,H(t);return}W(`addModal`),await T()}function z(e,r){g=r;let i=r?v.find(t=>t.id===e):d.find(t=>t.id===e);if(!i)return;p=e;let a=!r&&(i.author_id===n.id||i.calendar_id===`global`&&t(`manage_calendar`)||i.calendar_id?.startsWith(`cal-`));document.getElementById(`btnEditEvent`).style.display=a?`flex`:`none`,document.getElementById(`btnDeleteEvent`).style.display=a?`flex`:`none`,document.getElementById(`viewAuthorBadge`).textContent=r?`Système`:i.author_name?`Créé par `+i.author_name:``,document.getElementById(`viewAuthorBadge`).style.background=r?`#555`:`var(--btn-blue)`;let o=b.find(e=>e.id===(i.type||i.cat_id))||{color:`#ccc`,name:`Inconnu`};document.getElementById(`viewTitle`).textContent=i.t||i.title,document.getElementById(`viewCat`).innerHTML=`<div style="width:12px;height:12px;background:${o.color};border-radius:50%"></div> ${o.name}`,document.getElementById(`viewDates`).textContent=i.d?`Le ${M(i.d)}`:`Du ${M(i.start_date||i.start)} au ${M(i.end_date||i.end)}`;let s=document.getElementById(`viewGuestsContainer`);i.shared_with?.length>0?(document.getElementById(`viewGuests`).textContent=i.shared_with.map(e=>e.name).join(`, `),s.style.display=`block`):s.style.display=`none`;let c=document.getElementById(`viewNoteContainer`);i.note?.trim()?(document.getElementById(`viewNote`).textContent=i.note,c.style.display=`block`):c.style.display=`none`,document.getElementById(`viewModal`).classList.add(`open`)}function B(){let e=d.find(e=>e.id===p);W(`viewModal`),L(``,e.cat_id===`urgence`,e)}function V(){!p||g||U(`Supprimer cet événement ?`,async()=>{let{error:t}=await a(()=>e.from(`evenements`).delete().eq(`id`,p));if(t){H(`❌ Erreur de suppression : `+t.message);return}W(`viewModal`),await T()})}function H(e){document.getElementById(`alertMessage`).textContent=e,document.getElementById(`alertModal`).classList.add(`open`)}function U(e,t){document.getElementById(`confirmMessage`).textContent=e,y=t,document.getElementById(`confirmModal`).classList.add(`open`)}function W(e){document.getElementById(e)?.classList.remove(`open`)}function G(e){let t=e.value.replace(/\D/g,``);t.length>=3&&t.length<=4?t=t.slice(0,2)+`/`+t.slice(2):t.length>=5&&(t=t.slice(0,2)+`/`+t.slice(2,4)+`/`+t.slice(4,8)),e.value=t}export{S as render};