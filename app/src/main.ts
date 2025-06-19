import { Game } from './game'
import { updateGameStore } from './store/gameStore'
import { StorePanel, UIControlBar, GeometryPanel } from './ui'

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
    
    // Initialize UI components for real-time data display and control
    const storePanel = new StorePanel()
    const geometryPanel = new GeometryPanel()
    const uiControlBar = new UIControlBar()
    
    // Connect the control bar with the panels
    uiControlBar.registerStorePanel(storePanel)
    uiControlBar.registerGeometryPanel(geometryPanel)
    
    console.log('🎮 Infinite Canvas Template initialized successfully!')
    console.log('✅ PixiJS Application:', game.application)
    console.log('✅ Infinite Canvas System:', game.canvasSystem)
    console.log('✅ Fullscreen Canvas:', game.canvas)
    console.log('✅ Store Panel:', storePanel)
    console.log('✅ Geometry Panel:', geometryPanel)
    console.log('✅ UI Control Bar:', uiControlBar)
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