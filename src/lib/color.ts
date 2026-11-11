import { differenceCiede2000, oklch, wcagContrast } from 'culori'

export type HarmonyKey =
  | 'neutral'
  | 'monochrome'
  | 'analogous'
  | 'complementary'
  | 'split'
  | 'triadic'

export interface Oklch {
  l: number
  c: number
  h: number
}

export function toOklch(hex: string): Oklch {
  const color = oklch(hex)
  if (!color) throw new Error(`Invalid color: ${hex}`)
  return { l: color.l, c: color.c ?? 0, h: color.h ?? 0 }
}

export function readableTextColor(hex: string): '#000000' | '#ffffff' {
  return wcagContrast(hex, '#000000') >= wcagContrast(hex, '#ffffff')
    ? '#000000'
    : '#ffffff'
}

export function hueDistance(a: number, b: number): number {
  const distance = Math.abs(a - b) % 360
  return distance > 180 ? 360 - distance : distance
}

const ciede = differenceCiede2000()

export function deltaE(a: string, b: string): number {
  return ciede(a, b)
}

const TARGETS: Array<{ angle: number; key: HarmonyKey }> = [
  { angle: 0, key: 'monochrome' },
  { angle: 30, key: 'analogous' },
  { angle: 60, key: 'analogous' },
  { angle: 120, key: 'triadic' },
  { angle: 150, key: 'split' },
  { angle: 180, key: 'complementary' },
]

export function classifyHarmony(a: string, b: string): HarmonyKey {
  const first = toOklch(a)
  const second = toOklch(b)
  if (first.c < 0.04 || second.c < 0.04) return 'neutral'

  const distance = hueDistance(first.h, second.h)
  let best = TARGETS[0]
  for (const target of TARGETS) {
    if (Math.abs(distance - target.angle) < Math.abs(distance - best.angle)) {
      best = target
    }
  }
  return best.key
}
