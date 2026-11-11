# 年龄与穿衣风格画像步骤 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 在现有四步配色流程前加入「年龄 + 穿衣风格」画像步骤，让两项选择真实参与评分，同时保证旧分享链接的输出逐字不变。

**Architecture:** 新增纯函数模块 `src/lib/profile.ts` 承载画像类型、标签、规则表与偏好计算；`recommend.ts` 只在 `scoreColor` 内叠加两项加性偏好，基础分与权重表不动；`url-state.ts` 统一五步顺序与前置条件；UI 新增一个 `ProfileStep`，其余步骤补步骤编号与返回路径。

**Tech Stack:** React 19、TypeScript、Vite、Vitest、Tailwind CSS 4、Radix RadioGroup、culori。

**Spec:** `docs/superpowers/specs/2026-11-11-outfit-profile-steps-design.md`

**Status:** 已实现（2026-11-11，PR #1）

## Global Constraints

- 不新增任何依赖；复用现有 `RadioGroup`、`Card`、`Button`、`Badge`。
- 规则数值以 spec §4 两张表为准，逐格照抄，不重新调参。
- 年龄 URL id 用 `55-plus`，界面标签显示 `55+`；`any` 不写入 URL。
- `any` 与 `25-34` 的偏好恒为 0；`AGE_PROFILES['25-34'] = null`。
- 偏好计入 `scoreColor`，在 `candidatesFor` 排序与 `.slice(0, 8)` 之前；排名分不 clamp。
- 旧链接（无 `a`/`f`）结果必须与下面 GOLDEN 完全一致。
- 文案只用「偏好 / 更偏」，不写「适合」「显年轻」；不新增「3D / 体型 / 照片 / LLM」。
- 验证命令固定为 `pnpm test`、`pnpm --reporter=append-only run lint`、`pnpm build`。
- **未经用户明确开口，不执行 `git commit` / `git push`。** 每个任务末尾的 Commit 步骤只是逻辑边界，执行前先问。
- 不改 `MannequinPanel`、人台 SVG、主题 token。

## Review Focus

- **旧结果链接**：`?g=female&p=guangdong&m=7&c=0b0b0b&step=result` 必须直接进结果，配色与 GOLDEN 一致，不被拉回画像。
- **非法 URL 值**：`a=55+`、`a=unknown`、`f=street+`、大小写错误必须回落 `any`，不抛错、不白屏。
- **结果页改画像**：从结果页返回画像改风格再回来，推荐必须重算，且回到方案 1，不能出现「新徽章 + 旧配色」。
- **导航直达**：从结果页点指示器「画像」，改完后再点「配色」必须直接回结果，不需要连点四次「下一步」。
- **360px 密度**：5 步指示器与 13 个选项在 360px 不横向溢出；触控目标 ≥44px；两组方向键可用。

## File Structure

| 文件 | 责任 |
|---|---|
| `src/lib/profile.ts`（新增） | 画像类型、id、标签、说明、规则表、`preferenceFor`、`profileNote` |
| `src/lib/profile.test.ts`（新增） | 画像模块单测 |
| `src/lib/recommend.ts` | 扩展输入，在 `scoreColor` 内叠加画像偏好 |
| `src/lib/recommend.test.ts` | GOLDEN 回归、风格/年龄差异、42 组约束、池外提升 |
| `src/lib/url-state.ts` | 五步 `STEPS`、`stepNumber`、`canGo`、age/style 解析与序列化 |
| `src/lib/url-state.test.ts`（新增） | 旧链接、非法值、往返、步骤回退 |
| `src/components/ProfileStep.tsx`（新增） | 画像步骤 UI |
| `src/components/ProfileStep.test.tsx`（新增） | 13 个 radio、默认 any、标题/说明 |
| `src/components/StepIndicator.tsx` | 5 项、按 `canGo` 启用 |
| `src/components/StepIndicator.test.tsx`（新增） | 5 标签、启用/禁用 |
| `src/components/GenderStep.tsx` | 返回按钮、`Step 2 / 5` |
| `src/components/RegionStep.tsx` | `Step 3 / 5` |
| `src/components/ColorStep.tsx` | `Step 4 / 5` |
| `src/components/ResultView.tsx` | 年龄/风格徽章与整体说明 |
| `src/components/ResultView.test.tsx`（新增） | 四种组合的徽章/说明 |
| `src/App.tsx` | 状态接线、布局、reset、activeCombo、StepIndicator props |
| `PRODUCT.md`、`README.md`、`.impeccable/surfaces/src-app-tsx.md` | 文档同步 |

## Task 1: 画像模块

**Files:**
- Create: `src/lib/profile.ts`
- Test: `src/lib/profile.test.ts`

**Interfaces:**
- Consumes: `ColorEntry`, `ColorFamily` from `../data/colors`; `Oklch` from `./color`.
- Produces:
  - `type AgeBand = '18-24' | '25-34' | '35-44' | '45-54' | '55-plus' | 'any'`
  - `type Style = 'commute' | 'casual' | 'street' | 'minimal' | 'literary' | 'sport' | 'any'`
  - `type ProfileRole = 'inner' | 'pants' | 'shoes' | 'accent'`（本地定义，避免 `profile.ts` 反向导入 `recommend.ts` 形成循环；与现有 `Role` 结构相同）
  - `interface ProfileRow { family: Partial<Record<ColorFamily, number>>; chroma: number; tolerance: number; accentChroma: number; contrast: number }`
  - `AGE_BANDS: readonly AgeBand[]`、`STYLES: readonly Style[]`
  - `AGE_LABELS: Record<AgeBand, string>`、`STYLE_LABELS: Record<Style, string>`
  - `STYLE_NOTES: Record<Exclude<Style, 'any'>, string>`、`AGE_NOTES: Record<Exclude<AgeBand, 'any'>, string>`
  - `STYLE_PROFILES: Record<Exclude<Style, 'any'>, ProfileRow>`
  - `AGE_PROFILES: Record<Exclude<AgeBand, 'any'>, ProfileRow | null>`
  - `PROFILE_AMPLITUDE: { style: 0.12; age: 0.08 }`
  - `preferenceFor(color: ColorEntry, oklch: Oklch, role: ProfileRole, topL: number, row: ProfileRow | null): number`
  - `profileNote(age: AgeBand, style: Style): string | null`

- [x] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import type { ColorEntry } from '../data/colors'
import { toOklch } from './color'
import {
  AGE_BANDS, AGE_LABELS, AGE_PROFILES, STYLES, STYLE_LABELS,
  STYLE_PROFILES, STYLE_NOTES, preferenceFor, profileNote,
} from './profile'

const khakiNeutral: ColorEntry = { id: 'khaki', name: '卡其', hex: '#c2ae8c', family: 'neutral' }
const khakiWarm: ColorEntry = { ...khakiNeutral, family: 'warm' }
const coral: ColorEntry = { id: 'coral', name: '珊瑚', hex: '#e07a5f', family: 'warm' }
const mist: ColorEntry = { id: 'mist-blue', name: '雾蓝', hex: '#a9c1d4', family: 'neutral' }

describe('profile data', () => {
  it('exposes five age bands plus any', () => {
    expect(AGE_BANDS).toEqual(['18-24', '25-34', '35-44', '45-54', '55-plus', 'any'])
  })
  it('exposes six styles plus any', () => {
    expect(STYLES).toEqual(['commute', 'casual', 'street', 'minimal', 'literary', 'sport', 'any'])
  })
  it('maps every id to a label and note', () => {
    for (const age of AGE_BANDS) expect(AGE_LABELS[age]).toBeTruthy()
    for (const style of STYLES) expect(STYLE_LABELS[style]).toBeTruthy()
    for (const style of STYLES.filter((s) => s !== 'any')) expect(STYLE_NOTES[style]).toBeTruthy()
  })
})

describe('preferenceFor', () => {
  it('returns zero for any and 25-34', () => {
    const o = toOklch('#c2ae8c')
    expect(preferenceFor(khakiNeutral, o, 'inner', 0.2, null)).toBe(0)
    expect(AGE_PROFILES['25-34']).toBeNull()
  })
  it('reads family from ColorEntry, not from hue', () => {
    const o = toOklch(khakiNeutral.hex)
    const neutral = preferenceFor(khakiNeutral, o, 'inner', 0.2, STYLE_PROFILES.commute)
    const warm = preferenceFor(khakiWarm, o, 'inner', 0.2, STYLE_PROFILES.commute)
    expect(neutral).toBeGreaterThan(warm)
  })
  it('keeps every row/role within [-1, 1]', () => {
    for (const row of [...Object.values(STYLE_PROFILES), ...Object.values(AGE_PROFILES).filter(Boolean)]) {
      for (const role of ['inner', 'pants', 'shoes', 'accent'] as const) {
        for (const color of [khakiNeutral, coral, mist]) {
          const value = preferenceFor(color, toOklch(color.hex), role, 0.2, row)
          expect(value).toBeGreaterThanOrEqual(-1)
          expect(value).toBeLessThanOrEqual(1)
        }
      }
    }
  })
  it('prefers high-chroma accent for street and low chroma for 55+', () => {
    const street = preferenceFor(coral, toOklch(coral.hex), 'accent', 0.2, STYLE_PROFILES.street)
    const minimal = preferenceFor(coral, toOklch(coral.hex), 'accent', 0.2, STYLE_PROFILES.minimal)
    expect(street).toBeGreaterThan(minimal)
    const older = preferenceFor(mist, toOklch(mist.hex), 'inner', 0.2, AGE_PROFILES['55-plus']!)
    const younger = preferenceFor(mist, toOklch(mist.hex), 'inner', 0.2, AGE_PROFILES['18-24']!)
    expect(older).toBeGreaterThan(younger)
  })
})

describe('profileNote', () => {
  it('is null when both are any', () => expect(profileNote('any', 'any')).toBeNull())
  it('names only the chosen dimension', () => {
    expect(profileNote('any', 'commute')).toContain('通勤')
    expect(profileNote('45-54', 'any')).toContain('45-54')
  })
  it('joins both with a Chinese semicolon', () => {
    expect(profileNote('45-54', 'commute')).toContain('；')
  })
})
```

- [x] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/lib/profile.test.ts`
Expected: FAIL because `src/lib/profile.ts` does not exist.

- [x] **Step 3: Implement `src/lib/profile.ts`**

Copy the exact rule values from spec §4. Use `color.family` for the family component; never infer it from `oklch.h`. Implement the formula exactly:

```ts
const family = row.family[color.family] ?? 0
const target = role === 'accent' ? row.accentChroma : row.chroma
const chromaFit = clamp(1 - Math.abs(oklch.c - target) / row.tolerance, 0, 1) * 2 - 1
const contrastFit = clamp(1 - Math.abs(Math.abs(oklch.l - topL) - row.contrast) / 0.30, 0, 1) * 2 - 1
return clamp(0.40 * family + 0.45 * chromaFit + 0.15 * contrastFit, -1, 1)
```

`profileNote` returns `null` when both are `any`; otherwise `按${STYLE_LABELS[style]}风格：${STYLE_NOTES[style]}` and/or `按 ${AGE_LABELS[age]} 年龄档：${AGE_NOTES[age]}`, joined with `；`.

- [x] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/lib/profile.test.ts`
Expected: PASS.

- [x] **Step 5: Commit (after user approval)**

```bash
git add src/lib/profile.ts src/lib/profile.test.ts
git commit -m "feat: add age and style profile rules"
```

## Task 2: 推荐引擎接入

**Files:**
- Modify: `src/lib/recommend.ts`
- Modify: `src/lib/recommend.test.ts`

**Interfaces:**
- Consumes: `preferenceFor`, `STYLE_PROFILES`, `AGE_PROFILES`, `PROFILE_AMPLITUDE`, `AgeBand`, `Style` from `./profile`.
- Produces: `RecommendationInput` adds `age?: AgeBand`、`style?: Style`；`recommend(input)` 的返回结构不变。

- [x] **Step 1: Pin the current output as GOLDEN (before touching the engine)**

Add to `src/lib/recommend.test.ts`:

```ts
const GOLDEN = {
  season: 'summer',
  harmony: 'neutral',
  primary: [
    { role: 'inner', id: 'mist-blue', reason: '内搭选雾蓝：与上衣形成 0.65 明度差，中性安全；夏季用浅冷低饱和保持清爽。' },
    { role: 'pants', id: 'sand', reason: '裤子选沙色：与上衣形成 0.69 明度差，中性安全；夏季用浅冷低饱和保持清爽，下半身更稳。' },
    { role: 'shoes', id: 'ivory', reason: '鞋子选象牙：明度差 0.79，中性安全；夏季用浅冷低饱和保持清爽，收住整体。' },
    { role: 'accent', id: 'mustard', reason: '点缀选姜黄：与上衣色相相距 84°，小面积对比，约占 10%。' },
  ],
  alternatives: [
    ['ivory', 'sand', 'mist-blue', 'mustard'],
    ['mist-blue', 'oatmeal', 'ivory', 'coral'],
  ],
  avoid: [{ id: 'charcoal', reason: '与上衣太近（ΔE 5），会糊成一片。' }],
}

function signature(result: Recommendation) {
  const roles: Role[] = ['inner', 'pants', 'shoes', 'accent']
  const pick = (combo: OutfitCombo) =>
    roles.map((role) => ({ role, id: combo[role].color.id, reason: combo[role].reason }))
  return {
    season: result.season,
    harmony: result.harmony.key,
    primary: pick(result.primary),
    alternatives: result.alternatives.map((c) => roles.map((r) => c[r].color.id)),
    avoid: result.avoid.map((a) => ({ id: a.color.id, reason: a.reason })),
  }
}

it('pins the current output for any/any', () => {
  const input = { gender: 'female' as const, provinceId: 'guangdong', month: 7, top: BLACK }
  expect(signature(recommend(input))).toEqual(GOLDEN)
})
```

Run: `pnpm vitest run src/lib/recommend.test.ts`
Expected: PASS (this is the pre-change anchor). The signature intentionally excludes the internal `RolePick.score`; it pins every user-visible field (season, harmony, role colors, order, reasons, avoid).

- [x] **Step 2: Write the failing profile tests**

Add tests for:

```ts
const base = { gender: 'female' as const, provinceId: 'guangdong', month: 7, top: BLACK }
it('keeps any/any identical to GOLDEN', () => {
  expect(signature(recommend({ ...base, age: 'any', style: 'any' }))).toEqual(GOLDEN)
})
it('changes the outfit between commute and street', () => {
  const commute = signature(recommend({ ...base, age: 'any', style: 'commute' })).primary.map((p) => p.id)
  const street = signature(recommend({ ...base, age: 'any', style: 'street' })).primary.map((p) => p.id)
  expect(commute).not.toEqual(street)
})
it('changes the outfit between 18-24 and 55-plus', () => {
  const young = signature(recommend({ ...base, age: '18-24', style: 'any' })).primary.map((p) => p.id)
  const older = signature(recommend({ ...base, age: '55-plus', style: 'any' })).primary.map((p) => p.id)
  expect(young).not.toEqual(older)
})
it('promotes a profile-favoured color from outside the base top 8', () => {
  const result = recommend({ ...base, style: 'street', age: 'any' })
  const ids = [result.primary.inner.color.id, result.primary.pants.color.id, result.primary.shoes.color.id]
  expect(ids).toEqual(expect.arrayContaining(['denim', 'olive']))
})
it('keeps the hard constraints across all 42 profiles', () => {
  const ages = ['18-24', '25-34', '35-44', '45-54', '55-plus', 'any'] as const
  const styles = ['commute', 'casual', 'street', 'minimal', 'literary', 'sport', 'any'] as const
  for (const age of ages) for (const style of styles) {
    const result = recommend({ ...base, age, style })
    const picks = [result.primary.inner, result.primary.pants, result.primary.shoes, result.primary.accent]
    expect(new Set(picks.map((p) => p.color.id)).size).toBe(4)
    for (const pick of picks) expect(deltaE(BLACK.hex, pick.color.hex)).toBeGreaterThanOrEqual(3)
    expect(result.alternatives).toHaveLength(2)
  }
})
```

Concrete fixtures from the current engine (use as expected values if a test needs exact ids):
- commute primary: `mint / sand / denim / emerald`
- street primary: `denim / sand / olive / orange`
- 18-24 primary: `mist-blue / sand / denim / coral`
- 55-plus primary: `mist-blue / mushroom / ivory / teal`

Run: `pnpm vitest run src/lib/recommend.test.ts`
Expected: FAIL because `age`/`style` are not accepted and the profile deltas are absent.

- [x] **Step 3: Implement the engine changes**

In `src/lib/recommend.ts`:

```ts
import { AGE_PROFILES, PROFILE_AMPLITUDE, STYLE_PROFILES,
  preferenceFor, type AgeBand, type Style } from './profile'

export interface RecommendationInput {
  // existing fields unchanged
  age?: AgeBand
  style?: Style
}
```

Add `style`/`age` parameters to `scoreColor`, `candidatesFor`, and `buildCombos`; in `scoreColor`:

```ts
const base = /* existing weighted sum, unchanged */
const styleRow = style === 'any' ? null : STYLE_PROFILES[style]
const ageRow = age === 'any' ? null : AGE_PROFILES[age]
const stylePref = preferenceFor(color, candidate, role, top.l, styleRow)
const agePref = preferenceFor(color, candidate, role, top.l, ageRow)
return base + PROFILE_AMPLITUDE.style * stylePref + PROFILE_AMPLITUDE.age * agePref
```

Pass `input.style ?? 'any'` and `input.age ?? 'any'` from `recommend`. Keep `.slice(0, 8)`; the street fixture above proves promotion works at 8. Do not clamp the ranking score.

- [x] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run src/lib/recommend.test.ts`
Expected: PASS. If the pool-promotion test fails, change `.slice(0, 8)` to `.slice(0, 12)` and rerun; do not increase the amplitude.

- [x] **Step 5: Commit (after user approval)**

```bash
git add src/lib/recommend.ts src/lib/recommend.test.ts
git commit -m "feat: apply age and style preferences in scoring"
```

## Task 3: URL 状态、五步顺序与 canGo

**Files:**
- Modify: `src/lib/url-state.ts`
- Create: `src/lib/url-state.test.ts`

**Interfaces:**
- Consumes: `AgeBand`, `Style`, `AGE_BANDS`, `STYLES` from `./profile`.
- Produces:
  - `type Step = 'profile' | 'gender' | 'region' | 'color' | 'result'`
  - `interface StepDef { id: Step; label: string; requires: (state: Partial<AppState>) => boolean }`
  - `STEPS: readonly StepDef[]`
  - `stepNumber(id: Step): number`
  - `canGo(state: Partial<AppState>, step: Step): boolean`
  - `AppState` adds `age: AgeBand`、`style: Style`

- [x] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import type { ColorEntry } from '../data/colors'
import { AGE_BANDS, STYLES } from './profile'
import { STEPS, canGo, parseState, resolveStep, stepNumber, toSearch } from './url-state'

const BLACK: ColorEntry = { id: 'black', name: '纯黑', hex: '#0b0b0b', family: 'neutral' }

const state = (patch = {}) => ({
  gender: null, provinceId: null, month: 7, seasonOverride: null,
  top: null, age: 'any' as const, style: 'any' as const, step: 'profile' as const, ...patch,
})

describe('STEPS', () => {
  it('is the single five-step order', () => {
    expect(STEPS.map((s) => s.id)).toEqual(['profile', 'gender', 'region', 'color', 'result'])
    expect(STEPS.map((s) => s.label)).toEqual(['画像', '性别', '地区', '上衣', '配色'])
  })
  it('numbers steps from 1', () => {
    expect(stepNumber('profile')).toBe(1)
    expect(stepNumber('result')).toBe(5)
  })
})

describe('parseState / toSearch', () => {
  it('defaults missing a/f to any', () => {
    expect(parseState('?g=female&p=guangdong&c=0b0b0b').age).toBe('any')
    expect(parseState('?g=female&p=guangdong&c=0b0b0b').style).toBe('any')
  })
  it('accepts a valid a/f and round-trips 55-plus', () => {
    const parsed = parseState('?a=55-plus&f=commute')
    expect(parsed.age).toBe('55-plus')
    expect(parsed.style).toBe('commute')
    const url = toSearch({ ...state({ age: '55-plus', style: 'commute' }) })
    expect(url).toContain('a=55-plus')
    expect(url).toContain('f=commute')
  })
  it('rejects invalid values and a hand-written 55+', () => {
    expect(parseState('?a=55%2B').age).toBe('any')
    expect(parseState('?a=unknown&f=unknown').age).toBe('any')
    expect(parseState('?a=unknown&f=unknown').style).toBe('any')
  })
  it('omits any from the URL', () => {
    expect(toSearch({ ...state() })).not.toContain('a=')
    expect(toSearch({ ...state() })).not.toContain('f=')
  })
  it('accepts every declared id', () => {
    for (const age of AGE_BANDS) expect(parseState(`?a=${age}`).age).toBe(age)
    for (const style of STYLES) expect(parseState(`?f=${style}`).style).toBe(style)
  })
})

describe('resolveStep / canGo', () => {
  it('starts at profile with no gender', () => {
    expect(resolveStep({})).toBe('profile')
  })
  it('keeps an old complete result link on result', () => {
    expect(resolveStep({ gender: 'female', provinceId: 'guangdong', top: BLACK, step: 'result' })).toBe('result')
  })
  it('keeps an explicit gender link on gender', () => {
    expect(resolveStep({ step: 'gender' })).toBe('gender')
  })
  it('falls back to the first missing step', () => {
    expect(resolveStep({ gender: 'female' })).toBe('region')
    expect(resolveStep({ gender: 'female', provinceId: 'guangdong' })).toBe('color')
  })
  it('enables earlier steps by prerequisite', () => {
    expect(canGo({}, 'profile')).toBe(true)
    expect(canGo({}, 'gender')).toBe(true)
    expect(canGo({ gender: 'female' }, 'region')).toBe(true)
    expect(canGo({}, 'region')).toBe(false)
    expect(canGo({ gender: 'female', provinceId: 'guangdong', top: BLACK }, 'result')).toBe(true)
  })
})
```

`BLACK` is the existing test fixture in `recommend.test.ts`; recreate it in this file or import a shared fixture. Do not add a production seam for tests.

Run: `pnpm vitest run src/lib/url-state.test.ts`
Expected: FAIL.

- [x] **Step 2: Implement `src/lib/url-state.ts`**

Add the `profile` step, `STEPS`, `stepNumber`, `canGo`, `age`/`style` fields, parse/serialize, and the `resolveStep` order from spec §6. `resolveStep` must use `STEPS.find(...).requires(state)` for an explicit step, then the fallback `!gender → profile`, `!provinceId → region`, `!top → color`, else `result`.

- [x] **Step 3: Run the test to verify it passes**

Run: `pnpm vitest run src/lib/url-state.test.ts`
Expected: PASS.

- [x] **Step 4: Commit (after user approval)**

```bash
git add src/lib/url-state.ts src/lib/url-state.test.ts
git commit -m "feat: add profile step to URL state"
```

## Task 4: ProfileStep 组件

**Files:**
- Create: `src/components/ProfileStep.tsx`
- Test: `src/components/ProfileStep.test.tsx`

**Interfaces:**
- Consumes: `AGE_BANDS`, `STYLES`, `AGE_LABELS`, `STYLE_LABELS`, `STYLE_NOTES`, `AGE_NOTES`, `AgeBand`, `Style`; `RadioGroup`, `RadioGroupItem`, `Card`, `CardContent`, `CardTitle`, `CardDescription`, `Button`.
- Produces: `<ProfileStep age={AgeBand} style={Style} onAge={(AgeBand)=>void} onStyle={(Style)=>void} onNext={()=>void} />`.

- [x] **Step 1: Write the failing test**

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ProfileStep } from './ProfileStep'

it('renders two groups with 13 radio options and the default any selection', () => {
  const html = renderToStaticMarkup(
    <ProfileStep age="any" style="any" onAge={() => {}} onStyle={() => {}} onNext={() => {}} />,
  )
  expect(html.match(/role="radio"/g)).toHaveLength(13)
  expect((html.match(/aria-checked="true"/g) ?? []).length).toBe(2)
  expect(html).toContain('年龄与穿衣风格')
  expect(html).toContain('下一步')
  expect(html).toContain('aria-hidden="true"')
})
```

Run: `pnpm vitest run src/components/ProfileStep.test.tsx`
Expected: FAIL because the component does not exist.

- [x] **Step 2: Implement `ProfileStep.tsx`**

Follow spec §5: single-column card, four-color strip, two Radix `RadioGroup`s, 44px pill items, focus ring, optional notes, next button. Do not render the mannequin. Use `AGE_LABELS`/`STYLE_LABELS` for text; use `STYLE_NOTES` and `AGE_NOTES` for the selected note. 25-34 shows `均衡，不额外调整`.

- [x] **Step 3: Run the test to verify it passes**

Run: `pnpm vitest run src/components/ProfileStep.test.tsx`
Expected: PASS.

- [x] **Step 4: Commit (after user approval)**

```bash
git add src/components/ProfileStep.tsx src/components/ProfileStep.test.tsx
git commit -m "feat: add profile step UI"
```

## Task 5: App 接线

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `ProfileStep`, `STEPS`, `canGo`, `stepNumber`, `AgeBand`, `Style`.
- Produces: profile step reachable, recommendation recomputes on age/style, reset lands profile.

- [x] **Step 1: Wire the state**

Update `initialState` to `age: parsed.age ?? 'any'`, `style: parsed.style ?? 'any'`. Pass `age`/`style` to `recommend` and add them to the `useMemo` dependency array. Add `state.step === 'profile'` to `renderStep`; `onAge`/`onStyle` call `setActiveCombo(0)` and `update({ age })`/`update({ style })`; `onNext` calls `update({ step: 'gender' })`. Import `canGo` from `./lib/url-state` and replace the local function with:

```ts
function navigate(step: Step) {
  if (canGo(state, step)) update({ step })
}
```

`reset` sets `age: 'any'`, `style: 'any'`, `step: 'profile'`. Add `state.step !== 'profile'` to the mannequin layout condition. Pass `canGo={(step) => canGo(state, step)}` to `StepIndicator` (the prop is a one-arg predicate). Add `onBack={() => navigate('profile')}` to both `GenderStep` usages.

- [x] **Step 2: Verify the build**

Run: `pnpm build`
Expected: exit 0.

- [x] **Step 3: Manual scenario check**

Run: `pnpm dev --host 127.0.0.1`
Expected:
- Fresh visit shows the profile card, no mannequin.
- Selecting a style and pressing 下一步 reaches gender; after gender, the mannequin appears.
- From the result page, click 画像, change style, click 配色; the result recomputes and is on 方案 1.
- 重新开始 lands on profile with both 不限.

- [x] **Step 4: Commit (after user approval)**

```bash
git add src/App.tsx
git commit -m "feat: wire profile step into the flow"
```

## Task 6: StepIndicator、步骤编号与 GenderStep 返回

**Files:**
- Modify: `src/components/StepIndicator.tsx`
- Modify: `src/components/GenderStep.tsx`
- Modify: `src/components/RegionStep.tsx`
- Modify: `src/components/ColorStep.tsx`
- Create: `src/components/StepIndicator.test.tsx`

**Interfaces:**
- Consumes: `STEPS`, `stepNumber`, `Step` from `../lib/url-state`.
- Produces: `StepIndicatorProps` adds `canGo: (step: Step) => boolean`; `GenderStepProps` adds `onBack: () => void`.

- [x] **Step 1: Write the failing tests**

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { StepIndicator } from './StepIndicator'

it('renders five labels and disables steps whose prerequisites are missing', () => {
  const html = renderToStaticMarkup(
    <StepIndicator current="profile" canGo={(step) => step === 'profile' || step === 'gender'} onNavigate={() => {}} />,
  )
  for (const label of ['画像', '性别', '地区', '上衣', '配色']) expect(html).toContain(label)
  expect(html).toContain('aria-current="step"')
  expect((html.match(/disabled/g) ?? []).length).toBe(3)
})
```

Add a source-scan regression in the same test file. It catches the exact “still hardcodes /4” failure without rendering every step component:

```ts
import { readFileSync } from 'node:fs'
it('derives step numbers instead of hardcoding /4', () => {
  for (const file of ['GenderStep', 'RegionStep', 'ColorStep']) {
    const source = readFileSync(new URL(`./${file}.tsx`, import.meta.url), 'utf8')
    expect(source).not.toMatch(/Step \d \/ 4/)
    expect(source).toMatch(/stepNumber\(/)
  }
})
```

Also assert in `GenderStep.test.tsx` (or a small `StepChrome.test.tsx`) that `GenderStep` renders `返回` and `Step 2 / 5`.

Run: `pnpm vitest run src/components/StepIndicator.test.tsx`
Expected: FAIL.

- [x] **Step 2: Implement**

`StepIndicator` maps `STEPS` and uses `canGo(step.id)` for `enabled`; keep `aria-current="step"`; keep `done = index < currentIndex`. `GenderStep`/`RegionStep`/`ColorStep` use `stepNumber('gender' | 'region' | 'color')` and `STEPS.length` for the label. Add `onBack` to `GenderStep` and render it next to 下一步.

- [x] **Step 3: Run the tests to verify they pass**

Run: `pnpm vitest run src/components/StepIndicator.test.tsx`
Expected: PASS.

- [x] **Step 4: Commit (after user approval)**

```bash
git add src/components/StepIndicator.tsx src/components/StepIndicator.test.tsx \
  src/components/GenderStep.tsx src/components/RegionStep.tsx src/components/ColorStep.tsx
git commit -m "feat: add five-step navigation and step numbers"
```

## Task 7: ResultView 徽章与说明

**Files:**
- Modify: `src/components/ResultView.tsx`
- Create: `src/components/ResultView.test.tsx`

**Interfaces:**
- Consumes: `profileNote`, `AGE_LABELS`, `STYLE_LABELS`, `AgeBand`, `Style`.
- Produces: `ResultViewProps` adds `age: AgeBand`、`style: Style`.

- [x] **Step 1: Write the failing tests**

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ColorEntry } from '../data/colors'
import { recommend } from '../lib/recommend'
import { ResultView } from './ResultView'

const BLACK: ColorEntry = { id: 'black', name: '纯黑', hex: '#0b0b0b', family: 'neutral' }
const recommendation = recommend({ gender: 'female', provinceId: 'guangdong', month: 7, top: BLACK })
const props = (profile: { age: 'any' | '45-54'; style: 'any' | 'commute' }) => ({
  recommendation, activeCombo: 0, onActiveComboChange: () => {},
  gender: 'female' as const, provinceId: 'guangdong',
  onBack: () => {}, onRegion: () => {}, onReset: () => {}, ...profile,
})

it('hides both badges and the note when both are any', () => {
  const html = renderToStaticMarkup(<ResultView {...props({ age: 'any', style: 'any' })} />)
  expect(html).not.toContain('通勤')
  expect(html).not.toContain('45-54')
})
it('shows the style badge and note when a style is chosen', () => {
  const html = renderToStaticMarkup(<ResultView {...props({ age: 'any', style: 'commute' })} />)
  expect(html).toContain('通勤')
  expect(html).toContain('按通勤风格')
})
it('shows the age badge and note when an age is chosen', () => {
  const html = renderToStaticMarkup(<ResultView {...props({ age: '45-54', style: 'any' })} />)
  expect(html).toContain('45-54')
  expect(html).toContain('按 45-54 年龄档')
})
it('joins both with a semicolon', () => {
  const html = renderToStaticMarkup(<ResultView {...props({ age: '45-54', style: 'commute' })} />)
  expect(html).toContain('；')
})
```

Run: `pnpm vitest run src/components/ResultView.test.tsx`
Expected: FAIL.

- [x] **Step 2: Implement**

Add the two badges after the gender badge; render `profileNote(age, style)` below the harmony description only when non-null. Use `Badge variant="outline"` and `text-sm leading-6 text-muted-foreground`.

- [x] **Step 3: Run the test to verify it passes**

Run: `pnpm vitest run src/components/ResultView.test.tsx`
Expected: PASS.

- [x] **Step 4: Commit (after user approval)**

```bash
git add src/components/ResultView.tsx src/components/ResultView.test.tsx
git commit -m "feat: show age and style in results"
```

## Task 8: 文档同步

**Files:**
- Modify: `PRODUCT.md`
- Modify: `README.md`
- Modify: `.impeccable/surfaces/src-app-tsx.md`

- [x] **Step 1: Update the docs**

- `PRODUCT.md` line 32: change the four-step flow to `画像（年龄 + 穿衣风格） → 性别 → 地区/季节 → 上衣颜色 → 结果`; add age/style to capabilities.
- `README.md` line 3 and the structure/rules sections: same five-step wording; mention `profile.ts`, `ProfileStep`, `a`/`f` URL params, `55-plus` id.
- `.impeccable/surfaces/src-app-tsx.md`: update STORY/FIRST VIEWPORT so the first screen is the profile card, and the mannequin appears after gender.

- [x] **Step 2: Verify no stale wording**

Run: `grep -n '四步' PRODUCT.md README.md || true`
Expected: no output.

- [x] **Step 3: Commit (after user approval)**

```bash
git add PRODUCT.md README.md .impeccable/surfaces/src-app-tsx.md
git commit -m "docs: update flow for age and style profile"
```

## Task 9: 全量验证与视觉核验

**Files:** none (verification only).

- [x] **Step 1: Run the repository commands**

```bash
pnpm test
pnpm --reporter=append-only run lint
pnpm build
```

Expected: all exit 0; tests include the new profile/url/result files.

- [x] **Step 2: Visual check**

Run `pnpm dev --host 127.0.0.1`, open the app with the browser tool at 360 / 768 / 1280 in light and dark themes. Verify:
- Five-step indicator does not overflow at 360.
- 13 options wrap cleanly; each target ≥44px; focus ring visible.
- Profile step is single-column even when a gender was previously selected.
- Result badges/note appear only for non-any choices.
- Contrast of the selected pill is ≥4.5:1 (read computed styles, not just eyes).

- [x] **Step 3: Manual scenarios**

- Old link `?g=female&p=guangdong&m=7&c=0b0b0b&step=result` → result, colors match GOLDEN.
- `?a=55+` → profile with 不限 selected, no crash.
- Result → 画像 → change style → 配色 → recomputed result on 方案 1.
- 重新开始 → profile, both 不限.
- Keyboard: arrow keys move within each group; Tab enters/leaves each group.

- [x] **Step 4: Commit any fixes (after user approval)**

```bash
# Stage only the files changed in Tasks 1-8; never git add -A.
git add src/lib/profile.ts src/lib/profile.test.ts src/lib/recommend.ts \
  src/lib/recommend.test.ts src/lib/url-state.ts src/lib/url-state.test.ts \
  src/App.tsx src/components/ProfileStep.tsx src/components/ProfileStep.test.tsx \
  src/components/StepIndicator.tsx src/components/StepIndicator.test.tsx \
  src/components/GenderStep.tsx src/components/RegionStep.tsx src/components/ColorStep.tsx \
  src/components/ResultView.tsx src/components/ResultView.test.tsx \
  PRODUCT.md README.md .impeccable/surfaces/src-app-tsx.md
git commit -m "fix: address profile step verification findings"
```

## Self-Review

- **Spec coverage:** §3 数据模型 → Task 1; §4 规则与合成 → Task 1/2; §5 流程与界面 → Task 4/5/6/7; §6 URL/状态 → Task 3; §7 文件清单 → File Structure; §8 验证 → Task 9; §11/§12 评审修正 → Task 1/2/3/5/6.
- **Type consistency:** `AgeBand`/`Style`/`ProfileRow`/`ProfileRole` are defined once in Task 1; `Step`/`AppState`/`STEPS`/`canGo` once in Task 3; later tasks import, never redefine. `preferenceFor` takes `ColorEntry` + `Oklch` (Codex Critical), not just Oklch.
- **Review Focus:** each of the five lines has an owning test or manual scenario: old link (Task 3), invalid URL (Task 3), result→profile→result (Task 5), navigation direct (Task 6), 360px (Task 9).
- **Proportion:** the plan stays at signatures, test names/assertions and exact values; no component bodies or engine bodies are transcribed.

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-11-11-outfit-profile-steps.md`. Please review it.

**Recommended execution method: Native** — the tasks are sequential (profile → engine → URL → UI) and share the same small state boundary; a fresh subagent per task would cost more context than it saves, while the plan already pins signatures, fixtures and review focus.

- **Subagent-driven** — a fresh subagent per task and a fresh reviewer per task; most thorough, slowest.
- **Native** — I implement every task in this session, then one fresh reviewer checks the whole branch; fastest.

Which approach should we use?
