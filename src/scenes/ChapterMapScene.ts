import Phaser from 'phaser'
import type { GameSave, Chapter, ChapterLevel, ChapterReward } from '../types'
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

    const label = this.add.text(0, size / 2 + 20, level.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: level.isUnlocked ? '#ffffff' : '#666666',
      align: 'center'
    }).setOrigin(0.5, 0)
    container.add(label)

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

    const btn = this.add.container(width - 80, height - 40)
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
