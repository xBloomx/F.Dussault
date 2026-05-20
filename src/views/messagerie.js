// src/views/messagerie.js
// Migré fidèlement depuis code_messagerie/code_messagerie.html
// Note SPA : postMessage vers window.parent supprimés, badge géré via événement DOM

import { supabase } from '../supabase.js'
import { currentUser, currentProfil } from '../auth.js'
import { sanitize } from '../shared/sanitize.js'
import { friendlyError } from '../shared/errorMsg.js'

function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '#'
    try {
        const parsed = new URL(url)
        if (!['https:', 'http:'].includes(parsed.protocol)) return '#'
        return url
    } catch { return '#' }
}

// ── État local ──────────────────────────────────────────────────────────────
let myUserId = ''
let myUserName = 'Moi'
let hiddenChatIds = new Set()
let allEmployees = []
let selectedFiles = []
let currentChatId = null
let currentReactMsgId = null
let currentChatIdToDelete = null
let isCustomizing = false
let selectedCustomizeIndex = 0
let realtimeChannel = null
let _previewBlobUrls = []
let _longPressTimer = null
let _longPressStartXY = null
let _editingMsgId = null
let _currentlySwipedItem = null
let _swipeState = null
let _titleNotifPending = false
let quickReactions = (() => { try { return JSON.parse(localStorage.getItem('dussault_quick_reacts')) || ['❤️', '👍', '😂', '😮', '😢', '🙏'] } catch { return ['❤️', '👍', '😂', '😮', '😢', '🙏'] } })()

const conversationsData = { 'global': { name: 'Équipe (Général)', isGroup: true, messages: [] } }

const SWIPE_THRESHOLD_OPEN = 40
const SWIPE_THRESHOLD_DELETE = 140
const SWIPE_MAX = 80
const LONG_PRESS_MS = 500

// ── Render principal ────────────────────────────────────────────────────────
export async function render(container) {
    myUserId = currentUser?.id || ''
    myUserName = currentProfil?.prenom_nom || currentUser?.email?.split('@')[0] || 'Moi'

    container.innerHTML = `
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
        .bottom-sheet-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; z-index: 6000; align-items: flex-end; justify-content: center; padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px); box-sizing: border-box; }
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
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; z-index: 5000; justify-content: center; align-items: center; padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px); box-sizing: border-box; }
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
        @media (min-width: 769px) and (max-width: 1024px) { #view-dashboard { padding: 20px; } }
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
    `

    await init(container)
    return cleanup
}

// ── Init ────────────────────────────────────────────────────────────────────
async function init(container) {
    // Boutons
    container.querySelector('#btnNewChat').addEventListener('click', () => openNewChatModal(container))
    container.querySelector('#btnCloseNewChat').addEventListener('click', () => closeModal('newChatModal', container))
    container.querySelector('#btnCancelNewChat').addEventListener('click', () => closeModal('newChatModal', container))
    container.querySelector('#btnCreateChat').addEventListener('click', () => createNewChat(container))
    container.querySelector('#btnBack').addEventListener('click', () => closeChat(container))
    container.querySelector('#btnSendMsg').addEventListener('click', () => sendMessage(container))
    container.querySelector('#messageInput').addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(container) })
    container.querySelector('#btnCancelDelete').addEventListener('click', () => cancelDeleteChat(container))
    container.querySelector('#btnExecuteDelete').addEventListener('click', () => executeDeleteChat(container))
    container.querySelector('#btnCloseAlert').addEventListener('click', () => closeModal('alertModal', container))
    container.querySelector('#btnMoreEmoji').addEventListener('click', () => openFullPicker(container))
    container.querySelector('#btnToggleCustomize').addEventListener('click', toggleCustomizeMode)
    container.querySelector('#btnCloseFullPicker').addEventListener('click', () => closeModal('fullPickerModal', container))
    // emoji-picker-element — écouter la sélection d'un emoji
    const emojiPicker = container.querySelector('#myEmojiPicker')
    if (emojiPicker) {
        emojiPicker.addEventListener('emoji-click', e => {
            const emoji = e.detail.unicode
            if (isCustomizing) {
                quickReactions[selectedCustomizeIndex] = emoji
                selectedCustomizeIndex = (selectedCustomizeIndex + 1) % quickReactions.length
                renderTopQuickReactions(container)
            } else {
                selectReaction(emoji, container)
                closeModal('fullPickerModal', container)
            }
        })
    }
    container.querySelector('#btnCancelAction').addEventListener('click', () => closeModal('confirmActionModal', container))
    container.querySelector('#btnConfirmAction').addEventListener('click', () => {
        const cb = container._confirmCallback
        closeModal('confirmActionModal', container)
        if (cb) cb()
    })

    // Pièces jointes
    const attachBtn = container.querySelector('#attachBtn')
    const attachMenu = container.querySelector('#attachMenu')
    attachBtn.addEventListener('click', e => { e.stopPropagation(); attachMenu.classList.toggle('show'); attachBtn.classList.toggle('active') })
    container.querySelector('#attachCamera').addEventListener('click', () => { container.querySelector('#inputCamera').click(); attachMenu.classList.remove('show') })
    container.querySelector('#attachGallery').addEventListener('click', () => { container.querySelector('#inputGallery').click(); attachMenu.classList.remove('show') })
    container.querySelector('#attachFile').addEventListener('click', () => { container.querySelector('#inputFile').click(); attachMenu.classList.remove('show') })
    container.querySelector('#inputCamera').addEventListener('change', e => handleFileSelect(e, container))
    container.querySelector('#inputGallery').addEventListener('change', e => handleFileSelect(e, container))
    container.querySelector('#inputFile').addEventListener('change', e => handleFileSelect(e, container))
    document.addEventListener('click', e => {
        if (!attachMenu.contains(e.target) && e.target !== attachBtn && !attachBtn.contains(e.target)) {
            attachMenu.classList.remove('show')
            if (selectedFiles.length === 0) attachBtn.classList.remove('active')
        }
        if (!document.getElementById('reactionPicker').contains(e.target)) {
            document.getElementById('reactionPicker').style.display = 'none'
        }
    })

    // Recherche
    container.querySelector('#searchContactInput').addEventListener('keyup', () => filterContacts(container))

    renderQuickReactions(container)
    await chargerChatsMasques()
    await chargerProfilsEmployes()
    renderContactList(container)
    await chargerMessagesSupabase(container)
}

function cleanup() {
    _previewBlobUrls.forEach(u => URL.revokeObjectURL(u))
    _previewBlobUrls = []
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
        realtimeChannel = null
    }
}

// ── Chargement ──────────────────────────────────────────────────────────────
async function chargerChatsMasques() {
    try {
        const { data } = await supabase.from('chats_caches').select('chat_id').eq('user_id', myUserId)
        hiddenChatIds = new Set((data || []).map(r => r.chat_id))
    } catch { hiddenChatIds = new Set() }
}

async function chargerProfilsEmployes() {
    const { data } = await supabase.from('profils').select('id, prenom_nom')
    if (data) {
        allEmployees = data.filter(p => p.id !== myUserId).map(p => {
            const nom = p.prenom_nom || 'Utilisateur'
            const parts = nom.split(' ')
            const initials = (parts[0][0] + (parts.length > 1 ? parts[1][0] : '')).toUpperCase()
            return { id: p.id, name: nom, initials }
        })
    }
}

async function chargerMessagesSupabase(container) {
    const { data, error } = await supabase.from('message')
        .select('id, created_at, contenu, expediteur_id, chat_id, edited_at, deleted_at, profils(prenom_nom)')
        .order('created_at', { ascending: true })

    if (error) { showAlert(friendlyError(error), container); return }

    Object.values(conversationsData).forEach(c => c.messages = [])

    data.forEach(msgDB => {
        const date = new Date(msgDB.created_at)
        const timeStr = date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0')
        const isMine = msgDB.expediteur_id === myUserId
        const senderName = msgDB.profils?.prenom_nom || 'Inconnu'
        const decodage = decoderMessage(msgDB.contenu)
        const cId = msgDB.chat_id || 'global'

        if (!conversationsData[cId]) {
            const uuids = cId.split('_')
            const otherId = uuids[0] === myUserId ? uuids[1] : uuids[0]
            const otherEmp = allEmployees.find(e => e.id === otherId)
            conversationsData[cId] = { name: otherEmp ? otherEmp.name : (isMine ? 'Conversation Privée' : senderName), isGroup: cId === 'global', messages: [] }
        }

        conversationsData[cId].messages.push({
            id: msgDB.id, sender: senderName, time: timeStr, isMine,
            reaction: msgDB.reaction || null,
            type: decodage.type, text: decodage.text, url: decodage.url,
            fileName: decodage.fileName, fileSize: decodage.fileSize,
            createdAt: msgDB.created_at, editedAt: msgDB.edited_at, deletedAt: msgDB.deleted_at
        })
    })

    if (currentChatId && conversationsData[currentChatId]) renderMessages(conversationsData[currentChatId].messages, true, container)
    renderContactList(container)
    ecouterNouveauxMessages(container)
}

function decoderMessage(contenu) {
    if (!contenu) return { type: 'text', text: '', url: '', fileName: '', fileSize: '' }
    if (contenu.startsWith('IMG|||')) { const p = contenu.split('|||'); return { type: 'image', text: '', url: p[1], fileName: '', fileSize: '' } }
    if (contenu.startsWith('FILE|||')) { const p = contenu.split('|||'); return { type: 'file', text: '', url: p[1], fileName: p[2], fileSize: p[3] } }
    return { type: 'text', text: contenu, url: '', fileName: '', fileSize: '' }
}

// ── Realtime ─────────────────────────────────────────────────────────────────
function ecouterNouveauxMessages(container) {
    if (realtimeChannel) { supabase.removeChannel(realtimeChannel); realtimeChannel = null }

    realtimeChannel = supabase.channel('messagerie-globale')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message' }, async payload => {
            const newMsg = payload.new
            if (newMsg.expediteur_id === myUserId) return

            const { data: profil } = await supabase.from('profils').select('prenom_nom').eq('id', newMsg.expediteur_id).maybeSingle()
            const senderName = profil?.prenom_nom || 'Inconnu'
            const date = new Date(newMsg.created_at)
            const timeStr = date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0')
            const decodage = decoderMessage(newMsg.contenu)
            const cId = newMsg.chat_id || 'global'

            if (!conversationsData[cId]) conversationsData[cId] = { name: senderName, isGroup: false, messages: [] }
            if (conversationsData[cId].messages.some(m => m.id === newMsg.id)) return

            conversationsData[cId].messages.push({
                id: newMsg.id, sender: senderName, time: timeStr, isMine: false, reaction: null,
                type: decodage.type, text: decodage.text, url: decodage.url,
                fileName: decodage.fileName, fileSize: decodage.fileSize,
                createdAt: newMsg.created_at, editedAt: newMsg.edited_at, deletedAt: newMsg.deleted_at
            })

            if (hiddenChatIds.has(cId)) {
                hiddenChatIds.delete(cId)
                try { await supabase.from('chats_caches').delete().eq('user_id', myUserId).eq('chat_id', cId) } catch (e) { console.warn('[messagerie] Impossible de supprimer le cache chat:', e?.message) }
            }

            if (currentChatId === cId) renderMessages(conversationsData[cId].messages, true, container)
            renderContactList(container)
            if (currentChatId !== cId) notifierNouveauMessage(senderName, cId, container)
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'message' }, payload => {
            const msg = payload.new
            const cId = msg.chat_id || 'global'
            const chat = conversationsData[cId]
            if (!chat) return
            const local = chat.messages.find(m => m.id === msg.id || m.id == msg.id)
            if (!local) return
            const d = decoderMessage(msg.contenu)
            Object.assign(local, { text: d.text, url: d.url, fileName: d.fileName, fileSize: d.fileSize, editedAt: msg.edited_at, deletedAt: msg.deleted_at, reaction: msg.reaction || null })
            if (currentChatId === cId) renderMessages(chat.messages, false, container)
            renderContactList(container)
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'message' }, payload => {
            const deletedId = payload.old?.id
            if (!deletedId) return
            Object.values(conversationsData).forEach(chat => {
                const idx = chat.messages.findIndex(m => m.id === deletedId || m.id == deletedId)
                if (idx >= 0) chat.messages.splice(idx, 1)
            })
            if (currentChatId && conversationsData[currentChatId]) renderMessages(conversationsData[currentChatId].messages, false, container)
            renderContactList(container)
        })
        .on('system', {}, status => {
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                setTimeout(() => ecouterNouveauxMessages(container), 3000)
            }
        })
        .subscribe()
}

function notifierNouveauMessage(senderName, chatId, container) {
    // Badge dans la sidebar principale (événement DOM — plus de postMessage)
    window.dispatchEvent(new CustomEvent('new_message_notif', { detail: { sender: senderName, chatId } }))
    if (!document.title.startsWith('●')) document.title = '● ' + document.title
    if (!_titleNotifPending) {
        _titleNotifPending = true
        document.addEventListener('visibilitychange', function handler() {
            if (!document.hidden) {
                document.title = document.title.replace('● ', '')
                _titleNotifPending = false
                document.removeEventListener('visibilitychange', handler)
            }
        })
    }
    container.querySelectorAll('.contact-item').forEach(item => {
        if (item.dataset.chatId === chatId) {
            item.style.borderLeft = '3px solid var(--accent)'
            setTimeout(() => { item.style.borderLeft = '' }, 5000)
        }
    })
}

// ── Envoi messages ───────────────────────────────────────────────────────────
async function sendMessage(container) {
    const messageInput = container.querySelector('#messageInput')
    const btnSend = container.querySelector('#btnSendMsg')
    const text = messageInput.value.trim()
    const hasFiles = selectedFiles.length > 0
    if ((!text && !hasFiles) || !currentChatId) return
    if (btnSend?.disabled) return

    if (_editingMsgId) {
        if (!text) { showAlert("Le message ne peut pas être vide.", container); return }
        const ok = await saveEditedMessage(text, container)
        if (ok) messageInput.value = ''
        return
    }

    if (btnSend) { btnSend.disabled = true; btnSend.style.opacity = '0.5' }
    try {
        const activeChat = conversationsData[currentChatId]
        const now = new Date()
        const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0')

        if (hasFiles) {
            const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 Mo
            const ALLOWED_EXT = new Set(['jpg','jpeg','png','gif','webp','pdf','doc','docx','xls','xlsx','csv','txt','zip','mp4','mov'])
            const files = [...selectedFiles]; selectedFiles = []; renderPreviews(container)
            for (const file of files) {
                if (file.size > MAX_FILE_SIZE) { showAlert(`Fichier trop volumineux : ${file.name} (max 20 Mo)`, container); continue }
                const fileExt = file.name.split('.').pop().toLowerCase()
                if (!ALLOWED_EXT.has(fileExt)) { showAlert(`Type de fichier non autorisé : .${fileExt}`, container); continue }
                const filePath = `${myUserId}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
                if (btnSend) btnSend.title = `Envoi de ${file.name}...`
                const { error: uploadError } = await supabase.storage.from('pieces_jointes').upload(filePath, file)
                if (uploadError) { showAlert("Erreur d'envoi du fichier : " + uploadError.message, container); continue }
                const { data: { publicUrl } } = supabase.storage.from('pieces_jointes').getPublicUrl(filePath)
                const isImg = file.type.startsWith('image/')
                const fileSizeTxt = Math.round(file.size / 1024) + ' KB'
                const contenu = isImg ? `IMG|||${publicUrl}` : `FILE|||${publicUrl}|||${file.name}|||${fileSizeTxt}`
                activeChat.messages.push({ id: Date.now(), sender: myUserName, time: timeStr, isMine: true, reaction: null, type: isImg ? 'image' : 'file', text: '', url: publicUrl, fileName: file.name, fileSize: fileSizeTxt })
                renderMessages(activeChat.messages, true, container)
                await supabase.from('message').insert([{ contenu, expediteur_id: myUserId, chat_id: currentChatId }])
            }
        }

        if (text) {
            activeChat.messages.push({ id: Date.now(), sender: myUserName, text, time: timeStr, isMine: true, type: 'text', reaction: null })
            messageInput.value = ''
            renderMessages(activeChat.messages, true, container)
            const { error } = await supabase.from('message').insert([{ contenu: text, expediteur_id: myUserId, chat_id: currentChatId }])
            if (error) showAlert(friendlyError(error), container)
        }
        renderContactList(container)
    } finally {
        if (btnSend) { btnSend.disabled = false; btnSend.style.opacity = ''; btnSend.title = '' }
    }
}

// ── Rendu ────────────────────────────────────────────────────────────────────
function renderContactList(container) {
    const list = container.querySelector('#contactListContainer')
    if (!list) return
    list.innerHTML = ''
    Object.entries(conversationsData).reverse().forEach(([id, chat]) => {
        if (id !== 'global' && hiddenChatIds.has(id)) return
        const isActive = id === currentChatId ? 'active' : ''
        const avatarContent = chat.isGroup ? `<svg><use href="#msg-users"/></svg>` : (chat.name ? chat.name.charAt(0).toUpperCase() : '?')
        const avatarClass = chat.isGroup ? 'avatar-group' : ''
        let lastMsg = 'Nouvelle discussion', lastTime = ''
        if (chat.messages?.length) {
            const last = chat.messages[chat.messages.length - 1]
            lastMsg = last.type === 'text' ? last.text : (last.type === 'image' ? '📷 Image' : '📎 Fichier')
            lastTime = last.time
        }
        const deleteBg = id !== 'global' ? `<div class="delete-btn-bg" data-delete-chat="${id}"><svg><use href="#msg-trash"/></svg></div>` : ''
        const swipableClass = id !== 'global' ? 'swipable' : ''
        const wrapper = document.createElement('div')
        wrapper.className = 'contact-wrapper'
        wrapper.id = `wrapper-${id}`
        wrapper.innerHTML = `
            ${deleteBg}
            <div class="contact-item ${isActive} ${swipableClass}" id="contact-${id}" data-chat-id="${id}">
                <div class="avatar ${avatarClass}">${avatarContent}</div>
                <div class="contact-info">
                    <div class="contact-name"><span>${sanitize(chat.name)}</span><span class="contact-time">${lastTime}</span></div>
                    <div class="contact-last-msg">${chat.messages?.length && chat.messages[chat.messages.length-1].isMine ? 'Vous: ' : ''}${sanitize(lastMsg)}</div>
                </div>
            </div>
        `
        const contactItem = wrapper.querySelector('.contact-item')
        contactItem.addEventListener('click', e => { if (e.target.closest('.delete-btn-bg')) return; openChat(id, container) })
        const deleteBtnBg = wrapper.querySelector('.delete-btn-bg')
        if (deleteBtnBg) deleteBtnBg.addEventListener('click', () => askDeleteChat(id, container))
        list.appendChild(wrapper)
    })
    attachSwipeListeners(container)
}

function renderMessages(messages, scroll = false, container) {
    const messagesContainer = container.querySelector('#chatMessages')
    if (!messagesContainer) return
    const scrollPos = messagesContainer.scrollTop
    messagesContainer.innerHTML = ''
    if (!messages.length) {
        messagesContainer.innerHTML = '<div style="text-align:center;color:#888;font-style:italic;margin-top:50px">Envoyez un premier message pour démarrer la discussion.</div>'
        return
    }
    messages.forEach(msg => {
        const wrapper = document.createElement('div')
        wrapper.className = `message-wrapper ${msg.isMine ? 'sent' : 'received'}`
        wrapper.dataset.msgId = msg.id
        const senderHtml = !msg.isMine ? `<span class="message-sender">${sanitize(msg.sender)}</span>` : ''
        const reactionHtml = (msg.reaction && !msg.deletedAt) ? `<div class="msg-reaction-badge" data-remove-reaction="${msg.id}">${msg.reaction}</div>` : ''
        const editedTag = (msg.editedAt && !msg.deletedAt) ? `<span style="font-size:10px;opacity:0.6;margin-left:4px;font-style:italic">(modifié)</span>` : ''

        let innerBubble = ''
        if (msg.deletedAt) {
            innerBubble = `<div class="message-bubble" style="background:#3a3b46!important;color:#888!important;font-style:italic"><svg style="width:14px;height:14px;vertical-align:-2px;margin-right:4px;opacity:0.6;stroke:#888;fill:none;stroke-width:2"><use href="#msg-trash"/></svg>Message supprimé<span class="message-time">${sanitize(msg.time)}</span></div>`
        } else if (msg.type === 'text') {
            innerBubble = `<div class="message-bubble">${sanitize(msg.text)}<span class="message-time">${sanitize(msg.time)}${editedTag}</span>${reactionHtml}</div>`
        } else if (msg.type === 'image') {
            const safeUrl = sanitizeUrl(msg.url)
            innerBubble = `<div class="message-bubble bubble-image"><img src="${safeUrl}" data-open-url="${safeUrl}"><span class="message-time">${msg.time}${editedTag}</span>${reactionHtml}</div>`
        } else if (msg.type === 'file') {
            const safeUrl = sanitizeUrl(msg.url)
            innerBubble = `<a href="${safeUrl}" target="_blank" class="message-bubble bubble-file"><div class="file-icon"><svg><use href="#msg-file"/></svg></div><div class="file-meta"><span class="file-name">${sanitize(msg.fileName)}</span><span class="file-size">${sanitize(msg.fileSize)}</span></div><div class="file-download-icon"><svg><use href="#msg-download"/></svg></div><span class="message-time" style="position:absolute;bottom:5px;right:10px;font-size:9px;color:#333">${msg.time}${editedTag}</span>${reactionHtml}</a>`
        }

        const reactBtnHtml = msg.deletedAt ? '' : `<button class="msg-react-btn" data-react-msg="${msg.id}"><svg><use href="#msg-smile"/></svg></button>`
        wrapper.innerHTML = senderHtml + `<div class="message-content-row">${innerBubble}${reactBtnHtml}</div>`
        messagesContainer.appendChild(wrapper)

        // Event listeners
        wrapper.querySelectorAll('[data-remove-reaction]').forEach(el => el.addEventListener('click', () => removeReaction(el.dataset.removeReaction)))
        wrapper.querySelectorAll('[data-react-msg]').forEach(el => el.addEventListener('click', e => showReactionPicker(e, el.dataset.reactMsg, container)))
        wrapper.querySelectorAll('[data-open-url]').forEach(el => el.addEventListener('click', () => window.open(el.dataset.openUrl)))
        if (msg.isMine && !msg.deletedAt) attachLongPress(wrapper, msg, container)
    })
    if (scroll) messagesContainer.scrollTop = messagesContainer.scrollHeight
    else messagesContainer.scrollTop = scrollPos
}

function filterContacts(container) {
    const term = container.querySelector('#searchContactInput').value.toLowerCase()
    container.querySelectorAll('#contactListContainer .contact-wrapper').forEach(w => {
        w.style.display = w.textContent.toLowerCase().includes(term) ? 'block' : 'none'
    })
}

function openChat(chatId, container) {
    if (!conversationsData[chatId]) return
    currentChatId = chatId
    const chat = conversationsData[chatId]
    container.querySelector('#chatHeaderName').textContent = chat.name || 'Inconnu'
    const avatarBox = container.querySelector('#chatHeaderAvatar')
    avatarBox.className = chat.isGroup ? 'avatar avatar-group' : 'avatar'
    avatarBox.innerHTML = chat.isGroup ? `<svg><use href="#msg-users"/></svg>` : (chat.name ? chat.name.charAt(0).toUpperCase() : '?')
    renderContactList(container)
    renderMessages(chat.messages || [], true, container)
    if (window.innerWidth <= 900) container.querySelector('#view-dashboard').classList.add('show-chat')
    selectedFiles = []; renderPreviews(container)
}

function closeChat(container) {
    container.querySelector('#view-dashboard').classList.remove('show-chat')
}

// ── Nouveau chat ──────────────────────────────────────────────────────────────
function openNewChatModal(container) {
    const list = container.querySelector('#newChatUserList')
    list.innerHTML = ''
    allEmployees.forEach(emp => {
        const label = document.createElement('label')
        label.className = 'user-select-row'
        label.id = `row-${emp.id}`
        label.innerHTML = `
            <input type="checkbox" class="new-chat-cb" value="${emp.id}" data-name="${sanitize(emp.name)}" data-initials="${sanitize(emp.initials)}">
            <div class="user-info">
                <div class="avatar" style="width:36px;height:36px;font-size:14px;margin:0">${sanitize(emp.initials)}</div>
                <span class="user-select-name">${sanitize(emp.name)}</span>
            </div>
            <div class="custom-checkbox"></div>
        `
        label.querySelector('input').addEventListener('change', cb => {
            label.classList.toggle('selected', cb.target.checked)
            const selected = container.querySelectorAll('.new-chat-cb:checked')
            const grp = container.querySelector('#groupNameGroup')
            if (selected.length > 1) grp.classList.add('show')
            else grp.classList.remove('show')
        })
        list.appendChild(label)
    })
    container.querySelector('#newGroupName').value = ''
    container.querySelector('#groupNameGroup').classList.remove('show')
    container.querySelector('#newChatModal').classList.add('open')
}

async function createNewChat(container) {
    const selected = container.querySelectorAll('.new-chat-cb:checked')
    if (!selected.length) { showAlert('Veuillez sélectionner au moins une personne.', container); return }

    let newChatId, newChat
    if (selected.length === 1) {
        const otherId = selected[0].value
        newChatId = [myUserId, otherId].sort().join('_')
        newChat = { name: selected[0].dataset.name, isGroup: false, messages: [] }
    } else {
        newChatId = 'groupe_' + Date.now()
        const groupName = container.querySelector('#newGroupName').value.trim() || 'Nouveau Groupe'
        newChat = { name: groupName, isGroup: true, messages: [] }
    }

    if (!conversationsData[newChatId]) conversationsData[newChatId] = newChat
    if (hiddenChatIds.has(newChatId)) {
        hiddenChatIds.delete(newChatId)
        try { await supabase.from('chats_caches').delete().eq('user_id', myUserId).eq('chat_id', newChatId) } catch (e) { console.warn('[messagerie] Impossible de supprimer le cache chat:', e?.message) }
    }

    closeModal('newChatModal', container)
    renderContactList(container)
    openChat(newChatId, container)
}

// ── Masquer chat ──────────────────────────────────────────────────────────────
function askDeleteChat(chatId, container) {
    if (chatId === 'global') return
    currentChatIdToDelete = chatId
    container.querySelector('#confirmDeleteModal').classList.add('open')
}

function cancelDeleteChat(container) {
    closeModal('confirmDeleteModal', container)
    if (_currentlySwipedItem) { _currentlySwipedItem.classList.remove('swiped'); _currentlySwipedItem = null }
    currentChatIdToDelete = null
}

async function executeDeleteChat(container) {
    if (!currentChatIdToDelete || currentChatIdToDelete === 'global') return
    const chatId = currentChatIdToDelete
    try {
        const { error } = await supabase.from('chats_caches').upsert({ user_id: myUserId, chat_id: chatId }, { onConflict: 'user_id,chat_id' })
        if (error) throw error
    } catch (e) { showAlert('❌ Impossible de masquer : ' + e.message, container); return }
    hiddenChatIds.add(chatId)
    closeModal('confirmDeleteModal', container)
    if (currentChatId === chatId) {
        currentChatId = null
        container.querySelector('#chatHeaderName').textContent = 'Sélectionnez une discussion'
        container.querySelector('#chatHeaderAvatar').innerHTML = ''
        container.querySelector('#chatMessages').innerHTML = '<div style="text-align:center;color:#888;font-style:italic;margin-top:50px">Aucune conversation sélectionnée.</div>'
        closeChat(container)
    }
    renderContactList(container)
    currentChatIdToDelete = null
}

// ── Pièces jointes ────────────────────────────────────────────────────────────
function handleFileSelect(e, container) {
    selectedFiles = selectedFiles.concat(Array.from(e.target.files))
    renderPreviews(container)
    e.target.value = ''
}

function renderPreviews(container) {
    const preview = container.querySelector('#attachmentPreview')
    const attachBtn = container.querySelector('#attachBtn')
    _previewBlobUrls.forEach(u => URL.revokeObjectURL(u))
    _previewBlobUrls = []
    preview.innerHTML = ''
    if (selectedFiles.length > 0) {
        attachBtn.classList.add('active')
        selectedFiles.forEach((file, idx) => {
            const div = document.createElement('div')
            if (file.type.startsWith('image/')) {
                div.className = 'preview-item'
                const img = document.createElement('img')
                const blobUrl = URL.createObjectURL(file)
                _previewBlobUrls.push(blobUrl)
                img.src = blobUrl
                div.appendChild(img)
            } else {
                div.className = 'preview-item-file'
                const name = file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name
                div.innerHTML = `<div style="width:16px;height:16px"><svg><use href="#msg-file"/></svg></div><span>${sanitize(name)}</span>`
            }
            const rmBtn = document.createElement('button')
            rmBtn.className = 'remove-attachment'
            rmBtn.textContent = '×'
            rmBtn.addEventListener('click', () => { selectedFiles.splice(idx, 1); renderPreviews(container) })
            div.appendChild(rmBtn)
            preview.appendChild(div)
        })
    } else {
        attachBtn.classList.remove('active')
    }
}

// ── Réactions ─────────────────────────────────────────────────────────────────
function openFullPicker(container) {
    isCustomizing = false
    const fullPicker = container.querySelector('#fullPickerModal')
    if (fullPicker) fullPicker.style.display = 'flex'
    const reactionPicker = container.querySelector('#reactionPicker')
    if (reactionPicker) reactionPicker.style.display = 'none'
    renderTopQuickReactions(container)
    window.dispatchEvent(new CustomEvent('toggle_menu', { detail: { action: 'hide' } }))
}

function toggleCustomizeMode() {
    isCustomizing = !isCustomizing
    const btn = document.getElementById('btnToggleCustomize')
    if (!btn) return
    if (isCustomizing) {
        btn.textContent = 'Terminé'
        btn.style.color = 'var(--btn-green)'
        selectedCustomizeIndex = 0
    } else {
        btn.textContent = 'Personnaliser'
        btn.style.color = 'var(--btn-blue)'
        selectedCustomizeIndex = null
        localStorage.setItem('dussault_quick_reacts', JSON.stringify(quickReactions))
        const container = document.getElementById('app-container')
        if (container) renderQuickReactions(container)
    }
    const container = document.getElementById('app-container')
    if (container) renderTopQuickReactions(container)
}

function renderTopQuickReactions(container) {
    const c = container.querySelector('#topQuickReactions')
    if (!c) return
    c.innerHTML = ''
    quickReactions.forEach((emoji, index) => {
        const div = document.createElement('div')
        div.className = 'top-react-slot' + (isCustomizing && selectedCustomizeIndex === index ? ' active-slot' : '')
        div.textContent = emoji
        if (isCustomizing) {
            div.onclick = () => { selectedCustomizeIndex = index; renderTopQuickReactions(container) }
        } else {
            div.onclick = () => { selectReaction(emoji, container); closeModal('fullPickerModal', container) }
        }
        c.appendChild(div)
    })
}

function renderQuickReactions(container) {
    const list = document.getElementById('quickReactionsList')
    if (!list) return
    list.innerHTML = ''
    quickReactions.forEach(emoji => {
        const span = document.createElement('span')
        span.textContent = emoji
        span.addEventListener('click', () => selectReaction(emoji, container))
        list.appendChild(span)
    })
}

function showReactionPicker(e, msgId, container) {
    e.stopPropagation()
    currentReactMsgId = msgId
    const picker = document.getElementById('reactionPicker')
    if (!picker) return
    picker.style.display = 'flex'
    const rect = e.currentTarget.getBoundingClientRect()
    let top = rect.top - 55, left = rect.left - 130
    if (top < 10) top = rect.bottom + 10
    if (left < 10) left = 10
    if (left + 200 > window.innerWidth) left = window.innerWidth - 210
    picker.style.top = top + 'px'
    picker.style.left = left + 'px'
    renderQuickReactions(container)
}

async function selectReaction(emoji, container) {
    if (!currentReactMsgId || !currentChatId) return
    const chat = conversationsData[currentChatId]
    const msg = chat?.messages.find(m => m.id === currentReactMsgId || m.id == currentReactMsgId)
    if (msg) {
        msg.reaction = emoji
        renderMessages(chat.messages, false, container)
        try { await supabase.from('message').update({ reaction: emoji }).eq('id', currentReactMsgId) } catch (e) { console.warn('[messagerie] Impossible de sauvegarder la réaction:', e?.message) }
    }
    document.getElementById('reactionPicker').style.display = 'none'
}

async function removeReaction(msgId) {
    if (!currentChatId) return
    const chat = conversationsData[currentChatId]
    const msg = chat?.messages.find(m => m.id === msgId || m.id == msgId)
    if (msg) { msg.reaction = null; try { await supabase.from('message').update({ reaction: null }).eq('id', msgId) } catch {} }
}

// ── Long press / édition / suppression ───────────────────────────────────────
function attachLongPress(wrapper, msg, container) {
    const start = e => {
        const t = e.touches ? e.touches[0] : e
        _longPressStartXY = { x: t.clientX, y: t.clientY }
        _longPressTimer = setTimeout(() => {
            _longPressTimer = null
            try { navigator.vibrate?.(40) } catch {}
            openMessageActionMenu(msg, container)
        }, LONG_PRESS_MS)
    }
    const move = e => {
        if (!_longPressTimer || !_longPressStartXY) return
        const t = e.touches ? e.touches[0] : e
        if (Math.abs(t.clientX - _longPressStartXY.x) > 10 || Math.abs(t.clientY - _longPressStartXY.y) > 10) {
            clearTimeout(_longPressTimer); _longPressTimer = null
        }
    }
    const cancel = () => { if (_longPressTimer) { clearTimeout(_longPressTimer); _longPressTimer = null } }
    wrapper.addEventListener('touchstart', start, { passive: true })
    wrapper.addEventListener('touchmove', move, { passive: true })
    wrapper.addEventListener('touchend', cancel)
    wrapper.addEventListener('touchcancel', cancel)
    wrapper.addEventListener('mousedown', start)
    wrapper.addEventListener('mousemove', move)
    wrapper.addEventListener('mouseup', cancel)
    wrapper.addEventListener('mouseleave', cancel)
    wrapper.addEventListener('contextmenu', e => { e.preventDefault(); openMessageActionMenu(msg, container) })
}

function openMessageActionMenu(msg, container) {
    const ageMs = Date.now() - (msg.createdAt ? new Date(msg.createdAt).getTime() : 0)
    const canEdit = msg.type === 'text' && ageMs < 5 * 60 * 1000

    const overlay = document.createElement('div')
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(2px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px'
    overlay.innerHTML = `
        <div style="background:#2a2b35;border-radius:14px;padding:8px;min-width:240px;box-shadow:0 12px 40px rgba(0,0,0,0.5)">
            ${canEdit
                ? `<button data-act="edit" style="display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;background:transparent;border:none;color:#fff;font-size:15px;cursor:pointer;border-radius:10px;text-align:left"><svg style="width:18px;height:18px;stroke:var(--btn-blue);fill:none;stroke-width:2"><use href="#msg-edit"/></svg> Modifier</button>`
                : `<div style="display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;color:#666;font-size:13px;font-style:italic"><svg style="width:18px;height:18px;stroke:#666;fill:none;stroke-width:2;opacity:.5"><use href="#msg-edit"/></svg> Modifier (limite 5 min dépassée)</div>`}
            <button data-act="delete" style="display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;background:transparent;border:none;color:var(--btn-red);font-size:15px;cursor:pointer;border-radius:10px;text-align:left"><svg style="width:18px;height:18px;stroke:var(--btn-red);fill:none;stroke-width:2"><use href="#msg-trash"/></svg> Supprimer</button>
            <div style="height:1px;background:#444;margin:4px 12px"></div>
            <button data-act="cancel" style="display:flex;align-items:center;justify-content:center;width:100%;padding:14px 16px;background:transparent;border:none;color:#aaa;font-size:14px;cursor:pointer;border-radius:10px">Annuler</button>
        </div>
    `
    overlay.querySelectorAll('[data-act]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.body.removeChild(overlay)
            if (btn.dataset.act === 'edit') startEditMessage(msg, container)
            else if (btn.dataset.act === 'delete') confirmDeleteMessage(msg, container)
        })
    })
    overlay.addEventListener('click', e => { if (e.target === overlay) document.body.removeChild(overlay) })
    document.body.appendChild(overlay)
}

function startEditMessage(msg, container) {
    const input = container.querySelector('#messageInput')
    if (!input) return
    _editingMsgId = msg.id
    input.value = msg.text || ''
    input.focus()
    // Bannière de modification
    const old = container.querySelector('#editing-banner')
    if (old) old.remove()
    const banner = document.createElement('div')
    banner.id = 'editing-banner'
    banner.style.cssText = 'background:rgba(91,192,235,0.15);border-left:3px solid var(--btn-blue);padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;border-radius:6px'
    banner.innerHTML = `
        <div style="flex:1;min-width:0">
            <div style="font-size:11px;color:var(--btn-blue);font-weight:600;margin-bottom:2px">Modification du message</div>
            <div style="font-size:13px;color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sanitize(msg.text || '')}</div>
        </div>
        <button id="btnCancelEdit" style="background:transparent;border:none;color:#888;cursor:pointer;padding:4px;font-size:18px">×</button>
    `
    banner.querySelector('#btnCancelEdit').addEventListener('click', () => cancelEditMessage(container))
    const inputArea = container.querySelector('.chat-input-area')
    inputArea.parentElement.insertBefore(banner, inputArea)
}

function cancelEditMessage(container) {
    _editingMsgId = null
    const input = container.querySelector('#messageInput')
    if (input) input.value = ''
    const banner = container.querySelector('#editing-banner')
    if (banner) banner.remove()
}

async function saveEditedMessage(newText, container) {
    if (!_editingMsgId) return false
    const editedId = _editingMsgId
    try {
        const { error } = await supabase.from('message').update({ contenu: newText, edited_at: new Date().toISOString() }).eq('id', editedId).eq('expediteur_id', myUserId)
        if (error) throw error
        const chat = conversationsData[currentChatId]
        if (chat) {
            const m = chat.messages.find(x => x.id === editedId || x.id == editedId)
            if (m) { m.text = newText; m.editedAt = new Date().toISOString(); renderMessages(chat.messages, false, container) }
        }
        cancelEditMessage(container)
        return true
    } catch (e) { showAlert('Erreur lors de la modification : ' + (e.message || 'inconnue'), container); return false }
}

function confirmDeleteMessage(msg, container) {
    showConfirmAction('Supprimer ce message ?', async () => {
        try {
            const { error } = await supabase.from('message').update({ deleted_at: new Date().toISOString() }).eq('id', msg.id).eq('expediteur_id', myUserId)
            if (error) throw error
            const chat = conversationsData[currentChatId]
            if (chat) {
                const m = chat.messages.find(x => x.id === msg.id || x.id == msg.id)
                if (m) { m.deletedAt = new Date().toISOString(); renderMessages(chat.messages, false, container) }
            }
        } catch (e) { showAlert('Erreur lors de la suppression : ' + (e.message || 'inconnue'), container) }
    }, container)
}

// ── Swipe to delete ───────────────────────────────────────────────────────────
function attachSwipeListeners(container) {
    container.querySelectorAll('.contact-item.swipable').forEach(item => {
        if (item.dataset.swipeBound === '1') return
        item.dataset.swipeBound = '1'
        item.addEventListener('touchstart', onSwipeStart, { passive: true })
        item.addEventListener('touchmove', onSwipeMove, { passive: false })
        item.addEventListener('touchend', e => onSwipeEnd(e, container))
        item.addEventListener('touchcancel', e => onSwipeEnd(e, container))
        item.addEventListener('click', e => onSwipeClick(e, container), true)
    })
}

function onSwipeStart(e) {
    if (!e.touches || e.touches.length !== 1) return
    const t = e.touches[0]
    _swipeState = { item: e.currentTarget, startX: t.clientX, startY: t.clientY, currentDelta: 0, isHorizontal: null, wasSwiped: e.currentTarget.classList.contains('swiped') }
    e.currentTarget.classList.add('swiping')
}

function onSwipeMove(e) {
    if (!_swipeState || !e.touches || e.touches.length !== 1) return
    const t = e.touches[0]
    const dx = t.clientX - _swipeState.startX
    const dy = t.clientY - _swipeState.startY
    if (_swipeState.isHorizontal === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        _swipeState.isHorizontal = Math.abs(dx) > Math.abs(dy) * 0.8 && Math.abs(dy) < Math.abs(dx) * 1.5
        if (!_swipeState.isHorizontal) { _swipeState.item.classList.remove('swiping'); _swipeState = null; return }
    }
    e.preventDefault()
    let offset = _swipeState.wasSwiped ? -SWIPE_MAX + dx : dx
    if (offset > 0) offset = 0
    if (offset < -SWIPE_MAX - 30) offset = -SWIPE_MAX - 30
    _swipeState.currentDelta = offset
    _swipeState.item.style.transform = `translateX(${offset}px)`
}

function onSwipeEnd(e, container) {
    if (!_swipeState) return
    const item = _swipeState.item
    const delta = Math.abs(_swipeState.currentDelta)
    item.classList.remove('swiping')
    item.style.transform = ''
    if (delta >= SWIPE_THRESHOLD_DELETE) {
        item.classList.remove('swiped')
        const chatId = item.dataset.chatId
        if (chatId) askDeleteChat(chatId, container)
    } else if (delta >= SWIPE_THRESHOLD_OPEN) {
        container.querySelectorAll('.contact-item.swiped').forEach(el => { if (el !== item) el.classList.remove('swiped') })
        item.classList.add('swiped')
        _currentlySwipedItem = item
    } else {
        item.classList.remove('swiped')
        if (_currentlySwipedItem === item) _currentlySwipedItem = null
    }
    _swipeState = null
}

function onSwipeClick(e, container) {
    const item = e.currentTarget
    if (item.classList.contains('swiped')) {
        e.preventDefault(); e.stopPropagation()
        item.classList.remove('swiped')
        if (_currentlySwipedItem === item) _currentlySwipedItem = null
        return
    }
    if (_currentlySwipedItem && _currentlySwipedItem !== item) {
        _currentlySwipedItem.classList.remove('swiped'); _currentlySwipedItem = null
    }
}

// ── Utilitaires ───────────────────────────────────────────────────────────────
function showAlert(msg, container) {
    const el = container.querySelector('#alertMessage')
    if (el) el.textContent = msg
    container.querySelector('#alertModal').classList.add('open')
}

function showConfirmAction(msg, callback, container) {
    container.querySelector('#confirmActionMsg').textContent = msg
    container._confirmCallback = callback
    container.querySelector('#confirmActionModal').classList.add('open')
}

function closeModal(id, container) {
    container.querySelector(`#${id}`)?.classList.remove('open')
}