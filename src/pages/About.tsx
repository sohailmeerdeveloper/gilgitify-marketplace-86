import { Layout } from "@/components/Layout";
import { Truck, Users, Package } from "lucide-react";

const About = () => (
  <Layout>
    <section className="bg-primary py-12">
      <div className="container text-center text-white">
        <h1 className="font-display text-5xl md:text-6xl">About our Gilgit delivery Store</h1>
      </div>
    </section>
    <div className="container py-12 grid md:grid-cols-2 gap-10 items-center">
      <div>
        <p className="text-muted-foreground leading-relaxed">
          We are a modern and reliable online delivery platform specially designed to serve the beautiful region of Gilgit-Baltistan.
          Our mission is to make your daily life easier by providing fresh and high-quality products right at your doorstep.
        </p>
        <p className="text-muted-foreground leading-relaxed mt-4">
          Our platform offers a wide range of products including groceries, fresh fruits and vegetables, and everyday essentials —
          all in one place. We carefully handle every order to ensure that you receive the best quality items, fresh and on time.
        </p>
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="text-center"><Users className="w-8 h-8 text-primary mx-auto mb-1" /><div className="text-2xl font-bold text-primary-deep">1000+</div><div className="text-xs text-muted-foreground">Customers</div></div>
          <div className="text-center"><Package className="w-8 h-8 text-primary mx-auto mb-1" /><div className="text-2xl font-bold text-primary-deep">500+</div><div className="text-xs text-muted-foreground">Products</div></div>
          <div className="text-center"><Truck className="w-8 h-8 text-primary mx-auto mb-1" /><div className="text-2xl font-bold text-primary-deep">Fast</div><div className="text-xs text-muted-foreground">Delivery</div></div>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-6 shadow-card">
          <h3 className="font-bold text-primary-deep text-lg mb-2">Our Mission</h3>
          <p className="text-sm text-muted-foreground">Deliver fresh, delicious, and high-quality food to your doorstep quickly and reliably, while ensuring the best customer experience.</p>
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-card">
          <h3 className="font-bold text-primary-deep text-lg mb-2">Our Vision</h3>
          <p className="text-sm text-muted-foreground">Become a leading food delivery platform by providing fast, reliable, and high-quality service that customers trust and love.</p>
        </div>
      </div>
    </div>
  </Layout>
);
export default About;
