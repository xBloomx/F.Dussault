import{t as e}from"./supabase-BHP_DPH_.js";import{i as t,n,r,t as i}from"./auth-BoJf8KxA.js";import{t as a}from"./withRetry-ilQ6RSHM.js";import{a as o,c as s,i as c,n as l,o as u,r as d,s as f,t as p}from"./zoom-DQWUsYD6.js";import{n as m,r as h,t as g}from"./signature-B2p-Whyr.js";var _=`Employé`,v=`mine`,y=[],b=0,x=25,S=!1,C=null,w=null,T=null,E=null,D=!1,O=[],k=0,A=0,j=null,M=null;async function ee(e){return _=i?.prenom_nom||`Employé`,e.innerHTML=`
    <style>
        /* --blue-bg défini dans styles.css : #d1e9ff */
        .fact-main { font-family: 'Segoe UI', Arial, sans-serif; background: var(--bg-dark); color: var(--text-main); height: 100%; display: flex; flex-direction: column; overflow: hidden; }
        .badge-status { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; display: inline-flex; align-items: center; gap: 5px; color: white; }
        .b-brouillon { background: #444; } .b-envoye { background: #3498db; } .b-traite { background: var(--btn-purple); } .b-paye { background: #28a745; } .b-renvoye { background: #fd7e14; }
        .b-paper { background: rgba(91,192,235,0.15); color: #5bc0eb; border: 1px solid rgba(91,192,235,0.4); }
        .badges-wrap { display: inline-flex; flex-wrap: wrap; gap: 6px; align-items: center; }
        #view-dashboard { padding: 30px; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .dash-header { display: flex; justify-content: space-between; align-items: center; }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .toolbar { display: flex; gap: 15px; align-items: center; background: var(--bg-panel); padding: 15px; border-radius: 12px; }
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input { width: 100%; background: #1e1f26; border: 1px solid #444; color: white; padding: 12px 15px 12px 40px; border-radius: 8px; font-size: 16px; outline: none; }
        .search-icon { position: absolute; left: 12px; color: #888; pointer-events: none; display: flex; align-items: center; }
        .search-icon svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .tabs-container { display: flex; gap: 10px; margin-bottom: 5px; }
        .btn-tab { background: #1a1b23; color: #aaa; border: 1px solid #444; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
        .btn-tab svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-tab.active { background: var(--btn-blue); color: white; border-color: var(--btn-blue); }
        .invoice-list { display: flex; flex-direction: column; gap: 10px; padding-bottom: 30px; }
        .invoice-item { background: var(--bg-panel); padding: 12px 20px; border-radius: 10px; display: grid; grid-template-columns: 80px 1fr 140px 130px 100px 44px; align-items: center; gap: 15px; cursor: pointer; border: 1px solid transparent; border-left: 4px solid transparent; transition: 0.2s; }
        .invoice-item:hover { transform: translateX(5px); background: #343542; border-left-color: var(--accent); background-color: #30313c; border-color: #555;}
        .inv-id { font-weight: bold; color: var(--accent); font-size: 15px; }
        .inv-client { font-weight: bold; font-size: 16px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .inv-author { font-size: 14px; color: #888; font-style: italic; }
        .inv-status { display: flex; align-items: center; }
        .inv-date { color: #aaa; font-size: 14px; text-align: right; }
        .inv-actions { display: flex; justify-content: flex-end; }
        .btn-icon { background: #444; border: none; width: 36px; height: 36px; border-radius: 8px; display: flex; justify-content: center; align-items: center; cursor: pointer; color: white; }
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
        .btn-unlock { background: var(--btn-orange) !important; color: white !important; }
        .btn-return { background: var(--btn-red) !important; color: white !important; }
        @media (max-width: 1024px) {
            .top-bar { padding: 10px 85px 10px 10px; gap: 10px; height: 65px; overflow-x: auto; justify-content: flex-start; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; }
            .top-bar::-webkit-scrollbar { display: none; }
            .top-bar .action-btn, .office-status-panel { flex-shrink: 0; width: auto; margin-bottom: 0; }
            .top-bar .action-btn { font-size: 11px; padding: 8px 15px; }
        }
        .office-status-panel { background: #1a1b23; border: 1px solid #555; padding: 9px 20px; border-radius: 50px; display: flex; align-items: center; gap: 8px; white-space: nowrap; flex-shrink: 0; cursor: pointer; color: white; font-weight: bold; font-size: 14px; }
        .office-status-panel svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .status-dropdown { position: fixed; background: rgba(43,44,54,0.98); backdrop-filter: blur(10px); border: 1px solid #555; border-radius: 16px; overflow: hidden; display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 9999; min-width: 200px; flex-direction: column; }
        .status-dropdown.show { display: flex; }
        .status-option { padding: 16px 20px; color: white; cursor: pointer; transition: 0.2s; font-size: 15px; font-weight: bold; border-bottom: 1px solid #3a3b46; }
        .status-option:hover { background: #3a3b46; color: var(--accent); }
        .correction-banner { background: rgba(255,77,77,0.15); border: 1px dashed var(--btn-red); padding: 15px; margin: 20px auto 0; max-width: 8.5in; border-radius: 8px; color: white; line-height: 1.5; font-size: 14px; display: flex; gap: 10px; }
        .scroll-area { flex: 1; overflow: auto; padding: 15px 0; display: flex; flex-direction: column; align-items: center; touch-action: auto; }
        #invoice-container { display: block; width: 8.5in; transform-origin: top center; transition: transform 0.1s ease-out; padding-bottom: 50px; }
        .page { width: 8.5in; height: 11in; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.5); box-sizing: border-box; display: flex; flex-direction: column; position: relative; margin: 0 auto 20px; color: black; padding: 0.25in; flex-shrink: 0; }
        input { outline: none; border-radius: 0; }
        input:focus { background-color: transparent !important; border-bottom: 2px solid #000 !important; }
        .top-section { width: 100%; }
        .header-main { width: 100%; margin-top: -15px; margin-bottom: 0; }
        .header-main img { width: 100%; height: auto; display: block; }
        .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 2px; }
        .info-column { display: flex; flex-direction: column; gap: 1px; }
        .field { display: flex; align-items: flex-end; font-size: 12px; font-weight: bold; min-height: 22px; }
        .field label { white-space: nowrap; margin-right: 5px; }
        .field input { background: var(--blue-bg) !important; border: none; border-bottom: 1px solid black; flex-grow: 1; height: 18px; padding: 0 5px; }
        .banner-cmmtq { width: 100%; margin: 7px 0 5px; text-align: center; }
        .banner-cmmtq img { width: 100%; height: auto; display: block; }
        .main-table { width: 100%; border-collapse: collapse; border: none; margin-bottom: 10px; }
        .main-table thead { border-top: 4px double black; }
        .main-table th { border: 1px solid black; font-size: 9px; background: #eee; padding: 2px; }
        .main-table td { border: 1px solid black; height: 24px; background: var(--blue-bg); padding: 0; }
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
        .display-sig { border: none; border-bottom: 1px solid #000; background: var(--blue-bg); width: 100%; height: 50px; cursor: pointer; object-fit: contain; }
        .sig-text { font-size: 10px; font-weight: bold; margin-top: 2px; }
        .invoice-num-box { text-align: right; padding-bottom: 5px; display: flex; justify-content: flex-end; align-items: flex-end; }
        .red-invoice-input { color: #dc3545; font-weight: bold; font-size: 18px; font-family: 'Courier New', monospace; text-align: right; border: none; background: var(--blue-bg); width: 100%; margin: 0; padding: 0 5px; }
        .zoom-controls { position: fixed; bottom: 20px; right: 20px; background: rgba(30,31,38,0.95); padding: 5px 10px; border-radius: 50px; display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); z-index: 2000; border: 1px solid #555; }
        .zoom-controls button { background: var(--accent); border: none; width: 32px; height: 32px; border-radius: 50%; font-weight: bold; font-size: 18px; cursor: pointer; color: #1e1f26; display: flex; align-items: center; justify-content: center; }
        .zoom-controls span { color: white; font-size: 12px; font-weight: bold; min-width: 45px; text-align: center; }
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.75); display: none; z-index: 4000; justify-content: center; align-items: center; }
        .custom-modal-overlay.open { display: flex; }
        .custom-modal-card { background: var(--bg-panel); width: 350px; padding: 25px; border-radius: 12px; border: 1px solid #555; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5);}
        .custom-modal-title { font-size: 20px; color: var(--btn-red); margin-bottom: 15px; font-weight: bold; }
        .custom-modal-msg { color: var(--text-main); margin-bottom: 25px; font-size: 15px; line-height: 1.4; }
        .custom-modal-actions { display: flex; justify-content: center; gap: 10px; }
        .btn-modal-cancel { background: #444; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
        .btn-modal-confirm { background: var(--btn-red); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
        .btn-modal-ok { background: var(--accent); color: black; border: none; padding: 10px 30px; border-radius: 6px; cursor: pointer; font-weight: bold; }
        /* Mode papier */
        .paper-mode-container { background: #fff; margin: 20px auto; max-width: 800px; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); overflow: hidden; }
        .paper-mode-header { display: flex; gap: 0; background: #fff; border-bottom: 1px solid #e0e0e0; }
        .paper-mode-header .pmh-field { flex: 1; padding: 10px 14px; border-right: 1px solid #e8e8e8; min-width: 0; }
        .paper-mode-header .pmh-field:last-child { border-right: none; }
        .paper-mode-header label { display: block; font-size: 9px; color: #888; font-weight: 700; letter-spacing: 0.8px; margin-bottom: 4px; text-transform: uppercase; }
        .paper-mode-header input { width: 100%; border: none; outline: none; background: transparent; font-size: 13px; color: #222; font-family: Arial, sans-serif; box-sizing: border-box; }
        .paper-mode-header input.paper-numero-input { color: #dc3545; font-weight: 700; }
        .paper-mode-body { padding: 30px 20px; background: #fff; min-height: 400px; }
        .paper-drop-zone { background: #fff; color: #222; border: 1.5px dashed #c4d4dd; border-radius: 14px; padding: 24px 20px; text-align: center; max-width: 360px; margin: 60px auto; }
        .paper-drop-zone .pdz-text { color: #333; font-weight: 600; font-size: 13px; margin-bottom: 18px; line-height: 1.4; }
        .paper-drop-zone .pdz-actions { display: flex; align-items: center; justify-content: center; gap: 12px; }
        .paper-drop-zone .pdz-camera { background: #cfe6f5; color: #2a7da8; width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; }
        .paper-drop-zone .pdz-camera svg { width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 2; }
        .paper-drop-zone .pdz-deposer { background: #5bc0eb; color: white; border: none; padding: 12px 22px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .paper-pages-list { padding: 16px 20px; background: #f8f9fa; border-top: 1px solid #e8e8e8; }
        .paper-page-display { position: relative; background: #fff; border-radius: 6px; margin-bottom: 12px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.15); border: 1px solid #e0e0e0; }
        .paper-page-display img { width: 100%; height: auto; display: block; }
        .paper-page-display .ppd-num { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.7); color: white; font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight: 600; pointer-events: none; }
        .paper-page-display .ppd-remove { position: absolute; top: 8px; right: 8px; background: var(--btn-red); color: white; border: none; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .paper-page-display .ppd-remove svg { width: 12px; height: 12px; stroke: currentColor; fill: none; stroke-width: 2; }
        .paper-add-page-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: calc(100% - 40px); margin: 16px 20px; padding: 14px; background: rgba(91,192,235,0.08); border: 1.5px dashed #5bc0eb; border-radius: 10px; color: #5bc0eb; font-weight: 600; font-size: 14px; cursor: pointer; font-family: inherit; }
        .paper-add-page-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        #paper-progress { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); background: #1f2027; color: white; padding: 20px 30px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.6); z-index: 9999; text-align: center; display: none; border: 1px solid #3a3b46; }
        #paper-progress.show { display: block; }
        #paper-progress .pp-spinner { width: 32px; height: 32px; margin: 0 auto 12px; border: 3px solid #444; border-top-color: #5bc0eb; border-radius: 50%; animation: pp-spin 0.8s linear infinite; }
        @keyframes pp-spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
            #view-dashboard { padding: 15px; }
            .dash-header { flex-direction: column; align-items: flex-start; gap: 15px; width: 100%; }
            .dash-title { padding-right: 80px; width: 100%; }
            .dash-header .action-btn { width: 100%; justify-content: center; font-size: 14px; }
            .tabs-container { flex-direction: column; width: 100%; }
            .btn-tab { width: 100%; justify-content: center; }
            .invoice-item { grid-template-columns: 1fr auto; grid-template-areas: "id id" "client client" "author author" "status date"; gap: 4px 12px; padding: 16px; border-radius: 12px; border: 1px solid #3a3b46; border-left: 1px solid #3a3b46; margin-bottom: 12px; position: relative; }
            .inv-id { grid-area: id; } .inv-client { grid-area: client; } .inv-author { grid-area: author; } .inv-status { grid-area: status; } .inv-date { grid-area: date; text-align: right; }
            .inv-actions { position: absolute; top: 16px; right: 16px; }
            .zoom-controls { display: none !important; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    </style>

    <svg style="display:none">
        <symbol id="fic-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></symbol>
        <symbol id="fic-plus" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></symbol>
        <symbol id="fic-user" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></symbol>
        <symbol id="fic-inbox" viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></symbol>
        <symbol id="fic-archive" viewBox="0 0 24 24"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></symbol>
        <symbol id="fic-trash" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></symbol>
        <symbol id="fic-back" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></symbol>
        <symbol id="fic-save" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></symbol>
        <symbol id="fic-send" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></symbol>
        <symbol id="fic-print" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></symbol>
        <symbol id="fic-camera" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></symbol>
        <symbol id="fic-file-plus" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></symbol>
        <symbol id="fic-copy" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></symbol>
        <symbol id="fic-file-minus" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></symbol>
        <symbol id="fic-eraser" viewBox="0 0 24 24"><path d="M20 20H7l-3-3a2.828 2.828 0 0 1 0-4l10-10a2.828 2.828 0 0 1 4 0l3 3a2.828 2.828 0 0 1 0 4l-7 7"/><line x1="10" y1="10" x2="17" y2="17"/></symbol>
        <symbol id="fic-unlock" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></symbol>
        <symbol id="fic-return" viewBox="0 0 24 24"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></symbol>
        <symbol id="fic-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></symbol>
        <symbol id="fic-chevron-down" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></symbol>
        <symbol id="fic-alert" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></symbol>
        <symbol id="fic-file-text" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></symbol>
        <symbol id="fic-x" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></symbol>
    </svg>

    <div class="fact-main">
        <div id="view-dashboard">
            <div class="dash-header">
                <div class="dash-title"><h1>Facturation</h1><p>Création et suivi comptable</p></div>
                <button class="action-btn" id="btnNewInvoice">
                    <svg viewBox="0 0 24 24"><use href="#fic-plus"/></svg> Nouvelle Facture
                </button>
            </div>

            <div class="tabs-container" id="invoice-tabs" style="display:none">
                <button id="tab-mine" class="btn-tab active">
                    <svg viewBox="0 0 24 24"><use href="#fic-user"/></svg> Mes Factures
                </button>
                <button id="tab-all" class="btn-tab">
                    <svg viewBox="0 0 24 24"><use href="#fic-inbox"/></svg> Boîte de réception
                </button>
                <button id="tab-archives" class="btn-tab">
                    <svg viewBox="0 0 24 24"><use href="#fic-archive"/></svg> Archives
                </button>
            </div>

            <div class="toolbar">
                <div class="search-box">
                    <span class="search-icon"><svg viewBox="0 0 24 24"><use href="#fic-search"/></svg></span>
                    <input type="text" id="searchInput" placeholder="Rechercher (Client, N°...)">
                </div>
            </div>
            <div id="inv-compteur" style="color:#888;font-size:12px;padding:5px 10px"></div>
            <div class="invoice-list" id="invoiceListContainer"></div>
        </div>

        <!-- Dropdown statut bureau -->
        <div class="status-dropdown" id="statusOptionsMenu">
            <div class="status-option" data-status="envoye">Reçu (À traiter)</div>
            <div class="status-option" data-status="traite">Traité</div>
            <div class="status-option" data-status="attente">À corriger</div>
            <div class="status-option" data-status="paye">Facture payée</div>
        </div>

        <div id="view-editor">
            <div class="top-bar" id="editor-top-bar">
                <button class="action-btn btn-back" id="btnBack">
                    <svg viewBox="0 0 24 24"><use href="#fic-back"/></svg> Retour
                </button>
                <button class="action-btn btn-save" id="btnSave">
                    <svg viewBox="0 0 24 24"><use href="#fic-save"/></svg> Sauvegarder
                </button>
                <button class="action-btn btn-send" id="btnSend">
                    <svg viewBox="0 0 24 24"><use href="#fic-send"/></svg> Envoyer au bureau
                </button>
                <button class="action-btn" id="btnPaper" style="background:#e8730a;color:white">
                    <svg viewBox="0 0 24 24" id="btnPaperIcon"><use href="#fic-camera"/></svg>
                    <span id="btnPaperLabel">Facture papier</span>
                </button>
                <button class="action-btn btn-unlock" id="btnUnlock" style="display:none">
                    <svg viewBox="0 0 24 24"><use href="#fic-unlock"/></svg> Débloquer
                </button>
                <button class="action-btn btn-return" id="btnReturn" style="display:none">
                    <svg viewBox="0 0 24 24"><use href="#fic-return"/></svg> Renvoyer (Correction)
                </button>
                <div id="office-status-div" class="office-status-panel" style="display:none">
                    <svg viewBox="0 0 24 24"><use href="#fic-check"/></svg>
                    <span id="current-status-text">Reçu (À traiter)</span>
                    <svg viewBox="0 0 24 24" style="width:12px;height:12px;margin-left:auto"><use href="#fic-chevron-down"/></svg>
                </div>
                <div style="flex:1"></div>
                <button class="action-btn" id="btnPdf">
                    <svg viewBox="0 0 24 24"><use href="#fic-print"/></svg> PDF / Imprimer
                </button>
                <button class="action-btn" id="btnAddPage">
                    <svg viewBox="0 0 24 24"><use href="#fic-file-plus"/></svg> Page
                </button>
                <button class="action-btn" id="btnDupPage">
                    <svg viewBox="0 0 24 24"><use href="#fic-copy"/></svg> Dupliquer
                </button>
                <button class="action-btn" id="btnDelPage">
                    <svg viewBox="0 0 24 24"><use href="#fic-file-minus"/></svg> Page
                </button>
                <button class="action-btn" id="btnClear">
                    <svg viewBox="0 0 24 24"><use href="#fic-eraser"/></svg> Effacer
                </button>
            </div>

            <div class="scroll-area" id="scrollArea">
                <div id="correction-banner" class="correction-banner" style="display:none">
                    <svg viewBox="0 0 24 24" style="width:24px;height:24px;stroke:var(--btn-red);fill:none;stroke-width:2;margin-top:3px;flex-shrink:0"><use href="#fic-alert"/></svg>
                    <div>
                        <strong style="color:var(--btn-red)">Facture renvoyée par le bureau pour correction :</strong><br>
                        <span id="correction-note-text" style="display:inline-block;margin-top:5px"></span>
                    </div>
                </div>
                <div id="invoice-container"></div>
            </div>

            <div class="zoom-controls">
                <button id="btnZoomOut">−</button>
                <span id="zoom-level">100%</span>
                <button id="btnZoomIn">+</button>
                <button id="btnZoomReset" style="font-size:14px">↺</button>
            </div>
        </div>
    </div>

    <!-- Inputs cachés mode papier -->
    <input type="file" id="pim-camera-input" accept="image/*" capture="environment" style="display:none">
    <input type="file" id="pim-gallery-input" accept="image/*" multiple style="display:none">

    <!-- Progress papier -->
    <div id="paper-progress">
        <div class="pp-spinner"></div>
        <div id="paper-progress-text">Téléversement…</div>
    </div>

    <!-- Modal retour -->
    <div class="custom-modal-overlay" id="returnModal">
        <div class="custom-modal-card">
            <div class="custom-modal-title">↩️ Renvoyer pour correction</div>
            <div style="text-align:left;margin-bottom:15px">
                <label style="color:#aaa;display:block;margin-bottom:10px;font-size:13px;font-weight:bold">Note pour l'employé :</label>
                <textarea id="returnNote" placeholder="Ex: Il manque le tarif horaire..." style="width:100%;height:100px;background:#1e1f26;color:white;border:1px solid #555;padding:10px;border-radius:5px;font-family:sans-serif;outline:none;resize:none;box-sizing:border-box"></textarea>
            </div>
            <div style="display:flex;justify-content:center;gap:10px;margin-top:15px">
                <button class="btn-modal-cancel" id="btnCloseReturnModal">Annuler</button>
                <button style="background:var(--btn-red);color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:bold" id="btnExecuteReturn">Renvoyer la facture</button>
            </div>
        </div>
    </div>

    <!-- Modal confirmation -->
    <div class="custom-modal-overlay" id="confirmModal">
        <div class="custom-modal-card">
            <div style="font-size:20px;margin-bottom:15px;font-weight:bold">Confirmation</div>
            <div id="confirmMsg" class="custom-modal-msg"></div>
            <div class="custom-modal-actions">
                <button class="btn-modal-cancel" id="btnConfirmNo">Non</button>
                <button class="btn-modal-confirm" id="btnConfirmYes">Oui</button>
            </div>
        </div>
    </div>

    <!-- Modal alerte -->
    <div class="custom-modal-overlay" id="alertModal">
        <div class="custom-modal-card">
            <div style="color:var(--accent);font-size:20px;margin-bottom:15px;font-weight:bold">Information</div>
            <div id="alertMsg" class="custom-modal-msg"></div>
            <div class="custom-modal-actions">
                <button class="btn-modal-ok" id="btnAlertOk">Compris</button>
            </div>
        </div>
    </div>
    `,await te(e),ne}async function te(n){let r=n.querySelector(`#view-dashboard`),i=n.querySelector(`#view-editor`),a=n.querySelector(`#invoice-container`),o=n.querySelector(`#zoom-level`);t(`view_all_invoices`)?n.querySelector(`#invoice-tabs`).style.display=`flex`:(n.querySelector(`#invoice-tabs`).style.display=`flex`,n.querySelector(`#tab-all`).style.display=`none`),n.querySelector(`#tab-mine`).addEventListener(`click`,()=>P(`mine`,n)),n.querySelector(`#tab-all`).addEventListener(`click`,()=>P(`all`,n)),n.querySelector(`#tab-archives`).addEventListener(`click`,()=>P(`archives`,n)),n.querySelector(`#searchInput`).addEventListener(`keyup`,()=>F(n,a)),n.querySelector(`#btnNewInvoice`).addEventListener(`click`,()=>re(r,i,a,o,n)),n.querySelector(`#btnBack`).addEventListener(`click`,()=>I(r,i,n)),n.querySelector(`#btnSave`).addEventListener(`click`,()=>z(!1,a,r,i,n)),n.querySelector(`#btnSend`).addEventListener(`click`,()=>{X(`Une fois envoyée, cette facture sera verrouillée. L'envoyer au bureau ?`,()=>z(!0,a,r,i,n),n)}),n.querySelector(`#btnPaper`).addEventListener(`click`,()=>ce(a,r,i,n)),n.querySelector(`#btnUnlock`).addEventListener(`click`,()=>ae(a,n)),n.querySelector(`#btnReturn`).addEventListener(`click`,()=>oe(n)),n.querySelector(`#btnPdf`).addEventListener(`click`,()=>pe(a,n)),n.querySelector(`#btnAddPage`).addEventListener(`click`,()=>{a.appendChild(G(a)),E?.applyZoom(E.current)}),n.querySelector(`#btnDupPage`).addEventListener(`click`,()=>me(a,o)),n.querySelector(`#btnDelPage`).addEventListener(`click`,()=>he(a,n)),n.querySelector(`#btnClear`).addEventListener(`click`,()=>{X(`Effacer tout le contenu de la facture ?`,()=>{a.querySelectorAll(`input, textarea.desc-textarea`).forEach(e=>e.value=``),a.querySelectorAll(`.display-sig`).forEach(e=>e.src=``)},n)}),E=p({container:a,scrollArea:n.querySelector(`#scrollArea`),zoomDisplay:o,docWidthPx:816}),E.attach(),n.querySelector(`#btnZoomOut`).addEventListener(`click`,()=>E.zoomOut()),n.querySelector(`#btnZoomIn`).addEventListener(`click`,()=>E.zoomIn()),n.querySelector(`#btnZoomReset`).addEventListener(`click`,()=>E.zoomReset()),j=()=>{i.style.display===`flex`&&E.fitToScreen()},window.addEventListener(`resize`,j),n.querySelector(`#office-status-div`).addEventListener(`click`,e=>ge(e,n)),n.querySelectorAll(`.status-option`).forEach(t=>{t.addEventListener(`click`,async()=>{n.querySelector(`#statusOptionsMenu`).classList.remove(`show`);let r=t.dataset.status,i={envoye:`Reçu (À traiter)`,traite:`Traité`,attente:`À corriger`,paye:`Facture payée`};if(n.querySelector(`#current-status-text`).textContent=i[r]||r,C){let{error:t}=await e.from(`factures`).update({status:r}).eq(`id`,C);t?Q(`Erreur : `+t.message,n):(await N(!0,n),Q(`Statut mis à jour.`,n))}})}),M=()=>n.querySelector(`#statusOptionsMenu`).classList.remove(`show`),window.addEventListener(`click`,M),n.querySelector(`#btnCloseReturnModal`).addEventListener(`click`,()=>$(`returnModal`,n)),n.querySelector(`#btnExecuteReturn`).addEventListener(`click`,()=>se(r,i,n)),n.querySelector(`#btnConfirmNo`).addEventListener(`click`,()=>Z(n)),n.querySelector(`#btnConfirmYes`).addEventListener(`click`,()=>{T&&T(),Z(n)}),n.querySelector(`#btnAlertOk`).addEventListener(`click`,()=>$(`alertModal`,n)),n.querySelector(`#pim-camera-input`).addEventListener(`change`,e=>{W(e.target.files,a),e.target.value=``}),n.querySelector(`#pim-gallery-input`).addEventListener(`change`,e=>{W(e.target.files,a),e.target.value=``}),a.addEventListener(`input`,e=>{e.target?.classList.contains(`desc-textarea`)&&Y(e.target)}),h(a),g(a),await N(!0,n)}function ne(){q(),E&&=(E.destroy(),null),j&&=(window.removeEventListener(`resize`,j),null),M&&=(window.removeEventListener(`click`,M),null)}async function N(t=!0,i){t&&(b=0,y=[]);let a=b*x,s=a+x-1,c=e.from(`factures`).select(`*`);v===`archives`?(c=c.eq(`is_archived`,!0),o(n)||(c=c.eq(`author_id`,r.id))):(c=c.eq(`is_archived`,!1),c=v===`mine`?c.eq(`author_id`,r.id):c.neq(`status`,`brouillon`));let{data:l}=await c.order(`created_at`,{ascending:!1}).range(a,s+1);if(l){S=l.length>x;let e=l.slice(0,x).map(e=>({id:e.id,client:e.client,date:e.date,status:e.status,inputValues:e.input_values||[],sigValues:e.sig_values||[],pageCount:e.page_count||1,authorId:e.author_id,authorName:e.author_name,returnNote:e.return_note,isArchived:e.is_archived===!0,isPaper:e.is_paper===!0,paperPages:e.paper_pages||null,timestamp:new Date(e.created_at).getTime()}));y=t?e:[...y,...e]}F(i,i.querySelector(`#invoice-container`))}function P(e,t){v=e,t.querySelectorAll(`.btn-tab`).forEach(e=>e.classList.remove(`active`)),t.querySelector(`#tab-${e}`)?.classList.add(`active`),N(!0,t)}function F(e,i){let a=e.querySelector(`#invoiceListContainer`);a.innerHTML=``;let o=e.querySelector(`#searchInput`)?.value.toLowerCase()||``,s=t(`view_all_invoices`),l=(v===`archives`?y:!s||v===`mine`?y.filter(e=>e.authorId===r.id):y.filter(e=>e.status!==`brouillon`)).filter(e=>(e.client||``).toLowerCase().includes(o)||String(e.id).toLowerCase().includes(o)),p=e.querySelector(`#inv-compteur`);if(p&&(p.textContent=`${y.length} facture(s) chargée(s)${S?` — il y en a plus`:``}`),!l.length){a.innerHTML=`<div style="color:#888;text-align:center;padding:20px">Aucune facture trouvée.</div>`;return}if(l.forEach(t=>{let o=``,l=t.status||`brouillon`;t.isArchived?o=`<span class="badge-status" style="background:#555">Archivé</span>`:l===`brouillon`?o=`<span class="badge-status b-brouillon">Brouillon</span>`:s?l===`envoye`?o=`<span class="badge-status b-envoye">Reçu (À traiter)</span>`:l===`traite`?o=`<span class="badge-status b-traite">Traité</span>`:l===`attente`?o=`<span class="badge-status b-renvoye">À corriger</span>`:l===`paye`&&(o=`<span class="badge-status b-paye">Facture payée</span>`):l===`envoye`?o=`<span class="badge-status b-envoye">Envoyé au bureau</span>`:l===`traite`||l===`paye`?o=`<span class="badge-status b-traite">Traité</span>`:l===`attente`&&(o=`<span class="badge-status b-renvoye">À corriger</span>`),t.isPaper&&(o=`<span class="badges-wrap">${o}<span class="badge-status b-paper"><svg style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><use href="#fic-camera"/></svg> Papier</span></span>`);let p=t.date||``;if(!p){let e=new Date(t.timestamp||Date.now());p=`${String(e.getDate()).padStart(2,`0`)}/${String(e.getMonth()+1).padStart(2,`0`)}/${e.getFullYear()}`}else if(p.includes(`-`)){let e=p.split(`-`);e.length===3&&(p=`${e[2]}/${e[1]}/${e[0]}`)}let m=`<div style="width:36px"></div>`;t.isArchived?c(n)&&(m=`<button class="btn-icon" style="background:rgba(40,167,69,0.15);color:#28a745" data-restore="${t.id}">↺</button>`):d(t,n,r.id).allowed&&(m=`<button class="btn-icon btn-delete" data-delete="${t.id}"><svg viewBox="0 0 24 24" width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:2"><use href="#fic-trash"/></svg></button>`);let h=document.createElement(`div`);h.className=`invoice-item`,h.innerHTML=`
            <div class="inv-id">#${t.id}</div>
            <div class="inv-client">${t.client||``}</div>
            <div class="inv-author">${t.authorName||`Inconnu`}</div>
            <div class="inv-status">${o}</div>
            <div class="inv-date">${p}</div>
            <div class="inv-actions">${m}</div>
        `,h.addEventListener(`click`,n=>{n.target.closest(`[data-delete],[data-restore]`)||ie(t.id,e,i)}),h.querySelector(`[data-delete]`)?.addEventListener(`click`,i=>{i.stopPropagation(),u({table:`factures`,id:t.id,item:t,role:n,userId:r.id,userName:_,onSuccess:()=>N(!0,e),showConfirm:(t,n)=>X(t,n,e),showAlert:t=>Q(t,e)})}),h.querySelector(`[data-restore]`)?.addEventListener(`click`,r=>{r.stopPropagation(),f({table:`factures`,id:t.id,role:n,onSuccess:()=>N(!0,e),showConfirm:(t,n)=>X(t,n,e),showAlert:t=>Q(t,e)})}),a.appendChild(h)}),S){let t=document.createElement(`button`);t.textContent=`Charger ${x} factures de plus...`,t.style.cssText=`width:100%;padding:14px;margin-top:10px;background:#2b2c36;color:#aaa;border:1px dashed #444;border-radius:10px;cursor:pointer;font-size:14px;font-weight:bold`,t.addEventListener(`click`,async()=>{b++,await N(!1,e)}),a.appendChild(t)}}async function re(t,n,r,i,a){try{localStorage.removeItem(`fdussault_draft_facture_new`)}catch{}C=null,D=!1,O=[],k=0,A=0,t.style.display=`none`,n.style.display=`flex`,r.innerHTML=``,r.appendChild(G(r));let o=`F-XXXX`;try{let{data:t,error:n}=await e.rpc(`next_facture_number`);!n&&t&&(o=t)}catch{o=`F-`+Date.now().toString().slice(-4)}C=o;let s=r.querySelector(`.red-invoice-input`);s&&(s.value=o,s.readOnly=!0,s.style.backgroundColor=`transparent`),L(null,r,a),E?.fitToScreen(),h(r),g(r),K(r)}function ie(e,t,n){let r=y.find(t=>t.id===e);if(!r)return;C=e,D=!1,O=[];let i=t.querySelector(`#view-dashboard`),a=t.querySelector(`#view-editor`);if(t.querySelector(`#zoom-level`),i.style.display=`none`,a.style.display=`flex`,n.innerHTML=``,k=0,A=0,r.isPaper&&r.paperPages?.length){fe(r,n,t),L(r,n,t);return}for(let e=0;e<(r.pageCount||1);e++)n.appendChild(G(n));let o=n.querySelectorAll(`input, textarea.desc-textarea`);r.inputValues&&o.forEach((e,t)=>{r.inputValues[t]!==void 0&&(e.value=r.inputValues[t])});let s=n.querySelectorAll(`.display-sig`);r.sigValues&&s.forEach((e,t)=>{r.sigValues[t]&&(e.src=r.sigValues[t])}),n.querySelectorAll(`.desc-textarea`).forEach(Y);let c=n.querySelector(`.red-invoice-input`);c&&(c.readOnly=!0,c.style.backgroundColor=`transparent`),L(r,n,t),E?.fitToScreen(),m(n),h(n),g(n),!r.isArchived&&(r.status===`brouillon`||r.status===`corrige`)&&K(n)}function I(e,t,n){q(),le(n),e.style.display=`flex`,t.style.display=`none`,N(!0,n)}function L(e,n,i){let a=t(`view_all_invoices`),o=e?.status||`brouillon`,s=e?e.authorId===r.id||!e.authorId:!0,c=e?.isArchived===!0,l=e?.isPaper===!0||D,u=(e,t)=>{let n=i.querySelector(e);n&&(n.style.display=t?`flex`:`none`)};if(l){let t=a?s&&(o===`brouillon`||o===`attente`):o===`brouillon`||o===`attente`;c&&(t=!1),[`#btnAddPage`,`#btnDupPage`,`#btnDelPage`,`#btnClear`].forEach(e=>u(e,!1)),u(`#btnPaper`,t),u(`#btnSave`,t),u(`#btnSend`,t),u(`#btnUnlock`,a&&o!==`brouillon`&&o!==`attente`&&!c),u(`#btnReturn`,a&&o!==`brouillon`&&o!==`attente`&&!c),V(i);let n=i.querySelector(`#office-status-div`);if(n){n.style.display=a&&o!==`brouillon`&&o!==`attente`?`flex`:`none`;let e={envoye:`Reçu (À traiter)`,traite:`Traité`,attente:`À corriger`,paye:`Facture payée`,brouillon:`Brouillon`},t=i.querySelector(`#current-status-text`);t&&(t.textContent=e[o]||o)}let r=i.querySelector(`#correction-banner`);r&&(o===`attente`&&e?.returnNote?(r.style.display=`flex`,i.querySelector(`#correction-note-text`).textContent=e.returnNote):r.style.display=`none`);return}let d=a?s&&(o===`brouillon`||o===`attente`):o===`brouillon`||o===`attente`;c&&(d=!1),u(`#btnSave`,d),u(`#btnSend`,d),u(`#btnPaper`,d),u(`#btnAddPage`,d),u(`#btnDupPage`,d),u(`#btnDelPage`,d),u(`#btnClear`,d),u(`#btnUnlock`,a&&o!==`brouillon`&&o!==`attente`&&!c),u(`#btnReturn`,a&&o!==`brouillon`&&o!==`attente`&&!c);let f=i.querySelector(`#office-status-div`);if(f){f.style.display=a&&o!==`brouillon`&&o!==`attente`?`flex`:`none`;let e={envoye:`Reçu (À traiter)`,traite:`Traité`,attente:`À corriger`,paye:`Facture payée`},t=i.querySelector(`#current-status-text`);t&&(t.textContent=e[o]||o)}let p=i.querySelector(`#correction-banner`);p&&(o===`attente`&&e?.returnNote?(p.style.display=`flex`,i.querySelector(`#correction-note-text`).textContent=e.returnNote):p.style.display=`none`),R(d,n)}function R(e,t){t.querySelectorAll(`input, textarea.desc-textarea`).forEach(t=>{e?(t.removeAttribute(`readonly`),t.style.pointerEvents=`auto`):(t.setAttribute(`readonly`,!0),t.style.pointerEvents=`none`)}),t.querySelectorAll(`.display-sig`).forEach(t=>{t.style.pointerEvents=e?`auto`:`none`})}function ae(e,t){R(!0,e),[`#btnSave`,`#btnAddPage`,`#btnDupPage`,`#btnDelPage`,`#btnClear`].forEach(e=>{let n=t.querySelector(e);n&&(n.style.display=`flex`)}),t.querySelector(`#btnUnlock`).style.display=`none`,Q(`Facture débloquée. N'oubliez pas de sauvegarder.`,t)}function oe(e){e.querySelector(`#returnNote`).value=``,e.querySelector(`#returnModal`).classList.add(`open`)}async function se(t,n,r){let i=r.querySelector(`#returnNote`).value.trim();if(!i){Q(`Veuillez inscrire une note pour expliquer ce qui manque.`,r);return}if(!C)return;let{error:a}=await e.from(`factures`).update({status:`attente`,return_note:i}).eq(`id`,C);if(a){Q(`Erreur : `+a.message,r);return}$(`returnModal`,r),await N(!0,r),I(t,n,r),Q(`La facture a été renvoyée à l'employé pour correction.`,r)}async function z(t,n,i,o,s){if(D){await de(t,n,i,o,s);return}let c=n.querySelector(`.page`);if(!c)return;let l=s.querySelector(`#btnSave`),u=l?.innerHTML;l&&(l.disabled=!0,l.textContent=`Sauvegarde...`);let d=c.querySelectorAll(`.top-section input`),f=d[0]?.value.trim()||`Client Inconnu`,p=d[4]?.value.trim()||new Date().toISOString().split(`T`)[0],m=C;if(!m)try{let{data:t}=await e.rpc(`next_facture_number`);m=t||`F-`+Date.now().toString().slice(-4)}catch{m=`F-`+Date.now().toString().slice(-4)}let h=Array.from(n.querySelectorAll(`input, textarea.desc-textarea`)).map(e=>e.value),g=Array.from(n.querySelectorAll(`.display-sig`)).map(e=>e.getAttribute(`src`)),v=n.querySelectorAll(`.page`).length,b=y.find(e=>e.id===C||e.id===m),x=b?.status||`brouillon`;t&&(x=`envoye`);let{error:S}=await a(()=>e.from(`factures`).upsert({id:m,client:f,date:p,input_values:h,sig_values:g,page_count:v,status:x,author_id:b?b.authorId:r.id,author_name:b?b.authorName:_,return_note:b?b.returnNote:``}));if(l&&(l.disabled=!1,l.innerHTML=u),S){Q(`❌ Erreur : `+S.message,s);return}C=m,J(),await N(!0,s),t?(Q(`Document envoyé au bureau avec succès !`,s),I(i,o,s)):(Q(`Facture sauvegardée.`,s),L(y.find(e=>e.id===C),n,s))}function ce(e,t,n,i){if(D){if(O.length>0){X(`Revenir au mode numérique va retirer les ${O.length} photo(s) ajoutée(s).`,()=>{D=!1,O=[],e.innerHTML=``,k=0,A=0,e.appendChild(G(e)),[`#btnAddPage`,`#btnDupPage`,`#btnDelPage`,`#btnClear`].forEach(e=>{let t=i.querySelector(e);t&&(t.style.display=`flex`)}),V(i),L({status:`brouillon`,authorId:r.id},e,i),E?.fitToScreen(),h(e),g(e)},i,`Retour au mode numérique`);return}D=!1,O=[],e.innerHTML=``,k=0,A=0,e.appendChild(G(e)),[`#btnAddPage`,`#btnDupPage`,`#btnDelPage`,`#btnClear`].forEach(e=>{let t=i.querySelector(e);t&&(t.style.display=`flex`)}),V(i),L({status:`brouillon`,authorId:r.id},e,i),E?.fitToScreen(),h(e),g(e)}else{let t=e.querySelectorAll(`input:not(.red-invoice-input):not([type="date"])`);if(Array.from(t).some(e=>e.value?.trim())){X(`Passer en mode 'facture papier' va supprimer le contenu du formulaire.`,()=>B(e,i),i);return}B(e,i)}}function B(e,t){D=!0,O=[],H(e,t),[`#btnAddPage`,`#btnDupPage`,`#btnDelPage`,`#btnClear`].forEach(e=>{let n=t.querySelector(e);n&&(n.style.display=`none`)}),V(t),L({isPaper:!0,status:`brouillon`,authorId:r.id},e,t)}function V(e){let t=e.querySelector(`#btnPaperLabel`),n=e.querySelector(`#btnPaperIcon use`);D?(t&&(t.textContent=`Mode numérique`),n&&n.setAttribute(`href`,`#fic-file-text`)):(t&&(t.textContent=`Facture papier`),n&&n.setAttribute(`href`,`#fic-camera`))}function le(e){D=!1,O=[],V(e)}function H(e,t){let n=C||``,r=new Date().toISOString().split(`T`)[0];e.innerHTML=``;let i=document.createElement(`div`);i.className=`paper-mode-container`,i.innerHTML=`
        <div class="paper-mode-header">
            <div class="pmh-field"><label>Client</label><input type="text" class="paper-client-input" placeholder="Nom du client"></div>
            <div class="pmh-field"><label>Date</label><input type="date" class="paper-date-input" value="${r}"></div>
            <div class="pmh-field"><label>No. facture</label><input type="text" class="paper-numero-input red-invoice-input" value="${n}"></div>
        </div>
        <div class="paper-mode-body" id="paper-mode-body"></div>
        <button type="button" class="paper-add-page-btn" id="paper-add-page-btn">
            <svg viewBox="0 0 24 24"><use href="#fic-plus"/></svg> Ajouter une page
        </button>
    `,e.appendChild(i),i.querySelector(`#paper-add-page-btn`).addEventListener(`click`,()=>t.querySelector(`#pim-gallery-input`).click()),U(e,t)}function U(e,t){let n=e.querySelector(`#paper-mode-body`);if(!n)return;if(n.innerHTML=``,O.length===0){n.innerHTML=`
            <div class="paper-drop-zone">
                <div class="pdz-text">Déposer une image ou prendre une photo</div>
                <div class="pdz-actions">
                    <button type="button" class="pdz-camera" id="pdz-camera-btn"><svg viewBox="0 0 24 24"><use href="#fic-camera"/></svg></button>
                    <button type="button" class="pdz-deposer" id="pdz-deposer-btn">Déposer</button>
                </div>
            </div>
        `,n.querySelector(`#pdz-camera-btn`).addEventListener(`click`,()=>t.querySelector(`#pim-camera-input`).click()),n.querySelector(`#pdz-deposer-btn`).addEventListener(`click`,()=>t.querySelector(`#pim-gallery-input`).click());return}let r=document.createElement(`div`);r.className=`paper-pages-list`,O.forEach((n,i)=>{let a=document.createElement(`div`);a.className=`paper-page-display`,a.innerHTML=`
            <span class="ppd-num">Page ${i+1} / ${O.length}</span>
            <button type="button" class="ppd-remove" data-remove="${i}"><svg viewBox="0 0 24 24"><use href="#fic-x"/></svg></button>
            <img src="${n.dataUrl||n.url}" alt="Page ${i+1}">
        `,a.querySelector(`[data-remove]`).addEventListener(`click`,()=>{O.splice(i,1),U(e,t)}),r.appendChild(a)}),n.appendChild(r)}async function W(e,t){if(!e?.length||!D)return;for(let t of Array.from(e)){if(!t.type.startsWith(`image/`))continue;let e=await new Promise((e,n)=>{let r=new FileReader;r.onload=()=>e(r.result),r.onerror=n,r.readAsDataURL(t)});O.push({file:t,dataUrl:e,uploaded:!1})}let n=document.querySelector(`#invoice-container`);n&&U(n,document.querySelector(`.fact-main`)?.parentElement||document.body)}async function ue(){let t=document.getElementById(`paper-progress`),n=document.getElementById(`paper-progress-text`);t?.classList.add(`show`);try{for(let t=0;t<O.length;t++){let i=O[t];if(i.uploaded)continue;n&&(n.textContent=`Téléversement page ${t+1}/${O.length}…`);let a=(i.file.name.split(`.`).pop()||`jpg`).replace(/[^a-z0-9]/gi,``).toLowerCase()||`jpg`,o=`factures-papier/${r.id}/paper_${Date.now()}_${t}.${a}`,{error:s}=await e.storage.from(`pieces_jointes`).upload(o,i.file,{contentType:i.file.type});if(s)throw s;let{data:{publicUrl:c}}=e.storage.from(`pieces_jointes`).getPublicUrl(o);O[t]={...i,url:c,name:i.file.name,path:o,uploaded:!0}}}finally{t?.classList.remove(`show`)}}async function de(t,n,i,o,s){if(O.length===0){Q(`Veuillez ajouter au moins une page (photo).`,s);return}let c=s.querySelector(`#btnSave`),l=s.querySelector(`#btnSend`),u=c?.innerHTML;c&&(c.disabled=!0,c.textContent=`Sauvegarde...`),l&&(l.disabled=!0);try{await ue();let c=n.querySelector(`.paper-client-input`),l=n.querySelector(`.paper-date-input`),u=n.querySelector(`.paper-numero-input`),d=c?.value.trim()||`Facture papier`,f=l?.value||new Date().toISOString().split(`T`)[0],p=u?.value.trim()||C;if(!p)try{let{data:t}=await e.rpc(`next_facture_number`);p=t||`F-`+Date.now().toString().slice(-4)}catch{p=`F-`+Date.now().toString().slice(-4)}let m=y.find(e=>e.id===C||e.id===p),h=m?.status||`brouillon`;t&&(h=`envoye`);let{error:g}=await a(()=>e.from(`factures`).upsert({id:p,client:d,date:f,input_values:[],sig_values:[],page_count:O.length,status:h,author_id:m?m.authorId:r.id,author_name:m?m.authorName:_,return_note:m?m.returnNote:``,is_paper:!0,paper_pages:O.map(e=>({url:e.url,name:e.name||`page.jpg`,path:e.path}))}));if(g)throw g;C=p,J(),await N(!0,s),t?(Q(`Facture papier #${p} envoyée au bureau !`,s),I(i,o,s)):Q(`Facture papier #${p} sauvegardée.`,s)}catch(e){Q(`❌ Erreur : `+(e.message||`inconnue`),s)}finally{c&&(c.disabled=!1,c.innerHTML=u),l&&(l.disabled=!1)}}function fe(e,t,n){D=!0,O=(e.paperPages||[]).map(e=>({url:e.url,name:e.name,path:e.path,uploaded:!0})),H(t,n),[`#btnAddPage`,`#btnDupPage`,`#btnDelPage`,`#btnClear`].forEach(e=>{let t=n.querySelector(e);t&&(t.style.display=`none`)}),V(n)}function pe(e,t){if(D){if(!O.length){Q(`Ajoutez au moins une photo avant d'exporter.`,t);return}let n=e.querySelector(`.paper-client-input`)?.value.trim()||``,r=e.querySelector(`.paper-date-input`)?.value.trim()||new Date().toISOString().split(`T`)[0],i=e.querySelector(`.paper-numero-input`)?.value.trim()||C||``,a=document.createElement(`div`);O.forEach(e=>{let t=document.createElement(`div`);t.className=`page`,t.style.cssText=`display:flex;align-items:center;justify-content:center;padding:0;background:white`;let n=document.createElement(`img`);n.src=e.dataUrl||e.url,n.style.cssText=`width:100%;height:100%;object-fit:contain`,t.appendChild(n),a.appendChild(t)}),document.body.appendChild(a),l({container:a,docType:`facture`,docNumber:i,clientName:n,date:r}).finally(()=>{try{document.body.removeChild(a)}catch{}});return}let n=e.querySelector(`.page`);if(!n)return;let r=n.querySelectorAll(`.top-section input`),i=r[0]?.value.trim()||``,a=r[4]?.value.trim()||new Date().toISOString().split(`T`)[0];l({container:e,docType:`facture`,docNumber:C||e.querySelector(`.red-invoice-input`)?.value.trim(),clientName:i,date:a})}function G(e){k++,A++;let t=document.createElement(`div`);t.className=`page invoice-style`;let n=`type="text" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false"`,r=``;for(let e=0;e<20;e++)r+=`<tr><td><input ${n}></td><td><textarea class="desc-textarea" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" rows="1"></textarea></td><td><input ${n}></td><td><input ${n}></td></tr>`;return t.innerHTML=`
        <div class="top-section">
            <div class="header-main"><img src="/assets/logo_dussault.png" alt="F. Dussault" onerror="this.style.display='none'"></div>
            <div class="info-section">
                <div class="info-column">
                    <div class="field"><label>M.</label><input ${n}></div>
                    <div class="field"><input ${n}></div>
                    <div class="field"><label>Po client:</label><input ${n}></div>
                    <div class="field"><label>Tél:</label><input ${n}></div>
                </div>
                <div class="info-column">
                    <div class="field"><label>Date:</label><input ${n}></div>
                    <div class="field"><label>Travail à:</label><input ${n}></div>
                    <div class="field"><label>Adresse:</label><input ${n}></div>
                    <div class="field"><label>Po:</label><input ${n}></div>
                </div>
            </div>
            <div class="banner-cmmtq"><img src="/assets/cmmtq_et_slogan.png" alt="CMMTQ" onerror="this.style.display='none'"></div>
        </div>
        <table class="main-table">
            <thead><tr><th width="45">QUANT.</th><th>DESCRIPTION</th><th width="75">MONTANT</th><th width="75">TOTAL</th></tr></thead>
            <tbody>${r}</tbody>
        </table>
        <div class="bottom-section">
            <table class="time-wrapper"><tr>
                <td class="time-label-col"><span>1 1/2% après 30 jours</span><h2># TEMPS</h2></td>
                <td><table class="inner-table">
                    <tr class="row-headers">
                        <td style="width:25%">TARIF PAR HRE</td><td style="width:15%">CHARGE MIN.</td>
                        <td style="width:25%">TRANSPORT</td><td style="width:20%">HRE ARRIVÉE</td>
                        <td class="last-col" style="width:15%">INITIALE</td>
                    </tr>
                    <tr class="row-inputs">
                        <td><div class="flex-group">DE <div class="input-box"><input ${n}></div> À <div class="input-box"><input ${n}></div></div></td>
                        <td><div class="input-box"><input ${n}></div></td>
                        <td><div class="flex-group">DE <div class="input-box"><input ${n}></div> À <div class="input-box"><input ${n}></div></div></td>
                        <td><div class="flex-group">TOTAL <div class="input-box"><input ${n}></div></div></td>
                        <td class="last-col"><div class="input-box"><input ${n}></div></td>
                    </tr>
                    <tr class="row-inputs">
                        <td><div class="flex-group">DE <div class="input-box"><input ${n}></div> À <div class="input-box"><input ${n}></div></div></td>
                        <td><div class="input-box"><input ${n}></div></td>
                        <td><div class="flex-group">DE <div class="input-box"><input ${n}></div> À <div class="input-box"><input ${n}></div></div></td>
                        <td><div class="flex-group">TOTAL <div class="input-box"><input ${n}></div></div></td>
                        <td class="last-col"><div class="input-box"><input ${n}></div></td>
                    </tr>
                </table></td>
            </tr></table>
            <div class="footer-grid">
                <div class="sig-box"><img id="sig-p-${A}" class="display-sig"><div class="sig-text">Signature du plombier</div></div>
                <div class="sig-box"><img id="sig-c-${A}" class="display-sig"><div class="sig-text">Signature du client</div></div>
                <div class="invoice-num-box"><input type="text" class="red-invoice-input" placeholder="No."></div>
            </div>
        </div>
    `,t}function me(e,t){let n=e.querySelectorAll(`.page`);if(!n.length)return;let r=n[n.length-1],i=G(e);e.appendChild(i);let a=r.querySelectorAll(`.top-section input`),o=i.querySelectorAll(`.top-section input`);a.forEach((e,t)=>{o[t]&&(o[t].value=e.value)}),E?.applyZoom(E?.current??1)}function he(e,t){e.children.length>1?(e.removeChild(e.lastElementChild),k--):Q(`Impossible de supprimer la dernière page.`,t)}function K(e){if(w)try{w.stop()}catch{}w=s({module:`facture`,containerSelector:`#invoice-container`,draftIdGetter:()=>C}),w.start(),w.hasDraft()&&w.restore()}function q(){if(w){try{w.stop()}catch{}w=null}}function J(){if(w)try{w.clear()}catch{}}function ge(e,t){e.stopPropagation();let n=t.querySelector(`#statusOptionsMenu`);if(n.classList.contains(`show`)){n.classList.remove(`show`);return}let r=t.querySelector(`#office-status-div`).getBoundingClientRect();n.style.top=r.bottom+8+`px`;let i=r.left;i+220>window.innerWidth&&(i=window.innerWidth-230),n.style.left=i+`px`,n.classList.add(`show`)}function Y(e){e.style.height=`auto`,e.style.height=e.scrollHeight+`px`}function X(e,t,n,r=`Confirmation`){n.querySelector(`#confirmMsg`).innerHTML=e,T=t,n.querySelector(`#confirmModal`).classList.add(`open`)}function Z(e){e.querySelector(`#confirmModal`).classList.remove(`open`),T=null}function Q(e,t){t.querySelector(`#alertMsg`).innerHTML=e,t.querySelector(`#alertModal`).classList.add(`open`)}function $(e,t){t.querySelector(`#${e}`)?.classList.remove(`open`)}export{ee as render};