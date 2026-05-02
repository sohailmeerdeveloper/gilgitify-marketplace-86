import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/StoreContext";
import { toast } from "sonner";

const Signup = () => {
  const { signup } = useStore();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    const res = signup(form.name, form.email, form.password);
    if (!res.ok) return toast.error(res.msg!);
    toast.success("Account created!");
    nav("/");
  };

  return (
    <Layout>
      <div className="container py-16 max-w-md">
        <div className="bg-card rounded-3xl p-8 shadow-elevated">
          <h1 className="font-display text-4xl text-primary-deep text-center mb-2">Join Gilgitify</h1>
          <p className="text-center text-muted-foreground mb-6">Create your account</p>
          <form onSubmit={submit} className="space-y-4">
            <div><Label>Full Name</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Email</Label><Input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
            <div><Label>Password</Label><Input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="mt-1" /></div>
            <Button type="submit" className="w-full rounded-full" size="lg">Sign Up</Button>
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
