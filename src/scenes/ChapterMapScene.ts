import Phaser from 'phaser'
import type { GameSave, Chapter, ChapterLevel, ChapterReward, SweepResult, ChapterSweepResult } from '../types'
import { SaveManager } from '../managers/SaveManager'
import { ChapterManager } from '../managers/ChapterManager'
import { CHAPTERS } from '../data/chapterData'

export class ChapterMapScene extends Phaser.Scene {
  private save!: GameSave
  private saveManager: SaveManager
  private chapterManager: ChapterManager
  private currentChapter!: Chapter & { state: any; progress: any }
  private levelNodes: Phaser.GameObjects.Container[] = []
  private pathLines: Phaser.GameObjects.Graphics[] = []
  private chapterSelector!: Phaser.GameObjects.Container
  private currentChapterIndex = 0

  constructor() {
    super({ key: 'ChapterMapScene' })
    this.saveManager = SaveManager.getInstance()
    this.chapterManager = ChapterManager.getInstance()
  }

  init(data: { chapterId?: string }): void {
    const existingSave = this.saveManager.loadGame()
    this.save = existingSave || this.saveManager.createNewSave()
    this.chapterManager.initializeChapterProgress(this.save)
    
    const chapterId = data.chapterId || this.save.chapter.currentChapterId || 'chapter_1'
    const chapterData = this.chapterManager.getChapterWithState(this.save, chapterId)
    if (chapterData) {
      this.currentChapter = chapterData
      this.currentChapterIndex = CHAPTERS.findIndex(ch => ch.id === chapterId)
    } else {
      this.currentChapter = this.chapterManager.getChapterWithState(this.save, 'chapter_1')!
      this.currentChapterIndex = 0
    }
    
    this.chapterManager.startChapter(this.save, this.currentChapter.id)
    this.saveManager.saveGame(this.save)
  }

  create(): void {
    const { width, height } = this.scale
    
    this.cameras.main.setBackgroundColor(this.currentChapter.backgroundColor)
    this.createBackground(width, height)
    this.createChapterInfo(width, height)
    this.createChapterSelector(width, height)
    this.createMap(width, height)
    this.createBackButton(width, height)
    this.createReviewButton(width, height)
    
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

    const nebula = this.add.graphics()
    nebula.fillStyle(this.currentChapter.color, 0.1)
    nebula.fillCircle(width * 0.3, height * 0.4, 300)
    nebula.fillStyle(this.currentChapter.color, 0.08)
    nebula.fillCircle(width * 0.7, height * 0.6, 250)

    this.tweens.add({
      targets: nebula,
      alpha: { from: 0.5, to: 1 },
      duration: 3000,
      yoyo: true,
      repeat: -1
    })
  }

  private createChapterInfo(width: number, height: number): void {
    const infoY = 80
    
    const chapterIcon = this.add.text(60, infoY, this.currentChapter.icon, {
      fontSize: '48px'
    }).setOrigin(0, 0.5)

    const chapterTitle = this.add.text(130, infoY - 15, this.currentChapter.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '32px',
      color: '#' + this.currentChapter.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0, 0.5)

    const chapterDesc = this.add.text(130, infoY + 15, this.currentChapter.description, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5)

    const progress = this.currentChapter.progress
    const progressText = this.add.text(width - 60, infoY, `进度: ${progress.completed}/${progress.total} (${progress.percentage}%)`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffd54f'
    }).setOrigin(1, 0.5)

    const progressBarBg = this.add.graphics()
    progressBarBg.fillStyle(0x000000, 0.5)
    progressBarBg.fillRect(width - 260, infoY + 25, 200, 8)
    
    const progressBar = this.add.graphics()
    progressBar.fillStyle(this.currentChapter.color, 1)
    progressBar.fillRect(width - 260, infoY + 25, 200 * (progress.percentage / 100), 8)
  }

  private createChapterSelector(width: number, height: number): void {
    const availableChapters = this.chapterManager.getAvailableChapters(this.save)
    if (availableChapters.length <= 1) return

    this.chapterSelector = this.add.container(width / 2, 150)
    
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.6)
    bg.lineStyle(2, this.currentChapter.color, 0.8)
    this.roundedRect(bg, -200, -30, 400, 60, 12)
    
    const leftArrow = this.add.text(-180, 0, '◀', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '24px',
      color: this.currentChapterIndex > 0 ? '#ffffff' : '#666666'
    }).setOrigin(0.5)
    
    const rightArrow = this.add.text(180, 0, '▶', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '24px',
      color: this.currentChapterIndex < availableChapters.length - 1 ? '#ffffff' : '#666666'
    }).setOrigin(0.5)
    
    const chapterText = this.add.text(0, 0, `第 ${this.currentChapter.chapterNumber}/${availableChapters.length} 章`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5)

    this.chapterSelector.add([bg, leftArrow, rightArrow, chapterText])
    this.chapterSelector.setSize(400, 60)
    this.chapterSelector.setInteractive(new Phaser.Geom.Rectangle(-200, -30, 400, 60), Phaser.Geom.Rectangle.Contains)

    leftArrow.setInteractive({ useHandCursor: this.currentChapterIndex > 0 })
    rightArrow.setInteractive({ useHandCursor: this.currentChapterIndex < availableChapters.length - 1 })

    leftArrow.on('pointerdown', () => {
      if (this.currentChapterIndex > 0) {
        this.switchChapter(this.currentChapterIndex - 1)
      }
    })

    rightArrow.on('pointerdown', () => {
      if (this.currentChapterIndex < availableChapters.length - 1) {
        this.switchChapter(this.currentChapterIndex + 1)
      }
    })
  }

  private switchChapter(index: number): void {
    const availableChapters = this.chapterManager.getAvailableChapters(this.save)
    const chapter = availableChapters[index]
    if (!chapter) return

    this.currentChapterIndex = index
    this.currentChapter = this.chapterManager.getChapterWithState(this.save, chapter.id)!
    this.chapterManager.startChapter(this.save, chapter.id)
    this.saveManager.saveGame(this.save)

    this.cameras.main.fadeOut(300)
    this.time.delayedCall(300, () => {
      this.scene.restart({ chapterId: chapter.id })
    })
  }

  private createMap(width: number, height: number): void {
    const mapAreaY = 250
    const mapAreaHeight = height - 350
    
    this.levelNodes.forEach(node => node.destroy())
    this.pathLines.forEach(line => line.destroy())
    this.levelNodes = []
    this.pathLines = []

    const levels = this.currentChapter.levels
    
    this.createPathLines(levels, width, mapAreaY + mapAreaHeight / 2)
    
    levels.forEach((level, index) => {
      const node = this.createLevelNode(level, index, width, mapAreaY + mapAreaHeight / 2)
      this.levelNodes.push(node)
    })
  }

  private createPathLines(levels: ChapterLevel[], width: number, centerY: number): void {
    for (let i = 0; i < levels.length - 1; i++) {
      const fromLevel = levels[i]
      const toLevel = levels[i + 1]
      
      const line = this.add.graphics()
      const fromX = fromLevel.position.x
      const fromY = centerY + (fromLevel.position.y - 250)
      const toX = toLevel.position.x
      const toY = centerY + (toLevel.position.y - 250)
      
      line.lineStyle(4, 0x444444, 0.6)
      line.beginPath()
      line.moveTo(fromX, fromY)
      
      const midX = (fromX + toX) / 2
      const midY = (fromY + toY) / 2 + (Math.random() - 0.5) * 40
      line.lineTo(midX, midY)
      line.lineTo(toX, toY)
      line.strokePath()
      
      if (fromLevel.isCompleted) {
        const progressLine = this.add.graphics()
        progressLine.lineStyle(4, this.currentChapter.color, 0.9)
        progressLine.beginPath()
        progressLine.moveTo(fromX, fromY)
        progressLine.lineTo(midX, midY)
        progressLine.lineTo(toX, toY)
        progressLine.strokePath()
        this.pathLines.push(progressLine)
      }
      
      this.pathLines.push(line)
    }
  }

  private createLevelNode(level: ChapterLevel & { isUnlocked: boolean; isCompleted: boolean }, index: number, width: number, centerY: number): Phaser.GameObjects.Container {
    const x = level.position.x
    const y = centerY + (level.position.y - 250)
    
    const container = this.add.container(x, y)
    
    const size = level.type === 'boss' ? 70 : 55
    const bgColor = level.isCompleted ? 0x4caf50 : level.isUnlocked ? this.currentChapter.color : 0x333333
    const borderColor = level.isCompleted ? 0x81c784 : level.isUnlocked ? this.currentChapter.color : 0x555555
    
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.7)
    bg.lineStyle(3, borderColor, level.isUnlocked ? 1 : 0.5)
    
    if (level.type === 'boss') {
      bg.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
        const px = Math.cos(angle) * (size / 2)
        const py = Math.sin(angle) * (size / 2)
        if (i === 0) bg.moveTo(px, py)
        else bg.lineTo(px, py)
      }
      bg.closePath()
      bg.fillPath()
      bg.strokePath()
    } else {
      this.roundedRect(bg, -size / 2, -size / 2, size, size, 12)
    }

    const typeIcon = this.add.text(0, -8, this.getLevelTypeIcon(level.type), {
      fontSize: level.type === 'boss' ? '32px' : '24px'
    }).setOrigin(0.5)

    const levelNum = this.add.text(0, 12, `${index + 1}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: level.isUnlocked ? '#ffffff' : '#666666',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    if (level.isCompleted) {
      const checkMark = this.add.text(size / 2 - 5, -size / 2 + 5, '✓', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#81c784',
        fontStyle: 'bold'
      }).setOrigin(1, 0)
      container.add(checkMark)
    }

    if (!level.isUnlocked) {
      const lock = this.add.text(0, 0, '🔒', {
        fontSize: '24px'
      }).setOrigin(0.5)
      container.add(lock)
      typeIcon.setAlpha(0.3)
      levelNum.setAlpha(0.3)
    }

    container.add([bg, typeIcon, levelNum])
    container.setSize(size, size)

    if (level.isUnlocked) {
      container.setInteractive({ useHandCursor: true })
      
      container.on('pointerover', () => {
        this.tweens.add({
          targets: container,
          scale: 1.15,
          duration: 150
        })
        this.showLevelTooltip(level, x, y - size / 2 - 10)
      })
      
      container.on('pointerout', () => {
        this.tweens.add({
          targets: container,
          scale: 1,
          duration: 150
        })
        this.hideLevelTooltip()
      })
      
      container.on('pointerdown', () => {
        this.enterLevel(level)
      })

      const isCurrent = this.currentChapter.state.currentLevelIndex === index && !level.isCompleted
      if (isCurrent) {
        const glow = this.add.graphics()
        glow.lineStyle(2, 0xffd54f, 0.8)
        if (level.type === 'boss') {
          glow.beginPath()
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
            const px = Math.cos(angle) * (size / 2 + 8)
            const py = Math.sin(angle) * (size / 2 + 8)
            if (i === 0) glow.moveTo(px, py)
            else glow.lineTo(px, py)
          }
          glow.closePath()
          glow.strokePath()
        } else {
          this.roundedRect(glow, -size / 2 - 5, -size / 2 - 5, size + 10, size + 10, 14)
        }
        container.add(glow)
        
        this.tweens.add({
          targets: glow,
          alpha: { from: 0.3, to: 1 },
          duration: 1000,
          yoyo: true,
          repeat: -1
        })
      }
    }

    if (level.isCompleted && this.chapterManager.canSweepLevel(this.save, this.currentChapter.id, level.id)) {
      const sweepBtn = this.createSweepButton(x, y - size / 2 - 28, level)
      container.parentContainer?.add(sweepBtn)
    }

    const label = this.add.text(0, size / 2 + 20, level.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: level.isUnlocked ? '#ffffff' : '#666666',
      align: 'center'
    }).setOrigin(0.5, 0)
    container.add(label)

    return container
  }

  private createSweepButton(x: number, y: number, level: ChapterLevel & { isUnlocked: boolean; isCompleted: boolean }): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const btnWidth = 60
    const btnHeight = 26

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.8)
    bg.lineStyle(2, 0xffd54f, 1)
    this.roundedRect(bg, -btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6)

    const text = this.add.text(0, 0, '⚡ 扫荡', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(btnWidth, btnHeight)
    container.setInteractive({ useHandCursor: true })
    container.setDepth(50)

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.1, duration: 100 })
      bg.clear()
      bg.fillStyle(0xffd54f, 0.3)
      bg.lineStyle(3, 0xffd54f, 1)
      this.roundedRect(bg, -btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6)
    })

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 100 })
      bg.clear()
      bg.fillStyle(0x000000, 0.8)
      bg.lineStyle(2, 0xffd54f, 1)
      this.roundedRect(bg, -btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6)
    })

    container.on('pointerdown', () => {
      this.handleSweepLevel(level)
    })

    return container
  }

  private levelTooltip: Phaser.GameObjects.Container | null = null

  private showLevelTooltip(level: ChapterLevel & { isUnlocked: boolean; isCompleted: boolean }, x: number, y: number): void {
    this.hideLevelTooltip()
    
    this.levelTooltip = this.add.container(x, y)
    
    const panelWidth = 220
    const panelHeight = 150
    
    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a2e, 0.98)
    bg.lineStyle(2, this.currentChapter.color, 1)
    this.roundedRect(bg, -panelWidth / 2, -panelHeight, panelWidth, panelHeight, 12)
    
    const typeLabel = this.add.text(-panelWidth / 2 + 15, -panelHeight + 15, this.chapterManager.getLevelTypeLabel(level.type), {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#' + this.currentChapter.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0, 0)
    
    const nameLabel = this.add.text(-panelWidth / 2 + 15, -panelHeight + 40, level.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0)
    
    const descLabel = this.add.text(-panelWidth / 2 + 15, -panelHeight + 65, level.description, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: '#aaaaaa',
      wordWrap: { width: panelWidth - 30 }
    }).setOrigin(0, 0)
    
    const rewardsTitle = this.add.text(-panelWidth / 2 + 15, -panelHeight + 100, '奖励:', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0, 0)
    
    const rewardsText = level.rewards.map(r => this.chapterManager.getRewardLabel(r)).join('  ')
    const rewardsLabel = this.add.text(-panelWidth / 2 + 15, -panelHeight + 120, rewardsText, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '11px',
      color: '#81c784'
    }).setOrigin(0, 0)
    
    this.levelTooltip.add([bg, typeLabel, nameLabel, descLabel, rewardsTitle, rewardsLabel])
    this.levelTooltip.setDepth(100)
    
    this.levelTooltip.setAlpha(0)
    this.tweens.add({
      targets: this.levelTooltip,
      alpha: 1,
      y: '-=5',
      duration: 200
    })
  }

  private hideLevelTooltip(): void {
    if (this.levelTooltip) {
      this.levelTooltip.destroy()
      this.levelTooltip = null
    }
  }

  private getLevelTypeIcon(type: ChapterLevel['type']): string {
    const icons: Record<ChapterLevel['type'], string> = {
      battle: '⚔',
      story: '📖',
      boss: '👑'
    }
    return icons[type]
  }

  private enterLevel(level: ChapterLevel & { isUnlocked: boolean; isCompleted: boolean }): void {
    if (!level.isUnlocked) return
    
    this.cameras.main.fadeOut(300)
    this.time.delayedCall(300, () => {
      if (level.type === 'story' && level.storyDialogues) {
        this.scene.start('StoryScene', {
          chapterId: this.currentChapter.id,
          levelId: level.id,
          dialogues: level.storyDialogues,
          isLevelStory: true
        })
      } else if (level.type === 'battle' || level.type === 'boss') {
        const stageId = level.stageId || 1
        this.scene.start('BattleScene', { 
          stageId,
          chapterId: this.currentChapter.id,
          levelId: level.id
        })
      }
    })
  }

  private createBackButton(width: number, height: number): void {
    const btn = this.add.container(60, height - 40)
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.6)
    bg.lineStyle(2, 0x78909c, 0.8)
    this.roundedRect(bg, -60, -22, 120, 44, 10)
    const text = this.add.text(0, 0, '◀ 返回', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5)
    btn.add([bg, text])
    btn.setSize(120, 44)
    btn.setInteractive({ useHandCursor: true })
    btn.on('pointerover', () => this.tweens.add({ targets: btn, scale: 1.08, duration: 150 }))
    btn.on('pointerout', () => this.tweens.add({ targets: btn, scale: 1, duration: 150 }))
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(400)
      this.time.delayedCall(400, () => {
        this.scene.start('MenuScene')
      })
    })
  }

  private createReviewButton(width: number, height: number): void {
    const state = this.currentChapter.state
    if (state.status !== 'completed') return

    const canSweep = this.chapterManager.canSweepChapter(this.save, this.currentChapter.id)

    const btnX = canSweep ? width - 180 : width - 80
    const btn = this.add.container(btnX, height - 40)
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.6)
    bg.lineStyle(2, 0xffd54f, 0.9)
    this.roundedRect(bg, -80, -22, 160, 44, 10)
    const text = this.add.text(0, 0, '📜 通关回顾', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffd54f'
    }).setOrigin(0.5)
    btn.add([bg, text])
    btn.setSize(160, 44)
    btn.setInteractive({ useHandCursor: true })
    btn.on('pointerover', () => this.tweens.add({ targets: btn, scale: 1.08, duration: 150 }))
    btn.on('pointerout', () => this.tweens.add({ targets: btn, scale: 1, duration: 150 }))
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(400)
      this.time.delayedCall(400, () => {
        this.scene.start('ChapterReviewScene', { chapterId: this.currentChapter.id })
      })
    })

    if (canSweep) {
      this.createChapterSweepButton(width - 40, height - 40)
    }
  }

  private createChapterSweepButton(x: number, y: number): void {
    const container = this.add.container(x, y)
    const btnWidth = 120
    const btnHeight = 44

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.7)
    bg.lineStyle(2, 0xff9800, 0.95)
    this.roundedRect(bg, -btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10)

    const text = this.add.text(0, 0, '⚡ 章节扫荡', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffcc80',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(btnWidth, btnHeight)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.08, duration: 150 })
      bg.clear()
      bg.fillStyle(0xff9800, 0.35)
      bg.lineStyle(3, 0xff9800, 1)
      this.roundedRect(bg, -btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10)
    })

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 150 })
      bg.clear()
      bg.fillStyle(0x000000, 0.7)
      bg.lineStyle(2, 0xff9800, 0.95)
      this.roundedRect(bg, -btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10)
    })

    container.on('pointerdown', () => {
      this.handleSweepChapter()
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

  private handleSweepLevel(level: ChapterLevel & { isUnlocked: boolean; isCompleted: boolean }): void {
    const result = this.chapterManager.sweepLevel(this.save, this.currentChapter.id, level.id)
    this.showSweepResult(result)
  }

  private handleSweepChapter(): void {
    this.showSweepConfirmDialog()
  }

  private sweepConfirmDialog: Phaser.GameObjects.Container | null = null

  private showSweepConfirmDialog(): void {
    this.hideSweepConfirmDialog()

    const { width, height } = this.scale
    const dialog = this.add.container(width / 2, height / 2)

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.6)
    overlay.fillRect(-width / 2, -height / 2, width, height)

    const panelWidth = 420
    const panelHeight = 320

    const panel = this.add.graphics()
    panel.fillStyle(0x1a1a2e, 0.98)
    panel.lineStyle(3, 0xff9800, 0.95)
    this.roundedRect(panel, -panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16)

    const title = this.add.text(0, -panelHeight / 2 + 40, '⚡ 章节扫荡', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: '#ffcc80',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const desc = this.add.text(0, -panelHeight / 2 + 90, `选择扫荡次数，快速获取奖励`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#b0bec5'
    }).setOrigin(0.5)

    const times = [1, 5, 10]
    const timeButtons: Phaser.GameObjects.Container[] = []
    let selectedTime = 1

    times.forEach((t, idx) => {
      const bx = -120 + idx * 120
      const btnContainer = this.add.container(bx, -10)
      const bw = 100
      const bh = 50

      const btnBg = this.add.graphics()
      btnBg.fillStyle(0x000000, 0.7)
      btnBg.lineStyle(2, idx === 0 ? 0xffd54f : 0x555555, 1)
      this.roundedRect(btnBg, -bw / 2, -bh / 2, bw, bh, 10)

      const btnText = this.add.text(0, 0, `${t} 次`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: idx === 0 ? '#ffd54f' : '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5)

      btnContainer.add([btnBg, btnText])
      btnContainer.setSize(bw, bh)
      btnContainer.setInteractive({ useHandCursor: true })

      btnContainer.on('pointerover', () => {
        this.tweens.add({ targets: btnContainer, scale: 1.05, duration: 100 })
      })
      btnContainer.on('pointerout', () => {
        this.tweens.add({ targets: btnContainer, scale: 1, duration: 100 })
      })
      btnContainer.on('pointerdown', () => {
        selectedTime = t
        timeButtons.forEach((tb, i) => {
          const tbBg = tb.getAt(0) as Phaser.GameObjects.Graphics
          const tbText = tb.getAt(1) as Phaser.GameObjects.Text
          tbBg.clear()
          tbBg.fillStyle(0x000000, 0.7)
          tbBg.lineStyle(2, i === idx ? 0xffd54f : 0x555555, 1)
          this.roundedRect(tbBg, -50, -25, 100, 50, 10)
          tbText.setColor(i === idx ? '#ffd54f' : '#ffffff')
        })
      })

      timeButtons.push(btnContainer)
    })

    const confirmBtn = this.add.container(-80, panelHeight / 2 - 50)
    const cbw = 130
    const cbh = 44
    const confirmBg = this.add.graphics()
    confirmBg.fillStyle(0x000000, 0.7)
    confirmBg.lineStyle(2, 0xff9800, 0.95)
    this.roundedRect(confirmBg, -cbw / 2, -cbh / 2, cbw, cbh, 10)
    const confirmText = this.add.text(0, 0, '开始扫荡', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffcc80',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    confirmBtn.add([confirmBg, confirmText])
    confirmBtn.setSize(cbw, cbh)
    confirmBtn.setInteractive({ useHandCursor: true })

    confirmBtn.on('pointerover', () => {
      this.tweens.add({ targets: confirmBtn, scale: 1.08, duration: 150 })
      confirmBg.clear()
      confirmBg.fillStyle(0xff9800, 0.35)
      confirmBg.lineStyle(3, 0xff9800, 1)
      this.roundedRect(confirmBg, -cbw / 2, -cbh / 2, cbw, cbh, 10)
    })
    confirmBtn.on('pointerout', () => {
      this.tweens.add({ targets: confirmBtn, scale: 1, duration: 150 })
      confirmBg.clear()
      confirmBg.fillStyle(0x000000, 0.7)
      confirmBg.lineStyle(2, 0xff9800, 0.95)
      this.roundedRect(confirmBg, -cbw / 2, -cbh / 2, cbw, cbh, 10)
    })
    confirmBtn.on('pointerdown', () => {
      this.hideSweepConfirmDialog()
      const result = this.chapterManager.sweepChapterMultipleTimes(this.save, this.currentChapter.id, selectedTime)
      this.showChapterSweepResult(result)
    })

    const cancelBtn = this.add.container(80, panelHeight / 2 - 50)
    const cxbw = 130
    const cxbh = 44
    const cancelBg = this.add.graphics()
    cancelBg.fillStyle(0x000000, 0.7)
    cancelBg.lineStyle(2, 0x78909c, 0.95)
    this.roundedRect(cancelBg, -cxbw / 2, -cxbh / 2, cxbw, cxbh, 10)
    const cancelText = this.add.text(0, 0, '取消', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#b0bec5'
    }).setOrigin(0.5)
    cancelBtn.add([cancelBg, cancelText])
    cancelBtn.setSize(cxbw, cxbh)
    cancelBtn.setInteractive({ useHandCursor: true })

    cancelBtn.on('pointerover', () => {
      this.tweens.add({ targets: cancelBtn, scale: 1.08, duration: 150 })
    })
    cancelBtn.on('pointerout', () => {
      this.tweens.add({ targets: cancelBtn, scale: 1, duration: 150 })
    })
    cancelBtn.on('pointerdown', () => {
      this.hideSweepConfirmDialog()
    })

    dialog.add([overlay, panel, title, desc, ...timeButtons, confirmBtn, cancelBtn])
    dialog.setDepth(200)
    this.sweepConfirmDialog = dialog
  }

  private hideSweepConfirmDialog(): void {
    if (this.sweepConfirmDialog) {
      this.sweepConfirmDialog.destroy()
      this.sweepConfirmDialog = null
    }
  }

  private sweepResultDialog: Phaser.GameObjects.Container | null = null

  private showSweepResult(result: SweepResult): void {
    this.hideSweepResult()

    const { width, height } = this.scale
    const dialog = this.add.container(width / 2, height / 2)

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.6)
    overlay.fillRect(-width / 2, -height / 2, width, height)

    const panelWidth = 400
    const rewardCount = result.rewards.length
    const panelHeight = 260 + rewardCount * 35 + (result.leveledUp ? 50 : 0)

    const panel = this.add.graphics()
    panel.fillStyle(0x1a1a2e, 0.98)
    panel.lineStyle(3, result.success ? 0xffd54f : 0xef5350, 0.95)
    this.roundedRect(panel, -panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16)

    const title = this.add.text(0, -panelHeight / 2 + 40,
      result.success ? '⚡ 扫荡成功' : '❌ 扫荡失败', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: result.success ? '#ffd54f' : '#ef5350',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    if (result.message) {
      const msg = this.add.text(0, -panelHeight / 2 + 80, result.message, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '16px',
        color: '#ef5350'
      }).setOrigin(0.5)
      dialog.add(msg)
    } else {
      const levelName = this.add.text(0, -panelHeight / 2 + 80, `关卡：${result.levelName}`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '18px',
        color: '#ffffff'
      }).setOrigin(0.5)
      dialog.add(levelName)
    }

    if (result.success && result.rewards.length > 0) {
      const rewardTitle = this.add.text(0, -panelHeight / 2 + 120, '获得奖励：', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '18px',
        color: '#ffcc80',
        fontStyle: 'bold'
      }).setOrigin(0.5)
      dialog.add(rewardTitle)

      result.rewards.forEach((reward, idx) => {
        const rewardLabel = this.chapterManager.getRewardLabel(reward)
        const rewardText = this.add.text(0, -panelHeight / 2 + 155 + idx * 35, rewardLabel, {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '18px',
          color: '#81c784'
        }).setOrigin(0.5)
        dialog.add(rewardText)
      })
    }

    if (result.leveledUp) {
      const levelUpText = this.add.text(0, panelHeight / 2 - 110,
        `🎊 等级提升！提升了 ${result.levelsGained} 级`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#ffd54f',
        fontStyle: 'bold',
        stroke: '#5d4037',
        strokeThickness: 2
      }).setOrigin(0.5)
      dialog.add(levelUpText)
    }

    const playerInfo = this.add.text(0, panelHeight / 2 - 75,
      `当前等级: Lv.${this.save.player.level}  |  经验: ${this.save.player.exp}/${this.save.player.expToNext}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#b0bec5'
    }).setOrigin(0.5)

    const confirmBtn = this.add.container(0, panelHeight / 2 - 40)
    const cbw = 140
    const cbh = 44
    const confirmBg = this.add.graphics()
    confirmBg.fillStyle(0x000000, 0.7)
    confirmBg.lineStyle(2, 0x4fc3f7, 0.95)
    this.roundedRect(confirmBg, -cbw / 2, -cbh / 2, cbw, cbh, 10)
    const confirmText = this.add.text(0, 0, '确定', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    confirmBtn.add([confirmBg, confirmText])
    confirmBtn.setSize(cbw, cbh)
    confirmBtn.setInteractive({ useHandCursor: true })

    confirmBtn.on('pointerover', () => {
      this.tweens.add({ targets: confirmBtn, scale: 1.08, duration: 150 })
      confirmBg.clear()
      confirmBg.fillStyle(0x4fc3f7, 0.35)
      confirmBg.lineStyle(3, 0x4fc3f7, 1)
      this.roundedRect(confirmBg, -cbw / 2, -cbh / 2, cbw, cbh, 10)
    })
    confirmBtn.on('pointerout', () => {
      this.tweens.add({ targets: confirmBtn, scale: 1, duration: 150 })
      confirmBg.clear()
      confirmBg.fillStyle(0x000000, 0.7)
      confirmBg.lineStyle(2, 0x4fc3f7, 0.95)
      this.roundedRect(confirmBg, -cbw / 2, -cbh / 2, cbw, cbh, 10)
    })
    confirmBtn.on('pointerdown', () => {
      this.hideSweepResult()
      this.scene.restart({ chapterId: this.currentChapter.id })
    })

    dialog.add([overlay, panel, title, playerInfo, confirmBtn])
    dialog.setDepth(200)
    this.sweepResultDialog = dialog
  }

  private showChapterSweepResult(result: ChapterSweepResult): void {
    this.hideSweepResult()

    const { width, height } = this.scale
    const dialog = this.add.container(width / 2, height / 2)

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.6)
    overlay.fillRect(-width / 2, -height / 2, width, height)

    const rewardCount = result.totalRewards.length
    const panelWidth = 460
    const panelHeight = 320 + rewardCount * 35 + (result.leveledUp ? 50 : 0)

    const panel = this.add.graphics()
    panel.fillStyle(0x1a1a2e, 0.98)
    panel.lineStyle(3, result.success ? 0xff9800 : 0xef5350, 0.95)
    this.roundedRect(panel, -panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16)

    const title = this.add.text(0, -panelHeight / 2 + 40,
      result.success ? '⚡ 章节扫荡完成' : '❌ 扫荡失败', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: result.success ? '#ffcc80' : '#ef5350',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const chapterInfo = this.add.text(0, -panelHeight / 2 + 85,
      `${result.chapterName}  |  扫荡 ${result.sweepCount} 次`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5)

    let contentY = -panelHeight / 2 + 130

    if (result.success && result.totalRewards.length > 0) {
      const rewardTitle = this.add.text(0, contentY, '累计获得奖励：', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '18px',
        color: '#ffcc80',
        fontStyle: 'bold'
      }).setOrigin(0.5)
      dialog.add(rewardTitle)
      contentY += 35

      result.totalRewards.forEach((reward, idx) => {
        const rewardLabel = this.chapterManager.getRewardLabel(reward)
        const rewardText = this.add.text(0, contentY + idx * 35, rewardLabel, {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '18px',
          color: '#81c784'
        }).setOrigin(0.5)
        dialog.add(rewardText)
      })
      contentY += rewardCount * 35
    }

    if (result.leveledUp) {
      const levelUpText = this.add.text(0, contentY + 10,
        `🎊 等级提升！共提升 ${result.levelsGained} 级`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#ffd54f',
        fontStyle: 'bold',
        stroke: '#5d4037',
        strokeThickness: 2
      }).setOrigin(0.5)
      dialog.add(levelUpText)
      contentY += 50
    }

    const playerInfo = this.add.text(0, contentY + 10,
      `当前等级: Lv.${this.save.player.level}  |  经验: ${this.save.player.exp}/${this.save.player.expToNext}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#b0bec5'
    }).setOrigin(0.5)
    dialog.add(playerInfo)

    const confirmBtn = this.add.container(0, panelHeight / 2 - 40)
    const cbw = 140
    const cbh = 44
    const confirmBg = this.add.graphics()
    confirmBg.fillStyle(0x000000, 0.7)
    confirmBg.lineStyle(2, 0x4fc3f7, 0.95)
    this.roundedRect(confirmBg, -cbw / 2, -cbh / 2, cbw, cbh, 10)
    const confirmText = this.add.text(0, 0, '确定', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    confirmBtn.add([confirmBg, confirmText])
    confirmBtn.setSize(cbw, cbh)
    confirmBtn.setInteractive({ useHandCursor: true })

    confirmBtn.on('pointerover', () => {
      this.tweens.add({ targets: confirmBtn, scale: 1.08, duration: 150 })
      confirmBg.clear()
      confirmBg.fillStyle(0x4fc3f7, 0.35)
      confirmBg.lineStyle(3, 0x4fc3f7, 1)
      this.roundedRect(confirmBg, -cbw / 2, -cbh / 2, cbw, cbh, 10)
    })
    confirmBtn.on('pointerout', () => {
      this.tweens.add({ targets: confirmBtn, scale: 1, duration: 150 })
      confirmBg.clear()
      confirmBg.fillStyle(0x000000, 0.7)
      confirmBg.lineStyle(2, 0x4fc3f7, 0.95)
      this.roundedRect(confirmBg, -cbw / 2, -cbh / 2, cbw, cbh, 10)
    })
    confirmBtn.on('pointerdown', () => {
      this.hideSweepResult()
      this.scene.restart({ chapterId: this.currentChapter.id })
    })

    dialog.add([overlay, panel, title, chapterInfo, confirmBtn])
    dialog.setDepth(200)
    this.sweepResultDialog = dialog
  }

  private hideSweepResult(): void {
    if (this.sweepResultDialog) {
      this.sweepResultDialog.destroy()
      this.sweepResultDialog = null
    }
  }
}
