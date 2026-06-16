import type { GameSave, Player, Skill, Treasure, PermanentStatsBonus } from '../types'
import { INITIAL_SKILLS, INITIAL_TREASURES } from '../data/gameData'
import { SectManager } from './SectManager'
import { AlchemyManager } from './AlchemyManager'

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
      gold: 100,
      spirit: 0,
      skills: JSON.parse(JSON.stringify(INITIAL_SKILLS)),
      treasures: JSON.parse(JSON.stringify(INITIAL_TREASURES))
    }
  }

  createNewSave(): GameSave {
    const sectManager = SectManager.getInstance()
    const alchemyManager = AlchemyManager.getInstance()
    return {
      player: this.createDefaultPlayer(),
      sect: sectManager.createInitialSect(),
      alchemy: alchemyManager.createInitialAlchemyData(),
      currentStage: 1,
      highestStage: 1,
      lastPlayTime: Date.now()
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

  settleOfflineIncome(save: GameSave): { resources: any; seconds: number; hasIncome: boolean } {
    const sectManager = SectManager.getInstance()
    sectManager.checkDailyReset(save.sect)
    sectManager.updateQuestProgress(save.sect)
    
    const { resources, seconds } = sectManager.calculateOfflineProduction(save.sect)
    
    const hasIncome = Object.values(resources).some(v => v && v > 0)
    if (hasIncome) {
      sectManager.collectResources(save.sect)
    }
    
    this.saveGame(save)
    return { resources, seconds, hasIncome }
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

  private validateSave(save: GameSave): GameSave | null {
    if (!save || !save.player) return null
    const requiredFields: (keyof Player)[] = ['level', 'health', 'maxHealth', 'attack', 'defense', 'skills', 'treasures']
    for (const field of requiredFields) {
      if (save.player[field] === undefined) return null
    }

    const sectManager = SectManager.getInstance()
    if (!save.sect) {
      save.sect = sectManager.createInitialSect()
    } else {
      save.sect = sectManager.validateSect(save.sect)
    }

    const alchemyManager = AlchemyManager.getInstance()
    save.alchemy = alchemyManager.validateAlchemyData(save.alchemy)

    return save
  }

  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null
  }

  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY)
  }

  recalcPlayerStats(player: Player, alchemyBuff?: { attack: number; defense: number }, permanentBonus?: PermanentStatsBonus): Player {
    let bonusAttack = 0
    let bonusDefense = 0
    let bonusHealth = 0

    player.treasures.forEach((t: Treasure) => {
      bonusAttack += t.attackBonus * t.level
      bonusDefense += t.defenseBonus * t.level
      bonusHealth += t.healthBonus * t.level
    })

    const baseHealth = 100 + (player.level - 1) * 20
    const baseAttack = 20 + (player.level - 1) * 5
    const baseDefense = 10 + (player.level - 1) * 3

    const buffAttack = alchemyBuff?.attack || 0
    const buffDefense = alchemyBuff?.defense || 0

    const permHealth = permanentBonus?.maxHealth || 0
    const permMana = permanentBonus?.maxMana || 0
    const permAttack = permanentBonus?.attack || 0
    const permDefense = permanentBonus?.defense || 0

    player.maxHealth = baseHealth + bonusHealth + permHealth
    player.maxMana = 50 + (player.level - 1) * 10 + permMana
    player.attack = baseAttack + bonusAttack + buffAttack + permAttack
    player.defense = baseDefense + bonusDefense + buffDefense + permDefense

    if (player.health > player.maxHealth) player.health = player.maxHealth
    if (player.mana > player.maxMana) player.mana = player.maxMana

    return player
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
