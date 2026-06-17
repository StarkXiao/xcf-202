import type { SpiritBeastTemplate, SpiritBeastSkill, SpiritBeastRarity, ElementType } from '../types'

const createSkill = (
  id: string,
  name: string,
  description: string,
  type: SpiritBeastSkill['type'],
  cooldown: number,
  unlockStage: number,
  color: number,
  icon: string,
  effects: Partial<SpiritBeastSkill> = {},
  element?: ElementType
): SpiritBeastSkill => ({
  id,
  name,
  description,
  type,
  cooldown,
  currentCooldown: 0,
  unlockStage,
  color,
  icon,
  element,
  ...effects
})

export const SPIRIT_BEAST_SKILLS: Record<string, SpiritBeastSkill> = {
  fire_breath: createSkill(
    'fire_breath',
    '烈焰吐息',
    '喷射烈焰，对敌人造成火焰伤害',
    'attack',
    3,
    1,
    0xff5722,
    '🔥',
    { damage: 40 },
    'fire'
  ),
  thunder_strike: createSkill(
    'thunder_strike',
    '雷霆一击',
    '召唤雷电攻击敌人',
    'attack',
    4,
    1,
    0xffeb3b,
    '⚡',
    { damage: 55 },
    'metal'
  ),
  ice_shard: createSkill(
    'ice_shard',
    '冰晶利刃',
    '发射锋利的冰晶',
    'attack',
    2,
    1,
    0x00bcd4,
    '❄',
    { damage: 30 },
    'water'
  ),
  heal_aura: createSkill(
    'heal_aura',
    '治愈光环',
    '释放治愈能量，恢复主人生命值',
    'heal',
    5,
    2,
    0x81c784,
    '💚',
    { heal: 60 },
    'wood'
  ),
  battle_cry: createSkill(
    'battle_cry',
    '战吼',
    '发出战吼，提升主人攻击力',
    'buff',
    6,
    2,
    0xff9800,
    '📯',
    { buffEffect: { type: 'attack', value: 20, duration: 3 } }
  ),
  iron_wall: createSkill(
    'iron_wall',
    '铁壁',
    '召唤护盾，提升主人防御力',
    'buff',
    5,
    2,
    0x78909c,
    '🛡',
    { buffEffect: { type: 'defense', value: 15, duration: 4 } },
    'earth'
  ),
  poison_fang: createSkill(
    'poison_fang',
    '毒牙',
    '毒牙撕咬，降低敌人防御',
    'debuff',
    4,
    3,
    0x9ccc65,
    '🦷',
    { damage: 25, debuffEffect: { type: 'defenseDown', value: 20, duration: 3 } },
    'wood'
  ),
  shadow_strike: createSkill(
    'shadow_strike',
    '暗影突袭',
    '从暗影中发起突袭',
    'attack',
    3,
    3,
    0x7e57c2,
    '🌑',
    { damage: 70 },
    'water'
  ),
  divine_heal: createSkill(
    'divine_heal',
    '圣光治愈',
    '神圣之光治愈所有创伤',
    'heal',
    8,
    4,
    0xffd54f,
    '✨',
    { heal: 120 },
    'wood'
  ),
  dragon_rage: createSkill(
    'dragon_rage',
    '龙怒',
    '释放龙族之怒，造成毁灭性伤害',
    'attack',
    6,
    4,
    0xf44336,
    '🐉',
    { damage: 100 },
    'metal'
  ),
  phoniex_flame: createSkill(
    'phoniex_flame',
    '凤凰涅槃',
    '凤凰之火，重生与毁灭并存',
    'attack',
    5,
    5,
    0xff7043,
    '🔮',
    { damage: 120, heal: 50 },
    'fire'
  ),
  qilin_blessing: createSkill(
    'qilin_blessing',
    '麒麟赐福',
    '麒麟祥瑞，大幅提升主人战力',
    'buff',
    10,
    5,
    0xffd54f,
    '🌟',
    { buffEffect: { type: 'attack', value: 40, duration: 5 } },
    'earth'
  )
}

export const SPIRIT_BEAST_TEMPLATES: SpiritBeastTemplate[] = [
  {
    id: 'fire_fox',
    name: '火灵狐',
    description: '天生具有火属性灵力的灵狐，尾尖燃烧着不灭之火',
    rarity: 'common',
    baseHealth: 80,
    baseAttack: 15,
    baseDefense: 8,
    growthHealth: 12,
    growthAttack: 3,
    growthDefense: 2,
    baseExpToNext: 50,
    maxLevel: 50,
    maxStage: 5,
    skills: [
      { ...SPIRIT_BEAST_SKILLS.fire_breath },
      { ...SPIRIT_BEAST_SKILLS.battle_cry }
    ],
    captureRate: 0.6,
    feedItems: [
      { itemId: 'fire_fruit', expGain: 20 },
      { itemId: 'spirit_grain', expGain: 10 }
    ],
    evolveRequirements: [
      { stage: 2, gold: 200, spirit: 30 },
      { stage: 3, gold: 500, spirit: 80, items: [{ itemId: 'fire_crystal', amount: 3 }] },
      { stage: 4, gold: 1200, spirit: 200, items: [{ itemId: 'fire_crystal', amount: 8 }] },
      { stage: 5, gold: 3000, spirit: 500, items: [{ itemId: 'divine_fire', amount: 1 }] }
    ],
    color: 0xff7043,
    icon: '🦊',
    battleSprite: {
      bodyColor: 0xff7043,
      eyeColor: 0xffffff,
      size: 40
    }
  },
  {
    id: 'thunder_eagle',
    name: '雷鹰',
    description: '翱翔于雷云之间的神鹰，羽翼带电',
    rarity: 'rare',
    baseHealth: 100,
    baseAttack: 22,
    baseDefense: 10,
    growthHealth: 15,
    growthAttack: 5,
    growthDefense: 2,
    baseExpToNext: 80,
    maxLevel: 60,
    maxStage: 5,
    skills: [
      { ...SPIRIT_BEAST_SKILLS.thunder_strike },
      { ...SPIRIT_BEAST_SKILLS.iron_wall }
    ],
    captureRate: 0.35,
    feedItems: [
      { itemId: 'thunder_herb', expGain: 30 },
      { itemId: 'spirit_grain', expGain: 10 }
    ],
    evolveRequirements: [
      { stage: 2, gold: 300, spirit: 50 },
      { stage: 3, gold: 800, spirit: 120, items: [{ itemId: 'thunder_stone', amount: 3 }] },
      { stage: 4, gold: 2000, spirit: 300, items: [{ itemId: 'thunder_stone', amount: 8 }] },
      { stage: 5, gold: 5000, spirit: 700, items: [{ itemId: 'divine_thunder', amount: 1 }] }
    ],
    color: 0xffeb3b,
    icon: '🦅',
    battleSprite: {
      bodyColor: 0xffeb3b,
      eyeColor: 0x212121,
      size: 48
    }
  },
  {
    id: 'ice_turtle',
    name: '玄冰龟',
    description: '背负寒冰的千年灵龟，防御力惊人',
    rarity: 'rare',
    baseHealth: 150,
    baseAttack: 10,
    baseDefense: 25,
    growthHealth: 20,
    growthAttack: 2,
    growthDefense: 5,
    baseExpToNext: 80,
    maxLevel: 60,
    maxStage: 5,
    skills: [
      { ...SPIRIT_BEAST_SKILLS.ice_shard },
      { ...SPIRIT_BEAST_SKILLS.heal_aura }
    ],
    captureRate: 0.3,
    feedItems: [
      { itemId: 'ice_lotus', expGain: 30 },
      { itemId: 'spirit_grain', expGain: 10 }
    ],
    evolveRequirements: [
      { stage: 2, gold: 350, spirit: 60 },
      { stage: 3, gold: 900, spirit: 150, items: [{ itemId: 'ice_crystal', amount: 3 }] },
      { stage: 4, gold: 2200, spirit: 350, items: [{ itemId: 'ice_crystal', amount: 8 }] },
      { stage: 5, gold: 5500, spirit: 800, items: [{ itemId: 'divine_ice', amount: 1 }] }
    ],
    color: 0x4fc3f7,
    icon: '🐢',
    battleSprite: {
      bodyColor: 0x4fc3f7,
      eyeColor: 0xffffff,
      size: 52
    }
  },
  {
    id: 'shadow_wolf',
    name: '暗影狼',
    description: '隐匿于黑暗中的凶狼，攻击迅猛',
    rarity: 'epic',
    baseHealth: 120,
    baseAttack: 30,
    baseDefense: 12,
    growthHealth: 18,
    growthAttack: 7,
    growthDefense: 3,
    baseExpToNext: 120,
    maxLevel: 70,
    maxStage: 5,
    skills: [
      { ...SPIRIT_BEAST_SKILLS.shadow_strike },
      { ...SPIRIT_BEAST_SKILLS.poison_fang },
      { ...SPIRIT_BEAST_SKILLS.battle_cry }
    ],
    captureRate: 0.15,
    feedItems: [
      { itemId: 'shadow_meat', expGain: 40 },
      { itemId: 'spirit_grain', expGain: 10 }
    ],
    evolveRequirements: [
      { stage: 2, gold: 500, spirit: 100 },
      { stage: 3, gold: 1500, spirit: 250, items: [{ itemId: 'shadow_crystal', amount: 5 }] },
      { stage: 4, gold: 4000, spirit: 600, items: [{ itemId: 'shadow_crystal', amount: 12 }] },
      { stage: 5, gold: 10000, spirit: 1500, items: [{ itemId: 'divine_shadow', amount: 1 }] }
    ],
    color: 0x7e57c2,
    icon: '🐺',
    battleSprite: {
      bodyColor: 0x7e57c2,
      eyeColor: 0xff0000,
      size: 50
    }
  },
  {
    id: 'phoenix',
    name: '朱雀',
    description: '浴火重生的神鸟，传说中的四灵之一',
    rarity: 'legendary',
    baseHealth: 200,
    baseAttack: 45,
    baseDefense: 20,
    growthHealth: 25,
    growthAttack: 10,
    growthDefense: 5,
    baseExpToNext: 200,
    maxLevel: 80,
    maxStage: 5,
    skills: [
      { ...SPIRIT_BEAST_SKILLS.phoniex_flame },
      { ...SPIRIT_BEAST_SKILLS.divine_heal },
      { ...SPIRIT_BEAST_SKILLS.fire_breath }
    ],
    captureRate: 0.05,
    feedItems: [
      { itemId: 'phoenix_feather', expGain: 80 },
      { itemId: 'spirit_grain', expGain: 10 }
    ],
    evolveRequirements: [
      { stage: 2, gold: 1000, spirit: 200 },
      { stage: 3, gold: 3000, spirit: 500, items: [{ itemId: 'phoenix_tear', amount: 3 }] },
      { stage: 4, gold: 8000, spirit: 1200, items: [{ itemId: 'phoenix_tear', amount: 8 }] },
      { stage: 5, gold: 20000, spirit: 3000, items: [{ itemId: 'phoenix_heart', amount: 1 }] }
    ],
    color: 0xff5722,
    icon: '🔮',
    battleSprite: {
      bodyColor: 0xff5722,
      eyeColor: 0xffd54f,
      size: 60
    }
  },
  {
    id: 'dragon',
    name: '青龙',
    description: '掌控雷电的神兽，传说中的四灵之首',
    rarity: 'legendary',
    baseHealth: 250,
    baseAttack: 50,
    baseDefense: 25,
    growthHealth: 30,
    growthAttack: 12,
    growthDefense: 6,
    baseExpToNext: 250,
    maxLevel: 80,
    maxStage: 5,
    skills: [
      { ...SPIRIT_BEAST_SKILLS.dragon_rage },
      { ...SPIRIT_BEAST_SKILLS.thunder_strike },
      { ...SPIRIT_BEAST_SKILLS.iron_wall }
    ],
    captureRate: 0.03,
    feedItems: [
      { itemId: 'dragon_scale', expGain: 100 },
      { itemId: 'spirit_grain', expGain: 10 }
    ],
    evolveRequirements: [
      { stage: 2, gold: 1200, spirit: 250 },
      { stage: 3, gold: 3500, spirit: 600, items: [{ itemId: 'dragon_bone', amount: 3 }] },
      { stage: 4, gold: 9000, spirit: 1500, items: [{ itemId: 'dragon_bone', amount: 8 }] },
      { stage: 5, gold: 25000, spirit: 4000, items: [{ itemId: 'dragon_heart', amount: 1 }] }
    ],
    color: 0x4caf50,
    icon: '🐉',
    battleSprite: {
      bodyColor: 0x4caf50,
      eyeColor: 0xffd54f,
      size: 65
    }
  },
  {
    id: 'qilin',
    name: '麒麟',
    description: '祥瑞之兽，出现必有圣人出世',
    rarity: 'mythic',
    baseHealth: 300,
    baseAttack: 55,
    baseDefense: 30,
    growthHealth: 35,
    growthAttack: 14,
    growthDefense: 8,
    baseExpToNext: 300,
    maxLevel: 100,
    maxStage: 5,
    skills: [
      { ...SPIRIT_BEAST_SKILLS.qilin_blessing },
      { ...SPIRIT_BEAST_SKILLS.divine_heal },
      { ...SPIRIT_BEAST_SKILLS.dragon_rage }
    ],
    captureRate: 0.01,
    feedItems: [
      { itemId: 'qilin_horn', expGain: 150 },
      { itemId: 'spirit_grain', expGain: 10 }
    ],
    evolveRequirements: [
      { stage: 2, gold: 2000, spirit: 400 },
      { stage: 3, gold: 6000, spirit: 1000, items: [{ itemId: 'qilin_scale', amount: 5 }] },
      { stage: 4, gold: 15000, spirit: 2500, items: [{ itemId: 'qilin_scale', amount: 12 }] },
      { stage: 5, gold: 50000, spirit: 8000, items: [{ itemId: 'qilin_heart', amount: 1 }] }
    ],
    color: 0xffd700,
    icon: '🌟',
    battleSprite: {
      bodyColor: 0xffd700,
      eyeColor: 0xff0000,
      size: 70
    }
  }
]

export const SPIRIT_BEAST_ITEMS = {
  capture: [
    { id: 'basic_trap', name: '初级困兽笼', description: '基础捕捉道具', successRateBonus: 0.1, price: 50 },
    { id: 'advanced_trap', name: '高级困兽笼', description: '高级捕捉道具', successRateBonus: 0.25, price: 200 },
    { id: 'master_trap', name: '大师困兽笼', description: '顶级捕捉道具', successRateBonus: 0.5, price: 800 }
  ],
  feed: [
    { id: 'spirit_grain', name: '灵谷', description: '普通灵兽饲料', expGain: 10, price: 20 },
    { id: 'fire_fruit', name: '火灵果', description: '火属性灵兽喜爱', expGain: 20, price: 50 },
    { id: 'thunder_herb', name: '雷灵草', description: '雷属性灵兽喜爱', expGain: 30, price: 80 },
    { id: 'ice_lotus', name: '冰灵莲', description: '冰属性灵兽喜爱', expGain: 30, price: 80 },
    { id: 'shadow_meat', name: '暗影肉', description: '暗属性灵兽喜爱', expGain: 40, price: 120 }
  ],
  evolve: [
    { id: 'fire_crystal', name: '火晶石', description: '火属性升阶材料', price: 100 },
    { id: 'thunder_stone', name: '雷灵石', description: '雷属性升阶材料', price: 100 },
    { id: 'ice_crystal', name: '冰晶石', description: '冰属性升阶材料', price: 100 },
    { id: 'shadow_crystal', name: '暗影晶', description: '暗属性升阶材料', price: 150 },
    { id: 'divine_fire', name: '神火', description: '火属性神兽升阶材料', price: 2000 },
    { id: 'divine_thunder', name: '神雷', description: '雷属性神兽升阶材料', price: 2000 },
    { id: 'divine_ice', name: '神冰', description: '冰属性神兽升阶材料', price: 2000 },
    { id: 'divine_shadow', name: '神影', description: '暗属性神兽升阶材料', price: 3000 },
    { id: 'phoenix_feather', name: '凤羽', description: '朱雀专属饲料', price: 500 },
    { id: 'phoenix_tear', name: '凤泪', description: '朱雀升阶材料', price: 800 },
    { id: 'phoenix_heart', name: '凤心', description: '朱雀终极升阶材料', price: 10000 },
    { id: 'dragon_scale', name: '龙鳞', description: '青龙专属饲料', price: 600 },
    { id: 'dragon_bone', name: '龙骨', description: '青龙升阶材料', price: 1000 },
    { id: 'dragon_heart', name: '龙心', description: '青龙终极升阶材料', price: 12000 },
    { id: 'qilin_horn', name: '麒麟角', description: '麒麟专属饲料', price: 800 },
    { id: 'qilin_scale', name: '麒麟鳞', description: '麒麟升阶材料', price: 1500 },
    { id: 'qilin_heart', name: '麒麟心', description: '麒麟终极升阶材料', price: 20000 }
  ]
}

export const getBeastTemplate = (id: string): SpiritBeastTemplate | undefined => {
  return SPIRIT_BEAST_TEMPLATES.find(t => t.id === id)
}

export const getRarityColor = (rarity: SpiritBeastRarity): number => {
  const colors: Record<SpiritBeastRarity, number> = {
    common: 0x9e9e9e,
    rare: 0x4fc3f7,
    epic: 0xba68c8,
    legendary: 0xffd54f,
    mythic: 0xff7043
  }
  return colors[rarity]
}

export const getRarityName = (rarity: SpiritBeastRarity): string => {
  const names: Record<SpiritBeastRarity, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说',
    mythic: '神话'
  }
  return names[rarity]
}
