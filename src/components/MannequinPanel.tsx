import { lazy, Suspense, useMemo, useState } from 'react'
import type { ColorEntry } from '../data/colors'
import type { Season } from '../data/regions'
import type { Gender } from '../lib/recommend'
import { cn } from '../lib/utils'
import { Swatch } from './ColorSwatch'
import { Mannequin } from './mannequin/Mannequin'
import {
  REGIONS,
  REGION_LABELS,
  type MannequinRegion,
} from './mannequin/figures'
import { Mannequin3DBoundary, hasWebGL } from './mannequin3d/Boundary'
import { SEASON_LABELS } from './mannequin3d/scene'
import { Badge } from './ui/badge'
import { Card } from './ui/card'

const Mannequin3D = lazy(() => import('./mannequin3d/Mannequin3D'))

export type MannequinStatus = 'pending' | 'piece' | 'result'

interface MannequinPanelProps {
  gender: Gender
  season: Season
  colors: Partial<Record<MannequinRegion, ColorEntry>>
  status: MannequinStatus
}

const STATUS_LABELS: Record<MannequinStatus, string> = {
  pending: '待配色',
  piece: '已选单品',
  result: '今日配色',
}

export function MannequinPanel({
  gender,
  season,
  colors,
  status,
}: MannequinPanelProps) {
  const [activeRegion, setActiveRegion] = useState<MannequinRegion | null>(null)
  const canRender3D = useMemo(() => hasWebGL(), [])
  // 结果前的步骤收成吸顶条，结果步恢复完整卡片。
  const compact = status !== 'result'
  const summary = REGIONS.map((region) => {
    const color = colors[region]
    return `${REGION_LABELS[region]}${color ? ` ${color.name}` : '待配色'}`
  }).join('，')

  const fallback = (
    <Mannequin
      gender={gender}
      colors={colors}
      activeRegion={activeRegion}
      onRegionChange={setActiveRegion}
      className={cn(
        'w-auto shrink-0 lg:mx-auto lg:h-[420px]',
        compact ? 'h-[132px] sm:h-[200px]' : 'h-[240px] min-[360px]:h-[280px]',
      )}
    />
  )

  return (
    <Card
      className={cn('flex flex-col', compact ? 'p-3.5 sm:p-5' : 'p-4 sm:p-5')}
      data-testid="mannequin-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">配色预览</h2>
        <Badge variant={status === 'result' ? 'accent' : 'outline'}>
          {STATUS_LABELS[status]}
        </Badge>
      </div>

      <div
        className={cn(
          'flex items-center lg:block',
          compact ? 'mt-2.5 gap-2' : 'mt-3 gap-4',
        )}
      >
        {canRender3D ? (
          <div
            role="img"
            aria-label={`${SEASON_LABELS[season]}季人形轮廓：${summary}`}
            className={cn(
              'min-w-0 shrink-0 overflow-hidden lg:mx-auto lg:h-[420px] lg:w-[194px]',
              compact
                ? 'h-[132px] w-[64px] sm:h-[200px] sm:w-[92px]'
                : 'h-[240px] w-[110px] min-[360px]:h-[280px] min-[360px]:w-[129px]',
            )}
          >
            <Suspense fallback={fallback}>
              <Mannequin3DBoundary fallback={fallback}>
                <Mannequin3D
                  gender={gender}
                  season={season}
                  colors={colors}
                  activeRegion={activeRegion}
                  onRegionChange={setActiveRegion}
                />
              </Mannequin3DBoundary>
            </Suspense>
          </div>
        ) : (
          fallback
        )}

        <div
          className={cn(
            'min-w-0 flex-1 lg:mt-4',
            compact
              ? 'grid grid-cols-1 gap-x-2 min-[360px]:grid-cols-2 lg:block lg:space-y-0.5'
              : 'space-y-0.5',
          )}
        >
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
                  'flex min-h-11 w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-[11px] transition-colors',
                  active ? 'bg-muted' : 'hover:bg-muted/60',
                )}
              >
                {color ? (
                  <Swatch
                    color={color}
                    size="sm"
                    className={compact ? 'h-5 w-5' : undefined}
                  />
                ) : (
                  <span
                    className={cn(
                      'shrink-0 rounded-full border border-dashed border-border',
                      compact ? 'h-5 w-5' : 'h-7 w-7',
                    )}
                    aria-hidden="true"
                  />
                )}
                <span className="w-6 shrink-0 text-muted-foreground min-[360px]:w-7 lg:w-8">
                  {REGION_LABELS[region]}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {color?.name ?? '待配色'}
                </span>
                {color && (
                  <span className="hidden font-mono text-[11px] uppercase text-muted-foreground sm:inline">
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
