import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Product, seedProducts } from "@/data/products";

export interface CartItem { product: Product; qty: number; }
export interface User { id: string; name: string; email: string; phone?: string; address?: string; isAdmin?: boolean; }
export interface Order {
  id: string;
  userId: string;
  userName: string;
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
  addToCart: (p: Product, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  signup: (name: string, email: string, password: string) => { ok: boolean; msg?: string };
  login: (email: string, password: string) => { ok: boolean; msg?: string };
  logout: () => void;
  updateProfile: (patch: Partial<User>) => void;
  placeOrder: (data: { address: string; phone: string; muhallah: string; paymentMethod: "cod" | "easypaisa"; location?: { lat: number; lng: number } | null }) => Order;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
}

const StoreCtx = createContext<StoreState | null>(null);

const KEY = "gilgitify_v1";
type Persisted = { cart: CartItem[]; user: User | null; users: (User & { password: string })[]; orders: Order[]; products: Product[] };

const ADMIN_EMAIL = "admin@gilgitify.pk";
const ADMIN_PASSWORD = "admin123";
const ADMIN_USER: User & { password: string } = {
  id: "admin",
  name: "Admin",
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
  isAdmin: true,
};

function normalize(data?: Partial<Persisted>): Persisted {
  const users = Array.isArray(data?.users) ? data.users : [];
  const hasAdmin = users.some(u => u.email?.toLowerCase() === ADMIN_EMAIL);
  const normalizedUsers = hasAdmin
    ? users.map(u => u.email?.toLowerCase() === ADMIN_EMAIL ? { ...u, ...ADMIN_USER, id: u.id || ADMIN_USER.id } : u)
    : [ADMIN_USER, ...users];
  const currentUser = data?.user?.email?.toLowerCase() === ADMIN_EMAIL
    ? { id: data.user.id || ADMIN_USER.id, name: data.user.name || ADMIN_USER.name, email: ADMIN_EMAIL, isAdmin: true }
    : data?.user ?? null;

  return {
    cart: Array.isArray(data?.cart) ? data.cart : [],
    user: currentUser,
    users: normalizedUsers,
    orders: Array.isArray(data?.orders) ? data.orders : [],
    products: Array.isArray(data?.products) ? data.products : seedProducts,
  };
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch {}
  return normalize();
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(state)); }, [state]);

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

  const signup = (name: string, email: string, password: string) => {
    if (state.users.some(u => u.email === email)) return { ok: false, msg: "Email already registered" };
    const user: User & { password: string } = { id: crypto.randomUUID(), name, email, password };
    setState(s => ({ ...s, users: [...s.users, user], user: { id: user.id, name, email } }));
    return { ok: true };
  };

  const login = (email: string, password: string) => {
    const u = state.users.find(x => x.email === email && (x as any).password === password);
    if (!u) return { ok: false, msg: "Invalid email or password" };
    setState(s => ({ ...s, user: { id: u.id, name: u.name, email: u.email, phone: u.phone, address: u.address, isAdmin: u.isAdmin } }));
    return { ok: true };
  };

  const logout = () => setState(s => ({ ...s, user: null }));

  const updateProfile = (patch: Partial<User>) => setState(s => s.user ? {
    ...s,
    user: { ...s.user, ...patch },
    users: s.users.map(u => u.id === s.user!.id ? { ...u, ...patch } as any : u),
  } : s);

  const placeOrder: StoreState["placeOrder"] = (data) => {
    const subtotal = state.cart.reduce((sum, c) => sum + c.product.price * c.qty, 0);
    const deliveryFee = 100;
    const total = subtotal + deliveryFee;
    const order: Order = {
      id: "ORD-" + Date.now().toString(36).toUpperCase(),
      userId: state.user?.id || "guest",
      userName: state.user?.name || "Guest",
      items: state.cart,
      subtotal, deliveryFee, total,
      ...data,
      status: "pending",
      createdAt: new Date().toISOString(),
      location: data.location ?? null,
    };
    setState(s => ({ ...s, orders: [order, ...s.orders], cart: [] }));
    return order;
  };

  const updateOrderStatus = (id: string, status: Order["status"]) =>
    setState(s => ({ ...s, orders: s.orders.map(o => o.id === id ? { ...o, status } : o) }));

  const addProduct = (p: Omit<Product, "id">) =>
    setState(s => ({ ...s, products: [{ ...p, id: "p" + Date.now() }, ...s.products] }));
  const updateProduct = (id: string, patch: Partial<Product>) =>
    setState(s => ({ ...s, products: s.products.map(p => p.id === id ? { ...p, ...patch } : p) }));
  const deleteProduct = (id: string) =>
    setState(s => ({ ...s, products: s.products.filter(p => p.id !== id) }));

  const cartCount = state.cart.reduce((n, c) => n + c.qty, 0);
  const cartTotal = state.cart.reduce((n, c) => n + c.product.price * c.qty, 0);

  const value: StoreState = {
    products: state.products, cart: state.cart, user: state.user, users: state.users, orders: state.orders,
    addToCart, removeFromCart, updateQty, clearCart, cartCount, cartTotal,
    signup, login, logout, updateProfile,
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
