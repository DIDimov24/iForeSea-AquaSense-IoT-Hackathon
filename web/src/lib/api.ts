const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export type RiskClass = 'green' | 'yellow' | 'red';
export type ModelKind = 'real' | 'stub';
export type LocationId = 'sarafovo' | 'central_beach_burgas' | 'kraimorie';

export const PILOT_IDS: LocationId[] = [
  'sarafovo',
  'central_beach_burgas',
  'kraimorie',
] as const;

export const SHORT_NAMES: Record<LocationId, string> = {
  sarafovo: 'Sarafovo',
  central_beach_burgas: 'Central',
  kraimorie: 'Kraimorie',
};

export type Location = {
  location_id: string;
  name_bg: string;
  name_en: string;
  latitude: number;
  longitude: number;
};

export type ForecastWindow = { start: string; end: string };

export type RiskPrediction = {
  location_id: string;
  as_of_date: string;
  forecast_window: ForecastWindow;
  predicted_chlorophyll_ug_l: number;
  risk_class: RiskClass;
  model: ModelKind;
};

export type RiskAllResponse = {
  as_of_date: string;
  items: RiskPrediction[];
};

export type Reading = {
  date: string;
  temperature_c: number;
  nitrate_no3_mg_l: number;
  phosphate_po4_mg_l: number;
  turbidity_ntu: number;
  chlorophyll_a_ug_l: number;
};

export type Health = {
  status: 'ok';
  model_loaded: boolean;
  model_path: string;
};

export class ApiError extends Error {
  constructor(public status: number, public path: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

type FetchOpts = { revalidate?: number; signal?: AbortSignal };

async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const init: RequestInit & { next?: { revalidate: number } } = {
    signal: opts.signal,
  };
  if (opts.revalidate !== undefined) {
    init.next = { revalidate: opts.revalidate };
  }
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(res.status, path, `API ${res.status} ${path}${body ? `: ${body}` : ''}`);
  }
  return res.json() as Promise<T>;
}

export const getHealth = (opts?: FetchOpts) =>
  apiFetch<Health>('/health', { revalidate: 60, ...opts });

export const getLocations = (opts?: FetchOpts) =>
  apiFetch<Location[]>('/locations', { revalidate: 3600, ...opts });

export const getLocation = (id: string, opts?: FetchOpts) =>
  apiFetch<Location>(`/locations/${encodeURIComponent(id)}`, { revalidate: 3600, ...opts });

export const getRiskAll = (opts?: FetchOpts) =>
  apiFetch<RiskAllResponse>('/risk', { revalidate: 300, ...opts });

export const getRisk = (id: string, opts?: FetchOpts) =>
  apiFetch<RiskPrediction>(`/risk/${encodeURIComponent(id)}`, { revalidate: 300, ...opts });

export const getReadings = (id: string, days = 14, opts?: FetchOpts) =>
  apiFetch<Reading[]>(
    `/readings/${encodeURIComponent(id)}?days=${days}`,
    { revalidate: 300, ...opts },
  );
