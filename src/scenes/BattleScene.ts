import Phaser from 'phaser'
import type { Player, Enemy, Stage, Skill, BattleResult, SpiritBeast, SpiritBeastSkill, ChapterReward, ChapterDialogueNode, ElementType, EnemySpecialSkill, EnemyDrop, BattleStatistics } from '../types'
import { STAGES } from '../data/gameData'
import { SaveManager } from '../managers/SaveManager'
import { SkillSystem } from '../managers/SkillSystem'
import { AlchemyManager } from '../managers/AlchemyManager'
import { SpiritBeastManager } from '../managers/SpiritBeastManager'
import { EquipmentManager } from '../managers/EquipmentManager'
import { MeridianManager } from '../managers/MeridianManager'
import { AchievementManager } from '../managers/AchievementManager'
import { ChapterManager } from '../managers/ChapterManager'
import { getBeastTemplate } from '../data/spiritBeastData'
import { getElementMultiplier, getElementConstraintText, getElementLabel, ELEMENT_INFO, calculateTreasureElementBonus } from '../data/fiveElementsData'
import { REVIVE_CONFIGS, MAX_REVIVE_COUNT } from '../types'

export class BattleScene extends Phaser.Scene {
  private saveManager = SaveManager.getInstance()
  private achievementManager = AchievementManager.getInstance()
  private chapterManager = ChapterManager.getInstance()
  private player!: Player
  private stage!: Stage
  private enemies: Enemy[] = []
  private currentEnemyIndex = 0
  private chapterId?: string
  private levelId?: string
  private isChapterBattle = false
  private playerSprite!: Phaser.GameObjects.Container
  private enemySprites: Phaser.GameObjects.Container[] = []
  private hpBarPlayer!: Phaser.GameObjects.Graphics
  private mpBarPlayer!: Phaser.GameObjects.Graphics
  private hpBarsEnemy: Phaser.GameObjects.Graphics[] = []
  private skillButtons: Phaser.GameObjects.Container[] = []
  private isPlayerTurn = true
  private battleEnded = false
  private playerHealth!: Phaser.GameObjects.Text
  private playerMana!: Phaser.GameObjects.Text
  private enemyNames: Phaser.GameObjects.Text[] = []
  private expGoldText!: Phaser.GameObjects.Text
  private turnText!: Phaser.GameObjects.Text
  private messageText!: Phaser.GameObjects.Text
  private unlockedAchievementsNotification: Phaser.GameObjects.Container | null = null
  private spiritBeastManager = SpiritBeastManager.getInstance()
  private battleBeasts: (SpiritBeast | null)[] = []
  private beastSprites: (Phaser.GameObjects.Container | null)[] = []
  private beastHpBars: (Phaser.GameObjects.Graphics | null)[] = []
  private activeBeastBuffs: { attack: number; defense: number; critRate: number; critDamage: number }[] = []
  private activeEnemyDebuffs: { defenseDown: number; attackDown: number }[] = []
  private equipmentManager = EquipmentManager.getInstance()
  private meridianManager = MeridianManager.getInstance()
  private elementStats = { advantageHits: 0, disadvantageHits: 0, totalElementBonusDamage: 0 }
  private battleStats: BattleStatistics = { totalDamageDealt: 0, totalDamageTaken: 0, totalHealing: 0, critCount: 0, critTotal: 0, enemiesDefeated: 0, eliteDefeated: 0, bossDefeated: 0, phaseTransitions: [], turnsElapsed: 0, specialSkillUses: 0 }
  private enemySkillCooldowns: Map<string, number> = new Map()
  private phaseAnnouncement: Phaser.GameObjects.Container | null = null
  private reviveCount: number = 0

  constructor() {
    super({ key: 'BattleScene' })
  }

  private alchemyManager = AlchemyManager.getInstance()

  init(data: { stageId: number; chapterId?: string; levelId?: string; reviveCount?: number }): void {
    const save = this.saveManager.loadGame()!
    this.player = save.player

    this.saveManager.recalcPlayerStatsFromSave(save)

    const newSkills = this.meridianManager.syncSkillsToPlayer(save.meridian, this.player)
    this.player.skills.push(...newSkills)

    this.player.health = Math.min(this.player.health, this.player.maxHealth)
    this.player.mana = Math.min(this.player.mana, this.player.maxMana)

    this.chapterId = data.chapterId
    this.levelId = data.levelId
    this.isChapterBattle = !!(data.chapterId && data.levelId)
    this.reviveCount = data.reviveCount || 0

    const stageId = data.stageId || save.currentStage
    const stageIndex = Math.min(Math.max(0, stageId - 1), STAGES.length - 1)
    this.stage = STAGES[stageIndex]
    this.enemies = JSON.parse(JSON.stringify(this.stage.enemies))
    this.currentEnemyIndex = 0
    this.isPlayerTurn = true
    this.battleEnded = false

    this.battleBeasts = this.spiritBeastManager.getBattleTeam(save.spiritBeast)
    this.activeBeastBuffs = this.battleBeasts.map(() => ({ attack: 0, defense: 0, critRate: 0, critDamage: 0 }))
    this.activeEnemyDebuffs = this.enemies.map(() => ({ defenseDown: 0, attackDown: 0 }))
    this.elementStats = { advantageHits: 0, disadvantageHits: 0, totalElementBonusDamage: 0 }
    this.battleStats = { totalDamageDealt: 0, totalDamageTaken: 0, totalHealing: 0, critCount: 0, critTotal: 0, enemiesDefeated: 0, eliteDefeated: 0, bossDefeated: 0, phaseTransitions: [], turnsElapsed: 0, specialSkillUses: 0 }
    this.enemySkillCooldowns = new Map()

    this.battleBeasts.forEach(beast => {
      if (beast) {
        beast.skills.forEach(skill => {
          skill.currentCooldown = 0
        })
        this.spiritBeastManager.recalcBeastStats(beast)
        beast.health = beast.maxHealth
      }
    })
  }

  create(): void {
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor(this.stage.background)
    this.createBattleBackground(width, height)

    this.turnText = this.add.text(width / 2, 30, '第 ' + this.stage.id + ' 关：' + this.stage.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.messageText = this.add.text(width / 2, 70, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#81c784'
    }).setOrigin(0.5)

    this.expGoldText = this.add.text(width - 20, 30, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#ffd54f',
      align: 'right'
    }).setOrigin(1, 0)
    this.updateExpGoldText()

    this.createPlayer(width, height)
    this.createBattleBeasts(width, height)
    this.createEnemies(width, height)
    this.createSkillBar(width, height)
    this.createBackButton(width, height)

    this.showMessage('你的回合！选择一个技能')
    this.cameras.main.fadeIn(500)
  }

  private createBattleBackground(width: number, height: number): void {
    for (let i = 0; i < 3; i++) {
      const mountain = this.add.graphics()
      mountain.fillStyle(0x000000, 0.3)
      mountain.beginPath()
      mountain.moveTo(0, height * 0.55)
      for (let x = 0; x <= width; x += 50) {
        const seed = (x + i * 200) * 0.01
        mountain.lineTo(x, height * 0.55 - Math.sin(seed) * 40 - Math.random() * 20 - i * 10)
      }
      mountain.lineTo(width, height * 0.6)
      mountain.lineTo(0, height * 0.6)
      mountain.closePath()
      mountain.fillPath()
    }

    const particles = this.add.particles(0, 0, 'bg-particle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height * 0.5 },
      lifespan: 2000,
      speedY: { min: 10, max: 40 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.4, end: 0 },
      tint: 0xffd54f,
      quantity: 2,
      frequency: 300
    })
  }

  private createPlayer(width: number, height: number): void {
    const x = width * 0.2
    const y = height * 0.55

    this.playerSprite = this.add.container(x, y)

    const body = this.add.graphics()
    body.fillStyle(0x4fc3f7, 1)
    body.fillCircle(0, -20, 22)
    body.fillStyle(0x5c6bc0)
    body.fillRect(-18, 0, 36, 50)
    body.fillStyle(0x3f51b5)
    body.fillRect(-18, 0, 36, 8)

    const head = this.add.graphics()
    head.fillStyle(0xffe0b2)
    head.fillCircle(0, -20, 16)

    const hair = this.add.graphics()
    hair.fillStyle(0x1a1a2e)
    hair.fillCircle(0, -26, 16)
    hair.fillRect(-16, -30, 32, 10)

    const sword = this.add.graphics()
    sword.fillStyle(0x90caf9)
    sword.fillRect(28, -50, 4, 55)
    sword.fillStyle(0xffd54f)
    sword.fillRect(22, 0, 16, 4)

    const glow = this.add.graphics()
    glow.lineStyle(3, 0x4fc3f7, 0.4)
    glow.strokeCircle(0, 5, 50)

    this.playerSprite.add([glow, body, head, hair, sword])
    this.playerSprite.setSize(60, 100)

    const playerName = this.add.text(x, y + 70, this.player.name + ' Lv.' + this.player.level, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#4fc3f7'
    }).setOrigin(0.5)

    const barWidth = 180
    const barX = x - barWidth / 2
    const barY = y + 95

    this.hpBarPlayer = this.add.graphics()
    this.drawBar(this.hpBarPlayer, barX, barY, barWidth, 16, this.player.health / this.player.maxHealth, 0xe53935, 0x4e342e)
    this.playerHealth = this.add.text(x, barY + 8, this.player.health + '/' + this.player.maxHealth, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5)

    this.mpBarPlayer = this.add.graphics()
    this.drawBar(this.mpBarPlayer, barX, barY + 22, barWidth, 12, this.player.mana / this.player.maxMana, 0x1e88e5, 0x0d47a1)
    this.playerMana = this.add.text(x, barY + 28, this.player.mana + '/' + this.player.maxMana, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5)

    const elementBonuses = new Map<string, number>()
    this.player.treasures.forEach((t) => {
      if (t.element && t.element !== 'none' && t.elementDamageBonus) {
        const cur = elementBonuses.get(t.element) || 0
        elementBonuses.set(t.element, cur + t.elementDamageBonus * t.level)
      }
    })
    if (elementBonuses.size > 0) {
      const bonusParts = Array.from(elementBonuses.entries()).map(([el, bonus]) => {
        const info = ELEMENT_INFO[el as ElementType]
        return `${info.icon}${info.name}+${Math.round(bonus * 100)}%`
      })
      this.add.text(x, barY + 50, '法宝加成：' + bonusParts.join('  '), {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#ffd54f'
      }).setOrigin(0.5)
    }

    this.tweens.add({
      targets: this.playerSprite,
      y: y - 8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  private createEnemies(width: number, height: number): void {
    const startX = width * 0.62
    const spacing = 120

    this.enemies.forEach((enemy, index) => {
      const x = startX + index * spacing
      const y = height * 0.55
      this.createEnemySprite(enemy, index, x, y)
    })

    this.updateEnemyTarget()
  }

  private createEnemySprite(enemy: Enemy, index: number, x: number, y: number): void {
    const container = this.add.container(x, y)

    const body = this.add.graphics()
    body.fillStyle(enemy.color, 1)
    body.fillCircle(0, 0, enemy.size / 2)
    body.fillStyle(0x000000, 0.3)
    body.fillCircle(0, 0, enemy.size / 2 - 6)

    const eye1 = this.add.graphics()
    eye1.fillStyle(0xffffff)
    eye1.fillCircle(-enemy.size / 5, -enemy.size / 8, 5)
    eye1.fillStyle(0xff0000)
    eye1.fillCircle(-enemy.size / 5, -enemy.size / 8, 2.5)

    const eye2 = this.add.graphics()
    eye2.fillStyle(0xffffff)
    eye2.fillCircle(enemy.size / 5, -enemy.size / 8, 5)
    eye2.fillStyle(0xff0000)
    eye2.fillCircle(enemy.size / 5, -enemy.size / 8, 2.5)

    container.add([body, eye1, eye2])

    if (enemy.type === 'boss') {
      const bossCrown = this.add.graphics()
      bossCrown.fillStyle(0xffd54f, 1)
      bossCrown.beginPath()
      bossCrown.moveTo(-15, -enemy.size / 2 - 8)
      bossCrown.lineTo(-10, -enemy.size / 2 - 20)
      bossCrown.lineTo(-5, -enemy.size / 2 - 12)
      bossCrown.lineTo(0, -enemy.size / 2 - 24)
      bossCrown.lineTo(5, -enemy.size / 2 - 12)
      bossCrown.lineTo(10, -enemy.size / 2 - 20)
      bossCrown.lineTo(15, -enemy.size / 2 - 8)
      bossCrown.closePath()
      bossCrown.fillPath()
      container.add(bossCrown)

      const bossGlow = this.add.graphics()
      bossGlow.lineStyle(4, 0xffd54f, 0.6)
      bossGlow.strokeCircle(0, 0, enemy.size / 2 + 8)
      container.add(bossGlow)
      this.tweens.add({
        targets: bossGlow,
        alpha: { from: 0.6, to: 0.2 },
        duration: 1200,
        yoyo: true,
        repeat: -1
      })
    } else if (enemy.type === 'elite') {
      const eliteMark = this.add.graphics()
      eliteMark.lineStyle(3, 0xff9800, 0.8)
      eliteMark.strokeCircle(0, 0, enemy.size / 2 + 6)
      container.add(eliteMark)
      this.tweens.add({
        targets: eliteMark,
        alpha: { from: 0.8, to: 0.3 },
        duration: 1000,
        yoyo: true,
        repeat: -1
      })
    }

    if (enemy.element && enemy.element !== 'none') {
      const elementRing = this.add.graphics()
      const elementColor = ELEMENT_INFO[enemy.element].color
      elementRing.lineStyle(2, elementColor, 0.8)
      elementRing.strokeCircle(0, 0, enemy.size / 2 + 4)
      container.add(elementRing)
    }

    container.setSize(enemy.size, enemy.size)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerdown', () => {
      if (this.isPlayerTurn && !this.battleEnded && index === this.currentEnemyIndex) {
        this.playerAttack(0)
      }
    })

    this.enemySprites.push(container)

    let nameText = ''
    if (enemy.type === 'boss') {
      nameText = '👑 '
    } else if (enemy.type === 'elite') {
      nameText = '⭐ '
    }
    nameText += enemy.element && enemy.element !== 'none'
      ? `${getElementLabel(enemy.element)} ${enemy.name}`
      : enemy.name
    const name = this.add.text(x, y + enemy.size / 2 + 20, nameText, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: enemy.type === 'boss' ? '20px' : '18px',
      color: '#' + enemy.color.toString(16).padStart(6, '0'),
      fontStyle: enemy.type === 'boss' ? 'bold' : 'normal'
    }).setOrigin(0.5)
    this.enemyNames.push(name)

    const barWidth = 140
    const barX = x - barWidth / 2
    const barY = y + enemy.size / 2 + 42

    const hpBar = this.add.graphics()
    this.drawBar(hpBar, barX, barY, barWidth, 14, enemy.health / enemy.maxHealth, 0xe53935, 0x4e342e)
    this.hpBarsEnemy.push(hpBar)

    this.tweens.add({
      targets: container,
      y: y - 6,
      duration: 1500 + index * 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  private createBattleBeasts(width: number, height: number): void {
    const startX = width * 0.05
    const startY = height * 0.65
    const spacing = 80

    this.battleBeasts.forEach((beast, index) => {
      if (beast) {
        const x = startX + index * spacing
        const y = startY
        this.createBeastSprite(beast, index, x, y)
      } else {
        this.beastSprites.push(null)
        this.beastHpBars.push(null)
      }
    })
  }

  private createBeastSprite(beast: SpiritBeast, index: number, x: number, y: number): void {
    const template = getBeastTemplate(beast.templateId)
    if (!template) return

    const container = this.add.container(x, y)
    const spriteConfig = template.battleSprite
    const size = spriteConfig.size * (1 + (beast.stage - 1) * 0.1)

    const body = this.add.graphics()
    body.fillStyle(spriteConfig.bodyColor, 1)
    body.fillCircle(0, 0, size / 2)
    body.fillStyle(0x000000, 0.2)
    body.fillCircle(0, 0, size / 2 - 6)

    const eye1 = this.add.graphics()
    eye1.fillStyle(0xffffff)
    eye1.fillCircle(-size / 5, -size / 8, size / 10)
    eye1.fillStyle(spriteConfig.eyeColor)
    eye1.fillCircle(-size / 5, -size / 8, size / 20)

    const eye2 = this.add.graphics()
    eye2.fillStyle(0xffffff)
    eye2.fillCircle(size / 5, -size / 8, size / 10)
    eye2.fillStyle(spriteConfig.eyeColor)
    eye2.fillCircle(size / 5, -size / 8, size / 20)

    const glow = this.add.graphics()
    glow.lineStyle(2, beast.color, 0.5)
    glow.strokeCircle(0, 0, size / 2 + 5)

    container.add([body, eye1, eye2, glow])
    container.setSize(size, size)

    this.beastSprites.push(container)

    const name = this.add.text(x, y + size / 2 + 10, beast.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: '#' + beast.color.toString(16).padStart(6, '0')
    }).setOrigin(0.5)

    const barWidth = 60
    const barX = x - barWidth / 2
    const barY = y + size / 2 + 25

    const hpBar = this.add.graphics()
    this.drawBar(hpBar, barX, barY, barWidth, 8, beast.health / beast.maxHealth, 0x81c784, 0x4e342e)
    this.beastHpBars.push(hpBar)

    this.tweens.add({
      targets: container,
      y: y - 4,
      duration: 1800 + index * 150,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  private beastTurn(): void {
    const aliveBeasts = this.battleBeasts.map((beast, index) => ({ beast, index }))
      .filter(({ beast }) => beast && beast.health > 0)

    if (aliveBeasts.length === 0) {
      this.enemyTurn()
      return
    }

    let beastIndex = 0
    const executeNextBeast = () => {
      if (beastIndex >= aliveBeasts.length || this.battleEnded) {
        this.enemyTurn()
        return
      }

      const { beast, index } = aliveBeasts[beastIndex]
      if (!beast) {
        beastIndex++
        executeNextBeast()
        return
      }

      this.executeBeastAction(beast, index, () => {
        beastIndex++
        this.time.delayedCall(300, executeNextBeast)
      })
    }

    executeNextBeast()
  }

  private executeBeastAction(beast: SpiritBeast, beastIndex: number, onComplete: () => void): void {
    const availableSkills = this.spiritBeastManager.getAvailableSkills(beast)
    const usableSkills = availableSkills.filter(skill => skill.currentCooldown === 0)

    if (usableSkills.length > 0 && Math.random() < 0.6) {
      const skill = usableSkills[Math.floor(Math.random() * usableSkills.length)]
      this.useBeastSkill(beast, beastIndex, skill, onComplete)
    } else {
      this.beastBasicAttack(beast, beastIndex, onComplete)
    }
  }

  private useBeastSkill(beast: SpiritBeast, beastIndex: number, skill: SpiritBeastSkill, onComplete: () => void): void {
    this.spiritBeastManager.useSkill(beast, skill.id)

    const enemy = this.enemies[this.currentEnemyIndex]
    const elementResult = getElementMultiplier(skill.element, enemy.element)
    const treasureBonusResult = calculateTreasureElementBonus(this.player.treasures, skill.element)

    let msgParts = [`${beast.name} 使用了 ${skill.name}！`]
    if (elementResult.isAdvantage) msgParts.push('⚡克制！')
    if (elementResult.isDisadvantage) msgParts.push('🔻被克！')
    if (treasureBonusResult.totalBonus > 0) msgParts.push('法宝+' + Math.round(treasureBonusResult.totalBonus * 100) + '%')
    this.showMessage(msgParts.join(''))

    const beastSprite = this.beastSprites[beastIndex]
    const enemySprite = this.enemySprites[this.currentEnemyIndex]

    if (beastSprite) {
      this.tweens.add({
        targets: beastSprite,
        scale: 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Power2'
      })
    }

    this.time.delayedCall(200, () => {
      if (skill.type === 'attack' || skill.type === 'debuff') {
        if (skill.damage) {
          const attackBonus = this.activeBeastBuffs[beastIndex]?.attack || 0
          const totalAttack = beast.attack + attackBonus
          const baseDamage = skill.damage + totalAttack * 0.5
          const elementDamage = baseDamage * elementResult.multiplier
          const treasureAdjusted = Math.floor(elementDamage * (1 + treasureBonusResult.totalBonus))
          const defenseReduction = this.activeEnemyDebuffs[this.currentEnemyIndex]?.defenseDown || 0
          const effectiveDefense = Math.max(0, enemy.defense - defenseReduction)
          const actualDamage = Math.max(1, Math.floor(treasureAdjusted - effectiveDefense * 0.3))

          if (elementResult.isAdvantage) {
            this.elementStats.advantageHits++
            this.elementStats.totalElementBonusDamage += Math.floor(baseDamage * 0.5)
          }
          if (elementResult.isDisadvantage) {
            this.elementStats.disadvantageHits++
          }

          enemy.health -= actualDamage
          const dmgColor = elementResult.isAdvantage ? 0xffd54f : elementResult.isDisadvantage ? 0x78909c : skill.color
          this.showDamageText(enemySprite.x, enemySprite.y - 30, actualDamage, dmgColor)

          if (elementResult.isAdvantage) {
            this.showElementAdvantageText(enemySprite.x, enemySprite.y - 55)
          } else if (elementResult.isDisadvantage) {
            this.showElementDisadvantageText(enemySprite.x, enemySprite.y - 55)
          }

          if (enemySprite) {
            this.tweens.add({
              targets: enemySprite,
              x: enemySprite.x + '+=15',
              alpha: 0.6,
              duration: 100,
              yoyo: true,
              repeat: 2
            })
          }

          this.createBeastSkillEffect(skill.color, enemySprite.x, enemySprite.y)
        }

        if (skill.debuffEffect) {
          const debuff = this.activeEnemyDebuffs[this.currentEnemyIndex]
          if (skill.debuffEffect.type === 'defenseDown') {
            debuff.defenseDown = Math.max(debuff.defenseDown, skill.debuffEffect.value)
          } else if (skill.debuffEffect.type === 'attackDown') {
            debuff.attackDown = Math.max(debuff.attackDown, skill.debuffEffect.value)
          }
          this.showMessage(`敌人受到 ${skill.debuffEffect.type === 'defenseDown' ? '降低防御' : '降低攻击'} 效果！`)
        }
      }

      if (skill.type === 'heal' || (skill.type === 'attack' && skill.heal)) {
        const healAmount = skill.heal || 0
        this.player.health = Math.min(this.player.maxHealth, this.player.health + healAmount)
        this.showDamageText(this.playerSprite.x, this.playerSprite.y - 50, healAmount, 0x81c784, true)
        this.showMessage(`${beast.name} 治愈了你 ${healAmount} 点生命！`)
      }

      if (skill.type === 'buff' && skill.buffEffect) {
        const buff = this.activeBeastBuffs[beastIndex]
        if (skill.buffEffect.type === 'attack') {
          buff.attack = Math.max(buff.attack, skill.buffEffect.value)
        } else if (skill.buffEffect.type === 'defense') {
          buff.defense = Math.max(buff.defense, skill.buffEffect.value)
        } else if (skill.buffEffect.type === 'critRate') {
          buff.critRate = Math.max(buff.critRate, skill.buffEffect.value)
        } else if (skill.buffEffect.type === 'critDamage') {
          buff.critDamage = Math.max(buff.critDamage, skill.buffEffect.value)
        }
        this.showMessage(`你获得了 ${skill.buffEffect.type === 'attack' ? '攻击提升' : skill.buffEffect.type === 'defense' ? '防御提升' : '暴击提升'} 效果！`)
      }

      this.updateUI()
      this.time.delayedCall(500, onComplete)
    })
  }

  private beastBasicAttack(beast: SpiritBeast, beastIndex: number, onComplete: () => void): void {
    const beastSprite = this.beastSprites[beastIndex]
    const enemySprite = this.enemySprites[this.currentEnemyIndex]
    const enemy = this.enemies[this.currentEnemyIndex]

    if (beastSprite) {
      this.tweens.add({
        targets: beastSprite,
        x: beastSprite.x + 60,
        duration: 250,
        yoyo: true,
        ease: 'Power2'
      })
    }

    this.time.delayedCall(250, () => {
      const attackBonus = this.activeBeastBuffs[beastIndex]?.attack || 0
      const totalAttack = beast.attack + attackBonus
      const defenseReduction = this.activeEnemyDebuffs[this.currentEnemyIndex]?.defenseDown || 0
      const effectiveDefense = Math.max(0, enemy.defense - defenseReduction)
      const rawDamage = totalAttack - effectiveDefense * 0.3
      const { multiplier, isAdvantage, isDisadvantage } = getElementMultiplier(undefined, enemy.element)
      const actualDamage = Math.max(1, Math.floor(rawDamage * multiplier))

      if (isAdvantage) {
        this.elementStats.advantageHits++
      }
      if (isDisadvantage) {
        this.elementStats.disadvantageHits++
      }

      enemy.health -= actualDamage
      const dmgColor = isAdvantage ? 0xffd54f : isDisadvantage ? 0x78909c : beast.color
      this.showDamageText(enemySprite.x, enemySprite.y - 30, actualDamage, dmgColor)

      if (enemySprite) {
        this.tweens.add({
          targets: enemySprite,
          x: enemySprite.x + '+=10',
          alpha: 0.7,
          duration: 100,
          yoyo: true
        })
      }

      this.createBeastSkillEffect(beast.color, enemySprite.x, enemySprite.y)
      this.updateUI()
      this.time.delayedCall(400, onComplete)
    })
  }

  private createBeastSkillEffect(color: number, x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8
      const particle = this.add.circle(x, y, 5, color, 0.8)
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 50,
        y: y + Math.sin(angle) * 50,
        alpha: 0,
        scale: 0,
        duration: 400,
        onComplete: () => particle.destroy()
      })
    }
  }

  private showDamageText(x: number, y: number, damage: number, color: number, isHeal: boolean = false, isCrit: boolean = false): void {
    const prefix = isHeal ? '+' : '-'
    const fontSize = isCrit ? '32px' : '24px'
    const textContent = isCrit ? `💥${prefix}${damage}!` : `${prefix}${damage}`
    const text = this.add.text(x, y, textContent, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize,
      color: '#' + color.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    if (isCrit) {
      text.setScale(0.5)
      this.tweens.add({
        targets: text,
        scale: 1.5,
        duration: 150,
        yoyo: true,
        ease: 'Power2'
      })
    }

    this.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      scale: isCrit ? 1.2 : 1.2,
      duration: 800,
      ease: 'Cubic.Out',
      onComplete: () => text.destroy()
    })
  }

  private showElementAdvantageText(x: number, y: number): void {
    const text = this.add.text(x, y, '⚡克制！', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#ffd54f',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    this.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.Out',
      onComplete: () => text.destroy()
    })
  }

  private showElementDisadvantageText(x: number, y: number): void {
    const text = this.add.text(x, y, '🔻被克！', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '20px',
      color: '#78909c',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    this.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.Out',
      onComplete: () => text.destroy()
    })
  }

  private tickBeastCooldowns(): void {
    this.battleBeasts.forEach(beast => {
      if (beast) {
        this.spiritBeastManager.tickCooldowns(beast)
      }
    })
  }

  private createSkillBar(width: number, height: number): void {
    const skills = SkillSystem.getUnlockedSkills(this.player)
    const barY = height - 90
    const spacing = 110
    const totalWidth = skills.length * spacing - 20
    const startX = (width - totalWidth) / 2 + 45

    skills.forEach((skill, index) => {
      const x = startX + index * spacing
      const btn = this.createSkillButton(x, barY, skill, index)
      this.skillButtons.push(btn)
    })
  }

  private createSkillButton(x: number, y: number, skill: Skill, index: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const size = 80
    const effectiveStats = SkillSystem.getEffectiveStats(skill)
    const selectedBranches = SkillSystem.getSelectedBranches(skill)

    const bg = this.add.graphics()
    const canUse = SkillSystem.canUseSkill(this.player, skill)
    const bgColor = canUse ? 0x000000 : 0x333333
    bg.fillStyle(bgColor, 0.75)
    bg.lineStyle(2, skill.color, canUse ? 1 : 0.4)
    this.roundedRect(bg, -size / 2, -size / 2, size, size, 10)

    const levelText = this.add.text(-size / 2 + 8, size / 2 - 8, 'Lv.' + skill.level, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '11px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0, 1)

    const iconText = this.add.text(0, -10, skill.icon, {
      fontFamily: 'serif',
      fontSize: '32px',
      color: '#' + skill.color.toString(16).padStart(6, '0')
    }).setOrigin(0.5)

    const nameText = this.add.text(0, 18, skill.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: canUse ? '#ffffff' : '#888888'
    }).setOrigin(0.5)

    const cooldownText = this.add.text(size / 2 - 8, -size / 2 + 8, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#ef5350',
      fontStyle: 'bold'
    }).setOrigin(1, 0)

    if (skill.currentCooldown > 0) {
      cooldownText.setText(skill.currentCooldown.toString())
    }

    const manaText = this.add.text(0, size / 2 + 14, '灵气 ' + effectiveStats.manaCost, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '11px',
      color: this.player.mana >= effectiveStats.manaCost ? '#4fc3f7' : '#ef5350'
    }).setOrigin(0.5)

    const damageText = this.add.text(size / 2 - 8, size / 2 - 8, effectiveStats.damage.toString(), {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '11px',
      color: '#ff8a65',
      fontStyle: 'bold'
    }).setOrigin(1, 1)

    if (effectiveStats.cooldown > 0) {
      const cdTagText = this.add.text(-size / 2 + 8, -size / 2 + 22, 'CD:' + effectiveStats.cooldown, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '10px',
        color: '#81c784',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0)
      container.add(cdTagText)
    }

    container.add([bg, iconText, nameText, cooldownText, manaText, levelText, damageText])

    if (skill.element && skill.element !== 'none') {
      const elementTag = this.add.text(-size / 2 + 6, -size / 2 + 4, ELEMENT_INFO[skill.element].icon + ELEMENT_INFO[skill.element].name, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '11px',
        color: '#' + ELEMENT_INFO[skill.element].color.toString(16).padStart(6, '0'),
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0)
      container.add(elementTag)
    }

    if (selectedBranches.length > 0) {
      const branchIcons = selectedBranches.map(b => b.icon).join('')
      const branchTag = this.add.text(0, -size / 2 - 6, branchIcons, {
        fontFamily: 'serif',
        fontSize: '14px'
      }).setOrigin(0.5)
      container.add(branchTag)
    }

    container.setSize(size, size)

    if (canUse) {
      container.setInteractive({ useHandCursor: true })
      container.on('pointerdown', () => this.playerAttack(index))
      container.on('pointerover', () => {
        this.tweens.add({ targets: container, scale: 1.1, duration: 150 })
      })
      container.on('pointerout', () => {
        this.tweens.add({ targets: container, scale: 1, duration: 150 })
      })
    }

    return container
  }

  private drawBar(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, ratio: number, fgColor: number, bgColor: number): void {
    graphics.clear()
    graphics.fillStyle(bgColor)
    graphics.fillRect(x, y, width, height)
    graphics.fillStyle(fgColor)
    graphics.fillRect(x, y, Math.max(0, width * Math.min(1, ratio)), height)
    graphics.lineStyle(1, 0x000000, 0.6)
    graphics.strokeRect(x, y, width, height)
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

  private playerAttack(skillIndex: number): void {
    if (!this.isPlayerTurn || this.battleEnded) return

    const skills = SkillSystem.getUnlockedSkills(this.player)
    const skill = skills[skillIndex]
    if (!SkillSystem.canUseSkill(this.player, skill)) {
      this.showMessage('无法使用该技能！')
      return
    }

    this.isPlayerTurn = false
    this.battleStats.turnsElapsed++
    const enemy = this.enemies[this.currentEnemyIndex]
    const skillResult = SkillSystem.useSkill(this.player, skill, enemy.element)
    const baseDamage = skillResult.damage || 0

    if (skillResult.isAdvantage) {
      this.elementStats.advantageHits++
      this.elementStats.totalElementBonusDamage += Math.floor(baseDamage * 0.5)
    }
    if (skillResult.isDisadvantage) {
      this.elementStats.disadvantageHits++
    }

    const isCrit = Math.random() < this.player.critRate
    let damage = baseDamage
    let damageColor = 0xffd54f
    let critText = ''

    if (isCrit) {
      damage = Math.floor(baseDamage * (1 + this.player.critDamage))
      damageColor = 0xff5722
      critText = '暴击！'
      this.battleStats.critCount++
      this.battleStats.critTotal += damage
    }

    const elementConstraintText = getElementConstraintText(skill.element || 'none', enemy.element || 'none')
    let msgParts = [skill.name + '！']
    if (critText) msgParts.push(critText)
    if (elementConstraintText) msgParts.push(elementConstraintText)
    if (skillResult.treasureBonus > 0) msgParts.push('法宝+' + Math.round(skillResult.treasureBonus * 100) + '%')
    msgParts.push('造成 ' + damage + ' 点伤害')
    this.showMessage(msgParts.join(''))

    this.tweens.add({
      targets: this.playerSprite,
      x: this.playerSprite.x + 80,
      duration: 200,
      yoyo: true,
      ease: 'Power2'
    })

    this.time.delayedCall(200, () => {
      const effectColor = skillResult.isAdvantage ? ELEMENT_INFO[skill.element || 'none'].color : skill.color
      this.createSkillEffect(effectColor, this.enemySprites[this.currentEnemyIndex].x, this.enemySprites[this.currentEnemyIndex].y)

      const actualDamage = Math.max(1, damage - Math.floor(enemy.defense * 0.3))
      enemy.health -= actualDamage
      this.battleStats.totalDamageDealt += actualDamage

      if (skillResult.isAdvantage) {
        this.showElementAdvantageText(this.enemySprites[this.currentEnemyIndex].x, this.enemySprites[this.currentEnemyIndex].y - 55)
      } else if (skillResult.isDisadvantage) {
        this.showElementDisadvantageText(this.enemySprites[this.currentEnemyIndex].x, this.enemySprites[this.currentEnemyIndex].y - 55)
      }

      this.tweens.add({
        targets: this.enemySprites[this.currentEnemyIndex],
        x: this.enemySprites[this.currentEnemyIndex].x + '+=20',
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 2
      })

      this.showDamageText(this.enemySprites[this.currentEnemyIndex].x, this.enemySprites[this.currentEnemyIndex].y - 30, actualDamage, damageColor, false, isCrit)
      this.updateUI()

      this.time.delayedCall(600, () => {
        if (enemy.health <= 0) {
          this.enemyDefeated()
        } else {
          this.checkBossPhaseTransition(enemy)
          this.beastTurn()
        }
      })
    })
  }

  private createSkillEffect(color: number, x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12
      const particle = this.add.circle(x, y, 6, color, 0.9)
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 80,
        y: y + Math.sin(angle) * 80,
        alpha: 0,
        scale: 0,
        duration: 500,
        onComplete: () => particle.destroy()
      })
    }

    const slash = this.add.graphics()
    slash.lineStyle(4, color, 1)
    slash.beginPath()
    slash.arc(x, y, 60, -0.5, 0.5)
    slash.strokePath()
    this.tweens.add({
      targets: slash,
      scale: 1.5,
      alpha: 0,
      duration: 400,
      onComplete: () => slash.destroy()
    })
  }

  private enemyDefeated(): void {
    const sprite = this.enemySprites[this.currentEnemyIndex]
    const defeatedEnemy = this.enemies[this.currentEnemyIndex]
    this.battleStats.enemiesDefeated++

    let defeatMsg = defeatedEnemy.name + ' 已被击败！'
    if (defeatedEnemy.type === 'boss') {
      this.battleStats.bossDefeated++
      defeatMsg = '👑 ' + defeatedEnemy.name + ' 已被斩杀！'
    } else if (defeatedEnemy.type === 'elite') {
      this.battleStats.eliteDefeated++
      defeatMsg = '⭐ ' + defeatedEnemy.name + ' 已被击败！'
    }
    this.showMessage(defeatMsg)

    const save = this.saveManager.loadGame()!
    const { unlockedAchievements } = this.achievementManager.updateProgress(save, {
      type: 'monster_defeat',
      id: defeatedEnemy.id,
      value: 1,
      stageId: this.stage.id
    })

    if (unlockedAchievements.length > 0) {
      this.showAchievementNotification(unlockedAchievements)
    }

    if (defeatedEnemy.type === 'boss') {
      this.cameras.main.flash(400, 255, 215, 0)
    } else if (defeatedEnemy.type === 'elite') {
      this.cameras.main.flash(300, 255, 152, 0)
    }

    this.tweens.add({
      targets: sprite,
      scale: 0,
      alpha: 0,
      rotation: Math.PI,
      duration: 600,
      ease: 'Back.In'
    })

    this.time.delayedCall(700, () => {
      sprite.visible = false
      this.enemyNames[this.currentEnemyIndex].visible = false
      this.hpBarsEnemy[this.currentEnemyIndex].visible = false

      this.currentEnemyIndex++
      if (this.currentEnemyIndex >= this.enemies.length) {
        this.battleVictory()
      } else {
        const nextEnemy = this.enemies[this.currentEnemyIndex]
        if (nextEnemy.type === 'boss') {
          this.showMessage('👑 首领出现！小心应战！')
          this.cameras.main.shake(300, 0.01)
        } else if (nextEnemy.type === 'elite') {
          this.showMessage('⭐ 精英怪出现！')
        } else {
          this.showMessage('你的回合！选择一个技能')
        }
        this.updateEnemyTarget()
        this.isPlayerTurn = true
        this.refreshSkillButtons()
      }
    })
  }

  private updateEnemyTarget(): void {
    this.enemySprites.forEach((sprite, idx) => {
      if (idx === this.currentEnemyIndex) {
        sprite.list.forEach((child) => {
          if (child.type === 'Graphics') {
            ;(child as Phaser.GameObjects.Graphics).setAlpha(1)
          }
        })
        const targetMark = this.add.graphics()
        targetMark.lineStyle(2, 0xffd54f, 1)
        targetMark.strokeCircle(0, 0, this.enemies[idx].size / 2 + 10)
        sprite.add(targetMark)
        this.tweens.add({
          targets: targetMark,
          alpha: { from: 1, to: 0.3 },
          duration: 800,
          yoyo: true,
          repeat: -1
        })
      }
    })
  }

  private enemyTurn(): void {
    this.isPlayerTurn = false
    this.showMessage('敌人的回合...')

    this.tickEnemySkillCooldowns()

    this.time.delayedCall(800, () => {
      const enemy = this.enemies[this.currentEnemyIndex]
      const sprite = this.enemySprites[this.currentEnemyIndex]

      const specialSkill = this.tryUseEnemySpecialSkill(enemy)
      if (specialSkill) {
        this.executeEnemySpecialSkill(enemy, specialSkill, sprite)
        return
      }

      this.tweens.add({
        targets: sprite,
        x: sprite.x - 80,
        duration: 200,
        yoyo: true,
        ease: 'Power2'
      })

      this.time.delayedCall(200, () => {
        const attackReduction = this.activeEnemyDebuffs[this.currentEnemyIndex]?.attackDown || 0
        let baseDamage = enemy.attack - attackReduction
        if (enemy.type === 'boss' && enemy.phases && enemy.currentPhase !== undefined) {
          const phase = enemy.phases[enemy.currentPhase]
          if (phase) baseDamage = Math.floor(baseDamage * phase.attackMultiplier)
        }
        baseDamage = Math.max(1, baseDamage)
        const { multiplier: enemyMultiplier, isAdvantage: enemyAdv, isDisadvantage: enemyDisadv } = getElementMultiplier(enemy.element, undefined)
        const adjustedDamage = Math.floor(baseDamage * enemyMultiplier)
        const actualDamage = Math.max(1, adjustedDamage - Math.floor(this.player.defense * 0.5))
        this.player.health -= actualDamage
        this.battleStats.totalDamageTaken += actualDamage

        let msg = enemy.name + ' 攻击你，造成 ' + actualDamage + ' 点伤害'
        if (enemyAdv) {
          msg = enemy.name + ' 攻击你！⚡克制！造成 ' + actualDamage + ' 点伤害'
        } else if (enemyDisadv) {
          msg = enemy.name + ' 攻击你！🔻被克！造成 ' + actualDamage + ' 点伤害'
        }

        this.tweens.add({
          targets: this.playerSprite,
          x: this.playerSprite.x + '+=15',
          alpha: 0.6,
          duration: 100,
          yoyo: true,
          repeat: 2
        })

        this.cameras.main.shake(200, enemy.type === 'boss' ? 0.01 : 0.005)
        const dmgColor = enemyAdv ? 0xff5722 : enemyDisadv ? 0x78909c : 0xef5350
        this.showDamageText(this.playerSprite.x, this.playerSprite.y - 50, actualDamage, dmgColor)
        this.showMessage(msg)
        this.updateUI()

        this.time.delayedCall(700, () => {
          if (this.player.health <= 0) {
            this.battleDefeat()
          } else {
            SkillSystem.tickCooldowns(this.player)
            SkillSystem.restoreMana(this.player, 8)
            this.tickBeastCooldowns()
            this.isPlayerTurn = true
            this.showMessage('你的回合！选择一个技能')
            this.refreshSkillButtons()
          }
        })
      })
    })
  }

  private tryUseEnemySpecialSkill(enemy: Enemy): EnemySpecialSkill | null {
    if (!enemy.specialSkills || enemy.specialSkills.length === 0) return null

    const availableSkills = enemy.specialSkills.filter(skill => {
      const cd = this.enemySkillCooldowns.get(skill.id) || 0
      return cd === 0 && Math.random() < skill.chance
    })

    if (availableSkills.length === 0) return null

    const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)]
    this.enemySkillCooldowns.set(skill.id, skill.cooldown)
    return skill
  }

  private executeEnemySpecialSkill(enemy: Enemy, skill: EnemySpecialSkill, sprite: Phaser.GameObjects.Container): void {
    this.battleStats.specialSkillUses++
    this.showMessage(`${skill.icon} ${enemy.name} 使用了 ${skill.name}！`)

    if (sprite) {
      this.tweens.add({
        targets: sprite,
        scale: 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Power2'
      })
    }

    this.createEnemySkillEffect(skill.color, sprite.x, sprite.y)

    this.time.delayedCall(300, () => {
      if (skill.damage) {
        const attackReduction = this.activeEnemyDebuffs[this.currentEnemyIndex]?.attackDown || 0
        let baseAtk = enemy.attack - attackReduction
        if (enemy.type === 'boss' && enemy.phases && enemy.currentPhase !== undefined) {
          const phase = enemy.phases[enemy.currentPhase]
          if (phase) baseAtk = Math.floor(baseAtk * phase.attackMultiplier)
        }
        const totalDamage = Math.max(1, skill.damage + Math.floor(baseAtk * 0.3) - Math.floor(this.player.defense * 0.3))
        this.player.health -= totalDamage
        this.battleStats.totalDamageTaken += totalDamage

        this.tweens.add({
          targets: this.playerSprite,
          x: this.playerSprite.x + '+=20',
          alpha: 0.5,
          duration: 100,
          yoyo: true,
          repeat: 2
        })

        this.cameras.main.shake(300, 0.008)
        this.showDamageText(this.playerSprite.x, this.playerSprite.y - 50, totalDamage, skill.color)
      }

      if (skill.heal) {
        enemy.health = Math.min(enemy.maxHealth, enemy.health + skill.heal)
        this.showDamageText(sprite.x, sprite.y - 40, skill.heal, 0x81c784, true)
      }

      if (skill.debuffEffect) {
        const playerDebuffType = skill.debuffEffect.type
        if (playerDebuffType === 'defenseDown') {
          this.activeEnemyDebuffs[this.currentEnemyIndex].defenseDown = Math.max(0, this.activeEnemyDebuffs[this.currentEnemyIndex].defenseDown)
          this.player.defense = Math.max(1, this.player.defense - skill.debuffEffect.value)
          this.showMessage(`你受到了防御降低效果！`)
        } else if (playerDebuffType === 'attackDown') {
          this.player.attack = Math.max(1, this.player.attack - skill.debuffEffect.value)
          this.showMessage(`你受到了攻击降低效果！`)
        } else if (playerDebuffType === 'burn') {
          const burnDmg = skill.debuffEffect.value
          this.player.health -= burnDmg
          this.battleStats.totalDamageTaken += burnDmg
          this.showDamageText(this.playerSprite.x, this.playerSprite.y - 50, burnDmg, 0xff5722)
          this.showMessage(`灼烧造成 ${burnDmg} 点伤害！`)
        }
      }

      if (skill.buffEffect) {
        if (skill.buffEffect.type === 'attack') {
          enemy.attack += skill.buffEffect.value
          this.showMessage(`${enemy.name} 攻击力提升！`)
        } else if (skill.buffEffect.type === 'defense') {
          enemy.defense += skill.buffEffect.value
          this.showMessage(`${enemy.name} 防御力提升！`)
        }
      }

      this.updateUI()

      this.time.delayedCall(700, () => {
        if (this.player.health <= 0) {
          this.battleDefeat()
        } else {
          SkillSystem.tickCooldowns(this.player)
          SkillSystem.restoreMana(this.player, 8)
          this.tickBeastCooldowns()
          this.isPlayerTurn = true
          this.showMessage('你的回合！选择一个技能')
          this.refreshSkillButtons()
        }
      })
    })
  }

  private createEnemySkillEffect(color: number, x: number, y: number): void {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16
      const particle = this.add.circle(x, y, 4, color, 0.9)
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 90,
        y: y + Math.sin(angle) * 90,
        alpha: 0,
        scale: 0,
        duration: 600,
        onComplete: () => particle.destroy()
      })
    }
  }

  private tickEnemySkillCooldowns(): void {
    this.enemySkillCooldowns.forEach((cd, key) => {
      if (cd > 0) {
        this.enemySkillCooldowns.set(key, cd - 1)
      }
    })
  }

  private checkBossPhaseTransition(enemy: Enemy): void {
    if (enemy.type !== 'boss' || !enemy.phases) return

    const currentPhaseIndex = enemy.currentPhase || 0
    const nextPhaseIndex = currentPhaseIndex + 1
    if (nextPhaseIndex >= enemy.phases.length) return

    const nextPhase = enemy.phases[nextPhaseIndex]
    const healthRatio = enemy.health / enemy.maxHealth

    if (healthRatio <= nextPhase.healthThreshold) {
      enemy.currentPhase = nextPhaseIndex
      enemy.specialSkills = nextPhase.specialSkills
      enemy.attack = Math.floor(enemy.attack * nextPhase.attackMultiplier / (currentPhaseIndex > 0 ? enemy.phases[currentPhaseIndex].attackMultiplier : 1))
      enemy.defense = Math.floor(enemy.defense * nextPhase.defenseMultiplier / (currentPhaseIndex > 0 ? enemy.phases[currentPhaseIndex].defenseMultiplier : 1))
      enemy.color = nextPhase.color

      this.battleStats.phaseTransitions.push({
        phase: nextPhaseIndex,
        phaseName: nextPhase.name,
        message: nextPhase.message,
        color: nextPhase.color
      })

      this.showPhaseTransitionAnnouncement(nextPhase)

      const sprite = this.enemySprites[this.currentEnemyIndex]
      if (sprite) {
        this.cameras.main.shake(500, 0.012)
        this.cameras.main.flash(300, nextPhase.color >> 16 & 0xff, nextPhase.color >> 8 & 0xff, nextPhase.color & 0xff)
        this.tweens.add({
          targets: sprite,
          scale: 1.3,
          duration: 200,
          yoyo: true,
          ease: 'Power2'
        })
      }

      this.updateEnemyName(enemy)
    }
  }

  private showPhaseTransitionAnnouncement(phase: { name: string; message: string; color: number }): void {
    if (this.phaseAnnouncement) {
      this.phaseAnnouncement.destroy()
    }

    const { width, height } = this.scale
    this.phaseAnnouncement = this.add.container(width / 2, height / 2 - 40)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.85)
    bg.lineStyle(3, phase.color, 1)
    this.roundedRect(bg, -220, -50, 440, 100, 16)
    this.phaseAnnouncement.add(bg)

    const phaseName = this.add.text(0, -20, '⚡ ' + phase.name + ' ⚡', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: '#' + phase.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)
    this.phaseAnnouncement.add(phaseName)

    const message = this.add.text(0, 15, phase.message, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5)
    this.phaseAnnouncement.add(message)

    this.phaseAnnouncement.setAlpha(0)
    this.phaseAnnouncement.setScale(0.5)
    this.tweens.add({
      targets: this.phaseAnnouncement,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut'
    })

    this.tweens.add({
      targets: this.phaseAnnouncement,
      alpha: 0,
      y: height / 2 - 80,
      duration: 400,
      delay: 2000,
      ease: 'Cubic.In',
      onComplete: () => {
        if (this.phaseAnnouncement) {
          this.phaseAnnouncement.destroy()
          this.phaseAnnouncement = null
        }
      }
    })
  }

  private updateEnemyName(enemy: Enemy): void {
    const nameObj = this.enemyNames[this.currentEnemyIndex]
    if (!nameObj) return
    let nameText = '👑 '
    nameText += enemy.element && enemy.element !== 'none'
      ? `${getElementLabel(enemy.element)} ${enemy.name}`
      : enemy.name
    if (enemy.phases && enemy.currentPhase !== undefined && enemy.currentPhase > 0) {
      const phaseName = enemy.phases[enemy.currentPhase]?.name || enemy.name
      nameText = '👑 ' + (enemy.element && enemy.element !== 'none' ? `${getElementLabel(enemy.element)} ` : '') + phaseName
    }
    nameObj.setText(nameText)
    nameObj.setColor('#' + enemy.color.toString(16).padStart(6, '0'))
  }

  private battleVictory(): void {
    this.battleEnded = true
    this.showMessage('战斗胜利！')

    this.cameras.main.flash(500, 255, 255, 200)

    const save = this.saveManager.loadGame()!

    const { unlockedAchievements: stageAchievements } = this.achievementManager.updateProgress(save, {
      type: 'stage_clear',
      value: 1,
      stageId: this.stage.id
    })

    this.achievementManager.checkStageStories(save, this.stage.id)

    const allUnlocked = stageAchievements

    const herbDrops = this.alchemyManager.rollHerbDrops(this.stage.id)
    this.alchemyManager.applyHerbDrops(save.alchemy, herbDrops)

    const materialDrops = this.equipmentManager.rollMaterialDrops(this.stage.id)
    this.equipmentManager.applyMaterialDrops(save.equipment, materialDrops)
    this.equipmentManager.checkTemplateUnlock(save.equipment, save.highestStage)

    const result: BattleResult = {
      victory: true,
      stageId: this.stage.id,
      expGained: this.stage.rewards.exp,
      goldGained: this.stage.rewards.gold,
      spiritGained: this.stage.rewards.spirit,
      playerHealth: this.player.health,
      herbDrops,
      elementStats: { ...this.elementStats },
      specialDrops: this.rollSpecialDrops(),
      statistics: { ...this.battleStats }
    }

    save.player = this.player
    save.player.gold += result.goldGained
    save.player.spirit += result.spiritGained
    const permBonus = this.alchemyManager.getPermanentBonus(save.alchemy)
    const levelResult = this.saveManager.addExp(save.player, result.expGained, permBonus)
    this.saveManager.recalcPlayerStatsFromSave(save)
    this.alchemyManager.checkRecipeUnlock(save.alchemy, save.player.level)

    this.battleBeasts.forEach((beast, index) => {
      if (beast) {
        const saveBeast = save.spiritBeast.beasts.find(b => b.id === beast.id)
        if (saveBeast) {
          saveBeast.health = beast.health
        }
      }
    })

    if (this.stage.id >= save.highestStage) {
      save.highestStage = Math.min(this.stage.id + 1, STAGES.length)
    }
    save.currentStage = save.highestStage

    let chapterRewards: ChapterReward[] = []
    let shouldShowClosingStory = false
    let shouldShowReview = false
    let victoryDialogueNode: ChapterDialogueNode | null = null

    if (this.isChapterBattle && this.chapterId && this.levelId) {
      victoryDialogueNode = this.chapterManager.getVictoryDialogueNodeForLevel(save, this.chapterId, this.levelId)
      
      if (victoryDialogueNode) {
        chapterRewards = this.chapterManager.completeLevel(save, this.chapterId, this.levelId, true)
      } else {
        shouldShowClosingStory = this.chapterManager.shouldShowClosingStory(save, this.chapterId)
        chapterRewards = this.chapterManager.completeLevel(save, this.chapterId, this.levelId, shouldShowClosingStory)
        shouldShowReview = this.chapterManager.isChapterCompleted(save, this.chapterId)
      }
    }

    this.saveManager.saveGame(save)

    if (allUnlocked.length > 0) {
      this.showAchievementNotification(allUnlocked)
    }

    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(500)
      this.time.delayedCall(500, () => {
        if (this.isChapterBattle && this.chapterId && this.levelId) {
          if (victoryDialogueNode) {
            this.scene.start('StoryScene', {
              chapterId: this.chapterId,
              levelId: this.levelId,
              isVictoryStory: true,
              victoryDialogueNodeId: victoryDialogueNode.id,
              battleResult: result,
              chapterRewards,
              leveledUp: levelResult.leveledUp,
              levels: levelResult.levels
            })
          } else if (shouldShowClosingStory) {
            this.scene.start('StoryScene', {
              chapterId: this.chapterId,
              isClosingStory: true
            })
          } else if (shouldShowReview) {
            this.scene.start('ChapterReviewScene', {
              chapterId: this.chapterId
            })
          } else {
            this.scene.start('ChapterMapScene', {
              chapterId: this.chapterId
            })
          }
        } else {
          this.scene.start('ResultScene', { result, leveledUp: levelResult.leveledUp, levels: levelResult.levels })
        }
      })
    })
  }

  private battleDefeat(): void {
    this.battleEnded = true

    const save = this.saveManager.loadGame()!

    const canRevive = this.reviveCount < MAX_REVIVE_COUNT
    if (!canRevive) {
      this.player.health = Math.floor(this.player.maxHealth * 0.5)
      SkillSystem.fullRestore(this.player)
    }

    save.player = this.player

    this.battleBeasts.forEach((beast, index) => {
      if (beast) {
        const saveBeast = save.spiritBeast.beasts.find(b => b.id === beast.id)
        if (saveBeast) {
          saveBeast.health = beast.maxHealth
        }
      }
    })

    this.saveManager.saveGame(save)

    this.showMessage('你被击败了...')
    this.cameras.main.flash(500, 255, 0, 0)

    const result: BattleResult = {
      victory: false,
      stageId: this.stage.id,
      expGained: 0,
      goldGained: 0,
      spiritGained: 0,
      playerHealth: this.player.health,
      statistics: { ...this.battleStats },
      reviveCount: this.reviveCount
    }

    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(500)
      this.time.delayedCall(500, () => {
        this.scene.start('ResultScene', { result, leveledUp: false, levels: 0, chapterId: this.chapterId, levelId: this.levelId, isChapterBattle: this.isChapterBattle })
      })
    })
  }

  private updateUI(): void {
    const barWidth = 180
    const barX = this.playerSprite.x - barWidth / 2
    const barY = this.playerSprite.y + 95

    this.drawBar(this.hpBarPlayer, barX, barY, barWidth, 16, this.player.health / this.player.maxHealth, 0xe53935, 0x4e342e)
    this.playerHealth.setText(Math.max(0, this.player.health) + '/' + this.player.maxHealth)

    this.drawBar(this.mpBarPlayer, barX, barY + 22, barWidth, 12, this.player.mana / this.player.maxMana, 0x1e88e5, 0x0d47a1)
    this.playerMana.setText(Math.max(0, this.player.mana) + '/' + this.player.maxMana)

    this.updateExpGoldText()

    this.enemies.forEach((enemy, index) => {
      if (index < this.hpBarsEnemy.length && this.hpBarsEnemy[index]) {
        const barWidth = 140
        const barX = this.enemySprites[index].x - barWidth / 2
        const barY = this.enemySprites[index].y + enemy.size / 2 + 42
        this.drawBar(this.hpBarsEnemy[index], barX, barY, barWidth, 14, Math.max(0, enemy.health) / enemy.maxHealth, 0xe53935, 0x4e342e)
      }
    })

    this.battleBeasts.forEach((beast, index) => {
      if (beast && this.beastHpBars[index] && this.beastSprites[index]) {
        const template = getBeastTemplate(beast.templateId)
        if (!template) return
        const size = template.battleSprite.size * (1 + (beast.stage - 1) * 0.1)
        const barWidth = 60
        const barX = this.beastSprites[index].x - barWidth / 2
        const barY = this.beastSprites[index].y + size / 2 + 25
        this.drawBar(this.beastHpBars[index], barX, barY, barWidth, 8, Math.max(0, beast.health) / beast.maxHealth, 0x81c784, 0x4e342e)
      }
    })
  }

  private updateExpGoldText(): void {
    this.expGoldText.setText(
      '💰 ' + this.player.gold + '\n' +
      '✨ ' + this.player.spirit + '\n' +
      'EXP: ' + this.player.exp + '/' + this.player.expToNext
    )
  }

  private rollSpecialDrops(): EnemyDrop[] {
    const drops: EnemyDrop[] = []
    this.enemies.forEach(enemy => {
      if (enemy.health <= 0 && enemy.drops) {
        enemy.drops.forEach(drop => {
          if (Math.random() < drop.chance) {
            drops.push({ ...drop })
          }
        })
      }
    })
    return drops
  }

  private refreshSkillButtons(): void {
    this.skillButtons.forEach(btn => btn.destroy())
    this.skillButtons = []
    this.createSkillBar(this.scale.width, this.scale.height)
  }

  private showMessage(msg: string): void {
    this.messageText.setText(msg)
    this.messageText.setAlpha(0)
    this.tweens.add({
      targets: this.messageText,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 1500,
      repeatDelay: 300
    })
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
    btn.on('pointerdown', () => {
      if (this.battleEnded) return
      const save = this.saveManager.loadGame()!
      save.player = this.player

      this.battleBeasts.forEach((beast, index) => {
        if (beast) {
          const saveBeast = save.spiritBeast.beasts.find(b => b.id === beast.id)
          if (saveBeast) {
            saveBeast.health = beast.health
          }
        }
      })

      this.saveManager.saveGame(save)
      this.cameras.main.fadeOut(400)
      this.time.delayedCall(400, () => {
        if (this.isChapterBattle && this.chapterId) {
          this.scene.start('ChapterMapScene', { chapterId: this.chapterId })
        } else {
          this.scene.start('MenuScene')
        }
      })
    })
  }

  private showAchievementNotification(achievements: any[]): void {
    const { width, height } = this.scale

    let currentIndex = 0
    const showNext = () => {
      if (currentIndex >= achievements.length) {
        return
      }

      const achievement = achievements[currentIndex]
      const panelWidth = 320
      const panelHeight = 100
      const x = width / 2
      const y = height * 0.15

      const overlay = this.add.graphics()
      overlay.fillStyle(0x000000, 0.01)
      overlay.fillRect(0, 0, width, height)

      const panel = this.add.graphics()
      panel.fillStyle(0x1a1a2e, 0.98)
      panel.lineStyle(3, 0xffd54f, 1)
      this.roundedRect(panel, x - panelWidth / 2, y - panelHeight / 2, panelWidth, panelHeight, 12)

      const iconBg = this.add.graphics()
      iconBg.fillStyle(0xffd54f, 0.3)
      iconBg.fillCircle(x - panelWidth / 2 + 45, y, 32)

      const icon = this.add.text(x - panelWidth / 2 + 45, y, achievement.icon, {
        fontSize: '36px'
      }).setOrigin(0.5)

      const titleText = this.add.text(x - panelWidth / 2 + 90, y - 20, '🎉 成就解锁！', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '16px',
        color: '#ffd54f',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5)

      const nameText = this.add.text(x - panelWidth / 2 + 90, y + 5, achievement.name, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5)

      const descText = this.add.text(x - panelWidth / 2 + 90, y + 28, achievement.description, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '13px',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5)

      const allElements = [overlay, panel, iconBg, icon, titleText, nameText, descText]

      this.tweens.add({
        targets: allElements,
        y: '-=100',
        alpha: { from: 0, to: 1 },
        scale: { from: 0.5, to: 1 },
        duration: 400,
        ease: 'Back.easeOut'
      })

      this.time.delayedCall(2500, () => {
        this.tweens.add({
          targets: allElements,
          y: '-=100',
          alpha: 0,
          scale: 0.5,
          duration: 400,
          ease: 'Back.easeIn',
          onComplete: () => {
            allElements.forEach(el => el.destroy())
            currentIndex++
            showNext()
          }
        })
      })
    }

    showNext()
  }
}
