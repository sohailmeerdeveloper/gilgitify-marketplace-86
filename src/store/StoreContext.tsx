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

async function loadCurrentUser(authUserId: string, fallbackEmail = ""): Promise<User | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, display_name, email, phone, address")
    .eq("user_id", authUserId)
    .maybeSingle();

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", authUserId);

  const isAdmin = roles?.some(role => role.role === "admin") ?? false;

  if (profile) return toUser(profile, fallbackEmail, isAdmin);

  const { data: createdProfile } = await supabase
    .from("profiles")
    .insert({ user_id: authUserId, display_name: fallbackEmail, email: fallbackEmail })
    .select("user_id, display_name, email, phone, address")
    .maybeSingle();

  return createdProfile ? toUser(createdProfile, fallbackEmail, isAdmin) : null;
}

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
    let mounted = true;

    const syncSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (mounted) {
          setUser(null);
          setUsers([]);
          setAuthLoading(false);
        }
        return;
      }

      const nextUser = await loadCurrentUser(session.user.id, session.user.email || "");
      if (!mounted) return;
      setUser(nextUser);
      setAuthLoading(false);
      if (nextUser?.isAdmin) await refreshAdminUsers();
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthLoading(true);
      if (!session?.user) {
        setUser(null);
        setUsers([]);
        setAuthLoading(false);
        return;
      }

      setTimeout(async () => {
        const nextUser = await loadCurrentUser(session.user.id, session.user.email || "");
        if (!mounted) return;
        setUser(nextUser);
        setAuthLoading(false);
        if (nextUser?.isAdmin) await refreshAdminUsers();
      }, 0);
    });

    syncSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
    // emailRedirectTo points back at this site (never lovable/external) in case
    // the Supabase project still has confirmation emails enabled. The actual
    // verification users complete is the 6-digit code we send from /signup.
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email?email=${encodeURIComponent(cleanEmail)}`,
        data: { display_name: cleanName },
      },
    });

    if (error) return { ok: false, msg: error.message };

    if (data.user) {
      await supabase
        .from("profiles")
        .upsert({ user_id: data.user.id, display_name: cleanName, email: cleanEmail }, { onConflict: "user_id" });
    }

    return { ok: true, msg: "Account created. Enter the 6-digit code we just emailed you." };
  };

  const login: StoreState["login"] = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error || !data.user) return { ok: false, msg: "Invalid email or password" };

    const nextUser = await loadCurrentUser(data.user.id, data.user.email || cleanEmail);
    setUser(nextUser);
    if (nextUser?.isAdmin) await refreshAdminUsers();
    return { ok: true, isAdmin: Boolean(nextUser?.isAdmin) };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsers([]);
  };

  const updateProfile: StoreState["updateProfile"] = async (patch) => {
    if (!user) return { ok: false, msg: "You must be logged in." };

    const nextProfile = {
      user_id: user.id,
      display_name: patch.name?.trim() || user.name,
      phone: patch.phone?.trim() || null,
      address: patch.address?.trim() || null,
      email: user.email,
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(nextProfile, { onConflict: "user_id" });

    if (error) return { ok: false, msg: "Could not update profile." };

    setUser(s => s ? { ...s, ...patch, name: nextProfile.display_name } : s);
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
