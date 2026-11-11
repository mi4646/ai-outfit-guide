import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ColorEntry } from '../../data/colors'
import { Mannequin } from './Mannequin'
import { FIGURES, REGIONS } from './figures'

const RED: ColorEntry = {
  id: 'red',
  name: '正红',
  hex: '#c62828',
  family: 'warm',
}

describe('mannequin figures', () => {
  it('provides all five regions for both genders', () => {
    for (const gender of ['male', 'female'] as const) {
      for (const region of REGIONS) {
        expect(FIGURES[gender][region].length).toBeGreaterThan(0)
        expect(FIGURES[gender][region].every((path) => path.length > 8)).toBe(
          true,
        )
      }
    }
  })

  it('uses a different body path for male and female', () => {
    expect(FIGURES.male.body.join('')).not.toBe(FIGURES.female.body.join(''))
  })
})

describe('Mannequin', () => {
  it('renders every region and the selected top fill', () => {
    const html = renderToStaticMarkup(
      <Mannequin gender="female" colors={{ top: RED }} />,
    )

    for (const region of REGIONS) {
      expect(html).toContain(`data-region="${region}"`)
    }
    expect(html).toContain('fill:#c62828')
    expect(html).toContain('女装人形轮廓')
    expect(html).toContain('上衣 正红')
  })
})
