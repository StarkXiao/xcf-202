import type { Player, Skill, ElementType } from '../types'
import { getElementMultiplier } from '../data/fiveElementsData'

export interface SkillDamageResult {
  damage: number
  elementMultiplier: number
  isAdvantage: boolean
  isDisadvantage: boolean
}

export class SkillSystem {
  static canUseSkill(player: Player, skill: Skill): boolean {
    if (player.level < skill.unlockLevel) return false
    if (player.mana < skill.manaCost) return false
    if (skill.currentCooldown > 0) return false
    return true
  }

  static useSkill(player: Player, skill: Skill, targetElement?: ElementType): SkillDamageResult {
    if (!this.canUseSkill(player, skill)) return { damage: 0, elementMultiplier: 1, isAdvantage: false, isDisadvantage: false }

    player.mana -= skill.manaCost
    skill.currentCooldown = skill.cooldown

    const baseDamage = skill.damage
    const attackMultiplier = player.attack * 0.5
    const rawDamage = Math.floor(baseDamage + attackMultiplier)

    const { multiplier, isAdvantage, isDisadvantage } = getElementMultiplier(skill.element, targetElement)
    const finalDamage = Math.floor(rawDamage * multiplier)

    return {
      damage: finalDamage,
      elementMultiplier: multiplier,
      isAdvantage,
      isDisadvantage
    }
  }

  static calculateRawDamage(player: Player, skill: Skill): number {
    const baseDamage = skill.damage
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
}
