import Phaser from 'phaser'
import type { Player, Treasure } from '../types'
import { SaveManager } from '../managers/SaveManager'
import { AlchemyManager } from '../managers/AlchemyManager'
import { EquipmentManager } from '../managers/EquipmentManager'
import { MeridianManager } from '../managers/MeridianManager'
import { AchievementManager } from '../managers/AchievementManager'
import { ELEMENT_INFO, getTreasureElementBonusText, getTreasureElementLabel, calculateTreasureElementBonus } from '../data/fiveElementsData'

export class TreasureScene extends Phaser.Scene {
  private saveManager = SaveManager.getInstance()
  private alchemyManager = AlchemyManager.getInstance()
  private achievementManager = AchievementManager.getInstance()
  private player!: Player
  private selectedTreasure: Treasure | null = null
  private treasureCards: Phaser.GameObjects.Container[] = []
  private detailPanel!: Phaser.GameObjects.Container
  private playerStatsText!: Phaser.GameObjects.Text
  private elementBonusText!: Phaser.GameObjects.Text
  private goldText!: Phaser.GameObjects.Text
  private spiritText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'TreasureScene' })
  }

  init(): void {
    const save = this.saveManager.loadGame()!
    this.player = save.player
    const permBonus = this.alchemyManager.getPermanentBonus(save.alchemy)
    const equipBonus = EquipmentManager.getInstance().calculateEquipmentBonus(save.equipment)
    const meridBonus = MeridianManager.getInstance().calculateMeridianBonus(save.meridian)
    const achvBonus = this.achievementManager.getAchievementBonus(save.achievement)
    this.saveManager.recalcPlayerStats(this.player, undefined, permBonus, equipBonus, meridBonus, achvBonus)
  }

  create(): void {
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor(0x0a0a15)
    this.createBackground(width, height)

    const title = this.add.text(width / 2, 50, '💎 法宝养成', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '40px',
      color: '#ffd54f',
      stroke: '#5d4037',
      strokeThickness: 3
    }).setOrigin(0.5)

    this.playerStatsText = this.add.text(width / 2, 95, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#81c784',
      align: 'center'
    }).setOrigin(0.5)

    this.goldText = this.add.text(30, 30, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#ffd54f'
    })

    this.spiritText = this.add.text(30, 60, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#4fc3f7'
    })

    this.elementBonusText = this.add.text(width / 2, 120, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '15px',
      color: '#ffd54f',
      align: 'center'
    }).setOrigin(0.5)

    this.updateResourceTexts()
    this.createTreasureCards(width, height)
    this.createDetailPanel(width, height)
    this.createBackButton(width, height)

    this.cameras.main.fadeIn(500)
  }

  private createBackground(width: number, height: number): void {
    const particles = this.add.particles(0, 0, 't-particle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: { min: 3000, max: 6000 },
      speedY: { min: -15, max: -30 },
      speedX: { min: -5, max: 5 },
      scale: { start: 0.25, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x4fc3f7, 0xffd54f, 0x81c784, 0xce93d8],
      quantity: 2,
      frequency: 250
    })

    for (let i = 0; i < 3; i++) {
      const glow = this.add.graphics()
      glow.fillStyle([0x1a237e, 0x004d40, 0x4a148c][i], 0.12)
      glow.fillCircle(
        width * (0.2 + i * 0.3),
        height * (0.3 + Math.random() * 0.4),
        180 + Math.random() * 100
      )
    }
  }

  private createTreasureCards(width: number, height: number): void {
    const cardWidth = 160
    const cardHeight = 200
    const spacing = 30
    const totalWidth = this.player.treasures.length * cardWidth + (this.player.treasures.length - 1) * spacing
    const startX = (width - totalWidth) / 2 + cardWidth / 2
    const y = height * 0.42

    this.player.treasures.forEach((treasure, index) => {
      const x = startX + index * (cardWidth + spacing)
      const card = this.createTreasureCard(x, y, cardWidth, cardHeight, treasure, index)
      this.treasureCards.push(card)

      card.setAlpha(0)
      this.tweens.add({
        targets: card,
        alpha: 1,
        y: y,
        duration: 600,
        delay: 200 + index * 150,
        ease: 'Back.easeOut'
      })
    })
  }

  private createTreasureCard(x: number, y: number, width: number, height: number, treasure: Treasure, index: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const maxLevel = treasure.maxLevel
    const isMax = treasure.level >= maxLevel

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.8)
    bg.lineStyle(3, treasure.color, 0.9)
    this.roundedRect(bg, -width / 2, -height / 2, width, height, 12)

    const iconBg = this.add.graphics()
    iconBg.fillStyle(treasure.color, 0.2)
    iconBg.fillCircle(0, -height / 2 + 60, 40)
    iconBg.lineStyle(2, treasure.color, 0.8)
    iconBg.strokeCircle(0, -height / 2 + 60, 40)

    let elRing: Phaser.GameObjects.Graphics | null = null
    if (treasure.element && treasure.element !== 'none') {
      elRing = this.add.graphics()
      const elColor = ELEMENT_INFO[treasure.element].color
      elRing.lineStyle(3, elColor, 0.9)
      elRing.strokeCircle(0, -height / 2 + 60, 46)
    }

    const letter = treasure.name.charAt(0)
    const icon = this.add.text(0, -height / 2 + 60, letter, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '32px',
      color: '#' + treasure.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const name = this.add.text(0, -height / 2 + 115, treasure.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const levelText = this.add.text(0, -height / 2 + 140, 'Lv.' + treasure.level + (isMax ? ' (MAX)' : ''), {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: isMax ? '#ffd54f' : '#81c784'
    }).setOrigin(0.5)

    const bonusText = this.add.text(0, -height / 2 + 165,
      '攻击+' + (treasure.attackBonus * treasure.level) +
      ' 防御+' + (treasure.defenseBonus * treasure.level),
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#b0bec5'
      }).setOrigin(0.5)

    let elementText: Phaser.GameObjects.Text | null = null
    if (treasure.element && treasure.element !== 'none') {
      const elInfo = ELEMENT_INFO[treasure.element]
      elementText = this.add.text(0, -height / 2 + 185, getTreasureElementLabel(treasure) +
        '系伤害 +' + Math.round((treasure.elementDamageBonus || 0) * treasure.level * 100) + '%',
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '12px',
          color: '#' + elInfo.color.toString(16).padStart(6, '0')
        }).setOrigin(0.5)
    }

    const allChildren: Phaser.GameObjects.GameObject[] = [bg, iconBg]
    if (elRing) allChildren.push(elRing)
    allChildren.push(icon, name, levelText, bonusText)
    if (elementText) allChildren.push(elementText)
    container.add(allChildren)
    container.setSize(width, height)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.05, duration: 200 })
      bg.clear()
      bg.fillStyle(0x000000, 0.9)
      bg.lineStyle(4, treasure.color, 1)
      this.roundedRect(bg, -width / 2, -height / 2, width, height, 12)
    })

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 200 })
      bg.clear()
      bg.fillStyle(0x000000, 0.8)
      bg.lineStyle(3, treasure.color, 0.9)
      this.roundedRect(bg, -width / 2, -height / 2, width, height, 12)
    })

    container.on('pointerdown', () => this.selectTreasure(index))

    return container
  }

  private createDetailPanel(width: number, height: number): void {
    this.detailPanel = this.add.container(width / 2, height * 0.82)

    const panelWidth = 500
    const panelHeight = 200

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.85)
    bg.lineStyle(2, 0xffd54f, 0.7)
    this.roundedRect(bg, -panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 14)

    const placeholder = this.add.text(0, 0, '请选择一件法宝查看详情', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#78909c'
    }).setOrigin(0.5)

    this.detailPanel.add([bg, placeholder])
    this.detailPanel.setSize(panelWidth, panelHeight)
  }

  private selectTreasure(index: number): void {
    this.selectedTreasure = this.player.treasures[index]
    this.updateDetailPanel()
  }

  private updateDetailPanel(): void {
    if (!this.selectedTreasure) return
    const t = this.selectedTreasure
    const { width } = this.scale
    const panelWidth = 500
    const panelHeight = 200
    const isMax = t.level >= t.maxLevel

    this.detailPanel.removeAll(true)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.85)
    bg.lineStyle(2, t.color, 0.9)
    this.roundedRect(bg, -panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 14)

    const iconBg = this.add.graphics()
    iconBg.fillStyle(t.color, 0.25)
    iconBg.fillCircle(-panelWidth / 2 + 65, -20, 45)
    iconBg.lineStyle(3, t.color, 1)
    iconBg.strokeCircle(-panelWidth / 2 + 65, -20, 45)

    let elRingPanel: Phaser.GameObjects.Graphics | null = null
    if (t.element && t.element !== 'none') {
      elRingPanel = this.add.graphics()
      const elColor = ELEMENT_INFO[t.element].color
      elRingPanel.lineStyle(3, elColor, 0.9)
      elRingPanel.strokeCircle(-panelWidth / 2 + 65, -20, 52)
    }

    const icon = this.add.text(-panelWidth / 2 + 65, -20, t.name.charAt(0), {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '40px',
      color: '#' + t.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const name = this.add.text(-panelWidth / 2 + 130, -70, t.name + '  Lv.' + t.level + (isMax ? ' (MAX)' : ''), {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    })

    const desc = this.add.text(-panelWidth / 2 + 130, -38, t.description, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '15px',
      color: '#b0bec5',
      wordWrap: { width: panelWidth - 200 }
    })

    const statColor = '#81c784'
    const nextColor = '#4fc3f7'
    const curAtk = t.attackBonus * t.level
    const curDef = t.defenseBonus * t.level
    const curHp = t.healthBonus * t.level
    const nextAtk = t.attackBonus * (t.level + 1)
    const nextDef = t.defenseBonus * (t.level + 1)
    const nextHp = t.healthBonus * (t.level + 1)

    const stats = this.add.text(-panelWidth / 2 + 130, 0,
      `攻击+${curAtk}${isMax ? '' : ` → +${nextAtk}`}  防御+${curDef}${isMax ? '' : ` → +${nextDef}`}  生命+${curHp}${isMax ? '' : ` → +${nextHp}`}`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '14px',
        color: isMax ? statColor : nextColor
      }
    )

    const elementStatText: Phaser.GameObjects.Text[] = []
    if (t.element && t.element !== 'none') {
      const elInfo = ELEMENT_INFO[t.element]
      const elBonusText = getTreasureElementBonusText(t)
      const elTag = this.add.text(-panelWidth / 2 + 130, 22,
        `五行属性：${elInfo.icon}${elInfo.name}   ` + elBonusText,
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '14px',
          color: '#' + elInfo.color.toString(16).padStart(6, '0')
        }
      )
      elementStatText.push(elTag)

      const constrained = ['metal', 'wood', 'earth', 'water', 'fire']
      const idx = ['metal', 'wood', 'earth', 'water', 'fire'].indexOf(t.element)
      const nextEl = constrained[(idx + 1) % 5]
      const prevEl = constrained[(idx - 1 + 5) % 5]
      const elDesc = this.add.text(-panelWidth / 2 + 130, 44,
        `克制${ELEMENT_INFO[nextEl as keyof typeof ELEMENT_INFO].icon}${ELEMENT_INFO[nextEl as keyof typeof ELEMENT_INFO].name}系   被${ELEMENT_INFO[prevEl as keyof typeof ELEMENT_INFO].icon}${ELEMENT_INFO[prevEl as keyof typeof ELEMENT_INFO].name}系克制`,
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '12px',
          color: '#b0bec5'
        }
      )
      elementStatText.push(elDesc)
    }

    if (!isMax) {
      const upgradeBtn = this.createUpgradeButton(panelWidth / 2 - 85, 55, t)
      this.detailPanel.add(upgradeBtn)
    } else {
      const maxText = this.add.text(panelWidth / 2 - 85, 55, '已满级 ⭐', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#ffd54f',
        fontStyle: 'bold'
      }).setOrigin(0.5)
      this.detailPanel.add(maxText)
    }

    const panelChildren: Phaser.GameObjects.GameObject[] = [bg, iconBg]
    if (elRingPanel) panelChildren.push(elRingPanel)
    panelChildren.push(icon, name, desc, stats)
    elementStatText.forEach((et) => panelChildren.push(et))
    this.detailPanel.add(panelChildren)
  }

  private createUpgradeButton(x: number, y: number, treasure: Treasure): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const btnWidth = 140
    const btnHeight = 50
    const cost = treasure.upgradeCost * treasure.level
    const canAfford = this.player.gold >= cost && this.player.spirit >= Math.ceil(cost / 10)

    const bg = this.add.graphics()
    bg.fillStyle(canAfford ? 0x4fc3f7 : 0x455a64, canAfford ? 0.9 : 0.6)
    bg.lineStyle(2, canAfford ? 0x4fc3f7 : 0x78909c, 1)
    this.roundedRect(bg, -btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10)

    const label = this.add.text(0, -10, '升级法宝', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const costText = this.add.text(0, 12, `💰${cost} ✨${Math.ceil(cost / 10)}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: canAfford ? '#ffd54f' : '#ef5350'
    }).setOrigin(0.5)

    container.add([bg, label, costText])
    container.setSize(btnWidth, btnHeight)

    if (canAfford) {
      container.setInteractive({ useHandCursor: true })
      container.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.08, duration: 150 }))
      container.on('pointerout', () => this.tweens.add({ targets: container, scale: 1, duration: 150 }))
      container.on('pointerdown', () => this.upgradeTreasure(treasure))
    }

    return container
  }

  private upgradeTreasure(treasure: Treasure): void {
    if (treasure.level >= treasure.maxLevel) return
    const cost = treasure.upgradeCost * treasure.level
    const spiritCost = Math.ceil(cost / 10)

    if (this.player.gold < cost || this.player.spirit < spiritCost) return

    this.player.gold -= cost
    this.player.spirit -= spiritCost
    treasure.level++

    const save = this.saveManager.loadGame()!
    save.player = this.player
    this.saveManager.recalcPlayerStatsFromSave(save)

    this.saveManager.saveGame(save)

    this.cameras.main.flash(300, 255, 215, 0)

    this.updateResourceTexts()
    this.refreshCards()
    this.updateDetailPanel()
  }

  private refreshCards(): void {
    this.treasureCards.forEach(card => card.destroy())
    this.treasureCards = []
    this.createTreasureCards(this.scale.width, this.scale.height)
  }

  private updateResourceTexts(): void {
    this.goldText.setText('💰 金币: ' + this.player.gold)
    this.spiritText.setText('✨ 灵气: ' + this.player.spirit)
    this.playerStatsText.setText(
      `⚔ 攻击: ${this.player.attack}  |  🛡 防御: ${this.player.defense}  |  ❤ 生命: ${this.player.maxHealth}  |  💧 灵力: ${this.player.maxMana}`
    )
    const bonusByElement = new Map<string, number>()
    this.player.treasures.forEach((t) => {
      if (t.element && t.element !== 'none' && t.elementDamageBonus) {
        const cur = bonusByElement.get(t.element) || 0
        bonusByElement.set(t.element, cur + t.elementDamageBonus * t.level)
      }
    })
    if (bonusByElement.size > 0) {
      const parts = Array.from(bonusByElement.entries()).map(([el, bonus]) => {
        const info = ELEMENT_INFO[el as keyof typeof ELEMENT_INFO]
        return `${info.icon}${info.name}系 +${Math.round(bonus * 100)}%`
      })
      this.elementBonusText.setText('☯ 五行法宝加成：' + parts.join('   '))
    } else {
      this.elementBonusText.setText('')
    }
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
    const btn = this.add.container(width - 80, height - 40)
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.7)
    bg.lineStyle(2, 0x78909c, 0.8)
    this.roundedRect(bg, -60, -25, 120, 50, 10)
    const text = this.add.text(0, 0, '◀ 返回', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5)
    btn.add([bg, text])
    btn.setSize(120, 50)
    btn.setInteractive({ useHandCursor: true })
    btn.on('pointerover', () => this.tweens.add({ targets: btn, scale: 1.08, duration: 150 }))
    btn.on('pointerout', () => this.tweens.add({ targets: btn, scale: 1, duration: 150 }))
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(400)
      this.time.delayedCall(400, () => this.scene.start('MenuScene'))
    })
  }
}
