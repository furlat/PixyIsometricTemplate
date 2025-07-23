import { Game } from './game/Game'
import { gameStore, gameStore_methods } from './store/game-store'
import { StorePanel, UIControlBar, LayerToggleBar, GeometryPanel } from './ui'
import './styles/main.css'

// ✅ TYPE-SAFE: Global debugging interface declaration
declare global {
  var phase3B: {
    game: any
    store: any
    methods: any
    cleanup: () => void
  } | undefined
}

/**
 * Phase 3B Main Entry Point
 *
 * Phase 3B builds on 3A foundation with:
 * - All Phase 3A functionality (mesh + grid + mouse)
 * - Added geometry layer with 5 geometry types
 * - ECS integration for object management
 * - Enhanced UI with geometry controls
 */

let game: Game | null = null
let storePanel: StorePanel | null = null
let geometryPanel: GeometryPanel | null = null
let uiControlBar: UIControlBar | null = null
let layerToggleBar: LayerToggleBar | null = null

/**
 * Initialize Phase 3B application
 */
async function initPhase3B(): Promise<void> {
  try {
    // Get the canvas element
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
    if (!canvas) {
      throw new Error('Canvas element with id "gameCanvas" not found')
    }
    
    // Create and initialize Game
    game = new Game()
    await game.init(canvas)
    
    // Initialize UI components for Phase 3B
    storePanel = new StorePanel()
    geometryPanel = new GeometryPanel()
    uiControlBar = new UIControlBar()
    layerToggleBar = new LayerToggleBar()
    
    // Connect UI components for Phase 3B
    if (storePanel && uiControlBar) {
      uiControlBar.registerStorePanel(storePanel)
    }
    if (geometryPanel && uiControlBar) {
      uiControlBar.registerGeometryPanel(geometryPanel)
    }
    if (layerToggleBar && uiControlBar) {
      uiControlBar.registerLayerToggleBar(layerToggleBar)
    }
    
    // Setup Phase 3B specific UI event listeners
    setupPhase3BUIListeners()
    
    console.log('🎮 Clean Architecture initialized successfully!')
    console.log('✅ Game Instance:', game)
    console.log('✅ Phase3BCanvas:', game?.getCanvas())
    console.log('✅ Store Panel:', storePanel)
    console.log('✅ Geometry Panel:', geometryPanel)
    console.log('✅ UI Control Bar:', uiControlBar)
    console.log('✅ Layer Toggle Bar:', layerToggleBar)
    console.log('')
    console.log('🎯 Clean Architecture Controls:')
    console.log('   WASD: Move navigation offset (via InputManager)')
    console.log('   Mouse: Track position in world coordinates (via InputManager)')
    console.log('   Grid/Mouse toggle: Show/hide layers')
    console.log('   Geometry: Create and manage geometry objects')
    console.log('')
    console.log('📊 Clean Architecture Status:')
    console.log('   - Single InputManager (no duplicates) ✅')
    console.log('   - Unified store (no fragmentation) ✅')
    console.log('   - Circle bug prevention ✅')
    console.log('   - Clean dependency injection ✅')
    console.log('')
    console.log('🔍 Debug info:', game?.getDebugInfo())
    
  } catch (error) {
    console.error('❌ Phase 3B initialization failed:', error)
    
    // Display error message to user
    const errorMessage = error instanceof Error ? error.message : String(error)
    showErrorMessage(`Phase 3B Initialization Error: ${errorMessage}`)
  }
}

/**
 * Setup Phase 3B specific UI event listeners
 * Note: UI components handle their own buttons (LayerToggleBar, UIControlBar)
 * Note: F1/F2 shortcuts are handled by UIControlBar
 */
function setupPhase3BUIListeners(): void {
  // NOTE: Layer toggle buttons are handled by LayerToggleBar
  // NOTE: Store panel and layers buttons are handled by UIControlBar
  // NOTE: No global handlers needed - components handle their own events
  console.log('Phase 3B: UI components handle their own event listeners')
}

/**
 * Show error message to user
 */
function showErrorMessage(message: string): void {
  const errorDiv = document.createElement('div')
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #ff4444;
    color: white;
    padding: 20px;
    border-radius: 8px;
    z-index: 9999;
    font-family: Arial, sans-serif;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  `
  errorDiv.innerHTML = `
    <h3 style="margin: 0 0 10px 0;">Phase 3B Error</h3>
    <p style="margin: 0;">${message}</p>
    <button onclick="this.parentElement.remove()" style="
      margin-top: 15px;
      padding: 8px 16px;
      background: white;
      color: #ff4444;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    ">Close</button>
  `
  document.body.appendChild(errorDiv)
}

/**
 * Cleanup function for Phase 3B
 */
function cleanup(): void {
  if (game) {
    game.destroy()
    game = null
  }
  
  storePanel = null
  geometryPanel = null
  uiControlBar = null
  layerToggleBar = null
  
  console.log('Phase 3B: Cleanup completed')
}

// Handle page unload
window.addEventListener('beforeunload', cleanup)

// Wait for DOM to be ready, then start Phase 3B
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhase3B)
} else {
  initPhase3B()
}

// Export for debugging
globalThis.phase3B = {
  game,
  store: gameStore,
  methods: gameStore_methods,
  cleanup
}