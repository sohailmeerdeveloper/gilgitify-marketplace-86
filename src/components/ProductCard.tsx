import { Link } from "react-router-dom";
import { Product } from "@/data/products";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/StoreContext";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useStore();
  return (
    <div className="group bg-card-soft/60 rounded-2xl p-3 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 border border-primary/10">
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-square rounded-xl overflow-hidden bg-white mb-3">
          <img src={product.image} alt={product.name} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        </div>
        <h3 className="font-semibold text-foreground text-center line-clamp-1">{product.name}</h3>
        <p className="text-center text-sm text-primary-deep font-bold mt-0.5">Rs. {product.price} <span className="text-muted-foreground font-normal text-xs">/ {product.unit}</span></p>
      </Link>
      <Button onClick={() => { addToCart(product); toast.success(`${product.name} added to cart`); }}
        variant="destructive" className="w-full mt-3 rounded-full font-semibold">
        Order
      </Button>
    </div>
  );
}
