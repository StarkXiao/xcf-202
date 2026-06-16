import Phaser from 'phaser'
import { OPENING_DIALOGUES } from '../data/gameData'

export class OpeningScene extends Phaser.Scene {
  private dialogueIndex = 0
  private dialogueText!: Phaser.GameObjects.Text
  private speakerText!: Phaser.GameObjects.Text
  private bgTween!: Phaser.Tweens.Tween
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter

  constructor() {
    super({ key: 'OpeningScene' })
  }

  create(): void {
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor(0x0a0a15)

    this.createParticles(width, height)
    this.createMountains(width, height)

    const title = this.add.text(width / 2, height * 0.18, '御剑仙侠', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '64px',
      color: '#ffd54f',
      stroke: '#8d6e63',
      strokeThickness: 4
    }).setOrigin(0.5)

    this.tweens.add({
      targets: title,
      y: height * 0.15,
      alpha: { from: 0, to: 1 },
      duration: 2000,
      ease: 'Cubic.easeOut'
    })

    const subtitle = this.add.text(width / 2, height * 0.25, '—— 千年轮回，剑斩苍穹 ——', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#b0bec5'
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 2000,
      delay: 1500,
      ease: 'Cubic.easeIn'
    })

    this.createDialogueBox(width, height)
    this.showDialogue()

    this.input.on('pointerdown', () => this.nextDialogue())
    this.input.keyboard?.on('keydown-SPACE', () => this.nextDialogue())
    this.input.keyboard?.on('keydown-ENTER', () => this.nextDialogue())
  }

  private createMountains(width: number, height: number): void {
    const mountainColors = [0x1a237e, 0x283593, 0x303f9f, 0x3949ab]

    for (let layer = 0; layer < 3; layer++) {
      const graphics = this.add.graphics()
      graphics.fillStyle(mountainColors[layer], 0.3 + layer * 0.15)

      const baseY = height * (0.55 + layer * 0.1)
      graphics.beginPath()
      graphics.moveTo(0, height)

      for (let x = 0; x <= width; x += 40) {
        const seed = (x + layer * 100) * 0.015
        const peakHeight = Math.sin(seed) * 60 + Math.cos(seed * 1.5) * 40 + 80
        graphics.lineTo(x, baseY - peakHeight + layer * 20)
      }

      graphics.lineTo(width, height)
      graphics.closePath()
      graphics.fillPath()

      this.tweens.add({
        targets: graphics,
        x: { from: 0, to: layer % 2 === 0 ? 20 : -20 },
        duration: 8000 + layer * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }
  }

  private createParticles(width: number, height: number): void {
    this.particles = this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: { min: 3000, max: 6000 },
      speedY: { min: -20, max: -60 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.3, end: 0.1 },
      alpha: { start: 0.8, end: 0 },
      tint: [0xffd54f, 0x81c784, 0x4fc3f7, 0xce93d8],
      quantity: 3,
      frequency: 150,
      blendMode: 'ADD'
    })
  }

  private createDialogueBox(width: number, height: number): void {
    const boxWidth = width * 0.85
    const boxHeight = 180
    const boxX = (width - boxWidth) / 2
    const boxY = height - boxHeight - 40

    const graphics = this.add.graphics()
    graphics.fillStyle(0x000000, 0.7)
    graphics.lineStyle(3, 0xffd54f, 0.8)
    this.drawRoundedRect(graphics, boxX, boxY, boxWidth, boxHeight, 16)

    this.speakerText = this.add.text(boxX + 30, boxY + 20, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '26px',
      color: '#ffd54f',
      fontStyle: 'bold'
    })

    this.dialogueText = this.add.text(boxX + 30, boxY + 65, '', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '22px',
      color: '#ffffff',
      wordWrap: { width: boxWidth - 60, useAdvancedWrap: true },
      lineSpacing: 8
    })

    const hint = this.add.text(width - 60, boxY + boxHeight - 25, '点击继续 ▶', {
      fontFamily: '"Microsoft YaHei", serif',
      fontSize: '16px',
      color: '#b0bec5'
    })

    this.tweens.add({
      targets: hint,
      alpha: { from: 0.4, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1
    })
  }

  private drawRoundedRect(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, radius: number): void {
    graphics.beginPath()
    graphics.moveTo(x + radius, y)
    graphics.lineTo(x + width - radius, y)
    graphics.arc(x + width - radius, y + radius, radius, -Math.PI / 2, 0)
    graphics.lineTo(x + width, y + height - radius)
    graphics.arc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2)
    graphics.lineTo(x + radius, y + height)
    graphics.arc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI)
    graphics.lineTo(x, y + radius)
    graphics.arc(x + radius, y + radius, radius, Math.PI, -Math.PI / 2)
    graphics.closePath()
    graphics.fillPath()
    graphics.strokePath()
  }

  private showDialogue(): void {
    const dialogue = OPENING_DIALOGUES[this.dialogueIndex]
    this.speakerText.setText(dialogue.speaker)
    this.speakerText.setColor('#' + dialogue.color.toString(16).padStart(6, '0'))
    this.dialogueText.setText('')

    this.typewriteText(dialogue.text)
  }

  private typewriteText(text: string): void {
    const length = text.length
    let i = 0

    this.time.addEvent({
      callback: () => {
        this.dialogueText.setText(this.dialogueText.text + text[i])
        i++
        if (i >= length) {
          this.events.emit('dialogue:complete')
        }
      },
      repeat: length - 1,
      delay: 30
    })
  }

  private nextDialogue(): void {
    this.dialogueIndex++
    if (this.dialogueIndex >= OPENING_DIALOGUES.length) {
      this.scene.start('MenuScene')
    } else {
      this.cameras.main.flash(200, 0, 0, 0)
      this.showDialogue()
    }
  }
}
