export const safeParseJSON = (arg: any): string => {
  return JSON.stringify(arg, (key, value) =>
    typeof value === "bigint" ? value.toString() : value
  );
};
