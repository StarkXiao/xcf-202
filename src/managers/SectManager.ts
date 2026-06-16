import type { Sect, Disciple, Building, SectQuest, Resources, ResourceType, DiscipleTemplate } from '../types'
import { createInitialSect, calculateProduction, calculateUpgradeCost, generateDailyQuests } from '../data/sectData'
import { SaveManager } from './SaveManager'

export class SectManager {
  private static instance: SectManager

  static getInstance(): SectManager {
    if (!SectManager.instance) {
      SectManager.instance = new SectManager()
    }
    return SectManager.instance
  }

  createInitialSect(): Sect {
    const sect = createInitialSect()
    sect.quests = generateDailyQuests(sect.level, 3)
    return sect
  }

  private saveManager = SaveManager.getInstance()

  checkDailyReset(sect: Sect): Sect {
    const now = Date.now()
    const lastReset = new Date(sect.lastDailyReset)
    const today = new Date()
    const isSameDay = lastReset.getDate() === today.getDate() &&
      lastReset.getMonth() === today.getMonth() &&
      lastReset.getFullYear() === today.getFullYear()

    if (!isSameDay) {
      sect.lastDailyReset = now
      sect.dailyRecruitsUsed = 0
      sect.quests = sect.quests.filter(q => q.status === 'in_progress' || q.status === 'completed')
      const newQuests = generateDailyQuests(sect.level, 3 - sect.quests.length)
      sect.quests.push(...newQuests)
    }

    return sect
  }

  calculateOfflineProduction(sect: Sect): { resources: Partial<Resources>; seconds: number } {
    const now = Date.now()
    const elapsedSeconds = Math.floor((now - sect.lastCollectTime) / 1000)
    const maxOfflineSeconds = 8 * 60 * 60
    const effectiveSeconds = Math.min(elapsedSeconds, maxOfflineSeconds)

    const totalProduction: Partial<Resources> = {}

    for (const building of sect.buildings) {
      if (building.level === 0) continue

      const assignedDisciples = sect.disciples.filter(
        d => d.assignedBuilding === building.id
      )
      const production = calculateProduction(building, assignedDisciples)

      for (const [key, value] of Object.entries(production)) {
        if (value) {
          const resourceKey = key as keyof Resources
          totalProduction[resourceKey] = (totalProduction[resourceKey] || 0) + value * effectiveSeconds
        }
      }
    }

    for (const key of Object.keys(totalProduction)) {
      const resourceKey = key as keyof Resources
      if (totalProduction[resourceKey]) {
        totalProduction[resourceKey] = Math.floor(totalProduction[resourceKey]!)
      }
    }

    return { resources: totalProduction, seconds: effectiveSeconds }
  }

  collectResources(sect: Sect): { collected: Partial<Resources>; seconds: number } {
    const { resources, seconds } = this.calculateOfflineProduction(sect)

    for (const [key, value] of Object.entries(resources)) {
      if (value) {
        sect.resources[key as keyof Resources] += value
      }
    }

    sect.lastCollectTime = Date.now()
    this.saveGame(sect)

    return { collected: resources, seconds }
  }

  recruitDisciple(sect: Sect, template: DiscipleTemplate): Disciple | null {
    if (sect.disciples.length >= sect.maxDisciples) return null
    if (sect.dailyRecruitsUsed >= sect.dailyRecruitLimit) return null

    for (const cost of template.recruitCost) {
      if (sect.resources[cost.type] < cost.amount) return null
    }

    for (const cost of template.recruitCost) {
      sect.resources[cost.type] -= cost.amount
    }

    const disciple: Disciple = {
      id: `disciple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId: template.id,
      name: template.name,
      rarity: template.rarity,
      level: 1,
      exp: 0,
      expToNext: 100,
      talent: template.baseTalent,
      combatPower: template.baseCombatPower,
      assignedBuilding: null,
      avatar: template.avatar,
      color: template.color
    }

    sect.disciples.push(disciple)
    sect.dailyRecruitsUsed++
    this.saveGame(sect)

    return disciple
  }

  assignDiscipleToBuilding(sect: Sect, discipleId: string, buildingId: string): boolean {
    const disciple = sect.disciples.find(d => d.id === discipleId)
    const building = sect.buildings.find(b => b.id === buildingId)

    if (!disciple || !building || building.level === 0) return false
    if (building.assignedDisciples.length >= building.maxDisciples) return false
    if (disciple.assignedBuilding) {
      this.unassignDisciple(sect, discipleId)
    }

    disciple.assignedBuilding = buildingId
    building.assignedDisciples.push(discipleId)
    this.saveGame(sect)

    return true
  }

  unassignDisciple(sect: Sect, discipleId: string): boolean {
    const disciple = sect.disciples.find(d => d.id === discipleId)
    if (!disciple || !disciple.assignedBuilding) return false

    const building = sect.buildings.find(b => b.id === disciple.assignedBuilding)
    if (building) {
      building.assignedDisciples = building.assignedDisciples.filter(id => id !== discipleId)
    }

    disciple.assignedBuilding = null
    this.saveGame(sect)

    return true
  }

  upgradeBuilding(sect: Sect, buildingId: string): boolean {
    const building = sect.buildings.find(b => b.id === buildingId)
    if (!building || building.level >= building.maxLevel) return false

    const cost = calculateUpgradeCost(building)

    for (const [key, value] of Object.entries(cost)) {
      if (value && sect.resources[key as keyof Resources] < value) return false
    }

    for (const [key, value] of Object.entries(cost)) {
      if (value) {
        sect.resources[key as keyof Resources] -= value
      }
    }

    building.level++
    building.maxDisciples = this.calculateMaxDisciples(building)
    building.productionRate = this.calculateProductionRate(building)

    if (building.type === 'hall') {
      this.upgradeSectLevel(sect)
    }

    if (building.type === 'dormitory') {
      sect.maxDisciples = 5 + (building.level - 1) * 2
    }

    this.saveGame(sect)
    return true
  }

  private calculateMaxDisciples(building: Building): number {
    const template = building
    return template.maxDisciples + (building.level - 1)
  }

  private calculateProductionRate(building: Building): Partial<Resources> {
    const rate: Partial<Resources> = {}
    const multiplier = 1 + (building.level - 1) * 0.2

    const template = { ...building.productionRate }
    for (const [key, value] of Object.entries(template)) {
      if (value) {
        rate[key as keyof Resources] = Math.floor(value * multiplier * 100) / 100
      }
    }

    return rate
  }

  private upgradeSectLevel(sect: Sect): void {
    const hall = sect.buildings.find(b => b.type === 'hall')
    if (!hall) return

    const targetLevel = hall.level
    while (sect.level < targetLevel && sect.exp >= sect.expToNext) {
      sect.exp -= sect.expToNext
      sect.level++
      sect.expToNext = Math.floor(1000 * Math.pow(1.5, sect.level - 1))
      sect.dailyRecruitLimit = 3 + Math.floor(sect.level / 3)
    }
  }

  startQuest(sect: Sect, questId: string, discipleId: string): boolean {
    const quest = sect.quests.find(q => q.id === questId)
    const disciple = sect.disciples.find(d => d.id === discipleId)

    if (!quest || !disciple) return false
    if (quest.status !== 'available') return false
    if (disciple.combatPower < quest.combatPowerRequired) return false
    if (disciple.assignedBuilding) return false

    quest.status = 'in_progress'
    quest.assignedDisciple = discipleId
    quest.startTime = Date.now()
    quest.progress = 0

    this.saveGame(sect)
    return true
  }

  updateQuestProgress(sect: Sect): void {
    const now = Date.now()

    for (const quest of sect.quests) {
      if (quest.status !== 'in_progress' || !quest.startTime) continue

      const elapsed = (now - quest.startTime) / 1000
      quest.progress = Math.min(quest.targetProgress, Math.floor((elapsed / quest.duration) * quest.targetProgress))

      if (quest.progress >= quest.targetProgress) {
        quest.status = 'completed'
      }
    }
  }

  claimQuestReward(sect: Sect, questId: string): boolean {
    const quest = sect.quests.find(q => q.id === questId)
    if (!quest || quest.status !== 'completed') return false

    const disciple = sect.disciples.find(d => d.id === quest.assignedDisciple)

    for (const [key, value] of Object.entries(quest.rewards)) {
      if (value) {
        if (key === 'reputation') {
          sect.reputation += value
          sect.exp += value
          this.upgradeSectLevel(sect)
        } else {
          sect.resources[key as keyof Resources] += value
        }
      }
    }

    if (disciple) {
      const expGain = Math.floor(quest.duration / 10)
      this.addDiscipleExp(disciple, expGain)
    }

    quest.status = 'claimed'

    const availableQuests = sect.quests.filter(q => q.status === 'available').length
    if (availableQuests < 3) {
      const newQuests = generateDailyQuests(sect.level, 3 - availableQuests)
      sect.quests.push(...newQuests)
    }

    this.saveGame(sect)
    return true
  }

  private addDiscipleExp(disciple: Disciple, exp: number): void {
    disciple.exp += exp
    while (disciple.exp >= disciple.expToNext) {
      disciple.exp -= disciple.expToNext
      disciple.level++
      disciple.expToNext = Math.floor(100 * Math.pow(1.2, disciple.level - 1))
      disciple.talent = Math.floor(disciple.talent * 1.1)
      disciple.combatPower = Math.floor(disciple.combatPower * 1.15)
    }
  }

  addResources(sect: Sect, resources: Partial<Resources>): void {
    for (const [key, value] of Object.entries(resources)) {
      if (value) {
        sect.resources[key as keyof Resources] += value
      }
    }
    this.saveGame(sect)
  }

  spendResources(sect: Sect, resources: Partial<Resources>): boolean {
    for (const [key, value] of Object.entries(resources)) {
      if (value && sect.resources[key as keyof Resources] < value) {
        return false
      }
    }

    for (const [key, value] of Object.entries(resources)) {
      if (value) {
        sect.resources[key as keyof Resources] -= value
      }
    }

    this.saveGame(sect)
    return true
  }

  getBuildingProduction(sect: Sect, building: Building): Partial<Resources> {
    const assignedDisciples = sect.disciples.filter(
      d => d.assignedBuilding === building.id
    )
    return calculateProduction(building, assignedDisciples)
  }

  getTotalProduction(sect: Sect): Partial<Resources> {
    const total: Partial<Resources> = {}

    for (const building of sect.buildings) {
      if (building.level === 0) continue
      const production = this.getBuildingProduction(sect, building)
      for (const [key, value] of Object.entries(production)) {
        if (value) {
          const resourceKey = key as keyof Resources
          total[resourceKey] = (total[resourceKey] || 0) + value
        }
      }
    }

    return total
  }

  getAvailableDisciples(sect: Sect): Disciple[] {
    return sect.disciples.filter(d => !d.assignedBuilding && !sect.quests.some(q => q.assignedDisciple === d.id && q.status === 'in_progress'))
  }

  getDiscipleCurrentTask(sect: Sect, disciple: Disciple): string {
    if (disciple.assignedBuilding) {
      const building = sect.buildings.find(b => b.id === disciple.assignedBuilding)
      return `在${building?.name || '建筑'}工作`
    }

    const quest = sect.quests.find(q => q.assignedDisciple === disciple.id && q.status === 'in_progress')
    if (quest) {
      return `执行任务：${quest.title}`
    }

    return '空闲'
  }

  private saveGame(sect: Sect): void {
    const save = this.saveManager.loadGame()
    if (save) {
      save.sect = sect
      this.saveManager.saveGame(save)
    }
  }

  validateSect(sect: Sect): Sect {
    if (!sect.resources) {
      sect.resources = { gold: 0, spirit: 0, stone: 0, wood: 0, herb: 0 }
    }
    if (!sect.disciples) sect.disciples = []
    if (!sect.buildings) sect.buildings = createInitialSect().buildings
    if (!sect.quests) sect.quests = generateDailyQuests(sect.level || 1, 3)
    if (sect.maxDisciples === undefined) sect.maxDisciples = 5
    if (sect.lastCollectTime === undefined) sect.lastCollectTime = Date.now()
    if (sect.dailyRecruitsUsed === undefined) sect.dailyRecruitsUsed = 0
    if (sect.dailyRecruitLimit === undefined) sect.dailyRecruitLimit = 3
    if (sect.lastDailyReset === undefined) sect.lastDailyReset = Date.now()
    if (sect.level === undefined) sect.level = 1
    if (sect.exp === undefined) sect.exp = 0
    if (sect.expToNext === undefined) sect.expToNext = 1000
    if (sect.reputation === undefined) sect.reputation = 0
    if (!sect.name) sect.name = '青云宗'

    return sect
  }
}
