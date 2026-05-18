import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  customBoxProduct,
  normalizeIndogrosirPayload,
  normalizeZaloraPayload,
  slugify,
} from "./initial-products-normalize.mjs";
import { repoRoot } from "./shared-env.mjs";

const BOOTSTRAP_ROOT = path.join(repoRoot, "supabase", "bootstrap", "initial-products");
const IMAGE_ROOT = path.join(repoRoot, "supabase", "storage", "product-images", "initial");
const MANIFEST_PATH = path.join(BOOTSTRAP_ROOT, "manifest.json");
const TEMP_BOX_PATH = path.join(repoRoot, "temp", "box.jpg");
const BOOTSTRAP_BOX_PATH = path.join(IMAGE_ROOT, "custom-box-jastip-21kg.jpg");

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const execFileAsync = promisify(execFile);

const SOURCE_QUERIES = [
  { provider: "indogrosir", query: "mie instant" },
  { provider: "indogrosir", query: "cemilan" },
  { provider: "indogrosir", query: "kopi" },
  { provider: "indogrosir", query: "teh" },
  { provider: "indogrosir", query: "bumbu masak" },
  { provider: "indogrosir", query: "sambal" },
  { provider: "zalora", query: "sepatu" },
  { provider: "zalora", query: "pakaian" },
  { provider: "zalora", query: "tas" },
  { provider: "zalora", query: "batik" },
];

function indogrosirUrl(query) {
  return `https://klikindogrosir.com/filterKey?key=${encodeURIComponent(query)}`;
}

function zaloraUrl(query) {
  const params = new URLSearchParams({
    abtest: "djAbTest_True|uuid:48a7b7e4-c9bf-4d01-b9d8-39b98949a910|enable_helios_classifier:true",
    anonymous_id: "88a2d492-acbf-46e0-94d5-abed07aef55d",
    enableRelevanceClassifier: "true",
    fullFacetCategory: "true",
    image_format: "webp",
    image_quality: "70",
    image_resize: "304.8x440",
    limit: "36",
    offset: "0",
    query,
    shop: "m",
  });
  return `https://api.zalora.co.id/v1/dynproducts/datajet/list?${params.toString()}`;
}

async function fetchTextWithCurl(url, headers) {
  const curlBin = process.platform === "win32" ? "curl.exe" : "curl";
  const args = ["-sS", "-L", "--compressed", url];
  for (const [key, value] of Object.entries(headers)) {
    args.push("-H", `${key}: ${value}`);
  }
  const { stdout } = await execFileAsync(curlBin, args, { maxBuffer: 50 * 1024 * 1024 });
  return stdout;
}

async function fetchJson(provider, query) {
  const url = provider === "indogrosir" ? indogrosirUrl(query) : zaloraUrl(query);
  const headers = {
    Accept: "application/json",
    "User-Agent": USER_AGENT,
    Referer: provider === "indogrosir" ? "https://klikindogrosir.com/" : "https://www.zalora.co.id/",
    Origin: provider === "indogrosir" ? "https://klikindogrosir.com" : "https://www.zalora.co.id",
  };
  const response = await fetch(url, { headers });
  let text = "";
  if (response.ok) {
    text = await response.text();
  }
  if (!response.ok || text.trim().startsWith("<")) {
    text = await fetchTextWithCurl(url, headers);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${provider} ${query} did not return JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function imageExtension(contentType, url) {
  if (contentType?.includes("webp")) return ".webp";
  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return ".jpg";
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
}

async function downloadImage(product) {
  if (!product.image_source_url) return product;
  const response = await fetch(product.image_source_url, {
    headers: { "User-Agent": USER_AGENT, Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8" },
  });
  if (!response.ok) {
    throw new Error(`Image failed for ${product.bootstrap_key}: ${response.status}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  const objectPath = `initial/${slugify(product.bootstrap_key)}${imageExtension(response.headers.get("content-type"), product.image_source_url)}`;
  await fs.writeFile(path.join(repoRoot, "supabase", "storage", "product-images", objectPath), bytes);
  return { ...product, image_object_path: objectPath };
}

async function main() {
  await fs.mkdir(IMAGE_ROOT, { recursive: true });

  const products = [customBoxProduct()];
  try {
    await fs.copyFile(TEMP_BOX_PATH, BOOTSTRAP_BOX_PATH);
  } catch (error) {
    try {
      await fs.access(BOOTSTRAP_BOX_PATH);
    } catch {
      throw new Error(`Custom Box image is missing. Expected ${TEMP_BOX_PATH} or ${BOOTSTRAP_BOX_PATH}.`);
    }
  }

  for (const source of SOURCE_QUERIES) {
    console.log(`fetching ${source.provider}:${source.query}`);
    const payload = await fetchJson(source.provider, source.query);
    const normalized = source.provider === "indogrosir"
      ? normalizeIndogrosirPayload(payload, { query: source.query })
      : normalizeZaloraPayload(payload, { query: source.query });
    products.push(...normalized);
  }

  const deduped = [...new Map(products.map((product) => [product.bootstrap_key, product])).values()];
  const withImages = [];
  for (const product of deduped) {
    withImages.push(await downloadImage(product));
    console.log(`prepared ${product.bootstrap_key}`);
  }

  const manifest = {
    version: 1,
    generated_at: new Date().toISOString(),
    products: withImages,
  };
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`wrote ${MANIFEST_PATH}`);
  console.log(`prepared ${withImages.length} products`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
