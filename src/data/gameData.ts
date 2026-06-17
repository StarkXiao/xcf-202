import type { Skill, Treasure, Stage, Enemy, ElementType, EnemySpecialSkill, BossPhase, EnemyDrop } from '../types'

export const INITIAL_SKILLS: Skill[] = [
  {
    id: 'sword_strike',
    name: '御剑斩',
    description: '凝聚剑气，对敌人造成基础伤害',
    damage: 30,
    cooldown: 0,
    currentCooldown: 0,
    manaCost: 0,
    unlockLevel: 1,
    color: 0x4fc3f7,
    icon: '⚔',
    element: 'metal'
  },
  {
    id: 'thunder_sword',
    name: '雷霆剑诀',
    description: '召唤九天雷罚，剑引雷霆万钧',
    damage: 80,
    cooldown: 3,
    currentCooldown: 0,
    manaCost: 20,
    unlockLevel: 2,
    color: 0xffeb3b,
    icon: '⚡',
    element: 'metal'
  },
  {
    id: 'flame_slash',
    name: '赤炎焚天',
    description: '剑心燃火，焚烧一切阻碍',
    damage: 120,
    cooldown: 5,
    currentCooldown: 0,
    manaCost: 35,
    unlockLevel: 4,
    color: 0xff5722,
    icon: '🔥',
    element: 'fire'
  },
  {
    id: 'frost_blade',
    name: '寒霜封天',
    description: '极寒剑气，冻结敌人并造成大量伤害',
    damage: 180,
    cooldown: 8,
    currentCooldown: 0,
    manaCost: 50,
    unlockLevel: 7,
    color: 0x00bcd4,
    icon: '❄',
    element: 'water'
  }
]

export const INITIAL_TREASURES: Treasure[] = [
  {
    id: 'flying_sword',
    name: '青锋剑',
    description: '修仙者入门佩剑，蕴含微薄灵气',
    level: 1,
    maxLevel: 10,
    attackBonus: 10,
    defenseBonus: 0,
    healthBonus: 0,
    upgradeCost: 100,
    color: 0x78909c,
    element: 'metal',
    elementDamageBonus: 0.05
  },
  {
    id: 'jade_pendant',
    name: '通灵玉佩',
    description: '上古玉珏，护主心神，可挡致命一击',
    level: 1,
    maxLevel: 10,
    attackBonus: 0,
    defenseBonus: 8,
    healthBonus: 50,
    upgradeCost: 150,
    color: 0x81c784,
    element: 'wood',
    elementDamageBonus: 0.05
  },
  {
    id: 'pearl',
    name: '定海神珠',
    description: '深海奇珠，凝练灵力',
    level: 1,
    maxLevel: 10,
    attackBonus: 5,
    defenseBonus: 5,
    healthBonus: 30,
    upgradeCost: 200,
    color: 0x4dd0e1,
    element: 'water',
    elementDamageBonus: 0.05
  }
]

const createEnemy = (id: string, name: string, health: number, attack: number, defense: number, exp: number, gold: number, color: number, size: number, element?: ElementType): Enemy => ({
  id, name, health, maxHealth: health, attack, defense, exp, gold, color, size, element
})

const ELITE_SKILLS: Record<string, EnemySpecialSkill[]> = {
  wolf_elite: [
    { id: 'wolf_howl', name: '幽嚎', description: '发出令人胆寒的嚎叫，降低敌人防御', debuffEffect: { type: 'defenseDown', value: 5, duration: 2 }, chance: 0.3, icon: '🐺', color: 0x9ccc65, cooldown: 2 }
  ],
  demon_elite: [
    { id: 'blood_fury', name: '血怒', description: '以血为祭，大幅提升攻击力', buffEffect: { type: 'attack', value: 15, duration: 3 }, chance: 0.35, icon: '🩸', color: 0xef5350, cooldown: 3 },
    { id: 'life_drain', name: '噬血术', description: '吸取敌人生命力', damage: 25, heal: 25, chance: 0.25, icon: '💀', color: 0xb71c1c, cooldown: 2 }
  ],
  ghost_elite: [
    { id: 'soul_drain', name: '摄魂术', description: '侵蚀敌人灵魂，造成伤害并降低攻击', damage: 30, debuffEffect: { type: 'attackDown', value: 8, duration: 2 }, chance: 0.3, icon: '👻', color: 0x7e57c2, cooldown: 2 },
    { id: 'ghost_shield', name: '冥盾', description: '凝聚幽冥之力提升防御', buffEffect: { type: 'defense', value: 10, duration: 2 }, chance: 0.25, icon: '🛡', color: 0x9575cd, cooldown: 3 }
  ],
  fire_elite: [
    { id: 'hellfire', name: '炼狱之焰', description: '召唤地狱之火焚灭一切', damage: 45, debuffEffect: { type: 'burn', value: 8, duration: 3 }, chance: 0.35, icon: '🔥', color: 0xff7043, cooldown: 2 },
    { id: 'molten_armor', name: '熔岩护甲', description: '覆盖熔岩护甲大幅提升防御', buffEffect: { type: 'defense', value: 15, duration: 2 }, chance: 0.3, icon: '🌋', color: 0xbf360c, cooldown: 3 }
  ],
  demon_lord_elite: [
    { id: 'demon_burst', name: '魔气爆裂', description: '释放魔气造成大量伤害', damage: 60, chance: 0.35, icon: '💥', color: 0x880e4f, cooldown: 2 },
    { id: 'dark_barrier', name: '暗影结界', description: '构筑暗影结界提升防御', buffEffect: { type: 'defense', value: 20, duration: 2 }, chance: 0.3, icon: '🌑', color: 0x4a148c, cooldown: 3 },
    { id: 'corrupt', name: '腐化侵蚀', description: '腐化敌人降低攻防', debuffEffect: { type: 'attackDown', value: 12, duration: 2 }, chance: 0.25, icon: '☠', color: 0x6a1b9a, cooldown: 2 }
  ]
}

const ELITE_DROPS: Record<string, EnemyDrop[]> = {
  default: [
    { type: 'gold', amount: 30, chance: 1.0, color: 0xffd54f },
    { type: 'spirit', amount: 10, chance: 0.8, color: 0x81c784 },
    { type: 'herb', id: 'basic_herb', name: '灵草', icon: '🌿', amount: 1, chance: 0.3, color: 0x66bb6a },
    { type: 'material', id: 'spirit_ore', name: '灵矿', icon: '💎', amount: 1, chance: 0.2, color: 0x4dd0e1 }
  ],
  high: [
    { type: 'gold', amount: 80, chance: 1.0, color: 0xffd54f },
    { type: 'spirit', amount: 25, chance: 0.9, color: 0x81c784 },
    { type: 'herb', id: 'rare_herb', name: '天山雪莲', icon: '❄', amount: 1, chance: 0.25, color: 0x00bcd4 },
    { type: 'material', id: 'spirit_crystal', name: '灵晶', icon: '✦', amount: 1, chance: 0.2, color: 0xba68c8 }
  ]
}

const BOSS_DROPS: Record<string, EnemyDrop[]> = {
  stage1: [
    { type: 'gold', amount: 60, chance: 1.0, color: 0xffd54f },
    { type: 'spirit', amount: 15, chance: 1.0, color: 0x81c784 },
    { type: 'exp', amount: 30, chance: 1.0, color: 0x4fc3f7 },
    { type: 'herb', id: 'moon_grass', name: '月华草', icon: '🌙', amount: 1, chance: 0.5, color: 0xce93d8 }
  ],
  stage2: [
    { type: 'gold', amount: 120, chance: 1.0, color: 0xffd54f },
    { type: 'spirit', amount: 30, chance: 1.0, color: 0x81c784 },
    { type: 'exp', amount: 60, chance: 1.0, color: 0x4fc3f7 },
    { type: 'material', id: 'demon_bone', name: '魔骨', icon: '🦴', amount: 1, chance: 0.4, color: 0xef5350 }
  ],
  stage3: [
    { type: 'gold', amount: 250, chance: 1.0, color: 0xffd54f },
    { type: 'spirit', amount: 50, chance: 1.0, color: 0x81c784 },
    { type: 'exp', amount: 100, chance: 1.0, color: 0x4fc3f7 },
    { type: 'herb', id: 'soul_lotus', name: '幽冥莲', icon: '🪷', amount: 1, chance: 0.35, color: 0x7e57c2 },
    { type: 'material', id: 'ghost_iron', name: '冥铁', icon: '⛓', amount: 1, chance: 0.3, color: 0x546e7a }
  ],
  stage4: [
    { type: 'gold', amount: 400, chance: 1.0, color: 0xffd54f },
    { type: 'spirit', amount: 80, chance: 1.0, color: 0x81c784 },
    { type: 'exp', amount: 180, chance: 1.0, color: 0x4fc3f7 },
    { type: 'herb', id: 'fire_heart_grass', name: '火心草', icon: '🔥', amount: 1, chance: 0.4, color: 0xff7043 },
    { type: 'material', id: 'lava_core', name: '熔岩核心', icon: '💠', amount: 1, chance: 0.3, color: 0xbf360c }
  ],
  stage5: [
    { type: 'gold', amount: 1000, chance: 1.0, color: 0xffd54f },
    { type: 'spirit', amount: 150, chance: 1.0, color: 0x81c784 },
    { type: 'exp', amount: 300, chance: 1.0, color: 0x4fc3f7 },
    { type: 'herb', id: 'immortal_herb', name: '九转灵芝', icon: '🌟', amount: 1, chance: 0.4, color: 0xffd54f },
    { type: 'material', id: 'demon_heart', name: '天魔之心', icon: '💜', amount: 1, chance: 0.25, color: 0x4a148c }
  ]
}

const BOSS_PHASES: Record<string, BossPhase[]> = {
  snake_boss: [
    { phase: 1, name: '青蛇', healthThreshold: 1.0, attackMultiplier: 1.0, defenseMultiplier: 1.0, specialSkills: [{ id: 'venom_spit', name: '毒液喷射', description: '喷射致命毒液', damage: 20, debuffEffect: { type: 'burn', value: 5, duration: 3 }, chance: 0.35, icon: '🐍', color: 0x66bb6a, cooldown: 2 }], color: 0x66bb6a, message: '青蛇吐出毒雾，战斗进入白热化！' },
    { phase: 2, name: '青蛇·化蛟', healthThreshold: 0.5, attackMultiplier: 1.4, defenseMultiplier: 1.2, specialSkills: [{ id: 'dragon_breath', name: '蛟龙吐息', description: '化蛟后喷吐龙息', damage: 40, chance: 0.4, icon: '🐉', color: 0x2e7d32, cooldown: 2 }, { id: 'scale_armor', name: '龙鳞护体', description: '龙鳞覆盖提升防御', buffEffect: { type: 'defense', value: 12, duration: 2 }, chance: 0.3, icon: '🛡', color: 0x1b5e20, cooldown: 3 }], color: 0x2e7d32, message: '青蛇蜕皮化蛟，实力暴增！' }
  ],
  bat_boss: [
    { phase: 1, name: '暗影蝠', healthThreshold: 1.0, attackMultiplier: 1.0, defenseMultiplier: 1.0, specialSkills: [{ id: 'shadow_drain', name: '暗影吞噬', description: '吞噬暗影恢复生命', damage: 15, heal: 20, chance: 0.3, icon: '🌑', color: 0xab47bc, cooldown: 2 }], color: 0xab47bc, message: '暗影蝠的翅膀扇动，黑雾弥漫！' },
    { phase: 2, name: '暗影蝠·血翼', healthThreshold: 0.4, attackMultiplier: 1.5, defenseMultiplier: 1.1, specialSkills: [{ id: 'blood_storm', name: '血翼风暴', description: '血翼卷起毁灭风暴', damage: 45, chance: 0.4, icon: '🦇', color: 0x880e4f, cooldown: 2 }, { id: 'vampire_bite', name: '嗜血之咬', description: '吸取大量生命', damage: 30, heal: 40, chance: 0.35, icon: '🩸', color: 0xb71c1c, cooldown: 3 }], color: 0x880e4f, message: '暗影蝠展露血翼真身，嗜血之力觉醒！' }
  ],
  skeleton_boss: [
    { phase: 1, name: '骷髅战将', healthThreshold: 1.0, attackMultiplier: 1.0, defenseMultiplier: 1.0, specialSkills: [{ id: 'bone_shield', name: '骨盾术', description: '召唤骨盾提升防御', buffEffect: { type: 'defense', value: 12, duration: 2 }, chance: 0.3, icon: '🦴', color: 0xe0e0e0, cooldown: 2 }, { id: 'bone_throw', name: '飞骨投掷', description: '投掷锋利骨刺', damage: 35, chance: 0.35, icon: '💀', color: 0xbdbdbd, cooldown: 2 }], color: 0xe0e0e0, message: '骷髅战将骨骼嘎嘎作响，杀意渐浓！' },
    { phase: 2, name: '骷髅战将·冥将', healthThreshold: 0.5, attackMultiplier: 1.4, defenseMultiplier: 1.3, specialSkills: [{ id: 'death_gaze', name: '死亡凝视', description: '冥将死亡凝视降低敌人攻击', damage: 25, debuffEffect: { type: 'attackDown', value: 10, duration: 2 }, chance: 0.35, icon: '👁', color: 0x7e57c2, cooldown: 2 }, { id: 'bone_storm', name: '万骨风暴', description: '召唤万千骨刺造成大量伤害', damage: 50, chance: 0.4, icon: '☠', color: 0x546e7a, cooldown: 3 }], color: 0x546e7a, message: '骷髅战将冥力觉醒，化为幽冥冥将！' },
    { phase: 3, name: '骷髅战将·亡灵君主', healthThreshold: 0.2, attackMultiplier: 1.8, defenseMultiplier: 1.5, specialSkills: [{ id: 'soul_reap', name: '灵魂收割', description: '收割一切灵魂', damage: 65, debuffEffect: { type: 'defenseDown', value: 12, duration: 2 }, chance: 0.45, icon: '⚔', color: 0x311b92, cooldown: 2 }, { id: 'undying_will', name: '不死意志', description: '亡灵意志提升攻防', buffEffect: { type: 'attack', value: 20, duration: 3 }, chance: 0.35, icon: '👑', color: 0x1a237e, cooldown: 3 }], color: 0x1a237e, message: '骷髅战将登基为亡灵君主，死气冲天！' }
  ],
  lava_boss: [
    { phase: 1, name: '熔岩巨兽', healthThreshold: 1.0, attackMultiplier: 1.0, defenseMultiplier: 1.0, specialSkills: [{ id: 'lava_spit', name: '熔岩喷吐', description: '喷射滚烫熔岩', damage: 40, debuffEffect: { type: 'burn', value: 10, duration: 2 }, chance: 0.35, icon: '🌋', color: 0xb71c1c, cooldown: 2 }, { id: 'rock_armor', name: '岩石铠甲', description: '覆盖岩石铠甲', buffEffect: { type: 'defense', value: 18, duration: 2 }, chance: 0.3, icon: '🪨', color: 0x795548, cooldown: 3 }], color: 0xb71c1c, message: '熔岩巨兽发出震耳怒吼，大地颤抖！' },
    { phase: 2, name: '熔岩巨兽·炎魔', healthThreshold: 0.4, attackMultiplier: 1.6, defenseMultiplier: 1.2, specialSkills: [{ id: 'eruption', name: '火山爆发', description: '引爆体内熔岩造成毁灭伤害', damage: 60, chance: 0.4, icon: '💥', color: 0xff5722, cooldown: 2 }, { id: 'magma_field', name: '熔岩领域', description: '熔岩覆盖战场持续灼烧', damage: 30, debuffEffect: { type: 'burn', value: 15, duration: 3 }, chance: 0.35, icon: '🔥', color: 0xff7043, cooldown: 3 }], color: 0xff5722, message: '熔岩巨兽彻底熔化，化身炎魔！' }
  ],
  dragon_boss: [
    { phase: 1, name: '魔龙', healthThreshold: 1.0, attackMultiplier: 1.0, defenseMultiplier: 1.0, specialSkills: [{ id: 'dragon_breath_boss', name: '魔龙吐息', description: '喷吐暗焰龙息', damage: 50, debuffEffect: { type: 'burn', value: 12, duration: 2 }, chance: 0.35, icon: '🐉', color: 0x4a148c, cooldown: 2 }, { id: 'dragon_scale', name: '龙鳞护甲', description: '龙鳞形成护甲', buffEffect: { type: 'defense', value: 20, duration: 2 }, chance: 0.3, icon: '🛡', color: 0x6a1b9a, cooldown: 3 }], color: 0x4a148c, message: '魔龙展翅，天地变色！' },
    { phase: 2, name: '魔龙·暗渊', healthThreshold: 0.5, attackMultiplier: 1.5, defenseMultiplier: 1.3, specialSkills: [{ id: 'dark_breath', name: '暗渊龙息', description: '暗渊之力龙息', damage: 70, debuffEffect: { type: 'defenseDown', value: 15, duration: 2 }, chance: 0.4, icon: '🌑', color: 0x311b92, cooldown: 2 }, { id: 'dark_fury', name: '暗怒', description: '暗怒提升攻击', buffEffect: { type: 'attack', value: 25, duration: 3 }, chance: 0.3, icon: '💢', color: 0x1a0033, cooldown: 3 }], color: 0x311b92, message: '魔龙汲取暗渊之力，化为暗渊魔龙！' },
    { phase: 3, name: '魔龙·天魔', healthThreshold: 0.2, attackMultiplier: 2.0, defenseMultiplier: 1.5, specialSkills: [{ id: 'apocalypse', name: '天魔降世', description: '天魔之力降世毁灭一切', damage: 90, debuffEffect: { type: 'defenseDown', value: 18, duration: 2 }, chance: 0.45, icon: '☠', color: 0x1a0033, cooldown: 2 }, { id: 'dark_heal', name: '暗渊再生', description: '暗渊之力修复伤势', heal: 80, chance: 0.25, icon: '💜', color: 0x6a1b9a, cooldown: 4 }, { id: 'doom_strike', name: '末日之击', description: '汇聚全部暗力的致命一击', damage: 100, chance: 0.3, icon: '⚡', color: 0x880e4f, cooldown: 3 }], color: 0x1a0033, message: '魔龙吞噬天魔之力，末日降临！' }
  ]
}

const createEliteEnemy = (id: string, name: string, health: number, attack: number, defense: number, exp: number, gold: number, color: number, size: number, element: ElementType | undefined, skills: EnemySpecialSkill[], drops: EnemyDrop[]): Enemy => ({
  id, name, health, maxHealth: health, attack, defense, exp, gold, color, size, element, type: 'elite', specialSkills: skills, drops, currentPhase: 0
})

const createBossEnemy = (id: string, name: string, health: number, attack: number, defense: number, exp: number, gold: number, color: number, size: number, element: ElementType | undefined, phases: BossPhase[], drops: EnemyDrop[]): Enemy => ({
  id, name, health, maxHealth: health, attack, defense, exp, gold, color, size, element, type: 'boss', phases, drops, currentPhase: 0, specialSkills: phases[0]?.specialSkills || []
})

export const STAGES: Stage[] = [
  {
    id: 1,
    name: '青冥幽谷',
    description: '初入仙门之地，常有低阶妖兽出没',
    background: 0x1a237e,
    requiredLevel: 1,
    enemies: [
      createEliteEnemy('wolf', '幽狼精', 150, 18, 8, 30, 50, 0x9ccc65, 40, 'earth', ELITE_SKILLS.wolf_elite, ELITE_DROPS.default),
      createBossEnemy('snake', '青蛇', 200, 22, 6, 40, 80, 0x66bb6a, 44, 'wood', BOSS_PHASES.snake_boss, BOSS_DROPS.stage1)
    ],
    rewards: { gold: 50, exp: 40, spirit: 5 }
  },
  {
    id: 2,
    name: '血煞魔洞',
    description: '魔气缭绕之地，魔物横行',
    background: 0x4a148c,
    requiredLevel: 2,
    enemies: [
      createEliteEnemy('demon', '血魔精英', 300, 35, 14, 60, 100, 0xef5350, 48, 'fire', ELITE_SKILLS.demon_elite, ELITE_DROPS.default),
      createBossEnemy('bat', '暗影蝠', 350, 40, 10, 80, 150, 0xab47bc, 48, 'water', BOSS_PHASES.bat_boss, BOSS_DROPS.stage2)
    ],
    rewards: { gold: 100, exp: 80, spirit: 10 }
  },
  {
    id: 3,
    name: '九幽深渊',
    description: '传说中的阴邪之地，危险重重',
    background: 0x0d47a1,
    requiredLevel: 4,
    enemies: [
      createEliteEnemy('ghost', '怨灵王', 500, 55, 22, 100, 180, 0x7e57c2, 52, 'water', ELITE_SKILLS.ghost_elite, ELITE_DROPS.high),
      createBossEnemy('skeleton', '骷髅战将', 800, 60, 28, 150, 280, 0xe0e0e0, 58, 'earth', BOSS_PHASES.skeleton_boss, BOSS_DROPS.stage3)
    ],
    rewards: { gold: 200, exp: 150, spirit: 20 }
  },
  {
    id: 4,
    name: '焚天熔岩',
    description: '上古火神陨落之地，酷热难当',
    background: 0xbf360c,
    requiredLevel: 7,
    enemies: [
      createEliteEnemy('fire_demon', '炎魔将军', 900, 80, 35, 180, 320, 0xff7043, 60, 'fire', ELITE_SKILLS.fire_elite, ELITE_DROPS.high),
      createBossEnemy('lava_beast', '熔岩巨兽', 1200, 75, 45, 250, 450, 0xb71c1c, 66, 'earth', BOSS_PHASES.lava_boss, BOSS_DROPS.stage4)
    ],
    rewards: { gold: 350, exp: 280, spirit: 35 }
  },
  {
    id: 5,
    name: '天外魔境',
    description: '终极试炼之地，传说有天魔镇守',
    background: 0x1a0033,
    requiredLevel: 10,
    enemies: [
      createEliteEnemy('demon_lord', '天魔将领', 1800, 110, 60, 400, 700, 0x880e4f, 72, 'metal', ELITE_SKILLS.demon_lord_elite, ELITE_DROPS.high),
      createBossEnemy('dark_dragon', '魔龙', 2500, 130, 70, 600, 1200, 0x4a148c, 80, 'fire', BOSS_PHASES.dragon_boss, BOSS_DROPS.stage5)
    ],
    rewards: { gold: 800, exp: 600, spirit: 80 }
  }
]

export const OPENING_DIALOGUES = [
  { speaker: '旁白', text: '天地初开，混沌初分，三界之内，仙魔纷争不休...', color: 0xb0bec5 },
  { speaker: '旁白', text: '传闻上古之时，有一剑仙，御剑九天，斩妖除魔，威震寰宇。', color: 0xb0bec5 },
  { speaker: '剑仙', text: '贫道御剑青冥间，斩尽妖邪济苍生。', color: 0x4fc3f7 },
  { speaker: '旁白', text: '然而千年已过，魔气复苏，封印松动，天下又将大乱...', color: 0xb0bec5 },
  { speaker: '师尊', text: '徒儿，你我修仙一脉，代代守护苍生。如今魔气再起，是你下山历练的时候了。', color: 0x81c784 },
  { speaker: '剑仙', text: '弟子谨遵师命！此去定要斩尽妖魔，还天下一个太平！', color: 0x4fc3f7 },
  { speaker: '旁白', text: '于是，你踏上了御剑修仙的漫漫征途...', color: 0xffeb3b }
]
