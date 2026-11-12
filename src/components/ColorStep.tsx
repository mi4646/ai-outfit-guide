import { useState } from 'react'
import {
  COLORS,
  customColor,
  type ColorEntry,
  type ColorFamily,
} from '../data/colors'
import type { AnchorRole } from '../lib/recommend'
import { STEPS, stepNumber } from '../lib/url-state'
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

const ROLE_LABELS: Record<AnchorRole, string> = {
  top: '上衣',
  pants: '裤子',
}

interface ColorPickerProps {
  value: ColorEntry | null
  colors: ColorEntry[]
  label: string
  onSelect: (color: ColorEntry) => void
}

function ColorPicker({ value, colors, label, onSelect }: ColorPickerProps) {
  const selectedCurated = Boolean(
    value && COLORS.some((color) => color.id === value.id),
  )
  const customHex =
    value && value.id.startsWith('custom-') ? value.hex : '#b5432f'

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border px-3 text-xs transition-colors hover:bg-muted">
          <input
            type="color"
            value={customHex}
            onChange={(event) => onSelect(customColor(event.target.value))}
            className="h-5 w-5 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0"
            aria-label={`选择自定义${label}颜色`}
          />
          自定义颜色
        </label>
      </div>

      <RadioGroup
        aria-label={`${label}颜色`}
        value={selectedCurated && value ? value.id : ''}
        onValueChange={(next) => {
          const color = COLORS.find((item) => item.id === next)
          if (color) onSelect(color)
        }}
        className="grid grid-cols-6 gap-x-2 gap-y-3 sm:grid-cols-10 sm:gap-x-3"
      >
        {colors.map((color) => (
          <div key={color.id} className="flex flex-col items-center gap-1">
            <ColorOption color={color} />
            <span className="w-11 truncate text-center text-[11px] leading-4 text-muted-foreground">
              {color.name}
            </span>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

interface ColorStepProps {
  anchor: AnchorRole | null
  top: ColorEntry | null
  pants: ColorEntry | null
  onAnchor: (role: AnchorRole) => void
  onSelect: (role: AnchorRole, color: ColorEntry) => void
  onClear: (role: AnchorRole) => void
  onNext: () => void
  onBack: () => void
}

export function ColorStep({
  anchor,
  top,
  pants,
  onAnchor,
  onSelect,
  onClear,
  onNext,
  onBack,
}: ColorStepProps) {
  const [family, setFamily] = useState<ColorFamily | 'all'>('all')
  const [secondOpen, setSecondOpen] = useState(false)

  const colors =
    family === 'all' ? COLORS : COLORS.filter((color) => color.family === family)
  const anchorColor = anchor === 'top' ? top : anchor === 'pants' ? pants : null
  const other: AnchorRole | null =
    anchor === 'top' ? 'pants' : anchor === 'pants' ? 'top' : null
  const otherColor = other === 'top' ? top : other === 'pants' ? pants : null

  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Step {stepNumber('color')} / {STEPS.length}
          </p>
          <CardTitle>你已经有哪一件？</CardTitle>
          <CardDescription>
            选一件已有的单品做锚点；也可以再锁一件，其余颜色交给规则来配。
          </CardDescription>
        </div>

        <div
          className="grid grid-cols-2 gap-2"
          role="group"
          aria-label="已有单品的品类"
        >
          {(['top', 'pants'] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => {
                setSecondOpen(false)
                onAnchor(role)
              }}
              aria-pressed={anchor === role}
              className={cn(
                'rounded-2xl border px-4 py-3 text-left transition-colors',
                anchor === role
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:bg-muted',
              )}
            >
              <span className="block text-sm font-medium">
                已有{ROLE_LABELS[role]}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                {role === 'top' ? '以它为主色配下装' : '以它为主色配上装'}
              </span>
            </button>
          ))}
        </div>

        {anchor ? (
          <>
            <section className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  锚点 · {ROLE_LABELS[anchor]}
                </p>
                {anchorColor && (
                  <span className="font-mono text-[11px] uppercase text-muted-foreground">
                    {anchorColor.hex}
                  </span>
                )}
              </div>

              {anchorColor && (
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
                  <Swatch color={anchorColor} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {anchorColor.name}
                    </p>
                    <p className="mt-0.5 font-mono text-xs uppercase text-muted-foreground">
                      {anchorColor.hex} · {FAMILY_LABELS[anchorColor.family]}
                    </p>
                  </div>
                </div>
              )}

              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-label="颜色分类"
              >
                {FAMILIES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFamily(item)}
                    aria-pressed={family === item}
                    className={cn(
                      'min-h-11 rounded-full px-3 text-xs transition-colors',
                      family === item
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {FAMILY_LABELS[item]}
                  </button>
                ))}
              </div>

              <ColorPicker
                value={anchorColor}
                colors={colors}
                label={ROLE_LABELS[anchor]}
                onSelect={(color) => onSelect(anchor, color)}
              />
            </section>

            {other && (anchorColor || otherColor) && (
              <section className="space-y-3 border-t border-border pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      再加一件我已有的（可选）
                    </p>
                    <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
                      锁定{ROLE_LABELS[other]}后，内搭、鞋与点缀会按两件一起配。
                    </p>
                  </div>
                  {otherColor && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onClear(other)
                        setSecondOpen(false)
                      }}
                    >
                      移除
                    </Button>
                  )}
                </div>

                {otherColor ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
                    <Swatch color={otherColor} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {otherColor.name}
                      </p>
                      <p className="mt-0.5 font-mono text-xs uppercase text-muted-foreground">
                        {otherColor.hex} · {FAMILY_LABELS[otherColor.family]}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSecondOpen((open) => !open)}
                    >
                      {secondOpen ? '收起' : '换一个'}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setSecondOpen((open) => !open)}
                  >
                    {secondOpen ? '收起' : `添加一件${ROLE_LABELS[other]}`}
                  </Button>
                )}

                {secondOpen && (
                  <ColorPicker
                    value={otherColor}
                    colors={colors}
                    label={ROLE_LABELS[other]}
                    onSelect={(color) => onSelect(other, color)}
                  />
                )}
              </section>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            先选一件你已有的单品，再挑颜色。
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" onClick={onBack}>
            返回
          </Button>
          <Button size="lg" onClick={onNext} disabled={!anchorColor}>
            查看搭配
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
