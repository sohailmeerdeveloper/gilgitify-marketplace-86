import { useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/store/StoreContext";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { AdSlot } from "@/components/AdSlot";

const Shop = () => {
  const { products } = useStore();
  const { categories } = useCategories();
  const [params, setParams] = useSearchParams();
  const cat = params.get("cat");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => products.filter(p =>
    (!cat || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase())
  ), [products, cat, q]);

  const setCat = (c: string | null) => {
    if (c) params.set("cat", c); else params.delete("cat");
    setParams(params);
  };

  return (
    <Layout>
      <section className="bg-gradient-to-br from-primary to-primary-deep py-8 md:py-10">
        <div className="container text-center text-white">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl mb-1">Shop</h1>
          <p className="text-white/80 text-sm md:text-base">Fresh products delivered fast across Gilgit</p>
        </div>
      </section>

      <div className="container py-6 md:py-8">
        <div className="flex flex-col gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products..." className="pl-9 rounded-full h-10 text-sm" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
            <button onClick={() => setCat(null)}
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${!cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"}`}>
              All
            </button>
            {categories.map(c => (
              <button key={c.slug} onClick={() => setCat(c.slug)}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${cat === c.slug ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {cat && <AdSlot placement="category_page" category={cat} className="mb-5" />}

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No products found.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Shop;
