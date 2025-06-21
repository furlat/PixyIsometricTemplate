# Pixeloid Mesh Layer Implementation Guide (Revised)

## Objective

Transform the existing `BoundingBoxMaskRenderer` into a sophisticated `PixeloidMeshRenderer` that creates pixeloid-aligned meshes for each geometric object. This enables pixel-perfect rendering with per-pixeloid shaders at the object level, allowing for advanced effects like pixel art conversion and per-pixel collision detection.

## Architecture Overview

### Key Concepts
- **Pixeloid**: A discrete unit in world space (1 pixeloid = 1 unit)
- **Pixeloid Mesh**: A mesh where each quad represents exactly one pixeloid
- **Object-Level Meshes**: Each geometric object gets its own mesh containing only the pixeloids it occupies

### Components to Modify/Create
1. Replace `BoundingBoxMaskRenderer.ts` with `PixeloidMeshRenderer.ts`
2. Update `LayeredInfiniteCanvas.ts` to integrate the new renderer
3. Extend `GeometryHelper.ts` with pixeloid intersection methods
4. Update type definitions for mesh-related settings

## Implementation Steps

### Step 1: Create PixeloidMeshRenderer

Following PixiJS v8 mesh patterns from the documentation:

```typescript
// New file: app/src/game/PixeloidMeshRenderer.ts
import { 
  Mesh, 
  MeshGeometry, 
  Shader, 
  Texture, 
  Container, 
  Buffer,
  GlProgram,
  GpuProgram,
  TextureSource
} from 'pixi.js'
import { gameStore } from '../store/gameStore'
import { GeometryHelper } from './GeometryHelper'
import type { ViewportCorners, GeometricObject } from '../types'

interface PixeloidMeshData {
  mesh: Mesh
  geometry: MeshGeometry
  objectId: string
  pixeloidBounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  pixeloidCount: number
  occupiedPixeloids: Set<string> // "x,y" coordinates
}

export class PixeloidMeshRenderer {
  private container: Container = new Container()
  private objectMeshes: Map<string, PixeloidMeshData> = new Map()
  private sharedShader: Shader | null = null
  
  constructor() {
    this.container.label = 'PixeloidMeshLayer'
    // Create shared shader for all pixeloid meshes
    this.sharedShader = this.createPixeloidShader()
  }

  /**
   * Main render method following PixiJS patterns
   */
  public render(
    corners: ViewportCorners, 
    pixeloidScale: number,
    geometryTexture?: TextureSource
  ): void {
    this.container.removeChildren()

    if (!gameStore.geometry.layerVisibility.mask) {
      return
    }

    const enabledObjects = gameStore.geometry.objects.filter(obj => 
      gameStore.geometry.mask.enabledObjects.has(obj.id) && 
      obj.isVisible && 
      obj.metadata &&
      this.isObjectInViewport(obj, corners)
    )

    for (const obj of enabledObjects) {
      const meshData = this.getOrCreateMesh(obj)
      if (meshData) {
        // Update shader uniforms
        this.updateMeshUniforms(meshData.mesh, obj, pixeloidScale, geometryTexture)
        this.container.addChild(meshData.mesh)
      }
    }
  }
```

### Step 2: Implement Mesh Generation Using PixiJS Patterns

```typescript
  /**
   * Create pixeloid mesh following PixiJS MeshGeometry patterns
   */
  private createPixeloidMesh(obj: GeometricObject): PixeloidMeshData | null {
    const bounds = obj.metadata!.bounds
    
    // Calculate pixeloid-aligned bounds
    const pixeloidBounds = {
      minX: Math.floor(bounds.minX),
      maxX: Math.ceil(bounds.maxX),
      minY: Math.floor(bounds.minY),
      maxY: Math.ceil(bounds.maxY)
    }
    
    const width = pixeloidBounds.maxX - pixeloidBounds.minX
    const height = pixeloidBounds.maxY - pixeloidBounds.minY
    
    // Arrays for geometry data
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    const pixeloidCoords: number[] = [] // Custom attribute
    const occupiedPixeloids = new Set<string>()
    
    let vertexIndex = 0
    
    // Generate quad for each pixeloid that intersects the object
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const worldX = pixeloidBounds.minX + px
        const worldY = pixeloidBounds.minY + py
        
        if (this.pixeloidIntersectsObject(worldX, worldY, obj)) {
          occupiedPixeloids.add(`${worldX},${worldY}`)
          
          // Add 4 vertices for the quad (in pixeloid coordinates)
          // Top-left
          positions.push(worldX, worldY)
          // Top-right  
          positions.push(worldX + 1, worldY)
          // Bottom-right
          positions.push(worldX + 1, worldY + 1)
          // Bottom-left
          positions.push(worldX, worldY + 1)
          
          // UV coordinates (normalized within object bounds)
          const u0 = px / width
          const v0 = py / height
          const u1 = (px + 1) / width
          const v1 = (py + 1) / height
          
          uvs.push(u0, v0, u1, v0, u1, v1, u0, v1)
          
          // Store pixeloid center as custom attribute
          const centerX = worldX + 0.5
          const centerY = worldY + 0.5
          for (let i = 0; i < 4; i++) {
            pixeloidCoords.push(centerX, centerY)
          }
          
          // Create two triangles for the quad
          const base = vertexIndex * 4
          indices.push(
            base, base + 1, base + 2,  // First triangle
            base, base + 2, base + 3   // Second triangle
          )
          
          vertexIndex++
        }
      }
    }
    
    if (positions.length === 0) {
      return null // No pixeloids occupied
    }
    
    // Create MeshGeometry following PixiJS documentation patterns
    const geometry = new MeshGeometry({
      positions: new Float32Array(positions),
      uvs: new Float32Array(uvs),
      indices: new Uint32Array(indices)
    })
    
    // Add custom attribute for pixeloid coordinates
    geometry.addAttribute('aPixeloidCoord', {
      buffer: new Float32Array(pixeloidCoords),
      size: 2, // 2 floats per vertex
      normalized: false,
      type: 'float32',
      stride: 0,
      offset: 0
    })
    
    // Create mesh with shared shader
    const mesh = new Mesh({
      geometry,
      shader: this.sharedShader!
    })
    
    return {
      mesh,
      geometry,
      objectId: obj.id,
      pixeloidBounds,
      pixeloidCount: vertexIndex,
      occupiedPixeloids
    }
  }
```

### Step 3: Create Shader Following PixiJS v8 Patterns

```typescript
  /**
   * Create shared shader for all pixeloid meshes
   * Following PixiJS Shader.from() pattern with WebGL and WebGPU support
   */
  private createPixeloidShader(): Shader {
    // WebGL shaders
    const glVertex = `
      in vec2 aPosition;
      in vec2 aUV;
      in vec2 aPixeloidCoord;
      
      out vec2 vUV;
      out vec2 vPixeloidCoord;
      
      uniform mat3 uProjectionMatrix;
      uniform mat3 uWorldTransformMatrix;
      uniform mat3 uTransformMatrix;
      
      void main() {
        mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
        gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
        
        vUV = aUV;
        vPixeloidCoord = aPixeloidCoord;
      }
    `
    
    const glFragment = `
      precision highp float;
      
      in vec2 vUV;
      in vec2 vPixeloidCoord;
      
      uniform sampler2D uGeometryTexture;
      uniform vec4 uObjectColor;
      uniform float uPixeloidScale;
      uniform vec2 uViewportSize;
      uniform vec2 uCameraPosition;
      uniform float uMaskAlpha;
      uniform int uRenderMode; // 0 = solid, 1 = texture sample, 2 = debug grid
      
      void main() {
        vec4 finalColor = uObjectColor;
        
        // Mode 1: Sample from geometry texture
        if (uRenderMode == 1) {
          // Convert pixeloid coordinate to screen space for texture sampling
          vec2 screenCoord = (vPixeloidCoord - uCameraPosition) * uPixeloidScale + uViewportSize * 0.5;
          vec2 texCoord = screenCoord / uViewportSize;
          
          if (texCoord.x >= 0.0 && texCoord.x <= 1.0 && 
              texCoord.y >= 0.0 && texCoord.y <= 1.0) {
            vec4 sampledColor = texture(uGeometryTexture, texCoord);
            if (sampledColor.a > 0.1) {
              finalColor = sampledColor;
            }
          }
        }
        
        // Mode 2: Debug grid overlay
        if (uRenderMode == 2) {
          vec2 pixelFract = fract(vPixeloidCoord);
          if (pixelFract.x < 0.05 || pixelFract.x > 0.95 || 
              pixelFract.y < 0.05 || pixelFract.y > 0.95) {
            finalColor = mix(finalColor, vec4(1.0, 1.0, 1.0, 1.0), 0.5);
          }
        }
        
        gl_FragColor = vec4(finalColor.rgb, finalColor.a * uMaskAlpha);
      }
    `
    
    // WebGPU shader (WGSL)
    const gpuSource = `
      struct GlobalUniforms {
        uProjectionMatrix: mat3x3<f32>,
        uWorldTransformMatrix: mat3x3<f32>,
        uWorldColorAlpha: vec4<f32>,
        uResolution: vec2<f32>,
      }
      
      struct PixeloidUniforms {
        uTransformMatrix: mat3x3<f32>,
        uObjectColor: vec4<f32>,
        uPixeloidScale: f32,
        uViewportSize: vec2<f32>,
        uCameraPosition: vec2<f32>,
        uMaskAlpha: f32,
        uRenderMode: i32,
      }
      
      @group(0) @binding(0) var<uniform> globalUniforms: GlobalUniforms;
      @group(1) @binding(0) var<uniform> pixeloidUniforms: PixeloidUniforms;
      @group(2) @binding(0) var uGeometryTexture: texture_2d<f32>;
      @group(2) @binding(1) var uGeometrySampler: sampler;
      
      struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) vUV: vec2<f32>,
        @location(1) vPixeloidCoord: vec2<f32>,
      }
      
      @vertex
      fn vertexMain(
        @location(0) aPosition: vec2<f32>,
        @location(1) aUV: vec2<f32>,
        @location(2) aPixeloidCoord: vec2<f32>,
      ) -> VertexOutput {
        var mvp = globalUniforms.uProjectionMatrix * 
                  globalUniforms.uWorldTransformMatrix * 
                  pixeloidUniforms.uTransformMatrix;
        
        var output: VertexOutput;
        output.position = vec4<f32>((mvp * vec3<f32>(aPosition, 1.0)).xy, 0.0, 1.0);
        output.vUV = aUV;
        output.vPixeloidCoord = aPixeloidCoord;
        return output;
      }
      
      @fragment
      fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
        var finalColor = pixeloidUniforms.uObjectColor;
        
        // Mode 1: Sample from geometry texture
        if (pixeloidUniforms.uRenderMode == 1) {
          let screenCoord = (input.vPixeloidCoord - pixeloidUniforms.uCameraPosition) * 
                            pixeloidUniforms.uPixeloidScale + 
                            pixeloidUniforms.uViewportSize * 0.5;
          let texCoord = screenCoord / pixeloidUniforms.uViewportSize;
          
          if (texCoord.x >= 0.0 && texCoord.x <= 1.0 && 
              texCoord.y >= 0.0 && texCoord.y <= 1.0) {
            let sampledColor = textureSample(uGeometryTexture, uGeometrySampler, texCoord);
            if (sampledColor.a > 0.1) {
              finalColor = sampledColor;
            }
          }
        }
        
        return vec4<f32>(finalColor.rgb, finalColor.a * pixeloidUniforms.uMaskAlpha);
      }
    `
    
    // Create shader using Shader.from pattern
    return Shader.from({
      gl: {
        vertex: glVertex,
        fragment: glFragment
      },
      gpu: {
        vertex: {
          entryPoint: 'vertexMain',
          source: gpuSource
        },
        fragment: {
          entryPoint: 'fragmentMain',
          source: gpuSource
        }
      },
      resources: {
        pixeloidUniforms: {
          uTransformMatrix: { value: new Float32Array([1,0,0,0,1,0,0,0,1]), type: 'mat3x3<f32>' },
          uObjectColor: { value: [1, 1, 1, 1], type: 'vec4<f32>' },
          uPixeloidScale: { value: 10, type: 'f32' },
          uViewportSize: { value: [800, 600], type: 'vec2<f32>' },
          uCameraPosition: { value: [0, 0], type: 'vec2<f32>' },
          uMaskAlpha: { value: 1, type: 'f32' },
          uRenderMode: { value: 0, type: 'i32' }
        },
        uGeometryTexture: Texture.WHITE.source,
        uGeometrySampler: Texture.WHITE.source.style
      }
    })
  }
```

### Step 4: Update Mesh Uniforms

```typescript
  /**
   * Update shader uniforms for a mesh
   */
  private updateMeshUniforms(
    mesh: Mesh,
    obj: GeometricObject,
    pixeloidScale: number,
    geometryTexture?: TextureSource
  ): void {
    const uniforms = mesh.shader.resources.pixeloidUniforms
    
    // Update object color
    const r = ((obj.color >> 16) & 0xFF) / 255
    const g = ((obj.color >> 8) & 0xFF) / 255
    const b = (obj.color & 0xFF) / 255
    uniforms.uniforms.uObjectColor = [r, g, b, 1.0]
    
    // Update pixeloid scale
    uniforms.uniforms.uPixeloidScale = pixeloidScale
    
    // Update viewport size
    uniforms.uniforms.uViewportSize = [
      gameStore.windowWidth,
      gameStore.windowHeight
    ]
    
    // Update camera position
    uniforms.uniforms.uCameraPosition = [
      gameStore.camera.position.x,
      gameStore.camera.position.y
    ]
    
    // Update mask alpha
    uniforms.uniforms.uMaskAlpha = gameStore.geometry.mask.visualSettings.fillAlpha
    
    // Update render mode based on settings
    uniforms.uniforms.uRenderMode = gameStore.geometry.mask.mode === 'precise' ? 1 : 0
    
    // Update geometry texture if provided
    if (geometryTexture && gameStore.geometry.mask.mode === 'precise') {
      mesh.shader.resources.uGeometryTexture = geometryTexture
      mesh.shader.resources.uGeometrySampler = geometryTexture.style
    }
  }
```

### Step 5: Implement Pixeloid Intersection Testing

```typescript
  /**
   * Check if a pixeloid intersects with an object
   */
  private pixeloidIntersectsObject(
    pixeloidX: number, 
    pixeloidY: number, 
    obj: GeometricObject
  ): boolean {
    // For pixel-perfect testing, check multiple sample points within the pixeloid
    const samples = [
      { x: pixeloidX + 0.25, y: pixeloidY + 0.25 },
      { x: pixeloidX + 0.75, y: pixeloidY + 0.25 },
      { x: pixeloidX + 0.25, y: pixeloidY + 0.75 },
      { x: pixeloidX + 0.75, y: pixeloidY + 0.75 },
      { x: pixeloidX + 0.5, y: pixeloidY + 0.5 }   // Center
    ]
    
    // If any sample point is inside the object, the pixeloid intersects
    for (const sample of samples) {
      if ('anchorX' in obj && 'anchorY' in obj) {
        if (GeometryHelper.isPointInsideDiamond(sample, obj as any)) {
          return true
        }
      } else if ('centerX' in obj && 'centerY' in obj && 'radius' in obj) {
        const circle = obj as any
        const dx = sample.x - circle.centerX
        const dy = sample.y - circle.centerY
        if ((dx * dx + dy * dy) <= (circle.radius * circle.radius)) {
          return true
        }
      } else if ('x' in obj && 'y' in obj && 'width' in obj && 'height' in obj) {
        const rect = obj as any
        if (sample.x >= rect.x && sample.x <= rect.x + rect.width &&
            sample.y >= rect.y && sample.y <= rect.y + rect.height) {
          return true
        }
      } else if ('startX' in obj && 'endX' in obj) {
        // Line - check with tolerance
        if (this.isPointNearLine(sample, obj as any, 0.5)) {
          return true
        }
      } else if ('x' in obj && 'y' in obj) {
        // Point
        const point = obj as any
        if (Math.floor(point.x) === pixeloidX && Math.floor(point.y) === pixeloidY) {
          return true
        }
      }
    }
    
    return false
  }
```

### Step 6: Add Utility Methods

```typescript
  /**
   * Get or create mesh for an object
   */
  private getOrCreateMesh(obj: GeometricObject): PixeloidMeshData | null {
    // Check if we already have a mesh for this object
    const existing = this.objectMeshes.get(obj.id)
    if (existing) {
      return existing
    }
    
    // Create new mesh
    const meshData = this.createPixeloidMesh(obj)
    if (meshData) {
      this.objectMeshes.set(obj.id, meshData)
    }
    
    return meshData
  }
  
  /**
   * Export pixeloid data as ImageData for pixel art export
   */
  public exportPixeloidData(objectId?: string): ImageData | null {
    // If objectId specified, export single object
    if (objectId) {
      const meshData = this.objectMeshes.get(objectId)
      if (!meshData) return null
      
      return this.exportObjectPixeloids(meshData)
    }
    
    // Export all visible objects combined
    // Calculate combined bounds
    let minX = Infinity, minY = Infinity
    let maxX = -Infinity, maxY = -Infinity
    
    for (const meshData of this.objectMeshes.values()) {
      minX = Math.min(minX, meshData.pixeloidBounds.minX)
      minY = Math.min(minY, meshData.pixeloidBounds.minY)
      maxX = Math.max(maxX, meshData.pixeloidBounds.maxX)
      maxY = Math.max(maxY, meshData.pixeloidBounds.maxY)
    }
    
    const width = maxX - minX
    const height = maxY - minY
    const imageData = new ImageData(width, height)
    
    // Fill with pixeloid data
    for (const meshData of this.objectMeshes.values()) {
      const obj = gameStore.geometry.objects.find(o => o.id === meshData.objectId)
      if (!obj) continue
      
      const r = ((obj.color >> 16) & 0xFF)
      const g = ((obj.color >> 8) & 0xFF)
      const b = (obj.color & 0xFF)
      
      for (const pixeloidKey of meshData.occupiedPixeloids) {
        const [x, y] = pixeloidKey.split(',').map(Number)
        const localX = x - minX
        const localY = y - minY
        const index = (localY * width + localX) * 4
        
        imageData.data[index] = r
        imageData.data[index + 1] = g
        imageData.data[index + 2] = b
        imageData.data[index + 3] = 255
      }
    }
    
    return imageData
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    for (const meshData of this.objectMeshes.values()) {
      meshData.mesh.destroy()
      meshData.geometry.destroy()
    }
    
    this.objectMeshes.clear()
    
    if (this.sharedShader) {
      this.sharedShader.destroy()
    }
    
    this.container.destroy()
  }
  
  /**
   * Get container for layer system
   */
  public getContainer(): Container {
    return this.container
  }
```

### Step 7: Integration with Layer System

Update `LayeredInfiniteCanvas.ts`:

```typescript
// Replace BoundingBoxMaskRenderer import
import { PixeloidMeshRenderer } from './PixeloidMeshRenderer'

// In constructor
this.pixeloidMeshRenderer = new PixeloidMeshRenderer()

// In setupLayers()
this.maskLayer.addChild(this.pixeloidMeshRenderer.getContainer())

// Update renderMaskLayer()
private renderMaskLayer(corners: ViewportCorners, pixeloidScale: number): void {
  if (gameStore.geometry.layerVisibility.mask) {
    // Optionally capture geometry layer as texture for precise mode
    let geometryTexture: TextureSource | undefined
    
    if (gameStore.geometry.mask.mode === 'precise') {
      // Create render texture and render geometry layer to it
      const renderTexture = RenderTexture.create({
        width: this.app.screen.width,
        height: this.app.screen.height
      })
      
      this.app.renderer.render({
        container: this.geometryLayer,
        target: renderTexture
      })
      
      geometryTexture = renderTexture.source
    }
    
    this.pixeloidMeshRenderer.render(corners, pixeloidScale, geometryTexture)
    this.maskLayer.visible = true
  } else {
    this.maskLayer.visible = false
  }
}
```

### Step 8: Update Store Types

Add to `types/index.ts`:

```typescript
export interface GeometryState {
  // ... existing properties ...
  mask: {
    enabledObjects: Set<string>
    mode: 'boundingBox' | 'precise' | 'pixelArt'  // Add pixelArt mode
    visualSettings: {
      fillColor: number
      fillAlpha: number
      strokeColor: number
      strokeAlpha: number
      strokeWidth: number
      renderDebugGrid: boolean  // Show pixeloid grid
    }
  }
}
```

## Performance Optimizations

1. **Mesh Caching**: Reuse meshes when objects haven't changed geometrically
2. **Shared Shader**: All pixeloid meshes share the same shader program
3. **Viewport Culling**: Only render objects within the viewport
4. **Instanced Rendering**: For many similar objects, consider using instanced geometry (see PixiJS instanced example)

## Usage Example

```typescript
// Enable pixel art visualization
updateGameStore.setMaskMode('pixelArt')
updateGameStore.setLayerVisibility('mask', true)

// Configure for pixel art
updateGameStore.updateMaskVisualSettings({
  fillAlpha: 1.0,
  renderDebugGrid: false
})

// Export pixel art
const pixelArt = gameStore.pixeloidMeshRenderer?.exportPixeloidData()
if (pixelArt) {
  // Convert to canvas for download
  const canvas = document.createElement('canvas')
  canvas.width = pixelArt.width
  canvas.height = pixelArt.height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(pixelArt, 0, 0)
  
  // Download as PNG
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob!)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pixel-art.png'
    a.click()
  })
}
```

This implementation provides a robust foundation for pixeloid-level rendering with proper PixiJS v8 patterns, enabling advanced per-pixeloid effects and pixel art export capabilities.