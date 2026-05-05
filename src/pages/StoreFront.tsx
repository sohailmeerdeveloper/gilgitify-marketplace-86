import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getStoreBySlug, listStoreProducts, Store, StoreProduct } from "@/lib/vendor";
import { useStore } from "@/store/StoreContext";
import { Search, Store as StoreIcon, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/data/products";

const StoreFront = () => {
  const { slug } = useParams();
  const { addToCart } = useStore();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const s = await getStoreBySlug(slug);
      setStore(s);
      if (s) setProducts(await listStoreProducts(s.id));
      setLoading(false);
    })();
  }, [slug]);

  const filtered = useMemo(() =>
    products.filter(p => p.name.toLowerCase().includes(q.toLowerCase())),
    [products, q]);

  if (loading) return <Layout><div className="container py-20 text-center text-muted-foreground">Loading...</div></Layout>;

  if (!store || store.status !== "approved") {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-display text-3xl text-primary-deep mb-2">Store not available</h1>
          <p className="text-muted-foreground mb-4">This store doesn't exist or is currently suspended.</p>
          <Link to="/stores" className="text-primary hover:underline">Browse other stores →</Link>
        </div>
      </Layout>
    );
  }

  const addProductToCart = (sp: StoreProduct) => {
    const p: Product = {
      id: `vp_${sp.id}`,
      name: `${sp.name} (${store.name})`,
      price: sp.price,
      category: (sp.category as Product["category"]) || "general",
      image: sp.image || "",
      description: sp.description,
      unit: sp.unit,
      stock: sp.stock,
    };
    addToCart(p, 1);
    toast.success(`${sp.name} added to cart`);
  };

  return (
    <Layout>
      <section className="bg-primary py-12">
        <div className="container text-white flex items-center gap-4 flex-wrap">
          {store.logo
            ? <img src={store.logo} alt={store.name} className="w-20 h-20 rounded-2xl object-cover" />
            : <div className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center"><StoreIcon className="w-10 h-10" /></div>}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-4xl md:text-5xl">{store.name}</h1>
            <p className="text-white/80">by {store.ownerName}{store.ownerPhone ? ` • ${store.ownerPhone}` : ""}</p>
            {store.description && <p className="text-white/85 mt-2 max-w-2xl">{store.description}</p>}
          </div>
        </div>
      </section>

      <div className="container py-8">
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products..." className="pl-9 rounded-full" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No products yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map(p => (
              <div key={p.id} className="bg-card rounded-2xl shadow-card overflow-hidden flex flex-col">
                {p.image
                  ? <img src={p.image} alt={p.name} className="w-full aspect-square object-cover" />
                  : <div className="w-full aspect-square bg-secondary" />}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="font-semibold mb-1 line-clamp-2">{p.name}</div>
                  <div className="text-xs text-muted-foreground mb-2">{p.unit} • {p.category}</div>
                  <div className="text-primary font-bold mb-3">Rs. {p.price}</div>
                  <Button size="sm" className="rounded-full mt-auto" onClick={() => addProductToCart(p)} disabled={p.stock <= 0}>
                    <ShoppingCart className="w-4 h-4 mr-1" /> {p.stock <= 0 ? "Out of stock" : "Add to cart"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StoreFront;
