// Vendor (multi-store) data access — talks to the PHP/JSON API
// in public/api so it works the same way orders.php and products.php do.

const API_BASE       = import.meta.env.BASE_URL.replace(/\/$/, "");
const API_APPS       = `${API_BASE}/api/applications.php`;
const API_STORES     = `${API_BASE}/api/stores.php`;
const API_SP         = `${API_BASE}/api/store_products.php`;

export type ApplicationStatus = "pending" | "approved" | "rejected";
export type StoreStatus = "approved" | "suspended";

export interface StoreApplication {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  shopName: string;
  shopDescription: string;
  shopCategory: string | null;
  status: ApplicationStatus;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface Store {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo: string | null;
  category: string | null;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  status: StoreStatus;
  premiumPaidAt: string | null;
  premiumExpiresAt: string | null;
  createdAt: string;
}

export interface StoreProduct {
  id: string;
  storeId: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  unit: string;
  stock: number;
  createdAt: string;
}

const SESSION_KEY = "gilgitify_vendor_session";

export interface VendorSession {
  storeId: string;
  email: string;
}

export function getVendorSession(): VendorSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as VendorSession : null;
  } catch {
    return null;
  }
}

export function setVendorSession(session: VendorSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearVendorSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

async function asJson(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("json")) return null;
  try { return await res.json(); } catch { return null; }
}

// ---------- Applications ----------

export interface NewApplication {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  shopName: string;
  shopDescription: string;
  shopCategory?: string | null;
}

export async function submitApplication(input: NewApplication): Promise<{ ok: boolean; msg?: string }> {
  try {
    const res = await fetch(API_APPS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await asJson(res) as { ok?: boolean; error?: string } | null;
    if (!res.ok || !data?.ok) return { ok: false, msg: data?.error || "Could not submit." };
    return { ok: true };
  } catch {
    return { ok: false, msg: "Network error. Try again." };
  }
}

export async function listApplications(): Promise<StoreApplication[]> {
  try {
    const res = await fetch(API_APPS, { cache: "no-store" });
    const data = await asJson(res) as { applications?: StoreApplication[] } | null;
    return data?.applications || [];
  } catch { return []; }
}

export async function approveApplication(id: string): Promise<{ ok: boolean; msg?: string; store?: Store }> {
  try {
    const res = await fetch(`${API_APPS}?action=approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await asJson(res) as { ok?: boolean; error?: string; store?: Store } | null;
    if (!res.ok || !data?.ok) return { ok: false, msg: data?.error || "Could not approve." };
    return { ok: true, store: data.store };
  } catch { return { ok: false, msg: "Network error" }; }
}

export async function rejectApplication(id: string, note?: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_APPS}?action=reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, note }),
    });
    const data = await asJson(res) as { ok?: boolean } | null;
    return Boolean(res.ok && data?.ok);
  } catch { return false; }
}

// ---------- Stores ----------

export async function listApprovedStores(): Promise<Store[]> {
  try {
    const res = await fetch(API_STORES, { cache: "no-store" });
    const data = await asJson(res) as { stores?: Store[] } | null;
    return data?.stores || [];
  } catch { return []; }
}

export async function listAllStores(): Promise<Store[]> {
  try {
    const res = await fetch(`${API_STORES}?all=1`, { cache: "no-store" });
    const data = await asJson(res) as { stores?: Store[] } | null;
    return data?.stores || [];
  } catch { return []; }
}

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  try {
    const res = await fetch(`${API_STORES}?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
    const data = await asJson(res) as { store?: Store | null } | null;
    return data?.store || null;
  } catch { return null; }
}

export async function vendorLogin(email: string, password: string): Promise<{ ok: boolean; msg?: string; store?: Store }> {
  try {
    const res = await fetch(`${API_STORES}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const data = await asJson(res) as { ok?: boolean; error?: string; store?: Store } | null;
    if (!data?.ok || !data.store) return { ok: false, msg: data?.error || "Login failed" };
    setVendorSession({ storeId: data.store.id, email: data.store.ownerEmail });
    return { ok: true, store: data.store };
  } catch {
    return { ok: false, msg: "Network error" };
  }
}

export async function getMyStore(): Promise<Store | null> {
  const session = getVendorSession();
  if (!session) return null;
  // Fetch the freshest copy by listing all and finding by id (handles status changes).
  const all = await listAllStores();
  return all.find(s => s.id === session.storeId) || null;
}

export async function updateStoreProfile(storeId: string, patch: { name?: string; description?: string; logo?: string | null }): Promise<boolean> {
  try {
    const res = await fetch(`${API_STORES}?action=updateProfile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, ...patch }),
    });
    const data = await asJson(res) as { ok?: boolean } | null;
    return Boolean(res.ok && data?.ok);
  } catch { return false; }
}

export async function changeVendorPassword(storeId: string, currentPassword: string, newPassword: string): Promise<{ ok: boolean; msg?: string }> {
  try {
    const res = await fetch(`${API_STORES}?action=changePassword`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, currentPassword, newPassword }),
    });
    const data = await asJson(res) as { ok?: boolean; error?: string } | null;
    if (!data?.ok) return { ok: false, msg: data?.error || "Could not change password" };
    return { ok: true };
  } catch { return { ok: false, msg: "Network error" }; }
}

export async function setStoreStatus(id: string, status: StoreStatus): Promise<boolean> {
  try {
    const res = await fetch(`${API_STORES}?action=setStatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await asJson(res) as { ok?: boolean } | null;
    return Boolean(res.ok && data?.ok);
  } catch { return false; }
}

export async function markPremiumPaid(id: string, months: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_STORES}?action=markPaid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, months }),
    });
    const data = await asJson(res) as { ok?: boolean } | null;
    return Boolean(res.ok && data?.ok);
  } catch { return false; }
}

export async function deleteStore(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_STORES}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await asJson(res) as { ok?: boolean } | null;
    return Boolean(res.ok && data?.ok);
  } catch { return false; }
}

// ---------- Store products ----------

export async function listStoreProducts(storeId: string): Promise<StoreProduct[]> {
  try {
    const res = await fetch(`${API_SP}?storeId=${encodeURIComponent(storeId)}`, { cache: "no-store" });
    const data = await asJson(res) as { products?: StoreProduct[] } | null;
    return data?.products || [];
  } catch { return []; }
}

export async function addStoreProduct(p: Omit<StoreProduct, "id" | "createdAt">): Promise<StoreProduct | null> {
  try {
    const res = await fetch(API_SP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    const data = await asJson(res) as { ok?: boolean; product?: StoreProduct } | null;
    return data?.ok && data.product ? data.product : null;
  } catch { return null; }
}

export async function updateStoreProduct(id: string, patch: Partial<StoreProduct>): Promise<boolean> {
  try {
    const res = await fetch(API_SP, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const data = await asJson(res) as { ok?: boolean } | null;
    return Boolean(res.ok && data?.ok);
  } catch { return false; }
}

export async function deleteStoreProduct(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_SP}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await asJson(res) as { ok?: boolean } | null;
    return Boolean(res.ok && data?.ok);
  } catch { return false; }
}
