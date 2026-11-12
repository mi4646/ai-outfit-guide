import { Check } from 'lucide-react'
import { STEPS, type Step } from '../lib/url-state'
import { cn } from '../lib/utils'

interface StepIndicatorProps {
  current: Step
  onNavigate: (step: Step) => void
  canGo: (step: Step) => boolean
}

export function StepIndicator({
  current,
  onNavigate,
  canGo,
}: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === current)

  return (
    <nav
      aria-label="步骤"
      className="mb-6 flex items-center gap-1 sm:mb-8 sm:gap-3"
    >
      {STEPS.map((step, index) => {
        const active = index === currentIndex
        const done = index < currentIndex
        const enabled = canGo(step.id)

        return (
          <div
            key={step.id}
            className="flex flex-1 items-center gap-1 sm:gap-2"
          >
            <button
              type="button"
              disabled={!enabled}
              onClick={() => onNavigate(step.id)}
              aria-current={active ? 'step' : undefined}
              className={cn(
                // 44px 命中区，视觉胶囊保持紧凑。
                'group flex min-h-11 items-center text-[11px] sm:text-xs',
                !enabled && 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'flex items-center gap-1 rounded-full px-1 py-1 transition-colors sm:gap-1.5 sm:px-3',
                  active && 'bg-foreground text-background',
                  done && 'text-foreground group-hover:bg-muted',
                  !active && !done && 'text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full border text-[11px] sm:h-5 sm:w-5',
                    active && 'border-transparent',
                    done && 'border-transparent bg-muted',
                  )}
                >
                  {done ? <Check className="h-3 w-3" strokeWidth={2.5} /> : index + 1}
                </span>
                <span className="whitespace-nowrap">{step.label}</span>
              </span>
            </button>
            {index < STEPS.length - 1 && (
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
            )}
          </div>
        )
      })}
    </nav>
  )
}
