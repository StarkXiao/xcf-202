import type { DungeonEvent, DungeonBuff, DungeonBuffType } from '../types'

const createBuff = (
  id: string,
  name: string,
  description: string,
  type: DungeonBuffType,
  value: number,
  icon: string,
  color: number,
  duration: number = 3
): DungeonBuff => ({
  id, name, description, type, value, icon, color, remainingRooms: duration
})

export const DUNGEON_BUFF_TEMPLATES: Omit<DungeonBuff, 'remainingRooms'>[] = [
  {
    id: 'attack_boost_small',
    name: '战意澎湃',
    description: '攻击力+15%',
    type: 'attack',
    value: 0.15,
    icon: '⚔',
    color: 0xef5350
  },
  {
    id: 'attack_boost_large',
    name: '剑心通明',
    description: '攻击力+30%',
    type: 'attack',
    value: 0.30,
    icon: '🗡',
    color: 0xff5722
  },
  {
    id: 'defense_boost_small',
    name: '金刚护体',
    description: '防御力+20%',
    type: 'defense',
    value: 0.20,
    icon: '🛡',
    color: 0x42a5f5
  },
  {
    id: 'defense_boost_large',
    name: '玄龟护盾',
    description: '防御力+40%',
    type: 'defense',
    value: 0.40,
    icon: '🔰',
    color: 0x1e88e5
  },
  {
    id: 'health_boost',
    name: '生命涌泉',
    description: '生命上限+25%',
    type: 'maxHealth',
    value: 0.25,
    icon: '❤',
    color: 0xe53935
  },
  {
    id: 'crit_rate_boost',
    name: '天眼通',
    description: '暴击率+20%',
    type: 'critRate',
    value: 0.20,
    icon: '👁',
    color: 0xffc107
  },
  {
    id: 'crit_damage_boost',
    name: '破甲一击',
    description: '暴击伤害+50%',
    type: 'critDamage',
    value: 0.50,
    icon: '💥',
    color: 0xff9800
  },
  {
    id: 'mana_regen',
    name: '灵气流转',
    description: '每回合额外回复法力',
    type: 'manaRegen',
    value: 10,
    icon: '💧',
    color: 0x00bcd4
  }
]

export const DUNGEON_EVENTS: DungeonEvent[] = [
  {
    id: 'ancient_chest',
    name: '远古宝箱',
    description: '你发现了一个尘封千年的宝箱，上面刻满了神秘的符文...',
    icon: '📦',
    color: 0xffc107,
    choices: [
      {
        id: 'open_carefully',
        text: '小心翼翼地开启',
        description: '仔细观察符文，慢慢打开',
        successRate: 0.8,
        successRewards: { gold: 200, spirit: 30, exp: 50 },
        failPenalty: { healthDamage: 20 },
        successText: '宝箱内的宝物尽收囊中！',
        failText: '机关触发，你被毒针刺伤！'
      },
      {
        id: 'smash_open',
        text: '强行破开',
        description: '用剑直接劈开宝箱',
        successRate: 0.5,
        successRewards: { gold: 350, spirit: 50, exp: 80 },
        failPenalty: { healthDamage: 40, goldLoss: 50 },
        successText: '宝箱被劈开，宝物散发光芒！',
        failText: '宝箱内的自毁装置启动，宝物化为飞灰！'
      },
      {
        id: 'leave_it',
        text: '谨慎离开',
        description: '不冒险，继续前进',
        successRate: 1.0,
        successRewards: { healPercent: 0.1 },
        successText: '你休整片刻，恢复了些许体力。',
        failText: ''
      }
    ]
  },
  {
    id: 'wounded_cultivator',
    name: '受伤的修士',
    description: '一位身受重伤的修士倒在路边，向你求助...',
    icon: '🧙',
    color: 0x81c784,
    choices: [
      {
        id: 'help_heal',
        text: '悉心救治',
        description: '消耗灵气为他疗伤',
        successRate: 0.9,
        successRewards: {
          gold: 100,
          spirit: 20,
          exp: 60,
          buff: createBuff('gratitude_buff', '知恩图报', '攻击力+10%', 'attack', 0.10, '🙏', 0x66bb6a, 4)
        },
        failPenalty: { healthDamage: 15 },
        successText: '修士感激涕零，赠予你谢礼与祝福！',
        failText: '伤势过重，修士不幸离世...'
      },
      {
        id: 'rob_ him',
        text: '趁火打劫',
        description: '夺取他的财物',
        successRate: 0.6,
        successRewards: { gold: 400, spirit: 60 },
        failPenalty: { healthDamage: 50 },
        successText: '你获得了修士的全部财物！',
        failText: '修士临死反扑，与你两败俱伤！'
      },
      {
        id: 'ignore',
        text: '漠然离开',
        description: '不多管闲事',
        successRate: 1.0,
        successRewards: {},
        successText: '你继续前行，不为所动。',
        failText: ''
      }
    ]
  },
  {
    id: 'mystic_spring',
    name: '灵泉秘境',
    description: '一汪散发着七彩光芒的清泉出现在你面前...',
    icon: '⛲',
    color: 0x4dd0e1,
    choices: [
      {
        id: 'drink_deep',
        text: '畅饮灵泉',
        description: '大口饮用灵泉水',
        successRate: 0.7,
        successRewards: {
          healPercent: 0.5,
          buff: createBuff('spirit_blessing', '灵泉祝福', '生命上限+15%', 'maxHealth', 0.15, '💧', 0x4dd0e1, 5)
        },
        failPenalty: { healthDamage: 25 },
        successText: '灵泉之力涌入体内，你感到前所未有的舒畅！',
        failText: '泉水竟然有毒！你感到一阵眩晕...'
      },
      {
        id: 'drink_sip',
        text: '浅尝辄止',
        description: '只喝一小口试试',
        successRate: 0.95,
        successRewards: { healPercent: 0.25, spirit: 40 },
        failPenalty: { healthDamage: 10 },
        successText: '灵泉温和地滋养着你的经脉。',
        failText: '泉水有些许副作用，但无伤大雅。'
      },
      {
        id: 'collect_water',
        text: '收集灵泉',
        description: '将灵泉水装入容器',
        successRate: 0.85,
        successRewards: { gold: 150, spirit: 80, exp: 30 },
        failPenalty: { goldLoss: 30 },
        successText: '灵泉水价值连城，你装满了所有容器！',
        failText: '灵泉突然消散，你一无所获。'
      }
    ]
  },
  {
    id: 'demon_seal',
    name: '上古封印',
    description: '一座古老的封印阵隐隐颤动，似乎有什么东西想要破封而出...',
    icon: '🔮',
    color: 0xba68c8,
    choices: [
      {
        id: 'reinforce_seal',
        text: '加固封印',
        description: '注入灵力加强封印',
        successRate: 0.75,
        successRewards: {
          exp: 100,
          spirit: 50,
          buff: createBuff('merit_buff', '功德护体', '防御力+25%', 'defense', 0.25, '✨', 0xba68c8, 4)
        },
        failPenalty: { healthDamage: 35 },
        successText: '封印稳固，天地间的功德降临于你！',
        failText: '封印反噬，魔气侵入你的经脉！'
      },
      {
        id: 'break_seal',
        text: '破坏封印',
        description: '看看里面有什么宝物',
        successRate: 0.35,
        successRewards: { gold: 800, spirit: 150, exp: 200 },
        failPenalty: { healthDamage: 60 },
        successText: '封印破开，上古神器的碎片被你获得！',
        failText: '远古巨魔破封而出，重创了你！'
      },
      {
        id: 'study_seal',
        text: '研究阵法',
        description: '仔细观察封印的符文',
        successRate: 0.6,
        successRewards: {
          exp: 80,
          buff: createBuff('seal_insight', '阵道感悟', '暴击率+15%', 'critRate', 0.15, '📜', 0x9575cd, 3)
        },
        failPenalty: {},
        successText: '你领悟了上古阵法的奥秘！',
        failText: '符文太过深奥，你一无所获。'
      }
    ]
  },
  {
    id: 'ghost_torch',
    name: '鬼市交易',
    description: '一位身披黑袍的神秘商人向你招手，他的摊位上摆满了奇异的物品...',
    icon: '🏮',
    color: 0xff7043,
    choices: [
      {
        id: 'buy_weapon',
        text: '购买神兵',
        description: '花费金币购买传说武器',
        successRate: 0.65,
        successRewards: {
          gold: 0,
          buff: createBuff('ghost_weapon', '幽冥利刃', '攻击力+20%', 'attack', 0.20, '⚔', 0xff7043, 5)
        },
        failPenalty: { goldLoss: 150 },
        successText: '这把武器散发着诡异的光芒，确实不凡！',
        failText: '商人消失了，只留下一把破铜烂铁...'
      },
      {
        id: 'buy_pill',
        text: '购买仙丹',
        description: '购买传说中的九转金丹',
        successRate: 0.7,
        successRewards: {
          healPercent: 0.8,
          exp: 120,
          buff: createBuff('pill_power', '药力加持', '暴击伤害+30%', 'critDamage', 0.30, '💊', 0xff8a65, 4)
        },
        failPenalty: { goldLoss: 100, healthDamage: 15 },
        successText: '仙丹入口即化，药力直冲云霄！',
        failText: '这是假药！你感到一阵恶心...'
      },
      {
        id: 'gamble',
        text: '赌一把',
        description: '与商人对赌',
        successRate: 0.5,
        successRewards: { gold: 500, spirit: 100 },
        failPenalty: { goldLoss: 200 },
        successText: '你赢了！商人的脸色很难看...',
        failText: '你输了，金币被商人收走。'
      },
      {
        id: 'leave',
        text: '不做交易',
        description: '谨慎离开',
        successRate: 1.0,
        successRewards: {},
        successText: '你拒绝了诱惑，继续前行。',
        failText: ''
      }
    ]
  },
  {
    id: 'sword_tomb',
    name: '万剑之冢',
    description: '无数柄古剑插在地上，发出幽幽的剑鸣...',
    icon: '⚔',
    color: 0x78909c,
    choices: [
      {
        id: 'draw_sword',
        text: '拔剑试炼',
        description: '尝试拔出一柄古剑',
        successRate: 0.45,
        successRewards: {
          exp: 150,
          buff: createBuff('sword_spirit', '剑魂附体', '攻击力+25%', 'attack', 0.25, '⚔', 0x546e7a, 5)
        },
        failPenalty: { healthDamage: 30 },
        successText: '古剑认可了你，剑魂与你融为一体！',
        failText: '古剑发出悲鸣，剑气反噬于你！'
      },
      {
        id: 'meditate',
        text: '悟剑静坐',
        description: '在剑冢中领悟剑道',
        successRate: 0.8,
        successRewards: {
          exp: 80,
          buff: createBuff('sword_understanding', '剑意通明', '暴击率+10%，暴击伤害+20%', 'critRate', 0.10, '📖', 0x90a4ae, 4)
        },
        failPenalty: {},
        successText: '你领悟了万千剑修的心得！',
        failText: '剑意繁杂，你无法领悟精髓。'
      },
      {
        id: 'collect_scrap',
        text: '收集残片',
        description: '拾取古剑的碎片',
        successRate: 0.9,
        successRewards: { gold: 250, spirit: 60 },
        failPenalty: {},
        successText: '这些碎片价值不菲！',
        failText: '碎片化为飞灰...'
      }
    ]
  }
]

export const DUNGEON_FLOOR_NAMES = [
  '秘境入口 · 迷雾密林',
  '第二层 · 幽暗洞窟',
  '第三层 · 熔岩深渊',
  '第四层 · 冰封禁地',
  '第五层 · 天魔祭坛'
]

export const DUNGEON_FLOOR_COLORS = [
  0x1b5e20,
  0x311b92,
  0xbf360c,
  0x01579b,
  0x4a0072
]

export const ROOM_TYPE_CONFIG: Record<string, { name: string; icon: string; color: number; description: string }> = {
  battle: { name: '妖兽巢穴', icon: '👹', color: 0xef5350, description: '击败妖兽获得奖励' },
  event: { name: '神秘事件', icon: '❓', color: 0xba68c8, description: '随机触发奇遇事件' },
  treasure: { name: '宝藏房间', icon: '💎', color: 0xffc107, description: '获得珍贵宝物' },
  rest: { name: '休息营地', icon: '🔥', color: 0x81c784, description: '恢复生命与法力' },
  shop: { name: '秘境商栈', icon: '🛒', color: 0x42a5f5, description: '购买增益道具' },
  boss: { name: '首领殿堂', icon: '👑', color: 0xff1744, description: '挑战秘境首领' },
  mystery: { name: '未知空间', icon: '🌀', color: 0x9575cd, description: '未知的挑战与机遇' }
}

export function getRandomDungeonEvent(): DungeonEvent {
  return DUNGEON_EVENTS[Math.floor(Math.random() * DUNGEON_EVENTS.length)]
}

export function getRandomBuff(duration: number = 3): DungeonBuff {
  const template = DUNGEON_BUFF_TEMPLATES[Math.floor(Math.random() * DUNGEON_BUFF_TEMPLATES.length)]
  return { ...template, remainingRooms: duration, id: template.id + '_' + Date.now() }
}

export function getBuffDescription(type: DungeonBuffType): string {
  const descriptions: Record<DungeonBuffType, string> = {
    attack: '攻击力',
    defense: '防御力',
    maxHealth: '生命上限',
    critRate: '暴击率',
    critDamage: '暴击伤害',
    manaRegen: '每回合回蓝',
    heal: '生命恢复'
  }
  return descriptions[type]
}
