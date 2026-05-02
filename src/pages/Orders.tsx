import { Layout } from "@/components/Layout";
import { useStore } from "@/store/StoreContext";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  preparing: "bg-blue-100 text-blue-800",
  out_for_delivery: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const Orders = () => {
  const { user, orders } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  const mine = orders.filter(o => o.userId === user.id);

  return (
    <Layout>
      <div className="container py-10">
        <h1 className="font-display text-4xl text-primary-deep mb-6">My Orders</h1>
        {mine.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">No orders yet.</p>
            <Link to="/shop"><Button className="rounded-full">Start Shopping</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {mine.map(o => (
              <div key={o.id} className="bg-card border rounded-2xl p-5 shadow-card">
                <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
                  <div>
                    <div className="font-mono text-sm text-muted-foreground">{o.id}</div>
                    <div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${statusColors[o.status]}`}>{o.status.replace("_", " ")}</span>
                </div>
                <div className="text-sm space-y-1">
                  {o.items.map(i => (
                    <div key={i.product.id} className="flex justify-between"><span>{i.product.name} × {i.qty}</span><span>Rs. {i.product.price * i.qty}</span></div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3 flex justify-between font-bold">
                  <span>Total</span><span className="text-primary-deep">Rs. {o.total}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">📍 {o.address}, {o.muhallah} • 📞 {o.phone}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Orders;
