const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

function publicStorageUrl(bucket: string, objectPath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${objectPath}`;
}

function productImageUrl(objectPath: string): string {
  return publicStorageUrl("product-images", objectPath);
}

function siteAssetUrl(objectPath: string): string {
  return publicStorageUrl("site-assets", objectPath);
}

export const PRODUCT_IMAGE_PATHS: Record<string, string> = {
  "/images/Shop/c08f2321d986609404c2bdb84a34d05860464a4c.png": productImageUrl(
    "shop/c08f2321d986609404c2bdb84a34d05860464a4c.png",
  ),
  "/images/Shop/b6a7e5cd3e1ecbab09011f9b86a0f35e1343f16c.png": productImageUrl(
    "shop/b6a7e5cd3e1ecbab09011f9b86a0f35e1343f16c.png",
  ),
  "/images/Shop/c61786a514cc0bb3370a78c942d19d2074308457.png": productImageUrl(
    "shop/c61786a514cc0bb3370a78c942d19d2074308457.png",
  ),
  "/images/Shop/d9118e975ef4e144a8e808ccd3a55684c0248095.png": productImageUrl(
    "shop/d9118e975ef4e144a8e808ccd3a55684c0248095.png",
  ),
};

export const BRAND_IMAGE_PATHS: Record<string, string> = {
  "/images/AboutTermsConditions/2cf0ec628e6de9ae4c083a513dadb4e05b432496.png": siteAssetUrl(
    "brands/indofood.png",
  ),
  "/images/AboutTermsConditions/96b1b0bf8f394affd2422778a1b39a7160fd8e20.png": siteAssetUrl(
    "brands/polytron.png",
  ),
  "/images/AboutTermsConditions/0ebb731ac0cc6130f95d969c3462755df0f575c4.png": siteAssetUrl(
    "brands/tolak-angin.png",
  ),
  "/images/AboutTermsConditions/9c2cbcb162ec328557257d0c9252f91311bf0dd2.png": siteAssetUrl(
    "brands/brand-9c2cbcb.png",
  ),
  "/images/AboutTermsConditions/20e3dc0c2ba546b3900c0769482bcf364276dde1.png": siteAssetUrl(
    "brands/aerostreet.png",
  ),
  "/images/AboutTermsConditions/96809bd8d5a7fa1f5a01c4a20039fe9445e37373.png": siteAssetUrl(
    "brands/brand-96809bd.png",
  ),
  "/images/AboutTermsConditions/01a99087ec101d10593a676d342682bba131c6ee.png": siteAssetUrl(
    "brands/mie-sedaap.png",
  ),
  "/images/AboutTermsConditions/c0fd69c570c85dce51ea76e90ea7746f9ef12432.png": siteAssetUrl(
    "brands/kopiko.png",
  ),
  "/images/AboutTermsConditions/a825c5a8cda7c3112115b33b7b4f84b9ec65f494.png": siteAssetUrl(
    "brands/sari-roti.png",
  ),
  "/images/AboutTermsConditions/5e342d0667a9577578f0e6b7fd827dad0dec2006.png": siteAssetUrl(
    "about/hero.png",
  ),
  "/images/AboutTermsConditions/f4843ce4c490da459963aa8592808b498345d492.png": siteAssetUrl(
    "about/made-in-indonesia.png",
  ),
};

export const HOME_IMAGE_PATHS: Record<string, string> = {
  "/images/HomeBeforeLogin/0ebb731ac0cc6130f95d969c3462755df0f575c4.png": siteAssetUrl(
    "brands/tolak-angin.png",
  ),
  "/images/HomeBeforeLogin/20e3dc0c2ba546b3900c0769482bcf364276dde1.png": siteAssetUrl(
    "brands/aerostreet.png",
  ),
  "/images/HomeBeforeLogin/2cf0ec628e6de9ae4c083a513dadb4e05b432496.png": siteAssetUrl(
    "brands/indofood.png",
  ),
  "/images/HomeBeforeLogin/345cde66ad556f77fc4a2de614911a54ac7e8282.png": siteAssetUrl(
    "home/unused/345cde66ad556f77fc4a2de614911a54ac7e8282.png",
  ),
  "/images/HomeBeforeLogin/5771203864e095cbe2563743bf886fd6c03ee3a8.png": siteAssetUrl(
    "home/unused/5771203864e095cbe2563743bf886fd6c03ee3a8.png",
  ),
  "/images/HomeBeforeLogin/5bc42449b61397e41571ffa7cc94f48332069351.png": siteAssetUrl(
    "home/showcase.png",
  ),
  "/images/HomeBeforeLogin/9c2cbcb162ec328557257d0c9252f91311bf0dd2.png": siteAssetUrl(
    "brands/brand-9c2cbcb.png",
  ),
  "/images/HomeBeforeLogin/bfdc8bafe96751bd661dd529a936b4f52f114530.png": siteAssetUrl(
    "home/unused/bfdc8bafe96751bd661dd529a936b4f52f114530.png",
  ),
  "/images/HomeBeforeLogin/d9118e975ef4e144a8e808ccd3a55684c0248095.png": siteAssetUrl(
    "home/footer-texture.png",
  ),
  "/images/HomeBeforeLogin/f72f513939c94efe91d378657305af192ebecd74.png": siteAssetUrl(
    "home/unused/f72f513939c94efe91d378657305af192ebecd74.png",
  ),
  "/images/HomeBeforeLogin/hands.png": siteAssetUrl("home/icons/delivery.png"),
  "/images/HomeBeforeLogin/payment.png": siteAssetUrl("home/icons/payment.png"),
  "/images/HomeBeforeLogin/carts.png": siteAssetUrl("home/icons/tracking.png"),
  "/images/HomeBeforeLogin/ddf830bb09d6517538362b5457cbc8292017ec7e.png": siteAssetUrl(
    "home/hero.png",
  ),
};

export const MISC_IMAGE_PATHS: Record<string, string> = {
  "/images/Login/fbb1676fb1e714ce082c8512433c9a5517bce894.png": siteAssetUrl(
    "auth/background.png",
  ),
  "/images/Register/fbb1676fb1e714ce082c8512433c9a5517bce894.png": siteAssetUrl(
    "auth/background.png",
  ),
  "/images/CompleteTheData/fbb1676fb1e714ce082c8512433c9a5517bce894.png": siteAssetUrl(
    "auth/background.png",
  ),
  "/images/ProfilePage/d4699efb0b0581a2c8ec625c4639f0d9a00865fa.png": siteAssetUrl(
    "profile/avatar-placeholder.png",
  ),
  "/images/ProfilePage/d9118e975ef4e144a8e808ccd3a55684c0248095.png": siteAssetUrl(
    "profile/banner.png",
  ),
};

export const ALL_IMAGE_PATHS: Record<string, string> = {
  ...PRODUCT_IMAGE_PATHS,
  ...BRAND_IMAGE_PATHS,
  ...HOME_IMAGE_PATHS,
  ...MISC_IMAGE_PATHS,
};

export function resolveImagePath(path: string): string {
  if (path.startsWith("http")) return path;
  return ALL_IMAGE_PATHS[path] ?? path;
}
