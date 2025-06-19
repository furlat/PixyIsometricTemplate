import { Game } from './game'
import { updateGameStore } from './store/gameStore'
import { UIPanel } from './ui'

// Initialize the game when the DOM is loaded
async function init() {
  try {
    // Get the fullscreen canvas element
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
    if (!canvas) {
      throw new Error('Canvas element with id "gameCanvas" not found')
    }

    // Create and initialize the game with infinite canvas
    const game = new Game()
    await game.init(canvas)
    
    // Initialize UI panel for real-time data display
    const uiPanel = new UIPanel()
    
    console.log('🎮 Infinite Canvas Template initialized successfully!')
    console.log('✅ PixiJS Application:', game.application)
    console.log('✅ Infinite Canvas System:', game.canvasSystem)
    console.log('✅ Fullscreen Canvas:', game.canvas)
    console.log('✅ UI Panel:', uiPanel)
    console.log('')
    console.log('🎯 Controls:')
    console.log('   WASD: Move camera')
    console.log('   Mouse Wheel: Zoom in/out')
    console.log('   Space: Recenter to origin (0,0)')
    console.log('')
    console.log('📊 Open the browser devtools to see reactive store updates')
    
  } catch (error) {
    console.error('❌ Failed to initialize infinite canvas:', error)
    updateGameStore.setLoading(false)
  }
}

// Wait for DOM to be ready, then start the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}