import { LoaderCircle, LocateFixed, MapPin } from 'lucide-react'
import { useState } from 'react'
import {
  PROVINCES,
  ZONES,
  getProvince,
  type Season,
  type ZoneId,
} from '../data/regions'
import { locate, seasonOf } from '../lib/season'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from './ui/card'

const SEASON_OPTIONS: Array<{ value: Season; label: string }> = [
  { value: 'spring', label: '春' },
  { value: 'summer', label: '夏' },
  { value: 'autumn', label: '秋' },
  { value: 'winter', label: '冬' },
]

interface RegionStepProps {
  provinceId: string | null
  month: number
  seasonOverride: Season | null
  onProvince: (provinceId: string) => void
  onSeason: (season: Season) => void
  onAutoSeason: () => void
  onNext: () => void
  onBack: () => void
}

export function RegionStep({
  provinceId,
  month,
  seasonOverride,
  onProvince,
  onSeason,
  onAutoSeason,
  onNext,
  onBack,
}: RegionStepProps) {
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'error' | 'done'>(
    'idle',
  )
  const [geoMessage, setGeoMessage] = useState('')

  const province = provinceId ? getProvince(provinceId) : undefined
  const zoneId: ZoneId | null = province?.zone ??
    (provinceId === 'overseas' ? 'overseas' : null)
  const autoSeason = zoneId ? seasonOf(zoneId, month) : null
  const effectiveSeason = seasonOverride ?? autoSeason

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setGeoStatus('error')
      setGeoMessage('当前浏览器不支持定位，请手动选择省份。')
      return
    }

    setGeoStatus('locating')
    setGeoMessage('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const result = locate(
          position.coords.latitude,
          position.coords.longitude,
          month,
        )
        onProvince(result.provinceId)
        onSeason(result.season)
        setGeoStatus('done')
        setGeoMessage(`已定位：${result.provinceName} · ${result.zoneName}`)
      },
      () => {
        setGeoStatus('error')
        setGeoMessage('浏览器未授权定位，请手动选择省份。')
      },
      { timeout: 8000, maximumAge: 600000 },
    )
  }

  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Step 2 / 4
          </p>
          <CardTitle>你在哪里过这个季节？</CardTitle>
          <CardDescription>
            地区决定气候带，再按当前月份估算春夏秋冬；估算不准可以手动改。
          </CardDescription>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="province"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            <MapPin className="h-3.5 w-3.5" />
            省份 / 地区
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              id="province"
              value={provinceId ?? ''}
              onChange={(event) => {
                onProvince(event.target.value)
                setGeoStatus('idle')
                setGeoMessage('')
              }}
              className="h-11 w-full rounded-full border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-accent"
            >
              <option value="" disabled>
                选择省份 / 地区
              </option>
              {ZONES.filter((zone) => zone.id !== 'overseas').map((zone) => (
                <optgroup key={zone.id} label={zone.name}>
                  {PROVINCES.filter((item) => item.zone === zone.id).map(
                    (item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ),
                  )}
                </optgroup>
              ))}
              <optgroup label="其他">
                <option value="overseas">海外（按纬度估算）</option>
              </optgroup>
            </select>

            <Button
              type="button"
              variant="outline"
              onClick={useMyLocation}
              disabled={geoStatus === 'locating'}
              className="shrink-0"
            >
              {geoStatus === 'locating' ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <LocateFixed className="h-4 w-4" />
              )}
              {geoStatus === 'locating' ? '定位中' : '使用我的位置'}
            </Button>
          </div>
          {geoMessage && (
            <p
              className={cn(
                'text-xs leading-5',
                geoStatus === 'error' ? 'text-accent' : 'text-muted-foreground',
              )}
              role="status"
            >
              {geoMessage}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              当前季节（按 {month} 月估算）
            </p>
            {seasonOverride && autoSeason && (
              <button
                type="button"
                onClick={onAutoSeason}
                className="text-xs text-accent underline-offset-4 hover:underline"
              >
                恢复自动（{SEASON_OPTIONS.find((item) => item.value === autoSeason)?.label}）
              </button>
            )}
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="季节"
          >
            {SEASON_OPTIONS.map((option) => {
              const active = effectiveSeason === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={!autoSeason}
                  onClick={() => onSeason(option.value)}
                  aria-pressed={active}
                  className={cn(
                    'h-10 min-w-14 rounded-full border px-4 text-sm transition-colors disabled:opacity-40',
                    active
                      ? 'border-accent bg-accent text-accent-foreground'
                      : 'border-border hover:bg-muted',
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
          {!autoSeason && (
            <p className="text-xs text-muted-foreground">
              先选地区，季节会自动带出来。
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" onClick={onBack}>
            返回
          </Button>
          <Button size="lg" onClick={onNext} disabled={!provinceId}>
            下一步
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
