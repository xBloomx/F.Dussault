import{t as e}from"./supabase-BHP_DPH_.js";import{r as t}from"./auth-BoJf8KxA.js";var n=``,r=[],i=`inbox`,a=null,o=null,s=null;async function c(e){return e.innerHTML=`
    <style>
        .courriel-main { display: flex; flex-direction: column; height: 100%; padding: 20px 30px; gap: 15px; overflow: hidden; }
        .dash-header { display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .btn-compose { background-color: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        .btn-compose:hover { background-color: var(--accent-hover); transform: translateY(-2px); }
        .btn-compose svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }

        .email-layout { display: flex; flex: 1; gap: 0; overflow: hidden; background: var(--bg-panel); border-radius: 15px; border: 1px solid var(--border); box-shadow: 0 5px 15px rgba(0,0,0,0.2); min-height: 0; position: relative; }
        .email-folders { width: 220px; background: #22232c; border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 20px 0; flex-shrink: 0; }
        .folder-item { padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; color: #aaa; cursor: pointer; transition: 0.2s; border-left: 4px solid transparent; font-weight: bold; font-size: 13px; }
        .folder-item:hover { background: #2b2c36; color: white; }
        .folder-item.active { background: #2b2c36; color: var(--accent); border-left-color: var(--accent); }
        .folder-item-left { display: flex; align-items: center; gap: 12px; }
        .folder-item svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .badge-unread { background: var(--btn-red); color: white; font-size: 11px; padding: 2px 6px; border-radius: 10px; font-weight: bold; }

        .email-list-col { width: 350px; border-right: 1px solid var(--border); display: flex; flex-direction: column; background: var(--bg-panel); flex-shrink: 0; overflow: hidden; }
        .email-toolbar { padding: 15px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .search-box { position: relative; }
        .search-box input { width: 100%; background: #1e1f26; border: 1px solid #444; color: white; padding: 10px 10px 10px 35px; border-radius: 8px; outline: none; box-sizing: border-box; }
        .search-box svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #888; width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .email-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
        .email-item { padding: 15px; border-bottom: 1px solid #333; cursor: pointer; transition: 0.2s; position: relative; border-left: 3px solid transparent; }
        .email-item:hover { background: #343542; }
        .email-item.active { background: #343542; border-left-color: var(--btn-blue); }
        .email-item.unread .email-subject, .email-item.unread .email-sender { font-weight: bold; color: white; }
        .email-item.unread::after { content: ''; position: absolute; top: 18px; right: 15px; width: 8px; height: 8px; background: var(--btn-blue); border-radius: 50%; }
        .email-sender { font-size: 14px; color: #ccc; margin-bottom: 5px; padding-right: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .email-subject { font-size: 13px; color: #aaa; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .email-preview-text { font-size: 12px; color: #777; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .email-date { font-size: 11px; color: #666; position: absolute; top: 15px; right: 15px; }

        .email-view-col { flex: 1; display: flex; flex-direction: column; background: var(--bg-dark); position: relative; overflow: hidden; }
        .empty-view { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; }
        .empty-view svg { width: 60px; height: 60px; margin-bottom: 15px; opacity: 0.5; stroke: currentColor; fill: none; stroke-width: 1; }
        .reading-pane { display: none; flex-direction: column; height: 100%; overflow: hidden; }
        .reading-toolbar { padding: 15px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; background: var(--bg-panel); flex-shrink: 0; }
        .reading-actions { display: flex; gap: 10px; margin-left: auto; }
        .btn-tool { background: transparent; border: 1px solid #444; color: #aaa; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .btn-tool:hover { background: #444; color: white; }
        .btn-tool svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .reading-header { padding: 25px 30px; border-bottom: 1px solid #333; flex-shrink: 0; }
        .reading-subject { font-size: 22px; color: white; margin: 0 0 15px 0; }
        .reading-meta { display: flex; justify-content: space-between; align-items: center; }
        .reading-sender-info { display: flex; align-items: center; gap: 12px; }
        .sender-avatar { width: 40px; height: 40px; background: var(--btn-blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 16px; }
        .sender-name { color: white; font-weight: bold; font-size: 15px; }
        .sender-email-addr { color: #888; font-size: 13px; }
        .reading-date { color: #888; font-size: 13px; }
        .reading-body { padding: 30px; flex: 1; overflow-y: auto; color: #ccc; line-height: 1.6; font-size: 15px; white-space: pre-wrap; }
        .reading-body a { color: var(--btn-blue); }
        .btn-mobile-back { display: flex; background: transparent; border: none; color: var(--accent); cursor: pointer; align-items: center; gap: 5px; font-weight: bold; padding: 0; margin-right: 15px; }
        .btn-mobile-back svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: none; z-index: 5000; justify-content: center; align-items: center; }
        .modal-overlay.open { display: flex; }
        .compose-card { background: var(--bg-panel); width: 90%; max-width: 600px; border-radius: 15px; border: 1px solid #555; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.5); }
        .compose-header { background: #22232c; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; }
        .compose-header h3 { margin: 0; color: white; font-size: 16px; }
        .btn-close { background: none; border: none; color: #888; font-size: 24px; cursor: pointer; line-height: 1; padding: 0; }
        .compose-body { padding: 20px; display: flex; flex-direction: column; gap: 15px; }
        .compose-field { display: flex; border-bottom: 1px solid #444; padding-bottom: 10px; align-items: center; }
        .compose-field label { width: 60px; color: #aaa; font-size: 14px; }
        .compose-field input { flex: 1; background: transparent; border: none; color: white; outline: none; font-size: 14px; }
        .compose-textarea { flex: 1; background: transparent; border: none; color: white; outline: none; font-size: 15px; min-height: 200px; resize: none; font-family: inherit; line-height: 1.5; margin-top: 10px; }
        .compose-footer { padding: 15px 20px; border-top: 1px solid #444; display: flex; justify-content: space-between; align-items: center; background: #22232c; }
        .btn-send { background: var(--btn-blue); color: white; border: none; padding: 10px 25px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
        .btn-send:hover { background: #2980b9; }
        .btn-send svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }

        @media (max-width: 900px) {
            .email-layout { flex-direction: column; gap: 0; }
            .email-folders { width: 100%; flex-direction: row; padding: 15px; border-right: none; border-bottom: 1px solid var(--border); background: var(--bg-panel); overflow-x: auto; -webkit-overflow-scrolling: touch; gap: 10px; scrollbar-width: none; }
            .email-folders::-webkit-scrollbar { display: none; }
            .folder-item { padding: 8px 16px; border-left: none !important; background: #1e1f26; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
            .folder-item.active { background: var(--accent); color: black; }
            .email-list-col { width: 100%; border-right: none; flex: 1; }
            .email-view-col { display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; }
            .show-reading .email-list-col { display: none; }
            .show-reading .email-folders { display: none; }
            .show-reading .email-view-col { display: flex; }
            .btn-compose { padding: 0; width: 44px; height: 44px; border-radius: 50%; justify-content: center; margin-right: 60px; flex-shrink: 0; }
            .btn-compose span { display: none; }
        }
    </style>

    <div class="courriel-main">
        <div class="dash-header">
            <div class="dash-title"><h1>Boîte Courriel</h1><p>Messagerie interne</p></div>
            <button class="btn-compose" id="btnCompose">
                <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span>Rédiger</span>
            </button>
        </div>

        <div class="email-layout" id="emailLayout">

            <div class="email-folders">
                <div class="folder-item active" data-folder="inbox">
                    <div class="folder-item-left">
                        <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>
                        Réception
                    </div>
                    <span class="badge-unread" id="unreadCount" style="display:none">0</span>
                </div>
                <div class="folder-item" data-folder="sent">
                    <div class="folder-item-left">
                        <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        Envoyés
                    </div>
                </div>
                <div class="folder-item" data-folder="trash">
                    <div class="folder-item-left">
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Corbeille
                    </div>
                </div>
            </div>

            <div class="email-list-col">
                <div class="email-toolbar">
                    <div class="search-box">
                        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input type="text" id="emailSearch" placeholder="Rechercher...">
                    </div>
                </div>
                <div class="email-list" id="emailList"></div>
            </div>

            <div class="email-view-col">
                <div class="empty-view" id="emptyView">
                    <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>
                    <p>Sélectionnez un message</p>
                </div>
                <div class="reading-pane" id="readingPane">
                    <div class="reading-toolbar">
                        <button class="btn-mobile-back" id="btnMobileBack">
                            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                            Retour
                        </button>
                        <div class="reading-actions">
                            <button class="btn-tool" id="btnReply" title="Répondre">
                                <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button class="btn-tool" id="btnDelete" title="Supprimer">
                                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </div>
                    <div class="reading-header">
                        <h2 class="reading-subject" id="readSubject">Sujet</h2>
                        <div class="reading-meta">
                            <div class="reading-sender-info">
                                <div class="sender-avatar" id="readAvatar">?</div>
                                <div>
                                    <div class="sender-name" id="readSender">Nom</div>
                                    <div class="sender-email-addr" id="readEmailAddress">email</div>
                                </div>
                            </div>
                            <div class="reading-date" id="readDate">Date</div>
                        </div>
                    </div>
                    <div class="reading-body" id="readBody"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal composition -->
    <div class="modal-overlay" id="composeModal">
        <div class="compose-card">
            <div class="compose-header">
                <h3>Nouveau message</h3>
                <button class="btn-close" id="btnCloseCompose">&times;</button>
            </div>
            <div class="compose-body">
                <div class="compose-field">
                    <label>À :</label>
                    <input type="email" id="composeTo" placeholder="adresse@exemple.com">
                </div>
                <div class="compose-field">
                    <label>Sujet :</label>
                    <input type="text" id="composeSubject" placeholder="Objet">
                </div>
                <textarea class="compose-textarea" id="composeBody" placeholder="Votre message..."></textarea>
            </div>
            <div class="compose-footer">
                <div></div>
                <button class="btn-send" id="btnSendEmail">
                    Envoyer
                    <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
            </div>
        </div>
    </div>

    <!-- Modal confirmation -->
    <div class="modal-overlay" id="confirmModal">
        <div style="background:#2b2c36;width:90%;max-width:350px;padding:25px;border-radius:15px;text-align:center;border:1px solid #555;box-shadow:0 10px 25px rgba(0,0,0,0.5)">
            <div style="font-size:20px;color:var(--btn-red);font-weight:bold;margin-bottom:15px">Confirmation</div>
            <div style="color:#e0e0e0;margin-bottom:25px;line-height:1.4" id="confirmMsg">Êtes-vous sûr ?</div>
            <div style="display:flex;justify-content:center;gap:10px">
                <button style="background:#444;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold" id="btnCancelConfirm">Annuler</button>
                <button style="background:var(--btn-red);color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold" id="btnYesConfirm">Supprimer</button>
            </div>
        </div>
    </div>
    `,await l(),u}async function l(){t&&(n=t.email.toLowerCase(),document.querySelectorAll(`.folder-item[data-folder]`).forEach(e=>{e.addEventListener(`click`,()=>m(e.dataset.folder,e))}),document.getElementById(`emailSearch`).addEventListener(`keyup`,()=>f()),document.getElementById(`btnCompose`).addEventListener(`click`,y),document.getElementById(`btnCloseCompose`).addEventListener(`click`,b),document.getElementById(`btnSendEmail`).addEventListener(`click`,g),document.getElementById(`btnMobileBack`).addEventListener(`click`,h),document.getElementById(`btnReply`).addEventListener(`click`,v),document.getElementById(`btnDelete`).addEventListener(`click`,_),document.getElementById(`btnCancelConfirm`).addEventListener(`click`,C),document.getElementById(`btnYesConfirm`).addEventListener(`click`,()=>{o&&o(),C()}),await d(),s=setInterval(d,3e4))}function u(){s&&clearInterval(s),s=null}async function d(){let{data:t,error:i}=await e.from(`courriels`).select(`*`).or(`destinataire.eq.${n},expediteur.eq.${n}`).order(`created_at`,{ascending:!1});if(i){console.error(`Erreur chargement courriels:`,i);return}r=(t||[]).map(e=>{let t=e.expediteur.toLowerCase()===n?`sent`:`inbox`,r=new Date(e.created_at),i=r.toLocaleDateString()+` `+r.getHours()+`:`+String(r.getMinutes()).padStart(2,`0`);return{id:e.id,folder:t,sender:e.expediteur,emailAddress:e.expediteur,subject:e.sujet||`(Sans objet)`,body:e.contenu||``,date:i,fullDate:i,unread:!e.est_lu&&t===`inbox`}}),f(),x()}function f(){let e=document.getElementById(`emailList`);if(!e)return;e.innerHTML=``;let t=document.getElementById(`emailSearch`)?.value.toLowerCase()||``,n=r.filter(e=>e.folder===i&&(e.subject.toLowerCase().includes(t)||e.sender.toLowerCase().includes(t)||e.body.toLowerCase().includes(t)));if(n.length===0){e.innerHTML=`<div style="padding:20px;text-align:center;color:#888">Vide</div>`;return}n.forEach(t=>{let n=document.createElement(`div`);n.className=`email-item ${t.id===a?`active`:``} ${t.unread?`unread`:``}`,n.innerHTML=`
            <div class="email-sender">${t.sender}</div>
            <div class="email-subject">${t.subject}</div>
            <div class="email-preview-text">${t.body.substring(0,50)}...</div>
            <div class="email-date">${t.date}</div>
        `,n.addEventListener(`click`,()=>p(t.id)),e.appendChild(n)})}async function p(t){a=t;let n=r.find(e=>e.id===t);n&&(n.unread&&n.folder===`inbox`&&(n.unread=!1,x(),await e.from(`courriels`).update({est_lu:!0}).eq(`id`,n.id)),f(),document.getElementById(`readSubject`).textContent=n.subject,document.getElementById(`readSender`).textContent=n.sender,document.getElementById(`readEmailAddress`).textContent=n.emailAddress,document.getElementById(`readDate`).textContent=n.fullDate,document.getElementById(`readBody`).innerHTML=n.body.replace(/(https?:\/\/[^\s]+)/g,`<a href="$1" target="_blank">$1</a>`),document.getElementById(`readAvatar`).textContent=n.sender.charAt(0).toUpperCase(),document.getElementById(`emptyView`).style.display=`none`,document.getElementById(`readingPane`).style.display=`flex`,document.getElementById(`emailLayout`).classList.add(`show-reading`))}function m(e,t){i=e,document.querySelectorAll(`.folder-item`).forEach(e=>e.classList.remove(`active`)),t&&t.classList.add(`active`),h()}function h(){document.getElementById(`emptyView`).style.display=`flex`,document.getElementById(`readingPane`).style.display=`none`,document.getElementById(`emailLayout`).classList.remove(`show-reading`),a=null,f()}async function g(){let t=document.getElementById(`composeTo`).value.trim().toLowerCase(),i=document.getElementById(`composeSubject`).value.trim(),a=document.getElementById(`composeBody`).value.trim();if(!t){alert(`Destinataire requis.`);return}let o=document.getElementById(`btnSendEmail`);o.disabled=!0,r.unshift({id:Date.now(),folder:`sent`,sender:`Moi`,emailAddress:t,subject:i,body:a,date:`À l'instant`,fullDate:`Aujourd'hui`,unread:!1}),f(),b();let{error:s}=await e.from(`courriels`).insert([{expediteur:n,destinataire:t,sujet:i,contenu:a,est_lu:!1}]);s?console.error(`Erreur envoi:`,s):await d(),o.disabled=!1}async function _(){let t=r.find(e=>e.id===a);t&&(t.folder===`trash`?S(`Supprimer définitivement ce courriel ?`,async()=>{let{error:t}=await e.from(`courriels`).delete().eq(`id`,a);if(t){console.error(`Erreur suppression:`,t);return}r=r.filter(e=>e.id!==a),h()}):(t.folder=`trash`,h()))}function v(){let e=r.find(e=>e.id===a);e&&(document.getElementById(`composeTo`).value=e.emailAddress,document.getElementById(`composeSubject`).value=`Re: `+e.subject,document.getElementById(`composeBody`).value=``),y()}function y(){document.getElementById(`composeModal`).classList.add(`open`),document.getElementById(`btnSendEmail`).disabled=!1}function b(){document.getElementById(`composeModal`).classList.remove(`open`)}function x(){let e=r.filter(e=>e.folder===`inbox`&&e.unread).length,t=document.getElementById(`unreadCount`);t&&(t.style.display=e>0?`inline-block`:`none`,t.textContent=e)}function S(e,t){document.getElementById(`confirmMsg`).textContent=e,o=t,document.getElementById(`confirmModal`).classList.add(`open`)}function C(){document.getElementById(`confirmModal`).classList.remove(`open`),o=null}export{c as render};