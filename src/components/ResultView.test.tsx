import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ColorEntry } from '../data/colors'
import { recommend } from '../lib/recommend'
import { ResultView } from './ResultView'

const BLACK: ColorEntry = {
  id: 'black',
  name: '纯黑',
  hex: '#0b0b0b',
  family: 'neutral',
}

const recommendation = recommend({
  gender: 'female',
  provinceId: 'guangdong',
  month: 7,
  pieces: [{ role: 'top', color: BLACK }],
})

const closePair = recommend({
  gender: 'female',
  provinceId: 'guangdong',
  month: 7,
  pieces: [
    { role: 'top', color: BLACK },
    { role: 'pants', color: BLACK },
  ],
})

const ORANGE: ColorEntry = {
  id: 'orange',
  name: '橙色',
  hex: '#d96b2b',
  family: 'warm',
}

const orangePants = recommend({
  gender: 'female',
  provinceId: 'guangdong',
  month: 7,
  pieces: [{ role: 'pants', color: ORANGE }],
})

const props = (profile: {
  age: 'any' | '45-54'
  style: 'any' | 'commute'
}) => ({
  recommendation,
  activeCombo: 0,
  onActiveComboChange: () => {},
  batchCount: recommendation.batchCount,
  variant: 0,
  onSwap: () => {},
  gender: 'female' as const,
  provinceId: 'guangdong',
  temperature: null,
  onBack: () => {},
  onRegion: () => {},
  onReset: () => {},
  ...profile,
})

describe('ResultView profile badges and note', () => {
  it('hides both badges and the note when both are any', () => {
    const html = renderToStaticMarkup(
      <ResultView {...props({ age: 'any', style: 'any' })} />,
    )
    expect(html).not.toContain('通勤')
    expect(html).not.toContain('45-54')
  })

  it('shows the style badge and note when a style is chosen', () => {
    const html = renderToStaticMarkup(
      <ResultView {...props({ age: 'any', style: 'commute' })} />,
    )
    expect(html).toContain('通勤')
    expect(html).toContain('通勤：优先中性色与低饱和')
  })

  it('shows the age badge and note when an age is chosen', () => {
    const html = renderToStaticMarkup(
      <ResultView {...props({ age: '45-54', style: 'any' })} />,
    )
    expect(html).toContain('45-54')
    expect(html).toContain('45-54：更偏中性色')
  })

  it('joins both with a semicolon', () => {
    const html = renderToStaticMarkup(
      <ResultView {...props({ age: '45-54', style: 'commute' })} />,
    )
    expect(html).toContain('；')
    expect(html).not.toContain('。；')
  })

  it('shows the live temperature badge when a reading exists', () => {
    const html = renderToStaticMarkup(
      <ResultView
        {...props({ age: 'any', style: 'any' })}
        temperature={26.4}
      />,
    )
    expect(html).toContain('实时 26°C')
  })

  it('warns when both fixed pieces are too close', () => {
    const html = renderToStaticMarkup(
      <ResultView
        {...props({ age: 'any', style: 'any' })}
        recommendation={closePair}
      />,
    )
    expect(html).toContain('太接近')
  })

  it('keeps the empty-avoid copy role-neutral', () => {
    expect(orangePants.avoid).toHaveLength(0)
    const html = renderToStaticMarkup(
      <ResultView
        {...props({ age: 'any', style: 'any' })}
        recommendation={orangePants}
      />,
    )
    expect(html).toContain('这组搭配没有明显冲突色')
    expect(html).not.toContain('这组上衣没有明显冲突色')
  })

  it('announces alternative swatches in the visible order', () => {
    const html = renderToStaticMarkup(
      <ResultView {...props({ age: 'any', style: 'any' })} />,
    )
    expect(html).toContain('方案 1：雾蓝、纯黑、沙色')
  })

  it('renders the swap button with its batch position', () => {
    const html = renderToStaticMarkup(
      <ResultView {...props({ age: 'any', style: 'any' })} />,
    )
    expect(html).toContain('备选方案')
    expect(html).toContain('换一套方案（第 1 组，共')
  })
})
