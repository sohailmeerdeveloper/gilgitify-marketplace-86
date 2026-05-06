import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/data/products";

type Row = {
  id: string;
  name: string;
  name_urdu: string | null;
  price: number;
  category: string;
  image: string;
  description: string;
  unit: string;
  stock: number;
};

const fromRow = (r: Row): Product => ({
  id: r.id,
  name: r.name,
  nameUrdu: r.name_urdu || undefined,
  price: Number(r.price),
  category: r.category as Product["category"],
  image: r.image,
  description: r.description,
  unit: r.unit,
  stock: r.stock,
});

const toRow = (p: Product) => ({
  id: p.id,
  name: p.name,
  name_urdu: p.nameUrdu ?? null,
  price: p.price,
  category: p.category,
  image: p.image,
  description: p.description,
  unit: p.unit,
  stock: p.stock,
});

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, name_urdu, price, category, image, description, unit, stock")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(fromRow);
}

export async function createProduct(p: Product): Promise<boolean> {
  const { error } = await supabase.from("products").insert(toRow(p));
  return !error;
}

export async function updateProductRow(id: string, patch: Partial<Product>): Promise<boolean> {
  const next: Record<string, unknown> = {};
  if (patch.name !== undefined) next.name = patch.name;
  if (patch.nameUrdu !== undefined) next.name_urdu = patch.nameUrdu ?? null;
  if (patch.price !== undefined) next.price = patch.price;
  if (patch.category !== undefined) next.category = patch.category;
  if (patch.image !== undefined) next.image = patch.image;
  if (patch.description !== undefined) next.description = patch.description;
  if (patch.unit !== undefined) next.unit = patch.unit;
  if (patch.stock !== undefined) next.stock = patch.stock;
  const { error } = await supabase.from("products").update(next).eq("id", id);
  return !error;
}

export async function deleteProductRow(id: string): Promise<boolean> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  return !error;
}
