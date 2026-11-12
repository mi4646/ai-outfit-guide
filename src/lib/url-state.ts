import { COLORS, customColor, type ColorEntry } from '../data/colors'
import { PROVINCES, type Season } from '../data/regions'
import type { AnchorRole, Gender } from './recommend'
import { AGE_BANDS, STYLES, type AgeBand, type Style } from './profile'

export type Step = 'profile' | 'gender' | 'region' | 'color' | 'result'

export interface AppState {
  gender: Gender | null
  provinceId: string | null
  month: number
  seasonOverride: Season | null
  top: ColorEntry | null
  pants: ColorEntry | null
  anchor: AnchorRole | null
  age: AgeBand
  style: Style
  step: Step
}

export interface StepDef {
  id: Step
  label: string
  requires: (state: Partial<AppState>) => boolean
}

export const STEPS: readonly StepDef[] = [
  { id: 'profile', label: '画像', requires: () => true },
  { id: 'gender', label: '性别', requires: () => true },
  { id: 'region', label: '地区', requires: (state) => Boolean(state.gender) },
  {
    id: 'color',
    label: '单品',
    requires: (state) => Boolean(state.gender && state.provinceId),
  },
  {
    id: 'result',
    label: '配色',
    requires: (state) =>
      Boolean(state.gender && state.provinceId && resolveAnchor(state)),
  },
]

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']

export function parseState(search: string): Partial<AppState> {
  const params = new URLSearchParams(search)

  const genderParam = params.get('g')
  const gender: Gender | null =
    genderParam === 'male' || genderParam === 'female' ? genderParam : null

  // 分享链接里的地区 id 必须先验真；未知 id 会让结果页按「未知地区」出一套配色。
  const provinceParam = params.get('p')
  const provinceId =
    provinceParam === 'overseas' ||
    PROVINCES.some((province) => province.id === provinceParam)
      ? provinceParam
      : null

  const monthRaw = Number(params.get('m'))
  const month =
    Number.isInteger(monthRaw) && monthRaw >= 1 && monthRaw <= 12
      ? monthRaw
      : undefined

  const seasonParam = params.get('s')
  const seasonOverride =
    seasonParam && SEASONS.includes(seasonParam as Season)
      ? (seasonParam as Season)
      : null

  const ageParam = params.get('a')
  const age: AgeBand = AGE_BANDS.includes(ageParam as AgeBand)
    ? (ageParam as AgeBand)
    : 'any'

  const styleParam = params.get('f')
  const style: Style = STYLES.includes(styleParam as Style)
    ? (styleParam as Style)
    : 'any'

  const top = parseColor(params.get('c'))
  const pants = parseColor(params.get('pc'))
  const anchor = parseAnchor(params.get('k'), top, pants)

  const stepParam = params.get('step')
  const step: Step | undefined =
    stepParam === 'profile' ||
    stepParam === 'gender' ||
    stepParam === 'region' ||
    stepParam === 'color' ||
    stepParam === 'result'
      ? stepParam
      : undefined

  return {
    gender,
    provinceId,
    month,
    seasonOverride,
    top,
    pants,
    anchor,
    age,
    style,
    step,
  }
}

function parseColor(value: string | null): ColorEntry | null {
  if (!value || !/^[0-9a-f]{6}$/i.test(value)) return null
  const hex = `#${value.toLowerCase()}`
  return (
    COLORS.find((color) => color.hex.toLowerCase() === hex) ??
    customColor(hex)
  )
}

function parseAnchor(
  requested: string | null,
  top: ColorEntry | null,
  pants: ColorEntry | null,
): AnchorRole | null {
  if (requested === 'pants' && pants) return 'pants'
  if (requested === 'top' && top) return 'top'
  if (top) return 'top'
  if (pants) return 'pants'
  return null
}

export function toSearch(state: AppState): string {
  const params = new URLSearchParams()
  if (state.gender) params.set('g', state.gender)
  if (state.provinceId) params.set('p', state.provinceId)
  params.set('m', String(state.month))
  if (state.seasonOverride) params.set('s', state.seasonOverride)
  if (state.top) params.set('c', state.top.hex.slice(1))
  if (state.pants) params.set('pc', state.pants.hex.slice(1))
  if (state.anchor === 'pants' && state.pants && state.top) {
    params.set('k', 'pants')
  }
  if (state.age !== 'any') params.set('a', state.age)
  if (state.style !== 'any') params.set('f', state.style)
  params.set('step', state.step)
  return `?${params.toString()}`
}

export function stepNumber(id: Step): number {
  return STEPS.findIndex((step) => step.id === id) + 1
}

export function canGo(state: Partial<AppState>, step: Step): boolean {
  return STEPS.find((item) => item.id === step)?.requires(state) ?? false
}

export function resolveAnchor(state: Partial<AppState>): AnchorRole | null {
  if (state.anchor === 'pants') return state.pants ? 'pants' : null
  if (state.anchor === 'top') return state.top ? 'top' : null
  if (state.top) return 'top'
  if (state.pants) return 'pants'
  return null
}

export function resolveStep(state: Partial<AppState>): Step {
  const requested = STEPS.find((step) => step.id === state.step)
  if (requested && requested.requires(state)) return requested.id
  if (!state.gender) return 'profile'
  if (!state.provinceId) return 'region'
  if (!resolveAnchor(state)) return 'color'
  return 'result'
}
