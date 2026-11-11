# Design Review: 画像步骤（年龄 / 穿衣风格）

- Target: docs/superpowers/specs/2026-11-11-outfit-profile-steps-design.md
- Date: 2026-11-11
- Head: a8e03f4
- Reviewer: plan-design-review
- UI scope: 有（新增 ProfileStep、StepIndicator 第五项、ResultView 徽章与说明、App 布局分支）
- DESIGN.md: 不存在。本次以 spec 内的 token/组件表为依据；实现后由 impeccable documenter 从成品生成。
- TODOS.md: 不存在。

## 预审

- 现有模式：Card / CardTitle / CardDescription / Button(size lg) / Badge / RadioGroup；季节按钮的胶囊样式；页头四色点；`src/index.css` 的暖纸/墨色/朱红 token。
- 复用而非重建：不必新增组件库或依赖；RadioGroup 已安装。
- 视觉世界：impeccable surface brief 已钉死“暖纸底、墨线、朱红焦点、人台是唯一色块”。本次只做局部延伸，不换世界。

## Step 0：初始设计完整度

**5/10**。计划说清了流程与规则，但没有说清画像页首屏长什么样、五种交互状态、七维中最容易翻车的响应式与无障碍，也没有 DESIGN.md 或 token 映射。10/10 应该是：任何实现者只看 spec 就能做出与现有编辑器世界一致、键盘可用、360px 不溢出的画像页，且知道每个状态显示什么。

## Step 0.5：视觉稿

跳过生成。理由：本计划是对已钉死视觉世界的局部延伸，impeccable 的规则要求 refinement 保留既有身份；另起三张新视觉方向会与现有暖纸/朱红/人台世界冲突。现有应用本身是视觉参考，spec 已给出结构图与 token 表。该跳过不阻塞评审。

## Pass 1：信息架构 — 6/10 → 8/10

- 缺口：没有首屏结构图；没有说明画像在“未选性别”和“已选性别”下是两种布局；结果页新增内容的层级未定。
- 修复：spec 增加 ASCII 首屏结构；明确画像始终单列、不显示人台；结果页徽章追加在现有徽章后，说明放在和谐说明下方。
- 余下 2 分：没有真实用户测试首屏扫描效率。

## Pass 2：交互状态 — 5/10 → 8/10

- 缺口：没有状态表；默认、只选一项、两项都选、非法 URL、结果说明为空、减少动态均未写。
- 修复：spec 增加交互状态表；明确非法 `a`/`f` 静默回落「不限」；结果说明两项都 any 时返回 null；纯前端无 loading/error。
- 余下 2 分：没有运行时状态测试，靠实现后的视觉核验。

## Pass 3：用户旅程 — 5/10 → 8/10

- 缺口：没有故事板；画像在性别前，存在“先填表、后见人台”的摩擦风险。
- 修复：spec 增加五步故事板；首屏用四色细条、默认「不限」、一句说明降低表单感；选完性别才出现人台，保留回报时刻。
- 余下 2 分：情绪弧线未做可用性测试。

## Pass 4：AI Slop 风险 — 7/10 → 8/10

- 分类：OPERATE（应用 UI）。
- 硬性拒绝项：0。无 3 列功能网格、无渐变、无 emoji 装饰、无堆叠卡片首页。
- Litmus：品牌可辨（暖纸/朱红/四色）；一个视觉锚点（人台，但画像页无人台，因此补四色细条）；标题可扫描；每组一个任务；卡片是交互本身；动效沿用现有；去掉阴影仍成立。
- 缺口：13 个同形胶囊容易像设置面板；首屏无人台时锚点弱。
- 修复：四色细条作为锚点；两组各有一个小标题；风格说明只在选中时出现；不增加装饰性图标或渐变。
- 余下 2 分：13 个选项的密度仍是产品选择，不做渐进披露。

## Pass 5：设计系统对齐 — 5/10 → 8/10

- 缺口：没有 DESIGN.md；spec 只说“沿用现有组件”，没有具体 token 与 class。
- 修复：spec 增加 token/组件映射表（Card、眉题、标题、说明、胶囊、选中/未选中、焦点环、说明文字、按钮、徽章、间距）。
- 余下 2 分：DESIGN.md 仍不存在；实现后生成，不在本次计划里手写第二份现状文档。

## Pass 6：响应式与无障碍 — 5/10 → 8/10

- 缺口：只写了 360/768/1280 和 `aria-pressed`；缺 44px 触控目标、`focus-visible`、方向键导航、屏幕阅读器标签、对比度、5 项指示器溢出策略。
- 修复：spec 明确 360px 单列与胶囊换行；44px 最小高度；RadioGroup 组内方向键、Tab 进出一组；每组 `aria-label`；四色细条 `aria-hidden`；焦点环；对比度读取计算样式；StepIndicator 优先缩减间距而非隐藏标签；减少动态沿用现有。
- 余下 2 分：实现后需在 360/768/1280 与深浅主题下逐项截图核验。

## Pass 7：未决设计决策

已解决 4 项：

1. 标题用「年龄与穿衣风格」。
2. 首屏加细四色条。
3. 两组用 Radix RadioGroup。
4. 画像始终单列，不显示人台。

剩余 0 项需要用户现在拍板。DESIGN.md 的缺失作为实现后产物处理，不阻塞本计划。

## NOT in scope

- 不做画像步骤的渐进披露（先年龄、再风格分屏）：两组同屏更短，已接受。
- 不做风格色块预览：会让人误以为色块就是结果。
- 不做设计稿生成：既有视觉世界已钉死。
- 不做 DESIGN.md：实现后从成品生成。

## What already exists

- `Card` / `CardTitle` / `CardDescription` / `Button` / `Badge` / `RadioGroup`：`src/components/ui/`。
- 胶囊选中态：`src/components/RegionStep.tsx:197-202`。
- 页头四色：`src/App.tsx:199`。
- 暖纸/墨色/朱红 token：`src/index.css:5-22`。
- 结果页 `aria-live`：`src/components/ResultView.tsx:83`。

## Implementation Tasks

- [ ] **D1 (P1, human: ~4h / CC: ~30min)** — ProfileStep — 按 spec 实现单列卡片、两组 RadioGroup、四色细条、默认「不限」、下一步。
  - Surfaced by: Pass 1 / Pass 2 / Pass 4
  - Files: src/components/ProfileStep.tsx, src/App.tsx
  - Verify: 360/768/1280 双主题截图；两组方向键可用
- [ ] **D2 (P1, human: ~1h / CC: ~10min)** — App — 画像步骤排除右侧人台，即使已选过性别也保持单列。
  - Surfaced by: Pass 1 — `App.tsx:222` 的条件分支
  - Files: src/App.tsx
  - Verify: 从结果页返回画像，右侧无人台
- [ ] **D3 (P1, human: ~1h / CC: ~10min)** — StepIndicator — 第五项在 360px 不溢出，优先缩减间距与内边距。
  - Surfaced by: Pass 6
  - Files: src/components/StepIndicator.tsx
  - Verify: 360px 截图，5 个标签完整
- [ ] **D4 (P1, human: ~2h / CC: ~15min)** — ResultView — 年龄/风格徽章与整体说明；两项都 any 时不渲染。
  - Surfaced by: Pass 1 / Pass 2
  - Files: src/components/ResultView.tsx, src/lib/profile.ts
  - Verify: 四种组合（都 any / 只风格 / 只年龄 / 两者）截图
- [ ] **D5 (P2, human: ~1h / CC: ~10min)** — A11y — 焦点环、44px、组标签、说明关联、对比度复核。
  - Surfaced by: Pass 6
  - Files: src/components/ProfileStep.tsx, src/components/StepIndicator.tsx
  - Verify: 键盘走查 + 计算样式对比度
- [ ] **D6 (P3, human: ~2h / CC: ~15min)** — DESIGN.md — 实现完成后由 impeccable documenter 从成品生成。
  - Surfaced by: Pass 5
  - Files: DESIGN.md
  - Verify: 生成文档与 token 表一致

## Completion Summary

```text
+====================================================================+
|         DESIGN PLAN REVIEW — COMPLETION SUMMARY                    |
+====================================================================+
| System Audit         | no DESIGN.md; UI scope: ProfileStep,         |
|                      | StepIndicator, ResultView, App layout        |
| Step 0               | 5/10; focus: states, responsive, a11y        |
| Pass 1  (Info Arch)  | 6/10 -> 8/10 after fixes                     |
| Pass 2  (States)     | 5/10 -> 8/10 after fixes                     |
| Pass 3  (Journey)    | 5/10 -> 8/10 after fixes                     |
| Pass 4  (AI Slop)    | 7/10 -> 8/10 after fixes                     |
| Pass 5  (Design Sys) | 5/10 -> 8/10 after fixes                     |
| Pass 6  (Responsive) | 5/10 -> 8/10 after fixes                     |
| Pass 7  (Decisions)  | 4 resolved, 0 deferred                       |
+--------------------------------------------------------------------+
| NOT in scope         | written (4 items)                            |
| What already exists  | written                                      |
| TODOS.md updates     | 0 items                                      |
| Approved Mockups     | 0 generated, 0 approved                      |
| Decisions made       | 4 added to plan                              |
| Decisions deferred   | 0                                            |
| Overall design score | 5/10 -> 8/10                                 |
+====================================================================+
```

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | /plan-ceo-review | Scope & strategy | 0 | — | — |
| Outside Review | /codex (explicit) | Independent 2nd opinion | 1 | COMPLETED | 8 findings; see codex-second-opinion.md |
| Eng Review | /plan-eng-review | Architecture & tests | 1 | ISSUES OPEN | 21 issues, 0 critical gaps |
| Design Review | /plan-design-review | UI/UX gaps | 1 | ISSUES OPEN | score 5/10 -> 8/10, 4 decisions |
| DX Review | /plan-devex-review | Developer experience gaps | 0 | — | — |

**OUTSIDE COVERAGE:** codex, plan-review, completed on the second attempt (8 findings; design outside voices were skipped to avoid duplicate provider calls).

**VERDICT:** ENG + DESIGN REVIEWS MAPPED — eng 21 issues and design score 5→8 are recorded; Codex completed with 8 findings, all accepted into the spec.

NO UNRESOLVED DECISIONS
