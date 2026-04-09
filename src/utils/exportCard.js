import { rgbToHue } from './colorUtils'

const W = 750
const H = 1000

function formatDate(isoString) {
  const d = new Date(isoString)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${day}  ${h}:${min}`
}

function luminance(r, g, b) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

// ── 单色模式色卡 ──────────────────────────────────────────────────

function drawSingleCard(ctx, record) {
  const { themeGradient, collectedColors, matchScore, date, strictLevel } = record
  const hit = collectedColors[0]

  // 上半：主题渐变（60%）
  const gradH = Math.round(H * 0.6)
  const grad = ctx.createLinearGradient(0, 0, W, 0)
  grad.addColorStop(0, themeGradient.start.hex)
  grad.addColorStop(1, themeGradient.end.hex)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, gradH)

  // 下半：命中色（40%）
  const hitY = gradH
  const hitH = H - gradH
  ctx.fillStyle = hit.hex
  ctx.fillRect(0, hitY, W, hitH)

  // 命中色上：色名
  const lum = luminance(hit.r, hit.g, hit.b)
  const textColor = lum > 0.5 ? 'rgba(26,23,20,0.85)' : 'rgba(245,240,232,0.85)'
  ctx.fillStyle = textColor
  ctx.textAlign = 'center'
  ctx.font = `400 40px "Noto Serif SC", "Microsoft YaHei", Georgia, serif`
  ctx.fillText(hit.name, W / 2, hitY + hitH * 0.38)

  // HEX
  ctx.font = `400 24px "JetBrains Mono", Menlo, monospace`
  ctx.fillStyle = lum > 0.5 ? 'rgba(26,23,20,0.55)' : 'rgba(245,240,232,0.55)'
  ctx.fillText(hit.hex.toUpperCase(), W / 2, hitY + hitH * 0.38 + 44)

  // 右下：日期 + 时间
  ctx.textAlign = 'right'
  ctx.font = `400 18px "JetBrains Mono", Menlo, monospace`
  ctx.fillStyle = lum > 0.5 ? 'rgba(26,23,20,0.4)' : 'rgba(245,240,232,0.4)'
  ctx.fillText(formatDate(date), W - 36, H - 36)

  // 精准模式：匹配得分
  if (strictLevel === 'precise' && matchScore != null) {
    ctx.fillText(`匹配度 ${matchScore}%`, W - 36, H - 62)
  }
}

// ── 自由模式色卡 ──────────────────────────────────────────────────

function drawFreeCard(ctx, record) {
  const { themeGradient, collectedColors, date } = record

  const STRIP_H = 40
  const FOOTER_H = 80
  const GRID_H = H - STRIP_H - FOOTER_H

  // 顶部细条：主题渐变
  const grad = ctx.createLinearGradient(0, 0, W, 0)
  grad.addColorStop(0, themeGradient.start.hex)
  grad.addColorStop(1, themeGradient.end.hex)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, STRIP_H)

  // 色块网格（按色相排序）
  const sorted = [...collectedColors].sort(
    (a, b) => rgbToHue(a.r, a.g, a.b) - rgbToHue(b.r, b.g, b.b)
  )
  const n = sorted.length
  if (n > 0) {
    const cols = Math.min(n, 4)
    const rows = Math.ceil(n / cols)
    const sw = W / cols
    const sh = GRID_H / rows
    sorted.forEach((c, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      ctx.fillStyle = c.hex
      ctx.fillRect(col * sw, STRIP_H + row * sh, sw, sh)
    })
  } else {
    // 无采集色时填充宣纸色
    ctx.fillStyle = '#F5F0E8'
    ctx.fillRect(0, STRIP_H, W, GRID_H)
  }

  // 底部：宣纸色 footer
  ctx.fillStyle = '#F5F0E8'
  ctx.fillRect(0, H - FOOTER_H, W, FOOTER_H)

  // 日期
  ctx.textAlign = 'center'
  ctx.font = `400 20px "Noto Serif SC", "Microsoft YaHei", Georgia, serif`
  ctx.fillStyle = 'rgba(26,23,20,0.5)'
  ctx.fillText(formatDate(date), W / 2, H - FOOTER_H / 2 + 8)
}

// ── 导出入口 ──────────────────────────────────────────────────────

export async function downloadCard(record) {
  await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  if (record.mode === 'single') {
    drawSingleCard(ctx, record)
  } else {
    drawFreeCard(ctx, record)
  }

  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = `colorwalk_${record.date.slice(0, 10)}.png`
  a.click()
}
