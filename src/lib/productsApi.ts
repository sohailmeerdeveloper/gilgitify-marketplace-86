// Products live in /api/products.php (JSON file storage on Hostinger).
import type { Product } from "@/data/products";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const URL = `${BASE}/api/products.php`;

async function asJson<T>(res: Response): Promise<T | null> {
  if (!res.ok) return null;
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("json")) return null;
  return await res.json() as T;
}

export async function listProducts(): Promise<Product[]> {
  try {
    const res = await fetch(URL, { cache: "no-store" });
    const data = await asJson<{ products?: Product[] }>(res);
    return data?.products || [];
  } catch { return []; }
}

export async function createProduct(p: Product): Promise<boolean> {
  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    const data = await asJson<{ ok?: boolean }>(res);
    return Boolean(data?.ok);
  } catch { return false; }
}

export async function updateProductRow(id: string, patch: Partial<Product>): Promise<boolean> {
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

export async function deleteProductRow(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${URL}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await asJson<{ ok?: boolean }>(res);
    return Boolean(data?.ok);
  } catch { return false; }
}
