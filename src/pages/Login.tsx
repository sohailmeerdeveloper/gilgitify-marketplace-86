import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/StoreContext";
import { toast } from "sonner";

const Login = () => {
  const { login } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(email, password);
    if (!res.ok) return toast.error(res.msg!);
    toast.success("Welcome back!");
    nav("/");
  };

  return (
    <Layout>
      <div className="container py-16 max-w-md">
        <div className="bg-card rounded-3xl p-8 shadow-elevated">
          <h1 className="font-display text-4xl text-primary-deep text-center mb-2">Welcome Back</h1>
          <p className="text-center text-muted-foreground mb-6">Login to continue shopping</p>
          <form onSubmit={submit} className="space-y-4">
            <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1" /></div>
            <div><Label>Password</Label><Input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-1" /></div>
            <Button type="submit" className="w-full rounded-full" size="lg">Login</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            New here? <Link to="/signup" className="text-primary font-semibold hover:underline">Create an account</Link>
          </p>
          <p className="text-center text-xs text-muted-foreground mt-2">Admin: admin@gilgitify.pk / admin123</p>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
