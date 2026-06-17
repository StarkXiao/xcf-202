import Phaser from 'phaser'
import type { GameSave } from '../types'
import { SaveManager } from '../managers/SaveManager'
import { AchievementManager } from '../managers/AchievementManager'
import { OfflineIncomeManager } from '../managers/OfflineIncomeManager'
import { STAGES } from '../data/gameData'

export class MenuScene extends Phaser.Scene {
  private save!: GameSave
  private saveManager: SaveManager
  private achievementManager: AchievementManager
  private offlineIncomeManager: OfflineIncomeManager
  private notificationBadge!: Phaser.GameObjects.Text
  private pendingOfflineIncome: any = null

  constructor() {
    super({ key: 'MenuScene' })
    this.saveManager = SaveManager.getInstance()
    this.achievementManager = AchievementManager.getInstance()
    this.offlineIncomeManager = OfflineIncomeManager.getInstance()
  }

  init(): void {
    const existingSave = this.saveManager.loadGame()
    this.save = existingSave || this.saveManager.createNewSave()
    if (!existingSave) {
      this.saveManager.saveGame(this.save)
    }
    this.saveManager.recalcPlayerStatsFromSave(this.save)

    if (existingSave) {
      this.pendingOfflineIncome = this.saveManager.settleOfflineIncome(this.save)
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

    if (this.pendingOfflineIncome?.isAbnormal) {
      const abnormalWarning = this.add.text(width / 2, height * 0.34,
        `⚠ ${this.pendingOfflineIncome.abnormalReason || '离线数据异常'}`,
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '16px',
          color: '#ef5350'
        }).setOrigin(0.5).setAlpha(0)

      this.tweens.add({
        targets: abnormalWarning,
        alpha: { from: 0, to: 1 },
        duration: 1500,
        delay: 800
      })

      this.tweens.add({
        targets: abnormalWarning,
        alpha: { from: 0.6, to: 1 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        delay: 2300
      })
    }

    this.createMenuButtons(width, height)

    if (this.pendingOfflineIncome && (this.pendingOfflineIncome.hasIncome || this.pendingOfflineIncome.isAbnormal)) {
      this.time.delayedCall(800, () => {
        this.showOfflineIncomePopup(this.pendingOfflineIncome!)
      })
    }
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
      { label: '📜 主线章节', y: height * 0.42, color: 0xffd54f, action: () => this.goToChapterMap() },
      { label: '⚔ 开始闯关', y: height * 0.46 + 6, color: 0x4fc3f7, action: () => this.startBattle() },
      { label: '⚡ 技能修炼', y: height * 0.50 + 12, color: 0xff7043, action: () => this.goToSkill() },
      { label: '� 成就图鉴', y: height * 0.54 + 18, color: 0xffd54f, action: () => this.goToAchievement() },
      { label: '� 坊市交易', y: height * 0.58 + 24, color: 0xffd54f, action: () => this.goToShop() },
      { label: '🏰 秘境探索', y: height * 0.62 + 30, color: 0x9575cd, action: () => this.goToDungeon() },
      { label: '✨ 仙缘奇遇', y: height * 0.68 + 30, color: 0xba68c8, action: () => this.goToEncounter() },
      { label: '🧘 经脉修炼', y: height * 0.74 + 30, color: 0xe1bee7, action: () => this.goToMeridian() },
      { label: '🐉 灵兽养成', y: height * 0.80 + 30, color: 0xff7043, action: () => this.goToSpiritBeast() },
      { label: '🧪 洞府炼丹', y: height * 0.86 + 30, color: 0xba68c8, action: () => this.goToAlchemy() },
      { label: '🏛️ 宗门经营', y: height * 0.90 + 30, color: 0xffd54f, action: () => this.goToSect() },
      { label: '💎 法宝养成', y: height * 0.94 + 30, color: 0x81c784, action: () => this.goToTreasure() },
      { label: '⚒️ 装备锻造', y: height * 0.98 + 30, color: 0xff7043, action: () => this.goToEquipment() },
      { label: '📖 重新开始', y: height * 1.02, color: 0xef5350, action: () => this.confirmReset() }
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

  private goToSkill(): void {
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      this.scene.start('SkillScene')
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

  private goToChapterMap(): void {
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      this.scene.start('ChapterMapScene')
    })
  }

  private showOfflineIncomePopup(result: ReturnType<SaveManager['settleOfflineIncome']>): void {
    const { width, height } = this.scale
    const objectsToDestroy: Phaser.GameObjects.GameObject[] = []

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.8)
    overlay.fillRect(0, 0, width, height)
    objectsToDestroy.push(overlay)

    const panelWidth = 480
    const rewardLabels: { icon: string; label: string; value: number; color: string }[] = []

    if (result.isAbnormal) {
      rewardLabels.push({ icon: '❌', label: '异常状态', value: 0, color: '#ef5350' })
    } else {
      if (result.playerIncome.gold > 0) {
        rewardLabels.push({ icon: '💰', label: '金币', value: result.playerIncome.gold, color: '#ffd54f' })
      }
      if (result.playerIncome.spirit > 0) {
        rewardLabels.push({ icon: '✨', label: '灵气', value: result.playerIncome.spirit, color: '#4fc3f7' })
      }
      if (result.playerIncome.exp > 0) {
        rewardLabels.push({ icon: '📚', label: '经验', value: result.playerIncome.exp, color: '#81c784' })
      }

      const sectResources = result.sectResources as any
      if (sectResources) {
        if (sectResources.gold && sectResources.gold > 0) {
          rewardLabels.push({ icon: '🏛️', label: '宗门金币', value: sectResources.gold, color: '#ffd54f' })
        }
        if (sectResources.spirit && sectResources.spirit > 0) {
          rewardLabels.push({ icon: '🏛️', label: '宗门灵气', value: sectResources.spirit, color: '#4fc3f7' })
        }
        if (sectResources.stone && sectResources.stone > 0) {
          rewardLabels.push({ icon: '🪨', label: '石料', value: sectResources.stone, color: '#90a4ae' })
        }
        if (sectResources.wood && sectResources.wood > 0) {
          rewardLabels.push({ icon: '🪵', label: '木材', value: sectResources.wood, color: '#8d6e63' })
        }
        if (sectResources.herb && sectResources.herb > 0) {
          rewardLabels.push({ icon: '🌿', label: '草药', value: sectResources.herb, color: '#66bb6a' })
        }
      }
    }

    let extraHeight = 0
    if (result.leveledUp) extraHeight += 50
    if (result.isCapped) extraHeight += 40
    if (result.isAbnormal && result.abnormalReason) extraHeight += 40

    const baseHeight = result.isAbnormal ? 200 : 220
    const panelHeight = baseHeight + rewardLabels.length * 45 + extraHeight
    const panelX = (width - panelWidth) / 2
    const panelY = (height - panelHeight) / 2

    const borderColor = result.isAbnormal ? 0xef5350 : 0xffd54f
    const panel = this.add.graphics()
    panel.fillStyle(0x1a1a2e, 0.98)
    panel.lineStyle(3, borderColor, 0.9)
    this.roundedRect(panel, panelX, panelY, panelWidth, panelHeight, 20)
    objectsToDestroy.push(panel)

    const titleText = result.isAbnormal ? '⚠ 离线收益异常' : '✨ 离线收益'
    const titleColor = result.isAbnormal ? '#ef5350' : '#ffd54f'
    const title = this.add.text(width / 2, panelY + 45, titleText, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '32px',
      color: titleColor,
      fontStyle: 'bold'
    }).setOrigin(0.5)
    objectsToDestroy.push(title)

    const timeTextContent = result.isAbnormal 
      ? '离线收益结算失败' 
      : `离线时长: ${this.offlineIncomeManager.formatTime(result.offlineSeconds)}`
    const timeTextColor = result.isAbnormal ? '#ef5350' : '#81c784'
    const timeText = this.add.text(width / 2, panelY + 90, timeTextContent, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: timeTextColor
    }).setOrigin(0.5)
    objectsToDestroy.push(timeText)

    let yOffset = panelY + 140

    if (result.isAbnormal && result.abnormalReason) {
      const abnormalBg = this.add.graphics()
      abnormalBg.fillStyle(0x2d1a1a, 0.8)
      this.roundedRect(abnormalBg, panelX + 40, yOffset, panelWidth - 80, 60, 8)
      objectsToDestroy.push(abnormalBg)

      const abnormalLabel = this.add.text(panelX + 60, yOffset + 30, 
        `⚠ ${result.abnormalReason}`,
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '18px',
          color: '#ef5350',
          wordWrap: { width: panelWidth - 100, useAdvancedWrap: true }
        }).setOrigin(0, 0.5)
      objectsToDestroy.push(abnormalLabel)

      yOffset += 70

      const tipText = this.add.text(width / 2, yOffset, 
        '请检查系统时间是否正确，本次无离线收益',
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '16px',
          color: '#ffb74d'
        }).setOrigin(0.5)
      objectsToDestroy.push(tipText)

      yOffset += 30
    } else {
      rewardLabels.forEach((reward, index) => {
        const rewardBg = this.add.graphics()
        rewardBg.fillStyle(0x2d2d44, 0.6)
        this.roundedRect(rewardBg, panelX + 40, yOffset + index * 45, panelWidth - 80, 38, 8)
        objectsToDestroy.push(rewardBg)

        const labelText = this.add.text(panelX + 60, yOffset + index * 45 + 19, 
          `${reward.icon} ${reward.label}`,
          {
            fontFamily: '"Microsoft YaHei", serif',
            fontSize: '18px',
            color: '#ffffff'
          }).setOrigin(0, 0.5)
        objectsToDestroy.push(labelText)

        const valueText = this.add.text(panelX + panelWidth - 60, yOffset + index * 45 + 19, 
          `+${reward.value}`,
          {
            fontFamily: '"Microsoft YaHei", serif',
            fontSize: '20px',
            color: reward.color,
            fontStyle: 'bold'
          }).setOrigin(1, 0.5)
        objectsToDestroy.push(valueText)
      })

      const hintY = panelY + 140 + rewardLabels.length * 45 + 15
      let currentHintY = hintY

      if (result.leveledUp) {
        const levelUpBg = this.add.graphics()
        levelUpBg.fillStyle(0x1a2e1a, 0.8)
        this.roundedRect(levelUpBg, panelX + 40, currentHintY - 5, panelWidth - 80, 40, 8)
        objectsToDestroy.push(levelUpBg)

        const levelUpText = this.add.text(width / 2, currentHintY + 15, 
          `🎉 恭喜！等级提升了 ${result.levelsGained} 级！`,
          {
            fontFamily: '"Microsoft YaHei", serif',
            fontSize: '18px',
            color: '#81c784',
            fontStyle: 'bold'
          }).setOrigin(0.5)
        objectsToDestroy.push(levelUpText)

        currentHintY += 45
      }

      if (result.isCapped) {
        const capText = this.add.text(width / 2, currentHintY + 10, 
          '⚠ 离线收益已达上限，及时上线领取哦~',
          {
            fontFamily: '"Microsoft YaHei", serif',
            fontSize: '16px',
            color: '#ffb74d'
          }).setOrigin(0.5)
        objectsToDestroy.push(capText)
      }
    }

    const okBtnY = panelY + panelHeight - 60
    const btnText = result.isAbnormal ? '知道了' : '领取奖励'
    const btnColor = result.isAbnormal ? 0x78909c : 0xffd54f
    const okBtn = this.createButton(width / 2, okBtnY, btnText, btnColor, () => {
      objectsToDestroy.forEach(obj => obj.destroy())
      okBtn.destroy()
      this.events.emit('offline:collected')
    })
    okBtn.setScale(0.9)

    this.tweens.add({
      targets: [overlay],
      alpha: { from: 0, to: 1 },
      duration: 300
    })

    this.tweens.add({
      targets: [panel, title, timeText, okBtn],
      scale: { from: 0.8, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 400,
      ease: 'Back.easeOut'
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
