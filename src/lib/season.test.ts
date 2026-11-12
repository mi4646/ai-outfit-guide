import { describe, expect, it } from 'vitest'
import { PROVINCES, ZONES } from '../data/regions'
import {
  locate,
  nearestProvince,
  seasonFromTemperature,
  seasonOf,
} from './season'

describe('seasonOf', () => {
  it('uses the southern China table for July', () => {
    expect(seasonOf('huanan', 7)).toBe('summer')
  })

  it('uses the northeast table for January', () => {
    expect(seasonOf('dongbei', 1)).toBe('winter')
  })

  it('keeps the Tibetan plateau cold in April', () => {
    expect(seasonOf('qingzang', 4)).toBe('winter')
  })

  it('starts spring in north China in April', () => {
    expect(seasonOf('huabei', 4)).toBe('spring')
  })

  it('returns a season for every zone and month', () => {
    for (const zone of ZONES) {
      for (let month = 1; month <= 12; month++) {
        expect(['spring', 'summer', 'autumn', 'winter']).toContain(
          seasonOf(zone.id, month),
        )
      }
    }
  })
})

describe('seasonFromTemperature', () => {
  it('turns a hot autumn day into summer', () => {
    expect(seasonFromTemperature(27, 'autumn')).toBe('summer')
  })

  it('turns a cold summer day into winter', () => {
    expect(seasonFromTemperature(10, 'summer')).toBe('winter')
  })

  it('keeps the calendar season in the mild band', () => {
    expect(seasonFromTemperature(26, 'autumn')).toBe('autumn')
    expect(seasonFromTemperature(11, 'spring')).toBe('spring')
  })
})

describe('nearestProvince', () => {
  it('finds Beijing from its coordinates', () => {
    expect(nearestProvince(39.9, 116.4)?.id).toBe('beijing')
  })
})

describe('locate', () => {
  it('maps Shanghai in January to winter', () => {
    const result = locate(31.23, 121.47, 1)
    expect(result.provinceId).toBe('shanghai')
    expect(result.zoneId).toBe('huadong')
    expect(result.season).toBe('winter')
  })

  it('maps Beijing in April to spring', () => {
    const result = locate(39.9, 116.4, 4)
    expect(result.provinceId).toBe('beijing')
    expect(result.season).toBe('spring')
  })

  it('inverts the season in the southern hemisphere', () => {
    const result = locate(-33.86, 151.21, 1)
    expect(result.zoneId).toBe('overseas')
    expect(result.season).toBe('summer')
  })

  it('uses northern summer for London in July', () => {
    expect(locate(51.5, -0.12, 7).season).toBe('summer')
  })
})

describe('region data', () => {
  it('has all 34 province-level divisions', () => {
    expect(PROVINCES).toHaveLength(34)
  })

  it('has unique province ids', () => {
    expect(new Set(PROVINCES.map((province) => province.id)).size).toBe(
      PROVINCES.length,
    )
  })

  it('points every province at a known zone', () => {
    const zoneIds = new Set(ZONES.map((zone) => zone.id))
    for (const province of PROVINCES) {
      expect(zoneIds.has(province.zone)).toBe(true)
    }
  })
})
