import{t as e}from"./supabase-BHP_DPH_.js";import{o as t,r as n}from"./auth-wlrJYOzK.js";var r=[],i=null,a,o,s,c;async function l(e){return e.innerHTML=`
    <style>
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }

        .profil-main {
            flex: 1; display: flex; flex-direction: column;
            padding: 30px; max-width: 1200px; margin: 0 auto; width: 100%;
            overflow-y: auto; min-height: 100%;
        }
        .dash-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px;
        }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; display: flex; align-items: center; gap: 10px; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .header-actions { display: flex; gap: 15px; flex-wrap: wrap; }

        .btn-main-save {
            background-color: var(--accent); color: black; border: none;
            padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 14px;
            cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s;
        }
        .btn-main-save:hover { background-color: var(--accent-hover); transform: translateY(-2px); }

        .btn-logout-header {
            background-color: transparent; color: var(--btn-red); border: 2px solid var(--btn-red);
            padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 14px;
            cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px;
        }
        .btn-logout-header:hover { background-color: var(--btn-red); color: white; }

        .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        .settings-card {
            background-color: var(--bg-panel); padding: 25px; border-radius: 15px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2); border: 1px solid #333;
            display: flex; flex-direction: column;
        }
        .card-header {
            display: flex; align-items: center; justify-content: space-between; gap: 10px;
            font-size: 18px; font-weight: bold; color: var(--accent);
            margin-bottom: 20px; border-bottom: 1px solid #444; padding-bottom: 10px;
        }
        .card-header-left { display: flex; align-items: center; gap: 10px; }
        .card-header svg { width: 20px; height: 20px; stroke: currentColor; fill: none; stroke-width: 2; }

        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; color: #aaa; margin-bottom: 8px; font-size: 13px; font-weight: bold; }
        .form-group input {
            width: 100%; padding: 12px 15px; background: #1a1b23; border: 1px solid #444;
            color: white; border-radius: 8px; font-size: 15px; outline: none; transition: 0.2s;
        }
        .form-group input:focus { border-color: var(--accent); }
        .form-row { display: flex; gap: 15px; }
        .form-row .form-group { flex: 1; }

        .signature-container {
            background: white; border-radius: 8px; border: 2px dashed #888;
            height: 180px; position: relative; margin-bottom: 10px; overflow: hidden;
        }
        #sig-canvas { width: 100%; height: 100%; cursor: crosshair; touch-action: none; }
        .sig-actions { display: flex; justify-content: space-between; align-items: center; }
        .btn-clear-sig { background: transparent; color: #aaa; border: none; font-size: 13px; cursor: pointer; text-decoration: underline; padding: 0; }
        .btn-clear-sig:hover { color: white; }

        .formation-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; max-height: 250px; overflow-y: auto; padding-right: 5px; }
        .formation-item { background: #1a1b23; border: 1px solid #444; border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 12px; }
        .form-thumb { width: 55px; height: 55px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 1px solid #555; background: #2b2c36; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #888; flex-shrink: 0; text-align: center;  transition: transform 0.2s; }
        .form-info { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .form-name { font-weight: bold; font-size: 15px; color: white; }
        .form-date { font-size: 12px; color: #aaa; }
        .form-status { font-size: 11px; font-weight: bold; padding: 3px 6px; border-radius: 4px; display: inline-block; width: fit-content; }
        .status-ok { background: rgba(40,167,69,0.2); color: var(--btn-green); border: 1px solid var(--btn-green); }
        .status-warn { background: rgba(255,193,7,0.2); color: #ffc107; border: 1px solid #ffc107; }
        .status-exp { background: rgba(255,77,77,0.2); color: var(--btn-red); border: 1px solid var(--btn-red); }

        .btn-add-small { background: #444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
        .btn-add-small:hover { background: #555; }
        .btn-add-small svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-del-small { background: transparent; color: var(--btn-red); border: none; cursor: pointer; flex-shrink: 0; padding: 5px; display: flex; }
        .btn-del-small svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }

        .img-upload-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; background: #323443; border: 1px dashed #888; color: #ccc; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: 0.2s; }
        .img-upload-btn svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .img-preview { width: 100%; max-height: 150px; object-fit: contain; border-radius: 8px; margin-top: 10px; display: none; border: 1px solid #555; }

        .btn-update-pwd { background: var(--btn-blue); color: white; border: none; padding: 12px 15px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; transition: 0.2s; width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px; }
        .btn-update-pwd svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-update-pwd:hover { opacity: 0.9; transform: translateY(-1px); }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; z-index: 4000; justify-content: center; align-items: center; }
        .modal-overlay.open { display: flex; }
        .modal-card-basic { background: var(--bg-panel); width: 90%; max-width: 400px; padding: 25px; border-radius: 15px; text-align: center; border: 1px solid #555; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-height: 90vh; overflow-y: auto; }
        .modal-actions { display: flex; justify-content: center; gap: 10px; margin-top: 20px; }
        .btn-modal-gray { background: #444; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
        .btn-modal-yellow { background: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; }
        .btn-modal-green { background: var(--btn-green); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; }

        @media (max-width: 768px) {
            .profil-main { padding: 15px; }
            .dash-header { flex-direction: column; align-items: flex-start; gap: 15px; }
            .header-actions { width: 100%; flex-direction: row; gap: 10px; }
            .btn-main-save { flex: 1; justify-content: center; }
            .btn-logout-header { width: 42px; height: 42px; justify-content: center; padding: 0; border-radius: 50%; background-color: var(--btn-red); border: none; color: white; }
            .btn-logout-header span { display: none; }
            .settings-grid { grid-template-columns: 1fr; }
            .form-row { flex-direction: column; gap: 0; }
        }
    </style>

    <div class="profil-main">
        <div class="dash-header">
            <div class="dash-title">
                <h1>Mon Profil</h1>
                <p>Gérez vos informations et votre sécurité</p>
            </div>
            <div class="header-actions">
                <button class="btn-main-save" id="btnSaveAll">
                    <svg viewBox="0 0 24 24" width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Sauvegarder
                </button>
                <button class="btn-logout-header" id="btnLogout">
                    <svg viewBox="0 0 24 24" width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    <span>Déconnexion</span>
                </button>
            </div>
        </div>

        <div class="settings-grid">

            <!-- Identité -->
            <div class="settings-card" style="border-color:var(--accent)">
                <div class="card-header" style="color:var(--accent)">
                    <div class="card-header-left">
                        <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Identité du Plombier
                    </div>
                </div>
                <p style="color:#aaa;font-size:13px;margin-top:0;margin-bottom:15px">Ces informations pré-rempliront automatiquement vos factures et soumissions.</p>
                <div class="form-group">
                    <label>Nom complet</label>
                    <input type="text" id="profName" placeholder="Ex: François Dussault">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Téléphone</label>
                        <input type="text" id="profPhone" placeholder="Ex: 514-555-0000">
                    </div>
                    <div class="form-group">
                        <label>Courriel de contact</label>
                        <input type="email" id="profEmail" placeholder="Ex: plombier@email.com">
                    </div>
                </div>
            </div>

            <!-- Signature -->
            <div class="settings-card" style="border-color:var(--btn-purple)">
                <div class="card-header" style="color:#9b59b6">
                    <div class="card-header-left">
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Ma Signature Officielle
                    </div>
                </div>
                <p style="color:#aaa;font-size:13px;margin-top:0;margin-bottom:15px">Dessinez votre signature. Elle sera apposée au bas de vos documents générés.</p>
                <div class="signature-container" style="border-color:var(--btn-purple)">
                    <canvas id="sig-canvas"></canvas>
                </div>
                <div class="sig-actions">
                    <span style="font-size:12px;color:#888">Tracez dans le cadre ci-dessus</span>
                    <button class="btn-clear-sig" id="btnClearSig">Effacer et recommencer</button>
                </div>
            </div>

            <!-- Certifications -->
            <div class="settings-card" style="border-color:var(--btn-green)">
                <div class="card-header" style="color:var(--btn-green)">
                    <div class="card-header-left">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                        Mes Certifications
                    </div>
                    <button class="btn-add-small" id="btnAddFormation">
                        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Ajouter
                    </button>
                </div>
                <p style="color:#aaa;font-size:13px;margin-top:0;margin-bottom:15px">Vos cartes de compétences s'afficheront dans le calendrier lors de leur expiration.</p>
                <div class="formation-list" id="formationList"></div>
            </div>

            <!-- Sécurité + Support -->
            <div style="display:flex;flex-direction:column;gap:20px">
                <div class="settings-card" style="border-color:var(--btn-blue)">
                    <div class="card-header" style="color:var(--btn-blue);border-bottom:none;margin-bottom:0">
                        <div class="card-header-left">
                            <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            Sécurité du compte
                        </div>
                    </div>
                    <div class="form-group" style="margin-top:15px;margin-bottom:10px">
                        <label>Ancien mot de passe</label>
                        <input type="password" id="oldPassword" placeholder="Mot de passe actuel">
                    </div>
                    <div class="form-group" style="margin-bottom:15px">
                        <label>Nouveau mot de passe</label>
                        <input type="password" id="newPassword" placeholder="Nouveau mot de passe (Min 6 car.)">
                    </div>
                    <button class="btn-update-pwd" id="btnUpdatePwd">
                        <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        Mettre à jour mon mot de passe
                    </button>
                </div>

                <div class="settings-card" style="border-color:var(--btn-orange);flex:1">
                    <div class="card-header" style="color:var(--btn-orange);border-bottom:none;margin-bottom:0">
                        <div class="card-header-left">
                            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg>
                            Support Technique
                        </div>
                    </div>
                    <p style="color:#aaa;font-size:13px;margin-top:10px;margin-bottom:15px">Un bug ? Une suggestion ? Envoyez un message direct au développeur système.</p>
                    <button class="btn-update-pwd" id="btnOpenTicket" style="background:var(--btn-orange);color:black">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
                        Signaler un problème
                    </button>
                </div>
            </div>

        </div>
    </div>

    <!-- Modal formation -->
    <div class="modal-overlay" id="formationModal">
        <div class="modal-card-basic" style="text-align:left">
            <div style="font-size:20px;color:var(--btn-green);font-weight:bold;margin-bottom:20px;display:flex;align-items:center;gap:8px">
                <svg width="20" height="20" style="stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                Nouvelle Carte
            </div>
            <div class="form-group">
                <label>Nom (Ex: ASP Construction...)</label>
                <input type="text" id="inpFormName">
            </div>
            <div class="form-group">
                <label>Date d'expiration</label>
                <input type="date" id="inpFormDate">
            </div>
            <div class="form-group">
                <label>Photo de la carte (Optionnel)</label>
                <label class="img-upload-btn" for="inpFormImage">
                    <svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    Photographier / Choisir...
                </label>
                <input type="file" id="inpFormImage" accept="image/*" style="display:none">
                <img id="formImagePreview" class="img-preview" src="">
            </div>
            <div class="modal-actions">
                <button class="btn-modal-gray" id="btnCancelFormation">Annuler</button>
                <button class="btn-modal-green" style="flex:1" id="btnSaveFormation">Enregistrer</button>
            </div>
        </div>
    </div>

    <!-- Modal image viewer -->
    <div class="modal-overlay" id="imageViewerModal">
        <div style="max-width:90%;max-height:90%">
            <img id="fullSizeImage" src="" style="max-width:100%;max-height:80vh;border-radius:12px;border:2px solid #555">
            <div style="margin-top:15px;text-align:center">
                <button class="btn-modal-gray" id="btnCloseViewer">Fermer</button>
            </div>
        </div>
    </div>

    <!-- Modal ticket -->
    <div class="modal-overlay" id="ticketModal">
        <div class="modal-card-basic">
            <div style="font-size:20px;color:var(--btn-orange);font-weight:bold;margin-bottom:15px;display:flex;align-items:center;justify-content:center;gap:8px">
                Signaler un problème
            </div>
            <p style="color:#ccc;font-size:13px;margin-bottom:15px;line-height:1.4">Décrivez précisément le bug rencontré ou votre suggestion.</p>
            <div class="form-group">
                <textarea id="ticketMessage" placeholder="Expliquez le problème ici..." style="width:100%;height:120px;background:#1e1f26;border:1px solid #555;color:white;padding:10px;border-radius:8px;font-family:sans-serif;outline:none;resize:none"></textarea>
            </div>
            <div class="modal-actions">
                <button class="btn-modal-gray" id="btnCancelTicket">Annuler</button>
                <button class="btn-modal-yellow" style="flex:1;background:var(--btn-orange)" id="btnSendTicket">Envoyer</button>
            </div>
        </div>
    </div>

    <!-- Modal alerte -->
    <div class="modal-overlay" id="alertModal">
        <div class="modal-card-basic">
            <div style="font-size:20px;color:var(--accent);font-weight:bold;margin-bottom:15px">Information</div>
            <div style="color:#e0e0e0;margin-bottom:25px;line-height:1.4" id="alertMsg"></div>
            <div class="modal-actions">
                <button class="btn-modal-yellow" id="btnCloseAlert">Compris</button>
            </div>
        </div>
    </div>
    `,await u()}async function u(){a=document.getElementById(`sig-canvas`),o=a.getContext(`2d`),s=!1,c=!1;let e=d();return document.getElementById(`btnLogout`).addEventListener(`click`,t),document.getElementById(`btnSaveAll`).addEventListener(`click`,m),document.getElementById(`btnClearSig`).addEventListener(`click`,f),document.getElementById(`btnAddFormation`).addEventListener(`click`,_),document.getElementById(`btnCancelFormation`).addEventListener(`click`,()=>w(`formationModal`)),document.getElementById(`btnSaveFormation`).addEventListener(`click`,y),document.getElementById(`inpFormImage`).addEventListener(`change`,v),document.getElementById(`btnCloseViewer`).addEventListener(`click`,()=>w(`imageViewerModal`)),document.getElementById(`btnOpenTicket`).addEventListener(`click`,()=>{document.getElementById(`ticketMessage`).value=``,document.getElementById(`ticketModal`).classList.add(`open`)}),document.getElementById(`btnCancelTicket`).addEventListener(`click`,()=>w(`ticketModal`)),document.getElementById(`btnSendTicket`).addEventListener(`click`,S),document.getElementById(`btnUpdatePwd`).addEventListener(`click`,h),document.getElementById(`btnCloseAlert`).addEventListener(`click`,()=>w(`alertModal`)),await p(),e}function d(){function e(){let e=Math.max(window.devicePixelRatio||1,1);a.width=a.offsetWidth*e,a.height=a.offsetHeight*e,o.scale(e,e),o.lineWidth=3,o.lineCap=`round`,o.strokeStyle=`#000`}let t=e=>{if(!s)return;let t=r(e);o.lineTo(t.x,t.y),o.stroke()},n=()=>{s=!1};setTimeout(e,100),window.addEventListener(`resize`,e);function r(e){let t=a.getBoundingClientRect();return{x:(e.touches?e.touches[0].clientX:e.clientX)-t.left,y:(e.touches?e.touches[0].clientY:e.clientY)-t.top}}return a.addEventListener(`mousedown`,e=>{s=!0,c=!0,o.beginPath();let t=r(e);o.moveTo(t.x,t.y)}),window.addEventListener(`mousemove`,t),window.addEventListener(`mouseup`,n),a.addEventListener(`touchstart`,e=>{s=!0,c=!0,o.beginPath();let t=r(e);o.moveTo(t.x,t.y),e.preventDefault()},{passive:!1}),a.addEventListener(`touchmove`,e=>{if(!s)return;let t=r(e);o.lineTo(t.x,t.y),o.stroke(),e.preventDefault()},{passive:!1}),a.addEventListener(`touchend`,()=>{s=!1}),function(){window.removeEventListener(`resize`,e),window.removeEventListener(`mousemove`,t),window.removeEventListener(`mouseup`,n)}}function f(){o.clearRect(0,0,a.width,a.height),c=!1}async function p(){if(n)try{let{data:t}=await e.from(`profils`).select(`prenom_nom, telephone, courriel, signature_base64`).eq(`id`,n.id).maybeSingle();if(t&&(document.getElementById(`profName`).value=t.prenom_nom||``,document.getElementById(`profPhone`).value=t.telephone||``,document.getElementById(`profEmail`).value=t.courriel||``,t.signature_base64)){let e=new Image;e.onload=()=>{o.drawImage(e,0,0,a.offsetWidth,a.offsetHeight),c=!0},e.src=t.signature_base64}let{data:i}=await e.from(`formations`).select(`*`).eq(`user_id`,n.id).order(`date_expiration`,{ascending:!0});r=(i||[]).map(e=>({id:e.id,name:e.nom,dateExp:e.date_expiration,image:e.image_base64})),g()}catch(e){console.error(`Erreur chargement profil:`,e)}}async function m(){let t=document.getElementById(`btnSaveAll`);t.disabled=!0,t.textContent=`Sauvegarde...`;try{let{error:t}=await e.from(`profils`).update({prenom_nom:document.getElementById(`profName`).value.trim(),telephone:document.getElementById(`profPhone`).value.trim(),courriel:document.getElementById(`profEmail`).value.trim(),signature_base64:c?a.toDataURL():null}).eq(`id`,n.id);if(t)throw t;C(`✅ Votre identité et signature ont été sauvegardées !`)}catch(e){C(`❌ Erreur de sauvegarde : `+e.message)}finally{t.disabled=!1,t.textContent=`Sauvegarder`}}async function h(){let t=document.getElementById(`oldPassword`).value,r=document.getElementById(`newPassword`).value;if(!t||!r)return C(`Veuillez remplir les deux champs.`);if(r.length<6)return C(`Le nouveau mot de passe doit contenir au moins 6 caractères.`);let{error:i}=await e.auth.signInWithPassword({email:n.email,password:t});if(i)return C(`L'ancien mot de passe est incorrect.`);let{error:a}=await e.auth.updateUser({password:r});if(a){C(`Erreur : `+a.message);return}document.getElementById(`oldPassword`).value=``,document.getElementById(`newPassword`).value=``,C(`✅ Mot de passe mis à jour avec succès !`)}function g(){let e=document.getElementById(`formationList`);if(e){if(e.innerHTML=``,r.length===0){e.innerHTML=`<div style="color:#888;font-style:italic;font-size:13px;text-align:center;padding:20px">Aucune carte ou certification enregistrée.</div>`;return}r.sort((e,t)=>new Date(e.dateExp)-new Date(t.dateExp)),r.forEach(t=>{let n=new Date,r=new Date(t.dateExp),i=Math.ceil((r-n)/(1e3*60*60*24)),a=`status-ok`,o=`Valide`;i<0?(a=`status-exp`,o=`Expiré`):i<=30&&(a=`status-warn`,o=`Expire dans ${i} j.`);let s=t.dateExp.split(`-`),c=`${s[2]}/${s[1]}/${s[0]}`,l=t.image?`<img class="form-thumb" src="${t.image}" data-view-id="${t.id}" style="cursor:pointer">`:`<div class="form-thumb">Pas<br>de photo</div>`,u=document.createElement(`div`);u.className=`formation-item`,u.innerHTML=`
            ${l}
            <div class="form-info">
                <div class="form-name">${t.name}</div>
                <div class="form-date">Exp: ${c}</div>
                <div class="form-status ${a}">${o}</div>
            </div>
            <button class="btn-del-small" data-del-id="${t.id}">
                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
        `,e.appendChild(u)}),e.querySelectorAll(`[data-del-id]`).forEach(e=>{e.addEventListener(`click`,()=>b(e.dataset.delId))}),e.querySelectorAll(`[data-view-id]`).forEach(e=>{e.addEventListener(`click`,()=>x(e.dataset.viewId))})}}function _(){document.getElementById(`inpFormName`).value=``,document.getElementById(`inpFormDate`).value=``,document.getElementById(`inpFormImage`).value=``,document.getElementById(`formImagePreview`).style.display=`none`,i=null,document.getElementById(`formationModal`).classList.add(`open`)}function v(e){let t=e.target.files[0];if(!t)return;let n=new FileReader;n.onload=e=>{let t=new Image;t.onload=()=>{let e=t.width,n=t.height;e>n?e>800&&(n*=800/e,e=800):n>800&&(e*=800/n,n=800);let r=document.createElement(`canvas`);r.width=e,r.height=n,r.getContext(`2d`).drawImage(t,0,0,e,n),i=r.toDataURL(`image/jpeg`,.7);let a=document.getElementById(`formImagePreview`);a.src=i,a.style.display=`block`},t.src=e.target.result},n.readAsDataURL(t)}async function y(){let t=document.getElementById(`inpFormName`).value.trim(),a=document.getElementById(`inpFormDate`).value;if(!t||!a){C(`Veuillez remplir le nom et la date d'expiration.`);return}let{data:o,error:s}=await e.from(`formations`).insert([{user_id:n.id,nom:t,date_expiration:a,image_base64:i}]).select().single();if(s){C(`❌ Erreur : `+s.message);return}r.push({id:o.id,name:o.nom,dateExp:o.date_expiration,image:o.image_base64}),g(),w(`formationModal`),window.dispatchEvent(new CustomEvent(`formations_updated`))}async function b(t){let{error:n}=await e.from(`formations`).delete().eq(`id`,t);if(n){C(`❌ Erreur suppression : `+n.message);return}r=r.filter(e=>e.id!==t),g(),window.dispatchEvent(new CustomEvent(`formations_updated`))}function x(e){let t=r.find(t=>t.id===e);t?.image&&(document.getElementById(`fullSizeImage`).src=t.image,document.getElementById(`imageViewerModal`).classList.add(`open`))}async function S(){let t=document.getElementById(`ticketMessage`).value.trim();if(!t){C(`Veuillez inscrire un message avant d'envoyer.`);return}let{error:r}=await e.from(`tickets_support`).insert([{author_id:n.id,author_nom:document.getElementById(`profName`).value||`Employé Anonyme`,message:t,statut:`ouvert`}]);if(r){C(`❌ Erreur d'envoi : `+r.message);return}document.getElementById(`ticketMessage`).value=``,w(`ticketModal`),C(`✅ Message envoyé au bureau avec succès !`)}function C(e){document.getElementById(`alertMsg`).textContent=e,document.getElementById(`alertModal`).classList.add(`open`)}function w(e){document.getElementById(e).classList.remove(`open`)}export{l as render};