---
name: 穿搭配色指南
description: 暖纸上的确定性配色，一具可换色的 3D 人台
colors:
  paper: "#f7f5f0"
  ink: "#171614"
  card: "#fffdf8"
  muted: "#ece8df"
  muted-ink: "#655f57"
  border: "#ddd7cb"
  vermilion: "#b5432f"
  vermilion-ink: "#fffaf5"
  mannequin-skin: "#d8b49c"
  mannequin-line: "#2a2522"
  brand-ochre: "#c99a2e"
  brand-navy: "#1f2a44"
  brand-cream: "#f6f1e7"
typography:
  display:
    fontFamily: "PingFang SC, Hiragino Sans GB, Microsoft YaHei, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "PingFang SC, Hiragino Sans GB, Microsoft YaHei, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "PingFang SC, Hiragino Sans GB, Microsoft YaHei, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "PingFang SC, Hiragino Sans GB, Microsoft YaHei, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  sm: "12px"
  md: "14px"
  lg: "16px"
  xl: "20px"
  card: "24px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "44px"
  button-accent:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.vermilion-ink}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "44px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "44px"
  badge-accent:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.vermilion-ink}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  badge-outline:
    backgroundColor: "transparent"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "20px"
  step-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# Design System: 穿搭配色指南

## Overview

**Creative North Star: "纸本工作室"**

这不是一张色卡，而是一间暖纸色的工作室。纸面、墨线、朱红，一具无脸人台站在右侧，身上只有五块颜色。界面像一本工作簿那样安静：颜色块承担视觉重量，文字负责解释「为什么」，装饰不参与决策。

3D 人台是这间工作室里的一具试衣人台，不是电商模特。它没有脸、没有姿势切换、没有品牌，也不做性化处理；它只负责让内搭、上衣、裤子、鞋与点缀五块颜色落到一个身体上。人台可以换季节服装层，但不改变「确定性规则引擎」这个产品事实：同一组输入永远得到同一套结果。

**Committed material direction:** photo-real studio mannequin — skin and fabric with soft studio light. **Current implementation:** a procedural matte approximation built from Three.js primitives. The gap is a licensed GLB or a professionally modeled mannequin; until that lands, the preview must not claim photo-realism and must keep the text legend as the accessible source of truth.

**Key Characteristics:**
- Warm paper ground, ink type, a single vermilion accent.
- Five garment regions are the only color fields on the mannequin.
- Flat UI surfaces with tonal layering; 3D volume comes from soft studio light, not heavy shadows.
- Restrained type; the color blocks carry the visual weight.
- Every result explains itself: lightness difference, hue relationship, season rule.

## Colors

A warm neutral paper world with one vermilion voice. The mannequin skin is a neutral material, never a sixth garment color.

### Primary
- **Vermilion** (#b5432f): the single accent. Used for the active step, the result badge, focus rings, and the active garment outline. It is the loudest color on the page and should stay rare.

### Neutral
- **Warm Paper** (#f7f5f0): the page ground. Never pure white.
- **Sheet** (#fffdf8): card and preview grounds; one step lighter than paper.
- **Wash** (#ece8df): muted fills, hover backgrounds, inactive tonal layers.
- **Muted Ink** (#655f57): secondary copy, labels, captions.
- **Rule** (#ddd7cb): 1px borders and dividers.
- **Ink** (#171614): primary text and the dark button fill; never pure black on paper.
- **Mannequin Skin** (#d8b49c): the 3D body material; a warm neutral, not a color region.
- **Mannequin Line** (#2a2522): the SVG fallback's ink line.

### Brand Strip
- **Brand Ochre** (#c99a2e), **Brand Navy** (#1f2a44), **Brand Cream** (#f6f1e7): the four-dot strip in the header and step one, together with Vermilion. They live in `src/lib/brand.ts` and appear nowhere else; they are identity marks, not palette colors.

The 3D figure reads `--mannequin-body`, `--mannequin-placeholder`, `--mannequin-line` and `--ring` at runtime and re-reads them when the theme class changes, so the 3D body and the SVG fallback stay the same object in both themes.

Dark theme mirrors the same roles with **Night Paper** (#111110), **Night Sheet** (#1a1917), **Night Wash** (#24221f), **Night Muted Ink** (#a9a39a), **Night Rule** (#33302b), **Night Ink** (#f2efe8), **Night Vermilion** (#e07a5f), and **Night Skin** (#4a4038). The accent lightens because the same vermilion cannot clear AA as text on a dark ground.

**The One Vermilion Rule.** Vermilion covers at most 10% of any screen. Its rarity is what makes the result badge and the active region readable.

**The Paper Ground Rule.** Surfaces are warm paper or sheet, never pure white; text is ink, never pure black. The only true black is a shadow.

**The Skin Is Not a Region Rule.** The mannequin body is a neutral material. Only inner, top, pants, shoes, and accent carry the user's colors; the skin never enters the palette or the legend.

## Typography

**Display Font:** PingFang SC / Hiragino Sans GB / Microsoft YaHei (system CJK stack, with system-ui fallbacks)
**Body Font:** the same system stack
**Label/Mono Font:** the same stack; hex values use the platform monospace stack

**Character:** quiet and editorial. The type never competes with the color blocks; it explains them. No display serif, no decorative face, no uppercase headlines.

### Hierarchy
- **Display** (600, 24px / clamp, 1.2): the result title ("你的今日配色") only.
- **Title** (600, 16px, 1.3): card titles ("配色预览", "选一件上衣的颜色").
- **Body** (400, 14px, 1.6): explanations, result reasons, helper copy; keep lines under ~70ch.
- **Label** (500, 11px, 0.08em, uppercase for Latin micro-labels): badges, step labels, region names, hex values.

**The Quiet Type Rule.** When a screen needs emphasis, add color weight or space, not a bigger or more decorative typeface.

## Layout

A single centered column capped at **1024px** (`max-w-5xl`), with 16px page gutters and 24px section rhythm. The step indicator runs across the top as five equal cells separated by 1px rules.

From `lg` (1024px) the task and the preview split into a two-column grid: the form takes the remaining width, the preview card is a fixed **300px** sticky column at the top. Below `lg` the preview sits above the form as a **compact sticky strip**: a **64×132** figure beside the five-region legend in two columns of 44px rows (one column below 360px, and the figure grows to **92×200** from 640px), stuck to the top of the viewport while the form scrolls under it. The result step is the exception: there the panel returns to the full card with the **129×280** figure and the legend in one column. On desktop the compact steps keep the full **194×420** figure with the legend below it.

**The Compact Preview Rule.** Before the result, the preview may not take more than ~280px of a phone viewport (about 200px above 360px wide); it must stay stuck to the top while the color grid scrolls, because the point of the panel is watching a color land on the figure, and that has to happen at the moment of choosing.

**The Preview First Rule.** On mobile the body is the first thing after the step indicator. The user must see the color landing on a figure before scrolling into the form.

## Elevation & Depth

The UI is flat by default, with tonal layering instead of stacked shadows: cards use a 1px rule and a single hairline shadow (`0 1px 0 rgba(0,0,0,0.02)`); hover states shift to the wash tone. There is no blur, no glass, no floating card stack.

The 3D preview is the exception. Depth comes from a soft three-point studio light, a matte skin/fabric material, and a contact shadow under the feet — no real-time shadow maps, no post-processing. The committed direction is photo-real skin and fabric; the current procedural model approximates it with matte materials and a slight skin sheen.

**The Flat-By-Default Rule.** Shadows belong to state and to the 3D figure, not to static UI surfaces.

**The Page Glow Exception.** The single decorative gradient in this world is `.page-glow`, a near-invisible radial wash of the muted tone behind the header. It is the one sanctioned deviation from "no gradients": it never carries meaning, never sits on a card, and stays under 8% contrast against the paper.

**The Studio-Light Rule.** The mannequin is lit like a fitting-room object: a warm key, a cool fill, a low rim, and one soft contact shadow. Never light it like a product ad with hard speculars.

## Shapes

Controls are pills: buttons, badges, step cells, swatches, and the region legend all use `border-radius: 999px`. Cards use a large soft radius (**24px**) with a 1px rule. Data marks stay geometric: color swatches are perfect circles; the mannequin is the only organic silhouette.

**The Soft-But-Not-Gooey Rule.** Radius belongs to controls and containers; numbers, hex values, and color marks stay crisp.

## Components

### Buttons
- **Shape:** pill (999px), 44px height, 24px horizontal padding; small variant 36px.
- **Primary:** ink fill, paper text; hover 90% opacity.
- **Accent:** vermilion fill, vermilion-ink text; reserved for the decisive next step.
- **Outline:** transparent with a 1px rule; hover wash.
- **Focus:** 2px vermilion ring with a 2px paper offset.

### Badges
- **Accent:** vermilion fill, vermilion-ink text, 11px label; used for the result state and season.
- **Outline:** transparent with a 1px rule, muted ink text; used for context labels (province, gender, style).
- **Shape:** pill, 4px 10px padding.

### Cards
- **Corner:** 24px; **background:** sheet; **border:** 1px rule; **shadow:** hairline only.
- **Padding:** 20px (24px on `sm`); internal groups separated by 12–20px.
- **Preview card:** title + status badge, then the mannequin and the five-row legend.

### Inputs and Choices
- **Radio/color options:** 44px circles with a 1px hairline and a subtle shadow; checked state adds a 2px vermilion ring with a 2px offset.
- **Focus:** visible 2px vermilion ring; never remove it.
- **Disabled:** 45% opacity, pointer events off.

### Navigation
- **Step indicator:** five cells, 11–12px labels, numbered circles that become checks when done; the active cell is an ink pill. Connectors are 1px rules.
- **Theme toggle:** a 36px ghost circle with a moon/sun icon and an explicit aria-label.

### The Mannequin (signature)
- **Source:** Three.js, lazily loaded; SVG fallback when WebGL is unavailable.
- **Figure:** faceless, androgynous, 8-head proportions, one hand on the hip, weight on one leg, one foot turned out. Male and female share the body with a slight width difference.
- **Regions:** inner (collar + V insert + cuff), top (shell + sleeves + shoulder caps), pants (pelvis + leg tubes), shoes (boots/loafers/sandals), accent (belt/scarf).
- **Season layers:** spring long sleeve + long pants + loafers + belt; summer short sleeve + shorts + sandals + belt; autumn long sleeve + long pants + boots + belt; winter long sleeve + long pants + boots + scarf.
- **Placeholder:** uncolored regions render as a translucent neutral shell; the legend says "待配色".
- **Interaction:** hovering or tapping a mesh sets the active region; the matching legend row highlights. The legend remains the keyboard-accessible control.
- **Accessibility:** the canvas is decorative; the card carries an aria-label summary and the five-row legend.
- **Motion:** a 7-second, 0.25%-height breathing cycle; off under `prefers-reduced-motion` and while the canvas is offscreen.

## Do's and Don'ts

### Do:
- **Do** keep the mannequin faceless and non-sexualized; the product is a color guide, not a fashion model.
- **Do** keep the five-region legend and the text summary visible in every state, including the 3D preview.
- **Do** lazy-load the 3D chunk; the first paint must not wait for Three.js.
- **Do** fall back to the SVG mannequin when WebGL is unavailable or the lazy chunk fails.
- **Do** use the exact palette hexes for garment materials and calibrate the rendered color against them; lighting may shift the pixel, not the token.
- **Do** keep vermilion rare and reserve it for the result state and the active region.

### Don't:
- **Don't** call the current procedural mannequin photo-real. The committed direction is photo-real; the implementation is a matte approximation until a licensed GLB lands.
- **Don't** add hard specular highlights, glossy plastic skin, or product-ad lighting to fake realism.
- **Don't** let the 3D canvas become the only signal: no color-only states, no removed legend.
- **Don't** use pure white or pure black as a surface; paper and ink are the ground.
- **Don't** use gradients, glassmorphism, purple-blue AI hero gradients, or decorative displays in this world.
- **Don't** animate when `prefers-reduced-motion` is set, and don't run the breathing loop offscreen.
- **Don't** introduce a sixth color region for outerwear; winter reuses the accent region as a scarf.
