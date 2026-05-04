const KEY = "gilgitify_admin_v1";
const SESSION_KEY = "gilgitify_admin_session_v1";
const RESET_KEY = "gilgitify_admin_reset_v1";

export interface AdminCreds {
  email: string;
  password: string;
}

const DEFAULTS: AdminCreds = {
  email: "zahidali151272@gmail.com",
  password: "Zahid.313",
};

export function getAdminCreds(): AdminCreds {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.email && parsed?.password) return parsed;
    }
  } catch {
    /* ignore */
  }
  localStorage.setItem(KEY, JSON.stringify(DEFAULTS));
  return DEFAULTS;
}

export function saveAdminCreds(creds: AdminCreds) {
  localStorage.setItem(KEY, JSON.stringify(creds));
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
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ until: Date.now() + hours * 3600_000 })
  );
}

export function clearAdminSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

interface ResetEntry {
  code: string;
  expires: number;
}

export function saveResetCode(code: string, ttlMinutes = 15) {
  const entry: ResetEntry = { code, expires: Date.now() + ttlMinutes * 60_000 };
  localStorage.setItem(RESET_KEY, JSON.stringify(entry));
}

export function consumeResetCode(input: string): boolean {
  try {
    const raw = localStorage.getItem(RESET_KEY);
    if (!raw) return false;
    const entry: ResetEntry = JSON.parse(raw);
    if (entry.expires < Date.now()) {
      localStorage.removeItem(RESET_KEY);
      return false;
    }
    if (entry.code !== input.trim()) return false;
    localStorage.removeItem(RESET_KEY);
    return true;
  } catch {
    return false;
  }
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function notifyAdmin(subject: string, message: string, extra?: Record<string, string | number>): Promise<boolean> {
  const { email } = getAdminCreds();
  return sendFormSubmit(email, subject, message, extra);
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

export async function sendResetEmail(toEmail: string, code: string): Promise<boolean> {
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(toEmail)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: "Gilgitify Admin — Password Reset Code",
        _template: "box",
        _captcha: "false",
        message: `Your Gilgitify admin password reset code is: ${code}\n\nThis code expires in 15 minutes. If you did not request this, please ignore this email.`,
        code,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
