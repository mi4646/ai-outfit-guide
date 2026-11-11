import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { ColorStep } from './components/ColorStep'
import { GenderStep } from './components/GenderStep'
import { ProfileStep } from './components/ProfileStep'
import {
  MannequinPanel,
  type MannequinStatus,
} from './components/MannequinPanel'
import type { MannequinRegion } from './components/mannequin/figures'
import { RegionStep } from './components/RegionStep'
import { ResultView } from './components/ResultView'
import { StepIndicator } from './components/StepIndicator'
import { ThemeToggle } from './components/ThemeToggle'
import type { ColorEntry } from './data/colors'
import { recommend } from './lib/recommend'
import type { AppState, Step } from './lib/url-state'
import { canGo, parseState, resolveStep, toSearch } from './lib/url-state'

function currentMonth(): number {
  return new Date().getMonth() + 1
}

function initialState(): AppState {
  const parsed = parseState(window.location.search)
  const month = parsed.month ?? currentMonth()
  return {
    gender: parsed.gender ?? null,
    provinceId: parsed.provinceId ?? null,
    month,
    seasonOverride: parsed.seasonOverride ?? null,
    top: parsed.top ?? null,
    age: parsed.age ?? 'any',
    style: parsed.style ?? 'any',
    step: resolveStep({ ...parsed, month }),
  }
}

export default function App() {
  const [state, setState] = useState<AppState>(initialState)
  const [activeCombo, setActiveCombo] = useState(0)
  const reduceMotion = useReducedMotion()

  const recommendation = useMemo(() => {
    if (!state.gender || !state.provinceId || !state.top) return null
    return recommend({
      gender: state.gender,
      provinceId: state.provinceId,
      month: state.month,
      top: state.top,
      season: state.seasonOverride ?? undefined,
      age: state.age,
      style: state.style,
    })
  }, [
    state.gender,
    state.provinceId,
    state.month,
    state.top,
    state.seasonOverride,
    state.age,
    state.style,
  ])

  const combos = recommendation
    ? [recommendation.primary, ...recommendation.alternatives]
    : []
  const activeComboData = combos[activeCombo] ?? recommendation?.primary ?? null

  const panelColors: Partial<Record<MannequinRegion, ColorEntry>> =
    state.step === 'result' && activeComboData && state.top
      ? {
          inner: activeComboData.inner.color,
          top: state.top,
          pants: activeComboData.pants.color,
          shoes: activeComboData.shoes.color,
          accent: activeComboData.accent.color,
        }
      : state.top
        ? { top: state.top }
        : {}

  const panelStatus: MannequinStatus =
    state.step === 'result' ? 'result' : state.top ? 'top' : 'pending'

  useEffect(() => {
    const url = `${window.location.pathname}${toSearch(state)}`
    window.history.replaceState(null, '', url)
  }, [state])

  function update(patch: Partial<AppState>) {
    setState((previous) => ({ ...previous, ...patch }))
  }

  function navigate(step: Step) {
    if (canGo(state, step)) update({ step })
  }

  function reset() {
    setActiveCombo(0)
    setState({
      gender: null,
      provinceId: null,
      month: currentMonth(),
      seasonOverride: null,
      top: null,
      age: 'any',
      style: 'any',
      step: 'profile',
    })
  }

  function renderStep() {
    if (state.step === 'profile') {
      return (
        <ProfileStep
          age={state.age}
          style={state.style}
          onAge={(age) => {
            setActiveCombo(0)
            update({ age })
          }}
          onStyle={(style) => {
            setActiveCombo(0)
            update({ style })
          }}
          onNext={() => update({ step: 'gender' })}
        />
      )
    }

    if (state.step === 'gender') {
      return (
        <GenderStep
          value={state.gender}
          onSelect={(gender) => update({ gender, step: 'region' })}
          onNext={() => navigate('region')}
          onBack={() => navigate('profile')}
        />
      )
    }

    if (state.step === 'region') {
      return (
        <RegionStep
          provinceId={state.provinceId}
          month={state.month}
          seasonOverride={state.seasonOverride}
          onProvince={(provinceId) => {
            setActiveCombo(0)
            update({ provinceId, seasonOverride: null })
          }}
          onSeason={(season) => {
            setActiveCombo(0)
            update({ seasonOverride: season })
          }}
          onAutoSeason={() => {
            setActiveCombo(0)
            update({ seasonOverride: null })
          }}
          onNext={() => update({ step: 'color' })}
          onBack={() => navigate('gender')}
        />
      )
    }

    if (state.step === 'color') {
      return (
        <ColorStep
          value={state.top}
          onSelect={(top) => {
            setActiveCombo(0)
            update({ top })
          }}
          onNext={() => update({ step: 'result' })}
          onBack={() => navigate('region')}
        />
      )
    }

    if (
      state.step === 'result' &&
      recommendation &&
      state.gender &&
      state.provinceId
    ) {
      return (
        <ResultView
          recommendation={recommendation}
          activeCombo={activeCombo}
          onActiveComboChange={setActiveCombo}
          gender={state.gender}
          provinceId={state.provinceId}
          age={state.age}
          style={state.style}
          onBack={() => update({ step: 'color' })}
          onRegion={() => update({ step: 'region' })}
          onReset={reset}
        />
      )
    }

    return (
      <GenderStep
        value={state.gender}
        onSelect={(gender) => update({ gender, step: 'region' })}
        onNext={() => navigate('region')}
        onBack={() => navigate('profile')}
      />
    )
  }

  return (
    <div className="min-h-dvh">
      <div
        aria-hidden="true"
        className="page-glow pointer-events-none fixed inset-x-0 top-0 -z-10 h-72"
      />
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col">
        <header className="flex items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex -space-x-1.5" aria-hidden="true">
              {['#b5432f', '#c99a2e', '#1f2a44', '#f6f1e7'].map((hex) => (
                <span
                  key={hex}
                  className="h-4 w-4 rounded-full ring-1 ring-black/10 dark:ring-white/15"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </span>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
                Color Wardrobe
              </p>
              <h1 className="mt-0.5 text-lg font-semibold tracking-tight">
                穿搭配色指南
              </h1>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 px-4 pb-10 sm:px-6">
          <StepIndicator
            current={state.step}
            onNavigate={navigate}
            canGo={(step) => canGo(state, step)}
          />

          {state.step !== 'profile' &&
          state.step !== 'gender' &&
          state.gender ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={state.step}
                  className="min-w-0"
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="order-first self-start lg:order-last lg:sticky lg:top-6"
              >
                <MannequinPanel
                  gender={state.gender}
                  colors={panelColors}
                  status={panelStatus}
                />
              </motion.div>
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={state.step}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        <footer className="px-4 pb-8 text-[11px] leading-5 text-muted-foreground sm:px-6">
          基于色彩理论与气候季节规则 · 不构成专业造型建议
        </footer>
      </div>
    </div>
  )
}
