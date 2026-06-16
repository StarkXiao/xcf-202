import Phaser from 'phaser'
import type { GameSave } from '../types'
import { SaveManager } from '../managers/SaveManager'
import { AchievementManager } from '../managers/AchievementManager'
import { STAGES } from '../data/gameData'

export class MenuScene extends Phaser.Scene {
  private save!: GameSave
  private saveManager: SaveManager
  private achievementManager: AchievementManager
  private notificationBadge!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'MenuScene' })
    this.saveManager = SaveManager.getInstance()
    this.achievementManager = AchievementManager.getInstance()
  }

  init(): void {
    const existingSave = this.saveManager.loadGame()
    this.save = existingSave || this.saveManager.createNewSave()
    if (!existingSave) {
      this.saveManager.saveGame(this.save)
    }
  }

  create(): void {
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor(0x0a0a15)
    this.createCosmicBackground(width, height)
    this.createFloatingSword(width, height)

    const title = this.add.text(width / 2, height * 0.15, '御剑仙侠', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '72px',
      color: '#ffd54f',
      stroke: '#5d4037',
      strokeThickness: 6
    }).setOrigin(0.5)

    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.05 },
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    const playerInfo = this.add.text(width / 2, height * 0.3,
      `${this.save.player.name}  Lv.${this.save.player.level}  |  最高关卡: ${this.save.highestStage}/${STAGES.length}`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '22px',
        color: '#81c784'
      }).setOrigin(0.5)

    this.tweens.add({
      targets: playerInfo,
      alpha: { from: 0, to: 1 },
      duration: 1500,
      delay: 500
    })

    this.createMenuButtons(width, height)
  }

  private createCosmicBackground(width: number, height: number): void {
    const stars = this.add.graphics()
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const size = Math.random() * 2 + 0.5
      const alpha = Math.random() * 0.8 + 0.2
      stars.fillStyle(0xffffff, alpha)
      stars.fillCircle(x, y, size)
    }

    this.tweens.add({
      targets: stars,
      alpha: { from: 0.6, to: 1 },
      duration: 3000,
      yoyo: true,
      repeat: -1
    })

    const nebulaColors = [0x4a148c, 0x1a237e, 0x0d47a1, 0x004d40]
    for (let i = 0; i < 4; i++) {
      const nebula = this.add.graphics()
      nebula.fillStyle(nebulaColors[i], 0.15)
      const nx = (width / 4) * i + width / 8
      const ny = height * (0.3 + Math.random() * 0.4)
      nebula.fillCircle(nx, ny, 200 + Math.random() * 100)

      this.tweens.add({
        targets: nebula,
        x: { from: 0, to: i % 2 === 0 ? 30 : -30 },
        y: { from: 0, to: i % 2 === 0 ? -20 : 20 },
        duration: 6000 + i * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }
  }

  private createFloatingSword(width: number, height: number): void {
    const swordContainer = this.add.container(width / 2, height * 0.5)

    const blade = this.add.graphics()
    blade.fillGradientStyle(0x90caf9, 0xffffff, 0x42a5f5, 0x90caf9)
    blade.fillRect(-4, -120, 8, 180)

    const guard = this.add.graphics()
    guard.fillStyle(0xffd54f)
    guard.fillRect(-25, 55, 50, 10)

    const handle = this.add.graphics()
    handle.fillStyle(0x5d4037)
    handle.fillRect(-6, 65, 12, 50)

    const pommel = this.add.graphics()
    pommel.fillStyle(0xffd54f)
    pommel.fillCircle(0, 120, 10)

    swordContainer.add([blade, guard, handle, pommel])
    swordContainer.setAngle(-15)

    const glow = this.add.graphics()
    glow.lineStyle(4, 0x4fc3f7, 0.6)
    glow.strokeRect(-6, -122, 12, 184)
    swordContainer.add(glow)

    this.tweens.add({
      targets: swordContainer,
      y: height * 0.48,
      angle: -10,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    const particles = this.add.particles(width / 2, height * 0.5, 'sword-particle', {
      speed: { min: 20, max: 60 },
      angle: { min: -120, max: -60 },
      lifespan: 1500,
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: 0x4fc3f7,
      quantity: 2,
      frequency: 100,
      blendMode: 'ADD'
    })
  }

  private createMenuButtons(width: number, height: number): void {
    const buttonConfigs = [
      { label: '⚔ 开始闯关', y: height * 0.42, color: 0x4fc3f7, action: () => this.startBattle() },
      { label: '� 成就图鉴', y: height * 0.46 + 6, color: 0xffd54f, action: () => this.goToAchievement() },
      { label: '� 坊市交易', y: height * 0.50 + 12, color: 0xffd54f, action: () => this.goToShop() },
      { label: '🏰 秘境探索', y: height * 0.54 + 18, color: 0x9575cd, action: () => this.goToDungeon() },
      { label: '✨ 仙缘奇遇', y: height * 0.58 + 24, color: 0xba68c8, action: () => this.goToEncounter() },
      { label: '🧘 经脉修炼', y: height * 0.64 + 24, color: 0xe1bee7, action: () => this.goToMeridian() },
      { label: '🐉 灵兽养成', y: height * 0.70 + 24, color: 0xff7043, action: () => this.goToSpiritBeast() },
      { label: '🧪 洞府炼丹', y: height * 0.76 + 24, color: 0xba68c8, action: () => this.goToAlchemy() },
      { label: '🏛️ 宗门经营', y: height * 0.82 + 24, color: 0xffd54f, action: () => this.goToSect() },
      { label: '💎 法宝养成', y: height * 0.88 + 24, color: 0x81c784, action: () => this.goToTreasure() },
      { label: '⚒️ 装备锻造', y: height * 0.92 + 24, color: 0xff7043, action: () => this.goToEquipment() },
      { label: '📖 重新开始', y: height * 0.98, color: 0xef5350, action: () => this.confirmReset() }
    ]

    buttonConfigs.forEach((config, index) => {
      const btn = this.createButton(width / 2, config.y, config.label, config.color, config.action)
      btn.setAlpha(0)
      this.tweens.add({
        targets: btn,
        alpha: 1,
        y: config.y,
        duration: 800,
        delay: 800 + index * 200,
        ease: 'Back.easeOut'
      })

      if (config.label.includes('成就图鉴')) {
        this.addAchievementBadge(btn)
      }
    })
  }

  private addAchievementBadge(button: Phaser.GameObjects.Container): void {
    const claimableCount = this.achievementManager.getClaimableAchievementsCount(this.save.achievement)
    if (claimableCount > 0) {
      this.notificationBadge = this.add.text(button.x + 120, button.y - 20, `${claimableCount}`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#ef5350',
        padding: { left: 6, right: 6, top: 2, bottom: 2 }
      }).setOrigin(0.5).setDepth(100)

      this.tweens.add({
        targets: this.notificationBadge,
        scale: { from: 0, to: 1 },
        duration: 300,
        delay: 1500,
        ease: 'Back.easeOut'
      })

      this.tweens.add({
        targets: this.notificationBadge,
        scale: { from: 1, to: 1.2 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }
  }

  private createButton(x: number, y: number, label: string, color: number, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const width = 280
    const height = 56

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.7)
    bg.lineStyle(2, color, 0.9)
    this.roundedRect(bg, -width / 2, -height / 2, width, height, 12)

    const text = this.add.text(0, 0, label, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '26px',
      color: '#ffffff'
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(width, height)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scale: 1.08,
        duration: 150
      })
      bg.clear()
      bg.fillStyle(color, 0.3)
      bg.lineStyle(3, color, 1)
      this.roundedRect(bg, -width / 2, -height / 2, width, height, 12)
    })

    container.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 150
      })
      bg.clear()
      bg.fillStyle(0x000000, 0.7)
      bg.lineStyle(2, color, 0.9)
      this.roundedRect(bg, -width / 2, -height / 2, width, height, 12)
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

  private startBattle(): void {
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      this.scene.start('BattleScene', { stageId: this.save.currentStage })
    })
  }

  private goToSpiritBeast(): void {
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      this.scene.start('SpiritBeastScene')
    })
  }

  private goToTreasure(): void {
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      this.scene.start('TreasureScene')
    })
  }

  private goToEquipment(): void {
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      this.scene.start('EquipmentScene')
    })
  }

  private goToAchievement(): void {
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      this.scene.start('AchievementScene')
    })
  }

  private goToSect(): void {
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      this.scene.start('SectScene')
    })
  }

  private goToAlchemy(): void {
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      this.scene.start('AlchemyScene')
    })
  }

  private goToEncounter(): void {
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      this.scene.start('EncounterScene')
    })
  }

  private goToDungeon(): void {
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      this.scene.start('DungeonScene')
    })
  }

  private goToMeridian(): void {
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      this.scene.start('MeridianScene')
    })
  }

  private goToShop(): void {
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      this.scene.start('ShopScene')
    })
  }

  private confirmReset(): void {
    const { width, height } = this.scale

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.75)
    overlay.fillRect(0, 0, width, height)

    const panel = this.add.graphics()
    panel.fillStyle(0x1a1a2e, 0.95)
    panel.lineStyle(2, 0xef5350, 0.9)
    this.roundedRect(panel, width / 2 - 220, height / 2 - 120, 440, 240, 16)

    const title = this.add.text(width / 2, height / 2 - 60, '⚠ 重新开始', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '30px',
      color: '#ef5350',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const desc = this.add.text(width / 2, height / 2, '确定要清除所有存档重新开始吗？\n此操作不可撤销！', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5)

    const yesBtn = this.createButton(width / 2 - 110, height / 2 + 65, '确认重置', 0xef5350, () => {
      this.saveManager.deleteSave()
      this.scene.restart()
    })
    yesBtn.setScale(0.85)

    const noBtn = this.createButton(width / 2 + 110, height / 2 + 65, '取消', 0x78909c, () => {
      overlay.destroy()
      panel.destroy()
      title.destroy()
      desc.destroy()
      yesBtn.destroy()
      noBtn.destroy()
    })
    noBtn.setScale(0.85)
  }
}
