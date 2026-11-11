import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { ColorEntry } from '../data/colors'
import { MannequinPanel } from './MannequinPanel'

vi.mock('./mannequin3d/Boundary', () => ({
  hasWebGL: () => false,
  Mannequin3DBoundary: () => null,
}))

const TOP: ColorEntry = {
  id: 'burnt-orange',
  name: '焦橙',
  hex: '#b4551f',
  family: 'warm',
}

describe('MannequinPanel fallback', () => {
  it('renders the SVG mannequin when WebGL is unavailable', () => {
    const html = renderToStaticMarkup(
      <MannequinPanel
        gender="female"
        season="autumn"
        colors={{ top: TOP }}
        status="top"
      />,
    )
    expect(html).toContain('女装人形轮廓')
    expect(html).toContain('焦橙')
    expect(html).not.toContain('<canvas')
  })
})
