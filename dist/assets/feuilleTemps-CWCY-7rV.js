import{t as e}from"./supabase-BHP_DPH_.js";import{i as t,n,r,t as i}from"./auth-BoJf8KxA.js";import{t as a}from"./withRetry-ilQ6RSHM.js";import{a as o,c as s,i as c,n as l,o as u,r as d,s as f,t as p}from"./zoom-CFjBQPv6.js";var m=`Employé`,h=`mine`,g=[],_=null,v=null,y=0,b=25,x=!1,S=null,C=null,w=null;function T(){return t(`view_all_timesheets`)||t(`approve_timesheets`)}async function E(e){return m=i?.prenom_nom||`Employé`,e.innerHTML=`
    <style>
        /* --blue-bg défini dans styles.css : #d1e9ff */
        .fdt-main { font-family: 'Segoe UI', Arial, sans-serif; background: var(--bg-dark); color: var(--text-main); height: 100%; display: flex; flex-direction: column; overflow: hidden; }
        .badge-status { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; display: inline-block; color: white; }
        .b-brouillon { background: #444; } .b-envoye { background: #3498db; } .b-attente { background: #fcca46; color: black; } .b-paye { background: #28a745; } .b-renvoye { background: #ff4d4d; }
        #view-dashboard { padding: 30px; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .dash-header { display: flex; justify-content: space-between; align-items: center; }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .tabs-container { display: flex; gap: 10px; margin-bottom: 5px; }
        .btn-tab { background: #1a1b23; color: #aaa; border: 1px solid #444; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
        .btn-tab svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-tab.active { background: var(--btn-blue); color: white; border-color: var(--btn-blue); }
        .toolbar { display: flex; gap: 15px; align-items: center; background: var(--bg-panel); padding: 15px; border-radius: 12px; }
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input { width: 100%; background: #1e1f26; border: 1px solid #444; color: white; padding: 12px 15px 12px 40px; border-radius: 8px; font-size: 16px; outline: none; }
        .search-icon { position: absolute; left: 12px; color: #888; pointer-events: none; display: flex; align-items: center; }
        .search-icon svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .invoice-list { display: flex; flex-direction: column; gap: 10px; padding-bottom: 30px; }
        .invoice-item { background: var(--bg-panel); padding: 12px 20px; border-radius: 10px; display: grid; grid-template-columns: 240px 1fr 130px 100px 44px; align-items: center; gap: 15px; cursor: pointer; border: 1px solid transparent; border-left: 4px solid transparent; transition: 0.2s; }
        .invoice-item:hover { transform: translateX(5px); background: #343542; border-left-color: var(--accent); background-color: #30313c; border-color: #555;}
        .inv-id { font-weight: bold; color: var(--accent); font-size: 14px; white-space: nowrap; }
        .inv-client { font-weight: bold; font-size: 16px; color: white; display: flex; align-items: center; gap: 6px; }
        .inv-client svg { width: 16px; height: 16px; stroke: #aaa; fill: none; stroke-width: 2; }
        .inv-hours { font-weight: bold; font-size: 18px; color: var(--accent); text-align: center; }
        .inv-status { display: flex; align-items: center; }
        .inv-actions { display: flex; justify-content: flex-end; }
        .btn-icon { background: #444; border: none; width: 36px; height: 36px; border-radius: 8px; display: flex; justify-content: center; align-items: center; cursor: pointer; color: white; }
        .btn-delete { background: rgba(255,77,77,0.1); color: var(--btn-red); border: 1px solid transparent; }
        .btn-delete:hover { background: var(--btn-red); color: white; }
        #view-editor { display: none; flex-direction: column; height: 100%; }
        #note-refus-box { display: none; background: rgba(255,77,77,0.1); border: 1px solid var(--btn-red); border-radius: 8px; padding: 12px 16px; margin: 10px 20px 0; color: var(--btn-red); }
        .top-bar { height: auto; min-height: 80px; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 10px 20px; background: rgba(30,31,38,0.95); border-bottom: 1px solid #333; z-index: 101; flex-wrap: wrap; }
        .action-btn { background: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; white-space: nowrap; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3);}
        .action-btn:hover { background: var(--accent-hover); transform: translateY(-1px); background-color: var(--accent-hover);}
        .action-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-back { background: #6c757d !important; color: white !important; }
        .btn-save { background: var(--btn-green) !important; color: white !important; }
        .btn-send { background: var(--btn-blue) !important; color: white !important; }
        .btn-unlock { background: var(--btn-orange) !important; color: white !important; }
        @media (max-width: 1024px) {
            .top-bar { padding: 10px 85px 10px 10px; gap: 10px; height: 65px; overflow-x: auto; justify-content: flex-start; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; }
            .top-bar::-webkit-scrollbar { display: none; }
            .top-bar .action-btn { flex-shrink: 0; width: auto; margin-bottom: 0; font-size: 11px; padding: 8px 15px; }
        }
        .scroll-area { flex: 1; overflow: auto; padding: 15px 0; display: flex; flex-direction: column; align-items: center; touch-action: auto; }
        #zoom-wrapper { display: block; width: 8.5in; transform-origin: top center; transition: transform 0.1s ease-out; padding-bottom: 50px; }
        .zoom-controls { position: fixed; bottom: 20px; right: 20px; background: rgba(30,31,38,0.95); padding: 5px 15px; border-radius: 50px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); z-index: 2000; border: 1px solid #555; }
        .zoom-controls button { background: var(--accent); border: none; width: 32px; height: 32px; border-radius: 50%; font-weight: bold; font-size: 18px; cursor: pointer; display: flex; justify-content: center; align-items: center; color: #1e1f26; }
        .zoom-controls span { color: white; font-size: 12px; font-weight: bold; min-width: 45px; text-align: center; }
        .page { width: 8.5in; height: 11in; background: white; color: black; padding: 0.5in; box-shadow: 0 0 20px rgba(0,0,0,0.5); box-sizing: border-box; display: flex; flex-direction: column; position: relative; margin: 0 auto 20px; flex-shrink: 0; }
        .page input { outline: none; font-family: inherit; }
        .page input:focus { border-bottom: 2px solid #000 !important; background: transparent !important; }
        .header-main { width: 100%; margin-bottom: 15px; }
        .header-main img { max-width: 100%; height: auto; display: inline-block; }
        .ts-title { text-align: center; font-size: 22px; font-weight: bold; text-decoration: underline; margin-bottom: 30px; text-transform: uppercase; color: black; }
        .ts-emp-info { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; font-size: 13px; font-weight: bold; color: black; }
        .ts-row { display: flex; align-items: center; gap: 10px; width: 100%; }
        .ts-field { background: var(--blue-bg); border: none; border-bottom: 1px solid #000; height: 26px; padding: 0 5px; font-weight: bold; flex: 1; color: black; font-size: 14px; }
        .temps-table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid black; }
        .temps-table th { border: 1px solid black; padding: 8px; font-size: 12px; text-align: center; background: #fff; color: black; font-weight: bold; }
        .temps-table td { border: 1px solid black; padding: 0; height: 28px; background: var(--blue-bg); }
        .cell-input { width: 100%; height: 100%; border: none !important; background: transparent; text-align: center; font-size: 13px; color: black; font-weight: bold; }
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.75); display: none; z-index: 4000; justify-content: center; align-items: center; }
        .custom-modal-overlay.open { display: flex; }
        .custom-modal-card { background: var(--bg-panel); width: 350px; padding: 25px; border-radius: 12px; border: 1px solid #555; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5);}
        .custom-modal-title { font-size: 20px; color: var(--btn-red); margin-bottom: 15px; font-weight: bold; }
        .custom-modal-msg { color: var(--text-main); margin-bottom: 25px; font-size: 15px; line-height: 1.4; }
        .custom-modal-actions { display: flex; justify-content: center; gap: 10px; }
        .btn-modal-cancel { background: #444; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
        .btn-modal-confirm { background: var(--btn-red); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
        .btn-modal-ok { background: var(--accent); color: black; border: none; padding: 10px 30px; border-radius: 6px; cursor: pointer; font-weight: bold; }
        @media (max-width: 768px) {
            #view-dashboard { padding: 15px; }
            .dash-header { flex-direction: column; align-items: flex-start; gap: 15px; width: 100%; }
            .dash-title { padding-right: 80px; width: 100%; }
            .dash-header .action-btn { width: 100%; justify-content: center; font-size: 14px; }
            .tabs-container { flex-direction: column; width: 100%; }
            .btn-tab { width: 100%; justify-content: center; }
            .invoice-item { grid-template-columns: 1fr auto; grid-template-areas: "id id" "client client" "status hours"; gap: 4px 12px; padding: 16px; border-radius: 12px; border: 1px solid #3a3b46; border-left: 1px solid #3a3b46; margin-bottom: 12px; position: relative; }
            .inv-id { grid-area: id; } .inv-client { grid-area: client; } .inv-status { grid-area: status; } .inv-hours { grid-area: hours; text-align: right; }
            .inv-actions { position: absolute; top: 16px; right: 16px; }
            .zoom-controls { display: none !important; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    </style>

    <div class="fdt-main">
        <div id="view-dashboard">
            <div class="dash-header">
                <div class="dash-title"><h1>Feuilles de Temps</h1><p>Création et suivi de vos heures</p></div>
                <button class="action-btn" id="btnNewSheet">
                    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Nouvelle Feuille
                </button>
            </div>

            <div class="tabs-container" id="timesheet-tabs" style="display:none">
                <button id="tab-mine" class="btn-tab active">
                    <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Mes Feuilles
                </button>
                <button id="tab-all" class="btn-tab">
                    <svg viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                    Boîte de réception
                </button>
                <button id="tab-archives" class="btn-tab">
                    <svg viewBox="0 0 24 24"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                    Archives
                </button>
            </div>

            <div class="toolbar">
                <div class="search-box">
                    <span class="search-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                    <input type="text" id="searchInput" placeholder="Rechercher (Nom, Date...)">
                </div>
            </div>
            <div id="ts-compteur" style="color:#888;font-size:12px;padding:5px 10px"></div>
            <div class="invoice-list" id="timesheetListContainer"></div>
        </div>

        <div id="note-refus-box">
            <strong>↩️ Renvoyé pour correction :</strong>
            <div id="note-refus-text" style="color:#ffaaaa;margin-top:5px;font-size:14px"></div>
        </div>

        <div id="view-editor">
            <div class="top-bar">
                <button class="action-btn btn-back" id="btnBack">
                    <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    Retour
                </button>
                <button class="action-btn" id="btnApprove" style="display:none;background:var(--btn-green);color:white">
                    <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Approuver
                </button>
                <button class="action-btn" id="btnReturn" style="display:none;background:var(--btn-red);color:white">
                    <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    Renvoyer
                </button>
                <button class="action-btn btn-save" id="btnSave">
                    <svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Sauvegarder
                </button>
                <button class="action-btn btn-send" id="btnSend">
                    <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Envoyer au bureau
                </button>
                <button class="action-btn btn-unlock" id="btnUnlock" style="display:none">
                    <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                    Débloquer
                </button>
                <div style="flex:1"></div>
                <button class="action-btn" id="btnPdf">
                    <svg viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    PDF / Imprimer
                </button>
                <button class="action-btn" id="btnAddPage">
                    <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                    Page
                </button>
                <button class="action-btn" id="btnDupPage">
                    <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Dupliquer
                </button>
                <button class="action-btn" id="btnDelPage">
                    <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                    Page
                </button>
                <button class="action-btn" id="btnClear">
                    <svg viewBox="0 0 24 24"><path d="M20 20H7l-3-3a2.828 2.828 0 0 1 0-4l10-10a2.828 2.828 0 0 1 4 0l3 3a2.828 2.828 0 0 1 0 4l-7 7"/><line x1="10" y1="10" x2="17" y2="17"/></svg>
                    Effacer
                </button>
            </div>
            <div class="scroll-area" id="scrollArea"><div id="zoom-wrapper"></div></div>
            <div class="zoom-controls">
                <button id="btnZoomOut">−</button>
                <span id="zoom-level">100%</span>
                <button id="btnZoomIn">+</button>
                <button id="btnZoomReset" style="font-size:14px">↺</button>
            </div>
        </div>
    </div>

    <!-- Modal confirmation -->
    <div class="custom-modal-overlay" id="confirmModal">
        <div class="custom-modal-card">
            <div class="custom-modal-title" id="confirmTitle">Confirmation</div>
            <div class="custom-modal-msg" id="confirmMsg"></div>
            <div class="custom-modal-actions">
                <button class="btn-modal-cancel" id="btnConfirmNo">Non</button>
                <button class="btn-modal-confirm" id="btnConfirmYes">Oui</button>
            </div>
        </div>
    </div>

    <!-- Modal alerte -->
    <div class="custom-modal-overlay" id="alertModal">
        <div class="custom-modal-card">
            <div class="custom-modal-title" style="color:var(--accent)">Information</div>
            <div class="custom-modal-msg" id="alertMsg"></div>
            <div class="custom-modal-actions"><button class="btn-modal-ok" id="btnAlertOk">Compris</button></div>
        </div>
    </div>

    <!-- Modal refus -->
    <div class="custom-modal-overlay" id="refusModal">
        <div class="custom-modal-card" style="width:420px;text-align:left">
            <div class="custom-modal-title">↩️ Renvoyer pour correction</div>
            <p style="color:#aaa;font-size:14px;margin-bottom:15px">Expliquez à l'employé ce qui doit être corrigé :</p>
            <textarea id="refusNote" placeholder="Ex: Il manque les heures du mercredi 15..." style="width:100%;height:100px;background:#1e1f26;color:white;border:1px solid #555;padding:12px;border-radius:8px;font-family:sans-serif;font-size:14px;outline:none;resize:none;box-sizing:border-box"></textarea>
            <div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end">
                <button style="background:#444;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer" id="btnCloseRefus">Annuler</button>
                <button style="background:var(--btn-red);color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold" id="btnConfirmRefus">↩️ Renvoyer</button>
            </div>
        </div>
    </div>
    `,await D(e),O}async function D(e){let t=e.querySelector(`#view-dashboard`),n=e.querySelector(`#view-editor`),r=e.querySelector(`#zoom-wrapper`),i=e.querySelector(`#zoom-level`);T()?e.querySelector(`#timesheet-tabs`).style.display=`flex`:(e.querySelector(`#timesheet-tabs`).style.display=`flex`,e.querySelector(`#tab-all`).style.display=`none`),e.querySelector(`#tab-mine`).addEventListener(`click`,()=>A(`mine`,e)),e.querySelector(`#tab-all`).addEventListener(`click`,()=>A(`all`,e)),e.querySelector(`#tab-archives`).addEventListener(`click`,()=>A(`archives`,e)),e.querySelector(`#searchInput`).addEventListener(`keyup`,()=>M(e)),e.querySelector(`#btnNewSheet`).addEventListener(`click`,()=>N(t,n,r,i,e)),e.querySelector(`#btnBack`).addEventListener(`click`,()=>I(r,t,n,e)),e.querySelector(`#btnSave`).addEventListener(`click`,()=>z(!1,r,t,n,e)),e.querySelector(`#btnSend`).addEventListener(`click`,()=>{X(`Une fois envoyée, vous ne pourrez plus la modifier. L'envoyer pour la paie ?`,()=>z(!0,r,t,n,e),e,`Envoyer au bureau`)}),e.querySelector(`#btnApprove`).addEventListener(`click`,()=>B(t,n,e)),e.querySelector(`#btnReturn`).addEventListener(`click`,()=>{e.querySelector(`#refusNote`).value=``,e.querySelector(`#refusModal`).classList.add(`open`)}),e.querySelector(`#btnUnlock`).addEventListener(`click`,()=>R(r,e)),e.querySelector(`#btnPdf`).addEventListener(`click`,()=>H(r)),e.querySelector(`#btnAddPage`).addEventListener(`click`,()=>{let e=U();r.appendChild(e),W(e),C?.applyZoom(C?.current??1)}),e.querySelector(`#btnDupPage`).addEventListener(`click`,()=>G(r,i)),e.querySelector(`#btnDelPage`).addEventListener(`click`,()=>K(r,e)),e.querySelector(`#btnClear`).addEventListener(`click`,()=>{X(`Effacer tout le contenu ?`,()=>{r.querySelectorAll(`input`).forEach(e=>e.value=``)},e)}),C=p({container:r,scrollArea:e.querySelector(`#scrollArea`),zoomDisplay:i,docWidthPx:816}),C.attach(),e.querySelector(`#btnZoomOut`).addEventListener(`click`,()=>C.zoomOut()),e.querySelector(`#btnZoomIn`).addEventListener(`click`,()=>C.zoomIn()),e.querySelector(`#btnZoomReset`).addEventListener(`click`,()=>C.zoomReset()),w=()=>{n.style.display===`flex`&&C?.fitToScreen()},window.addEventListener(`resize`,w),e.querySelector(`#btnConfirmNo`).addEventListener(`click`,()=>Z(e)),e.querySelector(`#btnConfirmYes`).addEventListener(`click`,()=>{S&&S(),Z(e)}),e.querySelector(`#btnAlertOk`).addEventListener(`click`,()=>e.querySelector(`#alertModal`).classList.remove(`open`)),e.querySelector(`#btnCloseRefus`).addEventListener(`click`,()=>e.querySelector(`#refusModal`).classList.remove(`open`)),e.querySelector(`#btnConfirmRefus`).addEventListener(`click`,()=>V(t,n,e)),await k(!0,e)}function O(){J(),C&&=(C.destroy(),null),w&&=(window.removeEventListener(`resize`,w),null)}async function k(t=!0,i){t&&(y=0,g=[]);let a=y*b,s=a+b-1,c=e.from(`feuilles_de_temps`).select(`*`);h===`archives`?(c=c.eq(`is_archived`,!0),o(n)||(c=c.eq(`author_id`,r.id))):(c=c.eq(`is_archived`,!1),c=h===`mine`?c.eq(`author_id`,r.id):c.neq(`status`,`brouillon`));let{data:l}=await c.order(`created_at`,{ascending:!1}).range(a,s+1);if(l){x=l.length>b;let e=l.slice(0,b).map(e=>({id:e.id,employe:e.employe_nom,periode:e.periode,status:e.status,pagesData:e.pages_data||[],total_heures:e.total_heures||0,authorId:e.author_id,authorName:e.author_name,return_note:e.return_note,isArchived:e.is_archived===!0}));g=t?e:[...g,...e]}M(i)}function A(e,t){h=e,t.querySelectorAll(`.btn-tab`).forEach(e=>e.classList.remove(`active`)),t.querySelector(`#tab-${e}`)?.classList.add(`active`),k(!0,t)}function j(e,t){let i=t.querySelector(`#timesheetListContainer`);i.innerHTML=``;let a=T(),o=t.querySelector(`#ts-compteur`);if(o&&(o.textContent=`${g.length} feuille(s) chargée(s)${x?` — il y en a plus`:``}`),e.length===0){i.innerHTML=`<div style="color:#888;text-align:center;padding:20px;font-style:italic">Aucune feuille trouvée.</div>`;return}if(e.forEach(e=>{let o=``;e.isArchived?o=`<span class="badge-status" style="background:#555">Archivée</span>`:e.status===`brouillon`?o=`<span class="badge-status b-brouillon">Brouillon</span>`:e.status===`envoye`?o=`<span class="badge-status b-envoye">${a?`En attente`:`Envoyée`}</span>`:e.status===`approuve`?o=`<span class="badge-status b-paye">Approuvée</span>`:e.status===`renvoye`&&(o=`<span class="badge-status b-renvoye">Renvoyée</span>`);let s=`<div style="width:36px"></div>`;e.isArchived?c(n)&&(s=`<button class="btn-icon" style="background:rgba(40,167,69,0.15);color:#28a745" data-restore="${e.id}">↺</button>`):d(e,n,r.id).allowed&&(s=`<button class="btn-icon btn-delete" data-delete="${e.id}">
                <svg viewBox="0 0 24 24" width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>`);let l=document.createElement(`div`);l.className=`invoice-item`,l.innerHTML=`
            <div class="inv-id">${e.periode||`Période inconnue`}</div>
            <div class="inv-client"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${e.employe||e.authorName||`Employé`}</div>
            <div class="inv-hours">${e.total_heures} h</div>
            <div class="inv-status">${o}</div>
            <div class="inv-actions">${s}</div>
        `,l.addEventListener(`click`,n=>{n.target.closest(`[data-delete],[data-restore]`)||P(e.id,t)}),l.querySelector(`[data-delete]`)?.addEventListener(`click`,i=>{i.stopPropagation(),u({table:`feuilles_de_temps`,id:e.id,item:e,role:n,userId:r.id,userName:m,onSuccess:()=>k(!0,t),showConfirm:(e,n)=>X(e,n,t),showAlert:e=>Q(e,t)})}),l.querySelector(`[data-restore]`)?.addEventListener(`click`,r=>{r.stopPropagation(),f({table:`feuilles_de_temps`,id:e.id,role:n,onSuccess:()=>k(!0,t),showConfirm:(e,n)=>X(e,n,t),showAlert:e=>Q(e,t)})}),i.appendChild(l)}),x){let e=document.createElement(`button`);e.textContent=`Charger ${b} feuilles de plus...`,e.style.cssText=`width:100%;padding:14px;margin-top:10px;background:#2b2c36;color:#aaa;border:1px dashed #444;border-radius:10px;cursor:pointer;font-size:14px;font-weight:bold`,e.addEventListener(`click`,async()=>{y++,await k(!1,t)}),i.appendChild(e)}}function M(e){let t=e.querySelector(`#searchInput`)?.value.toLowerCase()||``,n=T();j((h===`archives`?g:!n||h===`mine`?g.filter(e=>e.authorId===r.id||!e.authorId):g.filter(e=>e.status!==`brouillon`)).filter(e=>(e.employe||e.authorName||``).toLowerCase().includes(t)||(e.periode||``).toLowerCase().includes(t)),e)}function N(e,t,n,r,i){try{localStorage.removeItem(`fdussault_draft_feuille_de_temps_new`)}catch{}_=null,e.style.display=`none`,t.style.display=`flex`,n.innerHTML=``;let a=U();n.appendChild(a),W(a),L(null,n,i),C?.fitToScreen(),q(n)}function P(e,t){let n=g.find(t=>t.id===e);if(!n)return;_=e;let r=t.querySelector(`#view-dashboard`),i=t.querySelector(`#view-editor`),a=t.querySelector(`#zoom-wrapper`);if(t.querySelector(`#zoom-level`),r.style.display=`none`,i.style.display=`flex`,a.innerHTML=``,n.pagesData?.length)n.pagesData.forEach(e=>{let t=U();a.appendChild(t),W(t);let n=t.querySelectorAll(`input`);e.forEach((e,t)=>{n[t]&&(n[t].value=e)})});else{let e=U();a.appendChild(e),W(e)}L(n,a,t),C?.fitToScreen(),!n.isArchived&&(!n.status||n.status===`brouillon`)&&q(a)}function F(e,t,n){J(),e.style.display=`flex`,t.style.display=`none`,k(!0,n)}function I(e,t,n,r){v?.hasDraft?.()?X(`Des modifications non sauvegardées seront perdues. Quitter quand même ?`,()=>F(t,n,r),r,`Modifications non sauvegardées`):F(t,n,r)}function L(e,n,i){let a=t(`approve_timesheets`),o=e?.status||`brouillon`,s=e?e.authorId===r.id||!e.authorId:!0,c=e?.isArchived===!0,l=s&&(o===`brouillon`||o===`renvoye`||o===`attente`);c&&(l=!1);let u=(e,t)=>{let n=i.querySelector(e);n&&(n.style.display=t?`flex`:`none`)};u(`#btnSave`,l),u(`#btnSend`,l),u(`#btnAddPage`,l),u(`#btnDupPage`,l),u(`#btnDelPage`,l),u(`#btnClear`,l),u(`#btnUnlock`,a&&o!==`brouillon`&&o!==`renvoye`&&o!==`attente`&&!c),u(`#btnApprove`,!c&&a&&(o===`envoye`||o===`attente`)),u(`#btnReturn`,!c&&a&&(o===`envoye`||o===`attente`));let d=i.querySelector(`#note-refus-box`),f=i.querySelector(`#note-refus-text`);d&&e?.return_note?(d.style.display=`block`,f&&(f.textContent=e.return_note)):d&&(d.style.display=`none`),n.querySelectorAll(`input`).forEach(e=>{l?(e.removeAttribute(`readonly`),e.style.pointerEvents=`auto`):(e.setAttribute(`readonly`,!0),e.style.pointerEvents=`none`)})}function R(e,t){e.querySelectorAll(`input`).forEach(e=>{e.removeAttribute(`readonly`),e.style.pointerEvents=`auto`}),[`#btnSave`,`#btnAddPage`,`#btnDupPage`,`#btnDelPage`,`#btnClear`].forEach(e=>{let n=t.querySelector(e);n&&(n.style.display=`flex`)}),t.querySelector(`#btnUnlock`).style.display=`none`,Q(`Feuille de temps débloquée. N'oubliez pas de sauvegarder.`,t)}async function z(t,n,i,o,s){let c=n.querySelector(`.page`);if(!c)return;let l=s.querySelector(`#btnSave`),u=l?.innerHTML;l&&(l.disabled=!0,l.textContent=`Sauvegarde...`),n.querySelectorAll(`.page`).forEach(e=>{e.querySelectorAll(`table.temps-table tbody`).forEach(e=>{let t=Array.from(e.querySelectorAll(`tr`)),n=t.map(e=>{let t=Array.from(e.querySelectorAll(`input`)).map(e=>e.value);return{values:t,isEmpty:t.every(e=>!e?.trim())}}),r=[...n.filter(e=>!e.isEmpty),...n.filter(e=>e.isEmpty)];t.forEach((e,t)=>{e.querySelectorAll(`input`).forEach((e,n)=>{e.value=r[t].values[n]||``})})})});let d=c.querySelector(`.input-nom`),f=c.querySelector(`.input-semaine-debut`),p=c.querySelector(`.input-semaine-fin`),h=d?.value.trim()||m;d&&!d.value.trim()&&(d.value=h);let v=f?.value&&p?.value?`Du ${f.value} au ${p.value}`:`Semaine en cours`,y=[];n.querySelectorAll(`.page`).forEach(e=>{y.push(Array.from(e.querySelectorAll(`input`)).map(e=>e.value))});let b=0;n.querySelectorAll(`.heure-input`).forEach(e=>{let t=parseFloat(e.value);isNaN(t)||(b+=t)});let x=_||`TS-`+Date.now(),S=g.find(e=>e.id===_||e.id===x),C=S?.status||`brouillon`;t&&(C=`envoye`);let w={id:x,employe_nom:h,periode:v,pages_data:y,total_heures:b,status:C,author_id:S?S.authorId:r.id,author_name:S?S.authorName:m},{error:T}=await a(()=>e.from(`feuilles_de_temps`).upsert(w));if(l&&(l.disabled=!1,l.innerHTML=u),T){Q((T.message||``).toLowerCase().includes(`lock broken`)?`❌ Réessayez dans 2 secondes.`:`❌ Erreur : `+T.message,s);return}_=x,Y();try{localStorage.removeItem(`fdussault_draft_feuille_de_temps_new`)}catch{}await k(!0,s),t?(Q(`Feuille de temps envoyée au bureau avec succès !`,s),F(i,o,s)):(Q(`Feuille de temps sauvegardée !`,s),L(w,n,s))}async function B(t,n,r){_&&X(`Approuver cette feuille de temps ?`,async()=>{let{error:i}=await e.from(`feuilles_de_temps`).update({status:`approuve`,return_note:null}).eq(`id`,_);if(i){Q(`❌ Erreur : `+i.message,r);return}await k(!0,r),F(t,n,r),Q(`Feuille de temps approuvée !`,r)},r)}async function V(t,n,r){let i=r.querySelector(`#refusNote`)?.value.trim();if(!i){r.querySelector(`#refusNote`)&&(r.querySelector(`#refusNote`).style.borderColor=`var(--btn-red)`);return}if(!_)return;let{error:a}=await e.from(`feuilles_de_temps`).update({status:`renvoye`,return_note:i}).eq(`id`,_);if(a){Q(`❌ Erreur : `+a.message,r);return}r.querySelector(`#refusModal`).classList.remove(`open`),await k(!0,r),F(t,n,r),Q(`↩️ Feuille renvoyée à l'employé pour correction.`,r)}function H(e){let t=e.querySelector(`.page`);if(!t)return;let n=t.querySelector(`.input-nom`),r=t.querySelector(`.input-semaine-debut`),i=n?.value.trim()||m,a=r?.value.trim()||``,o=a.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);o&&(a=`${o[3]}-${o[2].padStart(2,`0`)}-${o[1].padStart(2,`0`)}`),a||=new Date().toISOString().split(`T`)[0],l({container:e,docType:`feuille`,docNumber:_||null,clientName:i,date:a})}function U(){let e=document.createElement(`div`);e.className=`page`;let t=``;for(let e=0;e<15;e++)t+=`<tr>
            <td><input type="text" class="cell-input date-input" placeholder="JJ/MM/AAAA"></td>
            <td><input type="text" class="cell-input"></td>
            <td><input type="text" class="cell-input" style="text-align:left;padding-left:10px"></td>
            <td><input type="number" step="0.5" class="cell-input heure-input"></td>
        </tr>`;return e.innerHTML=`
        <div class="header-main"><img src="/assets/logo_dussault.png" alt="F. Dussault" onerror="this.style.display='none'"></div>
        <div class="ts-title">FEUILLE DE TEMPS</div>
        <div class="ts-emp-info">
            <div class="ts-row">
                <span style="width:130px">Nom de l'employé:</span>
                <input type="text" class="input-nom ts-field" value="${m}">
            </div>
            <div class="ts-row" style="margin-top:5px">
                <span style="width:90px">Semaine du:</span>
                <input type="text" class="input-semaine-debut ts-field date-input" placeholder="JJ/MM/AAAA">
                <span style="margin:0 10px">au</span>
                <input type="text" class="input-semaine-fin ts-field date-input" placeholder="JJ/MM/AAAA">
            </div>
        </div>
        <table class="temps-table">
            <thead><tr><th style="width:15%">Date</th><th style="width:15%"># Bon</th><th style="width:55%">Adresse</th><th style="width:15%">Heures</th></tr></thead>
            <tbody>${t}</tbody>
        </table>
    `,e}function W(e){function t(e){let t=e.target.value.replace(/\D/g,``).substring(0,8);t.length>4?t=t.substring(0,2)+`/`+t.substring(2,4)+`/`+t.substring(4,8):t.length>2&&(t=t.substring(0,2)+`/`+t.substring(2)),e.target.value=t}e.querySelectorAll(`.date-input`).forEach(e=>e.addEventListener(`input`,t));let n=e.querySelector(`.input-semaine-debut`),r=e.querySelector(`.input-semaine-fin`),i=e.querySelector(`.temps-table tbody tr:first-child .date-input`);i&&n&&r&&i.addEventListener(`input`,function(){if(this.value.length!==10)return;let e=this.value.split(`/`);if(e.length!==3)return;let t=new Date(parseInt(e[2]),parseInt(e[1])-1,parseInt(e[0]));if(isNaN(t.getTime()))return;let i=new Date(t);i.setDate(t.getDate()-t.getDay());let a=new Date(i);a.setDate(i.getDate()+6);let o=e=>`${String(e.getDate()).padStart(2,`0`)}/${String(e.getMonth()+1).padStart(2,`0`)}/${e.getFullYear()}`;n.value=o(i),r.value=o(a)});let a=Array.from(e.querySelectorAll(`input`));a.forEach((e,t)=>{e.addEventListener(`keydown`,n=>{if(n.key===`Enter`){n.preventDefault();let r=e.closest(`td`);if(r){let e=r.closest(`tr`),t=Array.from(e.children).indexOf(r),n=e.nextElementSibling;if(n){let e=n.children[t]?.querySelector(`input`);if(e){e.focus();return}}}t+1<a.length&&a[t+1].focus()}else n.key===`Backspace`&&e.value===``&&t-1>=0&&a[t-1].focus()}),e.addEventListener(`paste`,t=>{t.preventDefault();let n=(t.clipboardData||window.clipboardData).getData(`text`),r=n.split(/\r\n|\n|\r/),i=e.closest(`td`);if(!i){e.value=n.trim();return}let a=i.closest(`tr`),o=a.closest(`table`),s=Array.from(o.querySelectorAll(`tbody tr`)).indexOf(a),c=Array.from(a.children).indexOf(i),l=o.querySelectorAll(`tbody tr`);r.forEach((e,t)=>{s+t>=l.length||!e.trim()||e.split(`	`).forEach((e,n)=>{let r=l[s+t].children[c+n]?.querySelector(`input`);r&&(r.value=e.trim(),r.classList.contains(`date-input`)&&r.dispatchEvent(new Event(`input`)))})})})})}function G(e,t){let n=e.querySelectorAll(`.page`);if(!n.length)return;let r=n[n.length-1],i=U();e.appendChild(i),W(i);let a=r.querySelectorAll(`input`),o=i.querySelectorAll(`input`);a.forEach((e,t)=>{o[t]&&(o[t].value=e.value)}),C?.applyZoom(C?.current??1)}function K(e,t){e.children.length>1?e.removeChild(e.lastElementChild):Q(`Impossible de supprimer la dernière page.`,t)}function q(e){if(v)try{v.stop()}catch{}v=s({module:`feuille_de_temps`,containerSelector:`#zoom-wrapper`,draftIdGetter:()=>_}),v.start(),v.hasDraft()&&v.restore()}function J(){if(v){try{v.stop()}catch{}v=null}}function Y(){if(v)try{v.clear()}catch{}}function X(e,t,n,r=`Confirmation`){n.querySelector(`#confirmTitle`).textContent=r,n.querySelector(`#confirmMsg`).innerHTML=e,S=t,n.querySelector(`#confirmModal`).classList.add(`open`)}function Z(e){e.querySelector(`#confirmModal`).classList.remove(`open`),S=null}function Q(e,t){t.querySelector(`#alertMsg`).innerHTML=e,t.querySelector(`#alertModal`).classList.add(`open`)}export{E as render};