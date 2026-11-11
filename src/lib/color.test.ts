import { describe, expect, it } from 'vitest'
import {
  classifyHarmony,
  deltaE,
  hueDistance,
  readableTextColor,
  toOklch,
} from './color'

describe('toOklch', () => {
  it('maps white to full lightness and zero chroma', () => {
    const white = toOklch('#ffffff')
    expect(white.l).toBeCloseTo(1, 2)
    expect(white.c).toBeCloseTo(0, 3)
  })

  it('maps black to zero lightness', () => {
    const black = toOklch('#000000')
    expect(black.l).toBeCloseTo(0, 2)
    expect(black.c).toBeCloseTo(0, 3)
  })

  it('keeps a dark navy dark and slightly chromatic', () => {
    const navy = toOklch('#1f2a44')
    expect(navy.l).toBeCloseTo(0.29, 2)
    expect(navy.c).toBeGreaterThan(0.03)
    expect(navy.h).toBeCloseTo(266, 0)
  })
})

describe('readableTextColor', () => {
  it('uses dark text on white', () => {
    expect(readableTextColor('#ffffff')).toBe('#000000')
  })

  it('uses light text on black', () => {
    expect(readableTextColor('#000000')).toBe('#ffffff')
  })
})

describe('hueDistance', () => {
  it('takes the short way around the wheel', () => {
    expect(hueDistance(350, 10)).toBe(20)
    expect(hueDistance(10, 350)).toBe(20)
  })
})

describe('deltaE', () => {
  it('is zero for the same color', () => {
    expect(deltaE('#ffffff', '#ffffff')).toBeCloseTo(0, 5)
  })
})

describe('classifyHarmony', () => {
  it('treats an achromatic color as neutral', () => {
    expect(classifyHarmony('#ff0000', '#ffffff')).toBe('neutral')
  })

  it('classifies the same hue as monochrome', () => {
    expect(classifyHarmony('#ff0000', '#ff0000')).toBe('monochrome')
  })

  it('classifies a 30 degree step as analogous', () => {
    expect(classifyHarmony('#ff0000', '#ff8000')).toBe('analogous')
  })

  it('classifies a 120 degree step as triadic', () => {
    expect(classifyHarmony('#ff0000', '#00ff00')).toBe('triadic')
  })

  it('classifies a 150 degree step as split complementary', () => {
    expect(classifyHarmony('#ff0000', '#00ffcc')).toBe('split')
  })

  it('classifies a 180 degree step as complementary', () => {
    expect(classifyHarmony('#ff0000', '#00ffff')).toBe('complementary')
  })
})
