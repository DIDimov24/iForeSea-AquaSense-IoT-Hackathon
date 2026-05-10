import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  Thermometer,
  type LucideIcon,
} from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_WEATHER_API_URL ?? 'https://api.open-meteo.com/v1/forecast';
const LAT = process.env.NEXT_PUBLIC_WEATHER_LAT ?? '42.5048';
const LON = process.env.NEXT_PUBLIC_WEATHER_LON ?? '27.4626';

export type Weather = {
  temperatureC: number;
  weatherCode: number;
  Icon: LucideIcon;
  iconLabel: string;
  precipitationProbability: number;
  asOfDate: string;
};

type OpenMeteoResponse = {
  current?: {
    time?: string;
    temperature_2m?: number;
    weather_code?: number;
  };
  daily?: {
    time?: string[];
    precipitation_probability_max?: (number | null)[];
  };
};

export function weatherCodeToIcon(code: number): { Icon: LucideIcon; label: string } {
  if (code === 0) return { Icon: Sun, label: 'Clear' };
  if (code === 1) return { Icon: Sun, label: 'Mainly clear' };
  if (code >= 2 && code <= 3) return { Icon: CloudSun, label: 'Partly cloudy' };
  if (code === 45 || code === 48) return { Icon: CloudFog, label: 'Fog' };
  if (code >= 51 && code <= 57) return { Icon: CloudDrizzle, label: 'Drizzle' };
  if (code >= 61 && code <= 67) return { Icon: CloudRain, label: 'Rain' };
  if (code >= 71 && code <= 77) return { Icon: CloudSnow, label: 'Snow' };
  if (code >= 80 && code <= 82) return { Icon: CloudRain, label: 'Showers' };
  if (code >= 95 && code <= 99) return { Icon: CloudLightning, label: 'Thunderstorm' };
  if (code >= 4) return { Icon: Cloud, label: 'Cloudy' };
  return { Icon: Thermometer, label: 'Weather' };
}

export async function getWeather(opts: { signal?: AbortSignal } = {}): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: LAT,
    longitude: LON,
    current: 'temperature_2m,weather_code',
    daily: 'precipitation_probability_max',
    forecast_days: '1',
    timezone: 'auto',
  });
  const url = `${BASE_URL}?${params.toString()}`;
  const res = await fetch(url, {
    signal: opts.signal,
    next: { revalidate: 1800 },
  });
  if (!res.ok) {
    throw new Error(`Weather API ${res.status}`);
  }
  const data = (await res.json()) as OpenMeteoResponse;
  const tempRaw = data.current?.temperature_2m;
  const code = data.current?.weather_code ?? 0;
  const time = data.current?.time ?? '';
  const probRaw = data.daily?.precipitation_probability_max?.[0];
  if (typeof tempRaw !== 'number') {
    throw new Error('Weather API: missing temperature');
  }
  const { Icon, label } = weatherCodeToIcon(code);
  return {
    temperatureC: Math.round(tempRaw),
    weatherCode: code,
    Icon,
    iconLabel: label,
    precipitationProbability: typeof probRaw === 'number' ? probRaw : 0,
    asOfDate: time.slice(0, 10),
  };
}
