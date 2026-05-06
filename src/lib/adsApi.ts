import { supabase } from "@/integrations/supabase/client";

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

type Row = {
  id: string;
  title: string;
  image: string;
  link: string | null;
  placement: string;
  category: string | null;
  vendor_label: string | null;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  sort_order: number;
};

const fromRow = (r: Row): Ad => ({
  id: r.id,
  title: r.title,
  image: r.image,
  link: r.link,
  placement: r.placement as AdPlacement,
  category: r.category,
  vendorLabel: r.vendor_label,
  isActive: r.is_active,
  startsAt: r.starts_at,
  expiresAt: r.expires_at,
  sortOrder: r.sort_order,
});

export async function listAllAds(): Promise<Ad[]> {
  const { data, error } = await supabase
    .from("ads")
    .select("id, title, image, link, placement, category, vendor_label, is_active, starts_at, expires_at, sort_order")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(fromRow);
}

export async function listActiveAds(placement: AdPlacement, category?: string): Promise<Ad[]> {
  const now = new Date().toISOString();
  let q = supabase
    .from("ads")
    .select("id, title, image, link, placement, category, vendor_label, is_active, starts_at, expires_at, sort_order")
    .eq("placement", placement)
    .eq("is_active", true)
    .lte("starts_at", now)
    .order("sort_order", { ascending: true });

  if (placement === "category_page" && category) {
    q = q.eq("category", category);
  }
  const { data, error } = await q;
  if (error || !data) return [];
  return data
    .filter(r => !r.expires_at || r.expires_at > now)
    .map(fromRow);
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
  const { error } = await supabase.from("ads").insert({
    title: input.title.trim(),
    image: input.image.trim(),
    link: input.link?.trim() || null,
    placement: input.placement,
    category: input.category?.trim() || null,
    vendor_label: input.vendorLabel?.trim() || null,
    is_active: input.isActive ?? true,
    starts_at: input.startsAt || new Date().toISOString(),
    expires_at: input.expiresAt || null,
  });
  if (error) return { ok: false, msg: error.message };
  return { ok: true };
}

export async function updateAd(id: string, patch: Partial<Ad>): Promise<boolean> {
  const next: Record<string, unknown> = {};
  if (patch.title !== undefined) next.title = patch.title;
  if (patch.image !== undefined) next.image = patch.image;
  if (patch.link !== undefined) next.link = patch.link;
  if (patch.placement !== undefined) next.placement = patch.placement;
  if (patch.category !== undefined) next.category = patch.category;
  if (patch.vendorLabel !== undefined) next.vendor_label = patch.vendorLabel;
  if (patch.isActive !== undefined) next.is_active = patch.isActive;
  if (patch.startsAt !== undefined) next.starts_at = patch.startsAt;
  if (patch.expiresAt !== undefined) next.expires_at = patch.expiresAt;
  if (patch.sortOrder !== undefined) next.sort_order = patch.sortOrder;
  const { error } = await supabase.from("ads").update(next).eq("id", id);
  return !error;
}

export async function deleteAd(id: string): Promise<boolean> {
  const { error } = await supabase.from("ads").delete().eq("id", id);
  return !error;
}
