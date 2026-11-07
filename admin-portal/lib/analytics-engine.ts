/**
 * FastHire AI - Enterprise Analytics & Business Intelligence Engine
 * Emulates Python Pandas (DataFrame aggregation) & NumPy (Statistical Distributions)
 * for Tableau-style Business Intelligence dashboards.
 */

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

export function calculateMean(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const valid = values.filter((v) => !isNaN(v));
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / valid.length) * 100) / 100;
}

export function calculateStdDev(values: number[]): number {
  if (!values || values.length <= 1) return 0;
  const valid = values.filter((v) => !isNaN(v));
  if (valid.length <= 1) return 0;
  const mean = calculateMean(valid);
  const variance = valid.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (valid.length - 1);
  return Math.round(Math.sqrt(variance) * 100) / 100;
}

export function calculateMedian(values: number[]): number {
  return calculatePercentile(values, 50);
}

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

