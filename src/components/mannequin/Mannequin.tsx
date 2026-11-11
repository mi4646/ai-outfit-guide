import type { CSSProperties } from 'react'
import type { ColorEntry } from '../../data/colors'
import type { Gender } from '../../lib/recommend'
import { cn } from '../../lib/utils'
import {
  FIGURES,
  MANNEQUIN_VIEWBOX,
  REGIONS,
  REGION_LABELS,
  type MannequinRegion,
} from './figures'

interface MannequinProps {
  gender: Gender
  colors: Partial<Record<MannequinRegion, ColorEntry>>
  activeRegion?: MannequinRegion | null
  onRegionChange?: (region: MannequinRegion | null) => void
  className?: string
}

export function Mannequin({
  gender,
  colors,
  activeRegion = null,
  onRegionChange,
  className,
}: MannequinProps) {
  const figure = FIGURES[gender]
  const summary = REGIONS.map((region) => {
    const color = colors[region]
    return `${REGION_LABELS[region]}${color ? ` ${color.name}` : '待配色'}`
  }).join('，')

  return (
    <svg
      viewBox={MANNEQUIN_VIEWBOX}
      role="img"
      aria-label={`${gender === 'male' ? '男装' : '女装'}人形轮廓：${summary}`}
      className={cn('block', className)}
      onMouseLeave={() => onRegionChange?.(null)}
    >
      <ellipse
        cx="120"
        cy="502"
        rx="56"
        ry="6"
        className="mannequin-shadow"
      />
      <g className="mannequin-body">
        {figure.body.map((path, index) => (
          <path key={index} d={path} />
        ))}
      </g>
      {REGIONS.map((region) => {
        const color = colors[region]
        const isPlaceholder = !color
        const isActive = activeRegion === region
        const style = color ? ({ fill: color.hex } as CSSProperties) : undefined

        return (
          <g
            key={region}
            data-region={region}
            className={cn(
              'mannequin-region',
              isPlaceholder && 'is-placeholder',
              region === 'accent' && 'is-accent',
              isActive && 'is-active',
            )}
            style={style}
            fillRule={region === 'top' ? 'evenodd' : undefined}
            onMouseEnter={() => onRegionChange?.(region)}
            onPointerDown={() => onRegionChange?.(region)}
          >
            {figure[region].map((path, index) => (
              <path key={index} d={path} />
            ))}
            {region === 'pants' && (
              <path d="M120 262 L120 306" className="mannequin-seam" />
            )}
            {region === 'accent' && (
              <path
                d="M116 250 L124 250 L124 262 L116 262 Z"
                className="mannequin-buckle"
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}
