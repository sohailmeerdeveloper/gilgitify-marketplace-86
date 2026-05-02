import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useStore } from "@/store/StoreContext";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

const Cart = () => {
  const { cart, updateQty, removeFromCart, cartTotal } = useStore();

  if (cart.length === 0) {
    return <Layout><div className="container py-20 text-center">
      <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
      <h2 className="font-display text-3xl text-primary-deep mb-2">Your cart is empty</h2>
      <p className="text-muted-foreground mb-6">Add some fresh products to get started.</p>
      <Link to="/shop"><Button size="lg" className="rounded-full">Browse Shop</Button></Link>
    </div></Layout>;
  }

  return (
    <Layout>
      <div className="container py-10">
        <h1 className="font-display text-4xl text-primary-deep mb-6">Your Cart</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            {cart.map(({ product, qty }) => (
              <div key={product.id} className="bg-card border rounded-2xl p-4 flex gap-4 items-center shadow-card">
                <img src={product.image} alt={product.name} className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${product.id}`} className="font-semibold hover:text-primary">{product.name}</Link>
                  <p className="text-sm text-muted-foreground">Rs. {product.price} / {product.unit}</p>
                </div>
                <div className="inline-flex items-center border rounded-full">
                  <button onClick={() => updateQty(product.id, qty - 1)} className="p-2 hover:bg-secondary rounded-l-full"><Minus className="w-3 h-3" /></button>
                  <span className="px-3 text-sm font-semibold">{qty}</span>
                  <button onClick={() => updateQty(product.id, qty + 1)} className="p-2 hover:bg-secondary rounded-r-full"><Plus className="w-3 h-3" /></button>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="font-bold text-primary-deep">Rs. {product.price * qty}</div>
                </div>
                <button onClick={() => removeFromCart(product.id)} className="p-2 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <aside className="bg-card border rounded-2xl p-6 h-fit shadow-card sticky top-24">
            <h3 className="font-bold text-lg mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>Rs. {cartTotal}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span><span>Rs. 100</span></div>
              <div className="border-t pt-3 mt-3 flex justify-between font-bold text-lg">
                <span>Total</span><span className="text-primary-deep">Rs. {cartTotal + 100}</span>
              </div>
            </div>
            <Link to="/checkout"><Button size="lg" className="w-full mt-5 rounded-full">Proceed to Checkout</Button></Link>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
