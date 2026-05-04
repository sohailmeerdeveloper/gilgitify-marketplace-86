import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "gilgitify_admin_session_v1";
const EMAIL_CACHE_KEY = "gilgitify_admin_email_v1";

const DEFAULT_EMAIL = "zahidali151272@gmail.com";

// Synchronous best-effort email read for UI. Real source of truth is Supabase.
export function getCachedAdminEmail(): string {
  return localStorage.getItem(EMAIL_CACHE_KEY) || DEFAULT_EMAIL;
}

export async function fetchAdminEmail(): Promise<string> {
  const { data, error } = await (supabase.rpc("get_admin_email" as never) as never) as unknown as { data: string | null; error: unknown };
  if (error || !data) return getCachedAdminEmail();
  localStorage.setItem(EMAIL_CACHE_KEY, data);
  return data;
}

export async function verifyAdminLogin(email: string, password: string): Promise<boolean> {
  const { data, error } = await (supabase.rpc("verify_admin" as never, { input_email: email, input_password: password }) as never) as unknown as { data: boolean | null; error: unknown };
  if (error) return false;
  return Boolean(data);
}

export async function changeAdminEmail(currentPassword: string, newEmail: string): Promise<boolean> {
  const { data, error } = await (supabase.rpc("update_admin_email" as never, { input_current_password: currentPassword, input_new_email: newEmail }) as never) as unknown as { data: boolean | null; error: unknown };
  if (error || !data) return false;
  localStorage.setItem(EMAIL_CACHE_KEY, newEmail);
  return true;
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<boolean> {
  const { data, error } = await (supabase.rpc("update_admin_password" as never, { input_current_password: currentPassword, input_new_password: newPassword }) as never) as unknown as { data: boolean | null; error: unknown };
  if (error) return false;
  return Boolean(data);
}

export async function requestAdminResetCode(): Promise<string | null> {
  const { data, error } = await (supabase.rpc("request_admin_reset" as never) as never) as unknown as { data: string | null; error: unknown };
  if (error || !data) return null;
  return data;
}

export async function consumeAdminResetCode(code: string, newPassword: string): Promise<boolean> {
  const { data, error } = await (supabase.rpc("consume_admin_reset" as never, { input_code: code.trim(), input_new_password: newPassword }) as never) as unknown as { data: boolean | null; error: unknown };
  if (error) return false;
  return Boolean(data);
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
