import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product, seedProducts } from "@/data/products";
import { notifyAdmin } from "@/lib/adminAuth";
import { listProducts, createProduct, updateProductRow, deleteProductRow } from "@/lib/productsApi";

export interface CartItem { product: Product; qty: number; }
export interface User { id: string; name: string; email: string; phone?: string; address?: string; isAdmin?: boolean; }
export interface Order {
  id: string;
  userId: string;
  userName: string;
  email?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: string;
  phone: string;
  muhallah: string;
  paymentMethod: "cod" | "easypaisa";
  status: "pending" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
  createdAt: string;
  location?: { lat: number; lng: number } | null;
}

interface StoreState {
  products: Product[];
  cart: CartItem[];
  user: User | null;
  users: User[];
  orders: Order[];
  authLoading: boolean;
  addToCart: (p: Product, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  signup: (name: string, email: string, password: string) => Promise<{ ok: boolean; msg?: string }>;
  login: (email: string, password: string) => Promise<{ ok: boolean; msg?: string; isAdmin?: boolean }>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<{ ok: boolean; msg?: string }>;
  refreshAdminUsers: () => Promise<void>;
  placeOrder: (data: { name: string; email?: string; address: string; phone: string; muhallah: string; paymentMethod: "cod" | "easypaisa"; location?: { lat: number; lng: number } | null }) => Order;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  addProduct: (p: Omit<Product, "id">) => Promise<ProductMutationResult>;
  updateProduct: (id: string, patch: Partial<Product>) => Promise<ProductMutationResult>;
  deleteProduct: (id: string) => Promise<ProductMutationResult>;
}

const StoreCtx = createContext<StoreState | null>(null);

const KEY = "gilgitify_v1";
type Persisted = { cart: CartItem[]; orders: Order[]; products: Product[] };
type ProductMutationResult = { ok: boolean; synced: boolean };

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

const SESSION_KEY = "gilgitify_user_session_v1";

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as User;
    return u && typeof u.id === "string" ? u : null;
  } catch { return null; }
}
function saveStoredUser(u: User) { localStorage.setItem(SESSION_KEY, JSON.stringify(u)); }
function clearStoredUser() { localStorage.removeItem(SESSION_KEY); }

async function loadProfileById(userId: string): Promise<User | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, display_name, email, phone, address")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile) return null;
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const isAdmin = roles?.some(r => r.role === "admin") ?? false;
  return {
    id: profile.user_id,
    name: profile.display_name || profile.email || "Customer",
    email: profile.email || "",
    phone: profile.phone || undefined,
    address: profile.address || undefined,
    isAdmin,
  };
}

function normalize(data?: Partial<Persisted>): Persisted {
  return {
    cart: Array.isArray(data?.cart) ? data.cart : [],
    orders: Array.isArray(data?.orders) ? data.orders : [],
    products: Array.isArray(data?.products) ? data.products : seedProducts,
  };
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch {
    // Ignore corrupted local cart/order/product cache.
  }
  return normalize();
}

const toUser = (profile: ProfileRow, fallbackEmail = "", isAdmin = false): User => ({
  id: profile.user_id,
  name: profile.display_name || profile.email || fallbackEmail || "Customer",
  email: profile.email || fallbackEmail,
  phone: profile.phone || undefined,
  address: profile.address || undefined,
  isAdmin,
});

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API_ORDERS = `${API_BASE}/api/orders.php`;

async function apiGetOrders(): Promise<Order[] | null> {
  try {
    const res = await fetch(API_ORDERS, { cache: "no-store" });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("json")) return null;
    const data = await res.json() as { orders?: Order[] };
    return Array.isArray(data.orders) ? data.orders : [];
  } catch {
    return null;
  }
}

async function apiCreateOrder(order: Order): Promise<boolean> {
  try {
    const res = await fetch(API_ORDERS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    return res.ok;
  } catch { return false; }
}

async function apiUpdateOrderStatus(id: string, status: Order["status"]): Promise<boolean> {
  try {
    const res = await fetch(API_ORDERS, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    return res.ok;
  } catch { return false; }
}


export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(state)); }, [state]);

  // Sync orders from the Hostinger PHP API. When the API isn't reachable
  // (GitHub Pages, no PHP) we silently keep using the localStorage cache.
  useEffect(() => {
    let cancelled = false;
    const fetchOrders = async () => {
      const remote = await apiGetOrders();
      if (cancelled || !remote) return;
      setState(s => ({ ...s, orders: remote }));
    };
    fetchOrders();
    const id = window.setInterval(fetchOrders, 8000);
    const onFocus = () => fetchOrders();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Sync products from Supabase. Falls back to whatever's cached locally if
  // the network call fails. Polls every 12s + on window focus so any browser
  // sees admin updates without a manual refresh.
  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      const remote = await listProducts();
      if (cancelled) return;
      // If the table is empty (fresh install) keep showing seedProducts so
      // the homepage isn't blank before the admin adds anything.
      if (remote.length > 0) {
        setState(s => ({ ...s, products: remote }));
      }
    };
    fetchProducts();
    const id = window.setInterval(fetchProducts, 12000);
    const onFocus = () => fetchProducts();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const refreshAdminUsers = useCallback(async () => {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, display_name, email, phone, address")
      .order("created_at", { ascending: false });

    if (error || !profiles) {
      setUsers([]);
      return;
    }

    setUsers(profiles.map(profile => toUser(profile)));
  }, []);

  useEffect(() => {
    // Custom auth: session is just a stored user object in localStorage,
    // mirroring the admin auth pattern. No supabase.auth, no JWT roundtrips.
    let mounted = true;
    const syncSession = async () => {
      const stored = loadStoredUser();
      if (!stored) {
        if (mounted) { setUser(null); setUsers([]); setAuthLoading(false); }
        return;
      }
      // Re-fetch the latest profile so name/phone/address stay fresh across devices.
      const fresh = await loadProfileById(stored.id);
      if (!mounted) return;
      const nextUser = fresh || stored;
      setUser(nextUser);
      setAuthLoading(false);
      if (nextUser.isAdmin) await refreshAdminUsers();
    };
    syncSession();
    return () => { mounted = false; };
  }, [refreshAdminUsers]);

  const addToCart = useCallback((product: Product, qty = 1) => {
    setState(s => {
      const existing = s.cart.find(c => c.product.id === product.id);
      const cart = existing
        ? s.cart.map(c => c.product.id === product.id ? { ...c, qty: c.qty + qty } : c)
        : [...s.cart, { product, qty }];
      return { ...s, cart };
    });
  }, []);

  const removeFromCart = (id: string) => setState(s => ({ ...s, cart: s.cart.filter(c => c.product.id !== id) }));
  const updateQty = (id: string, qty: number) => setState(s => ({ ...s, cart: s.cart.map(c => c.product.id === id ? { ...c, qty: Math.max(1, qty) } : c) }));
  const clearCart = () => setState(s => ({ ...s, cart: [] }));

  const signup: StoreState["signup"] = async (name, email, password) => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.rpc("app_signup", {
      _name: cleanName, _email: cleanEmail, _password: password,
    });
    if (error) {
      const msg = /already registered/i.test(error.message)
        ? "This email is already registered. Try logging in."
        : /password too short/i.test(error.message)
          ? "Password must be at least 8 characters."
          : "Could not create account. Please try again.";
      return { ok: false, msg };
    }
    return { ok: true, msg: "Account created. Enter the 6-digit code we just emailed you." };
  };

  const login: StoreState["login"] = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.rpc("app_login", { _email: cleanEmail, _password: password });
    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row) return { ok: false, msg: "Invalid email or password" };
    if (!row.email_verified) {
      return { ok: false, msg: "Email not verified yet. Check your inbox for the 6-digit code." };
    }

    // Admin role lookup keeps working — separate hardcoded admin auth still
    // governs the /admin route, but we still surface the flag here for any
    // role-based UI.
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", row.user_id);
    const isAdmin = roles?.some(r => r.role === "admin") ?? false;

    const nextUser: User = {
      id: row.user_id,
      name: row.display_name || row.email || cleanEmail,
      email: row.email || cleanEmail,
      phone: row.phone || undefined,
      address: row.address || undefined,
      isAdmin,
    };
    saveStoredUser(nextUser);
    setUser(nextUser);
    if (isAdmin) await refreshAdminUsers();
    return { ok: true, isAdmin };
  };

  const logout = async () => {
    clearStoredUser();
    setUser(null);
    setUsers([]);
  };

  const updateProfile: StoreState["updateProfile"] = async (patch) => {
    if (!user) return { ok: false, msg: "You must be logged in." };

    const nextProfile = {
      display_name: patch.name?.trim() || user.name,
      phone: patch.phone?.trim() || null,
      address: patch.address?.trim() || null,
    };

    const { error } = await supabase
      .from("profiles")
      .update(nextProfile)
      .eq("user_id", user.id);

    if (error) return { ok: false, msg: "Could not update profile." };

    const updated: User = { ...user, ...patch, name: nextProfile.display_name };
    saveStoredUser(updated);
    setUser(updated);
    return { ok: true };
  };

  const placeOrder: StoreState["placeOrder"] = (data) => {
    const subtotal = state.cart.reduce((sum, c) => sum + c.product.price * c.qty, 0);
    const deliveryFee = 100;
    const total = subtotal + deliveryFee;
    const order: Order = {
      id: "ORD-" + Date.now().toString(36).toUpperCase(),
      userId: user?.id || "guest",
      userName: data.name?.trim() || user?.name || "Guest",
      email: data.email?.trim() || user?.email,
      items: state.cart,
      subtotal, deliveryFee, total,
      address: data.address,
      phone: data.phone,
      muhallah: data.muhallah,
      paymentMethod: data.paymentMethod,
      status: "pending",
      createdAt: new Date().toISOString(),
      location: data.location ?? null,
    };
    // Optimistic local update + clear cart immediately.
    setState(s => ({ ...s, orders: [order, ...s.orders], cart: [] }));

    // Persist to the Hostinger PHP API so admin sees it from any device.
    apiCreateOrder(order).catch(() => { /* silent: localStorage already has it */ });

    const itemsList = order.items.map(i => `• ${i.product.name} × ${i.qty} — Rs. ${i.product.price * i.qty}`).join("\n");
    const mapLink = order.location ? `\nMap: https://www.google.com/maps?q=${order.location.lat},${order.location.lng}` : "";
    notifyAdmin(
      `New order ${order.id} — Rs. ${order.total}`,
      `A new order was placed on Gilgitify.\n\nOrder ID: ${order.id}\nCustomer: ${order.userName}\nPhone: ${order.phone}\nEmail: ${order.email || "—"}\nAddress: ${order.address}, ${order.muhallah}\nPayment: ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Easypaisa"}\n\nItems:\n${itemsList}\n\nSubtotal: Rs. ${order.subtotal}\nDelivery: Rs. ${order.deliveryFee}\nTotal: Rs. ${order.total}${mapLink}`,
      { orderId: order.id, total: order.total, customer: order.userName, phone: order.phone }
    );

    return order;
  };

  const updateOrderStatus = (id: string, status: Order["status"]) => {
    setState(s => ({ ...s, orders: s.orders.map(o => o.id === id ? { ...o, status } : o) }));
    const o = state.orders.find(x => x.id === id);
    apiUpdateOrderStatus(id, status).catch(() => { /* silent */ });
    if (o) notifyAdmin(
      `Order ${id} → ${status}`,
      `Order ${id} for ${o.userName} (${o.phone}) was updated to status: ${status}.`,
      { orderId: id, status }
    );
  };

  const addProduct: StoreState["addProduct"] = async (p) => {
    const product: Product = { ...p, id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}` };
    setState(s => ({ ...s, products: [product, ...s.products] }));

    const ok = await createProduct(product);
    if (!ok) {
      setState(s => ({ ...s, products: s.products.filter(item => item.id !== product.id) }));
      return { ok: false, synced: false };
    }
    const remote = await listProducts();
    if (remote.length > 0) setState(s => ({ ...s, products: remote }));
    return { ok: true, synced: true };
  };

  const updateProduct: StoreState["updateProduct"] = async (id, patch) => {
    const previous = state.products.find(p => p.id === id);
    setState(s => ({ ...s, products: s.products.map(p => p.id === id ? { ...p, ...patch } : p) }));

    const ok = await updateProductRow(id, patch);
    if (!ok && previous) {
      setState(s => ({ ...s, products: s.products.map(p => p.id === id ? previous : p) }));
      return { ok: false, synced: false };
    }
    const remote = await listProducts();
    if (remote.length > 0) setState(s => ({ ...s, products: remote }));
    return { ok: true, synced: true };
  };

  const deleteProduct: StoreState["deleteProduct"] = async (id) => {
    const previousIndex = state.products.findIndex(p => p.id === id);
    const previous = previousIndex >= 0 ? state.products[previousIndex] : undefined;
    setState(s => ({ ...s, products: s.products.filter(p => p.id !== id) }));

    const ok = await deleteProductRow(id);
    if (!ok && previous) {
      setState(s => {
        const products = [...s.products];
        products.splice(Math.min(previousIndex, products.length), 0, previous);
        return { ...s, products };
      });
      return { ok: false, synced: false };
    }
    const remote = await listProducts();
    setState(s => ({ ...s, products: remote.length > 0 ? remote : s.products }));
    return { ok: true, synced: true };
  };

  const cartCount = state.cart.reduce((n, c) => n + c.qty, 0);
  const cartTotal = state.cart.reduce((n, c) => n + c.product.price * c.qty, 0);

  const value: StoreState = {
    products: state.products, cart: state.cart, user, users, orders: state.orders, authLoading,
    addToCart, removeFromCart, updateQty, clearCart, cartCount, cartTotal,
    signup, login, logout, updateProfile, refreshAdminUsers,
    placeOrder, updateOrderStatus,
    addProduct, updateProduct, deleteProduct,
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export const useStore = () => {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
};
