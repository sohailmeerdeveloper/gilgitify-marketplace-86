import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Ad, AdPlacement, listActiveAds } from "@/lib/adsApi";

interface Props {
  placement: AdPlacement;
  category?: string;
  className?: string;
  /** When false, render nothing if no ads. When true, reserve a placeholder slot. */
  reserveSpace?: boolean;
}

const isExternal = (href: string) => /^https?:\/\//i.test(href);

const AdLink = ({ ad, children }: { ad: Ad; children: React.ReactNode }) => {
  if (!ad.link) return <>{children}</>;
  if (isExternal(ad.link)) {
    return <a href={ad.link} target="_blank" rel="noreferrer noopener" className="block">{children}</a>;
  }
  return <Link to={ad.link} className="block">{children}</Link>;
};

export const AdSlot = ({ placement, category, className = "", reserveSpace = false }: Props) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listActiveAds(placement, category).then(list => {
      if (!cancelled) { setAds(list); setLoaded(true); }
    });
    return () => { cancelled = true; };
  }, [placement, category]);

  if (!loaded) return null;
  if (ads.length === 0 && !reserveSpace) return null;
  if (ads.length === 0) return null;

  if (placement === "home_banner") {
    const ad = ads[0];
    return (
      <section className={`container py-3 ${className}`}>
        <AdLink ad={ad}>
          <div className="relative rounded-3xl overflow-hidden shadow-elevated bg-card hover:shadow-2xl transition-shadow">
            <div className="aspect-[21/7] sm:aspect-[21/6] bg-secondary">
              <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wider bg-white/90 backdrop-blur rounded-full px-2 py-0.5 font-bold text-primary-deep">Sponsored</span>
          </div>
        </AdLink>
      </section>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {ads.map(ad => (
        <AdLink key={ad.id} ad={ad}>
          <div className="relative rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-shadow bg-card">
            <div className="aspect-[16/9] bg-secondary">
              <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="px-3 py-2 text-xs font-semibold flex justify-between items-center">
              <span className="truncate">{ad.title}</span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Sponsored</span>
            </div>
          </div>
        </AdLink>
      ))}
    </div>
  );
};
