import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { WeatherState } from '../lib/weather'
import { RegionStep } from './RegionStep'

const render = (weather: WeatherState) =>
  renderToStaticMarkup(
    <RegionStep
      provinceId="guangdong"
      month={11}
      seasonOverride={null}
      autoSeason="autumn"
      weather={weather}
      onProvince={() => {}}
      onSeason={() => {}}
      onAutoSeason={() => {}}
      onNext={() => {}}
      onBack={() => {}}
    />,
  )

describe('RegionStep weather', () => {
  it('shows the reading and the temperature-aware season label', () => {
    const html = render({
      key: '23.13,113.26',
      status: 'ok',
      reading: { temperatureC: 26.4, apparentC: 28.1 },
    })

    expect(html).toContain('当前气温 26°C · 体感 28°C')
    expect(html).toContain('按实时气温与月份估算')
  })

  it('falls back to the month label when the reading is unavailable', () => {
    const html = render({ key: '23.13,113.26', status: 'error', reading: null })

    expect(html).toContain('气温暂不可用，已按 11 月估算。')
    expect(html).toContain('按 11 月估算')
  })
})
