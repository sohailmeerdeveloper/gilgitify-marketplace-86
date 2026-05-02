import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useStore } from "@/store/StoreContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Minus, Plus, ChevronLeft, Truck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const ProductDetail = () => {
  const { id } = useParams();
  const { products, addToCart } = useStore();
  const product = products.find(p => p.id === id);
  const [qty, setQty] = useState(1);
  const nav = useNavigate();

  if (!product) {
    return <Layout><div className="container py-20 text-center">
      <p className="text-muted-foreground">Product not found.</p>
      <Link to="/shop"><Button className="mt-4">Back to Shop</Button></Link>
    </div></Layout>;
  }

  return (
    <Layout>
      <div className="container py-8">
        <Link to="/shop" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Shop
        </Link>
        <div className="grid md:grid-cols-2 gap-10">
          <div className="bg-secondary rounded-3xl p-6 md:p-10 flex items-center justify-center shadow-card">
            <img src={product.image} alt={product.name} className="max-h-[400px] w-auto object-contain rounded-xl" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-primary font-semibold">{product.category}</span>
            <h1 className="font-display text-4xl md:text-5xl text-primary-deep mt-2">{product.name}</h1>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-3xl font-bold text-primary-deep">Rs. {product.price}</span>
              <span className="text-muted-foreground">/ {product.unit}</span>
            </div>
            <p className="text-muted-foreground mt-4 leading-relaxed">{product.description}</p>

            <div className="flex items-center gap-4 mt-6">
              <div className="inline-flex items-center border rounded-full">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-3 hover:bg-secondary rounded-l-full"><Minus className="w-4 h-4" /></button>
                <span className="px-4 font-semibold">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="p-3 hover:bg-secondary rounded-r-full"><Plus className="w-4 h-4" /></button>
              </div>
              <Button size="lg" variant="destructive" className="rounded-full px-8"
                onClick={() => { addToCart(product, qty); toast.success("Added to cart"); }}>Add to Cart</Button>
              <Button size="lg" className="rounded-full" onClick={() => { addToCart(product, qty); nav("/checkout"); }}>Buy Now</Button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-8">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary">
                <Truck className="w-5 h-5 text-primary" />
                <div className="text-sm"><div className="font-semibold">Fast Delivery</div><div className="text-muted-foreground text-xs">Same day in Gilgit</div></div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <div className="text-sm"><div className="font-semibold">100% Fresh</div><div className="text-muted-foreground text-xs">Quality guaranteed</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
