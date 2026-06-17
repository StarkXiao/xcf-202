import Phaser from 'phaser'
import { OpeningScene } from '../scenes/OpeningScene'
import { MenuScene } from '../scenes/MenuScene'
import { BattleScene } from '../scenes/BattleScene'
import { TreasureScene } from '../scenes/TreasureScene'
import { SectScene } from '../scenes/SectScene'
import { ResultScene } from '../scenes/ResultScene'
import { AlchemyScene } from '../scenes/AlchemyScene'
import { SpiritBeastScene } from '../scenes/SpiritBeastScene'
import { EncounterScene } from '../scenes/EncounterScene'
import { EquipmentScene } from '../scenes/EquipmentScene'
import { DungeonScene } from '../scenes/DungeonScene'
import { MeridianScene } from '../scenes/MeridianScene'
import { ShopScene } from '../scenes/ShopScene'
import { AchievementScene } from '../scenes/AchievementScene'
import { ChapterMapScene } from '../scenes/ChapterMapScene'
import { StoryScene } from '../scenes/StoryScene'
import { ChapterReviewScene } from '../scenes/ChapterReviewScene'
import { SaveManager } from '../managers/SaveManager'

export function createGame(container: HTMLDivElement): Phaser.Game {
  const width = Math.min(window.innerWidth, 1280)
  const height = Math.min(window.innerHeight, 800)

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: container,
    width,
    height,
    backgroundColor: '#0a0a15',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [OpeningScene, MenuScene, BattleScene, TreasureScene, SectScene, ResultScene, AlchemyScene, SpiritBeastScene, EncounterScene, EquipmentScene, DungeonScene, MeridianScene, ShopScene, AchievementScene, ChapterMapScene, StoryScene, ChapterReviewScene]
  }

  return new Phaser.Game(config)
}

export { SaveManager }
