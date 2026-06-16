import Phaser from 'phaser'
import type { GameSave, Player, MeridianNodeTemplate, MeridianRealm } from '../types'
import { SaveManager } from '../managers/SaveManager'
import { MeridianManager } from '../managers/MeridianManager'
import { AlchemyManager } from '../managers/AlchemyManager'
import { EquipmentManager } from '../managers/EquipmentManager'
import { MERIDIAN_REALM_ORDER } from '../data/meridianData'

export class MeridianScene extends Phaser.Scene {
  private saveManager = SaveManager.getInstance()
  private meridianManager = MeridianManager.getInstance()
  private alchemyManager = AlchemyManager.getInstance()
  private equipmentManager = EquipmentManager.getInstance()

  private save!: GameSave
  private player!: Player

  private selectedRealm: MeridianRealm = 'qi_refining'
  private realmTabs: Phaser.GameObjects.Container[] = []
  private nodeContainers: Map<string, Phaser.GameObjects.Container> = new Map()
  private connectionLines: Phaser.GameObjects.Graphics[] = []

  private playerStatsText!: Phaser.GameObjects.Text
  private goldText!: Phaser.GameObjects.Text
  private spiritText!: Phaser.GameObjects.Text
  private realmInfoText!: Phaser.GameObjects.Text
  private detailPanel!: Phaser.GameObjects.Container
  private selectedNode: MeridianNodeTemplate | null = null
  private breakthroughPanel!: Phaser.GameObjects.Container

  constructor() {
    super({ key: 'MeridianScene' })
  }

  init(): void {
    const save = this.saveManager.loadGame()!
    this.save = save
    this.player = save.player
    this.selectedRealm = save.meridian.currentRealm

    const permBonus = this.alchemyManager.getPermanentBonus(save.alchemy)
    const equipBonus = this.equipmentManager.calculateEquipmentBonus(save.equipment)
    const meridBonus = this.meridianManager.calculateMeridianBonus(save.meridian)
    this.saveManager.recalcPlayerStats(this.player, undefined, permBonus, equipBonus, meridBonus)

    const newSkills = this.meridianManager.syncSkillsToPlayer(save.meridian, this.player)
    this.player.skills.push(...newSkills)
  }

  create(): void {
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor(0x0a0a15)
    this.createBackground(width, height)

    const title = this.add.text(width / 2, 40, '🧘 经脉修炼', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '38px',
      color: '#e1bee7',
      stroke: '#4a148c',
      strokeThickness: 3
    }).setOrigin(0.5)

    this.goldText = this.add.text(30, 25, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffd54f'
    })

    this.spiritText = this.add.text(30, 55, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#4fc3f7'
    })

    this.playerStatsText = this.add.text(width - 30, 40, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '15px',
      color: '#81c784',
      align: 'right'
    }).setOrigin(1, 0.5)

    this.realmInfoText = this.add.text(width / 2, 85, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#b0bec5',
      align: 'center'
    }).setOrigin(0.5)

    this.createRealmTabs(width, height)
    this.createBreakthroughPanel(width, height)
    this.createMeridianNodes(width, height)
    this.createDetailPanel(width, height)
    this.createBackButton(width, height)

    this.updateResourceTexts()
    this.updateRealmTabs()
    this.updateRealmInfo()

    this.cameras.main.fadeIn(500)
  }

  private createBackground(width: number, height: number): void {
    for (let i = 0; i < 3; i++) {
      const glow = this.add.graphics()
      glow.fillStyle([0x4a148c, 0x1a237e, 0x004d40][i], 0.1)
      glow.fillCircle(
        width * (0.25 + i * 0.25),
        height * (0.45 + Math.random() * 0.2),
        250 + Math.random() * 100
      )
    }

    const particles = this.add.particles(0, 0, 'meridian-particle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: { min: 3000, max: 6000 },
      speedY: { min: -10, max: -25 },
      speedX: { min: -5, max: 5 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: [0x4fc3f7, 0xba68c8, 0xffd54f, 0x81c784, 0xe1bee7],
      quantity: 1,
      frequency: 200
    })
  }

  private createRealmTabs(width: number, height: number): void {
    const tabY = 120
    const tabWidth = 95
    const tabHeight = 42
    const spacing = 8
    const totalWidth = MERIDIAN_REALM_ORDER.length * tabWidth + (MERIDIAN_REALM_ORDER.length - 1) * spacing
    const startX = (width - totalWidth) / 2 + tabWidth / 2

    MERIDIAN_REALM_ORDER.forEach((realm, index) => {
      const x = startX + index * (tabWidth + spacing)
      const realmInfo = this.meridianManager.getRealmInfo(realm)
      const isAccessible = this.meridianManager.getRealmOrder(realm) <= this.meridianManager.getRealmOrder(this.save.meridian.highestRealm)

      const container = this.add.container(x, tabY)

      const bg = this.add.graphics()
      bg.fillStyle(0x000000, 0.6)
      bg.lineStyle(2, realmInfo.color, 0.5)
      this.roundedRect(bg, -tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight, 10)

      const nameText = this.add.text(0, 0, realmInfo.name, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '14px',
        color: isAccessible ? '#ffffff' : '#546e7a',
        fontStyle: 'bold'
      }).setOrigin(0.5)

      container.add([bg, nameText])
      container.setSize(tabWidth, tabHeight)
      container.setData('realm', realm)
      container.setData('bg', bg)
      container.setData('text', nameText)

      if (isAccessible) {
        container.setInteractive({ useHandCursor: true })
        container.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.06, duration: 150 }))
        container.on('pointerout', () => this.tweens.add({ targets: container, scale: 1, duration: 150 }))
        container.on('pointerdown', () => this.switchRealm(realm))
      }

      this.realmTabs.push(container)
    })
  }

  private switchRealm(realm: MeridianRealm): void {
    this.selectedRealm = realm
    this.selectedNode = null
    this.updateRealmTabs()
    this.updateRealmInfo()
    this.refreshMeridianNodes()
    this.updateDetailPanel()
  }

  private updateRealmTabs(): void {
    this.realmTabs.forEach((tab) => {
      const realm = tab.getData('realm') as MeridianRealm
      const bg = tab.getData('bg') as Phaser.GameObjects.Graphics
      const text = tab.getData('text') as Phaser.GameObjects.Text
      const realmInfo = this.meridianManager.getRealmInfo(realm)
      const isSelected = realm === this.selectedRealm
      const isCurrent = realm === this.save.meridian.currentRealm
      const isHighest = this.meridianManager.getRealmOrder(realm) <= this.meridianManager.getRealmOrder(this.save.meridian.highestRealm)

      bg.clear()
      if (isSelected) {
        bg.fillStyle(realmInfo.color, 0.45)
        bg.lineStyle(3, realmInfo.color, 1)
      } else {
        bg.fillStyle(0x000000, isCurrent ? 0.7 : 0.5)
        bg.lineStyle(2, realmInfo.color, isCurrent ? 0.9 : 0.4)
      }
      this.roundedRect(bg, -47.5, -21, 95, 42, 10)

      if (isCurrent) {
        text.setColor('#ffd54f')
      } else if (isHighest) {
        text.setColor('#ffffff')
      } else {
        text.setColor('#546e7a')
      }
    })
  }

  private updateRealmInfo(): void {
    const realmInfo = this.meridianManager.getRealmInfo(this.selectedRealm)
    const activated = this.meridianManager.getActivatedCount(this.save.meridian, this.selectedRealm)
    const total = this.meridianManager.getTotalNodesInRealm(this.selectedRealm)
    const isCurrent = this.selectedRealm === this.save.meridian.currentRealm
    const isUnlocked = this.meridianManager.getRealmOrder(this.selectedRealm) <= this.meridianManager.getRealmOrder(this.save.meridian.highestRealm)

    let status = ''
    if (isCurrent) status = '【当前境界】'
    else if (isUnlocked) status = '【已解锁】'
    else status = '【未解锁】'

    this.realmInfoText.setText(
      `${realmInfo.name} ${status}  |  节点进度: ${activated}/${total}  |  ${realmInfo.description}`
    )
    this.realmInfoText.setColor('#' + realmInfo.color.toString(16).padStart(6, '0'))
  }

  private createBreakthroughPanel(width: number, height: number): void {
    this.breakthroughPanel = this.add.container(width / 2, 185)

    const panelWidth = 800
    const panelHeight = 55

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.7)
    bg.lineStyle(2, 0xba68c8, 0.7)
    this.roundedRect(bg, -panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 12)

    this.breakthroughPanel.add([bg])
    this.breakthroughPanel.setSize(panelWidth, panelHeight)

    this.updateBreakthroughPanel()
  }

  private updateBreakthroughPanel(): void {
    this.breakthroughPanel.each((obj: Phaser.GameObjects.GameObject) => { if (obj !== this.breakthroughPanel.first) obj.destroy() })

    const panelWidth = 800
    const curRealm = this.meridianManager.getRealmInfo(this.save.meridian.currentRealm)
    const nextRealmId = this.meridianManager.getNextRealm(this.save.meridian.currentRealm)
    const nextRealm = nextRealmId ? this.meridianManager.getRealmInfo(nextRealmId) : null

    const bg = this.breakthroughPanel.first as Phaser.GameObjects.Graphics

    const curText = this.add.text(-panelWidth / 2 + 25, -5, `当前: ${curRealm.name}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#' + curRealm.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    })

    const activated = this.meridianManager.getActivatedCount(this.save.meridian, this.save.meridian.currentRealm)
    const required = Math.ceil(curRealm.maxNodes * 0.6)
    const progressText = this.add.text(-panelWidth / 2 + 25, 18, `节点进度: ${activated}/${curRealm.maxNodes} (突破需≥${required})`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: activated >= required ? '#81c784' : '#ffab91'
    })

    this.breakthroughPanel.add([curText, progressText])

    if (!nextRealm) {
      const maxText = this.add.text(0, 0, '已达最高境界 · 超脱轮回', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '22px',
        color: '#ffd54f',
        fontStyle: 'bold'
      }).setOrigin(0.5)
      this.breakthroughPanel.add(maxText)
      return
    }

    const arrow = this.add.text(-30, 0, '→', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: '#e1bee7'
    }).setOrigin(0.5)

    const nextText = this.add.text(20, -8, `目标: ${nextRealm.name}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#' + nextRealm.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    })

    const bonusText = this.add.text(20, 15,
      `生命+${nextRealm.statBonuses.maxHealth} 灵力+${nextRealm.statBonuses.maxMana} 攻击+${nextRealm.statBonuses.attack} 防御+${nextRealm.statBonuses.defense}`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#81c784'
      })

    this.breakthroughPanel.add([arrow, nextText, bonusText])

    const btnContainer = this.add.container(panelWidth / 2 - 75, 0)
    const btnWidth = 140
    const btnHeight = 42
    const check = this.meridianManager.canBreakthrough(this.save.meridian, this.player)
    const canBreak = check.can
    const bonusFromFailures = Math.min(this.save.meridian.breakthroughAttempts * 3, 30)
    const rate = Math.min(nextRealm.breakthroughSuccessRate + bonusFromFailures, 95)

    const btnBg = this.add.graphics()
    btnBg.fillStyle(canBreak ? nextRealm.color : 0x455a64, canBreak ? 0.85 : 0.5)
    btnBg.lineStyle(2, canBreak ? nextRealm.color : 0x78909c, 1)
    this.roundedRect(btnBg, -btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10)

    const btnLabel = this.add.text(0, -9, canBreak ? '突破境界' : '条件不足', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const btnCost = this.add.text(0, 12,
      canBreak ? `✨${nextRealm.breakthroughSpiritCost}  成功率${rate}%` : check.reason.length > 12 ? check.reason.slice(0, 12) + '...' : check.reason,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '11px',
        color: canBreak ? '#ffd54f' : '#ef5350'
      }).setOrigin(0.5)

    btnContainer.add([btnBg, btnLabel, btnCost])
    btnContainer.setSize(btnWidth, btnHeight)

    if (canBreak) {
      btnContainer.setInteractive({ useHandCursor: true })
      btnContainer.on('pointerover', () => this.tweens.add({ targets: btnContainer, scale: 1.08, duration: 150 }))
      btnContainer.on('pointerout', () => this.tweens.add({ targets: btnContainer, scale: 1, duration: 150 }))
      btnContainer.on('pointerdown', () => this.attemptBreakthrough())
    }

    this.breakthroughPanel.add(btnContainer)
  }

  private attemptBreakthrough(): void {
    const result = this.meridianManager.attemptBreakthrough(this.save.meridian, this.player)

    const permBonus = this.alchemyManager.getPermanentBonus(this.save.alchemy)
    const equipBonus = this.equipmentManager.calculateEquipmentBonus(this.save.equipment)
    const meridBonus = this.meridianManager.calculateMeridianBonus(this.save.meridian)
    this.saveManager.recalcPlayerStats(this.player, undefined, permBonus, equipBonus, meridBonus)

    this.save.player = this.player
    this.saveManager.saveGame(this.save)

    this.showBreakthroughResult(result)
    this.updateResourceTexts()
    this.updateRealmTabs()
    this.updateRealmInfo()
    this.updateBreakthroughPanel()
    this.refreshMeridianNodes()
  }

  private showBreakthroughResult(result: any): void {
    const { width, height } = this.scale

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.8)
    overlay.fillRect(0, 0, width, height)

    const panel = this.add.graphics()
    const panelW = 480
    const panelH = 220
    panel.fillStyle(result.success ? 0x1a237e : 0x3e1a1a, 0.95)
    panel.lineStyle(3, result.success ? 0x4fc3f7 : 0xef5350, 1)
    this.roundedRect(panel, width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 18)

    const title = this.add.text(width / 2, height / 2 - 75,
      result.success ? '🌟 突破成功 🌟' : '💔 突破失败',
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '34px',
        color: result.success ? '#4fc3f7' : '#ef5350',
        fontStyle: 'bold'
      }).setOrigin(0.5)

    const message = this.add.text(width / 2, height / 2 - 5, result.message, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 420 }
    }).setOrigin(0.5)

    const costText = this.add.text(width / 2, height / 2 + 45, `消耗灵气: ✨${result.costSpent}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffd54f'
    }).setOrigin(0.5)

    if (result.success) {
      this.cameras.main.flash(600, 255, 215, 0)
      this.tweens.add({
        targets: [title],
        scale: { from: 0.5, to: 1.1 },
        alpha: { from: 0, to: 1 },
        duration: 500,
        ease: 'Back.easeOut'
      })
    }

    this.time.delayedCall(2200, () => {
      overlay.destroy()
      panel.destroy()
      title.destroy()
      message.destroy()
      costText.destroy()
    })
  }

  private createMeridianNodes(width: number, height: number): void {
    this.refreshMeridianNodes()
  }

  private refreshMeridianNodes(): void {
    this.nodeContainers.forEach((c) => c.destroy())
    this.nodeContainers.clear()
    this.connectionLines.forEach((l) => l.destroy())
    this.connectionLines = []

    const { width, height } = this.scale
    const centerX = width / 2
    const centerY = height * 0.52
    const nodesArea = this.meridianManager.getNodesForRealm(this.selectedRealm)
    const realmInfo = this.meridianManager.getRealmInfo(this.selectedRealm)
    const isRealmAccessible = this.meridianManager.getRealmOrder(this.selectedRealm) <= this.meridianManager.getRealmOrder(this.save.meridian.highestRealm)
    const isCurrentRealm = this.selectedRealm === this.save.meridian.currentRealm

    if (nodesArea.length === 0) return

    const nodePositions = this.calculateNodePositions(nodesArea.length, centerX, centerY, 200, 120)

    const linesG = this.add.graphics()
    this.connectionLines.push(linesG)
    linesG.lineStyle(2, realmInfo.color, 0.25)

    nodesArea.forEach((template, idx) => {
      const pos = nodePositions[idx]
      if (!pos) return

      template.requiredNodes.forEach((reqId) => {
        const reqIdx = nodesArea.findIndex((n) => n.id === reqId)
        if (reqIdx >= 0 && nodePositions[reqIdx]) {
          const from = nodePositions[reqIdx]
          linesG.lineBetween(from.x, from.y, pos.x, pos.y)
        }
      })
    })

    nodesArea.forEach((template, idx) => {
      const pos = nodePositions[idx]
      if (!pos) return

      const nodeData = this.save.meridian.nodes.find((n) => n.templateId === template.id)
      const isActivated = nodeData?.activated || false
      const canUnlock = isRealmAccessible && (isCurrentRealm || this.meridianManager.getRealmOrder(this.selectedRealm) < this.meridianManager.getRealmOrder(this.save.meridian.currentRealm))
        && this.meridianManager.isNodeUnlocked(this.save.meridian, template)

      const container = this.createNode(template, pos.x, pos.y, isActivated, canUnlock)
      this.nodeContainers.set(template.id, container)
    })
  }

  private calculateNodePositions(count: number, cx: number, cy: number, r1: number, r2: number): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = []
    if (count <= 4) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2
        positions.push({ x: cx + Math.cos(angle) * r1, y: cy + Math.sin(angle) * r1 })
      }
    } else {
      const innerCount = Math.ceil(count / 2)
      const outerCount = count - innerCount
      for (let i = 0; i < innerCount; i++) {
        const angle = (Math.PI * 2 * i) / innerCount - Math.PI / 2
        positions.push({ x: cx + Math.cos(angle) * (r1 * 0.6), y: cy + Math.sin(angle) * (r1 * 0.6) })
      }
      for (let i = 0; i < outerCount; i++) {
        const angle = (Math.PI * 2 * i) / outerCount - Math.PI / 4
        positions.push({ x: cx + Math.cos(angle) * r1, y: cy + Math.sin(angle) * r1 })
      }
    }
    return positions
  }

  private createNode(template: MeridianNodeTemplate, x: number, y: number, isActivated: boolean, canUnlock: boolean): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const nodeSize = 52

    const haloG = this.add.graphics()
    if (isActivated) {
      haloG.fillStyle(template.color, 0.35)
      haloG.fillCircle(0, 0, nodeSize * 0.9)
      haloG.lineStyle(3, template.color, 0.9)
      haloG.strokeCircle(0, 0, nodeSize * 0.9)
    } else if (canUnlock) {
      haloG.lineStyle(2, template.color, 0.6)
      haloG.strokeCircle(0, 0, nodeSize * 0.8)
    } else {
      haloG.lineStyle(1, 0x546e7a, 0.4)
      haloG.strokeCircle(0, 0, nodeSize * 0.75)
    }

    const coreG = this.add.graphics()
    if (isActivated) {
      coreG.fillStyle(template.color, 0.95)
      coreG.fillCircle(0, 0, nodeSize * 0.55)
      coreG.lineStyle(2, 0xffffff, 0.9)
      coreG.strokeCircle(0, 0, nodeSize * 0.55)
    } else if (canUnlock) {
      coreG.fillStyle(0x000000, 0.8)
      coreG.fillCircle(0, 0, nodeSize * 0.55)
      coreG.lineStyle(2, template.color, 0.7)
      coreG.strokeCircle(0, 0, nodeSize * 0.55)
    } else {
      coreG.fillStyle(0x000000, 0.5)
      coreG.fillCircle(0, 0, nodeSize * 0.5)
      coreG.lineStyle(1, 0x546e7a, 0.3)
      coreG.strokeCircle(0, 0, nodeSize * 0.5)
    }

    const iconColor = isActivated ? '#ffffff' : (canUnlock ? '#' + template.color.toString(16).padStart(6, '0') : '#546e7a')
    const iconText = this.add.text(0, -2, template.icon, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '24px',
      color: iconColor
    }).setOrigin(0.5)

    const nameText = this.add.text(0, nodeSize * 0.75, template.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: isActivated ? '#ffd54f' : (canUnlock ? '#b0bec5' : '#546e7a'),
      fontStyle: 'bold'
    }).setOrigin(0.5)

    container.add([haloG, coreG, iconText, nameText])
    container.setSize(nodeSize, nodeSize + 25)
    container.setData('template', template)
    container.setData('halo', haloG)
    container.setData('core', coreG)

    if (isActivated) {
      this.tweens.add({
        targets: haloG,
        alpha: { from: 0.5, to: 1 },
        scale: { from: 0.95, to: 1.05 },
        duration: 1800 + Math.random() * 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }

    const interactive = canUnlock || isActivated
    if (interactive) {
      container.setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Circle(0, 0, nodeSize * 0.8), hitAreaCallback: Phaser.Geom.Circle.Contains })
      container.on('pointerover', () => {
        this.tweens.add({ targets: container, scale: 1.15, duration: 200 })
      })
      container.on('pointerout', () => {
        this.tweens.add({ targets: container, scale: 1, duration: 200 })
      })
      container.on('pointerdown', () => this.selectNode(template))
    }

    return container
  }

  private selectNode(template: MeridianNodeTemplate): void {
    this.selectedNode = template
    this.updateDetailPanel()
  }

  private createDetailPanel(width: number, height: number): void {
    this.detailPanel = this.add.container(width / 2, height - 120)

    const panelWidth = 900
    const panelHeight = 150

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.85)
    bg.lineStyle(2, 0xba68c8, 0.7)
    this.roundedRect(bg, -panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 14)

    const placeholder = this.add.text(0, 0, '点击经脉节点查看详情并激活', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#78909c'
    }).setOrigin(0.5)

    this.detailPanel.add([bg, placeholder])
    this.detailPanel.setSize(panelWidth, panelHeight)
  }

  private updateDetailPanel(): void {
    this.detailPanel.each((obj: Phaser.GameObjects.GameObject) => { if (obj !== this.detailPanel.first) obj.destroy() })

    const panelW = 900
    const panelH = 150

    if (!this.selectedNode) {
      const placeholder = this.add.text(0, 0, '点击经脉节点查看详情并激活', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#78909c'
      }).setOrigin(0.5)
      this.detailPanel.add(placeholder)
      return
    }

    const t = this.selectedNode
    const nodeData = this.save.meridian.nodes.find((n) => n.templateId === t.id)
    const isActivated = nodeData?.activated || false
    const check = this.meridianManager.canActivateNode(this.save.meridian, t.id, this.player)

    const bg = this.detailPanel.first as Phaser.GameObjects.Graphics
    bg.clear()
    bg.fillStyle(0x000000, 0.85)
    bg.lineStyle(2, t.color, 0.85)
    this.roundedRect(bg, -panelW / 2, -panelH / 2, panelW, panelH, 14)

    const iconBg = this.add.graphics()
    iconBg.fillStyle(t.color, isActivated ? 0.5 : 0.25)
    iconBg.fillCircle(-panelW / 2 + 70, 0, 45)
    iconBg.lineStyle(3, t.color, isActivated ? 1 : 0.7)
    iconBg.strokeCircle(-panelW / 2 + 70, 0, 45)

    const icon = this.add.text(-panelW / 2 + 70, 0, t.icon, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '42px',
      color: '#ffffff'
    }).setOrigin(0.5)

    const titleX = -panelW / 2 + 135
    const name = this.add.text(titleX, -48, `${t.name}  ${isActivated ? '【已激活】' : ''}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '24px',
      color: isActivated ? '#ffd54f' : '#ffffff',
      fontStyle: 'bold'
    })

    const typeNames: Record<string, string> = {
      attack: '攻击', defense: '防御', health: '生命', mana: '灵力',
      crit_rate: '暴击率', crit_damage: '暴击伤害', skill: '技能解锁'
    }
    const typeStr = typeNames[t.type] || t.type
    const typeText = this.add.text(titleX, -20, `类型: ${typeStr}  |  消耗: ✨${t.spiritCost}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '15px',
      color: '#b0bec5'
    })

    const desc = this.add.text(titleX, 5, t.description, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#90a4ae',
      wordWrap: { width: 520 }
    })

    let effectText = ''
    if (t.type === 'skill' && t.unlockSkillId) {
      effectText = `✨ 激活后解锁新技能`
    } else if (t.statValue) {
      const unit = (t.type === 'crit_rate' || t.type === 'crit_damage') ? '%' : ''
      effectText = `属性加成: +${t.statValue}${unit} ${typeStr}`
    }
    const statText = this.add.text(titleX, 38, effectText, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#81c784',
      fontStyle: 'bold'
    })

    if (t.requiredNodes.length > 0) {
      const reqNames = t.requiredNodes
        .map((rid) => {
          const rt = this.meridianManager.getNodeTemplate(rid)
          return rt ? rt.name : rid
        })
        .join('、')
      const reqMet = t.requiredNodes.every((rid) => {
        const n = this.save.meridian.nodes.find((nd) => nd.templateId === rid)
        return n?.activated
      })
      const reqText = this.add.text(titleX, 60, `前置: ${reqNames}`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '13px',
        color: reqMet ? '#81c784' : '#ef5350'
      })
      this.detailPanel.add(reqText)
    }

    this.detailPanel.add([iconBg, icon, name, typeText, desc, statText])

    if (!isActivated) {
      const btnX = panelW / 2 - 85
      const btnW = 150
      const btnH = 52
      const canActivate = check.can

      const btnContainer = this.add.container(btnX, 0)
      const btnBg = this.add.graphics()
      btnBg.fillStyle(canActivate ? t.color : 0x455a64, canActivate ? 0.85 : 0.5)
      btnBg.lineStyle(2, canActivate ? t.color : 0x78909c, 1)
      this.roundedRect(btnBg, -btnW / 2, -btnH / 2, btnW, btnH, 10)

      const btnLabel = this.add.text(0, -11, canActivate ? '激活节点' : '无法激活', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5)

      const btnCost = this.add.text(0, 14,
        canActivate ? `消耗 ✨${t.spiritCost}` : (check.reason.length > 14 ? check.reason.slice(0, 14) + '...' : check.reason),
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '12px',
          color: canActivate ? '#ffd54f' : '#ef5350'
        }).setOrigin(0.5)

      btnContainer.add([btnBg, btnLabel, btnCost])
      btnContainer.setSize(btnW, btnH)

      if (canActivate) {
        btnContainer.setInteractive({ useHandCursor: true })
        btnContainer.on('pointerover', () => this.tweens.add({ targets: btnContainer, scale: 1.08, duration: 150 }))
        btnContainer.on('pointerout', () => this.tweens.add({ targets: btnContainer, scale: 1, duration: 150 }))
        btnContainer.on('pointerdown', () => this.activateNode(t))
      }

      this.detailPanel.add(btnContainer)
    } else {
      const doneText = this.add.text(panelW / 2 - 85, 0, '✓ 已激活', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '24px',
        color: '#81c784',
        fontStyle: 'bold'
      }).setOrigin(0.5)
      this.detailPanel.add(doneText)
    }
  }

  private activateNode(template: MeridianNodeTemplate): void {
    const result = this.meridianManager.activateNode(this.save.meridian, template.id, this.player)

    if (!result.success) {
      this.showToast(result.message, false)
      return
    }

    if (result.unlockedSkill) {
      this.player.skills.push(result.unlockedSkill)
    }

    const permBonus = this.alchemyManager.getPermanentBonus(this.save.alchemy)
    const equipBonus = this.equipmentManager.calculateEquipmentBonus(this.save.equipment)
    const meridBonus = this.meridianManager.calculateMeridianBonus(this.save.meridian)
    this.saveManager.recalcPlayerStats(this.player, undefined, permBonus, equipBonus, meridBonus)

    this.save.player = this.player
    this.saveManager.saveGame(this.save)

    this.cameras.main.flash(300, 255, 215, 0)
    this.showToast(result.message + (result.unlockedSkill ? ` 解锁技能: ${result.unlockedSkill.name}` : ''), true)

    this.updateResourceTexts()
    this.updateRealmInfo()
    this.updateBreakthroughPanel()
    this.refreshMeridianNodes()
    this.updateDetailPanel()
  }

  private showToast(message: string, success: boolean): void {
    const { width } = this.scale
    const toast = this.add.container(width / 2, this.scale.height * 0.4)

    const bg = this.add.graphics()
    const w = Math.min(520, message.length * 18 + 80)
    bg.fillStyle(success ? 0x1a472a : 0x4a1a1a, 0.95)
    bg.lineStyle(2, success ? 0x81c784 : 0xef5350, 1)
    this.roundedRect(bg, -w / 2, -30, w, 60, 12)

    const text = this.add.text(0, 0, message, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: success ? '#81c784' : '#ef5350',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: w - 40 }
    }).setOrigin(0.5)

    toast.add([bg, text])
    toast.setAlpha(0)

    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: this.scale.height * 0.38,
      duration: 300,
      ease: 'Back.easeOut'
    })

    this.time.delayedCall(1800, () => {
      this.tweens.add({
        targets: toast,
        alpha: 0,
        y: this.scale.height * 0.35,
        duration: 300,
        onComplete: () => toast.destroy()
      })
    })
  }

  private updateResourceTexts(): void {
    this.goldText.setText('💰 金币: ' + this.player.gold)
    this.spiritText.setText('✨ 灵气: ' + this.player.spirit)
    const bonus = this.meridianManager.calculateMeridianBonus(this.save.meridian)
    this.playerStatsText.setText(
      `Lv.${this.player.level}  ❤${this.player.maxHealth}  💧${this.player.maxMana}\n` +
      `⚔${this.player.attack}  🛡${this.player.defense}\n` +
      `🎯暴击+${bonus.critRate}%  💥暴伤+${bonus.critDamage}%`
    )
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

  private roundedRect(graphics: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number): void {
    graphics.beginPath()
    graphics.moveTo(x + r, y)
    graphics.lineTo(x + w - r, y)
    graphics.arc(x + w - r, y + r, r, -Math.PI / 2, 0)
    graphics.lineTo(x + w, y + h - r)
    graphics.arc(x + w - r, y + h - r, r, 0, Math.PI / 2)
    graphics.lineTo(x + r, y + h)
    graphics.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI)
    graphics.lineTo(x, y + r)
    graphics.arc(x + r, y + r, r, Math.PI, -Math.PI / 2)
    graphics.closePath()
    graphics.fillPath()
    graphics.strokePath()
  }
}
