import Phaser from 'phaser'
import { OpeningScene } from '../scenes/OpeningScene'
import { MenuScene } from '../scenes/MenuScene'
import { BattleScene } from '../scenes/BattleScene'
import { TreasureScene } from '../scenes/TreasureScene'
import { ResultScene } from '../scenes/ResultScene'
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
    scene: [OpeningScene, MenuScene, BattleScene, TreasureScene, ResultScene]
  }

  return new Phaser.Game(config)
}

export { SaveManager }
