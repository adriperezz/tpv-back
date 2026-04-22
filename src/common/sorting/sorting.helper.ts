// ============================================================
// pagination.utils.ts
// Utilidades complementarias al paginador genérico
// ============================================================

import { ColumnMetaMap, MultiSortOrder } from '../pagination/pagination.helper';

/**
 * Parsea el parámetro `sort` que viene del frontend en cualquier formato:
 *
 * - Array directo:
 *   [{ column: 'id', order: 'asc' }]
 *
 * - String JSON:
 *   "[{\"column\":\"id\",\"order\":\"asc\"}]"
 *
 * - Formato compacto:
 *   "id:asc,fechaInicio:desc"
 *
 * - Objeto JSON:
 *   "{\"column\":\"id\",\"order\":\"asc\"}"
 *
 * Valida columnas contra el ColumnMetaMap.
 */
export function parseAndNormalizeSort(
  raw: any,
  columnMeta: ColumnMetaMap,
): MultiSortOrder[] {
  if (!raw) return [];

  let parsed: any = [];

  // Caso 1: array ya válido
  if (Array.isArray(raw)) {
    parsed = raw;
  }

  // Caso 2: string JSON
  else if (typeof raw === 'string') {
    const s = raw.trim();

    // "[{...}]" → JSON array
    if (s.startsWith('[')) {
      try {
        parsed = JSON.parse(s);
      } catch {
        parsed = [];
      }
    }

    // "{...}" → objeto JSON
    else if (s.startsWith('{')) {
      try {
        const obj = JSON.parse(s);
        if (obj && obj.column && obj.order) {
          parsed = [obj];
        }
      } catch {
        parsed = [];
      }
    }

    // formato compacto "col:asc,col2:desc"
    else if (s.includes(':')) {
      parsed = s.split(',').map((e) => {
        const [col, ord] = e.split(':').map((x) => x.trim());
        return { column: col, order: ord };
      });
    }
  }

  if (!Array.isArray(parsed)) return [];

  // Validación contra ColumnMeta
  const valid: MultiSortOrder[] = [];

  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue;

    const col = String(item.column).trim();
    let ord = String(item.order ?? 'asc').toLowerCase();

    if (!['asc', 'desc'].includes(ord)) {
      ord = 'asc';
    }

    // Asegurarse de que la columna existe en meta
    if (!columnMeta[col]) continue;

    valid.push({ column: col, order: ord as any });
  }

  return valid;
}

/**
 * Asegura que la PK esté al final del multi-sort.
 * Evita inestabilidad en keyset pagination.
 * @param sort datos de ordenamiento del cliente
 * @param keys columnas de la tabla
 * @returns datos de ordenamiento con la PK al final
 * @example
 * const sort = [{ column: 'id', order: 'asc' }];
 * const keys = ['id', 'name'];
 * const result = ensurePrimaryKeySort(sort, keys);
 * // result = [{ column: 'id', order: 'asc' }, { column: 'name', order: 'asc' }]
 */

export function ensurePrimaryKeySort(sort: MultiSortOrder[], keys: string[]) {
  const s = [...(sort ?? [])];
  for (const key of keys) {
    if (!s.some((x) => x.column === key)) {
      s.push({ column: key, order: 'asc' });
    }
  }
  return s;
}

