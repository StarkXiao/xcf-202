export interface Skill {
  id: string
  name: string
  description: string
  damage: number
  cooldown: number
  currentCooldown: number
  manaCost: number
  unlockLevel: number
  color: number
  icon: string
}

export interface Treasure {
  id: string
  name: string
  description: string
  level: number
  maxLevel: number
  attackBonus: number
  defenseBonus: number
  healthBonus: number
  upgradeCost: number
  color: number
}

export interface Player {
  name: string
  level: number
  exp: number
  expToNext: number
  health: number
  maxHealth: number
  mana: number
  maxMana: number
  attack: number
  defense: number
  gold: number
  spirit: number
  skills: Skill[]
  treasures: Treasure[]
}

export interface Enemy {
  id: string
  name: string
  health: number
  maxHealth: number
  attack: number
  defense: number
  exp: number
  gold: number
  color: number
  size: number
}

export interface Stage {
  id: number
  name: string
  description: string
  enemies: Enemy[]
  background: number
  requiredLevel: number
  rewards: {
    gold: number
    exp: number
    spirit: number
  }
}

export type SceneType = 'menu' | 'opening' | 'battle' | 'treasure' | 'sect' | 'result'

export interface BattleResult {
  victory: boolean
  stageId: number
  expGained: number
  goldGained: number
  spiritGained: number
  playerHealth: number
}

export type ResourceType = 'gold' | 'spirit' | 'stone' | 'wood' | 'herb'
export type DiscipleRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type BuildingType = 'hall' | 'dormitory' | 'training' | 'alchemy' | 'warehouse' | 'spirit'
export type QuestStatus = 'available' | 'in_progress' | 'completed' | 'claimed'

export interface Resources {
  gold: number
  spirit: number
  stone: number
  wood: number
  herb: number
}

export interface Disciple {
  id: string
  templateId: string
  name: string
  rarity: DiscipleRarity
  level: number
  exp: number
  expToNext: number
  talent: number
  combatPower: number
  assignedBuilding: string | null
  avatar: string
  color: number
}

export interface DiscipleTemplate {
  id: string
  name: string
  rarity: DiscipleRarity
  baseTalent: number
  baseCombatPower: number
  description: string
  avatar: string
  color: number
  recruitCost: { type: ResourceType; amount: number }[]
}

export interface Building {
  id: string
  templateId: string
  type: BuildingType
  name: string
  level: number
  maxLevel: number
  assignedDisciples: string[]
  maxDisciples: number
  productionRate: Partial<Resources>
  upgradeCost: Partial<Resources>
  description: string
  color: number
}

export interface BuildingTemplate {
  id: string
  type: BuildingType
  name: string
  baseMaxLevel: number
  baseMaxDisciples: number
  baseProduction: Partial<Resources>
  baseUpgradeCost: Partial<Resources>
  description: string
  color: number
}

export type QuestRewards = Partial<Resources> & { reputation?: number }

export interface SectQuest {
  id: string
  templateId: string
  title: string
  description: string
  status: QuestStatus
  progress: number
  targetProgress: number
  assignedDisciple: string | null
  duration: number
  startTime: number | null
  rewards: QuestRewards
  combatPowerRequired: number
  color: number
}

export interface SectQuestTemplate {
  id: string
  title: string
  description: string
  baseDuration: number
  baseTargetProgress: number
  baseRewards: QuestRewards
  baseCombatPowerRequired: number
  color: number
}

export interface Sect {
  name: string
  level: number
  exp: number
  expToNext: number
  reputation: number
  resources: Resources
  disciples: Disciple[]
  buildings: Building[]
  quests: SectQuest[]
  maxDisciples: number
  lastCollectTime: number
  dailyRecruitsUsed: number
  dailyRecruitLimit: number
  lastDailyReset: number
}

export interface GameSave {
  player: Player
  sect: Sect
  currentStage: number
  highestStage: number
  lastPlayTime: number
}
