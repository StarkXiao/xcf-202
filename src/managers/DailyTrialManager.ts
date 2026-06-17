import type { GameSave, DailyTrialProgress, DailyTrialLevel, DailyTrialReward, Enemy, DailyTrialResult, DailyTrialMilestone } from '../types'
import { DAILY_TRIAL_LEVELS, DAILY_TRIAL_CONFIG, DAILY_TRIAL_MILESTONES } from '../data/dailyTrialData'

export class DailyTrialManager {
  private static instance: DailyTrialManager

  static getInstance(): DailyTrialManager {
    if (!DailyTrialManager.instance) {
      DailyTrialManager.instance = new DailyTrialManager()
    }
    return DailyTrialManager.instance
  }

  createInitialDailyTrialData(): DailyTrialProgress {
    return {
      dailyAttempts: 0,
      maxDailyAttempts: DAILY_TRIAL_CONFIG.MAX_DAILY_ATTEMPTS,
      highestLevel: 0,
      currentLevel: 0,
      lastDailyReset: Date.now(),
      totalClears: 0,
      bestTime: null,
      lastCompletionTime: null,
      claimedLevelRewards: [],
      isTrialActive: false,
      trialStartHealth: 100,
      playerSnapshot: null,
      consecutiveDays: 0,
      lastStreakDate: null,
      purchasedExtraAttempts: 0,
      currentDifficultyScale: 0,
      dailyGoldEarned: 0,
      dailySpiritEarned: 0,
      dailyExpEarned: 0,
      dailyClearedLevels: [],
      dailyMilestoneClaimed: [],
      bestConsecutiveDays: 0
    }
  }

  validateDailyTrialData(trial: any): DailyTrialProgress {
    if (!trial) {
      return this.createInitialDailyTrialData()
    }
    const defaults = this.createInitialDailyTrialData()
    return {
      ...defaults,
      ...trial,
      claimedLevelRewards: trial.claimedLevelRewards || [],
      playerSnapshot: trial.playerSnapshot || null,
      consecutiveDays: trial.consecutiveDays || 0,
      lastStreakDate: trial.lastStreakDate || null,
      purchasedExtraAttempts: trial.purchasedExtraAttempts || 0,
      currentDifficultyScale: trial.currentDifficultyScale || 0,
      dailyGoldEarned: trial.dailyGoldEarned || 0,
      dailySpiritEarned: trial.dailySpiritEarned || 0,
      dailyExpEarned: trial.dailyExpEarned || 0,
      dailyClearedLevels: trial.dailyClearedLevels || [],
      dailyMilestoneClaimed: trial.dailyMilestoneClaimed || [],
      bestConsecutiveDays: trial.bestConsecutiveDays || 0
    }
  }

  private getTodayDateString(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  private getYesterdayDateString(): string {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  checkDailyReset(trial: DailyTrialProgress): boolean {
    const now = Date.now()
    const lastReset = trial.lastDailyReset || 0
    const lastResetDate = new Date(lastReset)
    const nowDate = new Date(now)

    const isSameDay =
      lastResetDate.getFullYear() === nowDate.getFullYear() &&
      lastResetDate.getMonth() === nowDate.getMonth() &&
      lastResetDate.getDate() === nowDate.getDate()

    if (!isSameDay) {
      const yesterday = this.getYesterdayDateString()
      if (trial.lastStreakDate === yesterday) {
        trial.consecutiveDays = (trial.consecutiveDays || 0) + 1
      } else if (trial.lastStreakDate !== this.getTodayDateString()) {
        trial.consecutiveDays = 0
      }
      trial.lastStreakDate = this.getTodayDateString()
      if (trial.consecutiveDays > (trial.bestConsecutiveDays || 0)) {
        trial.bestConsecutiveDays = trial.consecutiveDays
      }

      trial.dailyAttempts = 0
      trial.purchasedExtraAttempts = 0
      trial.lastDailyReset = now
      trial.isTrialActive = false
      trial.playerSnapshot = null
      trial.currentDifficultyScale = 0
      trial.dailyGoldEarned = 0
      trial.dailySpiritEarned = 0
      trial.dailyExpEarned = 0
      trial.dailyClearedLevels = []
      trial.dailyMilestoneClaimed = []

      const levelBonusThreshold = DAILY_TRIAL_CONFIG.LEVEL_BONUS_ATTEMPT_THRESHOLD
      const baseMax = DAILY_TRIAL_CONFIG.MAX_DAILY_ATTEMPTS
      const bonusAttempts = Math.floor((trial.highestLevel || 0) / levelBonusThreshold) * DAILY_TRIAL_CONFIG.LEVEL_BONUS_EXTRA_ATTEMPTS
      trial.maxDailyAttempts = baseMax + bonusAttempts

      return true
    }

    if (!trial.lastStreakDate) {
      trial.lastStreakDate = this.getTodayDateString()
      trial.consecutiveDays = 0
    }

    return false
  }

  getStreakBonus(trial: DailyTrialProgress): number {
    const days = trial.consecutiveDays || 0
    return Math.min(days * DAILY_TRIAL_CONFIG.STREAK_BONUS_PER_DAY, DAILY_TRIAL_CONFIG.MAX_STREAK_BONUS)
  }

  getStreakInfo(trial: DailyTrialProgress): { days: number; bonus: number; maxBonus: number; nextBonusDays: number } {
    const days = trial.consecutiveDays || 0
    const bonus = this.getStreakBonus(trial)
    const maxBonus = DAILY_TRIAL_CONFIG.MAX_STREAK_BONUS
    const maxDays = Math.floor(maxBonus / DAILY_TRIAL_CONFIG.STREAK_BONUS_PER_DAY)
    const nextBonusDays = days < maxDays ? days + 1 : maxDays
    return { days, bonus, maxBonus, nextBonusDays }
  }

  getRemainingAttempts(trial: DailyTrialProgress): number {
    this.checkDailyReset(trial)
    const totalAttempts = trial.maxDailyAttempts + (trial.purchasedExtraAttempts || 0)
    return Math.max(0, totalAttempts - trial.dailyAttempts)
  }

  canAttempt(trial: DailyTrialProgress): boolean {
    return this.getRemainingAttempts(trial) > 0
  }

  canPurchaseExtraAttempt(trial: DailyTrialProgress): boolean {
    this.checkDailyReset(trial)
    const purchased = trial.purchasedExtraAttempts || 0
    return purchased < DAILY_TRIAL_CONFIG.MAX_PURCHASABLE_ATTEMPTS
  }

  getExtraAttemptCost(trial: DailyTrialProgress): number {
    const purchased = trial.purchasedExtraAttempts || 0
    return Math.floor(DAILY_TRIAL_CONFIG.EXTRA_ATTEMPT_BASE_COST * Math.pow(DAILY_TRIAL_CONFIG.EXTRA_ATTEMPT_COST_SCALE, purchased))
  }

  purchaseExtraAttempt(save: GameSave): { success: boolean; message: string; cost: number } {
    const trial = save.dailyTrial
    this.checkDailyReset(trial)

    if (!this.canPurchaseExtraAttempt(trial)) {
      return { success: false, message: '今日已无法购买更多次数！', cost: 0 }
    }

    const cost = this.getExtraAttemptCost(trial)
    if (save.player.spirit < cost) {
      return { success: false, message: `灵气不足！需要 ${cost} 灵气`, cost }
    }

    save.player.spirit -= cost
    trial.purchasedExtraAttempts = (trial.purchasedExtraAttempts || 0) + 1

    return { success: true, message: `成功购买1次试炼机会！消耗 ${cost} 灵气`, cost }
  }

  getDifficultyScale(trial: DailyTrialProgress): number {
    return trial.currentDifficultyScale || 0
  }

  getDifficultyScaleLabel(scale: number): { label: string; color: string } {
    if (scale <= 0) return { label: '标准', color: '#81c784' }
    if (scale < 0.3) return { label: '强化', color: '#ffd54f' }
    if (scale < 0.6) return { label: '猛攻', color: '#ff7043' }
    return { label: '极限', color: '#ef5350' }
  }

  getTrialLevel(levelId: number): DailyTrialLevel | undefined {
    return DAILY_TRIAL_LEVELS.find(l => l.id === levelId)
  }

  getAvailableLevels(playerLevel: number, highestLevel: number): DailyTrialLevel[] {
    return DAILY_TRIAL_LEVELS.filter(level => {
      if (level.minPlayerLevel > playerLevel) return false
      if (level.id > highestLevel + 1 && level.id > 1) return false
      return true
    })
  }

  isLevelUnlocked(levelId: number, playerLevel: number, highestLevel: number): boolean {
    const level = this.getTrialLevel(levelId)
    if (!level) return false
    if (level.minPlayerLevel > playerLevel) return false
    if (levelId === 1) return true
    return levelId <= highestLevel + 1
  }

  getScaledEnemies(level: DailyTrialLevel, difficultyScale: number = 0): Enemy[] {
    const multiplier = level.statMultiplier
    const scaleMultiplier = 1 + difficultyScale
    return level.enemies.map(enemy => {
      const scaled: Enemy = JSON.parse(JSON.stringify(enemy))
      scaled.health = Math.floor(enemy.health * multiplier.health * scaleMultiplier)
      scaled.maxHealth = Math.floor(enemy.maxHealth * multiplier.health * scaleMultiplier)
      scaled.attack = Math.floor(enemy.attack * multiplier.attack * scaleMultiplier)
      scaled.defense = Math.floor(enemy.defense * multiplier.defense * scaleMultiplier)
      return scaled
    })
  }

  startTrial(save: GameSave, levelId: number): { success: boolean; message?: string; scaledEnemies?: Enemy[]; difficultyScale?: number } {
    const trial = save.dailyTrial
    this.checkDailyReset(trial)

    if (!this.canAttempt(trial)) {
      return { success: false, message: '今日试炼次数已用完，请明日再来！' }
    }

    const level = this.getTrialLevel(levelId)
    if (!level) {
      return { success: false, message: '试炼关卡不存在！' }
    }

    if (!this.isLevelUnlocked(levelId, save.player.level, trial.highestLevel)) {
      return { success: false, message: '试炼关卡未解锁！' }
    }

    if (save.player.level < level.minPlayerLevel) {
      return { success: false, message: `需要达到等级 ${level.minPlayerLevel} 才能挑战此试炼！` }
    }

    trial.dailyAttempts++
    trial.currentLevel = levelId
    trial.isTrialActive = true
    trial.trialStartHealth = save.player.health
    trial.playerSnapshot = {
      health: save.player.health,
      maxHealth: save.player.maxHealth,
      attack: save.player.attack,
      defense: save.player.defense,
      mana: save.player.mana,
      maxMana: save.player.maxMana
    }

    save.player.health = Math.floor(save.player.maxHealth * DAILY_TRIAL_CONFIG.PLAYER_STAT_PENALTY)
    save.player.mana = Math.floor(save.player.maxMana * DAILY_TRIAL_CONFIG.PLAYER_STAT_PENALTY)

    const scaledEnemies = this.getScaledEnemies(level, trial.currentDifficultyScale)

    return { success: true, scaledEnemies, difficultyScale: trial.currentDifficultyScale }
  }

  private applyRewardToSave(save: GameSave, reward: DailyTrialReward): void {
    switch (reward.type) {
      case 'gold':
        save.player.gold += reward.value
        break
      case 'spirit':
        save.player.spirit += reward.value
        break
      case 'exp':
        const saveManager = require('./SaveManager').SaveManager.getInstance()
        saveManager.addExp(save.player, reward.value)
        break
      case 'material':
      case 'herb':
        const alchemyManager = require('./AlchemyManager').AlchemyManager.getInstance()
        if (reward.type === 'herb') {
          alchemyManager.addHerb(save.alchemy, reward.itemId!, reward.value)
        } else {
          const equipmentManager = require('./EquipmentManager').EquipmentManager.getInstance()
          equipmentManager.addMaterial(save.equipment, reward.itemId!, reward.value)
        }
        break
      case 'pill':
        const alchemyMgr = require('./AlchemyManager').AlchemyManager.getInstance()
        alchemyMgr.addPill(save.alchemy, reward.itemId!, reward.value)
        break
    }
  }

  completeTrial(save: GameSave, levelId: number, completionTime: number): DailyTrialResult {
    const trial = save.dailyTrial
    const level = this.getTrialLevel(levelId)
    const difficultyScale = trial.currentDifficultyScale || 0

    if (!level) {
      return {
        success: false,
        levelId,
        clearedLevel: 0,
        goldEarned: 0,
        spiritEarned: 0,
        expEarned: 0,
        extraRewards: [],
        isNewRecord: false,
        completionTime,
        streakBonus: 0,
        difficultyScale
      }
    }

    const isFirstClear = !trial.claimedLevelRewards.includes(levelId)
    const isNewRecord = trial.bestTime === null || completionTime < trial.bestTime
    const isTimeBonus = completionTime < DAILY_TRIAL_CONFIG.LEVEL_CLEAR_TIME_BONUS_THRESHOLD
    const streakBonus = this.getStreakBonus(trial)

    let rewardMultiplier = DAILY_TRIAL_CONFIG.BASE_REWARD_MULTIPLIER
    if (isFirstClear) rewardMultiplier *= DAILY_TRIAL_CONFIG.FIRST_CLEAR_BONUS
    if (isTimeBonus) rewardMultiplier *= DAILY_TRIAL_CONFIG.TIME_BONUS_MULTIPLIER
    rewardMultiplier *= (1 + streakBonus)

    let goldEarned = 0
    let spiritEarned = 0
    let expEarned = 0
    const extraRewards: DailyTrialReward[] = []

    level.rewards.forEach(reward => {
      const scaledValue = Math.floor(reward.value * rewardMultiplier)
      const scaledReward = { ...reward, value: scaledValue }

      switch (reward.type) {
        case 'gold':
          goldEarned = scaledValue
          break
        case 'spirit':
          spiritEarned = scaledValue
          break
        case 'exp':
          expEarned = scaledValue
          break
        default:
          extraRewards.push(scaledReward)
      }
      this.applyRewardToSave(save, scaledReward)
    })

    if (levelId > trial.highestLevel) {
      trial.highestLevel = levelId
    }

    if (!trial.claimedLevelRewards.includes(levelId)) {
      trial.claimedLevelRewards.push(levelId)
    }

    trial.totalClears++
    trial.lastCompletionTime = Date.now()
    if (isNewRecord) {
      trial.bestTime = completionTime
    }
    trial.isTrialActive = false

    if (trial.playerSnapshot) {
      save.player.health = Math.min(
        Math.max(save.player.health, Math.floor(save.player.maxHealth * 0.3)),
        save.player.maxHealth
      )
      save.player.mana = Math.min(
        Math.max(save.player.mana, Math.floor(save.player.maxMana * 0.3)),
        save.player.maxMana
      )
    }
    trial.playerSnapshot = null

    trial.dailyGoldEarned = (trial.dailyGoldEarned || 0) + goldEarned
    trial.dailySpiritEarned = (trial.dailySpiritEarned || 0) + spiritEarned
    trial.dailyExpEarned = (trial.dailyExpEarned || 0) + expEarned
    if (!trial.dailyClearedLevels) trial.dailyClearedLevels = []
    if (!trial.dailyClearedLevels.includes(levelId)) {
      trial.dailyClearedLevels.push(levelId)
    }

    trial.currentDifficultyScale = Math.min(
      (trial.currentDifficultyScale || 0) + DAILY_TRIAL_CONFIG.DIFFICULTY_SCALE_PER_ATTEMPT,
      DAILY_TRIAL_CONFIG.MAX_DIFFICULTY_SCALE
    )

    const achievementManager = require('./AchievementManager').AchievementManager.getInstance()
    achievementManager.updateAchievementProgress(save.achievement, {
      type: 'stage_clear',
      value: 1,
      stageId: levelId
    })

    return {
      success: true,
      levelId,
      clearedLevel: levelId,
      goldEarned,
      spiritEarned,
      expEarned,
      extraRewards,
      isNewRecord,
      completionTime,
      streakBonus,
      difficultyScale
    }
  }

  failTrial(save: GameSave): void {
    const trial = save.dailyTrial
    trial.isTrialActive = false

    if (trial.playerSnapshot) {
      save.player.health = Math.max(trial.playerSnapshot.health, Math.floor(save.player.maxHealth * 0.1))
      save.player.mana = Math.max(trial.playerSnapshot.mana, Math.floor(save.player.maxMana * 0.1))
    }
    trial.playerSnapshot = null
  }

  abandonTrial(save: GameSave): void {
    this.failTrial(save)
  }

  getAvailableMilestones(trial: DailyTrialProgress): DailyTrialMilestone[] {
    const clearedCount = (trial.dailyClearedLevels || []).length
    return DAILY_TRIAL_MILESTONES.filter(m =>
      clearedCount >= m.requiredClearedLevels && !(trial.dailyMilestoneClaimed || []).includes(m.id)
    )
  }

  getAllMilestones(): DailyTrialMilestone[] {
    return DAILY_TRIAL_MILESTONES
  }

  claimMilestoneReward(save: GameSave, milestoneId: number): { success: boolean; message: string; rewards: DailyTrialReward[] } {
    const trial = save.dailyTrial
    const milestone = DAILY_TRIAL_MILESTONES.find(m => m.id === milestoneId)

    if (!milestone) {
      return { success: false, message: '里程碑不存在！', rewards: [] }
    }

    const clearedCount = (trial.dailyClearedLevels || []).length
    if (clearedCount < milestone.requiredClearedLevels) {
      return { success: false, message: `需通关 ${milestone.requiredClearedLevels} 个不同关卡才能领取！`, rewards: [] }
    }

    if ((trial.dailyMilestoneClaimed || []).includes(milestoneId)) {
      return { success: false, message: '奖励已领取！', rewards: [] }
    }

    milestone.rewards.forEach(reward => {
      this.applyRewardToSave(save, reward)
    })

    if (!trial.dailyMilestoneClaimed) trial.dailyMilestoneClaimed = []
    trial.dailyMilestoneClaimed.push(milestoneId)

    return { success: true, message: `领取里程碑奖励：${milestone.label}！`, rewards: milestone.rewards }
  }

  getDailySummary(trial: DailyTrialProgress): {
    clearedCount: number
    goldEarned: number
    spiritEarned: number
    expEarned: number
    streakDays: number
    streakBonus: number
    remainingMilestones: DailyTrialMilestone[]
  } {
    this.checkDailyReset(trial)
    return {
      clearedCount: (trial.dailyClearedLevels || []).length,
      goldEarned: trial.dailyGoldEarned || 0,
      spiritEarned: trial.dailySpiritEarned || 0,
      expEarned: trial.dailyExpEarned || 0,
      streakDays: trial.consecutiveDays || 0,
      streakBonus: this.getStreakBonus(trial),
      remainingMilestones: this.getAvailableMilestones(trial)
    }
  }

  getDifficultyLabel(difficulty: string): { label: string; color: string } {
    switch (difficulty) {
      case 'easy':
        return { label: '简单', color: '#81c784' }
      case 'normal':
        return { label: '普通', color: '#ffd54f' }
      case 'hard':
        return { label: '困难', color: '#ff7043' }
      case 'extreme':
        return { label: '极难', color: '#ef5350' }
      default:
        return { label: '未知', color: '#90a4ae' }
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  getRewardSummary(level: DailyTrialLevel, trial: DailyTrialProgress): { gold: number; spirit: number; exp: number; extras: DailyTrialReward[]; isFirstClear: boolean; streakBonus: number } {
    const isFirstClear = !trial.claimedLevelRewards.includes(level.id)
    const streakBonus = this.getStreakBonus(trial)
    let multiplier = isFirstClear ? DAILY_TRIAL_CONFIG.FIRST_CLEAR_BONUS : 1
    multiplier *= (1 + streakBonus)

    let gold = 0
    let spirit = 0
    let exp = 0
    const extras: DailyTrialReward[] = []

    level.rewards.forEach(reward => {
      const scaled = Math.floor(reward.value * multiplier)
      switch (reward.type) {
        case 'gold':
          gold = scaled
          break
        case 'spirit':
          spirit = scaled
          break
        case 'exp':
          exp = scaled
          break
        default:
          extras.push({ ...reward, value: scaled })
      }
    })

    return { gold, spirit, exp, extras, isFirstClear, streakBonus }
  }
}
