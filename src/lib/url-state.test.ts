import { describe, expect, it } from 'vitest'
import type { ColorEntry } from '../data/colors'
import { AGE_BANDS, STYLES } from './profile'
import {
  STEPS,
  canGo,
  parseState,
  resolveAnchor,
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

const RED: ColorEntry = {
  id: 'red',
  name: '正红',
  hex: '#c62828',
  family: 'warm',
}

const state = (patch = {}) => ({
  gender: null,
  provinceId: null,
  month: 7,
  seasonOverride: null,
  top: null,
  pants: null,
  anchor: null,
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
      '单品',
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

  it('derives a top anchor from the old c parameter', () => {
    const parsed = parseState('?c=0b0b0b')
    expect(parsed.top?.id).toBe('black')
    expect(parsed.pants).toBeNull()
    expect(parsed.anchor).toBe('top')
  })

  it('reads pc as the pants piece', () => {
    const parsed = parseState('?pc=c62828')
    expect(parsed.pants?.id).toBe('red')
    expect(parsed.top).toBeNull()
    expect(parsed.anchor).toBe('pants')
  })

  it('reads both pieces and an explicit pants anchor', () => {
    const parsed = parseState('?c=0b0b0b&pc=c62828&k=pants')
    expect(parsed.top?.id).toBe('black')
    expect(parsed.pants?.id).toBe('red')
    expect(parsed.anchor).toBe('pants')
  })

  it('ignores an anchor that has no piece', () => {
    expect(parseState('?c=0b0b0b&k=pants').anchor).toBe('top')
  })

  it('round-trips both pieces with a pants anchor', () => {
    const url = toSearch({
      ...state({ top: BLACK, pants: RED, anchor: 'pants' }),
    })
    expect(url).toContain('c=0b0b0b')
    expect(url).toContain('pc=c62828')
    expect(url).toContain('k=pants')
  })

  it('keeps a top-anchored pair free of the k parameter', () => {
    const url = toSearch({
      ...state({ top: BLACK, pants: RED, anchor: 'top' }),
    })
    expect(url).not.toContain('k=pants')
  })

  it('omits k when the pants anchor has no pants color', () => {
    const url = toSearch({
      ...state({ top: BLACK, pants: null, anchor: 'pants' }),
    })
    expect(url).not.toContain('k=pants')
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

  it('accepts a pants-only anchor for the result', () => {
    expect(
      resolveStep({
        gender: 'female',
        provinceId: 'guangdong',
        pants: RED,
        step: 'result',
      }),
    ).toBe('result')
    expect(
      canGo({ gender: 'female', provinceId: 'guangdong', pants: RED }, 'result'),
    ).toBe(true)
  })

  it('still requires at least one piece for the result', () => {
    expect(
      canGo({ gender: 'female', provinceId: 'guangdong' }, 'result'),
    ).toBe(false)
  })

  it('does not fall back when the selected anchor has no color', () => {
    expect(
      resolveAnchor({ anchor: 'pants', top: BLACK, pants: null }),
    ).toBeNull()
    expect(
      canGo(
        {
          gender: 'female',
          provinceId: 'guangdong',
          anchor: 'pants',
          top: BLACK,
          pants: null,
        },
        'result',
      ),
    ).toBe(false)
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
