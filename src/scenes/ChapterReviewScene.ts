import Phaser from 'phaser'
import type { GameSave, ChapterReviewData, ChapterReward } from '../types'
import { SaveManager } from '../managers/SaveManager'
import { ChapterManager } from '../managers/ChapterManager'
import { getChapterById, getNextChapter } from '../data/chapterData'

export class ChapterReviewScene extends Phaser.Scene {
  private save!: GameSave
  private saveManager: SaveManager
  private chapterManager: ChapterManager
  private chapterId!: string
  private reviewData!: ChapterReviewData
  private chapter!: ReturnType<typeof getChapterById>

  constructor() {
    super({ key: 'ChapterReviewScene' })
    this.saveManager = SaveManager.getInstance()
    this.chapterManager = ChapterManager.getInstance()
  }

  init(data: { chapterId: string; reviewData?: ChapterReviewData }): void {
    const existingSave = this.saveManager.loadGame()
    this.save = existingSave || this.saveManager.createNewSave()
    this.chapterManager.initializeChapterProgress(this.save)
    
    this.chapterId = data.chapterId
    this.chapter = getChapterById(this.chapterId)
    
    if (data.reviewData) {
      this.reviewData = data.reviewData
    } else {
      const createdData = this.chapterManager.createChapterReviewData(this.save, this.chapterId)
      if (createdData) {
        this.reviewData = createdData
      } else {
        this.reviewData = {
          chapterId: this.chapterId,
          chapterName: this.chapter?.name || '',
          completedAt: Date.now(),
          totalTime: 0,
          levelsCompleted: 0,
          totalLevels: 0,
          rewards: [],
          battleStats: {
            totalDamage: 0,
            totalHealing: 0,
            enemiesDefeated: 0,
            deaths: 0
          }
        }
      }
    }
  }

  create(): void {
    const { width, height } = this.scale
    
    const chapter = getChapterById(this.chapterId)
    if (chapter) {
      this.cameras.main.setBackgroundColor(chapter.backgroundColor)
    } else {
      this.cameras.main.setBackgroundColor(0x0a0a15)
    }
    
    this.createCelebrationBackground(width, height)
    this.createReviewPanel(width, height)
    this.createActionButtons(width, height)
    
    this.cameras.main.fadeIn(800, 0, 0, 0)
  }

  private createCelebrationBackground(width: number, height: number): void {
    const chapter = getChapterById(this.chapterId)
    const color = chapter?.color || 0xffd54f
    
    const stars = this.add.graphics()
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const size = Math.random() * 3 + 1
      const alpha = Math.random() * 0.8 + 0.3
      const starColor = i % 3 === 0 ? color : 0xffffff
      stars.fillStyle(starColor, alpha)
      stars.fillCircle(x, y, size)
    }
    
    this.tweens.add({
      targets: stars,
      alpha: { from: 0.5, to: 1 },
      duration: 2000,
      yoyo: true,
      repeat: -1
    })
    
    const nebula = this.add.graphics()
    nebula.fillStyle(color, 0.12)
    nebula.fillCircle(width * 0.3, height * 0.4, 350)
    nebula.fillStyle(color, 0.08)
    nebula.fillCircle(width * 0.7, height * 0.6, 300)
    
    for (let i = 0; i < 20; i++) {
      this.time.delayedCall(i * 300, () => {
        this.createFirework(width, height, color)
      })
    }
    
    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        this.createFirework(width, height, color)
      }
    })
  }

  private createFirework(width: number, height: number, color: number): void {
    const x = Math.random() * width * 0.6 + width * 0.2
    const y = Math.random() * height * 0.4 + height * 0.1
    
    const colors = [color, 0xffd54f, 0xff7043, 0x4fc3f7, 0x81c784, 0xba68c8]
    const fireworkColor = colors[Math.floor(Math.random() * colors.length)]
    
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16
      const particle = this.add.circle(x, y, 4, fireworkColor, 1)
      
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 100,
        y: y + Math.sin(angle) * 100,
        alpha: 0,
        scale: 0,
        duration: 800,
        ease: 'Power2.Out',
        onComplete: () => particle.destroy()
      })
    }
  }

  private createReviewPanel(width: number, height: number): void {
    const panelWidth = 600
    const panelHeight = 520
    const panelX = width / 2
    const panelY = height / 2 - 20
    
    const chapter = getChapterById(this.chapterId)
    const color = chapter?.color || 0xffd54f
    
    const glow = this.add.graphics()
    glow.fillStyle(color, 0.1)
    glow.fillCircle(panelX, panelY, 350)
    
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.5, to: 1 },
      scale: { from: 0.95, to: 1.05 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    const panel = this.add.graphics()
    panel.fillStyle(0x0a0a15, 0.95)
    panel.lineStyle(4, color, 1)
    this.roundedRect(panel, panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 20)
    
    const crown = this.add.text(panelX, panelY - panelHeight / 2 + 50, '👑', {
      fontSize: '64px'
    }).setOrigin(0.5)
    
    this.tweens.add({
      targets: crown,
      scale: { from: 0.8, to: 1.2 },
      angle: { from: -5, to: 5 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    const title = this.add.text(panelX, panelY - panelHeight / 2 + 110, '🎉 章节完成！', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '36px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    
    const chapterName = this.add.text(panelX, panelY - panelHeight / 2 + 155, this.reviewData.chapterName, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '24px',
      color: '#' + color.toString(16).padStart(6, '0')
    }).setOrigin(0.5)
    
    const divider = this.add.graphics()
    divider.fillStyle(color, 0.6)
    divider.fillRect(panelX - 200, panelY - panelHeight / 2 + 185, 400, 2)
    
    const statsY = panelY - 50
    const stats = [
      { label: '关卡进度', value: `${this.reviewData.levelsCompleted}/${this.reviewData.totalLevels}`, icon: '📊' },
      { label: '击败敌人', value: `${this.reviewData.battleStats.enemiesDefeated}`, icon: '⚔' },
      { label: '造成伤害', value: `${this.reviewData.battleStats.totalDamage}`, icon: '💥' },
      { label: '恢复生命', value: `${this.reviewData.battleStats.totalHealing}`, icon: '💚' }
    ]
    
    stats.forEach((stat, index) => {
      const x = panelX - 180 + (index % 2) * 200
      const y = statsY + Math.floor(index / 2) * 60
      
      const icon = this.add.text(x, y, stat.icon, {
        fontSize: '28px'
      }).setOrigin(0, 0.5)
      
      const label = this.add.text(x + 40, y - 12, stat.label, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '14px',
        color: '#aaaaaa'
      }).setOrigin(0, 0)
      
      const value = this.add.text(x + 40, y + 10, stat.value, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0, 0)
      
      ;[icon, label, value].forEach((el, i) => {
        el.setAlpha(0)
        el.setScale(0.8)
        this.tweens.add({
          targets: el,
          alpha: 1,
          scale: 1,
          duration: 400,
          delay: 500 + index * 100 + i * 50,
          ease: 'Back.easeOut'
        })
      })
    })
    
    const rewardsTitle = this.add.text(panelX, panelY + 80, '🎁 章节奖励', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    
    rewardsTitle.setAlpha(0)
    this.tweens.add({
      targets: rewardsTitle,
      alpha: 1,
      duration: 400,
      delay: 1000
    })
    
    const rewards = this.reviewData.rewards
    rewards.forEach((reward, index) => {
      const x = panelX - (rewards.length - 1) * 80 + index * 160
      const y = panelY + 130
      
      this.createRewardItem(x, y, reward, color, 1200 + index * 150)
    })
    
    const completionTime = this.add.text(panelX, panelY + panelHeight / 2 - 35, `完成时间: ${new Date(this.reviewData.completedAt).toLocaleString('zh-CN')}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5)
    
    completionTime.setAlpha(0)
    this.tweens.add({
      targets: completionTime,
      alpha: 1,
      duration: 400,
      delay: 1500
    })
  }

  private createRewardItem(x: number, y: number, reward: ChapterReward, color: number, delay: number): void {
    const container = this.add.container(x, y)
    
    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a2e, 0.9)
    bg.lineStyle(2, color, 0.8)
    this.roundedRect(bg, -70, -40, 140, 80, 12)
    
    const rewardText = this.add.text(0, 0, this.chapterManager.getRewardLabel(reward), {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#81c784',
      align: 'center',
      wordWrap: { width: 120 }
    }).setOrigin(0.5)
    
    container.add([bg, rewardText])
    container.setSize(140, 80)
    
    container.setAlpha(0)
    container.setScale(0.5)
    
    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 500,
      delay,
      ease: 'Back.easeOut'
    })
    
    this.time.delayedCall(delay + 500, () => {
      this.tweens.add({
        targets: container,
        y: '-=10',
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    })
  }

  private createActionButtons(width: number, height: number): void {
    const buttonY = height - 60
    const chapter = getChapterById(this.chapterId)
    const color = chapter?.color || 0x4fc3f7
    
    const nextChapter = getNextChapter(this.chapterId)
    const hasNextChapter = nextChapter && this.chapterManager.isChapterUnlocked(this.save, nextChapter.id)
    
    const backBtn = this.add.container(120, buttonY)
    const backBg = this.add.graphics()
    backBg.fillStyle(0x000000, 0.6)
    backBg.lineStyle(2, 0x78909c, 0.8)
    this.roundedRect(backBg, -80, -25, 160, 50, 12)
    const backText = this.add.text(0, 0, '◀ 返回地图', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5)
    backBtn.add([backBg, backText])
    backBtn.setSize(160, 50)
    backBtn.setInteractive({ useHandCursor: true })
    backBtn.on('pointerover', () => this.tweens.add({ targets: backBtn, scale: 1.08, duration: 150 }))
    backBtn.on('pointerout', () => this.tweens.add({ targets: backBtn, scale: 1, duration: 150 }))
    backBtn.on('pointerdown', () => this.returnToMap())
    
    const menuBtn = this.add.container(width - 120, buttonY)
    const menuBg = this.add.graphics()
    menuBg.fillStyle(0x000000, 0.6)
    menuBg.lineStyle(2, 0x78909c, 0.8)
    this.roundedRect(menuBg, -80, -25, 160, 50, 12)
    const menuText = this.add.text(0, 0, '🏠 返回主菜单', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5)
    menuBtn.add([menuBg, menuText])
    menuBtn.setSize(160, 50)
    menuBtn.setInteractive({ useHandCursor: true })
    menuBtn.on('pointerover', () => this.tweens.add({ targets: menuBtn, scale: 1.08, duration: 150 }))
    menuBtn.on('pointerout', () => this.tweens.add({ targets: menuBtn, scale: 1, duration: 150 }))
    menuBtn.on('pointerdown', () => this.returnToMenu())
    
    if (hasNextChapter && nextChapter) {
      const nextBtn = this.add.container(width / 2, buttonY)
      const nextBg = this.add.graphics()
      nextBg.fillStyle(0x000000, 0.7)
      nextBg.lineStyle(3, color, 1)
      this.roundedRect(nextBg, -100, -30, 200, 60, 14)
      const nextText = this.add.text(0, 0, `▶ 进入下一章`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#' + color.toString(16).padStart(6, '0'),
        fontStyle: 'bold'
      }).setOrigin(0.5)
      nextBtn.add([nextBg, nextText])
      nextBtn.setSize(200, 60)
      nextBtn.setInteractive({ useHandCursor: true })
      nextBtn.on('pointerover', () => this.tweens.add({ targets: nextBtn, scale: 1.08, duration: 150 }))
      nextBtn.on('pointerout', () => this.tweens.add({ targets: nextBtn, scale: 1, duration: 150 }))
      nextBtn.on('pointerdown', () => this.goToNextChapter(nextChapter!.id))
      
      nextBtn.setAlpha(0)
      nextBtn.setScale(0.8)
      this.tweens.add({
        targets: nextBtn,
        alpha: 1,
        scale: 1,
        duration: 500,
        delay: 1500,
        ease: 'Back.easeOut'
      })
    }
    
    ;[backBtn, menuBtn].forEach((btn, index) => {
      btn.setAlpha(0)
      this.tweens.add({
        targets: btn,
        alpha: 1,
        duration: 400,
        delay: 1200 + index * 100
      })
    })
  }

  private returnToMap(): void {
    this.cameras.main.fadeOut(400, 0, 0, 0)
    this.time.delayedCall(400, () => {
      this.scene.start('ChapterMapScene', { chapterId: this.chapterId })
    })
  }

  private returnToMenu(): void {
    this.cameras.main.fadeOut(400, 0, 0, 0)
    this.time.delayedCall(400, () => {
      this.scene.start('MenuScene')
    })
  }

  private goToNextChapter(nextChapterId: string): void {
    this.cameras.main.fadeOut(500, 0, 0, 0)
    this.time.delayedCall(500, () => {
      const chapter = getChapterById(nextChapterId)
      if (chapter && this.chapterManager.shouldShowOpeningStory(this.save, nextChapterId)) {
        this.scene.start('StoryScene', {
          chapterId: nextChapterId,
          isOpeningStory: true
        })
      } else {
        this.scene.start('ChapterMapScene', { chapterId: nextChapterId })
      }
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
