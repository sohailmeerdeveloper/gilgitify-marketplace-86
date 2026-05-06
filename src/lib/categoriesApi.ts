import { supabase } from "@/integrations/supabase/client";

export interface CategoryRow {
  id: string;
  slug: string;
  label: string;
  description: string;
  image: string;
  sortOrder: number;
}

const fromRow = (r: {
  id: string; slug: string; label: string; description: string; image: string; sort_order: number;
}): CategoryRow => ({
  id: r.id, slug: r.slug, label: r.label,
  description: r.description, image: r.image, sortOrder: r.sort_order,
});

export async function listCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, label, description, image, sort_order")
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data.map(fromRow);
}

export async function createCategory(input: {
  slug: string; label: string; description?: string; image?: string; sortOrder?: number;
}): Promise<{ ok: boolean; msg?: string }> {
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  if (!slug) return { ok: false, msg: "Slug is required" };
  if (!input.label.trim()) return { ok: false, msg: "Label is required" };
  const { error } = await supabase.from("categories").insert({
    slug,
    label: input.label.trim(),
    description: input.description?.trim() || "",
    image: input.image?.trim() || "",
    sort_order: input.sortOrder ?? 999,
  });
  if (error) return { ok: false, msg: error.message };
  return { ok: true };
}

export async function updateCategory(id: string, patch: Partial<Omit<CategoryRow, "id">>): Promise<boolean> {
  const next: Record<string, unknown> = {};
  if (patch.slug !== undefined) next.slug = patch.slug.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  if (patch.label !== undefined) next.label = patch.label.trim();
  if (patch.description !== undefined) next.description = patch.description.trim();
  if (patch.image !== undefined) next.image = patch.image.trim();
  if (patch.sortOrder !== undefined) next.sort_order = patch.sortOrder;
  const { error } = await supabase.from("categories").update(next).eq("id", id);
  return !error;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  return !error;
}

export async function reorderCategories(orderedIds: string[]): Promise<boolean> {
  // Re-number sort_order based on the order of ids passed in.
  await Promise.all(orderedIds.map((id, idx) =>
    supabase.from("categories").update({ sort_order: (idx + 1) * 10 }).eq("id", id)
  ));
  return true;
}
