// Atlas extension background service worker.
// - Runs the SMART-on-FHIR auth (chrome.identity) against Epic.
// - Proxies agent calls to the Atlas backend, passing the Epic token so the backend
//   can read/write the real Epic chart while the Anthropic key stays server-side.

importScripts("config.js", "smart.js");

function summary(session) {
  if (!session) return { connected: false };
  return { connected: true, patient: session.patient, fhirBaseUrl: session.fhirBaseUrl };
}

async function callApi(path, body) {
  const res = await fetch(`${self.ATLAS_CONFIG.apiBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg.kind === "connect") {
        const session = await self.SMART.connect(self.ATLAS_CONFIG);
        sendResponse({ ok: true, ...summary(session) });
      } else if (msg.kind === "status") {
        sendResponse({ ok: true, ...summary(await self.SMART.getSession()) });
      } else if (msg.kind === "disconnect") {
        await self.SMART.disconnect();
        sendResponse({ ok: true, connected: false });
      } else if (msg.kind === "ocr") {
        // Capture the visible tab and OCR it server-side via Azure Document Intelligence.
        // The image only goes to our backend, never anywhere directly from the page.
        const dataUrl = await chrome.tabs.captureVisibleTab({ format: "png" });
        const r = await callApi("/api/vision", { image: dataUrl });
        sendResponse(r.ok && r.data ? { ok: true, text: r.data.text || "" } : r);
      } else if (msg.kind === "agent") {
        const s = await self.SMART.getSession();
        const fhir = s ? { baseUrl: s.fhirBaseUrl, token: s.accessToken } : undefined;
        const r = await callApi("/api/agent", {
          message: msg.message,
          history: msg.history || [],
          patientId: s ? s.patient : "screen",
          ...(fhir ? { fhir } : {}),
        });
        sendResponse(r);
      } else if (msg.kind === "execute") {
        const s = await self.SMART.getSession();
        if (!s) return sendResponse({ ok: false, data: { error: "Not connected" } });
        const r = await callApi("/api/agent/execute", {
          patientId: s.patient,
          actions: msg.actions,
          fhir: { baseUrl: s.fhirBaseUrl, token: s.accessToken },
        });
        sendResponse(r);
      } else {
        sendResponse({ ok: false, data: { error: "Unknown message" } });
      }
    } catch (e) {
      sendResponse({ ok: false, data: { error: String(e && e.message ? e.message : e) } });
    }
  })();
  return true; // async response
});

// Clicking the toolbar icon: inject the content script on demand (handles tabs that
// were open before the extension loaded), then toggle. Errors on restricted pages
// (chrome://, web store) are expected and swallowed.
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id == null) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
  } catch {
    /* restricted page — can't inject */
  }
  chrome.tabs.sendMessage(tab.id, { kind: "toggle" }).catch(() => {});
});
