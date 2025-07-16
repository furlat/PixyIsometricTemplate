// app/src/game/GridShaderRenderer_3b.ts
import { Shader, MeshSimple } from 'pixi.js'
import { MeshManager_3b } from './MeshManager_3b'
import { gameStore_3b } from '../store/gameStore_3b'

export class GridShaderRenderer_3b {
  private shader: Shader | null = null
  private meshManager: MeshManager_3b
  
  constructor(meshManager: MeshManager_3b) {
    this.meshManager = meshManager
    this.createCheckboardShader()
  }
  
  private createCheckboardShader(): void {
    const vertexShader = `
      attribute vec2 aPosition;
      attribute vec2 aUV;
      varying vec2 vUV;
      varying vec2 vPosition;
      
      uniform mat3 uProjectionMatrix;
      uniform mat3 uWorldTransformMatrix;
      uniform mat3 uTransformMatrix;
      
      void main() {
        mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
        gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
        vUV = aUV;
        vPosition = aPosition;
      }
    `
    
    const fragmentShader = `
      precision mediump float;
      varying vec2 vUV;
      varying vec2 vPosition;
      
      void main() {
        // Calculate checkerboard pattern based on grid position
        // Each quad represents a 1x1 grid square
        vec2 gridCoord = floor(vPosition);
        float checker = mod(gridCoord.x + gridCoord.y, 2.0);
        
        // Light and dark colors for checkerboard (matching original BackgroundGridRenderer)
        vec3 lightColor = vec3(0.941, 0.941, 0.941); // 0xf0f0f0
        vec3 darkColor = vec3(0.878, 0.878, 0.878);  // 0xe0e0e0
        
        // Mix between light and dark based on checker value
        vec3 color = mix(lightColor, darkColor, checker);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `
    
    this.shader = Shader.from({
      gl: {
        vertex: vertexShader,
        fragment: fragmentShader
      },
      resources: {
        // No uniform needed - using direct grid coordinates like old working shader
      }
    })
    
    console.log('Grid shader created using old working approach (direct grid coordinates)')
  }
  
  public render(): void {
    const mesh = this.meshManager.getMesh()
    if (!mesh) return
    
    if (gameStore_3b.ui.enableCheckboard) {
      // Apply shader
      if (this.shader) {
        (mesh as any).shader = this.shader
        console.log('GridShaderRenderer_3b: Checkboard shader applied')
      }
    } else {
      // Remove shader
      (mesh as any).shader = null
      console.log('GridShaderRenderer_3b: Checkboard shader removed')
    }
  }
  
  public getMesh(): MeshSimple | null {
    return this.meshManager.getMesh()
  }
  
  public destroy(): void {
    if (this.shader) {
      this.shader.destroy()
      this.shader = null
    }
  }
}