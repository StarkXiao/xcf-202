import Phaser from 'phaser'
import type { GameSave, Enemy, Skill, DailyTrialLevel, DailyTrialResult, DailyTrialReward, DailyTrialMilestone } from '../types'
import { SaveManager } from '../managers/SaveManager'
import { DailyTrialManager } from '../managers/DailyTrialManager'
import { SkillSystem } from '../managers/SkillSystem'
import { AlchemyManager } from '../managers/AlchemyManager'
import { EquipmentManager } from '../managers/EquipmentManager'
import { MeridianManager } from '../managers/MeridianManager'
import { AchievementManager } from '../managers/AchievementManager'
import { getElementMultiplier, ELEMENT_INFO } from '../data/fiveElementsData'
import { DAILY_TRIAL_CONFIG, DAILY_TRIAL_MILESTONES } from '../data/dailyTrialData'

type TrialPhase = 'select' | 'battle_intro' | 'battle' | 'victory' | 'defeat'

interface BattleState {
  enemies: Enemy[]
  currentEnemyIndex: number
  isPlayerTurn: boolean
  battleEnded: boolean
  enemySprites: (Phaser.GameObjects.Container | null)[]
  enemyHpBars: (Phaser.GameObjects.Graphics | null)[]
  enemyNames: (Phaser.GameObjects.Text | null)[]
  enemyDebuffs: { defenseDown: number; attackDown; burn: number; slow: number }[]
  playerBuffs: { attack: number; defense: number }
  startTime: number
  elapsedTime: number
}

export class DailyTrialScene extends Phaser.Scene {
  private save!: GameSave
  private saveManager = SaveManager.getInstance()
  private dailyTrialManager = DailyTrialManager.getInstance()
  private alchemyManager = AlchemyManager.getInstance()
  private equipmentManager = EquipmentManager.getInstance()
  private achievementManager = AchievementManager.getInstance()
  private skillSystem = SkillSystem.getInstance()

  private phase: TrialPhase = 'select'
  private currentLevel: DailyTrialLevel | null = null
  private battleState: BattleState | null = null

  private container!: Phaser.GameObjects.Container
  private playerSprite!: Phaser.GameObjects.Container
  private skillButtons: Phaser.GameObjects.Container[] = []
  private hpBarPlayer!: Phaser.GameObjects.Graphics
  private mpBarPlayer!: Phaser.GameObjects.Graphics
  private playerHealthText!: Phaser.GameObjects.Text
  private playerManaText!: Phaser.GameObjects.Text

  private messageText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text

  private timerEvent: Phaser.Time.TimerEvent | null = null
  private lastTurnTime = 0

  constructor() {
    super({ key: 'DailyTrialScene' })
  }

  init(): void {
    const existingSave = this.saveManager.loadGame()
    if (!existingSave) { this.scene.start('MenuScene'); return }
    this.save = existingSave
    this.dailyTrialManager.checkDailyReset(this.save.dailyTrial)
    this.recalcPlayerStats()
  }

  private recalcPlayerStats(): void {
    const buff = this.alchemyManager.getBuffBonus(this.save.alchemy)
    const permBonus = this.alchemyManager.getPermanentBonus(this.save.alchemy)
    const equipBonus = this.equipmentManager.calculateEquipmentBonus(this.save.equipment)
    const meridBonus = MeridianManager.getInstance().calculateMeridianBonus(this.save.meridian)
    const achvBonus = this.achievementManager.getAchievementBonus(this.save.achievement)
    this.saveManager.recalcPlayerStats(this.save.player, buff, permBonus, equipBonus, meridBonus, achvBonus)

    const meridianManager = MeridianManager.getInstance()
    const newSkills = meridianManager.syncSkillsToPlayer(this.save.meridian, this.save.player)
    newSkills.forEach(ns => {
      if (!this.save.player.skills.find(s => s.id === ns.id)) {
        this.save.player.skills.push(ns)
      }
    })
  }

  create(): void {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor(0x0a0a15)
    this.container = this.add.container(0, 0)

    this.showLevelSelect()
  }

  private createHeader(width: number): void {
    const title = this.add.text(width / 2, 20, '每日试炼', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '30px',
      color: '#ffd54f',
      fontStyle: 'bold',
      stroke: '#5d4037',
      strokeThickness: 3
    }).setOrigin(0.5)
    this.container.add(title)

    const remaining = this.dailyTrialManager.getRemainingAttempts(this.save.dailyTrial)
    const totalAttempts = this.save.dailyTrial.maxDailyAttempts + (this.save.dailyTrial.purchasedExtraAttempts || 0)
    const attemptsText = this.add.text(width - 20, 15,
      `次数: ${remaining}/${totalAttempts}`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '16px',
        color: remaining > 0 ? '#81c784' : '#ef5350'
      }).setOrigin(1, 0)
    this.container.add(attemptsText)

    const streakInfo = this.dailyTrialManager.getStreakInfo(this.save.dailyTrial)
    const streakText = this.add.text(20, 15,
      `🔥连签${streakInfo.days}天 奖励+${Math.floor(streakInfo.bonus * 100)}%`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '14px',
        color: streakInfo.bonus > 0 ? '#ff7043' : '#90a4ae'
      }).setOrigin(0, 0)
    this.container.add(streakText)

    const diffScale = this.save.dailyTrial.currentDifficultyScale || 0
    const diffScaleLabel = this.dailyTrialManager.getDifficultyScaleLabel(diffScale)
    const diffScaleText = this.add.text(width / 2, 48,
      `难度增幅: ${diffScaleLabel.label} (×${(1 + diffScale).toFixed(2)})`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '14px',
        color: diffScaleLabel.color
      }).setOrigin(0.5)
    this.container.add(diffScaleText)

    const progressText = this.add.text(20, 48,
      `最高: 第${this.save.dailyTrial.highestLevel}关 | 总通关: ${this.save.dailyTrial.totalClears}次`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '13px',
        color: '#90caf9'
      }).setOrigin(0, 0)
    this.container.add(progressText)
  }

  private createBackButton(width: number, height: number): void {
    const backBtn = this.add.text(30, height - 30, '← 返回主菜单', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffd54f'
    }).setOrigin(0, 1).setInteractive({ useHandCursor: true })

    backBtn.on('pointerover', () => backBtn.setColor('#ffffff'))
    backBtn.on('pointerout', () => backBtn.setColor('#ffd54f'))
    backBtn.on('pointerdown', () => this.goBack())
    this.container.add(backBtn)
  }

  private showLevelSelect(): void {
    this.phase = 'select'
    this.container.removeAll(true)
    const { width, height } = this.scale

    this.createHeader(width)
    this.createBackButton(width, height)
    this.createMilestonePanel(width, height)
    this.createPurchaseButton(width, height)

    this.createCosmicBackground(width, height)

    const scrollableHeight = height - 240
    const scrollY = 130

    const mask = this.make.graphics({})
    mask.fillStyle(0x000000, 1)
    mask.fillRect(0, scrollY, width, scrollableHeight)

    const scrollContainer = this.add.container(0, 0)
    scrollContainer.setMask(mask.createGeometryMask())
    this.container.add(scrollContainer)

    const levels = this.dailyTrialManager.getAvailableLevels(
      this.save.player.level,
      this.save.dailyTrial.highestLevel
    )

    const cols = 2
    const cardWidth = 300
    const cardHeight = 200
    const paddingX = 40
    const paddingY = 30
    const startX = (width - cols * cardWidth - paddingX) / 2 + cardWidth / 2
    const startY = scrollY + 40

    levels.forEach((level, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const x = startX + col * (cardWidth + paddingX)
      const y = startY + row * (cardHeight + paddingY)

      this.createLevelCard(scrollContainer, level, x, y, cardWidth, cardHeight)
    })
  }

  private createMilestonePanel(width: number, height: number): void {
    const milestones = this.dailyTrialManager.getAllMilestones()
    const claimed = this.save.dailyTrial.dailyMilestoneClaimed || []
    const dailyCleared = (this.save.dailyTrial.dailyClearedLevels || []).length
    const panelY = 68

    const panelBg = this.add.graphics()
    panelBg.fillStyle(0x1a1a2e, 0.8)
    panelBg.lineStyle(1, 0x4fc3f7, 0.5)
    this.roundedRect(panelBg, 20, panelY, width - 40, 52, 8)
    this.container.add(panelBg)

    milestones.forEach((milestone, index) => {
      const isClaimed = claimed.includes(milestone.id)
      const isAvailable = dailyCleared >= milestone.requiredClearedLevels && !isClaimed
      const x = 50 + index * ((width - 80) / milestones.length)

      const iconColor = isClaimed ? '#81c784' : isAvailable ? '#ffd54f' : '#666666'
      const iconText = this.add.text(x, panelY + 14, milestone.icon, {
        fontFamily: 'serif',
        fontSize: '18px',
        color: iconColor
      }).setOrigin(0.5)
      this.container.add(iconText)

      const labelText = this.add.text(x, panelY + 36, `${milestone.requiredClearedLevels}关`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '11px',
        color: isClaimed ? '#81c784' : isAvailable ? '#ffd54f' : '#666666'
      }).setOrigin(0.5)
      this.container.add(labelText)

      if (isAvailable) {
        const btn = this.add.text(x, panelY + 14, milestone.icon, {
          fontFamily: 'serif',
          fontSize: '18px',
          color: '#ffd54f'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })

        btn.on('pointerdown', () => {
          const result = this.dailyTrialManager.claimMilestoneReward(this.save, milestone.id)
          if (result.success) {
            this.saveManager.saveGame(this.save)
            this.showToast(result.message)
            this.showLevelSelect()
          } else {
            this.showToast(result.message)
          }
        })
        this.container.add(btn)
      }

      if (isClaimed) {
        const check = this.add.text(x + 15, panelY + 8, '✓', {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '12px',
          color: '#81c784',
          fontStyle: 'bold'
        }).setOrigin(0.5)
        this.container.add(check)
      }
    })
  }

  private createPurchaseButton(width: number, height: number): void {
    const canPurchase = this.dailyTrialManager.canPurchaseExtraAttempt(this.save.dailyTrial)
    if (!canPurchase) return

    const cost = this.dailyTrialManager.getExtraAttemptCost(this.save.dailyTrial)
    const btn = this.createSmallButton(width - 110, height - 30, 180, 36, `购买次数 ${cost}灵`, 0x4fc3f7, this.save.player.spirit >= cost, () => {
      const result = this.dailyTrialManager.purchaseExtraAttempt(this.save)
      if (result.success) {
        this.saveManager.saveGame(this.save)
        this.showToast(result.message)
        this.showLevelSelect()
      } else {
        this.showToast(result.message)
      }
    })
    btn.setScale(0.85)
    this.container.add(btn)
  }

  private createCosmicBackground(width: number, height: number): void {
    const stars = this.add.graphics()
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const size = Math.random() * 2 + 0.5
      const alpha = Math.random() * 0.8 + 0.2
      stars.fillStyle(0xffffff, alpha)
      stars.fillCircle(x, y, size)
    }
    this.container.add(stars)
  }

  private createLevelCard(parent: Phaser.GameObjects.Container, level: DailyTrialLevel, x: number, y: number, w: number, h: number): void {
    const isUnlocked = this.dailyTrialManager.isLevelUnlocked(level.id, this.save.player.level, this.save.dailyTrial.highestLevel)
    const isCleared = this.save.dailyTrial.claimedLevelRewards.includes(level.id)
    const canAttempt = this.dailyTrialManager.canAttempt(this.save.dailyTrial)
    const difficultyInfo = this.dailyTrialManager.getDifficultyLabel(level.difficulty)

    const card = this.add.graphics()
    const bgColor = isUnlocked ? level.background : 0x2d2d44
    card.fillStyle(bgColor, isUnlocked ? 0.85 : 0.4)
    card.lineStyle(2, isUnlocked ? level.background : 0x555555, isUnlocked ? 0.9 : 0.5)
    this.roundedRect(card, x - w / 2, y - h / 2, w, h, 12)

    parent.add(card)

    const levelNum = this.add.text(x - w / 2 + 15, y - h / 2 + 15, `第${level.id}关`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0)
    parent.add(levelNum)

    const diffText = this.add.text(x + w / 2 - 15, y - h / 2 + 15, difficultyInfo.label, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: difficultyInfo.color,
      fontStyle: 'bold'
    }).setOrigin(1, 0)
    parent.add(diffText)

    const nameText = this.add.text(x, y - h / 2 + 55, level.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: isUnlocked ? '#ffd54f' : '#888888',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    parent.add(nameText)

    const descText = this.add.text(x, y - h / 2 + 85, level.description, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: isUnlocked ? '#cccccc' : '#666666',
      wordWrap: { width: w - 40 }
    }).setOrigin(0.5)
    parent.add(descText)

    const rewardSummary = this.dailyTrialManager.getRewardSummary(level, this.save.dailyTrial)
    let rewardTextContent = rewardSummary.isFirstClear
      ? `首次: 金${rewardSummary.gold} 灵${rewardSummary.spirit} 经${rewardSummary.exp} ×1.5`
      : `通关: 金${rewardSummary.gold} 灵${rewardSummary.spirit} 经${rewardSummary.exp}`
    if (rewardSummary.streakBonus > 0) {
      rewardTextContent += ` 🔥+${Math.floor(rewardSummary.streakBonus * 100)}%`
    }
    const rewardText = this.add.text(x, y + 20, rewardTextContent, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: rewardSummary.isFirstClear ? '#ba68c8' : '#81c784'
    }).setOrigin(0.5)
    parent.add(rewardText)

    if (rewardSummary.extras.length > 0) {
      const extraIcons = rewardSummary.extras.map(r => r.itemIcon || '🎁').join(' ')
      const extraText = this.add.text(x, y + 45, `额外: ${extraIcons}`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '14px',
        color: '#90caf9'
      }).setOrigin(0.5)
      parent.add(extraText)
    }

    let btnText = '开始挑战'
    let btnColor: number = 0x4fc3f7
    let btnEnabled = true

    if (!isUnlocked) {
      if (this.save.player.level < level.minPlayerLevel) {
        btnText = `需要 Lv.${level.minPlayerLevel}`
      } else {
        btnText = '未解锁'
      }
      btnColor = 0x78909c
      btnEnabled = false
    } else if (!canAttempt) {
      btnText = '次数用完'
      btnColor = 0xef5350
      btnEnabled = false
    } else if (isCleared) {
      btnText = '再次挑战'
      btnColor = 0xffd54f
    }

    const btn = this.createSmallButton(x, y + h / 2 - 30, w - 60, 40, btnText, btnColor, btnEnabled, () => {
      if (btnEnabled) this.startTrial(level.id)
    })
    parent.add(btn)
  }

  private createSmallButton(x: number, y: number, w: number, h: number, label: string, color: number, enabled: boolean, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(color, enabled ? 0.85 : 0.4)
    this.roundedRect(bg, -w / 2, -h / 2, w, h, 8)

    const text = this.add.text(0, 0, label, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: enabled ? '#ffffff' : '#aaaaaa',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(w, h)

    if (enabled) {
      container.setInteractive({ useHandCursor: true })
      container.on('pointerover', () => bg.setAlpha(1))
      container.on('pointerout', () => bg.setAlpha(0.85))
      container.on('pointerdown', onClick)
    }

    return container
  }

  private startTrial(levelId: number): void {
    const result = this.dailyTrialManager.startTrial(this.save, levelId)
    if (!result.success) {
      this.showToast(result.message || '挑战失败')
      return
    }

    const level = this.dailyTrialManager.getTrialLevel(levelId)
    if (!level) return

    this.currentLevel = level
    this.saveManager.saveGame(this.save)
    this.showBattleIntro(level, result.scaledEnemies || [], result.difficultyScale || 0)
  }

  private showBattleIntro(level: DailyTrialLevel, enemies: Enemy[], difficultyScale: number = 0): void {
    this.phase = 'battle_intro'
    this.container.removeAll(true)
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor(level.background)
    this.createCosmicBackground(width, height)

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.6)
    overlay.fillRect(0, 0, width, height)
    this.container.add(overlay)

    const title = this.add.text(width / 2, height * 0.32, level.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '48px',
      color: '#ffd54f',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0)
    this.container.add(title)

    const difficultyInfo = this.dailyTrialManager.getDifficultyLabel(level.difficulty)
    const diffText = this.add.text(width / 2, height * 0.42, `难度: ${difficultyInfo.label}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: difficultyInfo.color,
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0)
    this.container.add(diffText)

    if (difficultyScale > 0) {
      const scaleLabel = this.dailyTrialManager.getDifficultyScaleLabel(difficultyScale)
      const scaleText = this.add.text(width / 2, height * 0.50,
        `增幅: ${scaleLabel.label} (×${(1 + difficultyScale).toFixed(2)})`,
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '22px',
          color: scaleLabel.color,
          fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0)
      this.container.add(scaleText)

      this.tweens.add({
        targets: [title, diffText, scaleText],
        alpha: 1,
        duration: 600,
        ease: 'Cubic.easeOut'
      })
    } else {
      this.tweens.add({
        targets: [title, diffText],
        alpha: 1,
        duration: 600,
        ease: 'Cubic.easeOut'
      })
    }

    const streakInfo = this.dailyTrialManager.getStreakInfo(this.save.dailyTrial)
    const streakText = this.add.text(width / 2, height * 0.58,
      streakInfo.bonus > 0 ? `🔥连胜奖励 +${Math.floor(streakInfo.bonus * 100)}%` : '准备迎战！',
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '22px',
        color: streakInfo.bonus > 0 ? '#ff7043' : '#ffffff'
      }).setOrigin(0.5).setAlpha(0)
    this.container.add(streakText)

    this.tweens.add({
      targets: streakText,
      alpha: 1,
      duration: 600,
      delay: 200,
      ease: 'Cubic.easeOut'
    })

    this.time.delayedCall(1800, () => {
      this.showBattle(level, enemies)
    })
  }

  private showBattle(level: DailyTrialLevel, enemies: Enemy[]): void {
    this.phase = 'battle'
    this.container.removeAll(true)
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor(level.background)
    this.createCosmicBackground(width, height)

    this.battleState = {
      enemies,
      currentEnemyIndex: 0,
      isPlayerTurn: true,
      battleEnded: false,
      enemySprites: [],
      enemyHpBars: [],
      enemyNames: [],
      enemyDebuffs: enemies.map(() => ({ defenseDown: 0, attackDown: 0, burn: 0, slow: 0 })),
      playerBuffs: { attack: 0, defense: 0 },
      startTime: Date.now(),
      elapsedTime: 0
    }

    this.createBattleUI(width, height)
    this.createPlayerSprite(width, height * 0.72)
    this.createEnemySprites(width, height * 0.3)
    this.createSkillButtons(width, height)

    this.messageText = this.add.text(width / 2, height * 0.5, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#ffd54f',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(100)
    this.container.add(this.messageText)

    this.timerText = this.add.text(width - 30, height - 30, '时间: 00:00', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(1, 1)
    this.container.add(this.timerText)

    this.startTimer()
    this.showBattleMessage(`第 ${this.battleState.currentEnemyIndex + 1}/${this.battleState.enemies.length} 个敌人`, 1500)
  }

  private createBattleUI(width: number, height: number): void {
    const topBar = this.add.graphics()
    topBar.fillStyle(0x000000, 0.7)
    topBar.fillRect(0, 0, width, 70)
    this.container.add(topBar)

    const backBtn = this.add.text(20, 35, '← 放弃', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ef5350'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
    backBtn.on('pointerover', () => backBtn.setColor('#ff8a80'))
    backBtn.on('pointerout', () => backBtn.setColor('#ef5350'))
    backBtn.on('pointerdown', () => this.confirmAbandon())
    this.container.add(backBtn)

    const title = this.add.text(width / 2, 35, this.currentLevel?.name || '每日试炼', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '26px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.container.add(title)

    const hpBg = this.add.graphics()
    hpBg.fillStyle(0x000000, 0.6)
    hpBg.fillRect(30, height - 180, 280, 140)
    this.container.add(hpBg)

    const playerLabel = this.add.text(50, height - 170, `${this.save.player.name} Lv.${this.save.player.level}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0, 0)
    this.container.add(playerLabel)

    const hpLabel = this.add.text(50, height - 140, '生命', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#ef5350'
    }).setOrigin(0, 0)
    this.container.add(hpLabel)

    this.hpBarPlayer = this.add.graphics()
    this.container.add(this.hpBarPlayer)

    this.playerHealthText = this.add.text(300, height - 140, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(1, 0)
    this.container.add(this.playerHealthText)

    const mpLabel = this.add.text(50, height - 105, '灵气', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#4fc3f7'
    }).setOrigin(0, 0)
    this.container.add(mpLabel)

    this.mpBarPlayer = this.add.graphics()
    this.container.add(this.mpBarPlayer)

    this.playerManaText = this.add.text(300, height - 105, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(1, 0)
    this.container.add(this.playerManaText)

    this.updatePlayerBars()
  }

  private updatePlayerBars(): void {
    const { height } = this.scale
    const hpBarWidth = 230
    const hpBarHeight = 22
    const hpBarX = 90
    const hpBarY = height - 142

    this.hpBarPlayer.clear()
    this.hpBarPlayer.fillStyle(0x333333, 0.8)
    this.hpBarPlayer.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight)

    const hpPercent = Math.max(0, this.save.player.health / this.save.player.maxHealth)
    this.hpBarPlayer.fillStyle(0xef5350, 1)
    this.hpBarPlayer.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight)

    this.playerHealthText.setText(`${Math.max(0, Math.ceil(this.save.player.health))}/${this.save.player.maxHealth}`)

    const mpBarY = height - 107
    this.mpBarPlayer.clear()
    this.mpBarPlayer.fillStyle(0x333333, 0.8)
    this.mpBarPlayer.fillRect(hpBarX, mpBarY, hpBarWidth, hpBarHeight)

    const mpPercent = Math.max(0, this.save.player.mana / this.save.player.maxMana)
    this.mpBarPlayer.fillStyle(0x4fc3f7, 1)
    this.mpBarPlayer.fillRect(hpBarX, mpBarY, hpBarWidth * mpPercent, hpBarHeight)

    this.playerManaText.setText(`${Math.max(0, Math.floor(this.save.player.mana))}/${this.save.player.maxMana}`)
  }

  private createPlayerSprite(x: number, y: number): void {
    const container = this.add.container(x, y)
    this.playerSprite = container

    const body = this.add.graphics()
    body.fillStyle(0x4fc3f7, 1)
    body.fillRect(-15, -40, 30, 60)

    const head = this.add.graphics()
    head.fillStyle(0xffccbc, 1)
    head.fillCircle(0, -55, 18)

    const hair = this.add.graphics()
    hair.fillStyle(0x3e2723, 1)
    hair.fillCircle(0, -62, 18)

    const robe = this.add.graphics()
    robe.fillStyle(0x1565c0, 0.9)
    robe.moveTo(-20, -20)
    robe.lineTo(20, -20)
    robe.lineTo(30, 30)
    robe.lineTo(-30, 30)
    robe.closePath()
    robe.fillPath()

    const sword = this.add.graphics()
    sword.fillStyle(0x90caf9, 1)
    sword.fillRect(25, -60, 6, 70)
    sword.fillStyle(0xffd54f, 1)
    sword.fillRect(20, 8, 16, 6)

    container.add([body, head, hair, robe, sword])
    container.setScale(1.3)
    this.container.add(container)
  }

  private createEnemySprites(width: number, y: number): void {
    if (!this.battleState) return
    const enemies = this.battleState.enemies

    enemies.forEach((enemy, index) => {
      const x = width / 2 + (index - (enemies.length - 1) / 2) * 140
      const sprite = this.createEnemySprite(enemy, x, y + (index % 2) * 20)
      this.battleState!.enemySprites.push(sprite)

      const nameText = this.add.text(x, y + 80, enemy.name, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5)
      this.container.add(nameText)
      this.battleState!.enemyNames.push(nameText)

      const hpBg = this.add.graphics()
      hpBg.fillStyle(0x333333, 0.8)
      hpBg.fillRect(x - 50, y + 100, 100, 10)
      this.container.add(hpBg)

      const hpBar = this.add.graphics()
      this.container.add(hpBar)
      this.battleState!.enemyHpBars.push(hpBar)

      this.updateEnemyHpBar(index, enemy)
    })
  }

  private createEnemySprite(enemy: Enemy, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const size = enemy.size || 40
    const bodyColor = enemy.color || 0xef5350

    const body = this.add.graphics()
    body.fillStyle(bodyColor, 1)
    body.fillCircle(0, 0, size / 2)

    const eyes = this.add.graphics()
    eyes.fillStyle(0x000000, 1)
    eyes.fillCircle(-size / 5, -size / 8, size / 10)
    eyes.fillCircle(size / 5, -size / 8, size / 10)

    eyes.fillStyle(0xff0000, 1)
    eyes.fillCircle(-size / 5, -size / 8, size / 16)
    eyes.fillCircle(size / 5, -size / 8, size / 16)

    if (enemy.type === 'boss') {
      const crown = this.add.graphics()
      crown.fillStyle(0xffd54f, 1)
      crown.fillRect(-size / 2, -size / 2 - 12, size, 8)
      crown.fillTriangle(-size / 2, -size / 2 - 4, 0, -size / 2 - 20, size / 2, -size / 2 - 4)
      container.add(crown)
    }

    if (enemy.type === 'elite') {
      const aura = this.add.graphics()
      aura.lineStyle(3, 0xffd54f, 0.6)
      aura.strokeCircle(0, 0, size / 2 + 5)
      container.add(aura)
    }

    container.add([body, eyes])
    container.setScale(enemy.type === 'boss' ? 1.5 : 1)
    this.container.add(container)

    return container
  }

  private updateEnemyHpBar(index: number, enemy: Enemy): void {
    if (!this.battleState) return
    const hpBar = this.battleState.enemyHpBars[index]
    if (!hpBar) return

    const nameText = this.battleState.enemyNames[index]
    if (!nameText) return

    const sprite = this.battleState.enemySprites[index]
    if (!sprite) return

    const x = sprite.x
    const y = sprite.y + 80 + 20

    hpBar.clear()
    const hpPercent = Math.max(0, enemy.health / enemy.maxHealth)
    const hpColor = hpPercent > 0.5 ? 0x81c784 : hpPercent > 0.25 ? 0xffd54f : 0xef5350
    hpBar.fillStyle(hpColor, 1)
    hpBar.fillRect(x - 50, y, 100 * hpPercent, 10)

    if (enemy.health <= 0) {
      sprite.setAlpha(0.3)
      nameText.setAlpha(0.3)
    }
  }

  private createSkillButtons(width: number, height: number): void {
    const unlockedSkills = this.save.player.skills.filter(
      s => this.save.player.level >= s.unlockLevel
    )
    const maxButtons = 4
    const skills = unlockedSkills.slice(0, maxButtons)

    const buttonWidth = 110
    const buttonHeight = 75
    const spacing = 15
    const totalWidth = skills.length * buttonWidth + (skills.length - 1) * spacing
    const startX = (width - totalWidth) / 2 + buttonWidth / 2
    const btnY = height - 55

    skills.forEach((skill, index) => {
      const x = startX + index * (buttonWidth + spacing)
      const btn = this.createSkillButton(x, btnY, buttonWidth, buttonHeight, skill, index)
      this.skillButtons.push(btn)
    })
  }

  private createSkillButton(x: number, y: number, w: number, h: number, skill: Skill, index: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(skill.color, 0.8)
    bg.lineStyle(2, skill.color, 1)
    this.roundedRect(bg, -w / 2, -h / 2, w, h, 10)

    const icon = this.add.text(0, -h / 2 + 18, skill.icon, {
      fontFamily: 'serif',
      fontSize: '24px'
    }).setOrigin(0.5)

    const name = this.add.text(0, 8, skill.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const costText = skill.manaCost > 0
      ? `${skill.manaCost}灵 ${skill.currentCooldown > 0 ? `(${skill.currentCooldown})` : ''}`
      : skill.currentCooldown > 0 ? `冷却(${skill.currentCooldown})` : '普攻'
    const cost = this.add.text(0, h / 2 - 12, costText, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: skill.currentCooldown > 0 ? '#ef5350' : this.save.player.mana >= skill.manaCost ? '#81c784' : '#ef5350'
    }).setOrigin(0.5)

    container.add([bg, icon, name, cost])
    container.setSize(w, h)
    container.setInteractive({ useHandCursor: true })

    const isAvailable = skill.currentCooldown <= 0 && this.save.player.mana >= skill.manaCost
    if (!isAvailable) {
      container.setAlpha(0.5)
    }

    container.on('pointerdown', () => {
      if (this.battleState && this.battleState.isPlayerTurn && !this.battleState.battleEnded) {
        if (isAvailable) {
          this.playerUseSkill(index)
        } else {
          this.showToast(skill.currentCooldown > 0 ? '技能冷却中' : '灵气不足')
        }
      }
    })

    this.container.add(container)
    return container
  }

  private refreshSkillButtons(): void {
    this.skillButtons.forEach(btn => btn.destroy())
    this.skillButtons = []
    const { width, height } = this.scale
    this.createSkillButtons(width, height)
  }

  private playerUseSkill(skillIndex: number): void {
    if (!this.battleState || !this.currentLevel) return

    const unlockedSkills = this.save.player.skills.filter(
      s => this.save.player.level >= s.unlockLevel
    )
    const skill = unlockedSkills[skillIndex]
    if (!skill) return

    if (skill.currentCooldown > 0 || this.save.player.mana < skill.manaCost) return

    this.battleState.isPlayerTurn = false
    this.save.player.mana -= skill.manaCost
    skill.currentCooldown = skill.cooldown

    const branchBonus = this.skillSystem.calculateBranchBonus(skill)
    let baseDamage = skill.damage + skill.level * 5
    baseDamage = Math.floor(baseDamage * (1 + branchBonus.damageBonus))

    const currentEnemy = this.battleState.enemies[this.battleState.currentEnemyIndex]
    if (!currentEnemy || currentEnemy.health <= 0) return

    const debuff = this.battleState.enemyDebuffs[this.battleState.currentEnemyIndex]
    const effectiveEnemyDefense = Math.max(0, currentEnemy.defense - (debuff?.defenseDown || 0))

    const playerElement = skill.element
    const enemyElement = currentEnemy.element
    const elementMultiplier = getElementMultiplier(playerElement, enemyElement)
    let damage = Math.max(1, Math.floor(
      (this.save.player.attack + this.battleState.playerBuffs.attack + baseDamage - effectiveEnemyDefense * 0.5) * elementMultiplier
    ))

    const isCrit = Math.random() < this.save.player.critRate
    if (isCrit) {
      damage = Math.floor(damage * (1.5 + this.save.player.critDamage))
    }

    currentEnemy.health -= damage
    this.updateEnemyHpBar(this.battleState.currentEnemyIndex, currentEnemy)

    this.animateAttack(this.playerSprite, this.battleState.enemySprites[this.battleState.currentEnemyIndex]!, () => {
      this.showBattleMessage(`${skill.icon} ${skill.name}! ${isCrit ? '暴击!' : ''} -${damage}`, 800)
    })

    if (playerElement && enemyElement && elementMultiplier !== 1) {
      const info = ELEMENT_INFO[playerElement]
      this.showBattleMessage(info?.constraintText || '', 1200)
    }

    this.time.delayedCall(1000, () => {
      this.updatePlayerBars()
      this.refreshSkillButtons()

      if (currentEnemy.health <= 0) {
        this.onEnemyDefeated()
      } else {
        this.enemyTurn()
      }
    })
  }

  private animateAttack(from: Phaser.GameObjects.Container, to: Phaser.GameObjects.Container, onComplete: () => void): void {
    const startX = from.x
    const targetX = to.x

    this.tweens.add({
      targets: from,
      x: targetX - 50,
      duration: 200,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: to,
          scale: { from: to.scale, to: to.scale * 1.2 },
          duration: 100,
          yoyo: true
        })

        this.time.delayedCall(100, () => {
          this.tweens.add({
            targets: from,
            x: startX,
            duration: 200,
            ease: 'Cubic.easeIn',
            onComplete
          })
        })
      }
    })
  }

  private animateEnemyAttack(from: Phaser.GameObjects.Container, to: Phaser.GameObjects.Container, onComplete: () => void): void {
    const startX = from.x
    const targetX = to.x

    this.tweens.add({
      targets: from,
      x: targetX + 50,
      duration: 200,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: to,
          scale: { from: to.scale, to: to.scale * 1.15 },
          duration: 100,
          yoyo: true
        })

        this.time.delayedCall(100, () => {
          this.tweens.add({
            targets: from,
            x: startX,
            duration: 200,
            ease: 'Cubic.easeIn',
            onComplete
          })
        })
      }
    })
  }

  private onEnemyDefeated(): void {
    if (!this.battleState) return

    if (this.battleState.currentEnemyIndex < this.battleState.enemies.length - 1) {
      this.battleState.currentEnemyIndex++
      this.showBattleMessage(`第 ${this.battleState.currentEnemyIndex + 1}/${this.battleState.enemies.length} 个敌人`, 1200)
      this.time.delayedCall(1500, () => {
        this.startPlayerTurn()
      })
    } else {
      this.onBattleVictory()
    }
  }

  private enemyTurn(): void {
    if (!this.battleState) return
    this.battleState.isPlayerTurn = false

    const enemy = this.battleState.enemies[this.battleState.currentEnemyIndex]
    if (!enemy || enemy.health <= 0) {
      this.startPlayerTurn()
      return
    }

    if (enemy.phases && enemy.phases.length > 0) {
      const hpPercent = enemy.health / enemy.maxHealth
      const targetPhase = enemy.phases.findLast(p => hpPercent <= p.healthThreshold)
      if (targetPhase && (enemy.currentPhase || 0) < targetPhase.phase) {
        enemy.currentPhase = targetPhase.phase
        enemy.specialSkills = targetPhase.specialSkills
        enemy.attack = Math.floor(enemy.attack * targetPhase.attackMultiplier)
        enemy.defense = Math.floor(enemy.defense * targetPhase.defenseMultiplier)
        this.showBattleMessage(targetPhase.message, 2000)
      }
    }

    const debuff = this.battleState.enemyDebuffs[this.battleState.currentEnemyIndex]
    const effectiveEnemyAttack = Math.max(1, enemy.attack - (debuff?.attackDown || 0))

    const specialSkill = this.rollEnemySpecialSkill(enemy)

    this.time.delayedCall(500, () => {
      let damage = 0
      let healAmount = 0
      let message = ''

      if (specialSkill) {
        message = `${enemy.name} 使用了 ${specialSkill.name}！`
        if (specialSkill.damage) {
          damage = Math.max(1, Math.floor(
            (effectiveEnemyAttack + specialSkill.damage - (this.save.player.defense + this.battleState!.playerBuffs.defense) * 0.5)
          ))
        }
        if (specialSkill.heal) {
          healAmount = specialSkill.heal
          enemy.health = Math.min(enemy.maxHealth, enemy.health + healAmount)
          this.updateEnemyHpBar(this.battleState!.currentEnemyIndex, enemy)
          message += ` 恢复 ${healAmount} 生命`
        }
        if (specialSkill.buffEffect) {
          if (specialSkill.buffEffect.type === 'attack') {
            this.battleState!.enemyDebuffs[this.battleState!.currentEnemyIndex] = {
              ...this.battleState!.enemyDebuffs[this.battleState!.currentEnemyIndex],
              attackDown: this.battleState!.enemyDebuffs[this.battleState!.currentEnemyIndex].attackDown - specialSkill.buffEffect.value
            }
          } else if (specialSkill.buffEffect.type === 'defense') {
            this.battleState!.enemyDebuffs[this.battleState!.currentEnemyIndex] = {
              ...this.battleState!.enemyDebuffs[this.battleState!.currentEnemyIndex],
              defenseDown: this.battleState!.enemyDebuffs[this.battleState!.currentEnemyIndex].defenseDown - specialSkill.buffEffect.value
            }
          }
        }
        if (specialSkill.debuffEffect) {
          if (specialSkill.debuffEffect.type === 'attackDown') {
            this.battleState!.playerBuffs.attack -= specialSkill.debuffEffect.value
            message += ` 攻击力-${specialSkill.debuffEffect.value}`
          } else if (specialSkill.debuffEffect.type === 'defenseDown') {
            this.battleState!.playerBuffs.defense -= specialSkill.debuffEffect.value
            message += ` 防御力-${specialSkill.debuffEffect.value}`
          } else if (specialSkill.debuffEffect.type === 'burn') {
            message += ` 灼烧-${specialSkill.debuffEffect.value}`
          } else if (specialSkill.debuffEffect.type === 'slow') {
            message += ` 减速`
          }
        }
      } else {
        damage = Math.max(1, Math.floor(
          effectiveEnemyAttack - (this.save.player.defense + this.battleState!.playerBuffs.defense) * 0.5
        ))
        message = `${enemy.name} 攻击！`
      }

      if (damage > 0) {
        this.save.player.health -= damage
        message += ` 受到 -${damage} 伤害`
      }

      this.animateEnemyAttack(
        this.battleState!.enemySprites[this.battleState!.currentEnemyIndex]!,
        this.playerSprite,
        () => {
          this.showBattleMessage(message, 1200)
          this.updatePlayerBars()

          this.time.delayedCall(1200, () => {
            if (this.save.player.health <= 0) {
              this.save.player.health = 0
              this.updatePlayerBars()
              this.onBattleDefeat()
            } else {
              this.startPlayerTurn()
            }
          })
        }
      )
    })
  }

  private rollEnemySpecialSkill(enemy: Enemy): Enemy['specialSkills'] extends (infer T)[] ? T | undefined : never {
    if (!enemy.specialSkills || enemy.specialSkills.length === 0) return undefined
    for (const skill of enemy.specialSkills) {
      if (Math.random() < skill.chance) return skill as any
    }
    return undefined
  }

  private startPlayerTurn(): void {
    if (!this.battleState) return

    this.save.player.skills.forEach(s => {
      if (s.currentCooldown > 0) s.currentCooldown--
    })

    this.save.player.mana = Math.min(
      this.save.player.maxMana,
      this.save.player.mana + Math.floor(this.save.player.maxMana * 0.08)
    )

    this.battleState.isPlayerTurn = true
    this.updatePlayerBars()
    this.refreshSkillButtons()
  }

  private showBattleMessage(text: string, duration: number = 1000): void {
    if (!this.messageText) return
    this.messageText.setText(text).setAlpha(1)
    this.messageText.setScale(0.5)
    this.tweens.add({
      targets: this.messageText,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut'
    })
    this.time.delayedCall(duration, () => {
      this.tweens.add({
        targets: this.messageText,
        alpha: 0,
        duration: 300
      })
    })
  }

  private startTimer(): void {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (!this.battleState) return
        this.battleState.elapsedTime = Math.floor((Date.now() - this.battleState.startTime) / 1000)
        this.timerText.setText(`时间: ${this.dailyTrialManager.formatTime(this.battleState.elapsedTime)}`)
      },
      loop: true
    })
  }

  private stopTimer(): void {
    if (this.timerEvent) {
      this.timerEvent.remove()
      this.timerEvent = null
    }
  }

  private onBattleVictory(): void {
    if (!this.battleState || !this.currentLevel) return
    this.battleState.battleEnded = true
    this.stopTimer()

    const result = this.dailyTrialManager.completeTrial(
      this.save,
      this.currentLevel.id,
      this.battleState.elapsedTime
    )
    this.saveManager.saveGame(this.save)

    this.phase = 'victory'
    this.showVictoryScreen(result)
  }

  private onBattleDefeat(): void {
    if (!this.battleState) return
    this.battleState.battleEnded = true
    this.stopTimer()

    this.dailyTrialManager.failTrial(this.save)
    this.saveManager.saveGame(this.save)

    this.phase = 'defeat'
    this.showDefeatScreen()
  }

  private showVictoryScreen(result: DailyTrialResult): void {
    const { width, height } = this.scale

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.85)
    overlay.fillRect(0, 0, width, height)
    this.container.add(overlay)

    const extraHeight = result.streakBonus > 0 ? 40 : 0
    const panelW = 500
    const panelH = 480 + extraHeight
    const panelX = (width - panelW) / 2
    const panelY = (height - panelH) / 2

    const panel = this.add.graphics()
    panel.fillStyle(0x1a2e1a, 0.95)
    panel.lineStyle(3, 0xffd54f, 0.9)
    this.roundedRect(panel, panelX, panelY, panelW, panelH, 20)
    this.container.add(panel)

    const title = this.add.text(width / 2, panelY + 50, '🎉 试炼通关！', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '36px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0)
    this.container.add(title)

    const levelText = this.add.text(width / 2, panelY + 95, `第${result.clearedLevel}关完成`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#81c784'
    }).setOrigin(0.5).setAlpha(0)
    this.container.add(levelText)

    const timeText = this.add.text(width / 2, panelY + 130,
      `用时: ${this.dailyTrialManager.formatTime(result.completionTime)}${result.isNewRecord ? ' ⭐新纪录!' : ''}`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '18px',
        color: result.isNewRecord ? '#ba68c8' : '#90caf9'
      }).setOrigin(0.5).setAlpha(0)
    this.container.add(timeText)

    let infoY = panelY + 160

    if (result.streakBonus > 0) {
      const streakText = this.add.text(width / 2, infoY,
        `🔥连胜奖励: +${Math.floor(result.streakBonus * 100)}%`,
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '18px',
          color: '#ff7043',
          fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0)
      this.container.add(streakText)
      infoY += 25
    }

    if (result.difficultyScale > 0) {
      const scaleLabel = this.dailyTrialManager.getDifficultyScaleLabel(result.difficultyScale)
      const scaleInfo = this.add.text(width / 2, infoY,
        `难度增幅: ${scaleLabel.label} (×${(1 + result.difficultyScale).toFixed(2)})`,
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '14px',
          color: scaleLabel.color
        }).setOrigin(0.5).setAlpha(0)
      this.container.add(scaleInfo)
      infoY += 20
    }

    const nextDiffScale = Math.min(
      result.difficultyScale + DAILY_TRIAL_CONFIG.DIFFICULTY_SCALE_PER_ATTEMPT,
      DAILY_TRIAL_CONFIG.MAX_DIFFICULTY_SCALE
    )
    if (nextDiffScale > result.difficultyScale) {
      const nextScaleLabel = this.dailyTrialManager.getDifficultyScaleLabel(nextDiffScale)
      const nextScaleInfo = this.add.text(width / 2, infoY,
        `下次增幅: ${nextScaleLabel.label} (×${(1 + nextDiffScale).toFixed(2)})`,
        {
          fontFamily: '"Microsoft YaHei", serif',
          fontSize: '13px',
          color: '#ffb74d'
        }).setOrigin(0.5).setAlpha(0)
      this.container.add(nextScaleInfo)
      infoY += 20
    }

    const rewardsStartY = infoY + 10
    const rewards: { icon: string; label: string; value: number; color: string }[] = []
    if (result.goldEarned > 0) rewards.push({ icon: '💰', label: '金币', value: result.goldEarned, color: '#ffd54f' })
    if (result.spiritEarned > 0) rewards.push({ icon: '✨', label: '灵气', value: result.spiritEarned, color: '#4fc3f7' })
    if (result.expEarned > 0) rewards.push({ icon: '📚', label: '经验', value: result.expEarned, color: '#81c784' })
    result.extraRewards.forEach(r => {
      rewards.push({ icon: r.itemIcon || '🎁', label: r.itemName || '奖励', value: r.value, color: r.itemColor ? '#' + r.itemColor.toString(16).padStart(6, '0') : '#ba68c8' })
    })

    rewards.forEach((reward, i) => {
      const y = rewardsStartY + i * 40
      const bg = this.add.graphics()
      bg.fillStyle(0x2d2d44, 0.6)
      this.roundedRect(bg, panelX + 40, y, panelW - 80, 35, 8)
      this.container.add(bg.setAlpha(0))

      const label = this.add.text(panelX + 60, y + 17, `${reward.icon} ${reward.label}`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '18px',
        color: '#ffffff'
      }).setOrigin(0, 0.5).setAlpha(0)
      this.container.add(label)

      const value = this.add.text(panelX + panelW - 60, y + 17, `+${reward.value}`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: reward.color,
        fontStyle: 'bold'
      }).setOrigin(1, 0.5).setAlpha(0)
      this.container.add(value)

      this.time.delayedCall(600 + i * 150, () => {
        this.tweens.add({
          targets: [bg, label, value],
          alpha: 1,
          duration: 300
        })
      })
    })

    const confirmBtn = this.createSmallButton(width / 2, panelY + panelH - 50, 180, 50, '确定', 0xffd54f, true, () => {
      this.showLevelSelect()
    })
    confirmBtn.setAlpha(0)
    this.container.add(confirmBtn)

    this.tweens.add({
      targets: [title, levelText, timeText],
      alpha: 1,
      scale: { from: 0.5, to: 1 },
      duration: 500,
      ease: 'Back.easeOut'
    })

    this.time.delayedCall(1000, () => {
      this.tweens.add({
        targets: confirmBtn,
        alpha: 1,
        scale: { from: 0.5, to: 1 },
        duration: 400,
        ease: 'Back.easeOut'
      })
    })
  }

  private showDefeatScreen(): void {
    const { width, height } = this.scale

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.85)
    overlay.fillRect(0, 0, width, height)
    this.container.add(overlay)

    const panelW = 440
    const panelH = 300
    const panelX = (width - panelW) / 2
    const panelY = (height - panelH) / 2

    const panel = this.add.graphics()
    panel.fillStyle(0x2e1a1a, 0.95)
    panel.lineStyle(3, 0xef5350, 0.9)
    this.roundedRect(panel, panelX, panelY, panelW, panelH, 20)
    this.container.add(panel)

    const title = this.add.text(width / 2, panelY + 60, '💀 试炼失败', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '36px',
      color: '#ef5350',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0)
    this.container.add(title)

    const desc = this.add.text(width / 2, panelY + 120, '虽然失败了，但你的意志更坚定了！\n下次再来挑战吧！', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5).setAlpha(0)
    this.container.add(desc)

    const retryBtn = this.createSmallButton(width / 2 - 100, panelY + panelH - 50, 150, 45, '返回列表', 0x78909c, true, () => {
      this.showLevelSelect()
    })
    retryBtn.setAlpha(0)
    this.container.add(retryBtn)

    const menuBtn = this.createSmallButton(width / 2 + 100, panelY + panelH - 50, 150, 45, '主菜单', 0xffd54f, true, () => {
      this.goBack()
    })
    menuBtn.setAlpha(0)
    this.container.add(menuBtn)

    this.tweens.add({
      targets: [title, desc],
      alpha: 1,
      scale: { from: 0.5, to: 1 },
      duration: 500,
      ease: 'Back.easeOut'
    })

    this.time.delayedCall(600, () => {
      this.tweens.add({
        targets: [retryBtn, menuBtn],
        alpha: 1,
        scale: { from: 0.5, to: 1 },
        duration: 400,
        ease: 'Back.easeOut'
      })
    })
  }

  private confirmAbandon(): void {
    const { width, height } = this.scale

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.75)
    overlay.fillRect(0, 0, width, height)

    const panel = this.add.graphics()
    panel.fillStyle(0x1a1a2e, 0.95)
    panel.lineStyle(2, 0xef5350, 0.9)
    this.roundedRect(panel, width / 2 - 200, height / 2 - 100, 400, 200, 16)

    const title = this.add.text(width / 2, height / 2 - 50, '⚠ 放弃试炼', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: '#ef5350',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const desc = this.add.text(width / 2, height / 2, '确定要放弃本次试炼吗？\n本次挑战次数将被消耗！', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5)

    const yesBtn = this.createSmallButton(width / 2 - 100, height / 2 + 60, 140, 42, '确认放弃', 0xef5350, true, () => {
      this.dailyTrialManager.abandonTrial(this.save)
      this.saveManager.saveGame(this.save)
      this.showLevelSelect()
    })
    yesBtn.setScale(0.9)

    const noBtn = this.createSmallButton(width / 2 + 100, height / 2 + 60, 140, 42, '继续挑战', 0x78909c, true, () => {
      overlay.destroy()
      panel.destroy()
      title.destroy()
      desc.destroy()
      yesBtn.destroy()
      noBtn.destroy()
    })
    noBtn.setScale(0.9)
  }

  private showToast(message: string): void {
    const { width, height } = this.scale
    const toast = this.add.text(width / 2, height / 2, message, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
      alpha: 0
    }).setOrigin(0.5).setDepth(200)

    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: height / 2 - 30,
      duration: 200,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.time.delayedCall(1200, () => {
          this.tweens.add({
            targets: toast,
            alpha: 0,
            y: height / 2 - 60,
            duration: 300,
            onComplete: () => toast.destroy()
          })
        })
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

  private goBack(): void {
    this.stopTimer()
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      this.scene.start('MenuScene')
    })
  }
}
