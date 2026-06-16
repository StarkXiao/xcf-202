import type { DungeonFloor, DungeonRoom, DungeonRoomType, DungeonProgress, DungeonBuff, DungeonEvent, Enemy, GameSave } from '../types'
import { ROOM_TYPE_CONFIG, getRandomDungeonEvent, getRandomBuff, DUNGEON_FLOOR_NAMES, DUNGEON_FLOOR_COLORS } from '../data/dungeonData'
import { STAGES } from '../data/gameData'

export class DungeonManager {
  private static instance: DungeonManager

  static getInstance(): DungeonManager {
    if (!DungeonManager.instance) {
      DungeonManager.instance = new DungeonManager()
    }
    return DungeonManager.instance
  }

  generateFloor(layer: number, playerLevel: number): DungeonFloor {
    const roomsPerLayer = 5 + Math.min(layer, 2)
    const rooms: DungeonRoom[] = []
    const roomTypes: DungeonRoomType[] = []

    roomTypes.push('battle')
    for (let i = 1; i < roomsPerLayer - 1; i++) {
      const rand = Math.random()
      if (rand < 0.25) roomTypes.push('battle')
      else if (rand < 0.5) roomTypes.push('event')
      else if (rand < 0.65) roomTypes.push('treasure')
      else if (rand < 0.8) roomTypes.push('rest')
      else if (rand < 0.9) roomTypes.push('shop')
      else roomTypes.push('mystery')
    }
    roomTypes.push('boss')

    for (let i = 0; i < roomTypes.length; i++) {
      const type = roomTypes[i]
      const config = ROOM_TYPE_CONFIG[type]
      const roomId = `floor_${layer}_room_${i}`

      const room: DungeonRoom = {
        id: roomId,
        layer,
        index: i,
        type,
        name: config.name,
        description: config.description,
        icon: config.icon,
        color: config.color,
        isCleared: false,
        isAccessible: i === 0,
        connections: []
      }

      if (i < roomsPerLayer - 1) {
        room.connections.push(`floor_${layer}_room_${i + 1}`)
      }

      this.populateRoom(room, layer, playerLevel)
      rooms.push(room)
    }

    return {
      layer,
      name: DUNGEON_FLOOR_NAMES[Math.min(layer, DUNGEON_FLOOR_NAMES.length - 1)],
      rooms,
      bossRoomId: rooms[rooms.length - 1].id
    }
  }

  private populateRoom(room: DungeonRoom, layer: number, playerLevel: number): void {
    const difficultyMultiplier = 1 + layer * 0.2

    switch (room.type) {
      case 'battle':
        room.enemyLevel = Math.max(1, playerLevel + layer - 1)
        room.rewards = {
          gold: Math.floor((50 + layer * 30) * difficultyMultiplier),
          spirit: Math.floor((10 + layer * 8) * difficultyMultiplier),
          exp: Math.floor((40 + layer * 25) * difficultyMultiplier)
        }
        break

      case 'event':
        room.event = getRandomDungeonEvent()
        break

      case 'treasure':
        room.rewards = {
          gold: Math.floor(100 * difficultyMultiplier),
          spirit: Math.floor(30 * difficultyMultiplier),
          buff: Math.random() < 0.5 ? getRandomBuff(3 + layer) : undefined
        }
        break

      case 'rest':
        room.rewards = {
          healPercent: 0.3 + layer * 0.05
        }
        break

      case 'shop':
        room.rewards = {
          gold: Math.floor(30 * difficultyMultiplier),
          buff: getRandomBuff(4)
        }
        break

      case 'mystery':
        const mysteryRand = Math.random()
        if (mysteryRand < 0.3) {
          room.type = 'treasure'
          room.name = ROOM_TYPE_CONFIG.treasure.name
          room.icon = ROOM_TYPE_CONFIG.treasure.icon
          room.color = ROOM_TYPE_CONFIG.treasure.color
          room.rewards = {
            gold: Math.floor(200 * difficultyMultiplier),
            spirit: Math.floor(80 * difficultyMultiplier),
            buff: getRandomBuff(5)
          }
        } else if (mysteryRand < 0.6) {
          room.type = 'battle'
          room.name = ROOM_TYPE_CONFIG.battle.name + ' (精英)'
          room.icon = ROOM_TYPE_CONFIG.battle.icon
          room.color = ROOM_TYPE_CONFIG.battle.color
          room.enemyLevel = Math.max(1, playerLevel + layer + 1)
          room.rewards = {
            gold: Math.floor(200 * difficultyMultiplier),
            spirit: Math.floor(60 * difficultyMultiplier),
            exp: Math.floor(150 * difficultyMultiplier),
            buff: getRandomBuff(4)
          }
        } else {
          room.type = 'rest'
          room.name = ROOM_TYPE_CONFIG.rest.name + ' (神秘)'
          room.icon = ROOM_TYPE_CONFIG.rest.icon
          room.color = ROOM_TYPE_CONFIG.rest.color
          room.rewards = {
            healPercent: 0.6
          }
        }
        break

      case 'boss':
        room.enemyLevel = Math.max(1, playerLevel + layer + 2)
        room.rewards = {
          gold: Math.floor(500 * difficultyMultiplier),
          spirit: Math.floor(150 * difficultyMultiplier),
          exp: Math.floor(300 * difficultyMultiplier),
          buff: getRandomBuff(6)
        }
        break
    }
  }

  generateEnemiesForRoom(room: DungeonRoom, playerLevel: number): Enemy[] {
    const enemies: Enemy[] = []
    const isBoss = room.type === 'boss'
    const isElite = room.name.includes('精英')
    const baseLevel = room.enemyLevel || playerLevel

    const bossMultiplier = isBoss ? 2.5 : isElite ? 1.5 : 1
    const count = isBoss ? 1 : isElite ? 1 : Math.random() < 0.5 ? 1 : 2

    const enemyTemplates = [
      { name: '秘境守卫', color: 0x78909c, size: 42 },
      { name: '阴灵', color: 0x7e57c2, size: 38 },
      { name: '石傀', color: 0x8d6e63, size: 48 },
      { name: '血蛭', color: 0xe53935, size: 34 },
      { name: '毒蛛', color: 0x43a047, size: 36 }
    ]

    const bossTemplates = [
      { name: '秘境守护者', color: 0xff1744, size: 72 },
      { name: '幽冥鬼王', color: 0x6a1b9a, size: 76 },
      { name: '熔岩巨魔', color: 0xff6f00, size: 80 },
      { name: '玄冰魔龙', color: 0x0097a7, size: 78 },
      { name: '天魔首领', color: 0x4a0072, size: 84 }
    ]

    for (let i = 0; i < count; i++) {
      const template = isBoss
        ? bossTemplates[Math.min(room.layer, bossTemplates.length - 1)]
        : enemyTemplates[Math.floor(Math.random() * enemyTemplates.length)]

      const baseHealth = Math.floor((80 + baseLevel * 25) * bossMultiplier)
      const baseAttack = Math.floor((12 + baseLevel * 4) * bossMultiplier)
      const baseDefense = Math.floor((5 + baseLevel * 2) * bossMultiplier)

      enemies.push({
        id: `dungeon_${room.id}_enemy_${i}`,
        name: template.name + (isElite && !isBoss ? '·精英' : ''),
        health: baseHealth,
        maxHealth: baseHealth,
        attack: baseAttack,
        defense: baseDefense,
        exp: Math.floor((20 + baseLevel * 10) * bossMultiplier),
        gold: Math.floor((15 + baseLevel * 8) * bossMultiplier),
        color: template.color,
        size: template.size
      })
    }

    return enemies
  }

  enterRoom(progress: DungeonProgress, roomId: string): boolean {
    const room = this.findRoom(progress, roomId)
    if (!room || !room.isAccessible || room.isCleared) return false
    progress.currentRoomId = roomId
    return true
  }

  clearRoom(progress: DungeonProgress, roomId: string): void {
    const room = this.findRoom(progress, roomId)
    if (!room) return

    room.isCleared = true
    if (!progress.clearedRoomIds.includes(roomId)) {
      progress.clearedRoomIds.push(roomId)
    }

    room.connections.forEach(nextRoomId => {
      const nextRoom = this.findRoom(progress, nextRoomId)
      if (nextRoom) {
        nextRoom.isAccessible = true
      }
    })

    this.tickBuffs(progress)
  }

  private findRoom(progress: DungeonProgress, roomId: string): DungeonRoom | undefined {
    if (!progress.floor) return undefined
    return progress.floor.rooms.find(r => r.id === roomId)
  }

  addBuff(progress: DungeonProgress, buff: DungeonBuff): void {
    progress.activeBuffs.push({ ...buff, id: buff.id + '_' + Date.now() })
  }

  removeExpiredBuffs(progress: DungeonProgress): DungeonBuff[] {
    const expired = progress.activeBuffs.filter(b => b.remainingRooms <= 0)
    progress.activeBuffs = progress.activeBuffs.filter(b => b.remainingRooms > 0)
    return expired
  }

  private tickBuffs(progress: DungeonProgress): void {
    progress.activeBuffs.forEach(buff => {
      if (buff.remainingRooms > 0) {
        buff.remainingRooms--
      }
    })
    this.removeExpiredBuffs(progress)
  }

  getBuffBonus(progress: DungeonProgress): { attack: number; defense: number; maxHealth: number; critRate: number; critDamage: number; manaRegen: number } {
    const bonus = { attack: 0, defense: 0, maxHealth: 0, critRate: 0, critDamage: 0, manaRegen: 0 }
    progress.activeBuffs.forEach(buff => {
      switch (buff.type) {
        case 'attack': bonus.attack += buff.value; break
        case 'defense': bonus.defense += buff.value; break
        case 'maxHealth': bonus.maxHealth += buff.value; break
        case 'critRate': bonus.critRate += buff.value; break
        case 'critDamage': bonus.critDamage += buff.value; break
        case 'manaRegen': bonus.manaRegen += buff.value; break
      }
    })
    return bonus
  }

  startDungeon(progress: DungeonProgress, save: GameSave, playerLevel: number): void {
    progress.currentFloor = 0
    progress.clearedRoomIds = []
    progress.activeBuffs = []
    progress.dungeonGold = 0
    progress.dungeonSpirit = 0
    progress.dungeonExp = 0
    progress.isDungeonActive = true
    progress.dungeonStartHealth = save.player.health
    progress.playerSnapshot = {
      health: save.player.health,
      maxHealth: save.player.maxHealth,
      attack: save.player.attack,
      defense: save.player.defense,
      mana: save.player.mana,
      maxMana: save.player.maxMana
    }
    this.nextFloor(progress, playerLevel)
  }

  nextFloor(progress: DungeonProgress, playerLevel: number): boolean {
    if (progress.currentFloor >= progress.totalFloors) return false
    progress.currentFloor++
    progress.currentRoomId = null
    progress.floor = this.generateFloor(progress.currentFloor, playerLevel)
    return true
  }

  isCurrentFloorComplete(progress: DungeonProgress): boolean {
    if (!progress.floor) return false
    const bossRoom = progress.floor.rooms.find(r => r.id === progress.floor!.bossRoomId)
    return bossRoom?.isCleared || false
  }

  endDungeon(progress: DungeonProgress, save: GameSave, victory: boolean): {
    totalGold: number
    totalSpirit: number
    totalExp: number
  } {
    const rewards = {
      totalGold: progress.dungeonGold,
      totalSpirit: progress.dungeonSpirit,
      totalExp: progress.dungeonExp
    }

    if (victory) {
      save.player.gold += rewards.totalGold
      save.player.spirit += rewards.totalSpirit
    } else {
      save.player.gold += Math.floor(rewards.totalGold * 0.3)
      save.player.spirit += Math.floor(rewards.totalSpirit * 0.3)
    }

    if (progress.playerSnapshot) {
      save.player.health = Math.max(1, Math.floor(progress.playerSnapshot.maxHealth * 0.5))
    }

    progress.isDungeonActive = false
    progress.floor = null
    progress.currentRoomId = null
    progress.activeBuffs = []
    progress.playerSnapshot = null

    return rewards
  }

  getCurrentRoom(progress: DungeonProgress): DungeonRoom | null {
    if (!progress.currentRoomId || !progress.floor) return null
    return progress.floor.rooms.find(r => r.id === progress.currentRoomId) || null
  }

  getAccessibleRooms(progress: DungeonProgress): DungeonRoom[] {
    if (!progress.floor) return []
    return progress.floor.rooms.filter(r => r.isAccessible && !r.isCleared)
  }
}
