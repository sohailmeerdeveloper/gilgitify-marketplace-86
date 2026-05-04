const SESSION_KEY = "gilgitify_admin_session_v1";
const OVERRIDE_KEY = "gilgitify_admin_override_v1";
const RESET_KEY = "gilgitify_admin_reset_v1";

const ADMIN_FILE = `${import.meta.env.BASE_URL}data/admin.json`;

interface AdminFile {
  email: string;
  passwordHash: string;
}

const FALLBACK: AdminFile = {
  email: "zahidali151272@gmail.com",
  passwordHash: "c9fc6420ab775dc6d8ad8c82e3c1a545696162e7b17cd7bf9d860263db27f05b",
};

let cached: AdminFile | null = null;

async function loadAdmin(): Promise<AdminFile> {
  // Per-device override beats the repo file. (Lets you change the password
  // on this device without editing the file in GitHub.)
  const override = localStorage.getItem(OVERRIDE_KEY);
  if (override) {
    try { return JSON.parse(override); } catch { /* ignore corrupt override */ }
  }
  if (cached) return cached;
  try {
    const res = await fetch(ADMIN_FILE, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as AdminFile;
      cached = data;
      return data;
    }
  } catch { /* fall through to baked-in fallback */ }
  cached = FALLBACK;
  return FALLBACK;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function fetchAdminEmail(): Promise<string> {
  const a = await loadAdmin();
  return a.email;
}

export function getCachedAdminEmail(): string {
  const override = localStorage.getItem(OVERRIDE_KEY);
  if (override) {
    try { return (JSON.parse(override) as AdminFile).email; } catch { /* ignore */ }
  }
  return cached?.email || FALLBACK.email;
}

export async function verifyAdminLogin(email: string, password: string): Promise<boolean> {
  const a = await loadAdmin();
  const hash = await sha256(password);
  return email.trim().toLowerCase() === a.email.toLowerCase() && hash === a.passwordHash;
}

function saveOverride(next: AdminFile) {
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(next));
  cached = next;
}

export async function changeAdminEmail(currentPassword: string, newEmail: string): Promise<boolean> {
  const a = await loadAdmin();
  const hash = await sha256(currentPassword);
  if (hash !== a.passwordHash) return false;
  saveOverride({ ...a, email: newEmail });
  return true;
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<boolean> {
  const a = await loadAdmin();
  const hash = await sha256(currentPassword);
  if (hash !== a.passwordHash) return false;
  const newHash = await sha256(newPassword);
  saveOverride({ ...a, passwordHash: newHash });
  return true;
}

export async function getProposedAdminFile(email: string, password: string): Promise<AdminFile> {
  return { email, passwordHash: await sha256(password) };
}

interface ResetEntry { code: string; expires: number; }

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function saveResetCode(code: string, ttlMinutes = 15) {
  const entry: ResetEntry = { code, expires: Date.now() + ttlMinutes * 60_000 };
  localStorage.setItem(RESET_KEY, JSON.stringify(entry));
}

export async function requestAdminResetCode(): Promise<string> {
  const code = generateCode();
  saveResetCode(code);
  return code;
}

export async function consumeAdminResetCode(input: string, newPassword: string): Promise<boolean> {
  try {
    const raw = localStorage.getItem(RESET_KEY);
    if (!raw) return false;
    const entry: ResetEntry = JSON.parse(raw);
    if (entry.expires < Date.now() || entry.code !== input.trim()) return false;
    localStorage.removeItem(RESET_KEY);
    const a = await loadAdmin();
    saveOverride({ ...a, passwordHash: await sha256(newPassword) });
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
