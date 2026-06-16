export interface Skill {
  id: string
  name: string
  description: string
  damage: number
  cooldown: number
  currentCooldown: number
  manaCost: number
  unlockLevel: number
  color: number
  icon: string
}

export interface Treasure {
  id: string
  name: string
  description: string
  level: number
  maxLevel: number
  attackBonus: number
  defenseBonus: number
  healthBonus: number
  upgradeCost: number
  color: number
}

export interface Player {
  name: string
  level: number
  exp: number
  expToNext: number
  health: number
  maxHealth: number
  mana: number
  maxMana: number
  attack: number
  defense: number
  gold: number
  spirit: number
  skills: Skill[]
  treasures: Treasure[]
}

export interface Enemy {
  id: string
  name: string
  health: number
  maxHealth: number
  attack: number
  defense: number
  exp: number
  gold: number
  color: number
  size: number
}

export interface Stage {
  id: number
  name: string
  description: string
  enemies: Enemy[]
  background: number
  requiredLevel: number
  rewards: {
    gold: number
    exp: number
    spirit: number
  }
}

export interface GameSave {
  player: Player
  currentStage: number
  highestStage: number
  lastPlayTime: number
}

export type SceneType = 'menu' | 'opening' | 'battle' | 'treasure' | 'result'

export interface BattleResult {
  victory: boolean
  stageId: number
  expGained: number
  goldGained: number
  spiritGained: number
  playerHealth: number
}
