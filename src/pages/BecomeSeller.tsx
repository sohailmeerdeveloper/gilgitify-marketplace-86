import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitApplication } from "@/lib/vendor";
import { categories } from "@/data/products";
import { toast } from "sonner";
import { Store, CheckCircle2, ShieldCheck, Wallet } from "lucide-react";
import { sendFormSubmit, getCachedAdminEmail } from "@/lib/adminAuth";

const BecomeSeller = () => {
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    shopName: "",
    shopDescription: "",
    shopCategory: "general",
  });

  const change = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(s => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.email || !form.shopName || !form.shopDescription) {
      toast.error("Please fill all the fields");
      return;
    }
    if (form.password.length < 4) return toast.error("Password must be at least 4 characters");
    if (form.password !== form.confirmPassword) return toast.error("Passwords do not match");

    setBusy(true);
    const res = await submitApplication({
      fullName: form.fullName,
      phone: form.phone,
      email: form.email,
      password: form.password,
      shopName: form.shopName,
      shopDescription: form.shopDescription,
      shopCategory: form.shopCategory,
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.msg || "Could not submit your application");
      return;
    }
    setSubmitted(true);
    toast.success("Application submitted! Admin will review it shortly.");

    const adminEmail = getCachedAdminEmail();
    if (adminEmail) {
      sendFormSubmit(
        adminEmail,
        `New seller application from ${form.fullName}`,
        `Someone wants to open a store on Gilgitify.\n\nName: ${form.fullName}\nPhone: ${form.phone}\nEmail: ${form.email}\nShop name: ${form.shopName}\nCategory: ${form.shopCategory}\n\nDetails:\n${form.shopDescription}\n\nReview this in Admin → Applications.`,
      );
    }
  };

  if (submitted) {
    return (
      <Layout>
        <div className="container py-16 max-w-xl mx-auto">
          <div className="bg-card rounded-3xl shadow-card p-8 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="font-display text-3xl text-primary-deep mb-2">Application received!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you, {form.fullName}. Admin will call you on <b>{form.phone}</b> to confirm your premium plan
              payment (cash). Once approved, log in at <b>/vendor</b> using <b>{form.email}</b> and the password you set.
            </p>
            <Button onClick={() => setSubmitted(false)} variant="outline" className="rounded-full">Submit another</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-primary py-12">
        <div className="container text-center text-white">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-white/15 items-center justify-center mb-3">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="font-display text-5xl md:text-6xl mb-2">Sell on Gilgitify</h1>
          <p className="text-white/85 max-w-2xl mx-auto">
            Open your own online store on Gilgitify — just like Amazon or Daraz. Reach customers across Gilgit-Baltistan
            from your own dashboard.
          </p>
        </div>
      </section>

      <div className="container py-10 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-3xl shadow-card p-6">
          <h2 className="font-display text-2xl text-primary-deep mb-1">Apply to open your store</h2>
          <p className="text-sm text-muted-foreground mb-5">It only takes a minute. Admin will call you to confirm.</p>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Your full name</Label>
                <Input value={form.fullName} onChange={change("fullName")} required />
              </div>
              <div>
                <Label>Phone number</Label>
                <Input value={form.phone} onChange={change("phone")} required placeholder="03xx xxxxxxx" />
              </div>
            </div>
            <div>
              <Label>Email address</Label>
              <Input type="email" value={form.email} onChange={change("email")} required placeholder="you@example.com" />
              <p className="text-xs text-muted-foreground mt-1">You'll log in to your vendor dashboard with this email.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Set a password</Label>
                <Input type="password" value={form.password} onChange={change("password")} required minLength={4} />
              </div>
              <div>
                <Label>Confirm password</Label>
                <Input type="password" value={form.confirmPassword} onChange={change("confirmPassword")} required minLength={4} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Shop / store name</Label>
                <Input value={form.shopName} onChange={change("shopName")} required placeholder="e.g. Hunza Dry Fruits" />
              </div>
              <div>
                <Label>What category do you sell?</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.shopCategory}
                  onChange={change("shopCategory")}
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Tell us about your shop and what you sell</Label>
              <Textarea
                value={form.shopDescription}
                onChange={change("shopDescription")}
                required
                rows={5}
                placeholder="e.g. I have a dry fruit shop in Hunza, I sell apricots, walnuts, almonds and dried mulberries from local farmers."
              />
            </div>
            <Button type="submit" className="rounded-full w-full" disabled={busy}>
              {busy ? "Submitting..." : "Submit application"}
            </Button>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="bg-card rounded-3xl shadow-card p-5">
            <div className="flex items-center gap-2 font-bold text-primary-deep mb-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> How approval works
            </div>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>You submit this form (with email + password).</li>
              <li>Our admin calls you to confirm details.</li>
              <li>You pay the premium plan in <b>cash</b>.</li>
              <li>Admin approves your account.</li>
              <li>You log in at <code>/vendor</code> with your email + password and start adding products.</li>
            </ol>
          </div>
          <div className="bg-card rounded-3xl shadow-card p-5">
            <div className="flex items-center gap-2 font-bold text-primary-deep mb-2">
              <Wallet className="w-5 h-5 text-primary" /> Premium plan
            </div>
            <p className="text-sm text-muted-foreground">
              Payment is handled in cash directly with our admin — no online payment required. Pricing is shared during the
              approval call. If you don't pay, your store access can be paused or removed at any time.
            </p>
          </div>
        </aside>
      </div>
    </Layout>
  );
};

export default BecomeSeller;
