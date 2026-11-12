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
import { getProvince, type Season } from './data/regions'
import { recommend, type Piece } from './lib/recommend'
import { locate, seasonFromMonth, seasonFromTemperature, seasonOf } from './lib/season'
import { BRAND_STRIP_COLORS } from './lib/brand'
import { cn } from './lib/utils'
import type { AppState, Step } from './lib/url-state'
import {
  canGo,
  parseState,
  resolveAnchor,
  resolveStep,
  toSearch,
} from './lib/url-state'
import { fetchWeather, type WeatherState } from './lib/weather'

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
    pants: parsed.pants ?? null,
    anchor: parsed.anchor ?? null,
    age: parsed.age ?? 'any',
    style: parsed.style ?? 'any',
    step: resolveStep({ ...parsed, month }),
  }
}

export default function App() {
  const [state, setState] = useState<AppState>(initialState)
  const [activeCombo, setActiveCombo] = useState(0)
  const [variant, setVariant] = useState(0)
  const [geoCoords, setGeoCoords] = useState<{
    lat: number
    lon: number
  } | null>(null)
  const [weather, setWeather] = useState<WeatherState>({
    key: null,
    status: 'idle',
    reading: null,
  })
  const [weatherAttempt, setWeatherAttempt] = useState(0)
  const reduceMotion = useReducedMotion()

  const coords = useMemo(() => {
    if (geoCoords) return geoCoords
    const province = state.provinceId
      ? getProvince(state.provinceId)
      : undefined
    return province ? { lat: province.lat, lon: province.lon } : null
  }, [geoCoords, state.provinceId])
  const weatherKey = coords
    ? `${coords.lat.toFixed(2)},${coords.lon.toFixed(2)}`
    : null

  useEffect(() => {
    if (!coords || !weatherKey) return

    let cancelled = false
    void fetchWeather(coords.lat, coords.lon).then((reading) => {
      if (cancelled) return
      setWeather({
        key: weatherKey,
        status: reading ? 'ok' : 'error',
        reading,
      })
    })
    return () => {
      cancelled = true
    }
  }, [coords, weatherKey, weatherAttempt])

  const currentWeather: WeatherState =
    weather.key === weatherKey
      ? weather
      : { key: weatherKey, status: weatherKey ? 'loading' : 'idle', reading: null }

  const calendarSeason = useMemo<Season>(() => {
    if (coords) return locate(coords.lat, coords.lon, state.month).season
    if (state.provinceId === 'overseas') {
      return seasonOf('overseas', state.month)
    }
    return seasonFromMonth(state.month)
  }, [coords, state.provinceId, state.month])

  const autoSeason = currentWeather.reading
    ? seasonFromTemperature(currentWeather.reading.apparentC, calendarSeason)
    : calendarSeason
  const panelSeason = state.seasonOverride ?? autoSeason

  const anchor = resolveAnchor(state)

  const recommendation = useMemo(() => {
    if (!state.gender || !state.provinceId || !anchor) return null

    const pieces: Piece[] = []
    const anchorColor = anchor === 'top' ? state.top : state.pants
    if (anchorColor) pieces.push({ role: anchor, color: anchorColor })
    const other = anchor === 'top' ? state.pants : state.top
    // 两件已选单品都锁定：换一套只重配其余三区。
    if (other)
      pieces.push({ role: anchor === 'top' ? 'pants' : 'top', color: other })

    return recommend({
      gender: state.gender,
      provinceId: state.provinceId,
      month: state.month,
      pieces,
      season: panelSeason,
      age: state.age,
      style: state.style,
      variant,
    })
  }, [
    state.gender,
    state.provinceId,
    state.month,
    state.top,
    state.pants,
    anchor,
    panelSeason,
    state.age,
    state.style,
    variant,
  ])

  const combos = recommendation
    ? [recommendation.primary, ...recommendation.alternatives]
    : []
  const activeComboData = combos[activeCombo] ?? recommendation?.primary ?? null

  const panelColors: Partial<Record<MannequinRegion, ColorEntry>> =
    state.step === 'result' && activeComboData
      ? {
          inner: activeComboData.inner.color,
          top: activeComboData.top.color,
          pants: activeComboData.pants.color,
          shoes: activeComboData.shoes.color,
          accent: activeComboData.accent.color,
        }
      : {
          ...(state.top ? { top: state.top } : {}),
          ...(state.pants ? { pants: state.pants } : {}),
        }

  const panelStatus: MannequinStatus =
    state.step === 'result'
      ? 'result'
      : state.top || state.pants
        ? 'piece'
        : 'pending'

  const lockedPieces = (['top', 'pants'] as const).filter((role) =>
    role === 'top' ? state.top : state.pants,
  )

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

  function resetCombos() {
    setActiveCombo(0)
    setVariant(0)
  }

  function swapBatch() {
    if (!recommendation) return
    setVariant((current) => (current + 1) % recommendation.batchCount)
    setActiveCombo(0)
  }

  function retryWeather() {
    if (!coords) return
    setWeather({ key: weatherKey, status: 'loading', reading: null })
    setWeatherAttempt((attempt) => attempt + 1)
  }

  function reset() {
    resetCombos()
    setGeoCoords(null)
    setState({
      gender: null,
      provinceId: null,
      month: currentMonth(),
      seasonOverride: null,
      top: null,
      pants: null,
      anchor: null,
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
            resetCombos()
            update({ age })
          }}
          onStyle={(style) => {
            resetCombos()
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
          autoSeason={state.provinceId ? autoSeason : null}
          weather={currentWeather}
          onProvince={(provinceId, coords) => {
            resetCombos()
            setGeoCoords(coords ?? null)
            update({ provinceId, seasonOverride: null })
          }}
          onSeason={(season) => {
            resetCombos()
            update({ seasonOverride: season })
          }}
          onAutoSeason={() => {
            resetCombos()
            update({ seasonOverride: null })
          }}
          onNext={() => update({ step: 'color' })}
          onBack={() => navigate('gender')}
          onRetryWeather={retryWeather}
        />
      )
    }

    if (state.step === 'color') {
      return (
        <ColorStep
          anchor={state.anchor}
          top={state.top}
          pants={state.pants}
          onAnchor={(anchor) => {
            resetCombos()
            update({ anchor })
          }}
          onSelect={(role, color) => {
            resetCombos()
            update(
              role === 'top'
                ? { top: color, anchor: state.anchor ?? role }
                : { pants: color, anchor: state.anchor ?? role },
            )
          }}
          onClear={(role) => {
            const otherColor = role === 'top' ? state.pants : state.top
            resetCombos()
            update(
              role === 'top'
                ? { top: null, anchor: otherColor ? 'pants' : state.anchor }
                : { pants: null, anchor: otherColor ? 'top' : state.anchor },
            )
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
          batchCount={recommendation.batchCount}
          variant={variant}
          onSwap={swapBatch}
          gender={state.gender}
          provinceId={state.provinceId}
          age={state.age}
          style={state.style}
          lockedPieces={lockedPieces}
          temperature={currentWeather.reading?.temperatureC ?? null}
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
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:text-background"
      >
        跳到主内容
      </a>
      <div
        aria-hidden="true"
        className="page-glow pointer-events-none fixed inset-x-0 top-0 -z-10 h-72"
      />
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col">
        <header className="flex items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex -space-x-1.5" aria-hidden="true">
              {BRAND_STRIP_COLORS.map((hex) => (
                <span
                  key={hex}
                  className="h-4 w-4 rounded-full ring-1 ring-black/10 dark:ring-white/15"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
                Color Wardrobe
              </p>
              <h1 className="mt-0.5 text-lg font-semibold tracking-tight">
                穿搭配色指南
              </h1>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main id="main" className="flex-1 px-4 pb-10 sm:px-6">
          <StepIndicator
            current={state.step}
            onNavigate={navigate}
            canGo={(step) => canGo(state, step)}
          />

          {state.step !== 'profile' &&
          state.step !== 'gender' &&
          state.gender ? (
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={cn(
                  // DOM 在前，手机上视觉与焦点顺序一致；桌面靠 order 排到右栏。
                  'self-start lg:order-last lg:sticky lg:top-6',
                  // 结果前的步骤：手机上收成吸顶条，选色时颜色一直看得见。
                  state.step !== 'result' && 'max-lg:sticky max-lg:top-0 max-lg:z-20',
                )}
              >
                <MannequinPanel
                  gender={state.gender}
                  season={panelSeason}
                  colors={panelColors}
                  status={panelStatus}
                />
              </motion.div>

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
