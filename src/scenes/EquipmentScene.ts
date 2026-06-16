import Phaser from 'phaser'
import type { Player, Equipment, EquipmentTemplate, EquipmentData } from '../types'
import { SaveManager } from '../managers/SaveManager'
import { AlchemyManager } from '../managers/AlchemyManager'
import { EquipmentManager } from '../managers/EquipmentManager'
import { getMaterialById, getAdvanceCost, QUALITY_NAMES } from '../data/equipmentData'

type TabType = 'forge' | 'inventory' | 'equip'

export class EquipmentScene extends Phaser.Scene {
  private saveManager = SaveManager.getInstance()
  private alchemyManager = AlchemyManager.getInstance()
  private equipmentManager = EquipmentManager.getInstance()
  private player!: Player
  private equipmentData!: EquipmentData
  private currentTab: TabType = 'forge'
  private selectedTemplate: EquipmentTemplate | null = null
  private selectedEquipment: Equipment | null = null
  private tabButtons: Phaser.GameObjects.Container[] = []
  private forgeCards: Phaser.GameObjects.Container[] = []
  private inventoryItems: Phaser.GameObjects.Container[] = []
  private equipSlots: Phaser.GameObjects.Container[] = []
  private detailPanel!: Phaser.GameObjects.Container
  private messageText!: Phaser.GameObjects.Text
  private goldText!: Phaser.GameObjects.Text
  private spiritText!: Phaser.GameObjects.Text
  private statsText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'EquipmentScene' })
  }

  init(): void {
    const save = this.saveManager.loadGame()!
    this.player = save.player
    this.equipmentData = save.equipment
    const permBonus = this.alchemyManager.getPermanentBonus(save.alchemy)
    const equipBonus = this.equipmentManager.calculateEquipmentBonus(this.equipmentData)
    this.saveManager.recalcPlayerStats(this.player, undefined, permBonus, equipBonus)
  }

  create(): void {
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor(0x0a0a15)
    this.createBackground(width, height)

    const title = this.add.text(width / 2, 50, '⚒️ 装备锻造', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '40px',
      color: '#ffd54f',
      stroke: '#5d4037',
      strokeThickness: 3
    }).setOrigin(0.5)

    this.goldText = this.add.text(30, 30, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#ffd54f'
    })

    this.spiritText = this.add.text(30, 60, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#4fc3f7'
    })

    this.statsText = this.add.text(width / 2, 95, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#81c784',
      align: 'center'
    }).setOrigin(0.5)

    this.messageText = this.add.text(width / 2, height - 50, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffd54f'
    }).setOrigin(0.5)

    this.updateResourceTexts()
    this.createTabs(width, height)
    this.createDetailPanel(width, height)
    this.createBackButton(width, height)
    this.showTab('forge')

    this.cameras.main.fadeIn(500)
  }

  private createBackground(width: number, height: number): void {
    for (let i = 0; i < 3; i++) {
      const glow = this.add.graphics()
      glow.fillStyle([0x1a237e, 0x4a148c, 0x0d47a1][i], 0.12)
      glow.fillCircle(
        width * (0.2 + i * 0.3),
        height * (0.3 + Math.random() * 0.4),
        200 + Math.random() * 100
      )
    }

    const particles = this.add.particles(0, 0, 'e-particle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: { min: 3000, max: 6000 },
      speedY: { min: -15, max: -30 },
      speedX: { min: -5, max: 5 },
      scale: { start: 0.25, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0xffd54f, 0xff7043, 0x81c784, 0x4fc3f7],
      quantity: 2,
      frequency: 250
    })
  }

  private createTabs(width: number, height: number): void {
    const tabConfigs = [
      { label: '⚒️ 锻造', type: 'forge' as TabType, color: 0xff7043 },
      { label: '🎒 背包', type: 'inventory' as TabType, color: 0x81c784 },
      { label: '👔 穿戴', type: 'equip' as TabType, color: 0x4fc3f7 }
    ]

    const tabWidth = 140
    const tabHeight = 50
    const startX = (width - (tabConfigs.length * tabWidth + (tabConfigs.length - 1) * 20)) / 2 + tabWidth / 2
    const y = 140

    tabConfigs.forEach((config, index) => {
      const x = startX + index * (tabWidth + 20)
      const btn = this.createTabButton(x, y, tabWidth, tabHeight, config.label, config.color, config.type)
      this.tabButtons.push(btn)
    })
  }

  private createTabButton(x: number, y: number, width: number, height: number, label: string, color: number, type: TabType): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.7)
    bg.lineStyle(2, color, 0.9)
    this.roundedRect(bg, -width / 2, -height / 2, width, height, 10)

    const text = this.add.text(0, 0, label, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(width, height)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.05, duration: 150 })
    })

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 150 })
    })

    container.on('pointerdown', () => this.showTab(type))

    return container
  }

  private showTab(type: TabType): void {
    this.currentTab = type
    this.selectedTemplate = null
    this.selectedEquipment = null
    this.clearContent()
    this.updateTabStyles()

    const { width, height } = this.scale

    if (type === 'forge') {
      this.createForgeContent(width, height)
    } else if (type === 'inventory') {
      this.createInventoryContent(width, height)
    } else if (type === 'equip') {
      this.createEquipContent(width, height)
    }

    this.updateDetailPanel()
  }

  private updateTabStyles(): void {
    const tabConfigs = [
      { type: 'forge' as TabType, color: 0xff7043 },
      { type: 'inventory' as TabType, color: 0x81c784 },
      { type: 'equip' as TabType, color: 0x4fc3f7 }
    ]

    this.tabButtons.forEach((btn, index) => {
      const config = tabConfigs[index]
      const isActive = this.currentTab === config.type
      const bg = btn.list[0] as Phaser.GameObjects.Graphics
      bg.clear()
      bg.fillStyle(isActive ? config.color : 0x000000, isActive ? 0.4 : 0.7)
      bg.lineStyle(2, config.color, isActive ? 1 : 0.5)
      this.roundedRect(bg, -70, -25, 140, 50, 10)
    })
  }

  private clearContent(): void {
    this.forgeCards.forEach(card => card.destroy())
    this.forgeCards = []
    this.inventoryItems.forEach(item => item.destroy())
    this.inventoryItems = []
    this.equipSlots.forEach(slot => slot.destroy())
    this.equipSlots = []
  }

  private createForgeContent(width: number, height: number): void {
    const templates = this.equipmentManager.getUnlockedTemplates(this.equipmentData)
    const cardWidth = 180
    const cardHeight = 220
    const cols = 4
    const spacing = 25
    const totalWidth = cols * cardWidth + (cols - 1) * spacing
    const startX = (width - totalWidth) / 2 + cardWidth / 2
    const startY = 220

    templates.forEach((template, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const x = startX + col * (cardWidth + spacing)
      const y = startY + row * (cardHeight + spacing)
      const card = this.createForgeCard(x, y, cardWidth, cardHeight, template)
      this.forgeCards.push(card)
    })
  }

  private createForgeCard(x: number, y: number, width: number, height: number, template: EquipmentTemplate): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.8)
    bg.lineStyle(3, template.color, 0.9)
    this.roundedRect(bg, -width / 2, -height / 2, width, height, 12)

    const iconBg = this.add.graphics()
    iconBg.fillStyle(template.color, 0.2)
    iconBg.fillCircle(0, -height / 2 + 55, 45)
    iconBg.lineStyle(2, template.color, 0.8)
    iconBg.strokeCircle(0, -height / 2 + 55, 45)

    const icon = this.add.text(0, -height / 2 + 55, template.icon, {
      fontFamily: 'serif',
      fontSize: '36px'
    }).setOrigin(0.5)

    const name = this.add.text(0, -height / 2 + 110, template.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const slot = this.add.text(0, -height / 2 + 135, this.equipmentManager.getSlotName(template.slot), {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#' + template.color.toString(16).padStart(6, '0')
    }).setOrigin(0.5)

    const statsText = template.baseStats.map(s => this.formatStat(s)).join(' ')
    const stats = this.add.text(0, -height / 2 + 160, statsText, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: '#81c784',
      align: 'center',
      wordWrap: { width: width - 20 }
    }).setOrigin(0.5)

    const check = this.equipmentManager.canForge(this.equipmentData, template.id, this.player.gold, this.player.spirit)
    const canForge = check.canForge

    const costText = this.add.text(0, height / 2 - 25, `💰${template.goldCost} ✨${template.spiritCost}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: canForge ? '#ffd54f' : '#ef5350'
    }).setOrigin(0.5)

    container.add([bg, iconBg, icon, name, slot, stats, costText])
    container.setSize(width, height)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.03, duration: 150 })
      bg.clear()
      bg.fillStyle(0x000000, 0.9)
      bg.lineStyle(4, template.color, 1)
      this.roundedRect(bg, -width / 2, -height / 2, width, height, 12)
    })

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 150 })
      bg.clear()
      bg.fillStyle(0x000000, 0.8)
      bg.lineStyle(3, template.color, 0.9)
      this.roundedRect(bg, -width / 2, -height / 2, width, height, 12)
    })

    container.on('pointerdown', () => {
      this.selectedTemplate = template
      this.selectedEquipment = null
      this.updateDetailPanel()
    })

    return container
  }

  private createInventoryContent(width: number, height: number): void {
    const equipments = this.equipmentData.equipments
    if (equipments.length === 0) {
      const text = this.add.text(width / 2, height * 0.5, '背包中暂无装备，快去锻造吧！', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '24px',
        color: '#78909c'
      }).setOrigin(0.5)
      this.inventoryItems.push(text as any)
      return
    }

    const cardWidth = 180
    const cardHeight = 220
    const cols = 4
    const spacing = 25
    const totalWidth = cols * cardWidth + (cols - 1) * spacing
    const startX = (width - totalWidth) / 2 + cardWidth / 2
    const startY = 220

    equipments.forEach((equipment, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const x = startX + col * (cardWidth + spacing)
      const y = startY + row * (cardHeight + spacing)
      const card = this.createEquipmentCard(x, y, cardWidth, cardHeight, equipment)
      this.inventoryItems.push(card)
    })
  }

  private createEquipmentCard(x: number, y: number, width: number, height: number, equipment: Equipment): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.8)
    bg.lineStyle(3, equipment.color, 0.9)
    this.roundedRect(bg, -width / 2, -height / 2, width, height, 12)

    if (equipment.isEquipped) {
      const equipMark = this.add.graphics()
      equipMark.fillStyle(0x81c784, 0.3)
      this.roundedRect(equipMark, -width / 2, -height / 2, width, height, 12)
      container.add(equipMark)
    }

    const iconBg = this.add.graphics()
    iconBg.fillStyle(equipment.color, 0.2)
    iconBg.fillCircle(0, -height / 2 + 55, 45)
    iconBg.lineStyle(2, equipment.color, 0.8)
    iconBg.strokeCircle(0, -height / 2 + 55, 45)

    const icon = this.add.text(0, -height / 2 + 55, equipment.icon, {
      fontFamily: 'serif',
      fontSize: '36px'
    }).setOrigin(0.5)

    const qualityName = QUALITY_NAMES[equipment.quality]
    const name = this.add.text(0, -height / 2 + 110, equipment.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#' + equipment.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const slot = this.add.text(0, -height / 2 + 135, `${qualityName} | ${this.equipmentManager.getSlotName(equipment.slot)}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: '#b0bec5'
    }).setOrigin(0.5)

    const allStats = [...equipment.stats, ...equipment.extraStats]
    const statsText = allStats.map(s => this.formatStat(s)).join(' ')
    const stats = this.add.text(0, -height / 2 + 165, statsText, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '11px',
      color: '#81c784',
      align: 'center',
      wordWrap: { width: width - 20 }
    }).setOrigin(0.5)

    const levelText = this.add.text(0, height / 2 - 25, `Lv.${equipment.level}${equipment.isEquipped ? ' ✓ 已装备' : ''}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: equipment.isEquipped ? '#81c784' : '#ffd54f'
    }).setOrigin(0.5)

    container.add([bg, iconBg, icon, name, slot, stats, levelText])
    container.setSize(width, height)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.03, duration: 150 })
    })

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 150 })
    })

    container.on('pointerdown', () => {
      this.selectedEquipment = equipment
      this.selectedTemplate = null
      this.updateDetailPanel()
    })

    return container
  }

  private createEquipContent(width: number, height: number): void {
    const slotNames = ['武器', '护甲', '头盔', '靴子', '戒指', '项链']
    const slotIcons = ['⚔️', '🛡️', '⛑️', '🥾', '💍', '📿']
    const slots = ['weapon', 'armor', 'helmet', 'boots', 'ring', 'necklace']

    const slotSize = 100
    const spacing = 30
    const totalWidth = slots.length * slotSize + (slots.length - 1) * spacing
    const startX = (width - totalWidth) / 2 + slotSize / 2
    const y = 280

    slots.forEach((slot, index) => {
      const x = startX + index * (slotSize + spacing)
      const equipped = this.equipmentManager.getEquippedEquipments(this.equipmentData)[index]
      const slotContainer = this.createEquipSlot(x, y, slotSize, slotNames[index], slotIcons[index], equipped, slot)
      this.equipSlots.push(slotContainer)
    })

    const compatibleEquipments = this.equipmentData.equipments.filter(e => !e.isEquipped)
    if (compatibleEquipments.length > 0) {
      const label = this.add.text(width / 2, 400, '可穿戴装备：', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#81c784'
      }).setOrigin(0.5)
      this.equipSlots.push(label as any)

      const cardWidth = 160
      const cardHeight = 200
      const cols = 5
      const itemSpacing = 20
      const itemTotalWidth = cols * cardWidth + (cols - 1) * itemSpacing
      const itemStartX = (width - itemTotalWidth) / 2 + cardWidth / 2
      const itemStartY = 450

      compatibleEquipments.forEach((equipment, index) => {
        const col = index % cols
        const row = Math.floor(index / cols)
        const x = itemStartX + col * (cardWidth + itemSpacing)
        const y = itemStartY + row * (cardHeight + itemSpacing)
        const card = this.createEquipmentCard(x, y, cardWidth, cardHeight, equipment)
        this.equipSlots.push(card)
      })
    }
  }

  private createEquipSlot(x: number, y: number, size: number, name: string, icon: string, equipment: Equipment | null, slotType: string): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    if (equipment) {
      bg.fillStyle(equipment.color, 0.2)
      bg.lineStyle(3, equipment.color, 0.9)
    } else {
      bg.fillStyle(0x000000, 0.6)
      bg.lineStyle(2, 0x78909c, 0.5)
    }
    this.roundedRect(bg, -size / 2, -size / 2, size, size, 12)

    const iconText = this.add.text(0, -10, equipment ? equipment.icon : icon, {
      fontFamily: 'serif',
      fontSize: '32px',
      color: equipment ? '#' + equipment.color.toString(16).padStart(6, '0') : '#78909c'
    }).setOrigin(0.5)

    const nameText = this.add.text(0, size / 2 + 20, equipment ? equipment.name : name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: equipment ? '#' + equipment.color.toString(16).padStart(6, '0') : '#78909c',
      fontStyle: equipment ? 'bold' : 'normal'
    }).setOrigin(0.5)

    container.add([bg, iconText, nameText])
    container.setSize(size, size)

    if (equipment) {
      container.setInteractive({ useHandCursor: true })
      container.on('pointerdown', () => {
        this.selectedEquipment = equipment
        this.selectedTemplate = null
        this.updateDetailPanel()
      })
    }

    return container
  }

  private createDetailPanel(width: number, height: number): void {
    this.detailPanel = this.add.container(width / 2, height * 0.82)

    const panelWidth = 600
    const panelHeight = 180

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.85)
    bg.lineStyle(2, 0xffd54f, 0.7)
    this.roundedRect(bg, -panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 14)

    const placeholder = this.add.text(0, 0, '请选择一件装备或图纸查看详情', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#78909c'
    }).setOrigin(0.5)

    this.detailPanel.add([bg, placeholder])
    this.detailPanel.setSize(panelWidth, panelHeight)
  }

  private updateDetailPanel(): void {
    const { width } = this.scale
    const panelWidth = 600
    const panelHeight = 180

    this.detailPanel.removeAll(true)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.85)
    this.roundedRect(bg, -panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 14)

    if (this.selectedTemplate) {
      this.updateForgeDetailPanel(bg, panelWidth, panelHeight)
    } else if (this.selectedEquipment) {
      this.updateEquipmentDetailPanel(bg, panelWidth, panelHeight)
    } else {
      const placeholder = this.add.text(0, 0, '请选择一件装备或图纸查看详情', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#78909c'
      }).setOrigin(0.5)
      this.detailPanel.add([bg, placeholder])
    }
  }

  private updateForgeDetailPanel(bg: Phaser.GameObjects.Graphics, panelWidth: number, panelHeight: number): void {
    const t = this.selectedTemplate!
    bg.lineStyle(2, t.color, 0.9)

    const iconBg = this.add.graphics()
    iconBg.fillStyle(t.color, 0.25)
    iconBg.fillCircle(-panelWidth / 2 + 65, 0, 50)
    iconBg.lineStyle(3, t.color, 1)
    iconBg.strokeCircle(-panelWidth / 2 + 65, 0, 50)

    const icon = this.add.text(-panelWidth / 2 + 65, 0, t.icon, {
      fontFamily: 'serif',
      fontSize: '44px'
    }).setOrigin(0.5)

    const name = this.add.text(-panelWidth / 2 + 130, -55, t.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold'
    })

    const slot = this.add.text(-panelWidth / 2 + 130, -25, `${this.equipmentManager.getSlotName(t.slot)} | ${QUALITY_NAMES[t.baseQuality]}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#' + t.color.toString(16).padStart(6, '0')
    })

    const desc = this.add.text(-panelWidth / 2 + 130, 5, t.description, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#b0bec5',
      wordWrap: { width: panelWidth - 280 }
    })

    const statsText = t.baseStats.map(s => this.formatStat(s)).join('  ')
    const stats = this.add.text(-panelWidth / 2 + 130, 45, `基础属性: ${statsText}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#81c784'
    })

    const check = this.equipmentManager.canForge(this.equipmentData, t.id, this.player.gold, this.player.spirit)
    const forgeBtn = this.createForgeButton(panelWidth / 2 - 100, 0, t, check.canForge)
    this.detailPanel.add(forgeBtn)

    const materialsText = t.craftMaterials.map(m => {
      const mat = getMaterialById(m.materialId)
      const have = this.equipmentManager.getMaterialQuantity(this.equipmentData, m.materialId)
      const color = have >= m.amount ? '#81c784' : '#ef5350'
      return `${mat?.icon || '📦'}${mat?.name || m.materialId} ${have}/${m.amount}`
    }).join('  ')
    const materials = this.add.text(0, panelHeight / 2 - 20, materialsText, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: '#b0bec5'
    }).setOrigin(0.5)

    this.detailPanel.add([bg, iconBg, icon, name, slot, desc, stats, materials])
  }

  private updateEquipmentDetailPanel(bg: Phaser.GameObjects.Graphics, panelWidth: number, panelHeight: number): void {
    const e = this.selectedEquipment!
    bg.lineStyle(2, e.color, 0.9)

    const iconBg = this.add.graphics()
    iconBg.fillStyle(e.color, 0.25)
    iconBg.fillCircle(-panelWidth / 2 + 65, 0, 50)
    iconBg.lineStyle(3, e.color, 1)
    iconBg.strokeCircle(-panelWidth / 2 + 65, 0, 50)

    const icon = this.add.text(-panelWidth / 2 + 65, 0, e.icon, {
      fontFamily: 'serif',
      fontSize: '44px'
    }).setOrigin(0.5)

    const name = this.add.text(-panelWidth / 2 + 130, -55, e.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '26px',
      color: '#' + e.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    })

    const qualityName = QUALITY_NAMES[e.quality]
    const slot = this.add.text(-panelWidth / 2 + 130, -25, `${qualityName} | ${this.equipmentManager.getSlotName(e.slot)} | Lv.${e.level}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#b0bec5'
    })

    const allStats = [...e.stats, ...e.extraStats]
    const statsText = allStats.map(s => this.formatStat(s)).join('  ')
    const stats = this.add.text(-panelWidth / 2 + 130, 10, `属性: ${statsText}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#81c784',
      wordWrap: { width: panelWidth - 280 }
    })

    const btnX = panelWidth / 2 - 90

    if (e.isEquipped) {
      const unequipBtn = this.createActionButton(btnX, -35, '卸下', 0xef5350, () => this.unequipItem(e))
      this.detailPanel.add(unequipBtn)
    } else {
      const equipBtn = this.createActionButton(btnX, -35, '装备', 0x81c784, () => this.equipItem(e))
      this.detailPanel.add(equipBtn)
    }

    const advanceCheck = this.equipmentManager.canAdvance(this.equipmentData, e, this.player.gold, this.player.spirit)
    const advanceBtn = this.createActionButton(btnX, 25, '品质进阶', 0xffd54f, () => this.advanceItem(e), advanceCheck.canAdvance)
    this.detailPanel.add(advanceBtn)

    if (advanceCheck.canAdvance) {
      const cost = getAdvanceCost(e.quality)
      const mat = getMaterialById(cost.materialId)
      const costText = this.add.text(btnX, 55, `${mat?.icon}${mat?.name}x${cost.amount} 💰${cost.gold} ✨${cost.spirit}`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '11px',
        color: '#ffd54f'
      }).setOrigin(0.5)
      this.detailPanel.add(costText)
    } else if (advanceCheck.reason) {
      const reasonText = this.add.text(btnX, 55, advanceCheck.reason, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '11px',
        color: '#ef5350'
      }).setOrigin(0.5)
      this.detailPanel.add(reasonText)
    }

    this.detailPanel.add([bg, iconBg, icon, name, slot, stats])
  }

  private createForgeButton(x: number, y: number, template: EquipmentTemplate, canForge: boolean): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const btnWidth = 160
    const btnHeight = 60

    const bg = this.add.graphics()
    bg.fillStyle(canForge ? 0xff7043 : 0x455a64, canForge ? 0.9 : 0.6)
    bg.lineStyle(2, canForge ? 0xff7043 : 0x78909c, 1)
    this.roundedRect(bg, -btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 12)

    const label = this.add.text(0, -12, '开始锻造', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const cost = this.add.text(0, 15, `💰${template.goldCost} ✨${template.spiritCost}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: canForge ? '#ffd54f' : '#ef5350'
    }).setOrigin(0.5)

    container.add([bg, label, cost])
    container.setSize(btnWidth, btnHeight)

    if (canForge) {
      container.setInteractive({ useHandCursor: true })
      container.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.08, duration: 150 }))
      container.on('pointerout', () => this.tweens.add({ targets: container, scale: 1, duration: 150 }))
      container.on('pointerdown', () => this.forgeItem(template))
    }

    return container
  }

  private createActionButton(x: number, y: number, label: string, color: number, onClick: () => void, enabled: boolean = true): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const btnWidth = 140
    const btnHeight = 45

    const bg = this.add.graphics()
    bg.fillStyle(enabled ? color : 0x455a64, enabled ? 0.9 : 0.6)
    bg.lineStyle(2, enabled ? color : 0x78909c, 1)
    this.roundedRect(bg, -btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10)

    const text = this.add.text(0, 0, label, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(btnWidth, btnHeight)

    if (enabled) {
      container.setInteractive({ useHandCursor: true })
      container.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.08, duration: 150 }))
      container.on('pointerout', () => this.tweens.add({ targets: container, scale: 1, duration: 150 }))
      container.on('pointerdown', onClick)
    }

    return container
  }

  private forgeItem(template: EquipmentTemplate): void {
    const result = this.equipmentManager.forge(this.equipmentData, template.id, this.player)
    if (result.success && result.equipment) {
      const qualityName = QUALITY_NAMES[result.equipment.quality]
      this.showMessage(`✨ 锻造成功！获得 ${qualityName}·${result.equipment.name}！`)
      this.cameras.main.flash(300, 255, 215, 0)
      this.playForgeEffect()
    } else {
      this.showMessage(`❌ ${result.reason || '锻造失败'}`)
    }
    this.saveGame()
    this.updateResourceTexts()
    this.refreshCurrentTab()
  }

  private equipItem(equipment: Equipment): void {
    this.equipmentManager.equip(this.equipmentData, equipment)
    this.showMessage(`✅ 已装备 ${equipment.name}`)
    this.saveGame()
    this.recalcStats()
    this.refreshCurrentTab()
  }

  private unequipItem(equipment: Equipment): void {
    this.equipmentManager.unequip(this.equipmentData, equipment)
    this.showMessage(`📦 已卸下 ${equipment.name}`)
    this.saveGame()
    this.recalcStats()
    this.refreshCurrentTab()
  }

  private advanceItem(equipment: Equipment): void {
    const result = this.equipmentManager.advanceQuality(this.equipmentData, equipment, this.player)
    if (result.success && result.newQuality) {
      const qualityName = QUALITY_NAMES[result.newQuality]
      this.showMessage(`🌟 品质进阶成功！提升为 ${qualityName}！`)
      this.cameras.main.flash(300, 255, 215, 0)
      this.playForgeEffect()
    } else {
      this.showMessage(`❌ ${result.reason || '进阶失败'}`)
    }
    this.saveGame()
    this.recalcStats()
    this.updateResourceTexts()
    this.refreshCurrentTab()
  }

  private playForgeEffect(): void {
    const { width, height } = this.scale
    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(width / 2, height * 0.5, 6, 0xffd54f, 0.9)
      const angle = (Math.PI * 2 * i) / 20
      this.tweens.add({
        targets: particle,
        x: width / 2 + Math.cos(angle) * 150,
        y: height * 0.5 + Math.sin(angle) * 150,
        alpha: 0,
        scale: 0,
        duration: 600,
        ease: 'Cubic.Out',
        onComplete: () => particle.destroy()
      })
    }
  }

  private refreshCurrentTab(): void {
    const current = this.currentTab
    this.showTab(current)
  }

  private recalcStats(): void {
    const save = this.saveManager.loadGame()!
    const permBonus = this.alchemyManager.getPermanentBonus(save.alchemy)
    const equipBonus = this.equipmentManager.calculateEquipmentBonus(this.equipmentData)
    this.saveManager.recalcPlayerStats(this.player, undefined, permBonus, equipBonus)
    this.updateResourceTexts()
  }

  private formatStat(stat: { type: string; value: number; isPercentage: boolean }): string {
    const names: Record<string, string> = {
      attack: '攻击',
      defense: '防御',
      maxHealth: '生命',
      maxMana: '灵力',
      critRate: '暴击率',
      critDamage: '暴击伤害'
    }
    const name = names[stat.type] || stat.type
    if (stat.isPercentage) {
      return `${name}+${(stat.value * 100).toFixed(1)}%`
    }
    return `${name}+${Math.floor(stat.value)}`
  }

  private updateResourceTexts(): void {
    this.goldText.setText('💰 金币: ' + this.player.gold)
    this.spiritText.setText('✨ 灵气: ' + this.player.spirit)

    const bonus = this.equipmentManager.calculateEquipmentBonus(this.equipmentData)
    this.statsText.setText(
      `⚔ ${this.player.attack} (+${Math.floor(bonus.attack * (1 + bonus.attack))})  ` +
      `🛡 ${this.player.defense} (+${Math.floor(bonus.defense * (1 + bonus.defense))})  ` +
      `❤ ${this.player.maxHealth} (+${Math.floor(bonus.maxHealth * (1 + bonus.maxHealth))})  ` +
      `💧 ${this.player.maxMana} (+${Math.floor(bonus.maxMana * (1 + bonus.maxMana))})  ` +
      `🎯 ${(bonus.critRate * 100).toFixed(1)}%  ` +
      `💥 ${(bonus.critDamage * 100).toFixed(1)}%`
    )
  }

  private showMessage(msg: string): void {
    this.messageText.setText(msg)
    this.messageText.setAlpha(0)
    this.tweens.add({
      targets: this.messageText,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 2000,
      repeatDelay: 300
    })
  }

  private saveGame(): void {
    const save = this.saveManager.loadGame()!
    save.player = this.player
    save.equipment = this.equipmentData
    this.equipmentManager.checkTemplateUnlock(this.equipmentData, save.highestStage)
    this.saveManager.saveGame(save)
  }

  private roundedRect(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, radius: number): void {
    graphics.beginPath()
    graphics.moveTo(x + radius, y)
    graphics.lineTo(x + width - radius, y)
    graphics.arc(x + width - radius, y + radius, radius, -Math.PI / 2, 0)
    graphics.lineTo(x + width, y + height - radius)
    graphics.arc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2)
    graphics.lineTo(x + radius, y + height)
    graphics.arc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI)
    graphics.lineTo(x, y + radius)
    graphics.arc(x + radius, y + radius, radius, Math.PI, -Math.PI / 2)
    graphics.closePath()
    graphics.fillPath()
    graphics.strokePath()
  }

  private createBackButton(width: number, height: number): void {
    const btn = this.add.container(width - 80, height - 40)
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.7)
    bg.lineStyle(2, 0x78909c, 0.8)
    this.roundedRect(bg, -60, -25, 120, 50, 10)
    const text = this.add.text(0, 0, '◀ 返回', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5)
    btn.add([bg, text])
    btn.setSize(120, 50)
    btn.setInteractive({ useHandCursor: true })
    btn.on('pointerover', () => this.tweens.add({ targets: btn, scale: 1.08, duration: 150 }))
    btn.on('pointerout', () => this.tweens.add({ targets: btn, scale: 1, duration: 150 }))
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(400)
      this.time.delayedCall(400, () => this.scene.start('MenuScene'))
    })
  }
}
