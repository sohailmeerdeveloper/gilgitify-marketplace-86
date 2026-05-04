// Admin auth: tries the Hostinger PHP API first; falls back to a local file
// (public/data/admin.json) + per-device localStorage override when no PHP.

const SESSION_KEY = "gilgitify_admin_session_v1";
const OVERRIDE_KEY = "gilgitify_admin_override_v1";
const RESET_KEY = "gilgitify_admin_reset_v1";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API_AUTH = `${BASE}/api/auth.php`;
const ADMIN_FILE = `${BASE}/data/admin.json`;

interface AdminFile {
  email: string;
  passwordHash: string;
}

const FALLBACK: AdminFile = {
  email: "zahidali151272@gmail.com",
  // SHA-256 of "Zahid.313"
  passwordHash: "c9fc6420ab775dc6d8ad8c82e3c1a545696162e7b17cd7bf9d860263db27f05b",
};

let apiAvailable: boolean | null = null;
let cached: AdminFile | null = null;

async function callApi(action: string, body?: unknown): Promise<unknown | null> {
  try {
    const init: RequestInit = body
      ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      : { method: "GET", cache: "no-store" };
    const res = await fetch(`${API_AUTH}?action=${action}`, init);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("json")) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function probeApi(): Promise<boolean> {
  if (apiAvailable !== null) return apiAvailable;
  const data = await callApi("email") as { email?: string } | null;
  apiAvailable = Boolean(data && typeof data.email === "string");
  return apiAvailable;
}

async function loadAdminFile(): Promise<AdminFile> {
  const override = localStorage.getItem(OVERRIDE_KEY);
  if (override) {
    try { return JSON.parse(override) as AdminFile; } catch { /* ignore */ }
  }
  if (cached) return cached;
  try {
    const res = await fetch(ADMIN_FILE, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as AdminFile;
      cached = data;
      return data;
    }
  } catch { /* ignore */ }
  cached = FALLBACK;
  return FALLBACK;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function fetchAdminEmail(): Promise<string> {
  if (await probeApi()) {
    const data = await callApi("email") as { email?: string } | null;
    if (data?.email) {
      localStorage.setItem("gilgitify_admin_email_cache", data.email);
      return data.email;
    }
  }
  return (await loadAdminFile()).email;
}

export function getCachedAdminEmail(): string {
  return localStorage.getItem("gilgitify_admin_email_cache")
    || (() => {
        const ov = localStorage.getItem(OVERRIDE_KEY);
        if (ov) { try { return (JSON.parse(ov) as AdminFile).email; } catch { /* ignore */ } }
        return cached?.email || FALLBACK.email;
      })();
}

export async function verifyAdminLogin(email: string, password: string): Promise<boolean> {
  if (await probeApi()) {
    const data = await callApi("verify", { email, password }) as { ok?: boolean } | null;
    return Boolean(data?.ok);
  }
  const a = await loadAdminFile();
  const hash = await sha256(password);
  return email.trim().toLowerCase() === a.email.toLowerCase() && hash === a.passwordHash;
}

export async function changeAdminEmail(currentPassword: string, newEmail: string): Promise<boolean> {
  if (await probeApi()) {
    const data = await callApi("updateEmail", { currentPassword, newEmail }) as { ok?: boolean } | null;
    if (data?.ok) localStorage.setItem("gilgitify_admin_email_cache", newEmail);
    return Boolean(data?.ok);
  }
  const a = await loadAdminFile();
  if ((await sha256(currentPassword)) !== a.passwordHash) return false;
  const next = { ...a, email: newEmail };
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(next));
  cached = next;
  return true;
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<boolean> {
  if (await probeApi()) {
    const data = await callApi("updatePassword", { currentPassword, newPassword }) as { ok?: boolean } | null;
    return Boolean(data?.ok);
  }
  const a = await loadAdminFile();
  if ((await sha256(currentPassword)) !== a.passwordHash) return false;
  const next = { ...a, passwordHash: await sha256(newPassword) };
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(next));
  cached = next;
  return true;
}

export async function requestAdminResetCode(): Promise<string | null> {
  if (await probeApi()) {
    const data = await callApi("requestReset") as { code?: string } | null;
    return data?.code || null;
  }
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  localStorage.setItem(RESET_KEY, JSON.stringify({ code, expires: Date.now() + 15 * 60_000 }));
  return code;
}

export async function consumeAdminResetCode(input: string, newPassword: string): Promise<boolean> {
  if (await probeApi()) {
    const data = await callApi("consumeReset", { code: input.trim(), newPassword }) as { ok?: boolean } | null;
    return Boolean(data?.ok);
  }
  try {
    const raw = localStorage.getItem(RESET_KEY);
    if (!raw) return false;
    const entry = JSON.parse(raw) as { code: string; expires: number };
    if (entry.expires < Date.now() || entry.code !== input.trim()) return false;
    localStorage.removeItem(RESET_KEY);
    const a = await loadAdminFile();
    const next = { ...a, passwordHash: await sha256(newPassword) };
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(next));
    cached = next;
    return true;
  } catch {
    return false;
  }
}

export function isAdminLoggedIn(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const { until } = JSON.parse(raw);
    return typeof until === "number" && until > Date.now();
  } catch {
    return false;
  }
}

export function setAdminSession(hours = 12) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ until: Date.now() + hours * 3600_000 }));
}

export function clearAdminSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function sendFormSubmit(toEmail: string, subject: string, message: string, extra?: Record<string, string | number>): Promise<boolean> {
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(toEmail)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: subject,
        _template: "box",
        _captcha: "false",
        message,
        ...(extra || {}),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function notifyAdmin(subject: string, message: string, extra?: Record<string, string | number>): Promise<boolean> {
  const email = await fetchAdminEmail();
  return sendFormSubmit(email, subject, message, extra);
}

export async function sendResetEmail(toEmail: string, code: string): Promise<boolean> {
  return sendFormSubmit(
    toEmail,
    "Gilgitify Admin — Password Reset Code",
    `Your Gilgitify admin password reset code is: ${code}\n\nThis code expires in 15 minutes. If you did not request this, please ignore this email.`,
    { code }
  );
}

// Backwards-compat helper for callers that still expect the synchronous reset-code API.
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function saveResetCode(code: string, ttlMinutes = 15) {
  localStorage.setItem(RESET_KEY, JSON.stringify({ code, expires: Date.now() + ttlMinutes * 60_000 }));
}
