import { useEffect, useState } from "react";
import { listCategories, CategoryRow } from "@/lib/categoriesApi";
import { categories as fallbackCategories } from "@/data/products";

const STATIC_FALLBACK: CategoryRow[] = fallbackCategories.map((c, i) => ({
  id: c.id,
  slug: c.id,
  label: c.label,
  description: c.description,
  image: c.image,
  sortOrder: (i + 1) * 10,
}));

let cache: CategoryRow[] = STATIC_FALLBACK;

// Subscribers get notified after every successful fetch so an admin save
// instantly updates every mounted page.
const subscribers = new Set<(c: CategoryRow[]) => void>();

export async function refreshCategoriesCache(): Promise<CategoryRow[]> {
  const next = await listCategories();
  if (next.length > 0) {
    cache = next;
    subscribers.forEach(fn => fn(cache));
  }
  return cache;
}

export function useCategories(): { categories: CategoryRow[]; refresh: () => Promise<CategoryRow[]> } {
  const [list, setList] = useState<CategoryRow[]>(cache);

  useEffect(() => {
    subscribers.add(setList);
    refreshCategoriesCache().then(setList);
    return () => { subscribers.delete(setList); };
  }, []);

  return { categories: list, refresh: refreshCategoriesCache };
}
