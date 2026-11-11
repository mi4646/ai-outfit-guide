import { describe, expect, it } from 'vitest'
import type { ColorEntry } from '../data/colors'
import { COLORS } from '../data/colors'
import { deltaE, toOklch } from './color'
import { recommend } from './recommend'
import type { OutfitCombo, Recommendation, Role } from './recommend'

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

const WHITE: ColorEntry = {
  id: 'white',
  name: '纯白',
  hex: '#ffffff',
  family: 'neutral',
}

describe('color data', () => {
  it('ships exactly 60 colors', () => {
    expect(COLORS).toHaveLength(60)
  })

  it('has unique ids and hex values', () => {
    expect(new Set(COLORS.map((color) => color.id)).size).toBe(COLORS.length)
    expect(new Set(COLORS.map((color) => color.hex.toLowerCase())).size).toBe(
      COLORS.length,
    )
  })

  it('has valid hex and family values', () => {
    for (const color of COLORS) {
      expect(color.hex).toMatch(/^#[0-9a-f]{6}$/i)
      expect(['neutral', 'warm', 'cool', 'earth']).toContain(color.family)
      expect(() => toOklch(color.hex)).not.toThrow()
    }
  })
})

describe('recommend', () => {
  it('derives summer from Guangdong in July', () => {
    const result = recommend({
      gender: 'female',
      provinceId: 'guangdong',
      month: 7,
      top: BLACK,
    })
    expect(result.season).toBe('summer')
  })

  it('picks a light inner layer under a black top in summer', () => {
    const result = recommend({
      gender: 'female',
      provinceId: 'guangdong',
      month: 7,
      top: BLACK,
    })
    expect(toOklch(result.primary.inner.color.hex).l).toBeGreaterThan(0.6)
  })

  it('never repeats the top color in any role', () => {
    const result = recommend({
      gender: 'female',
      provinceId: 'guangdong',
      month: 7,
      top: BLACK,
    })
    const picks = [
      result.primary.inner,
      result.primary.pants,
      result.primary.shoes,
      result.primary.accent,
    ]
    expect(picks.every((pick) => pick.color.id !== BLACK.id)).toBe(true)
  })

  it('keeps all four roles distinct', () => {
    const result = recommend({
      gender: 'male',
      provinceId: 'beijing',
      month: 1,
      top: RED,
    })
    const ids = [
      result.primary.inner.color.id,
      result.primary.pants.color.id,
      result.primary.shoes.color.id,
      result.primary.accent.color.id,
    ]
    expect(new Set(ids).size).toBe(4)
  })

  it('explains the inner layer with a lightness difference', () => {
    const result = recommend({
      gender: 'female',
      provinceId: 'shanghai',
      month: 4,
      top: WHITE,
    })
    expect(result.primary.inner.reason).toContain('明度差')
  })

  it('returns two alternatives and an avoid list', () => {
    const result = recommend({
      gender: 'female',
      provinceId: 'guangdong',
      month: 7,
      top: BLACK,
    })
    expect(result.alternatives).toHaveLength(2)
    expect(Array.isArray(result.avoid)).toBe(true)
  })

  it('is deterministic for the same input', () => {
    const input = {
      gender: 'female' as const,
      provinceId: 'guangdong',
      month: 7,
      top: BLACK,
    }
    expect(recommend(input)).toEqual(recommend(input))
  })

  it('keeps every pick perceptually distinct from the top', () => {
    const result = recommend({
      gender: 'male',
      provinceId: 'beijing',
      month: 1,
      top: RED,
    })
    const picks = [
      result.primary.inner,
      result.primary.pants,
      result.primary.shoes,
      result.primary.accent,
    ]
    for (const pick of picks) {
      expect(deltaE(RED.hex, pick.color.hex)).toBeGreaterThanOrEqual(3)
    }
  })

  it('honours a manual season override', () => {
    const result = recommend({
      gender: 'female',
      provinceId: 'guangdong',
      month: 7,
      top: BLACK,
      season: 'winter',
    })
    expect(result.season).toBe('winter')
  })
})

const GOLDEN = {
  season: 'summer',
  harmony: 'neutral',
  primary: [
    {
      role: 'inner',
      id: 'mist-blue',
      reason:
        '内搭选雾蓝：与上衣形成 0.65 明度差，中性安全；夏季用浅冷低饱和保持清爽。',
    },
    {
      role: 'pants',
      id: 'sand',
      reason:
        '裤子选沙色：与上衣形成 0.69 明度差，中性安全；夏季用浅冷低饱和保持清爽，下半身更稳。',
    },
    {
      role: 'shoes',
      id: 'ivory',
      reason:
        '鞋子选象牙：明度差 0.79，中性安全；夏季用浅冷低饱和保持清爽，收住整体。',
    },
    {
      role: 'accent',
      id: 'mustard',
      reason: '点缀选姜黄：与上衣色相相距 84°，小面积对比，约占 10%。',
    },
  ],
  alternatives: [
    ['ivory', 'sand', 'mist-blue', 'mustard'],
    ['mist-blue', 'oatmeal', 'ivory', 'coral'],
  ],
  avoid: [{ id: 'charcoal', reason: '与上衣太近（ΔE 5），会糊成一片。' }],
}

function signature(result: Recommendation) {
  const roles: Role[] = ['inner', 'pants', 'shoes', 'accent']
  const pick = (combo: OutfitCombo) =>
    roles.map((role) => ({
      role,
      id: combo[role].color.id,
      reason: combo[role].reason,
    }))
  return {
    season: result.season,
    harmony: result.harmony.key,
    primary: pick(result.primary),
    alternatives: result.alternatives.map((combo) =>
      roles.map((role) => combo[role].color.id),
    ),
    avoid: result.avoid.map((item) => ({
      id: item.color.id,
      reason: item.reason,
    })),
  }
}

describe('profile golden', () => {
  it('pins the current output for any/any', () => {
    const input = {
      gender: 'female' as const,
      provinceId: 'guangdong',
      month: 7,
      top: BLACK,
    }
    expect(signature(recommend(input))).toEqual(GOLDEN)
  })
})

describe('profile recommendations', () => {
  const base = {
    gender: 'female' as const,
    provinceId: 'guangdong',
    month: 7,
    top: BLACK,
  }

  it('keeps any/any identical to GOLDEN', () => {
    expect(signature(recommend({ ...base, age: 'any', style: 'any' }))).toEqual(
      GOLDEN,
    )
  })

  it('changes the outfit between commute and street', () => {
    const commute = signature(
      recommend({ ...base, age: 'any', style: 'commute' }),
    ).primary.map((pick) => pick.id)
    const street = signature(
      recommend({ ...base, age: 'any', style: 'street' }),
    ).primary.map((pick) => pick.id)
    expect(commute).not.toEqual(street)
  })

  it('changes the outfit between 18-24 and 55-plus', () => {
    const young = signature(
      recommend({ ...base, age: '18-24', style: 'any' }),
    ).primary.map((pick) => pick.id)
    const older = signature(
      recommend({ ...base, age: '55-plus', style: 'any' }),
    ).primary.map((pick) => pick.id)
    expect(young).not.toEqual(older)
  })

  it('promotes a profile-favoured color from outside the base top 8', () => {
    const result = recommend({ ...base, age: 'any', style: 'street' })
    const ids = [
      result.primary.inner.color.id,
      result.primary.pants.color.id,
      result.primary.shoes.color.id,
    ]
    expect(ids).toEqual(expect.arrayContaining(['denim', 'olive']))
  })

  it('does not clamp the ranking score', () => {
    const result = recommend({ ...base, age: '45-54', style: 'street' })
    expect(result.primary.shoes.score).toBeGreaterThan(1)
  })

  it('keeps the hard constraints across all 42 profiles', () => {
    const ages = [
      '18-24',
      '25-34',
      '35-44',
      '45-54',
      '55-plus',
      'any',
    ] as const
    const styles = [
      'commute',
      'casual',
      'street',
      'minimal',
      'literary',
      'sport',
      'any',
    ] as const
    for (const age of ages) {
      for (const style of styles) {
        const result = recommend({ ...base, age, style })
        const picks = [
          result.primary.inner,
          result.primary.pants,
          result.primary.shoes,
          result.primary.accent,
        ]
        expect(new Set(picks.map((pick) => pick.color.id)).size).toBe(4)
        for (const pick of picks) {
          expect(deltaE(BLACK.hex, pick.color.hex)).toBeGreaterThanOrEqual(3)
        }
        expect(result.alternatives).toHaveLength(2)
      }
    }
  })
})
