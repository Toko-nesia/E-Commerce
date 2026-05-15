"use client";

import { use } from "react";
import { CatalogView } from "../../catalog-view";

export default function ShopCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  return <CatalogView categorySlug={category} />;
}
