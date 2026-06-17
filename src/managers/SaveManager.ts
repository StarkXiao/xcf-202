import type { GameSave, Player, Skill, Treasure, PermanentStatsBonus, EquipmentBonus, MeridianBonus, AchievementBonus, SkillBranch } from '../types'
import { INITIAL_SKILLS, INITIAL_TREASURES } from '../data/gameData'
import { calculateTreasureResonance } from '../data/resonanceData'
import { SectManager } from './SectManager'
import { AlchemyManager } from './AlchemyManager'
import { SpiritBeastManager } from './SpiritBeastManager'
import { EncounterManager } from './EncounterManager'
import { EquipmentManager } from './EquipmentManager'
import { MeridianManager } from './MeridianManager'
import { ShopManager } from './ShopManager'
import { AchievementManager } from './AchievementManager'
import { ChapterManager } from './ChapterManager'
import { OfflineIncomeManager } from './OfflineIncomeManager'
import { DailyTrialManager } from './DailyTrialManager'

const SAVE_KEY = 'xianxia_sword_save_v1'

export class SaveManager {
  private static instance: SaveManager

  static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager()
    }
    return SaveManager.instance
  }

  private createDefaultPlayer(): Player {
    return {
      name: '剑仙',
      level: 1,
      exp: 0,
      expToNext: 100,
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      attack: 20,
      defense: 10,
      critRate: 0,
      critDamage: 0.5,
      gold: 100,
      spirit: 0,
      skills: JSON.parse(JSON.stringify(INITIAL_SKILLS)),
      treasures: JSON.parse(JSON.stringify(INITIAL_TREASURES))
    }
  }

  createNewSave(): GameSave {
    const sectManager = SectManager.getInstance()
    const alchemyManager = AlchemyManager.getInstance()
    const spiritBeastManager = SpiritBeastManager.getInstance()
    const encounterManager = EncounterManager.getInstance()
    const equipmentManager = EquipmentManager.getInstance()
    const meridianManager = MeridianManager.getInstance()
    const shopManager = ShopManager.getInstance()
    const achievementManager = AchievementManager.getInstance()
    const chapterManager = ChapterManager.getInstance()
    const offlineIncomeManager = OfflineIncomeManager.getInstance()
    const dailyTrialManager = DailyTrialManager.getInstance()
    const save = {
      player: this.createDefaultPlayer(),
      sect: sectManager.createInitialSect(),
      alchemy: alchemyManager.createInitialAlchemyData(),
      spiritBeast: spiritBeastManager.createInitialSpiritBeastData(),
      encounter: encounterManager.createInitialEncounterProgress(),
      equipment: equipmentManager.createInitialEquipmentData(),
      meridian: meridianManager.createInitialMeridianData(),
      shop: shopManager.createInitialShopData(),
      achievement: achievementManager.createInitialAchievementData(),
      dungeon: this.createInitialDungeonProgress(),
      chapter: chapterManager.createInitialChapterProgress(),
      dailyTrial: dailyTrialManager.createInitialDailyTrialData(),
      currentStage: 1,
      highestStage: 1,
      lastPlayTime: Date.now(),
      offlineIncome: offlineIncomeManager.createInitialOfflineIncomeData()
    }
    achievementManager.initializePlayerTreasures(save)
    chapterManager.initializeChapterProgress(save)
    return save
  }

  createInitialDungeonProgress(): import('../types').DungeonProgress {
    return {
      currentFloor: 0,
      totalFloors: 5,
      currentRoomId: null,
      clearedRoomIds: [],
      activeBuffs: [],
      dungeonGold: 0,
      dungeonSpirit: 0,
      dungeonExp: 0,
      floor: null,
      playerSnapshot: null,
      isDungeonActive: false,
      dungeonStartHealth: 100
    }
  }

  validateDungeonProgress(dungeon: any): import('../types').DungeonProgress {
    if (!dungeon) {
      return this.createInitialDungeonProgress()
    }
    const defaults = this.createInitialDungeonProgress()
    return {
      ...defaults,
      ...dungeon,
      activeBuffs: dungeon.activeBuffs || [],
      clearedRoomIds: dungeon.clearedRoomIds || []
    }
  }

  applyBattleResultToSect(save: GameSave, result: { victory: boolean; goldGained: number; spiritGained: number }): void {
    if (result.victory) {
      const sectManager = SectManager.getInstance()
      sectManager.addResources(save.sect, {
        gold: result.goldGained,
        spirit: result.spiritGained
      })
    }
  }

  settleOfflineIncome(save: GameSave): { 
    playerIncome: { gold: number; spirit: number; exp: number }
    sectResources: any
    offlineSeconds: number
    hasIncome: boolean
    isAbnormal: boolean
    abnormalReason?: string
    isCapped: boolean
    leveledUp: boolean
    levelsGained: number
  } {
    const sectManager = SectManager.getInstance()
    const offlineIncomeManager = OfflineIncomeManager.getInstance()
    const dailyTrialManager = DailyTrialManager.getInstance()

    sectManager.checkDailyReset(save.sect)
    sectManager.updateQuestProgress(save.sect)
    dailyTrialManager.checkDailyReset(save.dailyTrial)

    const playerResult = offlineIncomeManager.calculateOfflineIncome(save)
    const { resources: sectResources, seconds: sectSeconds } = sectManager.calculateOfflineProduction(save.sect)

    const hasPlayerIncome = offlineIncomeManager.hasIncome(playerResult)
    const hasSectIncome = Object.values(sectResources).some(v => v && v > 0)
    const hasIncome = hasPlayerIncome || hasSectIncome

    let leveledUp = false
    let levelsGained = 0

    if (hasPlayerIncome && !playerResult.isAbnormal) {
      const result = offlineIncomeManager.applyOfflineIncome(save, playerResult)
      leveledUp = result.leveledUp
      levelsGained = result.levels
    }

    if (hasSectIncome) {
      sectManager.collectResources(save.sect)
    }

    this.recalcPlayerStatsFromSave(save)

    if (leveledUp) {
      save.player.health = save.player.maxHealth
      save.player.mana = save.player.maxMana
    }

    save.lastPlayTime = Date.now()
    this.saveGame(save)

    return {
      playerIncome: playerResult.income,
      sectResources,
      offlineSeconds: Math.max(playerResult.offlineSeconds, sectSeconds),
      hasIncome,
      isAbnormal: playerResult.isAbnormal,
      abnormalReason: playerResult.abnormalReason,
      isCapped: playerResult.isCapped,
      leveledUp,
      levelsGained
    }
  }

  saveGame(save: GameSave): void {
    try {
      save.lastPlayTime = Date.now()
      localStorage.setItem(SAVE_KEY, JSON.stringify(save))
    } catch (e) {
      console.error('保存游戏失败:', e)
    }
  }

  loadGame(): GameSave | null {
    try {
      const data = localStorage.getItem(SAVE_KEY)
      if (!data) return null
      const save = JSON.parse(data) as GameSave
      return this.validateSave(save)
    } catch (e) {
      console.error('加载游戏失败:', e)
      return null
    }
  }

  private createSkillBranches(skillId: string, baseColor: number): SkillBranch[] {
    return [
      {
        id: `${skillId}_power_3`,
        name: '锋锐',
        description: '专注于杀伤力，大幅提升技能伤害',
        type: 'power',
        unlockLevel: 3,
        icon: '💥',
        color: 0xff5722,
        damageBonus: 0.3,
        cooldownReduction: 0,
        manaCostReduction: 0
      },
      {
        id: `${skillId}_efficiency_3`,
        name: '凝练',
        description: '凝练灵气，降低技能灵气消耗',
        type: 'efficiency',
        unlockLevel: 3,
        icon: '💠',
        color: 0x4fc3f7,
        damageBonus: 0,
        cooldownReduction: 0,
        manaCostReduction: 0.25
      },
      {
        id: `${skillId}_speed_6`,
        name: '疾风',
        description: '剑走疾风，大幅缩短冷却时间',
        type: 'speed',
        unlockLevel: 6,
        icon: '🌀',
        color: 0x81c784,
        damageBonus: 0,
        cooldownReduction: 0.35,
        manaCostReduction: 0
      },
      {
        id: `${skillId}_balance_6`,
        name: '混元',
        description: '混元调和，全面提升各项属性',
        type: 'balance',
        unlockLevel: 6,
        icon: '☯',
        color: 0xba68c8,
        damageBonus: 0.15,
        cooldownReduction: 0.15,
        manaCostReduction: 0.1
      }
    ]
  }

  private validateSkill(skill: any, index: number): Skill {
    const initialSkill = INITIAL_SKILLS[index]
    const baseColor = skill.color || (initialSkill?.color ?? 0xffffff)
    const baseId = skill.id || (initialSkill?.id ?? `skill_${index}`)

    return {
      id: skill.id || initialSkill?.id || `skill_${index}`,
      name: skill.name || initialSkill?.name || '技能',
      description: skill.description || initialSkill?.description || '',
      damage: skill.damage ?? initialSkill?.damage ?? 10,
      cooldown: skill.cooldown ?? initialSkill?.cooldown ?? 0,
      currentCooldown: skill.currentCooldown ?? 0,
      manaCost: skill.manaCost ?? initialSkill?.manaCost ?? 0,
      unlockLevel: skill.unlockLevel ?? initialSkill?.unlockLevel ?? 1,
      color: skill.color ?? initialSkill?.color ?? 0xffffff,
      icon: skill.icon ?? initialSkill?.icon ?? '⚔',
      element: skill.element ?? initialSkill?.element,
      level: skill.level ?? 1,
      maxLevel: skill.maxLevel ?? 10,
      exp: skill.exp ?? 0,
      expToNext: skill.expToNext ?? Math.floor(50 * Math.pow(1.5, (skill.level ?? 1) - 1)),
      branches: skill.branches ?? this.createSkillBranches(baseId, baseColor),
      selectedBranchIds: skill.selectedBranchIds ?? [],
      branchUnlockedLevels: skill.branchUnlockedLevels ?? [3, 6]
    }
  }

  private validateSkills(skills: any[]): Skill[] {
    if (!skills || skills.length === 0) {
      return JSON.parse(JSON.stringify(INITIAL_SKILLS))
    }
    return skills.map((skill, index) => this.validateSkill(skill, index))
  }

  private validateSave(save: GameSave): GameSave | null {
    if (!save || !save.player) return null
    const requiredFields: (keyof Player)[] = ['level', 'health', 'maxHealth', 'attack', 'defense', 'skills', 'treasures']
    for (const field of requiredFields) {
      if (save.player[field] === undefined) return null
    }

    if (save.player.critRate === undefined) save.player.critRate = 0
    if (save.player.critDamage === undefined) save.player.critDamage = 0.5

    save.player.skills = this.validateSkills(save.player.skills)

    const sectManager = SectManager.getInstance()
    if (!save.sect) {
      save.sect = sectManager.createInitialSect()
    } else {
      save.sect = sectManager.validateSect(save.sect)
    }

    const alchemyManager = AlchemyManager.getInstance()
    save.alchemy = alchemyManager.validateAlchemyData(save.alchemy)

    const spiritBeastManager = SpiritBeastManager.getInstance()
    save.spiritBeast = spiritBeastManager.validateSpiritBeastData(save.spiritBeast)

    const encounterManager = EncounterManager.getInstance()
    save.encounter = encounterManager.validateEncounterProgress(save.encounter)

    const equipmentManager = EquipmentManager.getInstance()
    save.equipment = equipmentManager.validateEquipmentData(save.equipment)

    const meridianManager = MeridianManager.getInstance()
    save.meridian = meridianManager.validateMeridianData(save.meridian)

    const shopManager = ShopManager.getInstance()
    save.shop = shopManager.validateShopData(save.shop)

    save.dungeon = this.validateDungeonProgress(save.dungeon)

    const chapterManager = ChapterManager.getInstance()
    if (!save.chapter) {
      save.chapter = chapterManager.createInitialChapterProgress()
    }
    chapterManager.initializeChapterProgress(save)

    const achievementManager = AchievementManager.getInstance()
    save.achievement = achievementManager.validateAchievementData(save.achievement)

    const offlineIncomeManager = OfflineIncomeManager.getInstance()
    save.offlineIncome = offlineIncomeManager.validateOfflineIncomeData(save.offlineIncome)

    const dailyTrialManager = DailyTrialManager.getInstance()
    save.dailyTrial = dailyTrialManager.validateDailyTrialData(save.dailyTrial)

    return save
  }

  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null
  }

  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY)
  }

  recalcPlayerStats(player: Player, alchemyBuff?: { attack: number; defense: number }, permanentBonus?: PermanentStatsBonus, equipmentBonus?: EquipmentBonus, meridianBonus?: MeridianBonus, achievementBonus?: AchievementBonus): Player {
    let bonusAttack = 0
    let bonusDefense = 0
    let bonusHealth = 0

    player.treasures.forEach((t: Treasure) => {
      bonusAttack += t.attackBonus * t.level
      bonusDefense += t.defenseBonus * t.level
      bonusHealth += t.healthBonus * t.level
    })

    const resonanceResult = calculateTreasureResonance(player.treasures)
    const resonBonus = resonanceResult.totalBonus

    const baseHealth = 100 + (player.level - 1) * 20
    const baseAttack = 20 + (player.level - 1) * 5
    const baseDefense = 10 + (player.level - 1) * 3

    const buffAttack = alchemyBuff?.attack || 0
    const buffDefense = alchemyBuff?.defense || 0

    const permHealth = permanentBonus?.maxHealth || 0
    const permMana = permanentBonus?.maxMana || 0
    const permAttack = permanentBonus?.attack || 0
    const permDefense = permanentBonus?.defense || 0

    const equipAttack = equipmentBonus?.attack || 0
    const equipDefense = equipmentBonus?.defense || 0
    const equipHealth = equipmentBonus?.maxHealth || 0
    const equipMana = equipmentBonus?.maxMana || 0
    const equipCritRate = equipmentBonus?.critRate || 0
    const equipCritDamage = equipmentBonus?.critDamage || 0

    const meridHealth = meridianBonus?.maxHealth || 0
    const meridMana = meridianBonus?.maxMana || 0
    const meridAttack = meridianBonus?.attack || 0
    const meridDefense = meridianBonus?.defense || 0
    const meridCritRate = (meridianBonus?.critRate || 0) / 100
    const meridCritDamage = (meridianBonus?.critDamage || 0) / 100

    const achvAttack = achievementBonus?.attack || 0
    const achvDefense = achievementBonus?.defense || 0
    const achvHealth = achievementBonus?.maxHealth || 0
    const achvMana = achievementBonus?.maxMana || 0

    const resonAttack = resonBonus.attack || 0
    const resonDefense = resonBonus.defense || 0
    const resonHealth = resonBonus.maxHealth || 0
    const resonCritRate = resonBonus.critRate || 0
    const resonCritDamage = resonBonus.critDamage || 0

    player.maxHealth = Math.floor((baseHealth + bonusHealth + permHealth + equipHealth + meridHealth + achvHealth + resonHealth) * (1 + (equipmentBonus?.maxHealth || 0)))
    player.maxMana = Math.floor((50 + (player.level - 1) * 10 + permMana + equipMana + meridMana + achvMana) * (1 + (equipmentBonus?.maxMana || 0)))
    player.attack = Math.floor((baseAttack + bonusAttack + buffAttack + permAttack + equipAttack + meridAttack + achvAttack + resonAttack) * (1 + (equipmentBonus?.attack || 0)))
    player.defense = Math.floor((baseDefense + bonusDefense + buffDefense + permDefense + equipDefense + meridDefense + achvDefense + resonDefense) * (1 + (equipmentBonus?.defense || 0)))
    player.critRate = equipCritRate + meridCritRate + resonCritRate
    player.critDamage = 0.5 + equipCritDamage + meridCritDamage + resonCritDamage

    if (player.health > player.maxHealth) player.health = player.maxHealth
    if (player.mana > player.maxMana) player.mana = player.maxMana

    return player
  }

  recalcPlayerStatsFromSave(save: GameSave): Player {
    const alchemyManager = AlchemyManager.getInstance()
    const equipmentManager = EquipmentManager.getInstance()
    const meridianManager = MeridianManager.getInstance()
    const achievementManager = AchievementManager.getInstance()

    const buff = alchemyManager.getBuffBonus(save.alchemy)
    const permBonus = alchemyManager.getPermanentBonus(save.alchemy)
    const equipBonus = equipmentManager.calculateEquipmentBonus(save.equipment)
    const meridBonus = meridianManager.calculateMeridianBonus(save.meridian)
    const achvBonus = achievementManager.getAchievementBonus(save.achievement)

    return this.recalcPlayerStats(save.player, buff, permBonus, equipBonus, meridBonus, achvBonus)
  }

  addExp(player: Player, exp: number, permanentBonus?: PermanentStatsBonus): { leveledUp: boolean; levels: number } {
    let leveledUp = false
    let levels = 0
    player.exp += exp

    while (player.exp >= player.expToNext) {
      player.exp -= player.expToNext
      player.level++
      player.expToNext = Math.floor(100 * Math.pow(1.3, player.level - 1))
      leveledUp = true
      levels++
    }

    if (leveledUp) {
      this.recalcPlayerStats(player, undefined, permanentBonus)
      player.health = player.maxHealth
      player.mana = player.maxMana
      player.skills.forEach((s: Skill) => {
        s.currentCooldown = 0
      })
    }

    return { leveledUp, levels }
  }
}
