// SMART-on-FHIR auth for the Atlas extension. Runs in the background service worker
// (has chrome.identity + crypto.subtle). Public-client OAuth2 with PKCE — no secret.
// Session (token + patient + FHIR base) is stored in chrome.storage.local.

self.SMART = (() => {
  const b64url = (buf) =>
    btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const sha256 = (str) =>
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));

  function randomString(len = 48) {
    const a = new Uint8Array(len);
    crypto.getRandomValues(a);
    return b64url(a.buffer);
  }

  async function discover(fhirBaseUrl) {
    const base = fhirBaseUrl.replace(/\/$/, "");
    const r = await fetch(`${base}/.well-known/smart-configuration`, {
      headers: { Accept: "application/json" },
    });
    if (!r.ok) throw new Error(`SMART discovery failed (${r.status}). Is this a SMART FHIR base URL?`);
    const cfg = await r.json();
    if (!cfg.authorization_endpoint || !cfg.token_endpoint) {
      throw new Error("SMART configuration missing authorization/token endpoints");
    }
    return cfg;
  }

  // Run the full authorization-code + PKCE flow and persist the session.
  async function connect({ fhirBaseUrl, clientId, scope }) {
    const base = fhirBaseUrl.replace(/\/$/, "");
    const { authorization_endpoint, token_endpoint } = await discover(base);

    const redirectUri = chrome.identity.getRedirectURL(); // https://<ext-id>.chromiumapp.org/
    const verifier = randomString(48);
    const challenge = b64url(await sha256(verifier));
    const state = randomString(16);

    const authUrl = new URL(authorization_endpoint);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set(
      "scope",
      scope || "launch/patient openid fhirUser patient/*.read patient/*.write",
    );
    authUrl.searchParams.set("aud", base);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    const redirect = await chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true,
    });
    const u = new URL(redirect);
    if (u.searchParams.get("state") !== state) throw new Error("OAuth state mismatch");
    const code = u.searchParams.get("code");
    if (!code) throw new Error(u.searchParams.get("error") || "No authorization code returned");

    const form = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: verifier,
    });
    const tr = await fetch(token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    if (!tr.ok) {
      throw new Error(`Token exchange failed (${tr.status}): ${(await tr.text()).slice(0, 150)}`);
    }
    const tok = await tr.json();
    const session = {
      fhirBaseUrl: base,
      clientId,
      accessToken: tok.access_token,
      patient: tok.patient || null,
      scope: tok.scope || "",
      expiresAt: Date.now() + (tok.expires_in || 3600) * 1000,
    };
    await chrome.storage.local.set({ atlasSmart: session });
    return session;
  }

  async function getSession() {
    const { atlasSmart } = await chrome.storage.local.get("atlasSmart");
    if (!atlasSmart) return null;
    if (atlasSmart.expiresAt && atlasSmart.expiresAt < Date.now()) {
      await chrome.storage.local.remove("atlasSmart");
      return null;
    }
    return atlasSmart;
  }

  async function disconnect() {
    await chrome.storage.local.remove("atlasSmart");
  }

  // Authenticated FHIR call against the connected EHR.
  async function authedFetch(path, opts = {}) {
    const s = await getSession();
    if (!s) throw new Error("Not connected to an EHR");
    const headers = Object.assign(
      { Authorization: `Bearer ${s.accessToken}` },
      opts.headers || {},
    );
    return fetch(`${s.fhirBaseUrl}/${path.replace(/^\//, "")}`, { ...opts, headers });
  }

  return { discover, connect, getSession, disconnect, authedFetch };
})();
