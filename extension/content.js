// Atlas EHR Copilot — agentic chat overlay. Injects a draggable panel over any page
// (e.g. Epic). Connects to Epic via SMART-on-FHIR (in the background worker) and talks
// to the Atlas agent backend. Confirm-gated writes. Style-isolated in a shadow root.

(function () {
  if (window.__atlasAgentInjected) return;
  window.__atlasAgentInjected = true;

  const send = (msg) =>
    new Promise((resolve) =>
      chrome.runtime.sendMessage(msg, (r) => resolve(r || { ok: false, data: { error: "no response" } })),
    );

  const state = {
    open: false,
    minimized: false,
    connecting: false,
    connected: false,
    patient: null,
    messages: [], // {role:'user'|'atlas', text, actions:[], status}
    busy: false,
    ocrBusy: false,
    screenContext: "", // OCR text captured from the screen, prepended to the next message
    pos: null,
  };

  const TEAL = "#2a474e";
  const host = document.createElement("div");
  host.id = "atlas-agent-host";
  host.style.cssText = "all:initial;position:fixed;z-index:2147483647;";
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
  <style>
    *{box-sizing:border-box;font-family:"DM Sans",system-ui,-apple-system,"Segoe UI",sans-serif;}
    .fab{position:fixed;right:24px;bottom:24px;width:54px;height:54px;border-radius:999px;background:${TEAL};color:#fff;border:none;cursor:pointer;font-weight:700;font-size:18px;box-shadow:0 8px 24px rgba(42,71,78,.28);}
    .panel{position:fixed;width:400px;max-width:94vw;height:560px;max-height:88vh;display:flex;flex-direction:column;background:#fff;color:#1a2023;border:1px solid rgba(74,85,87,.2);border-radius:14px;overflow:hidden;box-shadow:0 16px 48px rgba(42,71,78,.20);}
    .bar{display:flex;align-items:center;justify-content:space-between;background:${TEAL};color:#fff;padding:9px 12px;cursor:grab;user-select:none;}
    .bar.drag{cursor:grabbing;}
    .bar .t{font-weight:600;}
    .bar .sub{font-size:11px;color:rgba(255,255,255,.65);margin-left:6px;}
    .bar button{background:transparent;border:none;color:#fff;cursor:pointer;font-size:15px;padding:2px 7px;border-radius:6px;}
    .bar button:hover{background:rgba(255,255,255,.16);}
    .body{flex:1;display:flex;flex-direction:column;min-height:0;}
    .conn{padding:14px;display:flex;flex-direction:column;gap:10px;align-items:center;justify-content:center;flex:1;text-align:center;}
    .conn p{color:#4a5557;font-size:13px;margin:0;}
    .btn{background:${TEAL};color:#fff;border:none;border-radius:8px;padding:9px 16px;font-weight:600;font-size:13px;cursor:pointer;}
    .btn:disabled{opacity:.5;cursor:not-allowed;}
    .btn.ghost{background:#fff;color:#ba1a1a;border:1px solid rgba(186,26,26,.5);}
    .btn.sm{padding:6px 11px;font-size:12px;}
    .status{display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:#f3f4f4;border-bottom:1px solid rgba(74,85,87,.15);font-size:11px;color:#4a5557;}
    .thread{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:10px;}
    .msg{max-width:88%;padding:8px 11px;border-radius:10px;font-size:13px;line-height:1.5;white-space:pre-wrap;}
    .msg.user{align-self:flex-end;background:${TEAL};color:#fff;border-bottom-right-radius:3px;}
    .msg.atlas{align-self:flex-start;background:#f3f4f4;color:#1a2023;border-bottom-left-radius:3px;}
    .actions{align-self:flex-start;width:88%;display:flex;flex-direction:column;gap:6px;}
    .act{border:1px solid rgba(74,85,87,.25);border-radius:8px;padding:8px;background:#fff;}
    .act .rt{font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#406372;font-weight:700;}
    .act .sm2{font-size:13px;color:#1a2023;margin-top:2px;}
    .act-row{display:flex;gap:6px;margin-top:4px;}
    .done{color:#557d6e;font-weight:600;font-size:12px;}
    .err{color:#ba1a1a;font-size:12px;}
    .composer{display:flex;gap:6px;padding:10px;border-top:1px solid rgba(74,85,87,.15);}
    textarea{flex:1;resize:none;height:40px;border:1px solid rgba(74,85,87,.25);border-radius:8px;padding:9px;font-size:13px;}
    textarea:focus{outline:2px solid ${TEAL};outline-offset:1px;border-color:${TEAL};}
    .hidden{display:none!important;}
    .hint{font-size:11px;color:#4a5557;}
  </style>
  <button class="fab" id="fab">A</button>
  <div class="panel hidden" id="panel">
    <div class="bar" id="bar">
      <div><span class="t">Atlas</span><span class="sub">EHR Agent</span></div>
      <div><button id="min">–</button><button id="close">×</button></div>
    </div>
    <div class="body" id="body"></div>
  </div>`;

  const $ = (s) => root.querySelector(s);
  const panel = $("#panel"), fab = $("#fab"), bar = $("#bar"), body = $("#body");

  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

  async function connect() {
    state.connecting = true; render();
    const r = await send({ kind: "connect" });
    state.connecting = false;
    if (r.ok && r.connected) {
      state.connected = true; state.patient = r.patient;
      state.messages.push({ role: "atlas", text: "Connected to Epic. Ask me anything about this patient, or tell me what to order, add, or record." });
    } else {
      state.messages.push({ role: "atlas", text: "Couldn't connect: " + ((r.data && r.data.error) || "auth failed") });
    }
    render();
  }

  async function sendMessage(text, displayText) {
    state.messages.push({ role: "user", text: displayText || text });
    state.busy = true; render();
    const history = state.messages
      .filter(m => m.role === "user" || (m.role === "atlas" && m.text))
      .slice(-8)
      .map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
    // drop the just-added user msg from history (it's the new message)
    history.pop();
    const r = await send({ kind: "agent", message: text, history });
    state.busy = false;
    if (r.ok && r.data) {
      state.messages.push({ role: "atlas", text: r.data.reply || "(no reply)", actions: r.data.proposedActions || [], status: "" });
    } else {
      state.messages.push({ role: "atlas", text: "Error: " + ((r.data && r.data.error) || "agent failed") });
    }
    render();
  }

  async function confirmActions(msg) {
    msg.status = "writing"; render();
    const r = await send({ kind: "execute", actions: msg.actions });
    if (r.ok && r.data) {
      const w = (r.data.written || []).length, e = (r.data.errors || []).length;
      msg.status = "done";
      msg.result = `Placed ${w} item(s)` + (e ? `, ${e} failed (${(r.data.errors[0]||{}).error||""})` : "") + ".";
    } else {
      msg.status = "error";
      msg.result = "Write failed: " + ((r.data && r.data.error) || "");
    }
    render();
  }

  function render() {
    fab.classList.toggle("hidden", state.open);
    panel.classList.toggle("hidden", !state.open);
    if (!state.open) return;
    if (state.pos) { panel.style.left=state.pos.x+"px"; panel.style.top=state.pos.y+"px"; panel.style.right="auto"; panel.style.bottom="auto"; }
    else { panel.style.right="24px"; panel.style.bottom="24px"; panel.style.left="auto"; panel.style.top="auto"; }
    if (state.minimized) { body.classList.add("hidden"); return; }
    body.classList.remove("hidden");

    if (!state.connected) {
      body.innerHTML = `<div class="conn">
        <div style="font-size:34px">🩺</div>
        <div style="font-weight:600">Atlas EHR Agent</div>
        <p>Connect to Epic via SMART-on-FHIR to read the chart and act on it — every change is confirmed by you.</p>
        <button class="btn" id="connect" ${state.connecting?"disabled":""}>${state.connecting?"Connecting…":"Connect to Epic"}</button>
        <p class="hint">Make sure the Atlas server is running (npm run dev).</p>
      </div>`;
      const c = $("#connect"); if (c) c.onclick = connect;
      return;
    }

    const msgsHtml = state.messages.map((m, i) => {
      if (m.role === "user") return `<div class="msg user">${escapeHtml(m.text)}</div>`;
      let html = `<div class="msg atlas">${escapeHtml(m.text)}</div>`;
      if (m.actions && m.actions.length) {
        const cards = m.actions.map(a => `<div class="act"><div class="rt">${escapeHtml(a.resourceType)}</div><div class="sm2">${escapeHtml(a.summary)}</div></div>`).join("");
        if (m.status === "done" || m.status === "error") {
          html += `<div class="actions">${cards}<div class="${m.status==='done'?'done':'err'}">${escapeHtml(m.result||"")}</div></div>`;
        } else {
          html += `<div class="actions">${cards}<div class="act-row"><button class="btn sm" data-confirm="${i}" ${m.status==='writing'?'disabled':''}>${m.status==='writing'?'Writing…':'Confirm '+m.actions.length}</button><button class="btn ghost sm" data-reject="${i}">Reject</button></div></div>`;
        }
      }
      return html;
    }).join("");

    body.innerHTML = `
      <div class="status"><span>Connected · Patient ${escapeHtml(String(state.patient||"").slice(0,12))}</span><button class="btn ghost sm" id="disc">Disconnect</button></div>
      <div class="thread" id="thread">${msgsHtml}${state.busy?'<div class="msg atlas">Atlas is working…</div>':''}</div>
      ${state.screenContext?`<div class="hint" style="padding:4px 10px 0;">🖼 Screen captured (${state.screenContext.length} chars) — included with your next message.</div>`:''}
      <div class="composer">
        <button class="btn sm" id="ocrbtn" title="Read the screen via OCR" ${state.ocrBusy?"disabled":""}>${state.ocrBusy?"…":"📷"}</button>
        <textarea id="inp" placeholder="Ask anything, or: order a CBC · add hypertension · summarize this patient"></textarea>
        <button class="btn" id="sendbtn" ${state.busy?"disabled":""}>➤</button>
      </div>`;

    const thread = $("#thread"); if (thread) thread.scrollTop = thread.scrollHeight;
    const inp = $("#inp");
    const doSend = () => {
      const t = inp.value.trim();
      if (!t || state.busy) return;
      inp.value = "";
      const msg = state.screenContext
        ? `On-screen EHR text (via OCR):\n${state.screenContext}\n\nQuestion: ${t}`
        : t;
      state.screenContext = "";
      sendMessage(msg, t);
    };
    $("#sendbtn").onclick = doSend;
    const ob = $("#ocrbtn");
    if (ob) ob.onclick = async () => {
      state.ocrBusy = true; render();
      const r = await send({ kind: "ocr" });
      state.ocrBusy = false;
      if (r.ok && r.text) state.screenContext = r.text;
      else state.messages.push({ role: "atlas", text: "Couldn't read the screen: " + ((r.data && r.data.error) || "OCR failed") });
      render();
    };
    inp.onkeydown = (e) => { if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); doSend(); } };
    $("#disc").onclick = async () => { await send({kind:"disconnect"}); state.connected=false; state.patient=null; state.messages=[]; render(); };
    root.querySelectorAll("[data-confirm]").forEach(b => b.onclick = () => confirmActions(state.messages[Number(b.getAttribute("data-confirm"))]));
    root.querySelectorAll("[data-reject]").forEach(b => b.onclick = () => { const m=state.messages[Number(b.getAttribute("data-reject"))]; m.actions=[]; m.status="rejected"; m.result="Rejected."; render(); });
  }

  fab.onclick = async () => { state.open = true; state.minimized = false; render(); const s = await send({kind:"status"}); if (s.ok && s.connected){ state.connected=true; state.patient=s.patient; } render(); };
  $("#close").onclick = () => { state.open = false; render(); };
  $("#min").onclick = () => { state.minimized = !state.minimized; render(); };

  // drag
  let dragging=false, off={x:0,y:0};
  bar.addEventListener("pointerdown", e => { if(e.target.tagName==="BUTTON") return; dragging=true; bar.classList.add("drag"); const r=panel.getBoundingClientRect(); off={x:e.clientX-r.left,y:e.clientY-r.top}; e.preventDefault(); });
  window.addEventListener("pointermove", e => { if(!dragging) return; state.pos={x:Math.min(Math.max(0,e.clientX-off.x),window.innerWidth-120),y:Math.min(Math.max(0,e.clientY-off.y),window.innerHeight-50)}; panel.style.left=state.pos.x+"px"; panel.style.top=state.pos.y+"px"; panel.style.right="auto"; panel.style.bottom="auto"; });
  window.addEventListener("pointerup", () => { dragging=false; bar.classList.remove("drag"); });

  chrome.runtime.onMessage.addListener((msg) => { if(msg && msg.kind==="toggle"){ state.open=!state.open; render(); } });

  render();
})();
