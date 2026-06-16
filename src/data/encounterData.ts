import type { EncounterEvent } from '../types'

export const ENCOUNTER_EVENTS: EncounterEvent[] = [
  {
    id: 'hermit_gift',
    name: '仙人遗府',
    description: '你在深山中发现一座古老的仙人洞府，洞门微微敞开，灵气从中溢出...',
    icon: '🏛️',
    color: 0x4fc3f7,
    requiredStage: 1,
    isRepeatable: false,
    rarity: 'common',
    dialogues: [
      { speaker: '旁白', text: '雾气缭绕的深山之中，你发现了一座隐藏在瀑布之后的仙人洞府...', color: 0xb0bec5 },
      { speaker: '旁白', text: '洞门微微敞开，灵气如同丝线般从中溢出，令你心神一震。', color: 0xb0bec5 },
      { speaker: '剑仙', text: '此洞府灵气充沛，定有大机缘！但也不可大意...', color: 0x4fc3f7 }
    ],
    choices: [
      {
        text: '直接闯入洞府',
        successRate: 0.6,
        rewards: [
          { type: 'exp', value: 80 },
          { type: 'gold', value: 200 },
          { type: 'spirit', value: 30 }
        ],
        failRewards: [
          { type: 'maxHealth', value: -20 }
        ],
        resultText: '你在洞府中找到了上古修士的遗物，收获颇丰！',
        failText: '洞府中机关重重，你被暗器所伤，仓皇退出...'
      },
      {
        text: '仔细观察后谨慎进入',
        successRate: 0.85,
        rewards: [
          { type: 'exp', value: 50 },
          { type: 'gold', value: 120 },
          { type: 'spirit', value: 15 }
        ],
        failRewards: [],
        resultText: '你小心翼翼地探查洞府，安然无恙地获取了一些修炼资源。',
        failText: '虽然小心谨慎，但洞府中的禁制还是让你吃了点亏，不过并无大碍。'
      }
    ]
  },
  {
    id: 'spirit_well',
    name: '灵泉仙井',
    description: '一道灵光从地面涌出，灵泉之水蕴含天地精华...',
    icon: '💧',
    color: 0x00bcd4,
    requiredStage: 1,
    isRepeatable: true,
    rarity: 'common',
    dialogues: [
      { speaker: '旁白', text: '行至半山腰，你发现一股清泉从石缝中涌出，泉水晶莹剔透，散发淡淡灵光。', color: 0xb0bec5 },
      { speaker: '旁白', text: '这便是传说中的灵泉仙井，饮之可洗涤经脉、增益修为。', color: 0xb0bec5 },
      { speaker: '剑仙', text: '灵泉仙井！机不可失，但此泉似乎已有灵兽守护...', color: 0x4fc3f7 }
    ],
    choices: [
      {
        text: '直接饮用灵泉',
        successRate: 0.5,
        rewards: [
          { type: 'maxHealth', value: 30 },
          { type: 'maxMana', value: 20 },
          { type: 'exp', value: 60 }
        ],
        failRewards: [
          { type: 'maxHealth', value: -15 }
        ],
        resultText: '灵泉入体，经脉畅通，修为大增！',
        failText: '灵泉旁的守护灵兽发现了你，将你击退...'
      },
      {
        text: '先以灵力试探',
        successRate: 0.8,
        rewards: [
          { type: 'maxHealth', value: 15 },
          { type: 'exp', value: 30 }
        ],
        failRewards: [],
        resultText: '你小心地引灵泉入体，获得了一部分灵泉之力。',
        failText: '灵泉之力过于霸道，你只吸收了少许便不得不停止。'
      }
    ]
  },
  {
    id: 'demonic_pact',
    name: '魔道交易',
    description: '一位神秘的魔修出现在你面前，提出一个诱人的交易...',
    icon: '👹',
    color: 0xef5350,
    requiredStage: 2,
    isRepeatable: true,
    rarity: 'rare',
    dialogues: [
      { speaker: '旁白', text: '夜色降临，一道黑影从虚空中走出，周身魔气缭绕。', color: 0xb0bec5 },
      { speaker: '魔修', text: '小修士，我观你根骨不凡，不如与我做一笔交易如何？', color: 0xef5350 },
      { speaker: '魔修', text: '我可以传授你强横的功法，不过...代价嘛，你得付出一些东西。', color: 0xef5350 },
      { speaker: '剑仙', text: '魔道中人不可轻信，但其中或许有转机...', color: 0x4fc3f7 }
    ],
    choices: [
      {
        text: '接受魔修的交易',
        successRate: 0.4,
        rewards: [
          { type: 'attack', value: 15 },
          { type: 'defense', value: 10 },
          { type: 'exp', value: 120 }
        ],
        failRewards: [
          { type: 'defense', value: -10 },
          { type: 'maxHealth', value: -30 }
        ],
        resultText: '魔修信守承诺，传授了你一门霸道功法，实力大增！',
        failText: '交易是骗局！魔修暗施毒手，你的修为受到了侵蚀...'
      },
      {
        text: '拒绝并驱逐魔修',
        successRate: 0.9,
        rewards: [
          { type: 'exp', value: 40 },
          { type: 'spirit', value: 20 }
        ],
        failRewards: [
          { type: 'maxHealth', value: -10 }
        ],
        resultText: '你正气凛然地驱逐了魔修，道心更加坚定，修为精进！',
        failText: '魔修临走前偷袭了你一掌，不过伤势不重。'
      }
    ]
  },
  {
    id: 'ancient_sword',
    name: '古剑认主',
    description: '一柄蒙尘的古剑突然发出剑鸣，似乎在呼唤有缘人...',
    icon: '⚔️',
    color: 0xffd54f,
    requiredStage: 3,
    isRepeatable: false,
    rarity: 'rare',
    dialogues: [
      { speaker: '旁白', text: '行至一处荒废的剑冢，万剑插地，剑气纵横。', color: 0xb0bec5 },
      { speaker: '旁白', text: '忽有一柄蒙尘古剑发出清越剑鸣，剑身震动不已，似在呼唤主人。', color: 0xb0bec5 },
      { speaker: '古剑之灵', text: '千载悠悠，终待有缘人...你，可愿执我？', color: 0xffd54f },
      { speaker: '剑仙', text: '这柄剑灵气非凡，或可助我斩妖除魔！', color: 0x4fc3f7 }
    ],
    choices: [
      {
        text: '以精血祭炼古剑',
        successRate: 0.5,
        rewards: [
          { type: 'attack', value: 25 },
          { type: 'maxMana', value: 30 },
          { type: 'exp', value: 150 }
        ],
        failRewards: [
          { type: 'maxHealth', value: -40 }
        ],
        resultText: '古剑认你为主，剑灵苏醒，你的剑道修为突飞猛进！',
        failText: '精血祭炼失败，古剑反噬，你的元气大伤...'
      },
      {
        text: '以灵力温养古剑',
        successRate: 0.75,
        rewards: [
          { type: 'attack', value: 12 },
          { type: 'exp', value: 80 }
        ],
        failRewards: [
          { type: 'spirit', value: -10 }
        ],
        resultText: '你以灵力温养古剑，剑灵缓缓苏醒，赋予你部分剑意。',
        failText: '灵力不足，古剑未能完全苏醒，但你也略有收获。'
      }
    ]
  },
  {
    id: 'celestial_trial',
    name: '天劫试炼',
    description: '天地之间突然雷云密布，一道天劫降临在你头顶...',
    icon: '⚡',
    color: 0xffeb3b,
    requiredStage: 4,
    isRepeatable: true,
    rarity: 'epic',
    dialogues: [
      { speaker: '旁白', text: '修炼途中，天色骤变，滚滚雷云在头顶汇聚，电光闪烁。', color: 0xb0bec5 },
      { speaker: '旁白', text: '这是修仙者必定要面对的天劫！渡过则脱胎换骨，失败则形神俱灭。', color: 0xb0bec5 },
      { speaker: '师尊', text: '徒儿，天劫乃天地对修士的考验，心志坚者方能渡过！', color: 0x81c784 },
      { speaker: '剑仙', text: '我修道之心坚如磐石，区区天劫，何足惧哉！', color: 0x4fc3f7 }
    ],
    choices: [
      {
        text: '正面迎接天劫',
        successRate: 0.35,
        rewards: [
          { type: 'attack', value: 20 },
          { type: 'defense', value: 20 },
          { type: 'maxHealth', value: 50 },
          { type: 'maxMana', value: 40 },
          { type: 'exp', value: 300 }
        ],
        failRewards: [
          { type: 'maxHealth', value: -60 },
          { type: 'attack', value: -10 }
        ],
        resultText: '天雷洗体，你浴火重生，修为暴增，脱胎换骨！',
        failText: '天劫之力远超你的承受极限，你身受重伤...'
      },
      {
        text: '布阵抵御天劫',
        successRate: 0.65,
        rewards: [
          { type: 'defense', value: 15 },
          { type: 'maxHealth', value: 25 },
          { type: 'exp', value: 150 }
        ],
        failRewards: [
          { type: 'maxHealth', value: -25 }
        ],
        resultText: '你以阵法化解天劫之力，虽未完全渡过，但修为也有不小的提升。',
        failText: '阵法在天劫面前不堪一击，你受到了一定损伤。'
      }
    ]
  },
  {
    id: 'dragon_vein',
    name: '龙脉觉醒',
    description: '大地震动，一条远古龙脉在你脚下苏醒...',
    icon: '🐉',
    color: 0xff7043,
    requiredStage: 4,
    isRepeatable: false,
    rarity: 'epic',
    dialogues: [
      { speaker: '旁白', text: '大地突然剧烈震动，一道金光从地底涌出，龙吟之声响彻天地。', color: 0xb0bec5 },
      { speaker: '旁白', text: '远古龙脉苏醒！龙脉之中蕴含的天地之力，足以让任何修士脱胎换骨。', color: 0xb0bec5 },
      { speaker: '龙脉之灵', text: '渺小的修士，你竟敢踏入吾之领域...不过，吾感受到了你的剑心。', color: 0xff7043 },
      { speaker: '剑仙', text: '前辈恕罪，晚辈并无冒犯之意，只是机缘巧合来到此地。', color: 0x4fc3f7 },
      { speaker: '龙脉之灵', text: '既然有缘，吾便给你一个选择...', color: 0xff7043 }
    ],
    choices: [
      {
        text: '请求龙脉传承',
        successRate: 0.3,
        rewards: [
          { type: 'attack', value: 35 },
          { type: 'defense', value: 25 },
          { type: 'maxHealth', value: 80 },
          { type: 'maxMana', value: 50 },
          { type: 'exp', value: 500 }
        ],
        failRewards: [
          { type: 'maxHealth', value: -80 },
          { type: 'defense', value: -15 }
        ],
        resultText: '龙脉之灵认可了你的剑心，将远古龙力传承于你，你获得了龙脉之力！',
        failText: '龙脉之力太过霸道，你的经脉难以承受，遭受了严重反噬...'
      },
      {
        text: '与龙脉之灵论道',
        successRate: 0.7,
        rewards: [
          { type: 'exp', value: 200 },
          { type: 'spirit', value: 50 },
          { type: 'attack', value: 10 }
        ],
        failRewards: [
          { type: 'maxHealth', value: -20 }
        ],
        resultText: '你与龙脉之灵论道三日三夜，悟得天地至理，修为精进不少。',
        failText: '论道中你险些迷失在龙脉之意境中，好在及时醒悟。'
      }
    ]
  },
  {
    id: 'immortal_tea',
    name: '仙茶论道',
    description: '一位白发老者邀你品茶论道，茶香四溢，暗含玄机...',
    icon: '🍵',
    color: 0x81c784,
    requiredStage: 2,
    isRepeatable: true,
    rarity: 'common',
    dialogues: [
      { speaker: '旁白', text: '山间凉亭中，一位白发老者正在烹茶，茶香随风飘来，令人神清气爽。', color: 0xb0bec5 },
      { speaker: '老者', text: '小友有缘，不若坐下来品一杯仙茶，聊聊修行之道？', color: 0x81c784 },
      { speaker: '剑仙', text: '前辈盛情，晚辈恭敬不如从命。', color: 0x4fc3f7 }
    ],
    choices: [
      {
        text: '虚心请教修炼之道',
        successRate: 0.9,
        rewards: [
          { type: 'exp', value: 60 },
          { type: 'spirit', value: 15 }
        ],
        failRewards: [],
        resultText: '老者对你谦逊的态度十分欣赏，指点了不少修行窍门，你受益匪浅。',
        failText: '虽然未能完全领悟老者的指点，但也有所收获。'
      },
      {
        text: '与老者辩论大道',
        successRate: 0.5,
        rewards: [
          { type: 'exp', value: 120 },
          { type: 'maxMana', value: 20 }
        ],
        failRewards: [
          { type: 'spirit', value: -10 }
        ],
        resultText: '你的见解令老者刮目相看，他倾囊相授，你顿悟大道！',
        failText: '你的见解尚浅，辩论中落了下风，不过也学到了不少。'
      }
    ]
  },
  {
    id: 'phoenix_feather',
    name: '凤凰涅槃',
    description: '一只浴火重生的凤凰出现在你面前，留下了一根尾羽...',
    icon: '🔥',
    color: 0xff5722,
    requiredStage: 5,
    isRepeatable: false,
    rarity: 'legendary',
    dialogues: [
      { speaker: '旁白', text: '天际突然燃起熊熊烈火，一只浑身烈焰的凤凰从火海中展翅而出！', color: 0xb0bec5 },
      { speaker: '旁白', text: '凤凰浴火涅槃，天地为之变色，万物为之震动。', color: 0xb0bec5 },
      { speaker: '凤凰', text: '千年一涅槃，万载一重生。有缘人，吾留下一根尾羽，望你善用。', color: 0xff5722 },
      { speaker: '旁白', text: '凤凰尾羽蕴含涅槃之力，但使用不当可能遭受反噬...', color: 0xb0bec5 }
    ],
    choices: [
      {
        text: '直接吸收凤凰尾羽之力',
        successRate: 0.25,
        rewards: [
          { type: 'attack', value: 40 },
          { type: 'defense', value: 30 },
          { type: 'maxHealth', value: 100 },
          { type: 'maxMana', value: 60 },
          { type: 'exp', value: 800 }
        ],
        failRewards: [
          { type: 'maxHealth', value: -100 },
          { type: 'attack', value: -20 },
          { type: 'defense', value: -15 }
        ],
        resultText: '涅槃之力注入你体内，你如凤凰般浴火重生，实力暴涨！',
        failText: '涅槃之力太过狂暴，你的经脉几乎崩碎，修为大损...'
      },
      {
        text: '炼化凤凰尾羽',
        successRate: 0.6,
        rewards: [
          { type: 'attack', value: 20 },
          { type: 'maxHealth', value: 50 },
          { type: 'exp', value: 300 }
        ],
        failRewards: [
          { type: 'maxHealth', value: -40 }
        ],
        resultText: '你小心炼化凤凰尾羽，成功汲取了部分涅槃之力，实力大增！',
        failText: '炼化过程中尾羽之力失控，你受到了灼伤。'
      }
    ]
  },
  {
    id: 'mirror_realm',
    name: '镜中幻境',
    description: '一面古镜映照出另一个自己，那个你似乎更加强大...',
    icon: '🪞',
    color: 0xba68c8,
    requiredStage: 3,
    isRepeatable: true,
    rarity: 'rare',
    dialogues: [
      { speaker: '旁白', text: '你在一处废墟中发现了一面古老的铜镜，镜中映照出一个与你一模一样的人影。', color: 0xb0bec5 },
      { speaker: '镜中人', text: '我是你，也不是你。我是你内心深处的另一种可能...', color: 0xba68c8 },
      { speaker: '镜中人', text: '来吧，战胜我，你便能得到真正的力量。败给我，你将失去一切。', color: 0xba68c8 },
      { speaker: '剑仙', text: '心魔？还是另一个我？不管是什么，我不会退缩！', color: 0x4fc3f7 }
    ],
    choices: [
      {
        text: '与镜中自己战斗',
        successRate: 0.45,
        rewards: [
          { type: 'attack', value: 18 },
          { type: 'defense', value: 12 },
          { type: 'exp', value: 200 }
        ],
        failRewards: [
          { type: 'attack', value: -8 },
          { type: 'maxHealth', value: -30 }
        ],
        resultText: '你战胜了镜中的自己，打破了心魔，剑道更上一层楼！',
        failText: '你败给了镜中的自己，心神受损，修为倒退...'
      },
      {
        text: '与镜中自己和解',
        successRate: 0.7,
        rewards: [
          { type: 'exp', value: 100 },
          { type: 'spirit', value: 30 },
          { type: 'maxMana', value: 15 }
        ],
        failRewards: [
          { type: 'spirit', value: -15 }
        ],
        resultText: '你接纳了另一个自己，心境圆满，修为自然精进！',
        failText: '和解并不容易，你的心绪仍有波动，但已有所悟。'
      }
    ]
  },
  {
    id: 'star_fall',
    name: '星辰坠落',
    description: '一颗陨星从天而降，其中似乎蕴含着星辰之力...',
    icon: '🌠',
    color: 0x7e57c2,
    requiredStage: 5,
    isRepeatable: true,
    rarity: 'epic',
    dialogues: [
      { speaker: '旁白', text: '夜空中一道耀眼的光芒划过天际，一颗陨星坠落在你不远处！', color: 0xb0bec5 },
      { speaker: '旁白', text: '陨星之上散发着一股玄奥的力量，那是来自九天之上的星辰之力。', color: 0xb0bec5 },
      { speaker: '剑仙', text: '星辰之力...这是千载难逢的机缘！', color: 0x4fc3f7 }
    ],
    choices: [
      {
        text: '强行吸收星辰之力',
        successRate: 0.3,
        rewards: [
          { type: 'attack', value: 30 },
          { type: 'maxMana', value: 50 },
          { type: 'exp', value: 400 }
        ],
        failRewards: [
          { type: 'maxHealth', value: -70 },
          { type: 'maxMana', value: -20 }
        ],
        resultText: '你成功吸收了星辰之力，体内蕴含了一颗星辰的磅礴能量！',
        failText: '星辰之力太过狂暴，你的经脉遭受了严重创伤...'
      },
      {
        text: '引星辰之力入体修炼',
        successRate: 0.7,
        rewards: [
          { type: 'exp', value: 180 },
          { type: 'maxMana', value: 25 },
          { type: 'spirit', value: 40 }
        ],
        failRewards: [
          { type: 'maxHealth', value: -20 }
        ],
        resultText: '你引导星辰之力缓缓入体，修为稳步提升，体内多了几分星辉。',
        failText: '修炼中途有些岔气，不过总体收获还是不错的。'
      }
    ]
  }
]

export const ENCOUNTER_RARITY_WEIGHTS: Record<string, number> = {
  common: 50,
  rare: 30,
  epic: 15,
  legendary: 5
}

export const ENCOUNTER_RARITY_COLORS: Record<string, number> = {
  common: 0x78909c,
  rare: 0x4fc3f7,
  epic: 0xba68c8,
  legendary: 0xffd54f
}

export const DAILY_ENCOUNTER_LIMIT = 5
