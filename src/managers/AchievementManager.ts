import type { GameSave, AchievementData, Achievement, MonsterEntry, TreasureEntry, StoryEntry, AchievementProgressUpdate, AchievementReward, AchievementBonus } from '../types'
import { ACHIEVEMENTS, MONSTER_TEMPLATES, TREASURE_TEMPLATES, STORY_TEMPLATES } from '../data/achievementData'
import { SaveManager } from './SaveManager'

export class AchievementManager {
  private static instance: AchievementManager
  private saveManager: SaveManager

  static getInstance(): AchievementManager {
    if (!AchievementManager.instance) {
      AchievementManager.instance = new AchievementManager()
    }
    return AchievementManager.instance
  }

  private constructor() {
    this.saveManager = SaveManager.getInstance()
  }

  createInitialAchievementData(): AchievementData {
    return {
      achievements: ACHIEVEMENTS.map(a => ({
        ...a,
        progress: 0,
        status: 'locked' as const,
        unlockedAt: null,
        claimedAt: null
      })),
      monsters: MONSTER_TEMPLATES.map(m => ({
        ...m,
        defeatCount: 0,
        firstDefeatAt: null,
        isDiscovered: false
      })),
      treasures: TREASURE_TEMPLATES.map(t => ({
        ...t,
        isCollected: false,
        collectedAt: null
      })),
      stories: STORY_TEMPLATES.map(s => ({
        ...s,
        isCompleted: false,
        completedAt: null,
        isDiscovered: false
      })),
      totalMonstersDefeated: 0,
      totalTreasuresCollected: 0,
      totalStoriesCompleted: 0,
      totalAchievementsUnlocked: 0,
      totalRewardsClaimed: 0,
      permanentBonus: {
        attack: 0,
        defense: 0,
        maxHealth: 0,
        maxMana: 0
      },
      lastAchievementCheck: Date.now()
    }
  }

  validateAchievementData(achievement: any): AchievementData {
    const defaults = this.createInitialAchievementData()
    if (!achievement) {
      return defaults
    }

    const validatedAchievements = defaults.achievements.map(defaultAch => {
      const existing = achievement.achievements?.find((a: any) => a.id === defaultAch.id)
      if (existing) {
        return {
          ...defaultAch,
          progress: existing.progress || 0,
          status: existing.status || 'locked',
          unlockedAt: existing.unlockedAt || null,
          claimedAt: existing.claimedAt || null
        }
      }
      return defaultAch
    })

    const validatedMonsters = defaults.monsters.map(defaultMonster => {
      const existing = achievement.monsters?.find((m: any) => m.id === defaultMonster.id)
      if (existing) {
        return {
          ...defaultMonster,
          defeatCount: existing.defeatCount || 0,
          firstDefeatAt: existing.firstDefeatAt || null,
          isDiscovered: existing.isDiscovered || false
        }
      }
      return defaultMonster
    })

    const validatedTreasures = defaults.treasures.map(defaultTreasure => {
      const existing = achievement.treasures?.find((t: any) => t.id === defaultTreasure.id)
      if (existing) {
        return {
          ...defaultTreasure,
          isCollected: existing.isCollected || false,
          collectedAt: existing.collectedAt || null
        }
      }
      return defaultTreasure
    })

    const validatedStories = defaults.stories.map(defaultStory => {
      const existing = achievement.stories?.find((s: any) => s.id === defaultStory.id)
      if (existing) {
        return {
          ...defaultStory,
          isCompleted: existing.isCompleted || false,
          completedAt: existing.completedAt || null,
          isDiscovered: existing.isDiscovered || false
        }
      }
      return defaultStory
    })

    return {
      achievements: validatedAchievements,
      monsters: validatedMonsters,
      treasures: validatedTreasures,
      stories: validatedStories,
      totalMonstersDefeated: achievement.totalMonstersDefeated || 0,
      totalTreasuresCollected: achievement.totalTreasuresCollected || 0,
      totalStoriesCompleted: achievement.totalStoriesCompleted || 0,
      totalAchievementsUnlocked: achievement.totalAchievementsUnlocked || 0,
      totalRewardsClaimed: achievement.totalRewardsClaimed || 0,
      permanentBonus: {
        attack: achievement.permanentBonus?.attack || 0,
        defense: achievement.permanentBonus?.defense || 0,
        maxHealth: achievement.permanentBonus?.maxHealth || 0,
        maxMana: achievement.permanentBonus?.maxMana || 0
      },
      lastAchievementCheck: achievement.lastAchievementCheck || Date.now()
    }
  }

  updateProgress(save: GameSave, update: AchievementProgressUpdate): { unlockedAchievements: Achievement[] } {
    const achievementData = save.achievement
    const unlockedAchievements: Achievement[] = []

    switch (update.type) {
      case 'monster_defeat':
        this.handleMonsterDefeat(achievementData, update.id!, update.stageId!)
        this.updateBattleAchievements(achievementData, unlockedAchievements)
        this.updateCollectionAchievements(achievementData, unlockedAchievements)
        break
      case 'treasure_collect':
        this.handleTreasureCollect(achievementData, update.id!)
        this.updateCollectionAchievements(achievementData, unlockedAchievements)
        break
      case 'story_complete':
        this.handleStoryComplete(achievementData, update.id!)
        this.updateStoryAchievements(achievementData, unlockedAchievements)
        break
      case 'stage_clear':
        this.handleStageClear(achievementData, update.stageId!)
        this.updateExplorationAchievements(achievementData, unlockedAchievements, update.stageId!)
        break
      case 'gold_spent':
        this.updateGoldSpentAchievements(achievementData, unlockedAchievements, update.value)
        break
      case 'spirit_spent':
        this.updateSpiritSpentAchievements(achievementData, unlockedAchievements, update.value)
        break
    }

    achievementData.lastAchievementCheck = Date.now()
    this.saveManager.saveGame(save)

    return { unlockedAchievements }
  }

  private handleMonsterDefeat(data: AchievementData, monsterId: string, stageId: number): void {
    const monster = data.monsters.find(m => m.id === monsterId)
    if (monster) {
      if (!monster.isDiscovered) {
        monster.isDiscovered = true
      }
      monster.defeatCount++
      if (monster.firstDefeatAt === null) {
        monster.firstDefeatAt = Date.now()
      }
      data.totalMonstersDefeated++
    }
  }

  private handleTreasureCollect(data: AchievementData, treasureId: string, treasureInfo?: Partial<TreasureEntry>): void {
    let treasure = data.treasures.find(t => t.id === treasureId)
    if (!treasure) {
      const template = TREASURE_TEMPLATES.find(t => t.id === treasureId)
      if (template) {
        treasure = {
          ...template,
          isCollected: false,
          collectedAt: null
        }
        data.treasures.push(treasure)
      } else if (treasureInfo) {
        treasure = {
          id: treasureId,
          name: treasureInfo.name || '未知法宝',
          description: treasureInfo.description || '',
          icon: treasureInfo.icon || '💎',
          color: treasureInfo.color || 0x9e9e9e,
          rarity: treasureInfo.rarity || 'common',
          maxLevel: treasureInfo.maxLevel || 10,
          isCollected: false,
          collectedAt: null
        }
        data.treasures.push(treasure)
      } else {
        return
      }
    }
    if (treasure && !treasure.isCollected) {
      treasure.isCollected = true
      treasure.collectedAt = Date.now()
      data.totalTreasuresCollected++
    }
  }

  private handleStoryComplete(data: AchievementData, storyId: string): void {
    const story = data.stories.find(s => s.id === storyId)
    if (story && !story.isCompleted) {
      story.isCompleted = true
      story.completedAt = Date.now()
      if (!story.isDiscovered) {
        story.isDiscovered = true
      }
      data.totalStoriesCompleted++
    }
  }

  private handleStageClear(data: AchievementData, stageId: number): void {
    data.stories.forEach(story => {
      if (story.requiredStage <= stageId && !story.isDiscovered) {
        story.isDiscovered = true
      }
    })

    data.monsters.forEach(monster => {
      if (monster.stage <= stageId) {
        monster.isDiscovered = true
      }
    })
  }

  private updateBattleAchievements(data: AchievementData, unlocked: Achievement[]): void {
    const battleAchievements = data.achievements.filter(a => a.category === 'battle' && a.status === 'locked')
    battleAchievements.forEach(achievement => {
      if (achievement.id === 'first_blood') {
        achievement.progress = data.totalMonstersDefeated > 0 ? 1 : 0
      } else if (achievement.id.startsWith('monster_hunter_')) {
        achievement.progress = data.totalMonstersDefeated
      }
      this.checkUnlock(achievement, unlocked, data)
    })
  }

  private updateCollectionAchievements(data: AchievementData, unlocked: Achievement[]): void {
    const collectionAchievements = data.achievements.filter(a => a.category === 'collection' && a.status === 'locked')
    const discoveredMonsters = data.monsters.filter(m => m.isDiscovered).length
    const collectedTreasures = data.treasures.filter(t => t.isCollected).length

    collectionAchievements.forEach(achievement => {
      if (achievement.id.startsWith('treasure_collector_') || achievement.id === 'treasure_master') {
        achievement.progress = collectedTreasures
      } else if (achievement.id.startsWith('monster_pedia_')) {
        achievement.progress = discoveredMonsters
      }
      this.checkUnlock(achievement, unlocked, data)
    })
  }

  private updateStoryAchievements(data: AchievementData, unlocked: Achievement[]): void {
    const storyAchievements = data.achievements.filter(a => a.category === 'story' && a.status === 'locked')
    storyAchievements.forEach(achievement => {
      achievement.progress = data.totalStoriesCompleted
      this.checkUnlock(achievement, unlocked, data)
    })
  }

  private updateExplorationAchievements(data: AchievementData, unlocked: Achievement[], stageId: number): void {
    const explorationAchievements = data.achievements.filter(a => a.category === 'exploration' && a.status === 'locked')
    explorationAchievements.forEach(achievement => {
      if (achievement.requirementStage && stageId >= achievement.requirementStage) {
        achievement.progress = 1
        this.checkUnlock(achievement, unlocked, data)
      }
    })
  }

  private updateGoldSpentAchievements(data: AchievementData, unlocked: Achievement[], amount: number): void {
    const goldAchievements = data.achievements.filter(a => a.id.startsWith('gold_spent_') && a.status === 'locked')
    goldAchievements.forEach(achievement => {
      achievement.progress += amount
      this.checkUnlock(achievement, unlocked, data)
    })
  }

  private updateSpiritSpentAchievements(data: AchievementData, unlocked: Achievement[], amount: number): void {
    const spiritAchievements = data.achievements.filter(a => a.id.startsWith('spirit_spent_') && a.status === 'locked')
    spiritAchievements.forEach(achievement => {
      achievement.progress += amount
      this.checkUnlock(achievement, unlocked, data)
    })
  }

  private checkUnlock(achievement: Achievement, unlocked: Achievement[], data: AchievementData): void {
    if (achievement.status === 'locked' && achievement.progress >= achievement.target) {
      achievement.status = 'unlocked'
      achievement.unlockedAt = Date.now()
      data.totalAchievementsUnlocked++
      unlocked.push({ ...achievement })
    }
  }

  claimReward(save: GameSave, achievementId: string): { success: boolean; rewards: AchievementReward[]; message: string } {
    const achievement = save.achievement.achievements.find(a => a.id === achievementId)
    if (!achievement) {
      return { success: false, rewards: [], message: '成就不存在' }
    }
    if (achievement.status === 'locked') {
      return { success: false, rewards: [], message: '成就尚未解锁' }
    }
    if (achievement.status === 'claimed') {
      return { success: false, rewards: [], message: '奖励已领取' }
    }

    achievement.status = 'claimed'
    achievement.claimedAt = Date.now()
    save.achievement.totalRewardsClaimed++

    let healthGain = 0
    let manaGain = 0

    achievement.rewards.forEach(reward => {
      switch (reward.type) {
        case 'gold':
          save.player.gold += reward.value
          break
        case 'spirit':
          save.player.spirit += reward.value
          break
        case 'exp':
          this.saveManager.addExp(save.player, reward.value)
          break
        case 'attack':
          save.achievement.permanentBonus.attack += reward.value
          break
        case 'defense':
          save.achievement.permanentBonus.defense += reward.value
          break
        case 'maxHealth':
          save.achievement.permanentBonus.maxHealth += reward.value
          healthGain += reward.value
          break
        case 'maxMana':
          save.achievement.permanentBonus.maxMana += reward.value
          manaGain += reward.value
          break
      }
    })

    this.saveManager.recalcPlayerStatsFromSave(save)

    if (healthGain > 0) {
      save.player.health = Math.min(save.player.health + healthGain, save.player.maxHealth)
    }
    if (manaGain > 0) {
      save.player.mana = Math.min(save.player.mana + manaGain, save.player.maxMana)
    }

    this.saveManager.saveGame(save)

    return { success: true, rewards: achievement.rewards, message: '奖励领取成功' }
  }

  claimAllRewards(save: GameSave): { success: boolean; totalRewards: AchievementReward[]; message: string } {
    const unlockedAchievements = save.achievement.achievements.filter(a => a.status === 'unlocked')
    const totalRewards: AchievementReward[] = []
    let claimedCount = 0

    unlockedAchievements.forEach(achievement => {
      const result = this.claimReward(save, achievement.id)
      if (result.success) {
        totalRewards.push(...result.rewards)
        claimedCount++
      }
    })

    if (claimedCount > 0) {
      return { success: true, totalRewards, message: `成功领取 ${claimedCount} 个成就奖励` }
    } else {
      return { success: false, totalRewards: [], message: '没有可领取的奖励' }
    }
  }

  getAchievementsByCategory(data: AchievementData, category: string): Achievement[] {
    return data.achievements.filter(a => a.category === category)
  }

  getDiscoveredMonsters(data: AchievementData): MonsterEntry[] {
    return data.monsters.filter(m => m.isDiscovered)
  }

  getCollectedTreasures(data: AchievementData): TreasureEntry[] {
    return data.treasures.filter(t => t.isCollected)
  }

  getCompletedStories(data: AchievementData): StoryEntry[] {
    return data.stories.filter(s => s.isCompleted)
  }

  getUnlockedAchievementsCount(data: AchievementData): number {
    return data.achievements.filter(a => a.status !== 'locked').length
  }

  getClaimableAchievementsCount(data: AchievementData): number {
    return data.achievements.filter(a => a.status === 'unlocked').length
  }

  getOverallProgress(data: AchievementData): {
    achievements: number
    monsters: number
    treasures: number
    stories: number
  } {
    return {
      achievements: Math.round((data.totalAchievementsUnlocked / data.achievements.length) * 100),
      monsters: Math.round((data.monsters.filter(m => m.isDiscovered).length / data.monsters.length) * 100),
      treasures: Math.round((data.totalTreasuresCollected / data.treasures.length) * 100),
      stories: Math.round((data.totalStoriesCompleted / data.stories.length) * 100)
    }
  }

  getAchievementBonus(data: AchievementData): AchievementBonus {
    return { ...data.permanentBonus }
  }

  initializePlayerTreasures(save: GameSave): void {
    save.player.treasures.forEach(treasure => {
      this.collectTreasure(save, treasure.id, {
        name: treasure.name,
        description: treasure.description,
        icon: treasure.name.charAt(0),
        color: treasure.color,
        rarity: 'common',
        maxLevel: treasure.maxLevel
      })
    })
  }

  collectTreasure(save: GameSave, treasureId: string, treasureInfo?: Partial<TreasureEntry>): { unlockedAchievements: Achievement[] } {
    const achievementData = save.achievement
    const unlockedAchievements: Achievement[] = []

    this.handleTreasureCollect(achievementData, treasureId, treasureInfo)
    this.updateCollectionAchievements(achievementData, unlockedAchievements)

    achievementData.lastAchievementCheck = Date.now()
    this.saveManager.saveGame(save)

    return { unlockedAchievements }
  }

  checkStageStories(save: GameSave, stageId: number): void {
    const storyMap: Record<number, string> = {
      1: 'qingming_valley',
      2: 'blood_demon_cave',
      3: 'nine_nether',
      5: 'heaven_demon'
    }

    if (stageId === 1) {
      this.updateProgress(save, {
        type: 'story_complete',
        id: 'opening',
        value: 1
      })
    }

    const storyId = storyMap[stageId]
    if (storyId) {
      this.updateProgress(save, {
        type: 'story_complete',
        id: storyId,
        value: 1
      })
    }
  }
}
