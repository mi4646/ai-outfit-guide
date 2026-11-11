import { toOklch } from '../lib/color'

export type ColorFamily = 'neutral' | 'warm' | 'cool' | 'earth'

export interface ColorEntry {
  id: string
  name: string
  hex: string
  family: ColorFamily
}

export const COLORS: ColorEntry[] = [
  { id: 'white', name: '纯白', hex: '#ffffff', family: 'neutral' },
  { id: 'cream', name: '米白', hex: '#f6f1e7', family: 'neutral' },
  { id: 'ivory', name: '象牙', hex: '#f3e9d2', family: 'neutral' },
  { id: 'light-grey', name: '浅灰', hex: '#d9d9d4', family: 'neutral' },
  { id: 'grey', name: '中灰', hex: '#9b9b96', family: 'neutral' },
  { id: 'dark-grey', name: '深灰', hex: '#4b4b48', family: 'neutral' },
  { id: 'charcoal', name: '炭黑', hex: '#1e1e1c', family: 'neutral' },
  { id: 'black', name: '纯黑', hex: '#0b0b0b', family: 'neutral' },
  { id: 'navy', name: '藏青', hex: '#1f2a44', family: 'neutral' },
  { id: 'navy-deep', name: '海军蓝', hex: '#26344f', family: 'neutral' },
  { id: 'denim', name: '牛仔蓝', hex: '#4e6e8e', family: 'neutral' },
  { id: 'mist-blue', name: '雾蓝', hex: '#a9c1d4', family: 'neutral' },
  { id: 'silver', name: '银灰', hex: '#c0c3c6', family: 'neutral' },
  { id: 'gunmetal', name: '枪灰', hex: '#5a5f63', family: 'neutral' },
  { id: 'khaki', name: '卡其', hex: '#c2ae8c', family: 'neutral' },
  { id: 'camel', name: '驼色', hex: '#b08a5e', family: 'neutral' },
  { id: 'taupe', name: '灰褐', hex: '#7a6a5a', family: 'neutral' },
  { id: 'olive', name: '橄榄', hex: '#6e6b4a', family: 'neutral' },

  { id: 'red', name: '正红', hex: '#c62828', family: 'warm' },
  { id: 'brick', name: '砖红', hex: '#a8432f', family: 'warm' },
  { id: 'wine', name: '酒红', hex: '#722f37', family: 'warm' },
  { id: 'burgundy', name: '勃艮第', hex: '#5a1f2a', family: 'warm' },
  { id: 'orange', name: '橙色', hex: '#d96b2b', family: 'warm' },
  { id: 'burnt-orange', name: '焦橙', hex: '#b4551f', family: 'warm' },
  { id: 'mustard', name: '姜黄', hex: '#c99a2e', family: 'warm' },
  { id: 'amber', name: '琥珀', hex: '#b97a2a', family: 'warm' },
  { id: 'yellow', name: '明黄', hex: '#e3c13b', family: 'warm' },
  { id: 'lemon', name: '柠檬黄', hex: '#ead35a', family: 'warm' },
  { id: 'coral', name: '珊瑚', hex: '#e07a5f', family: 'warm' },
  { id: 'peach', name: '蜜桃', hex: '#e8a87c', family: 'warm' },
  { id: 'terracotta', name: '陶土', hex: '#b5654a', family: 'warm' },
  { id: 'rust', name: '铁锈', hex: '#8f4a2e', family: 'warm' },

  { id: 'royal-blue', name: '宝蓝', hex: '#1e4fa3', family: 'cool' },
  { id: 'cobalt', name: '钴蓝', hex: '#2458b8', family: 'cool' },
  { id: 'sky-blue', name: '天蓝', hex: '#7fb3d5', family: 'cool' },
  { id: 'teal', name: '青绿', hex: '#2e8b84', family: 'cool' },
  { id: 'emerald', name: '翡翠', hex: '#1f7a5c', family: 'cool' },
  { id: 'forest', name: '森林绿', hex: '#2d5a3d', family: 'cool' },
  { id: 'sage', name: '鼠尾草', hex: '#8fa68e', family: 'cool' },
  { id: 'mint', name: '薄荷', hex: '#a8d5c2', family: 'cool' },
  { id: 'lavender', name: '薰衣草', hex: '#b7a6d6', family: 'cool' },
  { id: 'violet', name: '紫罗兰', hex: '#6b4c9a', family: 'cool' },
  { id: 'plum', name: '梅子紫', hex: '#5b3a5e', family: 'cool' },
  { id: 'indigo', name: '靛蓝', hex: '#34406b', family: 'cool' },
  { id: 'slate-blue', name: '石板蓝', hex: '#5c7392', family: 'cool' },
  { id: 'ice-blue', name: '冰蓝', hex: '#cfe3ec', family: 'cool' },

  { id: 'sand', name: '沙色', hex: '#d8c7a8', family: 'earth' },
  { id: 'oatmeal', name: '燕麦', hex: '#cdbba0', family: 'earth' },
  { id: 'light-brown', name: '浅棕', hex: '#96795c', family: 'earth' },
  { id: 'cognac', name: '干邑', hex: '#8a5a3b', family: 'earth' },
  { id: 'chocolate', name: '巧克力', hex: '#4a3428', family: 'earth' },
  { id: 'espresso', name: '浓缩咖啡', hex: '#2e2118', family: 'earth' },
  { id: 'moss', name: '苔藓', hex: '#5f6b45', family: 'earth' },
  { id: 'fern', name: '蕨绿', hex: '#4e5d3a', family: 'earth' },
  { id: 'clay-pink', name: '陶土粉', hex: '#c08a76', family: 'earth' },
  { id: 'mushroom', name: '蘑菇', hex: '#a99a8b', family: 'earth' },
  { id: 'limestone', name: '石灰', hex: '#b8b2a7', family: 'earth' },
  { id: 'driftwood', name: '浮木', hex: '#8c8072', family: 'earth' },
  { id: 'olive-brown', name: '橄榄棕', hex: '#5c5538', family: 'earth' },
  { id: 'grey-blue', name: '灰蓝', hex: '#6f7f8c', family: 'earth' },
]

export function findColor(id: string): ColorEntry | undefined {
  return COLORS.find((color) => color.id === id)
}

export function customColor(hex: string, name = '自定义'): ColorEntry {
  const normalized = hex.toLowerCase()
  if (!/^#[0-9a-f]{6}$/.test(normalized)) {
    throw new Error(`Invalid hex: ${hex}`)
  }
  return {
    id: `custom-${normalized.slice(1)}`,
    name,
    hex: normalized,
    family: classifyFamily(normalized),
  }
}

export function classifyFamily(hex: string): ColorFamily {
  const { l, c, h } = toOklch(hex)
  if (c < 0.05) return 'neutral'
  if (l < 0.7 && h >= 20 && h <= 100 && c < 0.14) return 'earth'
  if (h > 120 && h <= 330) return 'cool'
  return 'warm'
}
