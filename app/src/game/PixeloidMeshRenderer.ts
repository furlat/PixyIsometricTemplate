import {
  Mesh,
  MeshGeometry,
  Shader,
  Texture,
  Container,
  TextureSource
} from 'pixi.js'
import { gameStore, updateGameStore } from '../store/gameStore'
import { GeometryHelper } from './GeometryHelper'
import type { ViewportCorners, GeometricObject, PixeloidMeshData } from '../types'

/**
 * PixeloidMeshRenderer creates a pixeloid grid mesh from the start.
 *
 * SIMPLE DIRECT APPROACH:
 * 1. Create pixeloid grid mesh covering the viewport
 * 2. Pass geometry data directly to the shader as uniforms
 * 3. Shader checks if each pixeloid intersects with geometry
 * 4. Output black pixels for occupied pixeloids
 * 5. No external texture dependencies or loading issues
 *
 * This approach is much simpler and more reliable than texture sampling.
 */
export class PixeloidMeshRenderer {
  private container: Container = new Container()
  private objectMeshes: Map<string, Mesh<MeshGeometry, Shader>> = new Map()
  private sharedShader: Shader | null = null
  
  constructor() {
    this.container.label = 'PixeloidMeshLayer'
    // Create shared shader for all pixeloid meshes
    this.sharedShader = this.createPixeloidShader()
  }

  /**
   * Main render method - creates a full-viewport quad that samples geometry texture
   */
  public render(
    corners: ViewportCorners,
    pixeloidScale: number,
    geometryTexture?: TextureSource
  ): void {
    this.container.removeChildren()

    // This renderer is controlled by the 'mask' layer visibility
    if (!gameStore.geometry.layerVisibility.mask) {
      return
    }

    // Must have geometry texture to sample from
    if (!geometryTexture) {
      console.warn('PixeloidMeshRenderer: No geometry texture provided')
      return
    }

    // Create pixeloid-grid mesh that covers the viewport
    const pixeloidMesh = this.getOrCreatePixeloidGridMesh(corners, pixeloidScale)
    if (pixeloidMesh) {
      // Update shader with geometry texture and pixeloid scale
      this.updateMeshUniforms(pixeloidMesh, geometryTexture, pixeloidScale)
      this.container.addChild(pixeloidMesh)
    }
  }

  /**
   * Get or create a pixeloid-grid mesh for texture sampling with pixeloid-sized kernels
   */
  private getOrCreatePixeloidGridMesh(corners: ViewportCorners, pixeloidScale: number): Mesh<MeshGeometry, Shader> | null {
    // Check if we already have a grid mesh
    if (this.objectMeshes.has('pixeloidGrid')) {
      return this.objectMeshes.get('pixeloidGrid')!
    }

    // Create a grid of pixeloid-sized quads
    const mesh = this.createPixeloidGridMesh(corners, pixeloidScale)
    if (mesh) {
      this.objectMeshes.set('pixeloidGrid', mesh)
    }
    return mesh
  }

  /**
   * Create a grid of pixeloid-sized quads for texture sampling with kernels
   */
  private createPixeloidGridMesh(corners: ViewportCorners, pixeloidScale: number): Mesh<MeshGeometry, Shader> | null {
    console.log('PixeloidMeshRenderer: Creating pixeloid grid mesh for kernel-based texture sampling')
    
    // Calculate pixeloid bounds for the viewport
    const minPixeloidX = Math.floor(corners.topLeft.x)
    const maxPixeloidX = Math.ceil(corners.bottomRight.x)
    const minPixeloidY = Math.floor(corners.topLeft.y)
    const maxPixeloidY = Math.ceil(corners.bottomRight.y)
    
    const pixeloidWidth = maxPixeloidX - minPixeloidX
    const pixeloidHeight = maxPixeloidY - minPixeloidY
    
    // Arrays for geometry data
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    
    let vertexIndex = 0
    
    // Create one quad for each pixeloid in the viewport
    for (let pixeloidY = minPixeloidY; pixeloidY < maxPixeloidY; pixeloidY++) {
      for (let pixeloidX = minPixeloidX; pixeloidX < maxPixeloidX; pixeloidX++) {
        
        // Create quad vertices for this pixeloid (perfectly aligned to grid)
        // Top-left
        positions.push(pixeloidX, pixeloidY)
        // Top-right
        positions.push(pixeloidX + 1, pixeloidY)
        // Bottom-right
        positions.push(pixeloidX + 1, pixeloidY + 1)
        // Bottom-left
        positions.push(pixeloidX, pixeloidY + 1)
        
        // UV coordinates - these will be used by the shader to sample the geometry texture
        // We need to map world coordinates to texture coordinates
        const localX = pixeloidX - minPixeloidX
        const localY = pixeloidY - minPixeloidY
        const u0 = localX / pixeloidWidth
        const v0 = localY / pixeloidHeight
        const u1 = (localX + 1) / pixeloidWidth
        const v1 = (localY + 1) / pixeloidHeight
        
        uvs.push(u0, v0, u1, v0, u1, v1, u0, v1)
        
        // Create two triangles for the quad
        const base = vertexIndex * 4
        indices.push(
          base, base + 1, base + 2,  // First triangle
          base, base + 2, base + 3   // Second triangle
        )
        
        vertexIndex++
      }
    }
    
    if (positions.length === 0) {
      console.log('PixeloidMeshRenderer: No pixeloids in viewport')
      return null
    }
    
    console.log(`PixeloidMeshRenderer: Created grid mesh with ${vertexIndex} pixeloids`)
    
    // Create MeshGeometry
    const geometry = new MeshGeometry({
      positions: new Float32Array(positions),
      uvs: new Float32Array(uvs),
      indices: new Uint32Array(indices)
    })
    
    // Create mesh with kernel-sampling shader
    const mesh = new Mesh({
      geometry,
      shader: this.sharedShader!
    })
    
    return mesh
  }

  /**
   * Create shader that uses pixeloid-sized kernel to sample geometry texture
   */
  private createPixeloidShader(): Shader {
    // Simple vertex shader - just transform position and pass UV
    const glVertex = `
      attribute vec2 aPosition;
      attribute vec2 aUV;
      
      varying vec2 vUV;
      
      uniform mat3 uProjectionMatrix;
      uniform mat3 uWorldTransformMatrix;
      uniform mat3 uTransformMatrix;
      
      void main() {
        mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
        gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
        vUV = aUV;
      }
    `
    
    // Fragment shader that uses a kernel to convolve through pixels within each pixeloid
    const glFragment = `
      precision mediump float;
      varying vec2 vUV;
      uniform sampler2D uGeometryTexture;
      
      void main() {
        // Sample multiple points within this pixeloid using a kernel
        // This convolves through pixels within the pixeloid area
        bool hasGeometry = false;
        
        // Use a simple 3x3 kernel with small offsets to sample within the pixeloid
        float kernelSize = 0.01; // Small offset for sampling within pixeloid
        
        for (int x = -1; x <= 1; x++) {
          for (int y = -1; y <= 1; y++) {
            // Calculate sample position
            vec2 sampleOffset = vec2(float(x), float(y)) * kernelSize;
            vec2 sampleUV = vUV + sampleOffset;
            
            // Sample the geometry texture at this position
            vec4 geometryColor = texture2D(uGeometryTexture, sampleUV);
            
            // If any sample has alpha > 0, this pixeloid should be black
            if (geometryColor.a > 0.0) {
              hasGeometry = true;
              break;
            }
          }
          if (hasGeometry) break;
        }
        
        // If any pixel in the kernel had geometry, color the entire pixeloid black
        if (hasGeometry) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);  // Black pixeloid
        } else {
          discard;  // Transparent - don't draw anything
        }
      }
    `
    
    // Create shader with geometry texture and pixeloid scale uniforms
    return Shader.from({
      gl: {
        vertex: glVertex,
        fragment: glFragment
      },
      resources: {
        uGeometryTexture: Texture.EMPTY
      }
    })
  }

  /**
   * Update shader uniforms to use the geometry texture
   */
  private updateMeshUniforms(
    mesh: Mesh<MeshGeometry, Shader>,
    geometryTexture: TextureSource,
    pixeloidScale: number
  ): void {
    // Set the geometry texture for the shader to sample from
    if (mesh.shader && mesh.shader.resources) {
      mesh.shader.resources.uGeometryTexture = Texture.from(geometryTexture)
    }
  }

  // NOTE: All the old manual geometry intersection methods have been removed!
  // We now use GPU texture sampling instead of JavaScript calculations.
  // The shader samples the geometry texture and outputs black where pixels exist.

  /**
   * Clean up resources
   */
  public destroy(): void {
    for (const mesh of this.objectMeshes.values()) {
      mesh.destroy()
    }
    this.objectMeshes.clear()
    
    if (this.sharedShader) {
      this.sharedShader.destroy()
    }
    
    this.container.destroy()
    
    // Clear mesh registry in store
    updateGameStore.clearAllMeshData()
  }
  
  /**
   * Get container for layer system
   */
  public getContainer(): Container {
    return this.container
  }

  /**
   * Force regeneration of all meshes (useful when settings change)
   */
  public invalidateAllMeshes(): void {
    // Mark all meshes as invalid in store
    updateGameStore.invalidateAllMeshes()
    
    // Destroy all current meshes - they'll be recreated on next render
    for (const mesh of this.objectMeshes.values()) {
      mesh.destroy()
    }
    this.objectMeshes.clear()
  }

  /**
   * Get mesh statistics for debugging
   */
  public getStats(): {
    totalMeshes: number
    totalPixeloids: number
    memoryUsage: string
  } {
    const stats = gameStore.meshRegistry.stats
    const memoryEstimate = stats.totalPixeloids * 32 // Rough estimate: 32 bytes per pixeloid
    
    return {
      totalMeshes: stats.totalMeshes,
      totalPixeloids: stats.totalPixeloids,
      memoryUsage: `~${(memoryEstimate / 1024 / 1024).toFixed(1)} MB`
    }
  }
}