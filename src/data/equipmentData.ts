import type { ForgeMaterial, EquipmentTemplate, EquipmentStat, EquipmentQuality } from '../types'

export const QUALITY_COLORS: Record<EquipmentQuality, number> = {
  common: 0x9e9e9e,
  uncommon: 0x66bb6a,
  rare: 0x42a5f5,
  epic: 0xba68c8,
  legendary: 0xffd54f,
  mythic: 0xff5722
}

export const QUALITY_NAMES: Record<EquipmentQuality, string> = {
  common: '凡品',
  uncommon: '灵品',
  rare: '宝品',
  epic: '仙品',
  legendary: '神品',
  mythic: '圣品'
}

export const QUALITY_ORDER: EquipmentQuality[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']

export const QUALITY_STAT_MULTIPLIER: Record<EquipmentQuality, number> = {
  common: 1,
  uncommon: 1.3,
  rare: 1.6,
  epic: 2,
  legendary: 2.5,
  mythic: 3.2
}

export const QUALITY_EXTRA_STAT_COUNT: Record<EquipmentQuality, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5
}

export const FORGE_MATERIALS: ForgeMaterial[] = [
  { id: 'iron_ore', name: '精铁矿', description: '常见的锻造材料，用于打造基础装备', rarity: 'common', color: 0x9e9e9e, icon: '🪨' },
  { id: 'spirit_iron', name: '灵铁', description: '蕴含灵气的铁矿石', rarity: 'uncommon', color: 0x66bb6a, icon: '⚙️' },
  { id: 'mystic_crystal', name: '玄晶', description: '蕴含神秘力量的水晶', rarity: 'rare', color: 0x42a5f5, icon: '💎' },
  { id: 'dragon_bone', name: '龙骨', description: '远古巨龙遗骨，极其珍贵', rarity: 'epic', color: 0xba68c8, icon: '🦴' },
  { id: 'sun_metal', name: '太阳金精', description: '传说中吸收太阳精华的金属', rarity: 'legendary', color: 0xffd54f, icon: '☀️' },
  { id: 'chaos_essence', name: '混沌本源', description: '开天辟地时留下的混沌精华', rarity: 'mythic', color: 0xff5722, icon: '🔥' },
  { id: 'leather', name: '兽皮', description: '妖兽的皮，坚韧耐磨', rarity: 'common', color: 0x8d6e63, icon: '🧵' },
  { id: 'spirit_cloth', name: '灵丝', description: '由灵蚕吐出的丝线', rarity: 'uncommon', color: 0x81c784, icon: '🧶' },
  { id: 'silk', name: '天蚕丝', description: '天蚕丝织成的布料', rarity: 'rare', color: 0x4dd0e1, icon: '🎀' },
  { id: 'phoenix_feather', name: '凤凰羽', description: '凤凰脱落的羽毛', rarity: 'epic', color: 0xef5350, icon: '🪶' },
  { id: 'spirit_ore', name: '灵矿', description: '蕴含灵气的矿石，用于境界突破', rarity: 'common', color: 0x4dd0e1, icon: '💎' },
  { id: 'basic_herb', name: '灵草', description: '天地孕育的灵药，辅助修炼', rarity: 'common', color: 0x66bb6a, icon: '🌿' },
  { id: 'spirit_crystal', name: '灵晶', description: '高纯度灵气结晶，突破必备', rarity: 'rare', color: 0xba68c8, icon: '✦' },
  { id: 'moon_grass', name: '月华草', description: '吸收月华而生的仙草', rarity: 'rare', color: 0xce93d8, icon: '🌙' },
  { id: 'demon_bone', name: '魔骨', description: '强大魔族遗骨，蕴含魔气', rarity: 'epic', color: 0xef5350, icon: '🦴' },
  { id: 'soul_lotus', name: '幽冥莲', description: '生长在幽冥之地的奇莲', rarity: 'epic', color: 0x7e57c2, icon: '🪷' },
  { id: 'ghost_iron', name: '冥铁', description: '冥界特产的玄铁，阴气极重', rarity: 'epic', color: 0x546e7a, icon: '⛓' },
  { id: 'fire_heart_grass', name: '火心草', description: '生长于火山深处的灵草', rarity: 'epic', color: 0xff7043, icon: '🔥' },
  { id: 'lava_core', name: '熔岩核心', description: '熔岩深处的结晶，蕴含狂暴力量', rarity: 'epic', color: 0xbf360c, icon: '💠' },
  { id: 'immortal_herb', name: '九转灵芝', description: '传说中的仙草，可活死人肉白骨', rarity: 'legendary', color: 0xffd54f, icon: '🌟' },
  { id: 'demon_heart', name: '天魔之心', description: '天魔陨落遗留的心脏，力量无穷', rarity: 'legendary', color: 0x4a148c, icon: '💜' }
]

export const MATERIAL_DROP_TABLE: Record<number, { materialId: string; chance: number; minAmount: number; maxAmount: number }[]> = {
  1: [
    { materialId: 'iron_ore', chance: 0.5, minAmount: 1, maxAmount: 3 },
    { materialId: 'leather', chance: 0.4, minAmount: 1, maxAmount: 2 }
  ],
  2: [
    { materialId: 'iron_ore', chance: 0.5, minAmount: 2, maxAmount: 4 },
    { materialId: 'spirit_iron', chance: 0.25, minAmount: 1, maxAmount: 2 },
    { materialId: 'leather', chance: 0.4, minAmount: 1, maxAmount: 3 }
  ],
  3: [
    { materialId: 'spirit_iron', chance: 0.4, minAmount: 2, maxAmount: 4 },
    { materialId: 'spirit_cloth', chance: 0.3, minAmount: 1, maxAmount: 2 },
    { materialId: 'mystic_crystal', chance: 0.1, minAmount: 1, maxAmount: 1 }
  ],
  4: [
    { materialId: 'mystic_crystal', chance: 0.3, minAmount: 1, maxAmount: 3 },
    { materialId: 'silk', chance: 0.25, minAmount: 1, maxAmount: 2 },
    { materialId: 'dragon_bone', chance: 0.1, minAmount: 1, maxAmount: 1 }
  ],
  5: [
    { materialId: 'dragon_bone', chance: 0.25, minAmount: 1, maxAmount: 2 },
    { materialId: 'phoenix_feather', chance: 0.15, minAmount: 1, maxAmount: 1 },
    { materialId: 'sun_metal', chance: 0.08, minAmount: 1, maxAmount: 1 },
    { materialId: 'chaos_essence', chance: 0.03, minAmount: 1, maxAmount: 1 }
  ]
}

export const STAT_POOL: Omit<EquipmentStat, 'value'>[] = [
  { type: 'attack', isPercentage: false },
  { type: 'defense', isPercentage: false },
  { type: 'maxHealth', isPercentage: false },
  { type: 'maxMana', isPercentage: false },
  { type: 'critRate', isPercentage: true },
  { type: 'critDamage', isPercentage: true },
  { type: 'attack', isPercentage: true },
  { type: 'defense', isPercentage: true }
]

export const EQUIPMENT_TEMPLATES: EquipmentTemplate[] = [
  {
    id: 'iron_sword',
    name: '铁剑',
    description: '用精铁打造的基础剑器',
    slot: 'weapon',
    baseQuality: 'common',
    baseStats: [
      { type: 'attack', value: 15, isPercentage: false }
    ],
    icon: '⚔️',
    color: 0x9e9e9e,
    craftMaterials: [
      { materialId: 'iron_ore', amount: 5 }
    ],
    goldCost: 100,
    spiritCost: 10,
    minStage: 1
  },
  {
    id: 'spirit_sword',
    name: '灵剑',
    description: '蕴含灵气的宝剑，削铁如泥',
    slot: 'weapon',
    baseQuality: 'uncommon',
    baseStats: [
      { type: 'attack', value: 30, isPercentage: false },
      { type: 'critRate', value: 0.05, isPercentage: true }
    ],
    icon: '🗡️',
    color: 0x66bb6a,
    craftMaterials: [
      { materialId: 'spirit_iron', amount: 5 },
      { materialId: 'iron_ore', amount: 3 }
    ],
    goldCost: 300,
    spiritCost: 30,
    minStage: 2
  },
  {
    id: 'mystic_sword',
    name: '玄剑',
    description: '蕴含神秘力量的宝剑',
    slot: 'weapon',
    baseQuality: 'rare',
    baseStats: [
      { type: 'attack', value: 50, isPercentage: false },
      { type: 'critDamage', value: 0.1, isPercentage: true }
    ],
    icon: '⚔️',
    color: 0x42a5f5,
    craftMaterials: [
      { materialId: 'mystic_crystal', amount: 5 },
      { materialId: 'spirit_iron', amount: 3 }
    ],
    goldCost: 800,
    spiritCost: 80,
    minStage: 3
  },
  {
    id: 'dragon_sword',
    name: '龙牙剑',
    description: '以龙骨锻造，蕴含龙威',
    slot: 'weapon',
    baseQuality: 'epic',
    baseStats: [
      { type: 'attack', value: 80, isPercentage: false },
      { type: 'critRate', value: 0.1, isPercentage: true },
      { type: 'critDamage', value: 0.15, isPercentage: true }
    ],
    icon: '🐉',
    color: 0xba68c8,
    craftMaterials: [
      { materialId: 'dragon_bone', amount: 5 },
      { materialId: 'mystic_crystal', amount: 3 }
    ],
    goldCost: 2000,
    spiritCost: 200,
    minStage: 4
  },
  {
    id: 'sun_sword',
    name: '烈日剑',
    description: '吸收太阳精华所铸，光芒万丈',
    slot: 'weapon',
    baseQuality: 'legendary',
    baseStats: [
      { type: 'attack', value: 120, isPercentage: false },
      { type: 'critRate', value: 0.15, isPercentage: true },
      { type: 'critDamage', value: 0.25, isPercentage: true }
    ],
    icon: '☀️',
    color: 0xffd54f,
    craftMaterials: [
      { materialId: 'sun_metal', amount: 5 },
      { materialId: 'dragon_bone', amount: 3 }
    ],
    goldCost: 5000,
    spiritCost: 500,
    minStage: 5
  },
  {
    id: 'leather_armor',
    name: '皮甲',
    description: '兽皮缝制的基础护甲',
    slot: 'armor',
    baseQuality: 'common',
    baseStats: [
      { type: 'defense', value: 10, isPercentage: false },
      { type: 'maxHealth', value: 30, isPercentage: false }
    ],
    icon: '🥋',
    color: 0x8d6e63,
    craftMaterials: [
      { materialId: 'leather', amount: 5 }
    ],
    goldCost: 100,
    spiritCost: 10,
    minStage: 1
  },
  {
    id: 'spirit_armor',
    name: '灵甲',
    description: '灵丝编织，轻如鸿毛',
    slot: 'armor',
    baseQuality: 'uncommon',
    baseStats: [
      { type: 'defense', value: 20, isPercentage: false },
      { type: 'maxHealth', value: 60, isPercentage: false }
    ],
    icon: '🛡️',
    color: 0x81c784,
    craftMaterials: [
      { materialId: 'spirit_cloth', amount: 5 },
      { materialId: 'leather', amount: 3 }
    ],
    goldCost: 300,
    spiritCost: 30,
    minStage: 2
  },
  {
    id: 'silk_robe',
    name: '天蚕宝甲',
    description: '天蚕丝织成的宝衣',
    slot: 'armor',
    baseQuality: 'rare',
    baseStats: [
      { type: 'defense', value: 35, isPercentage: false },
      { type: 'maxHealth', value: 100, isPercentage: false }
    ],
    icon: '👘',
    color: 0x4dd0e1,
    craftMaterials: [
      { materialId: 'silk', amount: 5 },
      { materialId: 'spirit_cloth', amount: 3 }
    ],
    goldCost: 800,
    spiritCost: 80,
    minStage: 3
  },
  {
    id: 'phoenix_robe',
    name: '凤凰羽衣',
    description: '凤凰羽毛编织，浴火重生',
    slot: 'armor',
    baseQuality: 'epic',
    baseStats: [
      { type: 'defense', value: 55, isPercentage: false },
      { type: 'maxHealth', value: 180, isPercentage: false },
      { type: 'maxMana', value: 50, isPercentage: false }
    ],
    icon: '🔥',
    color: 0xef5350,
    craftMaterials: [
      { materialId: 'phoenix_feather', amount: 5 },
      { materialId: 'silk', amount: 3 }
    ],
    goldCost: 2000,
    spiritCost: 200,
    minStage: 4
  },
  {
    id: 'iron_helmet',
    name: '铁盔',
    description: '保护头部的基础头盔',
    slot: 'helmet',
    baseQuality: 'common',
    baseStats: [
      { type: 'defense', value: 5, isPercentage: false },
      { type: 'maxHealth', value: 20, isPercentage: false }
    ],
    icon: '⛑️',
    color: 0x78909c,
    craftMaterials: [
      { materialId: 'iron_ore', amount: 3 }
    ],
    goldCost: 80,
    spiritCost: 8,
    minStage: 1
  },
  {
    id: 'spirit_helmet',
    name: '灵盔',
    description: '灵气护佑头盔',
    slot: 'helmet',
    baseQuality: 'uncommon',
    baseStats: [
      { type: 'defense', value: 12, isPercentage: false },
      { type: 'maxHealth', value: 40, isPercentage: false },
      { type: 'maxMana', value: 15, isPercentage: false }
    ],
    icon: '🪖',
    color: 0x66bb6a,
    craftMaterials: [
      { materialId: 'spirit_iron', amount: 3 },
      { materialId: 'iron_ore', amount: 2 }
    ],
    goldCost: 250,
    spiritCost: 25,
    minStage: 2
  },
  {
    id: 'iron_boots',
    name: '铁靴',
    description: '精铁打造的靴子',
    slot: 'boots',
    baseQuality: 'common',
    baseStats: [
      { type: 'defense', value: 5, isPercentage: false },
      { type: 'maxHealth', value: 15, isPercentage: false }
    ],
    icon: '🥾',
    color: 0x78909c,
    craftMaterials: [
      { materialId: 'iron_ore', amount: 3 }
    ],
    goldCost: 80,
    spiritCost: 8,
    minStage: 1
  },
  {
    id: 'spirit_boots',
    name: '灵风靴',
    description: '身轻如燕，步法如神',
    slot: 'boots',
    baseQuality: 'uncommon',
    baseStats: [
      { type: 'defense', value: 10, isPercentage: false },
      { type: 'critRate', value: 0.03, isPercentage: true }
    ],
    icon: '👟',
    color: 0x81c784,
    craftMaterials: [
      { materialId: 'spirit_cloth', amount: 4 },
      { materialId: 'leather', amount: 2 }
    ],
    goldCost: 250,
    spiritCost: 25,
    minStage: 2
  },
  {
    id: 'iron_ring',
    name: '铁戒指',
    description: '普通的铁质戒指',
    slot: 'ring',
    baseQuality: 'common',
    baseStats: [
      { type: 'attack', value: 5, isPercentage: false },
      { type: 'maxMana', value: 10, isPercentage: false }
    ],
    icon: '💍',
    color: 0x9e9e9e,
    craftMaterials: [
      { materialId: 'iron_ore', amount: 2 }
    ],
    goldCost: 80,
    spiritCost: 8,
    minStage: 1
  },
  {
    id: 'spirit_ring',
    name: '灵戒',
    description: '蕴含灵力的戒指',
    slot: 'ring',
    baseQuality: 'uncommon',
    baseStats: [
      { type: 'attack', value: 10, isPercentage: false },
      { type: 'maxMana', value: 25, isPercentage: false },
      { type: 'critDamage', value: 0.05, isPercentage: true }
    ],
    icon: '💎',
    color: 0x66bb6a,
    craftMaterials: [
      { materialId: 'mystic_crystal', amount: 3 },
      { materialId: 'spirit_iron', amount: 2 }
    ],
    goldCost: 250,
    spiritCost: 25,
    minStage: 2
  },
  {
    id: 'iron_necklace',
    name: '铁项链',
    description: '普通的铁质项链',
    slot: 'necklace',
    baseQuality: 'common',
    baseStats: [
      { type: 'maxHealth', value: 20, isPercentage: false },
      { type: 'maxMana', value: 10, isPercentage: false }
    ],
    icon: '📿',
    color: 0x9e9e9e,
    craftMaterials: [
      { materialId: 'iron_ore', amount: 2 }
    ],
    goldCost: 80,
    spiritCost: 8,
    minStage: 1
  },
  {
    id: 'spirit_necklace',
    name: '灵珠项链',
    description: '镶嵌灵珠的项链',
    slot: 'necklace',
    baseQuality: 'uncommon',
    baseStats: [
      { type: 'maxHealth', value: 40, isPercentage: false },
      { type: 'maxMana', value: 25, isPercentage: false },
      { type: 'defense', value: 8, isPercentage: false }
    ],
    icon: '🔮',
    color: 0x66bb6a,
    craftMaterials: [
      { materialId: 'mystic_crystal', amount: 3 },
      { materialId: 'spirit_cloth', amount: 2 }
    ],
    goldCost: 250,
    spiritCost: 25,
    minStage: 2
  }
]

export function getMaterialById(id: string): ForgeMaterial | undefined {
  return FORGE_MATERIALS.find(m => m.id === id)
}

export function getEquipmentTemplateById(id: string): EquipmentTemplate | undefined {
  return EQUIPMENT_TEMPLATES.find(t => t.id === id)
}

export function getQualityIndex(quality: EquipmentQuality): number {
  return QUALITY_ORDER.indexOf(quality)
}

export function getNextQuality(quality: EquipmentQuality): EquipmentQuality | null {
  const idx = getQualityIndex(quality)
  if (idx === -1 || idx >= QUALITY_ORDER.length - 1) return null
  return QUALITY_ORDER[idx + 1]
}

export function getAdvanceCost(quality: EquipmentQuality): { materialId: string; amount: number; gold: number; spirit: number } {
  const costs: Record<EquipmentQuality, { materialId: string; amount: number; gold: number; spirit: number }> = {
    common: { materialId: 'spirit_iron', amount: 3, gold: 200, spirit: 20 },
    uncommon: { materialId: 'mystic_crystal', amount: 3, gold: 500, spirit: 50 },
    rare: { materialId: 'dragon_bone', amount: 3, gold: 1500, spirit: 150 },
    epic: { materialId: 'sun_metal', amount: 3, gold: 4000, spirit: 400 },
    legendary: { materialId: 'chaos_essence', amount: 3, gold: 10000, spirit: 1000 },
    mythic: { materialId: 'chaos_essence', amount: 10, gold: 50000, spirit: 5000 }
  }
  return costs[quality]
}
