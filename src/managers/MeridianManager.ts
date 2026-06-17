import type {
  MeridianData,
  MeridianNode,
  MeridianNodeTemplate,
  MeridianBonus,
  BreakthroughResult,
  MeridianRealm,
  Player,
  Skill,
  SkillBranch,
  EquipmentData,
  BreakthroughMaterial
} from '../types'
import {
  MERIDIAN_REALMS,
  MERIDIAN_REALM_ORDER,
  MERIDIAN_NODE_TEMPLATES,
  MERIDIAN_SKILL_UNLOCKS
} from '../data/meridianData'
import { EquipmentManager } from './EquipmentManager'

export class MeridianManager {
  private static instance: MeridianManager

  static getInstance(): MeridianManager {
    if (!MeridianManager.instance) {
      MeridianManager.instance = new MeridianManager()
    }
    return MeridianManager.instance
  }

  createInitialMeridianData(): MeridianData {
    const nodes: MeridianNode[] = MERIDIAN_NODE_TEMPLATES.map((t) => ({
      templateId: t.id,
      activated: false,
      activationTime: null
    }))

    return {
      currentRealm: 'qi_refining',
      highestRealm: 'qi_refining',
      nodes,
      unlockedSkillIds: [],
      breakthroughAttempts: 0,
      lastBreakthroughTime: null
    }
  }

  validateMeridianData(meridian: any): MeridianData {
    if (!meridian) {
      return this.createInitialMeridianData()
    }
    const defaults = this.createInitialMeridianData()
    const validated = {
      ...defaults,
      ...meridian,
      nodes: meridian.nodes || defaults.nodes,
      unlockedSkillIds: meridian.unlockedSkillIds || []
    }

    const templateIds = new Set(MERIDIAN_NODE_TEMPLATES.map((t) => t.id))
    validated.nodes = validated.nodes.filter((n: MeridianNode) => templateIds.has(n.templateId))

    for (const template of MERIDIAN_NODE_TEMPLATES) {
      if (!validated.nodes.find((n: MeridianNode) => n.templateId === template.id)) {
        validated.nodes.push({
          templateId: template.id,
          activated: false,
          activationTime: null
        })
      }
    }

    return validated
  }

  getNodesForRealm(realm: MeridianRealm): MeridianNodeTemplate[] {
    return MERIDIAN_NODE_TEMPLATES.filter((t) => t.realm === realm)
  }

  getNodeTemplate(templateId: string): MeridianNodeTemplate | undefined {
    return MERIDIAN_NODE_TEMPLATES.find((t) => t.id === templateId)
  }

  getRealmInfo(realm: MeridianRealm) {
    return MERIDIAN_REALMS[realm]
  }

  getNextRealm(realm: MeridianRealm): MeridianRealm | null {
    const idx = MERIDIAN_REALM_ORDER.indexOf(realm)
    if (idx < 0 || idx >= MERIDIAN_REALM_ORDER.length - 1) return null
    return MERIDIAN_REALM_ORDER[idx + 1]
  }

  getRealmOrder(realm: MeridianRealm): number {
    return MERIDIAN_REALM_ORDER.indexOf(realm)
  }

  isNodeUnlocked(meridian: MeridianData, template: MeridianNodeTemplate): boolean {
    if (this.getRealmOrder(template.realm) > this.getRealmOrder(meridian.currentRealm)) {
      return false
    }
    if (template.requiredNodes.length === 0) return true
    return template.requiredNodes.every((reqId) => {
      const node = meridian.nodes.find((n) => n.templateId === reqId)
      return node && node.activated
    })
  }

  canActivateNode(meridian: MeridianData, templateId: string, player: Player): { can: boolean; reason: string } {
    const template = this.getNodeTemplate(templateId)
    if (!template) return { can: false, reason: '节点不存在' }

    const node = meridian.nodes.find((n) => n.templateId === templateId)
    if (!node) return { can: false, reason: '节点数据不存在' }
    if (node.activated) return { can: false, reason: '节点已激活' }

    if (!this.isNodeUnlocked(meridian, template)) {
      return { can: false, reason: '前置节点未激活' }
    }

    const realmNodes = this.getNodesForRealm(template.realm)
    const activatedInRealm = meridian.nodes.filter(
      (n) => {
        const t = this.getNodeTemplate(n.templateId)
        return t && t.realm === template.realm && n.activated
      }
    ).length
    const realmInfo = this.getRealmInfo(template.realm)
    if (activatedInRealm >= realmInfo.maxNodes) {
      return { can: false, reason: '当前境界节点已满' }
    }

    if (player.spirit < template.spiritCost) {
      return { can: false, reason: `灵气不足，需要 ${template.spiritCost}` }
    }

    return { can: true, reason: '' }
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

  private buildMeridianSkill(skillUnlock: any): Skill {
    return {
      id: skillUnlock.id,
      name: skillUnlock.name,
      description: skillUnlock.description,
      damage: skillUnlock.damage,
      cooldown: skillUnlock.cooldown,
      currentCooldown: 0,
      manaCost: skillUnlock.manaCost,
      unlockLevel: 1,
      color: skillUnlock.color,
      icon: skillUnlock.icon,
      level: 1,
      maxLevel: 10,
      exp: 0,
      expToNext: 50,
      branches: this.createSkillBranches(skillUnlock.id, skillUnlock.color),
      selectedBranchIds: [],
      branchUnlockedLevels: [3, 6]
    }
  }

  activateNode(meridian: MeridianData, templateId: string, player: Player): { success: boolean; message: string; unlockedSkill?: Skill } {
    const check = this.canActivateNode(meridian, templateId, player)
    if (!check.can) {
      return { success: false, message: check.reason }
    }

    const template = this.getNodeTemplate(templateId)!
    const node = meridian.nodes.find((n) => n.templateId === templateId)!

    player.spirit -= template.spiritCost
    node.activated = true
    node.activationTime = Date.now()

    let unlockedSkill: Skill | undefined
    if (template.type === 'skill' && template.unlockSkillId) {
      const skillUnlock = MERIDIAN_SKILL_UNLOCKS.find((s) => s.id === template.unlockSkillId)
      if (skillUnlock && !meridian.unlockedSkillIds.includes(template.unlockSkillId)) {
        meridian.unlockedSkillIds.push(template.unlockSkillId)
        unlockedSkill = this.buildMeridianSkill(skillUnlock)
      }
    }

    return {
      success: true,
      message: `成功激活【${template.name}】！`,
      unlockedSkill
    }
  }

  canBreakthrough(meridian: MeridianData, player: Player, equipment?: EquipmentData): { can: boolean; reason: string } {
    const nextRealm = this.getNextRealm(meridian.currentRealm)
    if (!nextRealm) return { can: false, reason: '已达最高境界' }

    const nextRealmInfo = this.getRealmInfo(nextRealm)
    if (player.level < nextRealmInfo.requiredLevel) {
      return { can: false, reason: `等级不足，需要 Lv.${nextRealmInfo.requiredLevel}` }
    }

    const curRealm = this.getRealmInfo(meridian.currentRealm)
    const activatedInCur = meridian.nodes.filter((n) => {
      const t = this.getNodeTemplate(n.templateId)
      return t && t.realm === meridian.currentRealm && n.activated
    }).length

    const requiredNodes = Math.ceil(curRealm.maxNodes * 0.6)
    if (activatedInCur < requiredNodes) {
      return { can: false, reason: `需激活至少 ${requiredNodes} 个当前境界节点（已激活 ${activatedInCur}）` }
    }

    if (player.spirit < nextRealmInfo.breakthroughSpiritCost) {
      return { can: false, reason: `灵气不足，需要 ${nextRealmInfo.breakthroughSpiritCost}` }
    }

    if (nextRealmInfo.breakthroughGoldCost > 0 && player.gold < nextRealmInfo.breakthroughGoldCost) {
      return { can: false, reason: `金币不足，需要 ${nextRealmInfo.breakthroughGoldCost}` }
    }

    if (equipment && nextRealmInfo.breakthroughMaterials.length > 0) {
      const equipmentManager = EquipmentManager.getInstance()
      for (const mat of nextRealmInfo.breakthroughMaterials) {
        const have = equipmentManager.getMaterialQuantity(equipment, mat.materialId)
        if (have < mat.amount) {
          return { can: false, reason: `${mat.name}不足，需要 ${mat.amount}（当前 ${have}）` }
        }
      }
    }

    return { can: true, reason: '' }
  }

  attemptBreakthrough(meridian: MeridianData, player: Player, equipment?: EquipmentData): BreakthroughResult {
    const check = this.canBreakthrough(meridian, player, equipment)
    const prevRealm = meridian.currentRealm
    const nextRealm = this.getNextRealm(prevRealm)

    if (!check.can || !nextRealm) {
      return {
        success: false,
        previousRealm: prevRealm,
        message: check.reason || '无法突破',
        costSpent: 0,
        goldSpent: 0,
        materialsSpent: []
      }
    }

    const nextRealmInfo = this.getRealmInfo(nextRealm)
    const cost = nextRealmInfo.breakthroughSpiritCost
    const goldCost = nextRealmInfo.breakthroughGoldCost
    const materialsSpent: BreakthroughMaterial[] = []

    player.spirit -= cost
    if (goldCost > 0) {
      player.gold -= goldCost
    }

    if (equipment && nextRealmInfo.breakthroughMaterials.length > 0) {
      const equipmentManager = EquipmentManager.getInstance()
      for (const mat of nextRealmInfo.breakthroughMaterials) {
        equipmentManager.removeMaterial(equipment, mat.materialId, mat.amount)
        materialsSpent.push({ ...mat })
      }
    }

    meridian.breakthroughAttempts++
    meridian.lastBreakthroughTime = Date.now()

    const bonusFromFailures = Math.min(meridian.breakthroughAttempts * 3, 30)
    const finalRate = Math.min(nextRealmInfo.breakthroughSuccessRate + bonusFromFailures, 95)
    const roll = Math.random() * 100

    if (roll < finalRate) {
      meridian.currentRealm = nextRealm
      if (this.getRealmOrder(nextRealm) > this.getRealmOrder(meridian.highestRealm)) {
        meridian.highestRealm = nextRealm
      }
      meridian.breakthroughAttempts = 0
      return {
        success: true,
        previousRealm: prevRealm,
        newRealm: nextRealm,
        message: `恭喜突破至【${nextRealmInfo.name}】！`,
        costSpent: cost,
        goldSpent: goldCost,
        materialsSpent,
        statGains: {
          maxHealth: nextRealmInfo.statBonuses.maxHealth,
          maxMana: nextRealmInfo.statBonuses.maxMana,
          attack: nextRealmInfo.statBonuses.attack,
          defense: nextRealmInfo.statBonuses.defense,
          critRate: nextRealmInfo.statBonuses.critRate,
          critDamage: nextRealmInfo.statBonuses.critDamage
        },
        story: nextRealmInfo.breakthroughStory
      }
    } else {
      return {
        success: false,
        previousRealm: prevRealm,
        message: `突破失败！成功率：${finalRate.toFixed(0)}%，下次成功率提升`,
        costSpent: cost,
        goldSpent: goldCost,
        materialsSpent
      }
    }
  }

  calculateMeridianBonus(meridian: MeridianData): MeridianBonus {
    const bonus: MeridianBonus = {
      maxHealth: 0,
      maxMana: 0,
      attack: 0,
      defense: 0,
      critRate: 0,
      critDamage: 0
    }

    const curRealmInfo = this.getRealmInfo(meridian.currentRealm)
    bonus.maxHealth += curRealmInfo.statBonuses.maxHealth
    bonus.maxMana += curRealmInfo.statBonuses.maxMana
    bonus.attack += curRealmInfo.statBonuses.attack
    bonus.defense += curRealmInfo.statBonuses.defense

    for (const node of meridian.nodes) {
      if (!node.activated) continue
      const template = this.getNodeTemplate(node.templateId)
      if (!template || !template.statValue) continue

      switch (template.type) {
        case 'attack':
          bonus.attack += template.statValue
          break
        case 'defense':
          bonus.defense += template.statValue
          break
        case 'health':
          bonus.maxHealth += template.statValue
          break
        case 'mana':
          bonus.maxMana += template.statValue
          break
        case 'crit_rate':
          bonus.critRate += template.statValue
          break
        case 'crit_damage':
          bonus.critDamage += template.statValue
          break
      }
    }

    return bonus
  }

  getActivatedCount(meridian: MeridianData, realm?: MeridianRealm): number {
    return meridian.nodes.filter((n) => {
      if (!n.activated) return false
      if (realm) {
        const t = this.getNodeTemplate(n.templateId)
        return t && t.realm === realm
      }
      return true
    }).length
  }

  getTotalNodesInRealm(realm: MeridianRealm): number {
    return this.getNodesForRealm(realm).length
  }

  syncSkillsToPlayer(meridian: MeridianData, player: Player): Skill[] {
    const newSkills: Skill[] = []
    for (const skillId of meridian.unlockedSkillIds) {
      if (!player.skills.find((s) => s.id === skillId)) {
        const skillUnlock = MERIDIAN_SKILL_UNLOCKS.find((s) => s.id === skillId)
        if (skillUnlock) {
          newSkills.push(this.buildMeridianSkill(skillUnlock))
        }
      }
    }
    return newSkills
  }
}
