import { Link } from "react-router-dom";
import { Instagram, Facebook, Phone, MapPin, Mail } from "lucide-react";
import logo from "@/assets/gilgitify-logo.png";

export function Footer() {
  return (
    <footer className="mt-16 bg-primary-deep text-primary-foreground">
      <div className="container py-12 grid gap-10 md:grid-cols-4">
        <div>
          <div className="bg-white rounded-xl p-2 inline-block mb-3">
            <img src={logo} alt="Gilgitify" className="h-14 w-auto object-contain" />
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            Gilgit-Baltistan's modern delivery store. Fresh groceries, meat, vegetables and essentials at your doorstep.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Explore</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link to="/shop" className="hover:text-white transition-colors">Shop</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">About us</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Reach Us</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +92 314 5556548</li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> hello@gilgitify.pk</li>
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Gilgit, Gilgit-Baltistan, Pakistan</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Follow</h4>
          <div className="flex gap-3">
            <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Instagram className="w-4 h-4" /></a>
            <a href="#" aria-label="Facebook" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Facebook className="w-4 h-4" /></a>
          </div>
        </div>
      </div>
      <div className="bg-black/20 py-4 text-center text-sm text-white/70">
        Gilgit Baltistan All Food Delivery © {new Date().getFullYear()} Gilgitify
      </div>
    </footer>
  );
}
