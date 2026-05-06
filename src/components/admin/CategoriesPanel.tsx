import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, X, ArrowUp, ArrowDown, Tags } from "lucide-react";
import { toast } from "sonner";
import {
  listCategories, createCategory, updateCategory, deleteCategory, reorderCategories,
  CategoryRow,
} from "@/lib/categoriesApi";
import { refreshCategoriesCache } from "@/hooks/useCategories";

type FormState = {
  id?: string;
  slug: string;
  label: string;
  description: string;
  image: string;
};

const empty: FormState = { slug: "", label: "", description: "", image: "" };

export const CategoriesPanel = () => {
  const [list, setList] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setList(await listCategories());
    setLoading(false);
    await refreshCategoriesCache();
  };
  useEffect(() => { refresh(); }, []);

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => setForm(s => ({ ...s, image: r.result as string }));
    r.readAsDataURL(f);
  };

  const openNew = () => { setForm(empty); setShowForm(true); };
  const openEdit = (c: CategoryRow) => {
    setForm({ id: c.id, slug: c.slug, label: c.label, description: c.description, image: c.image });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (form.id) {
        const ok = await updateCategory(form.id, {
          slug: form.slug, label: form.label,
          description: form.description, image: form.image,
        });
        if (!ok) return toast.error("Could not update category");
        toast.success("Category updated");
      } else {
        const res = await createCategory({
          slug: form.slug, label: form.label,
          description: form.description, image: form.image,
          sortOrder: (list.length + 1) * 10,
        });
        if (!res.ok) return toast.error(res.msg || "Could not create category");
        toast.success("Category added");
      }
      setShowForm(false);
      refresh();
    } finally { setBusy(false); }
  };

  const remove = async (c: CategoryRow) => {
    if (!confirm(`Delete category "${c.label}"? Products in this category will keep the slug "${c.slug}" but won't appear in any category filter.`)) return;
    const ok = await deleteCategory(c.id);
    if (!ok) return toast.error("Could not delete");
    toast.success("Deleted");
    refresh();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const next = [...list];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setList(next);
    await reorderCategories(next.map(c => c.id));
    refreshCategoriesCache();
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground">Loading categories...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Tags className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Categories ({list.length})</h3>
        </div>
        <Button onClick={openNew} className="rounded-full"><Plus className="w-4 h-4 mr-1" /> Add Category</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((c, idx) => (
          <div key={c.id} className="bg-card rounded-2xl p-4 shadow-card flex gap-3">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-secondary shrink-0">
              {c.image && <img src={c.image} alt={c.label} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{c.label}</div>
              <div className="text-xs text-muted-foreground truncate">slug: {c.slug}</div>
              {c.description && <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{c.description}</div>}
              <div className="flex flex-wrap gap-1 mt-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Edit className="w-3 h-3" /></Button>
                <Button size="sm" variant="destructive" onClick={() => remove(c)}><Trash2 className="w-3 h-3" /></Button>
                <Button size="sm" variant="outline" disabled={idx === 0} onClick={() => move(idx, -1)}><ArrowUp className="w-3 h-3" /></Button>
                <Button size="sm" variant="outline" disabled={idx === list.length - 1} onClick={() => move(idx, 1)}><ArrowDown className="w-3 h-3" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowForm(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={save}
            className="bg-card rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-3 animate-scale-in">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xl">{form.id ? "Edit" : "Add"} Category</h3>
              <button type="button" onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <div><Label>Label</Label><Input required value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} /></div>
            <div>
              <Label>Slug (lowercase, no spaces)</Label>
              <Input required value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="electronics" />
              <p className="text-xs text-muted-foreground mt-1">Products are tagged by slug. Changing it on an existing category won't move products automatically.</p>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={onImage} />
              <Input className="mt-2" placeholder="or paste image URL" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
              {form.image && <img src={form.image} alt="" className="w-24 h-24 rounded-lg object-cover mt-2" />}
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={busy}>
              {busy ? "Saving..." : form.id ? "Update Category" : "Add Category"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
