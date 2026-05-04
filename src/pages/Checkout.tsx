import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useStore } from "@/store/StoreContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Checkout = () => {
  const { cart, cartTotal, user, placeOrder } = useStore();
  const nav = useNavigate();
  const [step, setStep] = useState<"details" | "pay" | "ordered">("details");
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    muhallah: "",
  });
  const [pay, setPay] = useState<"cod" | "easypaisa">("cod");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const captureLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); toast.success("Location captured"); },
      () => { setLocating(false); toast.error("Could not get location"); }
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address) return toast.error("Fill all required fields");
    setStep("pay");
  };

  const finalize = () => {
    const order = placeOrder({ name: form.name, email: form.email, address: form.address, phone: form.phone, muhallah: form.muhallah, paymentMethod: pay, location });
    setOrderId(order.id);
    setStep("ordered");
  };

  if (cart.length === 0 && step !== "ordered") {
    return <Layout><div className="container py-20 text-center">
      <p>Your cart is empty.</p>
      <Button onClick={() => nav("/shop")} className="mt-4 rounded-full">Go to Shop</Button>
    </div></Layout>;
  }

  return (
    <Layout>
      <div className="container py-10 max-w-6xl">
        <h1 className="font-display text-4xl text-primary-deep text-center mb-8">Check up</h1>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-4 md:gap-12 mb-10">
          {(["details", "pay", "ordered"] as const).map((s, i) => {
            const active = step === s;
            const done = (["details", "pay", "ordered"] as const).indexOf(step) > i;
            return (
              <div key={s} className="flex items-center gap-4 md:gap-12">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center font-display text-lg shadow-card transition-all
                  ${active ? "bg-primary text-primary-foreground scale-110 shadow-elevated" : done ? "bg-primary/80 text-primary-foreground" : "bg-white text-muted-foreground"}`}>
                  {done ? <Check className="w-7 h-7" /> : s === "details" ? "Details" : s === "pay" ? "Pay" : "Done"}
                </div>
                {i < 2 && <div className={`hidden md:block h-0.5 w-16 ${done ? "bg-primary" : "bg-border"}`} />}
              </div>
            );
          })}
        </div>

        {step === "ordered" ? (
          <div className="bg-card rounded-3xl p-10 max-w-md mx-auto text-center shadow-elevated">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Check className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-3xl text-primary-deep mb-2">Order Placed!</h2>
            <p className="text-muted-foreground">Order ID: <span className="font-mono text-foreground">{orderId}</span></p>
            <p className="text-sm text-muted-foreground mt-3">Thank you for choosing Gilgitify. We'll deliver soon!</p>
            <div className="flex gap-3 justify-center mt-6">
              <Button onClick={() => nav("/orders")} className="rounded-full">Track Order</Button>
              <Button variant="outline" onClick={() => nav("/shop")} className="rounded-full">Continue Shopping</Button>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <form onSubmit={submit} className="bg-card rounded-3xl p-6 md:p-8 shadow-card space-y-4">
              <h2 className="text-primary-deep font-bold text-xl">Delivery Details</h2>
              <div><Label>Full Name</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div><Label>Email (for order tracking)</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1" placeholder="optional" /></div>
              <div><Label>Phone Number</Label><Input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
              <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-1" /></div>
              <div><Label>Muhallah</Label><Input value={form.muhallah} onChange={e => setForm({ ...form, muhallah: e.target.value })} className="mt-1" /></div>

              <div>
                <Label>Pay method</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button type="button" onClick={() => setPay("cod")}
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${pay === "cod" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                    Cash on Delivery
                  </button>
                  <button type="button" onClick={() => setPay("easypaisa")}
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${pay === "easypaisa" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                    Pay Online via Easypaisa
                  </button>
                </div>
              </div>

              <div className="border rounded-xl p-4 flex items-center justify-between bg-secondary/40">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  {location ? <span>📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span> : <span className="text-muted-foreground">Share your location for accurate delivery</span>}
                </div>
                <Button type="button" size="sm" variant="outline" onClick={captureLocation} disabled={locating} className="rounded-full">
                  {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Capture"}
                </Button>
              </div>

              {step === "details" && <Button type="submit" className="w-full rounded-full" size="lg">Continue to Payment</Button>}
              {step === "pay" && <Button type="button" onClick={finalize} className="w-full rounded-full" size="lg">Place Order</Button>}
            </form>

            <div className="bg-card rounded-3xl p-6 md:p-8 shadow-card h-fit">
              <div className="flex justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">Items</span>
                <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">Pricing</span>
              </div>
              <div className="space-y-2">
                {cart.map(c => (
                  <div key={c.product.id} className="flex justify-between text-sm">
                    <span>{c.product.name} <span className="text-muted-foreground">× {c.qty}</span></span>
                    <span className="font-semibold">Rs. {c.product.price * c.qty}</span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-4 pt-4 space-y-1 text-sm">
                <div className="flex justify-between"><span>Delivery fee</span><span>Rs. 100</span></div>
                <div className="flex justify-between font-bold text-lg pt-2"><span>Total amount</span><span className="text-primary-deep">Rs. {cartTotal + 100}</span></div>
              </div>
              <p className="text-center text-muted-foreground text-sm mt-4">Thanks for choosing us</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Checkout;
