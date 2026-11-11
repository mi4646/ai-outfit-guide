# Codex 独立第二意见（2026-11-11）

- Target: `docs/superpowers/specs/2026-11-11-outfit-profile-steps-design.md`
- Model: `auto/deepseek-v4.1-flash`（Codex exec，read-only sandbox）
- Session: `01a1c86b-27a1-7e23-89e4-59baef0dda71`
- Tokens: 449,810（input 408,344；output 41,466）
- Attempt 1: high effort，540s 超时（exit 124，`VERDICT: unavailable`）
- Attempt 2: medium effort，完成（exit 0）

## CODEX SAYS（逐字）

1. **Critical** — 计划 §三/§四，`src/data/colors.ts:9`：`preferenceFor(oklch, role, topL, row)` 没有 `family` 输入，但 40% 的偏好来自 `ColorEntry.family`。Oklch 只有 l/c/h；数据里 `khaki/camel/olive/taupe` 是 `neutral`，`clay-pink/grey-blue` 是 `earth`，靠色相推断会与颜色选择器显示的家族不一致。修：签名改为接收 `ColorEntry`（或 `family`）加已算好的 Oklch，并对 60 个颜色做 family 映射测试。

2. **High** — 计划 §四，`src/lib/recommend.ts:277`：`candidatesFor` 先按基础分排序并 `.slice(0, 8)`，组合搜索只在这 8 个里做；计划没说明画像加分是在 `scoreColor` 内、切池前还是切池后。若在切池后，第 9 名永远无法被画像偏好提升；即使切池前，top-8 仍是硬上限。`clamp(...,0,1)` 还会压缩接近 1 的正向加分，而 ±0.20 的上限又可能压过季节/性别权重。修：在 `scoreColor` 内、排序/截断前加分；比较时不 clamp；扩大或取消 top-8；加“基础池外颜色被画像提升”的测试，并用实际分数间距校准幅度。

3. **High** — 计划 §五/§七，`src/components/GenderStep.tsx:29`、`src/components/RegionStep.tsx:93`、`src/components/ColorStep.tsx:55`：新增第五步后仍写 `Step 1/4`、`2/4`、`3/4`，且 `RegionStep`/`ColorStep` 不在计划的修改文件清单里。上线后三个页面进度文案全错。修：把两者加入清单，用共享 `STEPS` 计算 `Step X / 5`，不要逐组件硬编码。

4. **High** — `src/App.tsx:41`：`useMemo` 依赖仍是 gender/province/month/top/season，计划也没明确把 `age/style` 传给 `recommend`。从结果页返回画像改风格再回来，推荐对象不会重算，但 `ResultView` 徽章/说明用新 props，会出现“新偏好 + 旧配色”。修：传入 `age/style` 并加入依赖；补 result→profile→result 的测试。

5. **High** — `src/components/StepIndicator.tsx:25`：`enabled = index <= currentIndex`。只换成 5 项数组而不改这行，从结果页点“画像”改完风格后，性别/地区/上衣/配色全部禁用；用户只能连点四次“下一步”，与“随时可以改”冲突。修：让 `StepIndicator` 接收 `canGo`/state，按前置条件启用；`done` 也按状态推导；测试能直接从画像回到结果。

6. **Medium** — `src/App.tsx:99`：`reset()` 仍写 `step: 'gender'`，计划只要求重置 `age/style`。用户点“重新开始”会跳过新第一步。修：`step: 'profile'`，同时 `age/style` 置 `any`；测试 reset 后落在画像。

7. **Medium** — `src/App.tsx:38`、`src/App.tsx:129`、`src/App.tsx:150`：地区/颜色变化都会 `setActiveCombo(0)`，画像变化没有。用户在方案 3 时回画像改风格，再回来仍停在方案 3（或越界回退），看不到新的主方案。修：画像的 `age/style` 更新时同样 `setActiveCombo(0)`，并补测试。

8. **Medium** — `src/components/StepIndicator.tsx:21`：5 个按钮每个约 66px（20px 圆点 + 6px 间距 + 2 个 11–12px 汉字 + 16px 内边距），加外层 gap/连接线超过 360px 下 `main px-4` 的 328px；计划给的 fallback 仍保留内层 `gap-2` 和 20px 圆点，约 350px，仍会溢出。修：`sm` 以下用 `px-1 gap-1` 并把圆点缩到 `h-4 w-4`（或完成态隐藏数字圆点），在 360px 实测无横向溢出。

Recommendation: 先定死 `preferenceFor` 的 family 输入与评分接入位置/幅度并补测试，再处理步骤编号、useMemo 与导航状态，因为这两组决定画像是否真的生效，其余是可见回归。
VERDICT: FINDINGS

## 处置

8 条全部接受并回写 spec：

| # | 处置 | 回写位置 |
|---|---|---|
| 1 | 接受 | `preferenceFor` 改为接收 `ColorEntry` + 已算好的 Oklch；family 直接取 `color.family` |
| 2 | 接受 | 偏好计入 `scoreColor`，在排序/`.slice(0,8)` 之前；排名不 clamp；增加池外提升与幅度校准测试 |
| 3 | 接受 | 文件清单加入 `RegionStep.tsx`、`ColorStep.tsx`；`Step X / 5` 由 `STEPS` 推导 |
| 4 | 接受 | `recommend()` 接收 age/style；`useMemo` 依赖加入两者；补 result→profile→result 测试 |
| 5 | 接受 | `StepIndicator` 改为按 `canGo`/state 启用，done 按状态推导 |
| 6 | 接受 | `reset()` 的 `step` 改为 `'profile'` |
| 7 | 接受 | 画像 age/style 变化时 `setActiveCombo(0)` |
| 8 | 接受 | 360px 下 `px-1 gap-1`、圆点 `h-4 w-4`，实测无横向溢出 |

与 Claude 评审的重叠：第 2、4、5、8 条此前已部分识别（评分接入、useMemo、指示器、360px）；第 1、3、6、7 条是 Codex 新增的高价值发现，已补入 spec。
