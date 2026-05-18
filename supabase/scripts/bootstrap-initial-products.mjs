import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, loadEnv, repoRoot, requireEnv } from "./shared-env.mjs";
import { slugify } from "./initial-products-normalize.mjs";

const BUCKET = "product-images";
const MANIFEST_PATH = path.join(repoRoot, "supabase", "bootstrap", "initial-products", "manifest.json");
const IMAGE_ROOT = path.join(repoRoot, "supabase", "storage", BUCKET);

const MIME_TYPES = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
]);

function categorySlug(name) {
  return slugify(name);
}

async function ensureBucket(supabase) {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(error.message);
  if (buckets?.some((bucket) => bucket.id === BUCKET)) return;
  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  });
  if (createError) throw new Error(createError.message);
}

async function uploadImage(supabase, objectPath) {
  const localPath = path.join(IMAGE_ROOT, objectPath);
  const bytes = await fs.readFile(localPath);
  const contentType = MIME_TYPES.get(path.extname(objectPath).toLowerCase()) || "application/octet-stream";
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, bytes, {
    cacheControl: "31536000",
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`Failed to upload ${objectPath}: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

loadEnv();

const supabase = createClient(getSupabaseUrl(), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8"));
const products = Array.isArray(manifest.products) ? manifest.products : [];
if (products.length === 0) {
  throw new Error(`No products found in ${MANIFEST_PATH}`);
}

await ensureBucket(supabase);

const categoryCounts = new Map();
for (const product of products) {
  categoryCounts.set(product.category, (categoryCounts.get(product.category) ?? 0) + 1);
}

for (const [name, count] of categoryCounts) {
  const { error } = await supabase
    .from("categories")
    .upsert({ name, slug: categorySlug(name), count }, { onConflict: "slug" });
  if (error) throw new Error(`Failed to upsert category ${name}: ${error.message}`);
}

for (const product of products) {
  const imageUrl = await uploadImage(supabase, product.image_object_path);
  const payload = {
    name: product.name,
    category: product.category,
    price: product.price,
    price_raw: product.price_raw,
    badge: "",
    badge_color: "",
    badge_width: "",
    image: imageUrl,
    img_style: "",
    description: product.description,
    purchase_description: product.purchase_description,
    specifications: product.specifications,
    stock: product.stock,
    weight_kg: product.weight_kg,
    source_provider: product.source_provider,
    source_product_id: product.source_product_id,
    source_url: product.source_url,
    source_query: product.source_query,
    source_metadata: product.source_metadata ?? {},
    bootstrap_key: product.bootstrap_key,
    pricing_type: product.pricing_type,
    min_price_raw: product.min_price_raw,
    max_price_raw: product.max_price_raw,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("products")
    .upsert(payload, { onConflict: "bootstrap_key" })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to upsert product ${product.bootstrap_key}: ${error.message}`);

  for (const [index, variant] of (product.variants ?? []).entries()) {
    const { error: variantError } = await supabase
      .from("product_variants")
      .upsert({
        product_id: data.id,
        name: variant.name,
        sku: variant.sku ?? null,
        price: variant.price,
        price_raw: variant.price_raw,
        stock: variant.stock,
        weight_kg: variant.weight_kg ?? null,
        source_variant_id: variant.source_variant_id ?? null,
        metadata: variant.metadata ?? {},
        sort_order: variant.sort_order ?? index,
        updated_at: new Date().toISOString(),
      }, { onConflict: "product_id,name" });
    if (variantError) throw new Error(`Failed to upsert variant for ${product.bootstrap_key}: ${variantError.message}`);
  }

  console.log(`bootstrapped ${product.bootstrap_key}`);
}

console.log(`Bootstrapped ${products.length} initial products.`);
