import { Link } from "react-router-dom";
import { Product } from "@/data/products";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/StoreContext";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useStore();
  return (
    <div className="group bg-card-soft/60 rounded-xl p-2.5 sm:p-3 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 border border-primary/10 flex flex-col">
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-square rounded-lg overflow-hidden bg-white mb-2.5">
          <img src={product.image} alt={product.name} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        </div>
        <h3 className="font-semibold text-foreground text-center text-sm line-clamp-1">{product.name}</h3>
        <p className="text-center text-sm text-primary-deep font-bold mt-0.5">Rs. {product.price} <span className="text-muted-foreground font-normal text-[11px]">/ {product.unit}</span></p>
      </Link>
      <Button onClick={() => { addToCart(product); toast.success(`${product.name} added to cart`); }}
        variant="destructive" size="sm" className="w-full mt-2.5 rounded-full font-semibold h-9 text-sm">
        Order
      </Button>
    </div>
  );
}
