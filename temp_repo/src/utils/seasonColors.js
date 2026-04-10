// 季节色对库 — 高饱和度跨色相美学色对，每季 6 组
const SEASON_PALETTES = {
  spring: [
    { start: { hex: '#F2A8C8', name: '樱花粉' }, end: { hex: '#7EC87A', name: '嫩芽绿' } },
    { start: { hex: '#9B6FD4', name: '藤紫'   }, end: { hex: '#F5DC6E', name: '鹅黄'   } },
    { start: { hex: '#F47C8A', name: '桃红'   }, end: { hex: '#6EC8E8', name: '天蓝'   } },
    { start: { hex: '#C8A0D8', name: '丁香紫' }, end: { hex: '#A0D878', name: '嫩草'   } },
    { start: { hex: '#E8729A', name: '春梅'   }, end: { hex: '#5DC8A0', name: '碧绿'   } },
    { start: { hex: '#F0A8C0', name: '蔷薇'   }, end: { hex: '#78C8E8', name: '晴空'   } },
  ],
  summer: [
    { start: { hex: '#F4845F', name: '珊瑚橙' }, end: { hex: '#3D9BE9', name: '碧海蓝' } },
    { start: { hex: '#F7E04B', name: '柠檬黄' }, end: { hex: '#56C596', name: '薄荷绿' } },
    { start: { hex: '#E8504A', name: '西瓜红' }, end: { hex: '#3AB8C8', name: '海碧'   } },
    { start: { hex: '#F26A3F', name: '橘红'   }, end: { hex: '#2E86AB', name: '孔雀蓝' } },
    { start: { hex: '#F9C74F', name: '向日葵' }, end: { hex: '#43AA8B', name: '翠绿'   } },
    { start: { hex: '#E63B6A', name: '玫瑰红' }, end: { hex: '#48CAE4', name: '水蓝'   } },
  ],
  autumn: [
    { start: { hex: '#C84B31', name: '砖红'   }, end: { hex: '#E8A838', name: '金黄'   } },
    { start: { hex: '#8B4A2A', name: '枯叶棕' }, end: { hex: '#7B5EA7', name: '暮霭紫' } },
    { start: { hex: '#C23B22', name: '朱砂'   }, end: { hex: '#DDB967', name: '稻黄'   } },
    { start: { hex: '#C8402A', name: '枫红'   }, end: { hex: '#B5A642', name: '橄榄金' } },
    { start: { hex: '#B04030', name: '赭红'   }, end: { hex: '#C8922A', name: '深金'   } },
    { start: { hex: '#D4602A', name: '深橙'   }, end: { hex: '#9B4A8A', name: '茜紫'   } },
  ],
  winter: [
    { start: { hex: '#5B8DB8', name: '霜蓝'   }, end: { hex: '#E8F4FC', name: '玉白'   } },
    { start: { hex: '#243B7A', name: '深靛'   }, end: { hex: '#A8D4E8', name: '淡青'   } },
    { start: { hex: '#4A90D9', name: '冰蓝'   }, end: { hex: '#C8B4E8', name: '浅紫'   } },
    { start: { hex: '#1E508A', name: '普蓝'   }, end: { hex: '#E8C8D8', name: '淡粉'   } },
    { start: { hex: '#2255A8', name: '宝蓝'   }, end: { hex: '#D8EAF5', name: '薄雾'   } },
    { start: { hex: '#1A3A6A', name: '夜蓝'   }, end: { hex: '#A0C8E8', name: '晶蓝'   } },
  ],
}

export function getSeason() {
  const m = new Date().getMonth() + 1
  if (m >= 3 && m <= 5) return 'spring'
  if (m >= 6 && m <= 8) return 'summer'
  if (m >= 9 && m <= 11) return 'autumn'
  return 'winter'
}

export const SEASON_LABELS = {
  spring: '春', summer: '夏', autumn: '秋', winter: '冬',
}

export function generateTheme(season) {
  const s = season || getSeason()
  const palette = SEASON_PALETTES[s]
  return palette[Math.floor(Math.random() * palette.length)]
}

const CN_DIGITS  = ['〇','一','二','三','四','五','六','七','八','九']
const CN_MONTHS  = ['一','二','三','四','五','六','七','八','九','十','十一','十二']

export function getChineseDate() {
  const d = new Date()
  const year  = String(d.getFullYear()).split('').map(n => CN_DIGITS[+n]).join('')
  const month = CN_MONTHS[d.getMonth()]
  return `${year}年${month}月`
}
