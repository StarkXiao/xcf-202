import type { Player, Skill, ElementType, SkillBranch, SkillUpgradeResult, SkillBranchSelectResult } from '../types'
import { getElementMultiplier, calculateTreasureElementBonus } from '../data/fiveElementsData'

export interface SkillDamageResult {
  damage: number
  elementMultiplier: number
  treasureBonus: number
  isAdvantage: boolean
  isDisadvantage: boolean
}

export interface EffectiveSkillStats {
  damage: number
  cooldown: number
  manaCost: number
}

export class SkillSystem {
  static getLevelBonus(skill: Skill): { damageMultiplier: number; manaMultiplier: number; cooldownMultiplier: number } {
    const level = skill.level
    const damageMultiplier = 1 + (level - 1) * 0.12
    const manaMultiplier = 1 + (level - 1) * 0.05
    const cooldownMultiplier = Math.max(0.4, 1 - (level - 1) * 0.03)
    return { damageMultiplier, manaMultiplier, cooldownMultiplier }
  }

  static getBranchBonuses(skill: Skill): { damageBonus: number; cooldownReduction: number; manaCostReduction: number } {
    let damageBonus = 0
    let cooldownReduction = 0
    let manaCostReduction = 0

    skill.selectedBranchIds.forEach(branchId => {
      const branch = skill.branches.find(b => b.id === branchId)
      if (branch) {
        damageBonus += branch.damageBonus
        cooldownReduction += branch.cooldownReduction
        manaCostReduction += branch.manaCostReduction
      }
    })

    return { damageBonus, cooldownReduction, manaCostReduction }
  }

  static getEffectiveStats(skill: Skill): EffectiveSkillStats {
    const levelBonus = this.getLevelBonus(skill)
    const branchBonuses = this.getBranchBonuses(skill)

    const damage = Math.floor(skill.damage * levelBonus.damageMultiplier * (1 + branchBonuses.damageBonus))
    const manaCost = Math.max(0, Math.floor(skill.manaCost * levelBonus.manaMultiplier * (1 - branchBonuses.manaCostReduction)))
    const cooldown = Math.max(0, Math.floor(skill.cooldown * levelBonus.cooldownMultiplier * (1 - branchBonuses.cooldownReduction)))

    return { damage, manaCost, cooldown }
  }

  static canUseSkill(player: Player, skill: Skill): boolean {
    if (player.level < skill.unlockLevel) return false
    const effectiveStats = this.getEffectiveStats(skill)
    if (player.mana < effectiveStats.manaCost) return false
    if (skill.currentCooldown > 0) return false
    return true
  }

  static useSkill(player: Player, skill: Skill, targetElement?: ElementType): SkillDamageResult {
    if (!this.canUseSkill(player, skill)) return { damage: 0, elementMultiplier: 1, treasureBonus: 0, isAdvantage: false, isDisadvantage: false }

    const effectiveStats = this.getEffectiveStats(skill)
    player.mana -= effectiveStats.manaCost
    skill.currentCooldown = effectiveStats.cooldown

    const baseDamage = effectiveStats.damage
    const attackMultiplier = player.attack * 0.5
    const rawDamage = baseDamage + attackMultiplier

    const { multiplier, isAdvantage, isDisadvantage } = getElementMultiplier(skill.element, targetElement)
    const elementAdjusted = rawDamage * multiplier

    const treasureResult = calculateTreasureElementBonus(player.treasures, skill.element)
    const treasureBonus = treasureResult.totalBonus
    const finalDamage = Math.floor(elementAdjusted * (1 + treasureBonus))

    return {
      damage: finalDamage,
      elementMultiplier: multiplier,
      treasureBonus,
      isAdvantage,
      isDisadvantage
    }
  }

  static calculateRawDamage(player: Player, skill: Skill): number {
    const effectiveStats = this.getEffectiveStats(skill)
    const baseDamage = effectiveStats.damage
    const attackMultiplier = player.attack * 0.5
    return Math.floor(baseDamage + attackMultiplier)
  }

  static tickCooldowns(player: Player): void {
    player.skills.forEach((skill: Skill) => {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown--
      }
    })
  }

  static getUnlockedSkills(player: Player): Skill[] {
    return player.skills.filter((s: Skill) => player.level >= s.unlockLevel)
  }

  static restoreMana(player: Player, amount: number): void {
    player.mana = Math.min(player.mana + amount, player.maxMana)
  }

  static fullRestore(player: Player): void {
    player.health = player.maxHealth
    player.mana = player.maxMana
    player.skills.forEach((s: Skill) => {
      s.currentCooldown = 0
    })
  }

  static addSkillExp(skill: Skill, amount: number): SkillUpgradeResult {
    if (skill.level >= skill.maxLevel) {
      return { success: false, leveledUp: false, message: `${skill.name} 已达最高等级` }
    }

    skill.exp += amount
    let leveledUp = false
    let newLevel = skill.level
    let branchesAvailable: SkillBranch[] = []

    while (skill.exp >= skill.expToNext && skill.level < skill.maxLevel) {
      skill.exp -= skill.expToNext
      skill.level++
      newLevel = skill.level
      leveledUp = true
      skill.expToNext = Math.floor(50 * Math.pow(1.5, skill.level - 1))

      const newBranches = skill.branches.filter(b =>
        b.unlockLevel === skill.level && !skill.selectedBranchIds.some(id => {
          const br = skill.branches.find(x => x.id === id)
          return br && br.unlockLevel === b.unlockLevel
        })
      )
      branchesAvailable.push(...newBranches)
    }

    if (leveledUp) {
      return {
        success: true,
        leveledUp: true,
        newLevel,
        branchesAvailable: branchesAvailable.length > 0 ? branchesAvailable : undefined,
        message: `${skill.name} 升级到 Lv.${newLevel}！` + (branchesAvailable.length > 0 ? ' 可选择分支强化！' : '')
      }
    }

    return {
      success: true,
      leveledUp: false,
      message: `${skill.name} 获得 ${amount} 经验`
    }
  }

  static getAvailableBranches(skill: Skill): SkillBranch[] {
    return skill.branches.filter(branch => {
      if (skill.selectedBranchIds.includes(branch.id)) return false
      if (skill.level < branch.unlockLevel) return false
      const hasSameLevelBranch = skill.selectedBranchIds.some(id => {
        const br = skill.branches.find(b => b.id === id)
        return br && br.unlockLevel === branch.unlockLevel
      })
      return !hasSameLevelBranch
    })
  }

  static selectBranch(skill: Skill, branchId: string): SkillBranchSelectResult {
    const branch = skill.branches.find(b => b.id === branchId)
    if (!branch) {
      return { success: false, message: '分支不存在' }
    }

    if (skill.selectedBranchIds.includes(branchId)) {
      return { success: false, message: '该分支已选择' }
    }

    if (skill.level < branch.unlockLevel) {
      return { success: false, message: `需要技能等级达到 ${branch.unlockLevel} 级` }
    }

    const hasSameLevelBranch = skill.selectedBranchIds.some(id => {
      const br = skill.branches.find(b => b.id === id)
      return br && br.unlockLevel === branch.unlockLevel
    })
    if (hasSameLevelBranch) {
      return { success: false, message: '该等级已选择过分支' }
    }

    skill.selectedBranchIds.push(branchId)

    return {
      success: true,
      branch,
      message: `选择分支【${branch.name}】成功！`
    }
  }

  static getSelectedBranches(skill: Skill): SkillBranch[] {
    return skill.selectedBranchIds
      .map(id => skill.branches.find(b => b.id === id))
      .filter((b): b is SkillBranch => b !== undefined)
  }

  static getUpgradeCost(skill: Skill): { gold: number; spirit: number } {
    const baseGold = 100
    const baseSpirit = 10
    return {
      gold: Math.floor(baseGold * Math.pow(1.4, skill.level - 1)),
      spirit: Math.floor(baseSpirit * Math.pow(1.3, skill.level - 1))
    }
  }

  static canAffordUpgrade(player: Player, skill: Skill): boolean {
    const cost = this.getUpgradeCost(skill)
    return player.gold >= cost.gold && player.spirit >= cost.spirit
  }

  static upgradeSkill(player: Player, skill: Skill): SkillUpgradeResult {
    if (skill.level >= skill.maxLevel) {
      return { success: false, leveledUp: false, message: `${skill.name} 已达最高等级` }
    }

    const cost = this.getUpgradeCost(skill)
    if (player.gold < cost.gold) {
      return { success: false, leveledUp: false, message: `金币不足！需要 ${cost.gold} 金币` }
    }
    if (player.spirit < cost.spirit) {
      return { success: false, leveledUp: false, message: `灵气不足！需要 ${cost.spirit} 灵气` }
    }

    player.gold -= cost.gold
    player.spirit -= cost.spirit

    skill.level++
    skill.exp = 0
    skill.expToNext = Math.floor(50 * Math.pow(1.5, skill.level - 1))

    const branchesAvailable = skill.branches.filter(b =>
      b.unlockLevel === skill.level && !skill.selectedBranchIds.some(id => {
        const br = skill.branches.find(x => x.id === id)
        return br && br.unlockLevel === b.unlockLevel
      })
    )

    return {
      success: true,
      leveledUp: true,
      newLevel: skill.level,
      branchesAvailable: branchesAvailable.length > 0 ? branchesAvailable : undefined,
      message: `${skill.name} 升级到 Lv.${skill.level}！` + (branchesAvailable.length > 0 ? ' 可选择分支强化！' : '')
    }
  }
}
