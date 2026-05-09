export type RiskClass = 'green' | 'yellow' | 'red';

export type Beach = {
  id: 'sarafovo' | 'central' | 'kraimorie';
  name: string;
  chl: number;
  trend: number;
  forecast: number[];
};

export function classify(chl: number): RiskClass {
  if (chl < 5) return 'green';
  if (chl < 12) return 'yellow';
  return 'red';
}

export function riskColor(c: RiskClass): string {
  return c === 'green' ? 'var(--chl)' : c === 'yellow' ? 'var(--warn)' : 'var(--bloom)';
}

export function riskLabel(c: RiskClass): string {
  return c === 'green' ? 'Safe' : c === 'yellow' ? 'Caution' : 'Avoid';
}

export const BEACHES: Beach[] = [
  {
    id: 'sarafovo',
    name: 'Sarafovo',
    chl: 3.2,
    trend: -0.4,
    forecast: [3.2, 3.5, 4.1, 4.6, 5.2, 5.8],
  },
  {
    id: 'central',
    name: 'Central',
    chl: 7.4,
    trend: 1.2,
    forecast: [7.4, 8.2, 9.0, 10.1, 11.3, 12.5],
  },
  {
    id: 'kraimorie',
    name: 'Kraimorie',
    chl: 13.8,
    trend: 2.1,
    forecast: [13.8, 14.6, 15.2, 14.8, 13.9, 12.1],
  },
];
