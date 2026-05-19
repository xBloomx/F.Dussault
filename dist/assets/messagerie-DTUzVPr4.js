import{t as e}from"./supabase-BHP_DPH_.js";import{r as t,t as n}from"./auth-wlrJYOzK.js";import{t as r}from"./sanitize-CY3yUbkZ.js";function i(e){if(!e||typeof e!=`string`)return`#`;try{let t=new URL(e);return[`https:`,`http:`].includes(t.protocol)?e:`#`}catch{return`#`}}var a=``,o=`Moi`,s=new Set,c=[],l=[],u=null,d=null,f=null,p=!1,m=0,h=null,g=null,_=null,v=null,y=null,b=null,x=(()=>{try{return JSON.parse(localStorage.getItem(`dussault_quick_reacts`))||[`❤️`,`👍`,`😂`,`😮`,`😢`,`🙏`]}catch{return[`❤️`,`👍`,`😂`,`😮`,`😢`,`🙏`]}})(),S={global:{name:`Équipe (Général)`,isGroup:!0,messages:[]}},C=40,w=140,T=80,ee=500;async function te(e){return a=t?.id||``,o=n?.prenom_nom||t?.email?.split(`@`)[0]||`Moi`,e.innerHTML=`
    <style>
        .msg-main { font-family: 'Segoe UI', Arial, sans-serif; background: var(--bg-dark); color: var(--text-main); height: 100%; display: flex; flex-direction: column; overflow: hidden; }
        #view-dashboard { padding: 30px; height: 100%; overflow: hidden; display: flex; gap: 20px; }
        .chat-sidebar { width: 380px; background: var(--bg-panel); border-radius: 15px; display: flex; flex-direction: column; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border: 1px solid var(--border-color); overflow: hidden; }
        .sidebar-header { padding: 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
        .sidebar-header h1 { margin: 0; font-size: 24px; color: white; }
        .sidebar-header p { margin: 5px 0 0; color: #aaa; font-size: 13px; }
        .btn-new-chat { background: var(--accent); color: black; border: none; width: 38px; height: 38px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.2);}
        .btn-new-chat svg { width: 20px; height: 20px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-new-chat:hover { transform: scale(1.1); background: #ffd66b; }
        .sidebar-footer { padding: 15px 20px; border-top: none; display: flex; gap: 15px; align-items: center; background: var(--bg-panel); z-index: 10; }
        .sidebar-footer .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input { width: 100%; background: var(--bg-dark); border: 1px solid #444; color: white; padding: 14px 15px 14px 45px; border-radius: 8px; font-size: 16px; outline: none; transition: 0.2s;}
        .search-box input:focus { border-color: var(--accent); }
        .search-icon { position: absolute; left: 15px; color: #888; pointer-events: none; display: flex; align-items: center; }
        .search-icon svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .contact-list { flex: 1; overflow-y: auto; padding: 10px 0; }
        .contact-wrapper { position: relative; background: var(--btn-red); overflow: hidden; border-bottom: 1px solid var(--border-color); }
        .contact-wrapper:last-child { border-bottom: none; }
        .delete-btn-bg { position: absolute; top: 0; right: 0; bottom: 0; width: 80px; display: flex; align-items: center; justify-content: center; color: white; z-index: 1; cursor: pointer; background: var(--btn-red); }
        .delete-btn-bg svg { width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 2; }
        .contact-item { display: flex; align-items: center; padding: 15px 20px; cursor: pointer; border-left: 4px solid transparent; background: var(--bg-panel); position: relative; z-index: 2; transition: background 0.2s, transform 0.3s ease; user-select: none; -webkit-user-select: none; touch-action: pan-y; }
        .contact-item.swiping { transition: none; }
        .contact-item.swiped { transform: translateX(-80px); }
        .contact-item:hover { background: #343542; }
        .contact-item.active { background: #3a3b46; border-left-color: var(--accent); }
        .avatar { width: 45px; height: 45px; border-radius: 50%; background: #444; color: white; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 18px; margin-right: 15px; flex-shrink: 0; }
        .avatar-group { background: var(--accent); color: black; }
        .avatar-group svg { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 2; }
        .contact-info { flex: 1; min-width: 0; }
        .contact-name { font-weight: bold; color: white; font-size: 15px; display: flex; justify-content: space-between; margin-bottom: 4px; pointer-events: none; }
        .contact-time { font-size: 11px; color: #888; font-weight: normal; }
        .contact-last-msg { font-size: 13px; color: #aaa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
        .chat-main { flex: 1; background: var(--bg-panel); border-radius: 15px; display: flex; flex-direction: column; border: 1px solid var(--border-color); overflow: hidden; }
        .chat-header { padding: 15px 20px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; background: #2e2f3a; }
        .chat-header h2 { margin: 0; font-size: 18px; color: white; }
        .btn-back { display: none; background: transparent; border: none; color: var(--accent); cursor: pointer; padding-right: 15px; padding-left: 0; }
        .btn-back svg { width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 2; }
        .messages-container { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; background: var(--bg-dark); }
        .message-wrapper { display: flex; flex-direction: column; max-width: 75%; }
        .message-wrapper.received { align-self: flex-start; }
        .message-wrapper.sent { align-self: flex-end; align-items: flex-end; }
        .message-sender { font-size: 11px; color: #888; margin-bottom: 5px; margin-left: 5px; }
        .sent .message-sender { display: none; }
        .message-content-row { display: flex; align-items: center; gap: 8px; position: relative; }
        .sent .message-content-row { flex-direction: row-reverse; }
        .message-bubble { padding: 12px 16px; border-radius: 15px; font-size: 14px; line-height: 1.4; position: relative; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
        .received .message-bubble { background: var(--bg-panel); color: var(--text-main); border-top-left-radius: 2px; border: 1px solid #444; }
        .sent .message-bubble { background: var(--accent); color: black; border-top-right-radius: 2px; font-weight: 500; }
        .bubble-image { padding: 3px; overflow: hidden; line-height: 0; position: relative; }
        .bubble-image img { max-width: 100%; max-height: 300px; border-radius: 12px; cursor: pointer; transition: 0.2s;}
        .bubble-file { padding: 10px; display: flex; align-items: center; gap: 12px; text-decoration: none; min-width: 200px; position: relative; }
        .received .bubble-file { color: var(--text-main); }
        .sent .bubble-file { color: black; }
        .file-icon svg, .file-download-icon svg { width: 100%; height: 100%; stroke: currentColor; fill: none; stroke-width: 2; }
        .file-icon { width: 28px; height: 28px; }
        .file-download-icon { width: 18px; height: 18px; opacity: 0.7; }
        .file-meta { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .file-name { font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .file-size { font-size: 11px; opacity: 0.8; }
        .message-time { font-size: 10px; opacity: 0.7; margin-top: 5px; text-align: right; display: block; }
        .sent .message-time { color: #333; }
        .bubble-image .message-time, .bubble-file .message-time { position: absolute; bottom: 8px; right: 10px; background: rgba(0,0,0,0.5); color: white; padding: 2px 5px; border-radius: 4px; }
        .msg-react-btn { background: transparent; border: none; color: #888; cursor: pointer; padding: 5px; border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0; transition: all 0.2s; flex-shrink: 0; }
        .message-content-row:hover .msg-react-btn { opacity: 1; }
        .msg-react-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .msg-reaction-badge { position: absolute; bottom: -12px; right: 15px; background: var(--bg-panel); border: 1px solid #444; border-radius: 15px; padding: 2px 6px; font-size: 14px; box-shadow: 0 2px 5px rgba(0,0,0,0.5); z-index: 5; cursor: pointer; user-select: none; transition: 0.2s;}
        .received .msg-reaction-badge { right: auto; left: 15px; transition: 0.2s;}
        .reaction-picker { position: fixed; background: #323340; border: 1px solid #555; border-radius: 30px; padding: 8px 15px; display: none; gap: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 200; align-items: center; }
        /* ── Bottom sheet emoji fullpicker ───────────────────────────── */
        .bottom-sheet-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; z-index: 6000; align-items: flex-end; justify-content: center; }
        .bottom-sheet-card { background: var(--card-bg); width: 100%; max-width: 500px; border-radius: 20px 20px 0 0; padding: 20px; box-shadow: 0 -10px 30px rgba(0,0,0,0.5); border-top: 1px solid #444; display: flex; flex-direction: column; animation: slideUp 0.3s ease-out; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .top-quick-reactions { display: flex; justify-content: space-between; align-items: center; background: #1a1b23; padding: 10px 15px; border-radius: 12px; margin-bottom: 15px; }
        .top-react-slot { font-size: 24px; padding: 8px; border-radius: 50%; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; width: 45px; height: 45px; background: transparent; border: 2px solid transparent; user-select: none; }
        .top-react-slot:hover { background: rgba(255,255,255,0.1); transform: scale(1.1); }
        .top-react-slot.active-slot { border-color: var(--btn-yellow); background: rgba(252,202,70,0.1); transform: scale(1.1); }
        emoji-picker { --background: transparent; --border-color: transparent; --text-color: #fff; --category-icon-color: #aaa; --category-icon-active-color: var(--btn-yellow); --indicator-color: var(--btn-yellow); --input-border-color: #555; width: 100%; height: 350px; }
        .reaction-list { display: flex; gap: 10px; }
        .reaction-list span { cursor: pointer; font-size: 22px; transition: transform 0.2s; display: block; user-select: none; }
        .reaction-list span:hover { transform: scale(1.4) translateY(-3px); }
        .reaction-divider { width: 1px; background: #555; margin: 0 5px; align-self: stretch; }
        .react-tool-btn { background: transparent; border: none; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; color: #aaa; }
        .react-tool-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .react-tool-btn:hover { background: #444; color: white; }
        .chat-input-container { border-top: 1px solid var(--border-color); background: var(--bg-panel); display: flex; flex-direction: column; position: relative; }
        .attach-menu-popup { position: absolute; bottom: 75px; left: 15px; background: rgba(43,44,54,0.95); backdrop-filter: blur(10px); border: 1px solid #444; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); padding: 5px; width: 220px; transform: translateY(10px); opacity: 0; pointer-events: none; transition: 0.2s; z-index: 100; }
        .attach-menu-popup.show { transform: translateY(0); opacity: 1; pointer-events: auto; }
        .attach-option { background: transparent; border: none; color: white; padding: 12px 15px; text-align: left; font-size: 15px; display: flex; align-items: center; gap: 15px; cursor: pointer; border-radius: 10px; transition: 0.2s; }
        .attach-option:hover { background: #3a3b46; }
        .attach-icon { width: 22px; height: 22px; color: var(--accent); display: flex; align-items: center; justify-content: center; }
        .attach-icon svg { width: 100%; height: 100%; stroke: currentColor; fill: none; stroke-width: 2; }
        .chat-input-area { padding: 15px 20px; display: flex; align-items: center; gap: 10px; }
        .btn-attach { background: transparent; border: none; color: #888; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; padding: 0; flex-shrink: 0; }
        .btn-attach:hover, .btn-attach.active { color: var(--accent); transform: scale(1.1);}
        .btn-attach svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .message-input { flex: 1; background: var(--bg-dark); border: 1px solid var(--border); color: white; padding: 14px 20px; border-radius: 25px; font-size: 14px; outline: none; transition: 0.2s; min-width: 0; }
        .message-input:focus { border-color: var(--accent); }
        .btn-send-msg { background: var(--accent); color: black; border: none; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: 0.2s; flex-shrink: 0; }
        .btn-send-msg svg { width: 20px; height: 20px; stroke: currentColor; fill: none; stroke-width: 2.5; margin-left: -2px; }
        .btn-send-msg:hover { background: #ffd66b; transform: scale(1.1); }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; z-index: 5000; justify-content: center; align-items: center; }
        .modal-overlay.open { display: flex; }
        .new-chat-card { background: var(--bg-panel); width: 90%; max-width: 450px; border-radius: 20px; border: 1px solid var(--border); box-shadow: 0 15px 35px rgba(0,0,0,0.5); display: flex; flex-direction: column; max-height: 85vh; overflow: hidden; }
        .new-chat-header { padding: 20px; border-bottom: 1px solid #333; display: flex; align-items: center; justify-content: space-between; background: #2e2f3a; }
        .new-chat-header h3 { margin: 0; color: white; font-size: 18px; }
        .new-chat-body { padding: 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 15px; }
        #groupNameGroup { transition: max-height 0.3s ease, opacity 0.3s ease; max-height: 0; opacity: 0; overflow: hidden; }
        #groupNameGroup.show { max-height: 100px; opacity: 1; }
        .new-chat-input { width: 100%; padding: 12px 15px; background: #1e1f26; border: 1px solid #555; color: white; border-radius: 10px; font-size: 14px; outline: none; box-sizing: border-box; transition: 0.2s;}
        .new-chat-input:focus { border-color: var(--accent); }
        .new-chat-label { display: block; color: #aaa; margin-bottom: 8px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        #newChatUserList { max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 5px; }
        .user-select-row { display: flex; align-items: center; gap: 12px; padding: 10px 15px; cursor: pointer; transition: 0.2s; border-radius: 10px; border: 1px solid #444; background: #22232c; }
        .user-select-row:hover { background: #2b2c36; border-color: #666; }
        .user-select-row.selected { background: rgba(252,202,70,0.05); border-color: var(--accent); }
        .user-select-row input[type="checkbox"] { display: none; }
        .user-info { display: flex; align-items: center; gap: 12px; flex: 1; }
        .user-select-name { font-size: 14px; color: white; font-weight: bold; }
        .custom-checkbox { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #555; display: block; transition: 0.2s; margin-left: auto; background: transparent; flex-shrink: 0; }
        .user-select-row.selected .custom-checkbox { background: var(--accent); border-color: var(--accent); }
        .new-chat-footer { padding: 20px; border-top: 1px solid #333; background: var(--bg-panel); display: flex; gap: 15px; justify-content: flex-end; }
        .btn-modal-gray { background: #444; color: white; border: none; padding: 12px 20px; border-radius: 10px; cursor: pointer; font-weight: bold; transition: 0.2s;}
        .btn-modal-gray:hover { background: #555; }
        .btn-modal-green { background: var(--btn-green); color: white; border: none; padding: 12px 30px; border-radius: 10px; cursor: pointer; font-weight: bold; transition: 0.2s;}
        .btn-modal-yellow { background: var(--accent); color: black; border: none; padding: 12px 20px; border-radius: 10px; cursor: pointer; font-weight: bold; width: 100%; }
        .btn-modal-red { background: var(--btn-red); color: white; border: none; padding: 12px 20px; border-radius: 10px; cursor: pointer; font-weight: bold; }
        .modal-card-basic { background: var(--bg-panel); width: 90%; max-width: 400px; padding: 25px; border-radius: 15px; text-align: center; border: 1px solid #555; box-shadow: 0 10px 25px rgba(0,0,0,0.5);}
        .attachment-preview { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 20px 0; }
        .attachment-preview:empty { display: none; }
        .preview-item { position: relative; }
        .preview-item img { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; }
        .preview-item-file { background: #333; padding: 5px 10px; border-radius: 8px; font-size: 12px; color: white; display: flex; align-items: center; gap: 5px; }
        .remove-attachment { position: absolute; top: -5px; right: -5px; background: var(--btn-red); color: white; border: none; border-radius: 50%; width: 18px; height: 18px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        @media (max-width: 900px) {
            #view-dashboard { padding: 15px; gap: 0; }
            .chat-sidebar { width: 100%; border-radius: 12px; flex: 1; }
            .chat-main { display: none; width: 100%; border-radius: 12px; flex: 1; }
            #view-dashboard.show-chat .chat-sidebar { display: none; }
            #view-dashboard.show-chat .chat-main { display: flex; }
            .btn-back { display: flex; }
            .message-wrapper { max-width: 85%; }
            .msg-react-btn { opacity: 1; }
        }
    </style>

    <svg style="display:none">
        <symbol id="msg-users" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></symbol>
        <symbol id="msg-paperclip" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></symbol>
        <symbol id="msg-camera" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></symbol>
        <symbol id="msg-image" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></symbol>
        <symbol id="msg-file" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="13 2 13 9 20 9"/></symbol>
        <symbol id="msg-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></symbol>
        <symbol id="msg-back" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></symbol>
        <symbol id="msg-download" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></symbol>
        <symbol id="msg-smile" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></symbol>
        <symbol id="msg-plus" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></symbol>
        <symbol id="msg-edit" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></symbol>
        <symbol id="msg-trash" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></symbol>
        <symbol id="msg-send" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></symbol>
    </svg>

    <div class="msg-main">
        <div id="view-dashboard">
            <aside class="chat-sidebar">
                <div class="sidebar-header">
                    <div><h1>Messagerie</h1><p>F.Dussault</p></div>
                </div>
                <div class="contact-list" id="contactListContainer"></div>
                <div class="sidebar-footer">
                    <div class="search-box">
                        <span class="search-icon"><svg><use href="#msg-search"/></svg></span>
                        <input type="text" id="searchContactInput" placeholder="Rechercher...">
                    </div>
                    <button class="btn-new-chat" id="btnNewChat" title="Nouvelle discussion">
                        <svg><use href="#msg-plus"/></svg>
                    </button>
                </div>
            </aside>

            <main class="chat-main">
                <header class="chat-header">
                    <button class="btn-back" id="btnBack"><svg><use href="#msg-back"/></svg></button>
                    <div id="chatHeaderAvatar" class="avatar" style="width:40px;height:40px;font-size:15px;margin-right:10px"></div>
                    <div><h2 id="chatHeaderName">Sélectionnez une discussion</h2></div>
                </header>
                <div class="messages-container" id="chatMessages">
                    <div style="text-align:center;color:#888;font-style:italic;margin-top:50px">Aucune conversation sélectionnée.</div>
                </div>
                <div class="chat-input-container">
                    <div class="attach-menu-popup" id="attachMenu">
                        <button class="attach-option" id="attachCamera"><div class="attach-icon"><svg><use href="#msg-camera"/></svg></div> Appareil photo</button>
                        <button class="attach-option" id="attachGallery"><div class="attach-icon"><svg><use href="#msg-image"/></svg></div> Galerie photos</button>
                        <button class="attach-option" id="attachFile"><div class="attach-icon"><svg><use href="#msg-file"/></svg></div> Document</button>
                    </div>
                    <input type="file" id="inputCamera" accept="image/*" capture="environment" hidden>
                    <input type="file" id="inputGallery" accept="image/*,video/*" multiple hidden>
                    <input type="file" id="inputFile" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" multiple hidden>
                    <div class="attachment-preview" id="attachmentPreview"></div>
                    <div class="chat-input-area">
                        <button class="btn-attach" id="attachBtn">
                            <svg><use href="#msg-paperclip"/></svg>
                        </button>
                        <input type="text" class="message-input" placeholder="Écrire un message..." id="messageInput" autocomplete="off">
                        <button class="btn-send-msg" id="btnSendMsg">
                            <svg><use href="#msg-send"/></svg>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <!-- Reaction picker -->
    <div id="reactionPicker" class="reaction-picker">
        <div id="quickReactionsList" class="reaction-list"></div>
        <div class="reaction-divider"></div>
        <button class="react-tool-btn" id="btnMoreEmoji" title="Plus d'emojis">
            <svg><use href="#msg-plus"/></svg>
        </button>
    </div>

    <!-- Modal fullPicker emoji (bottom sheet) -->
    <div class="bottom-sheet-modal" id="fullPickerModal">
        <div class="bottom-sheet-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
                <b style="color:white;font-size:16px">Réactions</b>
                <div style="display:flex;gap:15px;align-items:center">
                    <button id="btnToggleCustomize" style="background:none;border:none;color:var(--btn-blue);font-weight:bold;font-size:14px;cursor:pointer;padding:0">Personnaliser</button>
                    <button id="btnCloseFullPicker" style="background:none;border:none;color:#888;font-size:24px;cursor:pointer;padding:0;line-height:1">×</button>
                </div>
            </div>
            <div id="topQuickReactions" class="top-quick-reactions"></div>
            <emoji-picker id="myEmojiPicker"></emoji-picker>
        </div>
    </div>

    <!-- Modal nouveau chat -->
    <div class="modal-overlay" id="newChatModal">
        <div class="new-chat-card">
            <div class="new-chat-header">
                <h3>Nouvelle discussion</h3>
                <button id="btnCloseNewChat" style="background:none;border:none;color:#888;font-size:24px;cursor:pointer">×</button>
            </div>
            <div class="new-chat-body">
                <div id="groupNameGroup">
                    <label class="new-chat-label">Nom du groupe</label>
                    <input type="text" class="new-chat-input" id="newGroupName" placeholder="Ex: Chantier Montréal...">
                </div>
                <label class="new-chat-label">Sélectionner les participants</label>
                <div id="newChatUserList"></div>
            </div>
            <div class="new-chat-footer">
                <button class="btn-modal-gray" id="btnCancelNewChat">Annuler</button>
                <button class="btn-modal-green" id="btnCreateChat">Créer la discussion</button>
            </div>
        </div>
    </div>

    <!-- Modal confirmation masquer -->
    <div class="modal-overlay" id="confirmDeleteModal">
        <div class="modal-card-basic">
            <h3 style="color:var(--btn-red);margin-top:0">Masquer la conversation</h3>
            <p style="color:#e0e0e0;font-size:15px;margin:20px 0">Cette conversation sera retirée de votre liste. Si un nouveau message arrive, elle réapparaîtra.</p>
            <div style="display:flex;gap:10px;justify-content:center">
                <button class="btn-modal-gray" style="flex:1" id="btnCancelDelete">Annuler</button>
                <button class="btn-modal-red" style="flex:1" id="btnExecuteDelete">Masquer</button>
            </div>
        </div>
    </div>

    <!-- Modal alerte -->
    <div class="modal-overlay" id="alertModal">
        <div class="modal-card-basic">
            <h3 style="color:var(--accent);margin-top:0">Information</h3>
            <p id="alertMessage" style="color:white;font-size:15px;margin:20px 0"></p>
            <button class="btn-modal-yellow" id="btnCloseAlert">Compris</button>
        </div>
    </div>

    <!-- Modal confirmer action -->
    <div class="modal-overlay" id="confirmActionModal">
        <div class="modal-card-basic">
            <h3 style="color:var(--btn-red);margin-top:0" id="confirmActionTitle">Confirmer</h3>
            <p style="color:#e0e0e0;font-size:15px;margin:20px 0" id="confirmActionMsg"></p>
            <div style="display:flex;gap:10px;justify-content:center">
                <button class="btn-modal-gray" style="flex:1" id="btnCancelAction">Annuler</button>
                <button class="btn-modal-red" style="flex:1" id="btnConfirmAction">Oui</button>
            </div>
        </div>
    </div>
    `,await ne(e),re}async function ne(e){e.querySelector(`#btnNewChat`).addEventListener(`click`,()=>oe(e)),e.querySelector(`#btnCloseNewChat`).addEventListener(`click`,()=>$(`newChatModal`,e)),e.querySelector(`#btnCancelNewChat`).addEventListener(`click`,()=>$(`newChatModal`,e)),e.querySelector(`#btnCreateChat`).addEventListener(`click`,()=>I(e)),e.querySelector(`#btnBack`).addEventListener(`click`,()=>F(e)),e.querySelector(`#btnSendMsg`).addEventListener(`click`,()=>j(e)),e.querySelector(`#messageInput`).addEventListener(`keypress`,t=>{t.key===`Enter`&&j(e)}),e.querySelector(`#btnCancelDelete`).addEventListener(`click`,()=>R(e)),e.querySelector(`#btnExecuteDelete`).addEventListener(`click`,()=>z(e)),e.querySelector(`#btnCloseAlert`).addEventListener(`click`,()=>$(`alertModal`,e)),e.querySelector(`#btnMoreEmoji`).addEventListener(`click`,()=>H(e)),e.querySelector(`#btnToggleCustomize`).addEventListener(`click`,U),e.querySelector(`#btnCloseFullPicker`).addEventListener(`click`,()=>$(`fullPickerModal`,e));let t=e.querySelector(`#myEmojiPicker`);t&&t.addEventListener(`emoji-click`,t=>{let n=t.detail.unicode;p?(x[m]=n,m=(m+1)%x.length,W(e)):(q(n,e),$(`fullPickerModal`,e))}),e.querySelector(`#btnCancelAction`).addEventListener(`click`,()=>$(`confirmActionModal`,e)),e.querySelector(`#btnConfirmAction`).addEventListener(`click`,()=>{let t=e._confirmCallback;$(`confirmActionModal`,e),t&&t()});let n=e.querySelector(`#attachBtn`),r=e.querySelector(`#attachMenu`);n.addEventListener(`click`,e=>{e.stopPropagation(),r.classList.toggle(`show`),n.classList.toggle(`active`)}),e.querySelector(`#attachCamera`).addEventListener(`click`,()=>{e.querySelector(`#inputCamera`).click(),r.classList.remove(`show`)}),e.querySelector(`#attachGallery`).addEventListener(`click`,()=>{e.querySelector(`#inputGallery`).click(),r.classList.remove(`show`)}),e.querySelector(`#attachFile`).addEventListener(`click`,()=>{e.querySelector(`#inputFile`).click(),r.classList.remove(`show`)}),e.querySelector(`#inputCamera`).addEventListener(`change`,t=>B(t,e)),e.querySelector(`#inputGallery`).addEventListener(`change`,t=>B(t,e)),e.querySelector(`#inputFile`).addEventListener(`change`,t=>B(t,e)),document.addEventListener(`click`,e=>{!r.contains(e.target)&&e.target!==n&&!n.contains(e.target)&&(r.classList.remove(`show`),l.length===0&&n.classList.remove(`active`)),document.getElementById(`reactionPicker`).contains(e.target)||(document.getElementById(`reactionPicker`).style.display=`none`)}),e.querySelector(`#searchContactInput`).addEventListener(`keyup`,()=>ae(e)),G(e),await ie(),await E(),M(e),await D(e)}function re(){h&&=(e.removeChannel(h),null)}async function ie(){try{let{data:t}=await e.from(`chats_caches`).select(`chat_id`).eq(`user_id`,a);s=new Set((t||[]).map(e=>e.chat_id))}catch{s=new Set}}async function E(){let{data:t}=await e.from(`profils`).select(`id, prenom_nom`);t&&(c=t.filter(e=>e.id!==a).map(e=>{let t=e.prenom_nom||`Utilisateur`,n=t.split(` `),r=(n[0][0]+(n.length>1?n[1][0]:``)).toUpperCase();return{id:e.id,name:t,initials:r}}))}async function D(t){let{data:n,error:r}=await e.from(`message`).select(`id, created_at, contenu, expediteur_id, chat_id, edited_at, deleted_at, profils(prenom_nom)`).order(`created_at`,{ascending:!0});if(r){Q(`❌ Erreur de chargement : `+r.message,t);return}Object.values(S).forEach(e=>e.messages=[]),n.forEach(e=>{let t=new Date(e.created_at),n=t.getHours()+`:`+String(t.getMinutes()).padStart(2,`0`),r=e.expediteur_id===a,i=e.profils?.prenom_nom||`Inconnu`,o=O(e.contenu),s=e.chat_id||`global`;if(!S[s]){let e=s.split(`_`),t=e[0]===a?e[1]:e[0],n=c.find(e=>e.id===t);S[s]={name:n?n.name:r?`Conversation Privée`:i,isGroup:s===`global`,messages:[]}}S[s].messages.push({id:e.id,sender:i,time:n,isMine:r,reaction:e.reaction||null,type:o.type,text:o.text,url:o.url,fileName:o.fileName,fileSize:o.fileSize,createdAt:e.created_at,editedAt:e.edited_at,deletedAt:e.deleted_at})}),u&&S[u]&&N(S[u].messages,!0,t),M(t),k(t)}function O(e){if(!e)return{type:`text`,text:``,url:``,fileName:``,fileSize:``};if(e.startsWith(`IMG|||`))return{type:`image`,text:``,url:e.split(`|||`)[1],fileName:``,fileSize:``};if(e.startsWith(`FILE|||`)){let t=e.split(`|||`);return{type:`file`,text:``,url:t[1],fileName:t[2],fileSize:t[3]}}return{type:`text`,text:e,url:``,fileName:``,fileSize:``}}function k(t){h&&=(e.removeChannel(h),null),h=e.channel(`messagerie-globale`).on(`postgres_changes`,{event:`INSERT`,schema:`public`,table:`message`},async n=>{let r=n.new;if(r.expediteur_id===a)return;let{data:i}=await e.from(`profils`).select(`prenom_nom`).eq(`id`,r.expediteur_id).maybeSingle(),o=i?.prenom_nom||`Inconnu`,c=new Date(r.created_at),l=c.getHours()+`:`+String(c.getMinutes()).padStart(2,`0`),d=O(r.contenu),f=r.chat_id||`global`;if(S[f]||(S[f]={name:o,isGroup:!1,messages:[]}),!S[f].messages.some(e=>e.id===r.id)){if(S[f].messages.push({id:r.id,sender:o,time:l,isMine:!1,reaction:null,type:d.type,text:d.text,url:d.url,fileName:d.fileName,fileSize:d.fileSize,createdAt:r.created_at,editedAt:r.edited_at,deletedAt:r.deleted_at}),s.has(f)){s.delete(f);try{await e.from(`chats_caches`).delete().eq(`user_id`,a).eq(`chat_id`,f)}catch(e){console.warn(`[messagerie] Impossible de supprimer le cache chat:`,e?.message)}}u===f&&N(S[f].messages,!0,t),M(t),u!==f&&A(o,f,t)}}).on(`postgres_changes`,{event:`UPDATE`,schema:`public`,table:`message`},e=>{let n=e.new,r=n.chat_id||`global`,i=S[r];if(!i)return;let a=i.messages.find(e=>e.id===n.id||e.id==n.id);if(!a)return;let o=O(n.contenu);Object.assign(a,{text:o.text,url:o.url,fileName:o.fileName,fileSize:o.fileSize,editedAt:n.edited_at,deletedAt:n.deleted_at,reaction:n.reaction||null}),u===r&&N(i.messages,!1,t),M(t)}).on(`postgres_changes`,{event:`DELETE`,schema:`public`,table:`message`},e=>{let n=e.old?.id;n&&(Object.values(S).forEach(e=>{let t=e.messages.findIndex(e=>e.id===n||e.id==n);t>=0&&e.messages.splice(t,1)}),u&&S[u]&&N(S[u].messages,!1,t),M(t))}).on(`system`,{},e=>{(e===`CHANNEL_ERROR`||e===`TIMED_OUT`)&&setTimeout(()=>k(t),3e3)}).subscribe()}function A(e,t,n){window.dispatchEvent(new CustomEvent(`new_message_notif`,{detail:{sender:e,chatId:t}})),document.title.startsWith(`●`)||(document.title=`● `+document.title),document.addEventListener(`visibilitychange`,function e(){document.hidden||(document.title=document.title.replace(`● `,``),document.removeEventListener(`visibilitychange`,e))}),n.querySelectorAll(`.contact-item`).forEach(e=>{e.dataset.chatId===t&&(e.style.borderLeft=`3px solid var(--accent)`,setTimeout(()=>{e.style.borderLeft=``},5e3))})}async function j(t){let n=t.querySelector(`#messageInput`),r=t.querySelector(`#btnSendMsg`),i=n.value.trim(),s=l.length>0;if(!(!i&&!s||!u)&&!r?.disabled){if(v){if(!i){Q(`Le message ne peut pas être vide.`,t);return}await X(i,t)&&(n.value=``);return}r&&(r.disabled=!0,r.style.opacity=`0.5`);try{let c=S[u],d=new Date,f=d.getHours()+`:`+String(d.getMinutes()).padStart(2,`0`);if(s){let n=[...l];l=[],V(t);for(let i of n){let n=i.name.split(`.`).pop(),s=`${a}/${Date.now()}_${Math.random().toString(36).substring(2)}.${n}`;r&&(r.title=`Envoi de ${i.name}...`);let{error:l}=await e.storage.from(`pieces_jointes`).upload(s,i);if(l){Q(`Erreur d'envoi du fichier : `+l.message,t);continue}let{data:{publicUrl:d}}=e.storage.from(`pieces_jointes`).getPublicUrl(s),p=i.type.startsWith(`image/`),m=Math.round(i.size/1024)+` KB`,h=p?`IMG|||${d}`:`FILE|||${d}|||${i.name}|||${m}`;c.messages.push({id:Date.now(),sender:o,time:f,isMine:!0,reaction:null,type:p?`image`:`file`,text:``,url:d,fileName:i.name,fileSize:m}),N(c.messages,!0,t),await e.from(`message`).insert([{contenu:h,expediteur_id:a,chat_id:u}])}}if(i){c.messages.push({id:Date.now(),sender:o,text:i,time:f,isMine:!0,type:`text`,reaction:null}),n.value=``,N(c.messages,!0,t);let{error:r}=await e.from(`message`).insert([{contenu:i,expediteur_id:a,chat_id:u}]);r&&Q(`❌ Le message n'a pas pu être envoyé : `+r.message,t)}M(t)}finally{r&&(r.disabled=!1,r.style.opacity=``,r.title=``)}}}function M(e){let t=e.querySelector(`#contactListContainer`);t&&(t.innerHTML=``,Object.entries(S).reverse().forEach(([n,i])=>{if(n!==`global`&&s.has(n))return;let a=n===u?`active`:``,o=i.isGroup?`<svg><use href="#msg-users"/></svg>`:i.name?i.name.charAt(0).toUpperCase():`?`,c=i.isGroup?`avatar-group`:``,l=`Nouvelle discussion`,d=``;if(i.messages?.length){let e=i.messages[i.messages.length-1];l=e.type===`text`?e.text:e.type===`image`?`📷 Image`:`📎 Fichier`,d=e.time}let f=n===`global`?``:`<div class="delete-btn-bg" data-delete-chat="${n}"><svg><use href="#msg-trash"/></svg></div>`,p=n===`global`?``:`swipable`,m=document.createElement(`div`);m.className=`contact-wrapper`,m.id=`wrapper-${n}`,m.innerHTML=`
            ${f}
            <div class="contact-item ${a} ${p}" id="contact-${n}" data-chat-id="${n}">
                <div class="avatar ${c}">${o}</div>
                <div class="contact-info">
                    <div class="contact-name"><span>${r(i.name)}</span><span class="contact-time">${d}</span></div>
                    <div class="contact-last-msg">${i.messages?.length&&i.messages[i.messages.length-1].isMine?`Vous: `:``}${r(l)}</div>
                </div>
            </div>
        `,m.querySelector(`.contact-item`).addEventListener(`click`,t=>{t.target.closest(`.delete-btn-bg`)||P(n,e)});let h=m.querySelector(`.delete-btn-bg`);h&&h.addEventListener(`click`,()=>L(n,e)),t.appendChild(m)}),de(e))}function N(e,t=!1,n){let a=n.querySelector(`#chatMessages`);if(!a)return;let o=a.scrollTop;if(a.innerHTML=``,!e.length){a.innerHTML=`<div style="text-align:center;color:#888;font-style:italic;margin-top:50px">Envoyez un premier message pour démarrer la discussion.</div>`;return}e.forEach(e=>{let t=document.createElement(`div`);t.className=`message-wrapper ${e.isMine?`sent`:`received`}`,t.dataset.msgId=e.id;let o=e.isMine?``:`<span class="message-sender">${r(e.sender)}</span>`,s=e.reaction&&!e.deletedAt?`<div class="msg-reaction-badge" data-remove-reaction="${e.id}">${e.reaction}</div>`:``,c=e.editedAt&&!e.deletedAt?`<span style="font-size:10px;opacity:0.6;margin-left:4px;font-style:italic">(modifié)</span>`:``,l=``;if(e.deletedAt)l=`<div class="message-bubble" style="background:#3a3b46!important;color:#888!important;font-style:italic"><svg style="width:14px;height:14px;vertical-align:-2px;margin-right:4px;opacity:0.6;stroke:#888;fill:none;stroke-width:2"><use href="#msg-trash"/></svg>Message supprimé<span class="message-time">${r(e.time)}</span></div>`;else if(e.type===`text`)l=`<div class="message-bubble">${r(e.text)}<span class="message-time">${r(e.time)}${c}</span>${s}</div>`;else if(e.type===`image`){let t=i(e.url);l=`<div class="message-bubble bubble-image"><img src="${t}" data-open-url="${t}"><span class="message-time">${e.time}${c}</span>${s}</div>`}else e.type===`file`&&(l=`<a href="${i(e.url)}" target="_blank" class="message-bubble bubble-file"><div class="file-icon"><svg><use href="#msg-file"/></svg></div><div class="file-meta"><span class="file-name">${r(e.fileName)}</span><span class="file-size">${r(e.fileSize)}</span></div><div class="file-download-icon"><svg><use href="#msg-download"/></svg></div><span class="message-time" style="position:absolute;bottom:5px;right:10px;font-size:9px;color:#333">${e.time}${c}</span>${s}</a>`);let u=e.deletedAt?``:`<button class="msg-react-btn" data-react-msg="${e.id}"><svg><use href="#msg-smile"/></svg></button>`;t.innerHTML=o+`<div class="message-content-row">${l}${u}</div>`,a.appendChild(t),t.querySelectorAll(`[data-remove-reaction]`).forEach(e=>e.addEventListener(`click`,()=>se(e.dataset.removeReaction))),t.querySelectorAll(`[data-react-msg]`).forEach(e=>e.addEventListener(`click`,t=>K(t,e.dataset.reactMsg,n))),t.querySelectorAll(`[data-open-url]`).forEach(e=>e.addEventListener(`click`,()=>window.open(e.dataset.openUrl))),e.isMine&&!e.deletedAt&&ce(t,e,n)}),t?a.scrollTop=a.scrollHeight:a.scrollTop=o}function ae(e){let t=e.querySelector(`#searchContactInput`).value.toLowerCase();e.querySelectorAll(`#contactListContainer .contact-wrapper`).forEach(e=>{e.style.display=e.textContent.toLowerCase().includes(t)?`block`:`none`})}function P(e,t){if(!S[e])return;u=e;let n=S[e];t.querySelector(`#chatHeaderName`).textContent=n.name||`Inconnu`;let r=t.querySelector(`#chatHeaderAvatar`);r.className=n.isGroup?`avatar avatar-group`:`avatar`,r.innerHTML=n.isGroup?`<svg><use href="#msg-users"/></svg>`:n.name?n.name.charAt(0).toUpperCase():`?`,M(t),N(n.messages||[],!0,t),window.innerWidth<=900&&t.querySelector(`#view-dashboard`).classList.add(`show-chat`),l=[],V(t)}function F(e){e.querySelector(`#view-dashboard`).classList.remove(`show-chat`)}function oe(e){let t=e.querySelector(`#newChatUserList`);t.innerHTML=``,c.forEach(n=>{let i=document.createElement(`label`);i.className=`user-select-row`,i.id=`row-${n.id}`,i.innerHTML=`
            <input type="checkbox" class="new-chat-cb" value="${n.id}" data-name="${r(n.name)}" data-initials="${r(n.initials)}">
            <div class="user-info">
                <div class="avatar" style="width:36px;height:36px;font-size:14px;margin:0">${r(n.initials)}</div>
                <span class="user-select-name">${r(n.name)}</span>
            </div>
            <div class="custom-checkbox"></div>
        `,i.querySelector(`input`).addEventListener(`change`,t=>{i.classList.toggle(`selected`,t.target.checked);let n=e.querySelectorAll(`.new-chat-cb:checked`),r=e.querySelector(`#groupNameGroup`);n.length>1?r.classList.add(`show`):r.classList.remove(`show`)}),t.appendChild(i)}),e.querySelector(`#newGroupName`).value=``,e.querySelector(`#groupNameGroup`).classList.remove(`show`),e.querySelector(`#newChatModal`).classList.add(`open`)}async function I(t){let n=t.querySelectorAll(`.new-chat-cb:checked`);if(!n.length){Q(`Veuillez sélectionner au moins une personne.`,t);return}let r,i;if(n.length===1){let e=n[0].value;r=[a,e].sort().join(`_`),i={name:n[0].dataset.name,isGroup:!1,messages:[]}}else r=`groupe_`+Date.now(),i={name:t.querySelector(`#newGroupName`).value.trim()||`Nouveau Groupe`,isGroup:!0,messages:[]};if(S[r]||(S[r]=i),s.has(r)){s.delete(r);try{await e.from(`chats_caches`).delete().eq(`user_id`,a).eq(`chat_id`,r)}catch(e){console.warn(`[messagerie] Impossible de supprimer le cache chat:`,e?.message)}}$(`newChatModal`,t),M(t),P(r,t)}function L(e,t){e!==`global`&&(f=e,t.querySelector(`#confirmDeleteModal`).classList.add(`open`))}function R(e){$(`confirmDeleteModal`,e),y&&=(y.classList.remove(`swiped`),null),f=null}async function z(t){if(!f||f===`global`)return;let n=f;try{let{error:t}=await e.from(`chats_caches`).upsert({user_id:a,chat_id:n},{onConflict:`user_id,chat_id`});if(t)throw t}catch(e){Q(`❌ Impossible de masquer : `+e.message,t);return}s.add(n),$(`confirmDeleteModal`,t),u===n&&(u=null,t.querySelector(`#chatHeaderName`).textContent=`Sélectionnez une discussion`,t.querySelector(`#chatHeaderAvatar`).innerHTML=``,t.querySelector(`#chatMessages`).innerHTML=`<div style="text-align:center;color:#888;font-style:italic;margin-top:50px">Aucune conversation sélectionnée.</div>`,F(t)),M(t),f=null}function B(e,t){l=l.concat(Array.from(e.target.files)),V(t),e.target.value=``}function V(e){let t=e.querySelector(`#attachmentPreview`),n=e.querySelector(`#attachBtn`);t.innerHTML=``,l.length>0?(n.classList.add(`active`),l.forEach((n,i)=>{let a=document.createElement(`div`);if(n.type.startsWith(`image/`)){a.className=`preview-item`;let e=document.createElement(`img`);e.src=URL.createObjectURL(n),a.appendChild(e)}else a.className=`preview-item-file`,a.innerHTML=`<div style="width:16px;height:16px"><svg><use href="#msg-file"/></svg></div><span>${r(n.name.length>15?n.name.substring(0,12)+`...`:n.name)}</span>`;let o=document.createElement(`button`);o.className=`remove-attachment`,o.textContent=`×`,o.addEventListener(`click`,()=>{l.splice(i,1),V(e)}),a.appendChild(o),t.appendChild(a)})):n.classList.remove(`active`)}function H(e){p=!1;let t=e.querySelector(`#fullPickerModal`);t&&(t.style.display=`flex`);let n=e.querySelector(`#reactionPicker`);n&&(n.style.display=`none`),W(e),window.dispatchEvent(new CustomEvent(`toggle_menu`,{detail:{action:`hide`}}))}function U(){p=!p;let e=document.getElementById(`btnToggleCustomize`);if(!e)return;if(p)e.textContent=`Terminé`,e.style.color=`var(--btn-green)`,m=0;else{e.textContent=`Personnaliser`,e.style.color=`var(--btn-blue)`,m=null,localStorage.setItem(`dussault_quick_reacts`,JSON.stringify(x));let t=document.getElementById(`app-container`);t&&G(t)}let t=document.getElementById(`app-container`);t&&W(t)}function W(e){let t=e.querySelector(`#topQuickReactions`);t&&(t.innerHTML=``,x.forEach((n,r)=>{let i=document.createElement(`div`);i.className=`top-react-slot`+(p&&m===r?` active-slot`:``),i.textContent=n,p?i.onclick=()=>{m=r,W(e)}:i.onclick=()=>{q(n,e),$(`fullPickerModal`,e)},t.appendChild(i)}))}function G(e){let t=document.getElementById(`quickReactionsList`);t&&(t.innerHTML=``,x.forEach(n=>{let r=document.createElement(`span`);r.textContent=n,r.addEventListener(`click`,()=>q(n,e)),t.appendChild(r)}))}function K(e,t,n){e.stopPropagation(),d=t;let r=document.getElementById(`reactionPicker`);if(!r)return;r.style.display=`flex`;let i=e.currentTarget.getBoundingClientRect(),a=i.top-55,o=i.left-130;a<10&&(a=i.bottom+10),o<10&&(o=10),o+200>window.innerWidth&&(o=window.innerWidth-210),r.style.top=a+`px`,r.style.left=o+`px`,G(n)}async function q(t,n){if(!d||!u)return;let r=S[u],i=r?.messages.find(e=>e.id===d||e.id==d);if(i){i.reaction=t,N(r.messages,!1,n);try{await e.from(`message`).update({reaction:t}).eq(`id`,d)}catch(e){console.warn(`[messagerie] Impossible de sauvegarder la réaction:`,e?.message)}}document.getElementById(`reactionPicker`).style.display=`none`}async function se(t){if(!u)return;let n=S[u]?.messages.find(e=>e.id===t||e.id==t);if(n){n.reaction=null;try{await e.from(`message`).update({reaction:null}).eq(`id`,t)}catch{}}}function ce(e,t,n){let r=e=>{let r=e.touches?e.touches[0]:e;_={x:r.clientX,y:r.clientY},g=setTimeout(()=>{g=null;try{navigator.vibrate?.(40)}catch{}J(t,n)},ee)},i=e=>{if(!g||!_)return;let t=e.touches?e.touches[0]:e;(Math.abs(t.clientX-_.x)>10||Math.abs(t.clientY-_.y)>10)&&(clearTimeout(g),g=null)},a=()=>{g&&=(clearTimeout(g),null)};e.addEventListener(`touchstart`,r,{passive:!0}),e.addEventListener(`touchmove`,i,{passive:!0}),e.addEventListener(`touchend`,a),e.addEventListener(`touchcancel`,a),e.addEventListener(`mousedown`,r),e.addEventListener(`mousemove`,i),e.addEventListener(`mouseup`,a),e.addEventListener(`mouseleave`,a),e.addEventListener(`contextmenu`,e=>{e.preventDefault(),J(t,n)})}function J(e,t){let n=Date.now()-(e.createdAt?new Date(e.createdAt).getTime():0),r=e.type===`text`&&n<300*1e3,i=document.createElement(`div`);i.style.cssText=`position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(2px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px`,i.innerHTML=`
        <div style="background:#2a2b35;border-radius:14px;padding:8px;min-width:240px;box-shadow:0 12px 40px rgba(0,0,0,0.5)">
            ${r?`<button data-act="edit" style="display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;background:transparent;border:none;color:#fff;font-size:15px;cursor:pointer;border-radius:10px;text-align:left"><svg style="width:18px;height:18px;stroke:var(--btn-blue);fill:none;stroke-width:2"><use href="#msg-edit"/></svg> Modifier</button>`:`<div style="display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;color:#666;font-size:13px;font-style:italic"><svg style="width:18px;height:18px;stroke:#666;fill:none;stroke-width:2;opacity:.5"><use href="#msg-edit"/></svg> Modifier (limite 5 min dépassée)</div>`}
            <button data-act="delete" style="display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;background:transparent;border:none;color:var(--btn-red);font-size:15px;cursor:pointer;border-radius:10px;text-align:left"><svg style="width:18px;height:18px;stroke:var(--btn-red);fill:none;stroke-width:2"><use href="#msg-trash"/></svg> Supprimer</button>
            <div style="height:1px;background:#444;margin:4px 12px"></div>
            <button data-act="cancel" style="display:flex;align-items:center;justify-content:center;width:100%;padding:14px 16px;background:transparent;border:none;color:#aaa;font-size:14px;cursor:pointer;border-radius:10px">Annuler</button>
        </div>
    `,i.querySelectorAll(`[data-act]`).forEach(n=>{n.addEventListener(`click`,()=>{document.body.removeChild(i),n.dataset.act===`edit`?le(e,t):n.dataset.act===`delete`&&ue(e,t)})}),i.addEventListener(`click`,e=>{e.target===i&&document.body.removeChild(i)}),document.body.appendChild(i)}function le(e,t){let n=t.querySelector(`#messageInput`);if(!n)return;v=e.id,n.value=e.text||``,n.focus();let i=t.querySelector(`#editing-banner`);i&&i.remove();let a=document.createElement(`div`);a.id=`editing-banner`,a.style.cssText=`background:rgba(91,192,235,0.15);border-left:3px solid var(--btn-blue);padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;border-radius:6px`,a.innerHTML=`
        <div style="flex:1;min-width:0">
            <div style="font-size:11px;color:var(--btn-blue);font-weight:600;margin-bottom:2px">Modification du message</div>
            <div style="font-size:13px;color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r(e.text||``)}</div>
        </div>
        <button id="btnCancelEdit" style="background:transparent;border:none;color:#888;cursor:pointer;padding:4px;font-size:18px">×</button>
    `,a.querySelector(`#btnCancelEdit`).addEventListener(`click`,()=>Y(t));let o=t.querySelector(`.chat-input-area`);o.parentElement.insertBefore(a,o)}function Y(e){v=null;let t=e.querySelector(`#messageInput`);t&&(t.value=``);let n=e.querySelector(`#editing-banner`);n&&n.remove()}async function X(t,n){if(!v)return!1;let r=v;try{let{error:i}=await e.from(`message`).update({contenu:t,edited_at:new Date().toISOString()}).eq(`id`,r).eq(`expediteur_id`,a);if(i)throw i;let o=S[u];if(o){let e=o.messages.find(e=>e.id===r||e.id==r);e&&(e.text=t,e.editedAt=new Date().toISOString(),N(o.messages,!1,n))}return Y(n),!0}catch(e){return Q(`Erreur lors de la modification : `+(e.message||`inconnue`),n),!1}}function ue(t,n){he(`Supprimer ce message ?`,async()=>{try{let{error:r}=await e.from(`message`).update({deleted_at:new Date().toISOString()}).eq(`id`,t.id).eq(`expediteur_id`,a);if(r)throw r;let i=S[u];if(i){let e=i.messages.find(e=>e.id===t.id||e.id==t.id);e&&(e.deletedAt=new Date().toISOString(),N(i.messages,!1,n))}}catch(e){Q(`Erreur lors de la suppression : `+(e.message||`inconnue`),n)}},n)}function de(e){e.querySelectorAll(`.contact-item.swipable`).forEach(t=>{t.dataset.swipeBound!==`1`&&(t.dataset.swipeBound=`1`,t.addEventListener(`touchstart`,fe,{passive:!0}),t.addEventListener(`touchmove`,pe,{passive:!1}),t.addEventListener(`touchend`,t=>Z(t,e)),t.addEventListener(`touchcancel`,t=>Z(t,e)),t.addEventListener(`click`,t=>me(t,e),!0))})}function fe(e){if(!e.touches||e.touches.length!==1)return;let t=e.touches[0];b={item:e.currentTarget,startX:t.clientX,startY:t.clientY,currentDelta:0,isHorizontal:null,wasSwiped:e.currentTarget.classList.contains(`swiped`)},e.currentTarget.classList.add(`swiping`)}function pe(e){if(!b||!e.touches||e.touches.length!==1)return;let t=e.touches[0],n=t.clientX-b.startX,r=t.clientY-b.startY;if(b.isHorizontal===null){if(Math.abs(n)<8&&Math.abs(r)<8)return;if(b.isHorizontal=Math.abs(n)>Math.abs(r)*.8&&Math.abs(r)<Math.abs(n)*1.5,!b.isHorizontal){b.item.classList.remove(`swiping`),b=null;return}}e.preventDefault();let i=b.wasSwiped?-T+n:n;i>0&&(i=0),i<-T-30&&(i=-T-30),b.currentDelta=i,b.item.style.transform=`translateX(${i}px)`}function Z(e,t){if(!b)return;let n=b.item,r=Math.abs(b.currentDelta);if(n.classList.remove(`swiping`),n.style.transform=``,r>=w){n.classList.remove(`swiped`);let e=n.dataset.chatId;e&&L(e,t)}else r>=C?(t.querySelectorAll(`.contact-item.swiped`).forEach(e=>{e!==n&&e.classList.remove(`swiped`)}),n.classList.add(`swiped`),y=n):(n.classList.remove(`swiped`),y===n&&(y=null));b=null}function me(e,t){let n=e.currentTarget;if(n.classList.contains(`swiped`)){e.preventDefault(),e.stopPropagation(),n.classList.remove(`swiped`),y===n&&(y=null);return}y&&y!==n&&(y.classList.remove(`swiped`),y=null)}function Q(e,t){let n=t.querySelector(`#alertMessage`);n&&(n.textContent=e),t.querySelector(`#alertModal`).classList.add(`open`)}function he(e,t,n){n.querySelector(`#confirmActionMsg`).textContent=e,n._confirmCallback=t,n.querySelector(`#confirmActionModal`).classList.add(`open`)}function $(e,t){t.querySelector(`#${e}`)?.classList.remove(`open`)}export{te as render};