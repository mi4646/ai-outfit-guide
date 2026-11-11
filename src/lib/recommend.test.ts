import { describe, expect, it } from 'vitest'
import type { ColorEntry } from '../data/colors'
import { COLORS } from '../data/colors'
import { deltaE, toOklch } from './color'
import { recommend } from './recommend'

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
