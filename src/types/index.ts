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

export interface BattleResult {
  victory: boolean
  stageId: number
  expGained: number
  goldGained: number
  spiritGained: number
  playerHealth: number
  herbDrops?: { herbId: string; amount: number; herbName?: string; herbIcon?: string }[]
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

export interface Herb {
  id: string
  name: string
  description: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  color: number
  icon: string
}

export interface PillEffect {
  type: 'attack' | 'defense' | 'health' | 'mana' | 'exp' | 'heal' | 'manaRestore' | 'critRate' | 'critDamage'
  value: number
  duration?: number
}

export interface Pill {
  id: string
  name: string
  description: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  color: number
  icon: string
  effects: PillEffect[]
  stackable: boolean
  price: number
  useLimit?: number
}

export interface Recipe {
  id: string
  name: string
  description: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  color: number
  resultPillId: string
  resultAmount: number
  materials: { herbId: string; amount: number }[]
  goldCost: number
  spiritCost: number
  baseSuccessRate: number
  unlockLevel: number
  unlocked: boolean
}

export interface InventoryItem {
  id: string
  type: 'herb' | 'pill'
  itemId: string
  quantity: number
}

export interface ActivePillBuff {
  pillId: string
  effects: PillEffect[]
  endTime: number
}

export interface PermanentPillRecord {
  pillId: string
  usedCount: number
}

export interface PermanentStatsBonus {
  maxHealth: number
  maxMana: number
  attack: number
  defense: number
}

export interface AlchemyData {
  herbs: InventoryItem[]
  pills: InventoryItem[]
  unlockedRecipes: string[]
  activeBuffs: ActivePillBuff[]
  permanentRecords: PermanentPillRecord[]
  permanentBonus: PermanentStatsBonus
}

export type SpiritBeastRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'

export interface SpiritBeastSkill {
  id: string
  name: string
  description: string
  type: 'attack' | 'support' | 'heal' | 'buff' | 'debuff'
  damage?: number
  heal?: number
  buffEffect?: {
    type: 'attack' | 'defense' | 'critRate' | 'critDamage'
    value: number
    duration: number
  }
  debuffEffect?: {
    type: 'defenseDown' | 'attackDown' | 'slow' | 'burn'
    value: number
    duration: number
  }
  cooldown: number
  currentCooldown: number
  unlockStage: number
  color: number
  icon: string
}

export interface SpiritBeastTemplate {
  id: string
  name: string
  description: string
  rarity: SpiritBeastRarity
  baseHealth: number
  baseAttack: number
  baseDefense: number
  growthHealth: number
  growthAttack: number
  growthDefense: number
  baseExpToNext: number
  maxLevel: number
  maxStage: number
  skills: SpiritBeastSkill[]
  captureRate: number
  feedItems: { itemId: string; expGain: number }[]
  evolveRequirements: {
    stage: number
    gold: number
    spirit: number
    items?: { itemId: string; amount: number }[]
  }[]
  color: number
  icon: string
  battleSprite: {
    bodyColor: number
    eyeColor: number
    size: number
  }
}

export interface SpiritBeast {
  id: string
  templateId: string
  name: string
  level: number
  exp: number
  expToNext: number
  stage: number
  health: number
  maxHealth: number
  attack: number
  defense: number
  skills: SpiritBeastSkill[]
  rarity: SpiritBeastRarity
  color: number
  icon: string
  isInBattle: boolean
  battlePosition: number | null
  affection: number
  captureTime: number
}

export interface SpiritBeastData {
  beasts: SpiritBeast[]
  battleTeam: (string | null)[]
  captureItems: { itemId: string; quantity: number }[]
  feedItems: { itemId: string; quantity: number }[]
  evolveItems: { itemId: string; quantity: number }[]
  unlockedBeastTemplates: string[]
}

export interface CaptureResult {
  success: boolean
  beast?: SpiritBeast
  message: string
}

export interface BattleBeastData {
  beast: SpiritBeast
  sprite: Phaser.GameObjects.Container | null
  currentCooldowns: Map<string, number>
}

export type EncounterRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface EncounterDialogue {
  speaker: string
  text: string
  color: number
}

export interface EncounterReward {
  type: 'gold' | 'spirit' | 'exp' | 'attack' | 'defense' | 'maxHealth' | 'maxMana'
  value: number
}

export interface EncounterChoice {
  text: string
  successRate: number
  rewards: EncounterReward[]
  failRewards: EncounterReward[]
  resultText: string
  failText: string
}

export interface EncounterEvent {
  id: string
  name: string
  description: string
  icon: string
  color: number
  requiredStage: number
  dialogues: EncounterDialogue[]
  choices: EncounterChoice[]
  isRepeatable: boolean
  rarity: EncounterRarity
}

export interface EncounterProgress {
  completedEncounters: string[]
  encounterCount: number
  lastEncounterTime: number
  dailyEncounterCount: number
  lastDailyReset: number
}

export type EquipmentQuality = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
export type EquipmentSlot = 'weapon' | 'armor' | 'helmet' | 'boots' | 'ring' | 'necklace'
export type StatType = 'attack' | 'defense' | 'maxHealth' | 'maxMana' | 'critRate' | 'critDamage'

export interface EquipmentStat {
  type: StatType
  value: number
  isPercentage: boolean
}

export interface EquipmentTemplate {
  id: string
  name: string
  description: string
  slot: EquipmentSlot
  baseQuality: EquipmentQuality
  baseStats: EquipmentStat[]
  icon: string
  color: number
  craftMaterials: { materialId: string; amount: number }[]
  goldCost: number
  spiritCost: number
  minStage: number
}

export interface Equipment {
  id: string
  templateId: string
  name: string
  slot: EquipmentSlot
  quality: EquipmentQuality
  level: number
  maxLevel: number
  stats: EquipmentStat[]
  extraStats: EquipmentStat[]
  icon: string
  color: number
  isEquipped: boolean
  equipPosition: number | null
  forgeCount: number
}

export interface ForgeMaterial {
  id: string
  name: string
  description: string
  rarity: EquipmentQuality
  color: number
  icon: string
}

export interface EquipmentData {
  materials: { materialId: string; quantity: number }[]
  equipments: Equipment[]
  equipped: (string | null)[]
  unlockedTemplates: string[]
}

export interface ForgeResult {
  success: boolean
  equipment?: Equipment
  reason?: string
}

export interface AdvanceResult {
  success: boolean
  newQuality?: EquipmentQuality
  reason?: string
}

export interface EquipmentBonus {
  attack: number
  defense: number
  maxHealth: number
  maxMana: number
  critRate: number
  critDamage: number
}

export interface GameSave {
  player: Player
  sect: Sect
  alchemy: AlchemyData
  spiritBeast: SpiritBeastData
  encounter: EncounterProgress
  equipment: EquipmentData
  dungeon: DungeonProgress
  currentStage: number
  highestStage: number
  lastPlayTime: number
}

export type SceneType = 'menu' | 'opening' | 'battle' | 'treasure' | 'sect' | 'result' | 'alchemy' | 'spiritBeast' | 'encounter' | 'equipment' | 'dungeon'

export type DungeonRoomType = 'battle' | 'event' | 'treasure' | 'rest' | 'shop' | 'boss' | 'mystery'
export type DungeonBuffType = 'attack' | 'defense' | 'maxHealth' | 'critRate' | 'critDamage' | 'manaRegen' | 'heal'

export interface DungeonBuff {
  id: string
  name: string
  description: string
  type: DungeonBuffType
  value: number
  icon: string
  color: number
  remainingRooms: number
}

export interface DungeonEventChoice {
  id: string
  text: string
  description: string
  successRate: number
  successRewards: {
    gold?: number
    spirit?: number
    exp?: number
    health?: number
    buff?: DungeonBuff
    healPercent?: number
  }
  failPenalty?: {
    healthDamage?: number
    goldLoss?: number
  }
  successText: string
  failText: string
}

export interface DungeonEvent {
  id: string
  name: string
  description: string
  icon: string
  color: number
  choices: DungeonEventChoice[]
}

export interface DungeonRoom {
  id: string
  layer: number
  index: number
  type: DungeonRoomType
  name: string
  description: string
  icon: string
  color: number
  event?: DungeonEvent
  enemyLevel?: number
  rewards?: {
    gold?: number
    spirit?: number
    exp?: number
    buff?: DungeonBuff
    healPercent?: number
  }
  isCleared: boolean
  isAccessible: boolean
  connections: string[]
}

export interface DungeonFloor {
  layer: number
  name: string
  rooms: DungeonRoom[]
  bossRoomId: string
}

export interface DungeonProgress {
  currentFloor: number
  totalFloors: number
  currentRoomId: string | null
  clearedRoomIds: string[]
  activeBuffs: DungeonBuff[]
  dungeonGold: number
  dungeonSpirit: number
  dungeonExp: number
  floor: DungeonFloor | null
  playerSnapshot: {
    health: number
    maxHealth: number
    attack: number
    defense: number
    mana: number
    maxMana: number
  } | null
  isDungeonActive: boolean
  dungeonStartHealth: number
}

export interface DungeonResult {
  success: boolean
  clearedFloors: number
  totalRoomsCleared: number
  goldEarned: number
  spiritEarned: number
  expEarned: number
  buffsApplied: DungeonBuff[]
}

