import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import type { ColorEntry } from '../data/colors'
import { getProvince } from '../data/regions'
import { classifyHarmony } from '../lib/color'
import {
  AGE_LABELS,
  STYLE_LABELS,
  profileNote,
  type AgeBand,
  type Style,
} from '../lib/profile'
import type { Gender, Recommendation } from '../lib/recommend'
import {
  HARMONY_DESCRIPTIONS,
  HARMONY_LABELS,
} from '../lib/recommend'
import { cn } from '../lib/utils'
import { Swatch } from './ColorSwatch'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'

const GENDER_LABELS: Record<Gender, string> = {
  male: '男装',
  female: '女装',
}

interface OutfitRowProps {
  label: string
  color: ColorEntry
  reason: string
  main?: boolean
  locked?: boolean
}

function OutfitRow({ label, color, reason, main, locked }: OutfitRowProps) {
  return (
    <div
      className={cn(
        'flex gap-4 rounded-2xl p-3 transition-colors',
        main && 'bg-muted/70',
      )}
    >
      <Swatch color={color} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-sm font-medium">
            {label} · {color.name}
            {locked && (
              <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                已锁定
              </span>
            )}
          </p>
          <span className="font-mono text-[11px] uppercase text-muted-foreground">
            {color.hex}
          </span>
        </div>
        <p className="mt-1 max-w-prose text-xs leading-5 text-muted-foreground">
          {reason}
        </p>
      </div>
    </div>
  )
}

interface ResultViewProps {
  recommendation: Recommendation
  activeCombo: number
  onActiveComboChange: (index: number) => void
  batchCount: number
  variant: number
  onSwap: () => void
  gender: Gender
  provinceId: string
  age: AgeBand
  style: Style
  lockedPieces: ReadonlyArray<'top' | 'pants'>
  temperature: number | null
  onBack: () => void
  onRegion: () => void
  onReset: () => void
}

export function ResultView({
  recommendation,
  activeCombo,
  onActiveComboChange,
  batchCount,
  variant,
  onSwap,
  gender,
  provinceId,
  age,
  style,
  lockedPieces,
  temperature,
  onBack,
  onRegion,
  onReset,
}: ResultViewProps) {
  const [confirmReset, setConfirmReset] = useState(false)
  const result = recommendation
  const combos = [result.primary, ...result.alternatives]
  const combo = combos[activeCombo] ?? result.primary
  const harmonyKey = classifyHarmony(combo.top.color.hex, combo.pants.color.hex)
  const provinceName =
    getProvince(provinceId)?.name ??
    (provinceId === 'overseas' ? '海外' : '未选择地区')
  const note = profileNote(age, style)

  return (
    <div className="space-y-4">
      <p className="sr-only" role="status">
        第 {variant + 1} 组 · {activeCombo === 0 ? '主方案' : `方案 ${activeCombo + 1}`}
      </p>
      <Card>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="accent">{result.seasonLabel}</Badge>
            {temperature !== null && (
              <Badge variant="outline">实时 {Math.round(temperature)}°C</Badge>
            )}
            <Badge variant="outline">{provinceName}</Badge>
            <Badge variant="outline">{GENDER_LABELS[gender]}</Badge>
            {style !== 'any' && (
              <Badge variant="outline">{STYLE_LABELS[style]}</Badge>
            )}
            {age !== 'any' && (
              <Badge variant="outline">{AGE_LABELS[age]}</Badge>
            )}
            <Badge>{HARMONY_LABELS[harmonyKey]}</Badge>
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight">你的今日配色</h2>
            <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
              {HARMONY_DESCRIPTIONS[harmonyKey]}
            </p>
            {note && (
              <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
                {note}
              </p>
            )}
            {result.pairNote && (
              <p className="mt-2 max-w-prose text-sm leading-6 text-accent">
                {result.pairNote}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <OutfitRow
              label="内搭"
              color={combo.inner.color}
              reason={combo.inner.reason}
            />
            <OutfitRow
              label="上衣"
              color={combo.top.color}
              reason={combo.top.reason}
              main={result.anchorRole === 'top'}
              locked={lockedPieces.includes('top')}
            />
            <OutfitRow
              label="裤子"
              color={combo.pants.color}
              reason={combo.pants.reason}
              main={result.anchorRole === 'pants'}
              locked={lockedPieces.includes('pants')}
            />
            <OutfitRow
              label="鞋"
              color={combo.shoes.color}
              reason={combo.shoes.reason}
            />
            <OutfitRow
              label="点缀"
              color={combo.accent.color}
              reason={combo.accent.reason}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <h3 className="text-sm font-semibold">方案</h3>
                <span className="text-[11px] text-muted-foreground">
                  第 {variant + 1} / {batchCount} 组
                </span>
              </div>
              <Button
                type="button"
                variant="accent"
                size="sm"
                onClick={onSwap}
                aria-label={`换一套方案（第 ${variant + 1} 组，共 ${batchCount} 组）`}
                className="h-11 sm:h-9"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                换一套
              </Button>
            </div>
            <div className="grid gap-2">
              {combos.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onActiveComboChange(index)}
                  aria-pressed={activeCombo === index}
                  aria-label={`${index === 0 ? '主方案' : `方案 ${index + 1}`}：${item.inner.color.name}、${item.top.color.name}、${item.pants.color.name}、${item.shoes.color.name}、${item.accent.color.name}`}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-2xl border p-3 text-left transition-colors',
                    activeCombo === index
                      ? 'border-accent bg-muted'
                      : 'border-border hover:bg-muted/60',
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {[item.inner, item.top, item.pants, item.shoes, item.accent].map(
                      (pick) => (
                        <Swatch key={pick.role} color={pick.color} size="sm" />
                      ),
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {index === 0 ? '主方案' : `方案 ${index + 1}`}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <h3 className="text-sm font-semibold">避开这些</h3>
            {result.avoid.length > 0 ? (
              <ul className="space-y-2.5">
                {result.avoid.map((item) => (
                  <li key={item.color.id} className="flex items-start gap-2.5">
                    <Swatch color={item.color} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium">{item.color.name}</p>
                      <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
                        {item.reason}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                这组搭配没有明显冲突色。
              </p>
            )}
            <p className="text-[11px] leading-5 text-muted-foreground">
              色彩建议基于色相、明度与季节规则，仅供搭配参考。
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onBack}>换一件已有单品</Button>
        <Button variant="outline" onClick={onRegion}>
          换个地区
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            if (confirmReset) onReset()
            else setConfirmReset(true)
          }}
          onBlur={() => setConfirmReset(false)}
        >
          {confirmReset ? '再点一次清空全部选择' : '重新开始'}
        </Button>
      </div>
    </div>
  )
}
