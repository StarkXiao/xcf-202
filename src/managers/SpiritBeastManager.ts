import type {
  SpiritBeast,
  SpiritBeastData,
  SpiritBeastTemplate,
  SpiritBeastSkill,
  CaptureResult,
  GameSave
} from '../types'
import { SPIRIT_BEAST_TEMPLATES, SPIRIT_BEAST_ITEMS, getBeastTemplate, getRarityColor } from '../data/spiritBeastData'

export class SpiritBeastManager {
  private static instance: SpiritBeastManager

  static getInstance(): SpiritBeastManager {
    if (!SpiritBeastManager.instance) {
      SpiritBeastManager.instance = new SpiritBeastManager()
    }
    return SpiritBeastManager.instance
  }

  createInitialSpiritBeastData(): SpiritBeastData {
    return {
      beasts: [],
      battleTeam: [null, null, null],
      captureItems: [
        { itemId: 'basic_trap', quantity: 5 },
        { itemId: 'advanced_trap', quantity: 2 }
      ],
      feedItems: [
        { itemId: 'spirit_grain', quantity: 20 },
        { itemId: 'fire_fruit', quantity: 5 },
        { itemId: 'thunder_herb', quantity: 5 },
        { itemId: 'ice_lotus', quantity: 5 },
        { itemId: 'shadow_meat', quantity: 3 }
      ],
      evolveItems: [
        { itemId: 'fire_crystal', quantity: 3 },
        { itemId: 'thunder_stone', quantity: 3 },
        { itemId: 'ice_crystal', quantity: 3 },
        { itemId: 'shadow_crystal', quantity: 2 }
      ],
      unlockedBeastTemplates: ['fire_fox', 'thunder_eagle', 'ice_turtle']
    }
  }

  validateSpiritBeastData(data: SpiritBeastData | undefined): SpiritBeastData {
    if (!data) {
      return this.createInitialSpiritBeastData()
    }

    const defaultData = this.createInitialSpiritBeastData()

    if (!data.beasts) data.beasts = []
    if (!data.battleTeam) data.battleTeam = [null, null, null]
    if (!data.captureItems) data.captureItems = defaultData.captureItems
    if (!data.feedItems) data.feedItems = defaultData.feedItems
    if (!data.evolveItems) data.evolveItems = defaultData.evolveItems
    if (!data.unlockedBeastTemplates) data.unlockedBeastTemplates = defaultData.unlockedBeastTemplates

    data.beasts.forEach(beast => {
      this.recalcBeastStats(beast)
    })

    return data
  }

  private generateId(): string {
    return 'beast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  createBeastFromTemplate(template: SpiritBeastTemplate): SpiritBeast {
    const skills = template.skills.map(skill => ({
      ...skill,
      currentCooldown: 0
    }))

    const beast: SpiritBeast = {
      id: this.generateId(),
      templateId: template.id,
      name: template.name,
      level: 1,
      exp: 0,
      expToNext: template.baseExpToNext,
      stage: 1,
      health: 0,
      maxHealth: 0,
      attack: 0,
      defense: 0,
      skills,
      rarity: template.rarity,
      color: getRarityColor(template.rarity),
      icon: template.icon,
      isInBattle: false,
      battlePosition: null,
      affection: 0,
      captureTime: Date.now()
    }

    this.recalcBeastStats(beast)
    beast.health = beast.maxHealth

    return beast
  }

  recalcBeastStats(beast: SpiritBeast): void {
    const template = getBeastTemplate(beast.templateId)
    if (!template) return

    const stageMultiplier = 1 + (beast.stage - 1) * 0.25
    const levelBonus = beast.level - 1

    beast.maxHealth = Math.floor((template.baseHealth + template.growthHealth * levelBonus) * stageMultiplier)
    beast.attack = Math.floor((template.baseAttack + template.growthAttack * levelBonus) * stageMultiplier)
    beast.defense = Math.floor((template.baseDefense + template.growthDefense * levelBonus) * stageMultiplier)

    if (beast.health > beast.maxHealth) {
      beast.health = beast.maxHealth
    }
  }

  captureBeast(
    data: SpiritBeastData,
    playerGold: number,
    templateId: string,
    trapItemId: string
  ): { result: CaptureResult; newGold: number } {
    const template = getBeastTemplate(templateId)
    if (!template) {
      return {
        result: { success: false, message: '未知的灵兽类型' },
        newGold: playerGold
      }
    }

    if (!data.unlockedBeastTemplates.includes(templateId)) {
      return {
        result: { success: false, message: '尚未解锁该灵兽' },
        newGold: playerGold
      }
    }

    const trapItem = data.captureItems.find(item => item.itemId === trapItemId)
    if (!trapItem || trapItem.quantity <= 0) {
      return {
        result: { success: false, message: '捕捉道具不足' },
        newGold: playerGold
      }
    }

    const trapConfig = SPIRIT_BEAST_ITEMS.capture.find(item => item.id === trapItemId)
    if (!trapConfig) {
      return {
        result: { success: false, message: '无效的捕捉道具' },
        newGold: playerGold
      }
    }

    trapItem.quantity--

    const successRate = Math.min(0.95, template.captureRate + trapConfig.successRateBonus)
    const success = Math.random() < successRate

    if (success) {
      const beast = this.createBeastFromTemplate(template)
      data.beasts.push(beast)

      return {
        result: {
          success: true,
          beast,
          message: `恭喜！成功捕捉到${template.name}！`
        },
        newGold: playerGold
      }
    } else {
      return {
        result: {
          success: false,
          message: `${template.name}挣脱了束缚，逃跑了...`
        },
        newGold: playerGold
      }
    }
  }

  feedBeast(
    data: SpiritBeastData,
    beastId: string,
    feedItemId: string,
    amount: number = 1
  ): { success: boolean; message: string; leveledUp: boolean } {
    const beast = data.beasts.find(b => b.id === beastId)
    if (!beast) {
      return { success: false, message: '灵兽不存在', leveledUp: false }
    }

    const template = getBeastTemplate(beast.templateId)
    if (!template) {
      return { success: false, message: '灵兽模板不存在', leveledUp: false }
    }

    const feedItem = data.feedItems.find(item => item.itemId === feedItemId)
    if (!feedItem || feedItem.quantity < amount) {
      return { success: false, message: '饲料不足', leveledUp: false }
    }

    const feedConfig = template.feedItems.find(f => f.itemId === feedItemId)
    if (!feedConfig) {
      return { success: false, message: '该灵兽不喜欢这种食物', leveledUp: false }
    }

    const isPreferred = feedItemId !== 'spirit_grain'
    const expGain = feedConfig.expGain * amount * (isPreferred ? 1.5 : 1)
    const affectionGain = amount * (isPreferred ? 3 : 1)

    feedItem.quantity -= amount
    beast.affection = Math.min(100, beast.affection + affectionGain)

    const leveledUp = this.addExp(beast, expGain)

    return {
      success: true,
      message: `${beast.name}吃得很开心，获得${Math.floor(expGain)}点经验和${affectionGain}点亲密度！`,
      leveledUp
    }
  }

  addExp(beast: SpiritBeast, exp: number): boolean {
    const template = getBeastTemplate(beast.templateId)
    if (!template) return false

    if (beast.level >= template.maxLevel) {
      beast.exp = beast.expToNext
      return false
    }

    beast.exp += exp
    let leveledUp = false

    while (beast.exp >= beast.expToNext && beast.level < template.maxLevel) {
      beast.exp -= beast.expToNext
      beast.level++
      beast.expToNext = Math.floor(template.baseExpToNext * Math.pow(1.2, beast.level - 1))
      leveledUp = true
    }

    if (leveledUp) {
      this.recalcBeastStats(beast)
      beast.health = beast.maxHealth
    }

    return leveledUp
  }

  evolveBeast(
    data: SpiritBeastData,
    beastId: string,
    playerGold: number,
    playerSpirit: number
  ): { success: boolean; message: string; newGold: number; newSpirit: number } {
    const beast = data.beasts.find(b => b.id === beastId)
    if (!beast) {
      return { success: false, message: '灵兽不存在', newGold: playerGold, newSpirit: playerSpirit }
    }

    const template = getBeastTemplate(beast.templateId)
    if (!template) {
      return { success: false, message: '灵兽模板不存在', newGold: playerGold, newSpirit: playerSpirit }
    }

    if (beast.stage >= template.maxStage) {
      return { success: false, message: '已达到最高阶', newGold: playerGold, newSpirit: playerSpirit }
    }

    const nextStage = beast.stage + 1
    const requirement = template.evolveRequirements.find(r => r.stage === nextStage)
    if (!requirement) {
      return { success: false, message: '升阶要求不存在', newGold: playerGold, newSpirit: playerSpirit }
    }

    const requiredLevel = (nextStage - 1) * 10 + 10
    if (beast.level < requiredLevel) {
      return {
        success: false,
        message: `等级不足，需要达到${requiredLevel}级才能升阶`,
        newGold: playerGold,
        newSpirit: playerSpirit
      }
    }

    if (playerGold < requirement.gold) {
      return { success: false, message: '金币不足', newGold: playerGold, newSpirit: playerSpirit }
    }

    if (playerSpirit < requirement.spirit) {
      return { success: false, message: '灵气不足', newGold: playerGold, newSpirit: playerSpirit }
    }

    if (requirement.items) {
      for (const item of requirement.items) {
        const evolveItem = data.evolveItems.find(ei => ei.itemId === item.itemId)
        if (!evolveItem || evolveItem.quantity < item.amount) {
          return { success: false, message: '升阶材料不足', newGold: playerGold, newSpirit: playerSpirit }
        }
      }
    }

    const newGold = playerGold - requirement.gold
    const newSpirit = playerSpirit - requirement.spirit

    if (requirement.items) {
      for (const item of requirement.items) {
        const evolveItem = data.evolveItems.find(ei => ei.itemId === item.itemId)
        if (evolveItem) {
          evolveItem.quantity -= item.amount
        }
      }
    }

    beast.stage = nextStage
    this.recalcBeastStats(beast)
    beast.health = beast.maxHealth

    return {
      success: true,
      message: `${beast.name}成功升阶到${beast.stage}阶！属性大幅提升！`,
      newGold,
      newSpirit
    }
  }

  addToBattleTeam(data: SpiritBeastData, beastId: string, position: number): boolean {
    if (position < 0 || position >= data.battleTeam.length) {
      return false
    }

    const beast = data.beasts.find(b => b.id === beastId)
    if (!beast) {
      return false
    }

    const existingBeast = data.beasts.find(b => b.battlePosition === position)
    if (existingBeast) {
      existingBeast.isInBattle = false
      existingBeast.battlePosition = null
    }

    if (beast.battlePosition !== null) {
      data.battleTeam[beast.battlePosition] = null
    }

    data.battleTeam[position] = beastId
    beast.isInBattle = true
    beast.battlePosition = position

    return true
  }

  removeFromBattleTeam(data: SpiritBeastData, beastId: string): boolean {
    const beast = data.beasts.find(b => b.id === beastId)
    if (!beast || beast.battlePosition === null) {
      return false
    }

    data.battleTeam[beast.battlePosition] = null
    beast.isInBattle = false
    beast.battlePosition = null

    return true
  }

  getBattleTeam(data: SpiritBeastData): (SpiritBeast | null)[] {
    return data.battleTeam.map(beastId => {
      if (!beastId) return null
      return data.beasts.find(b => b.id === beastId) || null
    })
  }

  getAvailableSkills(beast: SpiritBeast): SpiritBeastSkill[] {
    return beast.skills.filter(skill => skill.unlockStage <= beast.stage)
  }

  canUseSkill(beast: SpiritBeast, skillId: string): boolean {
    const skill = beast.skills.find(s => s.id === skillId)
    if (!skill) return false
    if (skill.unlockStage > beast.stage) return false
    if (skill.currentCooldown > 0) return false
    return true
  }

  useSkill(beast: SpiritBeast, skillId: string): SpiritBeastSkill | null {
    if (!this.canUseSkill(beast, skillId)) return null
    const skill = beast.skills.find(s => s.id === skillId)
    if (!skill) return null
    skill.currentCooldown = skill.cooldown
    return skill
  }

  tickCooldowns(beast: SpiritBeast): void {
    beast.skills.forEach(skill => {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown--
      }
    })
  }

  buyCaptureItem(
    data: SpiritBeastData,
    playerGold: number,
    itemId: string,
    amount: number
  ): { success: boolean; message: string; newGold: number } {
    const itemConfig = SPIRIT_BEAST_ITEMS.capture.find(item => item.id === itemId)
    if (!itemConfig) {
      return { success: false, message: '商品不存在', newGold: playerGold }
    }

    const totalCost = itemConfig.price * amount
    if (playerGold < totalCost) {
      return { success: false, message: '金币不足', newGold: playerGold }
    }

    const existingItem = data.captureItems.find(item => item.itemId === itemId)
    if (existingItem) {
      existingItem.quantity += amount
    } else {
      data.captureItems.push({ itemId, quantity: amount })
    }

    return {
      success: true,
      message: `购买${amount}个${itemConfig.name}成功！`,
      newGold: playerGold - totalCost
    }
  }

  buyFeedItem(
    data: SpiritBeastData,
    playerGold: number,
    itemId: string,
    amount: number
  ): { success: boolean; message: string; newGold: number } {
    const itemConfig = SPIRIT_BEAST_ITEMS.feed.find(item => item.id === itemId)
    if (!itemConfig) {
      return { success: false, message: '商品不存在', newGold: playerGold }
    }

    const totalCost = itemConfig.price * amount
    if (playerGold < totalCost) {
      return { success: false, message: '金币不足', newGold: playerGold }
    }

    const existingItem = data.feedItems.find(item => item.itemId === itemId)
    if (existingItem) {
      existingItem.quantity += amount
    } else {
      data.feedItems.push({ itemId, quantity: amount })
    }

    return {
      success: true,
      message: `购买${amount}个${itemConfig.name}成功！`,
      newGold: playerGold - totalCost
    }
  }

  buyEvolveItem(
    data: SpiritBeastData,
    playerGold: number,
    itemId: string,
    amount: number
  ): { success: boolean; message: string; newGold: number } {
    const itemConfig = SPIRIT_BEAST_ITEMS.evolve.find(item => item.id === itemId)
    if (!itemConfig) {
      return { success: false, message: '商品不存在', newGold: playerGold }
    }

    const totalCost = itemConfig.price * amount
    if (playerGold < totalCost) {
      return { success: false, message: '金币不足', newGold: playerGold }
    }

    const existingItem = data.evolveItems.find(item => item.itemId === itemId)
    if (existingItem) {
      existingItem.quantity += amount
    } else {
      data.evolveItems.push({ itemId, quantity: amount })
    }

    return {
      success: true,
      message: `购买${amount}个${itemConfig.name}成功！`,
      newGold: playerGold - totalCost
    }
  }

  getRandomBeastTemplate(data: SpiritBeastData): SpiritBeastTemplate | null {
    const availableTemplates = SPIRIT_BEAST_TEMPLATES.filter(
      t => data.unlockedBeastTemplates.includes(t.id)
    )
    if (availableTemplates.length === 0) return null

    const totalWeight = availableTemplates.reduce((sum, t) => {
      const rarityWeight: Record<string, number> = {
        common: 50,
        rare: 30,
        epic: 15,
        legendary: 4,
        mythic: 1
      }
      return sum + (rarityWeight[t.rarity] || 10)
    }, 0)

    let random = Math.random() * totalWeight
    for (const template of availableTemplates) {
      const rarityWeight: Record<string, number> = {
        common: 50,
        rare: 30,
        epic: 15,
        legendary: 4,
        mythic: 1
      }
      random -= rarityWeight[template.rarity] || 10
      if (random <= 0) return template
    }

    return availableTemplates[0]
  }

  getBeastCombatPower(beast: SpiritBeast): number {
    return Math.floor(
      beast.maxHealth * 0.5 +
      beast.attack * 3 +
      beast.defense * 2 +
      beast.level * 5 +
      beast.stage * 20
    )
  }

  releaseBeast(data: SpiritBeastData, beastId: string): { success: boolean; message: string; goldReward: number; spiritReward: number } {
    const beastIndex = data.beasts.findIndex(b => b.id === beastId)
    if (beastIndex === -1) {
      return { success: false, message: '灵兽不存在', goldReward: 0, spiritReward: 0 }
    }

    const beast = data.beasts[beastIndex]
    if (beast.isInBattle) {
      this.removeFromBattleTeam(data, beastId)
    }

    const rarityMultiplier: Record<string, number> = {
      common: 1,
      rare: 2,
      epic: 5,
      legendary: 15,
      mythic: 50
    }

    const multiplier = rarityMultiplier[beast.rarity] || 1
    const goldReward = Math.floor((beast.level * 10 + beast.stage * 50) * multiplier)
    const spiritReward = Math.floor((beast.level * 2 + beast.stage * 10) * multiplier)

    data.beasts.splice(beastIndex, 1)

    return {
      success: true,
      message: `已放生${beast.name}，获得${goldReward}金币和${spiritReward}灵气`,
      goldReward,
      spiritReward
    }
  }
}
