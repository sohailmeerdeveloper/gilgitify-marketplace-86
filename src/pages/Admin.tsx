import { Layout } from "@/components/Layout";
import { useStore } from "@/store/StoreContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { Trash2, Edit, Plus, X, Bell } from "lucide-react";
import { toast } from "sonner";
import { Product, categories, Category } from "@/data/products";

const empty = { name: "", price: 0, category: "grocery" as Category, image: "", description: "", unit: "1 kg", stock: 10 };

const Admin = () => {
  const { user, authLoading, products, orders, addProduct, updateProduct, deleteProduct, updateOrderStatus, users, refreshAdminUsers } = useStore();
  const [tab, setTab] = useState<"overview" | "products" | "orders" | "customers">("overview");
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Product, "id">>(empty);

  useEffect(() => {
    if (user?.isAdmin) refreshAdminUsers();
  }, [user?.isAdmin, refreshAdminUsers]);

  if (authLoading) return <Layout><div className="container py-16 text-center text-muted-foreground">Loading secure dashboard...</div></Layout>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/" replace />;

  const newOrders = orders.filter(o => o.status === "pending").length;
  const revenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + o.total, 0);

  const openNew = () => { setEditing(null); setForm(empty); setShowForm(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm(p); setShowForm(true); };
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) { updateProduct(editing.id, form); toast.success("Product updated"); }
    else { addProduct(form); toast.success("Product added"); }
    setShowForm(false);
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
          <h1 className="font-display text-4xl text-primary-deep">Admin Dashboard</h1>
          {newOrders > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-semibold animate-pulse">
              <Bell className="w-4 h-4" /> {newOrders} new order{newOrders > 1 ? "s" : ""}
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {(["overview", "products", "orders", "customers"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Products", value: products.length },
              { label: "Total Orders", value: orders.length },
              { label: "Pending Orders", value: newOrders },
              { label: "Revenue", value: `Rs. ${revenue}` },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-2xl p-5 shadow-card">
                <div className="text-sm text-muted-foreground">{s.label}</div>
                <div className="text-3xl font-bold text-primary-deep mt-1">{s.value}</div>
              </div>
            ))}
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
                      <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete?")) { deleteProduct(p.id); toast.success("Deleted"); } }}><Trash2 className="w-3 h-3" /></Button>
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
                  <Button type="submit" className="w-full rounded-full">{editing ? "Update" : "Add"} Product</Button>
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
                  <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value as any)} className="rounded-full border px-3 py-1 text-sm bg-background">
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

        {tab === "customers" && (
          <div className="bg-card rounded-2xl shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary"><tr>
                <th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3">Orders</th>
              </tr></thead>
              <tbody>
                {users.filter(u => !u.isAdmin).map(u => (
                  <tr key={u.id} className="border-t">
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{orders.filter(o => o.userId === u.id).length}</td>
                  </tr>
                ))}
                {users.filter(u => !u.isAdmin).length === 0 && <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">No customers yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Admin;
