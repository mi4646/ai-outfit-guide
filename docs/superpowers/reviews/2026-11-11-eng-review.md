# Engineering Review: 画像步骤（年龄 / 穿衣风格）

- Target: docs/superpowers/specs/2026-11-11-outfit-profile-steps-design.md
- Date: 2026-11-11
- Head: a8e03f4
- Mode: FULL_REVIEW（原范围，不缩）
- Reviewer: plan-eng-review（按 gstack 技能分区手工执行；该技能未注册为可直接调用的 Skill）

## Scope Challenge

### 复杂度

| 项 | 数量 |
|---|---|
| 新增文件 | 4（profile.ts、ProfileStep.tsx、profile.test.ts、url-state.test.ts） |
| 修改文件 | 7（recommend.ts、url-state.ts、App.tsx、StepIndicator.tsx、GenderStep.tsx、ResultView.tsx、recommend.test.ts） |
| 新增规则模块 | 1（src/lib/profile.ts） |
| 新公共边界 | 1（画像规则 → 推荐引擎） |

11 个文件触发复杂度门槛。已由【陛下】拍板：保留原结构（profile.ts 独立），年龄写入 URL。

### 已有方案

- 单选框交互已存在：GenderStep.tsx:37 的 RadioGroup、RegionStep.tsx:183 的季节 pill 组。画像步骤复用季节 pill 的视觉与 aria-pressed 模式，不新增组件依赖。
- URL 状态互转已存在：src/lib/url-state.ts:18,60,71。本次只扩展参数与步骤，不重写协议。
- 评分与理由生成已存在：src/lib/recommend.ts:258 的 scoreColor、:314 的 reasonFor。本次只在基础分上叠加两项偏好，不重建引擎。
- 测试栈已存在：Vitest 5.1，pnpm test 基线 41/41 通过；服务端渲染断言已有先例 Mannequin.test.tsx:1,40，画像组件可不加依赖做静态渲染测试。

### Reality rows

- REALITY: premise-table pass, 6 claims verified, 0 unverified (docs/superpowers/specs/2026-11-11-outfit-profile-steps-design.md:1)
- REALITY: already-done pass, no prior profile/age/style commits (git log --oneline -10 -> a8e03f4)
- REALITY: surface-check pass, pnpm test / pnpm --reporter=append-only run lint / pnpm build (package.json:27-31)
- REALITY: binding-decisions pass, no branch decisions on record (a8e03f4; gstack-decision-search --scope branch -> empty)
- REALITY: numbers pass, 60 colors / 41 tests / 43 region+zone rows (src/data/colors.ts:12, src/lib/recommend.test.ts:30, src/data/regions.ts:33,45)
- REALITY: deferred-asks pass, no linked issue (docs/superpowers/specs/2026-11-11-outfit-profile-steps-design.md:1)
- REALITY: pr-count pass, default one PR per wave (a8e03f4; no .gstack/ship-policy.json)

## Architecture Review

- [INFORMATIONAL] (confidence: 9/10) src/lib/url-state.ts:5, src/components/StepIndicator.tsx:5, src/lib/url-state.ts:71, src/App.tsx:88 — 步骤顺序在四处手工同步：Step 联合类型、STEPS 数组、resolveStep 的 if 链、canGo 的 if 链。加第五步必须四处都改，漏一处就出现“指示器有画像、resolveStep 却回退到性别”的错位。修法：在 url-state.ts 导出唯一 STEPS（id、label、前置条件），StepIndicator 直接 map，resolveStep/canGo 用它推导。
- [INFORMATIONAL] (confidence: 9/10) src/lib/url-state.ts:18, src/App.tsx:23 — parseState 返回 Partial<AppState>，而 AppState 的 age/style 是非空联合类型。若 initialState 不显式合并 'any'，undefined 会进入 recommend 的输入，偏好计算得到 NaN，整组分数失效。修法：parseState 总是返回 age/style（缺失即 'any'），或 initialState 显式合并；测试覆盖无参数入口。
- [INFORMATIONAL] (confidence: 9/10) src/lib/profile.ts 规则表 — 25-34 与 'any' 都要求偏好恒为 0。如果实现为“查表得到 undefined 的目标饱和度再计算”，会得到 NaN。修法：AGE_PROFILES['25-34'] = null，preferenceFor 对 null 直接返回 0；测试断言两者都等于 0。
- [INFORMATIONAL] (confidence: 8/10) src/lib/recommend.ts:265 — scoreColor 已经计算 candidate = toOklch(color.hex)。若 preferenceFor 内部再调用一次 toOklch，每个候选色多一次转换（60 色 × 4 角色）。修法：preferenceFor 接收已计算的 Oklch（以及 topL），不在规则层重复转换。
- [INFORMATIONAL] (confidence: 9/10) spec 数据模型 — 年龄 ID 用 '55+' 作为 URL 值时，手写链接 ?a=55+ 会被 URLSearchParams 解码为 '55 '（加号等于空格）。实测：new URLSearchParams('a=55+').get('a') === '55 '。toSearch 用 set 会编码成 %2B，往返没问题，但分享/手改链接会静默回落到 any。修法：URL ID 用 '55-plus'，展示标签仍是 '55+'；测试覆盖 55-plus 往返。
- [INFORMATIONAL] (confidence: 8/10) .impeccable/surfaces/src-app-tsx.md:16,18 — 该 surface brief 的 STORY 与 FIRST VIEWPORT 仍以“选完性别后进入工作室”为起点。新增画像步骤后首屏故事变了，若不更新，设计评审与后续 agent 会按旧起点判断。修法：同一变更内更新 STORY 与 FIRST VIEWPORT。
- [INFORMATIONAL] (confidence: 7/10) src/components/StepIndicator.tsx:21 — 指示器当前 4 项；5 项在 360px 下每个 item 的 flex-1 会变窄，中文标签加序号圆点可能截断。修法：360px 实测；必要时改为 flex-wrap 或缩短标签（画像/性别/地区/上衣/配色已是 2 字，空间仍紧）。
- [INFORMATIONAL] (confidence: 7/10) src/components/ResultView.tsx:87 — 结果页徽章目前只有季节、地区、性别。新增年龄/风格徽章时，'any' 必须不显示；整体说明在两项都为 any 时必须为 null，否则每个结果都多一句空话。修法：note 函数返回 string | null，ResultView 条件渲染。
- [INFORMATIONAL] (confidence: 7/10) src/components/ProfileStep.tsx（拟新增）— 用 role=group + aria-pressed 与现有季节组一致，但 6+7 个选项没有方向键导航。修法：设计评审确认用 RadioGroup（已有 radix 依赖）还是保留按钮组并确保 Tab 顺序与可见焦点。
- [INFORMATIONAL] (confidence: 7/10) src/lib/url-state.ts:71 — 显式 step=gender 的旧链接会直接进入性别，跳过画像。这是有意的向后兼容，但要在 spec 写明，避免后续被当成 bug 修掉。
- [INFORMATIONAL] (confidence: 8/10) src/lib/recommend.ts:436 — Recommendation 输出不需要新增 age/style 字段；ResultView 从 App 接收 props 即可，避免引擎输出混入 UI 状态。
- [INFORMATIONAL] (confidence: 6/10) src/lib/profile.ts 与 src/lib/recommend.ts 都需要 clamp。recommend.ts 的 clamp 是本地函数（:148），profile.ts 无法复用它而不造成循环依赖。两行重复可接受，不要为它新建共享 util；spec 应写明这个取舍。

## Code Quality Review

- [INFORMATIONAL] (confidence: 8/10) src/lib/profile.ts — 规则表是数据，不是 if 长链，方向正确。每个风格一行、每个年龄一行；备注文案与规则同住一处，避免标签与规则分叉。
- [INFORMATIONAL] (confidence: 8/10) src/lib/recommend.ts:258 — 仅在 scoreColor 里加两项加法，保持基础分与现有权重表不动。这是兼容旧链接的最小改法，也避免重新调 6 个权重的 24 个数值。
- [INFORMATIONAL] (confidence: 7/10) src/components/ResultView.tsx:100 — 整体说明的文案应由 profile.ts 导出（STYLE_NOTES / AGE_NOTES），不要写死在 ResultView。画像步骤与结果页共用同一句，避免两处文案漂移。
- [INFORMATIONAL] (confidence: 7/10) src/lib/url-state.ts:60 — age/style 为 'any' 时不写 URL。这样“从未选择”和“显式选不限”得到同一个链接，符合现有 URL 最小化习惯；但测试要固定这个行为，避免以后改成总是写参数。
- [INFORMATIONAL] (confidence: 6/10) src/lib/profile.ts — PROFILE_AMPLITUDE 的两个数值（0.12/0.08）应带一行注释说明“为什么是这两个值”，否则下一个 agent 会随手改大改小。注释只写取舍，不写教程。

## Test Review

### 覆盖图

```text
CODE PATHS
[+] src/lib/profile.ts (new)
  ├── AGE_BANDS / STYLES ids
  │   ├── [GAP] ids unique, labels map 1:1
  │   └── [GAP] invalid id -> 'any'
  ├── preferenceFor
  │   ├── [GAP] 'any' and '25-34' -> 0
  │   ├── [GAP] all rows/roles within [-1, 1]
  │   └── [GAP] street accent > minimal accent for high chroma
[+] src/lib/recommend.ts
  ├── scoreColor
  │   ├── [★★ TESTED] existing weights, recommend.test.ts:49-160
  │   └── [GAP] any/any output equals pre-change golden
  ├── buildCombos
  │   ├── [★★ TESTED] distinct + 3 combos, recommend.test.ts:86-121
  │   └── [GAP] constraints hold across all 7x6 profiles
  └── reasonFor
      └── [★★ TESTED] contains 明度差, recommend.test.ts:102
[+] src/lib/url-state.ts
  ├── parseState
  │   ├── [GAP] no existing url-state.test.ts
  │   └── [GAP] a/f valid, invalid, missing; 55-plus round-trip
  ├── toSearch
  │   └── [GAP] omits any; round-trip
  └── resolveStep
      └── [GAP] 5-step order, old links, explicit step
[+] src/App.tsx
  ├── initialState / reset
  │   └── [GAP] age/style default to 'any'
  └── recommend useMemo deps
      └── [GAP] age/style included
[+] src/components/ProfileStep.tsx (new)
  ├── default any + next enabled
  │   └── [GAP] static render assertion
  └── keyboard / aria-pressed
      └── [GAP] manual visual check (no testing-library dependency)

USER FLOWS
[+] Fresh visit -> profile -> gender -> region -> color -> result
  └── [GAP] full journey
[+] Old result link -> result (no profile)
  └── [GAP] backward compatibility
[+] Change style/age -> result changes
  └── [GAP] visible difference in at least one role
```

### 必须补的测试

1. src/lib/url-state.test.ts（新建）
   - 旧链接无 a/f -> any；非法值 -> any；'55-plus' 往返一致；手写 '55+' -> any（记录为预期）。
   - toSearch 在 any 时省略 a/f；完整状态往返一致。
   - resolveStep：无性别 -> profile；有性别无地区 -> region；有性别地区无上衣 -> color；齐全 -> result；显式 step 的前置条件不满足时回落到首个缺失步骤。
   - Value: protects=URL 状态协议与旧链接兼容; fails_when=任一参数解析或步骤回退被改错; why_new=url-state.ts 当前无测试; seam=none; no_claim=浏览器历史行为（纯函数单测）
2. src/lib/profile.test.ts（新建）
   - ids 唯一；标签一一对应；所有风格/年龄 × 四角色的偏好落在 [-1,1]；any 与 25-34 为 0。
   - 街头在点缀角色对高饱和色的偏好高于极简；55+ 对低饱和的偏好高于 18-24。
   - Value: protects=画像偏好函数的值域与方向; fails_when=规则表被改反或 25-34 产生 NaN; why_new=新模块; seam=none; no_claim=真实用户审美（规则是产品假设）
3. src/lib/recommend.test.ts（扩展）
   - 改引擎前先固化 female/guangdong/7/纯黑 的完整输出为期望；改造后 age/style=any 必须 toEqual。
   - 通勤 vs 街头、18-24 vs 55+ 在同一输入下至少一处角色选色不同。
   - 遍历 6 年龄 × 7 风格（含 any），断言四角色互异、与上衣 ΔE>=3、仍返回主方案 + 2 备选。
   - Value: protects=旧链接逐字兼容 + 新维度真实生效 + 硬约束不破; fails_when=基础分被改、偏好未接入、去重失效; why_new=现有测试没有画像维度; seam=none; no_claim=视觉体感（像素与截图由设计评审负责）
4. src/components/ProfileStep.test.tsx（新建，可选）
   - 用 renderToStaticMarkup（已有先例）断言两组选项、13 个按钮、默认 any 选中、下一步可用。
   - Value: protects=默认值与非空渲染; fails_when=默认值丢失或按钮缺失; why_new=新组件; seam=none; no_claim=键盘交互（需真浏览器或 testing-library，本次不引入依赖）
5. 不新增依赖；不写 E2E；视觉与键盘由设计评审在 360/768/1280 双主题下核验。

### 回归规则

旧链接输出逐字一致是 CRITICAL 要求。必须在改 recommend.ts 之前先提交 golden 测试，而不是改完再补；否则无法证明兼容性。

## Performance Review

- 无新增请求、数据库或缓存路径。recommend 仍是纯函数；偏好计算是每候选色 O(1)，总量约 60 × 4，远小于现有 8^4 组合搜索。
- build 基线通过，产物 504.19 kB（gzip 164.73 kB），已有 >500 kB 警告；本次预计增加不足 2 kB，不构成新问题。
- 无 N+1、无阻塞调用、无内存增长点。

## Outside Voice

按【陛下】指定顺序，Codex 第二意见在设计与工程评审之后单独执行。本次工程评审的 outside voice 记为 skipped，原因：用户明确要求最后用 /codex 独立出第二意见，避免同一轮重复调用。报告中的 OUTSIDE COVERAGE 标为 deferred。

## 隐藏假设（必须公开）

| # | 假设 | 影响 | 处置 |
|---|---|---|---|
| H1 | 画像默认两项都是“不限”，下一步始终可用 | 新用户可直接跳过，新维度使用率可能很低 | 已接受（【陛下】选择允许不限）；文案写明可改 |
| H2 | 25-34 与“不限”结果完全相同 | 用户可能觉得选了没效果 | 文案标注“均衡，不额外调整”；规则保持 0 |
| H3 | 年龄档写入分享 URL | 分享链接暴露 10 年粗档位 | 已接受（【陛下】选择写入）；粗档位，不写生日 |
| H4 | 风格/年龄只调评分，不做候选池硬过滤 | 极端风格下仍可能出现与风格不完全相符的颜色 | 已接受（【陛下】选择加性调整）；测试测量差异 |
| H5 | 结果页只给一句整体说明，逐条理由不提画像 | 解释颗粒度低于现有明度差理由 | 设计评审确认；必要时把画像写进每条理由 |
| H6 | 旧链接 step=gender 跳过画像 | 老用户看不到新步骤 | 有意兼容；spec 写明 |
| H7 | 55+ 作为 URL ID 不安全（+ 被解码为空格） | 手写分享链接会静默回落 | 改为 55-plus；标签仍为 55+ |
| H8 | StepIndicator 5 项在 360px 可能溢出 | 移动端导航截断 | 视觉核验并允许换行/压缩 |
| H9 | 画像步骤没有测试库覆盖键盘 | 无障碍只靠人工检查 | 设计评审做键盘与焦点核验 |
| H10 | profile.ts 与 recommend.ts 各自保留 clamp | 两行重复 | 接受；不为此新建共享 util |

## Failure modes

| 路径 | 现实失败 | 处理 | 用户可见性 |
|---|---|---|---|
| parseState 收到 a=55+ | 年龄回落 any | 改用 55-plus，并测试 | 静默（已消除） |
| parseState 收到非法 a/f | 回落 any | 测试覆盖 | 静默但安全 |
| 25-34 查表得 undefined | 偏好 NaN，整组排序失效 | null 短路 + 测试 | 静默（必须消除） |
| 旧链接无 age/style | undefined 进入 recommend | parseState 默认 any + 测试 | 静默但结果正确 |
| 画像默认 any 直接下一步 | 用户跳过画像 | 文案引导，不阻塞 | 可见 |
| 5 项指示器溢出 | 标签截断 | 360px 实测 | 可见 |

Critical gaps: 0（每个新路径要么有测试，要么有明确的降级/可见处理）。

## NOT in scope

- 不新增配饰/帽子/包等人台区域：首版明确不做。
- 不改地区/季节、定位、主题、人台 SVG。
- 不做 E2E/Playwright 测试套件：本次不引入新依赖。
- 不做画像的账号持久化：无后端。

## What already exists

- 单选组：GenderStep.tsx:37（RadioGroup）、RegionStep.tsx:183（pill 组）。
- URL 协议：url-state.ts:18,60,71。
- 评分与理由：recommend.ts:258,314。
- 静态渲染测试先例：Mannequin.test.tsx:1,40。
- 验证命令：package.json:27-31；lint 的 append-only 变体见 README.md:15。

## Workstream parallelization

Sequential implementation, no parallelization opportunity。单一 React 应用，画像规则、URL 状态、App 与 UI 共享同一状态边界；拆成并行 worktree 会在 App.tsx 与 url-state.ts 上互相冲突。建议顺序：先 golden 测试，再 profile.ts，再 recommend.ts，再 url-state/App，最后 UI 与文档。

## Implementation Tasks

- [ ] **T1 (P1, human: ~1h / CC: ~10min)** — url-state — 把步骤顺序收敛为唯一 STEPS（id、label、前置条件），StepIndicator 与 resolveStep/canGo 从它推导。
  - Surfaced by: Architecture — 四处手工同步的步骤列表
  - Files: src/lib/url-state.ts, src/components/StepIndicator.tsx, src/App.tsx
  - Verify: pnpm test；新增的 resolveStep 用例覆盖 5 步与旧链接
- [ ] **T2 (P1, human: ~1h / CC: ~10min)** — tests — 在改引擎前固化 female/guangdong/7/纯黑 的 golden，并证明 any/any 改造后 toEqual。
  - Surfaced by: Test review — 旧链接逐字兼容是硬要求
  - Files: src/lib/recommend.test.ts
  - Verify: 先跑旧测试确认 golden 对当前实现通过，再改引擎
- [ ] **T3 (P1, human: ~3h / CC: ~25min)** — profile — 新建 profile.ts：类型、标签、规则表、preferenceFor；年龄 ID 用 55-plus，25-34 用 null 短路。
  - Files: src/lib/profile.ts, src/lib/profile.test.ts
  - Verify: pnpm test；偏好值域、零值、方向性用例
- [ ] **T4 (P1, human: ~2h / CC: ~15min)** — recommend — 在 scoreColor 加 0.12×style + 0.08×age，传入已计算的 Oklch；基础分与权重表不动。
  - Files: src/lib/recommend.ts, src/lib/recommend.test.ts
  - Verify: golden、风格/年龄差异、42 组画像约束
- [ ] **T5 (P1, human: ~2h / CC: ~15min)** — url-state — 增加 a/f 解析与序列化、any 省略、5 步 resolveStep。
  - Files: src/lib/url-state.ts, src/lib/url-state.test.ts
  - Verify: 旧链接、非法值、55-plus 往返、步骤回退
- [ ] **T6 (P1, human: ~4h / CC: ~30min)** — UI — ProfileStep（两组 pill，默认 any，下一步可用），GenderStep 返回画像；360px 与键盘核验。
  - Files: src/components/ProfileStep.tsx, src/components/GenderStep.tsx, src/App.tsx
  - Verify: pnpm build + 浏览器 360/768/1280 双主题
- [ ] **T7 (P2, human: ~2h / CC: ~15min)** — ResultView — 年龄/风格徽章（any 隐藏）与整体说明（全 any 时为 null）；文案来自 profile.ts。
  - Files: src/components/ResultView.tsx, src/lib/profile.ts
  - Verify: 设计评审截图；空说明不渲染
- [ ] **T8 (P2, human: ~1h / CC: ~10min)** — docs — 更新 PRODUCT.md、README.md、.impeccable surface brief 的 STORY/FIRST VIEWPORT。
  - Files: PRODUCT.md, README.md, .impeccable/surfaces/src-app-tsx.md
  - Verify: 文档中不再出现“四步”
- [ ] **T9 (P2, human: ~15min / CC: ~5min)** — verification — spec 的 lint 命令改为 pnpm --reporter=append-only run lint，并记录 build 的 504 kB 既有警告。
  - Files: docs/superpowers/specs/2026-11-11-outfit-profile-steps-design.md
  - Verify: 命令退出码 0，输出无 lint 错误

## Suppressed findings

无（低于置信度 5 的项未进入主报告）。

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | /plan-ceo-review | Scope & strategy | 0 | — | — |
| Outside Review | /codex (explicit) | Independent 2nd opinion | 1 | COMPLETED | 8 findings; see codex-second-opinion.md |
| Eng Review | /plan-eng-review | Architecture & tests | 1 | ISSUES OPEN | 21 issues, 0 critical gaps |
| Design Review | /plan-design-review | UI/UX gaps | 0 | PENDING | next step |
| DX Review | /plan-devex-review | Developer experience gaps | 0 | — | — |

**OUTSIDE COVERAGE:** codex, plan-review, completed on the second attempt (high-effort first attempt timed out); 8 findings recorded in `docs/superpowers/reviews/2026-11-11-codex-second-opinion.md`.

**VERDICT:** ENG REVIEW ISSUES OPEN — 21 mapped issues, 0 critical gaps; design review 5→8 and Codex 8 findings recorded, all mapped into the spec.

NO UNRESOLVED DECISIONS
