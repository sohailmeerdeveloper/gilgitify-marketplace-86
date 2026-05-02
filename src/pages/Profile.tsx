import { Layout } from "@/components/Layout";
import { useStore } from "@/store/StoreContext";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

const Profile = () => {
  const { user, updateProfile, logout, orders } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  const myOrders = orders.filter(o => o.userId === user.id);
  const [form, setForm] = useState({ name: user.name, phone: user.phone || "", address: user.address || "" });

  const save = (e: React.FormEvent) => { e.preventDefault(); updateProfile(form); toast.success("Profile updated"); };

  return (
    <Layout>
      <div className="container py-10 max-w-4xl">
        <h1 className="font-display text-4xl text-primary-deep mb-6">My Profile</h1>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-card rounded-3xl p-6 shadow-card">
            <form onSubmit={save} className="space-y-4">
              <div><Label>Full Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div><Label>Email</Label><Input value={user.email} disabled className="mt-1" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
              <div><Label>Saved Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-1" /></div>
              <div className="flex gap-3">
                <Button type="submit" className="rounded-full">Save Changes</Button>
                <Button type="button" variant="outline" className="rounded-full" onClick={logout}>Logout</Button>
              </div>
            </form>
          </div>
          <div className="bg-card rounded-3xl p-6 shadow-card">
            <h3 className="font-bold mb-3">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <Link to="/orders" className="block px-3 py-2 rounded-lg hover:bg-secondary">📦 My Orders ({myOrders.length})</Link>
              <Link to="/cart" className="block px-3 py-2 rounded-lg hover:bg-secondary">🛒 My Cart</Link>
              {user.isAdmin && <Link to="/admin" className="block px-3 py-2 rounded-lg hover:bg-secondary">⚙️ Admin Panel</Link>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
