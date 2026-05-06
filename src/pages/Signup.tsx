import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/StoreContext";
import { toast } from "sonner";
import { sendSignupCode } from "@/lib/signupVerification";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Signup = () => {
  const { signup } = useStore();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (name.length < 2) return toast.error("Enter your full name");
    if (!emailPattern.test(email)) return toast.error("Enter a valid email address");
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters");

    setSubmitting(true);
    const res = await signup(name, email, form.password);
    if (!res.ok) {
      setSubmitting(false);
      return toast.error(res.msg!);
    }

    // Fire the 6-digit verification email. Even if it fails (e.g. FormSubmit
    // not yet activated) we still let the user reach the verify screen so
    // they can hit "Resend code".
    const codeRes = await sendSignupCode(email);
    setSubmitting(false);
    if (!codeRes.ok) {
      toast.error(codeRes.msg || "Account created, but we couldn't send the code. Try Resend on the next screen.");
    } else {
      toast.success("Code sent! Check your email.");
    }
    nav(`/verify-email?email=${encodeURIComponent(email)}`);
  };

  return (
    <Layout>
      <div className="container py-16 max-w-md">
        <div className="bg-card rounded-3xl p-8 shadow-elevated">
          <h1 className="font-display text-4xl text-primary-deep text-center mb-2">Join Gilgitify</h1>
          <p className="text-center text-muted-foreground mb-6">Create your account — we'll email you a 6-digit code to verify.</p>
          <form onSubmit={submit} className="space-y-4">
            <div><Label>Full Name</Label><Input autoComplete="name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Email</Label><Input type="email" autoComplete="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
            <div><Label>Password</Label><Input type="password" autoComplete="new-password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="mt-1" /></div>
            <Button type="submit" className="w-full rounded-full" size="lg" disabled={submitting}>{submitting ? "Creating..." : "Sign Up"}</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Signup;
