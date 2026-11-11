# 画像步骤设计：年龄与穿衣风格接入配色推荐

- 日期：2026-11-11
- 状态：已实现（2026-11-11，PR #1）
- 项目：`ai-outfit-guide`
- 关联：`PRODUCT.md`、`README.md`、`.impeccable/surfaces/src-app-tsx.md`

## 一、背景与目标

现有流程为四步：性别 → 地区/季节 → 上衣颜色 → 结果。用户希望在选择上衣之前先选择「年龄」与「穿衣风格」，让推荐结果体现这两项偏好。

目标：

1. 新增一步「画像」，包含年龄段与穿衣风格两个选择。
2. 两项选择真实参与推荐评分，而不是只做标签。
3. 保持确定性规则引擎：同一输入永远同一输出，每条建议仍可解释。
4. 旧分享链接（不含新参数）结果与当前版本逐字一致。

非目标：

- 不做用户账号、后端、LLM 或图像生成。
- 不新增配饰、帽子、包等角色；人台仍是五区。
- 不改动地区/季节、人台、主题等既有能力。

## 二、已确认的产品决策

| 决策点 | 结论 |
|---|---|
| 作用方式 | 参与评分：在基础分上做加性调整 |
| 流程结构 | 年龄与风格合并为一步「画像」，共 5 步 |
| 风格清单 | 通勤、休闲、街头、极简、文艺、运动（6 种） |
| 年龄分档 | 18-24、25-34、35-44、45-54、55+（5 档） |
| 是否必选 | 允许「不限」；默认即「不限」，可直接下一步 |
| 影响幅度 | 风格 ±0.12，年龄 ±0.08 |
| 代码结构 | 保留独立 `profile.ts` 规则模块（工程评审，2026-11-11） |
| 年龄与 URL | 写入 `a` 参数；粗档位可分享（工程评审，2026-11-11） |

## 三、数据模型

新增 `src/lib/profile.ts`：

```ts
export type AgeBand =
  | '18-24' | '25-34' | '35-44' | '45-54' | '55-plus' | 'any'

export type Style =
  | 'commute' | 'casual' | 'street' | 'minimal' | 'literary' | 'sport' | 'any'
```

同时导出：

- `AGE_BANDS`、`STYLES`：合法值数组，供 URL 校验与 UI 遍历。
- `AGE_LABELS`、`STYLE_LABELS`：中文标签。
- `STYLE_NOTES`：每种风格一句偏好说明，用于画像步骤与结果页。
- `preferenceFor(color: ColorEntry, oklch: Oklch, role, topL, row: ProfileRow | null)`：返回 `[-1, 1]` 的偏好值；`row` 为 `null` 时返回 `0`。家族偏好直接取 `color.family`（由颜色数据策划，见 `src/data/colors.ts:9`），不要从 OKLCH 色相推断；`oklch` 由调用方传入，避免重复调用 `toOklch`。
- `PROFILE_AMPLITUDE`：`{ style: 0.12, age: 0.08 }`。

推荐引擎输入新增可选字段：

```ts
interface RecommendationInput {
  // 现有字段不变
  age?: AgeBand
  style?: Style
}
```

缺省或传入 `'any'` 时按无调整处理。`ResultView` 新增 `age`、`style` 两个 props，用于徽章与整体说明。

`'any'` 与 `'25-34'` 的偏好恒为 `0`；因此两者结果相同，这是刻意接受的代价（25-34 为基准档）。

实现上 `AGE_PROFILES['25-34'] = null`，`preferenceFor` 对 `null` 直接返回 `0`；不要查表后拿 `undefined` 的目标值参与计算，否则会产生 `NaN`。

URL 中的年龄 id 使用 `55-plus`，界面标签仍显示 `55+`。原因是查询串里的 `+` 会被解码为空格：实测 `new URLSearchParams('a=55+').get('a')` 返回 `'55 '`。手写 `?a=55+` 会静默回落到 `any`，因此不采用 `55+` 作为 id。

## 四、偏好规则

每档是一行数据：家族偏好、主色目标饱和度与容差、点缀目标饱和度、目标明度差。

### 风格

| 风格 | 中性 | 暖 | 冷 | 大地 | 主色饱和度 | 容差 | 点缀饱和度 | 目标明度差 |
|---|---|---|---|---|---|---|---|---|
| 通勤 | +0.8 | -0.3 | +0.2 | +0.3 | 0.06 | 0.10 | 0.10 | 0.28 |
| 休闲 | +0.3 | +0.2 | +0.1 | +0.8 | 0.08 | 0.12 | 0.14 | 0.20 |
| 街头 | +0.8 | -0.2 | +0.1 | -0.5 | 0.05 | 0.12 | 0.20 | 0.32 |
| 极简 | +0.9 | -0.5 | +0.2 | +0.2 | 0.03 | 0.08 | 0.06 | 0.18 |
| 文艺 | +0.2 | +0.6 | -0.3 | +0.8 | 0.09 | 0.10 | 0.12 | 0.18 |
| 运动 | +0.6 | +0.1 | +0.2 | -0.4 | 0.06 | 0.14 | 0.20 | 0.34 |

### 年龄

| 年龄档 | 中性 | 暖 | 冷 | 大地 | 主色饱和度 | 容差 | 点缀饱和度 | 目标明度差 |
|---|---|---|---|---|---|---|---|---|
| 18-24 | 0 | +0.2 | 0 | 0 | 0.08 | 0.14 | 0.20 | 0.30 |
| 25-34 | 0 | 0 | 0 | 0 | — | — | — | — |
| 35-44 | +0.4 | 0 | 0 | +0.2 | 0.06 | 0.10 | 0.14 | 0.24 |
| 45-54 | +0.6 | -0.2 | 0 | +0.2 | 0.04 | 0.09 | 0.10 | 0.26 |
| 55+（id: `55-plus`） | +0.7 | -0.3 | 0 | +0.2 | 0.03 | 0.08 | 0.08 | 0.30 |

### 合成

```text
家族偏好      = 档位表中该颜色 family 的取值（缺省 0）
饱和度贴合    = clamp(1 - |c - 目标饱和度| / 容差, 0, 1) * 2 - 1
明度差贴合    = clamp(1 - ||l - topL| - 目标明度差| / 0.30, 0, 1) * 2 - 1
偏好          = clamp(0.40*家族偏好 + 0.45*饱和度贴合 + 0.15*明度差贴合, -1, 1)

排名分 = 基础分 + 0.12*风格偏好 + 0.08*年龄偏好
```

其中 `c`、`l` 为候选色的 OKLCH 饱和度与明度，`topL` 为用户所选上衣的明度；点缀角色的目标饱和度取「点缀饱和度」列，其余角色取「主色饱和度」列。

**接入位置**：偏好必须在 `scoreColor` 内计算，位于 `candidatesFor` 的排序与 `.slice(0, 8)` **之前**。这样画像偏好的颜色才能进入候选池；若在切池后才加，基础分第 9 名永远无法被画像提升。

**排名不 clamp**：`scoreColor` 返回未截断的排名分。基础分接近 1 时，正向偏好不应被 `clamp(..., 0, 1)` 吃掉；排序使用未截断值。若 `RolePick.score` 需要 `[0, 1]` 展示，只在展示边界截断，不影响排序。

**池容量**：若测试证明画像偏好的颜色仍在基础分第 9 名之外，先把每角色池从 8 扩到 12（12^4 = 20,736 组合，仍可接受），不要靠调大偏好幅度硬拉。幅度保持 ±0.12 / ±0.08，并在测试里用实际分数间距证明它能改变至少一个角色。

硬约束不变：

- 候选与上衣 `ΔE >= 3`。
- 四角色颜色互不相同，且两两 `ΔE >= 8`。
- 主方案 + 2 套备选，按 CIEDE2000 去重与排序。

## 五、流程与界面

五步：**画像 → 性别 → 地区/季节 → 上衣 → 结果**。

### ProfileStep

**布局**：画像步骤始终单列，不渲染右侧人台。`App.tsx:222` 当前的分支是 `state.step !== 'gender' && state.gender`；需要把画像排除在外（例如增加 `state.step !== 'profile'`），否则从结果页返回画像时会看到与当前选择无关的旧配色人台。

**首屏结构**：

```text
┌──────────────────────────────────────────────┐
│ ▬▬▬▬  四色细条（aria-hidden）                 │
│ STEP 1 / 5                                   │
│ 年龄与穿衣风格                                 │
│ 只做轻微偏好调整，随时可以改。                    │
│                                              │
│ 年龄段                                        │
│ (18-24) (25-34) (35-44) (45-54) (55+) (不限)  │
│                                              │
│ 穿衣风格                                      │
│ (通勤) (休闲) (街头) (极简) (文艺) (运动) (不限) │
│ 通勤：中性、低饱和，对比清楚。                    │
│                                              │
│                                    [下一步]   │
└──────────────────────────────────────────────┘
```

**内容与交互**：

- 一组年龄段（5 档 + 不限），一组穿衣风格（6 种 + 不限）；两项默认都选中「不限」，「下一步」始终可用。
- 标题固定为「年龄与穿衣风格」，说明固定为「只做轻微偏好调整，随时可以改。」，不使用「画像」二字。
- 四色细条由四段 24×4px 的圆角短条组成，颜色沿用页头四色 `#b5432f / #c99a2e / #1f2a44 / #f6f1e7`，每段加 `ring-1 ring-black/10 dark:ring-white/15`；`aria-hidden="true"`，不承载语义。
- 两组都用已安装的 Radix `RadioGroup`（`src/components/ui/radio-group.tsx`），每组带 `aria-label`（「年龄段」「穿衣风格」），选项为 `RadioGroupItem`，方向键在组内移动，Tab 只进出一组。
- 选中态：`border-accent bg-accent text-accent-foreground`；未选中：`border-border hover:bg-muted`；每项最小高度 44px，圆角胶囊，`px-4 text-sm`。
- 焦点：`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`，不得只靠颜色表示选中。
- 选中风格时，在风格组下方显示对应 `STYLE_NOTES` 一行；选「不限」时不显示。选中 25-34 时显示「均衡，不额外调整」。
- 「下一步」右对齐，`Button size="lg"`；点击进入性别步骤。

### 其他界面调整

- `StepIndicator`：5 项 `画像 / 性别 / 地区 / 上衣 / 配色`。启用状态必须按 `canGo`/state 的前置条件计算，不能沿用 `enabled = index <= currentIndex`（`StepIndicator.tsx:25`）；否则从结果页点「画像」改完风格后，性别/地区/上衣/配色全部禁用，用户只能连点四次「下一步」。`done` 也按状态推导，测试覆盖「结果 → 画像 → 结果」直达。
- **步骤编号只保留一份**：所有卡片的 `Step X / 5` 由共享 `STEPS` 计算，不得硬编码。现有硬编码位置是 `GenderStep.tsx:29`（1/4）、`RegionStep.tsx:93`（2/4）、`ColorStep.tsx:55`（3/4）；`RegionStep` 与 `ColorStep` 必须加入本次修改清单。
- **步骤顺序只保留一份**：在 `url-state.ts` 导出 `STEPS`（id、label、前置条件），`StepIndicator` 直接遍历，`resolveStep` 与 `canGo` 从同一份数据推导。现状是 `Step` 联合类型、`StepIndicator.tsx:5` 的数组、`resolveStep`（`url-state.ts:71`）与 `canGo`（`App.tsx:88`）四处手工同步；加第五步时漏改一处就会出现指示器与回退逻辑错位。
- `GenderStep`：新增「返回」按钮回到画像步骤。
- `ResultView`：
  - 在现有季节/地区/性别徽章之后追加年龄档与风格徽章（`Badge variant="outline"`）；值为「不限」时不显示。
  - 在和谐说明下方新增一句整体偏好说明，文案由 `profile.ts` 导出；两项都「不限」时返回 `null`，不渲染空行。
  - 只选风格时：「通勤：优先中性色与低饱和，点缀也克制」
  - 只选年龄时：「45-54：更偏中性色，克制高饱和」
  - 两项都选时合并为一句，用「；」分隔，去掉句末「。」后再拼接，不超过两行。
  - 文案只用「偏好 / 更偏」，不写「适合」「显年轻」等判断。
  - 现有逐条明度差/色相理由不改。
- `MannequinPanel`、人台 SVG、主题切换不改。

### 交互状态

| 场景 | 用户看到什么 |
|---|---|
| 首次进入 | 两组都选中「不限」，无风格说明，「下一步」可用 |
| 只改年龄 | 年龄选中；风格仍「不限」；风格说明不显示 |
| 只改风格 | 风格选中；下方显示该风格一句说明 |
| 两项都选 | 两组选中；显示风格说明；「下一步」可用 |
| URL 的 `a`/`f` 非法 | 对应项回落「不限」，不弹错；结果仍可用 |
| 结果页：两项都「不限」 | 不显示年龄/风格徽章，也不显示整体说明 |
| 结果页：至少一项非「不限」 | 显示对应徽章，并在和谐说明下方显示一句整体偏好说明 |
| 加载 / 网络错误 | 不适用：纯前端、无请求、无后端 |
| 减少动态 | 沿用现有 `prefers-reduced-motion`，画像步骤本身不加新动画 |

### 用户旅程

| 步骤 | 用户做什么 | 用户感受 | 设计如何支撑 |
|---|---|---|---|
| 1 | 打开页面 | “这是个小工具，不是长表单” | 四色细条 + 一句话说明 + 默认「不限」 |
| 2 | 选年龄段 | “只是轻量偏好，不是被审问” | 选项一行排开，无必填星号，无隐私提示噪音 |
| 3 | 选风格 | “我知道它会影响什么” | 选中后出现一句具体说明 |
| 4 | 进入性别 | “开始配色了” | 选完性别才出现人台，形成回报 |
| 5 | 地区 → 上衣 → 结果 | “选择被记住了” | 结果页徽章 + 一句整体说明 |

关键风险：画像在性别之前，若首屏信息过密会变成“填表”。因此两组同屏、默认值已选、说明只有一句，不增加第三步。

### 设计 token 与组件映射

| 元素 | 规格 |
|---|---|
| 容器 | `Card` + `CardContent className="space-y-6"` |
| 眉题 | `text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground` |
| 标题 | `CardTitle`，文案「年龄与穿衣风格」 |
| 说明 | `CardDescription`，文案「只做轻微偏好调整，随时可以改。」 |
| 分组标签 | `text-xs font-medium text-muted-foreground` |
| 选项胶囊 | `h-11 min-w-14 rounded-full border px-4 text-sm transition-colors` |
| 选中 | `border-accent bg-accent text-accent-foreground` |
| 未选中 | `border-border hover:bg-muted` |
| 焦点 | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background` |
| 风格说明 | `text-xs leading-5 text-muted-foreground` |
| 下一步 | `Button size="lg"`，右对齐 |
| 结果徽章 | `Badge variant="outline"`，追加在现有季节/地区/性别徽章之后 |
| 结果说明 | `text-sm leading-6 text-muted-foreground`，位于和谐说明下方 |

当前项目没有 `DESIGN.md`；本表就是本次新增组件的设计依据。实现完成后应由 impeccable 的 documenter 从成品生成 `DESIGN.md`，不要回填成第二份手写现状文档。

### 响应式与无障碍

- **360px**：画像单列；两组选项 `flex-wrap gap-2`，每项 ≥44px 高；四色细条四段等宽；「下一步」占满可用宽度或右对齐但保持 44px。
- **768px**：表单保持单列，组间距 `space-y-6`；选项仍可一行排开。
- **1280px**：画像仍单列，不出现人台；其余步骤沿用左侧表单 + 右侧 300px 人台。
- **StepIndicator 5 项**：`sm` 以下用 `gap-1 px-1`，序号圆点从 `h-5 w-5` 缩到 `h-4 w-4`，完成态可隐藏数字圆点；不隐藏标签、不改成横向滚动。现有基数（每项约 66px、外层 gap/连接线）在 360px 的 `main px-4` 内容宽约 328px 下会溢出，只把 `px-1.5` 改小仍约 350px，不够；必须同时缩圆点并实测无横向溢出。
- **RadioGroup**：每组一个 `aria-label`；方向键在组内切换，Tab 只进出一组；每项有可见文字标签，不靠颜色单独传达选中。
- **对比度**：选中态沿用现有 `accent / accent-foreground` 组合；实现后在深浅两主题下用计算样式复核 ≥4.5:1。
- **触控目标**：所有选项 ≥44×44px；「下一步」使用 `size="lg"`。
- **屏幕阅读器**：四色细条 `aria-hidden`；风格说明与选项通过 `aria-describedby` 关联；结果页说明位于现有 `aria-live="polite"` 容器内。

## 六、状态与 URL

`Step` 改为：

```ts
type Step = 'profile' | 'gender' | 'region' | 'color' | 'result'
```

`AppState` 新增：

```ts
age: AgeBand
style: Style
```

URL：

- 新增 `a`（年龄档）与 `f`（风格）。
- 合法值才接受；缺失或非法一律回 `'any'`。
- 年龄档的 URL id 使用 `55-plus`，界面标签显示 `55+`。
- `parseState` 必须总是返回 `age` 与 `style`（缺失即 `'any'`），不要让 `undefined` 进入推荐输入；`initialState` 与 `reset` 同样显式补 `'any'`。
- 值为 `'any'` 时不写入 URL。
- 旧链接（无 `a`/`f`）解析后得到 `'any'`，结果与当前版本一致。

`resolveStep`：

1. 显式 `step` 且前置条件满足 → 该步骤。
2. 无 `step` 且无性别 → `'profile'`。
3. 有性别无地区 → `'region'`。
4. 有性别与地区无上衣 → `'color'`。
5. 全部齐全 → `'result'`。

`canGo('profile')` 恒真；其余步骤前置条件与现有逻辑一致（地区需性别，上衣需性别+地区，结果需三者齐全）。

`reset()` 将 `age`/`style` 重置为 `'any'`，并把 `step` 设为 `'profile'`；现有实现是 `step: 'gender'`（`App.tsx:99`），不改会跳过新第一步。

`recommend()` 必须接收 `age`/`style`；`useMemo` 的依赖数组加入 `state.age`、`state.style`。否则从结果页返回画像改风格再回来，推荐对象不会重算，但 `ResultView` 的徽章/说明已用新 props，页面会出现「新偏好 + 旧配色」。

画像的 `age`/`style` 变化时调用 `setActiveCombo(0)`，与地区/上衣的现有处理一致；否则用户停在方案 3 时改画像，会继续停在旧方案或越界回退。

## 七、文件清单

新增：

- `src/lib/profile.ts`
- `src/components/ProfileStep.tsx`
- `src/lib/profile.test.ts`
- `src/lib/url-state.test.ts`

修改：

- `src/lib/recommend.ts`
- `src/lib/url-state.ts`
- `src/App.tsx`
- `src/components/StepIndicator.tsx`
- `src/components/GenderStep.tsx`
- `src/components/RegionStep.tsx`
- `src/components/ColorStep.tsx`
- `src/components/ResultView.tsx`
- `src/lib/recommend.test.ts`

文档：

- `PRODUCT.md`：流程改为五步，能力补充年龄/风格。
- `README.md`：结构表与规则口径补充画像维度。
- `.impeccable/surfaces/src-app-tsx.md`：**必须**更新 STORY 与 FIRST VIEWPORT。现状仍写着“选完性别后进入工作室”，加画像步骤后首屏起点已变，不更新会让设计评审按旧起点判断。

## 八、验证

### 回归锚点

改造引擎前，先记录当前版本对固定输入的完整输出：

```text
gender=female, provinceId=guangdong, month=7, top=纯黑 #0b0b0b
```

将其固化为测试期望；改造后 `age='any', style='any'` 的结果必须与该期望 `toEqual`。

### 新增测试

- `profile.test.ts`
  - 合法值与标签一一对应，id 唯一。
  - `preferenceFor` 输出始终在 `[-1, 1]`。
  - `'any'` 与 `'25-34'` 的偏好为 `0`。
  - 街头在点缀角色对高饱和色的偏好高于极简；55+ 对低饱和的偏好高于 18-24。
  - **60 个颜色的 `color.family` 映射**：偏好必须取 `ColorEntry.family`，不能从 OKLCH 色相推断；覆盖 `khaki/camel/olive/taupe`（neutral）与 `clay-pink/grey-blue`（earth）这类会给色相推断挖坑的样本。
  - 同输入幂等。
- `recommend.test.ts`
  - 在改引擎之前先固化 `female / guangdong / 7 / 纯黑` 的完整输出为期望；改造后 `any/any` 必须与它 `toEqual`。
  - 通勤 vs 街头：同一输入至少一处角色选色不同。
  - 18-24 vs 55+：同一输入至少一处角色选色不同。
  - 遍历 6 个年龄档 × 7 个风格（含 `any`），所有硬约束仍成立（互异、与上衣 ΔE≥3、主方案+2 备选）。
  - **池外提升**：构造一个基础分排第 9、但被画像偏好明显抬高的颜色，断言它能进入候选池；若进不去，把每角色池从 8 扩到 12，而不是调大偏好幅度。
  - **排名不截断**：断言 `scoreColor` 的排名分在基础分接近 1 时仍能体现正向偏好；`clamp` 只允许出现在展示边界。
- `url-state.test.ts`
  - 旧链接无 `a`/`f` → `'any'`。
  - 非法值 → `'any'`。
  - `55-plus` 往返一致；手写 `?a=55+` 回落 `'any'`（记录为预期，不静默修）。
  - `toSearch` 在 `'any'` 时省略参数。
  - 解析与序列化往返一致。
  - 步骤回退顺序符合第六节；显式 `step=gender` 仍跳过画像。
  - `STEPS` 的 id、标签、前置条件与顺序只存在一份。
- `ProfileStep.test.tsx`（可选，不新增依赖）
  - 用 `renderToStaticMarkup`（已有先例 `Mannequin.test.tsx:1`）断言两组选项、**13 个 `[role="radio"]`**（不是 13 个 `button`；下一步按钮也是 `button`，总数是 14）、默认 `any` 选中、下一步可用。
- 集成/手工场景（无 E2E 框架，写入验收清单）
  - **结果 → 画像 → 结果**：在结果页点「画像」，改风格，直接点「配色」返回结果；断言推荐重算、徽章/说明与配色一致，且无需连点四次「下一步」。
  - **reset**：点「重新开始」落在画像步骤，age/style 为 `any`。
  - **activeCombo**：切到方案 3，回画像改风格，再回结果，停在方案 1。
  - **步骤编号**：五个步骤卡片分别显示 `Step 1 / 5` 到 `Step 5 / 5`。
  - **360px**：五步指示器无横向溢出；两组选项换行整齐；触控目标 ≥44px。

### 验证命令

```bash
pnpm test
pnpm --reporter=append-only run lint
pnpm build
```

`pnpm lint` 的默认 reporter 在本机实测会 `Linter process terminated abnormally (possibly out of memory)`；README.md:15 已给出 append-only 变体，验证时以它为准。`pnpm build` 基线通过，但已有 `504.19 kB` 产物超过 500 kB 的警告；这是既有问题，本次不处理。

引用实际输出与退出码，不以推测代替。

### 视觉核验

- 宽度：360 / 768 / 1280；主题：浅色、深色。
- 画像页：始终单列；即使已选过性别也不出现人台；四色细条存在且不抢焦点。
- 选项：每组方向键可切换；Tab 只进出一组；焦点环在深浅两主题都可见；每项 ≥44px 高。
- 5 步指示器在 360px 不溢出、不截断标签；7 个风格胶囊换行整齐。
- 结果页：两项都「不限」时无徽章、无说明；至少一项非「不限」时有徽章与一句说明；说明不与和谐说明挤在一起。
- 对比度：读取计算样式，确认选中态在深浅两主题下 ≥4.5:1，不只靠肉眼判断。
- 减少动态：开启 `prefers-reduced-motion` 后，页面切换不播放位移/淡入。

## 九、风险与代价

- 画像默认「不限」，部分用户会直接跳过；这是选择「允许不限」的必然代价。
- 25-34 为基准档，与「不限」结果相同；用户可能视为无效果。
- 年龄规则只表达偏好，不表达「适合/不适合」；文案必须保持克制，避免伪科学。
- 引擎新增约 60 行规则数据与 20 行合成逻辑；不新增依赖。

## 十、工程评审修正（2026-11-11）

完整报告：`docs/superpowers/reviews/2026-11-11-eng-review.md`。已回写本 spec 的修正：

1. 年龄 URL id 从 `55+` 改为 `55-plus`，避免查询串把 `+` 解码成空格。
2. 步骤顺序收敛为唯一 `STEPS` 来源，消除四处手工同步。
3. `AGE_PROFILES['25-34'] = null` 短路，避免 `undefined` 目标值产生 `NaN`。
4. `preferenceFor` 接收已计算的 OKLCH，避免重复转换。
5. `parseState` / `initialState` / `reset` 显式补 `'any'`，不让 `undefined` 进入引擎。
6. 回归锚点必须在改引擎前固化；新增 URL、42 组画像约束、画像组件静态渲染测试。
7. 验证命令改用 `pnpm --reporter=append-only run lint`；记录 build 的既有 504 kB 警告。
8. `.impeccable/surfaces/src-app-tsx.md` 的 STORY / FIRST VIEWPORT 必须在同一次变更内更新。

已公开的隐藏假设见评审报告；其中年龄写入分享 URL、画像默认「不限」为【陛下】已拍板项。

## 十一、设计评审修正（2026-11-11）

完整报告：`docs/superpowers/reviews/2026-11-11-design-review.md`。七维评分与修复：

| 维度 | 修复前 | 修复后 |
|---|---:|---:|
| Pass 1 信息架构 | 6/10 | 8/10 |
| Pass 2 交互状态 | 5/10 | 8/10 |
| Pass 3 用户旅程 | 5/10 | 8/10 |
| Pass 4 AI Slop 风险 | 7/10 | 8/10 |
| Pass 5 设计系统对齐 | 5/10 | 8/10 |
| Pass 6 响应式与无障碍 | 5/10 | 8/10 |
| **总体（取最低）** | **5/10** | **8/10** |

已拍板的设计决策：

1. 标题用「年龄与穿衣风格」，不用「画像」。
2. 首屏加细四色条作为视觉锚点，复用页头四色。
3. 两组选项用 Radix `RadioGroup`，方向键组内切换。
4. 画像步骤始终单列，不显示人台，即使已选过性别。

仍未闭合的：项目没有 `DESIGN.md`；本次用 spec 内的 token 表作为依据，实现完成后由 impeccable documenter 从成品生成，不手写第二份现状文档。

## 十二、Codex 第二意见修正（2026-11-11）

完整逐字输出与处置：`docs/superpowers/reviews/2026-11-11-codex-second-opinion.md`。Codex（`auto/deepseek-v4.1-flash`，read-only）第一次 high effort 在 540s 超时，第二次 medium effort 完成，`VERDICT: FINDINGS`，8 条全部接受并回写：

1. **Critical：`preferenceFor` 缺 `family` 输入。** 40% 的偏好来自 `ColorEntry.family`，OKLCH 只有 l/c/h；`khaki/camel/olive/taupe` 是 neutral，`clay-pink/grey-blue` 是 earth，靠色相推断会与颜色选择器不一致。已改为接收 `ColorEntry` + 已算好的 Oklch，family 直接取 `color.family`。
2. **High：评分接入位置与截断。** 偏好必须在 `scoreColor` 内、`candidatesFor` 排序与 `.slice(0, 8)` 之前计入；排名不 clamp；若池外颜色无法被提升，把池从 8 扩到 12，不靠调大幅度。
3. **High：步骤编号硬编码。** `GenderStep.tsx:29`、`RegionStep.tsx:93`、`ColorStep.tsx:55` 仍是 `Step X / 4`；`RegionStep`/`ColorStep` 已加入修改清单，编号由共享 `STEPS` 推导。
4. **High：useMemo 依赖与参数。** `recommend()` 接收 `age/style`，`useMemo` 依赖加入两者；补「结果 → 画像 → 结果」测试。
5. **High：StepIndicator 启用逻辑。** 不能沿用 `enabled = index <= currentIndex`；改为按 `canGo`/state 前置条件启用，`done` 也按状态推导。
6. **Medium：reset 跳过画像。** `reset()` 的 `step` 改为 `'profile'`。
7. **Medium：activeCombo 未重置。** 画像 age/style 变化时同样 `setActiveCombo(0)`。
8. **Medium：360px 指示器仍溢出。** `sm` 以下 `px-1 gap-1`、圆点 `h-4 w-4`，完成态可隐藏数字圆点；实测无横向溢出。

与 Claude 评审的重叠：第 2、4、5、8 条此前已部分识别；第 1、3、6、7 条为 Codex 新增。两次独立评审在「评分接入、useMemo、指示器、360px」上方向一致。

## 十三、验收标准

1. 新用户从画像步骤开始，选择任意组合都能进入结果。
2. 选择通勤与街头，在同一上衣/地区/性别下得到可观察的不同推荐。
3. 选择 18-24 与 55+，在同一输入下得到可观察的不同推荐。
4. 旧分享链接打开后配色与当前版本完全一致。
5. `pnpm test`、`pnpm --reporter=append-only run lint`、`pnpm build` 全部通过。
6. 360px 移动端与深浅主题下无布局溢出、无对比度问题。
