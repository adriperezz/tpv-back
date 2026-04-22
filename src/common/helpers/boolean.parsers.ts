const toBoolean = (field?: any) => {
  if (field === undefined || field === null) return undefined;
  return field === 'true' || field === true;
};

export { toBoolean };