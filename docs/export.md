Render Loop
At the core of PixiJS lies its render loop, a repeating cycle that updates and redraws your scene every frame. Unlike traditional web development where rendering is event-based (e.g. on user input), PixiJS uses a continuous animation loop that provides full control over real-time rendering.

This guide provides a deep dive into how PixiJS structures this loop internally, from the moment a frame begins to when it is rendered to the screen. Understanding this will help you write more performant, well-structured applications.

Overview
Each frame, PixiJS performs the following sequence:

Tickers are executed (user logic)
Scene graph is updated (transforms and culling)
Rendering occurs (GPU draw calls)
This cycle repeats as long as your application is running and its ticker is active.

Step 1: Running Ticker Callbacks
The render loop is driven by the Ticker class, which uses requestAnimationFrame to schedule work. Each tick:

Measures elapsed time since the previous frame
Caps it based on minFPS and maxFPS
Calls every listener registered with ticker.add() or app.ticker.add()
Example
app.ticker.add((ticker) => {
  bunny.rotation += ticker.deltaTime * 0.1;
});

Every callback receives the current Ticker instance. You can access ticker.deltaTime (scaled frame delta) and ticker.elapsedMS (unscaled delta in ms) to time animations.

Step 2: Updating the Scene Graph
PixiJS uses a hierarchical scene graph to represent all visual objects. Before rendering, the graph needs to be traversed to:

Recalculate transforms (world matrix updates)
Apply custom logic via onRender handlers
Apply culling if enabled
Step 3: Rendering the Scene
Once the scene graph is ready, the renderer walks the display list starting at app.stage:

Applies global and local transformations
Batches draw calls when possible
Uploads geometry, textures, and uniforms
Issues GPU commands
All rendering is retained mode: objects persist across frames unless explicitly removed.

Rendering is done via either WebGL or WebGPU, depending on your environment. The renderer abstracts away the differences behind a common API.

Full Frame Lifecycle Diagram
requestAnimationFrame
        │
    [Ticker._tick()]
        │
    ├─ Compute elapsed time
    ├─ Call user listeners
    │   └─ sprite.onRender
    ├─ Cull display objects (if enabled)
    ├─ Update world transforms
    └─ Render stage
            ├─ Traverse display list
            ├─ Upload data to GPU
            └─ Draw

Edit this page  

Render Groups
Understanding RenderGroups in PixiJS
As you delve deeper into PixiJS, especially with version 8, you'll encounter a powerful feature known as RenderGroups. Think of RenderGroups as specialized containers within your scene graph that act like mini scene graphs themselves. Here's what you need to know to effectively use Render Groups in your projects:

What Are Render Groups?
Render Groups are essentially containers that PixiJS treats as self-contained scene graphs. When you assign parts of your scene to a Render Group, you're telling PixiJS to manage these objects together as a unit. This management includes monitoring for changes and preparing a set of render instructions specifically for the group. This is a powerful tool for optimizing your rendering process.

Why Use Render Groups?
The main advantage of using Render Groups lies in their optimization capabilities. They allow for certain calculations, like transformations (position, scale, rotation), tint, and alpha adjustments, to be offloaded to the GPU. This means that operations like moving or adjusting the Render Group can be done with minimal CPU impact, making your application more performance-efficient.

In practice, you're utilizing Render Groups even without explicit awareness. The root element you pass to the render function in PixiJS is automatically converted into a RenderGroup as this is where its render instructions will be stored. Though you also have the option to explicitly create additional RenderGroups as needed to further optimize your project.

This feature is particularly beneficial for:

Static Content: For content that doesn't change often, a Render Group can significantly reduce the computational load on the CPU. In this case static refers to the scene graph structure, not that actual values of the PixiJS elements inside it (eg position, scale of things).
Distinct Scene Parts: You can separate your scene into logical parts, such as the game world and the HUD (Heads-Up Display). Each part can be optimized individually, leading to overall better performance.
Examples
const myGameWorld = new Container({
  isRenderGroup: true,
});

const myHud = new Container({
  isRenderGroup: true,
});

scene.addChild(myGameWorld, myHud);

renderer.render(scene); // this action will actually convert the scene to a render group under the hood

Check out the container example.

Best Practices
Don't Overuse: While Render Groups are powerful, using too many can actually degrade performance. The goal is to find a balance that optimizes rendering without overwhelming the system with too many separate groups. Make sure to profile when using them. The majority of the time you won't need to use them at all!
Strategic Grouping: Consider what parts of your scene change together and which parts remain static. Grouping dynamic elements separately from static elements can lead to performance gains.
By understanding and utilizing Render Groups, you can take full advantage of PixiJS's rendering capabilities, making your applications smoother and more efficient. This feature represents a powerful tool in the optimization toolkit offered by PixiJS, enabling developers to create rich, interactive scenes that run smoothly across different devices.

Render Layers
The PixiJS Layer API provides a powerful way to control the rendering order of objects independently of their logical parent-child relationships in the scene graph. With RenderLayers, you can decouple how objects are transformed (via their logical parent) from how they are visually drawn on the screen.

Using RenderLayers ensures these elements are visually prioritized while maintaining logical parent-child relationships. Examples include:

A character with a health bar: Ensure the health bar always appears on top of the world, even if the character moves behind an object.

UI elements like score counters or notifications: Keep them visible regardless of the game world’s complexity.

Highlighting Elements in Tutorials: Imagine a tutorial where you need to push back most game elements while highlighting a specific object. RenderLayers can split these visually. The highlighted object can be placed in a foreground layer to be rendered above a push back layer.

This guide explains the key concepts, provides practical examples, and highlights common gotchas to help you use the Layer API effectively.

Key Concepts
Independent Rendering Order:

RenderLayers allow control of the draw order independently of the logical hierarchy, ensuring objects are rendered in the desired order.
Logical Parenting Stays Intact:

Objects maintain transformations (e.g., position, scale, rotation) from their logical parent, even when attached to RenderLayers.
Explicit Object Management:

Objects must be manually reassigned to a layer after being removed from the scene graph or layer, ensuring deliberate control over rendering.
Dynamic Sorting:

Within layers, objects can be dynamically reordered using zIndex and sortChildren for fine-grained control of rendering order.
Basic API Usage
First lets create two items that we want to render, red guy and blue guy.

const redGuy = new PIXI.Sprite('red guy');
redGuy.tint = 0xff0000;

const blueGuy = new PIXI.Sprite('blue guy');
blueGuy.tint = 0x0000ff;

stage.addChild(redGuy, blueGuy);

alt text

Now we know that red guy will be rendered first, then blue guy. Now in this simple example you could get away with just sorting the zIndex of the red guy and blue guy to help reorder.

But this is a guide about render layers, so lets create one of those.

Use renderLayer.attach to assign an object to a layer. This overrides the object’s default render order defined by its logical parent.

// a layer..
const layer = new RenderLayer();
stage.addChild(layer);
layer.attach(redGuy);

alt text

So now our scene graph order is:

|- stage
    |-- redGuy
    |-- blueGuy
    |-- layer

And our render order is:

|- stage
    |-- blueGuy
    |-- layer
        |-- redGuy


This happens because the layer is now the last child in the stage. Since the red guy is attached to the layer, it will be rendered at the layer's position in the scene graph. However, it still logically remains in the same place in the scene hierarchy.

3. Removing Objects from a Layer
Now let's remove the red guy from the layer. To stop an object from being rendered in a layer, use removeFromLayer. Once removed from the layer, its still going to be in the scene graph, and will be rendered in its scene graph order.

layer.detach(redGuy); //  Stop rendering the rect via the layer

alt text

Removing an object from its logical parent (removeChild) automatically removes it from the layer.

stage.removeChild(redGuy); // if the red guy was removed from the stage, it will also be removed from the layer


alt text

However, if you remove the red guy from the stage and then add it back to the stage, it will not be added to the layer again.

// add red guy to his original position
stage.addChildAt(redGuy, 0);

alt text

You will need to reattach it to the layer yourself.

layer.attach(redGuy); // re attach it to the layer again!

alt text

This may seem like a pain, but it's actually a good thing. It means that you have full control over the render order of the object, and you can change it at any time. It also means you can't accidentally add an object to a container and have it automatically re-attach to a layer that may or may not still be around - it would be quite confusing and lead to some very hard to debug bugs!

5. Layer Position in Scene Graph
The layer’s position in the scene graph determines its render priority relative to other layers and objects.

// reparent the layer to render first in the stage
stage.addChildAt(layer, 0);

alt text
Complete Example
Here’s a real-world example that shows how to use RenderLayers to set ap player ui on top of the world.

1


Editor
Preview
Both

Gotchas and Things to Watch Out For
Manual Reassignment:

When an object is re-added to a logical parent, it does not automatically reassociate with its previous layer. Always reassign the object to the layer explicitly.
Nested Children:

If you remove a parent container, all its children are automatically removed from layers. Be cautious with complex hierarchies.
Sorting Within Layers:

Objects in a layer can be sorted dynamically using their zIndex property. This is useful for fine-grained control of render order.
rect.zIndex = 10; // Higher values render later
layer.sortableChildren = true; // Enable sorting
layer.sortRenderLayerChildren(); // Apply the sorting

Layer Overlap:

If multiple layers overlap, their order in the scene graph determines the render priority. Ensure the layering logic aligns with your desired visual output.
Best Practices
Group Strategically: Minimize the number of layers to optimize performance.
Use for Visual Clarity: Reserve layers for objects that need explicit control over render order.
Test Dynamic Changes: Verify that adding, removing, or reassigning objects to layers behaves as expected in your specific scene setup.
By understanding and leveraging RenderLayers effectively, you can achieve precise control over your scene's visual presentation while maintaining a clean and logical hierarchy.

Renderers
PixiJS renderers are responsible for drawing your scene to a canvas using either WebGL/WebGL2 or WebGPU. These renderers are high-performance GPU-accelerated engines and are composed of modular systems that manage everything from texture uploads to rendering pipelines.

All PixiJS renderers inherit from a common base, which provides consistent methods such as .render(), .resize(), and .clear() as well as shared systems for managing the canvas, texture GC, events, and more.

Renderer Types
Renderer	Description	Status
WebGLRenderer	Default renderer using WebGL/WebGL2. Well supported and stable.	✅ Recommended
WebGPURenderer	Modern GPU renderer using WebGPU. More performant, still maturing.	🚧 Experimental
CanvasRenderer	Fallback renderer using 2D canvas.	❌ Coming-soon
info
The WebGPU renderer is feature complete, however, inconsistencies in browser implementations may lead to unexpected behavior. It is recommended to use the WebGL renderer for production applications.

Creating a Renderer
You can use autoDetectRenderer() to create the best renderer for the environment:

import { autoDetectRenderer } from 'pixi.js';

const renderer = await autoDetectRenderer({
  preference: 'webgpu', // or 'webgl'
});

Or construct one explicitly:

import { WebGLRenderer, WebGPURenderer } from 'pixi.js';

const renderer = new WebGLRenderer();
await renderer.init(options);

Rendering a Scene
To render a scene, you can use the render() method. This will draw the specified container to the screen or a texture:

import { Container } from 'pixi.js';

const container = new Container();
renderer.render(container);

// or provide a complete set of options
renderer.render({
  target: container,
  clear: true, // clear the screen before rendering
  transform: new Matrix(), // optional transform to apply to the container
});

Resizing the Renderer
To resize the renderer, use the resize() method. This will adjust the canvas size and update the resolution:

renderer.resize(window.innerWidth, window.innerHeight);

Generating Textures
You can generate textures from containers using the generateTexture() method. This is useful for creating textures from dynamic content:

import { Sprite } from 'pixi.js';

const sprite = new Sprite();
const texture = renderer.generateTexture(sprite);

Resetting State
To reset the renderer's state, use the resetState() method. This is useful when mixing PixiJS with other libraries like Three.js:

function render() {
  // Render the Three.js scene
  threeRenderer.resetState();
  threeRenderer.render(scene, camera);

  // Render the PixiJS stage
  pixiRenderer.resetState();
  pixiRenderer.render({ container: stage });

  requestAnimationFrame(render);
}

requestAnimationFrame(render);

See our full guide on mixing PixiJS with Three.js for more details.

Textures
Textures are one of the most essential components in the PixiJS rendering pipeline. They define the visual content used by Sprites, Meshes, and other renderable objects. This guide covers how textures are loaded, created, and used, along with the various types of data sources PixiJS supports.

Texture Lifecycle
The texture system is built around two major classes:

TextureSource: Represents a pixel source, such as an image, canvas, or video.
Texture: Defines a view into a TextureSource, including sub-rectangles, trims, and transformations.
Lifecycle Flow
Source File/Image -> TextureSource -> Texture -> Sprite (or other display object)

Loading Textures
Textures can be loaded asynchronously using the Assets system:

const texture = await Assets.load('myTexture.png');

const sprite = new Sprite(texture);

Preparing Textures
Even after you've loaded your textures, the images still need to be pushed to the GPU and decoded. Doing this for a large number of source images can be slow and cause lag spikes when your project first loads. To solve this, you can use the Prepare plugin, which allows you to pre-load textures in a final step before displaying your project.

Texture vs. TextureSource
The TextureSource handles the raw pixel data and GPU upload. A Texture is a lightweight view on that source, with metadata such as trimming, frame rectangle, UV mapping, etc. Multiple Texture instances can share a single TextureSource, such as in a sprite sheet.

const sheet = await Assets.load('spritesheet.json');
const heroTexture = sheet.textures['hero.png'];

Texture Creation
You can manually create textures using the constructor:

const mySource = new TextureSource({ resource: myImage });
const texture = new Texture({ source: mySource });

Set dynamic: true in the Texture options if you plan to modify its frame, trim, or source at runtime.

Destroying Textures
Once you're done with a Texture, you may wish to free up the memory (both WebGL-managed buffers and browser-based) that it uses. To do so, you should call Assets.unload('texture.png'), or texture.destroy() if you have created the texture outside of Assets.

This is a particularly good idea for short-lived imagery like cut-scenes that are large and will only be used once. If a texture is destroyed that was loaded via Assets then the assets class will automatically remove it from the cache for you.

Unload Texture from GPU
If you want to unload a texture from the GPU but keep it in memory, you can call texture.source.unload(). This will remove the texture from the GPU but keep the source in memory.

// Load the texture
const texture = await Assets.load('myTexture.png');

// ... Use the texture

// Unload the texture from the GPU
texture.source.unload();

Texture Types
PixiJS supports multiple TextureSource types, depending on the kind of input data:

Texture Type	Description
ImageSource	HTMLImageElement, ImageBitmap, SVG's, VideoFrame, etc.
CanvasSource	HTMLCanvasElement or OffscreenCanvas
VideoSource	HTMLVideoElement with optional auto-play and update FPS
BufferImageSource	TypedArray or ArrayBuffer with explicit width, height, and format
CompressedSource	Array of compressed mipmaps (Uint8Array[])
Common Texture Properties
Here are some important properties of the Texture class:

frame: Rectangle defining the visible portion within the source.
orig: Original untrimmed dimensions.
trim: Defines trimmed regions to exclude transparent space.
uvs: UV coordinates generated from frame and rotate.
rotate: GroupD8 rotation value for atlas compatibility.
defaultAnchor: Default anchor when used in Sprites.
defaultBorders: Used for 9-slice scaling.
source: The TextureSource instance.
Common TextureSource Properties
Here are some important properties of the TextureSource class:

resolution: Affects render size relative to actual pixel size.
format: Texture format (e.g., rgba8unorm, bgra8unorm, etc.)
alphaMode: Controls how alpha is interpreted on upload.
wrapMode / scaleMode: Controls how texture is sampled outside of bounds or when scaled.
autoGenerateMipmaps: Whether to generate mipmaps on upload.
You can set these properties when creating a TextureSource:

texture.source.scaleMode = 'linear';
texture.source.wrapMode = 'repeat';

API Reference
Texture
TextureSource
TextureStyle
RenderTexture
Edit this page

Texture
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

Class TextureSource<T>Advanced
A TextureSource stores the information that represents an image. All textures have require TextureSource, which contains information about the source. Therefore you can have many textures all using a single TextureSource (eg a sprite sheet)

This is an class is extended depending on the source of the texture. Eg if you are using an an image as your resource, then an ImageSource is used.

Type Parameters
T extends Record<string, any> = any
Hierarchy (View Summary, Expand)
EventEmitter<
    {
        change: BindResource;
        destroy: TextureSource;
        error: Error;
        resize: TextureSource;
        styleChange: TextureSource;
        unload: TextureSource;
        update: TextureSource;
        updateMipmaps: TextureSource;
    },
>
TextureSource
BufferImageSource
CanvasSource
CompressedSource
ImageSource
VideoSource
Implements
BindResource
Constructors
C
constructor
Properties
P
alphaMode
P
antialias
P
autoGarbageCollect
P
autoGenerateMipmaps
P
destroyed
P
dimension
P
format
P
height
P
isPowerOfTwo
P
label
P
mipLevelCount
P
pixelHeight
P
pixelWidth
P
resource
P
uid
P
width
P
defaultOptions
P
from
Accessors
A
addressMode
A
lodMaxClamp
A
lodMinClamp
A
magFilter
A
minFilter
A
mipmapFilter
A
repeatMode
A
resolution
A
resourceHeight
A
resourceWidth
A
scaleMode
A
source
A
style
A
wrapMode
Methods
M
destroy
M
resize
M
unload
M
update
M
updateMipmaps
M
test
constructor
new TextureSource<T extends Record<string, any> = any>(
    options?: TextureSourceOptions<T>,
): TextureSource<T>
Type Parameters
T extends Record<string, any> = any
Parameters
options: TextureSourceOptions<T> = {}
options for creating a new TextureSource

Returns TextureSource<T>
Overrides EventEmitter<{ change: BindResource; update: TextureSource; unload: TextureSource; destroy: TextureSource; resize: TextureSource; styleChange: TextureSource; updateMipmaps: TextureSource; error: Error; }>.constructor

alphaMode
alphaMode: ALPHA_MODES
the alpha mode of the texture

antialias
antialias: boolean = false
Only really affects RenderTextures. Should we use antialiasing for this texture. It will look better, but may impact performance as a Blit operation will be required to resolve the texture.

autoGarbageCollect
autoGarbageCollect: boolean
If true, the Garbage Collector will unload this texture if it is not used after a period of time

autoGenerateMipmaps
autoGenerateMipmaps: boolean = false
Should we auto generate mipmaps for this texture? This will automatically generate mipmaps for this texture when uploading to the GPU. Mipmapped textures take up more memory, but can look better when scaled down.

For performance reasons, it is recommended to NOT use this with RenderTextures, as they are often updated every frame. If you do, make sure to call updateMipmaps after you update the texture.

Readonlydestroyed
destroyed: boolean
Has the source been destroyed?

Implementation of BindResource.destroyed

dimension
dimension: TEXTURE_DIMENSIONS = '2d'
how many dimensions does this texture have? currently v8 only supports 2d

format
format: TEXTURE_FORMATS = 'rgba8unorm'
the format that the texture data has

height
height: number = 1
the height of this texture source, accounting for resolution eg pixelHeight 200, resolution 2, then height will be 100

isPowerOfTwo
isPowerOfTwo: boolean
label
label: string
optional label, can be used for debugging

mipLevelCount
mipLevelCount: number = 1
The number of mip levels to generate for this texture. this is overridden if autoGenerateMipmaps is true

pixelHeight
pixelHeight: number = 1
the pixel height of this texture source. This is the REAL pure number, not accounting resolution

pixelWidth
pixelWidth: number = 1
the pixel width of this texture source. This is the REAL pure number, not accounting resolution

resource
resource: T
the resource that will be uploaded to the GPU. This is where we get our pixels from eg an ImageBimt / Canvas / Video etc

Readonlyuid
uid: number = ...
unique id for this Texture source

width
width: number = 1
the width of this texture source, accounting for resolution eg pixelWidth 200, resolution 2, then width will be 100

StaticdefaultOptions
defaultOptions: TextureSourceOptions = ...
The default options used when creating a new TextureSource. override these to add your own defaults

Staticfrom
from: (resource: TextureResourceOrOptions) => TextureSource
A helper function that creates a new TextureSource based on the resource you provide.

Type declaration
(resource: TextureResourceOrOptions): TextureSource
Parameters
resource: TextureResourceOrOptions
The resource to create the texture source from.

Returns TextureSource
addressMode
get addressMode(): WRAP_MODE
setting this will set wrapModeU,wrapModeV and wrapModeW all at once!

Returns WRAP_MODE
set addressMode(value: WRAP_MODE): void
Parameters
value: WRAP_MODE
Returns void
lodMaxClamp
get lodMaxClamp(): number
Specifies the minimum and maximum levels of detail, respectively, used internally when sampling a texture.

Returns number
set lodMaxClamp(value: number): void
Parameters
value: number
Returns void
lodMinClamp
get lodMinClamp(): number
Specifies the minimum and maximum levels of detail, respectively, used internally when sampling a texture.

Returns number
set lodMinClamp(value: number): void
Parameters
value: number
Returns void
magFilter
get magFilter(): SCALE_MODE
Specifies the sampling behavior when the sample footprint is smaller than or equal to one texel.

Returns SCALE_MODE
set magFilter(value: SCALE_MODE): void
Parameters
value: SCALE_MODE
Returns void
minFilter
get minFilter(): SCALE_MODE
Specifies the sampling behavior when the sample footprint is larger than one texel.

Returns SCALE_MODE
set minFilter(value: SCALE_MODE): void
Parameters
value: SCALE_MODE
Returns void
mipmapFilter
get mipmapFilter(): SCALE_MODE
Specifies behavior for sampling between mipmap levels.

Returns SCALE_MODE
set mipmapFilter(value: SCALE_MODE): void
Parameters
value: SCALE_MODE
Returns void
repeatMode
get repeatMode(): WRAP_MODE
setting this will set wrapModeU,wrapModeV and wrapModeW all at once!

Returns WRAP_MODE
set repeatMode(value: WRAP_MODE): void
Parameters
value: WRAP_MODE
Returns void
resolution
get resolution(): number
the resolution of the texture. Changing this number, will not change the number of pixels in the actual texture but will the size of the texture when rendered.

changing the resolution of this texture to 2 for example will make it appear twice as small when rendered (as pixel density will have increased)

Returns number
set resolution(resolution: number): void
Parameters
resolution: number
Returns void
resourceHeight
get resourceHeight(): number
the height of the resource. This is the REAL pure number, not accounting resolution

Returns number
resourceWidth
get resourceWidth(): number
the width of the resource. This is the REAL pure number, not accounting resolution

Returns number
scaleMode
get scaleMode(): SCALE_MODE
setting this will set magFilter,minFilter and mipmapFilter all at once!

Returns SCALE_MODE
set scaleMode(value: SCALE_MODE): void
Parameters
value: SCALE_MODE
Returns void
source
get source(): TextureSource
returns itself

Returns TextureSource
style
get style(): TextureStyle
the style of the texture

Returns TextureStyle
set style(value: TextureStyle): void
Parameters
value: TextureStyle
Returns void
wrapMode
get wrapMode(): WRAP_MODE
Returns WRAP_MODE
set wrapMode(value: WRAP_MODE): void
Parameters
value: WRAP_MODE
Returns void
destroy
destroy(): void
Destroys this texture source

Returns void
resize
resize(width?: number, height?: number, resolution?: number): boolean
Resize the texture, this is handy if you want to use the texture as a render texture

Parameters
Optionalwidth: number
the new width of the texture

Optionalheight: number
the new height of the texture

Optionalresolution: number
the new resolution of the texture

Returns boolean
if the texture was resized
unload
unload(): void
This will unload the Texture source from the GPU. This will free up the GPU memory As soon as it is required fore rendering, it will be re-uploaded.

Returns void
update
update(): void
call this if you have modified the texture outside of the constructor

Returns void
updateMipmaps
updateMipmaps(): void
Lets the renderer know that this texture has been updated and its mipmaps should be re-generated. This is only important for RenderTexture instances, as standard Texture instances will have their mipmaps generated on upload. You should call this method after you make any change to the texture

The reason for this is is can be quite expensive to update mipmaps for a texture. So by default, We want you, the developer to specify when this action should happen.

Generally you don't want to have mipmaps generated on Render targets that are changed every frame,

Returns void
Statictest
test(_resource: any): any
Parameters
_resource: any
Returns any

Class TextureStyleAdvanced
A texture style describes how a texture should be sampled by a shader.

Hierarchy
EventEmitter<{ change: TextureStyle; destroy: TextureStyle }>
TextureStyle
Implements
BindResource
Constructors
C
constructor
Properties
P
addressModeU?
P
addressModeV?
P
addressModeW?
P
compare?
P
destroyed
P
lodMaxClamp?
P
lodMinClamp?
P
magFilter?
P
minFilter?
P
mipmapFilter?
P
defaultOptions
Accessors
A
addressMode
A
maxAnisotropy
A
scaleMode
A
wrapMode
Methods
M
destroy
M
update
constructor
new TextureStyle(options?: TextureStyleOptions): TextureStyle
Parameters
options: TextureStyleOptions = {}
options for the style

Returns TextureStyle
Overrides EventEmitter<{ change: TextureStyle, destroy: TextureStyle, }>.constructor

OptionaladdressModeU
addressModeU?: WRAP_MODE
OptionaladdressModeV
addressModeV?: WRAP_MODE
OptionaladdressModeW
addressModeW?: WRAP_MODE
Specifies the {{GPUAddressMode|address modes}} for the texture width, height, and depth coordinates, respectively.

Optionalcompare
compare?: COMPARE_FUNCTION
When provided the sampler will be a comparison sampler with the specified COMPARE_FUNCTION. Note: Comparison samplers may use filtering, but the sampling results will be implementation-dependent and may differ from the normal filtering rules.

Readonlydestroyed
destroyed: boolean = false
Has the style been destroyed?

Implementation of BindResource.destroyed

OptionallodMaxClamp
lodMaxClamp?: number
Specifies the minimum and maximum levels of detail, respectively, used internally when sampling a texture.

OptionallodMinClamp
lodMinClamp?: number
OptionalmagFilter
magFilter?: SCALE_MODE
Specifies the sampling behavior when the sample footprint is smaller than or equal to one texel.

OptionalminFilter
minFilter?: SCALE_MODE
Specifies the sampling behavior when the sample footprint is larger than one texel.

OptionalmipmapFilter
mipmapFilter?: SCALE_MODE
Specifies behavior for sampling between mipmap levels.

Static ReadonlydefaultOptions
defaultOptions: TextureStyleOptions = ...
default options for the style

addressMode
get addressMode(): WRAP_MODE
setting this will set wrapModeU,wrapModeV and wrapModeW all at once!

Returns WRAP_MODE
set addressMode(value: WRAP_MODE): void
Parameters
value: WRAP_MODE
Returns void
maxAnisotropy
get maxAnisotropy(): number
Returns number
set maxAnisotropy(value: number): void
Specifies the maximum anisotropy value clamp used by the sampler.

Parameters
value: number
Returns void
scaleMode
get scaleMode(): SCALE_MODE
setting this will set magFilter,minFilter and mipmapFilter all at once!

Returns SCALE_MODE
set scaleMode(value: SCALE_MODE): void
Parameters
value: SCALE_MODE
Returns void
wrapMode
get wrapMode(): WRAP_MODE
Returns WRAP_MODE
set wrapMode(value: WRAP_MODE): void
Parameters
value: WRAP_MODE
Returns void
destroy
destroy(): void
Destroys the style

Returns void
update
update(): void
Returns void
Class RenderTextureAdvanced
A render texture, extends Texture.

See
Texture

Hierarchy (View Summary, Expand)
Texture
RenderTexture
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
resize
M
update
M
updateUvs
M
create
constructor
new RenderTexture(options?: TextureOptions<TextureSource<any>>): RenderTexture
Parameters
options: TextureOptions<TextureSource<any>> = {}
Options for the texture

Returns RenderTexture
Inherited from Texture.constructor

Optional ReadonlydefaultAnchor
defaultAnchor?: { x: number; y: number }
Anchor point that is used as default if sprite is created with this texture. Changing the defaultAnchor at a later point of time will not update Sprite's anchor point.

Default
{0,0}
Copy
Inherited from Texture.defaultAnchor

Optional ReadonlydefaultBorders
defaultBorders?: TextureBorders
Default width of the non-scalable border that is used if 9-slice plane is created with this texture.

Since
7.2.0

See
NineSliceSprite

Inherited from Texture.defaultBorders

Readonlydestroyed
destroyed: boolean
Has the texture been destroyed?

Inherited from Texture.destroyed

dynamic
dynamic: boolean = false
Set to true if you plan on modifying the uvs of this texture. When this is the case, sprites and other objects using the texture will make sure to listen for changes to the uvs and update their vertices accordingly.

Inherited from Texture.dynamic

Readonlyframe
frame: Rectangle = ...
This is the area of the BaseTexture image to actually copy to the Canvas / WebGL when rendering, irrespective of the actual frame size or placement (which can be influenced by trimmed texture atlases)

Inherited from Texture.frame

ReadonlyisTexture
isTexture: true
is it a texture? yes! used for type checking

Inherited from Texture.isTexture

Optionallabel
label?: string
label used for debugging

Inherited from Texture.label

noFrame
noFrame: boolean = false
Does this Texture have any frame data assigned to it?

This mode is enabled automatically if no frame was passed inside constructor.

In this mode texture is subscribed to baseTexture events, and fires update on any change.

Beware, after loading or resize of baseTexture event can fired two times! If you want more control, subscribe on baseTexture itself.

Example
texture.on('update', () => {});
Copy
Inherited from Texture.noFrame

Readonlyorig
orig: Rectangle
This is the area of original texture, before it was put in atlas.

Inherited from Texture.orig

Readonlyrotate
rotate: number
Indicates whether the texture is rotated inside the atlas set to 2 to compensate for texture packer rotation set to 6 to compensate for spine packer rotation can be used to rotate or mirror sprites See groupD8 for explanation

Inherited from Texture.rotate

Readonlytrim
trim: Rectangle
This is the trimmed area of original texture, before it was put in atlas Please call updateUvs() after you change coordinates of trim manually.

Inherited from Texture.trim

Readonlyuid
uid: number = ...
unique id for this texture

Inherited from Texture.uid

Readonlyuvs
uvs: UVs = ...
A uvs object based on the given frame and the texture source

Inherited from Texture.uvs

StaticEMPTY
EMPTY: Texture
an Empty Texture used internally by the engine

Inherited from Texture.EMPTY

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

Inherited from Texture.from

StaticWHITE
WHITE: Texture<BufferImageSource>
a White texture used internally by the engine

Inherited from Texture.WHITE

baseTexture
get baseTexture(): TextureSource
Returns TextureSource
Deprecated
since 8.0.0

Inherited from Texture.baseTexture

height
get height(): number
The height of the Texture in pixels.

Returns number
Inherited from Texture.height

source
get source(): TextureSourceType
the underlying source of the texture (equivalent of baseTexture in v7)

Returns TextureSourceType
Inherited from Texture.source

set source(value: TextureSourceType): void
Parameters
value: TextureSourceType
Returns void
Inherited from Texture.source

textureMatrix
get textureMatrix(): TextureMatrix
returns a TextureMatrix instance for this texture. By default, that object is not created because its heavy.

Returns TextureMatrix
Inherited from Texture.textureMatrix

width
get width(): number
The width of the Texture in pixels.

Returns number
Inherited from Texture.width

destroy
destroy(destroySource?: boolean): void
Destroys this texture

Parameters
destroySource: boolean = false
Destroy the source when the texture is destroyed.

Returns void
Inherited from Texture.destroy

resize
resize(width: number, height: number, resolution?: number): this
Resizes the render texture.

Parameters
width: number
The new width of the render texture.

height: number
The new height of the render texture.

Optionalresolution: number
The new resolution of the render texture.

Returns this
This texture.

update
update(): void
Call this if you have modified the texture outside of the constructor.

If you have modified this texture's source, you must separately call texture.source.update() to see those changes.

Returns void
Inherited from Texture.update

updateUvs
updateUvs(): void
Call this function when you have modified the frame of this texture.

Returns void
Inherited from Texture.updateUvs

Staticcreate
create(options: TextureSourceOptions): RenderTexture
Parameters
options: TextureSourceOptions

Container
The Container class is the foundation of PixiJS's scene graph system. Containers act as groups of scene objects, allowing you to build complex hierarchies, organize rendering layers, and apply transforms or effects to groups of objects.

What Is a Container?
A Container is a general-purpose node that can hold other display objects, including other containers. It is used to structure your scene, apply transformations, and manage rendering and interaction.

Containers are not rendered directly. Instead, they delegate rendering to their children.

import { Container, Sprite } from 'pixi.js';

const group = new Container();
const sprite = Sprite.from('bunny.png');

group.addChild(sprite);

Managing Children
PixiJS provides a robust API for adding, removing, reordering, and swapping children in a container:

const container = new Container();
const child1 = new Container();
const child2 = new Container();

container.addChild(child1, child2);
container.removeChild(child1);
container.addChildAt(child1, 0);
container.swapChildren(child1, child2);

You can also remove a child by index or remove all children within a range:

container.removeChildAt(0);
container.removeChildren(0, 2);

To keep a child’s world transform while moving it to another container, use reparentChild or reparentChildAt:

otherContainer.reparentChild(child);

Events
Containers emit events when children are added or removed:

group.on('childAdded', (child, parent, index) => { ... });
group.on('childRemoved', (child, parent, index) => { ... });

Finding Children
Containers support searching children by label using helper methods:

const child = new Container({ label: 'enemy' });
container.addChild(child);
container.getChildByLabel('enemy');
container.getChildrenByLabel(/^enemy/); // all children whose label starts with "enemy"

Set deep = true to search recursively through all descendants.

container.getChildByLabel('ui', true);

Sorting Children
Use zIndex and sortableChildren to control render order within a container:

child1.zIndex = 1;
child2.zIndex = 10;
container.sortableChildren = true;

Call sortChildren() to manually re-sort if needed:

container.sortChildren();

info
Use this feature sparingly, as sorting can be expensive for large numbers of children.

Optimizing with Render Groups
Containers can be promoted to render groups by setting isRenderGroup = true or calling enableRenderGroup().

Use render groups for UI layers, particle systems, or large moving subtrees. See the Render Groups guide for more details.

const uiLayer = new Container({ isRenderGroup: true });

Cache as Texture
The cacheAsTexture function in PixiJS is a powerful tool for optimizing rendering in your applications. By rendering a container and its children to a texture, cacheAsTexture can significantly improve performance for static or infrequently updated containers.

When you set container.cacheAsTexture(), the container is rendered to a texture. Subsequent renders reuse this texture instead of rendering all the individual children of the container. This approach is particularly useful for containers with many static elements, as it reduces the rendering workload.

Note
cacheAsTexture is PixiJS v8's equivalent of the previous cacheAsBitmap functionality. If you're migrating from v7 or earlier, simply replace cacheAsBitmap with cacheAsTexture in your code.

const container = new Container();
const sprite = Sprite.from('bunny.png');
container.addChild(sprite);

// enable cache as texture
container.cacheAsTexture();

// update the texture if the container changes
container.updateCacheTexture();

// disable cache as texture
container.cacheAsTexture(false);

For more advanced usage, including setting cache options and handling dynamic content, refer to the Cache as Texture guide.

API Reference
Container
ContainerOptions
RenderContainer
Class Container<C>
Container is a general-purpose display object that holds children. It also adds built-in support for advanced rendering features like masking and filtering.

It is the base class of all display objects that act as a container for other objects, including Graphics and Sprite.

Transforms
Alpha
Renderable vs Visible
RenderGroup
Type Parameters
C extends ContainerChild
Hierarchy (View Summary, Expand)
Container<C>
EventEmitter<ContainerEvents<C> & AnyEvent>
Container
ViewContainer
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
filters
A
height
A
isRenderGroup
A
pivot
A
position
A
renderable
A
rotation
A
scale
A
skew
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

Interface ContainerOptions<C>
Constructor options used for Container instances.

const container = new Container({
   position: new Point(100, 200),
   scale: new Point(2, 2),
   rotation: Math.PI / 2,
});
Copy
See
Container

interface ContainerOptions<C extends ContainerChild = ContainerChild> {
    accessible?: boolean;
    accessibleChildren?: boolean;
    accessibleHint?: string;
    accessiblePointerEvents?: PointerEvents;
    accessibleText?: string;
    accessibleTitle?: string;
    accessibleType?: keyof HTMLElementTagNameMap;
    alpha?: number;
    angle?: number;
    blendMode?: BLEND_MODES;
    boundsArea?: Rectangle;
    cacheAsTexture?: (val: boolean | CacheAsTextureOptions) => void;
    children?: C[];
    cullable?: boolean;
    cullableChildren?: boolean;
    cullArea?: Rectangle;
    cursor?: string & {} | Cursor;
    eventMode?: EventMode;
    filters?: Filter | readonly Filter[];
    height?: number;
    hitArea?: IHitArea;
    interactive?: boolean;
    interactiveChildren?: boolean;
    isRenderGroup?: boolean;
    label?: string;
    mask?: Mask;
    onclick?: FederatedEventHandler<FederatedPointerEvent>;
    onglobalmousemove?: FederatedEventHandler<FederatedPointerEvent>;
    onglobalpointermove?: FederatedEventHandler<FederatedPointerEvent>;
    onglobaltouchmove?: FederatedEventHandler<FederatedPointerEvent>;
    onmousedown?: FederatedEventHandler<FederatedPointerEvent>;
    onmouseenter?: FederatedEventHandler<FederatedPointerEvent>;
    onmouseleave?: FederatedEventHandler<FederatedPointerEvent>;
    onmousemove?: FederatedEventHandler<FederatedPointerEvent>;
    onmouseout?: FederatedEventHandler<FederatedPointerEvent>;
    onmouseover?: FederatedEventHandler<FederatedPointerEvent>;
    onmouseup?: FederatedEventHandler<FederatedPointerEvent>;
    onmouseupoutside?: FederatedEventHandler<FederatedPointerEvent>;
    onpointercancel?: FederatedEventHandler<FederatedPointerEvent>;
    onpointerdown?: FederatedEventHandler<FederatedPointerEvent>;
    onpointerenter?: FederatedEventHandler<FederatedPointerEvent>;
    onpointerleave?: FederatedEventHandler<FederatedPointerEvent>;
    onpointermove?: FederatedEventHandler<FederatedPointerEvent>;
    onpointerout?: FederatedEventHandler<FederatedPointerEvent>;
    onpointerover?: FederatedEventHandler<FederatedPointerEvent>;
    onpointertap?: FederatedEventHandler<FederatedPointerEvent>;
    onpointerup?: FederatedEventHandler<FederatedPointerEvent>;
    onpointerupoutside?: FederatedEventHandler<FederatedPointerEvent>;
    onRender?: (renderer: Renderer) => void;
    onrightclick?: FederatedEventHandler<FederatedPointerEvent>;
    onrightdown?: FederatedEventHandler<FederatedPointerEvent>;
    onrightup?: FederatedEventHandler<FederatedPointerEvent>;
    onrightupoutside?: FederatedEventHandler<FederatedPointerEvent>;
    ontap?: FederatedEventHandler<FederatedPointerEvent>;
    ontouchcancel?: FederatedEventHandler<FederatedPointerEvent>;
    ontouchend?: FederatedEventHandler<FederatedPointerEvent>;
    ontouchendoutside?: FederatedEventHandler<FederatedPointerEvent>;
    ontouchmove?: FederatedEventHandler<FederatedPointerEvent>;
    ontouchstart?: FederatedEventHandler<FederatedPointerEvent>;
    onwheel?: FederatedEventHandler<FederatedWheelEvent>;
    parent?: Container;
    pivot?: number | PointData;
    position?: PointData;
    renderable?: boolean;
    rotation?: number;
    scale?: number | PointData;
    setMask?: (options: Partial<MaskOptionsAndMask>) => void;
    skew?: PointData;
    sortableChildren?: boolean;
    tabIndex?: number;
    tint?: ColorSource;
    visible?: boolean;
    width?: number;
    x?: number;
    y?: number;
    zIndex?: number;
}
Type Parameters
C extends ContainerChild = ContainerChild
Hierarchy (View Summary, Expand)
ContainerOptions
ContainerOptions
RenderContainerOptions
MeshOptions
ViewContainerOptions
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
alpha?
P
angle?
P
blendMode?
P
boundsArea?
P
cacheAsTexture?
P
children?
P
cullable?
P
cullableChildren?
P
cullArea?
P
cursor?
P
eventMode?
P
filters?
P
height?
P
hitArea?
P
interactive?
P
interactiveChildren?
P
isRenderGroup?
P
label?
P
mask?
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
onRender?
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
parent?
P
pivot?
P
position?
P
renderable?
P
rotation?
P
scale?
P
setMask?
P
skew?
P
sortableChildren?
P
tabIndex?
P
tint?
P
visible?
P
width?
P
x?
P
y?
Class RenderContainerAdvanced
A container that allows for custom rendering logic. Its essentially calls the render function each frame and allows for custom rendering logic - the render could be a WebGL renderer or WebGPU render or even a canvas render. Its up to you to define the logic.

This can be used in two ways, either by extending the class and overriding the render method, or by passing a custom render function

Example
import { RenderContainer } from 'pixi.js';

// extend the class
class MyRenderContainer extends RenderContainer
{
   render(renderer)
   {
     renderer.clear({
        clearColor: 'green', // clear the screen to green when rendering this item
     });
  }
}

// override the render method
const renderContainer = new RenderContainer(
(renderer) =>  {
    renderer.clear({
      clearColor: 'green', // clear the screen to green when rendering this item
    });
})
Copy
Hierarchy (View Summary, Expand)
ViewContainer
RenderContainer
Implements
Instruction
Cache As Texture
Using cacheAsTexture in PixiJS
The cacheAsTexture function in PixiJS is a powerful tool for optimizing rendering in your applications. By rendering a container and its children to a texture, cacheAsTexture can significantly improve performance for static or infrequently updated containers. Let's explore how to use it effectively, along with its benefits and considerations.

Note
cacheAsTexture is PixiJS v8's equivalent of the previous cacheAsBitmap functionality. If you're migrating from v7 or earlier, simply replace cacheAsBitmap with cacheAsTexture in your code.

What Is cacheAsTexture?
When you set container.cacheAsTexture(), the container is rendered to a texture. Subsequent renders reuse this texture instead of rendering all the individual children of the container. This approach is particularly useful for containers with many static elements, as it reduces the rendering workload.

To update the texture after making changes to the container, call:

container.updateCacheTexture();

and to turn it off, call:

container.cacheAsTexture(false);

Basic Usage
Here's an example that demonstrates how to use cacheAsTexture:

import * as PIXI from 'pixi.js';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: '#1099bb', resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  // load sprite sheet..
  await Assets.load('https://pixijs.com/assets/spritesheet/monsters.json');

  // holder to store aliens
  const aliens = [];
  const alienFrames = ['eggHead.png', 'flowerTop.png', 'helmlok.png', 'skully.png'];

  let count = 0;

  // create an empty container
  const alienContainer = new Container();

  alienContainer.x = 400;
  alienContainer.y = 300;

  app.stage.addChild(alienContainer);

  // add a bunch of aliens with textures from image paths
  for (let i = 0; i < 100; i++) {
    const frameName = alienFrames[i % 4];

    // create an alien using the frame name..
    const alien = Sprite.from(frameName);

    alien.tint = Math.random() * 0xffffff;

    alien.x = Math.random() * 800 - 400;
    alien.y = Math.random() * 600 - 300;
    alien.anchor.x = 0.5;
    alien.anchor.y = 0.5;
    aliens.push(alien);
    alienContainer.addChild(alien);
  }

  // this will cache the container and its children as a single texture
  // so instead of drawing 100 sprites, it will draw a single texture!
  alienContainer.cacheAsTexture();
})();

In this example, the container and its children are rendered to a single texture, reducing the rendering overhead when the scene is drawn.

Play around with the example here.

Advanced Usage
Instead of enabling cacheAsTexture with true, you can pass a configuration object which is very similar to texture source options.

container.cacheAsTexture({
  resolution: 2,
  antialias: true,
});

resolution is the resolution of the texture. By default this is the same as you renderer or application.
antialias is the antialias mode to use for the texture. Much like the resolution this defaults to the renderer or application antialias mode.
Benefits of cacheAsTexture
Performance Boost: Rendering a complex container as a single texture avoids the need to process each child element individually during each frame.
Optimized for Static Content: Ideal for containers with static or rarely updated children.
Advanced Details
Memory Tradeoff: Each cached texture requires GPU memory. Using cacheAsTexture trades rendering speed for increased memory usage.
GPU Limitations: If your container is too large (e.g., over 4096x4096 pixels), the texture may fail to cache, depending on GPU limitations.
How It Works Internally
Under the hood, cacheAsTexture converts the container into a render group and renders it to a texture. It uses the same texture cache mechanism as filters:

container.enableRenderGroup();
container.renderGroup.cacheAsTexture = true;

Once the texture is cached, updating it via updateCacheTexture() is efficient and incurs minimal overhead. Its as fast as rendering the container normally.

Best Practices
DO:
Use for Static Content: Apply cacheAsTexture to containers with elements that don't change frequently, such as a UI panel with static decorations.
Leverage for Performance: Use cacheAsTexture to render complex containers as a single texture, reducing the overhead of processing each child element individually every frame. This is especially useful for containers that contain expensive effects eg filters.
Switch of Antialiasing: setting antialiasing to false can give a small performance boost, but the texture may look a bit more pixelated around its children's edges.
Resolution: Do adjust the resolution based on your situation, if something is scaled down, you can use a lower resolution.If something is scaled up, you may want to use a higher resolution. But be aware that the higher the resolution the larger the texture and memory footprint.
DON'T:
Apply to Very Large Containers: Avoid using cacheAsTexture on containers that are too large (e.g., over 4096x4096 pixels), as they may fail to cache due to GPU limitations. Instead, split them into smaller containers.
Overuse for Dynamic Content: Flick cacheAsTexture on / off frequently on containers, as this results in constant re-caching, negating its benefits. Its better to Cache as texture when you once, and then use updateCacheTexture to update it.
Apply to Sparse Content: Do not use cacheAsTexture for containers with very few elements or sparse content, as the performance improvement will be negligible.
Ignore Memory Impact: Be cautious of GPU memory usage. Each cached texture consumes memory, so overusing cacheAsTexture can lead to resource constraints.
Gotchas
Rendering Depends on Scene Visibility: The cache updates only when the containing scene is rendered. Modifying the layout after setting cacheAsTexture but before rendering your scene will be reflected in the cache.

Containers are rendered with no transform: Cached items are rendered at their actual size, ignoring transforms like scaling. For instance, an item scaled down by 50%, its texture will be cached at 100% size and then scaled down by the scene.

Caching and Filters: Filters may not behave as expected with cacheAsTexture. To cache the filter effect, wrap the item in a parent container and apply cacheAsTexture to the parent.

Reusing the texture: If you want to create a new texture based on the container, its better to use const texture = renderer.generateTexture(container) and share that amongst you objects!

By understanding and applying cacheAsTexture strategically, you can significantly enhance the rendering performance of your PixiJS projects. Happy coding!

Edit this page

cacheAsTexture
cacheAsTexture: (val: boolean | CacheAsTextureOptions) => void
Caches this container as a texture. This allows the container to be rendered as a single texture, which can improve performance for complex static containers.

Type declaration
(val: boolean | CacheAsTextureOptions): void
Parameters
val: boolean | CacheAsTextureOptions
If true, enables caching with default options. If false, disables caching. Can also pass options object to configure caching behavior.

Returns void
Example
// Basic caching
container.cacheAsTexture(true);

// With custom options
container.cacheAsTexture({
    resolution: 2,
    antialias: true,
});

// Disable caching
container.cacheAsTexture(false);

// Cache a complex UI
const ui = new Container();
// Add multiple children...
ui.cacheAsTexture(true);
ui.updateCacheTexture(); // Update if contents change
Copy
See
Container#updateCacheTexture For updating cached content
Container#isCachedAsTexture For checking cache state
Inherited from ViewContainer.cacheAsTexture

Readonlychildren
children: ContainerChild[] = []
The array of children of this container. Each child must be a Container or extend from it.

The array is read-only, but its contents can be modified using Container methods.

Example
// Access children
const firstChild = container.children[0];
const lastChild = container.children[container.children.length - 1];
Copy
See
Container#addChild For adding children
Container#removeChild For removing children
Inherited from ViewContainer.children

Optionalcullable
cullable?: boolean
Controls whether this object should be culled when out of view. When true, the object will not be rendered if its bounds are outside the visible area.

Example
const sprite = new Sprite(texture);

// Enable culling
sprite.cullable = true;

// Force object to always render
sprite.cullable = false;
Copy
Remarks
Does not affect transform updates
Applies to this object only
Children follow their own cullable setting
Default
false
Copy
Inherited from ViewContainer.cullable

OptionalcullableChildren
cullableChildren?: boolean
Controls whether children of this container can be culled. When false, skips recursive culling checks for better performance.

Example
const container = new Container();

// Enable container culling
container.cullable = true;

// Disable child culling for performance
container.cullableChildren = false;

// Children will always render if container is visible
container.addChild(sprite1, sprite2, sprite3);
Copy
Remarks
Improves performance for static scenes
Useful when children are always within container bounds
Parent culling still applies
Default
Sprite
Sprites are the foundational visual elements in PixiJS. They represent a single image to be displayed on the screen. Each Sprite contains a Texture to be drawn, along with all the transformation and display state required to function in the scene graph.

import { Assets, Sprite } from 'pixi.js';

const texture = await Assets.load('path/to/image.png');
const sprite = new Sprite(texture);

sprite.anchor.set(0.5);
sprite.position.set(100, 100);
sprite.scale.set(2);
sprite.rotation = Math.PI / 4; // Rotate 45 degrees

Updating the Texture
If you change the texture of a sprite, it will automatically:

Rebind listeners for texture updates
Recalculate width/height if set so that the visual size remains the same
Trigger a visual update
const texture = Assets.get('path/to/image.png');
sprite.texture = texture;

Scale vs Width/Height
Sprites inherit scale from Container, allowing for percentage-based resizing:

sprite.scale.set(2); // Double the size

Sprites also have width and height properties that act as convenience setters for scale, based on the texture’s dimensions:

sprite.width = 100; // Automatically updates scale.x
// sets: sprite.scale.x = 100 / sprite.texture.orig.width;

mport { Application, Assets, Container, Sprite } from 'pixi.js';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: '#1099bb', resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  // load resources
  await Assets.load('https://pixijs.com/assets/spritesheet/monsters.json');

  // holder to store aliens
  const aliens = [];
  const alienFrames = ['eggHead.png', 'flowerTop.png', 'helmlok.png', 'skully.png'];

  let count = 0;

  // create an empty container
  const alienContainer = new Container();

  alienContainer.x = app.screen.width / 2;
  alienContainer.y = app.screen.height / 2;

  // make the stage interactive
  app.stage.eventMode = 'static';
  app.stage.addChild(alienContainer);

  // add a bunch of aliens with textures from image paths
  for (let i = 0; i < 100; i++) {
    const frameName = alienFrames[i % 4];

    // create an alien using the frame name..
    const alien = Sprite.from(frameName);

    alien.tint = Math.random() * 0xffffff;

    alien.x = Math.random() * app.screen.width - app.screen.width / 2;
    alien.y = Math.random() * app.screen.height - app.screen.height / 2;
    alien.anchor.x = 0.5;
    alien.anchor.y = 0.5;
    aliens.push(alien);
    alienContainer.addChild(alien);
  }

  // Combines both mouse click + touch tap
  app.stage.on('pointertap', onClick);

  function onClick() {
    alienContainer.cacheAsTexture(!alienContainer.isCachedAsTexture);
  }

  app.ticker.add(() => {
    // let's rotate the aliens a little bit
    for (let i = 0; i < 100; i++) {
      const alien = aliens[i];

      alien.rotation += 0.1;
    }

    count += 0.01;

    alienContainer.scale.x = Math.sin(count);
    alienContainer.scale.y = Math.sin(count);
    alienContainer.rotation += 0.01;
  });
})();
import { Application, Assets, Container, DisplacementFilter, RenderLayer, Sprite, TilingSprite } from 'pixi.js';
import { Fish } from './Fish';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ width: 630, height: 410, antialias: true });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);
  // move the canvas to the center of the screen
  app.canvas.style.position = 'absolute';
  app.canvas.style.top = `${window.innerHeight / 2 - app.canvas.height / 2}px`;
  app.canvas.style.left = `${window.innerWidth / 2 - app.canvas.width / 2}px`;

  // Load textures
  await Assets.load([
    `https://pixijs.com/assets/pond/displacement_BG.jpg`,
    `https://pixijs.com/assets/pond/overlay.png`,
    `https://pixijs.com/assets/pond/displacement_map.png`,
    `https://pixijs.com/assets/pond/displacement_fish1.png`,
    `https://pixijs.com/assets/pond/displacement_fish2.png`,
  ]);

  const background = Sprite.from('https://pixijs.com/assets/pond/displacement_BG.jpg');

  const pondContainer = new Container();

  pondContainer.addChild(background);

  app.stage.addChild(pondContainer);

  const displacementMap = Assets.get('https://pixijs.com/assets/pond/displacement_map.png');

  displacementMap.source.wrapMode = 'repeat';

  const displacementSprite = Sprite.from(displacementMap);
  const displacementFilter = new DisplacementFilter(displacementSprite, 40);

  pondContainer.addChild(displacementSprite);
  pondContainer.filters = [displacementFilter];

  const uiLayer = new RenderLayer();

  const fishes = [];

  const names = ['Alice', 'Bob', 'Caroline', 'David', 'Ellie', 'Frank', 'Gloria', 'Henry', 'Isabel', 'Jack'];
  const textures = [
    Assets.get('https://pixijs.com/assets/pond/displacement_fish1.png'),
    Assets.get('https://pixijs.com/assets/pond/displacement_fish2.png'),
  ];

  for (let i = 0; i < 10; i++) {
    const fish = new Fish(names[i % names.length], textures[i % textures.length]);

    fishes.push(fish);
    pondContainer.addChild(fish);

    fish.x = Math.random() * 630;
    fish.y = Math.random() * 410;

    uiLayer.attach(fish.ui);
  }

  const waterOverlay = TilingSprite.from(Assets.get('https://pixijs.com/assets/pond/overlay.png'));

  waterOverlay.width = 630;
  waterOverlay.height = 410;

  pondContainer.addChild(waterOverlay);

  app.stage.addChild(uiLayer);

  // Animate the mask
  app.ticker.add(() => {
    waterOverlay.tilePosition.x += 0.5;
    waterOverlay.tilePosition.y += 0.5;

    displacementSprite.x += 0.5;
    displacementSprite.y += 0.5;

    fishes.forEach((fish) => fish.update());
  });
})();
import { Application, Assets, Container, Graphics, Sprite, Text } from 'pixi.js';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ antialias: true, resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  app.stage.eventMode = 'static';

  // Load textures
  await Assets.load([
    'https://pixijs.com/assets/bg_rotate.jpg',
    'https://pixijs.com/assets/bg_scene_rotate.jpg',
    'https://pixijs.com/assets/light_rotate_2.png',
    'https://pixijs.com/assets/light_rotate_1.png',
    'https://pixijs.com/assets/panda.png',
  ]);

  const bg = Sprite.from('https://pixijs.com/assets/bg_rotate.jpg');

  bg.anchor.set(0.5);

  bg.x = app.screen.width / 2;
  bg.y = app.screen.height / 2;

  app.stage.addChild(bg);

  const container = new Container();

  container.x = app.screen.width / 2;
  container.y = app.screen.height / 2;

  // Add a bunch of sprites
  const bgFront = Sprite.from('https://pixijs.com/assets/bg_scene_rotate.jpg');

  bgFront.anchor.set(0.5);

  const light2 = Sprite.from('https://pixijs.com/assets/light_rotate_2.png');

  light2.anchor.set(0.5);

  const light1 = Sprite.from('https://pixijs.com/assets/light_rotate_1.png');

  light1.anchor.set(0.5);

  const panda = Sprite.from('https://pixijs.com/assets/panda.png');

  panda.anchor.set(0.5);

  container.addChild(bgFront, light2, light1, panda);

  app.stage.addChild(container);

  // Let's create a moving shape mask
  const thing = new Graphics();

  app.stage.addChild(thing);
  thing.x = app.screen.width / 2;
  thing.y = app.screen.height / 2;

  container.mask = thing;

  let count = 0;

  app.stage.on('pointertap', () => {
    if (!container.mask) {
      container.mask = thing;
    } else {
      container.mask = null;
    }
  });

  const help = new Text({
    text: 'Click or tap to turn masking on / off.',
    style: {
      fontFamily: 'Arial',
      fontSize: 12,
      fontWeight: 'bold',
      fill: 'white',
    },
  });

  help.y = app.screen.height - 26;
  help.x = 10;
  app.stage.addChild(help);

  // Animate the mask
  app.ticker.add(() => {
    bg.rotation += 0.01;
    bgFront.rotation -= 0.01;

    light1.rotation += 0.02;
    light2.rotation += 0.01;

    panda.scale.x = 1 + Math.sin(count) * 0.04;
    panda.scale.y = 1 + Math.cos(count) * 0.04;

    count += 0.1;

    thing.clear();
    thing.moveTo(-120 + Math.sin(count) * 20, -100 + Math.cos(count) * 20);
    thing.lineTo(120 + Math.cos(count) * 20, -100 + Math.sin(count) * 20);
    thing.lineTo(120 + Math.sin(count) * 20, 100 + Math.cos(count) * 20);
    thing.lineTo(-120 + Math.cos(count) * 20, 100 + Math.sin(count) * 20);
    thing.fill({ color: 0x8bc5ff, alpha: 0.4 });
    thing.rotation = count * 0.1;
  });
})();
import { Application, Graphics } from 'pixi.js';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: '#1099bb', resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  const rect = new Graphics().rect(0, 0, 400, 400).fill('red');
  const masky = new Graphics().star(160, 160, 5, 100).fill('yellow');

  masky.width = 240;
  masky.height = 240;

  rect.setMask({
    mask: masky,
    inverse: true,
  });

  app.stage.addChild(rect, masky);
  app.stage.position.set(window.innerWidth / 2 - 200, window.innerHeight / 2 - 200);
})();
import { Application, Assets, groupD8, Rectangle, Sprite, Text, Texture } from 'pixi.js';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  // Load the texture
  const texture = await Assets.load('https://pixijs.com/assets/flowerTop.png');

  // Create rotated textures
  const textures = [texture];
  const D8 = groupD8;

  for (let rotate = 1; rotate < 16; rotate++) {
    const h = D8.isVertical(rotate) ? texture.frame.width : texture.frame.height;
    const w = D8.isVertical(rotate) ? texture.frame.height : texture.frame.width;

    const { frame } = texture;
    const crop = new Rectangle(texture.frame.x, texture.frame.y, w, h);
    const trim = crop;
    let rotatedTexture;

    if (rotate % 2 === 0) {
      rotatedTexture = new Texture({
        source: texture.baseTexture,
        frame,
        orig: crop,
        trim,
        rotate,
      });
    } else {
      rotatedTexture = new Texture({
        source: texture.baseTexture,
        frame,
        orig: crop,
        trim,
        rotate,
      });
    }
    textures.push(rotatedTexture);
  }

  const offsetX = (app.screen.width / 16) | 0;
  const offsetY = (app.screen.height / 8) | 0;
  const gridW = (app.screen.width / 4) | 0;
  const gridH = (app.screen.height / 5) | 0;

  // Normal rotations and mirrors
  for (let i = 0; i < 16; i++) {
    // Create a new Sprite using rotated texture
    const dude = new Sprite(textures[i < 8 ? i * 2 : (i - 8) * 2 + 1]);

    dude.scale.x = 0.5;
    dude.scale.y = 0.5;
    // Show it in grid
    dude.x = offsetX + gridW * (i % 4);
    dude.y = offsetY + gridH * ((i / 4) | 0);
    app.stage.addChild(dude);
    const text = new Text({
      text: `rotate = ${dude.texture.rotate}`,
      style: {
        fontFamily: 'Courier New',
        fontSize: '12px',
        fill: 'white',
        align: 'left',
      },
    });

    text.x = dude.x;
    text.y = dude.y - 20;
    app.stage.addChild(text);
  }
})();
import { Application, Assets, Container, RenderTexture, SCALE_MODES, Sprite } from 'pixi.js';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: '#1099bb', resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  const container = new Container();

  app.stage.addChild(container);

  // Load the bunny texture
  const texture = await Assets.load('https://pixijs.com/assets/bunny.png');

  for (let i = 0; i < 25; i++) {
    const bunny = new Sprite(texture);

    bunny.x = (i % 5) * 30;
    bunny.y = Math.floor(i / 5) * 30;
    bunny.rotation = Math.random() * (Math.PI * 2);
    container.addChild(bunny);
  }

  const rt = RenderTexture.create({
    width: 300,
    height: 300,
    scaleMode: SCALE_MODES.LINEAR,
    resolution: 1,
  });

  const sprite = new Sprite(rt);

  sprite.x = 450;
  sprite.y = 60;
  app.stage.addChild(sprite);

  /*
   * All the bunnies are added to the container with the addChild method
   * when you do this, all the bunnies become children of the container, and when a container moves,
   * so do all its children.
   * This gives you a lot of flexibility and makes it easier to position elements on the screen
   */
  container.x = 100;
  container.y = 60;

  app.ticker.add(() => {
    app.renderer.render(container, { renderTexture: rt });
  });
})();
import { Application, Assets, Container, RenderTexture, Sprite } from 'pixi.js';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  const stageSize = {
    width: app.screen.width,
    height: app.screen.height,
  };

  // Create two render textures... these dynamic textures will be used to draw the scene into itself
  let renderTexture = RenderTexture.create(stageSize);
  let renderTexture2 = RenderTexture.create(stageSize);
  const currentTexture = renderTexture;

  // Create a new sprite that uses the render texture we created above
  const outputSprite = new Sprite(currentTexture);

  // Align the sprite
  outputSprite.x = 400;
  outputSprite.y = 300;
  outputSprite.anchor.set(0.5);

  // Add to stage
  app.stage.addChild(outputSprite);

  const stuffContainer = new Container();

  stuffContainer.x = 400;
  stuffContainer.y = 300;

  app.stage.addChild(stuffContainer);

  // Create an array of image ids..
  const fruits = [
    'https://pixijs.com/assets/rt_object_01.png',
    'https://pixijs.com/assets/rt_object_02.png',
    'https://pixijs.com/assets/rt_object_03.png',
    'https://pixijs.com/assets/rt_object_04.png',
    'https://pixijs.com/assets/rt_object_05.png',
    'https://pixijs.com/assets/rt_object_06.png',
    'https://pixijs.com/assets/rt_object_07.png',
    'https://pixijs.com/assets/rt_object_08.png',
  ];

  // Load the textures
  await Assets.load(fruits);

  // Create an array of items
  const items = [];

  // Now create some items and randomly position them in the stuff container
  for (let i = 0; i < 20; i++) {
    const item = Sprite.from(fruits[i % fruits.length]);

    item.x = Math.random() * 400 - 200;
    item.y = Math.random() * 400 - 200;
    item.anchor.set(0.5);
    stuffContainer.addChild(item);
    items.push(item);
  }

  // Used for spinning!
  let count = 0;

  app.ticker.add(() => {
    for (let i = 0; i < items.length; i++) {
      // rotate each item
      const item = items[i];

      item.rotation += 0.1;
    }

    count += 0.01;

    // Swap the buffers ...
    const temp = renderTexture;

    renderTexture = renderTexture2;
    renderTexture2 = temp;

    // Set the new texture
    outputSprite.texture = renderTexture;

    // Twist this up!
    stuffContainer.rotation -= 0.01;
    outputSprite.scale.set(1 + Math.sin(count) * 0.2);

    // Render the stage to the texture
    // * The 'true' clears the texture before the content is rendered *
    app.renderer.render({
      container: app.stage,
      target: renderTexture2,
      clear: false,
    });
  });
})();
import { Application, Assets, Container, Sprite } from 'pixi.js';

// This example is the based on basic/container, but using OffscreenCanvas.

const canvas = document.createElement('canvas');
const view = canvas.transferControlToOffscreen();

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ view, background: '#1099bb', resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(canvas);

  const container = new Container();

  app.stage.addChild(container);

  // Load the bunny texture
  const texture = await Assets.load('https://pixijs.com/assets/bunny.png');

  // Create a 5x5 grid of bunnies
  for (let i = 0; i < 25; i++) {
    const bunny = new Sprite(texture);

    bunny.anchor.set(0.5);
    bunny.x = (i % 5) * 40;
    bunny.y = Math.floor(i / 5) * 40;
    container.addChild(bunny);
  }

  // Move container to the center
  container.x = app.screen.width / 2;
  container.y = app.screen.height / 2;

  // Center bunny sprite in local container coordinates
  container.pivot.x = container.width / 2;
  container.pivot.y = container.height / 2;

  // Listen for animate update
  app.ticker.add((time) => {
    // Rotate the container!
    // * use delta to create frame-independent transform *
    container.rotation -= 0.01 * time.deltaTime;
  });
})();
import { Application, Assets, Container, Sprite, Text, TextStyle } from 'pixi.js';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: '#111', resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  // Create and add a container to the stage
  const container = new Container();

  const containerFrame = new Container();

  containerFrame.addChild(container);

  app.stage.addChild(containerFrame);

  // Load the bunny texture
  const texture = await Assets.load('https://pixijs.com/assets/bunny.png');

  // Create a 5x5 grid of bunnies in the container
  for (let i = 0; i < 25; i++) {
    const bunny = new Sprite(texture);

    bunny.x = (i % 5) * 40;
    bunny.y = Math.floor(i / 5) * 40;
    container.addChild(bunny);
  }

  // Move the container to the center
  containerFrame.x = app.screen.width / 2;
  containerFrame.y = app.screen.height / 2;

  // Center the bunny sprites in local container coordinates
  container.pivot.x = container.width / 2;
  container.pivot.y = container.height / 2;

  // Listen for animate update
  app.ticker.add((time) => {
    // Continuously rotate the container!
    // * use delta to create frame-independent transform *
    container.rotation -= 0.01 * time.deltaTime;
  });

  let screenshot;

  // Take the screenshot and download it
  async function takeScreenshot() {
    if (screenshot !== undefined) {
      screenshot.remove();
    }

    app.stop();
    const url = await app.renderer.extract.base64(containerFrame);

    screenshot = document.createElement('a');

    document.body.append(screenshot);

    screenshot.style.position = 'fixed';
    screenshot.style.top = '20px';
    screenshot.style.right = '20px';
    screenshot.download = 'screenshot';
    screenshot.href = url;

    const image = new Image();

    image.width = app.screen.width / 5;
    image.src = url;

    screenshot.innerHTML = image.outerHTML;

    app.start();
  }

  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage.on('pointerdown', takeScreenshot);

  const style = new TextStyle({
    fontFamily: 'Roboto',
    fill: '#999',
  });

  const screenshotText = new Text({ text: 'Click To Take Screenshot', style });

  screenshotText.x = Math.round((app.screen.width - screenshotText.width) / 2);
  screenshotText.y = Math.round(screenshotText.height / 2);

  app.stage.addChild(screenshotText);
})();
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
