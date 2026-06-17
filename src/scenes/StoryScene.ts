import Phaser from 'phaser'
import type { GameSave, StoryDialogue, ChapterReward, BattleResult } from '../types'
import { SaveManager } from '../managers/SaveManager'
import { ChapterManager } from '../managers/ChapterManager'
import { getChapterById, getDialogueNodeById } from '../data/chapterData'

export class StoryScene extends Phaser.Scene {
  private save!: GameSave
  private saveManager: SaveManager
  private chapterManager: ChapterManager
  
  private chapterId!: string
  private levelId!: string | null
  private dialogues: StoryDialogue[] = []
  private currentDialogueIndex = 0
  private isLevelStory = false
  private isOpeningStory = false
  private isClosingStory = false
  private isVictoryStory = false
  private victoryDialogueNodeId?: string
  private battleResult?: BattleResult
  private chapterRewards?: ChapterReward[]
  private leveledUp = false
  private levelsGained = 0
  
  private dialoguePanel!: Phaser.GameObjects.Graphics
  private speakerName!: Phaser.GameObjects.Text
  private dialogueText!: Phaser.GameObjects.Text
  private avatarSprite!: Phaser.GameObjects.Text
  private continueIndicator!: Phaser.GameObjects.Text
  private skipButton!: Phaser.GameObjects.Container
  private autoButton!: Phaser.GameObjects.Container
  
  private isTyping = false
  private currentText = ''
  private targetText = ''
  private typingTimer!: Phaser.Time.TimerEvent
  private isAutoPlay = false
  private autoPlayTimer!: Phaser.Time.TimerEvent
  
  private typewriterSpeed = 40
  private autoPlayDelay = 2500

  constructor() {
    super({ key: 'StoryScene' })
    this.saveManager = SaveManager.getInstance()
    this.chapterManager = ChapterManager.getInstance()
  }

  init(data: {
    chapterId: string
    levelId?: string
    dialogues?: StoryDialogue[]
    isLevelStory?: boolean
    isOpeningStory?: boolean
    isClosingStory?: boolean
    isVictoryStory?: boolean
    victoryDialogueNodeId?: string
    battleResult?: BattleResult
    chapterRewards?: ChapterReward[]
    leveledUp?: boolean
    levels?: number
  }): void {
    const existingSave = this.saveManager.loadGame()
    this.save = existingSave || this.saveManager.createNewSave()
    this.chapterManager.initializeChapterProgress(this.save)
    
    this.chapterId = data.chapterId
    this.levelId = data.levelId || null
    this.isLevelStory = data.isLevelStory || false
    this.isOpeningStory = data.isOpeningStory || false
    this.isClosingStory = data.isClosingStory || false
    this.isVictoryStory = data.isVictoryStory || false
    this.victoryDialogueNodeId = data.victoryDialogueNodeId
    this.battleResult = data.battleResult
    this.chapterRewards = data.chapterRewards
    this.leveledUp = data.leveledUp || false
    this.levelsGained = data.levels || 0
    
    const chapter = getChapterById(this.chapterId)
    
    if (data.dialogues && data.dialogues.length > 0) {
      this.dialogues = data.dialogues
    } else if (this.isVictoryStory && this.victoryDialogueNodeId) {
      const node = getDialogueNodeById(this.chapterId, this.victoryDialogueNodeId)
      if (node) {
        this.dialogues = node.dialogues
      }
    } else if (this.isOpeningStory && chapter) {
      this.dialogues = chapter.openingStory
    } else if (this.isClosingStory && chapter) {
      this.dialogues = chapter.closingStory
    }
    
    this.currentDialogueIndex = 0
  }

  create(): void {
    const { width, height } = this.scale
    
    const chapter = getChapterById(this.chapterId)
    if (chapter) {
      this.cameras.main.setBackgroundColor(chapter.backgroundColor)
    } else {
      this.cameras.main.setBackgroundColor(0x0a0a15)
    }
    
    this.createBackground(width, height)
    this.createDialoguePanel(width, height)
    this.createControlButtons(width, height)
    
    this.cameras.main.fadeIn(500, 0, 0, 0)
    
    this.showCurrentDialogue()
  }

  private createBackground(width: number, height: number): void {
    const chapter = getChapterById(this.chapterId)
    const color = chapter?.color || 0x4fc3f7
    
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * width
      const y = Math.random() * height * 0.6
      const size = Math.random() * 3 + 1
      const alpha = Math.random() * 0.7 + 0.2
      const star = this.add.circle(x, y, size, 0xffffff, alpha)
      
      this.tweens.add({
        targets: star,
        alpha: { from: alpha * 0.5, to: alpha },
        duration: 2000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 1000
      })
    }
    
    const nebula = this.add.graphics()
    nebula.fillStyle(color, 0.08)
    nebula.fillCircle(width * 0.2, height * 0.3, 250)
    nebula.fillStyle(color, 0.05)
    nebula.fillCircle(width * 0.8, height * 0.25, 200)
    
    const mountains = this.add.graphics()
    mountains.fillStyle(0x000000, 0.4)
    mountains.beginPath()
    mountains.moveTo(0, height * 0.55)
    for (let x = 0; x <= width; x += 30) {
      const seed = (x + this.chapterId.length * 100) * 0.01
      mountains.lineTo(x, height * 0.55 - Math.sin(seed) * 50 - Math.random() * 20)
    }
    mountains.lineTo(width, height * 0.6)
    mountains.lineTo(0, height * 0.6)
    mountains.closePath()
    mountains.fillPath()
    
    const gradient = this.add.graphics()
    const gradientRect = new Phaser.Geom.Rectangle(0, 0, width, height)
    const grd = gradient.generateTexture('story_gradient', width, height)
    
    for (let y = 0; y < height; y++) {
      const alpha = Math.max(0, Math.min(1, (y - height * 0.4) / (height * 0.3)))
      gradient.fillStyle(0x000000, alpha * 0.3)
      gradient.fillRect(0, y, width, 1)
    }
  }

  private createDialoguePanel(width: number, height: number): void {
    const panelY = height - 220
    const panelHeight = 180
    const panelPadding = 30
    
    this.dialoguePanel = this.add.graphics()
    this.dialoguePanel.fillStyle(0x0a0a15, 0.9)
    this.dialoguePanel.lineStyle(3, 0xffd54f, 0.8)
    this.roundedRect(this.dialoguePanel, panelPadding, panelY, width - panelPadding * 2, panelHeight, 16)
    
    const chapter = getChapterById(this.chapterId)
    const chapterColor = chapter?.color || 0x4fc3f7
    
    const accentLine = this.add.graphics()
    accentLine.fillStyle(chapterColor, 0.8)
    accentLine.fillRect(panelPadding, panelY, width - panelPadding * 2, 4)
    
    const avatarBg = this.add.graphics()
    avatarBg.fillStyle(0x1a1a2e, 1)
    avatarBg.lineStyle(2, chapterColor, 1)
    avatarBg.strokeCircle(panelPadding + 70, panelY + 70, 55)
    avatarBg.fillCircle(panelPadding + 70, panelY + 70, 55)
    
    this.avatarSprite = this.add.text(panelPadding + 70, panelY + 70, '', {
      fontSize: '48px'
    }).setOrigin(0.5)
    
    this.speakerName = this.add.text(panelPadding + 150, panelY + 25, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5)
    
    const nameUnderline = this.add.graphics()
    nameUnderline.fillStyle(chapterColor, 0.6)
    nameUnderline.fillRect(panelPadding + 150, panelY + 45, 120, 2)
    
    this.dialogueText = this.add.text(panelPadding + 150, panelY + 70, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffffff',
      lineSpacing: 8,
      wordWrap: { width: width - panelPadding * 2 - 180 }
    }).setOrigin(0, 0)
    
    this.continueIndicator = this.add.text(width - panelPadding - 30, panelY + panelHeight - 25, '▼ 点击继续', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#aaaaaa'
    }).setOrigin(1, 0.5)
    this.continueIndicator.setAlpha(0)
    
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > panelY && pointer.y < panelY + panelHeight) {
        this.handleContinue()
      }
    })
    
    this.input.keyboard?.on('keydown-SPACE', () => this.handleContinue())
    this.input.keyboard?.on('keydown-ENTER', () => this.handleContinue())
  }

  private createControlButtons(width: number, height: number): void {
    this.skipButton = this.add.container(width - 120, 50)
    const skipBg = this.add.graphics()
    skipBg.fillStyle(0x000000, 0.6)
    skipBg.lineStyle(2, 0xef5350, 0.8)
    this.roundedRect(skipBg, -50, -20, 100, 40, 10)
    const skipText = this.add.text(0, 0, '⏭ 跳过', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#ef5350'
    }).setOrigin(0.5)
    this.skipButton.add([skipBg, skipText])
    this.skipButton.setSize(100, 40)
    this.skipButton.setInteractive({ useHandCursor: true })
    this.skipButton.on('pointerover', () => this.tweens.add({ targets: this.skipButton, scale: 1.08, duration: 150 }))
    this.skipButton.on('pointerout', () => this.tweens.add({ targets: this.skipButton, scale: 1, duration: 150 }))
    this.skipButton.on('pointerdown', () => this.skipStory())
    
    this.autoButton = this.add.container(width - 240, 50)
    const autoBg = this.add.graphics()
    autoBg.fillStyle(0x000000, 0.6)
    autoBg.lineStyle(2, 0x4fc3f7, 0.8)
    this.roundedRect(autoBg, -50, -20, 100, 40, 10)
    const autoText = this.add.text(0, 0, '▶ 自动', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#4fc3f7'
    }).setOrigin(0.5)
    this.autoButton.add([autoBg, autoText])
    this.autoButton.setSize(100, 40)
    this.autoButton.setInteractive({ useHandCursor: true })
    this.autoButton.on('pointerover', () => this.tweens.add({ targets: this.autoButton, scale: 1.08, duration: 150 }))
    this.autoButton.on('pointerout', () => this.tweens.add({ targets: this.autoButton, scale: 1, duration: 150 }))
    this.autoButton.on('pointerdown', () => this.toggleAutoPlay())
    
    const backButton = this.add.container(80, 50)
    const backBg = this.add.graphics()
    backBg.fillStyle(0x000000, 0.6)
    backBg.lineStyle(2, 0x78909c, 0.8)
    this.roundedRect(backBg, -60, -20, 120, 40, 10)
    const backText = this.add.text(0, 0, '◀ 返回', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5)
    backButton.add([backBg, backText])
    backButton.setSize(120, 40)
    backButton.setInteractive({ useHandCursor: true })
    backButton.on('pointerover', () => this.tweens.add({ targets: backButton, scale: 1.08, duration: 150 }))
    backButton.on('pointerout', () => this.tweens.add({ targets: backButton, scale: 1, duration: 150 }))
    backButton.on('pointerdown', () => this.returnToMap())
  }

  private showCurrentDialogue(): void {
    if (this.currentDialogueIndex >= this.dialogues.length) {
      this.onStoryComplete()
      return
    }
    
    const dialogue = this.dialogues[this.currentDialogueIndex]
    
    this.speakerName.setText(dialogue.speaker)
    this.speakerName.setColor('#' + dialogue.color.toString(16).padStart(6, '0'))
    
    if (dialogue.avatar) {
      this.avatarSprite.setText(dialogue.avatar)
      this.avatarSprite.setAlpha(1)
    } else {
      this.avatarSprite.setText('')
      this.avatarSprite.setAlpha(0)
    }
    
    this.targetText = dialogue.text
    this.currentText = ''
    this.isTyping = true
    this.continueIndicator.setAlpha(0)
    
    if (this.typingTimer) {
      this.typingTimer.remove()
    }
    
    let charIndex = 0
    this.typingTimer = this.time.addEvent({
      delay: this.typewriterSpeed,
      loop: true,
      callback: () => {
        if (charIndex < this.targetText.length) {
          this.currentText += this.targetText[charIndex]
          this.dialogueText.setText(this.currentText)
          charIndex++
          
          if (charIndex % 3 === 0) {
            this.sound.play('typewriter', { volume: 0.1 })
          }
        } else {
          this.typingTimer.remove()
          this.isTyping = false
          this.showContinueIndicator()
          
          if (this.isAutoPlay) {
            this.scheduleAutoContinue()
          }
        }
      }
    })
  }

  private showContinueIndicator(): void {
    this.tweens.add({
      targets: this.continueIndicator,
      alpha: { from: 0, to: 1 },
      y: '-=5',
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  private handleContinue(): void {
    if (this.isTyping) {
      this.skipTyping()
    } else {
      this.nextDialogue()
    }
  }

  private skipTyping(): void {
    if (this.typingTimer) {
      this.typingTimer.remove()
    }
    this.currentText = this.targetText
    this.dialogueText.setText(this.currentText)
    this.isTyping = false
    this.showContinueIndicator()
    
    if (this.isAutoPlay) {
      this.scheduleAutoContinue()
    }
  }

  private nextDialogue(): void {
    if (this.autoPlayTimer) {
      this.autoPlayTimer.remove()
    }
    
    this.tweens.add({
      targets: [this.speakerName, this.dialogueText, this.avatarSprite],
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.currentDialogueIndex++
        this.tweens.add({
          targets: [this.speakerName, this.dialogueText, this.avatarSprite],
          alpha: 1,
          duration: 200,
          onComplete: () => {
            this.showCurrentDialogue()
          }
        })
      }
    })
  }

  private toggleAutoPlay(): void {
    this.isAutoPlay = !this.isAutoPlay
    
    const autoText = this.autoButton.getAt(1) as Phaser.GameObjects.Text
    const autoBg = this.autoButton.getAt(0) as Phaser.GameObjects.Graphics
    
    if (this.isAutoPlay) {
      autoText.setText('⏸ 暂停')
      autoText.setColor('#ffd54f')
      autoBg.clear()
      autoBg.fillStyle(0x000000, 0.8)
      autoBg.lineStyle(2, 0xffd54f, 1)
      this.roundedRect(autoBg, -50, -20, 100, 40, 10)
      
      if (!this.isTyping) {
        this.scheduleAutoContinue()
      }
    } else {
      autoText.setText('▶ 自动')
      autoText.setColor('#4fc3f7')
      autoBg.clear()
      autoBg.fillStyle(0x000000, 0.6)
      autoBg.lineStyle(2, 0x4fc3f7, 0.8)
      this.roundedRect(autoBg, -50, -20, 100, 40, 10)
      
      if (this.autoPlayTimer) {
        this.autoPlayTimer.remove()
      }
    }
  }

  private scheduleAutoContinue(): void {
    if (this.autoPlayTimer) {
      this.autoPlayTimer.remove()
    }
    
    this.autoPlayTimer = this.time.delayedCall(this.autoPlayDelay, () => {
      if (this.isAutoPlay && !this.isTyping) {
        this.nextDialogue()
      }
    })
  }

  private skipStory(): void {
    if (this.typingTimer) {
      this.typingTimer.remove()
    }
    if (this.autoPlayTimer) {
      this.autoPlayTimer.remove()
    }
    
    this.currentDialogueIndex = this.dialogues.length
    this.onStoryComplete()
  }

  private onStoryComplete(): void {
    this.cameras.main.fadeOut(500, 0, 0, 0)
    
    this.time.delayedCall(500, () => {
      let rewards: ChapterReward[] = []
      
      if (this.isVictoryStory && this.victoryDialogueNodeId) {
        const node = getDialogueNodeById(this.chapterId, this.victoryDialogueNodeId)
        if (node) {
          this.chapterManager.markDialogueNodeTriggered(this.save, this.victoryDialogueNodeId)
          rewards = this.chapterManager.applyDialogueNodeRewards(this.save, node)
        }
        
        const chapter = getChapterById(this.chapterId)
        const shouldShowClosingStory = this.chapterManager.shouldShowClosingStory(this.save, this.chapterId)
        const shouldShowReview = this.chapterManager.isChapterCompleted(this.save, this.chapterId)
        
        const allRewards = [...(this.chapterRewards || []), ...rewards]
        
        if (shouldShowClosingStory) {
          this.scene.start('StoryScene', {
            chapterId: this.chapterId,
            isClosingStory: true
          })
        } else if (shouldShowReview) {
          this.scene.start('ChapterReviewScene', {
            chapterId: this.chapterId
          })
        } else if (this.battleResult) {
          this.scene.start('ResultScene', {
            result: this.battleResult,
            chapterRewards: allRewards,
            leveledUp: this.leveledUp,
            levels: this.levelsGained,
            fromChapterVictory: true,
            chapterId: this.chapterId
          })
        } else {
          if (allRewards.length > 0) {
            this.showRewardPopup(allRewards)
          } else {
            this.returnToMap()
          }
        }
        return
      }
      
      if (this.isLevelStory && this.levelId) {
        rewards = this.chapterManager.completeLevel(this.save, this.chapterId, this.levelId)
      }
      
      if (this.isOpeningStory) {
        this.chapterManager.startChapter(this.save, this.chapterId)
        this.saveManager.saveGame(this.save)
      }
      
      if (this.isClosingStory) {
        const chapterRewards = this.chapterManager.completeChapter(this.save, this.chapterId)
        const reviewData = this.chapterManager.createChapterReviewData(this.save, this.chapterId, chapterRewards)
        if (reviewData) {
          this.scene.start('ChapterReviewScene', { chapterId: this.chapterId, reviewData })
          return
        }
      }
      
      if (rewards.length > 0) {
        this.showRewardPopup(rewards)
      } else {
        this.returnToMap()
      }
    })
  }

  private showRewardPopup(rewards: ChapterReward[]): void {
    const { width, height } = this.scale
    
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.8)
    overlay.fillRect(0, 0, width, height)
    
    const panelWidth = 400
    const panelHeight = 200 + rewards.length * 40
    
    const panel = this.add.graphics()
    panel.fillStyle(0x1a1a2e, 0.98)
    panel.lineStyle(3, 0xffd54f, 1)
    this.roundedRect(panel, width / 2 - panelWidth / 2, height / 2 - panelHeight / 2, panelWidth, panelHeight, 16)
    
    const title = this.add.text(width / 2, height / 2 - panelHeight / 2 + 35, '🎉 获得奖励', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    
    rewards.forEach((reward, index) => {
      const y = height / 2 - panelHeight / 2 + 80 + index * 40
      const rewardText = this.add.text(width / 2, y, this.chapterManager.getRewardLabel(reward), {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#81c784'
      }).setOrigin(0.5)
      
      rewardText.setAlpha(0)
      rewardText.setScale(0.5)
      
      this.tweens.add({
        targets: rewardText,
        alpha: 1,
        scale: 1,
        duration: 400,
        delay: 300 + index * 200,
        ease: 'Back.easeOut'
      })
    })
    
    const continueBtn = this.add.container(width / 2, height / 2 + panelHeight / 2 - 40)
    const btnBg = this.add.graphics()
    btnBg.fillStyle(0x000000, 0.6)
    btnBg.lineStyle(2, 0x4fc3f7, 1)
    this.roundedRect(btnBg, -80, -22, 160, 44, 10)
    const btnText = this.add.text(0, 0, '继续', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#4fc3f7'
    }).setOrigin(0.5)
    continueBtn.add([btnBg, btnText])
    continueBtn.setSize(160, 44)
    continueBtn.setInteractive({ useHandCursor: true })
    continueBtn.on('pointerover', () => this.tweens.add({ targets: continueBtn, scale: 1.08, duration: 150 }))
    continueBtn.on('pointerout', () => this.tweens.add({ targets: continueBtn, scale: 1, duration: 150 }))
    continueBtn.on('pointerdown', () => this.returnToMap())
    
    continueBtn.setAlpha(0)
    this.tweens.add({
      targets: continueBtn,
      alpha: 1,
      duration: 400,
      delay: 300 + rewards.length * 200
    })
  }

  private returnToMap(): void {
    this.cameras.main.fadeOut(300, 0, 0, 0)
    this.time.delayedCall(300, () => {
      this.scene.start('ChapterMapScene', { chapterId: this.chapterId })
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
