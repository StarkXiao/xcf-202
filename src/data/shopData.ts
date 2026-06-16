import type { ShopItemTemplate, ShopRarity } from '../types'

export const RARITY_WEIGHTS: Record<ShopRarity, number> = {
  common: 50,
  uncommon: 30,
  rare: 15,
  epic: 4,
  legendary: 1
}

export const RARITY_COLORS: Record<ShopRarity, number> = {
  common: 0x9e9e9e,
  uncommon: 0x4caf50,
  rare: 0x2196f3,
  epic: 0x9c27b0,
  legendary: 0xffc107
}

export const RARITY_NAMES: Record<ShopRarity, string> = {
  common: '凡品',
  uncommon: '良品',
  rare: '珍品',
  epic: '极品',
  legendary: '仙品'
}

export const SHOP_CONFIG = {
  maxItemsPerRefresh: 8,
  dailyFreeRefreshes: 3,
  paidRefreshGoldCost: 200,
  priceFluctuationRange: 0.3,
  rareItemBonusChance: 0.15,
  legendaryItemBonusChance: 0.05,
  refreshCooldownMs: 60000
}

export const SHOP_ITEMS: ShopItemTemplate[] = [
  {
    id: 'shop_pill_huiqi',
    name: '回气丹',
    description: '基础丹药，可快速恢复少量灵力。',
    type: 'pill',
    rarity: 'common',
    icon: '💊',
    color: 0x81c784,
    basePrice: 60,
    maxStock: 5,
    spawnWeight: 10,
    minStage: 1,
    effects: [{ type: 'manaRestore', value: 30 }]
  },
  {
    id: 'shop_pill_huiyuan',
    name: '回元丹',
    description: '补充生命力，恢复一定生命值。',
    type: 'pill',
    rarity: 'common',
    icon: '❤️',
    color: 0xef5350,
    basePrice: 100,
    maxStock: 5,
    spawnWeight: 10,
    minStage: 1,
    effects: [{ type: 'heal', value: 80 }]
  },
  {
    id: 'shop_pill_juling',
    name: '聚灵丹',
    description: '凝聚天地灵气，服用后获得经验值。',
    type: 'pill',
    rarity: 'common',
    icon: '💎',
    color: 0x4fc3f7,
    basePrice: 120,
    maxStock: 3,
    spawnWeight: 8,
    minStage: 1,
    effects: [{ type: 'exp', value: 50 }]
  },
  {
    id: 'shop_herb_qingming',
    name: '清冥草',
    description: '常见于幽谷之中的灵草，性温和，可炼制基础丹药。',
    type: 'herb',
    rarity: 'common',
    icon: '🌿',
    color: 0x81c784,
    basePrice: 20,
    maxStock: 10,
    spawnWeight: 12,
    minStage: 1
  },
  {
    id: 'shop_herb_xuepo',
    name: '血魄花',
    description: '生长于阴暗之地，花色如血，可炼制滋补丹药。',
    type: 'herb',
    rarity: 'common',
    icon: '🌺',
    color: 0xef5350,
    basePrice: 25,
    maxStock: 10,
    spawnWeight: 10,
    minStage: 1
  },
  {
    id: 'shop_pill_lizhan',
    name: '力战丹',
    description: '临时提升攻击力，持续一段时间。',
    type: 'pill',
    rarity: 'uncommon',
    icon: '⚔️',
    color: 0xff7043,
    basePrice: 350,
    maxStock: 3,
    spawnWeight: 7,
    minStage: 2,
    effects: [{ type: 'attack', value: 15, duration: 180000 }]
  },
  {
    id: 'shop_pill_huwei',
    name: '护体丹',
    description: '临时提升防御力，持续一段时间。',
    type: 'pill',
    rarity: 'uncommon',
    icon: '🛡️',
    color: 0x7986cb,
    basePrice: 350,
    maxStock: 3,
    spawnWeight: 7,
    minStage: 2,
    effects: [{ type: 'defense', value: 10, duration: 180000 }]
  },
  {
    id: 'shop_herb_lingzhi',
    name: '灵芝',
    description: '千年灵芝，蕴含丰富灵气，滋补圣品。',
    type: 'herb',
    rarity: 'uncommon',
    icon: '🍄',
    color: 0xff7043,
    basePrice: 80,
    maxStock: 5,
    spawnWeight: 8,
    minStage: 2
  },
  {
    id: 'shop_herb_binglian',
    name: '冰莲',
    description: '生于极寒之地的莲花，蕴含寒冰之力。',
    type: 'herb',
    rarity: 'uncommon',
    icon: '🪷',
    color: 0x4fc3f7,
    basePrice: 90,
    maxStock: 5,
    spawnWeight: 7,
    minStage: 2
  },
  {
    id: 'shop_consumable_spiritstone',
    name: '下品灵石',
    description: '蕴含微薄灵气的灵石，可用于修炼。',
    type: 'consumable',
    rarity: 'uncommon',
    icon: '💠',
    color: 0x78909c,
    basePrice: 50,
    maxStock: 10,
    spawnWeight: 8,
    minStage: 1,
    effects: [{ type: 'spirit', value: 10 }]
  },
  {
    id: 'shop_pill_tianyuan',
    name: '天元丹',
    description: '上品丹药，同时提升攻击与防御。',
    type: 'pill',
    rarity: 'rare',
    icon: '🔮',
    color: 0xba68c8,
    basePrice: 900,
    maxStock: 2,
    spawnWeight: 5,
    minStage: 3,
    effects: [
      { type: 'attack', value: 25, duration: 300000 },
      { type: 'defense', value: 20, duration: 300000 }
    ]
  },
  {
    id: 'shop_herb_huoyan',
    name: '火焰果',
    description: '吸收地火精华而成的奇果，炽热无比。',
    type: 'herb',
    rarity: 'rare',
    icon: '🔥',
    color: 0xff5722,
    basePrice: 150,
    maxStock: 3,
    spawnWeight: 6,
    minStage: 3
  },
  {
    id: 'shop_herb_zixia',
    name: '紫霞参',
    description: '吸收紫气东来的灵参，极为珍贵。',
    type: 'herb',
    rarity: 'rare',
    icon: '✨',
    color: 0xba68c8,
    basePrice: 200,
    maxStock: 3,
    spawnWeight: 5,
    minStage: 4
  },
  {
    id: 'shop_pill_qiangshen',
    name: '强身丹',
    description: '永久增加最大生命值（限服3颗）。',
    type: 'pill',
    rarity: 'rare',
    icon: '💗',
    color: 0xe91e63,
    basePrice: 1200,
    maxStock: 1,
    spawnWeight: 3,
    minStage: 4,
    effects: [{ type: 'health', value: 50 }]
  },
  {
    id: 'shop_consumable_spiritstone_mid',
    name: '中品灵石',
    description: '蕴含较多灵气的灵石，修炼佳品。',
    type: 'consumable',
    rarity: 'rare',
    icon: '💎',
    color: 0x29b6f6,
    basePrice: 250,
    maxStock: 5,
    spawnWeight: 4,
    minStage: 3,
    effects: [{ type: 'spirit', value: 50 }]
  },
  {
    id: 'shop_material_jinjing',
    name: '金精石',
    description: '锻造装备的珍贵材料。',
    type: 'material',
    rarity: 'rare',
    icon: '🪨',
    color: 0xffd54f,
    basePrice: 300,
    maxStock: 3,
    spawnWeight: 4,
    minStage: 3
  },
  {
    id: 'shop_herb_tianshan',
    name: '天山雪莲',
    description: '传说中天山绝顶的圣莲，可遇不可求。',
    type: 'herb',
    rarity: 'epic',
    icon: '❄️',
    color: 0xe1bee7,
    basePrice: 500,
    maxStock: 2,
    spawnWeight: 2,
    minStage: 5
  },
  {
    id: 'shop_pill_zhujian',
    name: '筑基金丹',
    description: '传说中的筑基神丹，可大幅提升修为。',
    type: 'pill',
    rarity: 'epic',
    icon: '🌟',
    color: 0x7c4dff,
    basePrice: 2500,
    maxStock: 1,
    spawnWeight: 1,
    minStage: 5,
    effects: [{ type: 'exp', value: 500 }]
  },
  {
    id: 'shop_treasure_yuhuan',
    name: '聚灵玉环',
    description: '佩戴后可加快灵力恢复速度。',
    type: 'treasure',
    rarity: 'epic',
    icon: '💍',
    color: 0x69f0ae,
    basePrice: 3000,
    maxStock: 1,
    spawnWeight: 1,
    minStage: 5
  },
  {
    id: 'shop_consumable_spiritstone_high',
    name: '上品灵石',
    description: '蕴含大量灵气的灵石，极为珍贵。',
    type: 'consumable',
    rarity: 'epic',
    icon: '💠',
    color: 0x76ff03,
    basePrice: 800,
    maxStock: 3,
    spawnWeight: 2,
    minStage: 4,
    effects: [{ type: 'spirit', value: 200 }]
  },
  {
    id: 'shop_material_longgu',
    name: '龙骨碎片',
    description: '远古龙骨的碎片，蕴含强大力量。',
    type: 'material',
    rarity: 'epic',
    icon: '🦴',
    color: 0xffab40,
    basePrice: 800,
    maxStock: 2,
    spawnWeight: 2,
    minStage: 5
  },
  {
    id: 'shop_herb_jiuzhuan',
    name: '九转还魂草',
    description: '上古神草，传闻有生死人肉白骨之效。',
    type: 'herb',
    rarity: 'legendary',
    icon: '🌟',
    color: 0xffd700,
    basePrice: 2000,
    maxStock: 1,
    spawnWeight: 0.5,
    minStage: 5
  },
  {
    id: 'shop_pill_jiuzhuan',
    name: '九转还魂丹',
    description: '传说中的神丹，可全面提升修为。',
    type: 'pill',
    rarity: 'legendary',
    icon: '👑',
    color: 0xffd700,
    basePrice: 6000,
    maxStock: 1,
    spawnWeight: 0.3,
    minStage: 5,
    effects: [
      { type: 'attack', value: 50, duration: 600000 },
      { type: 'defense', value: 40, duration: 600000 },
      { type: 'health', value: 100 }
    ]
  },
  {
    id: 'shop_treasure_xianjian',
    name: '仙剑碎片',
    description: '上古仙剑的碎片，蕴含强大剑意。',
    type: 'treasure',
    rarity: 'legendary',
    icon: '🗡️',
    color: 0x00e5ff,
    basePrice: 8000,
    maxStock: 1,
    spawnWeight: 0.2,
    minStage: 5
  }
]

export function getShopItemById(id: string): ShopItemTemplate | undefined {
  return SHOP_ITEMS.find(item => item.id === id)
}

export function getShopItemsByRarity(rarity: ShopRarity): ShopItemTemplate[] {
  return SHOP_ITEMS.filter(item => item.rarity === rarity)
}

export function getShopItemsByStage(stage: number): ShopItemTemplate[] {
  return SHOP_ITEMS.filter(item => item.minStage <= stage)
}
