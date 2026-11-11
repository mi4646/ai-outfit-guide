# 穿搭配色指南

按「性别 → 地区/定位 → 季节 → 上衣颜色」的顺序，给出一套可执行的配色建议：内搭、裤子、鞋、点缀，外加 2 套备选与避雷色。

纯前端、确定性规则引擎，无后端、无账号、无 API Key。

## 开发

需要 Node >= 20.19、pnpm 9（`packageManager` 已固定 `pnpm@9.15.0`）。

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # Vitest：色数学、季节映射、推荐引擎
pnpm lint       # oxlint（若 pnpm 默认 reporter 报 OOM，用 pnpm --reporter=append-only run lint）
pnpm build      # tsc -b && vite build
pnpm preview    # 预览 dist/
```

## 结构

| 路径 | 作用 |
|---|---|
| `src/data/colors.ts` | 60 个服装色，含中文名、HEX、色系 |
| `src/data/regions.ts` | 34 个省级行政区 + 9 个气候区（含海外） |
| `src/lib/color.ts` | OKLCH 转换、色相距离、CIEDE2000、可读文字色 |
| `src/lib/season.ts` | 地区 + 月份 → 春夏秋冬；浏览器定位就近匹配省份 |
| `src/lib/recommend.ts` | 角色候选池、评分、组合去重、理由生成 |
| `src/lib/url-state.ts` | 四步状态与 URL 参数互转（刷新/分享不丢） |
| `src/components/mannequin/` | 男/女两套内联 SVG 人台；五区 path（内搭/上衣/裤/鞋/点缀） |
| `src/components/MannequinPanel.tsx` | 性别后常驻的「配色预览」面板，含图例与区域高亮 |
| `src/components/` | 四步向导、结果页、色块、主题切换 |

## 规则口径

- 季节：气候区 × 当前月份自动推导，可手动覆盖；南半球定位会反转季节。
- 评分：色相和谐 25%–40%、明度对比、季节适配、饱和度、性别倾向、角色锚定；具体权重在 `recommend.ts` 的 `ROLE_WEIGHTS`。
- 结果：同输入永远同输出；主方案 + 2 套备选；衣物之间按 CIEDE2000 去重。
- 定位：`navigator.geolocation`，坐标只在本地计算、不上传；HTTP 局域网访问时浏览器会禁用定位，自动退回手动选省。
- 人台：性别选择后常驻预览；地区/上衣步骤先显示占位，选上衣后立即填色，结果页五区联动；切换方案时颜色过渡 200ms。
- 主题：浅色/深色均使用 CSS token；色块文字颜色按 WCAG 对比度自动取黑/白。

## 素材与许可

- 人台 SVG、五区 path、图例均由本项目自绘，无第三方素材授权依赖。
- 调研中参考过的素材不进入产品：RuiC-PoseAtlas 的图片禁止再分发；shisei 的 CC0 线稿只作姿态/比例参考；未复制 LPC（GPL/CC-BY-SA）、PixelDoll、paper-doll-studio 等项目的代码或素材。

## 首版不做

登录、后端、图片上传、衣橱库存、虚拟试穿、生成式图像、LLM 文案、多语言、支付、3D、姿势/体型切换。

## License

[MIT](LICENSE) © 2026 mi4646


后续若加 LLM 文案，只需在现有纯函数结果外包装一层 API，推荐引擎不变。
