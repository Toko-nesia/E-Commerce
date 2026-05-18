import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, loadEnv, requireEnv } from "./shared-env.mjs";

function getPasswordIssues(password, context = {}) {
  const issues = [];
  const lowerPassword = password.toLowerCase();
  const emailLocal = context.email?.split("@")[0]?.toLowerCase().trim();
  const nameParts = context.name?.toLowerCase().split(/\s+/).filter((part) => part.length >= 3) ?? [];

  if (password.length < 12) issues.push("Use at least 12 characters.");
  if (!/[a-z]/.test(password)) issues.push("Add a lowercase letter.");
  if (!/[A-Z]/.test(password)) issues.push("Add an uppercase letter.");
  if (!/\d/.test(password)) issues.push("Add a number.");
  if (!/[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/.test(password)) issues.push("Add a symbol.");
  if (emailLocal && emailLocal.length >= 3 && lowerPassword.includes(emailLocal)) {
    issues.push("Do not include your email.");
  }
  if (nameParts.some((part) => lowerPassword.includes(part))) {
    issues.push("Do not include your name.");
  }

  return issues;
}

async function findUserByEmail(supabase, email) {
  const normalizedEmail = email.toLowerCase();
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Failed to list auth users: ${error.message}`);

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail);
    if (user) return user;
    if (data.users.length < 1000) return null;
  }

  throw new Error("Too many auth users to scan while bootstrapping admin.");
}

loadEnv();

const adminEmail = requireEnv("ADMIN_EMAIL").trim().toLowerCase();
const adminPassword = requireEnv("ADMIN_PASSWORD");
const adminName = process.env.ADMIN_NAME?.trim() || "Tokonesia Admin";

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
  throw new Error("ADMIN_EMAIL must be a valid email address.");
}

const passwordIssues = getPasswordIssues(adminPassword, { email: adminEmail, name: adminName });
if (passwordIssues.length > 0) {
  throw new Error(`ADMIN_PASSWORD is not strong enough: ${passwordIssues.join(" ")}`);
}

const supabase = createClient(getSupabaseUrl(), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

const existingUser = await findUserByEmail(supabase, adminEmail);
const appMetadata = {
  ...(existingUser?.app_metadata ?? {}),
  role: "admin",
};
const userMetadata = {
  ...(existingUser?.user_metadata ?? {}),
  full_name: existingUser?.user_metadata?.full_name || adminName,
};

const { data: userResponse, error: userError } = existingUser
  ? await supabase.auth.admin.updateUserById(existingUser.id, {
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      app_metadata: appMetadata,
      user_metadata: userMetadata,
    })
  : await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      app_metadata: appMetadata,
      user_metadata: userMetadata,
    });

if (userError) {
  throw new Error(`Failed to bootstrap admin auth user: ${userError.message}`);
}

const user = userResponse.user;
if (!user) {
  throw new Error("Supabase did not return an admin auth user.");
}

const { error: profileError } = await supabase.from("profiles").upsert(
  {
    id: user.id,
    email: adminEmail,
    full_name: userMetadata.full_name,
    role: "admin",
    updated_at: new Date().toISOString(),
  },
  { onConflict: "id" },
);

if (profileError) {
  throw new Error(`Failed to bootstrap admin profile: ${profileError.message}`);
}

console.log(`Bootstrapped confirmed admin user: ${adminEmail}`);
