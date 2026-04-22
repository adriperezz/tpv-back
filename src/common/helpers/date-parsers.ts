// ========================
// NORMALIZADORES DE FECHAS
// ========================

type DateFormat = 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'ISO-UTC-START' | 'ISO-UTC-END';
type DateOrder = 'YMD' | 'DMY';
type UTCLimit = 'start' | 'end';

export function getDateByFormat(date: string, format: DateFormat): string | Date {
  let result: string | Date;

  switch(format){
    case 'YYYY-MM-DD':
      result = getDateInOrder(date, 'YMD');
      break;
    case 'DD-MM-YYYY':
      result = getDateInOrder(date, 'DMY');
      break;
    case 'ISO-UTC-START':
      result = getDateOnUTC(date,'start');
      break;
    case 'ISO-UTC-END':
      result = getDateOnUTC(date, 'end');
      break;
  }

  return result;
}

export function getDateOnUTC(date: string, limit: UTCLimit): Date {
  const newDate: Date = new Date(date);

  if(limit === 'start'){
    newDate.setUTCHours(0, 0, 0, 0);
  }
  else{
    newDate.setUTCHours(23, 59, 59, 999);
  }
  return newDate;
}


export function getDateInOrder(date: string, order: DateOrder = 'YMD'): string {
  const onlyDate = removeTimezone(date);
  const dateArray = onlyDate.split('-');
  
  if (order === 'DMY') {
    return `${dateArray[2]}-${dateArray[1]}-${dateArray[0]}`;
  }
  return `${dateArray[0]}-${dateArray[1]}-${dateArray[2]}`;

}

/**
 * Extrae solo la fecha (YYYY-MM-DD) de un string ISO UTC, removiendo hora y zona horaria
 * @param date - Fecha en formato ISO UTC (ej: "2025-12-01T00:00:00Z" o "2025-12-01T00:00:00+00:00")
 * @returns Fecha en formato YYYY-MM-DD (ej: "2025-12-01")
 */
export function removeTimezone(date: string): string {
  return date.split('T')[0];
}

export function buildIntervalIntersectionWhere(
  fechaIntervaloFrom: string | Date,
  fechaIntervaloTo: string | Date,
  fieldStart: string = 'fechaInicio',
  fieldEnd: string = 'fechaFin',
): any[] {
  const and: any[] = [];
  
  if (!fechaIntervaloFrom && !fechaIntervaloTo) {
    return and;
  }

  const intervaloFrom: string = getISODate(fechaIntervaloFrom);
  const intervaloTo: string  = getISODate(fechaIntervaloTo);

  const fromStart = getDateByFormat(intervaloFrom, 'ISO-UTC-START');
  const toEnd = getDateByFormat(intervaloTo, 'ISO-UTC-END');

  // Casos cubiertos:
  // 1) Intervalos que inician dentro del rango [from, to]
  // 2) Intervalos que terminan dentro del rango [from, to]
  // 3) Intervalos que contienen completamente al rango (start <= from AND end >= to)
  and.push({
    OR: [
      {
        AND: [
          { [fieldStart]: { gte: fromStart } },
          { [fieldStart]: { lte: toEnd } },
        ],
      },
      {
        AND: [
          { [fieldEnd]: { gte: fromStart } },
          { [fieldEnd]: { lte: toEnd } },
        ],
      },
      {
        AND: [
          { [fieldStart]: { lte: fromStart } },
          { [fieldEnd]: { gte: toEnd } },
        ],
      },
    ],
  });
  
  return and;

}

/**
 * Devuelve la representación en cadena ISO 8601 de una fecha proporcionada.
 * Si el parámetro es un objeto Date, utiliza su método toISOString();
 * si es una cadena, retorna la cadena sin modificaciones.
 *
 * @param date Fecha a convertir en formato Date o string (ISO)
 * @returns La fecha en formato ISO 8601 (string)
 */
function getISODate(date: Date | string): string {
  return date instanceof Date ? date.toISOString() : date;
}

export function convertirFecha(fechaDDMMYYYY: string): string {
  const [dia, mes, anio] = fechaDDMMYYYY.split('-');
  return `${anio}-${mes}-${dia}`;
}