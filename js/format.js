// Number formatting helpers, matching the reference app's sq-AL locale formatting.

export function formatNumber(value, fractionDigits = 0) {
  return new Intl.NumberFormat("sq-AL", { maximumFractionDigits: fractionDigits }).format(value);
}

export function formatDecimal(value) {
  return formatNumber(value, 2);
}

// Reference app formats payback years with a single decimal place.
export function formatYears(value) {
  return formatNumber(value, 1);
}
