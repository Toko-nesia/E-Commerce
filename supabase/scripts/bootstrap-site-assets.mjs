import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, loadEnv, repoRoot, requireEnv } from "./shared-env.mjs";

const BUCKET = "site-assets";
const ASSET_ROOT = path.join(repoRoot, "supabase", "storage", BUCKET);

const MIME_TYPES = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
]);

async function walkFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

loadEnv();

const supabase = createClient(getSupabaseUrl(), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

const { data: buckets, error: listError } = await supabase.storage.listBuckets();
if (listError) throw new Error(listError.message);

if (!buckets?.some((bucket) => bucket.id === BUCKET)) {
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  });
  if (error) throw new Error(error.message);
}

const files = await walkFiles(ASSET_ROOT);
if (files.length === 0) {
  throw new Error(`No bootstrap assets found in ${ASSET_ROOT}`);
}

for (const file of files) {
  const objectPath = path.relative(ASSET_ROOT, file).replaceAll(path.sep, "/");
  const bytes = await fs.readFile(file);
  const contentType = MIME_TYPES.get(path.extname(file).toLowerCase()) || "application/octet-stream";
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, bytes, {
    cacheControl: "31536000",
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`Failed to upload ${objectPath}: ${error.message}`);
  console.log(`uploaded ${BUCKET}/${objectPath}`);
}

console.log(`Uploaded ${files.length} bootstrap site assets.`);
