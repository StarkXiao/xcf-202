export type ElementType = 'metal' | 'wood' | 'water' | 'fire' | 'earth' | 'none'

export type SkillBranchType = 'power' | 'speed' | 'efficiency' | 'balance'

export interface SkillBranch {
  id: string
  name: string
  description: string
  type: SkillBranchType
  unlockLevel: number
  icon: string
  color: number
  damageBonus: number
  cooldownReduction: number
  manaCostReduction: number
}

export interface SkillLevelBonus {
  damageIncrease: number
  manaCostIncrease: number
  cooldownChange: number
}

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
  element?: ElementType
  level: number
  maxLevel: number
  exp: number
  expToNext: number
  branches: SkillBranch[]
  selectedBranchIds: string[]
  branchUnlockedLevels: number[]
}

export interface SkillUpgradeResult {
  success: boolean
  leveledUp: boolean
  newLevel?: number
  branchesAvailable?: SkillBranch[]
  message: string
}

export interface SkillBranchSelectResult {
  success: boolean
  branch?: SkillBranch
  message: string
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
  element?: ElementType
  elementDamageBonus?: number
}

export type ResonanceType = 'element' | 'set' | 'special'

export interface ResonanceBonus {
  attack?: number
  defense?: number
  maxHealth?: number
  critRate?: number
  critDamage?: number
  elementDamageBonus?: number
}

export interface Resonance {
  id: string
  name: string
  description: string
  type: ResonanceType
  requiredTreasureIds?: string[]
  requiredElements?: ElementType[]
  requiredElementCount?: number
  bonus: ResonanceBonus
  color: number
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface ActiveResonance {
  resonance: Resonance
  activatedTreasures: Treasure[]
}

export interface ResonanceResult {
  activeResonances: ActiveResonance[]
  totalBonus: ResonanceBonus
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
  critRate: number
  critDamage: number
  gold: number
  spirit: number
  skills: Skill[]
  treasures: Treasure[]
}

export type EnemyType = 'normal' | 'elite' | 'boss'

export interface EnemySpecialSkill {
  id: string
  name: string
  description: string
  damage?: number
  heal?: number
  buffEffect?: {
    type: 'attack' | 'defense'
    value: number
    duration: number
  }
  debuffEffect?: {
    type: 'defenseDown' | 'attackDown' | 'burn' | 'slow'
    value: number
    duration: number
  }
  chance: number
  icon: string
  color: number
  cooldown: number
}

export interface BossPhase {
  phase: number
  name: string
  healthThreshold: number
  attackMultiplier: number
  defenseMultiplier: number
  specialSkills: EnemySpecialSkill[]
  color: number
  message: string
}

export interface EnemyDrop {
  type: 'gold' | 'spirit' | 'exp' | 'herb' | 'material'
  id?: string
  name?: string
  icon?: string
  amount: number
  chance: number
  color: number
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
  element?: ElementType
  type?: EnemyType
  specialSkills?: EnemySpecialSkill[]
  phases?: BossPhase[]
  currentPhase?: number
  drops?: EnemyDrop[]
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

export interface PhaseTransition {
  phase: number
  phaseName: string
  message: string
  color: number
}

export interface BattleStatistics {
  totalDamageDealt: number
  totalDamageTaken: number
  totalHealing: number
  critCount: number
  critTotal: number
  enemiesDefeated: number
  eliteDefeated: number
  bossDefeated: number
  phaseTransitions: PhaseTransition[]
  turnsElapsed: number
  specialSkillUses: number
}

export interface BattleResult {
  victory: boolean
  stageId: number
  expGained: number
  goldGained: number
  spiritGained: number
  playerHealth: number
  herbDrops?: { herbId: string; amount: number; herbName?: string; herbIcon?: string }[]
  elementStats?: {
    advantageHits: number
    disadvantageHits: number
    totalElementBonusDamage: number
  }
  specialDrops?: EnemyDrop[]
  statistics?: BattleStatistics
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
  element?: ElementType
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
  meridian: MeridianData
  shop: ShopData
  achievement: AchievementData
  chapter: ChapterProgress
  dailyTrial: DailyTrialProgress
  currentStage: number
  highestStage: number
  lastPlayTime: number
  offlineIncome: OfflineIncomeData
}

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

export type MeridianRealm = 'qi_refining' | 'foundation' | 'golden_core' | 'nascent_soul' | 'soul_formation' | 'tribulation' | 'immortal'

export interface MeridianRealmInfo {
  id: MeridianRealm
  name: string
  description: string
  order: number
  color: number
  requiredLevel: number
  breakthroughSpiritCost: number
  breakthroughSuccessRate: number
  maxNodes: number
  statBonuses: {
    maxHealth: number
    maxMana: number
    attack: number
    defense: number
  }
}

export type MeridianNodeType = 'attack' | 'defense' | 'health' | 'mana' | 'crit_rate' | 'crit_damage' | 'skill'

export interface MeridianNodeTemplate {
  id: string
  name: string
  description: string
  type: MeridianNodeType
  realm: MeridianRealm
  position: number
  spiritCost: number
  statValue?: number
  unlockSkillId?: string
  color: number
  icon: string
  requiredNodes: string[]
}

export interface MeridianNode {
  templateId: string
  activated: boolean
  activationTime: number | null
}

export interface MeridianSkillUnlock {
  id: string
  name: string
  description: string
  damage: number
  cooldown: number
  manaCost: number
  color: number
  icon: string
  requiredNodeId: string
}

export interface MeridianData {
  currentRealm: MeridianRealm
  highestRealm: MeridianRealm
  nodes: MeridianNode[]
  unlockedSkillIds: string[]
  breakthroughAttempts: number
  lastBreakthroughTime: number | null
}

export interface MeridianBonus {
  maxHealth: number
  maxMana: number
  attack: number
  defense: number
  critRate: number
  critDamage: number
}

export interface BreakthroughResult {
  success: boolean
  previousRealm: MeridianRealm
  newRealm?: MeridianRealm
  message: string
  costSpent: number
}

export type SceneType = 'menu' | 'opening' | 'battle' | 'treasure' | 'sect' | 'result' | 'alchemy' | 'spiritBeast' | 'encounter' | 'equipment' | 'dungeon' | 'meridian' | 'shop' | 'chapterMap' | 'story' | 'chapterReview'

export type ChapterStatus = 'locked' | 'unlocked' | 'in_progress' | 'completed'

export interface StoryDialogue {
  speaker: string
  text: string
  color: number
  avatar?: string
}

export interface ChapterReward {
  type: 'gold' | 'spirit' | 'exp' | 'attack' | 'defense' | 'maxHealth' | 'maxMana' | 'skill' | 'treasure'
  value: number
  itemId?: string
  itemName?: string
}

export interface ChapterDialogueNode {
  id: string
  triggerType: 'boss_victory' | 'elite_victory' | 'stage_clear' | 'chapter_milestone'
  dialogues: StoryDialogue[]
  rewards?: ChapterReward[]
  nextNodeId?: string
  isKeyStory?: boolean
}

export interface ChapterLevel {
  id: string
  name: string
  description: string
  type: 'battle' | 'story' | 'boss'
  stageId?: number
  storyDialogues?: StoryDialogue[]
  victoryDialogueNodeId?: string
  position: { x: number; y: number }
  requiredLevel: number
  rewards: ChapterReward[]
  isUnlocked: boolean
  isCompleted: boolean
}

export interface Chapter {
  id: string
  name: string
  description: string
  chapterNumber: number
  icon: string
  color: number
  backgroundColor: number
  status: ChapterStatus
  unlockRequirement: {
    type: 'stage' | 'level' | 'chapter'
    value: number
  }
  levels: ChapterLevel[]
  completionRewards: ChapterReward[]
  openingStory: StoryDialogue[]
  closingStory: StoryDialogue[]
  dialogueNodes: ChapterDialogueNode[]
  mapImage?: string
}

export interface ChapterProgress {
  currentChapterId: string | null
  highestChapterId: string | null
  completedChapterIds: string[]
  completedLevelIds: string[]
  claimedRewards: string[]
  triggeredDialogueNodeIds: string[]
  chapterStates: Record<string, {
    status: ChapterStatus
    currentLevelIndex: number
    completedLevelIds: string[]
    collectedRewards?: ChapterReward[]
  }>
}

export interface ChapterReviewData {
  chapterId: string
  chapterName: string
  completedAt: number
  totalTime: number
  levelsCompleted: number
  totalLevels: number
  rewards: ChapterReward[]
  battleStats: {
    totalDamage: number
    totalHealing: number
    enemiesDefeated: number
    deaths: number
  }
}

export type ShopRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type ShopItemType = 'pill' | 'herb' | 'material' | 'treasure' | 'consumable'

export interface ShopItem {
  id: string
  templateId: string
  name: string
  description: string
  type: ShopItemType
  rarity: ShopRarity
  icon: string
  color: number
  basePrice: number
  currentPrice: number
  priceFluctuation: number
  stock: number
  maxStock: number
  isRareStock?: boolean
  effects?: {
    type: string
    value: number
    duration?: number
  }[]
}

export interface ShopItemTemplate {
  id: string
  name: string
  description: string
  type: ShopItemType
  rarity: ShopRarity
  icon: string
  color: number
  basePrice: number
  maxStock: number
  spawnWeight: number
  minStage: number
  effects?: {
    type: string
    value: number
    duration?: number
  }[]
}

export interface ShopPurchaseRecord {
  itemId: string
  itemName: string
  price: number
  purchaseTime: number
  quantity: number
}

export interface ShopData {
  items: ShopItem[]
  lastRefreshTime: number
  refreshCount: number
  dailyRefreshCount: number
  lastDailyReset: number
  purchaseHistory: ShopPurchaseRecord[]
  totalSpent: number
  rareItemsFound: number
}

export interface ShopRefreshResult {
  items: ShopItem[]
  rareItems: ShopItem[]
  message: string
}

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type AchievementCategory = 'battle' | 'collection' | 'story' | 'exploration' | 'development'
export type AchievementStatus = 'locked' | 'unlocked' | 'claimed'

export interface AchievementReward {
  type: 'gold' | 'spirit' | 'exp' | 'attack' | 'defense' | 'maxHealth' | 'maxMana'
  value: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: AchievementRarity
  category: AchievementCategory
  target: number
  progress: number
  status: AchievementStatus
  rewards: AchievementReward[]
  unlockedAt: number | null
  claimedAt: number | null
  requirementStage?: number
}

export interface MonsterEntry {
  id: string
  name: string
  description: string
  icon: string
  color: number
  stage: number
  defeatCount: number
  firstDefeatAt: number | null
  isDiscovered: boolean
}

export interface TreasureEntry {
  id: string
  name: string
  description: string
  icon: string
  color: number
  rarity: AchievementRarity
  isCollected: boolean
  collectedAt: number | null
  maxLevel: number
}

export interface StoryEntry {
  id: string
  name: string
  description: string
  icon: string
  requiredStage: number
  isCompleted: boolean
  completedAt: number | null
  isDiscovered: boolean
}

export interface AchievementBonus {
  attack: number
  defense: number
  maxHealth: number
  maxMana: number
}

export interface AchievementData {
  achievements: Achievement[]
  monsters: MonsterEntry[]
  treasures: TreasureEntry[]
  stories: StoryEntry[]
  totalMonstersDefeated: number
  totalTreasuresCollected: number
  totalStoriesCompleted: number
  totalAchievementsUnlocked: number
  totalRewardsClaimed: number
  permanentBonus: AchievementBonus
  lastAchievementCheck: number
}

export interface AchievementProgressUpdate {
  type: 'monster_defeat' | 'treasure_collect' | 'story_complete' | 'stage_clear' | 'gold_spent' | 'spirit_spent'
  id?: string
  value: number
  stageId?: number
}

export interface OfflineIncome {
  gold: number
  spirit: number
  exp: number
}

export interface OfflineIncomeResult {
  income: OfflineIncome
  offlineSeconds: number
  maxSeconds: number
  isCapped: boolean
  isAbnormal: boolean
  abnormalReason?: string
}

export interface OfflineIncomeConfig {
  maxOfflineHours: number
  goldPerMinuteBase: number
  spiritPerMinuteBase: number
  expPerMinuteBase: number
  stageMultiplier: number
  goldCapBase: number
  spiritCapBase: number
  expCapBase: number
}

export interface OfflineIncomeData {
  lastSettleTime: number
  totalOfflineTime: number
  totalGoldEarned: number
  totalSpiritEarned: number
  totalExpEarned: number
}

export interface DailyTrialReward {
  type: 'gold' | 'spirit' | 'exp' | 'material' | 'herb' | 'pill' | 'treasure'
  value: number
  itemId?: string
  itemName?: string
  itemIcon?: string
  itemColor?: number
}

export interface DailyTrialLevel {
  id: number
  name: string
  description: string
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme'
  background: number
  enemies: Enemy[]
  rewards: DailyTrialReward[]
  unlockLevel: number
  minPlayerLevel: number
  statMultiplier: {
    health: number
    attack: number
    defense: number
  }
}

export interface DailyTrialProgress {
  dailyAttempts: number
  maxDailyAttempts: number
  highestLevel: number
  currentLevel: number
  lastDailyReset: number
  totalClears: number
  bestTime: number | null
  lastCompletionTime: number | null
  claimedLevelRewards: number[]
  isTrialActive: boolean
  trialStartHealth: number
  playerSnapshot: {
    health: number
    maxHealth: number
    attack: number
    defense: number
    mana: number
    maxMana: number
  } | null
  consecutiveDays: number
  lastStreakDate: string | null
  purchasedExtraAttempts: number
  currentDifficultyScale: number
  dailyGoldEarned: number
  dailySpiritEarned: number
  dailyExpEarned: number
  dailyClearedLevels: number[]
  dailyMilestoneClaimed: number[]
  bestConsecutiveDays: number
}

export interface DailyTrialMilestone {
  id: number
  requiredClearedLevels: number
  rewards: DailyTrialReward[]
  label: string
  icon: string
}

export interface DailyTrialResult {
  success: boolean
  levelId: number
  clearedLevel: number
  goldEarned: number
  spiritEarned: number
  expEarned: number
  extraRewards: DailyTrialReward[]
  isNewRecord: boolean
  completionTime: number
  streakBonus: number
  difficultyScale: number
}

