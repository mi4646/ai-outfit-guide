import { describe, expect, it } from 'vitest'
import type { Season } from '../../data/regions'
import { OUTFITS, sceneFor } from './scene'

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']

describe('sceneFor', () => {
  it('maps every season to a complete outfit', () => {
    for (const season of SEASONS) {
      const spec = sceneFor('female', season)
      expect(spec).toBe(OUTFITS[season])
      expect(spec.sleeve).toBeTruthy()
      expect(spec.pant).toBeTruthy()
      expect(spec.shoe).toBeTruthy()
      expect(spec.accent).toBeTruthy()
    }
  })

  it('never shows short sleeves in autumn or winter', () => {
    expect(sceneFor('male', 'autumn').sleeve).toBe('long')
    expect(sceneFor('male', 'winter').sleeve).toBe('long')
  })

  it('uses a scarf in winter without adding a sixth region', () => {
    expect(sceneFor('female', 'winter').accent).toBe('scarf')
  })

  it('opens summer up with short sleeves and sandals', () => {
    expect(sceneFor('female', 'summer')).toEqual({
      sleeve: 'short',
      pant: 'short',
      shoe: 'sandal',
      accent: 'belt',
    })
  })
})
