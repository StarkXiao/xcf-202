import Phaser from 'phaser'
import type { GameSave, SpiritBeast, SpiritBeastTemplate } from '../types'
import { SaveManager } from '../managers/SaveManager'
import { SpiritBeastManager } from '../managers/SpiritBeastManager'
import { SPIRIT_BEAST_TEMPLATES, SPIRIT_BEAST_ITEMS, getRarityName, getRarityColor, getBeastTemplate } from '../data/spiritBeastData'

type TabType = 'list' | 'capture' | 'feed' | 'evolve' | 'team' | 'shop'

export class SpiritBeastScene extends Phaser.Scene {
  private save!: GameSave
  private saveManager = SaveManager.getInstance()
  private spiritBeastManager = SpiritBeastManager.getInstance()
  private currentTab: TabType = 'list'
  private selectedBeast: SpiritBeast | null = null
  private messageText!: Phaser.GameObjects.Text
  private goldText!: Phaser.GameObjects.Text
  private spiritText!: Phaser.GameObjects.Text
  private contentContainer!: Phaser.GameObjects.Container

  constructor() {
    super({ key: 'SpiritBeastScene' })
  }

  init(): void {
    this.save = this.saveManager.loadGame()!
  }

  create(): void {
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor(0x0a0a15)
    this.createBackground(width, height)

    const title = this.add.text(width / 2, 40, '灵兽养成', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '36px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.createResourceDisplay(width, height)
    this.createTabs(width, height)
    this.createBackButton(width, height)

    this.contentContainer = this.add.container(0, 0)
    this.showTab('list')

    this.messageText = this.add.text(width / 2, height - 40, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#81c784'
    }).setOrigin(0.5)

    this.cameras.main.fadeIn(500)
  }

  private createBackground(width: number, height: number): void {
    const stars = this.add.graphics()
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const size = Math.random() * 2 + 0.5
      const alpha = Math.random() * 0.6 + 0.2
      stars.fillStyle(0xffffff, alpha)
      stars.fillCircle(x, y, size)
    }

    const auraColors = [0x4a148c, 0x1a237e, 0x0d47a1, 0x4a004d]
    for (let i = 0; i < 4; i++) {
      const aura = this.add.graphics()
      aura.fillStyle(auraColors[i], 0.1)
      const nx = (width / 4) * i + width / 8
      const ny = height * (0.4 + Math.random() * 0.3)
      aura.fillCircle(nx, ny, 180 + Math.random() * 80)

      this.tweens.add({
        targets: aura,
        x: { from: 0, to: i % 2 === 0 ? 20 : -20 },
        y: { from: 0, to: i % 2 === 0 ? -15 : 15 },
        duration: 5000 + i * 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }
  }

  private createResourceDisplay(width: number, height: number): void {
    this.goldText = this.add.text(width - 20, 80, `💰 ${this.save.player.gold}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffd54f'
    }).setOrigin(1, 0)

    this.spiritText = this.add.text(width - 20, 110, `✨ ${this.save.player.spirit}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#4fc3f7'
    }).setOrigin(1, 0)
  }

  private createTabs(width: number, height: number): void {
    const tabs: { id: TabType; label: string; color: number }[] = [
      { id: 'list', label: '灵兽列表', color: 0x4fc3f7 },
      { id: 'capture', label: '捕捉灵兽', color: 0x81c784 },
      { id: 'feed', label: '灵兽喂养', color: 0xffd54f },
      { id: 'evolve', label: '灵兽升阶', color: 0xba68c8 },
      { id: 'team', label: '出战编队', color: 0xff7043 },
      { id: 'shop', label: '道具商店', color: 0xef5350 }
    ]

    const tabY = 100
    const tabWidth = 110
    const tabHeight = 40
    const startX = (width - tabs.length * tabWidth) / 2 + tabWidth / 2

    tabs.forEach((tab, index) => {
      const x = startX + index * tabWidth
      const container = this.createTabButton(x, tabY, tabWidth - 10, tabHeight, tab.label, tab.color, () => this.showTab(tab.id))
      container.setData('tabId', tab.id)
    })
  }

  private createTabButton(x: number, y: number, width: number, height: number, label: string, color: number, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.6)
    bg.lineStyle(2, color, 0.8)
    this.roundedRect(bg, -width / 2, -height / 2, width, height, 8)

    const text = this.add.text(0, 0, label, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
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

    container.on('pointerdown', onClick)

    return container
  }

  private showTab(tabId: TabType): void {
    this.currentTab = tabId
    this.selectedBeast = null
    this.contentContainer.removeAll(true)

    switch (tabId) {
      case 'list':
        this.showBeastList()
        break
      case 'capture':
        this.showCapturePage()
        break
      case 'feed':
        this.showFeedPage()
        break
      case 'evolve':
        this.showEvolvePage()
        break
      case 'team':
        this.showTeamPage()
        break
      case 'shop':
        this.showShopPage()
        break
    }
  }

  private showBeastList(): void {
    const { width, height } = this.scale
    const beasts = this.save.spiritBeast.beasts

    if (beasts.length === 0) {
      const text = this.add.text(width / 2, height / 2, '还没有捕捉到任何灵兽\n快去捕捉吧！', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '24px',
        color: '#888888',
        align: 'center'
      }).setOrigin(0.5)
      this.contentContainer.add(text)
      return
    }

    const startX = 80
    const startY = 170
    const cardWidth = 200
    const cardHeight = 260
    const spacing = 30
    const perRow = Math.floor((width - 100) / (cardWidth + spacing))

    beasts.forEach((beast, index) => {
      const col = index % perRow
      const row = Math.floor(index / perRow)
      const x = startX + col * (cardWidth + spacing) + cardWidth / 2
      const y = startY + row * (cardHeight + spacing)

      const card = this.createBeastCard(x, y, cardWidth, cardHeight, beast)
      this.contentContainer.add(card)
    })
  }

  private createBeastCard(x: number, y: number, width: number, height: number, beast: SpiritBeast): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const template = getBeastTemplate(beast.templateId)
    const rarityColor = getRarityColor(beast.rarity)
    const combatPower = this.spiritBeastManager.getBeastCombatPower(beast)

    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a2e, 0.9)
    bg.lineStyle(3, rarityColor, 0.9)
    this.roundedRect(bg, -width / 2, -height / 2, width, height, 12)

    const iconBg = this.add.graphics()
    iconBg.fillStyle(0x000000, 0.5)
    iconBg.fillCircle(0, -height / 2 + 60, 45)
    iconBg.lineStyle(2, rarityColor, 0.8)
    iconBg.strokeCircle(0, -height / 2 + 60, 45)

    const icon = this.add.text(0, -height / 2 + 60, beast.icon, {
      fontFamily: 'serif',
      fontSize: '48px'
    }).setOrigin(0.5)

    const name = this.add.text(0, -height / 2 + 120, beast.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#' + rarityColor.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const rarity = this.add.text(0, -height / 2 + 145, `${getRarityName(beast.rarity)} · ${beast.stage}阶`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#aaaaaa'
    }).setOrigin(0.5)

    const level = this.add.text(-width / 2 + 15, -height / 2 + 170, `Lv.${beast.level}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#4fc3f7'
    }).setOrigin(0, 0.5)

    const cp = this.add.text(width / 2 - 15, -height / 2 + 170, `战力:${combatPower}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: '#ffd54f'
    }).setOrigin(1, 0.5)

    const expBarBg = this.add.graphics()
    expBarBg.fillStyle(0x333333)
    expBarBg.fillRect(-width / 2 + 15, -height / 2 + 190, width - 30, 8)
    const expRatio = beast.exp / beast.expToNext
    const expBar = this.add.graphics()
    expBar.fillStyle(0x81c784)
    expBar.fillRect(-width / 2 + 15, -height / 2 + 190, (width - 30) * expRatio, 8)

    const stats = [
      { label: '生命', value: beast.maxHealth, color: 0xef5350 },
      { label: '攻击', value: beast.attack, color: 0xffd54f },
      { label: '防御', value: beast.defense, color: 0x4fc3f7 }
    ]

    stats.forEach((stat, index) => {
      const statY = -height / 2 + 215 + index * 18
      const statLabel = this.add.text(-width / 2 + 15, statY, `${stat.label}:`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5)

      const statValue = this.add.text(-width / 2 + 70, statY, stat.value.toString(), {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#' + stat.color.toString(16).padStart(6, '0')
      }).setOrigin(0, 0.5)

      container.add([statLabel, statValue])
    })

    if (beast.isInBattle) {
      const battleMark = this.add.text(width / 2 - 10, -height / 2 + 15, '⚔ 出战中', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#ff7043'
      }).setOrigin(1, 0.5)
      container.add(battleMark)
    }

    container.add([bg, iconBg, icon, name, rarity, level, cp, expBarBg, expBar])
    container.setSize(width, height)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.03, duration: 150 })
    })

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 150 })
    })

    container.on('pointerdown', () => {
      this.selectedBeast = beast
      this.showBeastDetail(beast)
    })

    return container
  }

  private showBeastDetail(beast: SpiritBeast): void {
    const { width, height } = this.scale
    const template = getBeastTemplate(beast.templateId)
    if (!template) return

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.8)
    overlay.fillRect(0, 0, width, height)

    const panelWidth = 500
    const panelHeight = 450
    const panelX = width / 2
    const panelY = height / 2

    const panel = this.add.graphics()
    panel.fillStyle(0x1a1a2e, 0.98)
    panel.lineStyle(3, getRarityColor(beast.rarity), 0.9)
    this.roundedRect(panel, -panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16)

    const container = this.add.container(panelX, panelY)
    container.add(panel)

    const icon = this.add.text(0, -panelHeight / 2 + 60, beast.icon, {
      fontFamily: 'serif',
      fontSize: '72px'
    }).setOrigin(0.5)

    const name = this.add.text(0, -panelHeight / 2 + 130, beast.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: '#' + getRarityColor(beast.rarity).toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const rarity = this.add.text(0, -panelHeight / 2 + 165, `${getRarityName(beast.rarity)} · ${beast.stage}阶 · Lv.${beast.level}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#aaaaaa'
    }).setOrigin(0.5)

    const description = this.add.text(0, -panelHeight / 2 + 200, template.description, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#888888',
      align: 'center',
      wordWrap: { width: panelWidth - 40 }
    }).setOrigin(0.5)

    const stats = [
      { label: '生命', value: beast.maxHealth, color: 0xef5350 },
      { label: '攻击', value: beast.attack, color: 0xffd54f },
      { label: '防御', value: beast.defense, color: 0x4fc3f7 },
      { label: '亲密度', value: beast.affection, color: 0xba68c8 }
    ]

    stats.forEach((stat, index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const x = -panelWidth / 2 + 80 + col * 220
      const y = -panelHeight / 2 + 250 + row * 30

      const statLabel = this.add.text(x, y, `${stat.label}:`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '16px',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5)

      const statValue = this.add.text(x + 60, y, stat.value.toString(), {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '16px',
        color: '#' + stat.color.toString(16).padStart(6, '0')
      }).setOrigin(0, 0.5)

      container.add([statLabel, statValue])
    })

    const skillsTitle = this.add.text(0, -panelHeight / 2 + 310, '技能', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffd54f'
    }).setOrigin(0.5)

    const availableSkills = this.spiritBeastManager.getAvailableSkills(beast)
    availableSkills.forEach((skill, index) => {
      const skillX = -panelWidth / 2 + 60 + index * 120
      const skillY = -panelHeight / 2 + 345

      const skillIcon = this.add.text(skillX, skillY, skill.icon, {
        fontFamily: 'serif',
        fontSize: '24px'
      }).setOrigin(0.5)

      const skillName = this.add.text(skillX, skillY + 25, skill.name, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#' + skill.color.toString(16).padStart(6, '0')
      }).setOrigin(0.5)

      container.add([skillIcon, skillName])
    })

    const closeBtn = this.createButton(0, panelHeight / 2 - 50, 120, 40, '关闭', 0x78909c, () => {
      overlay.destroy()
      container.destroy()
    })
    container.add(closeBtn)

    container.add([icon, name, rarity, description, skillsTitle])
  }

  private showCapturePage(): void {
    const { width, height } = this.scale

    const title = this.add.text(width / 2, 170, '捕捉灵兽', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: '#81c784',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.contentContainer.add(title)

    const desc = this.add.text(width / 2, 210, '选择捕捉道具，然后尝试捕捉随机出现的灵兽', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(0.5)
    this.contentContainer.add(desc)

    const trapItems = this.save.spiritBeast.captureItems
    const trapConfigs = SPIRIT_BEAST_ITEMS.capture

    trapConfigs.forEach((trapConfig, index) => {
      const trapItem = trapItems.find(item => item.itemId === trapConfig.id)
      const quantity = trapItem?.quantity || 0
      const x = width / 2 - 200 + index * 200
      const y = 300

      const card = this.add.container(x, y)
      const cardWidth = 160
      const cardHeight = 180

      const bg = this.add.graphics()
      bg.fillStyle(0x1a1a2e, 0.9)
      bg.lineStyle(2, quantity > 0 ? 0x81c784 : 0x555555, 0.8)
      this.roundedRect(bg, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12)

      const icon = this.add.text(0, -cardHeight / 2 + 40, '🪤', {
        fontFamily: 'serif',
        fontSize: '40px'
      }).setOrigin(0.5)

      const name = this.add.text(0, -cardHeight / 2 + 85, trapConfig.name, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '16px',
        color: quantity > 0 ? '#ffffff' : '#666666'
      }).setOrigin(0.5)

      const bonus = this.add.text(0, -cardHeight / 2 + 110, `成功率+${Math.floor(trapConfig.successRateBonus * 100)}%`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#81c784'
      }).setOrigin(0.5)

      const qty = this.add.text(0, -cardHeight / 2 + 135, `数量: ${quantity}`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '14px',
        color: quantity > 0 ? '#ffd54f' : '#ef5350'
      }).setOrigin(0.5)

      card.add([bg, icon, name, bonus, qty])
      card.setSize(cardWidth, cardHeight)

      if (quantity > 0) {
        card.setInteractive({ useHandCursor: true })
        card.on('pointerover', () => this.tweens.add({ targets: card, scale: 1.05, duration: 150 }))
        card.on('pointerout', () => this.tweens.add({ targets: card, scale: 1, duration: 150 }))
        card.on('pointerdown', () => this.attemptCapture(trapConfig.id))
      }

      this.contentContainer.add(card)
    })

    const shopBtn = this.createButton(width / 2, 450, 180, 50, '前往商店购买道具', 0xef5350, () => this.showTab('shop'))
    this.contentContainer.add(shopBtn)
  }

  private attemptCapture(trapId: string): void {
    const template = this.spiritBeastManager.getRandomBeastTemplate(this.save.spiritBeast)
    if (!template) {
      this.showMessage('没有可捕捉的灵兽')
      return
    }

    const { result } = this.spiritBeastManager.captureBeast(
      this.save.spiritBeast,
      this.save.player.gold,
      template.id,
      trapId
    )

    this.showMessage(result.message)
    this.saveManager.saveGame(this.save)

    if (result.success && result.beast) {
      this.showCaptureAnimation(result.beast, template)
    } else {
      this.time.delayedCall(1500, () => this.showTab('capture'))
    }
  }

  private showCaptureAnimation(beast: SpiritBeast, template: SpiritBeastTemplate): void {
    const { width, height } = this.scale
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.9)
    overlay.fillRect(0, 0, width, height)

    const icon = this.add.text(width / 2, height / 2 - 50, beast.icon, {
      fontFamily: 'serif',
      fontSize: '120px'
    }).setOrigin(0.5).setAlpha(0)

    const name = this.add.text(width / 2, height / 2 + 50, `恭喜获得 ${beast.name}！`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '32px',
      color: '#' + getRarityColor(beast.rarity).toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0)

    const rarity = this.add.text(width / 2, height / 2 + 90, `${getRarityName(beast.rarity)} · ${template.description}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#aaaaaa',
      align: 'center',
      wordWrap: { width: 500 }
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({
      targets: icon,
      alpha: 1,
      scale: { from: 0, to: 1 },
      duration: 800,
      ease: 'Back.easeOut'
    })

    this.tweens.add({
      targets: [name, rarity],
      alpha: 1,
      delay: 500,
      duration: 500
    })

    this.cameras.main.flash(500, 255, 215, 79)

    const continueBtn = this.createButton(width / 2, height / 2 + 160, 150, 45, '确定', 0x81c784, () => {
      overlay.destroy()
      icon.destroy()
      name.destroy()
      rarity.destroy()
      continueBtn.destroy()
      this.showTab('list')
    })
  }

  private showFeedPage(): void {
    const { width, height } = this.scale
    const beasts = this.save.spiritBeast.beasts

    if (beasts.length === 0) {
      const text = this.add.text(width / 2, height / 2, '还没有灵兽可以喂养', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '24px',
        color: '#888888'
      }).setOrigin(0.5)
      this.contentContainer.add(text)
      return
    }

    const title = this.add.text(width / 2, 170, '灵兽喂养', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.contentContainer.add(title)

    const desc = this.add.text(width / 2, 210, '选择一只灵兽，然后用食物喂养它', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(0.5)
    this.contentContainer.add(desc)

    if (!this.selectedBeast) {
      this.selectedBeast = beasts[0]
    }

    this.createBeastSelector(width, 280, beasts)

    if (this.selectedBeast) {
      this.createFeedPanel(width, 400, this.selectedBeast)
    }
  }

  private createBeastSelector(width: number, y: number, beasts: SpiritBeast[]): void {
    const beastWidth = 100
    const beastHeight = 120
    const spacing = 15
    const totalWidth = beasts.length * (beastWidth + spacing) - spacing
    const startX = (width - totalWidth) / 2 + beastWidth / 2

    beasts.forEach((beast, index) => {
      const x = startX + index * (beastWidth + spacing)
      const container = this.add.container(x, y)

      const isSelected = this.selectedBeast?.id === beast.id
      const rarityColor = getRarityColor(beast.rarity)

      const bg = this.add.graphics()
      bg.fillStyle(0x1a1a2e, 0.9)
      bg.lineStyle(3, isSelected ? rarityColor : 0x555555, 0.8)
      this.roundedRect(bg, -beastWidth / 2, -beastHeight / 2, beastWidth, beastHeight, 8)

      const icon = this.add.text(0, -15, beast.icon, {
        fontFamily: 'serif',
        fontSize: '36px'
      }).setOrigin(0.5)

      const name = this.add.text(0, 25, beast.name, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#' + rarityColor.toString(16).padStart(6, '0')
      }).setOrigin(0.5)

      const level = this.add.text(0, 42, `Lv.${beast.level}`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '11px',
        color: '#888888'
      }).setOrigin(0.5)

      container.add([bg, icon, name, level])
      container.setSize(beastWidth, beastHeight)
      container.setInteractive({ useHandCursor: true })

      container.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.05, duration: 150 }))
      container.on('pointerout', () => this.tweens.add({ targets: container, scale: 1, duration: 150 }))
      container.on('pointerdown', () => {
        this.selectedBeast = beast
        this.contentContainer.removeAll(true)
        this.showFeedPage()
      })

      this.contentContainer.add(container)
    })
  }

  private createFeedPanel(width: number, y: number, beast: SpiritBeast): void {
    const template = getBeastTemplate(beast.templateId)
    if (!template) return

    const panelWidth = 600
    const panelHeight = 200
    const x = width / 2

    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a2e, 0.9)
    bg.lineStyle(2, 0x555555, 0.8)
    this.roundedRect(bg, x - panelWidth / 2, y - panelHeight / 2, panelWidth, panelHeight, 12)
    this.contentContainer.add(bg)

    const expBarBg = this.add.graphics()
    expBarBg.fillStyle(0x333333)
    expBarBg.fillRect(x - panelWidth / 2 + 20, y - panelHeight / 2 + 30, panelWidth - 40, 16)
    const expRatio = beast.exp / beast.expToNext
    const expBar = this.add.graphics()
    expBar.fillStyle(0x81c784)
    expBar.fillRect(x - panelWidth / 2 + 20, y - panelHeight / 2 + 30, (panelWidth - 40) * expRatio, 16)
    this.contentContainer.add([expBarBg, expBar])

    const expText = this.add.text(x, y - panelHeight / 2 + 38, `EXP: ${beast.exp}/${beast.expToNext}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5)
    this.contentContainer.add(expText)

    const feedItems = this.save.spiritBeast.feedItems
    const feedConfigs = template.feedItems

    feedConfigs.forEach((feedConfig, index) => {
      const itemConfig = SPIRIT_BEAST_ITEMS.feed.find(i => i.id === feedConfig.itemId)
      const feedItem = feedItems.find(item => item.itemId === feedConfig.itemId)
      const quantity = feedItem?.quantity || 0
      const isPreferred = feedConfig.itemId !== 'spirit_grain'

      const itemX = x - panelWidth / 2 + 80 + index * 160
      const itemY = y + 20

      const itemBg = this.add.graphics()
      itemBg.fillStyle(0x000000, 0.5)
      itemBg.lineStyle(2, quantity > 0 ? 0x81c784 : 0x555555, 0.6)
      this.roundedRect(itemBg, -50, -40, 100, 80, 8)

      const itemIcon = this.add.text(0, -10, isPreferred ? '🌟' : '🌾', {
        fontFamily: 'serif',
        fontSize: '24px'
      }).setOrigin(0.5)

      const itemName = this.add.text(0, 15, itemConfig?.name || '', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '11px',
        color: '#aaaaaa'
      }).setOrigin(0.5)

      const itemQty = this.add.text(0, 30, `x${quantity} (+${feedConfig.expGain}${isPreferred ? '*1.5' : ''})`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '11px',
        color: quantity > 0 ? '#ffd54f' : '#ef5350'
      }).setOrigin(0.5)

      const container = this.add.container(itemX, itemY)
      container.add([itemBg, itemIcon, itemName, itemQty])
      container.setSize(100, 80)

      if (quantity > 0) {
        container.setInteractive({ useHandCursor: true })
        container.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.1, duration: 150 }))
        container.on('pointerout', () => this.tweens.add({ targets: container, scale: 1, duration: 150 }))
        container.on('pointerdown', () => this.feedBeast(beast.id, feedConfig.itemId))
      }

      this.contentContainer.add(container)
    })
  }

  private feedBeast(beastId: string, feedItemId: string): void {
    const result = this.spiritBeastManager.feedBeast(this.save.spiritBeast, beastId, feedItemId)
    this.showMessage(result.message)
    this.saveManager.saveGame(this.save)

    if (result.leveledUp) {
      this.cameras.main.flash(300, 255, 215, 79)
    }

    this.time.delayedCall(800, () => {
      this.contentContainer.removeAll(true)
      this.showFeedPage()
    })
  }

  private showEvolvePage(): void {
    const { width, height } = this.scale
    const beasts = this.save.spiritBeast.beasts

    if (beasts.length === 0) {
      const text = this.add.text(width / 2, height / 2, '还没有灵兽可以升阶', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '24px',
        color: '#888888'
      }).setOrigin(0.5)
      this.contentContainer.add(text)
      return
    }

    const title = this.add.text(width / 2, 170, '灵兽升阶', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: '#ba68c8',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.contentContainer.add(title)

    const desc = this.add.text(width / 2, 210, '选择一只灵兽，消耗材料进行升阶', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(0.5)
    this.contentContainer.add(desc)

    if (!this.selectedBeast) {
      this.selectedBeast = beasts[0]
    }

    this.createBeastSelector(width, 280, beasts)

    if (this.selectedBeast) {
      this.createEvolvePanel(width, 420, this.selectedBeast)
    }
  }

  private createEvolvePanel(width: number, y: number, beast: SpiritBeast): void {
    const template = getBeastTemplate(beast.templateId)
    if (!template) return

    const panelWidth = 550
    const panelHeight = 220
    const x = width / 2

    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a2e, 0.9)
    bg.lineStyle(2, 0x555555, 0.8)
    this.roundedRect(bg, x - panelWidth / 2, y - panelHeight / 2, panelWidth, panelHeight, 12)
    this.contentContainer.add(bg)

    const beastInfo = this.add.text(x - panelWidth / 2 + 30, y - panelHeight / 2 + 30, `${beast.name} - ${beast.stage}阶`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#' + getRarityColor(beast.rarity).toString(16).padStart(6, '0')
    }).setOrigin(0, 0.5)
    this.contentContainer.add(beastInfo)

    if (beast.stage >= template.maxStage) {
      const maxText = this.add.text(x, y, '已达到最高阶！', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '24px',
        color: '#ffd54f'
      }).setOrigin(0.5)
      this.contentContainer.add(maxText)
      return
    }

    const nextStage = beast.stage + 1
    const requirement = template.evolveRequirements.find(r => r.stage === nextStage)
    if (!requirement) return

    const requiredLevel = (nextStage - 1) * 10 + 10
    const levelOk = beast.level >= requiredLevel
    const goldOk = this.save.player.gold >= requirement.gold
    const spiritOk = this.save.player.spirit >= requirement.spirit
    let itemsOk = true

    if (requirement.items) {
      requirement.items.forEach(item => {
        const evolveItem = this.save.spiritBeast.evolveItems.find(ei => ei.itemId === item.itemId)
        if (!evolveItem || evolveItem.quantity < item.amount) {
          itemsOk = false
        }
      })
    }

    const canEvolve = levelOk && goldOk && spiritOk && itemsOk

    const reqY = y - panelHeight / 2 + 70
    const reqSpacing = 30

    const reqs = [
      { label: `等级要求`, value: `${requiredLevel}级`, current: `${beast.level}级`, ok: levelOk },
      { label: `金币消耗`, value: requirement.gold.toString(), current: this.save.player.gold.toString(), ok: goldOk },
      { label: `灵气消耗`, value: requirement.spirit.toString(), current: this.save.player.spirit.toString(), ok: spiritOk }
    ]

    reqs.forEach((req, index) => {
      const reqX = x - panelWidth / 2 + 40
      const reqYPos = reqY + index * reqSpacing

      const label = this.add.text(reqX, reqYPos, req.label, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '14px',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5)

      const value = this.add.text(reqX + 120, reqYPos, req.value, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '14px',
        color: req.ok ? '#81c784' : '#ef5350'
      }).setOrigin(0, 0.5)

      const current = this.add.text(reqX + 200, reqYPos, `(当前: ${req.current})`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#666666'
      }).setOrigin(0, 0.5)

      this.contentContainer.add([label, value, current])
    })

    if (requirement.items) {
      requirement.items.forEach((item, index) => {
        const itemConfig = SPIRIT_BEAST_ITEMS.evolve.find(ei => ei.id === item.itemId)
        const evolveItem = this.save.spiritBeast.evolveItems.find(ei => ei.itemId === item.itemId)
        const currentQty = evolveItem?.quantity || 0
        const itemOk = currentQty >= item.amount

        const reqX = x + 20
        const reqYPos = reqY + index * reqSpacing

        const label = this.add.text(reqX, reqYPos, itemConfig?.name || item.itemId, {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '14px',
          color: '#aaaaaa'
        }).setOrigin(0, 0.5)

        const value = this.add.text(reqX + 120, reqYPos, `${currentQty}/${item.amount}`, {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '14px',
          color: itemOk ? '#81c784' : '#ef5350'
        }).setOrigin(0, 0.5)

        this.contentContainer.add([label, value])
      })
    }

    const statsPreview = this.add.text(x - panelWidth / 2 + 30, y + 20, `升阶后属性提升25%，解锁新技能！`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#ffd54f'
    }).setOrigin(0, 0.5)
    this.contentContainer.add(statsPreview)

    const evolveBtn = this.createButton(x, y + panelHeight / 2 - 35, 160, 45, '升阶', canEvolve ? 0xba68c8 : 0x555555, () => {
      if (!canEvolve) {
        this.showMessage('升阶条件不满足！')
        return
      }
      this.evolveBeast(beast.id)
    })
    this.contentContainer.add(evolveBtn)
  }

  private evolveBeast(beastId: string): void {
    const result = this.spiritBeastManager.evolveBeast(
      this.save.spiritBeast,
      beastId,
      this.save.player.gold,
      this.save.player.spirit
    )

    this.save.player.gold = result.newGold
    this.save.player.spirit = result.newSpirit
    this.showMessage(result.message)
    this.updateResourceDisplay()
    this.saveManager.saveGame(this.save)

    if (result.success) {
      this.cameras.main.flash(500, 186, 104, 200)
    }

    this.time.delayedCall(1000, () => {
      this.contentContainer.removeAll(true)
      this.showEvolvePage()
    })
  }

  private showTeamPage(): void {
    const { width, height } = this.scale
    const beasts = this.save.spiritBeast.beasts

    const title = this.add.text(width / 2, 170, '出战编队', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: '#ff7043',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.contentContainer.add(title)

    const desc = this.add.text(width / 2, 210, '最多可编队3只灵兽助战', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(0.5)
    this.contentContainer.add(desc)

    const teamSlots = this.save.spiritBeast.battleTeam
    const slotY = 300

    teamSlots.forEach((beastId, index) => {
      const slotX = width / 2 - 200 + index * 200
      this.createTeamSlot(slotX, slotY, index, beastId)
    })

    if (beasts.length > 0) {
      const listTitle = this.add.text(width / 2, 430, '选择要编队的灵兽', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '18px',
        color: '#ffd54f'
      }).setOrigin(0.5)
      this.contentContainer.add(listTitle)

      const availableBeasts = beasts.filter(b => !b.isInBattle)
      if (availableBeasts.length > 0) {
        const beastWidth = 90
        const beastHeight = 110
        const spacing = 12
        const totalWidth = availableBeasts.length * (beastWidth + spacing) - spacing
        const startX = (width - totalWidth) / 2 + beastWidth / 2

        availableBeasts.forEach((beast, index) => {
          const x = startX + index * (beastWidth + spacing)
          const y = 500

          const container = this.add.container(x, y)
          const rarityColor = getRarityColor(beast.rarity)

          const bg = this.add.graphics()
          bg.fillStyle(0x1a1a2e, 0.9)
          bg.lineStyle(2, rarityColor, 0.6)
          this.roundedRect(bg, -beastWidth / 2, -beastHeight / 2, beastWidth, beastHeight, 8)

          const icon = this.add.text(0, -15, beast.icon, {
            fontFamily: 'serif',
            fontSize: '32px'
          }).setOrigin(0.5)

          const name = this.add.text(0, 20, beast.name, {
            fontFamily: '"Microsoft YaHei", serif',
            fontSize: '12px',
            color: '#' + rarityColor.toString(16).padStart(6, '0')
          }).setOrigin(0.5)

          const level = this.add.text(0, 38, `Lv.${beast.level}`, {
            fontFamily: '"Microsoft YaHei", serif',
            fontSize: '11px',
            color: '#888888'
          }).setOrigin(0.5)

          container.add([bg, icon, name, level])
          container.setSize(beastWidth, beastHeight)
          container.setInteractive({ useHandCursor: true })

          container.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.05, duration: 150 }))
          container.on('pointerout', () => this.tweens.add({ targets: container, scale: 1, duration: 150 }))
          container.on('pointerdown', () => this.addBeastToTeam(beast.id))

          this.contentContainer.add(container)
        })
      } else {
        const noBeastText = this.add.text(width / 2, 500, '所有灵兽都已编队', {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '18px',
          color: '#888888'
        }).setOrigin(0.5)
        this.contentContainer.add(noBeastText)
      }
    }
  }

  private createTeamSlot(x: number, y: number, position: number, beastId: string | null): void {
    const slotWidth = 140
    const slotHeight = 160
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a2e, 0.9)
    bg.lineStyle(2, beastId ? 0xff7043 : 0x555555, 0.8)
    this.roundedRect(bg, -slotWidth / 2, -slotHeight / 2, slotWidth, slotHeight, 12)

    const positionText = this.add.text(0, -slotHeight / 2 + 20, `编队位${position + 1}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5)

    container.add([bg, positionText])

    if (beastId) {
      const beast = this.save.spiritBeast.beasts.find(b => b.id === beastId)
      if (beast) {
        const rarityColor = getRarityColor(beast.rarity)

        const icon = this.add.text(0, -5, beast.icon, {
          fontFamily: 'serif',
          fontSize: '48px'
        }).setOrigin(0.5)

        const name = this.add.text(0, 35, beast.name, {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '16px',
          color: '#' + rarityColor.toString(16).padStart(6, '0')
        }).setOrigin(0.5)

        const level = this.add.text(0, 55, `Lv.${beast.level} ${beast.stage}阶`, {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '12px',
          color: '#888888'
        }).setOrigin(0.5)

        const cp = this.add.text(0, 72, `战力:${this.spiritBeastManager.getBeastCombatPower(beast)}`, {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '11px',
          color: '#ffd54f'
        }).setOrigin(0.5)

        const removeBtn = this.createButton(0, slotHeight / 2 - 22, 100, 30, '取消编队', 0xef5350, () => {
          this.removeBeastFromTeam(beast.id)
        })

        container.add([icon, name, level, cp, removeBtn])
      }
    } else {
      const emptyText = this.add.text(0, 20, '空位', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '18px',
        color: '#555555'
      }).setOrigin(0.5)
      container.add(emptyText)
    }

    container.setSize(slotWidth, slotHeight)
    this.contentContainer.add(container)
  }

  private addBeastToTeam(beastId: string): void {
    const emptySlot = this.save.spiritBeast.battleTeam.findIndex(id => id === null)
    if (emptySlot === -1) {
      this.showMessage('编队已满！请先取消某个灵兽的编队')
      return
    }

    this.spiritBeastManager.addToBattleTeam(this.save.spiritBeast, beastId, emptySlot)
    this.saveManager.saveGame(this.save)
    this.showMessage('编队成功！')
    this.contentContainer.removeAll(true)
    this.showTeamPage()
  }

  private removeBeastFromTeam(beastId: string): void {
    this.spiritBeastManager.removeFromBattleTeam(this.save.spiritBeast, beastId)
    this.saveManager.saveGame(this.save)
    this.showMessage('已取消编队')
    this.contentContainer.removeAll(true)
    this.showTeamPage()
  }

  private showShopPage(): void {
    const { width, height } = this.scale

    const title = this.add.text(width / 2, 170, '道具商店', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: '#ef5350',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.contentContainer.add(title)

    const categories = [
      { id: 'capture', label: '捕捉道具', items: SPIRIT_BEAST_ITEMS.capture },
      { id: 'feed', label: '喂养道具', items: SPIRIT_BEAST_ITEMS.feed },
      { id: 'evolve', label: '升阶材料', items: SPIRIT_BEAST_ITEMS.evolve.slice(0, 4) }
    ]

    categories.forEach((category, catIndex) => {
      const catY = 230 + catIndex * 180

      const catLabel = this.add.text(80, catY, category.label, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#ffd54f'
      }).setOrigin(0, 0.5)
      this.contentContainer.add(catLabel)

      category.items.forEach((item, itemIndex) => {
        const itemX = 100 + itemIndex * 180
        const itemY = catY + 60
        this.createShopItem(itemX, itemY, item, category.id as 'capture' | 'feed' | 'evolve')
      })
    })
  }

  private createShopItem(x: number, y: number, item: any, category: 'capture' | 'feed' | 'evolve'): void {
    const itemWidth = 150
    const itemHeight = 100
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a2e, 0.9)
    bg.lineStyle(2, 0x555555, 0.6)
    this.roundedRect(bg, -itemWidth / 2, -itemHeight / 2, itemWidth, itemHeight, 8)

    const name = this.add.text(0, -itemHeight / 2 + 25, item.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5)

    const price = this.add.text(0, -itemHeight / 2 + 50, `💰 ${item.price}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: this.save.player.gold >= item.price ? '#ffd54f' : '#ef5350'
    }).setOrigin(0.5)

    const buyBtn = this.createButton(0, itemHeight / 2 - 22, 100, 32, '购买', 0x81c784, () => {
      this.buyItem(item.id, category)
    })
    buyBtn.setScale(0.85)

    container.add([bg, name, price, buyBtn])
    container.setSize(itemWidth, itemHeight)
    this.contentContainer.add(container)
  }

  private buyItem(itemId: string, category: 'capture' | 'feed' | 'evolve'): void {
    let result
    switch (category) {
      case 'capture':
        result = this.spiritBeastManager.buyCaptureItem(this.save.spiritBeast, this.save.player.gold, itemId, 1)
        break
      case 'feed':
        result = this.spiritBeastManager.buyFeedItem(this.save.spiritBeast, this.save.player.gold, itemId, 1)
        break
      case 'evolve':
        result = this.spiritBeastManager.buyEvolveItem(this.save.spiritBeast, this.save.player.gold, itemId, 1)
        break
    }

    if (result) {
      this.save.player.gold = result.newGold
      this.showMessage(result.message)
      this.updateResourceDisplay()
      this.saveManager.saveGame(this.save)

      this.time.delayedCall(500, () => {
        this.contentContainer.removeAll(true)
        this.showShopPage()
      })
    }
  }

  private updateResourceDisplay(): void {
    this.goldText.setText(`💰 ${this.save.player.gold}`)
    this.spiritText.setText(`✨ ${this.save.player.spirit}`)
  }

  private showMessage(msg: string): void {
    this.messageText.setText(msg)
    this.messageText.setAlpha(0)
    this.tweens.add({
      targets: this.messageText,
      alpha: 1,
      duration: 300,
      yoyo: true,
      hold: 1500,
      repeatDelay: 300
    })
  }

  private createButton(x: number, y: number, width: number, height: number, label: string, color: number, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.7)
    bg.lineStyle(2, color, 0.9)
    this.roundedRect(bg, -width / 2, -height / 2, width, height, 10)

    const text = this.add.text(0, 0, label, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(width, height)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.05, duration: 150 })
      bg.clear()
      bg.fillStyle(color, 0.3)
      bg.lineStyle(3, color, 1)
      this.roundedRect(bg, -width / 2, -height / 2, width, height, 10)
    })

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 150 })
      bg.clear()
      bg.fillStyle(0x000000, 0.7)
      bg.lineStyle(2, color, 0.9)
      this.roundedRect(bg, -width / 2, -height / 2, width, height, 10)
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
    const btn = this.createButton(80, height - 40, 100, 40, '◀ 返回', 0x78909c, () => {
      this.cameras.main.fadeOut(400)
      this.time.delayedCall(400, () => this.scene.start('MenuScene'))
    })
  }
}
