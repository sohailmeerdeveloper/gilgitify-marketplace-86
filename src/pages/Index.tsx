import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/store/StoreContext";
import { categories } from "@/data/products";
import heroImg from "@/assets/hero-grocery.jpg";
import { Truck, Store, Coins, Leaf, Phone, MessageCircle } from "lucide-react";

const Index = () => {
  const { products } = useStore();
  const featured = products.slice(0, 8);

  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Fresh groceries delivered in Gilgit" className="w-full h-full object-cover" width={1920} height={896} />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/40" />
        </div>
        <div className="container relative py-16 md:py-28 max-w-3xl">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4 animate-fade-in">
            Gilgit-Baltistan's #1 Delivery Store
          </span>
          <h1 className="font-display text-5xl md:text-7xl text-primary-deep leading-tight mb-4 animate-slide-up">
            Gilgit Delivery Store
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Har Cheez Ek Jagah — Grocery, Food & Cosmetic with fast delivery in Gilgit.
          </p>
          <div className="flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/shop"><Button size="lg" variant="destructive" className="rounded-full px-8 shadow-elevated">Order Now</Button></Link>
            <a href="https://wa.me/923145556548"><Button size="lg" variant="outline" className="rounded-full px-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              <MessageCircle className="w-4 h-4 mr-2" /> Call / Whatsapp
            </Button></a>
          </div>
        </div>
      </section>

      {/* SHOPS */}
      <section className="bg-primary py-14 md:py-20">
        <div className="container">
          <h2 className="font-display text-4xl md:text-5xl text-white text-center mb-10">Our Shops</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c, i) => (
              <Link key={c.id} to={`/shop?cat=${c.id}`}
                className="group flex flex-col items-center animate-scale-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="w-40 h-40 rounded-full overflow-hidden bg-white shadow-elevated ring-4 ring-white/30 group-hover:ring-white/60 transition-all group-hover:scale-105">
                  <img src={c.image} alt={c.label} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="mt-4 px-6 py-2 rounded-full bg-accent text-accent-foreground font-semibold text-sm shadow-card">
                  {c.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAST DELIVERY STRIP */}
      <section className="bg-primary-deep py-10">
        <div className="container">
          <h3 className="text-white text-center text-2xl font-bold mb-6">Fast Delivery In Gilgit</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Truck, label: "Delivery All Over Gilgit" },
              { icon: Leaf, label: "Same Day Service" },
              { icon: Coins, label: "Delivery Charges Rs. 100" },
            ].map((it, i) => (
              <div key={i} className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-card">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <it.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="font-semibold text-foreground">{it.label}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-white/80 mt-5 text-sm">Fast And Reliable Service</p>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="container py-14 md:py-20">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <h2 className="font-display text-4xl text-primary-deep">Featured Products</h2>
            <p className="text-muted-foreground mt-1">Fresh & ready to deliver today</p>
          </div>
          <Link to="/shop" className="text-primary font-semibold hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {featured.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-secondary py-14 md:py-20">
        <div className="container">
          <h2 className="font-display text-4xl text-primary-deep text-center mb-10">Why Choose Us</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { icon: Truck, title: "Fast Delivery", desc: "Quick same-day delivery" },
              { icon: Store, title: "All In One Store", desc: "Everything you need" },
              { icon: Coins, title: "Affordable Pricing", desc: "Best market prices" },
              { icon: Leaf, title: "Fresh & Original", desc: "Quality guaranteed" },
            ].map((f, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 shadow-card text-center hover:shadow-elevated transition-all hover:-translate-y-1">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-primary-deep">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT BAR */}
      <section className="bg-gradient-to-br from-primary-deep to-primary py-12">
        <div className="container grid md:grid-cols-3 gap-6 text-white items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2"><Phone className="w-5 h-5" /> <span>+92 319 6604933</span></div>
            <div className="flex items-center gap-2"><Phone className="w-5 h-5" /> <span>+92 314 5556548</span></div>
          </div>
          <div className="text-center">
            <a href="https://wa.me/923145556548" className="inline-block px-6 py-3 rounded-full bg-white text-primary font-bold shadow-elevated hover:scale-105 transition-transform">
              💬 Chat Now
            </a>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl">Gilgit Baltistan</div>
            <div className="text-sm text-white/80">All delivery in GB</div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
