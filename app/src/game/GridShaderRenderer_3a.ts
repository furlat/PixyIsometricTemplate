// app/src/game/GridShaderRenderer_3a.ts
import { Shader, MeshSimple } from 'pixi.js'
import { MeshManager_3a } from './MeshManager_3a'
import { gameStore_3a } from '../store/gameStore_3a'

export class GridShaderRenderer_3a {
  private shader: Shader | null = null
  private meshManager: MeshManager_3a
  
  constructor(meshManager: MeshManager_3a) {
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
      
      uniform float uCellSize;
      
      void main() {
        // Calculate grid cell coordinates
        vec2 cellCoord = floor(vPosition / uCellSize);
        
        // Calculate checkerboard pattern
        float checker = mod(cellCoord.x + cellCoord.y, 2.0);
        
        // Light and dark colors
        vec3 lightColor = vec3(0.941, 0.941, 0.941); // #f0f0f0
        vec3 darkColor = vec3(0.878, 0.878, 0.878);  // #e0e0e0
        
        // Mix colors based on checker pattern
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
        uCellSize: this.meshManager.getCellSize()
      }
    })
    
    console.log('Grid shader created with cell size:', this.meshManager.getCellSize())
  }
  
  public render(): void {
    // Check if checkboard is enabled in store
    if (!gameStore_3a.ui.enableCheckboard) {
      console.log('GridShaderRenderer_3a: Checkboard disabled in store')
      return
    }
    
    const mesh = this.meshManager.getMesh()
    if (mesh && this.shader) {
      // Apply shader to mesh
      (mesh as any).shader = this.shader
      console.log('Grid shader applied to mesh')
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