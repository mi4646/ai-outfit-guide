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

export type AnchorRole = 'top' | 'pants'

export type Role = 'inner' | 'top' | 'pants' | 'shoes' | 'accent'

export interface Piece {
  role: AnchorRole
  color: ColorEntry
}

export interface RecommendationInput {
  gender: Gender
  provinceId: string
  month: number
  /** pieces[0] 是锚点，其余为额外锁定的单品。 */
  pieces: Piece[]
  season?: Season
  age?: AgeBand
  style?: Style
  /** 第几批备选（从 0 开始）。越界时钳到末批。 */
  variant?: number
}

export interface RolePick {
  role: Role
  color: ColorEntry
  score: number
  reason: string
}

export interface OutfitCombo {
  inner: RolePick
  top: RolePick
  pants: RolePick
  shoes: RolePick
  accent: RolePick
}

export interface Recommendation {
  season: Season
  seasonLabel: string
  top: ColorEntry
  pants: ColorEntry
  primary: OutfitCombo
  alternatives: OutfitCombo[]
  /** 可切换的完整批次数，至少为 1。 */
  batchCount: number
  avoid: Array<{ color: ColorEntry; reason: string }>
  harmony: { key: HarmonyKey; label: string; description: string }
  /** 季节理由只说一次，不重复进每条单品的行内文案。 */
  seasonNote: string
  anchorRole: AnchorRole
  pairNote: string | null
}

const ROLES: Role[] = ['inner', 'top', 'pants', 'shoes', 'accent']

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
  spring: '明亮暖调提气色',
  summer: '浅冷低饱和保持清爽',
  autumn: '暖而低的色调压住整体',
  winter: '深冷或高对比色稳住重心',
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
  top: {
    harmony: 0.26,
    contrast: 0.2,
    season: 0.2,
    chroma: 0.08,
    gender: 0.12,
    anchor: 0.14,
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
  top: 0.12,
  pants: 0.1,
  shoes: 0.05,
  accent: 0.15,
}

const TARGET_CHROMA: Record<Role, number> = {
  inner: 0.04,
  top: 0.06,
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

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length
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

function harmonyScore(reference: Oklch, candidate: Oklch): number {
  if (reference.c < 0.04 || candidate.c < 0.04) return 1
  const distance = hueDistance(reference.h, candidate.h)
  const nearest = Math.min(
    ...HARMONY_TARGETS.map((target) => Math.abs(distance - target)),
  )
  return clamp(1 - nearest / 90, 0, 1)
}

function contrastScore(reference: Oklch, candidate: Oklch, role: Role): number {
  const difference = Math.abs(reference.l - candidate.l)
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
  if (role === 'top') {
    if (color.family === 'neutral') return 1
    return c < 0.1 ? 0.85 : 0.6
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
  fixed: Scored[],
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
    weights.harmony *
      average(fixed.map((piece) => harmonyScore(piece.oklch, candidate))) +
    weights.contrast *
      average(
        fixed.map((piece) => contrastScore(piece.oklch, candidate, role)),
      ) +
    weights.season * seasonFit(color, season) +
    weights.chroma * chromaScore(candidate, role) +
    weights.gender * genderScore(color, role, gender) +
    weights.anchor * roleAnchor(color, role)

  const styleRow = style === 'any' ? null : STYLE_PROFILES[style]
  const ageRow = age === 'any' ? null : AGE_PROFILES[age]
  const referenceL = fixed[0].oklch.l
  const stylePreference = preferenceFor(
    color,
    candidate,
    role,
    referenceL,
    styleRow,
  )
  const agePreference = preferenceFor(color, candidate, role, referenceL, ageRow)

  return (
    base +
    PROFILE_AMPLITUDE.style * stylePreference +
    PROFILE_AMPLITUDE.age * agePreference
  )
}

function candidatesFor(
  role: Role,
  fixed: Scored[],
  season: Season,
  gender: Gender,
  style: Style,
  age: AgeBand,
): Scored[] {
  return COLORS.filter((color) =>
    fixed.every(
      (piece) => piece.color.id !== color.id && deltaE(piece.color.hex, color.hex) >= 3,
    ),
  )
    .map((color) => ({
      color,
      oklch: toOklch(color.hex),
      score: scoreColor(fixed, color, role, season, gender, style, age),
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

function anchorLabel(anchorRole: AnchorRole): string {
  return anchorRole === 'top' ? '上衣' : '裤子'
}

function reasonFor(
  role: Role,
  pick: Scored,
  anchor: { role: AnchorRole; color: ColorEntry; oklch: Oklch },
): string {
  const difference = Math.abs(anchor.oklch.l - pick.oklch.l).toFixed(2)
  const harmony = HARMONY_LABELS[
    classifyHarmony(anchor.color.hex, pick.color.hex)
  ]
  const label = anchorLabel(anchor.role)

  if (role === 'accent') {
    return `点缀选${pick.color.name}：与${label}色相相距 ${hueDistance(
      anchor.oklch.h,
      pick.oklch.h,
    ).toFixed(0)}°，小面积对比，约占 10%。`
  }
  if (role === 'shoes') {
    return `鞋子选${pick.color.name}：明度差 ${difference}，${harmony}；收住整体。`
  }
  if (role === 'pants') {
    return `裤子选${pick.color.name}：与${label}形成 ${difference} 明度差，${harmony}；重心落在下半身。`
  }
  if (role === 'top') {
    return `上衣选${pick.color.name}：与${label}形成 ${difference} 明度差，${harmony}。`
  }
  return `内搭选${pick.color.name}：与${label}形成 ${difference} 明度差，${harmony}。`
}

function fixedReason(role: Role): string {
  return role === 'pants'
    ? '你选择的裤子，作为整套的下半身基准。'
    : '你选择的上衣，决定整套的冷暖与轻重。'
}

function toCombo(
  picks: Record<Role, Scored>,
  anchor: { role: AnchorRole; color: ColorEntry; oklch: Oklch },
  fixedByRole: Partial<Record<Role, Scored>>,
): OutfitCombo {
  const pick = (role: Role): RolePick => {
    const scored = picks[role]
    return fixedByRole[role]
      ? {
          role,
          color: scored.color,
          score: scored.score,
          reason: fixedReason(role),
        }
      : {
          role,
          color: scored.color,
          score: scored.score,
          reason: reasonFor(role, scored, anchor),
        }
  }

  return {
    inner: pick('inner'),
    top: pick('top'),
    pants: pick('pants'),
    shoes: pick('shoes'),
    accent: pick('accent'),
  }
}

function combinations(
  roles: Role[],
  pools: Record<Role, Scored[]>,
): Array<Partial<Record<Role, Scored>>> {
  let results: Array<Partial<Record<Role, Scored>>> = [{}]
  for (const role of roles) {
    const next: typeof results = []
    for (const partial of results) {
      for (const pick of pools[role]) next.push({ ...partial, [role]: pick })
    }
    results = next
  }
  return results
}

function buildCombos(
  fixedByRole: Partial<Record<Role, Scored>>,
  fixed: Scored[],
  anchor: { role: AnchorRole; color: ColorEntry; oklch: Oklch },
  season: Season,
  gender: Gender,
  style: Style,
  age: AgeBand,
  variant: number,
): { combos: OutfitCombo[]; batchCount: number } {
  const BATCH_SIZE = 3
  const MAX_BATCHES = 4
  const wanted = BATCH_SIZE * MAX_BATCHES
  const freeRoles = ROLES.filter((role) => !fixedByRole[role])
  const pools = {} as Record<Role, Scored[]>
  for (const role of ROLES) {
    pools[role] = fixedByRole[role]
      ? []
      : candidatesFor(role, fixed, season, gender, style, age)
  }

  const combos: Array<{ picks: Record<Role, Scored>; score: number }> = []
  for (const freePicks of combinations(freeRoles, pools)) {
    const picks = { ...fixedByRole, ...freePicks } as Record<Role, Scored>
    const chosen = freeRoles.map((role) => picks[role])
    if (!isDistinct(chosen)) continue
    combos.push({ picks, score: average(chosen.map((pick) => pick.score)) })
  }

  combos.sort(
    (first, second) =>
      second.score - first.score ||
      comboKey(first.picks).localeCompare(comboKey(second.picks)),
  )

  // 固定件越多，自由角色越少；阈值跟着降，避免备选只换点缀。
  const repeatLimit = Math.min(3, freeRoles.length - 1)
  // 上衣锚点保留旧输出；裤子锚点要求每套备选都换一件上衣。
  const partnerRole: Role | null =
    anchor.role === 'pants' && !fixedByRole.top ? 'top' : null
  const chosen: typeof combos = []
  for (const combo of combos) {
    if (chosen.length >= wanted) break
    const repeatsTooMany = chosen.some(
      (picked) =>
        freeRoles.filter(
          (role) => picked.picks[role].color.id === combo.picks[role].color.id,
        ).length >= repeatLimit,
    )
    const partnerRepeats =
      partnerRole !== null &&
      chosen.some(
        (picked) =>
          picked.picks[partnerRole].color.id ===
          combo.picks[partnerRole].color.id,
      )
    if (!repeatsTooMany && !partnerRepeats) chosen.push(combo)
  }
  for (const combo of combos) {
    if (chosen.length >= wanted) break
    if (!chosen.includes(combo)) chosen.push(combo)
  }

  const batchCount = Math.max(1, Math.floor(chosen.length / BATCH_SIZE))
  const safeVariant = Math.min(Math.max(0, variant), batchCount - 1)
  const start = safeVariant * BATCH_SIZE

  return {
    combos: chosen
      .slice(start, start + BATCH_SIZE)
      .map(({ picks }) => toCombo(picks, anchor, fixedByRole)),
    batchCount,
  }
}

function avoidFor(
  anchorColor: ColorEntry,
  anchorRole: AnchorRole,
  fixed: ColorEntry[],
): Array<{ color: ColorEntry; reason: string }> {
  const fixedIds = new Set(fixed.map((color) => color.id))
  return COLORS.filter((color) => !fixedIds.has(color.id))
    .map((color) => ({ color, distance: deltaE(anchorColor.hex, color.hex) }))
    .filter(({ distance }) => distance < 10)
    .sort(
      (first, second) =>
        first.distance - second.distance ||
        first.color.id.localeCompare(second.color.id),
    )
    .slice(0, 4)
    .map(({ color, distance }) => ({
      color,
      reason: `与${anchorLabel(anchorRole)}太近（ΔE ${distance.toFixed(0)}），会糊成一片。`,
    }))
}

function pairNoteFor(top: ColorEntry, pants: ColorEntry): string | null {
  const distance = deltaE(top.hex, pants.hex)
  if (distance < 8) {
    return `两件已选色太接近（ΔE ${distance.toFixed(0)}），容易糊成一片。`
  }
  const lightness = Math.abs(toOklch(top.hex).l - toOklch(pants.hex).l)
  if (lightness < 0.08) {
    return `两件已选色明度接近（差 ${lightness.toFixed(2)}），上下装会缺少层次。`
  }
  return null
}

export function recommend(input: RecommendationInput): Recommendation {
  const roles = new Set(input.pieces.map((piece) => piece.role))
  if (
    input.pieces.length === 0 ||
    input.pieces.length > 2 ||
    roles.size !== input.pieces.length
  ) {
    throw new Error('recommend 需要 1–2 件不重复的固定单品')
  }

  const season = resolveSeason(input)
  const fixedByRole: Partial<Record<Role, Scored>> = {}
  for (const piece of input.pieces) {
    fixedByRole[piece.role] = {
      color: piece.color,
      oklch: toOklch(piece.color.hex),
      score: 1,
    }
  }
  const fixed = Object.values(fixedByRole) as Scored[]
  const anchorPiece = input.pieces[0]
  const anchor = {
    role: anchorPiece.role,
    color: anchorPiece.color,
    oklch: toOklch(anchorPiece.color.hex),
  }
  const { combos, batchCount } = buildCombos(
    fixedByRole,
    fixed,
    anchor,
    season,
    input.gender,
    input.style ?? 'any',
    input.age ?? 'any',
    input.variant ?? 0,
  )
  const [primary, ...alternatives] = combos
  const top = primary.top.color
  const pants = primary.pants.color
  const key = classifyHarmony(top.hex, pants.hex)

  return {
    season,
    seasonLabel: SEASON_LABELS[season],
    top,
    pants,
    primary,
    alternatives,
    batchCount,
    avoid: avoidFor(
      input.pieces[0].color,
      input.pieces[0].role,
      input.pieces.map((piece) => piece.color),
    ),
    harmony: {
      key,
      label: HARMONY_LABELS[key],
      description: HARMONY_DESCRIPTIONS[key],
    },
    seasonNote: `季节基调：${SEASON_LABELS[season]}，${SEASON_REASONS[season]}。`,
    anchorRole: input.pieces[0].role,
    pairNote: input.pieces.length === 2 ? pairNoteFor(top, pants) : null,
  }
}
