const parseToArray = <T>(
  value: any,
  transform: (item: any) => T,
  validate: (item: T) => boolean,
): T[] | undefined => {
  if (!value) return undefined;

  if (Array.isArray(value)) {
    return value.map(transform).filter(validate);
  }

  if (typeof value === 'string') {
    // Formato JSON [1,2,3] o ["a","b"]
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.map(transform).filter(validate)
          : undefined;
      } catch {
        return undefined;
      }
    }
    // Valor único
    const transformed = transform(value);
    return validate(transformed) ? [transformed] : undefined;
  }

  return undefined;
};

const parseArrayValue = (value: any): number[] | undefined =>
  parseToArray(
    value,
    (v) => parseInt(v, 10),
    (v) => !isNaN(v),
  );

const parseStringArrayValue = (value: any): string[] | undefined =>
  parseToArray(
    value,
    (v) => v,
    (v) => v && typeof v === 'string',
  );

export { parseToArray, parseArrayValue, parseStringArrayValue };