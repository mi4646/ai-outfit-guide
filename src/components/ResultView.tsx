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
}

function OutfitRow({ label, color, reason, main }: OutfitRowProps) {
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
          </p>
          <span className="font-mono text-[11px] uppercase text-muted-foreground">
            {color.hex}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
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
  gender: Gender
  provinceId: string
  age: AgeBand
  style: Style
  temperature: number | null
  onBack: () => void
  onRegion: () => void
  onReset: () => void
}

export function ResultView({
  recommendation,
  activeCombo,
  onActiveComboChange,
  gender,
  provinceId,
  age,
  style,
  temperature,
  onBack,
  onRegion,
  onReset,
}: ResultViewProps) {
  const result = recommendation
  const combos = [result.primary, ...result.alternatives]
  const combo = combos[activeCombo] ?? result.primary
  const harmonyKey = classifyHarmony(combo.top.color.hex, combo.pants.color.hex)
  const provinceName =
    getProvince(provinceId)?.name ??
    (provinceId === 'overseas' ? '海外' : '未选择地区')
  const note = profileNote(age, style)

  return (
    <div className="space-y-4" aria-live="polite">
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
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Your palette
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              你的今日配色
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {HARMONY_DESCRIPTIONS[harmonyKey]}
            </p>
            {note && (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {note}
              </p>
            )}
            {result.pairNote && (
              <p className="mt-2 text-sm leading-6 text-accent">
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
            />
            <OutfitRow
              label="裤子"
              color={combo.pants.color}
              reason={combo.pants.reason}
              main={result.anchorRole === 'pants'}
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
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">换一套</h3>
              <span className="text-xs text-muted-foreground">
                共 {combos.length} 套
              </span>
            </div>
            <div className="grid gap-2">
              {combos.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onActiveComboChange(index)}
                  aria-pressed={activeCombo === index}
                  aria-label={`方案 ${index + 1}：${item.inner.color.name}、${item.top.color.name}、${item.pants.color.name}、${item.shoes.color.name}、${item.accent.color.name}`}
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
                    方案 {index + 1}
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
              <div className="flex flex-wrap gap-2">
                {result.avoid.map((item) => (
                  <span
                    key={item.color.id}
                    title={item.reason}
                    aria-label={`${item.color.name}：${item.reason}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-xs"
                  >
                    <Swatch color={item.color} size="sm" />
                    {item.color.name}
                  </span>
                ))}
              </div>
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
        <Button variant="ghost" onClick={onReset}>
          重新开始
        </Button>
      </div>
    </div>
  )
}
