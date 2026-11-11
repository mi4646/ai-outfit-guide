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
  top: BLACK,
})

const props = (profile: {
  age: 'any' | '45-54'
  style: 'any' | 'commute'
}) => ({
  recommendation,
  activeCombo: 0,
  onActiveComboChange: () => {},
  gender: 'female' as const,
  provinceId: 'guangdong',
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
})
