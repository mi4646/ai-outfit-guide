export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export type ZoneId =
  | 'dongbei'
  | 'huabei'
  | 'xibei'
  | 'huadong'
  | 'huazhong'
  | 'huanan'
  | 'xinan'
  | 'qingzang'
  | 'overseas'

export interface Zone {
  id: ZoneId
  name: string
  months: Season[]
}

export interface Province {
  id: string
  name: string
  zone: ZoneId
  lat: number
  lon: number
}

const W: Season = 'winter'
const SP: Season = 'spring'
const SU: Season = 'summer'
const A: Season = 'autumn'

export const ZONES: Zone[] = [
  { id: 'dongbei', name: '东北', months: [W, W, SP, SP, SP, SU, SU, SU, A, A, W, W] },
  { id: 'huabei', name: '华北', months: [W, W, SP, SP, SP, SU, SU, SU, A, A, A, W] },
  { id: 'xibei', name: '西北', months: [W, W, SP, SP, SP, SU, SU, SU, A, A, W, W] },
  { id: 'huadong', name: '华东', months: [W, W, SP, SP, SP, SU, SU, SU, SU, A, A, W] },
  { id: 'huazhong', name: '华中', months: [W, W, SP, SP, SP, SU, SU, SU, SU, A, A, W] },
  { id: 'huanan', name: '华南', months: [W, W, SP, SP, SU, SU, SU, SU, SU, SU, A, W] },
  { id: 'xinan', name: '西南', months: [W, W, SP, SP, SP, SU, SU, SU, SU, A, A, W] },
  { id: 'qingzang', name: '青藏', months: [W, W, W, W, SP, SP, SU, SU, A, W, W, W] },
  { id: 'overseas', name: '海外（按纬度估算）', months: [W, W, SP, SP, SP, SU, SU, SU, A, A, A, W] },
]

export const PROVINCES: Province[] = [
  { id: 'beijing', name: '北京', zone: 'huabei', lat: 39.9, lon: 116.4 },
  { id: 'tianjin', name: '天津', zone: 'huabei', lat: 39.13, lon: 117.2 },
  { id: 'hebei', name: '河北', zone: 'huabei', lat: 38.04, lon: 114.51 },
  { id: 'shanxi', name: '山西', zone: 'huabei', lat: 37.87, lon: 112.55 },
  { id: 'neimenggu', name: '内蒙古', zone: 'huabei', lat: 40.84, lon: 111.75 },
  { id: 'liaoning', name: '辽宁', zone: 'dongbei', lat: 41.8, lon: 123.43 },
  { id: 'jilin', name: '吉林', zone: 'dongbei', lat: 43.82, lon: 125.32 },
  { id: 'heilongjiang', name: '黑龙江', zone: 'dongbei', lat: 45.8, lon: 126.53 },
  { id: 'shanghai', name: '上海', zone: 'huadong', lat: 31.23, lon: 121.47 },
  { id: 'jiangsu', name: '江苏', zone: 'huadong', lat: 32.06, lon: 118.8 },
  { id: 'zhejiang', name: '浙江', zone: 'huadong', lat: 30.27, lon: 120.15 },
  { id: 'anhui', name: '安徽', zone: 'huadong', lat: 31.82, lon: 117.23 },
  { id: 'fujian', name: '福建', zone: 'huadong', lat: 26.07, lon: 119.3 },
  { id: 'jiangxi', name: '江西', zone: 'huadong', lat: 28.68, lon: 115.86 },
  { id: 'shandong', name: '山东', zone: 'huadong', lat: 36.65, lon: 117.12 },
  { id: 'henan', name: '河南', zone: 'huazhong', lat: 34.75, lon: 113.62 },
  { id: 'hubei', name: '湖北', zone: 'huazhong', lat: 30.59, lon: 114.3 },
  { id: 'hunan', name: '湖南', zone: 'huazhong', lat: 28.23, lon: 112.94 },
  { id: 'guangdong', name: '广东', zone: 'huanan', lat: 23.13, lon: 113.26 },
  { id: 'guangxi', name: '广西', zone: 'huanan', lat: 22.82, lon: 108.37 },
  { id: 'hainan', name: '海南', zone: 'huanan', lat: 20.04, lon: 110.32 },
  { id: 'chongqing', name: '重庆', zone: 'xinan', lat: 29.56, lon: 106.55 },
  { id: 'sichuan', name: '四川', zone: 'xinan', lat: 30.57, lon: 104.07 },
  { id: 'guizhou', name: '贵州', zone: 'xinan', lat: 26.65, lon: 106.63 },
  { id: 'yunnan', name: '云南', zone: 'xinan', lat: 25.04, lon: 102.71 },
  { id: 'xizang', name: '西藏', zone: 'qingzang', lat: 29.65, lon: 91.14 },
  { id: 'shaanxi', name: '陕西', zone: 'xibei', lat: 34.34, lon: 108.94 },
  { id: 'gansu', name: '甘肃', zone: 'xibei', lat: 36.06, lon: 103.83 },
  { id: 'qinghai', name: '青海', zone: 'xibei', lat: 36.62, lon: 101.78 },
  { id: 'ningxia', name: '宁夏', zone: 'xibei', lat: 38.49, lon: 106.23 },
  { id: 'xinjiang', name: '新疆', zone: 'xibei', lat: 43.83, lon: 87.62 },
  { id: 'taiwan', name: '台湾', zone: 'huanan', lat: 25.03, lon: 121.57 },
  { id: 'hongkong', name: '香港', zone: 'huanan', lat: 22.32, lon: 114.17 },
  { id: 'macau', name: '澳门', zone: 'huanan', lat: 22.2, lon: 113.54 },
]

export function getZone(zoneId: ZoneId): Zone {
  const zone = ZONES.find((item) => item.id === zoneId)
  if (!zone) throw new Error(`Unknown zone: ${zoneId}`)
  return zone
}

export function getProvince(provinceId: string): Province | undefined {
  return PROVINCES.find((item) => item.id === provinceId)
}
