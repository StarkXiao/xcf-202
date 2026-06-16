import type { Skill, Treasure, Stage, Enemy } from '../types'

export const INITIAL_SKILLS: Skill[] = [
  {
    id: 'sword_strike',
    name: '御剑斩',
    description: '凝聚剑气，对敌人造成基础伤害',
    damage: 30,
    cooldown: 0,
    currentCooldown: 0,
    manaCost: 0,
    unlockLevel: 1,
    color: 0x4fc3f7,
    icon: '⚔'
  },
  {
    id: 'thunder_sword',
    name: '雷霆剑诀',
    description: '召唤九天雷罚，剑引雷霆万钧',
    damage: 80,
    cooldown: 3,
    currentCooldown: 0,
    manaCost: 20,
    unlockLevel: 2,
    color: 0xffeb3b,
    icon: '⚡'
  },
  {
    id: 'flame_slash',
    name: '赤炎焚天',
    description: '剑心燃火，焚烧一切阻碍',
    damage: 120,
    cooldown: 5,
    currentCooldown: 0,
    manaCost: 35,
    unlockLevel: 4,
    color: 0xff5722,
    icon: '🔥'
  },
  {
    id: 'frost_blade',
    name: '寒霜封天',
    description: '极寒剑气，冻结敌人并造成大量伤害',
    damage: 180,
    cooldown: 8,
    currentCooldown: 0,
    manaCost: 50,
    unlockLevel: 7,
    color: 0x00bcd4,
    icon: '❄'
  }
]

export const INITIAL_TREASURES: Treasure[] = [
  {
    id: 'flying_sword',
    name: '青锋剑',
    description: '修仙者入门佩剑，蕴含微薄灵气',
    level: 1,
    maxLevel: 10,
    attackBonus: 10,
    defenseBonus: 0,
    healthBonus: 0,
    upgradeCost: 100,
    color: 0x78909c
  },
  {
    id: 'jade_pendant',
    name: '通灵玉佩',
    description: '上古玉珏，护主心神，可挡致命一击',
    level: 1,
    maxLevel: 10,
    attackBonus: 0,
    defenseBonus: 8,
    healthBonus: 50,
    upgradeCost: 150,
    color: 0x81c784
  },
  {
    id: 'pearl',
    name: '定海神珠',
    description: '深海奇珠，凝练灵力',
    level: 1,
    maxLevel: 10,
    attackBonus: 5,
    defenseBonus: 5,
    healthBonus: 30,
    upgradeCost: 200,
    color: 0x4dd0e1
  }
]

const createEnemy = (id: string, name: string, health: number, attack: number, defense: number, exp: number, gold: number, color: number, size: number): Enemy => ({
  id, name, health, maxHealth: health, attack, defense, exp, gold, color, size
})

export const STAGES: Stage[] = [
  {
    id: 1,
    name: '青冥幽谷',
    description: '初入仙门之地，常有低阶妖兽出没',
    background: 0x1a237e,
    requiredLevel: 1,
    enemies: [
      createEnemy('wolf', '幽狼', 100, 15, 5, 20, 30, 0x9ccc65, 36),
      createEnemy('snake', '青蛇', 80, 20, 3, 15, 25, 0x66bb6a, 32)
    ],
    rewards: { gold: 50, exp: 40, spirit: 5 }
  },
  {
    id: 2,
    name: '血煞魔洞',
    description: '魔气缭绕之地，魔物横行',
    background: 0x4a148c,
    requiredLevel: 2,
    enemies: [
      createEnemy('demon', '血魔', 200, 30, 10, 40, 60, 0xef5350, 44),
      createEnemy('bat', '暗影蝠', 120, 35, 5, 30, 45, 0xab47bc, 38)
    ],
    rewards: { gold: 100, exp: 80, spirit: 10 }
  },
  {
    id: 3,
    name: '九幽深渊',
    description: '传说中的阴邪之地，危险重重',
    background: 0x0d47a1,
    requiredLevel: 4,
    enemies: [
      createEnemy('ghost', '怨灵', 350, 45, 15, 70, 100, 0x7e57c2, 48),
      createEnemy('skeleton', '骷髅战将', 400, 50, 20, 80, 120, 0xe0e0e0, 52)
    ],
    rewards: { gold: 200, exp: 150, spirit: 20 }
  },
  {
    id: 4,
    name: '焚天熔岩',
    description: '上古火神陨落之地，酷热难当',
    background: 0xbf360c,
    requiredLevel: 7,
    enemies: [
      createEnemy('fire_demon', '炎魔', 600, 70, 25, 120, 180, 0xff7043, 56),
      createEnemy('lava_beast', '熔岩巨兽', 800, 60, 35, 150, 220, 0xb71c1c, 60)
    ],
    rewards: { gold: 350, exp: 280, spirit: 35 }
  },
  {
    id: 5,
    name: '天外魔境',
    description: '终极试炼之地，传说有天魔镇守',
    background: 0x1a0033,
    requiredLevel: 10,
    enemies: [
      createEnemy('demon_lord', '天魔使者', 1200, 100, 50, 300, 500, 0x880e4f, 68),
      createEnemy('dark_dragon', '魔龙', 1500, 120, 60, 400, 700, 0x4a148c, 72)
    ],
    rewards: { gold: 800, exp: 600, spirit: 80 }
  }
]

export const OPENING_DIALOGUES = [
  { speaker: '旁白', text: '天地初开，混沌初分，三界之内，仙魔纷争不休...', color: 0xb0bec5 },
  { speaker: '旁白', text: '传闻上古之时，有一剑仙，御剑九天，斩妖除魔，威震寰宇。', color: 0xb0bec5 },
  { speaker: '剑仙', text: '贫道御剑青冥间，斩尽妖邪济苍生。', color: 0x4fc3f7 },
  { speaker: '旁白', text: '然而千年已过，魔气复苏，封印松动，天下又将大乱...', color: 0xb0bec5 },
  { speaker: '师尊', text: '徒儿，你我修仙一脉，代代守护苍生。如今魔气再起，是你下山历练的时候了。', color: 0x81c784 },
  { speaker: '剑仙', text: '弟子谨遵师命！此去定要斩尽妖魔，还天下一个太平！', color: 0x4fc3f7 },
  { speaker: '旁白', text: '于是，你踏上了御剑修仙的漫漫征途...', color: 0xffeb3b }
]
