import type { Season } from '../../data/regions'
import type { Gender } from '../../lib/recommend'

export type SleeveLength = 'short' | 'long'
export type PantLength = 'short' | 'long'
export type ShoeStyle = 'sandal' | 'loafer' | 'boot'
export type AccentStyle = 'belt' | 'scarf'

export interface OutfitSpec {
  sleeve: SleeveLength
  pant: PantLength
  shoe: ShoeStyle
  accent: AccentStyle
}

export const SEASON_LABELS: Record<Season, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
}

export const OUTFITS: Record<Season, OutfitSpec> = {
  spring: { sleeve: 'long', pant: 'long', shoe: 'loafer', accent: 'belt' },
  summer: { sleeve: 'short', pant: 'short', shoe: 'sandal', accent: 'belt' },
  autumn: { sleeve: 'long', pant: 'long', shoe: 'boot', accent: 'belt' },
  winter: { sleeve: 'long', pant: 'long', shoe: 'boot', accent: 'scarf' },
}

export function sceneFor(_gender: Gender, season: Season): OutfitSpec {
  return OUTFITS[season]
}
