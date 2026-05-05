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
      <div className="container py-6 md:py-10">
        <Link to="/shop" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 md:mb-6">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Shop
        </Link>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          <div className="bg-secondary rounded-2xl p-4 sm:p-6 md:p-10 flex items-center justify-center shadow-card">
            <img src={product.image} alt={product.name} className="w-full max-h-[280px] sm:max-h-[360px] md:max-h-[440px] object-contain rounded-xl" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-primary font-semibold">{product.category}</span>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-primary-deep mt-1.5 leading-tight break-words">{product.name}</h1>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-primary-deep">Rs. {product.price}</span>
              <span className="text-sm text-muted-foreground">/ {product.unit}</span>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">{product.description}</p>

            <div className="flex flex-wrap items-center gap-3 mt-5">
              <div className="inline-flex items-center border rounded-full">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-2.5 hover:bg-secondary rounded-l-full" aria-label="Decrease"><Minus className="w-4 h-4" /></button>
                <span className="px-3 font-semibold text-sm min-w-[2ch] text-center">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="p-2.5 hover:bg-secondary rounded-r-full" aria-label="Increase"><Plus className="w-4 h-4" /></button>
              </div>
              <Button variant="destructive" className="rounded-full px-5 h-10 flex-1 sm:flex-none min-w-[140px]"
                onClick={() => { addToCart(product, qty); toast.success("Added to cart"); }}>Add to Cart</Button>
              <Button className="rounded-full h-10 px-5 flex-1 sm:flex-none min-w-[110px]" onClick={() => { addToCart(product, qty); nav("/checkout"); }}>Buy Now</Button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="flex items-center gap-2.5 p-3 sm:p-4 rounded-xl bg-secondary">
                <Truck className="w-5 h-5 text-primary shrink-0" />
                <div className="text-xs sm:text-sm min-w-0"><div className="font-semibold truncate">Fast Delivery</div><div className="text-muted-foreground text-[11px] sm:text-xs truncate">Same day in Gilgit</div></div>
              </div>
              <div className="flex items-center gap-2.5 p-3 sm:p-4 rounded-xl bg-secondary">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <div className="text-xs sm:text-sm min-w-0"><div className="font-semibold truncate">100% Fresh</div><div className="text-muted-foreground text-[11px] sm:text-xs truncate">Quality guaranteed</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
