import Phaser from 'phaser'
import type { BattleResult, Player } from '../types'
import { SaveManager } from '../managers/SaveManager'
import { STAGES } from '../data/gameData'
import { AlchemyManager } from '../managers/AlchemyManager'
import { getHerbById } from '../data/alchemyData'

export class ResultScene extends Phaser.Scene {
  private saveManager = SaveManager.getInstance()
  private result!: BattleResult
  private leveledUp!: boolean
  private levels!: number
  private player!: Player

  constructor() {
    super({ key: 'ResultScene' })
  }

  init(data: { result: BattleResult; leveledUp: boolean; levels: number }): void {
    this.result = data.result
    this.leveledUp = data.leveledUp
    this.levels = data.levels
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
    const panelWidth = 500
    const panelHeight = hasHerbDrops ? 560 : 480
    const panelX = width / 2
    const panelY = height / 2

    const panel = this.add.graphics()
    panel.fillStyle(0x000000, 0.9)
    panel.lineStyle(3, this.result.victory ? 0xffd54f : 0xef5350, 0.95)
    this.roundedRect(panel, panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 20)

    const titleColor = this.result.victory ? '#ffd54f' : '#ef5350'
    const titleText = this.result.victory ? '🎉 战斗胜利！' : '💀 战斗失败'

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
    const rewardsStartY = hasHerbs ? y - 90 : y - 60

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

    let herbY = rewardsStartY + 3 * 45 + 15
    if (hasHerbs && this.result.herbDrops) {
      const herbTitle = this.add.text(x, herbY, '🌿 获得药材：', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#81c784',
        fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0)
      this.tweens.add({
        targets: herbTitle,
        alpha: 1,
        duration: 400,
        delay: 1100
      })

      this.result.herbDrops.forEach((drop, idx) => {
        const herb = getHerbById(drop.herbId)
        if (!herb) return
        const dy = herbY + 30 + idx * 28
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
          delay: 1200 + idx * 150
        })
      })
      herbY = herbY + 30 + this.result.herbDrops.length * 28 + 15
    } else {
      herbY = rewardsStartY + 3 * 45 + 15
    }

    if (this.leveledUp) {
      const levelUpY = herbY
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
        delay: 1400,
        ease: 'Back.easeOut'
      })

      this.tweens.add({
        targets: levelUpText,
        scale: 1.05,
        duration: 800,
        delay: 2000,
        yoyo: true,
        repeat: -1
      })
      herbY = levelUpY + 40
    }

    const currentInfo = this.add.text(x, herbY + 15,
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
      delay: 1700
    })
  }

  private createDefeatContent(x: number, y: number): void {
    const messages = [
      '胜败乃兵家常事，切勿气馁。',
      '闭关修炼，方能更上一层楼。',
      '提升法宝与修为，再战不迟。'
    ]

    const tip = messages[Math.floor(Math.random() * messages.length)]
    const tipText = this.add.text(x, y - 30, tip, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#b0bec5',
      align: 'center'
    }).setOrigin(0.5)

    const recoverText = this.add.text(x, y + 30, '（生命值已恢复50%）', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#81c784'
    }).setOrigin(0.5)

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

  private createButtons(x: number, y: number): void {
    const spacing = 140
    const buttons = this.result.victory
      ? [
          { label: '下一关', color: 0x4fc3f7, action: () => this.nextStage() },
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
      const nextStageId = Math.min(this.result.stageId + 1, STAGES.length)
      this.scene.start('BattleScene', { stageId: nextStageId })
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
