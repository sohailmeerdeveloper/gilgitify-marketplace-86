import { Layout } from "@/components/Layout";
import { useStore } from "@/store/StoreContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo, useState } from "react";
import { Trash2, Edit, Plus, X, Bell, LogOut, Mail, KeyRound, ShieldCheck, Users, Package, ShoppingBag, Wallet, Clock, CheckCircle2, Store as StoreIcon, Inbox, Check, Ban, Power } from "lucide-react";
import { toast } from "sonner";
import { Product, Category } from "@/data/products";
import { useCategories } from "@/hooks/useCategories";
import { CategoriesPanel } from "@/components/admin/CategoriesPanel";
import { AdsPanel } from "@/components/admin/AdsPanel";
import {
  listApplications, approveApplication, rejectApplication,
  listAllStores, deleteStore, setStoreStatus, markPremiumPaid,
  StoreApplication, Store as VendorStore,
} from "@/lib/vendor";
import {
  fetchAdminEmail,
  getCachedAdminEmail,
  verifyAdminLogin,
  changeAdminEmail,
  changeAdminPassword,
  requestAdminResetCode,
  consumeAdminResetCode,
  isAdminLoggedIn,
  setAdminSession,
  clearAdminSession,
  sendResetEmail,
  notifyAdmin,
  sendFormSubmit,
} from "@/lib/adminAuth";

const empty = { name: "", price: 0, category: "grocery" as Category, image: "", description: "", unit: "1 kg", stock: 10 };

type AuthScreen = "login" | "forgot" | "reset";

const Admin = () => {
  const [authed, setAuthed] = useState<boolean>(() => isAdminLoggedIn());
  const [screen, setScreen] = useState<AuthScreen>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPwd, setLoginPwd] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await verifyAdminLogin(loginEmail.trim(), loginPwd);
    setBusy(false);
    if (ok) {
      setAdminSession();
      setAuthed(true);
      toast.success("Welcome back, admin");
    } else {
      toast.error("Incorrect email or password");
    }
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const adminEmail = await fetchAdminEmail();
    const code = await requestAdminResetCode();
    if (!code) {
      setBusy(false);
      return toast.error("Could not start reset. Try again later.");
    }
    const sent = await sendResetEmail(adminEmail, code);
    setBusy(false);
    if (sent) {
      toast.success(`Reset code sent to ${adminEmail}`);
      setScreen("reset");
    } else {
      toast.error("Could not send email. Check FormSubmit activation.");
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 4) return toast.error("Password too short");
    if (newPwd !== newPwd2) return toast.error("Passwords do not match");
    setBusy(true);
    const ok = await consumeAdminResetCode(resetCode, newPwd);
    setBusy(false);
    if (!ok) return toast.error("Invalid or expired code");
    toast.success("Password updated. Please log in.");
    setScreen("login");
    setResetCode(""); setNewPwd(""); setNewPwd2("");
  };

  if (!authed) {
    return (
      <Layout>
        <div className="container py-12 max-w-md mx-auto">
          <div className="bg-card rounded-3xl shadow-card p-8 animate-fade-in">
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h1 className="font-display text-3xl text-primary-deep">Admin Access</h1>
              <p className="text-sm text-muted-foreground mt-1">Restricted area — staff only</p>
            </div>

            {screen === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="admin@example.com" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" required value={loginPwd} onChange={e => setLoginPwd(e.target.value)} />
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</Button>
                <button type="button" onClick={() => setScreen("forgot")} className="text-sm text-primary hover:underline w-full text-center">
                  Forgot password?
                </button>
              </form>
            )}

            {screen === "forgot" && (
              <form onSubmit={handleSendReset} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We'll email a 6-digit reset code to the admin email on file.
                </p>
                <Button type="submit" disabled={busy} className="w-full rounded-full">
                  <Mail className="w-4 h-4 mr-2" /> {busy ? "Sending..." : "Send reset code"}
                </Button>
                <div className="flex justify-between text-sm">
                  <button type="button" onClick={() => setScreen("login")} className="text-primary hover:underline">Back to login</button>
                  <button type="button" onClick={() => setScreen("reset")} className="text-primary hover:underline">I have a code</button>
                </div>
              </form>
            )}

            {screen === "reset" && (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <Label>6-digit code</Label>
                  <Input required value={resetCode} onChange={e => setResetCode(e.target.value)} placeholder="123456" maxLength={6} />
                </div>
                <div>
                  <Label>New password</Label>
                  <Input type="password" required value={newPwd} onChange={e => setNewPwd(e.target.value)} />
                </div>
                <div>
                  <Label>Confirm password</Label>
                  <Input type="password" required value={newPwd2} onChange={e => setNewPwd2(e.target.value)} />
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={busy}>
                  <KeyRound className="w-4 h-4 mr-2" /> {busy ? "Updating..." : "Update password"}
                </Button>
                <button type="button" onClick={() => setScreen("login")} className="text-sm text-primary hover:underline w-full text-center">Back to login</button>
              </form>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return <Dashboard onLogout={() => { clearAdminSession(); setAuthed(false); setScreen("login"); }} />;
};

interface DashProps { onLogout: () => void }

const Dashboard = ({ onLogout }: DashProps) => {
  const { products, orders, addProduct, updateProduct, deleteProduct, updateOrderStatus } = useStore();
  const { categories } = useCategories();
  const [tab, setTab] = useState<"overview" | "products" | "categories" | "ads" | "orders" | "clients" | "applications" | "stores" | "settings">("overview");
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Product, "id">>(empty);
  const [productBusy, setProductBusy] = useState(false);

  const newOrders = orders.filter(o => o.status === "pending").length;
  const inQueue = orders.filter(o => ["pending", "preparing", "out_for_delivery"].includes(o.status)).length;
  const completed = orders.filter(o => o.status === "delivered").length;
  const today = new Date().toDateString();
  const revenueToday = orders
    .filter(o => o.status === "delivered" && new Date(o.createdAt).toDateString() === today)
    .reduce((s, o) => s + o.total, 0);
  const revenueAll = orders.filter(o => o.status === "delivered").reduce((s, o) => s + o.total, 0);
  const ordersToday = orders.filter(o => new Date(o.createdAt).toDateString() === today).length;

  const clients = useMemo(() => {
    const map = new Map<string, { key: string; name: string; phone: string; address: string; muhallah: string; orders: number; lastOrder: string; total: number }>();
    orders.forEach(o => {
      const key = `${o.phone || o.userId}`;
      const existing = map.get(key);
      if (existing) {
        existing.orders += 1;
        existing.total += o.total;
        if (o.createdAt > existing.lastOrder) existing.lastOrder = o.createdAt;
      } else {
        map.set(key, {
          key,
          name: o.userName,
          phone: o.phone,
          address: o.address,
          muhallah: o.muhallah,
          orders: 1,
          lastOrder: o.createdAt,
          total: o.total,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.lastOrder.localeCompare(a.lastOrder));
  }, [orders]);

  const openNew = () => { setEditing(null); setForm(empty); setShowForm(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm(p); setShowForm(true); };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductBusy(true);
    const result = editing ? await updateProduct(editing.id, form) : await addProduct(form);
    setProductBusy(false);

    if (!result.ok) {
      toast.error("Could not save product. Please try again.");
      return;
    }

    const action = editing ? "updated" : "added";
    toast.success(result.synced
      ? `Product ${action}`
      : `Product ${action} locally. PHP API is unavailable, so it may not sync to other users yet.`);
    setShowForm(false);
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setForm(s => ({ ...s, image: reader.result as string }));
    reader.readAsDataURL(f);
  };

  const stats = [
    { label: "Products", value: products.length, icon: Package, tone: "bg-primary/10 text-primary" },
    { label: "Total Orders", value: orders.length, icon: ShoppingBag, tone: "bg-accent/10 text-accent" },
    { label: "Orders Today", value: ordersToday, icon: Clock, tone: "bg-blue-100 text-blue-700" },
    { label: "In Queue", value: inQueue, icon: Bell, tone: "bg-amber-100 text-amber-700" },
    { label: "Completed", value: completed, icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-700" },
    { label: "Revenue Today", value: `Rs. ${revenueToday}`, icon: Wallet, tone: "bg-emerald-100 text-emerald-700" },
    { label: "Total Revenue", value: `Rs. ${revenueAll}`, icon: Wallet, tone: "bg-primary/10 text-primary" },
    { label: "Clients", value: clients.length, icon: Users, tone: "bg-fuchsia-100 text-fuchsia-700" },
  ];

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="font-display text-4xl text-primary-deep">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your store from here</p>
          </div>
          <div className="flex items-center gap-2">
            {newOrders > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-semibold animate-pulse">
                <Bell className="w-4 h-4" /> {newOrders} new order{newOrders > 1 ? "s" : ""}
              </div>
            )}
            <Button variant="outline" className="rounded-full" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {(["overview", "products", "categories", "ads", "orders", "clients", "applications", "stores", "settings"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap capitalize ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-card rounded-2xl p-5 shadow-card">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">{s.label}</div>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.tone}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-primary-deep mt-2">{s.value}</div>
                  </div>
                );
              })}
            </div>

            <div className="bg-card rounded-2xl shadow-card p-5">
              <h3 className="font-bold text-lg mb-3">Latest Orders</h3>
              {orders.slice(0, 5).length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 5).map(o => (
                    <div key={o.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                      <div>
                        <div className="font-medium">{o.userName} <span className="text-muted-foreground">• {o.phone}</span></div>
                        <div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">Rs. {o.total}</div>
                        <div className="text-xs capitalize text-muted-foreground">{o.status.replace(/_/g, " ")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "products" && (
          <div>
            <Button onClick={openNew} className="rounded-full mb-4"><Plus className="w-4 h-4 mr-1" /> Add Product</Button>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-card rounded-2xl p-4 shadow-card flex gap-3">
                  <img src={p.image} alt={p.name} className="w-20 h-20 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="text-sm text-muted-foreground">Rs. {p.price} • {p.category}</div>
                    <div className="text-xs text-muted-foreground">Stock: {p.stock}</div>
                    <div className="flex gap-1 mt-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Edit className="w-3 h-3" /></Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={productBusy}
                        onClick={async () => {
                          if (!confirm("Delete?")) return;
                          setProductBusy(true);
                          const result = await deleteProduct(p.id);
                          setProductBusy(false);
                          if (!result.ok) return toast.error("Could not delete product. Please try again.");
                          toast.success(result.synced
                            ? "Product deleted"
                            : "Product deleted locally. PHP API is unavailable, so it may not sync to other users yet.");
                        }}
                      ><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {showForm && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowForm(false)}>
                <form onClick={e => e.stopPropagation()} onSubmit={save} className="bg-card rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-3 animate-scale-in">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-xl">{editing ? "Edit" : "Add"} Product</h3>
                    <button type="button" onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
                  </div>
                  <div><Label>Name</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Price (Rs.)</Label><Input type="number" required value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })} /></div>
                    <div><Label>Stock</Label><Input type="number" required value={form.stock} onChange={e => setForm({ ...form, stock: +e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Unit</Label><Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
                    <div><Label>Category</Label>
                      <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value as Category })}>
                        {categories.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                  <div>
                    <Label>Image</Label>
                    <Input type="file" accept="image/*" onChange={handleImage} />
                    <Input className="mt-2" placeholder="or paste image URL" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
                    {form.image && <img src={form.image} alt="" className="w-24 h-24 rounded-lg object-cover mt-2" />}
                  </div>
                  <Button type="submit" className="w-full rounded-full" disabled={productBusy}>
                    {productBusy ? "Saving..." : `${editing ? "Update" : "Add"} Product`}
                  </Button>
                </form>
              </div>
            )}
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 ? <p className="text-muted-foreground">No orders yet.</p> : orders.map(o => (
              <div key={o.id} className="bg-card rounded-2xl p-5 shadow-card">
                <div className="flex justify-between flex-wrap gap-3 mb-2">
                  <div>
                    <div className="font-mono text-sm">{o.id}</div>
                    <div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()} • {o.userName}</div>
                  </div>
                  <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value as Parameters<typeof updateOrderStatus>[1])} className="rounded-full border px-3 py-1 text-sm bg-background">
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="text-sm text-muted-foreground">{o.items.map(i => `${i.product.name} ×${i.qty}`).join(", ")}</div>
                <div className="text-sm mt-1">📍 {o.address}, {o.muhallah} • 📞 {o.phone} • 💰 Rs. {o.total} • {o.paymentMethod === "cod" ? "COD" : "Easypaisa"}</div>
                {o.location && <div className="text-xs mt-1">
                  <a className="text-primary underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${o.location.lat},${o.location.lng}`}>
                    View on Map ({o.location.lat.toFixed(4)}, {o.location.lng.toFixed(4)})
                  </a>
                </div>}
              </div>
            ))}
          </div>
        )}

        {tab === "clients" && (
          <div className="bg-card rounded-2xl shadow-card overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-bold">Clients ({clients.length})</h3>
              <p className="text-xs text-muted-foreground">Newest customers shown first</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary"><tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Phone</th>
                  <th className="text-left p-3">Address</th>
                  <th className="text-left p-3">Orders</th>
                  <th className="text-left p-3">Total spent</th>
                  <th className="text-left p-3">Last order</th>
                </tr></thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.key} className="border-t">
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3">{c.phone}</td>
                      <td className="p-3">{c.address}, {c.muhallah}</td>
                      <td className="p-3">{c.orders}</td>
                      <td className="p-3">Rs. {c.total}</td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(c.lastOrder).toLocaleString()}</td>
                    </tr>
                  ))}
                  {clients.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No clients yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "categories" && <CategoriesPanel />}
        {tab === "ads" && <AdsPanel />}
        {tab === "applications" && <ApplicationsPanel />}
        {tab === "stores" && <StoresPanel />}
        {tab === "settings" && <SettingsPanel />}
      </div>
    </Layout>
  );
};

const ApplicationsPanel = () => {
  const [apps, setApps] = useState<StoreApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setApps(await listApplications());
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const approve = async (app: StoreApplication) => {
    setBusyId(app.id);
    const res = await approveApplication(app.id);
    setBusyId(null);
    if (!res.ok) return toast.error(res.msg || "Could not approve");
    toast.success(`Approved! Store created at /store/${res.store?.slug}`);
    refresh();
  };

  const reject = async (app: StoreApplication) => {
    const note = prompt("Reason for rejection (optional):") || undefined;
    setBusyId(app.id);
    const ok = await rejectApplication(app.id, note);
    setBusyId(null);
    if (!ok) return toast.error("Could not reject");
    toast.success("Rejected");
    refresh();
  };

  const pending = apps.filter(a => a.status === "pending");
  const others = apps.filter(a => a.status !== "pending");

  if (loading) return <div className="text-center py-10 text-muted-foreground">Loading applications...</div>;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Inbox className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Pending applications ({pending.length})</h3>
        </div>
        {pending.length === 0 ? (
          <div className="bg-card rounded-2xl shadow-card p-6 text-sm text-muted-foreground">No pending applications.</div>
        ) : (
          <div className="space-y-3">
            {pending.map(a => (
              <div key={a.id} className="bg-card rounded-2xl shadow-card p-5">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-lg">{a.shopName}</div>
                    <div className="text-sm text-muted-foreground">
                      by {a.fullName} • 📞 {a.phone} • ✉️ {a.email}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Category: {a.shopCategory || "—"} • Submitted: {new Date(a.createdAt).toLocaleString()}
                    </div>
                    <p className="text-sm mt-2 whitespace-pre-wrap">{a.shopDescription}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={busyId === a.id} onClick={() => approve(a)} className="rounded-full">
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" disabled={busyId === a.id} onClick={() => reject(a)} className="rounded-full">
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {others.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-3">History</h3>
          <div className="bg-card rounded-2xl shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary"><tr>
                <th className="text-left p-3">Shop</th>
                <th className="text-left p-3">Owner</th>
                <th className="text-left p-3">Phone</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Reviewed</th>
              </tr></thead>
              <tbody>
                {others.map(a => (
                  <tr key={a.id} className="border-t">
                    <td className="p-3 font-medium">{a.shopName}</td>
                    <td className="p-3">{a.fullName}<div className="text-xs text-muted-foreground">{a.email}</div></td>
                    <td className="p-3">{a.phone}</td>
                    <td className={`p-3 capitalize ${a.status === "approved" ? "text-emerald-700" : "text-red-700"}`}>{a.status}</td>
                    <td className="p-3 text-xs text-muted-foreground">{a.reviewedAt ? new Date(a.reviewedAt).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const StoresPanel = () => {
  const [stores, setStores] = useState<VendorStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setStores(await listAllStores());
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const toggleStatus = async (s: VendorStore) => {
    const next = s.status === "approved" ? "suspended" : "approved";
    if (!confirm(`${next === "suspended" ? "Suspend" : "Reactivate"} "${s.name}"?`)) return;
    setBusyId(s.id);
    const ok = await setStoreStatus(s.id, next);
    setBusyId(null);
    if (!ok) return toast.error("Could not update");
    toast.success(`Store ${next}`);
    refresh();
  };

  const remove = async (s: VendorStore) => {
    if (!confirm(`PERMANENTLY DELETE store "${s.name}" and all its products? This cannot be undone.`)) return;
    setBusyId(s.id);
    const ok = await deleteStore(s.id);
    setBusyId(null);
    if (!ok) return toast.error("Could not delete");
    toast.success("Store deleted");
    refresh();
  };

  const markPaid = async (s: VendorStore) => {
    const monthsStr = prompt(`Mark premium plan paid for "${s.name}". Number of months:`, "1");
    if (!monthsStr) return;
    const months = parseInt(monthsStr, 10);
    if (!Number.isFinite(months) || months <= 0) return toast.error("Enter a valid number of months");
    setBusyId(s.id);
    const ok = await markPremiumPaid(s.id, months);
    setBusyId(null);
    if (!ok) return toast.error("Could not save");
    toast.success(`Premium recorded for ${months} month(s)`);
    refresh();
  };

  const fmtExpiry = (s: VendorStore) => {
    if (!s.premiumExpiresAt) return <span className="text-amber-700">Not paid</span>;
    const d = new Date(s.premiumExpiresAt);
    const expired = d.getTime() < Date.now();
    return <span className={expired ? "text-red-700" : "text-emerald-700"}>{expired ? "Expired " : "Until "}{d.toLocaleDateString()}</span>;
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground">Loading stores...</div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <StoreIcon className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">Stores ({stores.length})</h3>
      </div>
      {stores.length === 0 ? (
        <div className="bg-card rounded-2xl shadow-card p-6 text-sm text-muted-foreground">No stores yet.</div>
      ) : (
        <div className="space-y-3">
          {stores.map(s => (
            <div key={s.id} className="bg-card rounded-2xl shadow-card p-5">
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-lg">{s.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{s.status}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    by {s.ownerName} • 📞 {s.ownerPhone || "—"} • ✉️ {s.ownerEmail}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    /store/{s.slug} • Premium: {fmtExpiry(s)}
                  </div>
                  {s.description && <p className="text-sm mt-2 line-clamp-2">{s.description}</p>}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" disabled={busyId === s.id} onClick={() => markPaid(s)} className="rounded-full">
                    <Wallet className="w-4 h-4 mr-1" /> Mark paid (cash)
                  </Button>
                  <Button size="sm" variant="outline" disabled={busyId === s.id} onClick={() => toggleStatus(s)} className="rounded-full">
                    {s.status === "approved" ? <><Ban className="w-4 h-4 mr-1" /> Suspend</> : <><Power className="w-4 h-4 mr-1" /> Reactivate</>}
                  </Button>
                  <Button size="sm" variant="destructive" disabled={busyId === s.id} onClick={() => remove(s)} className="rounded-full">
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SettingsPanel = () => {
  const [adminEmail, setAdminEmail] = useState(getCachedAdminEmail());
  const [email, setEmail] = useState(adminEmail);
  const [emailPwd, setEmailPwd] = useState("");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchAdminEmail().then(e => { setAdminEmail(e); setEmail(e); });
  }, []);

  const saveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) return toast.error("Enter a valid email");
    if (!emailPwd) return toast.error("Enter your current password");
    setBusy(true);
    const ok = await changeAdminEmail(emailPwd, trimmed);
    setBusy(false);
    if (!ok) return toast.error("Wrong password or update failed");
    const oldEmail = adminEmail;
    setAdminEmail(trimmed);
    setEmailPwd("");
    toast.success("Admin email updated everywhere");
    const when = new Date().toLocaleString();
    sendFormSubmit(oldEmail, "Gilgitify admin email changed",
      `The admin email on Gilgitify was changed.\n\nOld email: ${oldEmail}\nNew email: ${trimmed}\nWhen: ${when}\n\nIf this wasn't you, reset the password immediately.`);
    sendFormSubmit(trimmed, "You're now the Gilgitify admin email",
      `This email (${trimmed}) is now the active admin contact for Gilgitify. You'll receive new-order alerts and password reset codes here.\nWhen: ${when}`);
  };

  const savePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 4) return toast.error("Password too short");
    if (newPwd !== newPwd2) return toast.error("Passwords do not match");
    setBusy(true);
    const ok = await changeAdminPassword(currentPwd, newPwd);
    setBusy(false);
    if (!ok) return toast.error("Current password is wrong");
    setCurrentPwd(""); setNewPwd(""); setNewPwd2("");
    toast.success("Password updated everywhere");
    notifyAdmin("Gilgitify admin password changed",
      `The admin password was changed at ${new Date().toLocaleString()}.\n\nIf this wasn't you, use "Forgot password" on the login screen to reset it.`);
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <form onSubmit={saveEmail} className="bg-card rounded-2xl shadow-card p-5 space-y-3">
        <h3 className="font-bold text-lg flex items-center gap-2"><Mail className="w-4 h-4" /> Change admin email</h3>
        <p className="text-xs text-muted-foreground">Synced across all devices. This is where reset codes and order notifications go.</p>
        <div>
          <Label>Admin email</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label>Current password</Label>
          <Input type="password" value={emailPwd} onChange={e => setEmailPwd(e.target.value)} required />
        </div>
        <Button type="submit" className="rounded-full" disabled={busy}>{busy ? "Saving..." : "Save email"}</Button>
      </form>

      <form onSubmit={savePwd} className="bg-card rounded-2xl shadow-card p-5 space-y-3">
        <h3 className="font-bold text-lg flex items-center gap-2"><KeyRound className="w-4 h-4" /> Change password</h3>
        <p className="text-xs text-muted-foreground">Synced across all devices.</p>
        <div>
          <Label>Current password</Label>
          <Input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} required />
        </div>
        <div>
          <Label>New password</Label>
          <Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required />
        </div>
        <div>
          <Label>Confirm new password</Label>
          <Input type="password" value={newPwd2} onChange={e => setNewPwd2(e.target.value)} required />
        </div>
        <Button type="submit" className="rounded-full" disabled={busy}>{busy ? "Updating..." : "Update password"}</Button>
      </form>
    </div>
  );
};

export default Admin;
