import { useState } from 'react'
import type { ColorEntry } from '../data/colors'
import type { Gender } from '../lib/recommend'
import { cn } from '../lib/utils'
import { Swatch } from './ColorSwatch'
import { Mannequin } from './mannequin/Mannequin'
import {
  REGIONS,
  REGION_LABELS,
  type MannequinRegion,
} from './mannequin/figures'
import { Badge } from './ui/badge'
import { Card } from './ui/card'

export type MannequinStatus = 'pending' | 'top' | 'result'

interface MannequinPanelProps {
  gender: Gender
  colors: Partial<Record<MannequinRegion, ColorEntry>>
  status: MannequinStatus
}

const STATUS_LABELS: Record<MannequinStatus, string> = {
  pending: '待配色',
  top: '已选上衣',
  result: '今日配色',
}

export function MannequinPanel({
  gender,
  colors,
  status,
}: MannequinPanelProps) {
  const [activeRegion, setActiveRegion] = useState<MannequinRegion | null>(null)

  return (
    <Card className="flex flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">配色预览</h2>
        <Badge variant={status === 'result' ? 'accent' : 'outline'}>
          {STATUS_LABELS[status]}
        </Badge>
      </div>

      <div className="mt-3 flex items-center gap-4 lg:block">
        <Mannequin
          gender={gender}
          colors={colors}
          activeRegion={activeRegion}
          onRegionChange={setActiveRegion}
          className="h-[280px] w-auto shrink-0 lg:mx-auto lg:h-[420px]"
        />

        <div className="min-w-0 flex-1 space-y-0.5 lg:mt-4">
          {REGIONS.map((region) => {
            const color = colors[region]
            const active = activeRegion === region

            return (
              <button
                key={region}
                type="button"
                onMouseEnter={() => setActiveRegion(region)}
                onMouseLeave={() => setActiveRegion(null)}
                onFocus={() => setActiveRegion(region)}
                onBlur={() => setActiveRegion(null)}
                onClick={() => setActiveRegion(region)}
                aria-label={`${REGION_LABELS[region]}：${color?.name ?? '待配色'}`}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-[11px] transition-colors',
                  active ? 'bg-muted' : 'hover:bg-muted/60',
                )}
              >
                {color ? (
                  <Swatch color={color} size="sm" />
                ) : (
                  <span
                    className="h-7 w-7 shrink-0 rounded-full border border-dashed border-border"
                    aria-hidden="true"
                  />
                )}
                <span className="w-8 shrink-0 text-muted-foreground">
                  {REGION_LABELS[region]}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {color?.name ?? '待配色'}
                </span>
                {color && (
                  <span className="hidden font-mono text-[10px] uppercase text-muted-foreground min-[360px]:inline">
                    {color.hex}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
