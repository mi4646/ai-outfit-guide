// Color-accuracy check for the mannequin preview.
//
// Samples five garment pixels from the autumn-female-light baseline
// (docs/design/baselines/autumn-female-light.png, 300×705) and computes
// CIEDE2000 deltas against the palette. Fails above threshold.
//
// The coordinates are specific to that baseline: the preview card at
// 300×705 with the 194×420 3D canvas. If the card layout changes, re-pick
// the points from a fresh baseline before trusting this check.

import { execFileSync } from 'node:child_process'
import { differenceCiede2000 } from 'culori'

const file =
  process.argv[2] ?? 'docs/design/baselines/autumn-female-light.png'
const threshold = 8

const samples = [
  { region: '内搭', x: 150, y: 175, target: '#4A3428' },
  { region: '上衣', x: 170, y: 235, target: '#B4551F' },
  { region: '裤子', x: 165, y: 390, target: '#C08A76' },
  { region: '鞋', x: 125, y: 440, target: '#B08A5E' },
  { region: '点缀', x: 170, y: 265, target: '#C99A2E' },
]

const deltaE = differenceCiede2000()
let failed = false

for (const sample of samples) {
  const raw = execFileSync('magick', [
    file,
    '-format',
    `%[hex:p{${sample.x},${sample.y}}]`,
    'info:',
  ])
    .toString()
    .trim()
  const got = `#${raw}`
  const delta = deltaE(got, sample.target)
  const ok = delta <= threshold
  if (!ok) failed = true
  console.log(
    `${ok ? 'PASS' : 'FAIL'} ${sample.region} @${sample.x},${sample.y} ` +
      `got ${got} target ${sample.target} ΔE00=${delta.toFixed(2)}`,
  )
}

if (failed) {
  console.error(`One or more regions exceed ΔE00 ${threshold}.`)
  process.exit(1)
}
console.log(`All samples within ΔE00 ${threshold}.`)