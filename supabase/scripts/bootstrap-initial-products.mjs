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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  let lastError = null;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, bytes, {
      cacheControl: "31536000",
      contentType,
      upsert: true,
    });
    if (!error) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
      return data.publicUrl;
    }
    lastError = error;
    if (!/timeout|gateway|network|fetch/i.test(error.message) || attempt === 4) break;
    await sleep(500 * attempt);
  }
  throw new Error(`Failed to upload ${objectPath}: ${lastError?.message ?? "unknown error"}`);
}

async function removeStaleInitialImages(supabase, expectedObjectPaths) {
  const prefix = "initial";
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw new Error(`Failed to list ${BUCKET}/${prefix}: ${error.message}`);

  const stalePaths = (data ?? [])
    .filter((item) => item.name && !expectedObjectPaths.has(`${prefix}/${item.name}`))
    .map((item) => `${prefix}/${item.name}`);

  if (stalePaths.length === 0) return;

  const { error: removeError } = await supabase.storage.from(BUCKET).remove(stalePaths);
  if (removeError) throw new Error(`Failed to remove stale initial product images: ${removeError.message}`);
  console.log(`Removed ${stalePaths.length} stale initial product image(s).`);
}

async function removeStaleInitialProducts(supabase, expectedBootstrapKeys) {
  const { data, error } = await supabase
    .from("products")
    .select("id, bootstrap_key")
    .like("bootstrap_key", "initial:%")
    .limit(5000);
  if (error) throw new Error(`Failed to list initial products: ${error.message}`);

  const staleIds = (data ?? [])
    .filter((product) => product.bootstrap_key && !expectedBootstrapKeys.has(product.bootstrap_key))
    .map((product) => product.id);
  if (staleIds.length === 0) return;

  const { error: deleteError } = await supabase.from("products").delete().in("id", staleIds);
  if (deleteError) throw new Error(`Failed to remove stale initial products: ${deleteError.message}`);
  console.log(`Removed ${staleIds.length} stale initial product(s).`);
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
const expectedImagePaths = new Set(products.map((product) => product.image_object_path).filter(Boolean));
const expectedBootstrapKeys = new Set(products.map((product) => product.bootstrap_key).filter(Boolean));

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
    purchase_instructions: product.purchase_instructions ?? null,
    specifications: product.specifications,
    stock: product.stock,
    weight_kg: product.weight_kg,
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
        metadata: variant.metadata ?? {},
        sort_order: variant.sort_order ?? index,
        updated_at: new Date().toISOString(),
      }, { onConflict: "product_id,name" });
    if (variantError) throw new Error(`Failed to upsert variant for ${product.bootstrap_key}: ${variantError.message}`);
  }

  console.log(`bootstrapped ${product.bootstrap_key}`);
}

await removeStaleInitialProducts(supabase, expectedBootstrapKeys);
await removeStaleInitialImages(supabase, expectedImagePaths);
console.log(`Bootstrapped ${products.length} initial products.`);
