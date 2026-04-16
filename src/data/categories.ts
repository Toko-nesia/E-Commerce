import type { Category } from "@/types/database";

export const categories: Category[] = [
  { name: "Electronic", count: 5, slug: "electronic" },
  { name: "Herbs and Spices", count: 4, slug: "herbs-and-spices" },
  { name: "Fashion", count: 6, slug: "fashion" },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
