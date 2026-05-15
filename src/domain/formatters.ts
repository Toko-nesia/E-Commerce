export function formatIdr(amount: number): string {
  return `Rp${Math.round(amount).toLocaleString("id-ID")}`;
}

export function formatJpyFromIdr(amountIdr: number, rate: number | null | undefined): string | null {
  if (!rate || !Number.isFinite(rate) || rate <= 0) {
    return null;
  }
  return `≈ ¥${Math.round(amountIdr * rate).toLocaleString("ja-JP")}`;
}

