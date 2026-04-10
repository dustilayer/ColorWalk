export const ACHIEVEMENT_CATEGORIES = [
  { id: 'intro',   name: { zh: '入门', en: 'Intro' } },
  { id: 'match',   name: { zh: '匹配', en: 'Match' } },
  { id: 'checkin', name: { zh: '打卡', en: 'Streak' } },
  { id: 'time',    name: { zh: '时间', en: 'Timing' } },
  { id: 'count',   name: { zh: '数量', en: 'Count' } },
  { id: 'mode',    name: { zh: '模式', en: 'Mode' } },
  { id: 'season',  name: { zh: '季节', en: 'Season' } },
]

export const achievements = [
  // 入门类
  {
    id: 'first_walk',
    name: { zh: '初见', en: 'First Steps' },
    desc: { zh: '完成第一次漫步', en: 'Complete your first walk' },
    category: 'intro',
  },
  {
    id: 'first_single',
    name: { zh: '初心', en: 'Pure Intent' },
    desc: { zh: '完成第一次单色模式', en: 'Complete your first monochrome walk' },
    category: 'intro',
  },
  {
    id: 'first_free',
    name: { zh: '漫游者', en: 'Wanderer' },
    desc: { zh: '完成第一次自由采集模式', en: 'Complete your first free collection walk' },
    category: 'intro',
  },

  // 匹配类
  {
    id: 'match_60',
    name: { zh: '色感觉醒', en: 'Color Sense' },
    desc: { zh: '匹配度首次超过60%', en: 'Achieve a match score over 60%' },
    category: 'match',
  },
  {
    id: 'match_80',
    name: { zh: '猎人本色', en: 'Hunter Instinct' },
    desc: { zh: '匹配度首次超过80%', en: 'Achieve a match score over 80%' },
    category: 'match',
  },
  {
    id: 'match_95',
    name: { zh: '化境', en: 'Transcendence' },
    desc: { zh: '匹配度首次超过95%', en: 'Achieve a match score over 95%' },
    category: 'match',
  },
  {
    id: 'warm_5',
    name: { zh: '暖意', en: 'Warmth' },
    desc: { zh: '一次漫步中连续5次采集暖色调', en: 'Capture 5 warm tones in a row' },
    category: 'match',
  },

  // 打卡类
  {
    id: 'streak_3',
    name: { zh: '三日', en: 'Three Days' },
    desc: { zh: '连续3天各完成一次漫步', en: 'Walk for 3 consecutive days' },
    category: 'checkin',
  },
  {
    id: 'streak_7',
    name: { zh: '七日', en: 'Seven Days' },
    desc: { zh: '连续7天各完成一次漫步', en: 'Walk for 7 consecutive days' },
    category: 'checkin',
  },
  {
    id: 'streak_30',
    name: { zh: '月行者', en: 'Month Pilgrim' },
    desc: { zh: '连续30天各完成一次漫步', en: 'Walk for 30 consecutive days' },
    category: 'checkin',
  },
  {
    id: 'same_place',
    name: { zh: '故地', en: 'Familiar Ground' },
    desc: { zh: '同一地点完成3次漫步', en: 'Complete 3 walks at the same location' },
    category: 'checkin',
  },

  // 时间类
  {
    id: 'early_bird',
    name: { zh: '晨光', en: 'Dawn Light' },
    desc: { zh: '6点前完成一次漫步', en: 'Complete a walk before 6am' },
    category: 'time',
  },
  {
    id: 'night_owl',
    name: { zh: '夜行', en: 'Night Walk' },
    desc: { zh: '21点后完成一次漫步', en: 'Complete a walk after 9pm' },
    category: 'time',
  },
  {
    id: 'noon',
    name: { zh: '正午', en: 'High Noon' },
    desc: { zh: '12:00-12:30之间完成一次漫步', en: 'Complete a walk between 12:00-12:30' },
    category: 'time',
  },

  // 数量类
  {
    id: 'walk_10',
    name: { zh: '十步', en: 'Ten Steps' },
    desc: { zh: '累计完成10次漫步', en: 'Complete 10 total walks' },
    category: 'count',
  },
  {
    id: 'walk_50',
    name: { zh: '五十步', en: 'Fifty Steps' },
    desc: { zh: '累计完成50次漫步', en: 'Complete 50 total walks' },
    category: 'count',
  },
  {
    id: 'walk_100',
    name: { zh: '百步', en: 'Hundred Steps' },
    desc: { zh: '累计完成100次漫步', en: 'Complete 100 total walks' },
    category: 'count',
  },
  {
    id: 'color_100',
    name: { zh: '百色', en: 'Hundred Hues' },
    desc: { zh: '累计采集100个颜色', en: 'Collect 100 total colors' },
    category: 'count',
  },
  {
    id: 'color_500',
    name: { zh: '五百色', en: 'Five Hundred Hues' },
    desc: { zh: '累计采集500个颜色', en: 'Collect 500 total colors' },
    category: 'count',
  },

  // 模式类
  {
    id: 'all_strict',
    name: { zh: '三味', en: 'Triple Flavor' },
    desc: { zh: '三种严格程度各完成一次', en: 'Complete one walk in each strictness level' },
    category: 'mode',
  },
  {
    id: 'both_modes',
    name: { zh: '两仪', en: 'Duality' },
    desc: { zh: '单色和自由模式各完成5次', en: 'Complete 5 walks in each capture mode' },
    category: 'mode',
  },

  // 季节类
  {
    id: 'all_seasons',
    name: { zh: '四季', en: 'Four Seasons' },
    desc: { zh: '春夏秋冬各完成一次漫步', en: 'Complete a walk in each season' },
    category: 'season',
  },
  {
    id: 'season_10',
    name: { zh: '时令', en: 'In Season' },
    desc: { zh: '同一季节完成10次漫步', en: 'Complete 10 walks in the same season' },
    category: 'season',
  },
]
