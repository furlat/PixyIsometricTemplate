// app/src/store/gameStore_3a.ts - Fixed coordinate system
import { proxy } from 'valtio'
import { PixeloidCoordinate, VertexCoordinate } from '../types/ecs-coordinates'
import { GeometricObject, CreateGeometricObjectParams } from '../types/ecs-data-layer'
import { MeshLevel, MeshVertexData } from '../types/mesh-system'
import { dataLayerIntegration } from './ecs-data-layer-integration'
import { coordinateWASDMovement } from './ecs-coordination-functions'

// Phase 3A Game State Interface - Updated with mesh-first architecture
export interface GameState3A {
  phase: '3A'
  mouse: {
    screen: PixeloidCoordinate
    vertex: VertexCoordinate    // ✅ MESH VERTEX COORDINATES
    world: PixeloidCoordinate   // ✅ WORLD COORDINATES
  }
  navigation: {
    offset: PixeloidCoordinate
    isDragging: boolean
    moveAmount: number
  }
  geometry: {
    objects: GeometricObject[]
    selectedId: string | null
  }
  mesh: {
    vertexData: Float32Array | null
    cellSize: number
    dimensions: { width: number, height: number }
    needsUpdate: boolean
  }
  ui: {
    showGrid: boolean
    showMouse: boolean
    showStorePanel: boolean
    showLayerToggle: boolean
    enableCheckboard: boolean
    mouse: {
      highlightColor: number
      highlightIntensity: number
      strokeWidth: number
      fillAlpha: number
      animationSpeed: number
      pulseMin: number
      pulseMax: number
    }
  }
}

// Phase 3A store implementation with mesh-first architecture
export const gameStore_3a = proxy<GameState3A>({
  phase: '3A',
  mouse: {
    screen: { x: 0, y: 0 },
    vertex: { x: 0, y: 0 },    // ✅ MESH VERTEX COORDINATES
    world: { x: 0, y: 0 }      // ✅ WORLD COORDINATES
  },
  navigation: {
    offset: { x: 0, y: 0 },
    isDragging: false,
    moveAmount: 1
  },
  geometry: {
    objects: [],
    selectedId: null
  },
  mesh: {
    vertexData: null,
    cellSize: 1,
    dimensions: { width: 0, height: 0 },
    needsUpdate: false
  },
  ui: {
    showGrid: true,
    showMouse: true,
    showStorePanel: true,
    showLayerToggle: true,
    enableCheckboard: true,
    mouse: {
      highlightColor: 0xff0000,
      highlightIntensity: 0.8,
      strokeWidth: 2,
      fillAlpha: 0.3,
      animationSpeed: 4.0,
      pulseMin: 0.7,
      pulseMax: 0.3
    }
  }
})

// Store methods with mesh-first coordinate system
export const gameStore_3a_methods = {
  // ✅ MESH-FIRST MOUSE POSITION UPDATE
  updateMousePosition: (vertexX: number, vertexY: number) => {
    console.log('gameStore_3a: Updating mouse position', { vertexX, vertexY })
    
    // Store mesh vertex coordinates (authoritative)
    gameStore_3a.mouse.vertex = { x: vertexX, y: vertexY }
    
    // Calculate world coordinates (vertex + offset)
    gameStore_3a.mouse.world = {
      x: vertexX + gameStore_3a.navigation.offset.x,
      y: vertexY + gameStore_3a.navigation.offset.y
    }
    
    // Calculate screen coordinates (vertex * cellSize)
    gameStore_3a.mouse.screen = {
      x: vertexX * gameStore_3a.mesh.cellSize,
      y: vertexY * gameStore_3a.mesh.cellSize
    }
  },

  updateMouseVertex(x: number, y: number): void {
    gameStore_3a.mouse.vertex = { x, y }
    // No reactive triggers - just functional updates
  },

  // Navigation methods with mesh-first coordinates
  updateNavigation: (direction: 'w' | 'a' | 's' | 'd', deltaTime: number) => {
    // Use existing WASD coordination if available
    try {
      coordinateWASDMovement(direction, deltaTime)
    } catch (error) {
      console.warn('coordinateWASDMovement not available, using fallback')
    }
    
    // Update offset for UI display - using vertex units
    const moveDistance = Math.ceil(10 * deltaTime) // Ensure integer movement
    const currentOffset = gameStore_3a.navigation.offset
    let deltaX = 0
    let deltaY = 0
    
    switch (direction) {
      case 'w': deltaY = -moveDistance; break
      case 's': deltaY = moveDistance; break
      case 'a': deltaX = -moveDistance; break
      case 'd': deltaX = moveDistance; break
    }
    
    gameStore_3a.navigation.offset = {
      x: currentOffset.x + deltaX,
      y: currentOffset.y + deltaY
    }
    
    // Recalculate world coordinates
    gameStore_3a.mouse.world = {
      x: gameStore_3a.mouse.vertex.x + gameStore_3a.navigation.offset.x,
      y: gameStore_3a.mouse.vertex.y + gameStore_3a.navigation.offset.y
    }
  },

  // Simplified navigation offset update
  updateNavigationOffset: (deltaX: number, deltaY: number) => {
    console.log('gameStore_3a: Updating navigation offset', { deltaX, deltaY })
    
    gameStore_3a.navigation.offset = {
      x: gameStore_3a.navigation.offset.x + deltaX,
      y: gameStore_3a.navigation.offset.y + deltaY
    }
    
    // Recalculate world coordinates
    gameStore_3a.mouse.world = {
      x: gameStore_3a.mouse.vertex.x + gameStore_3a.navigation.offset.x,
      y: gameStore_3a.mouse.vertex.y + gameStore_3a.navigation.offset.y
    }
  },

  // Mesh system methods
  updateMeshData: (vertexData: Float32Array, cellSize: number, dimensions: { width: number, height: number }) => {
    console.log('gameStore_3a: Updating mesh data', { cellSize, dimensions })
    
    gameStore_3a.mesh.vertexData = vertexData
    gameStore_3a.mesh.cellSize = cellSize
    gameStore_3a.mesh.dimensions = dimensions
    gameStore_3a.mesh.needsUpdate = false
  },

  // Legacy mesh methods for compatibility
  initializeMesh: (level: MeshLevel) => {
    console.log('gameStore_3a: Initializing mesh (legacy)', { level })
    gameStore_3a.mesh.needsUpdate = true
  },

  updateMeshDataLegacy: (vertexData: MeshVertexData) => {
    console.log('gameStore_3a: Updating mesh data (legacy)')
    gameStore_3a.mesh.needsUpdate = false
  },

  // UI methods for Phase 3A
  toggleGrid: () => {
    gameStore_3a.ui.showGrid = !gameStore_3a.ui.showGrid
    console.log('gameStore_3a: Grid visibility:', gameStore_3a.ui.showGrid)
  },

  toggleMouse: () => {
    gameStore_3a.ui.showMouse = !gameStore_3a.ui.showMouse
    console.log('gameStore_3a: Mouse visibility:', gameStore_3a.ui.showMouse)
  },

  toggleStorePanel: () => {
    gameStore_3a.ui.showStorePanel = !gameStore_3a.ui.showStorePanel
    console.log('gameStore_3a: Store panel visibility:', gameStore_3a.ui.showStorePanel)
  },

  toggleLayerToggle: () => {
    gameStore_3a.ui.showLayerToggle = !gameStore_3a.ui.showLayerToggle
    console.log('gameStore_3a: Layer toggle visibility:', gameStore_3a.ui.showLayerToggle)
  },

  // Geometry methods using existing data layer integration
  addGeometryObject: (params: CreateGeometricObjectParams) => {
    console.log('gameStore_3a: Adding geometry object', params)
    
    try {
      const objectId = dataLayerIntegration.addObject(params)
      // Update local geometry objects list
      const allObjects = dataLayerIntegration.getAllObjects()
      gameStore_3a.geometry.objects = allObjects
      return objectId
    } catch (error) {
      console.warn('dataLayerIntegration not available, using fallback')
      
      // Simple fallback for geometry objects
      const newObject = {
        id: `obj_${Date.now()}`,
        ...params
      } as GeometricObject
      
      gameStore_3a.geometry.objects.push(newObject)
      return newObject.id
    }
  },

  removeGeometryObject: (objectId: string) => {
    console.log('gameStore_3a: Removing geometry object', objectId)
    gameStore_3a.geometry.objects = gameStore_3a.geometry.objects.filter(obj => obj.id !== objectId)
  },

  selectGeometryObject: (id: string) => {
    console.log('gameStore_3a: Selecting geometry object', id)
    gameStore_3a.geometry.selectedId = id
  },

  clearSelection: () => {
    console.log('gameStore_3a: Clearing selection')
    gameStore_3a.geometry.selectedId = null
  },

  // Store-driven constants methods
  setMeshCellSize: (cellSize: number) => {
    console.log('gameStore_3a: Setting mesh cell size', cellSize)
    gameStore_3a.mesh.cellSize = cellSize
    gameStore_3a.mesh.needsUpdate = true
  },

  setNavigationMoveAmount: (moveAmount: number) => {
    console.log('gameStore_3a: Setting navigation move amount', moveAmount)
    gameStore_3a.navigation.moveAmount = moveAmount
  },

  toggleCheckboard: () => {
    gameStore_3a.ui.enableCheckboard = !gameStore_3a.ui.enableCheckboard
    console.log('gameStore_3a: Checkboard enabled:', gameStore_3a.ui.enableCheckboard)
  },

  updateMouseHighlightColor: (color: number) => {
    console.log('gameStore_3a: Setting mouse highlight color', color.toString(16))
    gameStore_3a.ui.mouse.highlightColor = color
  },

  updateMouseHighlightIntensity: (intensity: number) => {
    const clampedIntensity = Math.max(0, Math.min(1, intensity))
    console.log('gameStore_3a: Setting mouse highlight intensity', clampedIntensity)
    gameStore_3a.ui.mouse.highlightIntensity = clampedIntensity
  },

  // Reset navigation offset to center (0,0)
  resetNavigationOffset: () => {
    console.log('gameStore_3a: Resetting navigation offset to (0,0)')
    
    gameStore_3a.navigation.offset = { x: 0, y: 0 }
    
    // Recalculate world coordinates
    gameStore_3a.mouse.world = {
      x: gameStore_3a.mouse.vertex.x + 0,
      y: gameStore_3a.mouse.vertex.y + 0
    }
    
    console.log('Navigation offset reset to (0,0)')
  }
}

// Export for Phase 3A implementation
export default gameStore_3a