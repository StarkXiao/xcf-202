import type { GameSave, Player, Skill, Treasure } from '../types'
import { INITIAL_SKILLS, INITIAL_TREASURES } from '../data/gameData'

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
    return {
      player: this.createDefaultPlayer(),
      currentStage: 1,
      highestStage: 1,
      lastPlayTime: Date.now()
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

  private validateSave(save: GameSave): GameSave | null {
    if (!save || !save.player) return null
    const requiredFields: (keyof Player)[] = ['level', 'health', 'maxHealth', 'attack', 'defense', 'skills', 'treasures']
    for (const field of requiredFields) {
      if (save.player[field] === undefined) return null
    }
    return save
  }

  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null
  }

  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY)
  }

  recalcPlayerStats(player: Player): Player {
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

    player.maxHealth = baseHealth + bonusHealth
    player.maxMana = 50 + (player.level - 1) * 10
    player.attack = baseAttack + bonusAttack
    player.defense = baseDefense + bonusDefense

    if (player.health > player.maxHealth) player.health = player.maxHealth
    if (player.mana > player.maxMana) player.mana = player.maxMana

    return player
  }

  addExp(player: Player, exp: number): { leveledUp: boolean; levels: number } {
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
      this.recalcPlayerStats(player)
      player.health = player.maxHealth
      player.mana = player.maxMana
      player.skills.forEach((s: Skill) => {
        s.currentCooldown = 0
      })
    }

    return { leveledUp, levels }
  }
}
