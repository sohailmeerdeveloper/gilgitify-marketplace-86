import { Link, NavLink, useLocation } from "react-router-dom";
import { ShoppingCart, User, Menu, X, LayoutDashboard, Package, LogOut } from "lucide-react";
import logo from "@/assets/gilgitify-logo.png";
import { useState } from "react";
import { useStore } from "@/store/StoreContext";
import { Button } from "@/components/ui/button";

export function Header() {
  const { cartCount, user, logout } = useStore();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  const links = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-card">
      <div className="container flex items-center justify-between h-16 md:h-20 gap-4">
        <Link to="/" className="flex items-center group">
          <div className="bg-white rounded-xl px-2 py-1 shadow-md">
            <img src={logo} alt="Gilgitify" className="h-10 md:h-12 w-auto object-contain" />
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive ? "bg-white/20" : "hover:bg-white/10"}`}
            >{l.label}</NavLink>
          ))}
          <NavLink to="/admin"
            className={({ isActive }) =>
              `px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive ? "bg-white/20" : "hover:bg-white/10"}`}
          >Admin</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <>
              {user.isAdmin && (
                <Link to="/admin" className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-full bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                  <LayoutDashboard className="w-4 h-4" /> Admin
                </Link>
              )}
              <Link to="/orders" className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-white/10 transition-colors text-sm font-medium">
                <Package className="w-4 h-4" /> Orders
              </Link>
              <Link to="/profile" className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/10 transition-colors">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium max-w-[100px] truncate">{user.name}</span>
              </Link>
              <button onClick={logout} className="hidden sm:flex items-center p-2 rounded-full hover:bg-white/10" aria-label="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link to="/login" className="hidden sm:block">
              <Button variant="secondary" size="sm" className="rounded-full">Login</Button>
            </Link>
          )}
          <button className="md:hidden p-2 rounded-full hover:bg-white/10" onClick={() => setOpen(o => !o)} aria-label="Menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 animate-fade-in">
          <nav className="container py-3 flex flex-col gap-1">
            {links.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium ${loc.pathname === l.to ? "bg-white/20" : "hover:bg-white/10"}`}>
                {l.label}
              </Link>
            ))}
            <Link to="/admin" onClick={() => setOpen(false)} className={`px-4 py-2.5 rounded-lg text-sm font-medium ${loc.pathname === "/admin" ? "bg-white/20" : "hover:bg-white/10"}`}>Admin</Link>
            {user ? (
              <>
                <Link to="/profile" onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-lg hover:bg-white/10 text-sm font-medium">Profile</Link>
                <Link to="/orders" onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-lg hover:bg-white/10 text-sm font-medium">My Orders</Link>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-lg hover:bg-white/10 text-sm font-medium">Login / Sign up</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
