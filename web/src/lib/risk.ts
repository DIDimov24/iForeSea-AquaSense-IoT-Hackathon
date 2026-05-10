import type { RiskClass } from './api';

export type { RiskClass };

export function classify(chl: number): RiskClass {
  if (chl <= 10) return 'green';
  if (chl <= 22) return 'yellow';
  return 'red';
}

export function riskColor(c: RiskClass): string {
  return c === 'green' ? 'var(--chl)' : c === 'yellow' ? 'var(--warn)' : 'var(--bloom)';
}

export function riskLabel(c: RiskClass): string {
  return c === 'green' ? 'Safe' : c === 'yellow' ? 'Caution' : 'Avoid';
}
