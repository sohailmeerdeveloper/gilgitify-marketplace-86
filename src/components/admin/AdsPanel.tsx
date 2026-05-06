import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, X, Megaphone, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import {
  listAllAds, createAd, updateAd, deleteAd, Ad, AdPlacement,
} from "@/lib/adsApi";
import { useCategories } from "@/hooks/useCategories";

const placementLabels: Record<AdPlacement, string> = {
  home_banner: "Homepage banner",
  home_sidebar: "Homepage sidebar",
  category_page: "Category page",
  sidebar: "Generic sidebar",
};

type FormState = {
  id?: string;
  title: string;
  image: string;
  link: string;
  placement: AdPlacement;
  category: string;
  vendorLabel: string;
  isActive: boolean;
  expiresAt: string;
};

const empty: FormState = {
  title: "", image: "", link: "",
  placement: "home_banner", category: "",
  vendorLabel: "", isActive: true, expiresAt: "",
};

const formatDateInput = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
};

export const AdsPanel = () => {
  const { categories } = useCategories();
  const [list, setList] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setList(await listAllAds());
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => setForm(s => ({ ...s, image: r.result as string }));
    r.readAsDataURL(f);
  };

  const openNew = () => { setForm(empty); setShowForm(true); };
  const openEdit = (a: Ad) => {
    setForm({
      id: a.id, title: a.title, image: a.image, link: a.link || "",
      placement: a.placement, category: a.category || "",
      vendorLabel: a.vendorLabel || "", isActive: a.isActive,
      expiresAt: formatDateInput(a.expiresAt),
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const expiresAt = form.expiresAt ? new Date(form.expiresAt).toISOString() : null;
      if (form.id) {
        const ok = await updateAd(form.id, {
          title: form.title, image: form.image, link: form.link || null,
          placement: form.placement,
          category: form.placement === "category_page" ? form.category : null,
          vendorLabel: form.vendorLabel || null,
          isActive: form.isActive,
          expiresAt,
        });
        if (!ok) return toast.error("Could not update ad");
        toast.success("Ad updated");
      } else {
        const res = await createAd({
          title: form.title, image: form.image, link: form.link || undefined,
          placement: form.placement,
          category: form.placement === "category_page" ? form.category : undefined,
          vendorLabel: form.vendorLabel || undefined,
          isActive: form.isActive,
          expiresAt,
        });
        if (!res.ok) return toast.error(res.msg || "Could not create ad");
        toast.success("Ad created");
      }
      setShowForm(false);
      refresh();
    } finally { setBusy(false); }
  };

  const toggle = async (a: Ad) => {
    const ok = await updateAd(a.id, { isActive: !a.isActive });
    if (!ok) return toast.error("Could not update");
    refresh();
  };

  const remove = async (a: Ad) => {
    if (!confirm(`Delete ad "${a.title}"?`)) return;
    const ok = await deleteAd(a.id);
    if (!ok) return toast.error("Could not delete");
    toast.success("Deleted");
    refresh();
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground">Loading ads...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Ads ({list.length})</h3>
        </div>
        <Button onClick={openNew} className="rounded-full"><Plus className="w-4 h-4 mr-1" /> Create Ad</Button>
      </div>

      {list.length === 0 ? (
        <div className="bg-card rounded-2xl shadow-card p-6 text-sm text-muted-foreground">No ads yet. Create one to start promoting on the homepage, sidebar, or category pages.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map(a => {
            const expired = a.expiresAt && new Date(a.expiresAt).getTime() < Date.now();
            return (
              <div key={a.id} className="bg-card rounded-2xl overflow-hidden shadow-card flex flex-col">
                <div className="relative aspect-[16/9] bg-secondary">
                  {a.image && <img src={a.image} alt={a.title} className="w-full h-full object-cover" />}
                  <span className={`absolute top-2 right-2 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-bold ${a.isActive && !expired ? "bg-emerald-500 text-white" : "bg-zinc-300 text-zinc-700"}`}>
                    {expired ? "Expired" : a.isActive ? "Live" : "Off"}
                  </span>
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <div className="font-semibold truncate">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{placementLabels[a.placement]}{a.category ? ` • ${a.category}` : ""}</div>
                  {a.vendorLabel && <div className="text-xs text-muted-foreground">For: {a.vendorLabel}</div>}
                  {a.expiresAt && <div className="text-xs text-muted-foreground mt-0.5">Expires: {new Date(a.expiresAt).toLocaleString()}</div>}
                  <div className="flex gap-1 mt-3">
                    <Button size="sm" variant="outline" onClick={() => openEdit(a)}><Edit className="w-3 h-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => toggle(a)}>
                      {a.isActive ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(a)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowForm(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={save}
            className="bg-card rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-3 animate-scale-in">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xl">{form.id ? "Edit" : "Create"} Ad</h3>
              <button type="button" onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <div><Label>Title</Label><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div>
              <Label>Vendor / user this ad is running for</Label>
              <Input value={form.vendorLabel} onChange={e => setForm({ ...form, vendorLabel: e.target.value })} placeholder="e.g. Awami Cash & Carry" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Placement</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.placement}
                  onChange={e => setForm({ ...form, placement: e.target.value as AdPlacement })}>
                  {(Object.keys(placementLabels) as AdPlacement[]).map(p => (
                    <option key={p} value={p}>{placementLabels[p]}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Category (only for Category page)</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  disabled={form.placement !== "category_page"}
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="">— select —</option>
                  {categories.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div><Label>Click-through link (optional)</Label><Input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="/shop?cat=garments" /></div>
            <div>
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={onImage} />
              <Input className="mt-2" placeholder="or paste image URL" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
              {form.image && <img src={form.image} alt="" className="w-full max-h-40 object-cover rounded-lg mt-2" />}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Expires (optional)</Label>
                <Input type="datetime-local" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                  Active
                </label>
              </div>
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={busy}>
              {busy ? "Saving..." : form.id ? "Update Ad" : "Create Ad"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
