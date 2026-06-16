import type {
  EquipmentData,
  Equipment,
  EquipmentTemplate,
  EquipmentStat,
  ForgeResult,
  AdvanceResult,
  Player,
  EquipmentQuality,
  StatType,
  EquipmentBonus
} from '../types'
import {
  EQUIPMENT_TEMPLATES,
  getEquipmentTemplateById,
  getMaterialById,
  getNextQuality,
  getAdvanceCost,
  QUALITY_STAT_MULTIPLIER,
  QUALITY_EXTRA_STAT_COUNT,
  QUALITY_COLORS,
  QUALITY_NAMES,
  STAT_POOL,
  MATERIAL_DROP_TABLE
} from '../data/equipmentData'

const SLOT_NAMES: Record<string, string> = {
  weapon: '武器',
  armor: '护甲',
  helmet: '头盔',
  boots: '靴子',
  ring: '戒指',
  necklace: '项链'
}

export class EquipmentManager {
  private static instance: EquipmentManager

  static getInstance(): EquipmentManager {
    if (!EquipmentManager.instance) {
      EquipmentManager.instance = new EquipmentManager()
    }
    return EquipmentManager.instance
  }

  createInitialEquipmentData(): EquipmentData {
    return {
      materials: [],
      equipments: [],
      equipped: [null, null, null, null, null, null],
      unlockedTemplates: ['iron_sword', 'leather_armor', 'iron_helmet', 'iron_boots', 'iron_ring', 'iron_necklace']
    }
  }

  validateEquipmentData(data: EquipmentData | undefined): EquipmentData {
    if (!data) {
      return this.createInitialEquipmentData()
    }
    if (!data.materials) data.materials = []
    if (!data.equipments) data.equipments = []
    if (!data.equipped) {
      data.equipped = [null, null, null, null, null, null]
    }
    if (!data.unlockedTemplates) {
      data.unlockedTemplates = ['iron_sword', 'leather_armor', 'iron_helmet', 'iron_boots', 'iron_ring', 'iron_necklace']
    }
    return data
  }

  addMaterial(data: EquipmentData, materialId: string, amount: number = 1): void {
    const existing = data.materials.find(m => m.materialId === materialId)
    if (existing) {
      existing.quantity += amount
    } else {
      data.materials.push({ materialId, quantity: amount })
    }
  }

  removeMaterial(data: EquipmentData, materialId: string, amount: number = 1): boolean {
    const existing = data.materials.find(m => m.materialId === materialId)
    if (!existing || existing.quantity < amount) return false
    existing.quantity -= amount
    if (existing.quantity <= 0) {
      data.materials = data.materials.filter(m => m.materialId !== materialId)
    }
    return true
  }

  getMaterialQuantity(data: EquipmentData, materialId: string): number {
    const item = data.materials.find(m => m.materialId === materialId)
    return item ? item.quantity : 0
  }

  rollMaterialDrops(stageId: number): { materialId: string; amount: number }[] {
    const drops: { materialId: string; amount: number }[] = []
    const table = MATERIAL_DROP_TABLE[stageId] || MATERIAL_DROP_TABLE[1]

    for (const entry of table) {
      if (Math.random() < entry.chance) {
        const amount = Math.floor(Math.random() * (entry.maxAmount - entry.minAmount + 1)) + entry.minAmount
        drops.push({ materialId: entry.materialId, amount })
      }
    }

    return drops
  }

  applyMaterialDrops(data: EquipmentData, drops: { materialId: string; amount: number }[]): string[] {
    const result: string[] = []
    for (const drop of drops) {
      this.addMaterial(data, drop.materialId, drop.amount)
      const material = getMaterialById(drop.materialId)
      if (material) {
        result.push(`${material.icon} ${material.name} x${drop.amount}`)
      }
    }
    return result
  }

  checkTemplateUnlock(data: EquipmentData, highestStage: number): string[] {
    const newUnlocked: string[] = []
    EQUIPMENT_TEMPLATES.forEach(template => {
      if (
        !data.unlockedTemplates.includes(template.id) &&
        highestStage >= template.minStage
      ) {
        data.unlockedTemplates.push(template.id)
        newUnlocked.push(template.id)
      }
    })
    return newUnlocked
  }

  private generateRandomStat(): EquipmentStat {
    const statTemplate = STAT_POOL[Math.floor(Math.random() * STAT_POOL.length)]
    let value: number
    if (statTemplate.isPercentage) {
      value = 0.02 + Math.random() * 0.08
    } else {
      if (statTemplate.type === 'maxHealth') {
        value = 10 + Math.floor(Math.random() * 30)
      } else if (statTemplate.type === 'maxMana') {
        value = 5 + Math.floor(Math.random() * 15)
      } else {
        value = 3 + Math.floor(Math.random() * 10)
      }
    }
    return {
      type: statTemplate.type,
      value,
      isPercentage: statTemplate.isPercentage
    }
  }

  canForge(data: EquipmentData, templateId: string, playerGold: number, playerSpirit: number): { canForge: boolean; reason?: string } {
    const template = getEquipmentTemplateById(templateId)
    if (!template) return { canForge: false, reason: '装备图纸不存在' }
    if (!data.unlockedTemplates.includes(templateId)) {
      return { canForge: false, reason: '装备图纸尚未解锁' }
    }
    for (const mat of template.craftMaterials) {
      if (this.getMaterialQuantity(data, mat.materialId) < mat.amount) {
        const material = getMaterialById(mat.materialId)
        return { canForge: false, reason: `${material?.name || mat.materialId}不足` }
      }
    }
    if (playerGold < template.goldCost) {
      return { canForge: false, reason: '金币不足' }
    }
    if (playerSpirit < template.spiritCost) {
      return { canForge: false, reason: '灵气不足' }
    }
    return { canForge: true }
  }

  forge(data: EquipmentData, templateId: string, player: Player): ForgeResult {
    const template = getEquipmentTemplateById(templateId)
    if (!template) return { success: false, reason: '装备图纸不存在' }

    const check = this.canForge(data, templateId, player.gold, player.spirit)
    if (!check.canForge) {
      return { success: false, reason: check.reason || '无法锻造' }
    }

    for (const mat of template.craftMaterials) {
      this.removeMaterial(data, mat.materialId, mat.amount)
    }
    player.gold -= template.goldCost
    player.spirit -= template.spiritCost

    const qualityRoll = Math.random()
    let quality: EquipmentQuality = template.baseQuality
    const qualityIndex = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'].indexOf(template.baseQuality)
    
    if (qualityRoll < 0.05) {
      quality = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'][Math.min(qualityIndex + 2, 5)] as EquipmentQuality
    } else if (qualityRoll < 0.2) {
      quality = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'][Math.min(qualityIndex + 1, 5)] as EquipmentQuality
    }

    const multiplier = QUALITY_STAT_MULTIPLIER[quality]
    const extraStatCount = QUALITY_EXTRA_STAT_COUNT[quality]

    const baseStats: EquipmentStat[] = template.baseStats.map(stat => ({
      ...stat,
      value: Math.floor(stat.value * multiplier)
    }))

    const extraStats: EquipmentStat[] = []
    for (let i = 0; i < extraStatCount; i++) {
      extraStats.push(this.generateRandomStat())
    }

    const equipment: Equipment = {
      id: `equip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      templateId: template.id,
      name: template.name,
      slot: template.slot,
      quality,
      level: 1,
      maxLevel: 10,
      stats: baseStats,
      extraStats,
      icon: template.icon,
      color: QUALITY_COLORS[quality],
      isEquipped: false,
      equipPosition: null,
      forgeCount: 0
    }

    data.equipments.push(equipment)

    return { success: true, equipment }
  }

  canAdvance(data: EquipmentData, equipment: Equipment, playerGold: number, playerSpirit: number): { canAdvance: boolean; reason?: string } {
    const nextQuality = getNextQuality(equipment.quality)
    if (!nextQuality) {
      return { canAdvance: false, reason: '已达最高品质' }
    }
    const cost = getAdvanceCost(equipment.quality)
    if (this.getMaterialQuantity(data, cost.materialId) < cost.amount) {
      const material = getMaterialById(cost.materialId)
      return { canAdvance: false, reason: `${material?.name || cost.materialId}不足` }
    }
    if (playerGold < cost.gold) {
      return { canAdvance: false, reason: '金币不足' }
    }
    if (playerSpirit < cost.spirit) {
      return { canAdvance: false, reason: '灵气不足' }
    }
    return { canAdvance: true }
  }

  advanceQuality(data: EquipmentData, equipment: Equipment, player: Player): AdvanceResult {
    const nextQuality = getNextQuality(equipment.quality)
    if (!nextQuality) {
      return { success: false, reason: '已达最高品质' }
    }

    const check = this.canAdvance(data, equipment, player.gold, player.spirit)
    if (!check.canAdvance) {
      return { success: false, reason: check.reason || '无法进阶' }
    }

    const cost = getAdvanceCost(equipment.quality)
    this.removeMaterial(data, cost.materialId, cost.amount)
    player.gold -= cost.gold
    player.spirit -= cost.spirit

    const successRate = 0.6
    if (Math.random() < successRate) {
      equipment.quality = nextQuality
      equipment.color = QUALITY_COLORS[nextQuality]
      equipment.name = `${QUALITY_NAMES[nextQuality]}·${equipment.name.replace(/^.+·/, '')}`

      const multiplier = QUALITY_STAT_MULTIPLIER[nextQuality] / QUALITY_STAT_MULTIPLIER[
        ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'][
          ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'].indexOf(nextQuality) - 1
        ] as EquipmentQuality
      ]

      equipment.stats.forEach(stat => {
        stat.value = Math.floor(stat.value * multiplier)
      })

      if (QUALITY_EXTRA_STAT_COUNT[nextQuality] > QUALITY_EXTRA_STAT_COUNT[
        ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'][
          ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'].indexOf(nextQuality) - 1
        ] as EquipmentQuality
      ]) {
        equipment.extraStats.push(this.generateRandomStat())
      }

      equipment.forgeCount++

      return { success: true, newQuality: nextQuality }
    } else {
      return { success: false, reason: '进阶失败，材料已损耗' }
    }
  }

  private getSlotIndex(slot: string): number {
    const slots = ['weapon', 'armor', 'helmet', 'boots', 'ring', 'necklace']
    return slots.indexOf(slot)
  }

  equip(data: EquipmentData, equipment: Equipment): void {
    const slotIndex = this.getSlotIndex(equipment.slot)
    if (slotIndex === -1) return

    const currentEquipped = data.equipped[slotIndex]
    if (currentEquipped) {
      const oldEquip = data.equipments.find(e => e.id === currentEquipped)
      if (oldEquip) {
        oldEquip.isEquipped = false
        oldEquip.equipPosition = null
      }
    }

    equipment.isEquipped = true
    equipment.equipPosition = slotIndex
    data.equipped[slotIndex] = equipment.id
  }

  unequip(data: EquipmentData, equipment: Equipment): void {
    if (!equipment.isEquipped || equipment.equipPosition === null) return

    data.equipped[equipment.equipPosition] = null
    equipment.isEquipped = false
    equipment.equipPosition = null
  }

  getEquippedEquipments(data: EquipmentData): (Equipment | null)[] {
    return data.equipped.map(id => 
      id ? data.equipments.find(e => e.id === id) || null : null
    )
  }

  calculateEquipmentBonus(data: EquipmentData): EquipmentBonus {
    const bonus: EquipmentBonus = {
      attack: 0,
      defense: 0,
      maxHealth: 0,
      maxMana: 0,
      critRate: 0,
      critDamage: 0
    }

    const equipped = this.getEquippedEquipments(data)
    
    for (const equip of equipped) {
      if (!equip) continue

      const allStats = [...equip.stats, ...equip.extraStats]
      for (const stat of allStats) {
        if (stat.isPercentage) {
          bonus[stat.type] += stat.value
        } else {
          bonus[stat.type] += stat.value * (1 + equip.level * 0.1)
        }
      }
    }

    return bonus
  }

  applyEquipmentBonus(player: Player, bonus: EquipmentBonus): void {
    player.maxHealth += Math.floor(bonus.maxHealth * (1 + bonus.maxHealth))
    player.maxMana += Math.floor(bonus.maxMana * (1 + bonus.maxMana))
    player.attack += Math.floor(bonus.attack * (1 + bonus.attack))
    player.defense += Math.floor(bonus.defense * (1 + bonus.defense))
  }

  getUnlockedTemplates(data: EquipmentData): EquipmentTemplate[] {
    return EQUIPMENT_TEMPLATES.filter(t => data.unlockedTemplates.includes(t.id))
  }

  getSlotName(slot: string): string {
    return SLOT_NAMES[slot] || slot
  }

  getQualityName(quality: EquipmentQuality): string {
    return QUALITY_NAMES[quality]
  }
}
