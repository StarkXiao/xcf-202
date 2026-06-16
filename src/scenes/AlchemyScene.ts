import Phaser from 'phaser'
import type { Player, AlchemyData, Recipe, Pill, Herb, InventoryItem, ActivePillBuff } from '../types'
import { SaveManager } from '../managers/SaveManager'
import { AlchemyManager } from '../managers/AlchemyManager'
import { HERBS, PILLS, getHerbById, getPillById, getRecipeById } from '../data/alchemyData'
import { RARITY_COLORS, RARITY_NAMES } from '../data/sectData'

type TabType = 'herbs' | 'recipes' | 'pills'

export class AlchemyScene extends Phaser.Scene {
  private saveManager = SaveManager.getInstance()
  private alchemyManager = AlchemyManager.getInstance()
  private player!: Player
  private alchemy!: AlchemyData
  private currentTab: TabType = 'recipes'
  private selectedRecipe: (Recipe & { isUnlocked: boolean; canUnlock: boolean }) | null = null
  private selectedPill: Pill | null = null
  private tabButtons: Phaser.GameObjects.Container[] = []
  private recipeCards: Phaser.GameObjects.Container[] = []
  private herbCards: Phaser.GameObjects.Container[] = []
  private pillCards: Phaser.GameObjects.Container[] = []
  private contentPanel!: Phaser.GameObjects.Container
  private detailPanel!: Phaser.GameObjects.Container
  private resourceText!: Phaser.GameObjects.Text
  private buffText!: Phaser.GameObjects.Text
  private messageText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'AlchemyScene' })
  }

  init(): void {
    const save = this.saveManager.loadGame()!
    this.player = save.player
    this.alchemy = save.alchemy
    this.alchemyManager.checkRecipeUnlock(this.alchemy, this.player.level)
    this.alchemyManager.getActiveBuffs(this.alchemy)
    const buff = this.alchemyManager.getBuffBonus(this.alchemy)
    this.saveManager.recalcPlayerStats(this.player, buff)
  }

  create(): void {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor(0x0a0a15)
    this.createBackground(width, height)

    const title = this.add.text(width / 2, 45, '🧪 洞府炼丹', {
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

    this.buffText = this.add.text(30, 95, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#81c784',
      lineSpacing: 3
    })

    this.messageText = this.add.text(width / 2, 85, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#4fc3f7'
    }).setOrigin(0.5)

    this.updateResourceText()
    this.updateBuffText()
    this.createTabs(width, height)
    this.createContentArea(width, height)
    this.createDetailPanel(width, height)
    this.createBackButton(width, height)
    this.switchTab(this.currentTab)

    this.cameras.main.fadeIn(500)
  }

  private createBackground(width: number, height: number): void {
    const colors = [0x4a148c, 0x1a237e, 0x311b92, 0x004d40]
    for (let i = 0; i < 5; i++) {
      const glow = this.add.graphics()
      glow.fillStyle(colors[i % colors.length], 0.1)
      glow.fillCircle(
        width * (0.15 + i * 0.2),
        height * (0.3 + Math.random() * 0.4),
        150 + Math.random() * 100
      )
    }

    const particles = this.add.particles(0, 0, 'a-particle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: { min: 3000, max: 6000 },
      speedY: { min: -10, max: -25 },
      speedX: { min: -3, max: 3 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: [0xba68c8, 0xffd54f, 0x81c784, 0x4fc3f7],
      quantity: 1,
      frequency: 300
    })
  }

  private createTabs(width: number, height: number): void {
    const tabs: { label: string; type: TabType; color: number }[] = [
      { label: '📜 丹方', type: 'recipes', color: 0xba68c8 },
      { label: '🌿 药材', type: 'herbs', color: 0x81c784 },
      { label: '💊 丹药', type: 'pills', color: 0xffd54f }
    ]

    const tabWidth = 140
    const tabHeight = 48
    const totalWidth = tabs.length * tabWidth
    const startX = (width - totalWidth) / 2 + tabWidth / 2
    const y = 140

    tabs.forEach((tab, idx) => {
      const x = startX + idx * tabWidth
      const btn = this.createTabButton(x, y, tabWidth, tabHeight, tab.label, tab.color, tab.type)
      this.tabButtons.push(btn)
    })
  }

  private createTabButton(x: number, y: number, w: number, h: number, label: string, color: number, type: TabType): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.7)
    bg.lineStyle(2, color, 0.8)
    this.roundedRect(bg, -w / 2, -h / 2, w, h, 10)

    const text = this.add.text(0, 0, label, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(w, h)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      if (this.currentTab !== type) {
        this.tweens.add({ targets: container, scale: 1.03, duration: 150 })
      }
    })
    container.on('pointerout', () => {
      if (this.currentTab !== type) {
        this.tweens.add({ targets: container, scale: 1, duration: 150 })
      }
    })
    container.on('pointerdown', () => this.switchTab(type))

    return container
  }

  private switchTab(type: TabType): void {
    this.currentTab = type
    this.selectedRecipe = null
    this.selectedPill = null

    const tabColors: Record<TabType, number> = {
      recipes: 0xba68c8,
      herbs: 0x81c784,
      pills: 0xffd54f
    }

    const tabLabels: Record<TabType, string> = {
      recipes: '📜 丹方',
      herbs: '🌿 药材',
      pills: '💊 丹药'
    }

    this.tabButtons.forEach((btn, idx) => {
      const types: TabType[] = ['recipes', 'herbs', 'pills']
      const t = types[idx]
      const color = tabColors[t]
      const bg = btn.list[0] as Phaser.GameObjects.Graphics
      const text = btn.list[1] as Phaser.GameObjects.Text

      bg.clear()
      if (t === type) {
        bg.fillStyle(color, 0.35)
        bg.lineStyle(3, color, 1)
        btn.setScale(1.05)
      } else {
        bg.fillStyle(0x000000, 0.7)
        bg.lineStyle(2, color, 0.8)
        btn.setScale(1)
      }
      const w = 140, h = 48
      this.roundedRect(bg, -w / 2, -h / 2, w, h, 10)
    })

    this.refreshContent()
    this.updateDetailPanel()
  }

  private createContentArea(width: number, height: number): void {
    this.contentPanel = this.add.container(width / 2, height / 2 + 20)
    const panelWidth = width - 80
    const panelHeight = height - 300

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.6)
    bg.lineStyle(2, 0x78909c, 0.6)
    this.roundedRect(bg, -panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 14)

    this.contentPanel.add(bg)
    this.contentPanel.setSize(panelWidth, panelHeight)
  }

  private refreshContent(): void {
    this.recipeCards.forEach(c => c.destroy())
    this.herbCards.forEach(c => c.destroy())
    this.pillCards.forEach(c => c.destroy())
    this.recipeCards = []
    this.herbCards = []
    this.pillCards = []

    const { width } = this.scale
    const panelWidth = width - 80
    const panelHeight = this.scale.height - 300
    const padding = 20
    const cardW = 170
    const cardH = 140
    const spacing = 20
    const perRow = Math.floor((panelWidth - padding * 2 + spacing) / (cardW + spacing))

    if (this.currentTab === 'recipes') {
      const recipes = this.alchemyManager.getAllRecipesWithUnlockStatus(this.alchemy, this.player.level)
      const totalCols = perRow
      const totalRows = Math.ceil(recipes.length / totalCols)
      const totalH = totalRows * (cardH + spacing) - spacing
      const startX = -panelWidth / 2 + padding + cardW / 2
      const startY = -Math.min(panelHeight / 2 - padding, totalH / 2) + cardH / 2

      recipes.forEach((recipe, idx) => {
        const col = idx % totalCols
        const row = Math.floor(idx / totalCols)
        const x = startX + col * (cardW + spacing)
        const y = startY + row * (cardH + spacing)
        const card = this.createRecipeCard(x, y, cardW, cardH, recipe)
        this.recipeCards.push(card)
        this.contentPanel.add(card)
        card.setAlpha(0)
        this.tweens.add({
          targets: card,
          alpha: 1,
          duration: 300,
          delay: idx * 50
        })
      })
    } else if (this.currentTab === 'herbs') {
      const items: { herb: Herb; qty: number }[] = []
      for (const item of this.alchemy.herbs) {
        const herb = getHerbById(item.itemId)
        if (herb) items.push({ herb, qty: item.quantity })
      }
      if (items.length === 0) {
        const empty = this.add.text(0, 0, '暂无药材，前往战斗获取吧！', {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '24px',
          color: '#78909c'
        }).setOrigin(0.5)
        this.herbCards.push(empty as any)
        this.contentPanel.add(empty)
        return
      }

      const totalCols = perRow
      const totalRows = Math.ceil(items.length / totalCols)
      const totalH = totalRows * (cardH + spacing) - spacing
      const startX = -panelWidth / 2 + padding + cardW / 2
      const startY = -Math.min(panelHeight / 2 - padding, totalH / 2) + cardH / 2

      items.forEach((item, idx) => {
        const col = idx % totalCols
        const row = Math.floor(idx / totalCols)
        const x = startX + col * (cardW + spacing)
        const y = startY + row * (cardH + spacing)
        const card = this.createHerbCard(x, y, cardW, cardH, item.herb, item.qty)
        this.herbCards.push(card)
        this.contentPanel.add(card)
      })
    } else if (this.currentTab === 'pills') {
      const items: { pill: Pill; qty: number }[] = []
      for (const item of this.alchemy.pills) {
        const pill = getPillById(item.itemId)
        if (pill) items.push({ pill, qty: item.quantity })
      }
      if (items.length === 0) {
        const empty = this.add.text(0, 0, '暂无丹药，选择丹方开始炼制！', {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '24px',
          color: '#78909c'
        }).setOrigin(0.5)
        this.pillCards.push(empty as any)
        this.contentPanel.add(empty)
        return
      }

      const totalCols = perRow
      const totalRows = Math.ceil(items.length / totalCols)
      const totalH = totalRows * (cardH + spacing) - spacing
      const startX = -panelWidth / 2 + padding + cardW / 2
      const startY = -Math.min(panelHeight / 2 - padding, totalH / 2) + cardH / 2

      items.forEach((item, idx) => {
        const col = idx % totalCols
        const row = Math.floor(idx / totalCols)
        const x = startX + col * (cardW + spacing)
        const y = startY + row * (cardH + spacing)
        const card = this.createPillCard(x, y, cardW, cardH, item.pill, item.qty)
        this.pillCards.push(card)
        this.contentPanel.add(card)
      })
    }
  }

  private createRecipeCard(x: number, y: number, w: number, h: number, recipe: Recipe & { isUnlocked: boolean; canUnlock: boolean }): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const resultPill = getPillById(recipe.resultPillId)
    const isSelected = this.selectedRecipe?.id === recipe.id

    const bg = this.add.graphics()
    if (!recipe.isUnlocked) {
      bg.fillStyle(0x212121, 0.8)
      bg.lineStyle(2, 0x546e7a, 0.5)
    } else if (isSelected) {
      bg.fillStyle(recipe.color, 0.25)
      bg.lineStyle(3, recipe.color, 1)
    } else {
      bg.fillStyle(0x000000, 0.75)
      bg.lineStyle(2, recipe.color, 0.9)
    }
    this.roundedRect(bg, -w / 2, -h / 2, w, h, 10)

    const iconBg = this.add.graphics()
    iconBg.fillStyle(recipe.isUnlocked ? recipe.color : 0x455a64, recipe.isUnlocked ? 0.25 : 0.3)
    iconBg.fillCircle(0, -h / 2 + 35, 26)
    iconBg.lineStyle(2, recipe.isUnlocked ? recipe.color : 0x78909c, recipe.isUnlocked ? 0.9 : 0.5)
    iconBg.strokeCircle(0, -h / 2 + 35, 26)

    const icon = this.add.text(0, -h / 2 + 35, resultPill?.icon || '📜', {
      fontFamily: 'serif',
      fontSize: '26px'
    }).setOrigin(0.5)

    const name = this.add.text(0, -h / 2 + 78, recipe.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: recipe.isUnlocked ? '#ffffff' : '#78909c',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const rarity = this.add.text(0, -h / 2 + 98,
      recipe.isUnlocked ? `[${RARITY_NAMES[recipe.rarity]}]` : `Lv.${recipe.unlockLevel} 解锁`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: recipe.isUnlocked ? '#' + RARITY_COLORS[recipe.rarity].toString(16).padStart(6, '0') : '#ef5350'
      }).setOrigin(0.5)

    const info = this.add.text(0, -h / 2 + 118,
      recipe.isUnlocked ? `产出: ${resultPill?.name || ''} x${recipe.resultAmount}` : '🔒 未解锁',
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: recipe.isUnlocked ? '#b0bec5' : '#546e7a'
      }).setOrigin(0.5)

    container.add([bg, iconBg, icon, name, rarity, info])
    container.setSize(w, h)

    if (recipe.isUnlocked) {
      container.setInteractive({ useHandCursor: true })
      container.on('pointerover', () => {
        if (!isSelected) this.tweens.add({ targets: container, scale: 1.04, duration: 150 })
      })
      container.on('pointerout', () => {
        if (!isSelected) this.tweens.add({ targets: container, scale: 1, duration: 150 })
      })
      container.on('pointerdown', () => {
        this.selectedRecipe = recipe
        this.refreshContent()
        this.updateDetailPanel()
      })
    }

    return container
  }

  private createHerbCard(x: number, y: number, w: number, h: number, herb: Herb, qty: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.75)
    bg.lineStyle(2, herb.color, 0.9)
    this.roundedRect(bg, -w / 2, -h / 2, w, h, 10)

    const iconBg = this.add.graphics()
    iconBg.fillStyle(herb.color, 0.2)
    iconBg.fillCircle(0, -h / 2 + 38, 28)
    iconBg.lineStyle(2, herb.color, 0.9)
    iconBg.strokeCircle(0, -h / 2 + 38, 28)

    const icon = this.add.text(0, -h / 2 + 38, herb.icon, {
      fontFamily: 'serif',
      fontSize: '28px'
    }).setOrigin(0.5)

    const name = this.add.text(0, -h / 2 + 82, herb.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const rarity = this.add.text(0, -h / 2 + 102, `[${RARITY_NAMES[herb.rarity]}]`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: '#' + RARITY_COLORS[herb.rarity].toString(16).padStart(6, '0')
    }).setOrigin(0.5)

    const qtyText = this.add.text(0, -h / 2 + 122, `数量: ${qty}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#ffd54f'
    }).setOrigin(0.5)

    container.add([bg, iconBg, icon, name, rarity, qtyText])
    container.setSize(w, h)

    return container
  }

  private createPillCard(x: number, y: number, w: number, h: number, pill: Pill, qty: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const isSelected = this.selectedPill?.id === pill.id

    const bg = this.add.graphics()
    if (isSelected) {
      bg.fillStyle(pill.color, 0.25)
      bg.lineStyle(3, pill.color, 1)
    } else {
      bg.fillStyle(0x000000, 0.75)
      bg.lineStyle(2, pill.color, 0.9)
    }
    this.roundedRect(bg, -w / 2, -h / 2, w, h, 10)

    const iconBg = this.add.graphics()
    iconBg.fillStyle(pill.color, 0.2)
    iconBg.fillCircle(0, -h / 2 + 38, 28)
    iconBg.lineStyle(2, pill.color, 0.9)
    iconBg.strokeCircle(0, -h / 2 + 38, 28)

    const icon = this.add.text(0, -h / 2 + 38, pill.icon, {
      fontFamily: 'serif',
      fontSize: '28px'
    }).setOrigin(0.5)

    const name = this.add.text(0, -h / 2 + 82, pill.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const rarity = this.add.text(0, -h / 2 + 102, `[${RARITY_NAMES[pill.rarity]}]`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: '#' + RARITY_COLORS[pill.rarity].toString(16).padStart(6, '0')
    }).setOrigin(0.5)

    const qtyText = this.add.text(0, -h / 2 + 122, `数量: ${qty}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#ffd54f'
    }).setOrigin(0.5)

    container.add([bg, iconBg, icon, name, rarity, qtyText])
    container.setSize(w, h)

    container.setInteractive({ useHandCursor: true })
    container.on('pointerover', () => {
      if (!isSelected) this.tweens.add({ targets: container, scale: 1.04, duration: 150 })
    })
    container.on('pointerout', () => {
      if (!isSelected) this.tweens.add({ targets: container, scale: 1, duration: 150 })
    })
    container.on('pointerdown', () => {
      this.selectedPill = pill
      this.refreshContent()
      this.updateDetailPanel()
    })

    return container
  }

  private createDetailPanel(width: number, height: number): void {
    this.detailPanel = this.add.container(width / 2, height - 110)
    const panelW = width - 80
    const panelH = 110

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.8)
    bg.lineStyle(2, 0xffd54f, 0.6)
    this.roundedRect(bg, -panelW / 2, -panelH / 2, panelW, panelH, 12)

    const placeholder = this.add.text(0, 0, '选择丹方或丹药查看详情', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#78909c'
    }).setOrigin(0.5)

    this.detailPanel.add([bg, placeholder])
    this.detailPanel.setSize(panelW, panelH)
  }

  private updateDetailPanel(): void {
    const panelW = this.scale.width - 80
    const panelH = 110
    this.detailPanel.removeAll(true)

    const bg = this.add.graphics()
    let borderColor = 0xffd54f
    if (this.selectedRecipe) borderColor = this.selectedRecipe.color
    else if (this.selectedPill) borderColor = this.selectedPill.color
    bg.fillStyle(0x000000, 0.85)
    bg.lineStyle(2, borderColor, 0.8)
    this.roundedRect(bg, -panelW / 2, -panelH / 2, panelW, panelH, 12)
    this.detailPanel.add(bg)

    if (this.selectedRecipe) {
      this.renderRecipeDetail(panelW, panelH)
    } else if (this.selectedPill) {
      this.renderPillDetail(panelW, panelH)
    } else {
      const placeholder = this.add.text(0, 0, '选择丹方或丹药查看详情', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#78909c'
      }).setOrigin(0.5)
      this.detailPanel.add(placeholder)
    }
  }

  private renderRecipeDetail(panelW: number, panelH: number): void {
    const r = this.selectedRecipe!
    const resultPill = getPillById(r.resultPillId)
    const successRate = this.alchemyManager.calculateSuccessRate(r, this.player.level)
    const check = this.alchemyManager.canCraft(this.alchemy, r.id, this.player.gold, this.player.spirit)

    const leftX = -panelW / 2 + 30
    const iconBg = this.add.graphics()
    iconBg.fillStyle(r.color, 0.25)
    iconBg.fillCircle(leftX + 25, 0, 32)
    iconBg.lineStyle(3, r.color, 1)
    iconBg.strokeCircle(leftX + 25, 0, 32)

    const icon = this.add.text(leftX + 25, 0, resultPill?.icon || '📜', {
      fontFamily: 'serif',
      fontSize: '30px'
    }).setOrigin(0.5)

    const name = this.add.text(leftX + 75, -28, `${r.name}  [${RARITY_NAMES[r.rarity]}]`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#' + r.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    })

    const desc = this.add.text(leftX + 75, -2, r.description, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#b0bec5',
      wordWrap: { width: 350 }
    })

    const matsText = r.materials.map(m => {
      const h = getHerbById(m.herbId)
      const have = this.alchemyManager.getHerbQuantity(this.alchemy, m.herbId)
      const ok = have >= m.amount
      return `${h?.icon || ''}${h?.name || m.herbId} ${have}/${m.amount}`
    }).join('  ')

    const mats = this.add.text(leftX + 75, 25, `材料: ${matsText}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: check.canCraft ? '#81c784' : '#ef5350'
    })

    const cost = this.add.text(leftX + 75, 45,
      `消耗: 💰${r.goldCost} ✨${r.spiritCost}  |  成功率: ${Math.floor(successRate * 100)}%  |  产出: ${resultPill?.name} x${r.resultAmount}`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '13px',
        color: '#ffd54f'
      })

    this.detailPanel.add([iconBg, icon, name, desc, mats, cost])

    if (r.isUnlocked) {
      const btnX = panelW / 2 - 80
      const craftBtn = this.createActionButton(btnX, 0, 140, 50, '⚗️ 炼制', check.canCraft ? 0x81c784 : 0x546e7a, check.canCraft, () => this.craftPill(r.id))
      this.detailPanel.add(craftBtn)
    }
  }

  private renderPillDetail(panelW: number, panelH: number): void {
    const p = this.selectedPill!
    const qty = this.alchemyManager.getPillQuantity(this.alchemy, p.id)
    const activeBuff = this.alchemy.activeBuffs.find(b => b.pillId === p.id && b.endTime > Date.now())

    const leftX = -panelW / 2 + 30
    const iconBg = this.add.graphics()
    iconBg.fillStyle(p.color, 0.25)
    iconBg.fillCircle(leftX + 25, 0, 32)
    iconBg.lineStyle(3, p.color, 1)
    iconBg.strokeCircle(leftX + 25, 0, 32)

    const icon = this.add.text(leftX + 25, 0, p.icon, {
      fontFamily: 'serif',
      fontSize: '30px'
    }).setOrigin(0.5)

    const name = this.add.text(leftX + 75, -28, `${p.name}  [${RARITY_NAMES[p.rarity]}]  x${qty}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#' + p.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    })

    const desc = this.add.text(leftX + 75, -2, p.description, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#b0bec5',
      wordWrap: { width: 350 }
    })

    const effectsText = p.effects.map(e => {
      const names: Record<string, string> = {
        attack: '攻击', defense: '防御', health: '最大生命', mana: '最大灵力',
        exp: '经验', heal: '回复生命', manaRestore: '回复灵力'
      }
      const dur = e.duration ? `（${Math.floor(e.duration / 60000)}分钟）` : ''
      return `${names[e.type] || e.type}+${e.value}${dur}`
    }).join('  ')

    const effects = this.add.text(leftX + 75, 25, `效果: ${effectsText}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: '#81c784'
    })

    const buffText = activeBuff
      ? `⏳ 生效中，剩余 ${Math.ceil((activeBuff.endTime - Date.now()) / 60000)} 分钟`
      : p.stackable ? '可叠加使用' : ''

    if (buffText) {
      const status = this.add.text(leftX + 75, 45, buffText, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '13px',
        color: activeBuff ? '#4fc3f7' : '#b0bec5'
      })
      this.detailPanel.add(status)
    }

    this.detailPanel.add([iconBg, icon, name, desc, effects])

    const canUse = qty > 0 && (!activeBuff || p.stackable)
    const btnX = panelW / 2 - 80
    const useBtn = this.createActionButton(btnX, 0, 140, 50, '💊 服用', canUse ? 0xffd54f : 0x546e7a, canUse, () => this.usePill(p.id))
    this.detailPanel.add(useBtn)
  }

  private createActionButton(x: number, y: number, w: number, h: number, label: string, color: number, enabled: boolean, action: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const bg = this.add.graphics()
    bg.fillStyle(color, enabled ? 0.9 : 0.5)
    bg.lineStyle(2, color, enabled ? 1 : 0.5)
    this.roundedRect(bg, -w / 2, -h / 2, w, h, 10)

    const text = this.add.text(0, 0, label, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(w, h)

    if (enabled) {
      container.setInteractive({ useHandCursor: true })
      container.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.08, duration: 150 }))
      container.on('pointerout', () => this.tweens.add({ targets: container, scale: 1, duration: 150 }))
      container.on('pointerdown', action)
    }

    return container
  }

  private craftPill(recipeId: string): void {
    const save = this.saveManager.loadGame()!
    const result = this.alchemyManager.craft(save.alchemy, recipeId, save.player)
    this.alchemy = save.alchemy
    this.player = save.player

    if (result.success) {
      this.showMessage(`✨ 炼制成功！获得 ${result.pill.icon}${result.pill.name} x${result.amount}`)
      this.cameras.main.flash(300, 129, 199, 132)
    } else {
      this.showMessage(`❌ ${result.reason}`)
      this.cameras.main.flash(200, 239, 83, 80)
      this.cameras.main.shake(150, 0.005)
    }

    this.saveManager.saveGame(save)
    this.updateResourceText()
    this.refreshContent()
    this.updateDetailPanel()
  }

  private usePill(pillId: string): void {
    const save = this.saveManager.loadGame()!
    const result = this.alchemyManager.usePill(save.alchemy, pillId, save.player)
    this.alchemy = save.alchemy
    this.player = save.player

    if (result.success) {
      const buff = this.alchemyManager.getBuffBonus(save.alchemy)
      this.saveManager.recalcPlayerStats(this.player, buff)
      this.showMessage(`💊 服用成功！${result.effects.join('，')}`)
      this.cameras.main.flash(300, 255, 213, 79)
    } else {
      this.showMessage(`❌ ${result.reason || '无法服用'}`)
    }

    this.saveManager.saveGame(save)
    this.updateResourceText()
    this.updateBuffText()
    this.refreshContent()
    this.updateDetailPanel()
  }

  private showMessage(msg: string): void {
    this.messageText.setText(msg)
    this.messageText.setAlpha(0)
    this.tweens.add({
      targets: this.messageText,
      alpha: 1,
      duration: 250,
      yoyo: true,
      hold: 2000,
      repeatDelay: 300,
      ease: 'Quad.easeOut'
    })
  }

  private updateResourceText(): void {
    const buff = this.alchemyManager.getBuffBonus(this.alchemy)
    this.resourceText.setText(
      `💰 金币: ${this.player.gold}\n` +
      `✨ 灵气: ${this.player.spirit}\n` +
      `⚔ 攻击: ${this.player.attack}${buff.attack > 0 ? ` (+${buff.attack})` : ''}\n` +
      `🛡 防御: ${this.player.defense}${buff.defense > 0 ? ` (+${buff.defense})` : ''}`
    )
  }

  private updateBuffText(): void {
    const buffs = this.alchemyManager.getActiveBuffs(this.alchemy)
    if (buffs.length === 0) {
      this.buffText.setText('')
      return
    }
    const now = Date.now()
    const lines = buffs.map(b => {
      const pill = getPillById(b.pillId)
      const mins = Math.ceil((b.endTime - now) / 60000)
      return `${pill?.icon || '💊'} ${pill?.name || ''} 剩${mins}分钟`
    })
    this.buffText.setText('生效增益:\n' + lines.join('\n'))
  }

  private roundedRect(graphics: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number): void {
    graphics.beginPath()
    graphics.moveTo(x + r, y)
    graphics.lineTo(x + w - r, y)
    graphics.arc(x + w - r, y + r, r, -Math.PI / 2, 0)
    graphics.lineTo(x + w, y + h - r)
    graphics.arc(x + w - r, y + h - r, r, 0, Math.PI / 2)
    graphics.lineTo(x + r, y + h)
    graphics.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI)
    graphics.lineTo(x, y + r)
    graphics.arc(x + r, y + r, r, Math.PI, -Math.PI / 2)
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
