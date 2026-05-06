// Ads live in /api/ads.php (JSON file storage on Hostinger).

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const URL = `${BASE}/api/ads.php`;

export type AdPlacement = "home_banner" | "home_sidebar" | "category_page" | "sidebar";

export interface Ad {
  id: string;
  title: string;
  image: string;
  link: string | null;
  placement: AdPlacement;
  category: string | null;
  vendorLabel: string | null;
  isActive: boolean;
  startsAt: string;
  expiresAt: string | null;
  sortOrder: number;
}

async function asJson<T>(res: Response): Promise<T | null> {
  if (!res.ok) return null;
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("json")) return null;
  return await res.json() as T;
}

export async function listAllAds(): Promise<Ad[]> {
  try {
    const res = await fetch(URL, { cache: "no-store" });
    const data = await asJson<{ ads?: Ad[] }>(res);
    return data?.ads || [];
  } catch { return []; }
}

export async function listActiveAds(placement: AdPlacement, category?: string): Promise<Ad[]> {
  try {
    const qs = new URLSearchParams({ placement });
    if (category) qs.set("category", category);
    const res = await fetch(`${URL}?${qs.toString()}`, { cache: "no-store" });
    const data = await asJson<{ ads?: Ad[] }>(res);
    return data?.ads || [];
  } catch { return []; }
}

export async function createAd(input: {
  title: string;
  image: string;
  link?: string;
  placement: AdPlacement;
  category?: string;
  vendorLabel?: string;
  isActive?: boolean;
  startsAt?: string;
  expiresAt?: string | null;
}): Promise<{ ok: boolean; msg?: string }> {
  if (!input.title.trim()) return { ok: false, msg: "Title required" };
  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await asJson<{ ok?: boolean; error?: string }>(res);
    if (!data?.ok) return { ok: false, msg: data?.error || "Could not create ad" };
    return { ok: true };
  } catch { return { ok: false, msg: "Network error" }; }
}

export async function updateAd(id: string, patch: Partial<Ad>): Promise<boolean> {
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

export async function deleteAd(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${URL}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await asJson<{ ok?: boolean }>(res);
    return Boolean(data?.ok);
  } catch { return false; }
}
