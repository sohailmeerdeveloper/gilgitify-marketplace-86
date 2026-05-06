import { supabase } from "@/integrations/supabase/client";
import { sendFormSubmit } from "@/lib/adminAuth";

// Issues a 6-digit code in Supabase and emails it to the user via FormSubmit.
// Returns ok=true if both DB write and email succeed. The code itself is
// never returned to the frontend after sending — only the verify call uses it.
export async function sendSignupCode(email: string): Promise<{ ok: boolean; msg?: string }> {
  const clean = email.trim().toLowerCase();
  const { data, error } = await supabase.rpc("issue_signup_code", { _email: clean });
  if (error || !data) return { ok: false, msg: error?.message || "Could not generate code" };

  const code = String(data);
  const sent = await sendFormSubmit(
    clean,
    "Gilgitify — Your verification code",
    `Welcome to Gilgitify!\n\nYour 6-digit verification code is: ${code}\n\nEnter this code on the verification page to confirm your account. The code expires in 15 minutes.\n\nIf you did not request this, you can ignore this email.`,
    { code }
  );
  if (!sent) return { ok: false, msg: "Could not send verification email" };
  return { ok: true };
}

export async function verifySignupCode(email: string, code: string): Promise<boolean> {
  const clean = email.trim().toLowerCase();
  const { data, error } = await supabase.rpc("verify_signup_code", {
    _email: clean,
    _code: code.trim(),
  });
  if (error) return false;
  return Boolean(data);
}
