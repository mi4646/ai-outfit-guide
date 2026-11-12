import { afterEach, describe, expect, it, vi } from 'vitest'

const response = (body: unknown, ok = true) =>
  ({ ok, json: async () => body }) as Response

async function loadWeather() {
  vi.resetModules()
  return import('./weather')
}

describe('fetchWeather', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('reads the current and apparent temperature', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response({
        current: { temperature_2m: 24.6, apparent_temperature: 26.1 },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { fetchWeather } = await loadWeather()

    await expect(fetchWeather(39.9, 116.4)).resolves.toEqual({
      temperatureC: 24.6,
      apparentC: 26.1,
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('returns null on an HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({}, false)))
    const { fetchWeather } = await loadWeather()

    await expect(fetchWeather(39.9, 116.4)).resolves.toBeNull()
  })

  it('returns null when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const { fetchWeather } = await loadWeather()

    await expect(fetchWeather(39.9, 116.4)).resolves.toBeNull()
  })

  it('returns null for a malformed payload', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ current: {} })))
    const { fetchWeather } = await loadWeather()

    await expect(fetchWeather(39.9, 116.4)).resolves.toBeNull()
  })

  it('does not repeat the request within the cache window', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response({
        current: { temperature_2m: 24.6, apparent_temperature: 26.1 },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { fetchWeather } = await loadWeather()

    await fetchWeather(39.9, 116.4)
    await fetchWeather(39.9, 116.4)

    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('retries after a failure instead of caching the fallback', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({}, false))
      .mockResolvedValueOnce(
        response({
          current: { temperature_2m: 24.6, apparent_temperature: 26.1 },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)
    const { fetchWeather } = await loadWeather()

    expect(await fetchWeather(39.9, 116.4)).toBeNull()
    expect(await fetchWeather(39.9, 116.4)).not.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
