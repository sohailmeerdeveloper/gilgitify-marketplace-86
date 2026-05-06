// Signup + email verification using the PHP users.php endpoint.
// Server returns the 6-digit code; we hand it to FormSubmit (same pattern as
// the existing admin password reset flow). No Supabase, no migrations.

import { sendFormSubmit } from "@/lib/adminAuth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const URL_USERS = `${BASE}/api/users.php`;

interface SignupResult { ok: boolean; msg?: string; code?: string }

async function callUsers<T>(action: string, body: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`${URL_USERS}?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("json")) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

async function emailCode(email: string, code: string): Promise<boolean> {
  return sendFormSubmit(
    email,
    "Gilgitify — Your verification code",
    `Welcome to Gilgitify!\n\nYour 6-digit verification code is: ${code}\n\nEnter this code on the verification page to confirm your account. The code expires in 15 minutes.\n\nIf you did not request this, you can ignore this email.`,
    { code }
  );
}

// Used only by the resend button on the verify page.
export async function sendSignupCode(email: string): Promise<{ ok: boolean; msg?: string }> {
  const data = await callUsers<{ ok?: boolean; msg?: string; code?: string }>("resend", { email });
  if (!data?.ok || !data.code) return { ok: false, msg: data?.msg || "Could not send code" };
  const sent = await emailCode(email, data.code);
  if (!sent) return { ok: false, msg: "Could not send the email" };
  return { ok: true };
}

export async function signupAndSendCode(name: string, email: string, password: string): Promise<SignupResult> {
  const data = await callUsers<{ ok?: boolean; msg?: string; code?: string }>("signup", { name, email, password });
  if (!data?.ok || !data.code) return { ok: false, msg: data?.msg || "Could not create account" };
  const sent = await emailCode(email, data.code);
  if (!sent) return { ok: true, msg: "Account created, but we couldn't send the email. Use Resend on the next screen." };
  return { ok: true };
}

export async function verifySignupCode(email: string, code: string): Promise<boolean> {
  const data = await callUsers<{ ok?: boolean }>("verify", { email, code });
  return Boolean(data?.ok);
}
