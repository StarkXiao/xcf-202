import Phaser from 'phaser'
import type { Player, Enemy, Stage, Skill, BattleResult, SpiritBeast, SpiritBeastSkill } from '../types'
import { STAGES } from '../data/gameData'
import { SaveManager } from '../managers/SaveManager'
import { SkillSystem } from '../managers/SkillSystem'
import { AlchemyManager } from '../managers/AlchemyManager'
import { SpiritBeastManager } from '../managers/SpiritBeastManager'
import { getBeastTemplate } from '../data/spiritBeastData'

export class BattleScene extends Phaser.Scene {
  private saveManager = SaveManager.getInstance()
  private player!: Player
  private stage!: Stage
  private enemies: Enemy[] = []
  private currentEnemyIndex = 0
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
  private spiritBeastManager = SpiritBeastManager.getInstance()
  private battleBeasts: (SpiritBeast | null)[] = []
  private beastSprites: (Phaser.GameObjects.Container | null)[] = []
  private beastHpBars: (Phaser.GameObjects.Graphics | null)[] = []
  private activeBeastBuffs: { attack: number; defense: number; critRate: number; critDamage: number }[] = []
  private activeEnemyDebuffs: { defenseDown: number; attackDown: number }[] = []

  constructor() {
    super({ key: 'BattleScene' })
  }

  private alchemyManager = AlchemyManager.getInstance()

  init(data: { stageId: number }): void {
    const save = this.saveManager.loadGame()!
    this.player = save.player
    const buff = this.alchemyManager.getBuffBonus(save.alchemy)
    const permBonus = this.alchemyManager.getPermanentBonus(save.alchemy)
    this.saveManager.recalcPlayerStats(this.player, buff, permBonus)
    this.player.health = Math.min(this.player.health, this.player.maxHealth)
    this.player.mana = Math.min(this.player.mana, this.player.maxMana)

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
    container.setSize(enemy.size, enemy.size)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerdown', () => {
      if (this.isPlayerTurn && !this.battleEnded && index === this.currentEnemyIndex) {
        this.playerAttack(0)
      }
    })

    this.enemySprites.push(container)

    const name = this.add.text(x, y + enemy.size / 2 + 20, enemy.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#' + enemy.color.toString(16).padStart(6, '0')
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
    this.showMessage(`${beast.name} 使用了 ${skill.name}！`)

    const beastSprite = this.beastSprites[beastIndex]
    const enemySprite = this.enemySprites[this.currentEnemyIndex]
    const enemy = this.enemies[this.currentEnemyIndex]

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
          const defenseReduction = this.activeEnemyDebuffs[this.currentEnemyIndex]?.defenseDown || 0
          const effectiveDefense = Math.max(0, enemy.defense - defenseReduction)
          const actualDamage = Math.max(1, Math.floor(baseDamage - effectiveDefense * 0.3))

          enemy.health -= actualDamage
          this.showDamageText(enemySprite.x, enemySprite.y - 30, actualDamage, skill.color)

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
      const actualDamage = Math.max(1, Math.floor(totalAttack - effectiveDefense * 0.3))

      enemy.health -= actualDamage
      this.showDamageText(enemySprite.x, enemySprite.y - 30, actualDamage, beast.color)

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

  private showDamageText(x: number, y: number, damage: number, color: number, isHeal: boolean = false): void {
    const prefix = isHeal ? '+' : '-'
    const text = this.add.text(x, y, prefix + damage, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '24px',
      color: '#' + color.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    this.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      scale: 1.2,
      duration: 800,
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

    const bg = this.add.graphics()
    const canUse = SkillSystem.canUseSkill(this.player, skill)
    const bgColor = canUse ? 0x000000 : 0x333333
    bg.fillStyle(bgColor, 0.75)
    bg.lineStyle(2, skill.color, canUse ? 1 : 0.4)
    this.roundedRect(bg, -size / 2, -size / 2, size, size, 10)

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

    const manaText = this.add.text(0, size / 2 + 14, '耗蓝 ' + skill.manaCost, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '11px',
      color: this.player.mana >= skill.manaCost ? '#4fc3f7' : '#ef5350'
    }).setOrigin(0.5)

    container.add([bg, iconText, nameText, cooldownText, manaText])
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
    const damage = SkillSystem.useSkill(this.player, skill) || 0
    const enemy = this.enemies[this.currentEnemyIndex]

    this.showMessage(skill.name + '！造成 ' + damage + ' 点伤害')

    this.tweens.add({
      targets: this.playerSprite,
      x: this.playerSprite.x + 80,
      duration: 200,
      yoyo: true,
      ease: 'Power2'
    })

    this.time.delayedCall(200, () => {
      this.createSkillEffect(skill.color, this.enemySprites[this.currentEnemyIndex].x, this.enemySprites[this.currentEnemyIndex].y)

      const actualDamage = Math.max(1, damage - Math.floor(enemy.defense * 0.3))
      enemy.health -= actualDamage

      this.tweens.add({
        targets: this.enemySprites[this.currentEnemyIndex],
        x: this.enemySprites[this.currentEnemyIndex].x + '+=20',
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 2
      })

      this.showDamageText(this.enemySprites[this.currentEnemyIndex].x, this.enemySprites[this.currentEnemyIndex].y - 30, actualDamage, 0xffd54f)
      this.updateUI()

      this.time.delayedCall(600, () => {
        if (enemy.health <= 0) {
          this.enemyDefeated()
        } else {
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
    this.showMessage(this.enemies[this.currentEnemyIndex].name + ' 已被击败！')

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
        this.updateEnemyTarget()
        this.isPlayerTurn = true
        this.showMessage('你的回合！选择一个技能')
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

    this.time.delayedCall(800, () => {
      const enemy = this.enemies[this.currentEnemyIndex]
      const sprite = this.enemySprites[this.currentEnemyIndex]

      this.tweens.add({
        targets: sprite,
        x: sprite.x - 80,
        duration: 200,
        yoyo: true,
        ease: 'Power2'
      })

      this.time.delayedCall(200, () => {
        const baseDamage = enemy.attack
        const actualDamage = Math.max(1, baseDamage - Math.floor(this.player.defense * 0.5))
        this.player.health -= actualDamage

        this.tweens.add({
          targets: this.playerSprite,
          x: this.playerSprite.x + '+=15',
          alpha: 0.6,
          duration: 100,
          yoyo: true,
          repeat: 2
        })

        this.cameras.main.shake(200, 0.005)
        this.showDamageText(this.playerSprite.x, this.playerSprite.y - 50, actualDamage, 0xef5350)
        this.showMessage(enemy.name + ' 攻击你，造成 ' + actualDamage + ' 点伤害')
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

  private battleVictory(): void {
    this.battleEnded = true
    this.showMessage('战斗胜利！')

    this.cameras.main.flash(500, 255, 255, 200)

    const save = this.saveManager.loadGame()!
    const herbDrops = this.alchemyManager.rollHerbDrops(this.stage.id)
    this.alchemyManager.applyHerbDrops(save.alchemy, herbDrops)

    const result: BattleResult = {
      victory: true,
      stageId: this.stage.id,
      expGained: this.stage.rewards.exp,
      goldGained: this.stage.rewards.gold,
      spiritGained: this.stage.rewards.spirit,
      playerHealth: this.player.health,
      herbDrops
    }

    save.player = this.player
    save.player.gold += result.goldGained
    save.player.spirit += result.spiritGained
    const permBonus = this.alchemyManager.getPermanentBonus(save.alchemy)
    const levelResult = this.saveManager.addExp(save.player, result.expGained, permBonus)
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
    this.saveManager.saveGame(save)

    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(500)
      this.time.delayedCall(500, () => {
        this.scene.start('ResultScene', { result, leveledUp: levelResult.leveledUp, levels: levelResult.levels })
      })
    })
  }

  private battleDefeat(): void {
    this.battleEnded = true
    this.player.health = Math.floor(this.player.maxHealth * 0.5)
    SkillSystem.fullRestore(this.player)

    const save = this.saveManager.loadGame()!
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
      playerHealth: this.player.health
    }

    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(500)
      this.time.delayedCall(500, () => {
        this.scene.start('ResultScene', { result, leveledUp: false, levels: 0 })
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
      this.time.delayedCall(400, () => this.scene.start('MenuScene'))
    })
  }
}
