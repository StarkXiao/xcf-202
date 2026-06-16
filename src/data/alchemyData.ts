import type { Herb, Pill, Recipe } from '../types'

export const HERBS: Herb[] = [
  {
    id: 'herb_qingming',
    name: '清冥草',
    description: '常见于幽谷之中的灵草，性温和，可炼制基础丹药。',
    rarity: 'common',
    color: 0x81c784,
    icon: '🌿'
  },
  {
    id: 'herb_xuepo',
    name: '血魄花',
    description: '生长于阴暗之地，花色如血，可炼制滋补丹药。',
    rarity: 'common',
    color: 0xef5350,
    icon: '🌺'
  },
  {
    id: 'herb_lingzhi',
    name: '灵芝',
    description: '千年灵芝，蕴含丰富灵气，滋补圣品。',
    rarity: 'rare',
    color: 0xff7043,
    icon: '🍄'
  },
  {
    id: 'herb_binglian',
    name: '冰莲',
    description: '生于极寒之地的莲花，蕴含寒冰之力。',
    rarity: 'rare',
    color: 0x4fc3f7,
    icon: '🪷'
  },
  {
    id: 'herb_huoyan',
    name: '火焰果',
    description: '吸收地火精华而成的奇果，炽热无比。',
    rarity: 'rare',
    color: 0xff5722,
    icon: '🔥'
  },
  {
    id: 'herb_zixia',
    name: '紫霞参',
    description: '吸收紫气东来的灵参，极为珍贵。',
    rarity: 'epic',
    color: 0xba68c8,
    icon: '✨'
  },
  {
    id: 'herb_tianshan',
    name: '天山雪莲',
    description: '传说中天山绝顶的圣莲，可遇不可求。',
    rarity: 'epic',
    color: 0xe1bee7,
    icon: '❄️'
  },
  {
    id: 'herb_jiuzhuan',
    name: '九转还魂草',
    description: '上古神草，传闻有生死人肉白骨之效。',
    rarity: 'legendary',
    color: 0xffd700,
    icon: '🌟'
  }
]

export const PILLS: Pill[] = [
  {
    id: 'pill_huiqi',
    name: '回气丹',
    description: '基础丹药，可快速恢复少量灵力。',
    rarity: 'common',
    color: 0x81c784,
    icon: '💊',
    effects: [{ type: 'manaRestore', value: 30 }],
    stackable: true,
    price: 50
  },
  {
    id: 'pill_huiyuan',
    name: '回元丹',
    description: '补充生命力，恢复一定生命值。',
    rarity: 'common',
    color: 0xef5350,
    icon: '❤️',
    effects: [{ type: 'heal', value: 80 }],
    stackable: true,
    price: 80
  },
  {
    id: 'pill_juling',
    name: '聚灵丹',
    description: '凝聚天地灵气，服用后获得经验值。',
    rarity: 'common',
    color: 0x4fc3f7,
    icon: '💎',
    effects: [{ type: 'exp', value: 50 }],
    stackable: true,
    price: 100
  },
  {
    id: 'pill_lizhan',
    name: '力战丹',
    description: '临时提升攻击力，持续一段时间。',
    rarity: 'rare',
    color: 0xff7043,
    icon: '⚔️',
    effects: [{ type: 'attack', value: 15, duration: 180000 }],
    stackable: false,
    price: 300
  },
  {
    id: 'pill_huwei',
    name: '护体丹',
    description: '临时提升防御力，持续一段时间。',
    rarity: 'rare',
    color: 0x7986cb,
    icon: '🛡️',
    effects: [{ type: 'defense', value: 10, duration: 180000 }],
    stackable: false,
    price: 300
  },
  {
    id: 'pill_tianyuan',
    name: '天元丹',
    description: '上品丹药，同时提升攻击与防御。',
    rarity: 'epic',
    color: 0xba68c8,
    icon: '🔮',
    effects: [
      { type: 'attack', value: 25, duration: 300000 },
      { type: 'defense', value: 20, duration: 300000 }
    ],
    stackable: false,
    price: 800
  },
  {
    id: 'pill_qiangshen',
    name: '强身丹',
    description: '永久增加最大生命值（限服3颗）。',
    rarity: 'epic',
    color: 0xe91e63,
    icon: '💗',
    effects: [{ type: 'health', value: 50 }],
    stackable: false,
    price: 1000,
    useLimit: 3
  },
  {
    id: 'pill_jiuzhuan',
    name: '九转还魂丹',
    description: '传说中的神丹，可全面提升修为（限服1颗）。',
    rarity: 'legendary',
    color: 0xffd700,
    icon: '👑',
    effects: [
      { type: 'attack', value: 50, duration: 600000 },
      { type: 'defense', value: 40, duration: 600000 },
      { type: 'health', value: 100 }
    ],
    stackable: false,
    price: 5000,
    useLimit: 1
  }
]

export const RECIPES: Recipe[] = [
  {
    id: 'recipe_huiqi',
    name: '回气丹方',
    description: '炼制回气丹的基础丹方。',
    rarity: 'common',
    color: 0x81c784,
    resultPillId: 'pill_huiqi',
    resultAmount: 2,
    materials: [
      { herbId: 'herb_qingming', amount: 3 }
    ],
    goldCost: 20,
    spiritCost: 5,
    baseSuccessRate: 0.85,
    unlockLevel: 1,
    unlocked: true
  },
  {
    id: 'recipe_huiyuan',
    name: '回元丹方',
    description: '炼制回元丹的丹方。',
    rarity: 'common',
    color: 0xef5350,
    resultPillId: 'pill_huiyuan',
    resultAmount: 2,
    materials: [
      { herbId: 'herb_xuepo', amount: 3 },
      { herbId: 'herb_qingming', amount: 2 }
    ],
    goldCost: 30,
    spiritCost: 8,
    baseSuccessRate: 0.8,
    unlockLevel: 2,
    unlocked: false
  },
  {
    id: 'recipe_juling',
    name: '聚灵丹方',
    description: '炼制聚灵丹的丹方，可快速提升修为。',
    rarity: 'common',
    color: 0x4fc3f7,
    resultPillId: 'pill_juling',
    resultAmount: 1,
    materials: [
      { herbId: 'herb_qingming', amount: 5 },
      { herbId: 'herb_lingzhi', amount: 1 }
    ],
    goldCost: 50,
    spiritCost: 15,
    baseSuccessRate: 0.75,
    unlockLevel: 3,
    unlocked: false
  },
  {
    id: 'recipe_lizhan',
    name: '力战丹方',
    description: '炼制力战丹，提升攻击的丹药。',
    rarity: 'rare',
    color: 0xff7043,
    resultPillId: 'pill_lizhan',
    resultAmount: 1,
    materials: [
      { herbId: 'herb_huoyan', amount: 3 },
      { herbId: 'herb_xuepo', amount: 2 }
    ],
    goldCost: 100,
    spiritCost: 30,
    baseSuccessRate: 0.65,
    unlockLevel: 4,
    unlocked: false
  },
  {
    id: 'recipe_huwei',
    name: '护体丹方',
    description: '炼制护体丹，提升防御的丹药。',
    rarity: 'rare',
    color: 0x7986cb,
    resultPillId: 'pill_huwei',
    resultAmount: 1,
    materials: [
      { herbId: 'herb_binglian', amount: 3 },
      { herbId: 'herb_lingzhi', amount: 2 }
    ],
    goldCost: 100,
    spiritCost: 30,
    baseSuccessRate: 0.65,
    unlockLevel: 5,
    unlocked: false
  },
  {
    id: 'recipe_tianyuan',
    name: '天元丹方',
    description: '上品丹方，炼制可全面提升战力的天元丹。',
    rarity: 'epic',
    color: 0xba68c8,
    resultPillId: 'pill_tianyuan',
    resultAmount: 1,
    materials: [
      { herbId: 'herb_zixia', amount: 2 },
      { herbId: 'herb_lingzhi', amount: 3 },
      { herbId: 'herb_binglian', amount: 2 }
    ],
    goldCost: 300,
    spiritCost: 80,
    baseSuccessRate: 0.5,
    unlockLevel: 7,
    unlocked: false
  },
  {
    id: 'recipe_qiangshen',
    name: '强身丹方',
    description: '强身健体，永久增加生命上限的珍贵丹方。',
    rarity: 'epic',
    color: 0xe91e63,
    resultPillId: 'pill_qiangshen',
    resultAmount: 1,
    materials: [
      { herbId: 'herb_tianshan', amount: 1 },
      { herbId: 'herb_zixia', amount: 2 },
      { herbId: 'herb_lingzhi', amount: 5 }
    ],
    goldCost: 500,
    spiritCost: 150,
    baseSuccessRate: 0.4,
    unlockLevel: 8,
    unlocked: false
  },
  {
    id: 'recipe_jiuzhuan',
    name: '九转还魂丹方',
    description: '上古神方，传说中的九转还魂丹炼制之法。',
    rarity: 'legendary',
    color: 0xffd700,
    resultPillId: 'pill_jiuzhuan',
    resultAmount: 1,
    materials: [
      { herbId: 'herb_jiuzhuan', amount: 1 },
      { herbId: 'herb_tianshan', amount: 2 },
      { herbId: 'herb_zixia', amount: 3 }
    ],
    goldCost: 2000,
    spiritCost: 500,
    baseSuccessRate: 0.25,
    unlockLevel: 10,
    unlocked: false
  }
]

export const HERB_DROP_TABLE: Record<number, { herbId: string; chance: number; minAmount: number; maxAmount: number }[]> = {
  1: [
    { herbId: 'herb_qingming', chance: 0.6, minAmount: 1, maxAmount: 3 },
    { herbId: 'herb_xuepo', chance: 0.3, minAmount: 1, maxAmount: 2 }
  ],
  2: [
    { herbId: 'herb_qingming', chance: 0.5, minAmount: 1, maxAmount: 3 },
    { herbId: 'herb_xuepo', chance: 0.4, minAmount: 1, maxAmount: 2 },
    { herbId: 'herb_lingzhi', chance: 0.15, minAmount: 1, maxAmount: 1 }
  ],
  3: [
    { herbId: 'herb_qingming', chance: 0.4, minAmount: 2, maxAmount: 4 },
    { herbId: 'herb_xuepo', chance: 0.35, minAmount: 1, maxAmount: 3 },
    { herbId: 'herb_lingzhi', chance: 0.25, minAmount: 1, maxAmount: 2 },
    { herbId: 'herb_binglian', chance: 0.1, minAmount: 1, maxAmount: 1 },
    { herbId: 'herb_huoyan', chance: 0.1, minAmount: 1, maxAmount: 1 }
  ],
  4: [
    { herbId: 'herb_xuepo', chance: 0.4, minAmount: 2, maxAmount: 4 },
    { herbId: 'herb_lingzhi', chance: 0.3, minAmount: 1, maxAmount: 2 },
    { herbId: 'herb_binglian', chance: 0.25, minAmount: 1, maxAmount: 2 },
    { herbId: 'herb_huoyan', chance: 0.25, minAmount: 1, maxAmount: 2 },
    { herbId: 'herb_zixia', chance: 0.1, minAmount: 1, maxAmount: 1 }
  ],
  5: [
    { herbId: 'herb_lingzhi', chance: 0.5, minAmount: 2, maxAmount: 4 },
    { herbId: 'herb_binglian', chance: 0.35, minAmount: 1, maxAmount: 3 },
    { herbId: 'herb_huoyan', chance: 0.35, minAmount: 1, maxAmount: 3 },
    { herbId: 'herb_zixia', chance: 0.25, minAmount: 1, maxAmount: 2 },
    { herbId: 'herb_tianshan', chance: 0.1, minAmount: 1, maxAmount: 1 },
    { herbId: 'herb_jiuzhuan', chance: 0.03, minAmount: 1, maxAmount: 1 }
  ]
}

export function getHerbById(id: string): Herb | undefined {
  return HERBS.find(h => h.id === id)
}

export function getPillById(id: string): Pill | undefined {
  return PILLS.find(p => p.id === id)
}

export function getRecipeById(id: string): Recipe | undefined {
  return RECIPES.find(r => r.id === id)
}

export const PERMANENT_PILL_LIMITS: Record<string, number> = {
  'pill_qiangshen': 3
}

export function getPillUseLimit(pillId: string): number {
  return PERMANENT_PILL_LIMITS[pillId] || 0
}

export function isPermanentPill(pill: Pill): boolean {
  return pill.effects.some(e => !e.duration && ['health', 'mana', 'attack', 'defense'].includes(e.type))
}
