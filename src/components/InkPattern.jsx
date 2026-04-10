// Ink-style SVG placeholder patterns for each achievement.
// All use viewBox="0 0 40 40", scale via width/height props.
// Colors: #1A1714 (dark ink) and semi-transparent grays only.

const INK = '#1A1714'

function Dot({ cx, cy, r = 2, opacity = 0.8 }) {
  return <circle cx={cx} cy={cy} r={r} fill={INK} opacity={opacity} />
}

function Ring({ cx = 20, cy = 20, r, strokeWidth = 1.5, opacity = 0.8 }) {
  return <circle cx={cx} cy={cy} r={r} stroke={INK} strokeWidth={strokeWidth} fill="none" opacity={opacity} />
}

// ── Per-achievement SVG pattern definitions ────────────────────────

const patterns = {

  // 入门类
  first_walk: () => (
    <>
      <circle cx="20" cy="20" r="5" fill={INK} opacity="0.85" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const rad = deg * Math.PI / 180
        return (
          <line key={i}
            x1={20 + 8 * Math.cos(rad)} y1={20 + 8 * Math.sin(rad)}
            x2={20 + 15 * Math.cos(rad)} y2={20 + 15 * Math.sin(rad)}
            stroke={INK} strokeWidth="1.5" strokeLinecap="round"
            opacity={i % 2 === 0 ? 0.6 : 0.3}
          />
        )
      })}
    </>
  ),

  first_single: () => (
    <>
      <Ring r={12} strokeWidth={2.5} opacity={0.8} />
      <Dot cx={20} cy={20} r={3} opacity={0.5} />
    </>
  ),

  first_free: () => (
    <>
      <ellipse cx="17" cy="20" rx="9" ry="11" fill="none" stroke={INK} strokeWidth="1.5" opacity="0.7" />
      <ellipse cx="23" cy="18" rx="8" ry="10" fill="none" stroke={INK} strokeWidth="1.5" opacity="0.5" />
      <ellipse cx="20" cy="23" rx="7" ry="8" fill={INK} opacity="0.2" />
    </>
  ),

  // 匹配类
  match_60: () => (
    <>
      <Ring r={12} strokeWidth="1.5" opacity="0.2" />
      <circle cx="20" cy="20" r="12" stroke={INK} strokeWidth="2.5" fill="none"
        strokeDasharray={`${Math.PI * 2 * 12 * 0.6} ${Math.PI * 2 * 12 * 0.4}`}
        strokeDashoffset={Math.PI * 2 * 12 * 0.25}
        strokeLinecap="round" opacity="0.85"
      />
      <Dot cx={20} cy={20} r={2} opacity={0.4} />
    </>
  ),

  match_80: () => (
    <>
      <Ring r={12} strokeWidth="1.5" opacity="0.2" />
      <circle cx="20" cy="20" r="12" stroke={INK} strokeWidth="2.5" fill="none"
        strokeDasharray={`${Math.PI * 2 * 12 * 0.8} ${Math.PI * 2 * 12 * 0.2}`}
        strokeDashoffset={Math.PI * 2 * 12 * 0.25}
        strokeLinecap="round" opacity="0.85"
      />
      <Dot cx={20} cy={20} r={2} opacity={0.4} />
    </>
  ),

  match_95: () => (
    <>
      <circle cx="20" cy="20" r="12" stroke={INK} strokeWidth="2.5" fill="none"
        strokeDasharray={`${Math.PI * 2 * 12 * 0.95} ${Math.PI * 2 * 12 * 0.05}`}
        strokeDashoffset={Math.PI * 2 * 12 * 0.25}
        strokeLinecap="round" opacity="0.85"
      />
      <Dot cx={20} cy={20} r={3} opacity={0.8} />
    </>
  ),

  warm_5: () => (
    <>
      <circle cx="20" cy="20" r="6" fill={INK} opacity="0.75" />
      {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg, i) => {
        const rad = deg * Math.PI / 180
        return (
          <line key={i}
            x1={20 + 9 * Math.cos(rad)} y1={20 + 9 * Math.sin(rad)}
            x2={20 + 16 * Math.cos(rad)} y2={20 + 16 * Math.sin(rad)}
            stroke={INK} strokeWidth={i % 2 === 0 ? 1.5 : 1} strokeLinecap="round"
            opacity={i % 2 === 0 ? 0.7 : 0.35}
          />
        )
      })}
    </>
  ),

  // 打卡类
  streak_3: () => (
    <>
      {[10, 20, 30].map((y, i) => (
        <line key={i} x1="8" y1={y} x2="32" y2={y}
          stroke={INK} strokeWidth="2.5" strokeLinecap="round"
          opacity={1 - i * 0.2}
        />
      ))}
    </>
  ),

  streak_7: () => (
    <>
      {[0,1,2,3,4,5,6].map(i => (
        <line key={i}
          x1={7 + i * 4.5} y1="12" x2={7 + i * 4.5} y2={26 - (i % 3) * 3}
          stroke={INK} strokeWidth="2" strokeLinecap="round"
          opacity={0.5 + i * 0.07}
        />
      ))}
    </>
  ),

  streak_30: () => (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const rad = (i * 30 - 90) * Math.PI / 180
        return <Dot key={i} cx={20 + 12 * Math.cos(rad)} cy={20 + 12 * Math.sin(rad)} r={1.5} opacity={0.5 + i * 0.04} />
      })}
      <Dot cx={20} cy={20} r={2.5} opacity={0.8} />
    </>
  ),

  same_place: () => (
    <>
      <Ring cx={17} cy={20} r={9} strokeWidth={1.5} opacity={0.7} />
      <Ring cx={23} cy={20} r={9} strokeWidth={1.5} opacity={0.5} />
      <Dot cx={20} cy={20} r={2} opacity={0.6} />
    </>
  ),

  // 时间类
  early_bird: () => (
    <>
      <line x1="4" y1="26" x2="36" y2="26" stroke={INK} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <path d="M 20 26 A 10 10 0 0 1 10 26" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <path d="M 20 26 A 10 10 0 0 0 30 26" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      {[315, 0, 45].map((deg, i) => {
        const rad = deg * Math.PI / 180
        return (
          <line key={i}
            x1={20 + 13 * Math.cos(rad)} y1={26 + 13 * Math.sin(rad)}
            x2={20 + 17 * Math.cos(rad)} y2={26 + 17 * Math.sin(rad)}
            stroke={INK} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"
          />
        )
      })}
    </>
  ),

  night_owl: () => (
    <>
      <path
        d="M 22 8 A 12 12 0 1 0 22 32 A 8 8 0 1 1 22 8 Z"
        fill={INK} opacity="0.8"
      />
      <Dot cx={27} cy={13} r={1.5} opacity={0.4} />
      <Dot cx={30} cy={20} r={1} opacity={0.3} />
    </>
  ),

  noon: () => (
    <>
      <Ring r={10} strokeWidth={2} opacity={0.8} />
      <line x1="20" y1="8" x2="20" y2="32" stroke={INK} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="8" y1="20" x2="32" y2="20" stroke={INK} strokeWidth="1" strokeLinecap="round" opacity="0.3" />
    </>
  ),

  // 数量类
  walk_10: () => (
    <>
      {[0,1,2,3,4].map(i => <Dot key={i} cx={8 + i * 6} cy={17} r={2.5} opacity={0.7} />)}
      {[0,1,2,3,4].map(i => <Dot key={i+5} cx={8 + i * 6} cy={25} r={2.5} opacity={0.5} />)}
    </>
  ),

  walk_50: () => (
    <>
      {[0,1,2,3,4].map(gi => (
        [0,1].map(ri => (
          <Dot key={`${gi}-${ri}`} cx={8 + gi * 6} cy={16 + ri * 8} r={1.5}
            opacity={0.4 + gi * 0.1}
          />
        ))
      ))}
      {[0,1,2,3,4].map(i => (
        <Dot key={`b${i}`} cx={8 + i * 6} cy={30} r={1.5} opacity={0.6} />
      ))}
    </>
  ),

  walk_100: () => (
    <>
      {Array.from({ length: 10 }, (_, row) =>
        Array.from({ length: 10 }, (_, col) => (
          <Dot key={`${row}-${col}`}
            cx={7 + col * 2.8} cy={7 + row * 2.8}
            r={0.9}
            opacity={0.3 + (row + col) * 0.03}
          />
        ))
      )}
    </>
  ),

  color_100: () => (
    <>
      {Array.from({ length: 20 }, (_, i) => (
        <rect key={i} x={4 + i * 1.65} y={14} width={1.4} height={12}
          fill={INK} opacity={0.15 + i * 0.04}
          rx="0.5"
        />
      ))}
      <rect x="4" y="28" width="33" height="1.5" fill={INK} opacity="0.3" rx="0.5" />
    </>
  ),

  color_500: () => (
    <>
      {[0,1,2,3,4].map(row => (
        Array.from({ length: 16 }, (_, col) => (
          <rect key={`${row}-${col}`}
            x={5 + col * 2.1} y={8 + row * 5.5}
            width={1.8} height={4}
            fill={INK} opacity={0.12 + row * 0.06 + col * 0.01}
            rx="0.4"
          />
        ))
      ))}
    </>
  ),

  // 模式类
  all_strict: () => (
    <>
      <Ring r={5}  strokeWidth={2}   opacity={0.85} />
      <Ring r={10} strokeWidth={1.5} opacity={0.55} />
      <Ring r={15} strokeWidth={1}   opacity={0.3} />
    </>
  ),

  both_modes: () => (
    <>
      <path d="M 20 5 A 15 15 0 0 1 20 35 Z" fill={INK} opacity="0.8" />
      <Ring r={15} strokeWidth={1.5} opacity={0.6} />
      <Dot cx={20} cy={12} r={3} opacity={0.3} />
      <Dot cx={20} cy={28} r={3} fill="none" stroke={INK} strokeWidth="1.5" opacity="0.7" />
    </>
  ),

  // 季节类
  all_seasons: () => (
    <>
      {/* top-left: spring bud */}
      <ellipse cx="13" cy="13" rx="5" ry="7" fill={INK} opacity="0.7" transform="rotate(-20 13 13)" />
      {/* top-right: summer full */}
      <circle cx="27" cy="13" r="6" fill={INK} opacity="0.5" />
      {/* bottom-left: autumn drop */}
      <ellipse cx="13" cy="27" rx="5" ry="6" fill={INK} opacity="0.4" />
      {/* bottom-right: winter bare */}
      <line x1="27" y1="21" x2="27" y2="33" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="23" y1="24" x2="27" y2="26" stroke={INK} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="31" y1="24" x2="27" y2="26" stroke={INK} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </>
  ),

  season_10: () => (
    <>
      {Array.from({ length: 10 }, (_, i) => {
        const rad = (i * 36 - 90) * Math.PI / 180
        const r = 10 + (i % 3) * 2
        return (
          <ellipse key={i}
            cx={20 + r * Math.cos(rad)} cy={20 + r * Math.sin(rad)}
            rx="3" ry="4.5"
            fill={INK} opacity={0.2 + i * 0.05}
            transform={`rotate(${i * 36} ${20 + r * Math.cos(rad)} ${20 + r * Math.sin(rad)})`}
          />
        )
      })}
      <Dot cx={20} cy={20} r={2} opacity={0.7} />
    </>
  ),
}

export default function InkPattern({ id, size = 40, locked = false }) {
  const PatternFn = patterns[id]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      style={{ display: 'block', opacity: locked ? 0.3 : 1 }}
    >
      {locked
        ? (
          <>
            <Ring r={13} strokeWidth={1.5} opacity={0.35} />
            <text
              x="20" y="25"
              textAnchor="middle"
              fontSize="16"
              fill={INK}
              opacity="0.3"
              fontFamily="serif"
            >？</text>
          </>
        )
        : PatternFn
          ? <PatternFn />
          : <Ring r={12} strokeWidth={1.5} opacity={0.5} />
      }
    </svg>
  )
}
