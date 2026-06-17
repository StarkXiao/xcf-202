import type { Chapter, ChapterLevel, StoryDialogue, ChapterReward } from '../types'

const createDialogue = (speaker: string, text: string, color: number, avatar?: string): StoryDialogue => ({
  speaker, text, color, avatar
})

const createReward = (type: ChapterReward['type'], value: number, itemId?: string, itemName?: string): ChapterReward => ({
  type, value, itemId, itemName
})

const createLevel = (
  id: string,
  name: string,
  description: string,
  type: ChapterLevel['type'],
  position: { x: number; y: number },
  requiredLevel: number,
  rewards: ChapterReward[],
  options: { stageId?: number; storyDialogues?: StoryDialogue[] } = {}
): ChapterLevel => ({
  id,
  name,
  description,
  type,
  position,
  requiredLevel,
  rewards,
  isUnlocked: false,
  isCompleted: false,
  ...options
})

export const CHAPTERS: Chapter[] = [
  {
    id: 'chapter_1',
    name: '第一章 · 初入仙途',
    description: '你踏上修仙之路，在青冥山谷中历练成长',
    chapterNumber: 1,
    icon: '🌄',
    color: 0x4fc3f7,
    backgroundColor: 0x1a237e,
    status: 'unlocked',
    unlockRequirement: { type: 'stage', value: 0 },
    openingStory: [
      createDialogue('旁白', '天地初开，混沌初分，三界之内，仙魔纷争不休...', 0xb0bec5),
      createDialogue('旁白', '传闻上古之时，有一剑仙，御剑九天，斩妖除魔，威震寰宇。', 0xb0bec5),
      createDialogue('剑仙', '贫道御剑青冥间，斩尽妖邪济苍生。', 0x4fc3f7, '⚔'),
      createDialogue('旁白', '然而千年已过，魔气复苏，封印松动，天下又将大乱...', 0xb0bec5),
      createDialogue('师尊', '徒儿，你我修仙一脉，代代守护苍生。如今魔气再起，是你下山历练的时候了。', 0x81c784, '👴'),
      createDialogue('剑仙', '弟子谨遵师命！此去定要斩尽妖魔，还天下一个太平！', 0x4fc3f7, '⚔'),
      createDialogue('旁白', '于是，你踏上了御剑修仙的漫漫征途...', 0xffd54f)
    ],
    closingStory: [
      createDialogue('旁白', '青冥山谷的妖兽已被你尽数清除...', 0xb0bec5),
      createDialogue('师尊', '徒儿做得好！短短时日，你的修为竟有如此进境！', 0x81c784, '👴'),
      createDialogue('剑仙', '全赖师尊教导有方。', 0x4fc3f7, '⚔'),
      createDialogue('师尊', '如今你已筑基有成，是时候前往更危险的地方历练了。', 0x81c784, '👴'),
      createDialogue('师尊', '传说血煞魔洞封印着上古血魔，近来似有异动...', 0x81c784, '👴'),
      createDialogue('剑仙', '弟子愿往！', 0x4fc3f7, '⚔'),
      createDialogue('旁白', '第一章 · 初入仙途 完成！', 0xffd54f)
    ],
    levels: [
      createLevel('ch1_level1', '启程', '初入仙途，在山谷中遇到第一只妖兽', 'story', { x: 150, y: 200 }, 1, [createReward('exp', 30), createReward('gold', 50)], {
        storyDialogues: [
          createDialogue('旁白', '你来到了青冥山谷的入口...', 0xb0bec5),
          createDialogue('剑仙', '这里就是师尊所说的历练之地吗？', 0x4fc3f7, '⚔'),
          createDialogue('旁白', '突然，一只幽狼从草丛中扑了出来！', 0xef5350),
          createDialogue('剑仙', '来得好！正好试试我的御剑之术！', 0x4fc3f7, '⚔')
        ]
      }),
      createLevel('ch1_level2', '幽谷狼影', '击败拦路的幽狼群', 'battle', { x: 280, y: 280 }, 1, [createReward('exp', 50), createReward('gold', 80)], {
        stageId: 1
      }),
      createLevel('ch1_level3', '青蛇出没', '在密林深处遭遇青蛇', 'battle', { x: 400, y: 220 }, 2, [createReward('exp', 60), createReward('gold', 100), createReward('spirit', 10)], {
        stageId: 1
      }),
      createLevel('ch1_level4', '神秘老者', '遇到一位神秘老者指点', 'story', { x: 520, y: 320 }, 2, [createReward('exp', 40), createReward('spirit', 20)], {
        storyDialogues: [
          createDialogue('旁白', '你在山谷深处遇到一位白发老者...', 0xb0bec5),
          createDialogue('神秘老者', '小友，你与我有缘。', 0xffd54f, '🧙'),
          createDialogue('剑仙', '前辈是？', 0x4fc3f7, '⚔'),
          createDialogue('神秘老者', '不必问我是谁，这缕灵气赠予你，望你好生修炼，守护苍生。', 0xffd54f, '🧙'),
          createDialogue('旁白', '老者化作一道金光消散，只留下一股精纯的灵气...', 0xb0bec5)
        ]
      }),
      createLevel('ch1_level5', '谷主之怒', '青冥谷主现身', 'boss', { x: 650, y: 250 }, 3, [createReward('exp', 100), createReward('gold', 200), createReward('spirit', 30)], {
        stageId: 2
      })
    ],
    completionRewards: [
      createReward('gold', 500),
      createReward('spirit', 100),
      createReward('exp', 200),
      createReward('attack', 10)
    ]
  },
  {
    id: 'chapter_2',
    name: '第二章 · 血煞魔洞',
    description: '深入魔气缭绕的洞穴，探索血魔的踪迹',
    chapterNumber: 2,
    icon: '👹',
    color: 0xef5350,
    backgroundColor: 0x4a148c,
    status: 'locked',
    unlockRequirement: { type: 'chapter', value: 1 },
    openingStory: [
      createDialogue('旁白', '你来到了血煞魔洞的入口...', 0xb0bec5),
      createDialogue('剑仙', '好重的魔气！看来师尊所言非虚。', 0x4fc3f7, '⚔'),
      createDialogue('旁白', '洞口阴风阵阵，隐约传来诡异的咆哮声...', 0xef5350),
      createDialogue('剑仙', '无论前方有何等危险，我都要进去一探究竟！', 0x4fc3f7, '⚔')
    ],
    closingStory: [
      createDialogue('旁白', '血魔被你再次封印，魔洞恢复了平静...', 0xb0bec5),
      createDialogue('师尊', '好徒儿！你竟能封印血魔，真是为师大为惊喜！', 0x81c784, '👴'),
      createDialogue('剑仙', '侥幸而已，若不是前辈指点，弟子恐怕难以成功。', 0x4fc3f7, '⚔'),
      createDialogue('师尊', '你已凝结金丹，接下来可以去更广阔的天地历练了。', 0x81c784, '👴'),
      createDialogue('师尊', '九幽深渊据说有上古遗迹出世...', 0x81c784, '👴'),
      createDialogue('剑仙', '弟子明白！', 0x4fc3f7, '⚔'),
      createDialogue('旁白', '第二章 · 血煞魔洞 完成！', 0xffd54f)
    ],
    levels: [
      createLevel('ch2_level1', '魔洞初探', '进入血煞魔洞外围', 'story', { x: 180, y: 180 }, 4, [createReward('exp', 60), createReward('gold', 100)], {
        storyDialogues: [
          createDialogue('旁白', '你踏入了血煞魔洞...', 0xb0bec5),
          createDialogue('剑仙', '这里的魔气竟然能影响我的心神！', 0x4fc3f7, '⚔'),
          createDialogue('旁白', '几只血魔从阴影中现身！', 0xef5350),
          createDialogue('剑仙', '邪魔外道，看剑！', 0x4fc3f7, '⚔')
        ]
      }),
      createLevel('ch2_level2', '血魔围堵', '击败拦路的血魔', 'battle', { x: 320, y: 280 }, 4, [createReward('exp', 80), createReward('gold', 150), createReward('spirit', 20)], {
        stageId: 2
      }),
      createLevel('ch2_level3', '暗影蝠群', '躲避暗影蝠群的攻击', 'battle', { x: 450, y: 200 }, 5, [createReward('exp', 100), createReward('gold', 180), createReward('spirit', 25)], {
        stageId: 2
      }),
      createLevel('ch2_level4', '魔洞秘辛', '发现血魔的秘密', 'story', { x: 580, y: 300 }, 5, [createReward('exp', 80), createReward('spirit', 40)], {
        storyDialogues: [
          createDialogue('旁白', '你在魔洞深处发现了一座古老的祭坛...', 0xb0bec5),
          createDialogue('剑仙', '这是...上古封印？', 0x4fc3f7, '⚔'),
          createDialogue('旁白', '祭坛上刻满了神秘的符文，中央有一颗跳动的血红色心脏。', 0xef5350),
          createDialogue('神秘声音', '小辈...你来了...', 0xba68c8),
          createDialogue('剑仙', '谁在说话！', 0x4fc3f7, '⚔'),
          createDialogue('神秘声音', '我是这封印的守护者...血魔即将破封...你必须...阻止他...', 0xba68c8),
          createDialogue('旁白', '声音渐渐消散，只留下一股精纯的灵力涌入你的体内...', 0xb0bec5)
        ]
      }),
      createLevel('ch2_level5', '血魔觉醒', '血魔破封而出', 'boss', { x: 720, y: 230 }, 6, [createReward('exp', 200), createReward('gold', 400), createReward('spirit', 60)], {
        stageId: 3
      })
    ],
    completionRewards: [
      createReward('gold', 1000),
      createReward('spirit', 200),
      createReward('exp', 400),
      createReward('defense', 15)
    ]
  },
  {
    id: 'chapter_3',
    name: '第三章 · 九幽深渊',
    description: '探索阴邪之地的上古遗迹',
    chapterNumber: 3,
    icon: '💀',
    color: 0x7e57c2,
    backgroundColor: 0x0d47a1,
    status: 'locked',
    unlockRequirement: { type: 'chapter', value: 2 },
    openingStory: [
      createDialogue('旁白', '九幽深渊，传说中的阴邪之地...', 0xb0bec5),
      createDialogue('剑仙', '这里的阴气如此浓重，连天空都变成了幽蓝色。', 0x4fc3f7, '⚔'),
      createDialogue('旁白', '远处隐约可见一座古老的遗迹，散发着幽幽的光芒。', 0x7e57c2),
      createDialogue('剑仙', '那就是上古遗迹吗？走，去看看！', 0x4fc3f7, '⚔')
    ],
    closingStory: [
      createDialogue('旁白', '上古遗迹的秘密被你揭开...', 0xb0bec5),
      createDialogue('剑仙', '原来如此...上古剑仙的传承...', 0x4fc3f7, '⚔'),
      createDialogue('旁白', '你获得了上古剑仙的传承，修为大进！', 0xffd54f),
      createDialogue('师尊', '徒儿，你已达到元婴之境！焚天熔岩有火神陨落的传说...', 0x81c784, '👴'),
      createDialogue('剑仙', '弟子这就前往！', 0x4fc3f7, '⚔'),
      createDialogue('旁白', '第三章 · 九幽深渊 完成！', 0xffd54f)
    ],
    levels: [
      createLevel('ch3_level1', '深渊入口', '踏入九幽深渊', 'story', { x: 160, y: 220 }, 7, [createReward('exp', 100), createReward('gold', 150)], {
        storyDialogues: [
          createDialogue('旁白', '你来到了九幽深渊的入口...', 0xb0bec5),
          createDialogue('剑仙', '好强的阴气！我的灵力运转都变慢了。', 0x4fc3f7, '⚔'),
          createDialogue('旁白', '几只怨灵从地底飘出！', 0x7e57c2),
          createDialogue('剑仙', '区区怨灵，也敢挡我！', 0x4fc3f7, '⚔')
        ]
      }),
      createLevel('ch3_level2', '怨灵当道', '驱散拦路的怨灵', 'battle', { x: 300, y: 300 }, 7, [createReward('exp', 120), createReward('gold', 200), createReward('spirit', 30)], {
        stageId: 3
      }),
      createLevel('ch3_level3', '骷髅战将', '击败守护遗迹的骷髅战将', 'battle', { x: 440, y: 220 }, 8, [createReward('exp', 150), createReward('gold', 250), createReward('spirit', 40)], {
        stageId: 3
      }),
      createLevel('ch3_level4', '遗迹入口', '找到上古遗迹的入口', 'story', { x: 580, y: 320 }, 8, [createReward('exp', 120), createReward('spirit', 60)], {
        storyDialogues: [
          createDialogue('旁白', '你终于找到了上古遗迹的入口...', 0xb0bec5),
          createDialogue('剑仙', '这石门上的符文...和血煞魔洞的一模一样！', 0x4fc3f7, '⚔'),
          createDialogue('旁白', '石门缓缓打开，里面传来阵阵剑意...', 0x7e57c2),
          createDialogue('上古剑仙', '千年已过，终于有人来了...', 0xffd54f, '👑'),
          createDialogue('剑仙', '前辈是？', 0x4fc3f7, '⚔'),
          createDialogue('上古剑仙', '我是千年前封印天魔的剑仙...我的传承，就交给你了...', 0xffd54f, '👑'),
          createDialogue('旁白', '一股磅礴的剑意涌入你的体内！', 0xffd54f)
        ]
      }),
      createLevel('ch3_level5', '遗迹守护者', '接受上古剑仙的考验', 'boss', { x: 720, y: 250 }, 9, [createReward('exp', 300), createReward('gold', 600), createReward('spirit', 80)], {
        stageId: 4
      })
    ],
    completionRewards: [
      createReward('gold', 1500),
      createReward('spirit', 300),
      createReward('exp', 600),
      createReward('maxHealth', 100)
    ]
  },
  {
    id: 'chapter_4',
    name: '第四章 · 焚天熔岩',
    description: '上古火神陨落之地，酷热难当',
    chapterNumber: 4,
    icon: '🔥',
    color: 0xff7043,
    backgroundColor: 0xbf360c,
    status: 'locked',
    unlockRequirement: { type: 'chapter', value: 3 },
    openingStory: [
      createDialogue('旁白', '你来到了焚天熔岩...', 0xb0bec5),
      createDialogue('剑仙', '好热！这里的温度足以熔化钢铁！', 0x4fc3f7, '⚔'),
      createDialogue('旁白', '大地在颤抖，熔岩中似乎有什么东西在移动...', 0xff7043),
      createDialogue('剑仙', '火神陨落之地，必有神物！小心前进！', 0x4fc3f7, '⚔')
    ],
    closingStory: [
      createDialogue('旁白', '熔岩巨兽被你击败，火神的传承到手...', 0xb0bec5),
      createDialogue('火神残魂', '年轻人...你很好...我的神火传承，就交给你了...', 0xff7043, '🔥'),
      createDialogue('剑仙', '多谢前辈！', 0x4fc3f7, '⚔'),
      createDialogue('师尊', '徒儿，你已达到化神之境！天外魔境的封印正在松动...', 0x81c784, '👴'),
      createDialogue('师尊', '天魔随时可能破封而出，你必须尽快提升修为！', 0x81c784, '👴'),
      createDialogue('剑仙', '弟子定当不辱使命！', 0x4fc3f7, '⚔'),
      createDialogue('旁白', '第四章 · 焚天熔岩 完成！', 0xffd54f)
    ],
    levels: [
      createLevel('ch4_level1', '熔岩边缘', '进入焚天熔岩外围', 'story', { x: 180, y: 200 }, 10, [createReward('exp', 150), createReward('gold', 200)], {
        storyDialogues: [
          createDialogue('旁白', '你来到了焚天熔岩的边缘...', 0xb0bec5),
          createDialogue('剑仙', '这里的空气中都弥漫着火属性灵气！', 0x4fc3f7, '⚔'),
          createDialogue('旁白', '一只炎魔从熔岩中跃出！', 0xff7043),
          createDialogue('剑仙', '来的好！正好试试我的新剑术！', 0x4fc3f7, '⚔')
        ]
      }),
      createLevel('ch4_level2', '炎魔拦路', '击败拦路的炎魔', 'battle', { x: 320, y: 300 }, 10, [createReward('exp', 180), createReward('gold', 300), createReward('spirit', 50)], {
        stageId: 4
      }),
      createLevel('ch4_level3', '熔岩巨兽', '与熔岩巨兽战斗', 'battle', { x: 460, y: 220 }, 11, [createReward('exp', 220), createReward('gold', 350), createReward('spirit', 60)], {
        stageId: 4
      }),
      createLevel('ch4_level4', '火神遗迹', '发现火神的遗迹', 'story', { x: 600, y: 320 }, 11, [createReward('exp', 180), createReward('spirit', 80)], {
        storyDialogues: [
          createDialogue('旁白', '你在熔岩深处发现了一座神殿...', 0xb0bec5),
          createDialogue('剑仙', '这里就是火神陨落之地吗？', 0x4fc3f7, '⚔'),
          createDialogue('旁白', '神殿中央有一座祭坛，上面燃烧着永不熄灭的神火。', 0xff7043),
          createDialogue('火神残魂', '千年了...终于有人能走到这里...', 0xff7043, '🔥'),
          createDialogue('火神残魂', '我的神火，就交给你传承下去...守护三界...', 0xff7043, '🔥'),
          createDialogue('旁白', '神火飞入你的体内，你感到力量在不断增长！', 0xffd54f)
        ]
      }),
      createLevel('ch4_level5', '火神考验', '接受火神的最终考验', 'boss', { x: 740, y: 250 }, 12, [createReward('exp', 400), createReward('gold', 800), createReward('spirit', 100)], {
        stageId: 5
      })
    ],
    completionRewards: [
      createReward('gold', 2000),
      createReward('spirit', 400),
      createReward('exp', 800),
      createReward('maxMana', 80)
    ]
  },
  {
    id: 'chapter_5',
    name: '第五章 · 天外魔境',
    description: '终极试炼之地，传说有天魔镇守',
    chapterNumber: 5,
    icon: '👑',
    color: 0xffd54f,
    backgroundColor: 0x1a0033,
    status: 'locked',
    unlockRequirement: { type: 'chapter', value: 4 },
    openingStory: [
      createDialogue('旁白', '你来到了天外魔境...', 0xb0bec5),
      createDialogue('剑仙', '天魔的气息...如此强大！', 0x4fc3f7, '⚔'),
      createDialogue('旁白', '天空中裂开了一道巨大的缝隙，魔气从中涌出！', 0xba68c8),
      createDialogue('天魔', '蝼蚁...你竟敢来此...', 0x880e4f, '👹'),
      createDialogue('剑仙', '天魔！今日便是你的末日！', 0x4fc3f7, '⚔'),
      createDialogue('天魔', '哈哈哈...千年前那个剑仙都没能杀了我，就凭你？', 0x880e4f, '👹'),
      createDialogue('剑仙', '那就试试看！', 0x4fc3f7, '⚔')
    ],
    closingStory: [
      createDialogue('旁白', '天魔被你彻底消灭，三界恢复了和平...', 0xb0bec5),
      createDialogue('师尊', '徒儿！你做到了！你拯救了整个三界！', 0x81c784, '👴'),
      createDialogue('上古剑仙', '做得好...我们这一脉，终于可以安心了...', 0xffd54f, '👑'),
      createDialogue('火神残魂', '哈哈哈！好小子！没丢我的脸！', 0xff7043, '🔥'),
      createDialogue('剑仙', '这是我应该做的...', 0x4fc3f7, '⚔'),
      createDialogue('旁白', '从此，你成为了新的剑仙，御剑九天，守护苍生...', 0xffd54f),
      createDialogue('旁白', '第五章 · 天外魔境 完成！', 0xffd54f),
      createDialogue('旁白', '恭喜通关！感谢你的游玩！', 0x4fc3f7)
    ],
    levels: [
      createLevel('ch5_level1', '魔境入口', '踏入天外魔境', 'story', { x: 160, y: 220 }, 13, [createReward('exp', 200), createReward('gold', 300)], {
        storyDialogues: [
          createDialogue('旁白', '你来到了天外魔境的入口...', 0xb0bec5),
          createDialogue('剑仙', '这里就是天魔的老巢吗？魔气竟然凝结成了实质！', 0x4fc3f7, '⚔'),
          createDialogue('旁白', '天魔使者出现在你面前！', 0x880e4f),
          createDialogue('天魔使者', '凡人，你可知罪？竟敢擅闯魔境！', 0x880e4f, '👹'),
          createDialogue('剑仙', '该认罪的是你们！', 0x4fc3f7, '⚔')
        ]
      }),
      createLevel('ch5_level2', '天魔使者', '击败天魔使者', 'battle', { x: 300, y: 300 }, 13, [createReward('exp', 250), createReward('gold', 400), createReward('spirit', 80)], {
        stageId: 5
      }),
      createLevel('ch5_level3', '魔龙', '击败天魔坐骑魔龙', 'battle', { x: 440, y: 220 }, 14, [createReward('exp', 300), createReward('gold', 500), createReward('spirit', 100)], {
        stageId: 5
      }),
      createLevel('ch5_level4', '最终决战', '天魔现身', 'story', { x: 580, y: 320 }, 14, [createReward('exp', 250), createReward('spirit', 120)], {
        storyDialogues: [
          createDialogue('旁白', '天魔终于现身了！', 0xb0bec5),
          createDialogue('天魔', '蝼蚁...你竟然能走到这里...', 0x880e4f, '👹'),
          createDialogue('天魔', '看来千年前那个剑仙的传承，你确实得到了...', 0x880e4f, '👹'),
          createDialogue('剑仙', '天魔！今日我就要彻底消灭你！', 0x4fc3f7, '⚔'),
          createDialogue('天魔', '哈哈哈...那就让我看看，你有几分那个剑仙的本事！', 0x880e4f, '👹'),
          createDialogue('旁白', '最终决战，即将开始！', 0xffd54f)
        ]
      }),
      createLevel('ch5_level5', '天魔', '与天魔的最终决战', 'boss', { x: 720, y: 250 }, 15, [createReward('exp', 500), createReward('gold', 1000), createReward('spirit', 150)], {
        stageId: 5
      })
    ],
    completionRewards: [
      createReward('gold', 5000),
      createReward('spirit', 1000),
      createReward('exp', 2000),
      createReward('attack', 50),
      createReward('defense', 50),
      createReward('maxHealth', 500),
      createReward('maxMana', 300)
    ]
  }
]

export function getChapterById(id: string): Chapter | undefined {
  return CHAPTERS.find(ch => ch.id === id)
}

export function getChapterByNumber(number: number): Chapter | undefined {
  return CHAPTERS.find(ch => ch.chapterNumber === number)
}

export function getLevelById(chapterId: string, levelId: string): ChapterLevel | undefined {
  const chapter = getChapterById(chapterId)
  return chapter?.levels.find(l => l.id === levelId)
}

export function getNextChapter(currentChapterId: string): Chapter | undefined {
  const current = getChapterById(currentChapterId)
  if (!current) return undefined
  return getChapterByNumber(current.chapterNumber + 1)
}
