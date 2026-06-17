import type { ElementType } from '../types'

export const ELEMENT_ADVANTAGE_DAMAGE_MULTIPLIER = 1.5
export const ELEMENT_DISADVANTAGE_DAMAGE_MULTIPLIER = 0.6
export const ELEMENT_NEUTRAL_DAMAGE_MULTIPLIER = 1.0

export const ELEMENT_CONSTRAINTS: Record<ElementType, ElementType> = {
  metal: 'wood',
  wood: 'earth',
  water: 'fire',
  fire: 'metal',
  earth: 'water',
  none: 'none'
}

export const ELEMENT_INFO: Record<ElementType, { name: string; icon: string; color: number }> = {
  metal: { name: '金', icon: '⚔', color: 0xffd54f },
  wood: { name: '木', icon: '🌿', color: 0x81c784 },
  water: { name: '水', icon: '💧', color: 0x4fc3f7 },
  fire: { name: '火', icon: '🔥', color: 0xff5722 },
  earth: { name: '土', icon: '🛡', color: 0x8d6e63 },
  none: { name: '无', icon: '✦', color: 0xb0bec5 }
}

export function getElementMultiplier(attackElement: ElementType | undefined, defendElement: ElementType | undefined): { multiplier: number; isAdvantage: boolean; isDisadvantage: boolean } {
  const atk = attackElement || 'none'
  const def = defendElement || 'none'

  if (atk === 'none' || def === 'none') {
    return { multiplier: ELEMENT_NEUTRAL_DAMAGE_MULTIPLIER, isAdvantage: false, isDisadvantage: false }
  }

  if (atk === def) {
    return { multiplier: ELEMENT_NEUTRAL_DAMAGE_MULTIPLIER, isAdvantage: false, isDisadvantage: false }
  }

  const constrained = ELEMENT_CONSTRAINTS[atk]
  if (constrained === def) {
    return { multiplier: ELEMENT_ADVANTAGE_DAMAGE_MULTIPLIER, isAdvantage: true, isDisadvantage: false }
  }

  const defConstrained = ELEMENT_CONSTRAINTS[def]
  if (defConstrained === atk) {
    return { multiplier: ELEMENT_DISADVANTAGE_DAMAGE_MULTIPLIER, isAdvantage: false, isDisadvantage: true }
  }

  return { multiplier: ELEMENT_NEUTRAL_DAMAGE_MULTIPLIER, isAdvantage: false, isDisadvantage: false }
}

export function getElementLabel(element: ElementType | undefined): string {
  const info = ELEMENT_INFO[element || 'none']
  return `${info.icon}${info.name}`
}

export function getElementConstraintText(attackElement: ElementType, defendElement: ElementType): string | null {
  const { isAdvantage, isDisadvantage } = getElementMultiplier(attackElement, defendElement)
  if (isAdvantage) {
    return `${ELEMENT_INFO[attackElement].icon}${ELEMENT_INFO[attackElement].name}克${ELEMENT_INFO[defendElement].icon}${ELEMENT_INFO[defendElement].name}！伤害×1.5`
  }
  if (isDisadvantage) {
    return `${ELEMENT_INFO[defendElement].icon}${ELEMENT_INFO[defendElement].name}克${ELEMENT_INFO[attackElement].icon}${ELEMENT_INFO[attackElement].name}！伤害×0.6`
  }
  return null
}
