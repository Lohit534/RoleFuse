/**
 * FastHire AI - Enterprise Analytics & Business Intelligence Engine
 * Emulates Python Pandas (DataFrame aggregation) & NumPy (Statistical Distributions)
 * for Tableau-style Business Intelligence dashboards.
 */

/** Calculate percentile using NumPy linear interpolation method */
export function calculatePercentile(values: number[], p: number): number {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].filter((v) => !isNaN(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  if (p <= 0) return sorted[0];
  if (p >= 100) return sorted[sorted.length - 1];

  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return Math.round((sorted[lower] * (1 - weight) + sorted[upper] * weight) * 100) / 100;
}

/** Calculate Arithmetic Mean */
export function calculateMean(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const valid = values.filter((v) => !isNaN(v));
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / valid.length) * 100) / 100;
}

/** Calculate Sample Standard Deviation (Bessel's correction ddof=1) */
export function calculateStdDev(values: number[]): number {
  if (!values || values.length <= 1) return 0;
  const valid = values.filter((v) => !isNaN(v));
  if (valid.length <= 1) return 0;
  const mean = calculateMean(valid);
  const variance = valid.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (valid.length - 1);
  return Math.round(Math.sqrt(variance) * 100) / 100;
}

/** Calculate Median (50th percentile) */
export function calculateMedian(values: number[]): number {
  return calculatePercentile(values, 50);
}

/** Pandas df.describe() Statistical Summary Model */
export interface StatisticalSummary {
  metric: string;
  count: number;
  mean: number;
  std: number;
  min: number;
  p25: number;
  p50: number;
  p75: number;
  max: number;
  iqr: number;
}

/** Generate a complete Pandas df.describe() row for a numeric array */
export function computePandasDescribe(label: string, values: number[]): StatisticalSummary {
  const valid = values.filter((v) => !isNaN(v));
  if (valid.length === 0) {
    return {
      metric: label,
      count: 0,
      mean: 0,
      std: 0,
      min: 0,
      p25: 0,
      p50: 0,
      p75: 0,
      max: 0,
      iqr: 0,
    };
  }

  const p25 = calculatePercentile(valid, 25);
  const p75 = calculatePercentile(valid, 75);

  return {
    metric: label,
    count: valid.length,
    mean: calculateMean(valid),
    std: calculateStdDev(valid),
    min: Math.min(...valid),
    p25,
    p50: calculateMedian(valid),
    p75,
    max: Math.max(...valid),
    iqr: Math.round((p75 - p25) * 100) / 100,
  };
}

/**
 * Parses diverse salary text inputs into normalized annual numeric values (INR/USD equivalent).
 * Handles strings like "$120k", "15 LPA", "₹18,00,000", "12-16 LPA", "85000", "25L"
 */
export function parseSalaryToNumeric(raw?: string): number | null {
  if (!raw || typeof raw !== "string") return null;
  const clean = raw.trim().toLowerCase();
  if (!clean) return null;

  // Pattern: "12 - 16 LPA" or "15-20L" -> take midpoint
  const lpaRange = clean.match(/(\d+(?:\.\d+)?)\s*[-–—to]+\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakh|lac|l)/i);
  if (lpaRange) {
    const min = parseFloat(lpaRange[1]);
    const max = parseFloat(lpaRange[2]);
    return Math.round(((min + max) / 2) * 100000);
  }

  // Pattern: "18 LPA" or "18L" or "18 Lakh"
  const lpaSingle = clean.match(/(\d+(?:\.\d+)?)\s*(?:lpa|lakh|lac|l)\b/i);
  if (lpaSingle) {
    return Math.round(parseFloat(lpaSingle[1]) * 100000);
  }

  // Pattern: "$120k - $150k" or "80k - 100k"
  const kRange = clean.match(/(\d+(?:\.\d+)?)\s*k?\s*[-–—to]+\s*(\d+(?:\.\d+)?)\s*k\b/i);
  if (kRange) {
    const min = parseFloat(kRange[1]);
    const max = parseFloat(kRange[2]);
    return Math.round(((min + max) / 2) * 1000);
  }

  // Pattern: "$120k" or "90k"
  const kSingle = clean.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (kSingle) {
    return Math.round(parseFloat(kSingle[1]) * 1000);
  }

  // Standard digits: "$120,000" or "₹15,00,000" or "1200000"
  const digitsOnly = clean.replace(/[^0-9.]/g, "");
  if (digitsOnly) {
    const num = parseFloat(digitsOnly);
    if (!isNaN(num) && num > 0) return Math.round(num);
  }

  return null;
}

/** Format currency amounts concisely (e.g. ₹18.5 L or $125 K) */
export function formatCompactCurrency(val: number): string {
  if (!val || val === 0) return "₹0";
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(1)} LPA`;
  }
  if (val >= 1000) {
    return `₹${(val / 1000).toFixed(0)}K`;
  }
  return `₹${val.toLocaleString()}`;
}

/** Generate and trigger a browser download for a CSV string */
export function exportToCsvFile(filename: string, rows: (string | number)[][], headers: string[]) {
  const csvContent = [
    headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

