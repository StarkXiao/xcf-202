import type { GameSave, ChapterProgress, Chapter, ChapterLevel, ChapterReward, ChapterReviewData, ChapterDialogueNode, SweepResult, ChapterSweepResult } from '../types'
import { CHAPTERS, getChapterById, getChapterByNumber, getNextChapter, getDialogueNodeById, getLevelById } from '../data/chapterData'
import { SaveManager } from './SaveManager'

export class ChapterManager {
  private static instance: ChapterManager

  static getInstance(): ChapterManager {
    if (!ChapterManager.instance) {
      ChapterManager.instance = new ChapterManager()
    }
    return ChapterManager.instance
  }

  createInitialChapterProgress(): ChapterProgress {
    return {
      currentChapterId: 'chapter_1',
      highestChapterId: 'chapter_1',
      completedChapterIds: [],
      completedLevelIds: [],
      claimedRewards: [],
      triggeredDialogueNodeIds: [],
      chapterStates: {}
    }
  }

  validateChapterProgress(chapter: any): ChapterProgress {
    const defaults = this.createInitialChapterProgress()
    if (!chapter) {
      return defaults
    }
    
    const validatedStates: Record<string, any> = {}
    if (chapter.chapterStates) {
      Object.keys(chapter.chapterStates).forEach(key => {
        const state = chapter.chapterStates[key]
        validatedStates[key] = {
          status: state.status || 'locked',
          currentLevelIndex: state.currentLevelIndex || 0,
          completedLevelIds: state.completedLevelIds || [],
          collectedRewards: state.collectedRewards || []
        }
      })
    }
    
    return {
      ...defaults,
      ...chapter,
      chapterStates: validatedStates,
      completedChapterIds: chapter.completedChapterIds || [],
      completedLevelIds: chapter.completedLevelIds || [],
      claimedRewards: chapter.claimedRewards || [],
      triggeredDialogueNodeIds: chapter.triggeredDialogueNodeIds || []
    }
  }

  initializeChapterProgress(save: GameSave): void {
    if (!save.chapter) {
      save.chapter = this.createInitialChapterProgress()
    }
    save.chapter = this.validateChapterProgress(save.chapter)
    
    CHAPTERS.forEach(chapter => {
      if (!save.chapter!.chapterStates[chapter.id]) {
        save.chapter!.chapterStates[chapter.id] = {
          status: this.isChapterUnlocked(save, chapter.id) ? 'unlocked' : 'locked',
          currentLevelIndex: 0,
          completedLevelIds: [],
          collectedRewards: []
        }
      } else if (!save.chapter!.chapterStates[chapter.id].collectedRewards) {
        save.chapter!.chapterStates[chapter.id].collectedRewards = []
      }
    })
    
    this.updateChapterUnlocks(save)
  }

  isChapterUnlocked(save: GameSave, chapterId: string): boolean {
    const chapter = getChapterById(chapterId)
    if (!chapter) return false
    
    const state = save.chapter?.chapterStates[chapterId]
    if (state?.status === 'unlocked' || state?.status === 'in_progress' || state?.status === 'completed') {
      return true
    }
    
    const req = chapter.unlockRequirement
    switch (req.type) {
      case 'stage':
        return save.highestStage >= req.value
      case 'level':
        return save.player.level >= req.value
      case 'chapter':
        const prevChapter = getChapterByNumber(req.value)
        return prevChapter ? this.isChapterCompleted(save, prevChapter.id) : false
      default:
        return false
    }
  }

  isChapterCompleted(save: GameSave, chapterId: string): boolean {
    return save.chapter?.completedChapterIds.includes(chapterId) || false
  }

  isLevelUnlocked(save: GameSave, chapterId: string, levelId: string): boolean {
    const chapter = getChapterById(chapterId)
    if (!chapter) return false
    
    const levelIndex = chapter.levels.findIndex(l => l.id === levelId)
    if (levelIndex === -1) return false
    
    const state = save.chapter?.chapterStates[chapterId]
    if (!state) return false
    
    if (levelIndex === 0) {
      return this.isChapterUnlocked(save, chapterId)
    }
    
    const prevLevel = chapter.levels[levelIndex - 1]
    return state.completedLevelIds.includes(prevLevel.id)
  }

  isLevelCompleted(save: GameSave, levelId: string): boolean {
    return save.chapter?.completedLevelIds.includes(levelId) || false
  }

  getChapterState(save: GameSave, chapterId: string) {
    if (!save.chapter?.chapterStates[chapterId]) {
      return {
        status: 'locked' as const,
        currentLevelIndex: 0,
        completedLevelIds: []
      }
    }
    return save.chapter.chapterStates[chapterId]
  }

  getCurrentLevel(save: GameSave, chapterId: string): ChapterLevel | null {
    const chapter = getChapterById(chapterId)
    if (!chapter) return null
    
    const state = this.getChapterState(save, chapterId)
    const levelIndex = Math.min(state.currentLevelIndex, chapter.levels.length - 1)
    
    return chapter.levels[levelIndex] || null
  }

  getNextLevel(save: GameSave, chapterId: string): ChapterLevel | null {
    const chapter = getChapterById(chapterId)
    if (!chapter) return null
    
    const state = this.getChapterState(save, chapterId)
    const nextIndex = state.currentLevelIndex + 1
    
    if (nextIndex >= chapter.levels.length) {
      return null
    }
    
    return chapter.levels[nextIndex] || null
  }

  updateChapterUnlocks(save: GameSave): void {
    if (!save.chapter) return
    
    CHAPTERS.forEach(chapter => {
      const state = save.chapter!.chapterStates[chapter.id]
      if (!state) return
      
      if (state.status === 'locked' && this.isChapterUnlocked(save, chapter.id)) {
        state.status = 'unlocked'
      }
    })
  }

  startChapter(save: GameSave, chapterId: string): boolean {
    if (!this.isChapterUnlocked(save, chapterId)) {
      return false
    }
    
    if (!save.chapter) {
      save.chapter = this.createInitialChapterProgress()
    }
    
    const state = save.chapter.chapterStates[chapterId]
    if (state) {
      state.status = 'in_progress'
      state.currentLevelIndex = state.currentLevelIndex || 0
    }
    
    save.chapter.currentChapterId = chapterId
    
    const chapter = getChapterById(chapterId)
    if (chapter && chapter.chapterNumber > (getChapterById(save.chapter.highestChapterId || '')?.chapterNumber || 0)) {
      save.chapter.highestChapterId = chapterId
    }
    
    return true
  }

  completeLevel(save: GameSave, chapterId: string, levelId: string, skipChapterCompletion: boolean = false): ChapterReward[] {
    const chapter = getChapterById(chapterId)
    if (!chapter) return []
    
    const level = chapter.levels.find(l => l.id === levelId)
    if (!level) return []
    
    if (!save.chapter) {
      save.chapter = this.createInitialChapterProgress()
    }
    
    const state = save.chapter.chapterStates[chapterId]
    if (!state) return []
    
    if (!save.chapter.completedLevelIds.includes(levelId)) {
      save.chapter.completedLevelIds.push(levelId)
    }
    
    if (!state.completedLevelIds.includes(levelId)) {
      state.completedLevelIds.push(levelId)
    }
    
    const nextLevel = this.getNextLevel(save, chapterId)
    if (nextLevel) {
      state.currentLevelIndex++
    }
    
    const rewards = this.applyLevelRewards(save, level)
    
    const isLastLevel = state.completedLevelIds.length >= chapter.levels.length
    
    if (isLastLevel && !skipChapterCompletion) {
      state.status = 'completed'
      if (!save.chapter.completedChapterIds.includes(chapterId)) {
        save.chapter.completedChapterIds.push(chapterId)
      }
      
      const completionRewards = this.applyChapterCompletionRewards(save, chapter)
      rewards.push(...completionRewards)
      
      const nextChapter = getNextChapter(chapterId)
      if (nextChapter) {
        const nextState = save.chapter.chapterStates[nextChapter.id]
        if (nextState && nextState.status === 'locked') {
          nextState.status = 'unlocked'
        }
      }
    }
    
    SaveManager.getInstance().saveGame(save)
    
    return rewards
  }

  completeChapter(save: GameSave, chapterId: string): ChapterReward[] {
    const chapter = getChapterById(chapterId)
    if (!chapter) return []
    
    if (!save.chapter) return []
    
    const state = save.chapter.chapterStates[chapterId]
    if (!state) return []
    
    const isLastLevel = state.completedLevelIds.length >= chapter.levels.length
    if (!isLastLevel) return []
    
    state.status = 'completed'
    if (!save.chapter.completedChapterIds.includes(chapterId)) {
      save.chapter.completedChapterIds.push(chapterId)
    }
    
    const rewards = this.applyChapterCompletionRewards(save, chapter)
    
    const nextChapter = getNextChapter(chapterId)
    if (nextChapter) {
      const nextState = save.chapter.chapterStates[nextChapter.id]
      if (nextState && nextState.status === 'locked') {
        nextState.status = 'unlocked'
      }
    }
    
    SaveManager.getInstance().saveGame(save)
    
    return rewards
  }

  private applyLevelRewards(save: GameSave, level: ChapterLevel): ChapterReward[] {
    const rewards: ChapterReward[] = []
    
    level.rewards.forEach(reward => {
      const applied = this.applyReward(save, reward)
      if (applied) {
        rewards.push(applied)
      }
    })
    
    return rewards
  }

  private applyChapterCompletionRewards(save: GameSave, chapter: Chapter): ChapterReward[] {
    const rewards: ChapterReward[] = []
    
    chapter.completionRewards.forEach(reward => {
      const rewardKey = `${chapter.id}_completion`
      if (!save.chapter!.claimedRewards.includes(rewardKey)) {
        const applied = this.applyReward(save, reward)
        if (applied) {
          rewards.push(applied)
          save.chapter!.claimedRewards.push(rewardKey)
        }
      }
    })
    
    return rewards
  }

  private applyReward(save: GameSave, reward: ChapterReward): ChapterReward | null {
    switch (reward.type) {
      case 'gold':
        save.player.gold += reward.value
        break
      case 'spirit':
        save.player.spirit += reward.value
        break
      case 'exp':
        SaveManager.getInstance().addExp(save.player, reward.value)
        break
      case 'attack':
        save.player.attack += reward.value
        break
      case 'defense':
        save.player.defense += reward.value
        break
      case 'maxHealth':
        save.player.maxHealth += reward.value
        save.player.health = Math.min(save.player.health + reward.value, save.player.maxHealth)
        break
      case 'maxMana':
        save.player.maxMana += reward.value
        save.player.mana = Math.min(save.player.mana + reward.value, save.player.maxMana)
        break
      default:
        return null
    }
    
    return { ...reward }
  }

  getAvailableChapters(save: GameSave): Chapter[] {
    return CHAPTERS.filter(ch => this.isChapterUnlocked(save, ch.id))
  }

  getChapterProgress(save: GameSave, chapterId: string): { completed: number; total: number; percentage: number } {
    const chapter = getChapterById(chapterId)
    if (!chapter) return { completed: 0, total: 0, percentage: 0 }
    
    const state = this.getChapterState(save, chapterId)
    const completed = state.completedLevelIds.length
    const total = chapter.levels.length
    
    return {
      completed,
      total,
      percentage: Math.floor((completed / total) * 100)
    }
  }

  getChapterWithState(save: GameSave, chapterId: string): (Chapter & { state: ReturnType<ChapterManager['getChapterState']>; progress: ReturnType<ChapterManager['getChapterProgress']> }) | null {
    const chapter = getChapterById(chapterId)
    if (!chapter) return null
    
    const state = this.getChapterState(save, chapterId)
    const progress = this.getChapterProgress(save, chapterId)
    
    const levelsWithState = chapter.levels.map(level => ({
      ...level,
      isUnlocked: this.isLevelUnlocked(save, chapterId, level.id),
      isCompleted: this.isLevelCompleted(save, level.id)
    }))
    
    return {
      ...chapter,
      levels: levelsWithState,
      state,
      progress
    }
  }

  shouldShowOpeningStory(save: GameSave, chapterId: string): boolean {
    const state = this.getChapterState(save, chapterId)
    return state.status === 'unlocked' && state.currentLevelIndex === 0 && state.completedLevelIds.length === 0
  }

  shouldShowClosingStory(save: GameSave, chapterId: string): boolean {
    const state = this.getChapterState(save, chapterId)
    const chapter = getChapterById(chapterId)
    if (!chapter) return false
    const rewardKey = `${chapterId}_completion`
    const allLevelsCompleted = state.completedLevelIds.length >= chapter.levels.length
    const hasClosingStory = chapter.closingStory && chapter.closingStory.length > 0
    const closingStoryNotPlayed = !save.chapter?.claimedRewards.includes(rewardKey)
    return allLevelsCompleted && hasClosingStory && closingStoryNotPlayed && state.status !== 'completed'
  }

  createChapterReviewData(save: GameSave, chapterId: string, actualRewards?: ChapterReward[]): ChapterReviewData | null {
    const chapter = getChapterById(chapterId)
    if (!chapter) return null
    
    const state = this.getChapterState(save, chapterId)
    if (state.status !== 'completed') return null
    
    const progress = this.getChapterProgress(save, chapterId)
    const rewardKey = `${chapterId}_completion`
    const reviewKey = `${chapterId}_review`
    
    let rewards = actualRewards || chapter.completionRewards
    if (!actualRewards && save.chapter?.claimedRewards.includes(rewardKey)) {
      if (save.chapter.chapterStates[chapterId]?.collectedRewards) {
        rewards = save.chapter.chapterStates[chapterId].collectedRewards
      }
    }
    
    if (actualRewards && save.chapter?.chapterStates[chapterId]) {
      if (!save.chapter.chapterStates[chapterId].collectedRewards) {
        save.chapter.chapterStates[chapterId].collectedRewards = []
      }
      save.chapter.chapterStates[chapterId].collectedRewards = actualRewards
      if (!save.chapter.claimedRewards.includes(reviewKey)) {
        save.chapter.claimedRewards.push(reviewKey)
      }
      SaveManager.getInstance().saveGame(save)
    }
    
    return {
      chapterId,
      chapterName: chapter.name,
      completedAt: Date.now(),
      totalTime: 0,
      levelsCompleted: progress.completed,
      totalLevels: progress.total,
      rewards: rewards,
      battleStats: {
        totalDamage: 0,
        totalHealing: 0,
        enemiesDefeated: chapter.levels.filter(l => l.type === 'battle' || l.type === 'boss').length * 2,
        deaths: 0
      }
    }
  }

  getLevelTypeLabel(type: ChapterLevel['type']): string {
    const labels: Record<ChapterLevel['type'], string> = {
      battle: '⚔ 战斗',
      story: '📖 剧情',
      boss: '👑 BOSS'
    }
    return labels[type]
  }

  getRewardLabel(reward: ChapterReward): string {
    const labels: Record<ChapterReward['type'], string> = {
      gold: '💰 金币',
      spirit: '✨ 灵气',
      exp: '📚 经验',
      attack: '⚔ 攻击',
      defense: '🛡 防御',
      maxHealth: '❤ 生命上限',
      maxMana: '💧 法力上限',
      skill: '📖 技能',
      treasure: '💎 宝物'
    }
    return `${labels[reward.type]} +${reward.value}`
  }

  getDialogueNodeById(chapterId: string, nodeId: string): ChapterDialogueNode | undefined {
    return getDialogueNodeById(chapterId, nodeId)
  }

  isDialogueNodeTriggered(save: GameSave, nodeId: string): boolean {
    return save.chapter?.triggeredDialogueNodeIds?.includes(nodeId) || false
  }

  shouldTriggerVictoryDialogue(save: GameSave, chapterId: string, levelId: string): ChapterDialogueNode | null {
    const level = getLevelById(chapterId, levelId)
    if (!level || !level.victoryDialogueNodeId) return null
    
    if (this.isDialogueNodeTriggered(save, level.victoryDialogueNodeId)) return null
    
    return this.getDialogueNodeById(chapterId, level.victoryDialogueNodeId) || null
  }

  markDialogueNodeTriggered(save: GameSave, nodeId: string): void {
    if (!save.chapter) return
    if (!save.chapter.triggeredDialogueNodeIds) {
      save.chapter.triggeredDialogueNodeIds = []
    }
    if (!save.chapter.triggeredDialogueNodeIds.includes(nodeId)) {
      save.chapter.triggeredDialogueNodeIds.push(nodeId)
      SaveManager.getInstance().saveGame(save)
    }
  }

  applyDialogueNodeRewards(save: GameSave, node: ChapterDialogueNode): ChapterReward[] {
    if (!node.rewards || node.rewards.length === 0) return []
    const rewards: ChapterReward[] = []
    
    node.rewards.forEach(reward => {
      const applied = this.applyReward(save, reward)
      if (applied) {
        rewards.push(applied)
      }
    })
    
    SaveManager.getInstance().saveGame(save)
    return rewards
  }

  getVictoryDialogueNodeForLevel(save: GameSave, chapterId: string, levelId: string): ChapterDialogueNode | null {
    return this.shouldTriggerVictoryDialogue(save, chapterId, levelId)
  }

  canSweepLevel(save: GameSave, chapterId: string, levelId: string): boolean {
    if (!this.isLevelCompleted(save, levelId)) {
      return false
    }
    const chapter = getChapterById(chapterId)
    if (!chapter) return false
    const level = chapter.levels.find(l => l.id === levelId)
    if (!level) return false
    if (save.player.level < level.requiredLevel) {
      return false
    }
    return true
  }

  canSweepChapter(save: GameSave, chapterId: string): boolean {
    return this.isChapterCompleted(save, chapterId)
  }

  sweepLevel(save: GameSave, chapterId: string, levelId: string, autoSave: boolean = true): SweepResult {
    if (!this.canSweepLevel(save, chapterId, levelId)) {
      return {
        success: false,
        levelId,
        levelName: '',
        rewards: [],
        leveledUp: false,
        levelsGained: 0,
        message: '未满足扫荡条件（需先通关且达到等级要求）'
      }
    }

    const chapter = getChapterById(chapterId)
    if (!chapter) {
      return {
        success: false,
        levelId,
        levelName: '',
        rewards: [],
        leveledUp: false,
        levelsGained: 0,
        message: '章节不存在'
      }
    }

    const level = chapter.levels.find(l => l.id === levelId)
    if (!level) {
      return {
        success: false,
        levelId,
        levelName: '',
        rewards: [],
        leveledUp: false,
        levelsGained: 0,
        message: '关卡不存在'
      }
    }

    const rewards: ChapterReward[] = []
    const previousLevel = save.player.level

    level.rewards.forEach(reward => {
      const applied = this.applyReward(save, reward)
      if (applied) {
        rewards.push(applied)
      }
    })

    const leveledUp = save.player.level > previousLevel
    const levelsGained = save.player.level - previousLevel

    SaveManager.getInstance().recalcPlayerStatsFromSave(save)

    if (leveledUp) {
      save.player.health = save.player.maxHealth
      save.player.mana = save.player.maxMana
    }

    if (autoSave) {
      SaveManager.getInstance().saveGame(save)
    }

    return {
      success: true,
      levelId,
      levelName: level.name,
      rewards,
      leveledUp,
      levelsGained
    }
  }

  sweepChapter(save: GameSave, chapterId: string): ChapterSweepResult {
    if (!this.canSweepChapter(save, chapterId)) {
      return {
        success: false,
        chapterId,
        chapterName: '',
        totalRewards: [],
        sweepCount: 0,
        leveledUp: false,
        levelsGained: 0,
        sweepResults: []
      }
    }

    const chapter = getChapterById(chapterId)
    if (!chapter) {
      return {
        success: false,
        chapterId,
        chapterName: '',
        totalRewards: [],
        sweepCount: 0,
        leveledUp: false,
        levelsGained: 0,
        sweepResults: []
      }
    }

    const sweepResults: SweepResult[] = []
    const totalRewardsMap = new Map<string, number>()
    let sweepCount = 0
    const previousLevel = save.player.level

    chapter.levels.forEach(level => {
      if (this.canSweepLevel(save, chapterId, level.id)) {
        const result = this.sweepLevel(save, chapterId, level.id, false)
        if (result.success) {
          sweepResults.push(result)
          sweepCount++

          result.rewards.forEach(reward => {
            const key = reward.type
            const current = totalRewardsMap.get(key) || 0
            totalRewardsMap.set(key, current + reward.value)
          })
        }
      }
    })

    const totalRewards: ChapterReward[] = []
    totalRewardsMap.forEach((value, type) => {
      totalRewards.push({
        type: type as ChapterReward['type'],
        value
      })
    })

    const totalLeveledUp = save.player.level > previousLevel
    const totalLevelsGained = save.player.level - previousLevel

    SaveManager.getInstance().saveGame(save)

    return {
      success: true,
      chapterId,
      chapterName: chapter.name,
      totalRewards,
      sweepCount,
      leveledUp: totalLeveledUp,
      levelsGained: totalLevelsGained,
      sweepResults
    }
  }

  sweepChapterMultipleTimes(save: GameSave, chapterId: string, times: number): ChapterSweepResult {
    if (!this.canSweepChapter(save, chapterId)) {
      return {
        success: false,
        chapterId,
        chapterName: '',
        totalRewards: [],
        sweepCount: 0,
        leveledUp: false,
        levelsGained: 0,
        sweepResults: []
      }
    }

    const chapter = getChapterById(chapterId)
    if (!chapter) {
      return {
        success: false,
        chapterId,
        chapterName: '',
        totalRewards: [],
        sweepCount: 0,
        leveledUp: false,
        levelsGained: 0,
        sweepResults: []
      }
    }

    const sweepResults: SweepResult[] = []
    const totalRewardsMap = new Map<string, number>()
    let totalSweepCount = 0
    const previousLevel = save.player.level

    for (let t = 0; t < times; t++) {
      chapter.levels.forEach(level => {
        if (this.canSweepLevel(save, chapterId, level.id)) {
          const result = this.sweepLevel(save, chapterId, level.id, false)
          if (result.success) {
            sweepResults.push(result)
            totalSweepCount++

            result.rewards.forEach(reward => {
              const key = reward.type
              const current = totalRewardsMap.get(key) || 0
              totalRewardsMap.set(key, current + reward.value)
            })
          }
        }
      })
    }

    const totalRewards: ChapterReward[] = []
    totalRewardsMap.forEach((value, type) => {
      totalRewards.push({
        type: type as ChapterReward['type'],
        value
      })
    })

    const totalLeveledUp = save.player.level > previousLevel
    const totalLevelsGained = save.player.level - previousLevel

    SaveManager.getInstance().saveGame(save)

    return {
      success: true,
      chapterId,
      chapterName: chapter.name,
      totalRewards,
      sweepCount: totalSweepCount,
      leveledUp: totalLeveledUp,
      levelsGained: totalLevelsGained,
      sweepResults
    }
  }
}
