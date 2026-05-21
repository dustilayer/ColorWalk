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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = src
  })
}

function drawImageCover(ctx, img, dx, dy, dw, dh) {
  const srcRatio = img.width / img.height
  const dstRatio = dw / dh
  let sx, sy, sw, sh
  if (srcRatio > dstRatio) {
    // 源图更宽：按高度铺满，裁切左右
    sh = img.height
    sw = sh * dstRatio
    sx = (img.width - sw) / 2
    sy = 0
  } else {
    // 源图更高：按宽度铺满，裁切上下
    sw = img.width
    sh = sw / dstRatio
    sx = 0
    sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

// ── 色卡（每色一张：照片在上，色块在下）────────────────────────────

async function drawColorCard(ctx, record, activeIndex = 0) {
  const { themeGradient, collectedColors, matchScore, date, strictLevel } = record
  const hit = collectedColors[activeIndex] || collectedColors[0]

  // 零采集守卫：宣纸色铺底 + 日期，避免崩
  if (!hit) {
    ctx.fillStyle = '#F5F0E8'
    ctx.fillRect(0, 0, W, H)
    ctx.textAlign = 'center'
    ctx.font = `400 20px "Noto Serif SC", "Microsoft YaHei", Georgia, serif`
    ctx.fillStyle = 'rgba(26,23,20,0.5)'
    ctx.fillText(formatDate(date), W / 2, H - 60)
    return
  }

  // 上半：实拍照片（60%），缺失/加载失败时回退到主题渐变
  const gradH = Math.round(H * 0.6)
  let drewPhoto = false
  if (hit && hit.photoUrl) {
    try {
      const img = await loadImage(hit.photoUrl)
      drawImageCover(ctx, img, 0, 0, W, gradH)
      drewPhoto = true
    } catch {
      // 加载失败，走回退
    }
  }
  if (!drewPhoto) {
    const grad = ctx.createLinearGradient(0, 0, W, 0)
    grad.addColorStop(0, themeGradient.start.hex)
    grad.addColorStop(1, themeGradient.end.hex)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, gradH)
  }

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

// ── 导出入口 ──────────────────────────────────────────────────────

export async function downloadCard(record, activeIndex = 0) {
  await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  await drawColorCard(ctx, record, activeIndex)

  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = `colorwalk_${record.date.slice(0, 10)}.png`
  a.click()
}

export async function shareCard(record, activeIndex = 0) {
  await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  await drawColorCard(ctx, record, activeIndex)

  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Canvas to Blob failed'))
        return
      }
      try {
        const file = new File([blob], `colorwalk_${record.date.slice(0, 10)}.png`, { type: 'image/png' })
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Color Walk',
            text: '这是我的 Color Walk 漫步色卡',
            files: [file]
          })
          resolve(true)
        } else {
          // Fallback if sharing files is not supported
          resolve(false)
        }
      } catch (err) {
        console.error('Share failed:', err)
        reject(err)
      }
    }, 'image/png')
  })
}
