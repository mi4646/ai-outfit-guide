import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import type { ColorEntry } from '../data/colors'
import { readableTextColor } from '../lib/color'
import { cn } from '../lib/utils'
import { RadioGroupItem } from './ui/radio-group'

const SIZES = {
  sm: 'h-7 w-7',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
} as const

interface SwatchProps {
  color: ColorEntry
  size?: keyof typeof SIZES
  className?: string
}

export function Swatch({ color, size = 'md', className }: SwatchProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-black/10 shadow-sm dark:border-white/15',
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: color.hex }}
    />
  )
}

interface ColorOptionProps
  extends Omit<ComponentProps<typeof RadioGroupItem>, 'value' | 'color'> {
  color: ColorEntry
}

export function ColorOption({ color, className, ...props }: ColorOptionProps) {
  const text = readableTextColor(color.hex)
  return (
    <RadioGroupItem
      value={color.id}
      aria-label={`${color.name} ${color.hex}`}
      title={`${color.name} ${color.hex}`}
      className={cn(
        'group flex h-11 w-11 items-center justify-center rounded-full border border-black/10 shadow-sm transition-transform hover:scale-105 data-[state=checked]:ring-2 data-[state=checked]:ring-ring data-[state=checked]:ring-offset-2 data-[state=checked]:ring-offset-background dark:border-white/15',
        className,
      )}
      style={{ backgroundColor: color.hex, color: text }}
      {...props}
    >
      <Check
        className="h-4 w-4 opacity-0 transition-opacity group-data-[state=checked]:opacity-100"
        strokeWidth={2.5}
      />
    </RadioGroupItem>
  )
}
