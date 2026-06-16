import type { EncounterProgress, EncounterEvent, EncounterReward, EncounterChoice, Player } from '../types'
import { ENCOUNTER_EVENTS, ENCOUNTER_RARITY_WEIGHTS, DAILY_ENCOUNTER_LIMIT } from '../data/encounterData'

export class EncounterManager {
  private static instance: EncounterManager

  static getInstance(): EncounterManager {
    if (!EncounterManager.instance) {
      EncounterManager.instance = new EncounterManager()
    }
    return EncounterManager.instance
  }

  createInitialEncounterProgress(): EncounterProgress {
    return {
      completedEncounters: [],
      encounterCount: 0,
      lastEncounterTime: 0,
      dailyEncounterCount: 0,
      lastDailyReset: Date.now()
    }
  }

  validateEncounterProgress(data: EncounterProgress | undefined): EncounterProgress {
    if (!data) {
      return this.createInitialEncounterProgress()
    }

    if (!data.completedEncounters) data.completedEncounters = []
    if (data.encounterCount === undefined) data.encounterCount = 0
    if (!data.lastEncounterTime) data.lastEncounterTime = 0
    if (data.dailyEncounterCount === undefined) data.dailyEncounterCount = 0
    if (!data.lastDailyReset) data.lastDailyReset = Date.now()

    this.checkDailyReset(data)

    return data
  }

  checkDailyReset(progress: EncounterProgress): void {
    const now = Date.now()
    const lastReset = new Date(progress.lastDailyReset)
    const currentReset = new Date(now)

    if (lastReset.getFullYear() !== currentReset.getFullYear() ||
        lastReset.getMonth() !== currentReset.getMonth() ||
        lastReset.getDate() !== currentReset.getDate()) {
      progress.dailyEncounterCount = 0
      progress.lastDailyReset = now
    }
  }

  canEncounter(progress: EncounterProgress): boolean {
    this.checkDailyReset(progress)
    return progress.dailyEncounterCount < DAILY_ENCOUNTER_LIMIT
  }

  getRemainingEncounters(progress: EncounterProgress): number {
    this.checkDailyReset(progress)
    return Math.max(0, DAILY_ENCOUNTER_LIMIT - progress.dailyEncounterCount)
  }

  rollRandomEncounter(progress: EncounterProgress, highestStage: number): EncounterEvent | null {
    if (!this.canEncounter(progress)) return null

    const available = ENCOUNTER_EVENTS.filter(event => {
      if (event.requiredStage > highestStage) return false
      if (!event.isRepeatable && progress.completedEncounters.includes(event.id)) return false
      return true
    })

    if (available.length === 0) return null

    const totalWeight = available.reduce((sum, event) => {
      return sum + (ENCOUNTER_RARITY_WEIGHTS[event.rarity] || 10)
    }, 0)

    let random = Math.random() * totalWeight
    for (const event of available) {
      random -= ENCOUNTER_RARITY_WEIGHTS[event.rarity] || 10
      if (random <= 0) return event
    }

    return available[0]
  }

  resolveChoice(choice: EncounterChoice): { success: boolean; rewards: EncounterReward[]; text: string } {
    const success = Math.random() < choice.successRate
    const rewards = success ? choice.rewards : choice.failRewards
    const text = success ? choice.resultText : choice.failText

    return { success, rewards, text }
  }

  applyRewards(player: Player, rewards: EncounterReward[]): string[] {
    const messages: string[] = []

    for (const reward of rewards) {
      switch (reward.type) {
        case 'gold':
          player.gold = Math.max(0, player.gold + reward.value)
          messages.push(reward.value >= 0 ? `获得 ${reward.value} 金币` : `失去 ${Math.abs(reward.value)} 金币`)
          break
        case 'spirit':
          player.spirit = Math.max(0, player.spirit + reward.value)
          messages.push(reward.value >= 0 ? `获得 ${reward.value} 灵气` : `失去 ${Math.abs(reward.value)} 灵气`)
          break
        case 'exp':
          if (reward.value > 0) {
            messages.push(`获得 ${reward.value} 经验`)
          }
          break
        case 'attack':
          if (reward.value > 0) {
            player.attack += reward.value
            messages.push(`攻击力 +${reward.value}`)
          } else {
            player.attack = Math.max(1, player.attack + reward.value)
            messages.push(`攻击力 ${reward.value}`)
          }
          break
        case 'defense':
          if (reward.value > 0) {
            player.defense += reward.value
            messages.push(`防御力 +${reward.value}`)
          } else {
            player.defense = Math.max(0, player.defense + reward.value)
            messages.push(`防御力 ${reward.value}`)
          }
          break
        case 'maxHealth':
          if (reward.value > 0) {
            player.maxHealth += reward.value
            player.health = Math.min(player.health + reward.value, player.maxHealth)
            messages.push(`生命上限 +${reward.value}`)
          } else {
            player.maxHealth = Math.max(10, player.maxHealth + reward.value)
            player.health = Math.min(player.health, player.maxHealth)
            messages.push(`生命上限 ${reward.value}`)
          }
          break
        case 'maxMana':
          if (reward.value > 0) {
            player.maxMana += reward.value
            player.mana = Math.min(player.mana + reward.value, player.maxMana)
            messages.push(`灵力上限 +${reward.value}`)
          } else {
            player.maxMana = Math.max(10, player.maxMana + reward.value)
            player.mana = Math.min(player.mana, player.maxMana)
            messages.push(`灵力上限 ${reward.value}`)
          }
          break
      }
    }

    return messages
  }

  completeEncounter(progress: EncounterProgress, eventId: string): void {
    if (!progress.completedEncounters.includes(eventId)) {
      progress.completedEncounters.push(eventId)
    }
    progress.encounterCount++
    progress.dailyEncounterCount++
    progress.lastEncounterTime = Date.now()
  }

  getEncounterById(id: string): EncounterEvent | undefined {
    return ENCOUNTER_EVENTS.find(e => e.id === id)
  }

  getAvailableEncounters(progress: EncounterProgress, highestStage: number): EncounterEvent[] {
    return ENCOUNTER_EVENTS.filter(event => {
      if (event.requiredStage > highestStage) return false
      if (!event.isRepeatable && progress.completedEncounters.includes(event.id)) return false
      return true
    })
  }

  getCompletedEncountersCount(progress: EncounterProgress): number {
    return progress.completedEncounters.length
  }

  getTotalEncountersCount(): number {
    return ENCOUNTER_EVENTS.length
  }
}
