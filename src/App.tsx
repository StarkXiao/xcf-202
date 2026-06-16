import { useEffect, useRef } from 'react'
import { createGame } from './game/GameConfig'
import type Phaser from 'phaser'

function App() {
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!gameContainerRef.current || gameRef.current) return

    gameRef.current = createGame(gameContainerRef.current)

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={gameContainerRef}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a15',
        overflow: 'hidden'
      }}
    />
  )
}

export default App
