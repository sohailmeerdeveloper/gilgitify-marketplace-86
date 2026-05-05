import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { categories, Category } from "@/data/products";
import {
  vendorLogin, getVendorSession, clearVendorSession, getMyStore,
  updateStoreProfile, changeVendorPassword,
  listStoreProducts, addStoreProduct, updateStoreProduct, deleteStoreProduct,
  Store, StoreProduct,
} from "@/lib/vendor";
import { toast } from "sonner";
import {
  Plus, Edit, Trash2, X, Package, Store as StoreIcon, ExternalLink,
  ShieldAlert, LogOut, KeyRound, ShieldCheck,
} from "lucide-react";

const empty = { name: "", price: 0, category: "general" as Category, image: "", description: "", unit: "1 piece", stock: 10 };

const Vendor = () => {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"products" | "settings">("products");

  const reload = async () => {
    setLoading(true);
    const s = await getMyStore();
    setStore(s);
    if (s && s.status === "approved") setProducts(await listStoreProducts(s.id));
    setLoading(false);
  };

  useEffect(() => {
    if (!getVendorSession()) { setLoading(false); return; }
    reload();
  }, []);

  const onLoggedIn = async () => {
    await reload();
  };

  const logout = () => {
    clearVendorSession();
    setStore(null);
    setProducts([]);
    toast.success("Logged out");
  };

  if (loading) return <Layout><div className="container py-20 text-center text-muted-foreground">Loading...</div></Layout>;

  if (!store) return <VendorLogin onLoggedIn={onLoggedIn} />;

  if (store.status === "suspended") {
    return (
      <Layout>
        <div className="container py-16 max-w-md mx-auto text-center">
          <div className="bg-card rounded-3xl shadow-card p-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mb-3">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="font-display text-2xl text-primary-deep mb-2">Store suspended</h1>
            <p className="text-muted-foreground mb-4">
              Your store <b>{store.name}</b> has been suspended. Please contact admin to restore access
              (usually due to pending premium payment).
            </p>
            <Button variant="outline" onClick={logout} className="rounded-full">Log out</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <VendorDashboard
      store={store}
      products={products}
      setProducts={setProducts}
      setStore={setStore}
      tab={tab}
      setTab={setTab}
      onLogout={logout}
    />
  );
};

// ---------- Login ----------

const VendorLogin = ({ onLoggedIn }: { onLoggedIn: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await vendorLogin(email, password);
    setBusy(false);
    if (!res.ok) return toast.error(res.msg || "Invalid email or password");
    toast.success(`Welcome back, ${res.store?.ownerName}`);
    onLoggedIn();
  };

  return (
    <Layout>
      <div className="container py-12 max-w-md mx-auto">
        <div className="bg-card rounded-3xl shadow-card p-8 animate-fade-in">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="font-display text-3xl text-primary-deep">Vendor Login</h1>
            <p className="text-sm text-muted-foreground mt-1">Log in with the email and password you used in your application.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</Button>
            <div className="text-center text-sm">
              <Link to="/become-a-seller" className="text-primary hover:underline">Haven't applied yet? Apply here</Link>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

// ---------- Dashboard ----------

interface DashProps {
  store: Store;
  products: StoreProduct[];
  setProducts: React.Dispatch<React.SetStateAction<StoreProduct[]>>;
  setStore: React.Dispatch<React.SetStateAction<Store | null>>;
  tab: "products" | "settings";
  setTab: (t: "products" | "settings") => void;
  onLogout: () => void;
}

const VendorDashboard = ({ store, products, setProducts, setStore, tab, setTab, onLogout }: DashProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StoreProduct | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [busy, setBusy] = useState(false);

  const stockTotal = useMemo(() => products.reduce((s, p) => s + p.stock, 0), [products]);

  const openNew = () => { setEditing(null); setForm(empty); setShowForm(true); };
  const openEdit = (p: StoreProduct) => {
    setEditing(p);
    setForm({
      name: p.name, price: p.price, category: (p.category as Category),
      image: p.image || "", description: p.description, unit: p.unit, stock: p.stock,
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (editing) {
      const ok = await updateStoreProduct(editing.id, { ...form, storeId: store.id });
      if (!ok) { setBusy(false); return toast.error("Could not update product"); }
      setProducts(ps => ps.map(p => p.id === editing.id ? { ...p, ...form } : p));
      toast.success("Product updated");
    } else {
      const created = await addStoreProduct({ ...form, storeId: store.id });
      if (!created) { setBusy(false); return toast.error("Could not add product"); }
      setProducts(ps => [created, ...ps]);
      toast.success("Product added");
    }
    setBusy(false);
    setShowForm(false);
  };

  const remove = async (p: StoreProduct) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const ok = await deleteStoreProduct(p.id);
    if (!ok) return toast.error("Could not delete product");
    setProducts(ps => ps.filter(x => x.id !== p.id));
    toast.success("Product deleted");
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setForm(s => ({ ...s, image: reader.result as string }));
    reader.readAsDataURL(f);
  };

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3">
            {store.logo
              ? <img src={store.logo} alt={store.name} className="w-14 h-14 rounded-2xl object-cover" />
              : <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><StoreIcon className="w-7 h-7" /></div>}
            <div>
              <h1 className="font-display text-3xl text-primary-deep">{store.name}</h1>
              <Link to={`/store/${store.slug}`} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                /store/{store.slug} <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="px-4 py-2 bg-card rounded-2xl shadow-card"><b>{products.length}</b> products</div>
            <div className="px-4 py-2 bg-card rounded-2xl shadow-card"><b>{stockTotal}</b> in stock</div>
            <Button variant="outline" className="rounded-full" onClick={onLogout}><LogOut className="w-4 h-4 mr-1" /> Logout</Button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {(["products", "settings"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "products" && (
          <div>
            <Button onClick={openNew} className="rounded-full mb-4"><Plus className="w-4 h-4 mr-1" /> Add Product</Button>

            {products.length === 0 ? (
              <div className="bg-card rounded-3xl shadow-card p-10 text-center">
                <Package className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No products yet — add your first one!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => (
                  <div key={p.id} className="bg-card rounded-2xl p-4 shadow-card flex gap-3">
                    {p.image
                      ? <img src={p.image} alt={p.name} className="w-20 h-20 rounded-xl object-cover" />
                      : <div className="w-20 h-20 rounded-xl bg-secondary" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{p.name}</div>
                      <div className="text-sm text-muted-foreground">Rs. {p.price} • {p.category}</div>
                      <div className="text-xs text-muted-foreground">Stock: {p.stock}</div>
                      <div className="flex gap-1 mt-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Edit className="w-3 h-3" /></Button>
                        <Button size="sm" variant="destructive" onClick={() => remove(p)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
                        {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
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
                  <Button type="submit" className="w-full rounded-full" disabled={busy}>{busy ? "Saving..." : `${editing ? "Update" : "Add"} Product`}</Button>
                </form>
              </div>
            )}
          </div>
        )}

        {tab === "settings" && <StoreSettings store={store} setStore={setStore} />}
      </div>
    </Layout>
  );
};

const StoreSettings = ({ store, setStore }: { store: Store; setStore: React.Dispatch<React.SetStateAction<Store | null>> }) => {
  const [name, setName] = useState(store.name);
  const [description, setDescription] = useState(store.description);
  const [logo, setLogo] = useState(store.logo || "");
  const [busy, setBusy] = useState(false);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(f);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await updateStoreProfile(store.id, { name, description, logo: logo || null });
    setBusy(false);
    if (!ok) return toast.error("Could not save");
    setStore(s => s ? { ...s, name, description, logo: logo || null } : s);
    toast.success("Store updated");
  };

  const savePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 4) return toast.error("Password too short");
    if (newPwd !== newPwd2) return toast.error("Passwords do not match");
    setPwdBusy(true);
    const res = await changeVendorPassword(store.id, currentPwd, newPwd);
    setPwdBusy(false);
    if (!res.ok) return toast.error(res.msg || "Could not change password");
    setCurrentPwd(""); setNewPwd(""); setNewPwd2("");
    toast.success("Password updated");
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <form onSubmit={save} className="bg-card rounded-3xl shadow-card p-6 space-y-4">
        <h3 className="font-bold text-lg">Store profile</h3>
        <div><Label>Store name</Label><Input required value={name} onChange={e => setName(e.target.value)} /></div>
        <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} /></div>
        <div>
          <Label>Logo</Label>
          <Input type="file" accept="image/*" onChange={handleLogo} />
          <Input className="mt-2" placeholder="or paste logo URL" value={logo} onChange={e => setLogo(e.target.value)} />
          {logo && <img src={logo} alt="" className="w-24 h-24 rounded-lg object-cover mt-2" />}
        </div>
        <div className="text-xs text-muted-foreground">Your store URL: <code>/store/{store.slug}</code> (fixed)</div>
        <Button type="submit" disabled={busy} className="rounded-full">{busy ? "Saving..." : "Save changes"}</Button>
      </form>

      <form onSubmit={savePwd} className="bg-card rounded-3xl shadow-card p-6 space-y-3">
        <h3 className="font-bold text-lg flex items-center gap-2"><KeyRound className="w-4 h-4" /> Change password</h3>
        <div><Label>Current password</Label><Input type="password" required value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} /></div>
        <div><Label>New password</Label><Input type="password" required value={newPwd} onChange={e => setNewPwd(e.target.value)} /></div>
        <div><Label>Confirm new password</Label><Input type="password" required value={newPwd2} onChange={e => setNewPwd2(e.target.value)} /></div>
        <Button type="submit" disabled={pwdBusy} className="rounded-full">{pwdBusy ? "Updating..." : "Update password"}</Button>
      </form>
    </div>
  );
};

export default Vendor;
