import { Layout } from "@/components/Layout";

const sections = [
  { t: "Information We Collect", b: "We collect your name, contact details, delivery address, and order history to fulfill your orders and improve our service." },
  { t: "How We Use Information", b: "Your information is used to process orders, send delivery updates, and communicate offers (only if you opt in)." },
  { t: "Information Sharing", b: "We do not sell or share your information with third parties, except with delivery partners required to complete your order." },
  { t: "Data Security", b: "We use industry-standard security measures to protect your personal information and payment details." },
];

const Privacy = () => (
  <Layout>
    <section className="bg-primary py-12">
      <div className="container text-center text-white">
        <h1 className="font-display text-5xl md:text-6xl">Privacy Policy</h1>
        <p className="text-white/80 mt-2">Your privacy is important to us</p>
      </div>
    </section>
    <div className="container py-12 max-w-3xl space-y-4">
      {sections.map(s => (
        <div key={s.t} className="bg-card border rounded-2xl p-6 shadow-card">
          <h3 className="font-bold text-primary-deep text-lg mb-2">{s.t}</h3>
          <p className="text-muted-foreground">{s.b}</p>
        </div>
      ))}
    </div>
  </Layout>
);
export default Privacy;
