import { COLORS, customColor, type ColorEntry } from '../data/colors'
import type { Season } from '../data/regions'
import type { Gender } from './recommend'

export type Step = 'gender' | 'region' | 'color' | 'result'

export interface AppState {
  gender: Gender | null
  provinceId: string | null
  month: number
  seasonOverride: Season | null
  top: ColorEntry | null
  step: Step
}

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']

export function parseState(search: string): Partial<AppState> {
  const params = new URLSearchParams(search)

  const genderParam = params.get('g')
  const gender: Gender | null =
    genderParam === 'male' || genderParam === 'female' ? genderParam : null

  const provinceId = params.get('p') || null

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

  const hexParam = params.get('c')
  let top: ColorEntry | null = null
  if (hexParam && /^[0-9a-f]{6}$/i.test(hexParam)) {
    const hex = `#${hexParam.toLowerCase()}`
    top =
      COLORS.find((color) => color.hex.toLowerCase() === hex) ??
      customColor(hex)
  }

  const stepParam = params.get('step')
  const step: Step | undefined =
    stepParam === 'gender' ||
    stepParam === 'region' ||
    stepParam === 'color' ||
    stepParam === 'result'
      ? stepParam
      : undefined

  return { gender, provinceId, month, seasonOverride, top, step }
}

export function toSearch(state: AppState): string {
  const params = new URLSearchParams()
  if (state.gender) params.set('g', state.gender)
  if (state.provinceId) params.set('p', state.provinceId)
  params.set('m', String(state.month))
  if (state.seasonOverride) params.set('s', state.seasonOverride)
  if (state.top) params.set('c', state.top.hex.slice(1))
  params.set('step', state.step)
  return `?${params.toString()}`
}

export function resolveStep(state: Partial<AppState>): Step {
  const complete = Boolean(state.gender && state.provinceId && state.top)
  if (state.step === 'result' && complete) return 'result'
  if (state.step === 'color' && state.gender && state.provinceId) return 'color'
  if (state.step === 'region' && state.gender) return 'region'
  if (state.step === 'gender') return 'gender'
  if (!state.gender) return 'gender'
  if (!state.provinceId) return 'region'
  if (!state.top) return 'color'
  return 'result'
}
