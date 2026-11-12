import { useId } from 'react'
import { BRAND_STRIP_COLORS } from '../lib/brand'
import {
  AGE_BANDS,
  AGE_LABELS,
  AGE_NOTES,
  STYLES,
  STYLE_LABELS,
  STYLE_NOTES,
  type AgeBand,
  type Style,
} from '../lib/profile'
import { STEPS, stepNumber } from '../lib/url-state'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from './ui/card'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'

interface OptionGroupProps<T extends string> {
  label: string
  value: T
  options: readonly T[]
  labels: Record<T, string>
  onChange: (value: T) => void
  note?: { id: string; text: string }
}

function OptionGroup<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
  note,
}: OptionGroupProps<T>) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <RadioGroup
        aria-label={label}
        aria-describedby={note?.id}
        value={value}
        onValueChange={(next) => onChange(next as T)}
        className="flex flex-wrap gap-2"
      >
        {options.map((option) => (
          <RadioGroupItem
            key={option}
            value={option}
            className={cn(
              'h-11 min-w-14 rounded-full border border-border px-4 text-sm transition-colors hover:bg-muted',
              'data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
          >
            {labels[option]}
          </RadioGroupItem>
        ))}
      </RadioGroup>
      {note && (
        <p id={note.id} className="text-xs leading-5 text-muted-foreground">
          {note.text}
        </p>
      )}
    </div>
  )
}

export interface ProfileStepProps {
  age: AgeBand
  style: Style
  onAge: (age: AgeBand) => void
  onStyle: (style: Style) => void
  onNext: () => void
}

export function ProfileStep({
  age,
  style,
  onAge,
  onStyle,
  onNext,
}: ProfileStepProps) {
  const ageNoteId = useId()
  const styleNoteId = useId()
  const ageNote = age !== 'any' ? AGE_NOTES[age] : null
  const styleNote = style !== 'any' ? STYLE_NOTES[style] : null

  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div aria-hidden="true" className="flex gap-1.5">
            {BRAND_STRIP_COLORS.map((hex) => (
              <span
                key={hex}
                className="h-1 w-6 rounded-full ring-1 ring-black/10 dark:ring-white/15"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Step {stepNumber('profile')} / {STEPS.length}
          </p>
          <CardTitle>年龄与穿衣风格</CardTitle>
          <CardDescription>只做轻微偏好调整，随时可以改。</CardDescription>
        </div>

        <OptionGroup
          label="年龄段"
          value={age}
          options={AGE_BANDS}
          labels={AGE_LABELS}
          onChange={onAge}
          note={ageNote ? { id: ageNoteId, text: ageNote } : undefined}
        />

        <OptionGroup
          label="穿衣风格"
          value={style}
          options={STYLES}
          labels={STYLE_LABELS}
          onChange={onStyle}
          note={styleNote ? { id: styleNoteId, text: styleNote } : undefined}
        />

        <div className="flex justify-end">
          <Button size="lg" onClick={onNext}>
            下一步
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
