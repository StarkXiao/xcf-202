import type { Player, Skill } from '../types'

export class SkillSystem {
  static canUseSkill(player: Player, skill: Skill): boolean {
    if (player.level < skill.unlockLevel) return false
    if (player.mana < skill.manaCost) return false
    if (skill.currentCooldown > 0) return false
    return true
  }

  static useSkill(player: Player, skill: Skill): number | null {
    if (!this.canUseSkill(player, skill)) return null

    player.mana -= skill.manaCost
    skill.currentCooldown = skill.cooldown

    const baseDamage = skill.damage
    const attackMultiplier = player.attack * 0.5
    const totalDamage = Math.floor(baseDamage + attackMultiplier)

    return totalDamage
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
