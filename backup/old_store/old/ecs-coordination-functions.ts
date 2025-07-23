import { dataLayerIntegration } from './ecs-data-layer-integration'
import { mirrorLayerIntegration } from './ecs-mirror-layer-integration'
import { createECSCoordinationController } from './ecs-coordination-controller'

// Create coordination controller once
const coordinationController = createECSCoordinationController()

// Simple WASD routing function
export const coordinateWASDMovement = (
  direction: 'w' | 'a' | 's' | 'd',
  deltaTime: number
): void => {
  const coordinationState = coordinationController.getState()
  
  // Convert direction to delta movement
  const moveDistance = 10 * deltaTime // Adjust speed as needed
  let deltaX = 0
  let deltaY = 0
  
  switch (direction) {
    case 'w': deltaY = -moveDistance; break
    case 's': deltaY = moveDistance; break
    case 'a': deltaX = -moveDistance; break
    case 'd': deltaX = moveDistance; break
  }
  
  if (coordinationState.wasdRouting.currentTarget === 'data-layer') {
    // Route to data layer sampling
    dataLayerIntegration.moveSamplingWindow(deltaX, deltaY)
  } else {
    // Route to mirror layer camera
    mirrorLayerIntegration.panCamera(deltaX, deltaY)
  }
}

// Simple zoom coordination function
export const coordinateZoomChange = (newZoom: number): void => {
  // Validate zoom level
  const validZoom = Math.max(1, Math.min(128, Math.round(newZoom)))
  
  // Update mirror layer zoom
  mirrorLayerIntegration.setZoomLevel(validZoom as any) // Type cast for now
  
  // Update coordination state zoom level
  coordinationController.actions.setZoomLevel(validZoom as any)
  
  // Update layer visibility
  updateLayerVisibility(validZoom)
}

// Simple layer visibility function
export const updateLayerVisibility = (zoomLevel: number): void => {
  if (zoomLevel === 1) {
    // Show both layers - data layer doesn't have visibility control at this level
    mirrorLayerIntegration.setVisibility(true)
  } else {
    // Hide data layer (through coordination), show mirror layer
    mirrorLayerIntegration.setVisibility(true)
  }
}

// Simple texture synchronization
export const coordinateTextureSynchronization = (): void => {
  coordinationController.actions.syncTextures()
}

// Simple system reset
export const coordinateSystemReset = (): void => {
  coordinationController.actions.resetCoordinationState()
}

// Simple texture invalidation
export const coordinateTextureInvalidation = (layerId?: string): void => {
  coordinationController.actions.invalidateTexture(layerId || 'all')
}

// Get coordination state for UI
export const getCoordinationState = () => {
  return coordinationController.getState()
}

// Get data layer state for UI
export const getDataLayerState = () => {
  return dataLayerIntegration.getCurrentState()
}

// Get mirror layer state for UI
export const getMirrorLayerState = () => {
  return mirrorLayerIntegration.getCurrentState()
}

// Get unified stats for UI debugging
export const getUnifiedSystemStats = () => {
  const dataLayerState = dataLayerIntegration.getCurrentState()
  const mirrorLayerState = mirrorLayerIntegration.getCurrentState()
  const coordinationState = coordinationController.getState()
  
  return {
    dataLayer: {
      samplingActive: dataLayerState.sampling.isActive,
      objectCount: dataLayerState.allObjects.length,
      visibleObjects: dataLayerState.visibleObjects.length,
      samplingWindow: dataLayerState.samplingWindow,
      memoryUsage: dataLayerState.allObjects.length * 1024 // Rough estimate
    },
    mirrorLayer: {
      textureCache: mirrorLayerState.textureCache,
      cameraViewport: mirrorLayerState.cameraViewport,
      zoomLevel: mirrorLayerState.zoomLevel,
      layerVisibility: mirrorLayerState.display.isVisible,
      memoryUsage: mirrorLayerState.textureCache.size * 2048 // Rough estimate
    },
    coordination: {
      wasdTarget: coordinationState.wasdRouting.currentTarget,
      coordinationHealth: coordinationState.metadata.systemHealth,
      lastUpdateTime: coordinationState.metadata.lastUpdateTime
    },
    system: {
      totalObjects: dataLayerState.allObjects.length,
      totalVisibleObjects: dataLayerState.visibleObjects.length,
      totalMemoryUsage: (dataLayerState.allObjects.length * 1024) + (mirrorLayerState.textureCache.size * 2048),
      currentZoom: mirrorLayerState.zoomLevel,
      systemHealth: coordinationState.metadata.systemHealth
    }
  }
}

// Initialize coordination system
export const initializeCoordinationSystem = (): void => {
  // Set initial zoom level
  coordinateZoomChange(1)
  
  // Initialize layer visibility
  updateLayerVisibility(1)
  
  // Perform initial texture synchronization
  coordinateTextureSynchronization()
  
  console.log('ECS Coordination System initialized successfully')
}