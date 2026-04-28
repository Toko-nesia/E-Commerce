/**
 * Mapping of old local image paths to Supabase Storage public URLs.
 * Used during migration to update hardcoded image references in components.
 *
 * Product images: product-images bucket
 * Brand/general images: brand-images bucket
 *
 * URL format: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Product images (product-images bucket)
export const PRODUCT_IMAGE_PATHS: Record<string, string> = {
  "/images/Shop/c08f2321d986609404c2bdb84a34d05860464a4c.png": `${SUPABASE_URL}/storage/v1/object/public/product-images/shop/c08f2321d986609404c2bdb84a34d05860464a4c.png`,
  "/images/Shop/b6a7e5cd3e1ecbab09011f9b86a0f35e1343f16c.png": `${SUPABASE_URL}/storage/v1/object/public/product-images/shop/b6a7e5cd3e1ecbab09011f9b86a0f35e1343f16c.png`,
  "/images/Shop/c61786a514cc0bb3370a78c942d19d2074308457.png": `${SUPABASE_URL}/storage/v1/object/public/product-images/shop/c61786a514cc0bb3370a78c942d19d2074308457.png`,
  "/images/Shop/d9118e975ef4e144a8e808ccd3a55684c0248095.png": `${SUPABASE_URL}/storage/v1/object/public/product-images/shop/d9118e975ef4e144a8e808ccd3a55684c0248095.png`,
};

// Brand images (brand-images bucket, AboutTermsConditions subfolder)
export const BRAND_IMAGE_PATHS: Record<string, string> = {
  "/images/AboutTermsConditions/2cf0ec628e6de9ae4c083a513dadb4e05b432496.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/AboutTermsConditions/2cf0ec628e6de9ae4c083a513dadb4e05b432496.png`,
  "/images/AboutTermsConditions/96b1b0bf8f394affd2422778a1b39a7160fd8e20.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/AboutTermsConditions/96b1b0bf8f394affd2422778a1b39a7160fd8e20.png`,
  "/images/AboutTermsConditions/0ebb731ac0cc6130f95d969c3462755df0f575c4.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/AboutTermsConditions/0ebb731ac0cc6130f95d969c3462755df0f575c4.png`,
  "/images/AboutTermsConditions/9c2cbcb162ec328557257d0c9252f91311bf0dd2.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/AboutTermsConditions/9c2cbcb162ec328557257d0c9252f91311bf0dd2.png`,
  "/images/AboutTermsConditions/20e3dc0c2ba546b3900c0769482bcf364276dde1.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/AboutTermsConditions/20e3dc0c2ba546b3900c0769482bcf364276dde1.png`,
  "/images/AboutTermsConditions/96809bd8d5a7fa1f5a01c4a20039fe9445e37373.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/AboutTermsConditions/96809bd8d5a7fa1f5a01c4a20039fe9445e37373.png`,
  "/images/AboutTermsConditions/01a99087ec101d10593a676d342682bba131c6ee.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/AboutTermsConditions/01a99087ec101d10593a676d342682bba131c6ee.png`,
  "/images/AboutTermsConditions/c0fd69c570c85dce51ea76e90ea7746f9ef12432.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/AboutTermsConditions/c0fd69c570c85dce51ea76e90ea7746f9ef12432.png`,
  "/images/AboutTermsConditions/a825c5a8cda7c3112115b33b7b4f84b9ec65f494.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/AboutTermsConditions/a825c5a8cda7c3112115b33b7b4f84b9ec65f494.png`,
  "/images/AboutTermsConditions/5e342d0667a9577578f0e6b7fd827dad0dec2006.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/AboutTermsConditions/5e342d0667a9577578f0e6b7fd827dad0dec2006.png`,
  "/images/AboutTermsConditions/f4843ce4c490da459963aa8592808b498345d492.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/AboutTermsConditions/f4843ce4c490da459963aa8592808b498345d492.png`,
};

// Home page images (brand-images bucket, HomeBeforeLogin subfolder)
export const HOME_IMAGE_PATHS: Record<string, string> = {
  "/images/HomeBeforeLogin/0ebb731ac0cc6130f95d969c3462755df0f575c4.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/HomeBeforeLogin/0ebb731ac0cc6130f95d969c3462755df0f575c4.png`,
  "/images/HomeBeforeLogin/20e3dc0c2ba546b3900c0769482bcf364276dde1.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/HomeBeforeLogin/20e3dc0c2ba546b3900c0769482bcf364276dde1.png`,
  "/images/HomeBeforeLogin/2cf0ec628e6de9ae4c083a513dadb4e05b432496.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/HomeBeforeLogin/2cf0ec628e6de9ae4c083a513dadb4e05b432496.png`,
  "/images/HomeBeforeLogin/345cde66ad556f77fc4a2de614911a54ac7e8282.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/HomeBeforeLogin/345cde66ad556f77fc4a2de614911a54ac7e8282.png`,
  "/images/HomeBeforeLogin/5771203864e095cbe2563743bf886fd6c03ee3a8.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/HomeBeforeLogin/5771203864e095cbe2563743bf886fd6c03ee3a8.png`,
  "/images/HomeBeforeLogin/5bc42449b61397e41571ffa7cc94f48332069351.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/HomeBeforeLogin/5bc42449b61397e41571ffa7cc94f48332069351.png`,
  "/images/HomeBeforeLogin/9c2cbcb162ec328557257d0c9252f91311bf0dd2.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/HomeBeforeLogin/9c2cbcb162ec328557257d0c9252f91311bf0dd2.png`,
  "/images/HomeBeforeLogin/bfdc8bafe96751bd661dd529a936b4f52f114530.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/HomeBeforeLogin/bfdc8bafe96751bd661dd529a936b4f52f114530.png`,
  "/images/HomeBeforeLogin/d9118e975ef4e144a8e808ccd3a55684c0248095.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/HomeBeforeLogin/d9118e975ef4e144a8e808ccd3a55684c0248095.png`,
  "/images/HomeBeforeLogin/f72f513939c94efe91d378657305af192ebecd74.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/HomeBeforeLogin/f72f513939c94efe91d378657305af192ebecd74.png`,
  "/images/HomeBeforeLogin/hands.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/HomeBeforeLogin/hands.png`,
  "/images/HomeBeforeLogin/payment.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/HomeBeforeLogin/payment.png`,
  "/images/HomeBeforeLogin/carts.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/HomeBeforeLogin/carts.png`,
  "/images/HomeBeforeLogin/ddf830bb09d6517538362b5457cbc8292017ec7e.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/HomeBeforeLogin/ddf830bb09d6517538362b5457cbc8292017ec7e.png`,
};

// General/misc images (brand-images bucket)
export const MISC_IMAGE_PATHS: Record<string, string> = {
  "/images/Login/fbb1676fb1e714ce082c8512433c9a5517bce894.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/Login/fbb1676fb1e714ce082c8512433c9a5517bce894.png`,
  "/images/Register/fbb1676fb1e714ce082c8512433c9a5517bce894.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/Register/fbb1676fb1e714ce082c8512433c9a5517bce894.png`,
  "/images/CompleteTheData/fbb1676fb1e714ce082c8512433c9a5517bce894.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/CompleteTheData/fbb1676fb1e714ce082c8512433c9a5517bce894.png`,
  "/images/ProfilePage/d4699efb0b0581a2c8ec625c4639f0d9a00865fa.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/ProfilePage/d4699efb0b0581a2c8ec625c4639f0d9a00865fa.png`,
  "/images/ProfilePage/d9118e975ef4e144a8e808ccd3a55684c0248095.png": `${SUPABASE_URL}/storage/v1/object/public/brand-images/ProfilePage/d9118e975ef4e144a8e808ccd3a55684c0248095.png`,
};

/**
 * Complete mapping of all old paths to new Supabase Storage URLs.
 * Use this to find the new URL for any old local image path.
 */
export const ALL_IMAGE_PATHS: Record<string, string> = {
  ...PRODUCT_IMAGE_PATHS,
  ...BRAND_IMAGE_PATHS,
  ...HOME_IMAGE_PATHS,
  ...MISC_IMAGE_PATHS,
};

/**
 * Resolve an image path - if it's an old local path, return the Supabase Storage URL.
 * If it's already a full URL or not in the mapping, return as-is.
 */
export function resolveImagePath(path: string): string {
  if (path.startsWith("http")) return path;
  return ALL_IMAGE_PATHS[path] ?? path;
}
