import type { Province, Season, ZoneId } from '../data/regions'
import { PROVINCES, ZONES, getZone } from '../data/regions'

export interface LocationResult {
  provinceId: string
  provinceName: string
  zoneId: ZoneId
  zoneName: string
  season: Season
}

const MONTHS: Season[] = [
  'winter',
  'winter',
  'spring',
  'spring',
  'spring',
  'summer',
  'summer',
  'summer',
  'autumn',
  'autumn',
  'autumn',
  'winter',
]

const SOUTHERN_INVERT: Record<Season, Season> = {
  spring: 'autumn',
  summer: 'winter',
  autumn: 'spring',
  winter: 'summer',
}

export function seasonOf(zoneId: ZoneId, month: number): Season {
  const index = ((month - 1) % 12 + 12) % 12
  return getZone(zoneId).months[index]
}

function distance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = Math.PI / 180
  const dLat = (lat1 - lat2) * toRad
  const dLon = (lon1 - lon2) * toRad
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2
  return 2 * Math.asin(Math.sqrt(a))
}

export function nearestProvince(lat: number, lon: number): Province | undefined {
  let closest: Province | undefined
  let closestDistance = Number.POSITIVE_INFINITY
  for (const province of PROVINCES) {
    const next = distance(lat, lon, province.lat, province.lon)
    if (next < closestDistance) {
      closest = province
      closestDistance = next
    }
  }
  return closest
}

function overseasSeason(lat: number, month: number): Season {
  const base = MONTHS[((month - 1) % 12 + 12) % 12]
  return lat < 0 ? SOUTHERN_INVERT[base] : base
}

export function locate(lat: number, lon: number, month: number): LocationResult {
  const inChina = lat >= 18 && lat <= 54 && lon >= 73 && lon <= 135
  if (inChina) {
    const province = nearestProvince(lat, lon)
    if (province) {
      const zone = ZONES.find((item) => item.id === province.zone)
      if (zone) {
        return {
          provinceId: province.id,
          provinceName: province.name,
          zoneId: zone.id,
          zoneName: zone.name,
          season: seasonOf(zone.id, month),
        }
      }
    }
  }

  return {
    provinceId: 'overseas',
    provinceName: '海外',
    zoneId: 'overseas',
    zoneName: '海外（按纬度估算）',
    season: overseasSeason(lat, month),
  }
}
