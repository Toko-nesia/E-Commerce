import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, "..", "..");

export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(repoRoot, file);
    if (!fs.existsSync(envPath)) continue;

    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;

      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.trim().replace(/^["']|["']$/g, "");
    }
  }
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

export function getSupabaseUrl() {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/+$/, "");
}
