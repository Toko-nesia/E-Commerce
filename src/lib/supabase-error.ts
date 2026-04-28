export function getSupabaseErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';
  if (typeof error === 'object' && error !== null) {
    const e = error as { code?: string; message?: string };
    // FK constraint violation
    if (e.code === '23503') return 'Cannot delete: this item is referenced by other records';
    // Unique constraint violation
    if (e.code === '23505') return 'This record already exists';
    // RLS violation
    if (e.code === '42501') return 'Access denied';
    if (e.message) return e.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
