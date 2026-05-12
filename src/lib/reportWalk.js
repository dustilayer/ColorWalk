import { supabase } from './supabase'

/**
 * 匿名上报一次完整 Color Walk 的统计数据
 * 失败时静默处理,绝不影响用户体验
 *
 * @param {string} [payload.appVersion] - App 版本号,如 'v1.0',默认 'v1.0'
 */
export async function reportWalk(payload) {
  if (!supabase) return

  try {
    const { error } = await supabase
      .from('walk_reports')
      .insert({
        session_id:   payload.sessionId,
        mode:         payload.mode,
        strictness:   payload.strictness,
        duration_sec: payload.durationSec,
        color_count:  payload.colorCount,
        language:     payload.language,
        app_version:  'v1.0',
      })

    if (error) {
      console.warn('[reportWalk] 上报失败:', error.message)
    }
  } catch (e) {
    console.warn('[reportWalk] 网络异常:', e.message)
  }
}