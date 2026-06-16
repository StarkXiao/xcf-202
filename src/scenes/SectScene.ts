import Phaser from 'phaser'
import type { Sect, Building, Disciple, DiscipleTemplate, SectQuest } from '../types'
import { SaveManager } from '../managers/SaveManager'
import { SectManager } from '../managers/SectManager'
import { RESOURCE_ICONS, RARITY_NAMES, RARITY_COLORS, generateRecruitPool, calculateUpgradeCost } from '../data/sectData'

type TabType = 'overview' | 'disciples' | 'buildings' | 'quests' | 'recruit'

export class SectScene extends Phaser.Scene {
  private saveManager = SaveManager.getInstance()
  private sectManager = SectManager.getInstance()
  private sect!: Sect
  private currentTab: TabType = 'overview'
  private tabButtons: Map<TabType, Phaser.GameObjects.Container> = new Map()
  private contentPanel!: Phaser.GameObjects.Container
  private resourceTexts: Map<string, Phaser.GameObjects.Text> = new Map()
  private recruitPool: DiscipleTemplate[] = []
  private selectedDisciple: Disciple | null = null
  private selectedBuilding: Building | null = null
  private selectedQuest: SectQuest | null = null
  private productionText!: Phaser.GameObjects.Text
  private updateTimer!: Phaser.Time.TimerEvent

  constructor() {
    super({ key: 'SectScene' })
  }

  init(): void {
    const save = this.saveManager.loadGame()!
    this.sect = save.sect
    this.sectManager.checkDailyReset(this.sect)
    this.recruitPool = generateRecruitPool(this.sect.level)
  }

  create(): void {
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor(0x0a0a15)
    this.createBackground(width, height)

    const title = this.add.text(width / 2, 45, `${this.sect.name} Lv.${this.sect.level}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '36px',
      color: '#ffd54f',
      stroke: '#5d4037',
      strokeThickness: 3
    }).setOrigin(0.5)

    this.createResourceBar(width)
    this.createTabButtons(width, height)
    this.createContentPanel(width, height)
    this.createBackButton(width, height)

    this.switchTab('overview')

    this.updateTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateQuestProgress,
      callbackScope: this,
      loop: true
    })

    this.cameras.main.fadeIn(500)
  }

  private updateQuestProgress(): void {
    this.sectManager.updateQuestProgress(this.sect)
    if (this.currentTab === 'quests') {
      this.refreshContent()
    }
    this.updateResourceTexts()
  }

  private createBackground(width: number, height: number): void {
    const particles = this.add.particles(0, 0, 'sect-particle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: { min: 4000, max: 8000 },
      speedY: { min: -10, max: -20 },
      speedX: { min: -3, max: 3 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: [0x4fc3f7, 0xffd54f, 0x81c784, 0xba68c8],
      quantity: 1,
      frequency: 400
    })

    for (let i = 0; i < 4; i++) {
      const glow = this.add.graphics()
      glow.fillStyle([0x1a237e, 0x004d40, 0x4a148c, 0x311b92][i], 0.1)
      glow.fillCircle(
        width * (0.15 + i * 0.25),
        height * (0.35 + Math.sin(i) * 0.2),
        200 + Math.random() * 100
      )
    }
  }

  private createResourceBar(width: number): void {
    const barY = 90
    const resources = ['gold', 'spirit', 'stone', 'wood', 'herb']
    const spacing = 180
    const startX = width / 2 - (resources.length - 1) * spacing / 2

    resources.forEach((res, index) => {
      const x = startX + index * spacing
      const icon = this.add.text(x, barY, RESOURCE_ICONS[res] || '?', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '24px'
      }).setOrigin(0.5, 0.5)

      const value = this.add.text(x + 25, barY, '', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#ffffff'
      }).setOrigin(0, 0.5)

      this.resourceTexts.set(res, value)
    })

    this.updateResourceTexts()

    this.productionText = this.add.text(width / 2, barY + 35, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#81c784'
    }).setOrigin(0.5)
    this.updateProductionText()

    const collectBtn = this.createButton(width - 100, barY, '📥 收取', 0x4fc3f7, () => this.collectResources())
    collectBtn.setScale(0.8)
  }

  private updateResourceTexts(): void {
    this.resourceTexts.forEach((text, key) => {
      const value = this.sect.resources[key as keyof typeof this.sect.resources]
      text.setText(Math.floor(value).toString())
    })
  }

  private updateProductionText(): void {
    const production = this.sectManager.getTotalProduction(this.sect)
    const parts: string[] = []
    for (const [key, value] of Object.entries(production)) {
      if (value && value > 0) {
        parts.push(`${RESOURCE_ICONS[key]}+${value.toFixed(1)}/s`)
      }
    }
    this.productionText.setText(parts.length > 0 ? parts.join('  ') : '暂无产出')
  }

  private collectResources(): void {
    const { collected, seconds } = this.sectManager.collectResources(this.sect)
    const collectedParts: string[] = []

    for (const [key, value] of Object.entries(collected)) {
      if (value && value > 0) {
        collectedParts.push(`${RESOURCE_ICONS[key]}+${Math.floor(value)}`)
      }
    }

    if (collectedParts.length > 0) {
      const timeStr = this.formatTime(seconds)
      this.showToast(`离线${timeStr}，获得：${collectedParts.join('  ')}`)
    } else {
      this.showToast('暂无可收取的资源')
    }

    this.updateResourceTexts()
    this.updateProductionText()
    this.cameras.main.flash(200, 79, 195, 247)
  }

  private formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}秒`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
    return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分钟`
  }

  private showToast(message: string): void {
    const { width } = this.scale
    const toast = this.add.text(width / 2, 180, message, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: 160,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: toast,
            alpha: 0,
            y: 140,
            duration: 300,
            onComplete: () => toast.destroy()
          })
        })
      }
    })
  }

  private createTabButtons(width: number, height: number): void {
    const tabs: { key: TabType; label: string; icon: string }[] = [
      { key: 'overview', label: '总览', icon: '🏠' },
      { key: 'disciples', label: '弟子', icon: '👥' },
      { key: 'buildings', label: '建筑', icon: '🏛️' },
      { key: 'quests', label: '任务', icon: '📜' },
      { key: 'recruit', label: '招募', icon: '🎯' }
    ]

    const tabY = 160
    const tabWidth = 120
    const tabHeight = 45
    const spacing = 15
    const totalWidth = tabs.length * tabWidth + (tabs.length - 1) * spacing
    const startX = (width - totalWidth) / 2 + tabWidth / 2

    tabs.forEach((tab, index) => {
      const x = startX + index * (tabWidth + spacing)
      const btn = this.createTabButton(x, tabY, tabWidth, tabHeight, tab.icon + ' ' + tab.label, tab.key)
      this.tabButtons.set(tab.key, btn)
    })
  }

  private createTabButton(x: number, y: number, width: number, height: number, label: string, tabKey: TabType): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const isActive = this.currentTab === tabKey

    const bg = this.add.graphics()
    bg.fillStyle(isActive ? 0x4fc3f7 : 0x000000, isActive ? 0.9 : 0.7)
    bg.lineStyle(2, isActive ? 0x4fc3f7 : 0x78909c, isActive ? 1 : 0.8)
    this.roundedRect(bg, -width / 2, -height / 2, width, height, 10)

    const text = this.add.text(0, 0, label, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: isActive ? '#ffffff' : '#b0bec5'
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(width, height)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      if (this.currentTab !== tabKey) {
        this.tweens.add({ targets: container, scale: 1.05, duration: 150 })
      }
    })

    container.on('pointerout', () => {
      if (this.currentTab !== tabKey) {
        this.tweens.add({ targets: container, scale: 1, duration: 150 })
      }
    })

    container.on('pointerdown', () => this.switchTab(tabKey))

    return container
  }

  private switchTab(tab: TabType): void {
    this.currentTab = tab

    this.tabButtons.forEach((btn, key) => {
      const isActive = key === tab
      const bg = btn.list[0] as Phaser.GameObjects.Graphics
      const text = btn.list[1] as Phaser.GameObjects.Text

      bg.clear()
      bg.fillStyle(isActive ? 0x4fc3f7 : 0x000000, isActive ? 0.9 : 0.7)
      bg.lineStyle(2, isActive ? 0x4fc3f7 : 0x78909c, isActive ? 1 : 0.8)
      this.roundedRect(bg, -60, -22.5, 120, 45, 10)

      text.setColor(isActive ? '#ffffff' : '#b0bec5')
      btn.setScale(1)
    })

    this.refreshContent()
  }

  private createContentPanel(width: number, height: number): void {
    this.contentPanel = this.add.container(0, 0)
  }

  private refreshContent(): void {
    this.contentPanel.removeAll(true)
    this.selectedDisciple = null
    this.selectedBuilding = null
    this.selectedQuest = null

    const { width, height } = this.scale

    switch (this.currentTab) {
      case 'overview':
        this.createOverviewContent(width, height)
        break
      case 'disciples':
        this.createDisciplesContent(width, height)
        break
      case 'buildings':
        this.createBuildingsContent(width, height)
        break
      case 'quests':
        this.createQuestsContent(width, height)
        break
      case 'recruit':
        this.createRecruitContent(width, height)
        break
    }
  }

  private createOverviewContent(width: number, height: number): void {
    const panelY = 230
    const panelHeight = height - 310

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.6)
    bg.lineStyle(2, 0x4fc3f7, 0.5)
    this.roundedRect(bg, 30, panelY, width - 60, panelHeight, 16)
    this.contentPanel.add(bg)

    const sectInfo = this.add.text(width / 2, panelY + 30,
      `${this.sect.name}  Lv.${this.sect.level}  |  声望: ${this.sect.reputation}  |  弟子: ${this.sect.disciples.length}/${this.sect.maxDisciples}`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '22px',
        color: '#ffd54f'
      }).setOrigin(0.5)
    this.contentPanel.add(sectInfo)

    const expPercent = (this.sect.exp / this.sect.expToNext) * 100
    const expBg = this.add.graphics()
    expBg.fillStyle(0x2a2a4a, 0.8)
    this.roundedRect(expBg, width / 2 - 200, panelY + 55, 400, 20, 10)
    expBg.fillStyle(0x4fc3f7, 0.9)
    this.roundedRect(expBg, width / 2 - 200, panelY + 55, 400 * expPercent / 100, 20, 10)
    this.contentPanel.add(expBg)

    const expText = this.add.text(width / 2, panelY + 65,
      `经验: ${this.sect.exp}/${this.sect.expToNext} (${expPercent.toFixed(1)}%)`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '14px',
        color: '#ffffff'
      }).setOrigin(0.5)
    this.contentPanel.add(expText)

    const statStartY = panelY + 100
    const stats = [
      { label: '今日已招募', value: `${this.sect.dailyRecruitsUsed}/${this.sect.dailyRecruitLimit}`, color: 0x81c784 },
      { label: '进行中任务', value: `${this.sect.quests.filter(q => q.status === 'in_progress').length}`, color: 0xffd54f },
      { label: '已完成任务', value: `${this.sect.quests.filter(q => q.status === 'completed' || q.status === 'claimed').length}`, color: 0x4fc3f7 },
      { label: '已建建筑', value: `${this.sect.buildings.filter(b => b.level > 0).length}/${this.sect.buildings.length}`, color: 0xba68c8 }
    ]

    stats.forEach((stat, index) => {
      const y = statStartY + index * 35
      const statBg = this.add.graphics()
      statBg.fillStyle(stat.color, 0.15)
      this.roundedRect(statBg, width / 2 - 180, y - 15, 360, 30, 8)
      this.contentPanel.add(statBg)

      const statText = this.add.text(width / 2 - 160, y, stat.label, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '16px',
        color: '#b0bec5'
      }).setOrigin(0, 0.5)
      this.contentPanel.add(statText)

      const valueText = this.add.text(width / 2 + 160, y, stat.value, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '18px',
        color: '#' + stat.color.toString(16).padStart(6, '0'),
        fontStyle: 'bold'
      }).setOrigin(1, 0.5)
      this.contentPanel.add(valueText)
    })

    const productionTitle = this.add.text(width / 2, statStartY + 160, '📊 资源产出 (每秒)', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffd54f'
    }).setOrigin(0.5)
    this.contentPanel.add(productionTitle)

    const production = this.sectManager.getTotalProduction(this.sect)
    const resKeys = ['gold', 'spirit', 'stone', 'wood', 'herb']
    resKeys.forEach((key, index) => {
      const x = width / 2 - 200 + index * 100
      const y = statStartY + 200
      const value = production[key as keyof typeof production] || 0

      const prodBg = this.add.graphics()
      prodBg.fillStyle(0xffffff, 0.05)
      this.roundedRect(prodBg, x - 40, y - 20, 80, 40, 8)
      this.contentPanel.add(prodBg)

      const icon = this.add.text(x, y - 5, RESOURCE_ICONS[key], {
        fontSize: '20px'
      }).setOrigin(0.5)
      this.contentPanel.add(icon)

      const valText = this.add.text(x, y + 15, `+${value.toFixed(1)}`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '14px',
        color: '#81c784'
      }).setOrigin(0.5)
      this.contentPanel.add(valText)
    })

    if (this.sect.disciples.length > 0) {
      const topDisciple = [...this.sect.disciples].sort((a, b) => b.combatPower - a.combatPower)[0]
      const discipleTitle = this.add.text(width / 2, statStartY + 260, '⭐ 最强弟子', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#ffd54f'
      }).setOrigin(0.5)
      this.contentPanel.add(discipleTitle)

      const discipleCard = this.createDiscipleCard(width / 2, statStartY + 330, topDisciple, 0, true)
      this.contentPanel.add(discipleCard)
    }
  }

  private createDisciplesContent(width: number, height: number): void {
    const panelY = 230
    const panelHeight = height - 310

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.6)
    bg.lineStyle(2, 0x81c784, 0.5)
    this.roundedRect(bg, 30, panelY, width - 60, panelHeight, 16)
    this.contentPanel.add(bg)

    const title = this.add.text(50, panelY + 25, `👥 弟子列表 (${this.sect.disciples.length}/${this.sect.maxDisciples})`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#81c784'
    }).setOrigin(0, 0.5)
    this.contentPanel.add(title)

    if (this.sect.disciples.length === 0) {
      const emptyText = this.add.text(width / 2, panelY + panelHeight / 2,
        '暂无弟子，前往招募吧！',
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '24px',
          color: '#78909c'
        }).setOrigin(0.5)
      this.contentPanel.add(emptyText)
      return
    }

    const scrollAreaHeight = panelHeight - 70
    const cardHeight = 100
    const cardWidth = 220
    const spacing = 15
    const cols = Math.floor((width - 90) / (cardWidth + spacing))

    const sortedDisciples = [...this.sect.disciples].sort((a, b) => {
      const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 }
      return rarityOrder[b.rarity] - rarityOrder[a.rarity] || b.combatPower - a.combatPower
    })

    sortedDisciples.forEach((disciple, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      const x = 60 + col * (cardWidth + spacing) + cardWidth / 2
      const y = panelY + 70 + row * (cardHeight + spacing) + cardHeight / 2

      const card = this.createDiscipleCard(x, y, disciple, index, false)
      this.contentPanel.add(card)
    })

    if (this.selectedDisciple) {
      this.createDiscipleDetailPanel(width, panelY + panelHeight - 150)
    }
  }

  private createDiscipleCard(x: number, y: number, disciple: Disciple, index: number, isOverview: boolean): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const cardWidth = isOverview ? 300 : 220
    const cardHeight = isOverview ? 120 : 100
    const isSelected = this.selectedDisciple?.id === disciple.id

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, isSelected ? 0.9 : 0.8)
    bg.lineStyle(3, disciple.color, isSelected ? 1 : 0.8)
    this.roundedRect(bg, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12)

    const avatarBg = this.add.graphics()
    avatarBg.fillStyle(disciple.color, 0.2)
    avatarBg.fillCircle(-cardWidth / 2 + 40, 0, 28)
    avatarBg.lineStyle(2, disciple.color, 0.9)
    avatarBg.strokeCircle(-cardWidth / 2 + 40, 0, 28)

    const avatar = this.add.text(-cardWidth / 2 + 40, 0, disciple.avatar, {
      fontSize: '28px'
    }).setOrigin(0.5)

    const name = this.add.text(-cardWidth / 2 + 80, -cardHeight / 2 + 25, disciple.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5)

    const rarityText = this.add.text(-cardWidth / 2 + 80, -cardHeight / 2 + 50,
      `${RARITY_NAMES[disciple.rarity]}  Lv.${disciple.level}`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '14px',
        color: '#' + disciple.color.toString(16).padStart(6, '0')
      }).setOrigin(0, 0.5)

    const combatText = this.add.text(-cardWidth / 2 + 80, -cardHeight / 2 + 72,
      `⚔ 战力: ${disciple.combatPower}  🌟 天赋: ${disciple.talent}`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#b0bec5'
      }).setOrigin(0, 0.5)

    const task = this.sectManager.getDiscipleCurrentTask(this.sect, disciple)
    const taskText = this.add.text(cardWidth / 2 - 10, -cardHeight / 2 + 72, task, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '11px',
      color: task === '空闲' ? '#81c784' : '#ffd54f'
    }).setOrigin(1, 0.5)

    container.add([bg, avatarBg, avatar, name, rarityText, combatText, taskText])

    if (!isOverview) {
      container.setSize(cardWidth, cardHeight)
      container.setInteractive({ useHandCursor: true })

      container.on('pointerover', () => {
        this.tweens.add({ targets: container, scale: 1.03, duration: 150 })
      })

      container.on('pointerout', () => {
        this.tweens.add({ targets: container, scale: 1, duration: 150 })
      })

      container.on('pointerdown', () => {
        this.selectedDisciple = disciple
        this.refreshContent()
      })
    }

    return container
  }

  private createDiscipleDetailPanel(width: number, y: number): void {
    if (!this.selectedDisciple) return

    const panelWidth = width - 100
    const panelHeight = 130

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.9)
    bg.lineStyle(2, this.selectedDisciple.color, 0.9)
    this.roundedRect(bg, 50, y, panelWidth, panelHeight, 14)
    this.contentPanel.add(bg)

    const title = this.add.text(70, y + 20, this.selectedDisciple.name + ' 详情', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5)
    this.contentPanel.add(title)

    const desc = this.add.text(70, y + 45,
      `等级: ${this.selectedDisciple.level}  |  战力: ${this.selectedDisciple.combatPower}  |  天赋: ${this.selectedDisciple.talent}  |  经验: ${this.selectedDisciple.exp}/${this.selectedDisciple.expToNext}`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '16px',
        color: '#b0bec5'
      }).setOrigin(0, 0.5)
    this.contentPanel.add(desc)

    const expPercent = (this.selectedDisciple.exp / this.selectedDisciple.expToNext) * 100
    const expBg = this.add.graphics()
    expBg.fillStyle(0x2a2a4a, 0.8)
    this.roundedRect(expBg, 70, y + 60, panelWidth - 40, 12, 6)
    expBg.fillStyle(this.selectedDisciple.color, 0.9)
    this.roundedRect(expBg, 70, y + 60, (panelWidth - 40) * expPercent / 100, 12, 6)
    this.contentPanel.add(expBg)

    if (this.selectedDisciple.assignedBuilding) {
      const unassignBtn = this.createButton(width - 120, y + 95, '取消派遣', 0xef5350, () => {
        this.sectManager.unassignDisciple(this.sect, this.selectedDisciple!.id)
        this.showToast('已取消派遣')
        this.refreshContent()
      })
      unassignBtn.setScale(0.75)
      this.contentPanel.add(unassignBtn)
    } else if (!this.sect.quests.some(q => q.assignedDisciple === this.selectedDisciple!.id && q.status === 'in_progress')) {
      const assignBtn = this.createButton(width - 120, y + 95, '派遣到建筑', 0x4fc3f7, () => {
        this.showBuildingAssignDialog()
      })
      assignBtn.setScale(0.75)
      this.contentPanel.add(assignBtn)
    }
  }

  private showBuildingAssignDialog(): void {
    if (!this.selectedDisciple) return

    const { width, height } = this.scale
    const availableBuildings = this.sect.buildings.filter(b => b.level > 0 && b.maxDisciples > 0 && b.assignedDisciples.length < b.maxDisciples)

    if (availableBuildings.length === 0) {
      this.showToast('没有可派遣的建筑')
      return
    }

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.8)
    overlay.fillRect(0, 0, width, height)
    this.contentPanel.add(overlay)

    const dialogWidth = 400
    const dialogHeight = 80 + availableBuildings.length * 60
    const dialogX = width / 2 - dialogWidth / 2
    const dialogY = height / 2 - dialogHeight / 2

    const dialogBg = this.add.graphics()
    dialogBg.fillStyle(0x1a1a2e, 0.98)
    dialogBg.lineStyle(2, 0x4fc3f7, 0.9)
    this.roundedRect(dialogBg, dialogX, dialogY, dialogWidth, dialogHeight, 16)
    this.contentPanel.add(dialogBg)

    const title = this.add.text(width / 2, dialogY + 35, '选择派遣建筑', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.contentPanel.add(title)

    availableBuildings.forEach((building, index) => {
      const btnY = dialogY + 70 + index * 55
      const btn = this.createBuildingButton(width / 2, btnY, 350, 45, building, () => {
        this.sectManager.assignDiscipleToBuilding(this.sect, this.selectedDisciple!.id, building.id)
        this.showToast(`${this.selectedDisciple!.name} 已派遣到 ${building.name}`)
        overlay.destroy()
        dialogBg.destroy()
        title.destroy()
        btn.destroy()
        this.refreshContent()
      })
      this.contentPanel.add(btn)
    })

    overlay.on('pointerdown', () => {
      overlay.destroy()
      dialogBg.destroy()
      title.destroy()
      this.contentPanel.list.filter(item => {
        const btn = item as Phaser.GameObjects.Container
        if (btn && btn.list && btn.list.length > 0) {
          btn.destroy()
        }
      })
    })
  }

  private createBuildingButton(x: number, y: number, width: number, height: number, building: Building, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.8)
    bg.lineStyle(2, building.color, 0.8)
    this.roundedRect(bg, -width / 2, -height / 2, width, height, 10)

    const name = this.add.text(-width / 2 + 20, 0, `${building.name} Lv.${building.level}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0, 0.5)

    const slots = this.add.text(width / 2 - 20, 0, `${building.assignedDisciples.length}/${building.maxDisciples}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#81c784'
    }).setOrigin(1, 0.5)

    container.add([bg, name, slots])
    container.setSize(width, height)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.05, duration: 150 }))
    container.on('pointerout', () => this.tweens.add({ targets: container, scale: 1, duration: 150 }))
    container.on('pointerdown', onClick)

    return container
  }

  private createBuildingsContent(width: number, height: number): void {
    const panelY = 230
    const panelHeight = height - 310

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.6)
    bg.lineStyle(2, 0xffd54f, 0.5)
    this.roundedRect(bg, 30, panelY, width - 60, panelHeight, 16)
    this.contentPanel.add(bg)

    const title = this.add.text(50, panelY + 25, '🏛️ 建筑列表', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#ffd54f'
    }).setOrigin(0, 0.5)
    this.contentPanel.add(title)

    const cardWidth = 280
    const cardHeight = 160
    const spacing = 20
    const cols = Math.floor((width - 90) / (cardWidth + spacing))

    this.sect.buildings.forEach((building, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      const x = 60 + col * (cardWidth + spacing) + cardWidth / 2
      const y = panelY + 80 + row * (cardHeight + spacing) + cardHeight / 2

      const card = this.createBuildingCard(x, y, cardWidth, cardHeight, building)
      this.contentPanel.add(card)
    })

    if (this.selectedBuilding) {
      this.createBuildingDetailPanel(width, panelY + panelHeight - 180)
    }
  }

  private createBuildingCard(x: number, y: number, cardWidth: number, cardHeight: number, building: Building): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const isUnlocked = building.level > 0
    const isSelected = this.selectedBuilding?.id === building.id

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, isSelected ? 0.9 : 0.8)
    bg.lineStyle(3, building.color, isSelected ? 1 : (isUnlocked ? 0.8 : 0.4))
    bg.alpha = isUnlocked ? 1 : 0.6
    this.roundedRect(bg, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12)
    bg.alpha = 1

    const iconBg = this.add.graphics()
    iconBg.fillStyle(building.color, isUnlocked ? 0.25 : 0.1)
    iconBg.fillCircle(-cardWidth / 2 + 50, -20, 30)
    iconBg.lineStyle(2, building.color, isUnlocked ? 0.9 : 0.4)
    iconBg.strokeCircle(-cardWidth / 2 + 50, -20, 30)

    const buildingIcons: Record<string, string> = {
      hall: '🏛️',
      dormitory: '🏠',
      training: '⚔️',
      alchemy: '⚗️',
      warehouse: '💰',
      spirit: '✨'
    }
    const icon = this.add.text(-cardWidth / 2 + 50, -20, buildingIcons[building.type] || '🏗️', {
      fontSize: '28px'
    }).setOrigin(0.5)

    const name = this.add.text(-cardWidth / 2 + 100, -45, building.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5)

    const levelText = this.add.text(-cardWidth / 2 + 100, -15,
      isUnlocked ? `Lv.${building.level}/${building.maxLevel}` : '🔒 未建造',
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '14px',
        color: isUnlocked ? '#' + building.color.toString(16).padStart(6, '0') : '#78909c'
      }).setOrigin(0, 0.5)

    if (isUnlocked) {
      const disciplesText = this.add.text(-cardWidth / 2 + 100, 10,
        `👥 弟子: ${building.assignedDisciples.length}/${building.maxDisciples}`,
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '13px',
          color: '#b0bec5'
        }).setOrigin(0, 0.5)

      const production = this.sectManager.getBuildingProduction(this.sect, building)
      const prodParts: string[] = []
      for (const [key, value] of Object.entries(production)) {
        if (value && value > 0) {
          prodParts.push(`${RESOURCE_ICONS[key]}+${value.toFixed(1)}/s`)
        }
      }

      const prodText = this.add.text(-cardWidth / 2 + 100, 35,
        prodParts.length > 0 ? prodParts.join(' ') : '无产出',
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '12px',
          color: '#81c784'
        }).setOrigin(0, 0.5)

      container.add([disciplesText, prodText])
    }

    const desc = this.add.text(0, cardHeight / 2 - 20, building.description, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '11px',
      color: '#78909c',
      align: 'center',
      wordWrap: { width: cardWidth - 20 }
    }).setOrigin(0.5, 1)

    container.add([bg, iconBg, icon, name, levelText, desc])
    container.setSize(cardWidth, cardHeight)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.03, duration: 150 })
    })

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 150 })
    })

    container.on('pointerdown', () => {
      this.selectedBuilding = building
      this.refreshContent()
    })

    return container
  }

  private createBuildingDetailPanel(width: number, y: number): void {
    if (!this.selectedBuilding) return

    const panelWidth = width - 100
    const panelHeight = 160

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.9)
    bg.lineStyle(2, this.selectedBuilding.color, 0.9)
    this.roundedRect(bg, 50, y, panelWidth, panelHeight, 14)
    this.contentPanel.add(bg)

    const title = this.add.text(70, y + 25, this.selectedBuilding.name + ' 详情', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5)
    this.contentPanel.add(title)

    const b = this.selectedBuilding
    const isMax = b.level >= b.maxLevel
    const cost = calculateUpgradeCost(b)

    let infoText = `等级: ${b.level}/${b.maxLevel}`
    if (b.maxDisciples > 0) {
      infoText += `  |  弟子上限: ${b.maxDisciples}`
    }

    const production = this.sectManager.getBuildingProduction(this.sect, b)
    const prodParts: string[] = []
    for (const [key, value] of Object.entries(production)) {
      if (value && value > 0) {
        prodParts.push(`${RESOURCE_ICONS[key]}+${value.toFixed(1)}/s`)
      }
    }
    if (prodParts.length > 0) {
      infoText += `  |  产出: ${prodParts.join(' ')}`
    }

    const info = this.add.text(70, y + 50, infoText, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#b0bec5'
    }).setOrigin(0, 0.5)
    this.contentPanel.add(info)

    if (!isMax) {
      const costParts: string[] = []
      let canAfford = true
      for (const [key, value] of Object.entries(cost)) {
        if (value) {
          const have = this.sect.resources[key as keyof typeof this.sect.resources]
          costParts.push(`${RESOURCE_ICONS[key]}${value} (${have >= value ? '✓' : '✗'})`)
          if (have < value) canAfford = false
        }
      }

      const costText = this.add.text(70, y + 75,
        `${b.level === 0 ? '建造' : '升级'}消耗: ${costParts.join('  ')}`,
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '14px',
          color: canAfford ? '#81c784' : '#ef5350'
        }).setOrigin(0, 0.5)
      this.contentPanel.add(costText)

      const actionBtn = this.createButton(width - 120, y + 115,
        b.level === 0 ? '🔨 建造' : '⬆ 升级',
        canAfford ? 0x4fc3f7 : 0x455a64,
        () => {
          if (canAfford) {
            if (this.sectManager.upgradeBuilding(this.sect, b.id)) {
              this.showToast(`${b.name} ${b.level === 1 ? '建造' : '升级'}成功！`)
              this.cameras.main.flash(300, 255, 213, 79)
              this.updateResourceTexts()
              this.updateProductionText()
              this.refreshContent()
            }
          } else {
            this.showToast('资源不足')
          }
        })
      actionBtn.setScale(0.85)
      if (!canAfford) actionBtn.disableInteractive()
      this.contentPanel.add(actionBtn)
    } else {
      const maxText = this.add.text(70, y + 75, '⭐ 已达最高等级', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '16px',
        color: '#ffd54f',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5)
      this.contentPanel.add(maxText)
    }

    if (b.assignedDisciples.length > 0) {
      const assignedText = this.add.text(70, y + 100,
        `已派遣弟子: ${b.assignedDisciples.length}人`,
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '14px',
          color: '#81c784'
        }).setOrigin(0, 0.5)
      this.contentPanel.add(assignedText)
    }
  }

  private createQuestsContent(width: number, height: number): void {
    const panelY = 230
    const panelHeight = height - 310

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.6)
    bg.lineStyle(2, 0xba68c8, 0.5)
    this.roundedRect(bg, 30, panelY, width - 60, panelHeight, 16)
    this.contentPanel.add(bg)

    const title = this.add.text(50, panelY + 25, '📜 宗门任务', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#ba68c8'
    }).setOrigin(0, 0.5)
    this.contentPanel.add(title)

    const quests = this.sect.quests.filter(q => q.status !== 'claimed')
    if (quests.length === 0) {
      const emptyText = this.add.text(width / 2, panelY + panelHeight / 2,
        '暂无可用任务',
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '24px',
          color: '#78909c'
        }).setOrigin(0.5)
      this.contentPanel.add(emptyText)
      return
    }

    const cardWidth = width - 120
    const cardHeight = 120
    const spacing = 15

    quests.slice(0, 5).forEach((quest, index) => {
      const x = width / 2
      const y = panelY + 80 + index * (cardHeight + spacing) + cardHeight / 2
      const card = this.createQuestCard(x, y, cardWidth, cardHeight, quest)
      this.contentPanel.add(card)
    })
  }

  private createQuestCard(x: number, y: number, cardWidth: number, cardHeight: number, quest: SectQuest): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const isSelected = this.selectedQuest?.id === quest.id

    const statusColors: Record<string, number> = {
      available: 0x4fc3f7,
      in_progress: 0xffd54f,
      completed: 0x81c784
    }
    const statusNames: Record<string, string> = {
      available: '可接取',
      in_progress: '进行中',
      completed: '已完成'
    }

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, isSelected ? 0.9 : 0.8)
    bg.lineStyle(3, quest.color, isSelected ? 1 : 0.8)
    this.roundedRect(bg, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12)

    const title = this.add.text(-cardWidth / 2 + 20, -cardHeight / 2 + 25, quest.title, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5)

    const statusText = this.add.text(cardWidth / 2 - 20, -cardHeight / 2 + 25,
      statusNames[quest.status],
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '14px',
        color: '#' + statusColors[quest.status].toString(16).padStart(6, '0'),
        fontStyle: 'bold'
      }).setOrigin(1, 0.5)

    const desc = this.add.text(-cardWidth / 2 + 20, -cardHeight / 2 + 50, quest.description, {
      fontFamily: '"Microsoft YaHei',
      fontSize: '14px',
      color: '#b0bec5',
      wordWrap: { width: cardWidth - 200 }
    }).setOrigin(0, 0.5)

    const reqText = this.add.text(-cardWidth / 2 + 20, -cardHeight / 2 + 75,
      `⚔ 战力需求: ${quest.combatPowerRequired}  |  ⏱ 耗时: ${Math.floor(quest.duration / 60)}分${quest.duration % 60}秒`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '13px',
        color: '#78909c'
      }).setOrigin(0, 0.5)

    const rewardParts: string[] = []
    for (const [key, value] of Object.entries(quest.rewards)) {
      if (value) {
        if (key === 'reputation') {
          rewardParts.push(`🏆${value}`)
        } else {
          rewardParts.push(`${RESOURCE_ICONS[key]}${value}`)
        }
      }
    }
    const rewardText = this.add.text(-cardWidth / 2 + 20, -cardHeight / 2 + 98,
      `奖励: ${rewardParts.join('  ')}`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '14px',
        color: '#ffd54f'
      }).setOrigin(0, 0.5)

    container.add([bg, title, statusText, desc, reqText, rewardText])

    if (quest.status === 'in_progress') {
      const progress = quest.progress / quest.targetProgress
      const progressBg = this.add.graphics()
      progressBg.fillStyle(0x2a2a4a, 0.8)
      this.roundedRect(progressBg, cardWidth / 2 - 200, -cardHeight / 2 + 75, 180, 12, 6)
      progressBg.fillStyle(0xffd54f, 0.9)
      this.roundedRect(progressBg, cardWidth / 2 - 200, -cardHeight / 2 + 75, 180 * progress, 12, 6)

      const progressText = this.add.text(cardWidth / 2 - 110, -cardHeight / 2 + 98,
        `${Math.floor(progress * 100)}%`,
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '12px',
          color: '#ffffff'
        }).setOrigin(0, 0.5)

      container.add([progressBg, progressText])
    }

    if (quest.status === 'available') {
      const availableDisciples = this.sectManager.getAvailableDisciples(this.sect)
      const canAccept = availableDisciples.some(d => d.combatPower >= quest.combatPowerRequired)

      const acceptBtn = this.createButton(cardWidth / 2 - 80, -cardHeight / 2 + 90,
        '接取任务', canAccept ? 0x4fc3f7 : 0x455a64,
        () => {
          if (canAccept) {
            this.showQuestAcceptDialog(quest)
          } else {
            this.showToast('没有符合战力要求的空闲弟子')
          }
        })
      acceptBtn.setScale(0.7)
      if (!canAccept) acceptBtn.disableInteractive()
      container.add(acceptBtn)
    } else if (quest.status === 'completed') {
      const claimBtn = this.createButton(cardWidth / 2 - 80, -cardHeight / 2 + 90,
        '领取奖励', 0x81c784,
        () => {
          if (this.sectManager.claimQuestReward(this.sect, quest.id)) {
            this.showToast('奖励领取成功！')
            this.cameras.main.flash(200, 129, 199, 132)
            this.updateResourceTexts()
            this.refreshContent()
          }
        })
      claimBtn.setScale(0.7)
      container.add(claimBtn)
    }

    container.setSize(cardWidth, cardHeight)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.02, duration: 150 })
    })

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 150 })
    })

    container.on('pointerdown', () => {
      this.selectedQuest = quest
      this.refreshContent()
    })

    return container
  }

  private showQuestAcceptDialog(quest: SectQuest): void {
    const { width, height } = this.scale
    const availableDisciples = this.sectManager.getAvailableDisciples(this.sect)
      .filter(d => d.combatPower >= quest.combatPowerRequired)

    if (availableDisciples.length === 0) {
      this.showToast('没有符合条件的弟子')
      return
    }

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.8)
    overlay.fillRect(0, 0, width, height)
    this.contentPanel.add(overlay)

    const dialogWidth = 450
    const dialogHeight = 100 + availableDisciples.length * 65
    const dialogX = width / 2 - dialogWidth / 2
    const dialogY = height / 2 - dialogHeight / 2

    const dialogBg = this.add.graphics()
    dialogBg.fillStyle(0x1a1a2e, 0.98)
    dialogBg.lineStyle(2, quest.color, 0.9)
    this.roundedRect(dialogBg, dialogX, dialogY, dialogWidth, dialogHeight, 16)
    this.contentPanel.add(dialogBg)

    const title = this.add.text(width / 2, dialogY + 35, `选择弟子执行「${quest.title}」`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.contentPanel.add(title)

    const buttons: Phaser.GameObjects.Container[] = []
    availableDisciples.forEach((disciple, index) => {
      const btnY = dialogY + 70 + index * 60
      const btn = this.createDiscipleSelectButton(width / 2, btnY, 400, 50, disciple, quest, () => {
        this.sectManager.startQuest(this.sect, quest.id, disciple.id)
        this.showToast(`${disciple.name} 开始执行任务`)
        overlay.destroy()
        dialogBg.destroy()
        title.destroy()
        buttons.forEach(b => b.destroy())
        this.refreshContent()
      })
      buttons.push(btn)
      this.contentPanel.add(btn)
    })

    overlay.on('pointerdown', () => {
      overlay.destroy()
      dialogBg.destroy()
      title.destroy()
      buttons.forEach(b => b.destroy())
    })
  }

  private createDiscipleSelectButton(x: number, y: number, width: number, height: number, disciple: Disciple, quest: SectQuest, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const canDo = disciple.combatPower >= quest.combatPowerRequired

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.8)
    bg.lineStyle(2, disciple.color, canDo ? 0.9 : 0.4)
    this.roundedRect(bg, -width / 2, -height / 2, width, height, 10)

    const avatarBg = this.add.graphics()
    avatarBg.fillStyle(disciple.color, canDo ? 0.25 : 0.1)
    avatarBg.fillCircle(-width / 2 + 30, 0, 18)

    const avatar = this.add.text(-width / 2 + 30, 0, disciple.avatar, {
      fontSize: '20px'
    }).setOrigin(0.5)

    const name = this.add.text(-width / 2 + 60, -8, `${disciple.name} Lv.${disciple.level}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0, 0.5)

    const combatText = this.add.text(-width / 2 + 60, 10,
      `⚔ ${disciple.combatPower} ${canDo ? '✓' : '✗'}`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '14px',
        color: canDo ? '#81c784' : '#ef5350'
      }).setOrigin(0, 0.5)

    const rarityText = this.add.text(width / 2 - 20, 0, RARITY_NAMES[disciple.rarity], {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: '#' + disciple.color.toString(16).padStart(6, '0')
    }).setOrigin(1, 0.5)

    container.add([bg, avatarBg, avatar, name, combatText, rarityText])
    container.setSize(width, height)

    if (canDo) {
      container.setInteractive({ useHandCursor: true })
      container.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.03, duration: 150 }))
      container.on('pointerout', () => this.tweens.add({ targets: container, scale: 1, duration: 150 }))
      container.on('pointerdown', onClick)
    }

    return container
  }

  private createRecruitContent(width: number, height: number): void {
    const panelY = 230
    const panelHeight = height - 310

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.6)
    bg.lineStyle(2, 0xe91e63, 0.5)
    this.roundedRect(bg, 30, panelY, width - 60, panelHeight, 16)
    this.contentPanel.add(bg)

    const title = this.add.text(50, panelY + 25,
      `🎯 弟子招募  (今日剩余: ${this.sect.dailyRecruitLimit - this.sect.dailyRecruitsUsed}/${this.sect.dailyRecruitLimit})`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '22px',
        color: '#e91e63'
      }).setOrigin(0, 0.5)
    this.contentPanel.add(title)

    const refreshBtn = this.createButton(width - 100, panelY + 30, '🔄 刷新', 0xffd54f, () => {
      this.recruitPool = generateRecruitPool(this.sect.level)
      this.refreshContent()
      this.showToast('已刷新招募列表')
    })
    refreshBtn.setScale(0.75)
    this.contentPanel.add(refreshBtn)

    const cardWidth = 280
    const cardHeight = 320
    const spacing = 30
    const totalWidth = this.recruitPool.length * cardWidth + (this.recruitPool.length - 1) * spacing
    const startX = (width - totalWidth) / 2 + cardWidth / 2

    this.recruitPool.forEach((template, index) => {
      const x = startX + index * (cardWidth + spacing)
      const y = panelY + panelHeight / 2 + 20
      const card = this.createRecruitCard(x, y, cardWidth, cardHeight, template)
      this.contentPanel.add(card)
    })
  }

  private createRecruitCard(x: number, y: number, cardWidth: number, cardHeight: number, template: DiscipleTemplate): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const canAfford = template.recruitCost.every(cost =>
      this.sect.resources[cost.type] >= cost.amount
    )
    const hasSlots = this.sect.disciples.length < this.sect.maxDisciples
    const hasRecruitsLeft = this.sect.dailyRecruitsUsed < this.sect.dailyRecruitLimit
    const canRecruit = canAfford && hasSlots && hasRecruitsLeft

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.9)
    bg.lineStyle(4, template.color, 1)
    this.roundedRect(bg, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 16)

    const rarityBand = this.add.graphics()
    rarityBand.fillStyle(template.color, 0.25)
    rarityBand.fillRect(-cardWidth / 2, -cardHeight / 2, cardWidth, 60)

    const rarityText = this.add.text(0, -cardHeight / 2 + 30,
      `【${RARITY_NAMES[template.rarity]}】`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '18px',
        color: '#' + template.color.toString(16).padStart(6, '0'),
        fontStyle: 'bold'
      }).setOrigin(0.5)

    const avatarBg = this.add.graphics()
    avatarBg.fillStyle(template.color, 0.3)
    avatarBg.fillCircle(0, -cardHeight / 2 + 120, 45)
    avatarBg.lineStyle(3, template.color, 1)
    avatarBg.strokeCircle(0, -cardHeight / 2 + 120, 45)

    const avatar = this.add.text(0, -cardHeight / 2 + 120, template.avatar, {
      fontSize: '48px'
    }).setOrigin(0.5)

    const name = this.add.text(0, -cardHeight / 2 + 185, template.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const stats = this.add.text(0, -cardHeight / 2 + 215,
      `🌟 天赋: ${template.baseTalent}  |  ⚔ 战力: ${template.baseCombatPower}`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '14px',
        color: '#b0bec5'
      }).setOrigin(0.5)

    const desc = this.add.text(0, -cardHeight / 2 + 245, template.description, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: '#78909c',
      align: 'center',
      wordWrap: { width: cardWidth - 30 }
    }).setOrigin(0.5)

    const costParts = template.recruitCost.map(c =>
      `${RESOURCE_ICONS[c.type]}${c.amount}`
    ).join('  ')

    const costText = this.add.text(0, -cardHeight / 2 + 280,
      costParts,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '16px',
        color: canAfford ? '#ffd54f' : '#ef5350'
      }).setOrigin(0.5)

    container.add([bg, rarityBand, rarityText, avatarBg, avatar, name, stats, desc, costText])

    const recruitBtn = this.createButton(0, cardHeight / 2 - 35,
      hasRecruitsLeft ? (hasSlots ? '📥 招募' : '❌ 已满员') : '❌ 今日已用完',
      canRecruit ? template.color : 0x455a64,
      () => {
        if (canRecruit) {
          const disciple = this.sectManager.recruitDisciple(this.sect, template)
          if (disciple) {
            this.showToast(`成功招募 ${disciple.name}！`)
            this.cameras.main.flash(300, 233, 30, 99)
            this.recruitPool = generateRecruitPool(this.sect.level)
            this.updateResourceTexts()
            this.refreshContent()
          }
        } else if (!hasSlots) {
          this.showToast('弟子数量已达上限')
        } else if (!hasRecruitsLeft) {
          this.showToast('今日招募次数已用完')
        } else {
          this.showToast('资源不足')
        }
      })
    recruitBtn.setScale(0.85)
    if (!canRecruit) recruitBtn.disableInteractive()
    container.add(recruitBtn)

    return container
  }

  private createButton(x: number, y: number, label: string, color: number, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const width = 160
    const height = 50

    const bg = this.add.graphics()
    bg.fillStyle(color, 0.85)
    bg.lineStyle(2, color, 1)
    this.roundedRect(bg, -width / 2, -height / 2, width, height, 12)

    const text = this.add.text(0, 0, label, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(width, height)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.08, duration: 150 })
    })

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 150 })
    })

    container.on('pointerdown', onClick)

    return container
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
      this.updateTimer.remove()
      this.cameras.main.fadeOut(400)
      this.time.delayedCall(400, () => this.scene.start('MenuScene'))
    })
  }
}