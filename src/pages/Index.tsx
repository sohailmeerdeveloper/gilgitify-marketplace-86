import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/store/StoreContext";
import { categories } from "@/data/products";
import heroImg from "@/assets/hero-grocery.jpg";
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
  const featured = products.slice(0, 8);

  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Fresh groceries delivered in Gilgit" className="w-full h-full object-cover" width={1920} height={896} />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/50" />
        </div>
        <div className="container relative py-10 md:py-16 lg:py-20">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-3">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-wider mb-3 animate-fade-in">
                Gilgit-Baltistan's #1 Delivery Store
              </span>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-primary-deep leading-[1.15] mb-3 animate-slide-up">
                Agar aap log chahte ho to hum yahan se bhi aapke liye saman laa sakte hain.
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-5 max-w-2xl animate-slide-up" style={{ animationDelay: "0.1s" }}>
                If you want, we can also bring items for you from these popular hotels and general stores in Gilgit — fast and reliable delivery.
              </p>
              <div className="flex flex-wrap gap-2.5 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <Link to="/shop"><Button variant="destructive" className="rounded-full px-6 h-10 shadow-elevated">Order Now</Button></Link>
                <a href="https://wa.me/923145556548"><Button variant="outline" className="rounded-full px-6 h-10 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <MessageCircle className="w-4 h-4 mr-2" /> Call / WhatsApp
                </Button></a>
              </div>
            </div>

            <div className="lg:col-span-2 grid sm:grid-cols-2 lg:grid-cols-1 gap-3 animate-fade-in" style={{ animationDelay: "0.25s" }}>
              <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-card border border-primary/10">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Hotel className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-bold text-primary-deep text-sm">Popular Hotels</h3>
                </div>
                <ul className="space-y-1">
                  {popularHotels.map(h => (
                    <li key={h} className="text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-primary" /> {h}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-card border border-primary/10">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-bold text-primary-deep text-sm">General Stores</h3>
                </div>
                <ul className="space-y-1">
                  {popularStores.map(s => (
                    <li key={s} className="text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-primary" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SHOPS */}
      <section className="bg-primary py-10 md:py-14">
        <div className="container">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-white text-center mb-6 md:mb-8">Our Shops</h2>
          {/* Mobile: horizontal scroll */}
          <div className="md:hidden -mx-4 px-4 overflow-x-auto scroll-smooth">
            <div className="flex gap-4 pb-2 snap-x snap-mandatory">
              {categories.map((c, i) => (
                <Link key={c.id} to={`/shop?cat=${c.id}`}
                  className="group flex-none w-[112px] flex flex-col items-center snap-start animate-scale-in" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-white shadow-elevated ring-2 ring-white/30">
                    <img src={c.image} alt={c.label} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-2.5 px-3 py-1 rounded-full bg-accent text-accent-foreground font-semibold text-[11px] shadow-card text-center w-full truncate">
                    {c.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>
          {/* Tablet/Desktop grid */}
          <div className="hidden md:grid gap-5 grid-cols-3 lg:grid-cols-5">
            {categories.map((c, i) => (
              <Link key={c.id} to={`/shop?cat=${c.id}`}
                className="group flex flex-col items-center animate-scale-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="w-32 h-32 lg:w-36 lg:h-36 rounded-full overflow-hidden bg-white shadow-elevated ring-4 ring-white/30 group-hover:ring-white/60 transition-all group-hover:scale-105">
                  <img src={c.image} alt={c.label} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="mt-3 px-4 py-1.5 rounded-full bg-accent text-accent-foreground font-semibold text-xs lg:text-sm shadow-card">
                  {c.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAST DELIVERY STRIP */}
      <section className="bg-primary-deep py-8 md:py-10">
        <div className="container">
          <h3 className="text-white text-center text-xl md:text-2xl font-bold mb-5">Fast Delivery In Gilgit</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {[
              { icon: Truck, label: "Delivery All Over Gilgit" },
              { icon: Leaf, label: "Same Day Service" },
              { icon: Coins, label: "Delivery Charges Rs. 100" },
            ].map((it, i) => (
              <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-card">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <it.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold text-foreground text-sm">{it.label}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-white/80 mt-4 text-xs md:text-sm">Fast And Reliable Service</p>
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
