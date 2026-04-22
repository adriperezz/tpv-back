// ================================================
// OFFSET PAGINATION GENERIC
// ================================================
import { buildOrderByGeneric, PaginateOptions, PaginateResult } from './pagination.helper';

export async function offsetPaginateGeneric(
  options: PaginateOptions,
): Promise<PaginateResult> {
  const {
    model,
    where = {},
    pageSize,
    offset = 0,
    select,
    sort,
    direction = 'next',
    columnMeta
  } = options;

  const orderBy = sort && sort.length > 0
    ? buildOrderByGeneric(sort, direction, columnMeta)
    : undefined;


  // 1) Pedimos 1 más, para saber si hay siguiente página
  const rows = await model.findMany({
    where,
    skip: offset,
    take: pageSize + 1,
    select,
    ...( orderBy && orderBy.length > 0 ? { orderBy } : {} )
  });

  const hasMore = rows.length > pageSize;

  // 2) Filas reales = primeras pageSize
  const data = hasMore ? rows.slice(0, pageSize) : rows;

  // 3) Calcular next / prev cursor (en offset son números)
  const nextCursor = hasMore ? String(offset + pageSize) : null;
  const prevCursor = offset > 0 ? String(Math.max(0, offset - pageSize)) : null;

  return {
    data,
    pagination: {
      hasNext: hasMore,
      hasPrev: offset > 0,
      nextCursor,
      prevCursor,
      pageSize,
      sort: options.sort,
      offset,
      direction: options.direction, // no afecta offset pero lo devolvemos
    }
  };
}
