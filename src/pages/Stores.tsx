import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { listApprovedStores, Store } from "@/lib/vendor";
import { Store as StoreIcon } from "lucide-react";

const Stores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { listApprovedStores().then(s => { setStores(s); setLoading(false); }); }, []);

  return (
    <Layout>
      <section className="bg-primary py-12">
        <div className="container text-center text-white">
          <h1 className="font-display text-5xl md:text-6xl mb-2">Stores</h1>
          <p className="text-white/80">Browse independent stores selling on Gilgitify</p>
        </div>
      </section>

      <div className="container py-10">
        {loading ? (
          <div className="text-center text-muted-foreground py-20">Loading stores...</div>
        ) : stores.length === 0 ? (
          <div className="text-center py-20">
            <StoreIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No stores yet.</p>
            <Link to="/become-a-seller" className="text-primary hover:underline font-semibold">Open the first one →</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {stores.map(s => (
              <Link key={s.id} to={`/store/${s.slug}`}
                className="bg-card rounded-3xl shadow-card p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  {s.logo
                    ? <img src={s.logo} alt={s.name} className="w-14 h-14 rounded-2xl object-cover" />
                    : <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><StoreIcon className="w-7 h-7" /></div>}
                  <div className="min-w-0">
                    <div className="font-bold text-lg truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground">by {s.ownerName}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">{s.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Stores;
