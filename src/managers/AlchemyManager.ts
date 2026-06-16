import type {
  AlchemyData,
  InventoryItem,
  Recipe,
  Pill,
  Player,
  ActivePillBuff
} from '../types'
import {
  HERBS,
  PILLS,
  RECIPES,
  HERB_DROP_TABLE,
  getHerbById,
  getPillById,
  getRecipeById
} from '../data/alchemyData'
import { SaveManager } from './SaveManager'

export type AlchemyResult =
  | { success: true; pill: Pill; amount: number }
  | { success: false; reason: string; lostMaterials?: boolean }

export class AlchemyManager {
  private static instance: AlchemyManager

  static getInstance(): AlchemyManager {
    if (!AlchemyManager.instance) {
      AlchemyManager.instance = new AlchemyManager()
    }
    return AlchemyManager.instance
  }

  createInitialAlchemyData(): AlchemyData {
    const initialUnlocked = RECIPES.filter(r => r.unlocked).map(r => r.id)
    return {
      herbs: [],
      pills: [],
      unlockedRecipes: initialUnlocked,
      activeBuffs: []
    }
  }

  validateAlchemyData(data: AlchemyData | undefined): AlchemyData {
    if (!data) {
      return this.createInitialAlchemyData()
    }
    if (!data.herbs) data.herbs = []
    if (!data.pills) data.pills = []
    if (!data.unlockedRecipes) {
      data.unlockedRecipes = RECIPES.filter(r => r.unlocked).map(r => r.id)
    }
    if (!data.activeBuffs) data.activeBuffs = []
    return data
  }

  addHerb(alchemy: AlchemyData, herbId: string, amount: number = 1): void {
    const existing = alchemy.herbs.find(h => h.itemId === herbId)
    if (existing) {
      existing.quantity += amount
    } else {
      alchemy.herbs.push({
        id: `herb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: 'herb',
        itemId: herbId,
        quantity: amount
      })
    }
  }

  addPill(alchemy: AlchemyData, pillId: string, amount: number = 1): void {
    const existing = alchemy.pills.find(p => p.itemId === pillId)
    if (existing) {
      existing.quantity += amount
    } else {
      alchemy.pills.push({
        id: `pill_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: 'pill',
        itemId: pillId,
        quantity: amount
      })
    }
  }

  removeHerb(alchemy: AlchemyData, herbId: string, amount: number = 1): boolean {
    const existing = alchemy.herbs.find(h => h.itemId === herbId)
    if (!existing || existing.quantity < amount) return false
    existing.quantity -= amount
    if (existing.quantity <= 0) {
      alchemy.herbs = alchemy.herbs.filter(h => h.itemId !== herbId)
    }
    return true
  }

  removePill(alchemy: AlchemyData, pillId: string, amount: number = 1): boolean {
    const existing = alchemy.pills.find(p => p.itemId === pillId)
    if (!existing || existing.quantity < amount) return false
    existing.quantity -= amount
    if (existing.quantity <= 0) {
      alchemy.pills = alchemy.pills.filter(p => p.itemId !== pillId)
    }
    return true
  }

  getHerbQuantity(alchemy: AlchemyData, herbId: string): number {
    const item = alchemy.herbs.find(h => h.itemId === herbId)
    return item ? item.quantity : 0
  }

  getPillQuantity(alchemy: AlchemyData, pillId: string): number {
    const item = alchemy.pills.find(p => p.itemId === pillId)
    return item ? item.quantity : 0
  }

  checkRecipeUnlock(alchemy: AlchemyData, playerLevel: number): string[] {
    const newUnlocked: string[] = []
    RECIPES.forEach(recipe => {
      if (
        !alchemy.unlockedRecipes.includes(recipe.id) &&
        playerLevel >= recipe.unlockLevel
      ) {
        alchemy.unlockedRecipes.push(recipe.id)
        newUnlocked.push(recipe.id)
      }
    })
    return newUnlocked
  }

  canCraft(alchemy: AlchemyData, recipeId: string, playerGold: number, playerSpirit: number): { canCraft: boolean; reason?: string } {
    const recipe = getRecipeById(recipeId)
    if (!recipe) return { canCraft: false, reason: '丹方不存在' }
    if (!alchemy.unlockedRecipes.includes(recipeId)) {
      return { canCraft: false, reason: '丹方尚未解锁' }
    }
    for (const mat of recipe.materials) {
      if (this.getHerbQuantity(alchemy, mat.herbId) < mat.amount) {
        const herb = getHerbById(mat.herbId)
        return { canCraft: false, reason: `${herb?.name || mat.herbId}不足` }
      }
    }
    if (playerGold < recipe.goldCost) {
      return { canCraft: false, reason: '金币不足' }
    }
    if (playerSpirit < recipe.spiritCost) {
      return { canCraft: false, reason: '灵气不足' }
    }
    return { canCraft: true }
  }

  calculateSuccessRate(recipe: Recipe, playerLevel: number): number {
    let rate = recipe.baseSuccessRate
    const levelBonus = Math.max(0, playerLevel - recipe.unlockLevel) * 0.02
    rate = Math.min(0.98, rate + levelBonus)
    return rate
  }

  craft(alchemy: AlchemyData, recipeId: string, player: Player): AlchemyResult {
    const recipe = getRecipeById(recipeId)
    if (!recipe) return { success: false, reason: '丹方不存在' }

    const check = this.canCraft(alchemy, recipeId, player.gold, player.spirit)
    if (!check.canCraft) {
      return { success: false, reason: check.reason || '无法炼制' }
    }

    for (const mat of recipe.materials) {
      this.removeHerb(alchemy, mat.herbId, mat.amount)
    }
    player.gold -= recipe.goldCost
    player.spirit -= recipe.spiritCost

    const successRate = this.calculateSuccessRate(recipe, player.level)
    const roll = Math.random()

    if (roll < successRate) {
      const pill = getPillById(recipe.resultPillId)
      if (!pill) return { success: false, reason: '丹药数据错误' }
      this.addPill(alchemy, recipe.resultPillId, recipe.resultAmount)
      return { success: true, pill, amount: recipe.resultAmount }
    } else {
      return { success: false, reason: '炼制失败，材料已损耗', lostMaterials: true }
    }
  }

  usePill(alchemy: AlchemyData, pillId: string, player: Player): { success: boolean; effects: string[]; reason?: string } {
    const pill = getPillById(pillId)
    if (!pill) return { success: false, effects: [], reason: '丹药不存在' }

    if (this.getPillQuantity(alchemy, pillId) < 1) {
      return { success: false, effects: [], reason: '丹药数量不足' }
    }

    if (!pill.stackable) {
      const activeBuff = alchemy.activeBuffs.find(b => b.pillId === pillId)
      if (activeBuff && activeBuff.endTime > Date.now()) {
        return { success: false, effects: [], reason: '该丹药效果正在生效中' }
      }
    }

    this.removePill(alchemy, pillId, 1)

    const effects: string[] = []
    const now = Date.now()

    for (const effect of pill.effects) {
      switch (effect.type) {
        case 'heal':
          player.health = Math.min(player.maxHealth, player.health + effect.value)
          effects.push(`恢复生命 +${effect.value}`)
          break
        case 'manaRestore':
          player.mana = Math.min(player.maxMana, player.mana + effect.value)
          effects.push(`恢复灵力 +${effect.value}`)
          break
        case 'exp':
          const saveManager = SaveManager.getInstance()
          saveManager.addExp(player, effect.value)
          effects.push(`获得经验 +${effect.value}`)
          break
        case 'health':
          player.maxHealth += effect.value
          player.health += effect.value
          effects.push(`最大生命永久 +${effect.value}`)
          break
        case 'attack':
        case 'defense':
          if (effect.duration) {
            const existingBuff = alchemy.activeBuffs.find(b => b.pillId === pillId)
            if (existingBuff) {
              existingBuff.endTime = now + effect.duration
            } else {
              alchemy.activeBuffs.push({
                pillId,
                effects: pill.effects.filter(e => e.duration),
                endTime: now + effect.duration
              })
            }
            const effectName = effect.type === 'attack' ? '攻击' : '防御'
            effects.push(`${effectName} +${effect.value}（${Math.floor(effect.duration / 60000)}分钟）`)
          }
          break
      }
    }

    return { success: true, effects }
  }

  getActiveBuffs(alchemy: AlchemyData): ActivePillBuff[] {
    const now = Date.now()
    alchemy.activeBuffs = alchemy.activeBuffs.filter(b => b.endTime > now)
    return alchemy.activeBuffs
  }

  getBuffBonus(alchemy: AlchemyData): { attack: number; defense: number } {
    const buffs = this.getActiveBuffs(alchemy)
    let attack = 0
    let defense = 0
    for (const buff of buffs) {
      for (const effect of buff.effects) {
        if (effect.type === 'attack') attack += effect.value
        if (effect.type === 'defense') defense += effect.value
      }
    }
    return { attack, defense }
  }

  rollHerbDrops(stageId: number): { herbId: string; amount: number }[] {
    const drops: { herbId: string; amount: number }[] = []
    const table = HERB_DROP_TABLE[stageId] || HERB_DROP_TABLE[1]

    for (const entry of table) {
      if (Math.random() < entry.chance) {
        const amount =
          Math.floor(Math.random() * (entry.maxAmount - entry.minAmount + 1)) +
          entry.minAmount
        drops.push({ herbId: entry.herbId, amount })
      }
    }

    return drops
  }

  applyHerbDrops(alchemy: AlchemyData, drops: { herbId: string; amount: number }[]): string[] {
    const result: string[] = []
    for (const drop of drops) {
      this.addHerb(alchemy, drop.herbId, drop.amount)
      const herb = getHerbById(drop.herbId)
      if (herb) {
        result.push(`${herb.icon} ${herb.name} x${drop.amount}`)
      }
    }
    return result
  }

  getUnlockedRecipes(alchemy: AlchemyData): Recipe[] {
    return RECIPES.filter(r => alchemy.unlockedRecipes.includes(r.id))
  }

  getAllRecipesWithUnlockStatus(alchemy: AlchemyData, playerLevel: number): (Recipe & { isUnlocked: boolean; canUnlock: boolean })[] {
    return RECIPES.map(r => ({
      ...r,
      isUnlocked: alchemy.unlockedRecipes.includes(r.id),
      canUnlock: playerLevel >= r.unlockLevel && !alchemy.unlockedRecipes.includes(r.id)
    }))
  }
}
