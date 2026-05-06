// Categories live in /api/categories.php (JSON file storage on Hostinger).
// On first GET against an empty data file, the PHP endpoint seeds the 10
// default categories automatically — no migration step needed.

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const URL = `${BASE}/api/categories.php`;

export interface CategoryRow {
  id: string;
  slug: string;
  label: string;
  description: string;
  image: string;
  sortOrder: number;
}

async function asJson<T>(res: Response): Promise<T | null> {
  if (!res.ok) return null;
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("json")) return null;
  return await res.json() as T;
}

export async function listCategories(): Promise<CategoryRow[]> {
  try {
    const res = await fetch(URL, { cache: "no-store" });
    const data = await asJson<{ categories?: CategoryRow[] }>(res);
    return data?.categories || [];
  } catch { return []; }
}

export async function createCategory(input: {
  slug: string; label: string; description?: string; image?: string; sortOrder?: number;
}): Promise<{ ok: boolean; msg?: string }> {
  if (!input.slug.trim()) return { ok: false, msg: "Slug is required" };
  if (!input.label.trim()) return { ok: false, msg: "Label is required" };
  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await asJson<{ ok?: boolean; error?: string }>(res);
    if (!data?.ok) return { ok: false, msg: data?.error || "Could not create category" };
    return { ok: true };
  } catch (e) { return { ok: false, msg: "Network error" }; }
}

export async function updateCategory(id: string, patch: Partial<Omit<CategoryRow, "id">>): Promise<boolean> {
  try {
    const res = await fetch(URL, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const data = await asJson<{ ok?: boolean }>(res);
    return Boolean(data?.ok);
  } catch { return false; }
}

export async function deleteCategory(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${URL}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await asJson<{ ok?: boolean }>(res);
    return Boolean(data?.ok);
  } catch { return false; }
}

export async function reorderCategories(orderedIds: string[]): Promise<boolean> {
  try {
    const res = await fetch(`${URL}?action=reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: orderedIds }),
    });
    const data = await asJson<{ ok?: boolean }>(res);
    return Boolean(data?.ok);
  } catch { return false; }
}
