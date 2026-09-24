// Number formatting helpers, matching the reference app's sq-AL locale formatting.

export function formatNumber(value, fractionDigits = 0, locale = "sq-AL") {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: fractionDigits }).format(value);
}

export function formatDecimal(value, locale = "sq-AL") {
  return formatNumber(value, 2, locale);
}

// Reference app formats payback years with a single decimal place.
export function formatYears(value, locale = "sq-AL") {
  return formatNumber(value, 1, locale);
}
