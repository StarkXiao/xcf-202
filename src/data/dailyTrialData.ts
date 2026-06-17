import type { DailyTrialLevel, DailyTrialReward, Enemy, EnemySpecialSkill, BossPhase, ElementType, DailyTrialMilestone } from '../types'

const createTrialEnemy = (
  id: string,
  name: string,
  health: number,
  attack: number,
  defense: number,
  exp: number,
  gold: number,
  color: number,
  size: number,
  element?: ElementType,
  specialSkills?: EnemySpecialSkill[]
): Enemy => ({
  id,
  name,
  health,
  maxHealth: health,
  attack,
  defense,
  exp,
  gold,
  color,
  size,
  element,
  type: 'elite',
  specialSkills: specialSkills || [],
  currentPhase: 0
})

const createTrialBoss = (
  id: string,
  name: string,
  health: number,
  attack: number,
  defense: number,
  exp: number,
  gold: number,
  color: number,
  size: number,
  element?: ElementType,
  phases?: BossPhase[],
  specialSkills?: EnemySpecialSkill[]
): Enemy => ({
  id,
  name,
  health,
  maxHealth: health,
  attack,
  defense,
  exp,
  gold,
  color,
  size,
  element,
  type: 'boss',
  phases: phases || [],
  specialSkills: specialSkills || phases?.[0]?.specialSkills || [],
  currentPhase: 0
})

const BASIC_DEBUFF_SKILLS: EnemySpecialSkill[] = [
  { id: 'trial_weakening', name: '虚弱咒', description: '降低敌人防御', debuffEffect: { type: 'defenseDown', value: 8, duration: 2 }, chance: 0.3, icon: '💔', color: 0x9ccc65, cooldown: 2 }
]

const ADVANCED_DEBUFF_SKILLS: EnemySpecialSkill[] = [
  { id: 'trial_fury', name: '狂暴', description: '大幅提升攻击力', buffEffect: { type: 'attack', value: 20, duration: 3 }, chance: 0.35, icon: '💢', color: 0xef5350, cooldown: 3 },
  { id: 'trial_lifesteal', name: '吸血', description: '吸取敌人生命', damage: 30, heal: 30, chance: 0.3, icon: '🩸', color: 0xb71c1c, cooldown: 2 }
]

const ELITE_SKILLS: EnemySpecialSkill[] = [
  { id: 'trial_soul_drain', name: '摄魂', description: '侵蚀灵魂降低攻击', damage: 40, debuffEffect: { type: 'attackDown', value: 15, duration: 2 }, chance: 0.35, icon: '👻', color: 0x7e57c2, cooldown: 2 },
  { id: 'trial_shield', name: '罡气护体', description: '提升防御', buffEffect: { type: 'defense', value: 25, duration: 2 }, chance: 0.3, icon: '🛡', color: 0x9575cd, cooldown: 3 }
]

const createBossPhase = (
  phase: number,
  name: string,
  healthThreshold: number,
  attackMultiplier: number,
  defenseMultiplier: number,
  skills: EnemySpecialSkill[],
  color: number,
  message: string
): BossPhase => ({
  phase,
  name,
  healthThreshold,
  attackMultiplier,
  defenseMultiplier,
  specialSkills: skills,
  color,
  message
})

const BOSS_PHASES_1: BossPhase[] = [
  createBossPhase(1, '试炼守卫', 1.0, 1.0, 1.0, [
    { id: 'boss_smash', name: '重击', description: '强力一击', damage: 50, chance: 0.4, icon: '💥', color: 0xff5722, cooldown: 2 }
  ], 0x66bb6a, '试炼守卫觉醒了力量！')
]

const BOSS_PHASES_2: BossPhase[] = [
  createBossPhase(1, '烈焰使', 1.0, 1.0, 1.0, [
    { id: 'boss_fireball', name: '火球术', description: '发射火球', damage: 70, debuffEffect: { type: 'burn', value: 10, duration: 2 }, chance: 0.4, icon: '🔥', color: 0xff7043, cooldown: 2 }
  ], 0xff7043, '烈焰使燃起怒火！'),
  createBossPhase(2, '烈焰使·狂焰', 0.5, 1.5, 1.2, [
    { id: 'boss_eruption', name: '烈焰爆发', description: '引爆火焰', damage: 100, chance: 0.45, icon: '💥', color: 0xbf360c, cooldown: 2 }
  ], 0xbf360c, '烈焰使进入狂焰状态！')
]

const BOSS_PHASES_3: BossPhase[] = [
  createBossPhase(1, '寒冰魔将', 1.0, 1.0, 1.0, [
    { id: 'boss_frost', name: '冰霜吐息', description: '冻结敌人', damage: 90, debuffEffect: { type: 'slow', value: 5, duration: 3 }, chance: 0.4, icon: '❄', color: 0x00bcd4, cooldown: 2 },
    { id: 'boss_ice_armor', name: '冰甲', description: '提升防御', buffEffect: { type: 'defense', value: 30, duration: 2 }, chance: 0.3, icon: '🛡', color: 0x4dd0e1, cooldown: 3 }
  ], 0x00bcd4, '寒冰魔将展开冰甲！'),
  createBossPhase(2, '寒冰魔将·极寒', 0.4, 1.6, 1.3, [
    { id: 'boss_blizzard', name: '暴风雪', description: '极寒风暴', damage: 130, chance: 0.45, icon: '🌨', color: 0x0097a7, cooldown: 2 }
  ], 0x0097a7, '寒冰魔将进入极寒领域！')
]

const BOSS_PHASES_4: BossPhase[] = [
  createBossPhase(1, '幽冥领主', 1.0, 1.0, 1.0, [
    { id: 'boss_shadow', name: '暗影吞噬', description: '暗影伤害并吸血', damage: 110, heal: 50, chance: 0.4, icon: '🌑', color: 0x7e57c2, cooldown: 2 },
    { id: 'boss_curse', name: '诅咒', description: '降低敌人攻防', debuffEffect: { type: 'defenseDown', value: 20, duration: 3 }, chance: 0.35, icon: '☠', color: 0x6a1b9a, cooldown: 3 }
  ], 0x7e57c2, '幽冥领主释放幽冥之力！'),
  createBossPhase(2, '幽冥领主·深渊', 0.5, 1.7, 1.4, [
    { id: 'boss_void', name: '虚空爆裂', description: '虚空之力毁灭一切', damage: 160, chance: 0.45, icon: '💜', color: 0x4a148c, cooldown: 2 }
  ], 0x4a148c, '幽冥领主进入深渊形态！'),
  createBossPhase(3, '幽冥领主·永恒', 0.25, 2.0, 1.6, [
    { id: 'boss_eternal', name: '永恒寂灭', description: '终结一切的一击', damage: 200, chance: 0.5, icon: '⚡', color: 0x311b92, cooldown: 2 }
  ], 0x311b92, '幽冥领主展现永恒之力！')
]

const BOSS_PHASES_5: BossPhase[] = [
  createBossPhase(1, '天魔化身', 1.0, 1.0, 1.0, [
    { id: 'boss_dark_flame', name: '暗焰', description: '黑暗火焰灼烧', damage: 140, debuffEffect: { type: 'burn', value: 15, duration: 3 }, chance: 0.4, icon: '🔥', color: 0x4a148c, cooldown: 2 },
    { id: 'boss_dark_barrier', name: '黑暗结界', description: '大幅提升防御', buffEffect: { type: 'defense', value: 40, duration: 3 }, chance: 0.3, icon: '🌑', color: 0x1a0033, cooldown: 3 }
  ], 0x4a148c, '天魔化身降临！'),
  createBossPhase(2, '天魔化身·毁灭', 0.5, 1.8, 1.5, [
    { id: 'boss_annihilate', name: '毁灭冲击', description: '毁灭一切的力量', damage: 200, debuffEffect: { type: 'defenseDown', value: 25, duration: 2 }, chance: 0.45, icon: '💥', color: 0x880e4f, cooldown: 2 },
    { id: 'boss_dark_heal', name: '暗渊再生', description: '恢复生命', heal: 100, chance: 0.25, icon: '💜', color: 0x6a1b9a, cooldown: 4 }
  ], 0x880e4f, '天魔化身进入毁灭形态！'),
  createBossPhase(3, '天魔化身·终焉', 0.25, 2.2, 1.8, [
    { id: 'boss_apocalypse', name: '天魔降世', description: '终极毁灭', damage: 280, chance: 0.5, icon: '☠', color: 0x1a0033, cooldown: 2 }
  ], 0x1a0033, '天魔化身展现终焉之力！')
]

const makeRewards = (gold: number, spirit: number, exp: number, extra?: DailyTrialReward[]): DailyTrialReward[] => {
  const base: DailyTrialReward[] = [
    { type: 'gold', value: gold },
    { type: 'spirit', value: spirit },
    { type: 'exp', value: exp }
  ]
  return extra ? [...base, ...extra] : base
}

export const DAILY_TRIAL_LEVELS: DailyTrialLevel[] = [
  {
    id: 1,
    name: '试炼·初境',
    description: '新手试炼，初窥门径',
    difficulty: 'easy',
    background: 0x1b5e20,
    unlockLevel: 1,
    minPlayerLevel: 1,
    statMultiplier: { health: 1.0, attack: 1.0, defense: 1.0 },
    enemies: [
      createTrialEnemy('trial1_enemy1', '试炼妖兵', 180, 22, 10, 40, 60, 0x81c784, 42, 'earth', BASIC_DEBUFF_SKILLS),
      createTrialBoss('trial1_boss', '试炼守卫', 320, 28, 12, 80, 150, 0x66bb6a, 48, 'metal', BOSS_PHASES_1)
    ],
    rewards: makeRewards(200, 30, 80)
  },
  {
    id: 2,
    name: '试炼·炼心',
    description: '修炼心性，考验意志',
    difficulty: 'easy',
    background: 0x004d40,
    unlockLevel: 2,
    minPlayerLevel: 2,
    statMultiplier: { health: 1.2, attack: 1.15, defense: 1.1 },
    enemies: [
      createTrialEnemy('trial2_enemy1', '试炼术士', 350, 45, 20, 70, 100, 0x4dd0e1, 46, 'water', BASIC_DEBUFF_SKILLS),
      createTrialBoss('trial2_boss', '烈焰使', 600, 55, 22, 150, 280, 0xff7043, 54, 'fire', BOSS_PHASES_2)
    ],
    rewards: makeRewards(400, 60, 160, [
      { type: 'material', value: 1, itemId: 'spirit_ore', itemName: '灵矿', itemIcon: '💎', itemColor: 0x4dd0e1 }
    ])
  },
  {
    id: 3,
    name: '试炼·问道',
    description: '叩问仙途，明道之心',
    difficulty: 'normal',
    background: 0x1a237e,
    unlockLevel: 3,
    minPlayerLevel: 4,
    statMultiplier: { health: 1.5, attack: 1.35, defense: 1.25 },
    enemies: [
      createTrialEnemy('trial3_enemy1', '试炼剑卫', 550, 70, 35, 100, 150, 0x90caf9, 50, 'metal', ADVANCED_DEBUFF_SKILLS),
      createTrialBoss('trial3_boss', '寒冰魔将', 1000, 85, 45, 220, 450, 0x00bcd4, 60, 'water', BOSS_PHASES_3)
    ],
    rewards: makeRewards(700, 100, 280, [
      { type: 'herb', value: 1, itemId: 'rare_herb', itemName: '天山雪莲', itemIcon: '❄', itemColor: 0x00bcd4 }
    ])
  },
  {
    id: 4,
    name: '试炼·破境',
    description: '破而后立，蜕变化蝶',
    difficulty: 'normal',
    background: 0x4a148c,
    unlockLevel: 4,
    minPlayerLevel: 6,
    statMultiplier: { health: 1.8, attack: 1.6, defense: 1.45 },
    enemies: [
      createTrialEnemy('trial4_enemy1', '试炼暗卫', 800, 100, 50, 140, 200, 0xba68c8, 54, 'water', ELITE_SKILLS),
      createTrialBoss('trial4_boss', '幽冥领主', 1600, 120, 65, 320, 650, 0x7e57c2, 66, 'water', BOSS_PHASES_4)
    ],
    rewards: makeRewards(1100, 160, 450, [
      { type: 'material', value: 2, itemId: 'spirit_crystal', itemName: '灵晶', itemIcon: '✦', itemColor: 0xba68c8 },
      { type: 'pill', value: 1, itemId: 'attack_pill', itemName: '攻伐丹', itemIcon: '⚔', itemColor: 0xff7043 }
    ])
  },
  {
    id: 5,
    name: '试炼·通天',
    description: '通天大道，近在咫尺',
    difficulty: 'hard',
    background: 0x880e4f,
    unlockLevel: 5,
    minPlayerLevel: 8,
    statMultiplier: { health: 2.2, attack: 1.9, defense: 1.7 },
    enemies: [
      createTrialEnemy('trial5_enemy1', '试炼魔将', 1200, 140, 70, 180, 260, 0xef5350, 58, 'fire', ELITE_SKILLS),
      createTrialBoss('trial5_boss', '天魔化身', 2800, 170, 90, 450, 1000, 0x4a148c, 74, 'fire', BOSS_PHASES_5)
    ],
    rewards: makeRewards(1800, 260, 700, [
      { type: 'herb', value: 2, itemId: 'soul_lotus', itemName: '幽冥莲', itemIcon: '🪷', itemColor: 0x7e57c2 },
      { type: 'material', value: 2, itemId: 'demon_bone', itemName: '魔骨', itemIcon: '🦴', itemColor: 0xef5350 }
    ])
  },
  {
    id: 6,
    name: '试炼·涅槃',
    description: '浴火重生，涅槃归来',
    difficulty: 'hard',
    background: 0xbf360c,
    unlockLevel: 6,
    minPlayerLevel: 10,
    statMultiplier: { health: 2.8, attack: 2.3, defense: 2.0 },
    enemies: [
      createTrialEnemy('trial6_enemy1', '涅槃火凤', 1800, 200, 100, 250, 380, 0xff7043, 62, 'fire', ADVANCED_DEBUFF_SKILLS),
      createTrialEnemy('trial6_enemy2', '熔岩守卫', 1600, 180, 110, 230, 350, 0xe64a19, 60, 'earth', ELITE_SKILLS),
      createTrialBoss('trial6_boss', '涅槃魔尊', 4500, 250, 130, 600, 1500, 0xd84315, 80, 'fire', BOSS_PHASES_5)
    ],
    rewards: makeRewards(2800, 400, 1100, [
      { type: 'herb', value: 2, itemId: 'fire_heart_grass', itemName: '火心草', itemIcon: '🔥', itemColor: 0xff7043 },
      { type: 'material', value: 3, itemId: 'lava_core', itemName: '熔岩核心', itemIcon: '💠', itemColor: 0xbf360c },
      { type: 'pill', value: 2, itemId: 'health_pill', itemName: '归元丹', itemIcon: '❤️', itemColor: 0xef5350 }
    ])
  },
  {
    id: 7,
    name: '试炼·诛仙',
    description: '诛仙弑神，一念之间',
    difficulty: 'extreme',
    background: 0x1a0033,
    unlockLevel: 7,
    minPlayerLevel: 12,
    statMultiplier: { health: 3.5, attack: 2.8, defense: 2.4 },
    enemies: [
      createTrialEnemy('trial7_enemy1', '诛仙剑侍', 2500, 270, 140, 320, 480, 0x9575cd, 64, 'metal', ELITE_SKILLS),
      createTrialEnemy('trial7_enemy2', '诛仙护法', 2200, 300, 130, 300, 450, 0x7e57c2, 62, 'fire', ADVANCED_DEBUFF_SKILLS),
      createTrialBoss('trial7_boss', '诛仙魔尊', 7000, 350, 180, 800, 2200, 0x4a148c, 86, 'metal', BOSS_PHASES_5)
    ],
    rewards: makeRewards(4500, 650, 1700, [
      { type: 'herb', value: 3, itemId: 'immortal_herb', itemName: '九转灵芝', itemIcon: '🌟', itemColor: 0xffd54f },
      { type: 'material', value: 2, itemId: 'demon_heart', itemName: '天魔之心', itemIcon: '💜', itemColor: 0x4a148c },
      { type: 'pill', value: 2, itemId: 'spirit_pill', itemName: '聚灵丹', itemIcon: '✨', itemColor: 0x4fc3f7 }
    ])
  },
  {
    id: 8,
    name: '试炼·混沌',
    description: '混沌初开，万象归宗',
    difficulty: 'extreme',
    background: 0x0d47a1,
    unlockLevel: 8,
    minPlayerLevel: 15,
    statMultiplier: { health: 4.5, attack: 3.5, defense: 3.0 },
    enemies: [
      createTrialEnemy('trial8_enemy1', '混沌使者', 3500, 380, 190, 420, 620, 0x1976d2, 68, 'water', ELITE_SKILLS),
      createTrialEnemy('trial8_enemy2', '混沌守护', 3200, 350, 210, 400, 580, 0x0288d1, 66, 'earth', ADVANCED_DEBUFF_SKILLS),
      createTrialEnemy('trial8_enemy3', '混沌凶兽', 3800, 420, 170, 450, 680, 0x0097a7, 70, 'fire', ELITE_SKILLS),
      createTrialBoss('trial8_boss', '混沌魔神', 11000, 480, 250, 1100, 3500, 0x0d47a1, 92, 'metal', BOSS_PHASES_5)
    ],
    rewards: makeRewards(7000, 1000, 2600, [
      { type: 'herb', value: 4, itemId: 'immortal_herb', itemName: '九转灵芝', itemIcon: '🌟', itemColor: 0xffd54f },
      { type: 'material', value: 4, itemId: 'demon_heart', itemName: '天魔之心', itemIcon: '💜', itemColor: 0x4a148c },
      { type: 'pill', value: 3, itemId: 'attack_pill', itemName: '攻伐丹', itemIcon: '⚔', itemColor: 0xff7043 },
      { type: 'pill', value: 3, itemId: 'health_pill', itemName: '归元丹', itemIcon: '❤️', itemColor: 0xef5350 }
    ])
  },
  {
    id: 9,
    name: '试炼·鸿蒙',
    description: '鸿蒙紫气，大道可期',
    difficulty: 'extreme',
    background: 0x311b92,
    unlockLevel: 9,
    minPlayerLevel: 18,
    statMultiplier: { health: 6.0, attack: 4.5, defense: 3.8 },
    enemies: [
      createTrialEnemy('trial9_enemy1', '鸿蒙守卫', 5000, 500, 260, 550, 800, 0x512da8, 72, 'metal', ELITE_SKILLS),
      createTrialEnemy('trial9_enemy2', '鸿蒙圣兽', 4500, 550, 240, 520, 760, 0x673ab7, 70, 'wood', ADVANCED_DEBUFF_SKILLS),
      createTrialEnemy('trial9_enemy3', '鸿蒙仙将', 4800, 520, 280, 530, 780, 0x7e57c2, 74, 'water', ELITE_SKILLS),
      createTrialBoss('trial9_boss', '鸿蒙道祖', 17000, 650, 350, 1500, 5000, 0x311b92, 100, 'none', BOSS_PHASES_5)
    ],
    rewards: makeRewards(11000, 1600, 4000, [
      { type: 'herb', value: 5, itemId: 'immortal_herb', itemName: '九转灵芝', itemIcon: '🌟', itemColor: 0xffd54f },
      { type: 'material', value: 5, itemId: 'demon_heart', itemName: '天魔之心', itemIcon: '💜', itemColor: 0x4a148c },
      { type: 'pill', value: 4, itemId: 'spirit_pill', itemName: '聚灵丹', itemIcon: '✨', itemColor: 0x4fc3f7 },
      { type: 'pill', value: 4, itemId: 'attack_pill', itemName: '攻伐丹', itemIcon: '⚔', itemColor: 0xff7043 }
    ])
  },
  {
    id: 10,
    name: '试炼·永恒',
    description: '永恒之境，巅峰之路',
    difficulty: 'extreme',
    background: 0x000000,
    unlockLevel: 10,
    minPlayerLevel: 20,
    statMultiplier: { health: 8.0, attack: 6.0, defense: 5.0 },
    enemies: [
      createTrialEnemy('trial10_enemy1', '永恒使者', 7000, 700, 360, 700, 1000, 0xffd54f, 78, 'metal', ELITE_SKILLS),
      createTrialEnemy('trial10_enemy2', '永恒守护者', 6500, 650, 400, 680, 980, 0xffb300, 76, 'earth', ADVANCED_DEBUFF_SKILLS),
      createTrialEnemy('trial10_enemy3', '永恒神兽', 6800, 720, 340, 690, 990, 0xff8f00, 80, 'fire', ELITE_SKILLS),
      createTrialEnemy('trial10_enemy4', '永恒仙尊', 7200, 680, 380, 710, 1020, 0xffa000, 78, 'water', ADVANCED_DEBUFF_SKILLS),
      createTrialBoss('trial10_boss', '永恒天帝', 26000, 900, 500, 2000, 8000, 0xffd54f, 110, 'none', BOSS_PHASES_5)
    ],
    rewards: makeRewards(18000, 2500, 6500, [
      { type: 'herb', value: 8, itemId: 'immortal_herb', itemName: '九转灵芝', itemIcon: '🌟', itemColor: 0xffd54f },
      { type: 'material', value: 6, itemId: 'demon_heart', itemName: '天魔之心', itemIcon: '💜', itemColor: 0x4a148c },
      { type: 'pill', value: 5, itemId: 'spirit_pill', itemName: '聚灵丹', itemIcon: '✨', itemColor: 0x4fc3f7 },
      { type: 'pill', value: 5, itemId: 'attack_pill', itemName: '攻伐丹', itemIcon: '⚔', itemColor: 0xff7043 },
      { type: 'pill', value: 5, itemId: 'health_pill', itemName: '归元丹', itemIcon: '❤️', itemColor: 0xef5350 }
    ])
  }
]

export const DAILY_TRIAL_CONFIG = {
  MAX_DAILY_ATTEMPTS: 3,
  BASE_REWARD_MULTIPLIER: 1.0,
  FIRST_CLEAR_BONUS: 1.5,
  LEVEL_CLEAR_TIME_BONUS_THRESHOLD: 120,
  TIME_BONUS_MULTIPLIER: 1.2,
  PLAYER_STAT_PENALTY: 0.8,
  MAX_PURCHASABLE_ATTEMPTS: 2,
  EXTRA_ATTEMPT_BASE_COST: 100,
  EXTRA_ATTEMPT_COST_SCALE: 1.5,
  STREAK_BONUS_PER_DAY: 0.1,
  MAX_STREAK_BONUS: 0.5,
  DIFFICULTY_SCALE_PER_ATTEMPT: 0.15,
  MAX_DIFFICULTY_SCALE: 1.0,
  LEVEL_BONUS_ATTEMPT_THRESHOLD: 5,
  LEVEL_BONUS_EXTRA_ATTEMPTS: 1
}

export const DAILY_TRIAL_MILESTONES: DailyTrialMilestone[] = [
  {
    id: 1,
    requiredClearedLevels: 1,
    rewards: [
      { type: 'gold', value: 300 },
      { type: 'spirit', value: 50 }
    ],
    label: '初试锋芒',
    icon: '🗡️'
  },
  {
    id: 2,
    requiredClearedLevels: 3,
    rewards: [
      { type: 'gold', value: 800 },
      { type: 'spirit', value: 120 },
      { type: 'exp', value: 200 },
      { type: 'material', value: 1, itemId: 'spirit_ore', itemName: '灵矿', itemIcon: '💎', itemColor: 0x4dd0e1 }
    ],
    label: '连战连捷',
    icon: '⚔️'
  },
  {
    id: 3,
    requiredClearedLevels: 5,
    rewards: [
      { type: 'gold', value: 2000 },
      { type: 'spirit', value: 300 },
      { type: 'exp', value: 500 },
      { type: 'herb', value: 2, itemId: 'rare_herb', itemName: '天山雪莲', itemIcon: '❄', itemColor: 0x00bcd4 },
      { type: 'pill', value: 1, itemId: 'spirit_pill', itemName: '聚灵丹', itemIcon: '✨', itemColor: 0x4fc3f7 }
    ],
    label: '试炼宗师',
    icon: '🏆'
  }
]
