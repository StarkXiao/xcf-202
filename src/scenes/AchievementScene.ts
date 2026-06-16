import Phaser from 'phaser'
import type { GameSave, Achievement, MonsterEntry, TreasureEntry, StoryEntry } from '../types'
import { SaveManager } from '../managers/SaveManager'
import { AchievementManager } from '../managers/AchievementManager'
import {
  ACHIEVEMENT_RARITY_COLORS,
  ACHIEVEMENT_RARITY_NAMES,
  ACHIEVEMENT_CATEGORY_NAMES,
  ACHIEVEMENT_CATEGORY_COLORS
} from '../data/achievementData'

type TabType = 'achievements' | 'monsters' | 'treasures' | 'stories'

export class AchievementScene extends Phaser.Scene {
  private save!: GameSave
  private saveManager: SaveManager
  private achievementManager: AchievementManager
  private currentTab: TabType = 'achievements'
  private contentContainer!: Phaser.GameObjects.Container
  private tabButtons: Phaser.GameObjects.Container[] = []
  private claimAllButton!: Phaser.GameObjects.Container
  private backButton!: Phaser.GameObjects.Container

  constructor() {
    super({ key: 'AchievementScene' })
    this.saveManager = SaveManager.getInstance()
    this.achievementManager = AchievementManager.getInstance()
  }

  init(): void {
    const existingSave = this.saveManager.loadGame()
    if (existingSave) {
      this.save = existingSave
    }
  }

  create(): void {
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor(0x0a0a15)
    this.createCosmicBackground(width, height)

    const title = this.add.text(width / 2, 60, '🏆 成就与图鉴中心', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '48px',
      color: '#ffd54f',
      stroke: '#5d4037',
      strokeThickness: 4
    }).setOrigin(0.5)

    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.02 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    this.createStatsPanel(width, height)
    this.createTabs(width, height)
    this.createContentArea(width, height)
    this.createButtons(width, height)
    this.refreshContent()
  }

  private createCosmicBackground(width: number, height: number): void {
    const stars = this.add.graphics()
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const size = Math.random() * 2 + 0.5
      const alpha = Math.random() * 0.6 + 0.2
      stars.fillStyle(0xffffff, alpha)
      stars.fillCircle(x, y, size)
    }

    const nebulaColors = [0x4a148c, 0x1a237e, 0x0d47a1, 0x004d40]
    for (let i = 0; i < 3; i++) {
      const nebula = this.add.graphics()
      nebula.fillStyle(nebulaColors[i], 0.1)
      const nx = (width / 3) * i + width / 6
      const ny = height * (0.2 + Math.random() * 0.3)
      nebula.fillCircle(nx, ny, 150 + Math.random() * 80)
    }
  }

  private createStatsPanel(width: number, height: number): void {
    const progress = this.achievementManager.getOverallProgress(this.save.achievement)
    const panelY = 130
    const panelWidth = width - 100

    const panelBg = this.add.graphics()
    panelBg.fillStyle(0x1a1a2e, 0.9)
    panelBg.lineStyle(2, 0x4fc3f7, 0.8)
    this.roundedRect(panelBg, 50, panelY - 30, panelWidth, 70, 10)

    const statConfigs = [
      { label: '成就', icon: '🏆', value: progress.achievements, color: 0xffd54f },
      { label: '怪物', icon: '👹', value: progress.monsters, color: 0xef5350 },
      { label: '法宝', icon: '💎', value: progress.treasures, color: 0x4fc3f7 },
      { label: '剧情', icon: '📜', value: progress.stories, color: 0x81c784 }
    ]

    const spacing = panelWidth / 4
    statConfigs.forEach((stat, index) => {
      const x = 50 + spacing * (index + 0.5)

      this.add.text(x, panelY, `${stat.icon} ${stat.label}`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '18px',
        color: '#ffffff'
      }).setOrigin(0.5)

      const progressBarBg = this.add.graphics()
      progressBarBg.fillStyle(0x333333, 0.8)
      this.roundedRect(progressBarBg, x - 80, panelY + 15, 160, 12, 6)

      const progressBar = this.add.graphics()
      progressBar.fillStyle(stat.color, 1)
      this.roundedRect(progressBar, x - 80, panelY + 15, 160 * (stat.value / 100), 12, 6)

      this.add.text(x, panelY + 35, `${stat.value}%`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '14px',
        color: '#ffffff'
      }).setOrigin(0.5)
    })
  }

  private createTabs(width: number, height: number): void {
    const tabY = 240
    const tabConfigs: { type: TabType; label: string; icon: string; color: number }[] = [
      { type: 'achievements', label: '成就', icon: '🏆', color: 0xffd54f },
      { type: 'monsters', label: '怪物图鉴', icon: '👹', color: 0xef5350 },
      { type: 'treasures', label: '法宝图鉴', icon: '💎', color: 0x4fc3f7 },
      { type: 'stories', label: '剧情回顾', icon: '📜', color: 0x81c784 }
    ]

    const tabWidth = (width - 100) / 4 - 10

    tabConfigs.forEach((config, index) => {
      const x = 50 + (tabWidth + 10) * index + tabWidth / 2
      const tab = this.createTabButton(x, tabY, tabWidth - 10, 50, config.label, config.icon, config.color, () => {
        this.currentTab = config.type
        this.updateTabStyles()
        this.refreshContent()
      })
      this.tabButtons.push(tab)
    })

    this.updateTabStyles()
  }

  private createTabButton(x: number, y: number, width: number, height: number, label: string, icon: string, color: number, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a2e, 0.9)
    bg.lineStyle(2, color, 0.6)
    this.roundedRect(bg, -width / 2, -height / 2, width, height, 10)

    const text = this.add.text(0, 0, `${icon} ${label}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
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

  private updateTabStyles(): void {
    const tabColors = [0xffd54f, 0xef5350, 0x4fc3f7, 0x81c784]
    const tabTypes: TabType[] = ['achievements', 'monsters', 'treasures', 'stories']

    this.tabButtons.forEach((tab, index) => {
      const bg = tab.getAt(0) as Phaser.GameObjects.Graphics
      const isActive = this.currentTab === tabTypes[index]
      const color = tabColors[index]

      bg.clear()
      if (isActive) {
        bg.fillStyle(color, 0.3)
        bg.lineStyle(3, color, 1)
      } else {
        bg.fillStyle(0x1a1a2e, 0.9)
        bg.lineStyle(2, color, 0.6)
      }
      this.roundedRect(bg, -tab.width / 2, -tab.height / 2, tab.width, tab.height, 10)
    })
  }

  private createContentArea(width: number, height: number): void {
    this.contentContainer = this.add.container(0, 310)
  }

  private createButtons(width: number, height: number): void {
    this.claimAllButton = this.createButton(
      width / 2 - 120,
      height - 60,
      220,
      50,
      '🎁 一键领取',
      0x4caf50,
      () => this.claimAllRewards()
    )

    this.backButton = this.createButton(
      width / 2 + 120,
      height - 60,
      220,
      50,
      '← 返回主菜单',
      0x78909c,
      () => this.goBack()
    )

    this.updateClaimAllButton()
  }

  private createButton(x: number, y: number, width: number, height: number, label: string, color: number, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.7)
    bg.lineStyle(2, color, 0.9)
    this.roundedRect(bg, -width / 2, -height / 2, width, height, 10)

    const text = this.add.text(0, 0, label, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
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

  private updateClaimAllButton(): void {
    const claimable = this.achievementManager.getClaimableAchievementsCount(this.save.achievement)
    const bg = this.claimAllButton.getAt(0) as Phaser.GameObjects.Graphics
    const text = this.claimAllButton.getAt(1) as Phaser.GameObjects.Text

    if (claimable > 0) {
      text.setText(`🎁 一键领取 (${claimable})`)
      this.claimAllButton.setInteractive()
      this.claimAllButton.setAlpha(1)
    } else {
      text.setText('🎁 一键领取')
      this.claimAllButton.disableInteractive()
      this.claimAllButton.setAlpha(0.5)
    }
  }

  private refreshContent(): void {
    this.contentContainer.removeAll(true)

    switch (this.currentTab) {
      case 'achievements':
        this.renderAchievements()
        break
      case 'monsters':
        this.renderMonsters()
        break
      case 'treasures':
        this.renderTreasures()
        break
      case 'stories':
        this.renderStories()
        break
    }
  }

  private renderAchievements(): void {
    const { width } = this.scale
    const categories = ['battle', 'collection', 'story', 'exploration', 'development']
    let yOffset = 0

    categories.forEach(category => {
      const achievements = this.achievementManager.getAchievementsByCategory(this.save.achievement, category)
      if (achievements.length === 0) return

      const categoryName = ACHIEVEMENT_CATEGORY_NAMES[category]
      const categoryColor = ACHIEVEMENT_CATEGORY_COLORS[category]

      const categoryHeader = this.add.text(70, yOffset + 10, `📋 ${categoryName}成就`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '24px',
        color: `#${categoryColor.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold'
      }).setOrigin(0, 0.5)

      this.contentContainer.add(categoryHeader)
      yOffset += 45

      achievements.forEach((achievement, index) => {
        const card = this.createAchievementCard(achievement, yOffset)
        this.contentContainer.add(card)
        yOffset += 95
      })

      yOffset += 15
    })
  }

  private createAchievementCard(achievement: Achievement, y: number): Phaser.GameObjects.Container {
    const { width } = this.scale
    const cardWidth = width - 140
    const cardHeight = 85
    const container = this.add.container(cardWidth / 2 + 70, y + cardHeight / 2)

    const bg = this.add.graphics()
    const rarityColor = ACHIEVEMENT_RARITY_COLORS[achievement.rarity]

    if (achievement.status === 'claimed') {
      bg.fillStyle(0x2e7d32, 0.2)
      bg.lineStyle(2, 0x4caf50, 0.8)
    } else if (achievement.status === 'unlocked') {
      bg.fillStyle(rarityColor, 0.15)
      bg.lineStyle(3, rarityColor, 1)
    } else {
      bg.fillStyle(0x1a1a2e, 0.9)
      bg.lineStyle(2, 0x555555, 0.5)
    }
    this.roundedRect(bg, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 10)

    const iconBg = this.add.graphics()
    iconBg.fillStyle(achievement.status === 'locked' ? 0x333333 : rarityColor, 0.3)
    iconBg.fillCircle(-cardWidth / 2 + 45, 0, 30)

    const icon = this.add.text(-cardWidth / 2 + 45, 0, achievement.icon, {
      fontSize: '32px'
    }).setOrigin(0.5)

    const nameText = this.add.text(-cardWidth / 2 + 90, -18, achievement.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: achievement.status === 'locked' ? '#666666' : '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5)

    const rarityName = ACHIEVEMENT_RARITY_NAMES[achievement.rarity]
    const rarityText = this.add.text(nameText.x + nameText.width + 10, -18, `[${rarityName}]`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: `#${rarityColor.toString(16).padStart(6, '0')}`
    }).setOrigin(0, 0.5)

    const descText = this.add.text(-cardWidth / 2 + 90, 8, achievement.description, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '15px',
      color: achievement.status === 'locked' ? '#555555' : '#aaaaaa'
    }).setOrigin(0, 0.5)

    const progressPercent = Math.min(100, Math.round((achievement.progress / achievement.target) * 100))
    const progressBarBg = this.add.graphics()
    progressBarBg.fillStyle(0x333333, 0.8)
    this.roundedRect(progressBarBg, -cardWidth / 2 + 90, 22, 200, 10, 5)

    const progressBar = this.add.graphics()
    progressBar.fillStyle(achievement.status === 'locked' ? 0x666666 : rarityColor, 1)
    this.roundedRect(progressBar, -cardWidth / 2 + 90, 22, 200 * (progressPercent / 100), 10, 5)

    const progressText = this.add.text(-cardWidth / 2 + 300, 27, `${achievement.progress}/${achievement.target}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#cccccc'
    }).setOrigin(0, 0.5)

    const rewardText = this.add.text(-cardWidth / 2 + 390, 27, this.formatRewards(achievement.rewards), {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#ffd54f'
    }).setOrigin(0, 0.5)

    if (achievement.status === 'unlocked') {
      const claimBtn = this.createClaimButton(cardWidth / 2 - 60, 0, achievement.id)
      container.add(claimBtn)
    } else if (achievement.status === 'claimed') {
      const claimedText = this.add.text(cardWidth / 2 - 60, 0, '✓ 已领取', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '18px',
        color: '#4caf50',
        fontStyle: 'bold'
      }).setOrigin(0.5)
      container.add(claimedText)
    }

    container.add([bg, iconBg, icon, nameText, rarityText, descText, progressBarBg, progressBar, progressText, rewardText])
    return container
  }

  private createClaimButton(x: number, y: number, achievementId: string): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const width = 100
    const height = 40

    const bg = this.add.graphics()
    bg.fillStyle(0x4caf50, 0.3)
    bg.lineStyle(2, 0x4caf50, 1)
    this.roundedRect(bg, -width / 2, -height / 2, width, height, 8)

    const text = this.add.text(0, 0, '领取奖励', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(width, height)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.05, duration: 100 })
    })

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 100 })
    })

    container.on('pointerdown', () => this.claimReward(achievementId))

    return container
  }

  private formatRewards(rewards: { type: string; value: number }[]): string {
    const rewardNames: Record<string, string> = {
      gold: '💰金币',
      spirit: '✨灵气',
      exp: '📈经验',
      attack: '⚔️攻击',
      defense: '🛡️防御',
      maxHealth: '❤️生命',
      maxMana: '💧法力'
    }
    return rewards.map(r => `${rewardNames[r.type] || r.type}+${r.value}`).join(' ')
  }

  private renderMonsters(): void {
    const { width } = this.scale
    const monsters = this.save.achievement.monsters
    const columns = 4
    const cardWidth = (width - 140) / columns - 15
    const cardHeight = 130

    monsters.forEach((monster, index) => {
      const col = index % columns
      const row = Math.floor(index / columns)
      const x = 70 + col * (cardWidth + 20) + cardWidth / 2
      const y = row * (cardHeight + 15) + cardHeight / 2 + 10

      const card = this.createMonsterCard(monster, x, y, cardWidth, cardHeight)
      this.contentContainer.add(card)
    })
  }

  private createMonsterCard(monster: MonsterEntry, x: number, y: number, width: number, height: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    if (monster.isDiscovered) {
      bg.fillStyle(monster.color, 0.15)
      bg.lineStyle(2, monster.color, 0.8)
    } else {
      bg.fillStyle(0x1a1a2e, 0.9)
      bg.lineStyle(2, 0x333333, 0.5)
    }
    this.roundedRect(bg, -width / 2, -height / 2, width, height, 10)

    const iconBg = this.add.graphics()
    iconBg.fillStyle(monster.isDiscovered ? monster.color : 0x333333, 0.3)
    iconBg.fillCircle(0, -height / 2 + 40, 32)

    const icon = this.add.text(0, -height / 2 + 40, monster.isDiscovered ? monster.icon : '❓', {
      fontSize: '36px'
    }).setOrigin(0.5)

    const nameText = this.add.text(0, 5, monster.isDiscovered ? monster.name : '???', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: monster.isDiscovered ? '#ffffff' : '#555555',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const stageText = this.add.text(0, 28, monster.isDiscovered ? `第${monster.stage}关` : '未解锁', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: '#888888'
    }).setOrigin(0.5)

    const countText = this.add.text(0, 45, monster.isDiscovered ? `击败: ${monster.defeatCount}次` : '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: '#4fc3f7'
    }).setOrigin(0.5)

    container.add([bg, iconBg, icon, nameText, stageText, countText])

    if (monster.isDiscovered) {
      container.setInteractive({ useHandCursor: true })
      container.on('pointerdown', () => this.showMonsterDetail(monster))
    }

    return container
  }

  private showMonsterDetail(monster: MonsterEntry): void {
    const { width, height } = this.scale

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.8)
    overlay.fillRect(0, 0, width, height)

    const panelWidth = 400
    const panelHeight = 300
    const panel = this.add.graphics()
    panel.fillStyle(0x1a1a2e, 0.98)
    panel.lineStyle(3, monster.color, 1)
    this.roundedRect(panel, (width - panelWidth) / 2, (height - panelHeight) / 2, panelWidth, panelHeight, 15)

    const iconBg = this.add.graphics()
    iconBg.fillStyle(monster.color, 0.3)
    iconBg.fillCircle(width / 2, height / 2 - 100, 45)

    const icon = this.add.text(width / 2, height / 2 - 100, monster.icon, {
      fontSize: '50px'
    }).setOrigin(0.5)

    const nameText = this.add.text(width / 2, height / 2 - 30, monster.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const descText = this.add.text(width / 2, height / 2 + 5, monster.description, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#aaaaaa',
      align: 'center',
      wordWrap: { width: 350 }
    }).setOrigin(0.5)

    const infoText = this.add.text(width / 2, height / 2 + 70,
      `出没关卡: 第${monster.stage}关  |  累计击败: ${monster.defeatCount}次`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '15px',
      color: '#4fc3f7'
    }).setOrigin(0.5)

    const closeBtn = this.createButton(width / 2, height / 2 + 120, 120, 40, '关闭', 0x78909c, () => {
      overlay.destroy()
      panel.destroy()
      iconBg.destroy()
      icon.destroy()
      nameText.destroy()
      descText.destroy()
      infoText.destroy()
      closeBtn.destroy()
    })
  }

  private renderTreasures(): void {
    const { width } = this.scale
    const treasures = this.save.achievement.treasures
    const columns = 4
    const cardWidth = (width - 140) / columns - 15
    const cardHeight = 130

    treasures.forEach((treasure, index) => {
      const col = index % columns
      const row = Math.floor(index / columns)
      const x = 70 + col * (cardWidth + 20) + cardWidth / 2
      const y = row * (cardHeight + 15) + cardHeight / 2 + 10

      const card = this.createTreasureCard(treasure, x, y, cardWidth, cardHeight)
      this.contentContainer.add(card)
    })
  }

  private createTreasureCard(treasure: TreasureEntry, x: number, y: number, width: number, height: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const rarityColor = ACHIEVEMENT_RARITY_COLORS[treasure.rarity]

    const bg = this.add.graphics()
    if (treasure.isCollected) {
      bg.fillStyle(rarityColor, 0.15)
      bg.lineStyle(2, rarityColor, 0.8)
    } else {
      bg.fillStyle(0x1a1a2e, 0.9)
      bg.lineStyle(2, 0x333333, 0.5)
    }
    this.roundedRect(bg, -width / 2, -height / 2, width, height, 10)

    const iconBg = this.add.graphics()
    iconBg.fillStyle(treasure.isCollected ? rarityColor : 0x333333, 0.3)
    iconBg.fillCircle(0, -height / 2 + 40, 32)

    const icon = this.add.text(0, -height / 2 + 40, treasure.isCollected ? treasure.icon : '❓', {
      fontSize: '36px'
    }).setOrigin(0.5)

    const nameText = this.add.text(0, 5, treasure.isCollected ? treasure.name : '???', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: treasure.isCollected ? '#ffffff' : '#555555',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const rarityName = ACHIEVEMENT_RARITY_NAMES[treasure.rarity]
    const rarityText = this.add.text(0, 28, treasure.isCollected ? `[${rarityName}]` : '未解锁', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: treasure.isCollected ? `#${rarityColor.toString(16).padStart(6, '0')}` : '#555555'
    }).setOrigin(0.5)

    const levelText = this.add.text(0, 45, treasure.isCollected ? `最高等级: ${treasure.maxLevel}` : '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: '#4fc3f7'
    }).setOrigin(0.5)

    container.add([bg, iconBg, icon, nameText, rarityText, levelText])

    if (treasure.isCollected) {
      container.setInteractive({ useHandCursor: true })
      container.on('pointerdown', () => this.showTreasureDetail(treasure))
    }

    return container
  }

  private showTreasureDetail(treasure: TreasureEntry): void {
    const { width, height } = this.scale
    const rarityColor = ACHIEVEMENT_RARITY_COLORS[treasure.rarity]
    const rarityName = ACHIEVEMENT_RARITY_NAMES[treasure.rarity]

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.8)
    overlay.fillRect(0, 0, width, height)

    const panelWidth = 400
    const panelHeight = 300
    const panel = this.add.graphics()
    panel.fillStyle(0x1a1a2e, 0.98)
    panel.lineStyle(3, rarityColor, 1)
    this.roundedRect(panel, (width - panelWidth) / 2, (height - panelHeight) / 2, panelWidth, panelHeight, 15)

    const iconBg = this.add.graphics()
    iconBg.fillStyle(rarityColor, 0.3)
    iconBg.fillCircle(width / 2, height / 2 - 100, 45)

    const icon = this.add.text(width / 2, height / 2 - 100, treasure.icon, {
      fontSize: '50px'
    }).setOrigin(0.5)

    const nameText = this.add.text(width / 2, height / 2 - 30, treasure.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const rarityText = this.add.text(nameText.x + nameText.width / 2 + 15, height / 2 - 30, `[${rarityName}]`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: `#${rarityColor.toString(16).padStart(6, '0')}`
    }).setOrigin(0, 0.5)

    const descText = this.add.text(width / 2, height / 2 + 5, treasure.description, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#aaaaaa',
      align: 'center',
      wordWrap: { width: 350 }
    }).setOrigin(0.5)

    const infoText = this.add.text(width / 2, height / 2 + 70,
      `最高等级: ${treasure.maxLevel}级`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '15px',
      color: '#4fc3f7'
    }).setOrigin(0.5)

    const closeBtn = this.createButton(width / 2, height / 2 + 120, 120, 40, '关闭', 0x78909c, () => {
      overlay.destroy()
      panel.destroy()
      iconBg.destroy()
      icon.destroy()
      nameText.destroy()
      rarityText.destroy()
      descText.destroy()
      infoText.destroy()
      closeBtn.destroy()
    })
  }

  private renderStories(): void {
    const { width } = this.scale
    const stories = this.save.achievement.stories
    const cardWidth = width - 140
    const cardHeight = 100

    stories.forEach((story, index) => {
      const y = index * (cardHeight + 15) + cardHeight / 2 + 10
      const card = this.createStoryCard(story, y, cardWidth, cardHeight)
      this.contentContainer.add(card)
    })
  }

  private createStoryCard(story: StoryEntry, y: number, width: number, height: number): Phaser.GameObjects.Container {
    const container = this.add.container(width / 2 + 70, y)

    const bg = this.add.graphics()
    if (story.isCompleted) {
      bg.fillStyle(0x81c784, 0.15)
      bg.lineStyle(2, 0x81c784, 0.8)
    } else if (story.isDiscovered) {
      bg.fillStyle(0xffd54f, 0.1)
      bg.lineStyle(2, 0xffd54f, 0.6)
    } else {
      bg.fillStyle(0x1a1a2e, 0.9)
      bg.lineStyle(2, 0x333333, 0.5)
    }
    this.roundedRect(bg, -width / 2, -height / 2, width, height, 10)

    const iconBg = this.add.graphics()
    iconBg.fillStyle(story.isCompleted ? 0x81c784 : story.isDiscovered ? 0xffd54f : 0x333333, 0.3)
    iconBg.fillCircle(-width / 2 + 50, 0, 35)

    const icon = this.add.text(-width / 2 + 50, 0, story.isDiscovered ? story.icon : '🔒', {
      fontSize: '40px'
    }).setOrigin(0.5)

    const nameText = this.add.text(-width / 2 + 100, -18, story.isDiscovered ? story.name : '???', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: story.isDiscovered ? '#ffffff' : '#555555',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5)

    const stageText = this.add.text(nameText.x + nameText.width + 15, -18,
      `需要第${story.requiredStage}关`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0, 0.5)

    const descText = this.add.text(-width / 2 + 100, 12,
      story.isDiscovered ? story.description : '完成更多关卡解锁剧情', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '15px',
      color: story.isDiscovered ? '#aaaaaa' : '#555555'
    }).setOrigin(0, 0.5)

    let statusText = ''
    let statusColor = '#888888'
    if (story.isCompleted) {
      statusText = '✓ 已完成'
      statusColor = '#4caf50'
    } else if (story.isDiscovered) {
      statusText = '进行中'
      statusColor = '#ffd54f'
    } else {
      statusText = '未解锁'
      statusColor = '#555555'
    }

    const status = this.add.text(width / 2 - 60, 0, statusText, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: statusColor,
      fontStyle: 'bold'
    }).setOrigin(0.5)

    container.add([bg, iconBg, icon, nameText, stageText, descText, status])
    return container
  }

  private claimReward(achievementId: string): void {
    const result = this.achievementManager.claimReward(this.save, achievementId)
    if (result.success) {
      this.showRewardNotification(result.rewards)
      this.refreshContent()
      this.updateClaimAllButton()
      this.createStatsPanel(this.scale.width, this.scale.height)
    }
  }

  private claimAllRewards(): void {
    const result = this.achievementManager.claimAllRewards(this.save)
    if (result.success) {
      this.showRewardNotification(result.totalRewards, true)
      this.refreshContent()
      this.updateClaimAllButton()
      this.createStatsPanel(this.scale.width, this.scale.height)
    }
  }

  private showRewardNotification(rewards: { type: string; value: number }[], isMultiple = false): void {
    const { width, height } = this.scale

    const rewardNames: Record<string, string> = {
      gold: '💰金币',
      spirit: '✨灵气',
      exp: '📈经验',
      attack: '⚔️攻击',
      defense: '🛡️防御',
      maxHealth: '❤️生命上限',
      maxMana: '💧法力上限'
    }

    const rewardSummary: Record<string, number> = {}
    rewards.forEach(r => {
      rewardSummary[r.type] = (rewardSummary[r.type] || 0) + r.value
    })

    const rewardText = Object.entries(rewardSummary)
      .map(([type, value]) => `${rewardNames[type] || type} +${value}`)
      .join('\n')

    const panel = this.add.graphics()
    panel.fillStyle(0x1a1a2e, 0.95)
    panel.lineStyle(3, 0xffd54f, 1)
    const panelWidth = 350
    const panelHeight = 180
    this.roundedRect(panel, (width - panelWidth) / 2, (height - panelHeight) / 2, panelWidth, panelHeight, 15)

    const title = this.add.text(width / 2, height / 2 - 55, isMultiple ? '🎉 批量领取成功！' : '🎉 领取成功！', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '26px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const rewardsText = this.add.text(width / 2, height / 2 + 10, rewardText, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5)

    this.tweens.add({
      targets: [panel, title, rewardsText],
      alpha: { from: 0, to: 1 },
      scale: { from: 0.8, to: 1 },
      duration: 300,
      ease: 'Back.easeOut'
    })

    this.time.delayedCall(1800, () => {
      this.tweens.add({
        targets: [panel, title, rewardsText],
        alpha: 0,
        scale: 0.8,
        duration: 300,
        ease: 'Back.easeIn',
        onComplete: () => {
          panel.destroy()
          title.destroy()
          rewardsText.destroy()
        }
      })
    })
  }

  private goBack(): void {
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
