/**
 * Precios Endur: misma normalización para persistencia, comparación y CSV.
 * Máximo 6 decimales; mitiga fronteras típicas de IEEE-754 con Number.EPSILON.
 */

export const ENDUR_PRICE_MAX_DECIMALS = 6;

/**
 * Redondea a como máximo `maxDecimals` (por defecto 6). Entradas equivalentes
 * en negocio suelen colapsar al mismo número si pasan siempre por esta función.
 */
export function normalizeDecimal(
  value: number | string | null | undefined,
  maxDecimals: number = ENDUR_PRICE_MAX_DECIMALS,
): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;

  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;

  const d = Math.min(15, Math.max(0, Math.floor(maxDecimals)));
  const factor = 10 ** d;
  return Math.round((n + Number.EPSILON) * factor) / factor;
}

/** Comparación estable sobre valores ya normalizados (misma semántica que guardar dos veces). */
export function sameDecimal(
  a: number | string | null | undefined,
  b: number | string | null | undefined,
  maxDecimals?: number,
): boolean {
  return normalizeDecimal(a, maxDecimals) === normalizeDecimal(b, maxDecimals);
}

