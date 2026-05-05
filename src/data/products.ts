export type Category =
  | "general"
  | "meat"
  | "vegetable"
  | "grocery"
  | "cosmetics"
  | "garments"
  | "dry_fruits"
  | "stationery"
  | "electronics"
  | "fast_food";

export interface Product {
  id: string;
  name: string;
  nameUrdu?: string;
  price: number;
  category: Category;
  image: string;
  description: string;
  unit: string;
  stock: number;
}

export const categories: { id: Category; label: string; image: string; description: string }[] = [
  {
    id: "general",
    label: "General Store",
    description: "Daily essentials and household items",
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&q=80",
  },
  {
    id: "meat",
    label: "Meat Shop",
    description: "Fresh halal meat, chicken & fish",
    image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80",
  },
  {
    id: "vegetable",
    label: "Vegetable Shop",
    description: "Farm-fresh vegetables & fruits",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
  },
  {
    id: "grocery",
    label: "Grocery",
    description: "Rice, oils, spices and more",
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&q=80",
  },
  {
    id: "cosmetics",
    label: "Cosmetics",
    description: "Skincare, makeup & beauty",
    image: "https://images.unsplash.com/photo-1522335789203-aaa2f6d4cdb1?w=600&q=80",
  },
  {
    id: "garments",
    label: "Garments",
    description: "Clothing, fabrics & apparel",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80",
  },
  {
    id: "dry_fruits",
    label: "Dry Fruits",
    description: "Almonds, walnuts, apricots & more",
    image: "https://images.unsplash.com/photo-1604908554007-9354dca5d234?w=600&q=80",
  },
  {
    id: "stationery",
    label: "Stationery",
    description: "Books, pens & school supplies",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80",
  },
  {
    id: "electronics",
    label: "Electronics",
    description: "Phones, accessories & gadgets",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
  },
  {
    id: "fast_food",
    label: "Fast Food",
    description: "Burgers, pizza, broast & more",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
  },
];

export const seedProducts: Product[] = [
  // Meat
  { id: "p1", name: "Big Chicken", price: 420, category: "meat", unit: "1 kg", stock: 50,
    image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&q=80",
    description: "Whole farm-raised chicken, freshly cleaned and ready to cook." },
  { id: "p2", name: "Beef Meat", price: 1200, category: "meat", unit: "1 kg", stock: 40,
    image: "https://images.unsplash.com/photo-1603048719536-c1ea9866cd0c?w=600&q=80",
    description: "Premium fresh beef cuts, halal certified." },
  { id: "p3", name: "Small Chicken", price: 380, category: "meat", unit: "1 kg", stock: 60,
    image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80",
    description: "Tender small chicken pieces, perfect for curries." },
  { id: "p4", name: "Fresh Fish", price: 650, category: "meat", unit: "1 kg", stock: 30,
    image: "https://images.unsplash.com/photo-1559825481-12a05cc00344?w=600&q=80",
    description: "Locally caught fresh river fish from Gilgit." },
  // Vegetable
  { id: "p5", name: "Tomatoes", price: 90, category: "vegetable", unit: "1 kg", stock: 100,
    image: "https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=600&q=80",
    description: "Vine-ripened red tomatoes." },
  { id: "p6", name: "Red Onion", price: 70, category: "vegetable", unit: "1 kg", stock: 120,
    image: "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=600&q=80",
    description: "Crisp purple onions, freshly harvested." },
  { id: "p7", name: "Cucumber", price: 60, category: "vegetable", unit: "1 kg", stock: 80,
    image: "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=600&q=80",
    description: "Cool and crunchy garden cucumbers." },
  { id: "p8", name: "Cauliflower", price: 110, category: "vegetable", unit: "1 piece", stock: 50,
    image: "https://images.unsplash.com/photo-1568584711271-6c929fb49b60?w=600&q=80",
    description: "Fresh white cauliflower head." },
  // Grocery
  { id: "p9", name: "Basmati Rice", price: 500, category: "grocery", unit: "5 kg", stock: 70,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80",
    description: "Long grain premium basmati rice." },
  { id: "p10", name: "Chana Dal", price: 280, category: "grocery", unit: "1 kg", stock: 90,
    image: "https://images.unsplash.com/photo-1599909366516-6c1c0a8a3b35?w=600&q=80",
    description: "Organic split chickpeas." },
  { id: "p11", name: "Masoor Dal", price: 320, category: "grocery", unit: "1 kg", stock: 85,
    image: "https://images.unsplash.com/photo-1612257999968-f30a98a72ac1?w=600&q=80",
    description: "High-quality red lentils." },
  { id: "p12", name: "Grain Rice", price: 420, category: "grocery", unit: "5 kg", stock: 60,
    image: "https://images.unsplash.com/photo-1568347877321-f8935c7dc5a8?w=600&q=80",
    description: "Daily-use white grain rice." },
  // General
  { id: "p13", name: "Cooking Oil", price: 750, category: "general", unit: "5 L", stock: 50,
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80",
    description: "Pure refined cooking oil." },
  { id: "p14", name: "Dalda Banaspati", price: 850, category: "general", unit: "2.5 kg", stock: 40,
    image: "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=600&q=80",
    description: "Trusted vegetable ghee." },
  { id: "p15", name: "Lipton Tea", price: 480, category: "general", unit: "475 g", stock: 80,
    image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&q=80",
    description: "Yellow Label tea, rich and bright." },
  { id: "p16", name: "Karahi Masala", price: 220, category: "general", unit: "100 g", stock: 100,
    image: "https://images.unsplash.com/photo-1599909533730-78b6c8f37b07?w=600&q=80",
    description: "Authentic Shan karahi spice mix." },
];
