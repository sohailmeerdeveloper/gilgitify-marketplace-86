import { Layout } from "@/components/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "What areas do you deliver to?", a: "We deliver across all of Gilgit and surrounding areas of Gilgit-Baltistan." },
  { q: "What are the delivery charges?", a: "A flat Rs. 100 delivery fee applies to all orders within Gilgit." },
  { q: "How can I place an order?", a: "Browse the shop, add items to cart, and checkout. Or chat with us on WhatsApp." },
  { q: "What payment methods do you accept?", a: "We accept Cash on Delivery and online payments via Easypaisa." },
  { q: "What are your delivery timings?", a: "We deliver from 9 AM to 9 PM, seven days a week." },
  { q: "Can I return a product?", a: "Yes, perishables can be returned at delivery if not satisfactory. Other items within 24 hours." },
];

const FAQ = () => (
  <Layout>
    <section className="bg-primary py-12">
      <div className="container text-center text-white">
        <h1 className="font-display text-5xl md:text-6xl">Frequently Asked Questions</h1>
        <p className="text-white/80 mt-2">Find answers to common questions</p>
      </div>
    </section>
    <div className="container py-12 max-w-3xl">
      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`q${i}`} className="bg-card border rounded-2xl px-5 shadow-card">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </Layout>
);
export default FAQ;
