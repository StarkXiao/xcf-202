import Phaser from 'phaser'
import type { GameSave, Player, ShopData, ShopItem, Treasure } from '../types'
import { SaveManager } from '../managers/SaveManager'
import { ShopManager } from '../managers/ShopManager'
import { AlchemyManager } from '../managers/AlchemyManager'
import { EquipmentManager } from '../managers/EquipmentManager'
import { MeridianManager } from '../managers/MeridianManager'
import { AchievementManager } from '../managers/AchievementManager'
import { RARITY_COLORS, RARITY_NAMES, SHOP_CONFIG } from '../data/shopData'
import { getHerbById, getPillById } from '../data/alchemyData'

export const SHOP_TREASURES: Record<string, Omit<Treasure, 'level' | 'maxLevel'>> = {
  'shop_treasure_yuhuan': {
    id: 'treasure_yuhuan',
    name: '聚灵玉环',
    description: '佩戴后可加快灵力恢复速度，提升攻防属性。',
    attackBonus: 15,
    defenseBonus: 15,
    healthBonus: 80,
    upgradeCost: 400,
    color: 0x69f0ae
  },
  'shop_treasure_xianjian': {
    id: 'treasure_xianjian',
    name: '仙剑碎片',
    description: '上古仙剑的碎片，蕴含强大剑意，大幅提升攻击。',
    attackBonus: 40,
    defenseBonus: 10,
    healthBonus: 50,
    upgradeCost: 800,
    color: 0x00e5ff
  }
}

export class ShopScene extends Phaser.Scene {
  private saveManager = SaveManager.getInstance()
  private shopManager = ShopManager.getInstance()
  private alchemyManager = AlchemyManager.getInstance()
  private equipmentManager = EquipmentManager.getInstance()
  private achievementManager = AchievementManager.getInstance()
  private save!: GameSave
  private player!: Player
  private shop!: ShopData
  private selectedItem: ShopItem | null = null
  private itemCards: Phaser.GameObjects.Container[] = []
  private contentPanel!: Phaser.GameObjects.Container
  private detailPanel!: Phaser.GameObjects.Container
  private resourceText!: Phaser.GameObjects.Text
  private messageText!: Phaser.GameObjects.Text
  private refreshButton!: Phaser.GameObjects.Container
  private buyQuantity: number = 1

  constructor() {
    super({ key: 'ShopScene' })
  }

  init(): void {
    this.save = this.saveManager.loadGame()!
    this.player = this.save.player
    this.shop = this.save.shop

    const buff = this.alchemyManager.getBuffBonus(this.save.alchemy)
    const permBonus = this.alchemyManager.getPermanentBonus(this.save.alchemy)
    const equipBonus = this.equipmentManager.calculateEquipmentBonus(this.save.equipment)
    const meridBonus = MeridianManager.getInstance().calculateMeridianBonus(this.save.meridian)
    const achvBonus = this.achievementManager.getAchievementBonus(this.save.achievement)
    this.saveManager.recalcPlayerStats(this.player, buff, permBonus, equipBonus, meridBonus, achvBonus)

    if (this.shop.items.length === 0) {
      this.shopManager.refreshShop(this.shop, this.save.currentStage, this.player.gold)
      this.persistSave()
    }
  }

  create(): void {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor(0x0a0a15)
    this.createBackground(width, height)

    this.add.text(width / 2, 45, '🏪 坊市交易', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '42px',
      color: '#ffd54f',
      stroke: '#5d4037',
      strokeThickness: 3
    }).setOrigin(0.5)

    this.resourceText = this.add.text(30, 30, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffd54f',
      lineSpacing: 4
    })

    this.messageText = this.add.text(width / 2, 85, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#4fc3f7'
    }).setOrigin(0.5)

    this.updateResourceText()
    this.createContentArea(width, height)
    this.createDetailPanel(width, height)
    this.createRefreshButton(width, height)
    this.createBackButton(width, height)
    this.refreshItems()

    this.cameras.main.fadeIn(500)
  }

  private persistSave(): void {
    this.saveManager.saveGame(this.save)
  }

  private createBackground(width: number, height: number): void {
    const colors = [0x4a148c, 0x1a237e, 0x311b92, 0x004d40, 0x1b5e20]
    for (let i = 0; i < 6; i++) {
      const glow = this.add.graphics()
      glow.fillStyle(colors[i % colors.length], 0.1)
      glow.fillCircle(
        width * (0.1 + i * 0.15),
        height * (0.25 + Math.random() * 0.5),
        120 + Math.random() * 80
      )
    }

    this.add.particles(0, 0, 'a-particle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: { min: 4000, max: 8000 },
      speedY: { min: -15, max: -5 },
      speedX: { min: -2, max: 2 },
      scale: { start: 0.15, end: 0 },
      alpha: { start: 0.4, end: 0 },
      tint: [0xffd54f, 0xff7043, 0xba68c8, 0x4fc3f7],
      quantity: 1,
      frequency: 500
    })
  }

  private createContentArea(width: number, height: number): void {
    this.contentPanel = this.add.container(width / 2, height / 2 + 10)
    const panelWidth = width - 380
    const panelHeight = height - 220

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.6)
    bg.lineStyle(2, 0xffd54f, 0.4)
    this.roundedRect(bg, -panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 14)

    const label = this.add.text(-panelWidth / 2 + 20, -panelHeight / 2 + 15, '📦 货品列表', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffd54f'
    })

    this.contentPanel.add([bg, label])
    this.contentPanel.setSize(panelWidth, panelHeight)
  }

  private createDetailPanel(width: number, height: number): void {
    const panelX = width - 160
    const panelY = height / 2 + 10
    this.detailPanel = this.add.container(panelX, panelY)
    const panelWidth = 280
    const panelHeight = height - 220

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.7)
    bg.lineStyle(2, 0x78909c, 0.6)
    this.roundedRect(bg, -panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 14)

    const label = this.add.text(-panelWidth / 2 + 20, -panelHeight / 2 + 15, '📋 商品详情', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffd54f'
    })

    this.detailPanel.add([bg, label])
    this.detailPanel.setSize(panelWidth, panelHeight)

    this.updateDetailPanel()
  }

  private createRefreshButton(width: number, height: number): void {
    const buttonX = width - 160
    const buttonY = height - 60
    this.refreshButton = this.createButton(buttonX, buttonY, 260, 50, '🔄 刷新商品', 0x4fc3f7, () => this.handleRefresh())
    this.add.existing(this.refreshButton)
    this.updateRefreshButtonText()
  }

  private updateRefreshButtonText(): void {
    const freeLeft = this.shopManager.getFreeRefreshesLeft(this.shop)
    const cost = this.shopManager.getRefreshCost(this.shop)
    const text = this.refreshButton.list[1] as Phaser.GameObjects.Text

    if (cost === null) {
      text.setText(`🔄 刷新商品 (免费 ${freeLeft}/${SHOP_CONFIG.dailyFreeRefreshes})`)
    } else {
      text.setText(`🔄 刷新商品 (${cost} 金币)`)
    }
  }

  private createBackButton(width: number, height: number): void {
    const btn = this.createButton(60, height - 50, 100, 45, '← 返回', 0xef5350, () => this.goBack())
    this.add.existing(btn)
  }

  private refreshItems(): void {
    this.itemCards.forEach(c => c.destroy())
    this.itemCards = []

    const panelWidth = this.scale.width - 380
    const panelHeight = this.scale.height - 220
    const padding = 20
    const cardW = 180
    const cardH = 130
    const spacing = 15
    const perRow = Math.floor((panelWidth - padding * 2 + spacing) / (cardW + spacing))

    if (this.shop.items.length === 0) {
      const empty = this.add.text(0, 0, '暂无商品，点击刷新获取新货品！', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '22px',
        color: '#78909c'
      }).setOrigin(0.5)
      this.itemCards.push(empty as any)
      this.contentPanel.add(empty)
      return
    }

    const items = [...this.shop.items]
    const totalCols = perRow
    const totalRows = Math.ceil(items.length / totalCols)
    const totalH = totalRows * (cardH + spacing) - spacing
    const startX = -panelWidth / 2 + padding + cardW / 2
    const startY = -Math.min(panelHeight / 2 - padding - 30, totalH / 2) + cardH / 2

    items.forEach((item, idx) => {
      const col = idx % totalCols
      const row = Math.floor(idx / totalCols)
      const x = startX + col * (cardW + spacing)
      const y = startY + row * (cardH + spacing)
      const card = this.createItemCard(x, y, cardW, cardH, item)
      this.itemCards.push(card)
      this.contentPanel.add(card)
      card.setAlpha(0)
      this.tweens.add({
        targets: card,
        alpha: 1,
        duration: 300,
        delay: idx * 40
      })

      if (item.isRareStock) {
        this.playRareItemAnimation(card)
      }
    })
  }

  private createItemCard(x: number, y: number, w: number, h: number, item: ShopItem): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const isSelected = this.selectedItem?.id === item.id
    const rarityColor = RARITY_COLORS[item.rarity]

    const bg = this.add.graphics()
    if (isSelected) {
      bg.fillStyle(rarityColor, 0.25)
      bg.lineStyle(3, rarityColor, 1)
    } else {
      bg.fillStyle(0x000000, 0.75)
      bg.lineStyle(2, rarityColor, 0.8)
    }
    this.roundedRect(bg, -w / 2, -h / 2, w, h, 10)

    const iconBg = this.add.graphics()
    iconBg.fillStyle(rarityColor, 0.15)
    iconBg.fillCircle(-w / 2 + 35, -h / 2 + 40, 22)

    const icon = this.add.text(-w / 2 + 35, -h / 2 + 40, item.icon, {
      fontSize: '28px'
    }).setOrigin(0.5)

    const name = this.add.text(-w / 2 + 70, -h / 2 + 25, item.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5)

    const rarityName = RARITY_NAMES[item.rarity]
    const rarity = this.add.text(-w / 2 + 70, -h / 2 + 48, rarityName, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: '#' + rarityColor.toString(16).padStart(6, '0')
    }).setOrigin(0, 0.5)

    const priceText = this.formatPriceText(item)
    const price = this.add.text(-w / 2 + 15, h / 2 - 20, priceText, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: item.priceFluctuation >= 0 ? '#ef5350' : '#66bb6a'
    }).setOrigin(0, 0.5)

    const stock = this.add.text(w / 2 - 15, h / 2 - 20, `库存: ${item.stock}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: item.stock > 0 ? '#90caf9' : '#ef5350'
    }).setOrigin(1, 0.5)

    if (item.isRareStock) {
      const rareTag = this.add.text(w / 2 - 10, -h / 2 + 10, '✨稀有', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '11px',
        color: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(1, 0.5)
      container.add(rareTag)
    }

    container.add([bg, iconBg, icon, name, rarity, price, stock])
    container.setSize(w, h)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      if (!isSelected) {
        this.tweens.add({ targets: container, scale: 1.03, duration: 150 })
      }
    })

    container.on('pointerout', () => {
      if (!isSelected) {
        this.tweens.add({ targets: container, scale: 1, duration: 150 })
      }
    })

    container.on('pointerdown', () => {
      this.selectedItem = item
      this.buyQuantity = 1
      this.refreshItems()
      this.updateDetailPanel()
    })

    return container
  }

  private formatPriceText(item: ShopItem): string {
    const fluctuation = Math.round(item.priceFluctuation * 100)
    if (fluctuation > 0) {
      return `💰 ${item.currentPrice} ↑${fluctuation}%`
    } else if (fluctuation < 0) {
      return `💰 ${item.currentPrice} ↓${Math.abs(fluctuation)}%`
    }
    return `💰 ${item.currentPrice}`
  }

  private playRareItemAnimation(card: Phaser.GameObjects.Container): void {
    this.tweens.add({
      targets: card,
      scale: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  private updateDetailPanel(): void {
    const panelWidth = 280
    const panelHeight = this.scale.height - 220

    const toRemove: Phaser.GameObjects.GameObject[] = []
    this.detailPanel.each((child: Phaser.GameObjects.GameObject) => {
      if (child !== this.detailPanel.list[0] && child !== this.detailPanel.list[1]) {
        toRemove.push(child)
      }
    })
    toRemove.forEach(c => c.destroy())

    if (!this.selectedItem) {
      const hint = this.add.text(0, 20, '选择一个商品\n查看详情', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '18px',
        color: '#78909c',
        align: 'center',
        lineSpacing: 8
      }).setOrigin(0.5)
      this.detailPanel.add(hint)
      return
    }

    const item = this.selectedItem
    const rarityColor = RARITY_COLORS[item.rarity]

    const iconBg = this.add.graphics()
    iconBg.fillStyle(rarityColor, 0.2)
    iconBg.fillCircle(0, -panelHeight / 2 + 60, 40)

    const icon = this.add.text(0, -panelHeight / 2 + 60, item.icon, {
      fontSize: '48px'
    }).setOrigin(0.5)

    const name = this.add.text(0, -panelHeight / 2 + 110, item.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const rarityName = RARITY_NAMES[item.rarity]
    const rarity = this.add.text(0, -panelHeight / 2 + 135, `【${rarityName}】`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#' + rarityColor.toString(16).padStart(6, '0')
    }).setOrigin(0.5)

    const desc = this.add.text(-panelWidth / 2 + 25, -panelHeight / 2 + 160, item.description, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#b0bec5',
      wordWrap: { width: panelWidth - 50 }
    }).setOrigin(0, 0)

    const priceY = -panelHeight / 2 + 220
    const priceLabel = this.add.text(-panelWidth / 2 + 25, priceY, '售价:', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#90caf9'
    })

    const priceValue = this.add.text(panelWidth / 2 - 25, priceY, `${item.currentPrice} 金币`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: item.priceFluctuation >= 0 ? '#ef5350' : '#66bb6a',
      fontStyle: 'bold'
    }).setOrigin(1, 0)

    const fluctuationText = item.priceFluctuation >= 0
      ? `比原价高 ${Math.round(item.priceFluctuation * 100)}%`
      : `比原价低 ${Math.round(Math.abs(item.priceFluctuation) * 100)}%`
    const fluctuation = this.add.text(panelWidth / 2 - 25, priceY + 22, fluctuationText, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: item.priceFluctuation >= 0 ? '#ef5350' : '#66bb6a'
    }).setOrigin(1, 0)

    const stockY = priceY + 50
    const stockLabel = this.add.text(-panelWidth / 2 + 25, stockY, '库存:', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#90caf9'
    })

    const stockValue = this.add.text(panelWidth / 2 - 25, stockY, `${item.stock} / ${item.maxStock}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: item.stock > 0 ? '#66bb6a' : '#ef5350'
    }).setOrigin(1, 0)

    const qtyY = stockY + 45
    const qtyLabel = this.add.text(-panelWidth / 2 + 25, qtyY, '购买数量:', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#90caf9'
    })

    const qtyMinus = this.createSmallButton(-30, qtyY + 15, 30, 28, '-', 0x78909c, () => {
      if (this.buyQuantity > 1) {
        this.buyQuantity--
        this.updateDetailPanel()
      }
    })
    this.detailPanel.add(qtyMinus)

    const qtyValue = this.add.text(0, qtyY + 15, this.buyQuantity.toString(), {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const qtyPlus = this.createSmallButton(30, qtyY + 15, 30, 28, '+', 0x78909c, () => {
      if (this.buyQuantity < item.stock) {
        this.buyQuantity++
        this.updateDetailPanel()
      }
    })
    this.detailPanel.add(qtyPlus)

    const totalY = qtyY + 55
    const totalLabel = this.add.text(-panelWidth / 2 + 25, totalY, '总计:', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffd54f'
    })

    const totalPrice = item.currentPrice * this.buyQuantity
    const totalValue = this.add.text(panelWidth / 2 - 25, totalY, `${totalPrice} 金币`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(1, 0)

    const canBuy = item.stock >= this.buyQuantity && this.player.gold >= totalPrice
    const buyBtnY = totalY + 50
    const buyBtn = this.createButton(0, buyBtnY + 15, 200, 45, '💰 购买', canBuy ? 0x66bb6a : 0x78909c, () => {
      if (canBuy) {
        this.handlePurchase()
      }
    })
    this.detailPanel.add(buyBtn)

    this.detailPanel.add([iconBg, icon, name, rarity, desc, priceLabel, priceValue, fluctuation, stockLabel, stockValue, qtyLabel, qtyValue, totalLabel, totalValue])
  }

  private createSmallButton(x: number, y: number, w: number, h: number, label: string, color: number, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const bg = this.add.graphics()
    bg.fillStyle(color, 0.3)
    bg.lineStyle(2, color, 0.8)
    this.roundedRect(bg, -w / 2, -h / 2, w, h, 6)

    const text = this.add.text(0, 0, label, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(w, h)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.1, duration: 100 })
    })

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 100 })
    })

    container.on('pointerdown', onClick)

    return container
  }

  private createButton(x: number, y: number, w: number, h: number, label: string, color: number, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.7)
    bg.lineStyle(2, color, 0.9)
    this.roundedRect(bg, -w / 2, -h / 2, w, h, 10)

    const text = this.add.text(0, 0, label, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(w, h)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.05, duration: 150 })
      bg.clear()
      bg.fillStyle(color, 0.3)
      bg.lineStyle(3, color, 1)
      this.roundedRect(bg, -w / 2, -h / 2, w, h, 10)
    })

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 150 })
      bg.clear()
      bg.fillStyle(0x000000, 0.7)
      bg.lineStyle(2, color, 0.9)
      this.roundedRect(bg, -w / 2, -h / 2, w, h, 10)
    })

    container.on('pointerdown', onClick)

    return container
  }

  private handleRefresh(): void {
    const cost = this.shopManager.getRefreshCost(this.shop)

    if (cost !== null && this.player.gold < cost) {
      this.showMessage('金币不足！')
      return
    }

    const result = this.shopManager.refreshShop(this.shop, this.save.currentStage, this.player.gold)

    if (cost !== null) {
      this.player.gold -= cost
    }

    this.selectedItem = null
    this.buyQuantity = 1

    this.persistSave()

    this.refreshItems()
    this.updateDetailPanel()
    this.updateResourceText()
    this.updateRefreshButtonText()
    this.showMessage(result.message)

    if (result.rareItems.length > 0) {
      this.cameras.main.flash(500, 255, 215, 79)
    }
  }

  private handlePurchase(): void {
    if (!this.selectedItem) return

    const canDeliver = this.canDeliverItem(this.selectedItem)
    if (!canDeliver.success) {
      this.showMessage(canDeliver.reason || '无法购买该商品！')
      return
    }

    const result = this.shopManager.purchaseItem(
      this.shop,
      this.selectedItem.id,
      this.buyQuantity,
      this.player.gold
    )

    if (!result.success) {
      this.showMessage(result.reason)
      return
    }

    this.player.gold -= result.totalPrice
    this.addItemToInventory(result.item, result.quantity)

    this.showMessage(`购买成功！获得 ${result.item.name} x${result.quantity}`)
    this.buyQuantity = Math.min(this.buyQuantity, result.item.stock)

    if (result.item.stock <= 0) {
      this.selectedItem = null
    }

    this.persistSave()

    this.refreshItems()
    this.updateDetailPanel()
    this.updateResourceText()
  }

  private canDeliverItem(item: ShopItem): { success: boolean; reason?: string } {
    if (item.type === 'treasure') {
      const treasureTemplate = SHOP_TREASURES[item.templateId]
      if (treasureTemplate) {
        const alreadyOwned = this.player.treasures.find(t => t.id === treasureTemplate.id)
        if (alreadyOwned) {
          return { success: false, reason: '你已拥有该法宝，无法重复购买！' }
        }
      }
    }
    return { success: true }
  }

  private addItemToInventory(item: ShopItem, quantity: number): void {
    if (item.type === 'herb') {
      const herbId = item.templateId.replace('shop_', '')
      const herb = getHerbById(herbId)
      if (herb) {
        this.alchemyManager.addHerb(this.save.alchemy, herbId, quantity)
      }
    } else if (item.type === 'pill') {
      const pillId = item.templateId.replace('shop_', '')
      const pill = getPillById(pillId)
      if (pill) {
        this.alchemyManager.addPill(this.save.alchemy, pillId, quantity)
      }
    } else if (item.type === 'consumable') {
      if (item.templateId.includes('spiritstone')) {
        const spiritGain = item.effects?.find(e => e.type === 'spirit')?.value || 0
        this.save.sect.resources.spirit += spiritGain * quantity
      }
    } else if (item.type === 'material') {
      const materialId = item.templateId.replace('shop_material_', '')
      this.equipmentManager.addMaterial(this.save.equipment, materialId, quantity)
    } else if (item.type === 'treasure') {
      const treasureTemplate = SHOP_TREASURES[item.templateId]
      if (treasureTemplate) {
        const newTreasure: Treasure = {
          ...treasureTemplate,
          level: 1,
          maxLevel: 10
        }
        this.player.treasures.push(newTreasure)

        const { unlockedAchievements } = this.achievementManager.collectTreasure(this.save, treasureTemplate.id, {
          name: treasureTemplate.name,
          description: treasureTemplate.description,
          icon: '💎',
          color: treasureTemplate.color,
          rarity: 'rare',
          maxLevel: 10
        })

        if (unlockedAchievements.length > 0) {
          this.showMessage(`🎉 解锁成就：${unlockedAchievements[0].name}`)
        }

        this.saveManager.recalcPlayerStatsFromSave(this.save)
      }
    }
  }

  private showMessage(text: string): void {
    this.messageText.setText(text)
    this.messageText.setAlpha(1)
    this.tweens.add({
      targets: this.messageText,
      alpha: 0,
      duration: 2500,
      delay: 1500,
      ease: 'Power2.easeOut'
    })
  }

  private updateResourceText(): void {
    this.resourceText.setText([
      `💰 金币: ${this.player.gold}`,
      `🔮 灵石: ${this.save.sect.resources.spirit}`
    ].join('\n'))
  }

  private goBack(): void {
    this.persistSave()
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      this.scene.start('MenuScene')
    })
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
}
