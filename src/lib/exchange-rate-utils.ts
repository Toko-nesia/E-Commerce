// Exchange rate utility — used by API route

export function shouldRefreshRate(updatedAt: Date, now: Date, maxAgeHours = 24): boolean {
  const ageMs = now.getTime() - updatedAt.getTime();
  return ageMs > maxAgeHours * 60 * 60 * 1000;
}
