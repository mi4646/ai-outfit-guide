import { describe, expect, it } from 'vitest'
import type { ColorEntry } from '../data/colors'
import { AGE_BANDS, STYLES } from './profile'
import {
  STEPS,
  canGo,
  parseState,
  resolveStep,
  stepNumber,
  toSearch,
} from './url-state'

const BLACK: ColorEntry = {
  id: 'black',
  name: '纯黑',
  hex: '#0b0b0b',
  family: 'neutral',
}

const state = (patch = {}) => ({
  gender: null,
  provinceId: null,
  month: 7,
  seasonOverride: null,
  top: null,
  age: 'any' as const,
  style: 'any' as const,
  step: 'profile' as const,
  ...patch,
})

describe('STEPS', () => {
  it('is the single five-step order', () => {
    expect(STEPS.map((step) => step.id)).toEqual([
      'profile',
      'gender',
      'region',
      'color',
      'result',
    ])
    expect(STEPS.map((step) => step.label)).toEqual([
      '画像',
      '性别',
      '地区',
      '上衣',
      '配色',
    ])
  })

  it('numbers steps from 1', () => {
    expect(stepNumber('profile')).toBe(1)
    expect(stepNumber('result')).toBe(5)
  })
})

describe('parseState / toSearch', () => {
  it('defaults missing a/f to any', () => {
    const parsed = parseState('?g=female&p=guangdong&c=0b0b0b')
    expect(parsed.age).toBe('any')
    expect(parsed.style).toBe('any')
  })

  it('accepts a valid a/f and round-trips 55-plus', () => {
    const parsed = parseState('?a=55-plus&f=commute')
    expect(parsed.age).toBe('55-plus')
    expect(parsed.style).toBe('commute')
    const url = toSearch({ ...state({ age: '55-plus', style: 'commute' }) })
    expect(url).toContain('a=55-plus')
    expect(url).toContain('f=commute')
  })

  it('rejects invalid values and a hand-written 55+', () => {
    expect(parseState('?a=55%2B').age).toBe('any')
    expect(parseState('?a=55+').age).toBe('any')
    expect(parseState('?f=street+').style).toBe('any')
    expect(parseState('?f=Commute').style).toBe('any')
    expect(parseState('?a=unknown&f=unknown').age).toBe('any')
    expect(parseState('?a=unknown&f=unknown').style).toBe('any')
  })

  it('omits any from the URL', () => {
    const url = toSearch({ ...state() })
    expect(url).not.toContain('a=')
    expect(url).not.toContain('f=')
  })

  it('accepts every declared id', () => {
    for (const age of AGE_BANDS) expect(parseState(`?a=${age}`).age).toBe(age)
    for (const style of STYLES) {
      expect(parseState(`?f=${style}`).style).toBe(style)
    }
  })
})

describe('resolveStep / canGo', () => {
  it('starts at profile with no gender', () => {
    expect(resolveStep({})).toBe('profile')
  })

  it('keeps an old complete result link on result', () => {
    expect(
      resolveStep({
        gender: 'female',
        provinceId: 'guangdong',
        top: BLACK,
        step: 'result',
      }),
    ).toBe('result')
  })

  it('keeps an explicit gender link on gender', () => {
    expect(resolveStep({ step: 'gender' })).toBe('gender')
  })

  it('falls back to the first missing step', () => {
    expect(resolveStep({ gender: 'female' })).toBe('region')
    expect(resolveStep({ gender: 'female', provinceId: 'guangdong' })).toBe(
      'color',
    )
  })

  it('enables earlier steps by prerequisite', () => {
    expect(canGo({}, 'profile')).toBe(true)
    expect(canGo({}, 'gender')).toBe(true)
    expect(canGo({ gender: 'female' }, 'region')).toBe(true)
    expect(canGo({}, 'region')).toBe(false)
    expect(
      canGo(
        { gender: 'female', provinceId: 'guangdong', top: BLACK },
        'result',
      ),
    ).toBe(true)
  })

  it('enables every step for a complete state', () => {
    const complete = {
      gender: 'female' as const,
      provinceId: 'guangdong',
      top: BLACK,
    }
    for (const step of ['profile', 'gender', 'region', 'color', 'result'] as const) {
      expect(canGo(complete, step)).toBe(true)
    }
  })
})
