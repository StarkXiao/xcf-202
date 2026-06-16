import Phaser from 'phaser'
import type { GameSave, EncounterEvent, EncounterDialogue, EncounterChoice, EncounterReward } from '../types'
import { SaveManager } from '../managers/SaveManager'
import { EncounterManager } from '../managers/EncounterManager'
import { ENCOUNTER_RARITY_COLORS, DAILY_ENCOUNTER_LIMIT } from '../data/encounterData'

type EncounterPhase = 'list' | 'dialogue' | 'choice' | 'result'

export class EncounterScene extends Phaser.Scene {
  private save!: GameSave
  private saveManager = SaveManager.getInstance()
  private encounterManager = EncounterManager.getInstance()

  private phase: EncounterPhase = 'list'
  private currentEvent: EncounterEvent | null = null
  private currentDialogueIndex = 0
  private currentDialogueList: EncounterDialogue[] = []
  private resultText = ''
  private resultRewards: EncounterReward[] = []
  private resultSuccess = false
  private resultMessages: string[] = []

  private container!: Phaser.GameObjects.Container
  private overlay!: Phaser.GameObjects.Graphics

  constructor() {
    super({ key: 'EncounterScene' })
  }

  init(): void {
    const existingSave = this.saveManager.loadGame()
    this.save = existingSave || this.saveManager.createNewSave()
  }

  create(): void {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor(0x0a0a15)

    this.overlay = this.add.graphics()
    this.container = this.add.container(0, 0)

    this.createBackground(width, height)
    this.createHeader(width, height)
    this.showEncounterList(width, height)
    this.createBackButton(width, height)

    this.cameras.main.fadeIn(500)
  }

  private createBackground(width: number, height: number): void {
    const stars = this.add.graphics()
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const size = Math.random() * 1.5 + 0.5
      const alpha = Math.random() * 0.6 + 0.2
      stars.fillStyle(0xffffff, alpha)
      stars.fillCircle(x, y, size)
    }

    this.tweens.add({
      targets: stars,
      alpha: { from: 0.5, to: 1 },
      duration: 4000,
      yoyo: true,
      repeat: -1
    })

    const nebulaColors = [0x1a237e, 0x0d47a1, 0x004d40]
    for (let i = 0; i < 3; i++) {
      const nebula = this.add.graphics()
      nebula.fillStyle(nebulaColors[i], 0.1)
      nebula.fillCircle(
        (width / 3) * i + width / 6,
        height * (0.4 + Math.random() * 0.3),
        150 + Math.random() * 80
      )
      this.tweens.add({
        targets: nebula,
        x: { from: 0, to: i % 2 === 0 ? 20 : -20 },
        duration: 5000 + i * 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }
  }

  private createHeader(width: number, height: number): void {
    const header = this.add.graphics()
    header.fillStyle(0x000000, 0.6)
    header.fillRect(0, 0, width, 80)
    header.lineStyle(2, 0xffd54f, 0.6)
    header.lineBetween(0, 80, width, 80)

    const title = this.add.text(width / 2, 25, '✨ 仙缘奇遇 ✨', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '32px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.03 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    const remaining = this.encounterManager.getRemainingEncounters(this.save.encounter)
    const infoText = this.add.text(width / 2, 58, `今日剩余奇遇: ${remaining}/${DAILY_ENCOUNTER_LIMIT}  |  已完成: ${this.encounterManager.getCompletedEncountersCount(this.save.encounter)}/${this.encounterManager.getTotalEncountersCount()}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#81c784'
    }).setOrigin(0.5)
  }

  private showEncounterList(width: number, height: number): void {
    this.phase = 'list'
    this.clearContainer()

    const available = this.encounterManager.getAvailableEncounters(this.save.encounter, this.save.highestStage)
    const canEncounter = this.encounterManager.canEncounter(this.save.encounter)

    if (!canEncounter) {
      this.showDailyLimitReached(width, height)
      return
    }

    if (available.length === 0) {
      const noEvent = this.add.text(width / 2, height / 2, '暂无可用奇遇\n请提升关卡进度以解锁更多奇遇', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '24px',
        color: '#b0bec5',
        align: 'center',
        lineSpacing: 8
      }).setOrigin(0.5)
      this.container.add(noEvent)
      return
    }

    const listTitle = this.add.text(width / 2, 110, '— 选择奇遇探索 —', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#b0bec5'
    }).setOrigin(0.5)
    this.container.add(listTitle)

    const scrollY = 140
    const cardHeight = 90
    const spacing = 10
    const startY = scrollY

    available.forEach((event, index) => {
      const y = startY + index * (cardHeight + spacing)
      const card = this.createEncounterCard(width / 2, y, width * 0.85, cardHeight, event, index)
      this.container.add(card)
    })

    const randomBtn = this.createButton(
      width / 2,
      startY + available.length * (cardHeight + spacing) + 40,
      '🎲 随机探索',
      0xffd54f,
      () => this.startRandomEncounter()
    )
    this.container.add(randomBtn)

    if (available.length > 0) {
      randomBtn.setAlpha(0)
      this.tweens.add({
        targets: randomBtn,
        alpha: 1,
        duration: 600,
        delay: available.length * 100 + 200
      })
    }
  }

  private createEncounterCard(
    x: number, y: number, cardWidth: number, cardHeight: number, event: EncounterEvent, cardIndex: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const rarityColor = ENCOUNTER_RARITY_COLORS[event.rarity] || 0x78909c

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.65)
    bg.lineStyle(2, rarityColor, 0.7)
    this.roundedRect(bg, -cardWidth / 2, 0, cardWidth, cardHeight, 10)
    container.add(bg)

    const leftBar = this.add.graphics()
    leftBar.fillStyle(rarityColor, 0.8)
    leftBar.fillRect(-cardWidth / 2, 4, 5, cardHeight - 8)
    container.add(leftBar)

    const icon = this.add.text(-cardWidth / 2 + 35, cardHeight / 2, event.icon, {
      fontSize: '36px'
    }).setOrigin(0.5)
    container.add(icon)

    const nameText = this.add.text(-cardWidth / 2 + 70, 12, event.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#' + rarityColor.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    })
    container.add(nameText)

    const rarityLabels: Record<string, string> = { common: '凡缘', rare: '仙缘', epic: '天缘', legendary: '神缘' }
    const rarityTag = this.add.text(-cardWidth / 2 + 70 + nameText.width + 10, 16, rarityLabels[event.rarity] || '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: '#' + rarityColor.toString(16).padStart(6, '0')
    })
    container.add(rarityTag)

    const descText = this.add.text(-cardWidth / 2 + 70, 38, event.description, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#b0bec5'
    })
    container.add(descText)

    const stageLabel = this.add.text(-cardWidth / 2 + 70, 62, `需要关卡: ${event.requiredStage}  ${event.isRepeatable ? '🔄 可重复' : '⚡ 一次性'}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: '#78909c'
    })
    container.add(stageLabel)

    container.setSize(cardWidth, cardHeight)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.02, duration: 150 })
      bg.clear()
      bg.fillStyle(rarityColor, 0.15)
      bg.lineStyle(2, rarityColor, 1)
      this.roundedRect(bg, -cardWidth / 2, 0, cardWidth, cardHeight, 10)
    })

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 150 })
      bg.clear()
      bg.fillStyle(0x000000, 0.65)
      bg.lineStyle(2, rarityColor, 0.7)
      this.roundedRect(bg, -cardWidth / 2, 0, cardWidth, cardHeight, 10)
    })

    container.on('pointerdown', () => {
      this.startEncounter(event)
    })

    container.setAlpha(0)
    this.tweens.add({
      targets: container,
      alpha: 1,
      y: y,
      duration: 500,
      delay: cardIndex * 100,
      ease: 'Back.easeOut'
    })

    return container
  }

  private showDailyLimitReached(width: number, height: number): void {
    const panel = this.add.graphics()
    panel.fillStyle(0x1a1a2e, 0.9)
    panel.lineStyle(2, 0xef5350, 0.8)
    this.roundedRect(panel, width / 2 - 250, height / 2 - 80, 500, 160, 16)
    this.container.add(panel)

    const title = this.add.text(width / 2, height / 2 - 40, '😴 今日奇遇已尽', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.container.add(title)

    const desc = this.add.text(width / 2, height / 2 + 10, `今日已完成 ${DAILY_ENCOUNTER_LIMIT} 次奇遇探索\n明日再来，仙缘自有天定`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#b0bec5',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5)
    this.container.add(desc)

    const backBtn = this.createButton(width / 2, height / 2 + 55, '返回', 0x78909c, () => this.goBack())
    this.container.add(backBtn)
  }

  private startEncounter(event: EncounterEvent): void {
    this.currentEvent = event
    this.currentDialogueList = event.dialogues
    this.currentDialogueIndex = 0
    this.showDialogue()
  }

  private startRandomEncounter(): void {
    const event = this.encounterManager.rollRandomEncounter(this.save.encounter, this.save.highestStage)
    if (!event) {
      this.showMessage('暂无可用奇遇')
      return
    }
    this.startEncounter(event)
  }

  private showDialogue(): void {
    this.phase = 'dialogue'
    this.clearContainer()

    const { width, height } = this.scale
    const event = this.currentEvent!
    const dialogue = this.currentDialogueList[this.currentDialogueIndex]

    const panelWidth = width * 0.8
    const panelHeight = 300
    const panelX = width / 2
    const panelY = height / 2 - 20

    const eventTitle = this.add.text(width / 2, 110, `${event.icon} ${event.name}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: '#' + event.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.container.add(eventTitle)

    const dialoguePanel = this.add.graphics()
    dialoguePanel.fillStyle(0x0a0a20, 0.92)
    dialoguePanel.lineStyle(2, event.color, 0.6)
    this.roundedRect(dialoguePanel, panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 16)
    this.container.add(dialoguePanel)

    const speakerColor = '#' + dialogue.color.toString(16).padStart(6, '0')
    const speakerText = this.add.text(panelX - panelWidth / 2 + 30, panelY - panelHeight / 2 + 25, `【${dialogue.speaker}】`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: speakerColor,
      fontStyle: 'bold'
    })
    this.container.add(speakerText)

    const contentText = this.add.text(panelX - panelWidth / 2 + 30, panelY - panelHeight / 2 + 60, dialogue.text, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#e0e0e0',
      wordWrap: { width: panelWidth - 60 },
      lineSpacing: 8
    })
    this.container.add(contentText)

    const progressText = this.add.text(panelX + panelWidth / 2 - 30, panelY + panelHeight / 2 - 30, `${this.currentDialogueIndex + 1}/${this.currentDialogueList.length}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#78909c'
    }).setOrigin(1, 0)
    this.container.add(progressText)

    const isLastDialogue = this.currentDialogueIndex >= this.currentDialogueList.length - 1
    const nextLabel = isLastDialogue ? '做出选择 ▶' : '继续 ▶'
    const nextBtn = this.createButton(panelX, panelY + panelHeight / 2 + 40, nextLabel, event.color, () => {
      if (isLastDialogue) {
        this.showChoices()
      } else {
        this.currentDialogueIndex++
        this.showDialogue()
      }
    })
    this.container.add(nextBtn)

    this.container.setAlpha(0)
    this.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 400,
      ease: 'Quad.easeOut'
    })

    if (dialogue.speaker !== '旁白') {
      this.createDialogueParticle(width / 2, panelY - panelHeight / 2 - 30, dialogue.color)
    }
  }

  private createDialogueParticle(x: number, y: number, color: number): void {
    for (let i = 0; i < 6; i++) {
      const p = this.add.circle(x + (Math.random() - 0.5) * 100, y, 3, color, 0.6)
      this.container.add(p)
      this.tweens.add({
        targets: p,
        y: y - 30 - Math.random() * 20,
        alpha: 0,
        duration: 800 + Math.random() * 400,
        delay: i * 100,
        onComplete: () => p.destroy()
      })
    }
  }

  private showChoices(): void {
    this.phase = 'choice'
    this.clearContainer()

    const { width, height } = this.scale
    const event = this.currentEvent!

    const title = this.add.text(width / 2, 110, '⚡ 命运抉择 ⚡', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.container.add(title)

    const subtitle = this.add.text(width / 2, 150, `—— ${event.name} ——`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#' + event.color.toString(16).padStart(6, '0')
    }).setOrigin(0.5)
    this.container.add(subtitle)

    event.choices.forEach((choice, index) => {
      const y = 200 + index * 180
      const choiceCard = this.createChoiceCard(width / 2, y, width * 0.8, 160, choice, event.color, index)
      this.container.add(choiceCard)
    })
  }

  private createChoiceCard(
    x: number, y: number, cardWidth: number, cardHeight: number,
    choice: EncounterChoice, themeColor: number, index: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a20, 0.85)
    bg.lineStyle(2, themeColor, 0.5)
    this.roundedRect(bg, -cardWidth / 2, 0, cardWidth, cardHeight, 12)
    container.add(bg)

    const choiceText = this.add.text(-cardWidth / 2 + 25, 15, choice.text, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    container.add(choiceText)

    const ratePercent = Math.floor(choice.successRate * 100)
    const rateColor = ratePercent >= 70 ? '#81c784' : ratePercent >= 40 ? '#ffd54f' : '#ef5350'
    const rateText = this.add.text(-cardWidth / 2 + 25 + choiceText.width + 15, 20, `成功率 ${ratePercent}%`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '15px',
      color: rateColor
    })
    container.add(rateText)

    const successRewards = this.formatRewards(choice.rewards)
    const rewardText = this.add.text(-cardWidth / 2 + 25, 48, `✅ 成功: ${successRewards}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#81c784',
      wordWrap: { width: cardWidth - 50 }
    })
    container.add(rewardText)

    if (choice.failRewards.length > 0) {
      const failRewards = this.formatRewards(choice.failRewards)
      const failText = this.add.text(-cardWidth / 2 + 25, 75, `❌ 失败: ${failRewards}`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '14px',
        color: '#ef5350',
        wordWrap: { width: cardWidth - 50 }
      })
      container.add(failText)
    }

    const confirmBtn = this.createButton(0, cardHeight - 30, '选择此路', themeColor, () => {
      this.resolveEncounter(choice)
    })
    confirmBtn.setScale(0.8)
    container.add(confirmBtn)

    container.setSize(cardWidth, cardHeight)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.02, duration: 150 })
      bg.clear()
      bg.fillStyle(themeColor, 0.1)
      bg.lineStyle(2, themeColor, 0.9)
      this.roundedRect(bg, -cardWidth / 2, 0, cardWidth, cardHeight, 12)
    })

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 150 })
      bg.clear()
      bg.fillStyle(0x0a0a20, 0.85)
      bg.lineStyle(2, themeColor, 0.5)
      this.roundedRect(bg, -cardWidth / 2, 0, cardWidth, cardHeight, 12)
    })

    container.setAlpha(0)
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 500,
      delay: index * 200,
      ease: 'Quad.easeOut'
    })

    return container
  }

  private formatRewards(rewards: EncounterReward[]): string {
    return rewards.map(r => {
      const labels: Record<string, string> = {
        gold: '金币', spirit: '灵气', exp: '经验',
        attack: '攻击力', defense: '防御力',
        maxHealth: '生命上限', maxMana: '灵力上限'
      }
      const prefix = r.value >= 0 ? '+' : ''
      return `${labels[r.type] || r.type}${prefix}${r.value}`
    }).join('  ')
  }

  private resolveEncounter(choice: EncounterChoice): void {
    const result = this.encounterManager.resolveChoice(choice)
    this.resultSuccess = result.success
    this.resultRewards = result.rewards
    this.resultText = result.text
    this.resultMessages = this.encounterManager.applyRewards(this.save.player, result.rewards)

    const event = this.currentEvent!
    this.encounterManager.completeEncounter(this.save.encounter, event.id)

    if (result.rewards.some(r => r.type === 'exp' && r.value > 0)) {
      const expReward = result.rewards.find(r => r.type === 'exp')
      if (expReward) {
        const permBonus = this.save.alchemy?.permanentBonus
        this.saveManager.addExp(this.save.player, expReward.value, permBonus)
      }
    }

    this.saveManager.saveGame(this.save)
    this.showResult()
  }

  private showResult(): void {
    this.phase = 'result'
    this.clearContainer()

    const { width, height } = this.scale
    const event = this.currentEvent!

    const resultColor = this.resultSuccess ? 0x81c784 : 0xef5350
    const resultLabel = this.resultSuccess ? '✨ 奇遇成功 ✨' : '💨 奇遇失败 💨'

    const resultTitle = this.add.text(width / 2, 120, resultLabel, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '36px',
      color: '#' + resultColor.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.container.add(resultTitle)

    const eventName = this.add.text(width / 2, 165, `${event.icon} ${event.name}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#' + event.color.toString(16).padStart(6, '0')
    }).setOrigin(0.5)
    this.container.add(eventName)

    const panelWidth = width * 0.75
    const panelHeight = 200
    const panelX = width / 2
    const panelY = height / 2 - 10

    const resultPanel = this.add.graphics()
    resultPanel.fillStyle(0x0a0a20, 0.9)
    resultPanel.lineStyle(2, resultColor, 0.7)
    this.roundedRect(resultPanel, panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 16)
    this.container.add(resultPanel)

    const storyText = this.add.text(panelX, panelY - panelHeight / 2 + 30, this.resultText, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#e0e0e0',
      align: 'center',
      wordWrap: { width: panelWidth - 60 },
      lineSpacing: 6
    }).setOrigin(0.5, 0)
    this.container.add(storyText)

    if (this.resultMessages.length > 0) {
      const rewardsTitle = this.add.text(panelX, panelY - panelHeight / 2 + 90, this.resultSuccess ? '🎁 获得奖励' : '⚠ 受到惩罚', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '16px',
        color: this.resultSuccess ? '#ffd54f' : '#ef5350',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0)
      this.container.add(rewardsTitle)

      const rewardContent = this.resultMessages.join('  |  ')
      const rewardText = this.add.text(panelX, panelY - panelHeight / 2 + 120, rewardContent, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '16px',
        color: '#' + resultColor.toString(16).padStart(6, '0'),
        align: 'center',
        wordWrap: { width: panelWidth - 60 }
      }).setOrigin(0.5, 0)
      this.container.add(rewardText)
    }

    const playerInfo = this.add.text(width / 2, panelY + panelHeight / 2 + 40,
      `Lv.${this.save.player.level}  ❤ ${this.save.player.health}/${this.save.player.maxHealth}  ⚔ ${this.save.player.attack}  🛡 ${this.save.player.defense}  💰 ${this.save.player.gold}  ✨ ${this.save.player.spirit}`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '15px',
        color: '#b0bec5'
      }
    ).setOrigin(0.5)
    this.container.add(playerInfo)

    const btnRow = this.add.container(width / 2, panelY + panelHeight / 2 + 90)

    const continueBtn = this.createButton(-130, 0, '继续探索', 0xffd54f, () => {
      this.currentEvent = null
      this.showEncounterList(width, height)
    })
    btnRow.add(continueBtn)

    const backBtn = this.createButton(130, 0, '返回主界面', 0x78909c, () => this.goBack())
    btnRow.add(backBtn)

    this.container.add(btnRow)

    this.container.setAlpha(0)
    this.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 600,
      ease: 'Quad.easeOut'
    })

    if (this.resultSuccess) {
      this.cameras.main.flash(300, 255, 215, 0)
      this.createSuccessParticles(width, height, resultColor)
    } else {
      this.cameras.main.shake(200, 0.003)
    }
  }

  private createSuccessParticles(width: number, height: number, color: number): void {
    const centerX = width / 2
    const centerY = height / 2 - 50

    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15
      const radius = 40 + Math.random() * 60
      const p = this.add.circle(centerX, centerY, 3 + Math.random() * 4, color, 0.8)
      this.container.add(p)
      this.tweens.add({
        targets: p,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        alpha: 0,
        scale: 0,
        duration: 600 + Math.random() * 400,
        delay: i * 50,
        ease: 'Cubic.Out',
        onComplete: () => p.destroy()
      })
    }
  }

  private createButton(x: number, y: number, label: string, color: number, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const btnWidth = 200
    const btnHeight = 48

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.7)
    bg.lineStyle(2, color, 0.9)
    this.roundedRect(bg, -btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10)
    container.add(bg)

    const text = this.add.text(0, 0, label, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5)
    container.add(text)

    container.setSize(btnWidth, btnHeight)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.08, duration: 150 })
      bg.clear()
      bg.fillStyle(color, 0.3)
      bg.lineStyle(3, color, 1)
      this.roundedRect(bg, -btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10)
    })

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 150 })
      bg.clear()
      bg.fillStyle(0x000000, 0.7)
      bg.lineStyle(2, color, 0.9)
      this.roundedRect(bg, -btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10)
    })

    container.on('pointerdown', onClick)

    return container
  }

  private createBackButton(width: number, height: number): void {
    const btn = this.add.container(60, height - 30)
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.6)
    bg.lineStyle(2, 0x78909c, 0.8)
    this.roundedRect(bg, -50, -20, 100, 40, 8)
    const text = this.add.text(0, 0, '◀ 返回', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5)
    btn.add([bg, text])
    btn.setSize(100, 40)
    btn.setInteractive({ useHandCursor: true })
    btn.on('pointerover', () => this.tweens.add({ targets: btn, scale: 1.08, duration: 150 }))
    btn.on('pointerout', () => this.tweens.add({ targets: btn, scale: 1, duration: 150 }))
    btn.on('pointerdown', () => this.goBack())
  }

  private goBack(): void {
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      this.scene.start('MenuScene')
    })
  }

  private clearContainer(): void {
    this.container.removeAll(true)
  }

  private showMessage(msg: string): void {
    const { width } = this.scale
    const msgText = this.add.text(width / 2, 100, msg, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#81c784'
    }).setOrigin(0.5)
    this.container.add(msgText)
    this.tweens.add({
      targets: msgText,
      alpha: 0,
      y: 80,
      duration: 2000,
      ease: 'Cubic.Out',
      onComplete: () => msgText.destroy()
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
