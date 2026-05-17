import{t as e}from"./supabase-BHP_DPH_.js";import{i as t,n,r,t as i}from"./auth-BoJf8KxA.js";import{t as a}from"./withRetry-ilQ6RSHM.js";import{a as o,c as s,i as c,n as l,o as u,r as d,s as f,t as p}from"./zoom-CR75u4yN.js";import{n as m,r as h,t as g}from"./signature-B2p-Whyr.js";var _=`Employé`,v=`mine`,y=[],b=null,x=null,S=0,C=25,w=!1,T=null,E=0,D=0,O=null,k=null;async function A(e){return _=i?.prenom_nom||`Employé`,e.innerHTML=`
    <style>
        /* --blue-bg défini dans styles.css : #d1e9ff */
        .soum-main { font-family: 'Segoe UI', Arial, sans-serif; background: var(--bg-dark); color: var(--text-main); height: 100%; display: flex; flex-direction: column; overflow: hidden; }
        #view-dashboard { padding: 30px; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .dash-header { display: flex; justify-content: space-between; align-items: center; }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .toolbar { display: flex; gap: 15px; align-items: center; background: var(--bg-panel); padding: 15px; border-radius: 12px; }
        .discrete-stats { color: #aaa; font-size: 13px; font-style: italic; margin: 1px 0; padding-left: 10px; }
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input { width: 100%; background: #1e1f26; border: none; color: white; padding: 12px 15px 12px 40px; border-radius: 8px; font-size: 16px; outline: none; -webkit-tap-highlight-color: transparent; }
        .search-box input:focus { border: none; outline: none; box-shadow: none; background: #1e1f26; }
        .search-icon { position: absolute; left: 12px; color: #888; pointer-events: none; display: flex; align-items: center; }
        .search-icon svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .tabs-container { display: flex; gap: 10px; margin-bottom: 5px; }
        .btn-tab { background: #1a1b23; color: #aaa; border: 1px solid #444; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
        .btn-tab svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-tab.active { background: var(--btn-blue); color: white; border-color: var(--btn-blue); }
        .quote-list { display: flex; flex-direction: column; gap: 10px; padding-bottom: 30px; }
        .quote-item { background: var(--bg-panel); padding: 12px 20px; border-radius: 10px; display: grid; grid-template-columns: 120px 1fr 140px 130px 100px 44px; align-items: center; gap: 15px; cursor: pointer; border: 1px solid transparent; border-left: 4px solid transparent; transition: 0.2s; }
        .quote-item:hover { transform: translateX(5px); background: #343542; border-left-color: var(--accent); background-color: #30313c; border-color: #555;}
        .inv-id { font-weight: bold; color: var(--accent); font-size: 15px; }
        .inv-client { font-weight: bold; font-size: 16px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .inv-author { font-size: 14px; color: #888; font-style: italic; }
        .inv-date { color: #aaa; font-size: 14px; text-align: right; }
        .inv-status span { font-size: 12px; padding: 4px 10px; border-radius: 6px; font-weight: bold; }
        .status-attente { background: rgba(255,193,7,0.2); color: #ffc107; border: 1px solid rgba(255,193,7,0.5); }
        .status-convertie { background: rgba(40,167,69,0.2); color: var(--btn-green); border: 1px solid rgba(40,167,69,0.5); }
        .status-brouillon { background: #444; color: white; border: 1px solid #555; }
        .inv-actions { display: flex; justify-content: flex-end; }
        .btn-icon { background: #444; border: none; width: 36px; height: 36px; border-radius: 8px; display: flex; justify-content: center; align-items: center; cursor: pointer; color: white; flex-shrink: 0; transition: 0.2s;}
        .btn-delete { background: rgba(255,77,77,0.1); color: var(--btn-red); border: 1px solid transparent; }
        .btn-delete:hover { background: var(--btn-red); color: white; }
        #view-editor { display: none; flex-direction: column; height: 100%; }
        .top-bar { height: auto; min-height: 80px; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 10px 20px; background: rgba(30,31,38,0.95); border-bottom: 1px solid #333; z-index: 101; flex-wrap: wrap; }
        .action-btn { background: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; white-space: nowrap; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3);}
        .action-btn:hover { background: var(--accent-hover); transform: translateY(-1px); background-color: var(--accent-hover);}
        .action-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-back { background: #6c757d !important; color: white !important; }
        .btn-save { background: var(--btn-green) !important; color: white !important; }
        .btn-send { background: var(--btn-blue) !important; color: white !important; }
        .btn-convert { background: var(--btn-blue) !important; color: white !important; }
        .btn-unlock { background: var(--btn-orange) !important; color: white !important; }
        @media (max-width: 1024px) {
            .top-bar { padding: 10px 85px 10px 10px; gap: 10px; height: 65px; overflow-x: auto; justify-content: flex-start; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; }
            .top-bar::-webkit-scrollbar { display: none; }
            .top-bar .action-btn { flex-shrink: 0; width: auto; margin-bottom: 0; font-size: 11px; padding: 8px 15px; }
        }
        .scroll-area { flex: 1; overflow: auto; padding: 15px 0; display: block; touch-action: none; }
        .page { width: 8.5in; height: 11in; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.5); box-sizing: border-box; display: flex; flex-direction: column; position: relative; margin: 0 auto 20px; color: black; padding: 0.25in; flex-shrink: 0; }
        input { outline: none; border-radius: 0; }
        input:focus { background-color: transparent !important; border-bottom: 2px solid #000 !important; }
        #quote-container { display: block; width: 8.5in; transform-origin: 0 0; padding-bottom: 50px; }
        .top-section { width: 100%; }
        .header-main { width: 100%; margin-top: -15px; margin-bottom: 0; text-align: center; }
        .header-main img { width: 100%; height: auto; display: block; }
        .header-main h2 { margin: 2px 0; font-family: Arial, sans-serif; letter-spacing: 6px; font-weight: 900; color: #333; font-size: 20px; text-transform: uppercase; }
        .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 2px; }
        .info-column { display: flex; flex-direction: column; gap: 1px; }
        .field { display: flex; align-items: flex-end; font-size: 12px; font-weight: bold; min-height: 22px; }
        .field label { white-space: nowrap; margin-right: 5px; }
        .field input { background: var(--blue-bg) !important; border: none; border-bottom: 1px solid black; flex-grow: 1; height: 18px; padding: 0 5px; }
        .banner-cmmtq { width: 100%; margin: 4px 0; text-align: center; }
        .banner-cmmtq img { width: 100%; height: auto; display: block; margin: 0 auto; }
        .main-table { width: 100%; border-collapse: collapse; border: none; margin-bottom: 5px; }
        .main-table thead { border-top: 4px double black; }
        .main-table th { border: 1px solid black; font-size: 9px; background: #eee; padding: 2px; }
        .main-table td { border: 1px solid black; height: 23px; background: var(--blue-bg); padding: 0; }
        .main-table tbody tr:last-child td { border-bottom: 4px double black; }
        .main-table input { width: 100%; height: 100%; background: transparent; border: none; padding: 0 5px; box-sizing: border-box; font-size: 12px; color: black; font-weight: bold; }
        .desc-textarea { width: 100%; min-height: 18px; background: transparent; border: none; padding: 0 5px; box-sizing: border-box; font-size: 12px; color: black; font-weight: bold; resize: none; overflow: hidden; line-height: 1.4; font-family: inherit; display: block; }
        .bottom-section { margin-top: auto; width: 100%; }
        .time-wrapper { width: 100%; border: 1px solid black; border-collapse: collapse; table-layout: fixed; }
        .time-label-col { width: 110px; border-right: 1px solid black; padding: 5px; vertical-align: top; }
        .time-label-col span { font-size: 8px; font-weight: bold; }
        .time-label-col h2 { font-size: 18px; margin: 5px 0 0; font-weight: 900; }
        .inner-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .row-headers td { border-right: 1px solid black; border-bottom: 1px solid black; height: 30px; font-size: 8px; font-weight: bold; text-align: center; vertical-align: top; padding-top: 2px; }
        .row-sublabels td { font-size: 9px; font-weight: bold; text-align: center; padding: 2px 0; }
        .row-inputs td { padding: 2px 5px; vertical-align: middle; height: 26px; }
        .input-box { background: var(--blue-bg); border-bottom: 1px solid black; display: flex; align-items: center; padding: 0 3px; height: 18px; }
        .input-box input { background: transparent; border: none; width: 100%; height: 100%; text-align: center; font-size: 10px; font-weight: bold; color: black; }
        .flex-group { display: flex; align-items: center; gap: 4px; font-size: 9px; font-weight: bold; }
        .last-col { border-right: none !important; }
        .footer-grid { display: grid; grid-template-columns: 1fr 1fr 150px; align-items: end; margin-top: 5px; gap: 10px; }
        .sig-box { width: 100%; text-align: center; }
        .display-sig { border: none; border-bottom: 1px solid #000; background: var(--blue-bg); width: 100%; height: 45px; cursor: pointer; object-fit: contain; }
        .sig-text { font-size: 10px; font-weight: bold; margin-top: 2px; }
        .quote-num-box { text-align: right; padding-bottom: 5px; display: flex; justify-content: flex-end; align-items: flex-end; }
        .red-quote-input { color: #dc3545; font-weight: bold; font-size: 18px; font-family: 'Courier New', monospace; text-align: right; border: none; background: var(--blue-bg); width: 100%; margin: 0; padding: 0 5px; }
        .zoom-controls { position: fixed; bottom: 20px; right: 20px; background: rgba(30,31,38,0.95); padding: 5px 10px; border-radius: 50px; display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); z-index: 2000; border: 1px solid #555; }
        .zoom-controls button { background: var(--accent); border: none; width: 32px; height: 32px; border-radius: 50%; font-weight: bold; font-size: 18px; cursor: pointer; display: flex; justify-content: center; align-items: center; color: #1e1f26; }
        .zoom-controls span { color: white; font-size: 12px; font-weight: bold; min-width: 45px; text-align: center; }
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.75); display: none; z-index: 4000; justify-content: center; align-items: center; }
        .custom-modal-overlay.open { display: flex; }
        .custom-modal-card { background: var(--bg-panel); width: 350px; padding: 25px; border-radius: 12px; border: 1px solid #555; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5);}
        .custom-modal-title { font-size: 20px; color: var(--accent); margin-bottom: 15px; font-weight: bold; }
        .custom-modal-msg { color: var(--text-main); margin-bottom: 25px; font-size: 15px; line-height: 1.4; }
        .custom-modal-actions { display: flex; justify-content: center; gap: 10px; }
        .btn-modal-cancel { background: #444; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
        .btn-modal-confirm { background: var(--btn-green); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
        .btn-modal-ok { background: var(--accent); color: black; border: none; padding: 10px 30px; border-radius: 6px; cursor: pointer; font-weight: bold; }
        @media (max-width: 768px) {
            #view-dashboard { padding: 15px; }
            .dash-header { flex-direction: column; align-items: flex-start; gap: 15px; width: 100%; }
            .dash-title { padding-right: 80px; width: 100%; }
            .dash-header .action-btn { width: 100%; justify-content: center; font-size: 14px; }
            .tabs-container { flex-direction: column; width: 100%; }
            .btn-tab { width: 100%; justify-content: center; }
            .quote-item { grid-template-columns: 1fr auto; grid-template-areas: "id id" "client client" "author author" "status date"; gap: 4px 12px; padding: 16px; border-radius: 12px; border: 1px solid #3a3b46; border-left: 1px solid #3a3b46; margin-bottom: 12px; position: relative; }
            .inv-id { grid-area: id; } .inv-client { grid-area: client; } .inv-author { grid-area: author; }
            .inv-status { grid-area: status; } .inv-date { grid-area: date; text-align: right; }
            .inv-actions { position: absolute; top: 16px; right: 16px; }
            .zoom-controls { display: none !important; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    </style>

    <div class="soum-main">
        <div id="view-dashboard">
            <div class="dash-header">
                <div class="dash-title"><h1>Mes Soumissions</h1><p>Gérez vos estimations</p></div>
                <button class="action-btn" id="btnNewQuote">
                    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Nouvelle Soumission
                </button>
            </div>

            <div class="tabs-container" id="quote-tabs" style="display:none">
                <button id="tab-mine" class="btn-tab active">
                    <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Mes Soumissions
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
                    <input type="text" id="searchInput" placeholder="Rechercher (Client, N°...)">
                </div>
                <select id="statusFilter" style="display:none; background:#1e1f26; border:1px solid #444; color:white; padding:10px 12px; border-radius:8px; font-size:14px; outline:none; cursor:pointer; flex-shrink:0;">
                    <option value="">Tous les statuts</option>
                    <option value="envoye">Envoyé au bureau</option>
                    <option value="traite">Traité</option>
                    <option value="attente">À corriger</option>
                    <option value="paye">Approuvé</option>
                </select>
            </div>
            <div id="quote-compteur" class="discrete-stats"></div>
            <div class="quote-list" id="quoteListContainer"></div>
        </div>

        <div id="view-editor">
            <div class="top-bar">
                <button class="action-btn btn-back" id="btnBack">
                    <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    Retour
                </button>
                <button class="action-btn btn-save" id="btnSave">
                    <svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Sauvegarder
                </button>
                <button class="action-btn btn-send" id="btnSend">
                    <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Envoyer au bureau
                </button>
                <button class="action-btn btn-convert" id="btnConvert">
                    <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    Convertir en facture
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
            <div class="scroll-area"><div id="quote-container"></div></div>
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
            <div class="custom-modal-title">Information</div>
            <div class="custom-modal-msg" id="alertMsg"></div>
            <div class="custom-modal-actions">
                <button class="btn-modal-ok" id="btnAlertOk">Compris</button>
            </div>
        </div>
    </div>
    `,await j(e),M}async function j(e){let n=e.querySelector(`#view-dashboard`),r=e.querySelector(`#view-editor`),i=e.querySelector(`#quote-container`),a=e.querySelector(`#zoom-level`);t(`view_all_quotes`)?e.querySelector(`#quote-tabs`).style.display=`flex`:(e.querySelector(`#quote-tabs`).style.display=`flex`,e.querySelector(`#tab-all`).style.display=`none`),e.querySelector(`#tab-mine`).addEventListener(`click`,()=>F(`mine`,e)),e.querySelector(`#tab-all`).addEventListener(`click`,()=>F(`all`,e)),e.querySelector(`#tab-archives`).addEventListener(`click`,()=>F(`archives`,e)),e.querySelector(`#searchInput`).addEventListener(`keyup`,()=>I(e)),e.querySelector(`#statusFilter`).addEventListener(`change`,()=>I(e)),e.querySelector(`#btnNewQuote`).addEventListener(`click`,()=>R(n,r,i,a)),e.querySelector(`#btnBack`).addEventListener(`click`,()=>z(n,r,e)),e.querySelector(`#btnSave`).addEventListener(`click`,()=>U(!1,i,e)),e.querySelector(`#btnSend`).addEventListener(`click`,()=>{Z(`Une fois envoyée, cette soumission sera verrouillée. L'envoyer au bureau ?`,()=>U(!0,i,e),e)}),e.querySelector(`#btnConvert`).addEventListener(`click`,()=>W(i,e)),e.querySelector(`#btnUnlock`).addEventListener(`click`,()=>H(e)),e.querySelector(`#btnPdf`).addEventListener(`click`,()=>G(i)),e.querySelector(`#btnAddPage`).addEventListener(`click`,()=>{i.appendChild(K()),O?.applyZoom(O?.current??1)}),e.querySelector(`#btnDupPage`).addEventListener(`click`,()=>q(i,a)),e.querySelector(`#btnDelPage`).addEventListener(`click`,()=>te(i,e)),e.querySelector(`#btnClear`).addEventListener(`click`,()=>{Z(`Effacer tout le contenu de la soumission ?`,()=>{i.querySelectorAll(`input, textarea.desc-textarea`).forEach(e=>e.value=``),i.querySelectorAll(`.display-sig`).forEach(e=>e.src=``)},e)}),O=p({container:i,scrollArea:e.querySelector(`#scrollArea`),zoomDisplay:a,docWidthPx:816}),O.attach(),e.querySelector(`#btnZoomOut`).addEventListener(`click`,()=>O.zoomOut()),e.querySelector(`#btnZoomIn`).addEventListener(`click`,()=>O.zoomIn()),e.querySelector(`#btnZoomReset`).addEventListener(`click`,()=>O.zoomReset()),k=()=>{r.style.display===`flex`&&O?.fitToScreen()},window.addEventListener(`resize`,k),e.querySelector(`#btnConfirmNo`).addEventListener(`click`,()=>Q(e)),e.querySelector(`#btnConfirmYes`).addEventListener(`click`,()=>{T&&T(),Q(e)}),e.querySelector(`#btnAlertOk`).addEventListener(`click`,()=>e.querySelector(`#alertModal`).classList.remove(`open`)),i.addEventListener(`input`,e=>{e.target?.classList.contains(`desc-textarea`)&&X(e.target)}),h(i),g(i),await N(!0,e)}function M(){Y(),O&&=(O.destroy(),null),k&&=(window.removeEventListener(`resize`,k),null)}async function N(t=!0,i){t&&(S=0,y=[]);let a=S*C,s=a+C-1,c=e.from(`soumissions`).select(`*`);v===`archives`?(c=c.eq(`is_archived`,!0),o(n)||(c=c.eq(`author_id`,r.id))):(c=c.eq(`is_archived`,!1),c=v===`mine`?c.eq(`author_id`,r.id):c.neq(`status`,`brouillon`));let{data:l}=await c.order(`created_at`,{ascending:!1}).range(a,s+1);l&&(w=l.length>C,y=t?l.slice(0,C).map(P):[...y,...l.slice(0,C).map(P)]),ee(i)}function P(e){return{id:e.id,client:e.client,date:e.date,status:e.status,inputValues:e.input_values||[],sigValues:e.sig_values||[],pageCount:e.page_count||1,authorId:e.author_id,authorName:e.author_name,isArchived:e.is_archived===!0}}function F(e,t){v=e,t.querySelectorAll(`.btn-tab`).forEach(e=>e.classList.remove(`active`));let n=t.querySelector(`#tab-${e}`);n&&n.classList.add(`active`);let r=t.querySelector(`#statusFilter`);r&&(r.style.display=e===`all`?`block`:`none`,r.value=``),N(!0,t)}function ee(e){let i=e.querySelector(`#quoteListContainer`);i.innerHTML=``;let a=t(`view_all_quotes`),o=v===`archives`?y:!a||v===`mine`?y.filter(e=>e.authorId===r.id||!e.authorId):y.filter(e=>e.status!==`brouillon`),s=e.querySelector(`#quote-compteur`);if(s&&(s.textContent=`${y.length} soumission(s) chargée(s)${w?` — il y en a plus`:``}`),o.length===0){i.innerHTML=`<div style="color:#888;text-align:center;padding:20px;font-style:italic">Aucune soumission trouvée.</div>`;return}if(o.forEach(t=>{let o=``;o=t.isArchived?`<span style="background:#555;color:#fff;padding:4px 10px;border-radius:6px">Archivée</span>`:t.status===`Convertie`?`<span class="status-convertie">Convertie</span>`:t.status===`brouillon`?`<span class="status-brouillon">Brouillon</span>`:`<span class="status-attente">${a?`En attente`:`Envoyée`}</span>`;let s=`<div style="width:36px"></div>`;t.isArchived?c(n)&&(s=`<button class="btn-icon" style="background:rgba(40,167,69,0.15);color:#28a745" data-restore="${t.id}">↺</button>`):d(t,n,r.id).allowed&&(s=`<button class="btn-icon btn-delete" data-delete="${t.id}">
                    <svg viewBox="0 0 24 24" width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>`);let l=document.createElement(`div`);l.className=`quote-item`,l.innerHTML=`
            <div class="inv-id">${t.id}</div>
            <div class="inv-client">${t.client}</div>
            <div class="inv-author">${t.authorName||`Inconnu`}</div>
            <div class="inv-status">${o}</div>
            <div class="inv-date">${t.date}</div>
            <div class="inv-actions">${s}</div>
        `,l.addEventListener(`click`,n=>{n.target.closest(`[data-delete],[data-restore]`)||L(t.id,e)}),l.querySelector(`[data-delete]`)?.addEventListener(`click`,i=>{i.stopPropagation(),u({table:`soumissions`,id:t.id,item:t,role:n,userId:r.id,userName:_,onSuccess:()=>N(!0,e),showConfirm:(t,n)=>Z(t,n,e),showAlert:t=>$(t,e)})}),l.querySelector(`[data-restore]`)?.addEventListener(`click`,r=>{r.stopPropagation(),f({table:`soumissions`,id:t.id,role:n,onSuccess:()=>N(!0,e),showConfirm:(t,n)=>Z(t,n,e),showAlert:t=>$(t,e)})}),i.appendChild(l)}),w){let t=document.createElement(`button`);t.textContent=`Charger ${C} soumissions de plus...`,t.style.cssText=`width:100%;padding:14px;margin-top:10px;background:#2b2c36;color:#aaa;border:1px dashed #444;border-radius:10px;cursor:pointer;font-size:14px;font-weight:bold`,t.addEventListener(`click`,async()=>{S++,await N(!1,e)}),i.appendChild(t)}}function I(e){let n=e.querySelector(`#searchInput`).value.toLowerCase(),i=e.querySelector(`#statusFilter`)?.value||``,a=t(`view_all_quotes`),o=(v===`archives`?y:!a||v===`mine`?y.filter(e=>e.authorId===r.id||!e.authorId):y.filter(e=>e.status!==`brouillon`)).filter(e=>e.client.toLowerCase().includes(n)||String(e.id).toLowerCase().includes(n));i&&v===`all`&&(o=o.filter(e=>e.status===i));let s=e.querySelector(`#quoteListContainer`);if(s.innerHTML=``,o.length===0){s.innerHTML=`<div style="color:#888;text-align:center;padding:20px;font-style:italic">Aucun résultat.</div>`;return}o.forEach(t=>{let n=document.createElement(`div`);n.className=`quote-item`,n.innerHTML=`<div class="inv-id">${t.id}</div><div class="inv-client">${t.client}</div><div class="inv-author">${t.authorName||``}</div><div class="inv-status"><span class="status-brouillon">${t.status}</span></div><div class="inv-date">${t.date}</div><div class="inv-actions"></div>`,n.addEventListener(`click`,()=>L(t.id,e)),s.appendChild(n)})}function L(e,t){let n=y.find(t=>t.id===e);if(!n)return;b=e;let r=t.querySelector(`#view-dashboard`),i=t.querySelector(`#view-editor`),a=t.querySelector(`#quote-container`);t.querySelector(`#zoom-level`),r.style.display=`none`,i.style.display=`flex`,a.innerHTML=``,E=0,D=0;for(let e=0;e<(n.pageCount||1);e++)a.appendChild(K());let o=a.querySelectorAll(`input, textarea.desc-textarea`);n.inputValues&&o.forEach((e,t)=>{n.inputValues[t]!==void 0&&(e.value=n.inputValues[t])});let s=a.querySelectorAll(`.display-sig`);n.sigValues&&s.forEach((e,t)=>{n.sigValues[t]&&(e.src=n.sigValues[t])}),re(a),B(n,t),O?.fitToScreen(),m(a),h(a),g(a),!n.isArchived&&(!n.status||n.status===`brouillon`)&&J(a)}function R(e,t,n,r){try{localStorage.removeItem(`fdussault_draft_soumission_new`)}catch{}b=null,e.style.display=`none`,t.style.display=`flex`,n.innerHTML=``,E=0,D=0,n.appendChild(K());let i=n.querySelector(`.red-quote-input`);i&&(i.value=`S-`+Date.now().toString().slice(-4));let a=n.closest(`.soum-main`).parentElement;B(null,a),O?.fitToScreen(),h(n),g(n),J(n)}function z(e,t,n){Y(),e.style.display=`flex`,t.style.display=`none`,N(!0,n)}function B(e,n){let i=t(`view_all_quotes`),a=e?.status||`brouillon`,o=e?e.authorId===r.id||!e.authorId:!0,s=e?.isArchived===!0,c=i?a===`brouillon`&&o:a===`brouillon`;s&&(c=!1);let l=e=>{e&&(e.style.display=c?`flex`:`none`)};l(n.querySelector(`#btnSave`)),l(n.querySelector(`#btnSend`)),l(n.querySelector(`#btnAddPage`)),l(n.querySelector(`#btnDupPage`)),l(n.querySelector(`#btnDelPage`)),l(n.querySelector(`#btnClear`));let u=n.querySelector(`#btnConvert`);u&&(u.style.display=a===`En attente`&&i?`flex`:`none`);let d=n.querySelector(`#btnUnlock`);d&&(d.style.display=i&&a!==`brouillon`&&a!==`Convertie`&&!s?`flex`:`none`),V(c,n)}function V(e,t){let n=t.querySelector(`#quote-container`);n?.querySelectorAll(`input, textarea.desc-textarea`).forEach(t=>{e?(t.removeAttribute(`readonly`),t.style.pointerEvents=`auto`):(t.setAttribute(`readonly`,!0),t.style.pointerEvents=`none`)}),n?.querySelectorAll(`.display-sig`).forEach(t=>{t.style.pointerEvents=e?`auto`:`none`})}function H(e){V(!0,e);let t=e.querySelector(`#btnSave`),n=e.querySelector(`#btnUnlock`);t&&(t.style.display=`flex`),n&&(n.style.display=`none`),[`#btnAddPage`,`#btnDupPage`,`#btnDelPage`,`#btnClear`].forEach(t=>{let n=e.querySelector(t);n&&(n.style.display=`flex`)}),$(`Soumission débloquée. N'oubliez pas de sauvegarder.`,e)}async function U(t,n,i){let o=n.querySelector(`.page`);if(!o)return!1;let s=i.querySelector(`#btnSave`),c=s?.innerHTML;s&&(s.disabled=!0,s.innerHTML=`<svg style="animation:spin 1s linear infinite" viewBox="0 0 24 24" width="16" height="16" style="stroke:white;fill:none;stroke-width:2"><circle cx="12" cy="12" r="10" stroke-dasharray="40" stroke-dashoffset="10"/></svg> Sauvegarde...`);let l=o.querySelectorAll(`.top-section input`),u=l[0]?.value.trim()||`Client Inconnu`,d=l[4]?.value.trim()||new Date().toLocaleDateString(),f=o.querySelector(`.red-quote-input`)?.value.trim()||`S-Draft-`+Date.now().toString().slice(-4),p=Array.from(n.querySelectorAll(`input, textarea.desc-textarea`)).map(e=>e.value),m=Array.from(n.querySelectorAll(`.display-sig`)).map(e=>e.getAttribute(`src`)),h=n.querySelectorAll(`.page`).length,g=y.find(e=>e.id===b||e.id===f),v=g?.status||`brouillon`;t&&(v=`En attente`);let x={id:f,client:u,date:d,status:v,input_values:p,sig_values:m,page_count:h,author_id:g?g.authorId:r.id,author_name:g?g.authorName:_},{error:S}=await a(()=>e.from(`soumissions`).upsert(x));if(s&&(s.disabled=!1,s.innerHTML=c),S){let e=(S.message||``).toLowerCase();return $(e.includes(`lock broken`)?`❌ Réessayez dans 2 secondes.`:e.includes(`failed to fetch`)?`❌ Pas de connexion internet.`:`❌ Erreur : `+S.message,i),!1}b=f,ne();try{localStorage.removeItem(`fdussault_draft_soumission_new`)}catch{}return await N(!0,i),t?($(`Soumission envoyée au bureau avec succès !`,i),z(i.querySelector(`#view-dashboard`),i.querySelector(`#view-editor`),i)):($(`Brouillon sauvegardé avec succès !`,i),B(x.status?{status:x.status,authorId:x.author_id,isArchived:!1}:null,i)),!0}async function W(t,n){Z(`Convertir cette soumission en facture ?`,async()=>{await U(!1,t,n);let i=y.find(e=>e.id===b);if(!i)return;let{data:a}=await e.from(`factures`).select(`id`),o=1e3;a&&a.forEach(e=>{let t=parseInt(e.id);!isNaN(t)&&t>o&&(o=t)});let s=(o+1).toString(),{error:c}=await e.from(`factures`).insert([{id:s,client:i.client,date:new Date().toLocaleDateString(),status:`brouillon`,input_values:i.inputValues,sig_values:i.sigValues,page_count:i.pageCount,author_id:r.id,author_name:_}]);c?$(`❌ Erreur : `+c.message,n):(await e.from(`soumissions`).update({status:`Convertie`}).eq(`id`,b),$(`Succès ! La facture #${s} a été générée.`,n),z(n.querySelector(`#view-dashboard`),n.querySelector(`#view-editor`),n))},n,`Convertir en Facture`,!0)}function G(e){let t=e.querySelector(`.page`);if(!t)return;let n=t.querySelectorAll(`.top-section input`),r=n[0]?.value.trim()||``,i=n[4]?.value.trim()||new Date().toISOString().split(`T`)[0],a=t.querySelector(`.red-quote-input`);l({container:e,docType:`soumission`,docNumber:b||a?.value.trim(),clientName:r,date:i})}function K(){E++,D++;let e=document.createElement(`div`);e.className=`page quote-style`;let t=`type="text" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false"`,n=``;for(let e=0;e<20;e++)n+=`<tr><td><input ${t}></td><td><textarea class="desc-textarea" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" rows="1"></textarea></td><td><input ${t}></td><td><input ${t}></td></tr>`;return e.innerHTML=`
        <div class="top-section">
            <div class="header-main">
                <img src="/assets/logo_dussault.png" alt="F. Dussault" onerror="this.style.display='none'">
                <h2>SOUMISSION / ESTIMATION</h2>
            </div>
            <div class="info-section">
                <div class="info-column">
                    <div class="field"><label>M.</label><input ${t}></div>
                    <div class="field"><input ${t}></div>
                    <div class="field"><label>Po client:</label><input ${t}></div>
                    <div class="field"><label>Tél:</label><input ${t}></div>
                </div>
                <div class="info-column">
                    <div class="field"><label>Date:</label><input ${t}></div>
                    <div class="field"><label>Travail à:</label><input ${t}></div>
                    <div class="field"><label>Adresse:</label><input ${t}></div>
                    <div class="field"><label>Po:</label><input ${t}></div>
                </div>
            </div>
            <div class="banner-cmmtq"><img src="/assets/cmmtq_et_slogan.png" alt="CMMTQ" onerror="this.style.display='none'"></div>
        </div>
        <table class="main-table">
            <thead><tr><th width="45">QUANT.</th><th>DESCRIPTION</th><th width="75">MONTANT</th><th width="75">TOTAL</th></tr></thead>
            <tbody>${n}</tbody>
        </table>
        <div class="bottom-section">
            <table class="time-wrapper"><tr>
                <td class="time-label-col"><span>Valide pour 30 jours</span><h2># TEMPS</h2></td>
                <td><table class="inner-table">
                    <tr class="row-headers">
                        <td style="width:25%">TARIF ESTIMÉ</td><td style="width:15%">CHARGE MIN.</td>
                        <td style="width:25%">TRANSPORT</td><td style="width:20%">HRE ARRIVÉE</td>
                        <td class="last-col" style="width:15%">INITIALE</td>
                    </tr>
                    <tr class="row-inputs">
                        <td><div class="flex-group">DE <div class="input-box"><input ${t}></div> À <div class="input-box"><input ${t}></div></div></td>
                        <td><div class="input-box"><input ${t}></div></td>
                        <td><div class="flex-group">DE <div class="input-box"><input ${t}></div> À <div class="input-box"><input ${t}></div></div></td>
                        <td><div class="flex-group">TOTAL <div class="input-box"><input ${t}></div></div></td>
                        <td class="last-col"><div class="input-box"><input ${t}></div></td>
                    </tr>
                    <tr class="row-inputs">
                        <td><div class="flex-group">DE <div class="input-box"><input ${t}></div> À <div class="input-box"><input ${t}></div></div></td>
                        <td><div class="input-box"><input ${t}></div></td>
                        <td><div class="flex-group">DE <div class="input-box"><input ${t}></div> À <div class="input-box"><input ${t}></div></div></td>
                        <td><div class="flex-group">TOTAL <div class="input-box"><input ${t}></div></div></td>
                        <td class="last-col"><div class="input-box"><input ${t}></div></td>
                    </tr>
                </table></td>
            </tr></table>
            <div class="footer-grid">
                <div class="sig-box"><img id="sig-p-${D}" class="display-sig"><div class="sig-text">Signature (Approbation)</div></div>
                <div class="sig-box"><img id="sig-c-${D}" class="display-sig"><div class="sig-text">Signature du client (Acception)</div></div>
                <div class="quote-num-box"><input type="text" class="red-quote-input" placeholder="No."></div>
            </div>
        </div>
    `,e}function q(e,t){let n=e.querySelectorAll(`.page`);if(n.length===0)return;let r=n[n.length-1],i=K();e.appendChild(i);let a=r.querySelectorAll(`.top-section input`),o=i.querySelectorAll(`.top-section input`);a.forEach((e,t)=>{o[t]&&(o[t].value=e.value)}),O?.applyZoom(O?.current??1)}function te(e,t){e.children.length>1?(e.removeChild(e.lastElementChild),E--):$(`Impossible de supprimer la dernière page.`,t)}function J(e){if(x)try{x.stop()}catch{}x=s({module:`soumission`,containerSelector:`#quote-container`,draftIdGetter:()=>b}),x.start(),x.hasDraft()&&x.restore()}function Y(){if(x){try{x.stop()}catch{}x=null}}function ne(){if(x)try{x.clear()}catch{}}function X(e){e.style.height=`auto`,e.style.height=e.scrollHeight+`px`}function re(e){e.querySelectorAll(`.desc-textarea`).forEach(X)}function Z(e,t,n,r=`Confirmation`,i=!1){let a=n.querySelector(`#confirmModal`),o=n.querySelector(`#confirmTitle`),s=n.querySelector(`#confirmMsg`),c=n.querySelector(`#btnConfirmYes`);o&&(o.textContent=r),s&&(s.innerHTML=e),c&&(c.style.background=i?`var(--btn-blue)`:`var(--btn-red)`,c.textContent=i?`Convertir`:`Oui`),T=t,a?.classList.add(`open`)}function Q(e){e.querySelector(`#confirmModal`)?.classList.remove(`open`),T=null}function $(e,t){let n=t.querySelector(`#alertModal`),r=t.querySelector(`#alertMsg`);r&&(r.innerHTML=e),n?.classList.add(`open`)}export{A as render};