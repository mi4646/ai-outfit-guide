import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import colorSource from './ColorStep.tsx?raw'
import genderSource from './GenderStep.tsx?raw'
import regionSource from './RegionStep.tsx?raw'
import { GenderStep } from './GenderStep'
import { StepIndicator } from './StepIndicator'

describe('StepIndicator', () => {
  it('renders five labels and disables steps whose prerequisites are missing', () => {
    const html = renderToStaticMarkup(
      <StepIndicator
        current="profile"
        canGo={(step) => step === 'profile' || step === 'gender'}
        onNavigate={() => {}}
      />,
    )

    for (const label of ['画像', '性别', '地区', '上衣', '配色']) {
      expect(html).toContain(label)
    }
    expect(html).toContain('aria-current="step"')
    expect((html.match(/disabled/g) ?? []).length).toBe(3)
  })

  it('enables every step for a complete state', () => {
    const html = renderToStaticMarkup(
      <StepIndicator
        current="result"
        canGo={() => true}
        onNavigate={() => {}}
      />,
    )
    expect((html.match(/disabled/g) ?? []).length).toBe(0)
  })
})

describe('step chrome', () => {
  it('derives step numbers instead of hardcoding /4', () => {
    for (const source of [genderSource, regionSource, colorSource]) {
      expect(source).not.toMatch(/Step \d \/ 4/)
      expect(source).toMatch(/stepNumber\(/)
    }
  })

  it('renders the back button and the derived step number', () => {
    const html = renderToStaticMarkup(
      <GenderStep
        value={null}
        onSelect={() => {}}
        onNext={() => {}}
        onBack={() => {}}
      />,
    )
    expect(html).toContain('返回')
    expect(html).toContain('Step 2 / 5')
  })
})
