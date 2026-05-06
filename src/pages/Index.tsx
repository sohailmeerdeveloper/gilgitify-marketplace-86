import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/store/StoreContext";
import { useCategories } from "@/hooks/useCategories";
import { AdSlot } from "@/components/AdSlot";
import { Truck, Store, Coins, Leaf, Phone, MessageCircle, Hotel, ShoppingBag } from "lucide-react";

const popularHotels = [
  "Baitul Mandi House GB",
  "Pizza King",
  "Indus Hotel",
  "Raja Mamtu",
];

const popularStores = [
  "AGS",
  "Awami Utility Store Cash & Carry",
];

const Index = () => {
  const { products } = useStore();
  const { categories } = useCategories();
  const featured = products.slice(0, 8);

  return (
    <Layout>
      {/* CATEGORIES — first thing after the navbar */}
      <section className="bg-gradient-to-b from-secondary/40 to-background pt-6 md:pt-10 pb-8 md:pb-12">
        <div className="container">
          <div className="flex items-end justify-between mb-5 md:mb-6 flex-wrap gap-2">
            <div>
              <span className="inline-block px-3 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-wider mb-2">
                Browse
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-primary-deep">Shop by category</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Everything Gilgit-Baltistan needs, delivered fast</p>
            </div>
            <Link to="/shop" className="text-primary font-semibold text-sm hover:underline">Browse all →</Link>
          </div>

          {/* Mobile: horizontal scroll */}
          <div className="md:hidden -mx-4 px-4 overflow-x-auto scroll-smooth">
            <div className="flex gap-3 pb-2 snap-x snap-mandatory">
              {categories.map((c, i) => (
                <Link key={c.slug} to={`/shop?cat=${c.slug}`}
                  className="group flex-none w-28 flex flex-col items-center snap-start animate-scale-in" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-card shadow-card ring-1 ring-border group-hover:ring-primary/40 transition-all">
                    <img src={c.image} alt={c.label} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="mt-2 text-xs font-semibold text-primary-deep text-center w-full truncate">
                    {c.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Tablet/Desktop grid */}
          <div className="hidden md:grid gap-4 lg:gap-5 grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {categories.map((c, i) => (
              <Link key={c.slug} to={`/shop?cat=${c.slug}`}
                className="group bg-card rounded-3xl overflow-hidden shadow-card hover:shadow-elevated transition-all hover:-translate-y-1 animate-scale-in"
                style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="aspect-square overflow-hidden bg-secondary">
                  <img src={c.image} alt={c.label} loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="p-3 text-center">
                  <div className="font-bold text-primary-deep text-sm lg:text-base">{c.label}</div>
                  {c.description && <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{c.description}</div>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SPONSORED BANNER */}
      <AdSlot placement="home_banner" className="!py-2" />

      {/* QUICK ACTIONS */}
      <section className="container pb-2 md:pb-4">
        <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/60 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Hotel className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-primary-deep text-sm">Popular hotels</h3>
              <ul className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5">
                {popularHotels.map(h => (
                  <li key={h} className="text-xs text-foreground flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-primary shrink-0" /> <span className="truncate">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/60 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-primary-deep text-sm">General stores</h3>
              <ul className="mt-1.5 space-y-0.5">
                {popularStores.map(s => (
                  <li key={s} className="text-xs text-foreground flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-primary shrink-0" /> <span className="truncate">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAST DELIVERY STRIP */}
      <section className="bg-primary-deep py-8 md:py-10 mt-6">
        <div className="container">
          <h3 className="text-white text-center text-xl md:text-2xl font-bold mb-5">Fast Delivery In Gilgit</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {[
              { icon: Truck, label: "Delivery All Over Gilgit" },
              { icon: Leaf, label: "Same Day Service" },
              { icon: Coins, label: "Delivery Charges Rs. 100" },
            ].map((it, i) => (
              <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-card hover:shadow-elevated transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <it.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold text-foreground text-sm">{it.label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            <Link to="/shop"><button className="px-5 py-2 rounded-full bg-accent text-accent-foreground font-bold text-sm shadow-elevated hover:scale-105 transition-transform">Order Now</button></Link>
            <a href="https://wa.me/923145556548"><button className="px-5 py-2 rounded-full bg-white text-primary font-bold text-sm shadow-elevated hover:scale-105 transition-transform inline-flex items-center gap-2"><MessageCircle className="w-4 h-4" /> WhatsApp</button></a>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="container py-10 md:py-14">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-primary-deep">Featured Products</h2>
            <p className="text-sm text-muted-foreground mt-1">Fresh & ready to deliver today</p>
          </div>
          <Link to="/shop" className="text-primary font-semibold text-sm hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {featured.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-secondary py-10 md:py-14">
        <div className="container">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-primary-deep text-center mb-6 md:mb-8">Why Choose Us</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { icon: Truck, title: "Fast Delivery", desc: "Quick same-day delivery" },
              { icon: Store, title: "All In One Store", desc: "Everything you need" },
              { icon: Coins, title: "Affordable Pricing", desc: "Best market prices" },
              { icon: Leaf, title: "Fresh & Original", desc: "Quality guaranteed" },
            ].map((f, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 md:p-5 shadow-card text-center hover:shadow-elevated transition-all hover:-translate-y-1">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-2.5">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-primary-deep text-sm md:text-base">{f.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT BAR */}
      <section className="bg-gradient-to-br from-primary-deep to-primary py-8 md:py-10">
        <div className="container grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 text-white items-center">
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> <span>+92 319 6604933</span></div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> <span>+92 314 5556548</span></div>
          </div>
          <div className="text-center">
            <a href="https://wa.me/923145556548" className="inline-block px-5 py-2.5 rounded-full bg-white text-primary font-bold text-sm shadow-elevated hover:scale-105 transition-transform">
              💬 Chat Now
            </a>
          </div>
          <div className="md:text-right">
            <div className="font-display text-xl md:text-2xl">Gilgit Baltistan</div>
            <div className="text-xs md:text-sm text-white/80">All delivery in GB</div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
