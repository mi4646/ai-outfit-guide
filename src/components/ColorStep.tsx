import { useState } from 'react'
import {
  COLORS,
  customColor,
  type ColorEntry,
  type ColorFamily,
} from '../data/colors'
import { cn } from '../lib/utils'
import { ColorOption, Swatch } from './ColorSwatch'
import { Button } from './ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from './ui/card'
import { RadioGroup } from './ui/radio-group'

const FAMILY_LABELS: Record<ColorFamily | 'all', string> = {
  all: '全部',
  neutral: '中性',
  warm: '暖色',
  cool: '冷色',
  earth: '大地',
}

const FAMILIES: Array<ColorFamily | 'all'> = [
  'all',
  'neutral',
  'warm',
  'cool',
  'earth',
]

interface ColorStepProps {
  value: ColorEntry | null
  onSelect: (color: ColorEntry) => void
  onNext: () => void
  onBack: () => void
}

export function ColorStep({ value, onSelect, onNext, onBack }: ColorStepProps) {
  const [family, setFamily] = useState<ColorFamily | 'all'>('all')
  const filtered =
    family === 'all' ? COLORS : COLORS.filter((color) => color.family === family)
  const selectedCurated = Boolean(value && COLORS.some((color) => color.id === value.id))
  const customHex =
    value && value.id.startsWith('custom-') ? value.hex : '#b5432f'

  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Step 3 / 4
          </p>
          <CardTitle>选一件上衣的颜色</CardTitle>
          <CardDescription>
            先定主色，内搭、裤子、鞋与点缀会围绕它给出建议。
          </CardDescription>
        </div>

        <div className="flex min-h-20 items-center gap-3 rounded-2xl border border-border bg-background p-4">
          {value ? (
            <>
              <Swatch color={value} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{value.name}</p>
                <p className="mt-0.5 font-mono text-xs uppercase text-muted-foreground">
                  {value.hex} · {FAMILY_LABELS[value.family]}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">还没有选择颜色</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="颜色分类">
              {FAMILIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFamily(item)}
                  aria-pressed={family === item}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs transition-colors',
                    family === item
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  {FAMILY_LABELS[item]}
                </button>
              ))}
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:bg-muted">
              <input
                type="color"
                value={customHex}
                onChange={(event) => onSelect(customColor(event.target.value))}
                className="h-5 w-5 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0"
                aria-label="选择自定义颜色"
              />
              自定义颜色
            </label>
          </div>

          <RadioGroup
            value={selectedCurated && value ? value.id : ''}
            onValueChange={(next) => {
              const color = COLORS.find((item) => item.id === next)
              if (color) onSelect(color)
            }}
            className="grid grid-cols-6 gap-x-2 gap-y-3 sm:grid-cols-10 sm:gap-x-3"
          >
            {filtered.map((color) => (
              <div key={color.id} className="flex flex-col items-center gap-1">
                <ColorOption color={color} />
                <span className="w-11 truncate text-center text-[10px] leading-4 text-muted-foreground">
                  {color.name}
                </span>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" onClick={onBack}>
            返回
          </Button>
          <Button size="lg" onClick={onNext} disabled={!value}>
            查看搭配
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
