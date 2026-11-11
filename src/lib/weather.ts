export interface WeatherReading {
  temperatureC: number
  apparentC: number
}

export type WeatherStatus = 'idle' | 'loading' | 'ok' | 'error'

export interface WeatherState {
  key: string | null
  status: WeatherStatus
  reading: WeatherReading | null
}

interface CachedReading extends WeatherReading {
  at: number
}

const CACHE_TTL_MS = 30 * 60 * 1000
const cache = new Map<string, CachedReading>()

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

// shortcut: Open-Meteo 在部分网络不可达，失败时由调用方回退到月份估算；
// 若成为常态，换带 Key 的国内天气服务并加后端代理。
export async function fetchWeather(
  lat: number,
  lon: number,
): Promise<WeatherReading | null> {
  const key = cacheKey(lat, lon)
  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { temperatureC: cached.temperatureC, apparentC: cached.apparentC }
  }

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,apparent_temperature',
    timezone: 'auto',
  })

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      { signal: AbortSignal.timeout(6000) },
    )
    if (!response.ok) return null

    const body = (await response.json()) as {
      current?: { temperature_2m?: unknown; apparent_temperature?: unknown }
    }
    const temperatureC = body.current?.temperature_2m
    const apparentC = body.current?.apparent_temperature
    if (!finite(temperatureC) || !finite(apparentC)) return null

    cache.set(key, { temperatureC, apparentC, at: Date.now() })
    return { temperatureC, apparentC }
  } catch {
    return null
  }
}
