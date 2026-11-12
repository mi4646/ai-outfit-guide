import { Shirt } from 'lucide-react'
import type { Gender } from '../lib/recommend'
import { STEPS, stepNumber } from '../lib/url-state'
import { Button } from './ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from './ui/card'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'

const OPTIONS: Array<{ value: Gender; label: string; note: string }> = [
  { value: 'male', label: '男装', note: '偏中性、低饱和，裤装更稳' },
  { value: 'female', label: '女装', note: '色彩范围更宽，可加暖调点缀' },
]

interface GenderStepProps {
  value: Gender | null
  onSelect: (gender: Gender) => void
  onNext: () => void
  onBack: () => void
}

export function GenderStep({
  value,
  onSelect,
  onNext,
  onBack,
}: GenderStepProps) {
  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Step {stepNumber('gender')} / {STEPS.length}
          </p>
          <CardTitle>先选一下性别</CardTitle>
          <CardDescription>
            不同性别的配色倾向略有差异，之后都可以改。
          </CardDescription>
        </div>

        <RadioGroup
          aria-label="性别"
          value={value ?? ''}
          onValueChange={(next) => onSelect(next as Gender)}
          className="grid gap-3 sm:grid-cols-2"
        >
          {OPTIONS.map((option) => (
            <RadioGroupItem
              key={option.value}
              value={option.value}
              className="group flex min-h-36 flex-col items-start justify-between gap-6 rounded-3xl border border-border bg-background p-5 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:border-accent data-[state=checked]:bg-muted"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-foreground transition-colors group-data-[state=checked]:bg-accent group-data-[state=checked]:text-accent-foreground">
                <Shirt className="h-5 w-5" />
              </span>
              <span className="space-y-1">
                <span className="block text-lg font-semibold">{option.label}</span>
                <span className="block text-sm leading-6 text-muted-foreground">
                  {option.note}
                </span>
              </span>
            </RadioGroupItem>
          ))}
        </RadioGroup>

        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" onClick={onBack}>
            返回
          </Button>
          <Button size="lg" onClick={onNext} disabled={!value}>
            下一步
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
