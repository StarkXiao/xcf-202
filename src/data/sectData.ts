import type { DiscipleTemplate, BuildingTemplate, SectQuestTemplate, Building, Sect, Resources, QuestRewards } from '../types'

export const DISCIPLE_TEMPLATES: DiscipleTemplate[] = [
  {
    id: 'disciple_common_1',
    name: '外门弟子',
    rarity: 'common',
    baseTalent: 5,
    baseCombatPower: 50,
    description: '初入仙门的弟子，根基尚浅但潜力无限。',
    avatar: '🧑',
    color: 0x9e9e9e,
    recruitCost: [{ type: 'gold', amount: 100 }]
  },
  {
    id: 'disciple_common_2',
    name: '采药童子',
    rarity: 'common',
    baseTalent: 6,
    baseCombatPower: 40,
    description: '熟悉药草习性，擅长在灵草园劳作。',
    avatar: '🧒',
    color: 0x81c784,
    recruitCost: [{ type: 'gold', amount: 120 }]
  },
  {
    id: 'disciple_common_3',
    name: '砍柴樵夫',
    rarity: 'common',
    baseTalent: 5,
    baseCombatPower: 55,
    description: '身强体健，擅长伐木取材。',
    avatar: '👨',
    color: 0xa1887f,
    recruitCost: [{ type: 'gold', amount: 110 }]
  },
  {
    id: 'disciple_rare_1',
    name: '内门弟子',
    rarity: 'rare',
    baseTalent: 12,
    baseCombatPower: 150,
    description: '天赋异禀的内门弟子，已得宗门真传。',
    avatar: '🧑‍🦱',
    color: 0x4fc3f7,
    recruitCost: [{ type: 'gold', amount: 500 }, { type: 'spirit', amount: 50 }]
  },
  {
    id: 'disciple_rare_2',
    name: '炼丹童子',
    rarity: 'rare',
    baseTalent: 15,
    baseCombatPower: 100,
    description: '精通丹道，可炼制基础丹药。',
    avatar: '🧑‍🔬',
    color: 0xba68c8,
    recruitCost: [{ type: 'gold', amount: 600 }, { type: 'spirit', amount: 80 }]
  },
  {
    id: 'disciple_rare_3',
    name: '御剑修士',
    rarity: 'rare',
    baseTalent: 14,
    baseCombatPower: 200,
    description: '已得御剑之术真传，战斗力强劲。',
    avatar: '🥷',
    color: 0x7986cb,
    recruitCost: [{ type: 'gold', amount: 550 }, { type: 'spirit', amount: 60 }]
  },
  {
    id: 'disciple_epic_1',
    name: '核心弟子',
    rarity: 'epic',
    baseTalent: 25,
    baseCombatPower: 400,
    description: '宗门核心弟子，万里挑一的天才。',
    avatar: '🧙',
    color: 0xffd54f,
    recruitCost: [{ type: 'gold', amount: 2000 }, { type: 'spirit', amount: 300 }]
  },
  {
    id: 'disciple_epic_2',
    name: '丹道大师',
    rarity: 'epic',
    baseTalent: 30,
    baseCombatPower: 250,
    description: '丹道造诣深厚，可炼制珍贵丹药。',
    avatar: '🧓',
    color: 0xff7043,
    recruitCost: [{ type: 'gold', amount: 2500 }, { type: 'spirit', amount: 400 }]
  },
  {
    id: 'disciple_legendary_1',
    name: '圣体传人',
    rarity: 'legendary',
    baseTalent: 50,
    baseCombatPower: 1000,
    description: '身怀上古圣体，千年不遇的绝世天才。',
    avatar: '🦸',
    color: 0xe91e63,
    recruitCost: [{ type: 'gold', amount: 10000 }, { type: 'spirit', amount: 2000 }]
  },
  {
    id: 'disciple_legendary_2',
    name: '剑仙转世',
    rarity: 'legendary',
    baseTalent: 55,
    baseCombatPower: 1200,
    description: '上古剑仙转世，自带剑道记忆。',
    avatar: '⚔️',
    color: 0x9c27b0,
    recruitCost: [{ type: 'gold', amount: 12000 }, { type: 'spirit', amount: 2500 }]
  }
]

export const BUILDING_TEMPLATES: BuildingTemplate[] = [
  {
    id: 'building_hall',
    type: 'hall',
    name: '宗门大殿',
    baseMaxLevel: 10,
    baseMaxDisciples: 0,
    baseProduction: {},
    baseUpgradeCost: { stone: 200, wood: 200, gold: 500 },
    description: '宗门核心建筑，提升宗门等级可解锁更多功能。',
    color: 0xffd54f
  },
  {
    id: 'building_dormitory',
    type: 'dormitory',
    name: '弟子居所',
    baseMaxLevel: 10,
    baseMaxDisciples: 5,
    baseProduction: {},
    baseUpgradeCost: { stone: 150, wood: 300, gold: 300 },
    description: '弟子居住之所，提升等级可增加弟子上限。',
    color: 0x81c784
  },
  {
    id: 'building_training',
    type: 'training',
    name: '演武场',
    baseMaxLevel: 10,
    baseMaxDisciples: 3,
    baseProduction: { spirit: 1 },
    baseUpgradeCost: { stone: 250, wood: 150, gold: 400 },
    description: '弟子修炼之地，派遣弟子可产出灵气。',
    color: 0x4fc3f7
  },
  {
    id: 'building_alchemy',
    type: 'alchemy',
    name: '炼丹房',
    baseMaxLevel: 10,
    baseMaxDisciples: 2,
    baseProduction: { herb: 2 },
    baseUpgradeCost: { stone: 180, wood: 180, gold: 450 },
    description: '炼制丹药之地，派遣弟子可产出草药。',
    color: 0xba68c8
  },
  {
    id: 'building_warehouse',
    type: 'warehouse',
    name: '藏宝阁',
    baseMaxLevel: 10,
    baseMaxDisciples: 2,
    baseProduction: { gold: 3 },
    baseUpgradeCost: { stone: 300, wood: 200, gold: 350 },
    description: '宗门财富存放之地，派遣弟子可增加金币产出。',
    color: 0xffb74d
  },
  {
    id: 'building_spirit',
    type: 'spirit',
    name: '聚灵阵',
    baseMaxLevel: 10,
    baseMaxDisciples: 0,
    baseProduction: { spirit: 0.5 },
    baseUpgradeCost: { stone: 400, wood: 400, gold: 800, spirit: 100 },
    description: '汇聚天地灵气的阵法，自动产出灵气。',
    color: 0x64b5f6
  }
]

export const QUEST_TEMPLATES: SectQuestTemplate[] = [
  {
    id: 'quest_patrol',
    title: '山门巡逻',
    description: '派遣弟子在宗门四周巡逻，防范宵小之徒。',
    baseDuration: 60,
    baseTargetProgress: 100,
    baseRewards: { gold: 50, reputation: 10 },
    baseCombatPowerRequired: 50,
    color: 0x4fc3f7
  },
  {
    id: 'quest_gather',
    title: '采集灵草',
    description: '前往后山采集灵草，供炼丹房使用。',
    baseDuration: 120,
    baseTargetProgress: 100,
    baseRewards: { herb: 20, gold: 30 },
    baseCombatPowerRequired: 40,
    color: 0x81c784
  },
  {
    id: 'quest_mine',
    title: '开采矿石',
    description: '前往矿山开采锻造所需的矿石。',
    baseDuration: 180,
    baseTargetProgress: 100,
    baseRewards: { stone: 30, gold: 40 },
    baseCombatPowerRequired: 60,
    color: 0xa1887f
  },
  {
    id: 'quest_wood',
    title: '砍伐灵木',
    description: '前往森林砍伐建造所需的灵木。',
    baseDuration: 150,
    baseTargetProgress: 100,
    baseRewards: { wood: 30, gold: 35 },
    baseCombatPowerRequired: 55,
    color: 0x66bb6a
  },
  {
    id: 'quest_bandits',
    title: '剿灭山贼',
    description: '附近山中有山贼盘踞，危害百姓，前往剿灭。',
    baseDuration: 300,
    baseTargetProgress: 100,
    baseRewards: { gold: 200, spirit: 30, reputation: 30 },
    baseCombatPowerRequired: 200,
    color: 0xef5350
  },
  {
    id: 'quest_demon',
    title: '斩杀妖兽',
    description: '有妖兽在附近作乱，威胁宗门安全。',
    baseDuration: 600,
    baseTargetProgress: 100,
    baseRewards: { gold: 500, spirit: 100, reputation: 50 },
    baseCombatPowerRequired: 500,
    color: 0x9c27b0
  },
  {
    id: 'quest_treasure',
    title: '探索秘境',
    description: '发现一处上古秘境，派遣弟子探索机缘。',
    baseDuration: 1200,
    baseTargetProgress: 100,
    baseRewards: { gold: 2000, spirit: 500, reputation: 100 },
    baseCombatPowerRequired: 1000,
    color: 0xffd54f
  }
]

export const RARITY_COLORS: Record<string, number> = {
  common: 0x9e9e9e,
  rare: 0x4fc3f7,
  epic: 0xffd54f,
  legendary: 0xe91e63
}

export const RARITY_NAMES: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说'
}

export const RESOURCE_NAMES: Record<string, string> = {
  gold: '金币',
  spirit: '灵气',
  stone: '石料',
  wood: '灵木',
  herb: '灵草'
}

export const RESOURCE_ICONS: Record<string, string> = {
  gold: '💰',
  spirit: '✨',
  stone: '🪨',
  wood: '🪵',
  herb: '🌿'
}

export function createInitialBuildings(): Building[] {
  return BUILDING_TEMPLATES.map((template, index) => ({
    id: `building_${template.type}_${Date.now()}_${index}`,
    templateId: template.id,
    type: template.type,
    name: template.name,
    level: template.type === 'hall' ? 1 : 0,
    maxLevel: template.baseMaxLevel,
    assignedDisciples: [],
    maxDisciples: template.baseMaxDisciples,
    productionRate: { ...template.baseProduction },
    upgradeCost: { ...template.baseUpgradeCost },
    description: template.description,
    color: template.color
  }))
}

export function createInitialSect(): Sect {
  const now = Date.now()
  return {
    name: '青云宗',
    level: 1,
    exp: 0,
    expToNext: 1000,
    reputation: 0,
    resources: {
      gold: 500,
      spirit: 50,
      stone: 200,
      wood: 200,
      herb: 50
    },
    disciples: [],
    buildings: createInitialBuildings(),
    quests: [],
    maxDisciples: 5,
    lastCollectTime: now,
    dailyRecruitsUsed: 0,
    dailyRecruitLimit: 3,
    lastDailyReset: now
  }
}

export function calculateProduction(building: Building, disciples: any[]): Partial<Resources> {
  if (building.level === 0) return {}
  
  const production: Partial<Resources> = {}
  const multiplier = 1 + (building.level - 1) * 0.2
  const discipleBonus = disciples.reduce((sum, d) => sum + (d.talent || 0) * 0.01, 0)
  const totalMultiplier = multiplier * (1 + discipleBonus)

  for (const [key, value] of Object.entries(building.productionRate)) {
    if (value && value > 0) {
      production[key as keyof Resources] = Math.floor(value * totalMultiplier * 100) / 100
    }
  }
  
  return production
}

export function calculateUpgradeCost(building: Building): Partial<Resources> {
  const cost: Partial<Resources> = {}
  const multiplier = Math.pow(1.5, building.level)
  
  const template = BUILDING_TEMPLATES.find(t => t.id === building.templateId)
  if (!template) return cost

  for (const [key, value] of Object.entries(template.baseUpgradeCost)) {
    if (value) {
      cost[key as keyof Resources] = Math.floor(value * multiplier)
    }
  }
  
  return cost
}

export function generateRecruitPool(sectLevel: number): DiscipleTemplate[] {
  const pool: DiscipleTemplate[] = []
  const common = DISCIPLE_TEMPLATES.filter(d => d.rarity === 'common')
  const rare = DISCIPLE_TEMPLATES.filter(d => d.rarity === 'rare')
  const epic = DISCIPLE_TEMPLATES.filter(d => d.rarity === 'epic')
  const legendary = DISCIPLE_TEMPLATES.filter(d => d.rarity === 'legendary')

  for (let i = 0; i < 3; i++) {
    const rand = Math.random() * 100
    let selected: DiscipleTemplate
    
    if (rand < 60 - sectLevel * 2) {
      selected = common[Math.floor(Math.random() * common.length)]
    } else if (rand < 85 - sectLevel) {
      selected = rare[Math.floor(Math.random() * rare.length)]
    } else if (rand < 97) {
      selected = epic[Math.floor(Math.random() * epic.length)]
    } else if (sectLevel >= 5) {
      selected = legendary[Math.floor(Math.random() * legendary.length)]
    } else {
      selected = epic[Math.floor(Math.random() * epic.length)]
    }
    
    pool.push(selected)
  }
  
  return pool
}

export function generateDailyQuests(sectLevel: number, count: number = 3): any[] {
  const quests: any[] = []
  const shuffled = [...QUEST_TEMPLATES].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, count)

  return selected.map((template, index) => {
    const levelMultiplier = 1 + (sectLevel - 1) * 0.15
    const rewards: QuestRewards = {}
    
    for (const [key, value] of Object.entries(template.baseRewards)) {
      if (value) {
        ;(rewards as any)[key] = Math.floor(value * levelMultiplier)
      }
    }

    return {
      id: `quest_${Date.now()}_${index}`,
      templateId: template.id,
      title: template.title,
      description: template.description,
      status: 'available' as const,
      progress: 0,
      targetProgress: Math.floor(template.baseTargetProgress),
      assignedDisciple: null,
      duration: Math.floor(template.baseDuration * levelMultiplier),
      startTime: null,
      rewards,
      combatPowerRequired: Math.floor(template.baseCombatPowerRequired * levelMultiplier),
      color: template.color
    }
  })
}
