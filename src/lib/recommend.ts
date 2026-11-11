import { COLORS, type ColorEntry } from '../data/colors'
import { getProvince, type Season } from '../data/regions'
import {
  classifyHarmony,
  deltaE,
  hueDistance,
  toOklch,
  type HarmonyKey,
  type Oklch,
} from './color'
import { seasonOf } from './season'
import {
  AGE_PROFILES,
  PROFILE_AMPLITUDE,
  STYLE_PROFILES,
  preferenceFor,
  type AgeBand,
  type Style,
} from './profile'

export type Gender = 'male' | 'female'

export type Role = 'inner' | 'pants' | 'shoes' | 'accent'

export interface RecommendationInput {
  gender: Gender
  provinceId: string
  month: number
  top: ColorEntry
  season?: Season
  age?: AgeBand
  style?: Style
}

export interface RolePick {
  role: Role
  color: ColorEntry
  score: number
  reason: string
}

export interface OutfitCombo {
  inner: RolePick
  pants: RolePick
  shoes: RolePick
  accent: RolePick
}

export interface Recommendation {
  season: Season
  seasonLabel: string
  top: ColorEntry
  primary: OutfitCombo
  alternatives: OutfitCombo[]
  avoid: Array<{ color: ColorEntry; reason: string }>
  harmony: { key: HarmonyKey; label: string; description: string }
}

const ROLES: Role[] = ['inner', 'pants', 'shoes', 'accent']

const SEASON_LABELS: Record<Season, string> = {
  spring: '春季',
  summer: '夏季',
  autumn: '秋季',
  winter: '冬季',
}

export const HARMONY_LABELS: Record<HarmonyKey, string> = {
  neutral: '中性安全',
  monochrome: '同色系',
  analogous: '邻近色',
  triadic: '三角配色',
  split: '分裂互补',
  complementary: '对比色',
}

export const HARMONY_DESCRIPTIONS: Record<HarmonyKey, string> = {
  neutral: '上下装以中性色为主，几乎不挑人，重点放在材质与版型。',
  monochrome: '同一色相内做明度变化，整体干净、显高。',
  analogous: '相邻色相过渡，柔和、有层次，不容易出错。',
  triadic: '三个色相彼此拉开，活泼但需要控制面积。',
  split: '对比色的邻色组合，比正对比更好驾驭。',
  complementary: '色相正对，冲击力最强；用大面积中性色压住。',
}

const SEASON_REASONS: Record<Season, string> = {
  spring: '春季用明亮暖调提气色',
  summer: '夏季用浅冷低饱和保持清爽',
  autumn: '秋季用暖而低的色调压住整体',
  winter: '冬季用深冷或高对比色稳住重心',
}

type WeightKey =
  | 'harmony'
  | 'contrast'
  | 'season'
  | 'chroma'
  | 'gender'
  | 'anchor'

const ROLE_WEIGHTS: Record<Role, Record<WeightKey, number>> = {
  inner: {
    harmony: 0.22,
    contrast: 0.22,
    season: 0.2,
    chroma: 0.09,
    gender: 0.12,
    anchor: 0.15,
  },
  pants: {
    harmony: 0.22,
    contrast: 0.19,
    season: 0.2,
    chroma: 0.09,
    gender: 0.16,
    anchor: 0.14,
  },
  shoes: {
    harmony: 0.22,
    contrast: 0.22,
    season: 0.16,
    chroma: 0.09,
    gender: 0.12,
    anchor: 0.19,
  },
  accent: {
    harmony: 0.34,
    contrast: 0.13,
    season: 0.18,
    chroma: 0.09,
    gender: 0.16,
    anchor: 0.1,
  },
}

const MIN_CONTRAST: Record<Role, number> = {
  inner: 0.18,
  pants: 0.1,
  shoes: 0.05,
  accent: 0.15,
}

const TARGET_CHROMA: Record<Role, number> = {
  inner: 0.04,
  pants: 0.05,
  shoes: 0.04,
  accent: 0.13,
}

const HARMONY_TARGETS = [0, 30, 60, 120, 150, 180]

interface Scored {
  color: ColorEntry
  oklch: Oklch
  score: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function resolveSeason(input: RecommendationInput): Season {
  if (input.season) return input.season
  const province = getProvince(input.provinceId)
  return seasonOf(province?.zone ?? 'overseas', input.month)
}

function seasonFit(color: ColorEntry, season: Season): number {
  const { l, c, h } = toOklch(color.hex)
  const neutral = c < 0.05

  const neutralHueFit: Record<Season, number> = {
    spring: 0.8,
    summer: 0.8,
    autumn: 0.8,
    winter: 0.9,
  }
  let hueFit = neutral ? neutralHueFit[season] : 0.5
  if (!neutral) {
    if (season === 'spring') {
      hueFit = (h >= 20 && h <= 140) || h >= 330 ? 1 : 0.6
    } else if (season === 'summer') {
      hueFit = h >= 150 && h <= 280 ? 1 : 0.5
    } else if (season === 'autumn') {
      hueFit = h >= 20 && h <= 120 ? 1 : 0.5
    } else {
      hueFit = h >= 170 && h <= 320 ? 1 : 0.6
    }
  }

  let lightnessFit = 0.5
  if (season === 'spring') {
    lightnessFit = l >= 0.55 && l <= 0.9 ? 1 : l > 0.9 ? 0.8 : 0.35
  } else if (season === 'summer') {
    lightnessFit = l >= 0.62 ? 1 : l >= 0.5 ? 0.55 : 0.2
  } else if (season === 'autumn') {
    lightnessFit = l >= 0.25 && l <= 0.72 ? 1 : 0.45
  } else {
    lightnessFit = l <= 0.5 || l >= 0.9 ? 1 : 0.55
  }

  const targetChroma = season === 'winter' ? 0.06 : 0.07
  const chromaFit = clamp(1 - Math.abs(c - targetChroma) / 0.18, 0, 1)

  return clamp(0.4 * hueFit + 0.4 * lightnessFit + 0.2 * chromaFit, 0, 1)
}

function harmonyScore(top: Oklch, candidate: Oklch): number {
  if (top.c < 0.04 || candidate.c < 0.04) return 1
  const distance = hueDistance(top.h, candidate.h)
  const nearest = Math.min(
    ...HARMONY_TARGETS.map((target) => Math.abs(distance - target)),
  )
  return clamp(1 - nearest / 90, 0, 1)
}

function contrastScore(top: Oklch, candidate: Oklch, role: Role): number {
  const difference = Math.abs(top.l - candidate.l)
  if (difference < 0.08) return 0
  const minimum = MIN_CONTRAST[role]
  if (difference >= minimum) return 1
  return clamp(1 - (minimum - difference) / 0.3, 0, 1)
}

function chromaScore(candidate: Oklch, role: Role): number {
  return clamp(1 - Math.abs(candidate.c - TARGET_CHROMA[role]) / 0.18, 0, 1)
}

function genderScore(color: ColorEntry, role: Role, gender: Gender): number {
  const { l, c, h } = toOklch(color.hex)
  const pinkish = (h < 20 || h > 320) && c > 0.1

  if (gender === 'male') {
    let score = 0.35
    if (color.family === 'neutral') score += 0.2
    if (c < 0.08) score += 0.15
    if (role === 'pants' && l < 0.45) score += 0.15
    if (role === 'inner' && l > 0.7) score += 0.05
    if (pinkish) score -= 0.2
    if (role === 'accent' && c > 0.18) score -= 0.1
    return clamp(score, 0, 1)
  }

  let score = 0.55
  if (color.family === 'warm' || color.family === 'earth') score += 0.1
  if (role === 'accent' && c > 0.08) score += 0.15
  if (role === 'pants' && c > 0.06) score += 0.05
  return clamp(score, 0, 1)
}

function roleAnchor(color: ColorEntry, role: Role): number {
  const { c } = toOklch(color.hex)
  if (role === 'inner') {
    if (color.family === 'neutral') return 1
    return c < 0.09 ? 0.82 : 0.5
  }
  if (role === 'pants') {
    if (color.family === 'neutral' || color.family === 'earth') return 1
    return c < 0.1 ? 0.8 : 0.55
  }
  if (role === 'shoes') {
    if (color.family === 'neutral') return 1
    return c < 0.1 ? 0.85 : 0.55
  }
  return c >= 0.08 ? 1 : 0.5
}

function scoreColor(
  top: Oklch,
  color: ColorEntry,
  role: Role,
  season: Season,
  gender: Gender,
  style: Style,
  age: AgeBand,
): number {
  const candidate = toOklch(color.hex)
  const weights = ROLE_WEIGHTS[role]
  const base =
    weights.harmony * harmonyScore(top, candidate) +
    weights.contrast * contrastScore(top, candidate, role) +
    weights.season * seasonFit(color, season) +
    weights.chroma * chromaScore(candidate, role) +
    weights.gender * genderScore(color, role, gender) +
    weights.anchor * roleAnchor(color, role)

  const styleRow = style === 'any' ? null : STYLE_PROFILES[style]
  const ageRow = age === 'any' ? null : AGE_PROFILES[age]
  const stylePreference = preferenceFor(color, candidate, role, top.l, styleRow)
  const agePreference = preferenceFor(color, candidate, role, top.l, ageRow)

  return (
    base +
    PROFILE_AMPLITUDE.style * stylePreference +
    PROFILE_AMPLITUDE.age * agePreference
  )
}

function candidatesFor(
  role: Role,
  top: ColorEntry,
  topOklch: Oklch,
  season: Season,
  gender: Gender,
  style: Style,
  age: AgeBand,
): Scored[] {
  return COLORS.filter(
    (color) => color.id !== top.id && deltaE(top.hex, color.hex) >= 3,
  )
    .map((color) => ({
      color,
      oklch: toOklch(color.hex),
      score: scoreColor(topOklch, color, role, season, gender, style, age),
    }))
    .sort(
      (first, second) =>
        second.score - first.score ||
        first.color.id.localeCompare(second.color.id),
    )
    .slice(0, 8)
}

function isDistinct(picks: Scored[]): boolean {
  for (let i = 0; i < picks.length; i++) {
    for (let j = i + 1; j < picks.length; j++) {
      if (picks[i].color.id === picks[j].color.id) return false
      if (deltaE(picks[i].color.hex, picks[j].color.hex) < 8) return false
    }
  }
  return true
}

function comboKey(picks: Record<Role, Scored>): string {
  return ROLES.map((role) => picks[role].color.id).join('|')
}

function reasonFor(
  role: Role,
  pick: Scored,
  top: ColorEntry,
  season: Season,
): string {
  const topOklch = toOklch(top.hex)
  const difference = Math.abs(topOklch.l - pick.oklch.l).toFixed(2)
  const harmony = HARMONY_LABELS[classifyHarmony(top.hex, pick.color.hex)]
  const seasonText = SEASON_REASONS[season]

  if (role === 'accent') {
    return `点缀选${pick.color.name}：与上衣色相相距 ${hueDistance(
      topOklch.h,
      pick.oklch.h,
    ).toFixed(0)}°，小面积对比，约占 10%。`
  }
  if (role === 'shoes') {
    return `鞋子选${pick.color.name}：明度差 ${difference}，${harmony}；${seasonText}，收住整体。`
  }
  if (role === 'pants') {
    return `裤子选${pick.color.name}：与上衣形成 ${difference} 明度差，${harmony}；${seasonText}，下半身更稳。`
  }
  return `内搭选${pick.color.name}：与上衣形成 ${difference} 明度差，${harmony}；${seasonText}。`
}

function toPick(
  role: Role,
  pick: Scored,
  top: ColorEntry,
  season: Season,
): RolePick {
  return {
    role,
    color: pick.color,
    score: pick.score,
    reason: reasonFor(role, pick, top, season),
  }
}

function toCombo(
  picks: Record<Role, Scored>,
  top: ColorEntry,
  season: Season,
): OutfitCombo {
  return {
    inner: toPick('inner', picks.inner, top, season),
    pants: toPick('pants', picks.pants, top, season),
    shoes: toPick('shoes', picks.shoes, top, season),
    accent: toPick('accent', picks.accent, top, season),
  }
}

function buildCombos(
  top: ColorEntry,
  topOklch: Oklch,
  season: Season,
  gender: Gender,
  style: Style,
  age: AgeBand,
): OutfitCombo[] {
  const pools: Record<Role, Scored[]> = {
    inner: candidatesFor('inner', top, topOklch, season, gender, style, age),
    pants: candidatesFor('pants', top, topOklch, season, gender, style, age),
    shoes: candidatesFor('shoes', top, topOklch, season, gender, style, age),
    accent: candidatesFor('accent', top, topOklch, season, gender, style, age),
  }

  const combos: Array<{ picks: Record<Role, Scored>; score: number }> = []
  for (const inner of pools.inner) {
    for (const pants of pools.pants) {
      for (const shoes of pools.shoes) {
        for (const accent of pools.accent) {
          if (!isDistinct([inner, pants, shoes, accent])) continue
          const picks = { inner, pants, shoes, accent }
          const score =
            (inner.score + pants.score + shoes.score + accent.score) / 4
          combos.push({ picks, score })
        }
      }
    }
  }

  combos.sort(
    (first, second) =>
      second.score - first.score ||
      comboKey(first.picks).localeCompare(comboKey(second.picks)),
  )

  const chosen: typeof combos = []
  for (const combo of combos) {
    if (chosen.length >= 3) break
    const repeatsThreeRoles = chosen.some(
      (picked) =>
        ROLES.filter(
          (role) => picked.picks[role].color.id === combo.picks[role].color.id,
        ).length >= 3,
    )
    if (!repeatsThreeRoles) chosen.push(combo)
  }
  for (const combo of combos) {
    if (chosen.length >= 3) break
    if (!chosen.includes(combo)) chosen.push(combo)
  }

  return chosen.map(({ picks }) => toCombo(picks, top, season))
}

function avoidFor(top: ColorEntry): Array<{ color: ColorEntry; reason: string }> {
  return COLORS.filter((color) => color.id !== top.id)
    .map((color) => ({ color, distance: deltaE(top.hex, color.hex) }))
    .filter(({ distance }) => distance < 10)
    .sort(
      (first, second) =>
        first.distance - second.distance ||
        first.color.id.localeCompare(second.color.id),
    )
    .slice(0, 4)
    .map(({ color, distance }) => ({
      color,
      reason: `与上衣太近（ΔE ${distance.toFixed(0)}），会糊成一片。`,
    }))
}

export function recommend(input: RecommendationInput): Recommendation {
  const season = resolveSeason(input)
  const topOklch = toOklch(input.top.hex)
  const combos = buildCombos(
    input.top,
    topOklch,
    season,
    input.gender,
    input.style ?? 'any',
    input.age ?? 'any',
  )
  const [primary, ...alternatives] = combos
  const pants = primary.pants.color
  const key = classifyHarmony(input.top.hex, pants.hex)

  return {
    season,
    seasonLabel: SEASON_LABELS[season],
    top: input.top,
    primary,
    alternatives,
    avoid: avoidFor(input.top),
    harmony: {
      key,
      label: HARMONY_LABELS[key],
      description: HARMONY_DESCRIPTIONS[key],
    },
  }
}
