import { Game_3a } from './game/Game_3a'
import { gameStore_3a, gameStore_3a_methods } from './store/gameStore_3a'
import { StorePanel_3a } from './ui/StorePanel_3a'
import { UIControlBar_3a } from './ui/UIControlBar_3a'
import { LayerToggleBar_3a } from './ui/LayerToggleBar_3a'
import './styles/main.css'

/**
 * Phase 3A Main Entry Point
 * 
 * Simplified initialization for Phase 3A foundation:
 * - Single mesh at scale 1
 * - Two independent layers (grid + mouse)
 * - WASD navigation with store updates
 * - Simplified UI controls
 */

let game: Game_3a | null = null
let storePanel: StorePanel_3a | null = null
let uiControlBar: UIControlBar_3a | null = null
let layerToggleBar: LayerToggleBar_3a | null = null

/**
 * Initialize Phase 3A application
 */
async function initPhase3A(): Promise<void> {
  try {
    // Get the canvas element
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
    if (!canvas) {
      throw new Error('Canvas element with id "gameCanvas" not found')
    }
    
    // Create and initialize Game_3a
    game = new Game_3a()
    await game.init(canvas)
    
    // Initialize simplified UI components for Phase 3A
    storePanel = new StorePanel_3a()
    uiControlBar = new UIControlBar_3a()
    layerToggleBar = new LayerToggleBar_3a()
    
    // Connect UI components (simplified for Phase 3A)
    if (storePanel && uiControlBar) {
      uiControlBar.registerStorePanel(storePanel)
    }
    if (layerToggleBar && uiControlBar) {
      uiControlBar.registerLayerToggleBar(layerToggleBar)
    }
    
    // Setup Phase 3A specific UI event listeners
    setupPhase3AUIListeners()
    
    console.log('🎮 Phase 3A Foundation initialized successfully!')
    console.log('✅ Game_3a Instance:', game)
    console.log('✅ Phase3ACanvas:', game.getCanvas())
    console.log('✅ Store Panel:', storePanel)
    console.log('✅ UI Control Bar:', uiControlBar)
    console.log('✅ Layer Toggle Bar:', layerToggleBar)
    console.log('')
    console.log('🎯 Phase 3A Controls:')
    console.log('   WASD: Move navigation offset')
    console.log('   Mouse: Track position in world coordinates')
    console.log('   Grid/Mouse toggle: Show/hide layers')
    console.log('')
    console.log('📊 Phase 3A Foundation Status:')
    console.log('   - Single mesh at scale 1 ✅')
    console.log('   - Grid layer (checkboard) ✅')
    console.log('   - Mouse layer (highlight) ✅')
    console.log('   - WASD navigation ✅')
    console.log('   - Store integration ✅')
    console.log('')
    console.log('🔍 Debug info:', game.getDebugInfo())
    
  } catch (error) {
    console.error('❌ Phase 3A initialization failed:', error)
    
    // Display error message to user
    const errorMessage = error instanceof Error ? error.message : String(error)
    showErrorMessage(`Phase 3A Initialization Error: ${errorMessage}`)
  }
}

/**
 * Setup Phase 3A specific UI event listeners
 * Note: UIControlBar_3a handles store panel and layers buttons + F1/F2 shortcuts
 */
function setupPhase3AUIListeners(): void {
  // Grid layer toggle (specific to layer toggle bar)
  const gridButton = document.getElementById('toggle-layer-grid')
  if (gridButton) {
    gridButton.addEventListener('click', () => {
      gameStore_3a_methods.toggleGrid()
      updateLayerButtonState(gridButton, gameStore_3a.ui.showGrid)
    })
  }
  
  // Mouse layer toggle (specific to layer toggle bar)
  const mouseButton = document.getElementById('toggle-layer-mouse')
  if (mouseButton) {
    mouseButton.addEventListener('click', () => {
      gameStore_3a_methods.toggleMouse()
      updateLayerButtonState(mouseButton, gameStore_3a.ui.showMouse)
    })
  }
  
  // NOTE: Store panel and layers buttons are handled by UIControlBar_3a
  // NOTE: F1/F2 shortcuts are handled by UIControlBar_3a
  console.log('Phase 3A: UI event listeners setup (layer toggles only)')
}

/**
 * Update layer button visual state
 */
function updateLayerButtonState(button: HTMLElement, isActive: boolean): void {
  if (isActive) {
    button.classList.add('btn-success')
    button.classList.remove('btn-outline')
  } else {
    button.classList.add('btn-outline')
    button.classList.remove('btn-success')
  }
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
    <h3 style="margin: 0 0 10px 0;">Phase 3A Error</h3>
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
 * Cleanup function for Phase 3A
 */
function cleanup(): void {
  if (game) {
    game.destroy()
    game = null
  }
  
  storePanel = null
  uiControlBar = null
  layerToggleBar = null
  
  console.log('Phase 3A: Cleanup completed')
}

// Handle page unload
window.addEventListener('beforeunload', cleanup)

// Wait for DOM to be ready, then start Phase 3A
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhase3A)
} else {
  initPhase3A()
}

// Export for debugging
;(globalThis as any).phase3A = {
  game,
  store: gameStore_3a,
  methods: gameStore_3a_methods,
  cleanup
}