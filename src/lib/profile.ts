import type { ColorEntry, ColorFamily } from '../data/colors'
import type { Oklch } from './color'

export type AgeBand =
  | '18-24'
  | '25-34'
  | '35-44'
  | '45-54'
  | '55-plus'
  | 'any'

export type Style =
  | 'commute'
  | 'casual'
  | 'street'
  | 'minimal'
  | 'literary'
  | 'sport'
  | 'any'

export type ProfileRole = 'inner' | 'pants' | 'shoes' | 'accent'

export interface ProfileRow {
  family: Partial<Record<ColorFamily, number>>
  chroma: number
  tolerance: number
  accentChroma: number
  contrast: number
}

export const AGE_BANDS: readonly AgeBand[] = [
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55-plus',
  'any',
]

export const STYLES: readonly Style[] = [
  'commute',
  'casual',
  'street',
  'minimal',
  'literary',
  'sport',
  'any',
]

export const AGE_LABELS: Record<AgeBand, string> = {
  '18-24': '18-24',
  '25-34': '25-34',
  '35-44': '35-44',
  '45-54': '45-54',
  '55-plus': '55+',
  any: '不限',
}

export const STYLE_LABELS: Record<Style, string> = {
  commute: '通勤',
  casual: '休闲',
  street: '街头',
  minimal: '极简',
  literary: '文艺',
  sport: '运动',
  any: '不限',
}

export const STYLE_NOTES: Record<Exclude<Style, 'any'>, string> = {
  commute: '优先中性色与低饱和，点缀也克制。',
  casual: '多用大地色与中等饱和，整体放松。',
  street: '黑白灰打底，用高饱和点缀拉开对比。',
  minimal: '同色系与低饱和为主，点缀最少。',
  literary: '暖调与大地色为主，邻近色过渡。',
  sport: '亮色点缀，明度对比更清楚。',
}

export const AGE_NOTES: Record<Exclude<AgeBand, 'any'>, string> = {
  '18-24': '亮色与高对比更自由。',
  '25-34': '均衡，不额外调整。',
  '35-44': '中性色增多，降低高饱和。',
  '45-54': '更偏中性色，克制高饱和。',
  '55-plus': '明度对比为主，克制高饱和。',
}

export const STYLE_PROFILES: Record<Exclude<Style, 'any'>, ProfileRow> = {
  commute: {
    family: { neutral: 0.8, warm: -0.3, cool: 0.2, earth: 0.3 },
    chroma: 0.06,
    tolerance: 0.1,
    accentChroma: 0.1,
    contrast: 0.28,
  },
  casual: {
    family: { neutral: 0.3, warm: 0.2, cool: 0.1, earth: 0.8 },
    chroma: 0.08,
    tolerance: 0.12,
    accentChroma: 0.14,
    contrast: 0.2,
  },
  street: {
    family: { neutral: 0.8, warm: -0.2, cool: 0.1, earth: -0.5 },
    chroma: 0.05,
    tolerance: 0.12,
    accentChroma: 0.2,
    contrast: 0.32,
  },
  minimal: {
    family: { neutral: 0.9, warm: -0.5, cool: 0.2, earth: 0.2 },
    chroma: 0.03,
    tolerance: 0.08,
    accentChroma: 0.06,
    contrast: 0.18,
  },
  literary: {
    family: { neutral: 0.2, warm: 0.6, cool: -0.3, earth: 0.8 },
    chroma: 0.09,
    tolerance: 0.1,
    accentChroma: 0.12,
    contrast: 0.18,
  },
  sport: {
    family: { neutral: 0.6, warm: 0.1, cool: 0.2, earth: -0.4 },
    chroma: 0.06,
    tolerance: 0.14,
    accentChroma: 0.2,
    contrast: 0.34,
  },
}

export const AGE_PROFILES: Record<Exclude<AgeBand, 'any'>, ProfileRow | null> = {
  '18-24': {
    family: { neutral: 0, warm: 0.2, cool: 0, earth: 0 },
    chroma: 0.08,
    tolerance: 0.14,
    accentChroma: 0.2,
    contrast: 0.3,
  },
  '25-34': null,
  '35-44': {
    family: { neutral: 0.4, warm: 0, cool: 0, earth: 0.2 },
    chroma: 0.06,
    tolerance: 0.1,
    accentChroma: 0.14,
    contrast: 0.24,
  },
  '45-54': {
    family: { neutral: 0.6, warm: -0.2, cool: 0, earth: 0.2 },
    chroma: 0.04,
    tolerance: 0.09,
    accentChroma: 0.1,
    contrast: 0.26,
  },
  '55-plus': {
    family: { neutral: 0.7, warm: -0.3, cool: 0, earth: 0.2 },
    chroma: 0.03,
    tolerance: 0.08,
    accentChroma: 0.08,
    contrast: 0.3,
  },
}

export const PROFILE_AMPLITUDE = { style: 0.12, age: 0.08 }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function preferenceFor(
  color: ColorEntry,
  oklch: Oklch,
  role: ProfileRole,
  topL: number,
  row: ProfileRow | null,
): number {
  if (!row) return 0

  const familyBias = row.family[color.family] ?? 0
  const target = role === 'accent' ? row.accentChroma : row.chroma
  const chromaFit =
    clamp(1 - Math.abs(oklch.c - target) / row.tolerance, 0, 1) * 2 - 1
  const contrastFit =
    clamp(
      1 - Math.abs(Math.abs(oklch.l - topL) - row.contrast) / 0.3,
      0,
      1,
    ) *
      2 -
    1

  return clamp(
    0.4 * familyBias + 0.45 * chromaFit + 0.15 * contrastFit,
    -1,
    1,
  )
}

export function profileNote(age: AgeBand, style: Style): string | null {
  const parts: string[] = []
  if (style !== 'any') {
    parts.push(`${STYLE_LABELS[style]}：${STYLE_NOTES[style].replace(/。$/, '')}`)
  }
  if (age !== 'any') {
    parts.push(`${AGE_LABELS[age]}：${AGE_NOTES[age].replace(/。$/, '')}`)
  }
  return parts.length > 0 ? parts.join('；') : null
}
