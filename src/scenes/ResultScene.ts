import Phaser from 'phaser'
import type { BattleResult, Player, EnemyDrop, ChapterReward } from '../types'
import { SaveManager } from '../managers/SaveManager'
import { ChapterManager } from '../managers/ChapterManager'
import { STAGES } from '../data/gameData'
import { AlchemyManager } from '../managers/AlchemyManager'
import { getHerbById } from '../data/alchemyData'

export class ResultScene extends Phaser.Scene {
  private saveManager = SaveManager.getInstance()
  private chapterManager = ChapterManager.getInstance()
  private result!: BattleResult
  private leveledUp!: boolean
  private levels!: number
  private player!: Player
  private chapterRewards: ChapterReward[] = []
  private fromChapterVictory = false
  private chapterId?: string
  private showChapterReviewAfter = false

  constructor() {
    super({ key: 'ResultScene' })
  }

  init(data: { result: BattleResult; leveledUp: boolean; levels: number; chapterRewards?: ChapterReward[]; fromChapterVictory?: boolean; chapterId?: string; showChapterReviewAfter?: boolean }): void {
    this.result = data.result
    this.leveledUp = data.leveledUp
    this.levels = data.levels
    this.chapterRewards = data.chapterRewards || []
    this.fromChapterVictory = data.fromChapterVictory || false
    this.chapterId = data.chapterId
    this.showChapterReviewAfter = data.showChapterReviewAfter || false
    const save = this.saveManager.loadGame()!
    this.player = save.player

    if (this.result.victory) {
      this.saveManager.applyBattleResultToSect(save, {
        victory: true,
        goldGained: this.result.goldGained,
        spiritGained: this.result.spiritGained
      })
    }
  }

  create(): void {
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor(0x0a0a15)

    if (this.result.victory) {
      this.createVictoryParticles(width, height)
    }

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.3)
    overlay.fillRect(0, 0, width, height)

    const hasHerbDrops = this.result.victory && this.result.herbDrops && this.result.herbDrops.length > 0
    const hasElementStats = this.result.victory && this.result.elementStats && (this.result.elementStats.advantageHits > 0 || this.result.elementStats.disadvantageHits > 0)
    const hasSpecialDrops = this.result.victory && this.result.specialDrops && this.result.specialDrops.length > 0
    const hasStats = this.result.victory && this.result.statistics && this.result.statistics.turnsElapsed > 0
    const hasPhaseTransitions = this.result.victory && this.result.statistics && this.result.statistics.phaseTransitions.length > 0
    const hasChapterRewards = this.result.victory && this.chapterRewards && this.chapterRewards.length > 0

    const panelWidth = 560
    let panelHeight = 480
    if (hasHerbDrops) panelHeight += 80
    if (hasElementStats) panelHeight += 60
    if (hasSpecialDrops) panelHeight += 80
    if (hasStats) panelHeight += 120
    if (hasPhaseTransitions) panelHeight += 60
    if (hasChapterRewards) panelHeight += 40 + this.chapterRewards.length * 35
    panelHeight = Math.min(panelHeight, height - 100)
    const panelX = width / 2
    const panelY = height / 2

    const stats = this.result.statistics
    const isBossBattle = stats && (stats.bossDefeated > 0 || stats.eliteDefeated > 0)
    const borderColor = this.result.victory
      ? (isBossBattle ? 0xff1744 : 0xffd54f)
      : 0xef5350

    const panel = this.add.graphics()
    panel.fillStyle(0x000000, 0.9)
    panel.lineStyle(3, borderColor, 0.95)
    this.roundedRect(panel, panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 20)

    const titleColor = this.result.victory ? (isBossBattle ? '#ff1744' : '#ffd54f') : '#ef5350'
    let titleText = this.result.victory ? '🎉 战斗胜利！' : '💀 战斗失败'
    if (this.result.victory && stats && stats.bossDefeated > 0) {
      titleText = '👑 首领讨伐成功！'
    } else if (this.result.victory && stats && stats.eliteDefeated > 0) {
      titleText = '⭐ 精英讨伐胜利！'
    }

    const title = this.add.text(panelX, panelY - panelHeight / 2 + 60, titleText, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '48px',
      color: titleColor,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    this.tweens.add({
      targets: title,
      scale: { from: 0.5, to: 1 },
      duration: 600,
      ease: 'Back.easeOut'
    })

    const stageText = this.add.text(panelX, panelY - panelHeight / 2 + 110,
      `第 ${this.result.stageId} 关：${STAGES[this.result.stageId - 1].name}`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '22px',
        color: '#b0bec5'
      }).setOrigin(0.5)

    if (this.result.victory) {
      this.createVictoryContent(panelX, panelY)
    } else {
      this.createDefeatContent(panelX, panelY)
    }

    this.createButtons(panelX, panelY + panelHeight / 2 - 60)
    this.cameras.main.fadeIn(500)
  }

  private createVictoryParticles(width: number, height: number): void {
    const colors = [0xffd54f, 0x4fc3f7, 0x81c784, 0xce93d8, 0xef5350]

    const particles = this.add.particles(0, 0, 'v-particle', {
      x: { min: 0, max: width },
      y: -20,
      lifespan: { min: 2000, max: 4000 },
      speedY: { min: 60, max: 150 },
      speedX: { min: -40, max: 40 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: colors,
      quantity: 5,
      frequency: 80,
      gravityY: 100
    })
  }

  private createVictoryContent(x: number, y: number): void {
    const hasHerbs = this.result.herbDrops && this.result.herbDrops.length > 0
    const rewardsStartY = y - 90

    const rewards = [
      { label: '✨ 经验', value: '+' + this.result.expGained, color: 0x4fc3f7 },
      { label: '💰 金币', value: '+' + this.result.goldGained, color: 0xffd54f },
      { label: '🌟 灵气', value: '+' + this.result.spiritGained, color: 0x81c784 }
    ]

    rewards.forEach((reward, index) => {
      const ry = rewardsStartY + index * 45
      const container = this.add.container(x, ry)

      const label = this.add.text(-150, 0, reward.label, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '22px',
        color: '#' + reward.color.toString(16).padStart(6, '0')
      }).setOrigin(0, 0.5)

      const value = this.add.text(150, 0, reward.value, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '26px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(1, 0.5)

      container.add([label, value])
      container.setAlpha(0)

      this.tweens.add({
        targets: container,
        alpha: 1,
        x: x,
        duration: 500,
        delay: 500 + index * 200,
        ease: 'Cubic.easeOut'
      })
    })

    let contentY = rewardsStartY + 3 * 45 + 15
    let delayBase = 1100

    if (this.result.statistics && this.result.statistics.phaseTransitions.length > 0) {
      const phaseY = contentY
      const phaseTitle = this.add.text(x, phaseY, '⚡ 首领阶段切换：', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#ff1744',
        fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0)
      this.tweens.add({
        targets: phaseTitle,
        alpha: 1,
        duration: 400,
        delay: delayBase
      })

      this.result.statistics.phaseTransitions.forEach((pt, idx) => {
        const ptText = this.add.text(x, phaseY + 26 + idx * 24,
          `→ 第${pt.phase}阶段：${pt.phaseName} — ${pt.message}`,
          {
            fontFamily: '"Microsoft YaHei", serif',
            fontSize: '15px',
            color: '#' + pt.color.toString(16).padStart(6, '0')
          }).setOrigin(0.5).setAlpha(0)
        this.tweens.add({
          targets: ptText,
          alpha: 1,
          duration: 400,
          delay: delayBase + 100 + idx * 120
        })
      })

      contentY = phaseY + 26 + this.result.statistics.phaseTransitions.length * 24 + 12
      delayBase += 200
    }

    if (this.result.elementStats && (this.result.elementStats.advantageHits > 0 || this.result.elementStats.disadvantageHits > 0)) {
      const es = this.result.elementStats
      const elementY = contentY
      const elementTitle = this.add.text(x, elementY, '☯ 五行克制统计：', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#ffd54f',
        fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0)
      this.tweens.add({
        targets: elementTitle,
        alpha: 1,
        duration: 400,
        delay: delayBase
      })

      const elementDetail = this.add.text(x, elementY + 28,
        `⚡克制 ${es.advantageHits}次  |  🔻被克 ${es.disadvantageHits}次  |  加成伤害 +${es.totalElementBonusDamage}`,
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '17px',
          color: '#b0bec5'
        }).setOrigin(0.5).setAlpha(0)
      this.tweens.add({
        targets: elementDetail,
        alpha: 1,
        duration: 400,
        delay: delayBase + 150
      })

      contentY = elementY + 60
      delayBase += 200
    }

    if (hasHerbs && this.result.herbDrops) {
      const herbTitle = this.add.text(x, contentY, '🌿 获得药材：', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#81c784',
        fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0)
      this.tweens.add({
        targets: herbTitle,
        alpha: 1,
        duration: 400,
        delay: delayBase
      })

      this.result.herbDrops.forEach((drop, idx) => {
        const herb = getHerbById(drop.herbId)
        if (!herb) return
        const dy = contentY + 30 + idx * 28
        const herbText = this.add.text(x, dy,
          `${herb.icon} ${herb.name}  x${drop.amount}`,
          {
            fontFamily: '"Microsoft YaHei", serif',
            fontSize: '18px',
            color: '#' + herb.color.toString(16).padStart(6, '0')
          }).setOrigin(0.5).setAlpha(0)
        this.tweens.add({
          targets: herbText,
          alpha: 1,
          duration: 400,
          delay: delayBase + 100 + idx * 150
        })
      })
      contentY = contentY + 30 + this.result.herbDrops.length * 28 + 15
      delayBase += 200
    }

    if (this.result.specialDrops && this.result.specialDrops.length > 0) {
      const dropTitle = this.add.text(x, contentY, '🎁 特殊掉落：', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#ce93d8',
        fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0)
      this.tweens.add({
        targets: dropTitle,
        alpha: 1,
        duration: 400,
        delay: delayBase
      })

      this.result.specialDrops.forEach((drop, idx) => {
        const dy = contentY + 26 + idx * 24
        const dropIcon = drop.icon || this.getDropIcon(drop.type)
        const dropName = drop.name || this.getDropTypeName(drop.type)
        const dropText = this.add.text(x, dy,
          `${dropIcon} ${dropName}  x${drop.amount}`,
          {
            fontFamily: '"Microsoft YaHei", serif',
            fontSize: '17px',
            color: '#' + drop.color.toString(16).padStart(6, '0')
          }).setOrigin(0.5).setAlpha(0)
        this.tweens.add({
          targets: dropText,
          alpha: 1,
          duration: 400,
          delay: delayBase + 100 + idx * 120
        })
      })
      contentY = contentY + 26 + this.result.specialDrops.length * 24 + 12
      delayBase += 200
    }

    if (this.result.statistics && this.result.statistics.turnsElapsed > 0) {
      const stats = this.result.statistics
      const statsY = contentY
      const statsTitle = this.add.text(x, statsY, '📊 战斗统计：', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '18px',
        color: '#4fc3f7',
        fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0)
      this.tweens.add({
        targets: statsTitle,
        alpha: 1,
        duration: 400,
        delay: delayBase
      })

      const statsItems = [
        `总伤害: ${stats.totalDamageDealt}`,
        `总承伤: ${stats.totalDamageTaken}`,
        `暴击: ${stats.critCount}次`,
        `回合: ${stats.turnsElapsed}`,
        `敌人: ${stats.enemiesDefeated}体`,
        `特殊技能: ${stats.specialSkillUses}次`
      ]
      if (stats.eliteDefeated > 0) statsItems.push(`⭐精英: ${stats.eliteDefeated}`)
      if (stats.bossDefeated > 0) statsItems.push(`👑首领: ${stats.bossDefeated}`)

      const statsLine1 = this.add.text(x, statsY + 24, statsItems.slice(0, 3).join('  |  '), {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '15px',
        color: '#b0bec5'
      }).setOrigin(0.5).setAlpha(0)
      this.tweens.add({
        targets: statsLine1,
        alpha: 1,
        duration: 400,
        delay: delayBase + 100
      })

      const statsLine2 = this.add.text(x, statsY + 44, statsItems.slice(3, 6).join('  |  '), {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '15px',
        color: '#b0bec5'
      }).setOrigin(0.5).setAlpha(0)
      this.tweens.add({
        targets: statsLine2,
        alpha: 1,
        duration: 400,
        delay: delayBase + 200
      })

      if (statsItems.length > 6) {
        const statsLine3 = this.add.text(x, statsY + 64, statsItems.slice(6).join('  |  '), {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '15px',
          color: stats.bossDefeated > 0 ? '#ff1744' : '#ff9800'
        }).setOrigin(0.5).setAlpha(0)
        this.tweens.add({
          targets: statsLine3,
          alpha: 1,
          duration: 400,
          delay: delayBase + 300
        })
      }

      contentY = statsY + (statsItems.length > 6 ? 88 : 68)
      delayBase += 200
    }

    if (this.leveledUp) {
      const levelUpY = contentY
      const levelUpText = this.add.text(x, levelUpY,
        `🎊 等级提升！Lv.${this.player.level - this.levels} → Lv.${this.player.level}`,
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '26px',
          color: '#ffd54f',
          fontStyle: 'bold',
          stroke: '#5d4037',
          strokeThickness: 2
        }).setOrigin(0.5).setAlpha(0)

      this.tweens.add({
        targets: levelUpText,
        alpha: 1,
        scale: { from: 0.8, to: 1 },
        duration: 600,
        delay: delayBase,
        ease: 'Back.easeOut'
      })

      this.tweens.add({
        targets: levelUpText,
        scale: 1.05,
        duration: 800,
        delay: delayBase + 600,
        yoyo: true,
        repeat: -1
      })
      contentY = levelUpY + 40
    }

    let hasChapterRewards = this.chapterRewards && this.chapterRewards.length > 0
    let chapterRewardsY = contentY + 10

    if (hasChapterRewards) {
      const chapterRewardTitle = this.add.text(x, chapterRewardsY, '📜 章节奖励：', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#ff9800',
        fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0)
      this.tweens.add({
        targets: chapterRewardTitle,
        alpha: 1,
        duration: 400,
        delay: delayBase + 400
      })

      this.chapterRewards.forEach((reward, idx) => {
        const ry = chapterRewardsY + 30 + idx * 30
        const rewardLabel = this.chapterManager.getRewardLabel(reward)
        const rewardText = this.add.text(x, ry, rewardLabel, {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '18px',
          color: '#ffcc80'
        }).setOrigin(0.5).setAlpha(0)
        this.tweens.add({
          targets: rewardText,
          alpha: 1,
          duration: 400,
          delay: delayBase + 500 + idx * 150
        })
      })
      chapterRewardsY = chapterRewardsY + 30 + this.chapterRewards.length * 30 + 15
      delayBase += 300
    }

    const currentInfo = this.add.text(x, hasChapterRewards ? chapterRewardsY : contentY + 10,
      `当前等级: Lv.${this.player.level}  |  经验: ${this.player.exp}/${this.player.expToNext}`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '18px',
        color: '#b0bec5'
      }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({
      targets: currentInfo,
      alpha: 1,
      duration: 500,
      delay: delayBase + 300
    })
  }

  private createDefeatContent(x: number, y: number): void {
    const messages = [
      '胜败乃兵家常事，切勿气馁。',
      '闭关修炼，方能更上一层楼。',
      '提升法宝与修为，再战不迟。'
    ]

    const tip = messages[Math.floor(Math.random() * messages.length)]
    const tipText = this.add.text(x, y - 50, tip, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#b0bec5',
      align: 'center'
    }).setOrigin(0.5)

    const recoverText = this.add.text(x, y + 10, '（生命值已恢复50%）', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#81c784'
    }).setOrigin(0.5)

    if (this.result.statistics && this.result.statistics.turnsElapsed > 0) {
      const stats = this.result.statistics
      const statsText = this.add.text(x, y + 55,
        `战斗统计: 回合${stats.turnsElapsed} | 伤害${stats.totalDamageDealt} | 承伤${stats.totalDamageTaken}`,
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '16px',
          color: '#78909c'
        }).setOrigin(0.5)
      statsText.setAlpha(0)
      this.tweens.add({
        targets: statsText,
        alpha: 1,
        duration: 500,
        delay: 800
      })
    }

    const advice = this.add.text(x, y + 100,
      '建议：前往【宗门经营】或【法宝养成】提升实力',
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#4fc3f7'
      }).setOrigin(0.5)

    ;[tipText, recoverText, advice].forEach((text, i) => {
      text.setAlpha(0)
      this.tweens.add({
        targets: text,
        alpha: 1,
        duration: 500,
        delay: 400 + i * 250
      })
    })
  }

  private getDropIcon(type: string): string {
    const icons: Record<string, string> = {
      gold: '💰',
      spirit: '✨',
      exp: '⭐',
      herb: '🌿',
      material: '💎'
    }
    return icons[type] || '🎁'
  }

  private getDropTypeName(type: string): string {
    const names: Record<string, string> = {
      gold: '金币',
      spirit: '灵气',
      exp: '经验',
      herb: '药材',
      material: '材料'
    }
    return names[type] || type
  }

  private createButtons(x: number, y: number): void {
    const spacing = 140
    let nextLabel = '下一关'
    if (this.showChapterReviewAfter) {
      nextLabel = '章节回顾'
    } else if (this.fromChapterVictory) {
      nextLabel = '返回地图'
    }
    
    const buttons = this.result.victory
      ? [
          { label: nextLabel, color: 0x4fc3f7, action: () => this.nextStage() },
          { label: '返回主菜单', color: 0x78909c, action: () => this.goToMenu() }
        ]
      : [
          { label: '法宝养成', color: 0x81c784, action: () => this.goToTreasure() },
          { label: '返回主菜单', color: 0x78909c, action: () => this.goToMenu() }
        ]

    buttons.forEach((btn, index) => {
      const bx = x - spacing / 2 + index * spacing
      const button = this.createGameButton(bx, y, btn.label, btn.color, btn.action)
      button.setAlpha(0)
      this.tweens.add({
        targets: button,
        alpha: 1,
        y: y,
        duration: 500,
        delay: 1000 + index * 150,
        ease: 'Back.easeOut'
      })
    })
  }

  private createGameButton(x: number, y: number, label: string, color: number, action: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const width = 130
    const height = 50

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.75)
    bg.lineStyle(2, color, 1)
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
      this.tweens.add({ targets: container, scale: 1.08, duration: 150 })
      bg.clear()
      bg.fillStyle(color, 0.35)
      bg.lineStyle(3, color, 1)
      this.roundedRect(bg, -width / 2, -height / 2, width, height, 10)
    })

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 150 })
      bg.clear()
      bg.fillStyle(0x000000, 0.75)
      bg.lineStyle(2, color, 1)
      this.roundedRect(bg, -width / 2, -height / 2, width, height, 10)
    })

    container.on('pointerdown', action)

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

  private nextStage(): void {
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      if (this.showChapterReviewAfter && this.chapterId) {
        this.scene.start('ChapterReviewScene', { chapterId: this.chapterId })
      } else if (this.fromChapterVictory && this.chapterId) {
        this.scene.start('ChapterMapScene', { chapterId: this.chapterId })
      } else {
        const nextStageId = Math.min(this.result.stageId + 1, STAGES.length)
        this.scene.start('BattleScene', { stageId: nextStageId })
      }
    })
  }

  private goToMenu(): void {
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      this.scene.start('MenuScene')
    })
  }

  private goToTreasure(): void {
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      this.scene.start('TreasureScene')
    })
  }
}
