import Phaser from 'phaser'
import type { Player, Skill, SkillBranch, ElementType } from '../types'
import { SaveManager } from '../managers/SaveManager'
import { SkillSystem } from '../managers/SkillSystem'
import { ELEMENT_INFO, getElementLabel } from '../data/fiveElementsData'

export class SkillScene extends Phaser.Scene {
  private saveManager = SaveManager.getInstance()
  private player!: Player
  private selectedSkill: Skill | null = null
  private skillCards: Phaser.GameObjects.Container[] = []
  private detailPanel!: Phaser.GameObjects.Container
  private goldText!: Phaser.GameObjects.Text
  private spiritText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text
  private branchPanel: Phaser.GameObjects.Container | null = null
  private detailDamageText!: Phaser.GameObjects.Text
  private detailCooldownText!: Phaser.GameObjects.Text
  private detailManaText!: Phaser.GameObjects.Text
  private detailLevelText!: Phaser.GameObjects.Text
  private upgradeBtn!: Phaser.GameObjects.Container
  private upgradeCostText!: Phaser.GameObjects.Text
  private selectedBranchDisplays: Phaser.GameObjects.Container[] = []
  private unlockHintText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'SkillScene' })
  }

  init(): void {
    const save = this.saveManager.loadGame()!
    this.player = save.player
  }

  create(): void {
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor(0x0a0a15)
    this.createBackground(width, height)

    const title = this.add.text(width / 2, 50, '⚔ 技能修炼', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '40px',
      color: '#ffd54f',
      stroke: '#5d4037',
      strokeThickness: 3
    }).setOrigin(0.5)

    this.levelText = this.add.text(width / 2, 92, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#81c784'
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

    this.updateResourceTexts()
    this.createSkillCards(width, height)
    this.createDetailPanel(width, height)
    this.createBackButton(width, height)

    this.cameras.main.fadeIn(500)
  }

  private createBackground(width: number, height: number): void {
    const particles = this.add.particles(0, 0, 'sword-particle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: { min: 3000, max: 6000 },
      speedY: { min: -10, max: -25 },
      speedX: { min: -3, max: 3 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: [0x4fc3f7, 0xffd54f, 0x81c784],
      quantity: 1,
      frequency: 400
    })

    for (let i = 0; i < 3; i++) {
      const glow = this.add.graphics()
      glow.fillStyle([0x1a237e, 0x004d40, 0x4a148c][i], 0.1)
      glow.fillCircle(
        width * (0.2 + i * 0.3),
        height * (0.3 + Math.random() * 0.4),
        160 + Math.random() * 80
      )
    }
  }

  private updateResourceTexts(): void {
    this.goldText.setText('💰 ' + this.player.gold)
    this.spiritText.setText('✨ ' + this.player.spirit)
    this.levelText.setText(`角色等级: Lv.${this.player.level}  |  已解锁 ${SkillSystem.getUnlockedSkills(this.player).length}/${this.player.skills.length} 个技能`)
  }

  private createSkillCards(width: number, height: number): void {
    const unlockedSkills = SkillSystem.getUnlockedSkills(this.player)
    const cardWidth = 180
    const cardHeight = 260
    const spacing = 20
    const totalWidth = unlockedSkills.length * cardWidth + (unlockedSkills.length - 1) * spacing
    const startX = (width - totalWidth) / 2 + cardWidth / 2
    const y = height * 0.38

    unlockedSkills.forEach((skill, index) => {
      const x = startX + index * (cardWidth + spacing)
      const card = this.createSkillCard(x, y, cardWidth, cardHeight, skill, index)
      this.skillCards.push(card)

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

    if (unlockedSkills.length > 0) {
      this.selectSkill(unlockedSkills[0])
    }
  }

  private createSkillCard(x: number, y: number, cardWidth: number, cardHeight: number, skill: Skill, index: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const effectiveStats = SkillSystem.getEffectiveStats(skill)
    const selectedBranches = SkillSystem.getSelectedBranches(skill)

    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a2e, 0.9)
    bg.lineStyle(2, skill.color, 0.8)
    this.roundedRect(bg, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12)

    const headerBg = this.add.graphics()
    headerBg.fillStyle(skill.color, 0.15)
    this.roundedRect(headerBg, -cardWidth / 2 + 4, -cardHeight / 2 + 4, cardWidth - 8, 40, 8)

    const levelBadge = this.add.graphics()
    levelBadge.fillStyle(0xffd54f, 0.95)
    levelBadge.fillCircle(-cardWidth / 2 + 18, -cardHeight / 2 + 20, 14)
    const levelNum = this.add.text(-cardWidth / 2 + 18, -cardHeight / 2 + 20, skill.level.toString(), {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#5d4037',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const iconText = this.add.text(0, -cardHeight / 2 + 60, skill.icon, {
      fontFamily: 'serif',
      fontSize: '42px',
      color: '#' + skill.color.toString(16).padStart(6, '0')
    }).setOrigin(0.5)

    const nameText = this.add.text(0, -cardHeight / 2 + 95, skill.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    if (skill.element && skill.element !== 'none') {
      const elementLabel = this.add.text(0, -cardHeight / 2 + 115, ELEMENT_INFO[skill.element].icon + ' ' + getElementLabel(skill.element), {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#' + ELEMENT_INFO[skill.element].color.toString(16).padStart(6, '0')
      }).setOrigin(0.5)
      container.add(elementLabel)
    }

    const divider = this.add.graphics()
    divider.lineStyle(1, 0xffffff, 0.1)
    divider.moveTo(-cardWidth / 2 + 15, -cardHeight / 2 + 130)
    divider.lineTo(cardWidth / 2 - 15, -cardHeight / 2 + 130)
    divider.strokePath()

    const statY = -cardHeight / 2 + 145
    const statSpacing = 26

    const dmgLabel = this.add.text(-cardWidth / 2 + 20, statY, '伤害', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: '#90a4ae'
    })
    const dmgValue = this.add.text(cardWidth / 2 - 20, statY, effectiveStats.damage.toString(), {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: '#ff8a65',
      fontStyle: 'bold'
    }).setOrigin(1, 0)

    const cdLabel = this.add.text(-cardWidth / 2 + 20, statY + statSpacing, '冷却', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: '#90a4ae'
    })
    const cdValue = this.add.text(cardWidth / 2 - 20, statY + statSpacing, effectiveStats.cooldown + '回合', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: '#81c784',
      fontStyle: 'bold'
    }).setOrigin(1, 0)

    const manaLabel = this.add.text(-cardWidth / 2 + 20, statY + statSpacing * 2, '灵气', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: '#90a4ae'
    })
    const manaValue = this.add.text(cardWidth / 2 - 20, statY + statSpacing * 2, effectiveStats.manaCost.toString(), {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: '#4fc3f7',
      fontStyle: 'bold'
    }).setOrigin(1, 0)

    const branchY = statY + statSpacing * 3 + 5
    const branchLabel = this.add.text(-cardWidth / 2 + 20, branchY, '分支', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: '#90a4ae'
    })

    if (selectedBranches.length > 0) {
      const branchIcons = selectedBranches.map(b => b.icon).join(' ')
      const branchValue = this.add.text(cardWidth / 2 - 20, branchY, branchIcons, {
        fontFamily: 'serif',
        fontSize: '16px'
      }).setOrigin(1, 0)
      container.add(branchValue)
    } else {
      const branchValue = this.add.text(cardWidth / 2 - 20, branchY, '未选择', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#78909c'
      }).setOrigin(1, 0)
      container.add(branchValue)
    }

    const expBarBg = this.add.graphics()
    expBarBg.fillStyle(0x000000, 0.5)
    this.roundedRect(expBarBg, -cardWidth / 2 + 20, cardHeight / 2 - 35, cardWidth - 40, 18, 6)

    const expRatio = skill.exp / skill.expToNext
    const expBar = this.add.graphics()
    expBar.fillStyle(0xffd54f, 0.8)
    this.roundedRect(expBar, -cardWidth / 2 + 20, cardHeight / 2 - 35, (cardWidth - 40) * Math.min(1, expRatio), 18, 6)

    const expText = this.add.text(0, cardHeight / 2 - 26, `${skill.exp}/${skill.expToNext} EXP`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const maxLevelText = this.add.text(0, cardHeight / 2 - 10, skill.level >= skill.maxLevel ? '✦ 已达最高等级 ✦' : '最高 Lv.' + skill.maxLevel, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '11px',
      color: skill.level >= skill.maxLevel ? '#ffd54f' : '#78909c'
    }).setOrigin(0.5)

    container.add([bg, headerBg, levelBadge, levelNum, iconText, nameText, divider,
      dmgLabel, dmgValue, cdLabel, cdValue, manaLabel, manaValue, branchLabel,
      expBarBg, expBar, expText, maxLevelText])

    container.setSize(cardWidth, cardHeight)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.05, y: y - 5, duration: 200 })
    })
    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, y: y, duration: 200 })
    })
    container.on('pointerdown', () => {
      this.selectSkill(skill)
    })

    return container
  }

  private selectSkill(skill: Skill): void {
    this.selectedSkill = skill
    this.updateDetailPanel()
    this.highlightSelectedCard()
  }

  private highlightSelectedCard(): void {
    const unlockedSkills = SkillSystem.getUnlockedSkills(this.player)
    this.skillCards.forEach((card, index) => {
      const skill = unlockedSkills[index]
      if (!skill) return
      const isSelected = this.selectedSkill && skill.id === this.selectedSkill.id
      this.tweens.add({
        targets: card,
        scale: isSelected ? 1.08 : 1,
        alpha: isSelected ? 1 : 0.7,
        duration: 200
      })
    })
  }

  private createDetailPanel(width: number, height: number): void {
    const panelWidth = 560
    const panelHeight = 200
    const panelX = width / 2
    const panelY = height * 0.75

    this.detailPanel = this.add.container(panelX, panelY)

    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a2e, 0.95)
    bg.lineStyle(2, 0xffd54f, 0.6)
    this.roundedRect(bg, -panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16)

    const titleText = this.add.text(-panelWidth / 2 + 25, -panelHeight / 2 + 25, '技能详情', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#ffd54f',
      fontStyle: 'bold'
    })

    const statX = -panelWidth / 2 + 25
    const statY = -panelHeight / 2 + 60
    const statSpacing = 28

    const detailLevelLabel = this.add.text(statX, statY, '等级', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '15px',
      color: '#90a4ae'
    })
    this.detailLevelText = this.add.text(statX + 70, statY, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '15px',
      color: '#ffd54f',
      fontStyle: 'bold'
    })

    const detailDmgLabel = this.add.text(statX + 180, statY, '伤害', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '15px',
      color: '#90a4ae'
    })
    this.detailDamageText = this.add.text(statX + 230, statY, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '15px',
      color: '#ff8a65',
      fontStyle: 'bold'
    })

    const detailCdLabel = this.add.text(statX + 330, statY, '冷却', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '15px',
      color: '#90a4ae'
    })
    this.detailCooldownText = this.add.text(statX + 380, statY, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '15px',
      color: '#81c784',
      fontStyle: 'bold'
    })

    const detailManaLabel = this.add.text(statX + 470, statY, '灵气', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '15px',
      color: '#90a4ae'
    })
    this.detailManaText = this.add.text(statX + 520, statY, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '15px',
      color: '#4fc3f7',
      fontStyle: 'bold'
    })

    const branchTitleLabel = this.add.text(statX, statY + statSpacing + 5, '已选分支', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '15px',
      color: '#90a4ae'
    })

    this.unlockHintText = this.add.text(statX + 100, statY + statSpacing + 5, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: '#78909c'
    })

    this.detailPanel.add([bg, titleText,
      detailLevelLabel, this.detailLevelText,
      detailDmgLabel, this.detailDamageText,
      detailCdLabel, this.detailCooldownText,
      detailManaLabel, this.detailManaText,
      branchTitleLabel, this.unlockHintText
    ])

    const btnX = panelWidth / 2 - 130
    const btnY = panelHeight / 2 - 45
    this.upgradeBtn = this.createUpgradeButton(btnX, btnY, 160, 50)
    this.detailPanel.add(this.upgradeBtn)

    this.upgradeCostText = this.add.text(btnX, btnY + 38, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: '#ffb74d'
    }).setOrigin(0.5)
    this.detailPanel.add(this.upgradeCostText)

    this.updateDetailPanel()
  }

  private createUpgradeButton(x: number, y: number, btnWidth: number, btnHeight: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0xffd54f, 0.9)
    this.roundedRect(bg, -btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10)

    const text = this.add.text(0, 0, '升级技能', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#5d4037',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(btnWidth, btnHeight)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.05, duration: 150 })
    })
    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 150 })
    })
    container.on('pointerdown', () => {
      this.handleUpgrade()
    })

    return container
  }

  private updateDetailPanel(): void {
    if (!this.selectedSkill) return

    const skill = this.selectedSkill
    const effectiveStats = SkillSystem.getEffectiveStats(skill)
    const cost = SkillSystem.getUpgradeCost(skill)
    const canAfford = SkillSystem.canAffordUpgrade(this.player, skill)
    const isMaxLevel = skill.level >= skill.maxLevel

    this.detailLevelText.setText(`Lv.${skill.level} / ${skill.maxLevel}`)
    this.detailDamageText.setText(effectiveStats.damage.toString())
    this.detailCooldownText.setText(effectiveStats.cooldown + '回合')
    this.detailManaText.setText(effectiveStats.manaCost.toString())

    this.selectedBranchDisplays.forEach(d => d.destroy())
    this.selectedBranchDisplays = []

    const selectedBranches = SkillSystem.getSelectedBranches(skill)
    const availableBranches = SkillSystem.getAvailableBranches(skill)

    if (selectedBranches.length === 0 && availableBranches.length === 0) {
      this.unlockHintText.setText(`等级达到 ${skill.branchUnlockedLevels.join('、')} 级可选择分支`)
    } else if (availableBranches.length > 0) {
      this.unlockHintText.setText('⚡ 有可选分支！')
      this.unlockHintText.setColor('#ffd54f')
    } else {
      this.unlockHintText.setText(selectedBranches.map(b => b.icon + ' ' + b.name).join('  '))
      this.unlockHintText.setColor('#81c784')
    }

    const upgradeBtnBg = this.upgradeBtn.list[0] as Phaser.GameObjects.Graphics
    const upgradeBtnText = this.upgradeBtn.list[1] as Phaser.GameObjects.Text

    if (isMaxLevel) {
      upgradeBtnBg.clear()
      upgradeBtnBg.fillStyle(0x78909c, 0.6)
      this.roundedRect(upgradeBtnBg, -80, -25, 160, 50, 10)
      upgradeBtnText.setText('已满级')
      upgradeBtnText.setColor('#ffffff')
      this.upgradeCostText.setText('')
      this.upgradeBtn.removeInteractive()
    } else {
      upgradeBtnBg.clear()
      if (canAfford) {
        upgradeBtnBg.fillStyle(0xffd54f, 0.9)
        upgradeBtnText.setColor('#5d4037')
        this.upgradeBtn.setInteractive({ useHandCursor: true })
      } else {
        upgradeBtnBg.fillStyle(0x78909c, 0.6)
        upgradeBtnText.setColor('#ffffff')
        this.upgradeBtn.removeInteractive()
      }
      this.roundedRect(upgradeBtnBg, -80, -25, 160, 50, 10)
      upgradeBtnText.setText('升级技能')
      this.upgradeCostText.setText(`💰${cost.gold}  ✨${cost.spirit}`)
      this.upgradeCostText.setColor(canAfford ? '#ffb74d' : '#ef5350')
    }
  }

  private handleUpgrade(): void {
    if (!this.selectedSkill) return
    const skill = this.selectedSkill

    const result = SkillSystem.upgradeSkill(this.player, skill)
    if (!result.success) {
      this.showFloatingText(result.message, 0xef5350)
      return
    }

    this.saveManager.saveGame(this.saveManager.loadGame()!)

    this.showFloatingText(result.message, 0xffd54f)
    this.updateResourceTexts()
    this.refreshSkillCards()
    this.updateDetailPanel()

    this.cameras.main.flash(200, 255, 213, 79)

    if (result.branchesAvailable && result.branchesAvailable.length > 0) {
      this.time.delayedCall(500, () => {
        this.showBranchSelectPopup(skill, result.branchesAvailable!)
      })
    }
  }

  private showBranchSelectPopup(skill: Skill, branches: SkillBranch[]): void {
    if (this.branchPanel) {
      this.branchPanel.destroy()
    }

    const { width, height } = this.scale
    this.branchPanel = this.add.container(width / 2, height / 2)

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.75)
    overlay.fillRect(0, 0, width, height)
    overlay.setPosition(-width / 2, -height / 2)

    const panelWidth = 500
    const panelHeight = 320

    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a2e, 0.98)
    bg.lineStyle(3, skill.color, 0.9)
    this.roundedRect(bg, -panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16)

    const title = this.add.text(0, -panelHeight / 2 + 35, '✨ 选择分支强化 ✨', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: '#' + skill.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    const desc = this.add.text(0, -panelHeight / 2 + 70, `${skill.name} 升级到 Lv.${skill.level}，可选择一个分支方向`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#b0bec5'
    }).setOrigin(0.5)

    this.branchPanel.add([overlay, bg, title, desc])

    const branchSpacing = 160
    const branchY = 20

    branches.forEach((branch, index) => {
      const x = (index - (branches.length - 1) / 2) * branchSpacing
      const branchCard = this.createBranchCard(x, branchY, 140, 200, branch, skill)
      this.branchPanel!.add(branchCard)
    })

    this.branchPanel.setAlpha(0)
    this.branchPanel.setScale(0.8)
    this.tweens.add({
      targets: this.branchPanel,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut'
    })
  }

  private createBranchCard(x: number, y: number, cardWidth: number, cardHeight: number, branch: SkillBranch, skill: Skill): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0x2d2d44, 0.9)
    bg.lineStyle(2, branch.color, 0.8)
    this.roundedRect(bg, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12)

    const iconBg = this.add.graphics()
    iconBg.fillStyle(branch.color, 0.2)
    iconBg.fillCircle(0, -cardHeight / 2 + 45, 30)

    const iconText = this.add.text(0, -cardHeight / 2 + 45, branch.icon, {
      fontFamily: 'serif',
      fontSize: '28px'
    }).setOrigin(0.5)

    const nameText = this.add.text(0, -cardHeight / 2 + 90, branch.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#' + branch.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const descText = this.add.text(0, -cardHeight / 2 + 115, branch.description, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: '#b0bec5',
      align: 'center',
      wordWrap: { width: cardWidth - 20 }
    }).setOrigin(0.5, 0)

    const statY = -10
    const statSpacing = 22

    if (branch.damageBonus > 0) {
      const label = this.add.text(-cardWidth / 2 + 15, statY, '伤害加成', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#90a4ae'
      })
      const value = this.add.text(cardWidth / 2 - 15, statY, '+' + Math.floor(branch.damageBonus * 100) + '%', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#ff8a65',
        fontStyle: 'bold'
      }).setOrigin(1, 0)
      container.add([label, value])
    }

    if (branch.cooldownReduction > 0) {
      const label = this.add.text(-cardWidth / 2 + 15, statY + statSpacing, '冷却缩减', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#90a4ae'
      })
      const value = this.add.text(cardWidth / 2 - 15, statY + statSpacing, '-' + Math.floor(branch.cooldownReduction * 100) + '%', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#81c784',
        fontStyle: 'bold'
      }).setOrigin(1, 0)
      container.add([label, value])
    }

    if (branch.manaCostReduction > 0) {
      const label = this.add.text(-cardWidth / 2 + 15, statY + statSpacing * 2, '灵气节省', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#90a4ae'
      })
      const value = this.add.text(cardWidth / 2 - 15, statY + statSpacing * 2, '-' + Math.floor(branch.manaCostReduction * 100) + '%', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#4fc3f7',
        fontStyle: 'bold'
      }).setOrigin(1, 0)
      container.add([label, value])
    }

    const selectBtn = this.add.graphics()
    selectBtn.fillStyle(branch.color, 0.85)
    this.roundedRect(selectBtn, -50, cardHeight / 2 - 40, 100, 32, 8)
    const selectText = this.add.text(0, cardHeight / 2 - 24, '选择', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    container.add([bg, iconBg, iconText, nameText, descText, selectBtn, selectText])

    container.setSize(cardWidth, cardHeight)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.05, duration: 150 })
    })
    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 150 })
    })
    container.on('pointerdown', () => {
      this.selectBranch(skill, branch.id)
    })

    return container
  }

  private selectBranch(skill: Skill, branchId: string): void {
    const result = SkillSystem.selectBranch(skill, branchId)
    if (!result.success) {
      this.showFloatingText(result.message, 0xef5350)
      return
    }

    const save = this.saveManager.loadGame()!
    this.saveManager.saveGame(save)

    this.showFloatingText(result.message, 0x81c784)

    if (this.branchPanel) {
      this.tweens.add({
        targets: this.branchPanel,
        alpha: 0,
        scale: 0.8,
        duration: 300,
        ease: 'Back.easeIn',
        onComplete: () => {
          this.branchPanel?.destroy()
          this.branchPanel = null
        }
      })
    }

    this.cameras.main.flash(300, 129, 199, 132)
    this.refreshSkillCards()
    this.updateDetailPanel()
  }

  private refreshSkillCards(): void {
    this.skillCards.forEach(card => card.destroy())
    this.skillCards = []

    const { width, height } = this.scale
    const unlockedSkills = SkillSystem.getUnlockedSkills(this.player)
    const cardWidth = 180
    const cardHeight = 260
    const spacing = 20
    const totalWidth = unlockedSkills.length * cardWidth + (unlockedSkills.length - 1) * spacing
    const startX = (width - totalWidth) / 2 + cardWidth / 2
    const y = height * 0.38

    unlockedSkills.forEach((skill, index) => {
      const x = startX + index * (cardWidth + spacing)
      const card = this.createSkillCard(x, y, cardWidth, cardHeight, skill, index)
      this.skillCards.push(card)
    })

    this.highlightSelectedCard()
  }

  private showFloatingText(message: string, color: number): void {
    const { width, height } = this.scale
    const text = this.add.text(width / 2, height * 0.5, message, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#' + color.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)
    text.setDepth(1000)

    this.tweens.add({
      targets: text,
      y: height * 0.35,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.5, to: 1.2 },
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(800, () => {
          this.tweens.add({
            targets: text,
            alpha: 0,
            y: height * 0.2,
            duration: 400,
            onComplete: () => text.destroy()
          })
        })
      }
    })
  }

  private createBackButton(width: number, height: number): void {
    const btn = this.add.container(60, height - 30)
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.6)
    bg.lineStyle(2, 0x78909c, 0.8)
    this.roundedRect(bg, -45, -20, 90, 40, 10)

    const text = this.add.text(0, 0, '← 返回', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5)

    btn.add([bg, text])
    btn.setSize(90, 40)
    btn.setInteractive({ useHandCursor: true })

    btn.on('pointerover', () => {
      this.tweens.add({ targets: btn, scale: 1.1, duration: 150 })
    })
    btn.on('pointerout', () => {
      this.tweens.add({ targets: btn, scale: 1, duration: 150 })
    })
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300)
      this.time.delayedCall(300, () => {
        this.scene.start('MenuScene')
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
