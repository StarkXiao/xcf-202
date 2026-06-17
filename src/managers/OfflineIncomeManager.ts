import type { GameSave, OfflineIncomeResult, OfflineIncomeConfig, OfflineIncomeData } from '../types'
import { STAGES } from '../data/gameData'

const DEFAULT_CONFIG: OfflineIncomeConfig = {
  maxOfflineHours: 8,
  goldPerMinuteBase: 2,
  spiritPerMinuteBase: 0.3,
  expPerMinuteBase: 1,
  stageMultiplier: 0.15,
  goldCapBase: 10000,
  spiritCapBase: 1000,
  expCapBase: 5000
}

export class OfflineIncomeManager {
  private static instance: OfflineIncomeManager
  private config: OfflineIncomeConfig

  static getInstance(): OfflineIncomeManager {
    if (!OfflineIncomeManager.instance) {
      OfflineIncomeManager.instance = new OfflineIncomeManager()
    }
    return OfflineIncomeManager.instance
  }

  constructor() {
    this.config = DEFAULT_CONFIG
  }

  createInitialOfflineIncomeData(): OfflineIncomeData {
    return {
      lastSettleTime: Date.now(),
      totalOfflineTime: 0,
      totalGoldEarned: 0,
      totalSpiritEarned: 0,
      totalExpEarned: 0
    }
  }

  validateOfflineIncomeData(data: any): OfflineIncomeData {
    const defaults = this.createInitialOfflineIncomeData()
    if (!data) {
      return defaults
    }
    return {
      ...defaults,
      ...data,
      lastSettleTime: data.lastSettleTime || Date.now(),
      totalOfflineTime: data.totalOfflineTime || 0,
      totalGoldEarned: data.totalGoldEarned || 0,
      totalSpiritEarned: data.totalSpiritEarned || 0,
      totalExpEarned: data.totalExpEarned || 0
    }
  }

  calculateOfflineIncome(save: GameSave): OfflineIncomeResult {
    const now = Date.now()
    const lastPlayTime = save.lastPlayTime || now
    const maxSeconds = this.config.maxOfflineHours * 60 * 60

    const { isAbnormal, reason, adjustedTime } = this.validateTime(now, lastPlayTime, maxSeconds)

    if (isAbnormal) {
      return {
        income: { gold: 0, spirit: 0, exp: 0 },
        offlineSeconds: 0,
        maxSeconds,
        isCapped: false,
        isAbnormal: true,
        abnormalReason: reason
      }
    }

    const offlineSeconds = Math.floor(adjustedTime / 1000)
    const effectiveSeconds = Math.min(offlineSeconds, maxSeconds)
    const isCapped = offlineSeconds > maxSeconds

    const stageMultiplier = 1 + (save.highestStage - 1) * this.config.stageMultiplier
    const levelMultiplier = 1 + (save.player.level - 1) * 0.05

    const stageRewards = this.getAverageStageRewards(save.highestStage)

    const goldPerSecond = (this.config.goldPerMinuteBase + stageRewards.gold * 0.08) * stageMultiplier * levelMultiplier / 60
    const spiritPerSecond = (this.config.spiritPerMinuteBase + stageRewards.spirit * 0.08) * stageMultiplier * levelMultiplier / 60
    const expPerSecond = (this.config.expPerMinuteBase + stageRewards.exp * 0.08) * stageMultiplier * levelMultiplier / 60

    const goldCap = this.config.goldCapBase * stageMultiplier * levelMultiplier
    const spiritCap = this.config.spiritCapBase * stageMultiplier * levelMultiplier
    const expCap = this.config.expCapBase * stageMultiplier * levelMultiplier

    let gold = Math.floor(goldPerSecond * effectiveSeconds)
    let spirit = Math.floor(spiritPerSecond * effectiveSeconds)
    let exp = Math.floor(expPerSecond * effectiveSeconds)

    gold = Math.min(gold, goldCap)
    spirit = Math.min(spirit, spiritCap)
    exp = Math.min(exp, expCap)

    gold = Math.max(0, gold)
    spirit = Math.max(0, spirit)
    exp = Math.max(0, exp)

    return {
      income: { gold, spirit, exp },
      offlineSeconds: effectiveSeconds,
      maxSeconds,
      isCapped,
      isAbnormal: false
    }
  }

  private validateTime(now: number, lastPlayTime: number, maxSeconds: number): { isAbnormal: boolean; reason?: string; adjustedTime: number } {
    if (lastPlayTime > now) {
      return {
        isAbnormal: true,
        reason: '系统时间异常，检测到时间回溯',
        adjustedTime: 0
      }
    }

    if (lastPlayTime <= 0 || now <= 0) {
      return {
        isAbnormal: true,
        reason: '时间戳数据异常',
        adjustedTime: 0
      }
    }

    const maxTime = maxSeconds * 1000 * 2
    const actualTime = now - lastPlayTime
    if (actualTime > maxTime) {
      return {
        isAbnormal: false,
        adjustedTime: Math.min(actualTime, maxSeconds * 1000)
      }
    }

    if (actualTime < 60000) {
      return {
        isAbnormal: false,
        adjustedTime: 0
      }
    }

    return {
      isAbnormal: false,
      adjustedTime: actualTime
    }
  }

  private getAverageStageRewards(stageId: number): { gold: number; spirit: number; exp: number } {
    const stage = STAGES.find(s => s.id === Math.min(stageId, STAGES.length))
    if (stage) {
      return {
        gold: stage.rewards.gold,
        spirit: stage.rewards.spirit,
        exp: stage.rewards.exp
      }
    }
    return { gold: 50, spirit: 5, exp: 40 }
  }

  applyOfflineIncome(save: GameSave, result: OfflineIncomeResult): void {
    if (result.isAbnormal) {
      return
    }

    save.player.gold += result.income.gold
    save.player.spirit += result.income.spirit

    this.addExp(save.player, result.income.exp)

    if (!save.offlineIncome) {
      save.offlineIncome = this.createInitialOfflineIncomeData()
    }

    save.offlineIncome.lastSettleTime = Date.now()
    save.offlineIncome.totalOfflineTime += result.offlineSeconds
    save.offlineIncome.totalGoldEarned += result.income.gold
    save.offlineIncome.totalSpiritEarned += result.income.spirit
    save.offlineIncome.totalExpEarned += result.income.exp
  }

  private addExp(player: GameSave['player'], exp: number): { leveledUp: boolean; levels: number } {
    let leveledUp = false
    let levels = 0
    player.exp += exp

    while (player.exp >= player.expToNext) {
      player.exp -= player.expToNext
      player.level++
      player.expToNext = Math.floor(100 * Math.pow(1.3, player.level - 1))
      leveledUp = true
      levels++
    }

    if (leveledUp) {
      const baseHealth = 100 + (player.level - 1) * 20
      const baseAttack = 20 + (player.level - 1) * 5
      const baseDefense = 10 + (player.level - 1) * 3

      player.maxHealth = baseHealth
      player.maxMana = Math.floor(50 + (player.level - 1) * 10)
      player.attack = baseAttack
      player.defense = baseDefense
      player.health = player.maxHealth
      player.mana = player.maxMana
      player.skills.forEach((s: any) => {
        s.currentCooldown = 0
      })
    }

    return { leveledUp, levels }
  }

  formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}秒`
    }
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${minutes}分钟${secs > 0 ? secs + '秒' : ''}`
    }
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`
  }

  hasIncome(result: OfflineIncomeResult): boolean {
    return !result.isAbnormal && (result.income.gold > 0 || result.income.spirit > 0 || result.income.exp > 0)
  }

  getConfig(): OfflineIncomeConfig {
    return { ...this.config }
  }
}
