var e=null,t=null,n=null,r=null,i=null,a=!1,o=null,s=!1;function c(){if(document.getElementById(`signature-fd-styles`))return;let e=document.createElement(`style`);e.id=`signature-fd-styles`,e.textContent=`
        #sig-fd-modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 9999; justify-content: center; align-items: center; flex-direction: column; padding: 20px; box-sizing: border-box; }
        #sig-fd-modal.show { display: flex; animation: sigFdFade 0.2s ease; }
        @keyframes sigFdFade { from { opacity: 0; } to { opacity: 1; } }
        #sig-fd-modal .sig-fd-title { color: #fcca46; font-size: 18px; font-weight: bold; margin-bottom: 12px; text-align: center; }
        #sig-fd-modal .sig-fd-canvas-wrap { width: 100%; max-width: 700px; background: white; border-radius: 8px; position: relative; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
        #sig-fd-canvas { width: 100%; height: 350px; touch-action: none; display: block; cursor: crosshair; border-radius: 8px; }
        #sig-fd-modal .sig-fd-hint { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #aaa; font-style: italic; font-size: 16px; pointer-events: none; user-select: none; transition: opacity 0.2s; }
        #sig-fd-modal .sig-fd-hint.hidden { opacity: 0; }
        #sig-fd-modal .sig-fd-actions { display: flex; gap: 10px; margin-top: 16px; width: 100%; max-width: 700px; flex-wrap: wrap; }
        #sig-fd-modal .sig-fd-btn { flex: 1; min-width: 100px; padding: 14px 20px; border-radius: 6px; border: none; font-weight: bold; font-size: 15px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: 0.15s; }
        #sig-fd-modal .sig-fd-btn:active { transform: scale(0.97); }
        #sig-fd-modal .sig-fd-btn-clear { background: #343a40; color: white; }
        #sig-fd-modal .sig-fd-btn-cancel { background: #ff4d4d; color: white; }
        #sig-fd-modal .sig-fd-btn-ok { background: #28a745; color: white; }
        #sig-fd-modal .sig-fd-btn-ok:disabled { background: #555; cursor: not-allowed; }
        @media (max-width: 768px) {
            #sig-fd-modal { padding: 10px; }
            #sig-fd-canvas { height: 60vh; min-height: 250px; }
            #sig-fd-modal .sig-fd-actions { flex-direction: column; }
            #sig-fd-modal .sig-fd-btn { width: 100%; padding: 16px; }
        }
        @media (max-width: 932px) and (orientation: landscape) {
            #sig-fd-modal { padding: 8px; gap: 8px; }
            #sig-fd-modal .sig-fd-title { font-size: 14px; margin-bottom: 4px; }
            #sig-fd-canvas { height: calc(100vh - 130px); min-height: 150px; max-height: 70vh; }
            #sig-fd-modal .sig-fd-actions { flex-direction: row; margin-top: 8px; flex-wrap: nowrap; }
            #sig-fd-modal .sig-fd-btn { padding: 10px 14px; font-size: 13px; min-width: 0; }
        }
        #sig-fd-rotate-hint { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 10000; color: white; text-align: center; flex-direction: column; justify-content: center; align-items: center; padding: 30px; box-sizing: border-box; }
        #sig-fd-rotate-hint.show { display: flex; }
        #sig-fd-rotate-hint .rotate-icon { width: 80px; height: 80px; margin-bottom: 25px; animation: sigFdRotate 1.8s ease-in-out infinite; color: #fcca46; }
        @keyframes sigFdRotate { 0%, 100% { transform: rotate(0deg); } 40%, 60% { transform: rotate(90deg); } }
        .sig-box.has-signature { position: relative; }
        .sig-box.has-signature::before { content: "✓ Signé"; position: absolute; top: 2px; right: 4px; color: #28a745; font-size: 11px; font-weight: bold; background: white; padding: 2px 6px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); z-index: 2; pointer-events: none; }
    `,document.head.appendChild(e)}function l(){if(e)return;c(),e=document.createElement(`div`),e.id=`sig-fd-modal`,e.innerHTML=`
        <div class="sig-fd-title" id="sig-fd-title">Signez dans la zone ci-dessous</div>
        <div class="sig-fd-canvas-wrap">
            <canvas id="sig-fd-canvas"></canvas>
            <div class="sig-fd-hint" id="sig-fd-hint">Signez ici avec votre doigt ou la souris</div>
        </div>
        <div class="sig-fd-actions">
            <button class="sig-fd-btn sig-fd-btn-clear" data-action="clear">↺ Effacer</button>
            <button class="sig-fd-btn sig-fd-btn-cancel" data-action="cancel">Annuler</button>
            <button class="sig-fd-btn sig-fd-btn-ok" data-action="ok" disabled>✓ Valider</button>
        </div>
    `,document.body.appendChild(e);let r=document.createElement(`div`);r.id=`sig-fd-rotate-hint`,r.innerHTML=`
        <svg class="rotate-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
        </svg>
        <h2>Tournez votre téléphone</h2>
        <p>Pour signer plus confortablement, mettez votre téléphone à l'horizontale.</p>
    `,document.body.appendChild(r),t=e.querySelector(`#sig-fd-canvas`),n=t.getContext(`2d`),e.addEventListener(`click`,e=>{let t=e.target.closest(`[data-action]`)?.dataset.action;t===`clear`?f():t===`cancel`?x():t===`ok`&&S()}),document.addEventListener(`keydown`,t=>{e.classList.contains(`show`)&&t.key===`Escape`&&x()}),t.addEventListener(`mousedown`,g),t.addEventListener(`mousemove`,_),window.addEventListener(`mouseup`,v),t.addEventListener(`mouseleave`,v),t.addEventListener(`touchstart`,g,{passive:!1}),t.addEventListener(`touchmove`,_,{passive:!1}),t.addEventListener(`touchend`,v),t.addEventListener(`touchcancel`,v),window.addEventListener(`resize`,()=>{if(!e.classList.contains(`show`))return;let r=s?t.toDataURL():null;if(d(),r){let e=new Image;e.onload=()=>n.drawImage(e,0,0,t.clientWidth,t.clientHeight),e.src=r}u()}),window.addEventListener(`orientationchange`,()=>{e.classList.contains(`show`)&&setTimeout(u,100)})}function u(t=!1){let n=document.getElementById(`sig-fd-rotate-hint`);if(!n)return;if(!t&&(!e||!e.classList.contains(`show`))){n.classList.remove(`show`);return}let r=window.innerWidth<900||window.matchMedia(`(pointer: coarse)`).matches,i=window.innerHeight>window.innerWidth;n.classList.toggle(`show`,r&&i)}function d(){let e=Math.max(window.devicePixelRatio||1,1);t.width=t.clientWidth*e,t.height=t.clientHeight*e,n.scale(e,e),n.lineWidth=2.5,n.lineCap=`round`,n.lineJoin=`round`,n.strokeStyle=`#000`,n.imageSmoothingEnabled=!0,n.imageSmoothingQuality=`high`}function f(){n.clearRect(0,0,t.width,t.height),s=!1,p(),m()}function p(){let e=document.getElementById(`sig-fd-hint`);e&&e.classList.toggle(`hidden`,s)}function m(){let t=e?.querySelector(`[data-action="ok"]`);t&&(t.disabled=!s)}function h(e){let n=t.getBoundingClientRect();return e.touches?.[0]?{x:e.touches[0].clientX-n.left,y:e.touches[0].clientY-n.top}:{x:e.clientX-n.left,y:e.clientY-n.top}}function g(e){if(e.preventDefault(),a=!0,o=h(e),n.beginPath(),n.moveTo(o.x,o.y),n.lineTo(o.x+.1,o.y),n.stroke(),e.type===`touchstart`&&navigator.vibrate)try{navigator.vibrate(10)}catch{}}function _(e){if(!a)return;e.preventDefault();let t=h(e),r=(o.x+t.x)/2,i=(o.y+t.y)/2;n.quadraticCurveTo(o.x,o.y,r,i),n.stroke(),o=t,s=!0,p(),m()}function v(){a&&(a=!1,o&&(n.lineTo(o.x,o.y),n.stroke()),n.beginPath())}function y(a){l(),r=a,i=a.src&&a.src!==``&&!a.src.endsWith(`/`)?a.src:null;let o=document.getElementById(`sig-fd-title`);o&&(o.textContent=(a.parentElement?.querySelector(`.sig-text`))?.textContent.trim()||`Signez dans la zone ci-dessous`),e.classList.add(`show`),window.dispatchEvent(new CustomEvent(`signature_mode`,{detail:{action:`enter`}})),u(!0),setTimeout(()=>{if(d(),i){let e=new Image;e.onload=()=>{n.drawImage(e,0,0,t.clientWidth,t.clientHeight),s=!0,p(),m()},e.src=i}else f()},30)}function b(){e?.classList.remove(`show`),window.dispatchEvent(new CustomEvent(`signature_mode`,{detail:{action:`exit`}})),r=null,i=null,a=!1,o=null,s=!1;let t=document.getElementById(`sig-fd-rotate-hint`);t&&t.classList.remove(`show`)}function x(){b()}function S(){!r||!s||(r.src=t.toDataURL(`image/png`),C(r),b())}function C(e){if(!e)return;let t=e.src&&e.src!==``&&!e.src.endsWith(`/`),n=e.closest(`.sig-box`);n&&n.classList.toggle(`has-signature`,t),e.classList.toggle(`has-signature`,t)}function w(e){(e||document).querySelectorAll(`.display-sig`).forEach(C)}function T(e){e&&(e.onclick=t=>{t.preventDefault(),e.style.pointerEvents!==`none`&&y(e)},C(e))}function E(e){e&&e.querySelectorAll(`.display-sig`).forEach(T)}function D(e){!e||!window.MutationObserver||new MutationObserver(e=>{for(let t of e)t.type===`attributes`&&t.attributeName===`src`&&t.target.classList.contains(`display-sig`)&&C(t.target),t.type===`childList`&&t.addedNodes.forEach(e=>{e.nodeType===1&&(e.classList?.contains(`display-sig`)?[e]:e.querySelectorAll?.(`.display-sig`)||[]).forEach(e=>{T(e),C(e)})})}).observe(e,{childList:!0,subtree:!0,attributes:!0,attributeFilter:[`src`]})}export{w as n,D as r,E as t};