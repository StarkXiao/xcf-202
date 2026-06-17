import Phaser from 'phaser'
import type { GameSave, DungeonProgress, DungeonRoom, DungeonEvent, DungeonEventChoice, Enemy, Skill, DungeonBuff, ElementType } from '../types'
import { SaveManager } from '../managers/SaveManager'
import { DungeonManager } from '../managers/DungeonManager'
import { SkillSystem } from '../managers/SkillSystem'
import { AlchemyManager } from '../managers/AlchemyManager'
import { EquipmentManager } from '../managers/EquipmentManager'
import { MeridianManager } from '../managers/MeridianManager'
import { DUNGEON_FLOOR_COLORS } from '../data/dungeonData'
import { getElementMultiplier, getElementConstraintText, ELEMENT_INFO } from '../data/fiveElementsData'

type DungeonPhase = 'map' | 'room_intro' | 'battle' | 'event' | 'reward' | 'floor_clear' | 'dungeon_complete' | 'dungeon_fail'

interface BattleState {
  enemies: Enemy[]
  currentEnemyIndex: number
  isPlayerTurn: boolean
  battleEnded: boolean
  enemySprites: (Phaser.GameObjects.Container | null)[]
  enemyHpBars: (Phaser.GameObjects.Graphics | null)[]
  enemyNames: (Phaser.GameObjects.Text | null)[]
  enemyDebuffs: { defenseDown: number; attackDown: number }[]
  playerCritRate: number
  playerCritDamage: number
}

export class DungeonScene extends Phaser.Scene {
  private save!: GameSave
  private saveManager = SaveManager.getInstance()
  private dungeonManager = DungeonManager.getInstance()
  private alchemyManager = AlchemyManager.getInstance()
  private equipmentManager = EquipmentManager.getInstance()

  private progress!: DungeonProgress
  private phase: DungeonPhase = 'map'

  private container!: Phaser.GameObjects.Container
  private battleState: BattleState | null = null
  private playerSprite!: Phaser.GameObjects.Container
  private skillButtons: Phaser.GameObjects.Container[] = []
  private hpBarPlayer!: Phaser.GameObjects.Graphics
  private mpBarPlayer!: Phaser.GameObjects.Graphics
  private playerHealthText!: Phaser.GameObjects.Text
  private playerManaText!: Phaser.GameObjects.Text

  private currentEventResult: { success: boolean; text: string; rewards: string[] } | null = null

  private messageText!: Phaser.GameObjects.Text
  private statsText!: Phaser.GameObjects.Text
  private buffsText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'DungeonScene' })
  }

  init(): void {
    const existingSave = this.saveManager.loadGame()
    if (!existingSave) { this.scene.start('MenuScene'); return }
    this.save = existingSave
    this.progress = this.save.dungeon
    if (!this.progress.isDungeonActive) {
      this.dungeonManager.startDungeon(this.progress, this.save, this.save.player.level)
      this.recalcPlayerStats()
      this.saveManager.saveGame(this.save)
    } else {
      this.recalcPlayerStats()
    }
  }

  private recalcPlayerStats(): void {
    const buff = this.alchemyManager.getBuffBonus(this.save.alchemy)
    const permBonus = this.alchemyManager.getPermanentBonus(this.save.alchemy)
    const equipBonus = this.equipmentManager.calculateEquipmentBonus(this.save.equipment)
    const meridBonus = MeridianManager.getInstance().calculateMeridianBonus(this.save.meridian)
    this.saveManager.recalcPlayerStats(this.save.player, buff, permBonus, equipBonus, meridBonus)
    const dungeonBuff = this.dungeonManager.getBuffBonus(this.progress)
    const maxHealthBonus = Math.floor(this.save.player.maxHealth * dungeonBuff.maxHealth)
    this.save.player.maxHealth += maxHealthBonus
    this.save.player.attack = Math.floor(this.save.player.attack * (1 + dungeonBuff.attack))
    this.save.player.defense = Math.floor(this.save.player.defense * (1 + dungeonBuff.defense))
    this.save.player.critRate += dungeonBuff.critRate
    this.save.player.critDamage += dungeonBuff.critDamage
    this.save.player.health = Math.min(this.save.player.health, this.save.player.maxHealth)
    this.save.player.mana = Math.min(this.save.player.mana, this.save.player.maxMana)

    const meridianManager = MeridianManager.getInstance()
    const newSkills = meridianManager.syncSkillsToPlayer(this.save.meridian, this.save.player)
    this.save.player.skills.push(...newSkills)
  }

  create(): void {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor(0x0a0a15)
    this.container = this.add.container(0, 0)
    this.createHeader(width)
    this.createBackButton(width, height)
    if (this.progress.floor && this.progress.currentRoomId) {
      const currentRoom = this.dungeonManager.getCurrentRoom(this.progress)
      if (currentRoom && !currentRoom.isCleared) { this.showRoomIntro(currentRoom) }
      else { this.showMap() }
    } else { this.showMap() }
    this.cameras.main.fadeIn(500)
  }

  private createHeader(width: number): void {
    const header = this.add.graphics()
    header.fillStyle(0x000000, 0.7); header.fillRect(0, 0, width, 70)
    header.lineStyle(2, 0x9575cd, 0.6); header.lineBetween(0, 70, width, 70)
    const title = this.add.text(width / 2, 20, '🏰 秘境探索 🏰', {
      fontFamily: '"Microsoft YaHei", serif', fontSize: '26px', color: '#ce93d8', fontStyle: 'bold'
    }).setOrigin(0.5)
    this.tweens.add({ targets: title, scale: { from: 1, to: 1.02 }, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    this.statsText = this.add.text(width / 2, 52, '', {
      fontFamily: '"Microsoft YaHei", serif', fontSize: '14px', color: '#b0bec5', align: 'center'
    }).setOrigin(0.5)
    this.updateStatsText()
    this.buffsText = this.add.text(20, 45, '', {
      fontFamily: '"Microsoft YaHei", serif', fontSize: '12px', color: '#81c784'
    })
    this.updateBuffsText()
    this.messageText = this.add.text(width / 2, 95, '', {
      fontFamily: '"Microsoft YaHei", serif', fontSize: '16px', color: '#ffd54f'
    }).setOrigin(0.5)
  }

  private updateStatsText(): void {
    const floorInfo = this.progress.floor
      ? `第 ${this.progress.currentFloor}/${this.progress.totalFloors} 层 · ${this.progress.floor.name}`
      : '准备中...'
    this.statsText.setText(
      `${floorInfo} | 💰 ${this.progress.dungeonGold}  ✨ ${this.progress.dungeonSpirit}  EXP ${this.progress.dungeonExp} | 已清: ${this.progress.clearedRoomIds.length}`
    )
  }

  private updateBuffsText(): void {
    if (this.progress.activeBuffs.length === 0) { this.buffsText.setText('增益: 无'); return }
    const buffStr = this.progress.activeBuffs.map(b => `${b.icon}${b.name}(${b.remainingRooms})`).join('  ')
    this.buffsText.setText('增益: ' + buffStr)
  }

  private clearContainer(): void { this.container.removeAll(true) }

  private showMap(): void {
    this.phase = 'map'; this.clearContainer()
    const { width, height } = this.scale
    if (!this.progress.floor) { this.finishDungeon(true); return }
    const bgColor = DUNGEON_FLOOR_COLORS[Math.min(this.progress.currentFloor - 1, DUNGEON_FLOOR_COLORS.length - 1)]
    const mapBg = this.add.graphics()
    mapBg.fillStyle(bgColor, 0.15); mapBg.fillRect(40, 110, width - 80, height - 180)
    mapBg.lineStyle(2, bgColor, 0.4)
    this.roundedRect(mapBg, 40, 110, width - 80, height - 180, 16)
    this.container.add(mapBg)
    const floorTitle = this.add.text(width / 2, 140, `— ${this.progress.floor.name} —`, {
      fontFamily: '"Microsoft YaHei", serif', fontSize: '22px',
      color: '#' + bgColor.toString(16).padStart(6, '0'), fontStyle: 'bold'
    }).setOrigin(0.5)
    this.container.add(floorTitle)
    this.drawRoomMap(width, height)
  }

  private drawRoomMap(width: number, height: number): void {
    if (!this.progress.floor) return
    const rooms = this.progress.floor.rooms
    const startX = width / 2, startY = height * 0.35
    const verticalSpacing = Math.min((height - 280) / Math.max(rooms.length - 1, 1), 110)
    for (let i = 0; i < rooms.length - 1; i++) {
      const line = this.add.graphics()
      line.lineStyle(3, rooms[i].isCleared ? 0x81c784 : 0x78909c, 0.6)
      const y1 = startY + i * verticalSpacing, y2 = startY + (i + 1) * verticalSpacing
      line.beginPath(); line.moveTo(startX, y1 + 30); line.lineTo(startX, y2 - 30); line.strokePath()
      this.container.add(line)
    }
    rooms.forEach((room, index) => {
      const y = startY + index * verticalSpacing
      this.createRoomCard(startX, y, room, index)
    })
  }

  private createRoomCard(x: number, y: number, room: DungeonRoom, index: number): void {
    const container = this.add.container(x, y); const size = 72
    const bg = this.add.graphics()
    const isAccessible = room.isAccessible && !room.isCleared
    const isCleared = room.isCleared
    let bgColor = 0x000000, borderColor = room.color, alpha = 0.6, borderAlpha = 0.4
    if (isCleared) { bgColor = 0x1b5e20; alpha = 0.5; borderAlpha = 0.8 }
    else if (isAccessible) { bgColor = room.color; alpha = 0.15; borderAlpha = 1 }
    else { alpha = 0.3; borderAlpha = 0.2 }
    bg.fillStyle(bgColor, alpha); bg.lineStyle(2, borderColor, borderAlpha)
    this.roundedRect(bg, -size / 2, -size / 2, size, size, 12)
    container.add(bg)
    const iconText = this.add.text(0, -8, isCleared ? '✅' : room.icon, { fontSize: '28px' }).setOrigin(0.5)
    container.add(iconText)
    const nameText = this.add.text(0, 22, room.name, {
      fontFamily: '"Microsoft YaHei", serif', fontSize: '13px',
      color: isAccessible && !isCleared ? '#ffffff' : isCleared ? '#81c784' : '#78909c'
    }).setOrigin(0.5)
    container.add(nameText)
    container.setSize(size, size)
    if (isAccessible && !isCleared) {
      container.setInteractive({ useHandCursor: true })
      container.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.1, duration: 150 }))
      container.on('pointerout', () => this.tweens.add({ targets: container, scale: 1, duration: 150 }))
      container.on('pointerdown', () => this.selectRoom(room.id))
      const pulse = this.add.graphics()
      pulse.lineStyle(2, room.color, 0.5)
      this.roundedRect(pulse, -size / 2 - 4, -size / 2 - 4, size + 8, size + 8, 14)
      container.add(pulse)
      this.tweens.add({ targets: pulse, alpha: { from: 0.8, to: 0.1 }, scale: { from: 1, to: 1.1 }, duration: 1200, yoyo: true, repeat: -1 })
    }
    container.setAlpha(0)
    this.tweens.add({ targets: container, alpha: 1, duration: 400, delay: index * 80, ease: 'Back.easeOut' })
    this.container.add(container)
  }

  private selectRoom(roomId: string): void {
    if (!this.dungeonManager.enterRoom(this.progress, roomId)) {
      this.showMessage('无法进入此房间！'); return
    }
    this.saveManager.saveGame(this.save)
    const room = this.dungeonManager.getCurrentRoom(this.progress)
    if (room) this.showRoomIntro(room)
  }

  private showRoomIntro(room: DungeonRoom): void {
    this.phase = 'room_intro'; this.clearContainer()
    const { width, height } = this.scale
    const panel = this.add.graphics()
    panel.fillStyle(0x0a0a20, 0.92); panel.lineStyle(3, room.color, 0.8)
    this.roundedRect(panel, width / 2 - 280, height / 2 - 160, 560, 320, 20)
    this.container.add(panel)
    const iconText = this.add.text(width / 2, height / 2 - 90, room.icon, { fontSize: '60px' }).setOrigin(0.5)
    this.container.add(iconText)
    this.tweens.add({ targets: iconText, scale: { from: 0.8, to: 1.1 }, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    const nameText = this.add.text(width / 2, height / 2 - 30, room.name, {
      fontFamily: '"Microsoft YaHei", serif', fontSize: '28px',
      color: '#' + room.color.toString(16).padStart(6, '0'), fontStyle: 'bold'
    }).setOrigin(0.5)
    this.container.add(nameText)
    const descText = this.add.text(width / 2, height / 2 + 10, room.description, {
      fontFamily: '"Microsoft YaHei", serif', fontSize: '18px', color: '#b0bec5', align: 'center'
    }).setOrigin(0.5)
    this.container.add(descText)
    if (room.rewards) {
      const rewardParts: string[] = []
      if (room.rewards.gold) rewardParts.push(`💰 ${room.rewards.gold}`)
      if (room.rewards.spirit) rewardParts.push(`✨ ${room.rewards.spirit}`)
      if (room.rewards.exp) rewardParts.push(`EXP ${room.rewards.exp}`)
      if (room.rewards.healPercent) rewardParts.push(`❤恢复 ${Math.floor(room.rewards.healPercent * 100)}%`)
      if (room.rewards.buff) rewardParts.push(`${room.rewards.buff.icon}${room.rewards.buff.name}`)
      if (rewardParts.length > 0) {
        const rewardText = this.add.text(width / 2, height / 2 + 50, '预期奖励: ' + rewardParts.join('  '), {
          fontFamily: '"Microsoft YaHei", serif', fontSize: '14px', color: '#ffd54f'
        }).setOrigin(0.5)
        this.container.add(rewardText)
      }
    }
    const confirmBtn = this.createButton(width / 2, height / 2 + 110, '进入房间', room.color, () => this.enterRoomContent(room))
    this.container.add(confirmBtn)
  }

  private enterRoomContent(room: DungeonRoom): void {
    switch (room.type) {
      case 'battle': case 'boss': case 'mystery': this.startBattle(room); break
      case 'event': if (room.event) this.showEvent(room.event); break
      default: this.applyRoomReward(room)
    }
  }

  private startBattle(room: DungeonRoom): void {
    this.phase = 'battle'
    this.clearContainer()
    const { width, height } = this.scale

    const bgColor = DUNGEON_FLOOR_COLORS[Math.min(this.progress.currentFloor - 1, DUNGEON_FLOOR_COLORS.length - 1)]
    this.cameras.main.setBackgroundColor(Phaser.Display.Color.IntegerToColor(bgColor).darken(30).color)

    const battleBg = this.add.graphics()
    battleBg.fillStyle(0x000000, 0.3)
    battleBg.fillRect(0, 80, width, height - 80)
    this.container.add(battleBg)

    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(
        Math.random() * width,
        100 + Math.random() * (height - 150),
        2 + Math.random() * 3,
        bgColor,
        0.3 + Math.random() * 0.3
      )
      this.container.add(particle)
      this.tweens.add({
        targets: particle,
        y: particle.y - 30 - Math.random() * 40,
        alpha: 0,
        duration: 3000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        hold: 500
      })
    }

    const enemies = this.dungeonManager.generateEnemiesForRoom(room, this.save.player.level)

    this.battleState = {
      enemies,
      currentEnemyIndex: 0,
      isPlayerTurn: true,
      battleEnded: false,
      enemySprites: new Array(enemies.length).fill(null),
      enemyHpBars: new Array(enemies.length).fill(null),
      enemyNames: new Array(enemies.length).fill(null),
      enemyDebuffs: enemies.map(() => ({ defenseDown: 0, attackDown: 0 })),
      playerCritRate: this.save.player.critRate,
      playerCritDamage: this.save.player.critDamage
    }

    this.createBattlePlayer(width, height)
    this.createBattleEnemies(width, height)
    this.createSkillBar(width, height)

    this.showBattleMessage('你的回合！选择一个技能')
    this.cameras.main.flash(300, 255, 255, 200)
  }

  private createBattlePlayer(width: number, height: number): void {
    const x = width * 0.2
    const y = height * 0.5

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
    this.container.add(this.playerSprite)

    const playerName = this.add.text(x, y + 70, this.save.player.name + ' Lv.' + this.save.player.level, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#4fc3f7'
    }).setOrigin(0.5)
    this.container.add(playerName)

    const barWidth = 160
    const barX = x - barWidth / 2
    const barY = y + 92

    this.hpBarPlayer = this.add.graphics()
    this.drawBar(this.hpBarPlayer, barX, barY, barWidth, 14, this.save.player.health / this.save.player.maxHealth, 0xe53935, 0x4e342e)
    this.container.add(this.hpBarPlayer)

    this.playerHealthText = this.add.text(x, barY + 7, this.save.player.health + '/' + this.save.player.maxHealth, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5)
    this.container.add(this.playerHealthText)

    this.mpBarPlayer = this.add.graphics()
    this.drawBar(this.mpBarPlayer, barX, barY + 20, barWidth, 10, this.save.player.mana / this.save.player.maxMana, 0x1e88e5, 0x0d47a1)
    this.container.add(this.mpBarPlayer)

    this.playerManaText = this.add.text(x, barY + 25, this.save.player.mana + '/' + this.save.player.maxMana, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '10px',
      color: '#ffffff'
    }).setOrigin(0.5)
    this.container.add(this.playerManaText)

    this.tweens.add({
      targets: this.playerSprite,
      y: y - 8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  private createBattleEnemies(width: number, height: number): void {
    if (!this.battleState) return
    const startX = width * 0.6
    const spacing = Math.min(140, (width * 0.35) / Math.max(this.battleState.enemies.length, 1))

    this.battleState.enemies.forEach((enemy, index) => {
      const x = startX + index * spacing
      const y = height * 0.5
      this.createBattleEnemy(enemy, index, x, y)
    })
  }

  private createBattleEnemy(enemy: Enemy, index: number, x: number, y: number): void {
    if (!this.battleState) return

    const container = this.add.container(x, y)

    const body = this.add.graphics()
    body.fillStyle(enemy.color, 1)
    body.fillCircle(0, 0, enemy.size / 2)
    body.fillStyle(0x000000, 0.3)
    body.fillCircle(0, 0, enemy.size / 2 - 6)

    const eye1 = this.add.graphics()
    eye1.fillStyle(0xffffff)
    eye1.fillCircle(-enemy.size / 5, -enemy.size / 8, Math.max(3, enemy.size / 10))
    eye1.fillStyle(0xff0000)
    eye1.fillCircle(-enemy.size / 5, -enemy.size / 8, Math.max(1.5, enemy.size / 20))

    const eye2 = this.add.graphics()
    eye2.fillStyle(0xffffff)
    eye2.fillCircle(enemy.size / 5, -enemy.size / 8, Math.max(3, enemy.size / 10))
    eye2.fillStyle(0xff0000)
    eye2.fillCircle(enemy.size / 5, -enemy.size / 8, Math.max(1.5, enemy.size / 20))

    container.add([body, eye1, eye2])
    container.setSize(enemy.size, enemy.size)

    if (index === 0) {
      const targetMark = this.add.graphics()
      targetMark.lineStyle(2, 0xffd54f, 1)
      targetMark.strokeCircle(0, 0, enemy.size / 2 + 10)
      container.add(targetMark)
      this.tweens.add({
        targets: targetMark,
        alpha: { from: 1, to: 0.3 },
        duration: 800,
        yoyo: true,
        repeat: -1
      })
    }

    container.setInteractive({ useHandCursor: true })
    container.on('pointerdown', () => {
      if (this.battleState && this.battleState.isPlayerTurn && !this.battleState.battleEnded && index === this.battleState.currentEnemyIndex) {
        this.playerBattleAttack(0)
      }
    })

    this.battleState.enemySprites[index] = container
    this.container.add(container)

    const name = this.add.text(x, y + enemy.size / 2 + 18, enemy.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '14px',
      color: '#' + enemy.color.toString(16).padStart(6, '0')
    }).setOrigin(0.5)
    this.battleState.enemyNames[index] = name
    this.container.add(name)

    const barWidth = Math.min(120, enemy.size * 2.5)
    const barX = x - barWidth / 2
    const barY = y + enemy.size / 2 + 38

    const hpBar = this.add.graphics()
    this.drawBar(hpBar, barX, barY, barWidth, 12, enemy.health / enemy.maxHealth, 0xe53935, 0x4e342e)
    this.battleState.enemyHpBars[index] = hpBar
    this.container.add(hpBar)

    this.tweens.add({
      targets: container,
      y: y - 6,
      duration: 1500 + index * 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  private createSkillBar(width: number, height: number): void {
    const skills = SkillSystem.getUnlockedSkills(this.save.player)
    const barY = height - 85
    const spacing = Math.min(100, (width - 100) / Math.max(skills.length, 1))
    const totalWidth = skills.length * spacing - 20
    const startX = (width - totalWidth) / 2 + spacing / 2 - 10

    skills.forEach((skill, index) => {
      const x = startX + index * spacing
      const btn = this.createSkillButton(x, barY, skill, index)
      this.skillButtons.push(btn)
      this.container.add(btn)
    })
  }

  private createSkillButton(x: number, y: number, skill: Skill, index: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const size = 72

    const bg = this.add.graphics()
    const canUse = SkillSystem.canUseSkill(this.save.player, skill)
    const bgColor = canUse ? 0x000000 : 0x333333
    bg.fillStyle(bgColor, 0.75)
    bg.lineStyle(2, skill.color, canUse ? 1 : 0.4)
    this.roundedRect(bg, -size / 2, -size / 2, size, size, 10)

    const iconText = this.add.text(0, -12, skill.icon, {
      fontFamily: 'serif',
      fontSize: '28px',
      color: '#' + skill.color.toString(16).padStart(6, '0')
    }).setOrigin(0.5)

    const nameText = this.add.text(0, 14, skill.name, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '12px',
      color: canUse ? '#ffffff' : '#888888'
    }).setOrigin(0.5)

    const manaText = this.add.text(0, size / 2 + 12, '蓝' + skill.manaCost, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '10px',
      color: this.save.player.mana >= skill.manaCost ? '#4fc3f7' : '#ef5350'
    }).setOrigin(0.5)

    container.add([bg, iconText, nameText, manaText])
    container.setSize(size, size)

    if (canUse) {
      container.setInteractive({ useHandCursor: true })
      container.on('pointerdown', () => this.playerBattleAttack(index))
      container.on('pointerover', () => {
        this.tweens.add({ targets: container, scale: 1.1, duration: 150 })
      })
      container.on('pointerout', () => {
        this.tweens.add({ targets: container, scale: 1, duration: 150 })
      })
    }

    return container
  }

  private playerBattleAttack(skillIndex: number): void {
    if (!this.battleState || !this.battleState.isPlayerTurn || this.battleState.battleEnded) return

    const skills = SkillSystem.getUnlockedSkills(this.save.player)
    const skill = skills[skillIndex]
    if (!SkillSystem.canUseSkill(this.save.player, skill)) {
      this.showBattleMessage('无法使用该技能！')
      return
    }

    this.battleState.isPlayerTurn = false
    const enemy = this.battleState.enemies[this.battleState.currentEnemyIndex]
    const enemySprite = this.battleState.enemySprites[this.battleState.currentEnemyIndex]
    const skillResult = SkillSystem.useSkill(this.save.player, skill, enemy.element)
    const baseDamage = skillResult.damage || 0

    const isCrit = Math.random() < this.battleState.playerCritRate
    let damage = baseDamage
    let damageColor = 0xffd54f
    let critText = ''

    if (isCrit) {
      damage = Math.floor(baseDamage * (1 + this.battleState.playerCritDamage))
      damageColor = 0xff5722
      critText = '暴击！'
    }

    const elementText = getElementConstraintText(skill.element || 'none', enemy.element || 'none')
    let msgParts = [skill.name + '！']
    if (critText) msgParts.push(critText)
    if (elementText) msgParts.push(elementText)
    if (skillResult.treasureBonus > 0) msgParts.push('法宝+' + Math.round(skillResult.treasureBonus * 100) + '%')
    this.showBattleMessage(msgParts.join(''))

    this.tweens.add({
      targets: this.playerSprite,
      x: this.playerSprite.x + 80,
      duration: 200,
      yoyo: true,
      ease: 'Power2'
    })

    this.time.delayedCall(200, () => {
      if (enemySprite) {
        const effectColor = skillResult.isAdvantage ? ELEMENT_INFO[skill.element || 'none'].color : skill.color
        this.createSkillEffect(effectColor, enemySprite.x, enemySprite.y)
      }

      const defenseReduction = this.battleState!.enemyDebuffs[this.battleState!.currentEnemyIndex]?.defenseDown || 0
      const effectiveDefense = Math.max(0, enemy.defense - defenseReduction)
      const actualDamage = Math.max(1, damage - Math.floor(effectiveDefense * 0.3))
      enemy.health -= actualDamage

      if (enemySprite) {
        this.tweens.add({
          targets: enemySprite,
          x: enemySprite.x + 15,
          alpha: 0.5,
          duration: 100,
          yoyo: true,
          repeat: 2
        })
        const dmgColor = skillResult.isAdvantage ? 0xffd54f : skillResult.isDisadvantage ? 0x78909c : damageColor
        this.showDamageText(enemySprite.x, enemySprite.y - 30, actualDamage, dmgColor, false, isCrit)

        if (skillResult.isAdvantage) {
          this.showBattleElementText(enemySprite.x, enemySprite.y - 55, '⚡克制！', 0xffd54f)
        } else if (skillResult.isDisadvantage) {
          this.showBattleElementText(enemySprite.x, enemySprite.y - 55, '🔻被克！', 0x78909c)
        }
      }

      this.updateBattleUI()

      this.time.delayedCall(600, () => {
        if (enemy.health <= 0) {
          this.enemyBattleDefeated()
        } else {
          this.enemyBattleTurn()
        }
      })
    })
  }

  private enemyBattleDefeated(): void {
    if (!this.battleState) return
    const sprite = this.battleState.enemySprites[this.battleState.currentEnemyIndex]
    const enemy = this.battleState.enemies[this.battleState.currentEnemyIndex]
    this.showBattleMessage(enemy.name + ' 已被击败！')

    if (sprite) {
      this.tweens.add({
        targets: sprite,
        scale: 0,
        alpha: 0,
        rotation: Math.PI,
        duration: 600,
        ease: 'Back.In'
      })
    }

    this.time.delayedCall(700, () => {
      if (sprite) sprite.visible = false
      const name = this.battleState!.enemyNames[this.battleState!.currentEnemyIndex]
      const hpBar = this.battleState!.enemyHpBars[this.battleState!.currentEnemyIndex]
      if (name) name.visible = false
      if (hpBar) hpBar.visible = false

      this.battleState!.currentEnemyIndex++
      if (this.battleState!.currentEnemyIndex >= this.battleState!.enemies.length) {
        this.battleVictory()
      } else {
        const nextSprite = this.battleState!.enemySprites[this.battleState!.currentEnemyIndex]
        if (nextSprite) {
          const targetMark = this.add.graphics()
          targetMark.lineStyle(2, 0xffd54f, 1)
          const nextEnemy = this.battleState!.enemies[this.battleState!.currentEnemyIndex]
          targetMark.strokeCircle(0, 0, nextEnemy.size / 2 + 10)
          nextSprite.add(targetMark)
          this.tweens.add({
            targets: targetMark,
            alpha: { from: 1, to: 0.3 },
            duration: 800,
            yoyo: true,
            repeat: -1
          })
        }
        this.battleState!.isPlayerTurn = true
        this.showBattleMessage('你的回合！选择一个技能')
        this.refreshSkillButtons()
      }
    })
  }

  private enemyBattleTurn(): void {
    if (!this.battleState) return
    this.battleState.isPlayerTurn = false
    this.showBattleMessage('敌人的回合...')

    this.time.delayedCall(800, () => {
      const enemy = this.battleState!.enemies[this.battleState!.currentEnemyIndex]
      const sprite = this.battleState!.enemySprites[this.battleState!.currentEnemyIndex]

      if (sprite) {
        this.tweens.add({
          targets: sprite,
          x: sprite.x - 80,
          duration: 200,
          yoyo: true,
          ease: 'Power2'
        })
      }

      this.time.delayedCall(200, () => {
        const attackReduction = this.battleState!.enemyDebuffs[this.battleState!.currentEnemyIndex]?.attackDown || 0
        const effectiveAttack = Math.max(1, enemy.attack - attackReduction)
        const { multiplier: enemyMultiplier, isAdvantage: enemyAdv, isDisadvantage: enemyDisadv } = getElementMultiplier(enemy.element, undefined)
        const elementAdjustedAttack = Math.floor(effectiveAttack * enemyMultiplier)
        const actualDamage = Math.max(1, elementAdjustedAttack - Math.floor(this.save.player.defense * 0.5))
        this.save.player.health -= actualDamage

        this.tweens.add({
          targets: this.playerSprite,
          x: this.playerSprite.x + 15,
          alpha: 0.6,
          duration: 100,
          yoyo: true,
          repeat: 2
        })

        this.cameras.main.shake(200, 0.005)
        const dmgColor = enemyAdv ? 0xff5722 : enemyDisadv ? 0x78909c : 0xef5350
        this.showDamageText(this.playerSprite.x, this.playerSprite.y - 50, actualDamage, dmgColor)

        let msg = enemy.name + ' 攻击你，造成 ' + actualDamage + ' 点伤害'
        if (enemyAdv) {
          msg = enemy.name + ' 攻击你！⚡克制！造成 ' + actualDamage + ' 点伤害'
        } else if (enemyDisadv) {
          msg = enemy.name + ' 攻击你！🔻被克！造成 ' + actualDamage + ' 点伤害'
        }
        this.showBattleMessage(msg)
        this.updateBattleUI()

        this.time.delayedCall(700, () => {
          if (this.save.player.health <= 0) {
            this.battleDefeat()
          } else {
            SkillSystem.tickCooldowns(this.save.player)
            const dungeonBuff = this.dungeonManager.getBuffBonus(this.progress)
            SkillSystem.restoreMana(this.save.player, 8 + dungeonBuff.manaRegen)
            this.battleState!.isPlayerTurn = true
            this.showBattleMessage('你的回合！选择一个技能')
            this.refreshSkillButtons()
          }
        })
      })
    })
  }

  private battleVictory(): void {
    if (!this.battleState) return
    this.battleState.battleEnded = true
    this.showBattleMessage('战斗胜利！')
    this.cameras.main.flash(500, 255, 255, 200)

    const room = this.dungeonManager.getCurrentRoom(this.progress)
    if (!room) { this.showMap(); return }

    let totalGold = 0, totalSpirit = 0, totalExp = 0
    this.battleState.enemies.forEach(enemy => {
      totalGold += enemy.gold
      totalSpirit += Math.floor(enemy.exp * 0.3)
      totalExp += enemy.exp
    })

    if (room.rewards) {
      totalGold += room.rewards.gold || 0
      totalSpirit += room.rewards.spirit || 0
      totalExp += room.rewards.exp || 0
    }

    this.progress.dungeonGold += totalGold
    this.progress.dungeonSpirit += totalSpirit
    this.progress.dungeonExp += totalExp

    this.dungeonManager.clearRoom(this.progress, room.id)
    this.saveManager.saveGame(this.save)

    this.time.delayedCall(1000, () => {
      const rewards = { gold: totalGold, spirit: totalSpirit, exp: totalExp, healPercent: room.rewards?.healPercent }
      this.showReward(rewards, room.rewards?.buff, room.type === 'boss')
    })
  }

  private battleDefeat(): void {
    this.showBattleMessage('你被击败了...')
    this.cameras.main.flash(500, 255, 0, 0)
    this.time.delayedCall(1500, () => {
      this.showDungeonFail()
    })
  }

  private updateBattleUI(): void {
    if (!this.battleState) return
    const barWidth = 160
    const barX = this.playerSprite.x - barWidth / 2
    const barY = this.playerSprite.y + 92

    this.drawBar(this.hpBarPlayer, barX, barY, barWidth, 14, Math.max(0, this.save.player.health) / this.save.player.maxHealth, 0xe53935, 0x4e342e)
    this.playerHealthText.setText(Math.max(0, this.save.player.health) + '/' + this.save.player.maxHealth)

    this.drawBar(this.mpBarPlayer, barX, barY + 20, barWidth, 10, Math.max(0, this.save.player.mana) / this.save.player.maxMana, 0x1e88e5, 0x0d47a1)
    this.playerManaText.setText(Math.max(0, this.save.player.mana) + '/' + this.save.player.maxMana)

    this.battleState.enemies.forEach((enemy, index) => {
      const hpBar = this.battleState!.enemyHpBars[index]
      const sprite = this.battleState!.enemySprites[index]
      if (hpBar && sprite) {
        const barWidth = Math.min(120, enemy.size * 2.5)
        const barX = sprite.x - barWidth / 2
        const barY = sprite.y + enemy.size / 2 + 38
        this.drawBar(hpBar, barX, barY, barWidth, 12, Math.max(0, enemy.health) / enemy.maxHealth, 0xe53935, 0x4e342e)
      }
    })
  }

  private refreshSkillButtons(): void {
    this.skillButtons.forEach(btn => btn.destroy())
    this.skillButtons = []
    this.createSkillBar(this.scale.width, this.scale.height)
  }

  private showEvent(event: DungeonEvent): void {
    this.phase = 'event'
    this.clearContainer()
    const { width, height } = this.scale

    const eventTitle = this.add.text(width / 2, 110, `${event.icon} ${event.name}`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '28px',
      color: '#' + event.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.container.add(eventTitle)

    const panelWidth = width * 0.8
    const descPanel = this.add.graphics()
    descPanel.fillStyle(0x0a0a20, 0.92)
    descPanel.lineStyle(2, event.color, 0.6)
    this.roundedRect(descPanel, width / 2 - panelWidth / 2, 150, panelWidth, 120, 12)
    this.container.add(descPanel)

    const descText = this.add.text(width / 2, 180, event.description, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#e0e0e0',
      align: 'center',
      wordWrap: { width: panelWidth - 40 },
      lineSpacing: 6
    }).setOrigin(0.5, 0)
    this.container.add(descText)

    const choiceTitle = this.add.text(width / 2, 290, '— 请做出选择 —', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#' + event.color.toString(16).padStart(6, '0')
    }).setOrigin(0.5)
    this.container.add(choiceTitle)

    const cardHeight = 130
    const spacing = 15
    const startY = 320

    event.choices.forEach((choice, index) => {
      const y = startY + index * (cardHeight + spacing)
      const card = this.createEventChoiceCard(width / 2, y, width * 0.78, cardHeight, choice, event.color, index)
      this.container.add(card)
    })
  }

  private createEventChoiceCard(
    x: number, y: number, cardWidth: number, cardHeight: number,
    choice: DungeonEventChoice, themeColor: number, index: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a20, 0.85)
    bg.lineStyle(2, themeColor, 0.5)
    this.roundedRect(bg, -cardWidth / 2, 0, cardWidth, cardHeight, 10)
    container.add(bg)

    const choiceText = this.add.text(-cardWidth / 2 + 20, 12, choice.text, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    container.add(choiceText)

    const ratePercent = Math.floor(choice.successRate * 100)
    const rateColor = ratePercent >= 70 ? '#81c784' : ratePercent >= 40 ? '#ffd54f' : '#ef5350'
    const rateText = this.add.text(-cardWidth / 2 + 20 + choiceText.width + 12, 16, `成功率 ${ratePercent}%`, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '13px',
      color: rateColor
    })
    container.add(rateText)

    if (choice.description) {
      const descText = this.add.text(-cardWidth / 2 + 20, 36, choice.description, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#90a4ae'
      })
      container.add(descText)
    }

    const successRewardsText = this.formatRewardsText(choice.successRewards)
    if (successRewardsText) {
      const rewardText = this.add.text(-cardWidth / 2 + 20, 58, `✅ 成功: ${successRewardsText}`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#81c784',
        wordWrap: { width: cardWidth - 40 }
      })
      container.add(rewardText)
    }

    if (choice.failPenalty && (choice.failPenalty.healthDamage || choice.failPenalty.goldLoss)) {
      const failParts: string[] = []
      if (choice.failPenalty.healthDamage) failParts.push(`-${choice.failPenalty.healthDamage}生命`)
      if (choice.failPenalty.goldLoss) failParts.push(`-${choice.failPenalty.goldLoss}金币`)
      const failText = this.add.text(-cardWidth / 2 + 20, 80, `❌ 失败: ${failParts.join('  ')}`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '12px',
        color: '#ef5350'
      })
      container.add(failText)
    }

    const confirmBtn = this.createButton(0, cardHeight - 25, '确认选择', themeColor, () => {
      this.resolveEventChoice(choice)
    })
    confirmBtn.setScale(0.75)
    container.add(confirmBtn)

    container.setSize(cardWidth, cardHeight)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.02, duration: 150 })
      bg.clear()
      bg.fillStyle(themeColor, 0.1)
      bg.lineStyle(2, themeColor, 0.9)
      this.roundedRect(bg, -cardWidth / 2, 0, cardWidth, cardHeight, 10)
    })

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 150 })
      bg.clear()
      bg.fillStyle(0x0a0a20, 0.85)
      bg.lineStyle(2, themeColor, 0.5)
      this.roundedRect(bg, -cardWidth / 2, 0, cardWidth, cardHeight, 10)
    })

    container.setAlpha(0)
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 400,
      delay: index * 150,
      ease: 'Quad.easeOut'
    })

    return container
  }

  private formatRewardsText(rewards: { gold?: number; spirit?: number; exp?: number; health?: number; buff?: DungeonBuff; healPercent?: number }): string {
    const parts: string[] = []
    if (rewards.gold) parts.push(`💰${rewards.gold}`)
    if (rewards.spirit) parts.push(`✨${rewards.spirit}`)
    if (rewards.exp) parts.push(`EXP${rewards.exp}`)
    if (rewards.health) parts.push(`❤${rewards.health}`)
    if (rewards.healPercent) parts.push(`恢复${Math.floor(rewards.healPercent * 100)}%生命`)
    if (rewards.buff) parts.push(`${rewards.buff.icon}${rewards.buff.name}`)
    return parts.join('  ')
  }

  private resolveEventChoice(choice: DungeonEventChoice): void {
    const success = Math.random() < choice.successRate
    const rewards: string[] = []

    if (success) {
      const r = choice.successRewards
      if (r.gold) { this.progress.dungeonGold += r.gold; rewards.push(`+${r.gold}金币`) }
      if (r.spirit) { this.progress.dungeonSpirit += r.spirit; rewards.push(`+${r.spirit}灵气`) }
      if (r.exp) { this.progress.dungeonExp += r.exp; rewards.push(`+${r.exp}经验`) }
      if (r.health) {
        this.save.player.health = Math.min(this.save.player.maxHealth, this.save.player.health + r.health)
        rewards.push(`+${r.health}生命`)
      }
      if (r.healPercent) {
        const heal = Math.floor(this.save.player.maxHealth * r.healPercent)
        this.save.player.health = Math.min(this.save.player.maxHealth, this.save.player.health + heal)
        rewards.push(`恢复${heal}生命`)
      }
      if (r.buff) {
        this.dungeonManager.addBuff(this.progress, r.buff)
        rewards.push(`获得${r.buff.name}`)
      }
      this.currentEventResult = { success: true, text: choice.successText, rewards }
    } else {
      const p = choice.failPenalty || {}
      if (p.healthDamage) {
        this.save.player.health = Math.max(1, this.save.player.health - p.healthDamage)
        rewards.push(`-${p.healthDamage}生命`)
      }
      if (p.goldLoss) {
        this.progress.dungeonGold = Math.max(0, this.progress.dungeonGold - p.goldLoss)
        rewards.push(`-${p.goldLoss}金币`)
      }
      this.currentEventResult = { success: false, text: choice.failText || '运气不佳...', rewards }
    }

    const room = this.dungeonManager.getCurrentRoom(this.progress)
    if (room) this.dungeonManager.clearRoom(this.progress, room.id)
    this.saveManager.saveGame(this.save)

    if (this.save.player.health <= 0) {
      this.showDungeonFail()
      return
    }

    this.showEventResult()
  }

  private showEventResult(): void {
    this.phase = 'reward'
    this.clearContainer()
    const { width, height } = this.scale
    const result = this.currentEventResult
    if (!result) { this.showMap(); return }

    const resultColor = result.success ? 0x81c784 : 0xef5350
    const resultLabel = result.success ? '✨ 事件成功 ✨' : '💨 事件失败 💨'

    const resultTitle = this.add.text(width / 2, 130, resultLabel, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '32px',
      color: '#' + resultColor.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.container.add(resultTitle)

    const panelWidth = width * 0.7
    const panel = this.add.graphics()
    panel.fillStyle(0x0a0a20, 0.92)
    panel.lineStyle(2, resultColor, 0.7)
    this.roundedRect(panel, width / 2 - panelWidth / 2, height / 2 - 100, panelWidth, 200, 14)
    this.container.add(panel)

    const storyText = this.add.text(width / 2, height / 2 - 60, result.text, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#e0e0e0',
      align: 'center',
      wordWrap: { width: panelWidth - 40 },
      lineSpacing: 6
    }).setOrigin(0.5)
    this.container.add(storyText)

    if (result.rewards.length > 0) {
      const rewardsTitle = this.add.text(width / 2, height / 2 + 5, result.success ? '🎁 获得奖励' : '⚠ 受到影响', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '16px',
        color: result.success ? '#ffd54f' : '#ef5350',
        fontStyle: 'bold'
      }).setOrigin(0.5)
      this.container.add(rewardsTitle)

      const rewardContent = result.rewards.join('  |  ')
      const rewardText = this.add.text(width / 2, height / 2 + 35, rewardContent, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '16px',
        color: '#' + resultColor.toString(16).padStart(6, '0'),
        align: 'center'
      }).setOrigin(0.5)
      this.container.add(rewardText)
    }

    const continueBtn = this.createButton(width / 2, height / 2 + 140, '继续探索', resultColor, () => {
      this.currentEventResult = null
      this.showMap()
    })
    this.container.add(continueBtn)

    if (result.success) {
      this.cameras.main.flash(300, 255, 215, 0)
    } else {
      this.cameras.main.shake(200, 0.003)
    }
  }

  private showReward(rewards: { gold?: number; spirit?: number; exp?: number; healPercent?: number }, buff?: DungeonBuff, isBoss: boolean = false): void {
    this.phase = 'reward'
    this.clearContainer()
    const { width, height } = this.scale

    const title = isBoss ? '👑 首领奖励 👑' : '🎁 房间奖励 🎁'
    const titleColor = isBoss ? 0xff1744 : 0xffc107

    const rewardTitle = this.add.text(width / 2, 130, title, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '32px',
      color: '#' + titleColor.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.container.add(rewardTitle)

    const panelWidth = width * 0.65
    const panel = this.add.graphics()
    panel.fillStyle(0x0a0a20, 0.92)
    panel.lineStyle(2, titleColor, 0.7)
    this.roundedRect(panel, width / 2 - panelWidth / 2, height / 2 - 120, panelWidth, 240, 16)
    this.container.add(panel)

    let yOffset = height / 2 - 80
    const rewardItems: { icon: string; text: string; color: string }[] = []

    if (rewards.gold) rewardItems.push({ icon: '💰', text: `+${rewards.gold} 金币`, color: '#ffd54f' })
    if (rewards.spirit) rewardItems.push({ icon: '✨', text: `+${rewards.spirit} 灵气`, color: '#4dd0e1' })
    if (rewards.exp) rewardItems.push({ icon: '⭐', text: `+${rewards.exp} 经验`, color: '#ba68c8' })
    if (rewards.healPercent) {
      const heal = Math.floor(this.save.player.maxHealth * rewards.healPercent)
      this.save.player.health = Math.min(this.save.player.maxHealth, this.save.player.health + heal)
      this.save.player.mana = Math.min(this.save.player.maxMana, this.save.player.mana + Math.floor(this.save.player.maxMana * rewards.healPercent * 0.5))
      rewardItems.push({ icon: '❤', text: `恢复 ${heal} 生命`, color: '#ef5350' })
    }
    if (buff) {
      this.dungeonManager.addBuff(this.progress, buff)
      rewardItems.push({ icon: buff.icon, text: `获得增益: ${buff.name}`, color: '#' + buff.color.toString(16).padStart(6, '0') })
    }

    rewardItems.forEach((item, idx) => {
      const itemText = this.add.text(width / 2, yOffset + idx * 45, `${item.icon}  ${item.text}`, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '20px',
        color: item.color
      }).setOrigin(0.5)
      this.container.add(itemText)

      itemText.setAlpha(0)
      this.tweens.add({
        targets: itemText,
        alpha: 1,
        scale: { from: 0.5, to: 1 },
        duration: 300,
        delay: 200 + idx * 150,
        ease: 'Back.easeOut'
      })
    })

    this.updateStatsText()
    this.updateBuffsText()
    this.saveManager.saveGame(this.save)

    const isFloorBoss = isBoss && this.progress.currentFloor < this.progress.totalFloors
    const isFinalBoss = isBoss && this.progress.currentFloor >= this.progress.totalFloors

    const btnLabel = isFinalBoss ? '🎉 完成秘境' : isFloorBoss ? '⬇ 进入下一层' : '继续探索'
    const btnColor = isFinalBoss ? 0x81c784 : titleColor

    const continueBtn = this.createButton(width / 2, height / 2 + 140, btnLabel, btnColor, () => {
      if (isFinalBoss) {
        this.finishDungeon(true)
      } else if (isFloorBoss) {
        this.advanceToNextFloor()
      } else {
        this.showMap()
      }
    })
    this.container.add(continueBtn)

    this.cameras.main.flash(400, 255, 215, 0)
  }

  private applyRoomReward(room: DungeonRoom): void {
    if (room.rewards) {
      const r = room.rewards
      if (r.gold) this.progress.dungeonGold += r.gold
      if (r.spirit) this.progress.dungeonSpirit += r.spirit
      if (r.exp) this.progress.dungeonExp += r.exp
    }

    this.dungeonManager.clearRoom(this.progress, room.id)
    this.saveManager.saveGame(this.save)

    const isBoss = room.type === 'boss'
    if (isBoss && this.progress.currentFloor >= this.progress.totalFloors) {
      this.showReward(room.rewards || {}, room.rewards?.buff, true)
    } else if (isBoss) {
      this.showReward(room.rewards || {}, room.rewards?.buff, true)
    } else {
      this.showReward(room.rewards || {}, room.rewards?.buff, false)
    }
  }

  private advanceToNextFloor(): void {
    this.phase = 'floor_clear'
    this.clearContainer()
    const { width, height } = this.scale

    this.save.player.health = Math.min(this.save.player.maxHealth, this.save.player.health + Math.floor(this.save.player.maxHealth * 0.3))
    this.save.player.mana = Math.min(this.save.player.maxMana, this.save.player.mana + Math.floor(this.save.player.maxMana * 0.5))
    this.save.player.skills.forEach((s: Skill) => { s.currentCooldown = 0 })

    this.dungeonManager.nextFloor(this.progress, this.save.player.level)
    this.recalcPlayerStats()
    this.saveManager.saveGame(this.save)

    const panel = this.add.graphics()
    panel.fillStyle(0x0a0a20, 0.95)
    panel.lineStyle(3, 0x81c784, 0.8)
    this.roundedRect(panel, width / 2 - 300, height / 2 - 150, 600, 300, 20)
    this.container.add(panel)

    const iconText = this.add.text(width / 2, height / 2 - 90, '⬇', {
      fontSize: '60px',
      color: '#81c784'
    }).setOrigin(0.5)
    this.container.add(iconText)
    this.tweens.add({
      targets: iconText,
      y: height / 2 - 80,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    const title = this.add.text(width / 2, height / 2 - 20, '层级突破！', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '32px',
      color: '#81c784',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.container.add(title)

    const desc = this.add.text(width / 2, height / 2 + 25,
      `生命恢复30%，法力恢复50%\n\n进入第 ${this.progress.currentFloor}/${this.progress.totalFloors} 层：${this.progress.floor?.name || ''}`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '18px',
        color: '#b0bec5',
        align: 'center',
        lineSpacing: 6
      }
    ).setOrigin(0.5)
    this.container.add(desc)

    const continueBtn = this.createButton(width / 2, height / 2 + 100, '继续探索', 0x81c784, () => {
      this.showMap()
    })
    this.container.add(continueBtn)

    this.cameras.main.flash(500, 0, 255, 100)
    this.updateStatsText()
    this.updateBuffsText()
  }

  private finishDungeon(victory: boolean): void {
    this.phase = victory ? 'dungeon_complete' : 'dungeon_fail'
    this.clearContainer()
    const { width, height } = this.scale

    const result = this.dungeonManager.endDungeon(this.progress, this.save, victory)
    const permBonus = this.alchemyManager.getPermanentBonus(this.save.alchemy)
    let levelsGained = 0
    if (result.totalExp > 0) {
      const levelResult = this.saveManager.addExp(this.save.player, result.totalExp, permBonus)
      levelsGained = levelResult.levels
    }
    this.saveManager.saveGame(this.save)

    const resultColor = victory ? 0x81c784 : 0xef5350
    const resultLabel = victory ? '🏆 秘境通关 🏆' : '💀 秘境失败 💀'
    const bgColor = victory ? 0x1b5e20 : 0x4a0072

    this.cameras.main.setBackgroundColor(Phaser.Display.Color.IntegerToColor(bgColor).darken(40).color)

    const resultTitle = this.add.text(width / 2, 100, resultLabel, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '38px',
      color: '#' + resultColor.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.container.add(resultTitle)

    const panelWidth = width * 0.7
    const panel = this.add.graphics()
    panel.fillStyle(0x0a0a20, 0.92)
    panel.lineStyle(3, resultColor, 0.8)
    this.roundedRect(panel, width / 2 - panelWidth / 2, 160, panelWidth, 340, 18)
    this.container.add(panel)

    const summaryItems = [
      { label: '通关层数', value: `${this.progress.currentFloor - (victory ? 0 : 1)}/${this.progress.totalFloors}`, color: '#ffffff' },
      { label: '清理房间', value: `${this.progress.clearedRoomIds.length}`, color: '#ffffff' },
      { label: victory ? '获得金币' : '保留金币', value: `💰 ${victory ? result.totalGold : Math.floor(result.totalGold * 0.3)}`, color: '#ffd54f' },
      { label: victory ? '获得灵气' : '保留灵气', value: `✨ ${victory ? result.totalSpirit : Math.floor(result.totalSpirit * 0.3)}`, color: '#4dd0e1' },
      { label: '获得经验', value: `⭐ ${result.totalExp}${levelsGained > 0 ? ` (升级x${levelsGained})` : ''}`, color: '#ba68c8' }
    ]

    summaryItems.forEach((item, idx) => {
      const labelText = this.add.text(width / 2 - panelWidth / 2 + 40, 200 + idx * 48, item.label + ':', {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '18px',
        color: '#90a4ae'
      })
      this.container.add(labelText)

      const valueText = this.add.text(width / 2 + panelWidth / 2 - 40, 200 + idx * 48, item.value, {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '18px',
        color: item.color,
        fontStyle: 'bold',
        align: 'right'
      }).setOrigin(1, 0)
      this.container.add(valueText)
    })

    const playerStatus = this.add.text(width / 2, 440,
      `当前状态: Lv.${this.save.player.level}  ❤ ${this.save.player.health}/${this.save.player.maxHealth}  💰 ${this.save.player.gold}  ✨ ${this.save.player.spirit}`,
      {
        fontFamily: '"Microsoft YaHei", serif',
        fontSize: '15px',
        color: '#b0bec5'
      }
    ).setOrigin(0.5)
    this.container.add(playerStatus)

    const backBtn = this.createButton(width / 2, 520, '返回主界面', resultColor, () => this.goBack())
    this.container.add(backBtn)

    if (victory) {
      this.cameras.main.flash(800, 255, 215, 0)
      for (let i = 0; i < 30; i++) {
        const p = this.add.circle(
          Math.random() * width,
          Math.random() * height,
          3 + Math.random() * 5,
          [0xffd54f, 0x81c784, 0x4dd0e1, 0xba68c8][Math.floor(Math.random() * 4)],
          0.8
        )
        this.tweens.add({
          targets: p,
          y: p.y - 100 - Math.random() * 100,
          x: p.x + (Math.random() - 0.5) * 100,
          alpha: 0,
          scale: 0,
          duration: 1500 + Math.random() * 1000,
          delay: Math.random() * 500,
          onComplete: () => p.destroy()
        })
      }
    } else {
      this.cameras.main.shake(500, 0.008)
    }
  }

  private showDungeonFail(): void {
    this.finishDungeon(false)
  }

  private createButton(x: number, y: number, label: string, color: number, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const btnWidth = Math.max(160, label.length * 18 + 40)
    const btnHeight = 46

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.7)
    bg.lineStyle(2, color, 0.9)
    this.roundedRect(bg, -btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10)
    container.add(bg)

    const text = this.add.text(0, 0, label, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
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

  private showMessage(msg: string): void {
    this.messageText.setText(msg)
    this.messageText.setAlpha(0)
    this.tweens.add({
      targets: this.messageText,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 1800,
      repeatDelay: 300
    })
  }

  private showBattleMessage(msg: string): void {
    this.messageText.setText(msg)
    this.messageText.setAlpha(0)
    this.tweens.add({
      targets: this.messageText,
      alpha: 1,
      duration: 200
    })
  }

  private showDamageText(x: number, y: number, damage: number, color: number, isHeal: boolean = false, isCrit: boolean = false): void {
    const prefix = isHeal ? '+' : '-'
    const fontSize = isCrit ? '28px' : '22px'
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
      scale: 1.2,
      duration: 800,
      ease: 'Cubic.Out',
      onComplete: () => text.destroy()
    })
  }

  private showBattleElementText(x: number, y: number, content: string, color: number): void {
    const text = this.add.text(x, y, content, {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '18px',
      color: '#' + color.toString(16).padStart(6, '0'),
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

  private drawBar(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, ratio: number, fgColor: number, bgColor: number): void {
    graphics.clear()
    graphics.fillStyle(bgColor)
    graphics.fillRect(x, y, width, height)
    graphics.fillStyle(fgColor)
    graphics.fillRect(x, y, Math.max(0, width * Math.min(1, ratio)), height)
    graphics.lineStyle(1, 0x000000, 0.6)
    graphics.strokeRect(x, y, width, height)
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

  private goBack(): void {
    this.battleState = null
    this.currentEventResult = null
    this.cameras.main.fadeOut(400)
    this.time.delayedCall(400, () => {
      this.scene.start('MenuScene')
    })
  }
}
