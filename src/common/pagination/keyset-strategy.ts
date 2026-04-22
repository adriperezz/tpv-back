// ============================================================
// KEYSET PAGINATION
// ============================================================

import { PaginateOptions, PaginateResult, parseCursorGeneric, buildKeysetWhereGeneric, buildOrderByGeneric, buildCursorGeneric } from "./pagination.helper";

export async function keysetPaginateGeneric(
  options: PaginateOptions,
): Promise<PaginateResult> {
  const {
    model,
    where = {},
    sort,
    cursor,
    direction = 'next',
    pageSize,
    columnMeta,
    select,
    includeCount,
  } = options;

  const cursorValues = parseCursorGeneric(cursor, sort, columnMeta);

  const keysetWhere = cursorValues
  ? buildKeysetWhereGeneric(sort, cursorValues, direction, columnMeta)
  : {};

  const orderBy = buildOrderByGeneric(sort, 'next', columnMeta);

  const finalWhere = cursorValues
  ? { AND: [where, keysetWhere] }
  : where;

  const [rows, totalItems] = await Promise.all([
    model.findMany({
      where: finalWhere,
      orderBy,
      take: pageSize + 1,
      select,
      // ...( orderBy && orderBy.length > 0 ? { orderBy } : {} )
    }),

    includeCount ? model.count({ where }) : Promise.resolve(undefined),
  ]);

  const hasMore = rows.length > pageSize;
  const pageRows = hasMore ? rows.slice(0, pageSize) : rows;

  const firstCursor =
    pageRows.length > 0
      ? buildCursorGeneric(pageRows[0], sort, columnMeta)
      : null;

  const lastCursor =
    pageRows.length > 0
      ? buildCursorGeneric(pageRows[pageRows.length - 1], sort, columnMeta)
      : null;

  // const finalRows =
  // direction === 'prev' ? rows.reverse().slice(1, pageSize + 1) : rows.slice(0, pageSize);

  return {
    data: rows,
    pagination: {
      hasNext: direction === 'next' ? hasMore : Boolean(cursor),
      hasPrev: direction === 'prev' ? hasMore : Boolean(cursor),
      nextCursor: lastCursor,
      prevCursor: firstCursor,
      sort,
      direction,
      pageSize,
    },
    totalItems,
  };
}
