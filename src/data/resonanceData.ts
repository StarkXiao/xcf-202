import type { Resonance, ElementType, Treasure, ResonanceResult, ActiveResonance, ResonanceBonus } from '../types'

export const RESONANCES: Resonance[] = [
  {
    id: 'dual_element',
    name: '两仪相生',
    description: '同时拥有两种不同五行属性的法宝，阴阳调和，相生相济',
    type: 'element',
    requiredElementCount: 2,
    bonus: { attack: 15, defense: 10 },
    color: 0x81c784,
    icon: '☯',
    rarity: 'common'
  },
  {
    id: 'triple_element',
    name: '三才归元',
    description: '同时拥有三种不同五行属性的法宝，天地人三才合一',
    type: 'element',
    requiredElementCount: 3,
    bonus: { attack: 30, defense: 20, maxHealth: 100 },
    color: 0x4fc3f7,
    icon: '✦',
    rarity: 'rare'
  },
  {
    id: 'quad_element',
    name: '四象镇世',
    description: '同时拥有四种不同五行属性的法宝，四象镇守，万邪不侵',
    type: 'element',
    requiredElementCount: 4,
    bonus: { attack: 50, defense: 35, maxHealth: 200, critRate: 0.05 },
    color: 0xba68c8,
    icon: '❖',
    rarity: 'epic'
  },
  {
    id: 'five_elements',
    name: '五行圆满',
    description: '同时拥有五种不同五行属性的法宝，五行轮转，造化天成',
    type: 'element',
    requiredElementCount: 5,
    bonus: { attack: 80, defense: 60, maxHealth: 400, critRate: 0.1, critDamage: 0.2 },
    color: 0xffd54f,
    icon: '❂',
    rarity: 'legendary'
  },
  {
    id: 'metal_wood',
    name: '金枝玉叶',
    description: '金行与木行法宝同时在场，金伐木生，生生不息',
    type: 'element',
    requiredElements: ['metal', 'wood'],
    bonus: { attack: 20, maxHealth: 80 },
    color: 0xaed581,
    icon: '🌿',
    rarity: 'common'
  },
  {
    id: 'water_fire',
    name: '水火既济',
    description: '水行与火行法宝同时在场，水火交融，阴阳调和',
    type: 'element',
    requiredElements: ['water', 'fire'],
    bonus: { attack: 25, critRate: 0.03 },
    color: 0xff7043,
    icon: '🔥',
    rarity: 'rare'
  },
  {
    id: 'earth_water',
    name: '厚德载物',
    description: '土行与水行法宝同时在场，土载水养，厚积薄发',
    type: 'element',
    requiredElements: ['earth', 'water'],
    bonus: { defense: 25, maxHealth: 120 },
    color: 0x4dd0e1,
    icon: '🌊',
    rarity: 'common'
  },
  {
    id: 'starter_set',
    name: '三才初成',
    description: '集齐三件入门法宝，初窥修仙门径',
    type: 'set',
    requiredTreasureIds: ['flying_sword', 'jade_pendant', 'pearl'],
    bonus: { attack: 20, defense: 15, maxHealth: 50 },
    color: 0x81c784,
    icon: '📜',
    rarity: 'common'
  }
]

function getUniqueElements(treasures: Treasure[]): ElementType[] {
  const elements = new Set<ElementType>()
  treasures.forEach((t) => {
    if (t.element && t.element !== 'none') {
      elements.add(t.element)
    }
  })
  return Array.from(elements)
}

function hasAllElements(treasures: Treasure[], requiredElements: ElementType[]): boolean {
  const treasureElements = getUniqueElements(treasures)
  return requiredElements.every((el) => treasureElements.includes(el))
}

function hasAllTreasures(treasures: Treasure[], requiredIds: string[]): boolean {
  const treasureIds = treasures.map((t) => t.id)
  return requiredIds.every((id) => treasureIds.includes(id))
}

function getMatchingTreasuresById(treasures: Treasure[], ids: string[]): Treasure[] {
  return treasures.filter((t) => ids.includes(t.id))
}

function getMatchingTreasuresByElement(treasures: Treasure[], elements: ElementType[]): Treasure[] {
  return treasures.filter((t) => t.element && elements.includes(t.element))
}

function sumBonus(bonus1: ResonanceBonus, bonus2: ResonanceBonus): ResonanceBonus {
  return {
    attack: (bonus1.attack || 0) + (bonus2.attack || 0),
    defense: (bonus1.defense || 0) + (bonus2.defense || 0),
    maxHealth: (bonus1.maxHealth || 0) + (bonus2.maxHealth || 0),
    critRate: (bonus1.critRate || 0) + (bonus2.critRate || 0),
    critDamage: (bonus1.critDamage || 0) + (bonus2.critDamage || 0),
    elementDamageBonus: (bonus1.elementDamageBonus || 0) + (bonus2.elementDamageBonus || 0)
  }
}

export function calculateTreasureResonance(treasures: Treasure[]): ResonanceResult {
  const activeResonances: ActiveResonance[] = []
  let totalBonus: ResonanceBonus = {
    attack: 0,
    defense: 0,
    maxHealth: 0,
    critRate: 0,
    critDamage: 0,
    elementDamageBonus: 0
  }

  const elementCount = getUniqueElements(treasures).length

  RESONANCES.forEach((resonance) => {
    let isActive = false
    let activatedTreasures: Treasure[] = []

    if (resonance.type === 'element' && resonance.requiredElementCount !== undefined) {
      if (elementCount >= resonance.requiredElementCount) {
        isActive = true
        activatedTreasures = treasures.filter((t) => t.element && t.element !== 'none')
      }
    } else if (resonance.type === 'element' && resonance.requiredElements) {
      if (hasAllElements(treasures, resonance.requiredElements)) {
        isActive = true
        activatedTreasures = getMatchingTreasuresByElement(treasures, resonance.requiredElements)
      }
    } else if (resonance.type === 'set' && resonance.requiredTreasureIds) {
      if (hasAllTreasures(treasures, resonance.requiredTreasureIds)) {
        isActive = true
        activatedTreasures = getMatchingTreasuresById(treasures, resonance.requiredTreasureIds)
      }
    }

    if (isActive) {
      activeResonances.push({ resonance, activatedTreasures })
      totalBonus = sumBonus(totalBonus, resonance.bonus)
    }
  })

  return { activeResonances, totalBonus }
}

export function getResonanceRarityColor(rarity: string): number {
  const colors: Record<string, number> = {
    common: 0x90a4ae,
    rare: 0x4fc3f7,
    epic: 0xba68c8,
    legendary: 0xffd54f
  }
  return colors[rarity] || 0x90a4ae
}

export function getResonanceRarityLabel(rarity: string): string {
  const labels: Record<string, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return labels[rarity] || '普通'
}
