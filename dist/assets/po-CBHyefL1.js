import{t as e}from"./supabase-BHP_DPH_.js";import{i as t,r as n,t as r}from"./auth-BoJf8KxA.js";var i=`Employé`,a=`mine`,o=[],s=0,c=25,l=!1,u=null,d=null;async function f(e){e.innerHTML=`
    <style>
        .po-main { padding: 30px; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .dash-header { display: flex; justify-content: space-between; align-items: center; }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .action-btn { background-color: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; white-space: nowrap; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3);}
        .action-btn:hover { background-color: var(--accent-hover); transform: translateY(-2px); }
        .action-btn svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .toolbar { display: flex; gap: 15px; align-items: center; background-color: var(--bg-panel); padding: 15px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);}
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input { width: 100%; background: #1e1f26; border: 1px solid #444; color: white; padding: 14px 15px 14px 45px; border-radius: 8px; font-size: 16px; outline: none; transition: 0.2s; }
        .search-box input:focus { border-color: var(--accent); }
        .search-icon { position: absolute; left: 15px; color: #888; pointer-events: none; display: flex; align-items: center; }
        .search-icon svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .tabs-container { display: flex; gap: 10px; }
        .btn-tab { background: #1a1b23; color: #aaa; border: 1px solid #444; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
        .btn-tab svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-tab.active { background: var(--btn-blue); color: white; border-color: var(--btn-blue); }
        .section-title { font-size: 16px; color: var(--accent); text-transform: uppercase; margin-top: 10px; margin-bottom: 5px; border-bottom: 1px solid #444; padding-bottom: 5px; }
        .po-list { display: flex; flex-direction: column; gap: 15px; padding-bottom: 30px; }
        .po-item { background-color: var(--bg-panel); padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border-left: 5px solid var(--btn-green); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .po-info { display: flex; flex-direction: column; gap: 5px; flex: 1; }
        .po-number { font-size: 20px; font-weight: bold; color: var(--accent); font-family: monospace; letter-spacing: 1px; display: flex; align-items: center; gap: 10px; }
        .po-details { color: white; font-size: 15px; display: flex; align-items: center; gap: 15px; flex-wrap: wrap; margin-top: 5px; }
        .po-details span { display: flex; align-items: center; gap: 5px; }
        .po-details svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .po-subtext { color: #aaa; font-size: 13px; margin-top: 5px; display: flex; align-items: center; gap: 8px; }
        .po-subtext svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .po-actions { display: flex; gap: 10px; margin-left: 20px; flex-wrap: wrap; justify-content: flex-end; }
        .btn-copy { background: #444; color: white; border: none; padding: 10px 15px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; display: flex; gap: 6px; align-items: center; }
        .btn-copy svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-copy:hover { background: #555; }
        .btn-delete { background: rgba(255,77,77,0.1); color: var(--btn-red); border: 1px solid transparent; width: 40px; height: 40px; border-radius: 8px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
        .btn-delete svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-delete:hover { background: var(--btn-red); color: white; }
        .status-badge { font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight: bold; background: var(--btn-green); color: white; display: flex; align-items: center; gap: 4px; }
        .status-badge svg { width: 12px; height: 12px; stroke: currentColor; fill: none; stroke-width: 2; }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: none; z-index: 4000; justify-content: center; align-items: center; }
        .modal-overlay.open { display: flex; }
        .modal-card-basic { background: var(--bg-panel); width: 350px; padding: 25px; border-radius: 15px; text-align: center; border: 1px solid #555; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .modal-actions { display: flex; justify-content: center; gap: 10px; margin-top: 20px; }
        .btn-modal-gray { background: #444; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
        .btn-modal-yellow { background: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .btn-modal-red { background: var(--btn-red); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }

        .custom-form-card { background: #252631; width: 90%; max-width: 450px; padding: 30px; border-radius: 30px; box-shadow: 0 15px 35px rgba(0,0,0,0.5); position: relative; border: 1px solid #444; max-height: 90vh; overflow-y: auto; }
        .modal-header-custom { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; color: white; font-size: 24px; }
        .modal-header-custom svg { width: 35px; height: 35px; stroke: currentColor; fill: none; stroke-width: 2; }
        .custom-group { margin-bottom: 18px; text-align: left; }
        .custom-group label { display: block; color: white; margin-bottom: 7px; font-size: 14px; }
        .custom-group input, .custom-group select { width: 100%; padding: 12px 15px; background: #323443; border: 1px solid transparent; color: white; border-radius: 8px; font-size: 16px; outline: none; transition: 0.2s; box-sizing: border-box; }
        .custom-group input:focus, .custom-group select:focus { border-color: var(--accent); }
        .file-upload-btn { background: #1a1b23; border: 1px dashed #888; color: #ccc; padding: 12px; text-align: center; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; font-size: 14px; }
        .file-upload-btn svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .file-upload-btn:hover { border-color: var(--accent); color: white; }
        .btn-custom-submit { background-color: var(--accent); color: black; border: none; width: 100%; padding: 15px; border-radius: 12px; font-weight: bold; font-size: 18px; cursor: pointer; margin-top: 10px; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-custom-submit:hover { background-color: var(--accent-hover); }
        .btn-close-modal { position: absolute; top: 15px; right: 20px; background: none; border: none; color: #888; font-size: 30px; cursor: pointer; }
        .btn-close-modal:hover { color: white; }

        .po-result-box { background: #1a1b23; border-radius: 12px; padding: 20px; text-align: center; margin-top: 20px; border: 1px dashed var(--border); display: none; }
        .po-result-title { color: #aaa; font-size: 13px; margin-bottom: 5px; text-transform: uppercase; }
        .po-result-number { color: var(--accent); font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 1px; margin-bottom: 15px; }
        .btn-copy-large { background: #444; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; gap: 8px; align-items: center; width: 100%; justify-content: center; margin-bottom: 10px; }
        .btn-copy-large svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-copy-large:hover { background: #555; }
        .btn-copy-large.success { background: var(--btn-green); color: white; }

        @media (max-width: 768px) {
            .po-main { padding: 15px; }
            .dash-header { flex-direction: column; align-items: flex-start; gap: 15px; width: 100%; }
            .dash-header .action-btn { width: 100%; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);}
            .tabs-container { flex-direction: column; width: 100%; }
            .btn-tab { width: 100%; justify-content: center; }
            .po-item { flex-direction: column; align-items: flex-start; gap: 15px; padding: 15px; }
            .po-actions { align-self: stretch; margin-left: 0; width: 100%; }
            .btn-copy { flex: 1; justify-content: center; }
        }
    </style>

    <div class="po-main">
        <div class="dash-header">
            <div class="dash-title">
                <h1>Demande de PO</h1>
                <p>Générateur de numéros uniques</p>
            </div>
            <button class="action-btn" id="btnNewPO">
                <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Demander un numéro de PO
            </button>
        </div>

        <div class="tabs-container" id="poTabs" style="display:none">
            <button id="tab-mine" class="btn-tab active">
                <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Mes PO
            </button>
            <button id="tab-all" class="btn-tab">
                <svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01"/></svg>
                Tous les PO
            </button>
        </div>

        <div class="toolbar">
            <div class="search-box">
                <span class="search-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                <input type="text" id="poSearch" placeholder="Rechercher (Numéro, Fournisseur, Adresse, Date...)">
            </div>
        </div>

        <div class="section-title">Liste des PO</div>
        <div class="po-list" id="poListContainer"></div>
    </div>

    <!-- Modal nouveau PO -->
    <div class="modal-overlay" id="poModal">
        <div class="custom-form-card">
            <button class="btn-close-modal" id="btnClosePoModal">×</button>
            <div class="modal-header-custom">
                <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                Nouveau Bon de Commande
            </div>
            <div id="poFormZone">
                <div class="custom-group">
                    <label>Nom du plombier</label>
                    <input type="text" id="inpPlombier" placeholder="Ex: François">
                </div>
                <div class="custom-group">
                    <label>Fournisseur</label>
                    <select id="selFournisseur">
                        <option value="">-- Choisir un fournisseur --</option>
                    </select>
                    <input type="text" id="inpFournisseurAutre" placeholder="Nom du fournisseur" style="display:none;margin-top:8px">
                    <input type="hidden" id="inpFournisseur">
                </div>
                <div class="custom-group">
                    <label>Adresse / Lieu du chantier</label>
                    <input type="text" id="inpAdresse" placeholder="Adresse du chantier">
                </div>
                <div class="custom-group">
                    <label>Date</label>
                    <input type="text" id="inpDate" placeholder="JJ/MM/AAAA" inputmode="numeric" maxlength="10">
                </div>
                <div class="custom-group">
                    <label>Photo de la soumission / reçu (Optionnel)</label>
                    <label class="file-upload-btn" for="inpPhoto">
                        <svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        <span id="labelPhotoText">Ajouter une photo...</span>
                    </label>
                    <input type="file" id="inpPhoto" accept="image/*" style="display:none">
                </div>
                <button class="btn-custom-submit" id="btnGeneratePO">Générer le numéro</button>
            </div>
            <div id="poResultZone" class="po-result-box">
                <div class="po-result-title">Numéro généré avec succès</div>
                <div class="po-result-number" id="displayNewPoNumber">PO-XXXXXX-XXXX</div>
                <button class="btn-copy-large" id="btnCopyMain">
                    <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copier le numéro
                </button>
                <p style="font-size:12px;color:#aaa;margin-top:10px">Ce numéro est maintenant enregistré dans votre liste.</p>
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
            <div style="font-size:20px;color:var(--btn-red);font-weight:bold;margin-bottom:15px" id="confirmTitle">Action</div>
            <div style="color:#e0e0e0;margin-bottom:25px" id="confirmMsg">Êtes-vous sûr ?</div>
            <div class="modal-actions">
                <button class="btn-modal-gray" id="btnCancelConfirm">Annuler</button>
                <button class="btn-modal-red" id="btnYesConfirm">Confirmer</button>
            </div>
        </div>
    </div>
    `,await p()}async function p(){n&&(i=r?.prenom_nom||n.email.split(`@`)[0],t(`view_all_po`)&&(document.getElementById(`poTabs`).style.display=`flex`),document.getElementById(`tab-mine`).addEventListener(`click`,()=>S(`mine`)),document.getElementById(`tab-all`).addEventListener(`click`,()=>S(`all`)),document.getElementById(`poSearch`).addEventListener(`keyup`,b),document.getElementById(`btnNewPO`).addEventListener(`click`,E),document.getElementById(`btnClosePoModal`).addEventListener(`click`,()=>M(`poModal`)),document.getElementById(`btnGeneratePO`).addEventListener(`click`,g),document.getElementById(`selFournisseur`).addEventListener(`change`,T),document.getElementById(`inpFournisseurAutre`).addEventListener(`input`,e=>{document.getElementById(`inpFournisseur`).value=e.target.value.trim()}),document.getElementById(`inpDate`).addEventListener(`keyup`,e=>A(e.target)),document.getElementById(`inpPhoto`).addEventListener(`change`,D),document.getElementById(`btnCopyMain`).addEventListener(`click`,()=>{k(document.getElementById(`displayNewPoNumber`).textContent,document.getElementById(`btnCopyMain`),!0)}),document.getElementById(`btnCloseAlert`).addEventListener(`click`,()=>M(`alertModal`)),document.getElementById(`btnCancelConfirm`).addEventListener(`click`,N),document.getElementById(`btnYesConfirm`).addEventListener(`click`,async()=>{d&&await d(),N()}),await m())}async function m(t=!0){t&&(s=0,o=[]);let n=s*c,r=n+c-1,{data:i,error:a}=await e.from(`bons_de_commande`).select(`*`).order(`created_at`,{ascending:!1}).range(n,r+1);if(a){console.error(`Erreur chargement PO:`,a);return}l=(i||[]).length>c;let u=(i||[]).slice(0,c);o=t?u:[...o,...u],b()}async function h(){let e=document.getElementById(`btn-charger-plus-po`);e&&(e.disabled=!0,e.textContent=`Chargement...`),s++,await m(!1)}async function g(){let t=document.getElementById(`inpPlombier`).value.trim(),r=document.getElementById(`inpFournisseur`).value.trim(),i=document.getElementById(`inpAdresse`).value.trim(),a=document.getElementById(`inpDate`).value,s=a.split(`/`),c=s.length===3?`${s[2]}-${s[1]}-${s[0]}`:a,l=document.getElementById(`inpPhoto`).files.length>0;if(!t||!r||!i||!c){j(`Remplissez tous les champs obligatoires.`);return}let u=_(c),{data:d,error:f}=await e.from(`bons_de_commande`).insert([{numero:u,fournisseur:r,description:i,status:`enregistre`,author_id:n.id,author_nom:t,date_po:c,items:{hasPhoto:l}}]).select().single();if(f){j(`Erreur lors de la sauvegarde : `+f.message);return}o.unshift(d),b(),document.getElementById(`btnGeneratePO`).style.display=`none`,document.getElementById(`displayNewPoNumber`).textContent=u,document.getElementById(`poResultZone`).style.display=`block`,S(`mine`)}function _(e){let t=new Date(e);return`PO-${String(t.getFullYear()).slice(-2)}${String(t.getMonth()+1).padStart(2,`0`)}${String(t.getDate()).padStart(2,`0`)}-${Math.floor(1e3+Math.random()*9e3)}`}function v(e){if(!e)return``;let t=e.split(`-`);return`${t[2]}/${t[1]}/${t[0]}`}function y(e){let r=document.getElementById(`poListContainer`);if(r){if(r.innerHTML=``,e.length===0){r.innerHTML=`<div style="color:#888;font-style:italic;padding:10px">Aucun bon de commande trouvé.</div>`,x();return}e.forEach(e=>{let i=e.items?.hasPhoto?`<span style="font-size:12px;color:var(--btn-green);display:flex;align-items:center;gap:4px">
                <svg width="14" height="14" style="stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Photo jointe</span>`:``,a=t(`delete_documents`)||e.author_id===n.id,o=document.createElement(`div`);o.className=`po-item`,o.innerHTML=`
            <div class="po-info">
                <div class="po-number">
                    ${e.numero}
                    <span class="status-badge">
                        <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        Enregistré
                    </span>
                </div>
                <div class="po-details">
                    <span>
                        <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <strong>${e.author_nom||`-`}</strong>
                    </span>
                    <span>
                        <svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/></svg>
                        ${e.fournisseur||`-`}
                    </span>
                    ${i}
                </div>
                <div class="po-subtext">
                    <span style="display:flex;align-items:center;gap:4px">
                        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        ${e.description||`-`}
                    </span>
                    <span style="display:flex;align-items:center;gap:4px;margin-left:10px">
                        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        ${v(e.date_po)}
                    </span>
                </div>
            </div>
            <div class="po-actions">
                <button class="btn-copy" data-copy="${e.numero}">
                    <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copier
                </button>
                ${a?`<button class="btn-delete" data-delete="${e.id}">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>`:``}
            </div>
        `,r.appendChild(o)}),r.querySelectorAll(`[data-copy]`).forEach(e=>{e.addEventListener(`click`,()=>k(e.dataset.copy,e))}),r.querySelectorAll(`[data-delete]`).forEach(e=>{e.addEventListener(`click`,()=>O(e.dataset.delete))}),x()}}function b(){let e=document.getElementById(`poSearch`)?.value.toLowerCase()||``,r=o;(!t(`view_all_po`)||a===`mine`)&&(r=o.filter(e=>e.author_id===n.id)),y(r.filter(t=>(t.numero||``).toLowerCase().includes(e)||(t.author_nom||``).toLowerCase().includes(e)||(t.fournisseur||``).toLowerCase().includes(e)||(t.description||``).toLowerCase().includes(e)||(t.date_po||``).toLowerCase().includes(e)||v(t.date_po).toLowerCase().includes(e)))}function x(){let e=document.getElementById(`poListContainer`),t=document.getElementById(`btn-charger-plus-po`);if(t&&t.remove(),!l||!e)return;let n=document.createElement(`button`);n.id=`btn-charger-plus-po`,n.textContent=`Charger ${c} bons de commande de plus...`,n.style.cssText=`width:100%;padding:14px;margin-top:10px;background:#2b2c36;color:#aaa;border:1px dashed #444;border-radius:10px;cursor:pointer;font-size:14px;font-weight:bold`,n.addEventListener(`click`,h),e.appendChild(n)}function S(e){a=e,document.getElementById(`tab-mine`).classList.toggle(`active`,e===`mine`),document.getElementById(`tab-all`).classList.toggle(`active`,e===`all`),m(!0)}var C=[`Deschênes`,`Wolseley`,`Plomberie Provinciale`];async function w(){let t=C;try{let{data:n}=await e.from(`parametres_globaux`).select(`valeur`).eq(`cle`,`fournisseurs_recurrents`).maybeSingle();if(n?.valeur){let e=JSON.parse(n.valeur);Array.isArray(e)&&e.length>0&&(t=e)}}catch{}let n=document.getElementById(`selFournisseur`);if(!n)return;n.innerHTML=`<option value="">-- Choisir un fournisseur --</option>`,t.forEach(e=>{let t=document.createElement(`option`);t.value=e,t.textContent=e,n.appendChild(t)});let r=document.createElement(`option`);r.value=`__autre__`,r.textContent=`Autre...`,n.appendChild(r)}function T(){let e=document.getElementById(`selFournisseur`),t=document.getElementById(`inpFournisseurAutre`),n=document.getElementById(`inpFournisseur`);e.value===`__autre__`?(t.style.display=`block`,t.focus(),n.value=t.value.trim()):(t.style.display=`none`,t.value=``,n.value=e.value)}function E(){document.getElementById(`inpPlombier`).value=i,document.getElementById(`selFournisseur`).value=``,document.getElementById(`inpFournisseurAutre`).value=``,document.getElementById(`inpFournisseurAutre`).style.display=`none`,document.getElementById(`inpFournisseur`).value=``,w(),document.getElementById(`inpAdresse`).value=``;let e=new Date,t=String(e.getDate()).padStart(2,`0`),n=String(e.getMonth()+1).padStart(2,`0`);document.getElementById(`inpDate`).value=`${t}/${n}/${e.getFullYear()}`,document.getElementById(`inpPhoto`).value=``,document.getElementById(`labelPhotoText`).textContent=`Ajouter une photo...`,document.getElementById(`poResultZone`).style.display=`none`,document.getElementById(`btnGeneratePO`).style.display=`flex`,document.getElementById(`poModal`).classList.add(`open`)}function D(){let e=document.getElementById(`inpPhoto`),t=document.getElementById(`labelPhotoText`),n=e.previousElementSibling;e.files&&e.files.length>0?(t.textContent=`Photo sélectionnée (${e.files[0].name})`,n.style.borderColor=`var(--btn-green)`,n.style.color=`var(--btn-green)`):(t.textContent=`Ajouter une photo...`,n.style.borderColor=`#888`,n.style.color=`#ccc`)}function O(t){u=t,document.getElementById(`confirmTitle`).textContent=`Supprimer`,document.getElementById(`confirmMsg`).textContent=`Effacer définitivement ce PO ?`,d=async()=>{let{error:t}=await e.from(`bons_de_commande`).delete().eq(`id`,u);if(t){j(`Erreur : `+t.message);return}o=o.filter(e=>e.id!==u),b()},document.getElementById(`confirmModal`).classList.add(`open`)}function k(e,t,n=!1){navigator.clipboard.writeText(e).then(()=>{let e=t.innerHTML,r=t.className;t.innerHTML=`<svg width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Copié !`,t.className=n?`btn-copy-large success`:`btn-copy success`,t.style.background=`var(--btn-green)`,t.style.color=`white`,setTimeout(()=>{t.innerHTML=e,t.className=r,t.style.background=``,t.style.color=``},2e3)})}function A(e){let t=e.value.replace(/[^0-9]/g,``);t.length>=3&&t.length<=4?t=t.slice(0,2)+`/`+t.slice(2):t.length>=5&&(t=t.slice(0,2)+`/`+t.slice(2,4)+`/`+t.slice(4,8)),e.value=t}function j(e){document.getElementById(`alertMsg`).textContent=e,document.getElementById(`alertModal`).classList.add(`open`)}function M(e){document.getElementById(e).classList.remove(`open`)}function N(){M(`confirmModal`),d=null,u=null}export{f as render};