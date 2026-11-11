import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ProfileStep } from './ProfileStep'

const renderStep = (age: 'any' | '25-34' | '45-54', style: 'any' | 'commute') =>
  renderToStaticMarkup(
    <ProfileStep
      age={age}
      style={style}
      onAge={() => {}}
      onStyle={() => {}}
      onNext={() => {}}
    />,
  )

describe('ProfileStep', () => {
  it('renders two groups with 13 radio options and the default any selection', () => {
    const html = renderStep('any', 'any')

    expect(html.match(/role="radio"/g)).toHaveLength(13)
    expect((html.match(/aria-checked="true"/g) ?? []).length).toBe(2)
    expect(html).toContain('年龄与穿衣风格')
    expect(html).toContain('下一步')
    expect(html).toContain('aria-hidden="true"')
  })

  it('shows each note under its own group with its own description', () => {
    const html = renderStep('45-54', 'commute')

    expect(html).toContain('更偏中性色，克制高饱和。')
    expect(html).toContain('优先中性色与低饱和，点缀也克制。')
    expect((html.match(/aria-describedby="[^"]+"/g) ?? []).length).toBe(2)
  })

  it('keeps the 25-34 note visible when a style is also chosen', () => {
    const html = renderStep('25-34', 'commute')

    expect(html).toContain('均衡，不额外调整。')
  })
})
