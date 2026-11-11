# Mannequin preview baselines

Generated **2026-11-11** from the Vite dev server at 1440×1300. Each file is an element screenshot of `[data-testid="mannequin-panel"]` at **300×705 CSS px**.

Matrix: 4 seasons × 2 genders × 2 themes = 16 PNGs.

| Season | Month (`m`) | Beijing season | Files |
|---|---|---|---|
| Spring | 4 | spring | `spring-{female,male}-{light,dark}.png` |
| Summer | 7 | summer | `summer-{female,male}-{light,dark}.png` |
| Autumn | 10 | autumn | `autumn-{female,male}-{light,dark}.png` |
| Winter | 1 | winter | `winter-{female,male}-{light,dark}.png` |

## Reproduce

1. `pnpm dev --host 127.0.0.1 --port 5174`
2. Open `http://127.0.0.1:5174/?g=female&p=beijing&m=10&c=b4551f&step=result` (swap `g` for gender, `m` for month).
3. Wait until the 3D canvas is present (or the SVG fallback if WebGL is off).
4. Toggle the theme (`html.dark` for dark, no class for light).
5. Screenshot the `[data-testid="mannequin-panel"]` element; save as `{season}-{gender}-{theme}.png`.

These are **manual baselines**, not an automated pixel-diff gate. The color check is `pnpm check:colors` (see `scripts/check-colors.mjs`); it samples the autumn female light baseline against the palette and fails above ΔE00 8.
