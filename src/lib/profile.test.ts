import { describe, expect, it } from 'vitest'
import type { ColorEntry } from '../data/colors'
import { toOklch } from './color'
import {
  AGE_BANDS,
  AGE_LABELS,
  AGE_PROFILES,
  STYLES,
  STYLE_LABELS,
  STYLE_NOTES,
  STYLE_PROFILES,
  preferenceFor,
  profileNote,
} from './profile'

const khakiNeutral: ColorEntry = {
  id: 'khaki',
  name: '卡其',
  hex: '#c2ae8c',
  family: 'neutral',
}
const khakiWarm: ColorEntry = { ...khakiNeutral, family: 'warm' }
const coral: ColorEntry = { id: 'coral', name: '珊瑚', hex: '#e07a5f', family: 'warm' }
const mist: ColorEntry = {
  id: 'mist-blue',
  name: '雾蓝',
  hex: '#a9c1d4',
  family: 'neutral',
}

describe('profile data', () => {
  it('exposes five age bands plus any', () => {
    expect(AGE_BANDS).toEqual(['18-24', '25-34', '35-44', '45-54', '55-plus', 'any'])
  })

  it('exposes six styles plus any', () => {
    expect(STYLES).toEqual([
      'commute',
      'casual',
      'street',
      'minimal',
      'literary',
      'sport',
      'any',
    ])
  })

  it('maps every id to a label and note', () => {
    for (const age of AGE_BANDS) expect(AGE_LABELS[age]).toBeTruthy()
    for (const style of STYLES) expect(STYLE_LABELS[style]).toBeTruthy()
    for (const style of STYLES.filter((s) => s !== 'any')) {
      expect(STYLE_NOTES[style]).toBeTruthy()
    }
  })
})

describe('preferenceFor', () => {
  it('returns zero for any and 25-34', () => {
    const o = toOklch('#c2ae8c')
    expect(preferenceFor(khakiNeutral, o, 'inner', 0.2, null)).toBe(0)
    expect(AGE_PROFILES['25-34']).toBeNull()
  })

  it('reads family from ColorEntry, not from hue', () => {
    const o = toOklch(khakiNeutral.hex)
    const neutral = preferenceFor(
      khakiNeutral,
      o,
      'inner',
      0.2,
      STYLE_PROFILES.commute,
    )
    const warm = preferenceFor(khakiWarm, o, 'inner', 0.2, STYLE_PROFILES.commute)
    expect(neutral).toBeGreaterThan(warm)
  })

  it('keeps every row and role within [-1, 1]', () => {
    const rows = [
      ...Object.values(STYLE_PROFILES),
      ...Object.values(AGE_PROFILES).filter((row) => row !== null),
    ]
    for (const row of rows) {
      for (const role of ['inner', 'pants', 'shoes', 'accent'] as const) {
        for (const color of [khakiNeutral, coral, mist]) {
          const value = preferenceFor(color, toOklch(color.hex), role, 0.2, row)
          expect(value).toBeGreaterThanOrEqual(-1)
          expect(value).toBeLessThanOrEqual(1)
        }
      }
    }
  })

  it('prefers high-chroma accent for street and low chroma for 55+', () => {
    const street = preferenceFor(
      coral,
      toOklch(coral.hex),
      'accent',
      0.2,
      STYLE_PROFILES.street,
    )
    const minimal = preferenceFor(
      coral,
      toOklch(coral.hex),
      'accent',
      0.2,
      STYLE_PROFILES.minimal,
    )
    expect(street).toBeGreaterThan(minimal)

    const older = preferenceFor(
      mist,
      toOklch(mist.hex),
      'inner',
      0.2,
      AGE_PROFILES['55-plus']!,
    )
    const younger = preferenceFor(
      mist,
      toOklch(mist.hex),
      'inner',
      0.2,
      AGE_PROFILES['18-24']!,
    )
    expect(older).toBeGreaterThan(younger)
  })
})

describe('profileNote', () => {
  it('is null when both are any', () => {
    expect(profileNote('any', 'any')).toBeNull()
  })

  it('names only the chosen dimension', () => {
    expect(profileNote('any', 'commute')).toContain('通勤')
    expect(profileNote('45-54', 'any')).toContain('45-54')
  })

  it('joins both with a Chinese semicolon and no doubled punctuation', () => {
    const note = profileNote('45-54', 'commute')
    expect(note).toBe(
      '通勤：优先中性色与低饱和，点缀也克制；45-54：更偏中性色，克制高饱和',
    )
    expect(note).not.toContain('。；')
  })
})
