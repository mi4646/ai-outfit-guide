import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ColorEntry } from '../data/colors'
import type { AnchorRole } from '../lib/recommend'
import { ColorStep } from './ColorStep'

const BLACK: ColorEntry = {
  id: 'black',
  name: '纯黑',
  hex: '#0b0b0b',
  family: 'neutral',
}

const render = (props: {
  anchor: AnchorRole | null
  top: ColorEntry | null
  pants: ColorEntry | null
}) =>
  renderToStaticMarkup(
    <ColorStep
      {...props}
      onAnchor={() => {}}
      onSelect={() => {}}
      onClear={() => {}}
      onNext={() => {}}
      onBack={() => {}}
    />,
  )

describe('ColorStep', () => {
  it('asks for a category before showing any color grid', () => {
    const html = render({ anchor: null, top: null, pants: null })

    expect(html).toContain('先选一件你已有的单品')
    expect(html).not.toContain('颜色分类')
  })

  it('keeps the next button disabled until the anchor has a color', () => {
    const before = render({ anchor: 'top', top: null, pants: null })
    const after = render({ anchor: 'top', top: BLACK, pants: null })

    expect(before).toMatch(/\sdisabled=""[^>]*>查看搭配/)
    expect(after).not.toMatch(/\sdisabled=""[^>]*>查看搭配/)
  })

  it('reveals the optional second piece only after the anchor color is chosen', () => {
    const before = render({ anchor: 'top', top: null, pants: null })
    const after = render({ anchor: 'top', top: BLACK, pants: null })

    expect(before).not.toContain('再加一件我已有的')
    expect(after).toContain('再加一件我已有的')
  })

  it('keeps a previously selected piece visible when the anchor has no color', () => {
    const html = render({ anchor: 'pants', top: BLACK, pants: null })

    expect(html).toContain('再加一件我已有的')
    expect(html).toContain('纯黑')
    expect(html).toContain('移除')
  })

  it('labels the color group by the anchor role', () => {
    const html = render({ anchor: 'pants', top: null, pants: BLACK })

    expect(html).toContain('aria-label="裤子颜色"')
    expect(html).toContain('aria-label="选择自定义裤子颜色"')
  })

  it('offers the other role as the second piece', () => {
    const html = render({ anchor: 'pants', top: null, pants: BLACK })

    expect(html).toContain('再加一件我已有的')
    expect(html).toContain('添加一件上衣')
  })
})
