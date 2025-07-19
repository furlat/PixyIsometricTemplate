import { Game_3b } from './game/Game_3b'
import { gameStore_3b, gameStore_3b_methods } from './store/gameStore_3b'
import { StorePanel_3b } from './ui/StorePanel_3b'
import { UIControlBar_3b } from './ui/UIControlBar_3b'
import { LayerToggleBar_3b } from './ui/LayerToggleBar_3b'
import { GeometryPanel_3b } from './ui/GeometryPanel_3b'
import { ObjectEditPanel_3b } from './ui/ObjectEditPanel_3b'
import './styles/main.css'

/**
 * Phase 3B Main Entry Point
 *
 * Phase 3B builds on 3A foundation with:
 * - All Phase 3A functionality (mesh + grid + mouse)
 * - Added geometry layer with 5 geometry types
 * - ECS integration for object management
 * - Enhanced UI with geometry controls
 */

let game: Game_3b | null = null
let storePanel: StorePanel_3b | null = null
let geometryPanel: GeometryPanel_3b | null = null
let uiControlBar: UIControlBar_3b | null = null
let layerToggleBar: LayerToggleBar_3b | null = null

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
    
    // Create and initialize Game_3b
    game = new Game_3b()
    await game.init(canvas)
    
    // Initialize UI components for Phase 3B
    storePanel = new StorePanel_3b()
    geometryPanel = new GeometryPanel_3b()
    uiControlBar = new UIControlBar_3b()
    layerToggleBar = new LayerToggleBar_3b()
    
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
    
    console.log('🎮 Phase 3B initialized successfully!')
    console.log('✅ Game_3b Instance:', game)
    console.log('✅ Phase3BCanvas:', game.getCanvas())
    console.log('✅ Store Panel:', storePanel)
    console.log('✅ Geometry Panel:', geometryPanel)
    console.log('✅ UI Control Bar:', uiControlBar)
    console.log('✅ Layer Toggle Bar:', layerToggleBar)
    console.log('')
    console.log('🎯 Phase 3B Controls:')
    console.log('   WASD: Move navigation offset')
    console.log('   Mouse: Track position in world coordinates')
    console.log('   Grid/Mouse toggle: Show/hide layers')
    console.log('   Geometry: Create and manage geometry objects')
    console.log('')
    console.log('📊 Phase 3B Status:')
    console.log('   - All Phase 3A features ✅')
    console.log('   - Geometry layer with 5 types ✅')
    console.log('   - ECS integration ✅')
    console.log('   - Enhanced UI controls ✅')
    console.log('')
    console.log('🔍 Debug info:', game.getDebugInfo())
    
  } catch (error) {
    console.error('❌ Phase 3B initialization failed:', error)
    
    // Display error message to user
    const errorMessage = error instanceof Error ? error.message : String(error)
    showErrorMessage(`Phase 3B Initialization Error: ${errorMessage}`)
  }
}

/**
 * Setup Phase 3B specific UI event listeners
 * Note: UI components handle their own buttons (LayerToggleBar_3b, UIControlBar_3b)
 * Note: F1/F2 shortcuts are handled by UIControlBar_3b
 */
function setupPhase3BUIListeners(): void {
  // NOTE: Layer toggle buttons are handled by LayerToggleBar_3b
  // NOTE: Store panel and layers buttons are handled by UIControlBar_3b
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
;(globalThis as any).phase3B = {
  game,
  store: gameStore_3b,
  methods: gameStore_3b_methods,
  cleanup
}