import type { Achievement, MonsterEntry, TreasureEntry, StoryEntry, AchievementRarity } from '../types'
import { STAGES } from './gameData'
import { INITIAL_TREASURES } from './gameData'

export const ACHIEVEMENT_RARITY_COLORS: Record<AchievementRarity, number> = {
  common: 0x9e9e9e,
  rare: 0x4fc3f7,
  epic: 0xba68c8,
  legendary: 0xffd54f
}

export const ACHIEVEMENT_RARITY_NAMES: Record<AchievementRarity, string> = {
  common: '凡品',
  rare: '灵品',
  epic: '仙品',
  legendary: '神品'
}

export const ACHIEVEMENT_CATEGORY_NAMES: Record<string, string> = {
  battle: '战斗',
  collection: '收集',
  story: '剧情',
  exploration: '探索',
  development: '养成'
}

export const ACHIEVEMENT_CATEGORY_COLORS: Record<string, number> = {
  battle: 0xef5350,
  collection: 0x4fc3f7,
  story: 0xffd54f,
  exploration: 0x81c784,
  development: 0xba68c8
}

export const ACHIEVEMENTS: Omit<Achievement, 'progress' | 'status' | 'unlockedAt' | 'claimedAt'>[] = [
  {
    id: 'first_blood',
    name: '初露锋芒',
    description: '击败第一个敌人',
    icon: '⚔️',
    rarity: 'common',
    category: 'battle',
    target: 1,
    rewards: [{ type: 'gold', value: 100 }]
  },
  {
    id: 'monster_hunter_10',
    name: '妖兽猎人',
    description: '累计击败10只妖兽',
    icon: '🗡️',
    rarity: 'common',
    category: 'battle',
    target: 10,
    rewards: [{ type: 'gold', value: 300 }, { type: 'spirit', value: 20 }]
  },
  {
    id: 'monster_hunter_50',
    name: '除魔先锋',
    description: '累计击败50只妖兽',
    icon: '💀',
    rarity: 'rare',
    category: 'battle',
    target: 50,
    rewards: [{ type: 'gold', value: 800 }, { type: 'spirit', value: 50 }, { type: 'exp', value: 100 }]
  },
  {
    id: 'monster_hunter_200',
    name: '斩妖除魔',
    description: '累计击败200只妖兽',
    icon: '☠️',
    rarity: 'epic',
    category: 'battle',
    target: 200,
    rewards: [{ type: 'gold', value: 2000 }, { type: 'spirit', value: 150 }, { type: 'attack', value: 10 }]
  },
  {
    id: 'monster_hunter_500',
    name: '屠魔大圣',
    description: '累计击败500只妖兽',
    icon: '🔥',
    rarity: 'legendary',
    category: 'battle',
    target: 500,
    rewards: [{ type: 'gold', value: 5000 }, { type: 'spirit', value: 500 }, { type: 'attack', value: 30 }, { type: 'defense', value: 20 }]
  },
  {
    id: 'stage_clear_1',
    name: '初入仙途',
    description: '通关第1关',
    icon: '🥇',
    rarity: 'common',
    category: 'exploration',
    target: 1,
    requirementStage: 1,
    rewards: [{ type: 'gold', value: 200 }, { type: 'spirit', value: 10 }]
  },
  {
    id: 'stage_clear_3',
    name: '小有所成',
    description: '通关第3关',
    icon: '🏆',
    rarity: 'rare',
    category: 'exploration',
    target: 1,
    requirementStage: 3,
    rewards: [{ type: 'gold', value: 500 }, { type: 'spirit', value: 40 }, { type: 'defense', value: 5 }]
  },
  {
    id: 'stage_clear_5',
    name: '威震三界',
    description: '通关第5关',
    icon: '👑',
    rarity: 'legendary',
    category: 'exploration',
    target: 1,
    requirementStage: 5,
    rewards: [{ type: 'gold', value: 3000 }, { type: 'spirit', value: 300 }, { type: 'maxHealth', value: 100 }, { type: 'attack', value: 20 }]
  },
  {
    id: 'treasure_collector_3',
    name: '法宝入门',
    description: '收集3件法宝',
    icon: '💎',
    rarity: 'common',
    category: 'collection',
    target: 3,
    rewards: [{ type: 'gold', value: 200 }]
  },
  {
    id: 'treasure_master',
    name: '法宝大师',
    description: '收集所有法宝',
    icon: '💠',
    rarity: 'epic',
    category: 'collection',
    target: 10,
    rewards: [{ type: 'gold', value: 1500 }, { type: 'spirit', value: 100 }, { type: 'maxMana', value: 50 }]
  },
  {
    id: 'monster_pedia_5',
    name: '图鉴新手',
    description: '解锁5种怪物图鉴',
    icon: '📖',
    rarity: 'common',
    category: 'collection',
    target: 5,
    rewards: [{ type: 'gold', value: 200 }, { type: 'spirit', value: 15 }]
  },
  {
    id: 'monster_pedia_all',
    name: '万妖全鉴',
    description: '解锁所有怪物图鉴',
    icon: '📚',
    rarity: 'epic',
    category: 'collection',
    target: 10,
    rewards: [{ type: 'gold', value: 2000 }, { type: 'spirit', value: 200 }, { type: 'defense', value: 15 }]
  },
  {
    id: 'story_complete_3',
    name: '仙途过客',
    description: '完成3段剧情',
    icon: '📜',
    rarity: 'rare',
    category: 'story',
    target: 3,
    rewards: [{ type: 'gold', value: 500 }, { type: 'spirit', value: 40 }]
  },
  {
    id: 'story_complete_all',
    name: '得道成仙',
    description: '完成所有剧情',
    icon: '🌟',
    rarity: 'legendary',
    category: 'story',
    target: 5,
    rewards: [{ type: 'gold', value: 10000 }, { type: 'spirit', value: 1000 }, { type: 'maxHealth', value: 200 }, { type: 'attack', value: 50 }]
  },
  {
    id: 'gold_spent_1000',
    name: '富甲一方',
    description: '累计消费1000金币',
    icon: '💰',
    rarity: 'rare',
    category: 'development',
    target: 1000,
    rewards: [{ type: 'gold', value: 500 }, { type: 'spirit', value: 30 }]
  },
  {
    id: 'gold_spent_10000',
    name: '腰缠万贯',
    description: '累计消费10000金币',
    icon: '🏦',
    rarity: 'epic',
    category: 'development',
    target: 10000,
    rewards: [{ type: 'gold', value: 3000 }, { type: 'spirit', value: 150 }, { type: 'maxMana', value: 80 }]
  },
  {
    id: 'spirit_spent_500',
    name: '灵气充沛',
    description: '累计消耗500灵气',
    icon: '✨',
    rarity: 'rare',
    category: 'development',
    target: 500,
    rewards: [{ type: 'spirit', value: 100 }, { type: 'exp', value: 200 }]
  }
]

export const MONSTER_TEMPLATES: Omit<MonsterEntry, 'defeatCount' | 'firstDefeatAt' | 'isDiscovered'>[] = []

STAGES.forEach(stage => {
  stage.enemies.forEach(enemy => {
    if (!MONSTER_TEMPLATES.find(m => m.id === enemy.id)) {
      MONSTER_TEMPLATES.push({
        id: enemy.id,
        name: enemy.name,
        description: getMonsterDescription(enemy.id, enemy.name),
        icon: getMonsterIcon(enemy.id),
        color: enemy.color,
        stage: stage.id
      })
    }
  })
})

function getMonsterDescription(id: string, name: string): string {
  const descriptions: Record<string, string> = {
    wolf: '幽林深处的嗜血妖兽，喜群居，锋利的爪牙可撕裂肉体',
    snake: '青冥幽谷中的毒蛇，行动迅捷，毒液见血封喉',
    demon: '血煞魔洞中的低级魔物，由怨气凝聚而成',
    bat: '栖息于阴暗洞穴中的蝙蝠，翅膀带有煞气',
    ghost: '九幽深渊中的怨灵，被魔气侵蚀的亡魂',
    skeleton: '上古战场的骸骨，被魔气唤醒成为不死战将',
    fire_demon: '熔岩深处的火焰恶魔，全身燃烧着不灭之火',
    lava_beast: '以熔岩为食的巨兽，皮肤坚硬如铁',
    demon_lord: '天魔使者，拥有操控魔气的恐怖力量',
    dark_dragon: '被魔气污染的上古神龙，拥有毁天灭地之力'
  }
  return descriptions[id] || `${name}，三界之中的妖兽`
}

function getMonsterIcon(id: string): string {
  const icons: Record<string, string> = {
    wolf: '🐺',
    snake: '🐍',
    demon: '👹',
    bat: '🦇',
    ghost: '👻',
    skeleton: '💀',
    fire_demon: '😈',
    lava_beast: '🦖',
    demon_lord: '👿',
    dark_dragon: '🐉'
  }
  return icons[id] || '👾'
}

export const TREASURE_TEMPLATES: Omit<TreasureEntry, 'isCollected' | 'collectedAt'>[] = [
  {
    id: 'flying_sword',
    name: '青锋剑',
    description: '修仙者入门佩剑，蕴含微薄灵气',
    icon: '⚔️',
    color: 0x78909c,
    rarity: 'common',
    maxLevel: 10
  },
  {
    id: 'jade_pendant',
    name: '通灵玉佩',
    description: '上古玉珏，护主心神，可挡致命一击',
    icon: '🧿',
    color: 0x81c784,
    rarity: 'rare',
    maxLevel: 10
  },
  {
    id: 'pearl',
    name: '定海神珠',
    description: '深海奇珠，凝练灵力',
    icon: '🔮',
    color: 0x4dd0e1,
    rarity: 'rare',
    maxLevel: 10
  },
  {
    id: 'dragon_sword',
    name: '龙牙剑',
    description: '以龙牙锻造，蕴含龙威',
    icon: '🐉',
    color: 0xba68c8,
    rarity: 'epic',
    maxLevel: 15
  },
  {
    id: 'sun_sword',
    name: '烈日剑',
    description: '吸收太阳精华所铸，光芒万丈',
    icon: '☀️',
    color: 0xffd54f,
    rarity: 'legendary',
    maxLevel: 20
  },
  {
    id: 'phoenix_robe',
    name: '凤凰羽衣',
    description: '凤凰羽毛编织，浴火重生',
    icon: '🔥',
    color: 0xef5350,
    rarity: 'epic',
    maxLevel: 15
  },
  {
    id: 'spirit_ring',
    name: '灵戒',
    description: '蕴含灵力的戒指',
    icon: '💍',
    color: 0x66bb6a,
    rarity: 'common',
    maxLevel: 10
  },
  {
    id: 'mystic_helmet',
    name: '玄晶头盔',
    description: '以玄晶打造，可挡神念攻击',
    icon: '⛑️',
    color: 0x42a5f5,
    rarity: 'rare',
    maxLevel: 10
  },
  {
    id: 'void_boots',
    name: '虚空靴',
    description: '可踏空而行，速度倍增',
    icon: '👟',
    color: 0x7e57c2,
    rarity: 'epic',
    maxLevel: 15
  },
  {
    id: 'chaos_pendant',
    name: '混沌圣佩',
    description: '开天辟地时的混沌精华所化',
    icon: '🌟',
    color: 0xff7043,
    rarity: 'legendary',
    maxLevel: 20
  }
]

export const STORY_TEMPLATES: Omit<StoryEntry, 'isCompleted' | 'completedAt' | 'isDiscovered'>[] = [
  {
    id: 'opening',
    name: '初入仙途',
    description: '师尊命你下山历练，斩妖除魔，还天下太平',
    icon: '🏔️',
    requiredStage: 1
  },
  {
    id: 'qingming_valley',
    name: '青冥幽谷',
    description: '在青冥幽谷击败了幽狼和青蛇，初显锋芒',
    icon: '🌲',
    requiredStage: 1
  },
  {
    id: 'blood_demon_cave',
    name: '血煞魔洞',
    description: '深入血煞魔洞，击败了血魔和暗影蝠',
    icon: '🦇',
    requiredStage: 2
  },
  {
    id: 'nine_nether',
    name: '九幽深渊',
    description: '勇闯九幽深渊，与怨灵和骷髅战将激战',
    icon: '💀',
    requiredStage: 3
  },
  {
    id: 'heaven_demon',
    name: '天外魔境',
    description: '抵达天外魔境，与天魔使者和魔龙展开决战',
    icon: '🐉',
    requiredStage: 5
  }
]

export function getAchievementById(id: string): typeof ACHIEVEMENTS[0] | undefined {
  return ACHIEVEMENTS.find(a => a.id === id)
}

export function getMonsterTemplateById(id: string): typeof MONSTER_TEMPLATES[0] | undefined {
  return MONSTER_TEMPLATES.find(m => m.id === id)
}

export function getTreasureTemplateById(id: string): typeof TREASURE_TEMPLATES[0] | undefined {
  return TREASURE_TEMPLATES.find(t => t.id === id)
}

export function getStoryTemplateById(id: string): typeof STORY_TEMPLATES[0] | undefined {
  return STORY_TEMPLATES.find(s => s.id === id)
}
