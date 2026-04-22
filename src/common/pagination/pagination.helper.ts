// ============================================================
// pagination.helper.ts  (GENÉRICO)
// ============================================================

import { PrismaService } from 'src/prisma.service';
import { keysetPaginateGeneric } from './keyset-strategy';
import { offsetPaginateGeneric } from './offset-strategy';
import { getDateByFormat } from '../helpers/date-parsers';

/** Estrategias soportadas por el paginador genérico */
export type PaginationStrategy = 'keyset' | 'offset';

/** Dirección de navegación */
export type Direction = 'next' | 'prev';

/** Orden ASC / DESC */
export type SortOrder = 'asc' | 'desc';

/** Entrada de ordenamiento múltiple */
export interface MultiSortOrder {
  column: string;
  order: SortOrder;
}

/**
 * Interfaz genérica para helpers de paginación keyset.
 * @template TParams - Tipo del DTO de request de paginación
 * @template TNormalizedParams - Tipo del objeto de parámetros normalizados
 * @template TFilters - Tipo de los filtros extraídos
 * @template TWhereConditions - Tipo del objeto con las condiciones where
 * @template TResult - Tipo del resultado paginado
 */
export interface IPaginationGenericHelper<
  TParams,
  TNormalizedParams,
  TFilters,
  TWhereConditions,
  TResult,
> {
  /**
   * Normaliza y valida los parámetros de entrada del request
   * @param params Parámetros crudos del request
   * @returns Parámetros normalizados con valores por defecto aplicados
   */
  normalizeParams(params?: TParams): TNormalizedParams;

  /**
   * Construye las condiciones WHERE a partir de los filtros normalizados
   * @param filters Filtros extraídos de los parámetros normalizados
   * @returns Objeto con las condiciones where para la query
   */
  buildWhereConditions(filters: TFilters): TWhereConditions;

  /**
   * Ejecuta la paginación y retorna los resultados
   * @param options Opciones de paginación incluyendo prisma, where, sort, etc.
   * @returns Promise con los datos paginados
   */
  paginate(options: any): Promise<TResult>;
}

/**
 * Interfaz del Meta por columna (proveniente del módulo)
 * @param read función para leer el valor de la columna
 * @param orderBy función para ordenar por la columna
 * @param keysetWhere función para construir el where para keyset
 * @param selectForCursor función para seleccionar los datos para el cursor
 * @param supportsKeyset indica si la columna soporta keyset
 * @example
 * const columnMeta = { id: { read: (row) => row.id, orderBy: (dir) => ({ id: dir }), keysetWhere: (op, v) => ({ id: { [op]: v } }), selectForCursor: { id: true } } };
 * // result = { id: 10, fecha: new Date('2024-02-10T00:00:00.000Z') }
 * const result = columnMeta.read(row);
 * // result = 10
 * const result = columnMeta.orderBy('asc');
 * // result = { id: 'asc' }
 * const result = columnMeta.keysetWhere('gt', 10);
 * // result = { id: { gt: 10 } }
 * const result = columnMeta.selectForCursor();
 * // result = { id: true }
 * const result = columnMeta.supportsKeyset;
 * // result = true
 */
export interface ColumnMeta {
  read: (row: any) => any;
  orderBy: (dir: SortOrder) => any;
  keysetWhere?: (op: 'gt' | 'lt', value: any) => any;
  selectForCursor: any;
  supportsKeyset?: boolean;
}

/** Diccionario de metadatos */
export type ColumnMetaMap = Record<string, ColumnMeta>;

/** Opciones principales del paginador */
export interface PaginateOptions {
  prisma: PrismaService;
  model: any; // ej: prisma.operation, prisma.operationSon...
  strategy: PaginationStrategy;

  where?: Record<string, any>;
  sort: MultiSortOrder[];
  columnMeta: ColumnMetaMap;

  // keyset
  cursor?: string;
  direction?: Direction;

  // offset
  offset?: number;

  // comunes
  pageSize: number;
  select: any;
  includeCount?: boolean;
}

/** Resultado principal del paginador */
export interface PaginateResult<T = any> {
  data: T[];
  pagination: {
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string | null;
    prevCursor?: string | null;
    pageSize: number;
    sort: MultiSortOrder[];
    direction?: Direction;
    offset?: number;
  };
  totalItems?: number;
}

export type IWhereConditions = Record<string, any>;

export interface INormalizedParams<TFilters> {
  pageSize: number;
  cursor: string | undefined;
  direction: Direction;
  filters: TFilters;
  sort: MultiSortOrder[];
}

/**
 * Interfaz para clases de paginación con métodos estáticos
 * @template TParams - DTO de request (ej: OperationPaginationRequestDto)
 * @template TFilters - Tipo de filtros (ej: FiltersOptions)
 * @template TOptions - Opciones del paginate (ej: KeysetOptions)
 * @template TResult - Resultado paginado (ej: PaginatedOperationTableDto)
 */
export interface IPaginationHelper<TParams, TFilters, TOptions, TResult> {
  normalizeParams(params?: TParams): INormalizedParams<TFilters>;
  buildWhereConditions(filters: TFilters): IWhereConditions;
  paginate(options: TOptions): Promise<TResult>;
}

// ============================================================
// Utilidades comunes
// ============================================================

/**
 *
 * @param sort datos de ordenamiento del cliente
 * @param direction dirección de navegación
 * @param meta metadatos de la columna
 * @returns datos de ordenamiento para el orderBy
 * @example
 * const sort = [{ column: 'id', order: 'asc' }];
 * const direction = 'next';
 * const meta = { id: { read: (row) => row.id, orderBy: (dir) => ({ id: dir }), keysetWhere: (op, v) => ({ id: { [op]: v } }), selectForCursor: { id: true } } };
 * const result = buildOrderByGeneric(sort, direction, meta);
 * // result = [{ id: 'asc' }]
 */
export function buildOrderByGeneric(
  sort: MultiSortOrder[],
  direction: Direction,
  meta: ColumnMetaMap,
) {
  return sort.map((s) => {
    const m = meta[s.column];
    if (!m) return {};

    const eff: SortOrder =
      direction === 'next' ? s.order : s.order === 'asc' ? 'desc' : 'asc';

    return m.orderBy(eff);
  });
}

/**
 *
 * @param obj objeto a igualar
 * @returns objeto igualado
 * @example
 * const obj = { gt: 10 };
 * const result = equalizeCondition(obj);
 * // result = { equals: 10 }
 */
function equalizeCondition(obj: any) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (k === 'gt' || k === 'lt') {
      obj.equals = v;
      delete obj[k];
    } else if (typeof v === 'object' && v !== null) {
      equalizeCondition(v);
    }
  }
}

/**
 *
 * @param sort datos de ordenamiento del cliente
 * @param cursorValues valores del cursor
 * @param direction dirección de navegación
 * @param meta metadatos de la columna
 * @returns where para el keyset
 * @example
 * const sort = [{ column: 'id', order: 'asc' }];
 * const cursorValues = { id: 10 };
 * const direction = 'next';
 * const meta = { id: { read: (row) => row.id, orderBy: (dir) => ({ id: dir }), keysetWhere: (op, v) => ({ id: { [op]: v } }), selectForCursor: { id: true } } };
 * const result = buildKeysetWhereGeneric(sort, cursorValues, direction, meta);
 * // result = { OR: [{ AND: [{ id: { gt: 10 } }] }] }
 */
export function buildKeysetWhereGeneric(
  sort: MultiSortOrder[],
  cursorValues: Record<string, any> | null,
  direction: Direction,
  meta: ColumnMetaMap,
) {
  if (!cursorValues) return {};

  const OR: any[] = [];

  for (let i = 0; i < sort.length; i++) {
    const s = sort[i];
    const m = meta[s.column];
    if (!m || m.supportsKeyset === false || !m.keysetWhere) continue;

    const prevEquals: any[] = [];

    // igualdades para columnas anteriores
    for (let j = 0; j < i; j++) {
      const prev = sort[j];
      const pm = meta[prev.column];
      if (!pm || !pm.keysetWhere) continue;

      const cond = pm.keysetWhere('gt', cursorValues[prev.column]);
      const clone = JSON.parse(JSON.stringify(cond));
      equalizeCondition(clone);
      prevEquals.push(clone);
    }

    const eff: SortOrder =
      direction === 'next' ? s.order : s.order === 'asc' ? 'desc' : 'asc';

    const op: 'gt' | 'lt' = eff === 'asc' ? 'gt' : 'lt';

    const cond = m.keysetWhere(op, cursorValues[s.column]);
    if (!cond) continue;

    OR.push({ AND: [...prevEquals, cond] });
  }

  return OR.length ? { OR } : {};
}

// ============================================================
// FUNCIONES DE CONVERSIÓN DE CURSOR (keyset)
// ============================================================

/**
 *
 * @param cursor string 'A|10|2024-02-10T00:00..' → {colA:..., colB:...}
 * @param sort datos de ordenamiento del cliente
 * @param columnMeta metadatos de la columna
 * @returns datos de ordenamiento con la PK al final
 * @example
 * const cursor = 'A|10|2024-02-10T00:00..';
 * const sort = [{ column: 'id', order: 'asc' }];
 * const columnMeta = { id: { read: (row) => row.id, orderBy: (dir) => ({ id: dir }), keysetWhere: (op, v) => ({ id: { [op]: v } }), selectForCursor: { id: true } } };
 * const result = parseCursorGeneric(cursor, sort, columnMeta);
 * // result = { id: 10, fecha: new Date('2024-02-10T00:00:00.000Z') }
 */
export function parseCursorGeneric(
  cursor: string | undefined,
  sort: MultiSortOrder[],
  columnMeta: ColumnMetaMap,
) {
  if (!cursor) return null;

  const parts = cursor.split('|');
  if (parts.length !== sort.length) return null;

  const out: Record<string, any> = {};

  sort.forEach((s, i) => {
    const raw = parts[i];
    const meta = columnMeta[s.column];
    if (!meta) return;

    if (raw === '') {
      out[s.column] = null;
      return;
    }

    if (/^-?\d+(\.\d+)?$/.test(raw)) {
      out[s.column] = Number(raw);
      return;
    }

    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      out[s.column] = d;
      return;
    }

    out[s.column] = raw.replace(/\\\|/g, '|');
  });

  return out;
}

/**
 * Construye el cursor compuesto
 * @param row fila de la tabla
 * @param sort datos de ordenamiento del cliente
 * @param columnMeta metadatos de la columna
 * @returns cursor string 'A|10|2024-02-10T00:00..'
 * @example
 * const row = { id: 10, fecha: new Date('2024-02-10T00:00:00.000Z') };
 * const sort = [{ column: 'id', order: 'asc' }];
 * const columnMeta = { id: { read: (row) => row.id, orderBy: (dir) => ({ id: dir }), keysetWhere: (op, v) => ({ id: { [op]: v } }), selectForCursor: { id: true } } };
 * const result = buildCursorGeneric(row, sort, columnMeta);
 * // result = 'A|10|2024-02-10T00:00:00.000Z'
 */
export function buildCursorGeneric(
  row: any,
  sort: MultiSortOrder[],
  columnMeta: ColumnMetaMap,
) {
  const parts: string[] = [];

  for (const s of sort) {
    const meta = columnMeta[s.column];
    if (!meta) {
      parts.push('');
      continue;
    }

    const v = meta.read(row);
    if (v == null) {
      parts.push('');
      continue;
    }
    if (v instanceof Date) {
      parts.push(v.toISOString());
      continue;
    }
    if (typeof v === 'number') {
      parts.push(String(v));
      continue;
    }
    if (typeof v === 'string') {
      parts.push(v.replace(/\|/g, '\\|'));
      continue;
    }
    parts.push(String(v));
  }

  return parts.join('|');
}

/**
 *
 * @param fieldStart Campo de la tabla para el inicio del intervalo
 * @param fieldEnd Campo de la tabla para el fin del intervalo
 * @param fechaIntervaloFrom Fecha de inicio del intervalo
 * @param fechaIntervaloTo Fecha de fin del intervalo
 * @returns Condiciones de filtrado para el intervalo
 * @example
 * const fieldStart = 'fechaInicio';
 * const fieldEnd = 'fechaFin';
 * const fechaIntervaloFrom = '2024-01-01';
 * const fechaIntervaloTo = '2024-01-31';
 * const result = buildIntervalIntersectionWhereGeneric(fieldStart, fieldEnd, fechaIntervaloFrom, fechaIntervaloTo);
 * // result = [{ fechaInicio: { lte: '2024-01-31T23:59:59.999Z' }, fechaFin: { gte: '2024-01-01T00:00:00.000Z' } }]
 */
export function buildIntervalIntersectionWhereGeneric(
  fieldStart: string,
  fieldEnd: string,
  fechaIntervaloFrom?: string,
  fechaIntervaloTo?: string,
): any[] {
  const and: any[] = [];

  if (!fechaIntervaloFrom && !fechaIntervaloTo) {
    return and;
  }
  // Si solo se proporciona una fecha, tratarla como un día único
  const from = fechaIntervaloFrom || fechaIntervaloTo;
  const to = fechaIntervaloTo || fechaIntervaloFrom;

  if (!from || !to) {
    return and;
  }
  const fromStart = getDateByFormat(from, 'ISO-UTC-START');
  const toEnd = getDateByFormat(to, 'ISO-UTC-START');

  and.push({ [fieldStart]: { lte: toEnd } });
  and.push({ [fieldEnd]: { gte: fromStart } });

  return and;
}

/**
 *
 * @param model Modelo de prisma
 * @param where Condiciones de filtrado
 * @returns Total de registros que coinciden con las condiciones de filtrado
 */
export async function countModelWithFilters(
  prisma: PrismaService,
  modelName: string,
  where: Record<string, any>,
) {
  return await prisma[modelName].count({ where });
}

// ============================================================
// FUNCIÓN PRINCIPAL
// ============================================================

export async function paginateGeneric(
  options: PaginateOptions,
): Promise<PaginateResult> {
  switch (options.strategy) {
    case 'keyset':
      return keysetPaginateGeneric(options);

    case 'offset':
      return offsetPaginateGeneric(options);

    default:
      throw new Error(
        `Estrategia de paginado desconocida: ${options.strategy}`,
      );
  }
}

