import { Check } from 'lucide-react'
import type { Step } from '../lib/url-state'
import { cn } from '../lib/utils'

const STEPS: Array<{ id: Step; label: string }> = [
  { id: 'gender', label: '性别' },
  { id: 'region', label: '地区' },
  { id: 'color', label: '上衣' },
  { id: 'result', label: '配色' },
]

interface StepIndicatorProps {
  current: Step
  onNavigate: (step: Step) => void
}

export function StepIndicator({ current, onNavigate }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === current)

  return (
    <nav aria-label="步骤" className="mb-6 flex items-center gap-2 sm:mb-8 sm:gap-3">
      {STEPS.map((step, index) => {
        const active = index === currentIndex
        const done = index < currentIndex
        const enabled = index <= currentIndex

        return (
          <div key={step.id} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={!enabled}
              onClick={() => onNavigate(step.id)}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2 py-1 text-xs transition-colors sm:px-3',
                active && 'bg-foreground text-background',
                done && 'text-foreground hover:bg-muted',
                !active && !done && 'text-muted-foreground',
                !enabled && 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full border text-[10px]',
                  active && 'border-transparent',
                  done && 'border-transparent bg-muted',
                )}
              >
                {done ? <Check className="h-3 w-3" strokeWidth={2.5} /> : index + 1}
              </span>
              <span className="whitespace-nowrap">{step.label}</span>
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
