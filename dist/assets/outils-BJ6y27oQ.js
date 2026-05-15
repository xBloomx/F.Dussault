import{t as e}from"./supabase-BHP_DPH_.js";import{i as t,r as n,t as r}from"./auth-BoJf8KxA.js";var i=`Employé`,a=[],o=0,s=25,c=!1,l=[],u=null,d=null,f=[],p=null;async function m(e){e.innerHTML=`
    <style>
        .outils-main { padding: 30px; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .dash-header { display: flex; justify-content: space-between; align-items: center; }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .btn-action { background-color: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; white-space: nowrap; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3);}
        .btn-action:hover { background-color: var(--accent-hover); transform: translateY(-2px); }
        .btn-action svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .toolbar { display: flex; gap: 15px; align-items: center; background-color: var(--bg-panel); padding: 15px; border-radius: 12px; }
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input { width: 100%; background: #1e1f26; border: 1px solid #444; color: white; padding: 14px 15px 14px 45px; border-radius: 8px; font-size: 16px; outline: none; transition: 0.2s; }
        .search-box input:focus { border-color: var(--accent); }
        .search-icon { position: absolute; left: 15px; color: #888; pointer-events: none; display: flex; align-items: center; }
        .search-icon svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .section-title { font-size: 16px; color: var(--accent); text-transform: uppercase; margin-top: 10px; margin-bottom: 5px; border-bottom: 1px solid #444; padding-bottom: 5px; }
        .tool-list { display: flex; flex-direction: column; gap: 15px; padding-bottom: 30px; }
        .tool-item { background-color: var(--bg-panel); padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border-left: 5px solid var(--accent); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .tool-item.returned { border-left-color: var(--btn-green); opacity: 0.7; }
        .tool-info { display: flex; flex-direction: column; gap: 5px; flex: 1; }
        .tool-name { font-size: 18px; font-weight: bold; color: white; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .tool-name svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .tool-details { color: #aaa; font-size: 14px; display: flex; align-items: center; gap: 15px; flex-wrap: wrap; margin-top: 5px; }
        .tool-details span { display: flex; align-items: center; gap: 5px; }
        .tool-details svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .status-badge { font-size: 11px; padding: 3px 8px; border-radius: 6px; font-weight: bold; text-transform: uppercase; white-space: nowrap; }
        .status-badge.out { background: rgba(252,202,70,0.2); color: var(--accent); border: 1px solid rgba(252,202,70,0.5); }
        .status-badge.in { background: rgba(40,167,69,0.2); color: var(--btn-green); border: 1px solid rgba(40,167,69,0.5); }
        .tool-actions { display: flex; gap: 10px; margin-left: 20px; flex-wrap: wrap; }
        .btn-return { background: var(--btn-green); color: white; border: none; padding: 10px 15px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
        .btn-return svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-return:hover { background: #218838; }
        .btn-transfer { background: var(--btn-blue); color: white; border: none; padding: 10px 15px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
        .btn-transfer svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-transfer:hover { background: #2980b9; }
        .btn-delete-tool { background: rgba(255,77,77,0.1); color: var(--btn-red); border: 1px solid transparent; width: 40px; height: 40px; border-radius: 8px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
        .btn-delete-tool svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-delete-tool:hover { background: var(--btn-red); color: white; }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: none; z-index: 4000; justify-content: center; align-items: center; }
        .modal-overlay.open { display: flex; }
        .modal-card-basic { background: var(--bg-panel); width: 350px; padding: 25px; border-radius: 15px; text-align: center; border: 1px solid #555; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .modal-actions { display: flex; justify-content: center; gap: 10px; margin-top: 20px; }
        .btn-modal-gray { background: #444; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .btn-modal-yellow { background: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .btn-modal-green { background: var(--btn-green); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .btn-modal-red { background: var(--btn-red); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }

        .custom-form-card { background: #252631; width: 90%; max-width: 400px; padding: 30px; border-radius: 30px; box-shadow: 0 15px 35px rgba(0,0,0,0.5); position: relative; border: 1px solid #444; max-height: 90vh; overflow-y: auto; }
        .modal-header-custom { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; color: white; font-size: 22px; font-weight: bold; }
        .modal-header-custom svg { width: 35px; height: 35px; stroke: currentColor; fill: none; stroke-width: 2; }
        .custom-group { margin-bottom: 22px; text-align: left; }
        .custom-group label { display: block; color: white; margin-bottom: 7px; font-size: 15px; font-weight: bold; }
        .custom-group input, .custom-group select { width: 100%; padding: 12px 15px; background: #323443; border: 1px solid #444; color: white; border-radius: 8px; font-size: 16px; outline: none; box-sizing: border-box; }
        .custom-group input:focus, .custom-group select:focus { border-color: var(--accent); }
        .btn-custom-submit { background-color: var(--accent); color: black; border: none; width: 100%; padding: 15px; border-radius: 12px; font-weight: bold; font-size: 18px; cursor: pointer; margin-top: 10px; transition: 0.2s; }
        .btn-custom-submit:hover { background-color: var(--accent-hover); }
        .btn-close-modal { position: absolute; top: 15px; right: 20px; background: none; border: none; color: #888; font-size: 30px; cursor: pointer; }
        .btn-close-modal:hover { color: white; }

        @media (max-width: 768px) {
            .outils-main { padding: 15px; }
            .dash-header { flex-direction: column; align-items: flex-start; gap: 15px; }
            .dash-header .btn-action { width: 100%; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);}
            .tool-item { flex-direction: column; align-items: flex-start; gap: 15px; padding: 15px; }
            .tool-actions { align-self: stretch; margin-left: 0; width: 100%; }
            .btn-return, .btn-transfer { flex: 1; justify-content: center; }
        }
    </style>

    <div class="outils-main">
        <div class="dash-header">
            <div class="dash-title">
                <h1>Outils</h1>
                <p>Registre d'emprunt du matériel</p>
            </div>
            <button class="btn-action" id="btnBorrow">
                <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Emprunter un outil
            </button>
        </div>

        <div class="toolbar">
            <div class="search-box">
                <span class="search-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                <input type="text" id="toolSearch" placeholder="Rechercher (Plombier, Outil, Adresse...)">
            </div>
        </div>

        <div class="section-title">En cours d'utilisation</div>
        <div class="tool-list" id="activeListContainer"></div>

        <div class="section-title" style="margin-top:20px;color:#888">Historique des retours</div>
        <div class="tool-list" id="historyListContainer"></div>
    </div>

    <!-- Modal emprunt -->
    <div class="modal-overlay" id="borrowModal">
        <div class="custom-form-card">
            <button class="btn-close-modal" id="btnCloseBorrow">×</button>
            <div class="modal-header-custom" style="color:var(--accent)">
                <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                Outil emprunté
            </div>
            <div class="custom-group">
                <label>Nom du plombier</label>
                <input type="text" id="inpPlombier" placeholder="Ex: François">
            </div>
            <div class="custom-group">
                <label>Outil</label>
                <select id="inpOutil">
                    <option value="" disabled selected hidden>Sélectionner une machine...</option>
                    <option value="Autre...">Autre (Préciser en note)</option>
                </select>
            </div>
            <div class="custom-group" id="grpOutilAutre" style="display:none">
                <label>Préciser l'outil <span style="color:var(--btn-red)">*</span></label>
                <input type="text" id="inpOutilAutre" placeholder="Ex: Perceuse, Caméra d'inspection...">
            </div>
            <div class="custom-group">
                <label>Adresse / Lieu</label>
                <input type="text" id="inpAdresse" placeholder="Ex: Camion #4">
            </div>
            <div class="custom-group">
                <label>Date</label>
                <input type="date" id="inpDate">
            </div>
            <button class="btn-custom-submit" id="btnSaveBorrow">Emprunter l'outil</button>
        </div>
    </div>

    <!-- Modal transfert -->
    <div class="modal-overlay" id="transferModal">
        <div class="custom-form-card">
            <button class="btn-close-modal" id="btnCloseTransfer">×</button>
            <div class="modal-header-custom" style="color:var(--btn-blue)">
                <svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                Transférer l'outil
            </div>
            <div class="custom-group">
                <label style="color:#aaa">Outil sélectionné :<br><span id="transferToolName" style="color:white;font-size:18px"></span></label>
            </div>
            <div class="custom-group">
                <label>Nouveau responsable (Plombier)</label>
                <select id="inpTransferTo">
                    <option value="" disabled selected hidden>Choisir un collègue...</option>
                </select>
            </div>
            <button class="btn-custom-submit" id="btnExecuteTransfer" style="background:var(--btn-blue);color:white">Confirmer le transfert</button>
        </div>
    </div>

    <!-- Modal réception transfert -->
    <div class="modal-overlay" id="receiveTransferModal">
        <div class="custom-form-card">
            <div class="modal-header-custom" style="color:var(--btn-blue)">
                <svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                Transfert d'outil reçu
            </div>
            <div class="custom-group">
                <label style="color:#aaa">
                    <span id="receiveTransferFrom" style="color:var(--accent);font-weight:bold">Quelqu'un</span>
                    souhaite vous transférer :
                </label>
                <div id="receiveTransferToolName" style="color:white;font-size:18px;font-weight:bold;margin-top:8px"></div>
            </div>
            <div class="custom-group">
                <label style="color:#aaa">Lieu actuel : <span id="receiveTransferOldLocation" style="color:white"></span></label>
            </div>
            <div class="custom-group">
                <label>Nouveau lieu de l'outil <span style="color:var(--btn-red)">*</span></label>
                <input type="text" id="inpReceiveNewLocation" placeholder="Ex: Camion, Atelier, Adresse du chantier...">
            </div>
            <div class="modal-actions">
                <button class="btn-modal-gray" style="flex:1" id="btnRefuseTransfer">Refuser</button>
                <button class="btn-modal-green" style="flex:1" id="btnAcceptTransfer">Accepter</button>
            </div>
        </div>
    </div>

    <!-- Modal alerte -->
    <div class="modal-overlay" id="alertModal">
        <div class="modal-card-basic">
            <div style="font-size:20px;color:var(--accent);font-weight:bold;margin-bottom:15px">Information</div>
            <div style="color:#e0e0e0;margin-bottom:25px;line-height:1.4" id="alertMsg"></div>
            <div class="modal-actions"><button class="btn-modal-yellow" style="width:100%" id="btnCloseAlert">Compris</button></div>
        </div>
    </div>

    <!-- Modal confirmation -->
    <div class="modal-overlay" id="confirmModal">
        <div class="modal-card-basic">
            <div style="font-size:20px;font-weight:bold;margin-bottom:15px" id="confirmTitle">Action</div>
            <div style="color:#e0e0e0;margin-bottom:25px" id="confirmMsg">Êtes-vous sûr ?</div>
            <div class="modal-actions">
                <button class="btn-modal-gray" id="btnCancelConfirm">Annuler</button>
                <button id="btnConfirmAction" class="btn-modal-red">Confirmer</button>
            </div>
        </div>
    </div>
    `,await h()}async function h(){n&&(i=r?.prenom_nom||n.email.split(`@`)[0],document.getElementById(`btnBorrow`).addEventListener(`click`,T),document.getElementById(`btnCloseBorrow`).addEventListener(`click`,()=>z(`borrowModal`)),document.getElementById(`btnSaveBorrow`).addEventListener(`click`,E),document.getElementById(`inpOutil`).addEventListener(`change`,w),document.getElementById(`btnCloseTransfer`).addEventListener(`click`,()=>z(`transferModal`)),document.getElementById(`btnExecuteTransfer`).addEventListener(`click`,M),document.getElementById(`btnRefuseTransfer`).addEventListener(`click`,L),document.getElementById(`btnAcceptTransfer`).addEventListener(`click`,I),document.getElementById(`btnCloseAlert`).addEventListener(`click`,()=>z(`alertModal`)),document.getElementById(`btnCancelConfirm`).addEventListener(`click`,B),document.getElementById(`btnConfirmAction`).addEventListener(`click`,async()=>{u&&(d===`return`?await O():d===`delete`&&await A())}),document.getElementById(`toolSearch`).addEventListener(`keyup`,S),await g(),await _(),await P())}async function g(){let{data:t}=await e.from(`profils`).select(`prenom_nom, role`).order(`role`);t&&(l=t)}async function _(t=!0){t&&(o=0,a=[]);let n=o*s,r=n+s-1,{data:i,error:l}=await e.from(`outils`).select(`*`).order(`created_at`,{ascending:!1}).range(n,r+1);if(l){console.error(`Erreur chargement outils:`,l);return}if(t&&i?.length){let t=i.filter(e=>e.status===`active`&&(!e.assignee_nom||!e.assignee_nom.trim())&&!e.date_transfert);if(t.length>0){let n=t.map(e=>e.id);await e.from(`outils`).update({status:`available`}).in(`id`,n),i.forEach(e=>{n.includes(e.id)&&(e.status=`available`)})}}c=(i||[]).length>s;let u=(i||[]).slice(0,s);a=t?u:[...a,...u],b()}async function v(){let e=document.getElementById(`btn-charger-plus-outils`);e&&(e.disabled=!0,e.textContent=`Chargement...`),o++,await _(!1)}function y(e){if(!e)return``;let t=e.split(`-`);return`${t[2]}/${t[1]}/${t[0]}`}function b(e=a){let n=document.getElementById(`activeListContainer`),r=document.getElementById(`historyListContainer`);if(!n||!r)return;n.innerHTML=``,r.innerHTML=``;let o=t(`manage_tools`),s=!1,c=!1;e.forEach(e=>{if(e.status===`available`)return;let t=!!e.pending_transfer_to,a=e.status===`active`?`<span class="status-badge out">En cours</span>`:`<span class="status-badge in">Retourné</span>`;t&&(a+=` <span class="status-badge" style="background:rgba(91,192,235,0.15);color:var(--btn-blue);border:1px solid rgba(91,192,235,0.4)">↗ Transfert en attente : ${e.pending_transfer_to}</span>`);let l=``;e.status===`active`?((e.assignee_nom||``).trim()===(i||``).trim()&&(t?l+=`<button class="btn-transfer" style="background:#888" data-cancel="${e.id}">
                        <svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Annuler la demande</button>`:(l+=`<button class="btn-return" data-return="${e.id}">
                        <svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><polyline points="20 6 9 17 4 12"/></svg>
                        Marquer retourné</button>`,l+=`<button class="btn-transfer" data-transfer="${e.id}">
                        <svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                        Transférer</button>`)),o&&(l+=`<button class="btn-delete-tool" data-delete="${e.id}">
                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>`)):o&&(l=`<button class="btn-delete-tool" data-delete="${e.id}">
                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>`);let u=document.createElement(`div`);u.className=`tool-item ${e.status===`returned`?`returned`:``}`,u.innerHTML=`
            <div class="tool-info">
                <div class="tool-name">
                    <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                    ${e.nom} ${a}
                </div>
                <div class="tool-details">
                    <span><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><strong>${e.assignee_nom||`-`}</strong></span>
                    <span><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${e.notes||`-`}</span>
                    <span><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Emprunté le ${y(e.date_transfert)}</span>
                </div>
            </div>
            <div class="tool-actions">${l}</div>
        `,(e.status===`active`?n:r).appendChild(u),e.status===`active`?s=!0:c=!0}),n.querySelectorAll(`[data-return]`).forEach(e=>e.addEventListener(`click`,()=>D(e.dataset.return))),n.querySelectorAll(`[data-transfer]`).forEach(e=>e.addEventListener(`click`,()=>j(e.dataset.transfer))),n.querySelectorAll(`[data-cancel]`).forEach(e=>e.addEventListener(`click`,()=>N(e.dataset.cancel))),document.querySelectorAll(`[data-delete]`).forEach(e=>e.addEventListener(`click`,()=>k(e.dataset.delete))),s||(n.innerHTML=`<div style="color:#888;font-style:italic;padding:10px">Aucun outil actuellement en utilisation.</div>`),c||(r.innerHTML=`<div style="color:#888;font-style:italic;padding:10px">Aucun historique de retour.</div>`),x()}function x(){let e=document.getElementById(`historyListContainer`),t=document.getElementById(`btn-charger-plus-outils`);if(t&&t.remove(),!c||!e)return;let n=document.createElement(`button`);n.id=`btn-charger-plus-outils`,n.textContent=`Charger ${s} entrées de plus...`,n.style.cssText=`width:100%;padding:14px;margin-top:10px;background:#2b2c36;color:#aaa;border:1px dashed #444;border-radius:10px;cursor:pointer;font-size:14px;font-weight:bold`,n.addEventListener(`click`,v),e.appendChild(n)}function S(){let e=document.getElementById(`toolSearch`)?.value.toLowerCase()||``;b(a.filter(t=>(t.assignee_nom||``).toLowerCase().includes(e)||(t.nom||``).toLowerCase().includes(e)||(t.notes||``).toLowerCase().includes(e)))}async function C(){let t=document.getElementById(`inpOutil`);if(!t)return;let n=[];try{let{data:t}=await e.from(`outils`).select(`nom, position`).order(`position`,{ascending:!0,nullsFirst:!1}).order(`nom`,{ascending:!0}),r=new Set;(t||[]).forEach(e=>{if(!e.nom)return;let t=e.nom.toLowerCase().trim();r.has(t)||(r.add(t),n.push(e.nom))})}catch{}let r=a.filter(e=>e.status===`active`).map(e=>e.nom),i=`<option value="" disabled selected hidden>Sélectionner une machine...</option>`;n.forEach(e=>{let t=r.includes(e),n=e.replace(/"/g,`&quot;`);i+=`<option value="${n}"${t?` disabled`:``}>${n}${t?` — Indisponible`:``}</option>`}),i+=`<option value="Autre...">Autre (Préciser en note)</option>`,t.innerHTML=i}function w(){let e=document.getElementById(`inpOutil`),t=document.getElementById(`grpOutilAutre`),n=document.getElementById(`inpOutilAutre`);e.value===`Autre...`?(t.style.display=``,n?.focus()):(t.style.display=`none`,n&&(n.value=``))}async function T(){await C(),document.getElementById(`inpPlombier`).value=i,document.getElementById(`inpOutil`).value=``,document.getElementById(`inpAdresse`).value=``,document.getElementById(`inpDate`).value=new Date().toISOString().split(`T`)[0];let e=document.getElementById(`inpOutilAutre`),t=document.getElementById(`grpOutilAutre`);e&&(e.value=``),t&&(t.style.display=`none`),document.getElementById(`borrowModal`).classList.add(`open`)}async function E(){let t=document.getElementById(`inpPlombier`).value.trim(),n=document.getElementById(`inpOutil`).value,r=document.getElementById(`inpAdresse`).value.trim(),i=document.getElementById(`inpDate`).value;if(!t||!n||!r||!i){R(`Merci de remplir tous les champs.`);return}let o=n;if(n===`Autre...`){let e=document.getElementById(`inpOutilAutre`).value.trim();if(!e){R(`Veuillez préciser le nom de l'outil.`);return}o=e}let s=a.filter(e=>e.status===`active`).map(e=>e.nom);if(n!==`Autre...`&&s.includes(o)){R(`Cet outil est déjà emprunté et n'a pas encore été retourné.`);return}let{error:c}=await e.from(`outils`).insert([{nom:o,assignee_nom:t,notes:r,date_transfert:i,status:`active`}]);if(c){R(`Erreur : `+c.message);return}await _(),z(`borrowModal`)}function D(e){u=e,d=`return`,document.getElementById(`confirmTitle`).textContent=`Retour d'outil`,document.getElementById(`confirmTitle`).style.color=`var(--btn-green)`,document.getElementById(`confirmMsg`).textContent=`Confirmer que cet outil a été ramené ?`;let t=document.getElementById(`btnConfirmAction`);t.textContent=`Oui, retourné`,t.className=`btn-modal-green`,document.getElementById(`confirmModal`).classList.add(`open`)}async function O(){let t=new Date().toISOString().split(`T`)[0],n=a.find(e=>e.id===u),{error:r}=await e.from(`outils`).update({status:`returned`,notes:(n?.notes||``)+` | Retourné: `+t}).eq(`id`,u);if(r){R(`Erreur : `+r.message);return}await _(),B()}function k(e){u=e,d=`delete`,document.getElementById(`confirmTitle`).textContent=`Supprimer`,document.getElementById(`confirmTitle`).style.color=`var(--btn-red)`,document.getElementById(`confirmMsg`).textContent=`Effacer définitivement cet enregistrement ?`;let t=document.getElementById(`btnConfirmAction`);t.textContent=`Supprimer`,t.className=`btn-modal-red`,document.getElementById(`confirmModal`).classList.add(`open`)}async function A(){let{error:t}=await e.from(`outils`).delete().eq(`id`,u);if(t){R(`Erreur : `+t.message);return}await _(),B()}function j(e){u=e;let t=a.find(t=>t.id===e);if(!t)return;if(t.pending_transfer_to){R(`Un transfert vers ${t.pending_transfer_to} est déjà en attente.`);return}document.getElementById(`transferToolName`).textContent=t.nom;let n=document.getElementById(`inpTransferTo`);n.innerHTML=`<option value="" disabled selected hidden>Choisir un collègue...</option>`,l.forEach(e=>{e.prenom_nom&&e.prenom_nom!==t.assignee_nom&&(n.innerHTML+=`<option value="${e.prenom_nom}">${e.prenom_nom}</option>`)}),document.getElementById(`transferModal`).classList.add(`open`)}async function M(){let t=document.getElementById(`inpTransferTo`).value;if(!t){R(`Veuillez sélectionner un employé.`);return}let{error:n}=await e.from(`outils`).update({pending_transfer_to:t,pending_transfer_at:new Date().toISOString()}).eq(`id`,u);if(n){R(`Erreur : `+n.message);return}await _(),z(`transferModal`),R(`Demande de transfert envoyée à ${t}. L'outil restera à votre nom tant qu'il n'aura pas confirmé.`)}async function N(t){let n=a.find(e=>e.id===t);if(!n?.pending_transfer_to)return;let{error:r}=await e.from(`outils`).update({pending_transfer_to:null,pending_transfer_at:null}).eq(`id`,t);if(r){R(`Erreur : `+r.message);return}await _(),R(`Demande de transfert à ${n.pending_transfer_to} annulée.`)}async function P(){let{data:t,error:n}=await e.from(`outils`).select(`id, nom, assignee_nom, notes, pending_transfer_to, pending_transfer_at`).eq(`pending_transfer_to`,i).eq(`status`,`active`);n||!t?.length||(f=t,F())}function F(){if(f.length===0){p=null;return}p=f.shift(),document.getElementById(`receiveTransferFrom`).textContent=p.assignee_nom||`Quelqu'un`,document.getElementById(`receiveTransferToolName`).textContent=p.nom||`-`,document.getElementById(`receiveTransferOldLocation`).textContent=p.notes||`-`,document.getElementById(`inpReceiveNewLocation`).value=``,document.getElementById(`receiveTransferModal`).classList.add(`open`)}async function I(){if(!p)return;let t=document.getElementById(`inpReceiveNewLocation`).value.trim();if(!t){R(`Veuillez indiquer le nouveau lieu de l'outil avant d'accepter.`);return}let{error:n}=await e.from(`outils`).update({assignee_nom:i,notes:t,pending_transfer_to:null,pending_transfer_at:null}).eq(`id`,p.id);if(n){R(`Erreur : `+n.message);return}let r=p.assignee_nom,a=p.nom;z(`receiveTransferModal`),await _(),R(`Transfert accepté. L'outil "${a}" vous a été transmis par ${r}.`),setTimeout(F,500)}async function L(){if(!p)return;let{error:t}=await e.from(`outils`).update({pending_transfer_to:null,pending_transfer_at:null}).eq(`id`,p.id);if(t){R(`Erreur : `+t.message);return}let n=p.assignee_nom,r=p.nom;z(`receiveTransferModal`),await _(),R(`Transfert refusé. L'outil "${r}" reste assigné à ${n}.`),setTimeout(F,500)}function R(e){document.getElementById(`alertMsg`).textContent=e,document.getElementById(`alertModal`).classList.add(`open`)}function z(e){document.getElementById(e).classList.remove(`open`)}function B(){z(`confirmModal`),u=null,d=null}export{m as render};