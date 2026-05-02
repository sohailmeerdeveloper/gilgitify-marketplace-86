import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, MessageCircle, Mail, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Contact = () => {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.message) return toast.error("Please fill in name and message");
    toast.success("Message sent! We'll get back to you soon.");
    setForm({ name: "", phone: "", message: "" });
  };

  return (
    <Layout>
      <section className="bg-primary py-12">
        <div className="container text-center text-white">
          <h1 className="font-display text-5xl md:text-6xl">Contact Us</h1>
        </div>
      </section>
      <div className="container py-12 grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-3xl p-6 shadow-card space-y-4">
          <div>
            <h3 className="font-bold text-primary-deep text-xl">We're Here to Help!</h3>
            <p className="text-sm text-muted-foreground">Have a question or want to place an order? Reach out to us.</p>
          </div>
          {[
            { icon: Phone, title: "Call Us", value: "+92 314 5556548" },
            { icon: MessageCircle, title: "WhatsApp Chat", value: "Chat with us on WhatsApp" },
            { icon: Mail, title: "Email", value: "hello@gilgitify.pk" },
            { icon: MapPin, title: "Location", value: "Gilgit, Gilgit-Baltistan, Pakistan" },
          ].map(c => (
            <div key={c.title} className="flex gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><c.icon className="w-5 h-5 text-primary" /></div>
              <div><div className="font-semibold text-primary">{c.title}</div><div className="text-sm text-muted-foreground">{c.value}</div></div>
            </div>
          ))}
        </div>
        <form onSubmit={submit} className="bg-card rounded-3xl p-6 shadow-card space-y-4">
          <h3 className="font-bold text-primary-deep text-xl">Send Us a Message</h3>
          <div><Label>Full Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
          <div><Label>Phone Number</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
          <div><Label>Message</Label><Textarea rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="mt-1" /></div>
          <Button type="submit" size="lg" className="w-full rounded-full">Send Message</Button>
        </form>
      </div>
    </Layout>
  );
};
export default Contact;
