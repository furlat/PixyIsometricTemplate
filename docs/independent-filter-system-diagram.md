# Independent Filter System Architecture Diagram

## Complete System Overview

```mermaid
graph TB
    subgraph "Input Layer"
        Mouse[Mouse Input] --> InputMgr[InputManager]
        Keyboard[Keyboard Input] --> InputMgr
        InputMgr --> Store[GameStore]
    end

    subgraph "Core Game Engine"
        Store --> LIC[LayeredInfiniteCanvas]
        LIC --> GeomRenderer[GeometryRenderer]
        LIC --> BGRenderer[BackgroundGridRenderer]
        LIC --> StaticMesh[StaticMeshManager]
    end

    subgraph "Geometry Processing Pipeline"
        GeomRenderer --> GeomContainer[Geometry Container]
        GeomContainer --> GeomGraphics[Individual Object Graphics]
        GeomGraphics --> GeomBounds[Pixeloid-Perfect Bounds]
    end

    subgraph "NEW: Texture Extraction System"
        GeomContainer --> TERenderer[TextureExtractionRenderer]
        TERenderer --> RenderTex[RenderTexture.create]
        RenderTex --> GeomTexture[High-Quality Geometry Texture]
        
        GeomBounds --> PerfectExtract[PixeloidPerfectExtraction]
        PerfectExtract --> BoundsTexture[Bounds-Aligned Texture]
    end

    subgraph "NEW: Independent Filter Chains"
        GeomTexture --> FilterSprite1[Filter Sprite Copy 1]
        GeomTexture --> FilterSprite2[Filter Sprite Copy 2]
        GeomTexture --> FilterSpriteN[Filter Sprite Copy N]
        
        FilterSprite1 --> PixelateFilter[PixelateFilter Chain]
        FilterSprite2 --> OutlineFilter[OutlineFilter Chain]
        FilterSpriteN --> CustomFilter[Custom Filter Chain]
    end

    subgraph "NEW: Independent Render Layers"
        PixelateFilter --> PixelateLayer[Pixelate Render Layer]
        OutlineFilter --> OutlineLayer[Selection Render Layer]
        CustomFilter --> CustomLayer[Custom Effect Layer]
        
        PixelateLayer --> RenderGroup1[Render Group 1]
        OutlineLayer --> RenderGroup2[Render Group 2] 
        CustomLayer --> RenderGroupN[Render Group N]
    end

    subgraph "Composition & Display"
        RenderGroup1 --> FinalComposite[Final Scene Composite]
        RenderGroup2 --> FinalComposite
        RenderGroupN --> FinalComposite
        
        BGRenderer --> FinalComposite
        GeomContainer --> FinalComposite
        
        FinalComposite --> Screen[Screen Display]
    end

    subgraph "Filter Management"
        Store --> FilterMgr[IndependentFilterManager]
        FilterMgr --> FilterSprite1
        FilterMgr --> FilterSprite2
        FilterMgr --> FilterSpriteN
        
        FilterMgr --> LayerVisibility[Layer Visibility Control]
        LayerVisibility --> PixelateLayer
        LayerVisibility --> OutlineLayer
        LayerVisibility --> CustomLayer
    end

    classDef existing fill:#e1f5fe
    classDef new fill:#c8e6c9
    classDef pipeline fill:#fff3e0
    
    class Mouse,Keyboard,InputMgr,Store,LIC,GeomRenderer,BGRenderer,StaticMesh,GeomContainer,GeomGraphics,GeomBounds,FinalComposite,Screen existing
    class TERenderer,RenderTex,GeomTexture,PerfectExtract,BoundsTexture,FilterSprite1,FilterSprite2,FilterSpriteN,PixelateFilter,OutlineFilter,CustomFilter,PixelateLayer,OutlineLayer,CustomLayer,RenderGroup1,RenderGroup2,RenderGroupN,FilterMgr,LayerVisibility new
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant GR as GeometryRenderer
    participant TER as TextureExtractionRenderer
    participant RT as RenderTexture
    participant IFM as IndependentFilterManager
    participant FS as Filter Sprites
    participant RL as RenderLayers
    participant S as Screen

    Note over GR,S: Frame Render Cycle

    GR->>GR: Render geometry to container
    GR->>TER: Trigger texture extraction
    
    TER->>RT: Create high-quality RenderTexture
    TER->>RT: renderer.render(geometryContainer, {target: texture})
    RT->>TER: Return perfect geometry texture
    
    TER->>IFM: Provide extracted texture
    IFM->>FS: Create independent sprite copies
    
    par Independent Filter Processing
        FS->>FS: Apply PixelateFilter
    and
        FS->>FS: Apply OutlineFilter  
    and
        FS->>FS: Apply CustomFilters
    end
    
    FS->>RL: Add filtered sprites to layers
    RL->>S: Composite final scene
    
    Note over GR,S: Original geometry unchanged, filters work on copies
```

## Pixeloid-Perfect Extraction Process

```mermaid
graph TD
    subgraph "Object Analysis"
        GeomObj[Geometric Object] --> Metadata[Object.metadata]
        Metadata --> Bounds[metadata.bounds]
        Bounds --> MinMax[minX, maxX, minY, maxY]
    end

    subgraph "Pixeloid Alignment"
        MinMax --> PixeloidCalc[Calculate Pixeloid Dimensions]
        PixeloidCalc --> PerfectWidth[ceil(maxX - minX) pixeloids]
        PixeloidCalc --> PerfectHeight[ceil(maxY - minY) pixeloids]
    end

    subgraph "Texture Creation"
        PerfectWidth --> TexWidth[width = pixeloids * scale]
        PerfectHeight --> TexHeight[height = pixeloids * scale]
        TexWidth --> CreateRT[RenderTexture.create]
        TexHeight --> CreateRT
        CreateRT --> PerfectTexture[Pixeloid-Perfect Texture]
    end

    subgraph "Extraction Container"
        GeomObj --> ExtractContainer[Temporary Container]
        Bounds --> Positioning[position.set(-minX, -minY)]
        ExtractContainer --> Positioning
        Positioning --> RenderTarget[renderer.render to texture]
        RenderTarget --> PerfectTexture
    end

    classDef analysis fill:#e3f2fd
    classDef alignment fill:#f3e5f5
    classDef creation fill:#e8f5e8
    classDef extraction fill:#fff8e1
    
    class GeomObj,Metadata,Bounds,MinMax analysis
    class PixeloidCalc,PerfectWidth,PerfectHeight alignment
    class TexWidth,TexHeight,CreateRT,PerfectTexture creation
    class ExtractContainer,Positioning,RenderTarget extraction
```

## Integration with Current LayeredInfiniteCanvas

```mermaid
graph LR
    subgraph "Existing Layers (Keep Unchanged)"
        BG[backgroundLayer]
        GEOM[geometryLayer] 
        SEL[selectionLayer]
        BBOX[bboxLayer]
        MOUSE[mouseLayer]
    end

    subgraph "NEW: Independent Filter Layers"
        PIX[pixelateLayer]
        OUT[outlineLayer]
        CUST1[customLayer1]
        CUSTN[customLayerN]
    end

    subgraph "Render Order (Bottom to Top)"
        BG --> GEOM
        GEOM --> SEL
        SEL --> PIX
        PIX --> OUT
        OUT --> CUST1
        CUST1 --> CUSTN
        CUSTN --> BBOX
        BBOX --> MOUSE
    end

    subgraph "Data Sources"
        GEOM --> |texture extraction| PIX
        GEOM --> |texture extraction| OUT
        GEOM --> |texture extraction| CUST1
        GEOM --> |texture extraction| CUSTN
    end

    classDef existing fill:#bbdefb
    classDef new fill:#c8e6c9
    
    class BG,GEOM,SEL,BBOX,MOUSE existing
    class PIX,OUT,CUST1,CUSTN new
```

## Filter Chain Configuration

```mermaid
graph TB
    subgraph "Filter Configuration Store"
        Config[FilterConfiguration]
        Config --> PixConfig[PixelateConfig]
        Config --> OutConfig[OutlineConfig]
        Config --> CustConfig[CustomConfig]
    end

    subgraph "Filter Factory"
        PixConfig --> PixFactory[createPixelateFilter]
        OutConfig --> OutFactory[createOutlineFilter]
        CustConfig --> CustFactory[createCustomFilter]
    end

    subgraph "Applied Filters"
        PixFactory --> PixFilter[PixelateFilter]
        OutFactory --> OutFilter[OutlineFilter]
        CustFactory --> CustFilter[CustomFilter]
    end

    subgraph "Sprite Assignment"
        PixFilter --> Sprite1[sprite.filters = [PixelateFilter]]
        OutFilter --> Sprite2[sprite.filters = [OutlineFilter]]
        CustFilter --> Sprite3[sprite.filters = [CustomFilter]]
    end

    subgraph "Layer Visibility Control"
        Sprite1 --> Layer1[layer.visible = store.filters.pixelate]
        Sprite2 --> Layer2[layer.visible = store.filters.outline]
        Sprite3 --> Layer3[layer.visible = store.filters.custom]
    end

    classDef config fill:#fff3e0
    classDef factory fill:#e8f5e8
    classDef filter fill:#f3e5f5
    classDef sprite fill:#e3f2fd
    classDef control fill:#fce4ec
    
    class Config,PixConfig,OutConfig,CustConfig config
    class PixFactory,OutFactory,CustFactory factory
    class PixFilter,OutFilter,CustFilter filter
    class Sprite1,Sprite2,Sprite3 sprite
    class Layer1,Layer2,Layer3 control
```

## Key Architectural Benefits

1. **Zero Impact on Original**: Geometry layer remains completely unchanged
2. **Perfect Fidelity**: RenderTexture extraction preserves exact pixel data  
3. **Independent Processing**: Each filter operates on its own sprite copy
4. **Parallel Execution**: Multiple filters can run simultaneously
5. **Composable Results**: Sprites can be layered and combined flexibly
6. **Performance Optimized**: Uses GPU-accelerated rendering pipeline
7. **Store Integration**: Integrates cleanly with existing visibility controls

This architecture enables the advanced filter capabilities you need while maintaining the integrity and performance of your existing system.