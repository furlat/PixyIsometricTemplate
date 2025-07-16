---
description: Learn how to create and manipulate meshes in PixiJS v8, including custom geometry, shaders, and built-in mesh types like MeshSimple, MeshRope, and PerspectiveMesh.
---
# Mesh

PixiJS v8 offers a powerful `Mesh` system that provides full control over geometry, UVs, indices, shaders, and WebGL/WebGPU state. Meshes are ideal for custom rendering effects, advanced distortion, perspective manipulation, or performance-tuned rendering pipelines.

```ts
import { Texture, Mesh, MeshGeometry, Shader } from 'pixi.js';

const geometry = new MeshGeometry({
  positions: new Float32Array([0, 0, 100, 0, 100, 100, 0, 100]),
  uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
  indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
});

const shader = Shader.from({
  gl: {
    vertex: `
            attribute vec2 aPosition;
            attribute vec2 aUV;
            varying vec2 vUV;
            void main() {
                gl_Position = vec4(aPosition / 100.0 - 1.0, 0.0, 1.0);
                vUV = aUV;
            }
        `,
    fragment: `
            precision mediump float;
            varying vec2 vUV;
            uniform sampler2D uSampler;
            void main() {
                gl_FragColor = texture2D(uSampler, vUV);
            }
        `,
  },
  resources: {
    uSampler: Texture.from('image.png').source,
  },
});

const mesh = new Mesh({ geometry, shader });
app.stage.addChild(mesh);
```

## **What Is a Mesh?**

A mesh is a low-level rendering primitive composed of:

- **Geometry**: Vertex positions, UVs, indices, and other attributes
- **Shader**: A GPU program that defines how the geometry is rendered
- **State**: GPU state configuration (e.g. blending, depth, stencil)

With these elements, you can build anything from simple quads to curved surfaces and procedural effects.

## **MeshGeometry**

All meshes in PixiJS are built using the `MeshGeometry` class. This class allows you to define the vertex positions, UV coordinates, and indices that describe the mesh's shape and texture mapping.

```ts
const geometry = new MeshGeometry({
  positions: Float32Array, // 2 floats per vertex
  uvs: Float32Array, // matching number of floats
  indices: Uint32Array, // 3 indices per triangle
  topology: 'triangle-list',
});
```

You can access and modify buffers directly:

```ts
geometry.positions[0] = 50;
geometry.uvs[0] = 0.5;
geometry.indices[0] = 1;
```

## Built-in Mesh Types

### MeshSimple

A minimal wrapper over `Mesh` that accepts vertex, UV, and index arrays directly. Suitable for fast static or dynamic meshes.

```ts
const mesh = new MeshSimple({
  texture: Texture.from('image.png'),
  vertices: new Float32Array([0, 0, 100, 0, 100, 100, 0, 100]),
  uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
  indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
});
```

- Use `autoUpdate = true` to update geometry per frame.
- Access `mesh.vertices` to read/write data.

### MeshRope

Bends a texture along a series of control points, often used for trails, snakes, and animated ribbons.

```ts
const points = [new Point(0, 0), new Point(100, 0), new Point(200, 50)];
const rope = new MeshRope({
  texture: Texture.from('snake.png'),
  points,
  textureScale: 1, // optional
});
```

- `textureScale > 0` repeats texture; `0` stretches it.
- `autoUpdate = true` re-evaluates geometry each frame.

### MeshPlane

A flexible subdivided quad mesh, suitable for distortion or grid-based warping.

```ts
const plane = new MeshPlane({
  texture: Texture.from('image.png'),
  verticesX: 10,
  verticesY: 10,
});
```

- Automatically resizes on texture update when `autoResize = true`.

### PerspectiveMesh

A special subclass of `MeshPlane` that applies perspective correction by transforming the UVs.

```ts
const mesh = new PerspectiveMesh({
  texture: Texture.from('image.png'),
  verticesX: 20,
  verticesY: 20,
  x0: 0,
  y0: 0,
  x1: 300,
  y1: 30,
  x2: 280,
  y2: 300,
  x3: 20,
  y3: 280,
});
```

- Set corner coordinates via `setCorners(...)`.
- Ideal for emulating 3D projection in 2D.

---

## **API Reference**

- [Mesh](https://pixijs.download/release/docs/scene.Mesh.html)
- [MeshGeometry](https://pixijs.download/release/docs/scene.MeshGeometry.html)
- [MeshSimple](https://pixijs.download/release/docs/scene.MeshSimple.html)
- [MeshRope](https://pixijs.download/release/docs/scene.MeshRope.html)
- [MeshPlane](https://pixijs.download/release/docs/scene.MeshPlane.html)
- [PerspectiveMesh](https://pixijs.download/release/docs/scene.PerspectiveMesh.html)
- [Shader](https://pixijs.download/release/docs/rendering.Shader.html)
- [Texture](https://pixijs.download/release/docs/rendering.Texture.html)


Class Mesh<GEOMETRY, SHADER>Advanced
Base mesh class.

This class empowers you to have maximum flexibility to render any kind of WebGL/WebGPU visuals you can think of. This class assumes a certain level of WebGL/WebGPU knowledge. If you know a bit this should abstract enough away to make your life easier!

Pretty much ALL WebGL/WebGPU can be broken down into the following:

Geometry - The structure and data for the mesh. This can include anything from positions, uvs, normals, colors etc..
Shader - This is the shader that PixiJS will render the geometry with (attributes in the shader must match the geometry)
State - This is the state of WebGL required to render the mesh.
Through a combination of the above elements you can render anything you want, 2D or 3D!

Type Parameters
GEOMETRY extends Geometry = MeshGeometry
SHADER extends Shader = TextureShader
Hierarchy (View Summary, Expand)
Mesh
ViewContainer<MeshGpuData>
Mesh
PerspectiveMesh
MeshPlane
MeshRope
MeshSimple
Implements
View
Instruction
Constructors
C
constructor
Properties
P
accessible?
P
accessibleChildren?
P
accessibleText?
P
accessibleTitle?
P
boundsArea
P
cacheAsBitmap
P
cacheAsTexture
P
children
P
cullable?
P
cullableChildren?
P
cullArea?
P
cursor?
P
destroyed
P
eventMode?
P
filterArea?
P
hitArea?
P
interactive?
P
interactiveChildren?
P
isCachedAsTexture
P
isInteractive
P
label
P
localTransform
P
mask
P
name
P
onclick?
P
onglobalmousemove?
P
onglobalpointermove?
P
onglobaltouchmove?
P
onmousedown?
P
onmouseenter?
P
onmouseleave?
P
onmousemove?
P
onmouseout?
P
onmouseover?
P
onmouseup?
P
onmouseupoutside?
P
onpointercancel?
P
onpointerdown?
P
onpointerenter?
P
onpointerleave?
P
onpointermove?
P
onpointerout?
P
onpointerover?
P
onpointertap?
P
onpointerup?
P
onpointerupoutside?
P
onRender
P
onrightclick?
P
onrightdown?
P
onrightup?
P
onrightupoutside?
P
ontap?
P
ontouchcancel?
P
ontouchend?
P
ontouchendoutside?
P
ontouchmove?
P
ontouchstart?
P
onwheel?
P
parent
P
sortableChildren
P
sortChildren
P
state
P
tabIndex?
P
updateCacheTexture
P
zIndex
Accessors
A
alpha
A
angle
A
blendMode
A
bounds
A
filters
A
geometry
A
height
A
isRenderGroup
A
material
A
pivot
A
position
A
renderable
A
rotation
A
roundPixels
A
scale
A
shader
A
skew
A
texture
A
tint
A
visible
A
width
A
worldTransform
A
x
A
y
Methods
M
addChild
M
addChildAt
M
addEventListener
M
containsPoint
M
destroy
M
dispatchEvent
M
getBounds
M
getChildAt
M
getChildByLabel
M
getChildByName
M
getChildIndex
M
getChildrenByLabel
M
getGlobalAlpha
M
getGlobalPosition
M
getGlobalTint
M
getGlobalTransform
M
getLocalBounds
M
getSize
M
removeChild
M
removeChildAt
M
removeChildren
M
removeEventListener
M
removeFromParent
M
reparentChild
M
reparentChildAt
M
setChildIndex
M
setFromMatrix
M
setMask
M
setSize
M
swapChildren
M
toGlobal
M
toLocal
M
updateLocalTransform
M
updateTransform
M
mixin
constructor
new Mesh<
    GEOMETRY extends Geometry = MeshGeometry,
    SHADER extends Shader = TextureShader,
>(
    options: MeshOptions<GEOMETRY, SHADER>,
): Mesh<GEOMETRY, SHADER>
Type Parameters
GEOMETRY extends Geometry = MeshGeometry
SHADER extends Shader = TextureShader
Parameters
options: MeshOptions<GEOMETRY, SHADER>
options for the mesh instance

Returns Mesh<GEOMETRY, SHADER>
Inherited from ViewContainer.constructor

new Mesh<
    GEOMETRY extends Geometry = MeshGeometry,
    SHADER extends Shader = TextureShader,
>(
    geometry: GEOMETRY,
    shader: SHADER,
    state?: State,
    drawMode?: Topology,
): Mesh<GEOMETRY, SHADER>
Type Parameters
GEOMETRY extends Geometry = MeshGeometry
SHADER extends Shader = TextureShader


MeshGeometry
Class MeshGeometryAdvanced
A geometry used to batch multiple meshes with the same texture.

Hierarchy (View Summary, Expand)
Geometry
MeshGeometry
PlaneGeometry
RopeGeometry
Constructors
C
constructor
Properties
P
attributes
P
batchMode
P
buffers
P
indexBuffer
P
instanceCount
P
topology
P
uid
P
defaultOptions
Accessors
A
bounds
A
indices
A
positions
A
uvs
Methods
M
addAttribute
M
addIndex
M
destroy
M
getAttribute
M
getBuffer
M
getIndex
M
getSize
constructor
new MeshGeometry(options: MeshGeometryOptions): MeshGeometry
Parameters
options: MeshGeometryOptions
The options of the mesh geometry.

Returns MeshGeometry
Overrides Geometry.constructor

new MeshGeometry(
    positions: Float32Array,
    uvs: Float32Array,
    indices: Uint32Array,
): MeshGeometry
Parameters
positions: Float32Array
uvs: Float32Array
indices: Uint32Array
Returns MeshGeometry
Deprecated
since 8.0.0

Overrides Geometry.constructor

Readonlyattributes
attributes: Record<string, Attribute>
A record of the attributes of the geometry.

Inherited from Geometry.attributes

batchMode
batchMode: BatchMode = 'auto'
Readonlybuffers
buffers: Buffer[]
The buffers that the attributes use

Inherited from Geometry.buffers

indexBuffer
indexBuffer: Buffer
The index buffer of the geometry

Inherited from Geometry.indexBuffer

instanceCount
instanceCount: number = 1
the instance count of the geometry to draw

Inherited from Geometry.instanceCount

topology
topology: Topology
The topology of the geometry.

Inherited from Geometry.topology

Readonlyuid
uid: number = ...
The unique id of the geometry.

Inherited from Geometry.uid

StaticdefaultOptions
defaultOptions: MeshGeometryOptions = ...
bounds
get bounds(): Bounds
Returns the bounds of the geometry.

Returns Bounds
Inherited from Geometry.bounds

indices
get indices(): Uint32Array
The indices of the mesh.

Returns Uint32Array
set indices(value: Uint32Array): void
Parameters
value: Uint32Array
Returns void
positions
get positions(): Float32Array
The positions of the mesh.

Returns Float32Array
set positions(value: Float32Array): void
Set the positions of the mesh. When setting the positions, its important that the uvs array is at least as long as the positions array. otherwise the geometry will not be valid.

Parameters
value: Float32Array
The positions of the mesh.

Returns void
uvs
get uvs(): Float32Array
The UVs of the mesh.

Returns Float32Array
set uvs(value: Float32Array): void
Set the UVs of the mesh. Its important that the uvs array you set is at least as long as the positions array. otherwise the geometry will not be valid.

Parameters
value: Float32Array
The UVs of the mesh.

Returns void
addAttribute
addAttribute(name: string, attributeOption: AttributeOption): void
Adds an attribute to the geometry.

Parameters
name: string
The name of the attribute to add.

attributeOption: AttributeOption
The attribute option to add.

Returns void
Inherited from Geometry.addAttribute

addIndex
addIndex(indexBuffer: number[] | TypedArray | Buffer): void
Adds an index buffer to the geometry.

Parameters
indexBuffer: number[] | TypedArray | Buffer
The index buffer to add. Can be a Buffer, TypedArray, or an array of numbers.

Returns void
Inherited from Geometry.addIndex

destroy
destroy(destroyBuffers?: boolean): void
destroys the geometry.

Parameters
destroyBuffers: boolean = false
destroy the buffers associated with this geometry

Returns void
Inherited from Geometry.destroy

getAttribute
getAttribute(id: string): Attribute
Returns the requested attribute.

Parameters
id: string
The name of the attribute required

Returns Attribute
The attribute requested.
Inherited from Geometry.getAttribute

getBuffer
getBuffer(id: string): Buffer
Returns the requested buffer.

Parameters
id: string
The name of the buffer required.

Returns Buffer
The buffer requested.
Inherited from Geometry.getBuffer

getIndex
getIndex(): Buffer
Returns the index buffer

Returns Buffer
The index buffer.
Inherited from Geometry.getIndex

getSize
getSize(): number
Used to figure out how many vertices there are in this geometry

Returns number
the number of vertices in the geometry

Inherited from Geometry.getSize

Class MeshSimpleAdvanced
A simplified mesh class that provides an easy way to create and manipulate textured meshes with direct vertex control. Perfect for creating custom shapes, deformable sprites, and simple 2D effects.

Example
// Create a basic triangle mesh
const triangleMesh = new MeshSimple({
    texture: Texture.from('sprite.png'),
    vertices: new Float32Array([
        0, 0,      // Top-left
        100, 0,    // Top-right
        50, 100    // Bottom-center
    ]),
    uvs: new Float32Array([
        0, 0,    // Map top-left of texture
        1, 0,    // Map top-right of texture
        0.5, 1   // Map bottom-center of texture
    ])
});

// Animate vertices
app.ticker.add(() => {
    const time = performance.now() / 1000;
    const vertices = triangleMesh.vertices;

    // Move the top vertex up and down
    vertices[1] = Math.sin(time) * 20;
    triangleMesh.vertices = vertices; // Update vertices

    // Auto-updates by default
});

// Create a line strip
const lineMesh = new MeshSimple({
    texture: Texture.from('line.png'),
    vertices: new Float32Array([
        0, 0,
        50, 50,
        100, 0,
        150, 50
    ]),
    topology: 'line-strip'
});

// Manual vertex updates
lineMesh.autoUpdate = false;
const vertices = lineMesh.vertices;
vertices[0] += 10;
lineMesh.vertices = vertices; // Update vertices manually
// Update the vertices buffer manually
lineMesh.geometry.getBuffer('aPosition').update();
Copy
See
Mesh For more advanced mesh customization
MeshGeometry For direct geometry manipulation
Hierarchy (View Summary, Expand)
Mesh
MeshSimple
Constructors
C
constructor
Properties
P
accessible?
P
accessibleChildren?
P
accessibleText?
P
accessibleTitle?
P
autoUpdate
P
boundsArea
P
cacheAsBitmap
P
cacheAsTexture
P
children
P
cullable?
P
cullableChildren?
P
cullArea?
P
cursor?
P
destroyed
P
eventMode?
P
filterArea?
P
hitArea?
P
interactive?
P
interactiveChildren?
P
isCachedAsTexture
P
isInteractive
P
label
P
localTransform
P
mask
P
name
P
onclick?
P
onglobalmousemove?
P
onglobalpointermove?
P
onglobaltouchmove?
P
onmousedown?
P
onmouseenter?
P
onmouseleave?
P
onmousemove?
P
onmouseout?
P
onmouseover?
P
onmouseup?
P
onmouseupoutside?
P
onpointercancel?
P
onpointerdown?
P
onpointerenter?
P
onpointerleave?
P
onpointermove?
P
onpointerout?
P
onpointerover?
P
onpointertap?
P
onpointerup?
P
onpointerupoutside?
P
onRender
P
onrightclick?
P
onrightdown?
P
onrightup?
P
onrightupoutside?
P
ontap?
P
ontouchcancel?
P
ontouchend?
P
ontouchendoutside?
P
ontouchmove?
P
ontouchstart?
P
onwheel?
P
parent
P
sortableChildren
P
sortChildren
P
state
P
tabIndex?
P
updateCacheTexture
P
zIndex
Accessors
A
alpha
A
angle
A
blendMode
A
bounds
A
filters
A
geometry
A
height
A
isRenderGroup
A
material
A
pivot
A
position
A
renderable
A
rotation
A
roundPixels
A
scale
A
shader
A
skew
A
texture
A
tint
A
vertices
A
visible
A
width
A
worldTransform
A
x
A
y
Methods
M
addChild
M
addChildAt
M
addEventListener
M
containsPoint
M
destroy
M
dispatchEvent
M
getBounds
M
getChildAt
M
getChildByLabel
M
getChildByName
M
getChildIndex
M
getChildrenByLabel
M
getGlobalAlpha
M
getGlobalPosition
M
getGlobalTint
M
getGlobalTransform
M
getLocalBounds
M
getSize
M
removeChild
M
removeChildAt
M
removeChildren
M
removeEventListener
M
removeFromParent
M
reparentChild
M
reparentChildAt
M
setChildIndex
M
setFromMatrix
M
setMask
M
setSize
M
swapChildren
M
toGlobal
M
toLocal
M
updateLocalTransform
M
updateTransform
M
mixin
constructor
new MeshSimple(options: SimpleMeshOptions): MeshSimple
Parameters
options: SimpleMeshOptions
Options to be used for construction

Returns MeshSimple
Overrides Mesh.constructor



MeshRope
Class MeshRope
A specialized mesh that renders a texture along a path defined by points. Perfect for creating snake-like animations, chains, ropes, and other flowing objects.

Example
// Create a snake with multiple segments
const points = [];
for (let i = 0; i < 20; i++) {
    points.push(new Point(i * 50, 0));
}

const snake = new MeshRope({
    texture: Texture.from('snake.png'),
    points,
    textureScale: 0.5
});

// Animate the snake
app.ticker.add((delta) => {
    const time = performance.now() / 1000;

    // Update points to create wave motion
    for (let i = 0; i < points.length; i++) {
        points[i].y = Math.sin(i * 0.5 + time) * 30;
        points[i].x = (i * 50) + Math.cos(i * 0.3 + time) * 20;
    }
});

// Disable auto updates if manually updating
snake.autoUpdate = false;
Copy
Hierarchy (View Summary, Expand)
MeshRope
Class MeshRope
A specialized mesh that renders a texture along a path defined by points. Perfect for creating snake-like animations, chains, ropes, and other flowing objects.

Example
// Create a snake with multiple segments
const points = [];
for (let i = 0; i < 20; i++) {
    points.push(new Point(i * 50, 0));
}

const snake = new MeshRope({
    texture: Texture.from('snake.png'),
    points,
    textureScale: 0.5
});

// Animate the snake
app.ticker.add((delta) => {
    const time = performance.now() / 1000;

    // Update points to create wave motion
    for (let i = 0; i < points.length; i++) {
        points[i].y = Math.sin(i * 0.5 + time) * 30;
        points[i].x = (i * 50) + Math.cos(i * 0.3 + time) * 20;
    }
});

// Disable auto updates if manually updating
snake.autoUpdate = false;
Copy
Hierarchy (View Summary, Expand)
MeshRope
Class MeshRope
A specialized mesh that renders a texture along a path defined by points. Perfect for creating snake-like animations, chains, ropes, and other flowing objects.

Example
// Create a snake with multiple segments
const points = [];
for (let i = 0; i < 20; i++) {
    points.push(new Point(i * 50, 0));
}

const snake = new MeshRope({
    texture: Texture.from('snake.png'),
    points,
    textureScale: 0.5
});

// Animate the snake
app.ticker.add((delta) => {
    const time = performance.now() / 1000;

    // Update points to create wave motion
    for (let i = 0; i < points.length; i++) {
        points[i].y = Math.sin(i * 0.5 + time) * 30;
        points[i].x = (i * 50) + Math.cos(i * 0.3 + time) * 20;
    }
});

// Disable auto updates if manually updating
snake.autoUpdate = false;
Copy
Hierarchy (View Summary, Expand)
Class ShaderAdvanced
The Shader class is an integral part of the PixiJS graphics pipeline. Central to rendering in PixiJS are two key elements: A [shader] and a [geometry]. The shader incorporates a GlProgram for WebGL or a GpuProgram for WebGPU, instructing the respective technology on how to render the geometry.

The primary goal of the Shader class is to offer a unified interface compatible with both WebGL and WebGPU. When constructing a shader, you need to provide both a WebGL program and a WebGPU program due to the distinctions between the two rendering engines. If only one is provided, the shader won't function with the omitted renderer.

Both WebGL and WebGPU utilize the same resource object when passed into the shader. Post-creation, the shader's interface remains consistent across both WebGL and WebGPU. The sole distinction lies in whether a glProgram or a gpuProgram is employed.

Modifying shader uniforms, which can encompass:

TextureSampler TextureStyle
TextureSource TextureSource
UniformsGroups UniformGroup
Example
const shader = new Shader({
    glProgram: glProgram,
    gpuProgram: gpuProgram,
    resources: {
        uTexture: texture.source,
        uSampler: texture.sampler,
        uColor: [1, 0, 0, 1],
    },
});

// update the uniforms
shader.resources.uColor[1] = 1;
shader.resources.uTexture = texture2.source;
@class
Copy
Hierarchy (View Summary, Expand)
EventEmitter<{ destroy: Shader }>
Shader
Filter
DefaultShader
TextureShader
Constructors
C
constructor
Properties
P
compatibleRenderers
P
glProgram
P
gpuProgram
P
groups
P
resources
P
uid
Methods
M
addResource
M
destroy
M
from
constructor
new Shader(options: ShaderWithResources): Shader
There are two ways to create a shader. one is to pass in resources which is a record of uniform groups and resources. another is to pass in groups which is a record of BindGroups. this second method is really to make use of shared BindGroups. For most cases you will want to use resources as they are easier to work with. USe Groups if you want to share BindGroups between shaders. you cannot mix and match - either use resources or groups.

Parameters
options: ShaderWithResources
The options for the shader

Returns Shader
Overrides EventEmitter<{'destroy': Shader}>.constructor

new Shader(options: ShaderWithGroups): Shader
Parameters
options: ShaderWithGroups
Returns Shader
Overrides EventEmitter<{'destroy': Shader}>.constructor

ReadonlycompatibleRenderers
compatibleRenderers: number
A number that uses two bits on whether the shader is compatible with the WebGL renderer and/or the WebGPU renderer. 0b00 - not compatible with either 0b01 - compatible with WebGL 0b10 - compatible with WebGPU This is automatically set based on if a GlProgram or GpuProgram is provided.

glProgram
glProgram: GlProgram
An instance of the GL program used by the WebGL renderer

gpuProgram
gpuProgram: GpuProgram
An instance of the GPU program used by the WebGPU renderer

groups
groups: Record<number, BindGroup>
resources
resources: Record<string, any>
A record of the resources used by the shader.

Readonlyuid
uid: number = ...
A unique identifier for the shader

addResource
addResource(name: string, groupIndex: number, bindIndex: number): void
Sometimes a resource group will be provided later (for example global uniforms) In such cases, this method can be used to let the shader know about the group.

Parameters
name: string
the name of the resource group

groupIndex: number
the index of the group (should match the webGPU shader group location)

bindIndex: number
the index of the bind point (should match the webGPU shader bind point)

Returns void
destroy
destroy(destroyPrograms?: boolean): void
Use to destroy the shader when its not longer needed. It will destroy the resources and remove listeners.

Parameters
destroyPrograms: boolean = false
if the programs should be destroyed as well. Make sure its not being used by other shaders!

Returns void
Staticfrom
from(options: ShaderFromGroups): Shader
A short hand function to create a shader based of a vertex and fragment shader.

Parameters
options: ShaderFromGroups
Returns Shader
A shiny new PixiJS shader!

from(options: ShaderFromResources): Shader
A short hand function to create a shader based of a vertex and fragment shader.

Parameters
options: ShaderFromResources
Returns Shader
A shiny new PixiJS shader!

Class Texture<TextureSourceType>
A texture stores the information that represents an image or part of an image.

A texture must have a loaded resource passed to it to work. It does not contain any loading mechanisms.

The Assets class can be used to load a texture from a file. This is the recommended way as it will handle the loading and caching for you.


const texture = await Assets.load('assets/image.png');

// once Assets has loaded the image it will be available via the from method
const sameTexture = Texture.from('assets/image.png');
// another way to access the texture once loaded
const sameAgainTexture = Asset.get('assets/image.png');

const sprite1 = new Sprite(texture);

Copy
It cannot be added to the display list directly; instead use it as the texture for a Sprite. If no frame is provided for a texture, then the whole image is used.

You can directly create a texture from an image and then reuse it multiple times like this :

import { Sprite, Texture } from 'pixi.js';

const texture = await Assets.load('assets/image.png');
const sprite1 = new Sprite(texture);
const sprite2 = new Sprite(texture);
Copy
If you didn't pass the texture frame to constructor, it enables noFrame mode: it subscribes on baseTexture events, it automatically resizes at the same time as baseTexture.

Type Parameters
TextureSourceType extends TextureSource = TextureSource
Hierarchy (View Summary)
EventEmitter<{ destroy: Texture; update: Texture }>
Texture
RenderTexture
Implements
BindableTexture
Constructors
C
constructor
Properties
P
defaultAnchor?
P
defaultBorders?
P
destroyed
P
dynamic
P
frame
P
isTexture
P
label?
P
noFrame
P
orig
P
rotate
P
trim
P
uid
P
uvs
P
EMPTY
P
from
P
WHITE
Accessors
A
baseTexture
A
height
A
source
A
textureMatrix
A
width
Methods
M
destroy
M
update
M
updateUvs
constructor
new Texture<TextureSourceType extends TextureSource<any> = TextureSource<any>>(
    options?: TextureOptions<TextureSourceType>,
): Texture<TextureSourceType>
Type Parameters
TextureSourceType extends TextureSource<any> = TextureSource<any>
Parameters
options: TextureOptions<TextureSourceType> = {}
Options for the texture

Returns Texture<TextureSourceType>
Overrides EventEmitter<{ update: Texture destroy: Texture }>.constructor

Optional ReadonlydefaultAnchor
defaultAnchor?: { x: number; y: number }
Anchor point that is used as default if sprite is created with this texture. Changing the defaultAnchor at a later point of time will not update Sprite's anchor point.

Default
{0,0}
Copy
Optional ReadonlydefaultBorders
defaultBorders?: TextureBorders
Default width of the non-scalable border that is used if 9-slice plane is created with this texture.

Since
7.2.0

See
NineSliceSprite

Readonlydestroyed
destroyed: boolean
Has the texture been destroyed?

dynamic
dynamic: boolean = false
Set to true if you plan on modifying the uvs of this texture. When this is the case, sprites and other objects using the texture will make sure to listen for changes to the uvs and update their vertices accordingly.

Readonlyframe
frame: Rectangle = ...
This is the area of the BaseTexture image to actually copy to the Canvas / WebGL when rendering, irrespective of the actual frame size or placement (which can be influenced by trimmed texture atlases)

ReadonlyisTexture
isTexture: true
is it a texture? yes! used for type checking

Optionallabel
label?: string
label used for debugging

noFrame
noFrame: boolean = false
Does this Texture have any frame data assigned to it?

This mode is enabled automatically if no frame was passed inside constructor.

In this mode texture is subscribed to baseTexture events, and fires update on any change.

Beware, after loading or resize of baseTexture event can fired two times! If you want more control, subscribe on baseTexture itself.

Example
texture.on('update', () => {});
Copy
Readonlyorig
orig: Rectangle
This is the area of original texture, before it was put in atlas.

Readonlyrotate
rotate: number
Indicates whether the texture is rotated inside the atlas set to 2 to compensate for texture packer rotation set to 6 to compensate for spine packer rotation can be used to rotate or mirror sprites See groupD8 for explanation

Readonlytrim
trim: Rectangle
This is the trimmed area of original texture, before it was put in atlas Please call updateUvs() after you change coordinates of trim manually.

Readonlyuid
uid: number = ...
unique id for this texture

Readonlyuvs
uvs: UVs = ...
A uvs object based on the given frame and the texture source

StaticEMPTY
EMPTY: Texture
an Empty Texture used internally by the engine

Staticfrom
from: (id: TextureSourceLike, skipCache?: boolean) => Texture
Helper function that creates a returns Texture based on the source you provide. The source should be loaded and ready to go. If not its best to grab the asset using Assets.

Type declaration
(id: TextureSourceLike, skipCache?: boolean): Texture
Parameters
id: TextureSourceLike
String or Source to create texture from

OptionalskipCache: boolean
Skip adding the texture to the cache

Returns Texture
The texture based on the Id provided

StaticWHITE
WHITE: Texture<BufferImageSource>
a White texture used internally by the engine

baseTexture
get baseTexture(): TextureSource
Returns TextureSource
Deprecated
since 8.0.0

height
get height(): number
The height of the Texture in pixels.

Returns number
source
get source(): TextureSourceType
the underlying source of the texture (equivalent of baseTexture in v7)

Returns TextureSourceType
Implementation of BindableTexture.source

set source(value: TextureSourceType): void
Parameters
value: TextureSourceType
Returns void
Implementation of BindableTexture.source

textureMatrix
get textureMatrix(): TextureMatrix
returns a TextureMatrix instance for this texture. By default, that object is not created because its heavy.

Returns TextureMatrix
width
get width(): number
The width of the Texture in pixels.

Returns number
destroy
destroy(destroySource?: boolean): void
Destroys this texture

Parameters
destroySource: boolean = false
Destroy the source when the texture is destroyed.

Returns void
update
update(): void
Call this if you have modified the texture outside of the constructor.

If you have modified this texture's source, you must separately call texture.source.update() to see those changes.

Returns void
updateUvs
updateUvs(): void
Call this function when you have modified the frame of this texture.

Returns void
import { Application, Assets, PerspectiveMesh } from 'pixi.js';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: '#1099bb', resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  const texture = await Assets.load({
    src: 'https://pixijs.com/assets/eggHead.png',
  });

  const points = [
    { x: 0, y: 0 },
    { x: texture.width, y: 0 },
    { x: texture.width, y: texture.height },
    { x: 0, y: texture.height },
  ];

  const outPoints = points.map((p) => ({ ...p }));

  const mesh = app.stage.addChild(
    new PerspectiveMesh({
      texture,
      pivot: {
        x: texture.width / 2,
        y: texture.height / 2,
      },
      x: app.screen.width / 2,
      y: app.screen.height / 2,
      width: texture.width,
      height: texture.height,
    }),
  );

  mesh.scale = 2;

  let angleX = 0;
  let angleY = 0;

  // Function to apply 3D rotation to the points
  function rotate3D(points, outPoints, angleX, angleY, perspective) {
    const radX = (angleX * Math.PI) / 180;
    const radY = (angleY * Math.PI) / 180;
    const cosX = Math.cos(radX);
    const sinX = Math.sin(radX);
    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);

    for (let i = 0; i < points.length; i++) {
      const src = points[i];
      const out = outPoints[i];
      const x = src.x - texture.width / 2;
      const y = src.y - texture.height / 2;
      let z = 0; // Assume initial z is 0 for this 2D plane

      // Rotate around Y axis
      const xY = cosY * x - sinY * z;

      z = sinY * x + cosY * z;

      // Rotate around X axis
      const yX = cosX * y - sinX * z;

      z = sinX * y + cosX * z;

      // Apply perspective projection
      const scale = perspective / (perspective - z);

      out.x = xY * scale + texture.width / 2;
      out.y = yX * scale + texture.height / 2;
    }
  }

  app.ticker.add(() => {
    rotate3D(points, outPoints, angleX, angleY, 300);
    mesh.setCorners(
      outPoints[0].x,
      outPoints[0].y,
      outPoints[1].x,
      outPoints[1].y,
      outPoints[2].x,
      outPoints[2].y,
      outPoints[3].x,
      outPoints[3].y,
    );
  });

  app.stage.hitArea = app.screen;
  app.stage.eventMode = 'static';
  app.stage.on('pointermove', (e) => {
    const { x, y } = e.global;

    angleY = -(x - mesh.x) / 10;
    angleX = -(y - mesh.y) / 10;
  });
})();

import { Application, Assets, Container, MeshRope, Point } from 'pixi.js';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  // Load the snake texture
  const texture = await Assets.load('https://pixijs.com/assets/snake.png');

  let count = 0;

  // Build a rope from points!
  const ropeLength = 918 / 20;
  const points = [];

  for (let i = 0; i < 20; i++) {
    points.push(new Point(i * ropeLength, 0));
  }

  // Create the snake MeshRope
  const strip = new MeshRope({ texture, points });

  strip.x = -459;

  const snakeContainer = new Container();

  snakeContainer.x = 400;
  snakeContainer.y = 300;

  snakeContainer.scale.set(800 / 1100);
  app.stage.addChild(snakeContainer);

  snakeContainer.addChild(strip);

  // Animate the rope points
  app.ticker.add(() => {
    count += 0.1;

    // make the snake
    for (let i = 0; i < points.length; i++) {
      points[i].y = Math.sin(i * 0.5 + count) * 30;
      points[i].x = i * ropeLength + Math.cos(i * 0.3 + count) * 20;
    }
  });
})();
import { Application, Assets, Graphics, MeshRope, Point } from 'pixi.js';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  // Load the snake texture
  const texture = await Assets.load('https://pixijs.com/assets/snake.png');

  let count = 0;

  // Build a rope from points!
  const ropeLength = 45;

  const points = [];

  for (let i = 0; i < 25; i++) {
    points.push(new Point(i * ropeLength, 0));
  }

  // Create the snake MeshRope
  const strip = new MeshRope({ texture, points });

  strip.x = -40;
  strip.y = 300;

  app.stage.addChild(strip);

  const g = new Graphics();

  g.x = strip.x;
  g.y = strip.y;
  app.stage.addChild(g);

  // Start animating
  app.ticker.add(() => {
    count += 0.1;

    // Make the snake
    for (let i = 0; i < points.length; i++) {
      points[i].y = Math.sin(i * 0.5 + count) * 30;
      points[i].x = i * ropeLength + Math.cos(i * 0.3 + count) * 20;
    }
    renderPoints();
  });

  function renderPoints() {
    g.clear();
    g.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      g.lineTo(points[i].x, points[i].y);
      g.stroke({ width: 2, color: 0xffc2c2 });
    }

    for (let i = 1; i < points.length; i++) {
      g.drawCircle(points[i].x, points[i].y, 10);
      g.fill({ color: 0xff0022 });
      g.stroke({ width: 2, color: 0xffc2c2 });
    }
  }
})();
import { Application, Geometry, Mesh, Shader } from 'pixi.js';
import fragment from './triangle.frag';
import vertex from './triangle.vert';
import source from './triangle.wgsl';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({
    resizeTo: window,
    preference: 'webgl',
  });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  const geometry = new Geometry({
    attributes: {
      aPosition: [-100, -50, 100, -50, 0, 100],
    },
  });

  // Webgl vertex and fragment shader source
  const gl = { vertex, fragment };

  // WebGPU vertex and fragment shader source
  // Here vertex and fragment shader sources are inferred from the same WGSL source
  const gpu = {
    vertex: {
      entryPoint: 'main',
      source,
    },
    fragment: {
      entryPoint: 'main',
      source,
    },
  };

  const shader = Shader.from({
    gl,
    gpu,
  });

  const triangle = new Mesh({
    geometry,
    shader,
  });

  triangle.position.set(400, 300);

  app.stage.addChild(triangle);

  app.ticker.add(() => {
    triangle.rotation += 0.01;
  });
})();
in vec2 aPosition;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;

uniform mat3 uTransformMatrix;


void main() {

    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
}
void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}

struct GlobalUniforms {
    projectionMatrix:mat3x3<f32>,
    worldTransformMatrix:mat3x3<f32>,
    worldColorAlpha: vec4<f32>,
    uResolution: vec2<f32>,
}

struct LocalUniforms {
    uTransformMatrix:mat3x3<f32>,
    uColor:vec4<f32>,
    uRound:f32,
}

@group(0) @binding(0) var<uniform> globalUniforms : GlobalUniforms;
@group(1) @binding(0) var<uniform> localUniforms : LocalUniforms;

@vertex
fn main(
    @location(0) aPosition : vec2<f32>,
) -> @builtin(position) vec4<f32> {     
    var mvp = globalUniforms.projectionMatrix 
        * globalUniforms.worldTransformMatrix 
        * localUniforms.uTransformMatrix;
    return vec4<f32>(mvp * vec3<f32>(aPosition, 1.0), 1.0);
};

@fragment
fn main() -> @location(0) vec4<f32> {
    return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}

import { Application, Geometry, Mesh, Shader } from 'pixi.js';
import fragment from './triangleColor.frag';
import vertex from './triangleColor.vert';
import source from './triangleColor.wgsl';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({
    resizeTo: window,
    preference: 'webgpu',
  });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  const geometry = new Geometry({
    attributes: {
      aPosition: [-100, -50, 100, -50, 0, 100],
      aColor: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    },
  });

  const gl = { vertex, fragment };

  const gpu = {
    vertex: {
      entryPoint: 'mainVert',
      source,
    },
    fragment: {
      entryPoint: 'mainFrag',
      source,
    },
  };

  const shader = Shader.from({
    gl,
    gpu,
  });

  const triangle = new Mesh({
    geometry,
    shader,
  });

  triangle.position.set(400, 300);

  app.stage.addChild(triangle);

  app.ticker.add(() => {
    triangle.rotation += 0.01;
  });
})();
in vec2 aPosition;
in vec3 aColor;

out vec3 vColor;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;

uniform mat3 uTransformMatrix;


void main() {

    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);

    vColor = aColor;
}

in vec3 vColor;

void main() {
    gl_FragColor = vec4(vColor, 1.0);
}

struct GlobalUniforms {
    projectionMatrix:mat3x3<f32>,
    worldTransformMatrix:mat3x3<f32>,
    worldColorAlpha: vec4<f32>,
    uResolution: vec2<f32>,
}

struct LocalUniforms {
    uTransformMatrix:mat3x3<f32>,
    uColor:vec4<f32>,
    uRound:f32,
}

@group(0) @binding(0) var<uniform> globalUniforms : GlobalUniforms;
@group(1) @binding(0) var<uniform> localUniforms : LocalUniforms;

struct VertexOutput {
    @builtin(position) position : vec4<f32>,
    @location(0) vColor : vec3<f32>,
}

@vertex
fn mainVert(
    @location(0) aPosition : vec2<f32>,
    @location(1) aColor : vec3<f32>,
) -> VertexOutput {     
    var mvp = globalUniforms.projectionMatrix 
        * globalUniforms.worldTransformMatrix 
        * localUniforms.uTransformMatrix;

    return VertexOutput(
        vec4<f32>(mvp * vec3<f32>(aPosition, 1.0), 1.0),
        aColor,
    );
};

@fragment
fn mainFrag(input: VertexOutput) -> @location(0) vec4<f32>{
    return vec4<f32>(input.vColor, 1.0);
}


import { Application, Assets, Geometry, Mesh, Shader } from 'pixi.js';
import fragment from './triangleTextured.frag';
import vertex from './triangleTextured.vert';

(async () => {
  const texture = await Assets.load('https://pixijs.com/assets/bg_scene_rotate.jpg');

  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({
    resizeTo: window,
    preference: 'webgl',
  });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  const geometry = new Geometry({
    attributes: {
      aPosition: [
        -100,
        -100, // x, y
        100,
        -100, // x, y
        100,
        100,
      ], // x, y,,
      aColor: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      aUV: [0, 0, 1, 0, 1, 1],
    },
  });

  const shader = Shader.from({
    gl: {
      vertex,
      fragment,
    },
    resources: {
      uTexture: texture.source,
    },
  });

  const triangle = new Mesh({
    geometry,
    shader,
  });

  triangle.position.set(400, 300);

  app.stage.addChild(triangle);

  app.ticker.add(() => {
    triangle.rotation += 0.01;
  });
})();
in vec2 aPosition;
in vec3 aColor;
in vec2 aUV;

out vec3 vColor;
out vec2 vUV;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;

uniform mat3 uTransformMatrix;


void main() {

    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);

    vColor = aColor;
    vUV = aUV;
}

in vec3 vColor;
in vec2 vUV;

uniform sampler2D uTexture;

void main() {
    gl_FragColor = texture2D(uTexture, vUV) * vec4(vColor, 1.0);
}

import { Application, Assets, Geometry, GlProgram, Mesh, Shader } from 'pixi.js';
import fragment from './sharedGeometry.frag';
import vertex from './sharedGeometry.vert';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({
    resizeTo: window,
    preference: 'webgl',
  });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  const geometry = new Geometry({
    attributes: {
      aPosition: [
        -100,
        -100, // x, y
        100,
        -100, // x, y
        100,
        100, // x, y,
      ],
      aUV: [0, 0, 1, 0, 1, 1],
    },
  });

  const glProgram = GlProgram.from({
    vertex,
    fragment,
  });

  const triangle = new Mesh({
    geometry,
    shader: new Shader({
      glProgram,
      resources: {
        uTexture: (await Assets.load('https://pixijs.com/assets/bg_scene_rotate.jpg')).source,
      },
    }),
  });

  const triangle2 = new Mesh({
    geometry,
    shader: new Shader({
      glProgram,
      resources: {
        uTexture: (await Assets.load('https://pixijs.com/assets/bg_rotate.jpg')).source,
      },
    }),
  });

  const triangle3 = new Mesh({
    geometry,
    shader: new Shader({
      glProgram,
      resources: {
        uTexture: (await Assets.load('https://pixijs.com/assets/bg_displacement.jpg')).source,
      },
    }),
  });

  triangle.position.set(400, 300);
  triangle.scale.set(2);

  triangle2.position.set(200, 100);

  triangle3.position.set(500, 400);
  triangle3.scale.set(3);

  app.stage.addChild(triangle3, triangle2, triangle);

  app.ticker.add(() => {
    triangle.rotation += 0.01;
    triangle2.rotation -= 0.01;
    triangle3.rotation -= 0.005;
  });
})();
in vec2 aPosition;
in vec2 aUV;

out vec2 vUV;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;

uniform mat3 uTransformMatrix;


void main() {

    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);

    vUV = aUV;
}

in vec2 vUV;

uniform sampler2D uTexture;

void main() {
    gl_FragColor = texture2D(uTexture, vUV);
}


import { Application, Assets, Geometry, Mesh, Shader } from 'pixi.js';
import fragment from './sharedShader.frag';
import vertex from './sharedShader.vert';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({
    resizeTo: window,
    preference: 'webgl',
  });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  const quadGeometry = new Geometry({
    attributes: {
      aPosition: [
        -100,
        -100, // x, y
        100,
        -100, // x, y
        100,
        100, // x, y,
        -100,
        100, // x, y,
      ],
      aUV: [0, 0, 1, 0, 1, 1, 0, 1],
    },
    indexBuffer: [0, 1, 2, 0, 2, 3],
  });

  const geometry = new Geometry({
    attributes: {
      aPosition: [
        -100,
        -100, // x, y
        100,
        -100, // x, y
        100,
        100, // x, y,
      ],
      aUV: [0, 0, 1, 0, 1, 1],
    },
  });

  const shader = Shader.from({
    gl: {
      vertex,
      fragment,
    },
    resources: {
      uTexture: (await Assets.load('https://pixijs.com/assets/bg_rotate.jpg')).source,
    },
  });

  const quad = new Mesh({
    geometry: quadGeometry,
    shader,
  });

  const triangle = new Mesh({
    geometry,
    shader,
  });

  quad.position.set(400, 300);
  triangle.position.set(400, 300);
  triangle.scale.set(2);

  app.stage.addChild(quad, triangle);

  app.ticker.add(() => {
    triangle.rotation += 0.01;
    quad.rotation -= 0.01;
  });
})();
in vec2 aPosition;
in vec2 aUV;

out vec2 vUV;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;

uniform mat3 uTransformMatrix;


void main() {

    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);

    vUV = aUV;
}
in vec2 vUV;

uniform sampler2D uTexture;

void main() {
    gl_FragColor = texture2D(uTexture, vUV).bgra;
}

import { Application, Assets, Buffer, BufferUsage, Geometry, Mesh, Shader } from 'pixi.js';
import fragment from './instancedGeometry.frag';
import vertex from './instancedGeometry.vert';
import source from './instancedGeometry.wgsl';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({
    resizeTo: window,
    preference: 'webgl',
  });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  const spinnyBG = await Assets.load('https://pixijs.com/assets/bg_scene_rotate.jpg');

  const totalTriangles = 1000;

  // need a buffer big enough to store x, y of totalTriangles
  const instancePositionBuffer = new Buffer({
    data: new Float32Array(totalTriangles * 2),
    usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
  });

  const triangles = [];

  for (let i = 0; i < totalTriangles; i++) {
    triangles[i] = {
      x: 800 * Math.random(),
      y: 600 * Math.random(),
      speed: 1 + Math.random() * 2,
    };
  }

  const geometry = new Geometry({
    attributes: {
      aPosition: [
        -10,
        -10, // x, y
        10,
        -20, // x, y
        10,
        10,
      ],
      aUV: [
        0,
        0, // u, v
        1,
        0, // u, v
        1,
        1,
        0,
        1,
      ],
      aPositionOffset: {
        buffer: instancePositionBuffer,
        instance: true,
      },
    },
    instanceCount: totalTriangles,
  });

  const gl = { vertex, fragment };

  const gpu = {
    vertex: {
      entryPoint: 'mainVert',
      source,
    },
    fragment: {
      entryPoint: 'mainFrag',
      source,
    },
  };

  const shader = Shader.from({
    gl,
    gpu,
    resources: {
      uTexture: spinnyBG.source,
      uSampler: spinnyBG.source.style,
      waveUniforms: {
        time: { value: 1, type: 'f32' },
      },
    },
  });

  const triangleMesh = new Mesh({
    geometry,
    shader,
  });

  // triangle.position.set(128 / 2, 128 / 2);

  app.stage.addChild(triangleMesh);

  app.ticker.add(() => {
    const data = instancePositionBuffer.data;

    let count = 0;

    for (let i = 0; i < totalTriangles; i++) {
      const triangle = triangles[i];

      triangle.x += triangle.speed;
      triangle.x %= 800;

      data[count++] = triangle.x;
      data[count++] = triangle.y;
    }

    instancePositionBuffer.update();
  });
})();
in vec2 aPosition;
in vec2 aUV;
in vec2 aPositionOffset;

out vec2 vUV;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;


void main() {

    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(aPosition + aPositionOffset, 1.0)).xy, 0.0, 1.0);

    vUV = aUV;
}

in vec2 vUV;
uniform sampler2D uTexture;
uniform float time;

void main() {
    gl_FragColor = texture(uTexture, vUV + sin( (time + (vUV.x) * 14.) ) * 0.1 );
}

struct GlobalUniforms {
    uProjectionMatrix:mat3x3<f32>,
    uWorldTransformMatrix:mat3x3<f32>,
    uWorldColorAlpha: vec4<f32>,
    uResolution: vec2<f32>,
}

struct LocalUniforms {
    uTransformMatrix:mat3x3<f32>,
    uColor:vec4<f32>,
    uRound:f32,
}


@group(0) @binding(0) var<uniform> globalUniforms : GlobalUniforms;
@group(1) @binding(0) var<uniform> localUniforms : LocalUniforms;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) vUV: vec2<f32>,
};


@vertex
fn mainVert(
    @location(0) aPosition : vec2<f32>,
    @location(1) aUV : vec2<f32>,
    @location(2) aPositionOffset : vec2<f32>,
) -> VertexOutput {     
    var mvp = globalUniforms.uProjectionMatrix 
        * globalUniforms.uWorldTransformMatrix 
        * localUniforms.uTransformMatrix;
    
    var output: VertexOutput;

    output.position = vec4<f32>(mvp * vec3<f32>(aPosition+aPositionOffset, 1.0), 1.0);
    output.vUV = aUV;

    return output; 
};

struct WaveUniforms {
    time:f32,
}

@group(2) @binding(1) var uTexture : texture_2d<f32>;
@group(2) @binding(2) var uSampler : sampler;
@group(2) @binding(3) var<uniform> waveUniforms : WaveUniforms;

@fragment
fn mainFrag(
    @location(0) vUV: vec2<f32>,
) -> @location(0) vec4<f32> {
    return textureSample(uTexture, uSampler, vUV + sin( (waveUniforms.time + (vUV.x) * 14.) ) * 0.1);
};


import { Application, Assets, Container, Geometry, Mesh, RenderTexture, Shader } from 'pixi.js';
import combineFragment from './combine.frag';
import gridFragment from './grid.frag';
import vertex from './multipassMesh.vert';
import noiseFragment from './noise.frag';
import rippleFragment from './ripple.frag';
import waveFragment from './wave.frag';

(async () => {
  const app = new Application();

  await app.init({ height: 640, resizeTo: window, preference: 'webgl' });

  document.body.appendChild(app.view);

  // Build geometry.
  const geometry = new Geometry({
    attributes: {
      aPosition: [
        0,
        0, // x, y
        200,
        0, // x, y
        200,
        200, // x, y,
        0,
        200, // x, y,
      ],
      aUV: [0, 0, 1, 0, 1, 1, 0, 1],
    },
    indexBuffer: [0, 1, 2, 0, 2, 3],
  });

  // Load a perlinnoise texture for one of the shaders.
  const perlinTexture = await Assets.load('https://pixijs.com/assets/perlin.jpg');

  const gridShader = Shader.from({
    gl: {
      // Vertex shader. Use same shader for all passes.
      vertex,
      // First pass, generates a grid.
      fragment: gridFragment,
    },
    resources: {
      gridUniforms: {
        zoom: { type: 'f32', value: 10 },
      },
    },
  });

  // Sharing textures and meshes is possible.
  // But for simplicity each pass has its own output texture and mesh in this example.
  const gridTexture = RenderTexture.create({ width: 200, height: 200 });
  const gridQuad = new Mesh({ geometry, shader: gridShader });
  const gridContainer = new Container();

  gridContainer.addChild(gridQuad);

  const rippleShader = Shader.from({
    gl: {
      vertex,
      // Second pass. Takes grid as input and makes it ripple.
      fragment: rippleFragment,
    },
    resources: {
      rippleUniforms: {
        amount: { type: 'f32', value: 0.5 },
        phase: { type: 'f32', value: 0 },
      },
      texIn: gridTexture.source,
    },
  });

  const rippleTexture = RenderTexture.create({ width: 200, height: 200 });
  const rippleQuad = new Mesh({ geometry, shader: rippleShader });
  const rippleContainer = new Container();

  rippleContainer.addChild(rippleQuad);

  const noiseShader = Shader.from({
    gl: {
      vertex,
      // Second effect. Generates a filtered noise.
      fragment: noiseFragment,
    },
    resources: {
      noiseUniforms: {
        limit: { type: 'f32', value: 0.5 },
      },
      noise: perlinTexture.source,
    },
  });

  const noiseTexture = RenderTexture.create({ width: 200, height: 200 });
  const noiseQuad = new Mesh({ geometry, shader: noiseShader });
  const noiseContainer = new Container();

  noiseContainer.addChild(noiseQuad);

  const waveShader = Shader.from({
    gl: {
      vertex,
      // Third effect
      fragment: waveFragment,
    },
    resources: {
      waveUniforms: {
        amplitude: { type: 'f32', value: 0.75 },
        time: { type: 'f32', value: 0 },
      },
    },
  });

  const waveTexture = RenderTexture.create({ width: 200, height: 200 });
  const waveQuad = new Mesh(geometry, waveShader);
  const waveContainer = new Container();

  waveContainer.addChild(waveQuad);

  const combineShader = Shader.from({
    gl: {
      vertex,
      // Final combination pass
      fragment: combineFragment,
    },
    resources: {
      texRipple: rippleTexture.source,
      texNoise: noiseTexture.source,
      texWave: waveTexture.source,
    },
  });

  const combineQuad = new Mesh(geometry, combineShader);

  gridContainer.position.set(10, 10);
  rippleContainer.position.set(220, 10);
  noiseContainer.position.set(10, 220);
  waveContainer.position.set(10, 430);
  combineQuad.position.set(430, 220);

  // Add all phases to stage so all the phases can be seen separately.
  app.stage.addChild(gridContainer);
  app.stage.addChild(rippleContainer);
  app.stage.addChild(noiseContainer);
  app.stage.addChild(waveContainer);
  app.stage.addChild(combineQuad);

  // start the animation..
  let time = 0;

  app.ticker.add(() => {
    time += 1 / 60;
    gridQuad.shader.resources.gridUniforms.uniforms.zoom = Math.sin(time) * 5 + 10;
    rippleQuad.shader.resources.rippleUniforms.phase = -time;
    waveQuad.shader.resources.waveUniforms.uniforms.time = time;
    noiseQuad.shader.resources.noiseUniforms.uniforms.limit = Math.sin(time * 0.5) * 0.35 + 0.5;

    // Render the passes to get textures.
    app.renderer.render({
      container: gridQuad,
      target: gridTexture,
    });

    app.renderer.render({
      container: rippleQuad,
      target: rippleTexture,
    });

    app.renderer.render({
      container: noiseQuad,
      target: noiseTexture,
    });

    app.renderer.render({
      container: waveQuad,
      target: waveTexture,
    });
  });
})();
