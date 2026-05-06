import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck, Mail } from "lucide-react";
import { sendSignupCode, verifySignupCode } from "@/lib/signupVerification";

const VerifyEmail = () => {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean.includes("@")) return toast.error("Enter your email");
    if (code.trim().length !== 6) return toast.error("Enter the 6-digit code");
    setBusy(true);
    const ok = await verifySignupCode(clean, code.trim());
    setBusy(false);
    if (!ok) return toast.error("Invalid or expired code");
    toast.success("Email verified! Please log in.");
    nav("/login");
  };

  const resend = async () => {
    const clean = email.trim().toLowerCase();
    if (!clean.includes("@")) return toast.error("Enter your email first");
    setBusy(true);
    const res = await sendSignupCode(clean);
    setBusy(false);
    if (!res.ok) return toast.error(res.msg || "Could not send code");
    toast.success("New code sent. Check your email.");
    setResendIn(60);
  };

  return (
    <Layout>
      <div className="container py-16 max-w-md">
        <div className="bg-card rounded-3xl p-8 shadow-elevated">
          <div className="flex flex-col items-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="font-display text-3xl text-primary-deep">Verify your email</h1>
            <p className="text-sm text-muted-foreground mt-1 text-center">We sent a 6-digit code to your email. Enter it below to activate your account.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>6-digit code</Label>
              <Input
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="123456"
                className="mt-1 text-center tracking-[0.5em] font-mono text-lg"
              />
            </div>
            <Button type="submit" className="w-full rounded-full" size="lg" disabled={busy}>
              {busy ? "Verifying..." : "Verify email"}
            </Button>
            <button
              type="button"
              onClick={resend}
              disabled={busy || resendIn > 0}
              className="text-sm text-primary hover:underline w-full text-center disabled:opacity-50 disabled:no-underline inline-flex items-center justify-center gap-1"
            >
              <Mail className="w-3.5 h-3.5" />
              {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Wrong email? <Link to="/signup" className="text-primary font-semibold hover:underline">Sign up again</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default VerifyEmail;
