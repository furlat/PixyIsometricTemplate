---
sidebar_position: -1
description: A comprehensive guide to the architecture of PixiJS, including its major components and extension system.
---

# Architecture

Here's a list of the major components that make up PixiJS. Note that this list isn't exhaustive. Additionally, don't worry too much about how each component works. The goal here is to give you a feel for what's under the hood as we start exploring the engine.

### Major Components

| Component         | Description                                                                                                                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Renderer**      | The core of the PixiJS system is the renderer, which displays the scene graph and draws it to the screen. PixiJS will automatically determine whether to provide you the WebGPU or WebGL renderer under the hood. |
| **Container**     | Main scene object which creates a scene graph: the tree of renderable objects to be displayed, such as sprites, graphics and text. See [Scene Graph](scene-graph) for more details.                               |
| **Assets**        | The Asset system provides tools for asynchronously loading resources such as images and audio files.                                                                                                              |
| **Ticker**        | Tickers provide periodic callbacks based on a clock. Your game update logic will generally be run in response to a tick once per frame. You can have multiple tickers in use at one time.                         |
| **Application**   | The Application is a simple helper that wraps a Loader, Ticker and Renderer into a single, convenient easy-to-use object. Great for getting started quickly, prototyping and building simple projects.            |
| **Events**        | PixiJS supports pointer-based interaction - making objects clickable, firing hover events, etc.                                                                                                                   |
| **Accessibility** | Woven through our display system is a rich set of tools for enabling keyboard and screen-reader accessibility.                                                                                                    |
| **Filters**       | PixiJS supports a variety of filters, including custom shaders, to apply effects to your renderable objects.                                                                                                      |

## Extensions

PixiJS v8 is built entirely around the concept of extensions. Every system in PixiJS is implemented as a modular extension. This allows PixiJS to remain lightweight, flexible, and easy to extend.

:::info
In most cases, you won’t need to interact with the extension system directly unless you are developing a third-party library or contributing to the PixiJS ecosystem itself.
:::

## Extension Types

PixiJS supports a wide range of extension types, each serving a unique role in the architecture:

### Assets

- `ExtensionType.Asset`: Groups together loaders, resolvers, cache and detection extensions into one convenient object instead of having to register each one separately.
- `ExtensionType.LoadParser`: Loads resources like images, JSON, videos.
- `ExtensionType.ResolveParser`: Converts asset URLs into a format that can be used by the loader.
- `ExtensionType.CacheParser`: Determines caching behavior for a particular asset.
- `ExtensionType.DetectionParser`: Identifies asset format support on the current platform.

### Renderer (WebGL, WebGPU, Canvas)

- `ExtensionType.WebGLSystem`, `ExtensionType.WebGPUSystem`, `ExtensionType.CanvasSystem`: Add systems to their respective renderers. These systems can vary widely in functionality, from managing textures to accessibility features.
- `ExtensionType.WebGLPipes`, `ExtensionType.WebGPUPipes`, `ExtensionType.CanvasPipes`: Add a new rendering pipe. RenderPipes are specifically used to render Renderables like a Mesh
- `ExtensionType.WebGLPipesAdaptor`, `ExtensionType.WebGPUPipesAdaptor`, `ExtensionType.CanvasPipesAdaptor`: Adapt rendering pipes for the respective renderers.

### Application

- `ExtensionType.Application`: Used for plugins that extend the `Application` lifecycle.
  For example the `TickerPlugin` and `ResizePlugin` are both application extensions.

### Environment

- `ExtensionType.Environment`: Used to detect and configure platform-specific behavior. This can be useful for configuring PixiJS to work in environments like Node.js, Web Workers, or the browser.

### Other (Primarily Internal Use)

These extension types are mainly used internally and are typically not required in most user-facing applications:

- `ExtensionType.MaskEffect`: Used by MaskEffectManager for custom masking behaviors.
- `ExtensionType.BlendMode`: A type of extension for creating a new advanced blend mode.
- `ExtensionType.TextureSource`: A type of extension that will be used to auto detect a resource type E.g `VideoSource`
- `ExtensionType.ShapeBuilder`: A type of extension for building and triangulating custom shapes used in graphics.
- `ExtensionType.Batcher`: A type of extension for creating custom batchers used in rendering.

## Creating Extensions

The `extensions` object in PixiJS is a global registry for managing extensions. Extensions must declare an `extension` field with metadata, and are registered via `extensions.add(...)`.

```ts
import { extensions, ExtensionType } from 'pixi.js';

const myLoader = {
  extension: {
    type: ExtensionType.LoadParser,
    name: 'my-loader',
  },
  test(url) {
    /* logic */
  },
  load(url) {
    /* logic */
  },
};

extensions.add(myLoader);
```

---
sidebar_position: 0
description: Understanding the PixiJS scene graph, its structure, and how to manage parent-child relationships, render order, and culling for optimal performance.
---

import { EmbeddedEditor } from '@site/src/components/Editor/EmbeddedEditor';
import ParentIndexFile from '!!raw-loader!./scene-graph-parent';
import OrderIndexFile from '!!raw-loader!./scene-graph-order';

# Scene Graph

Every frame, PixiJS is updating and then rendering the scene graph. Let's talk about what's in the scene graph, and how it impacts how you develop your project. If you've built games before, this should all sound very familiar, but if you're coming from HTML and the DOM, it's worth understanding before we get into specific types of objects you can render.

## The Scene Graph Is a Tree

The scene graph's root node is a container maintained by the application, and referenced with `app.stage`. When you add a sprite or other renderable object as a child to the stage, it's added to the scene graph and will be rendered and interactable. PixiJS `Containers` can also have children, and so as you build more complex scenes, you will end up with a tree of parent-child relationships, rooted at the app's stage.

(A helpful tool for exploring your project is the [Pixi.js devtools plugin](https://chrome.google.com/webstore/detail/pixijs-devtools/aamddddknhcagpehecnhphigffljadon) for Chrome, which allows you to view and manipulate the scene graph in real time as it's running!)

## Parents and Children

When a parent moves, its children move as well. When a parent is rotated, its children are rotated too. Hide a parent, and the children will also be hidden. If you have a game object that's made up of multiple sprites, you can collect them under a container to treat them as a single object in the world, moving and rotating as one.

Each frame, PixiJS runs through the scene graph from the root down through all the children to the leaves to calculate each object's final position, rotation, visibility, transparency, etc. If a parent's alpha is set to 0.5 (making it 50% transparent), all its children will start at 50% transparent as well. If a child is then set to 0.5 alpha, it won't be 50% transparent, it will be 0.5 x 0.5 = 0.25 alpha, or 75% transparent. Similarly, an object's position is relative to its parent, so if a parent is set to an x position of 50 pixels, and the child is set to an x position of 100 pixels, it will be drawn at a screen offset of 150 pixels, or 50 + 100.

Here's an example. We'll create three sprites, each a child of the last, and animate their position, rotation, scale and alpha. Even though each sprite's properties are set to the same values, the parent-child chain amplifies each change:

{/* embedded:@site/docs/guides/concepts/scene-graph-parent.js */}
<EmbeddedEditor files={{"index.js": ParentIndexFile}} />

<br />
The cumulative translation, rotation, scale and skew of any given node in the scene graph is stored in the object's
`worldTransform` property. Similarly, the cumulative alpha value is stored in the `worldAlpha` property.

## Render Order

So we have a tree of things to draw. Who gets drawn first?

PixiJS renders the tree from the root down. At each level, the current object is rendered, then each child is rendered in order of insertion. So the second child is rendered on top of the first child, and the third over the second.

Check out this example, with two parent objects A & D, and two children B & C under A:

{/* embedded:@site/docs/guides/concepts/scene-graph-order.js */}
<EmbeddedEditor files={{"index.js": OrderIndexFile}} />
<br/>

If you'd like to re-order a child object, you can use `setChildIndex()`. To add a child at a given point in a parent's list, use `addChildAt()`. Finally, you can enable automatic sorting of an object's children using the `sortableChildren` option combined with setting the `zIndex` property on each child.

## RenderGroups

As you delve deeper into PixiJS, you'll encounter a powerful feature known as Render Groups. Think of Render Groups as specialized containers within your scene graph that act like mini scene graphs themselves. Here's what you need to know to effectively use Render Groups in your projects. For more info check out the [RenderGroups overview](./render-groups.md)

## Culling

If you're building a project where a large proportion of your scene objects are off-screen (say, a side-scrolling game), you will want to _cull_ those objects. Culling is the process of evaluating if an object (or its children!) is on the screen, and if not, turning off rendering for it. If you don't cull off-screen objects, the renderer will still draw them, even though none of their pixels end up on the screen.

PixiJS provides built-in support for viewport culling. To enable culling, set `cullable = true` on your objects. You can also set `cullableChildren` to `false` to allow PixiJS to bypass the recursive culling function, which can improve performance. Additionally, you can set `cullArea` to further optimize performance by defining the area to be culled.

## Local vs Global Coordinates

If you add a sprite to the stage, by default it will show up in the top left corner of the screen. That's the origin of the global coordinate space used by PixiJS. If all your objects were children of the stage, that's the only coordinates you'd need to worry about. But once you introduce containers and children, things get more complicated. A child object at [50, 100] is 50 pixels right and 100 pixels down _from its parent_.

We call these two coordinate systems "global" and "local" coordinates. When you use `position.set(x, y)` on an object, you're always working in local coordinates, relative to the object's parent.

The problem is, there are many times when you want to know the global position of an object. For example, if you want to cull offscreen objects to save render time, you need to know if a given child is outside the view rectangle.

To convert from local to global coordinates, you use the `toGlobal()` function. Here's a sample usage:

```javascript
// Get the global position of an object, relative to the top-left of the screen
let globalPos = obj.toGlobal(new Point(0, 0));
```

This snippet will set `globalPos` to be the global coordinates for the child object, relative to [0, 0] in the global coordinate system.

## Global vs Screen Coordinates

When your project is working with the host operating system or browser, there is a third coordinate system that comes into play - "screen" coordinates (aka "viewport" coordinates). Screen coordinates represent position relative to the top-left of the canvas element that PixiJS is rendering into. Things like the DOM and native mouse click events work in screen space.

Now, in many cases, screen space is equivalent to world space. This is the case if the size of the canvas is the same as the size of the render view specified when you create you `Application`. By default, this will be the case - you'll create for example an 800x600 application window and add it to your HTML page, and it will stay that size. 100 pixels in world coordinates will equal 100 pixels in screen space. BUT! It is common to stretch the rendered view to have it fill the screen, or to render at a lower resolution and up-scale for speed. In that case, the screen size of the canvas element will change (e.g. via CSS), but the underlying render view will _not_, resulting in a mis-match between world coordinates and screen coordinates.

---
sidebar_position: 2
description: Understanding the PixiJS render loop, including how it updates the scene graph and renders frames efficiently.
---

# Render Loop

At the core of PixiJS lies its **render loop**, a repeating cycle that updates and redraws your scene every frame. Unlike traditional web development where rendering is event-based (e.g. on user input), PixiJS uses a continuous animation loop that provides full control over real-time rendering.

This guide provides a deep dive into how PixiJS structures this loop internally, from the moment a frame begins to when it is rendered to the screen. Understanding this will help you write more performant, well-structured applications.

## Overview

Each frame, PixiJS performs the following sequence:

1. **Tickers are executed** (user logic)
2. **Scene graph is updated** (transforms and culling)
3. **Rendering occurs** (GPU draw calls)

This cycle repeats as long as your application is running and its ticker is active.

## Step 1: Running Ticker Callbacks

The render loop is driven by the `Ticker` class, which uses `requestAnimationFrame` to schedule work. Each tick:

- Measures elapsed time since the previous frame
- Caps it based on `minFPS` and `maxFPS`
- Calls every listener registered with `ticker.add()` or `app.ticker.add()`

### Example

```ts
app.ticker.add((ticker) => {
  bunny.rotation += ticker.deltaTime * 0.1;
});
```

Every callback receives the current `Ticker` instance. You can access `ticker.deltaTime` (scaled frame delta) and `ticker.elapsedMS` (unscaled delta in ms) to time animations.

## Step 2: Updating the Scene Graph

PixiJS uses a hierarchical **scene graph** to represent all visual objects. Before rendering, the graph needs to be traversed to:

- Recalculate transforms (world matrix updates)
- Apply custom logic via `onRender` handlers
- Apply culling if enabled

## Step 3: Rendering the Scene

Once the scene graph is ready, the renderer walks the display list starting at `app.stage`:

1. Applies global and local transformations
2. Batches draw calls when possible
3. Uploads geometry, textures, and uniforms
4. Issues GPU commands

All rendering is **retained mode**: objects persist across frames unless explicitly removed.

Rendering is done via either WebGL or WebGPU, depending on your environment. The renderer abstracts away the differences behind a common API.

## Full Frame Lifecycle Diagram

```plaintext
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
```

---
sidebar_position: 3
description: Learn how to use Render Groups in PixiJS to optimize rendering performance by grouping scene elements for efficient GPU processing.
---

# Render Groups

## Understanding RenderGroups in PixiJS

As you delve deeper into PixiJS, especially with version 8, you'll encounter a powerful feature known as RenderGroups. Think of RenderGroups as specialized containers within your scene graph that act like mini scene graphs themselves. Here's what you need to know to effectively use Render Groups in your projects:

### What Are Render Groups?

Render Groups are essentially containers that PixiJS treats as self-contained scene graphs. When you assign parts of your scene to a Render Group, you're telling PixiJS to manage these objects together as a unit. This management includes monitoring for changes and preparing a set of render instructions specifically for the group. This is a powerful tool for optimizing your rendering process.

### Why Use Render Groups?

The main advantage of using Render Groups lies in their optimization capabilities. They allow for certain calculations, like transformations (position, scale, rotation), tint, and alpha adjustments, to be offloaded to the GPU. This means that operations like moving or adjusting the Render Group can be done with minimal CPU impact, making your application more performance-efficient.

In practice, you're utilizing Render Groups even without explicit awareness. The root element you pass to the render function in PixiJS is automatically converted into a RenderGroup as this is where its render instructions will be stored. Though you also have the option to explicitly create additional RenderGroups as needed to further optimize your project.

This feature is particularly beneficial for:

- **Static Content:** For content that doesn't change often, a Render Group can significantly reduce the computational load on the CPU. In this case static refers to the scene graph structure, not that actual values of the PixiJS elements inside it (eg position, scale of things).
- **Distinct Scene Parts:** You can separate your scene into logical parts, such as the game world and the HUD (Heads-Up Display). Each part can be optimized individually, leading to overall better performance.

### Examples

```ts
const myGameWorld = new Container({
  isRenderGroup: true,
});

const myHud = new Container({
  isRenderGroup: true,
});

scene.addChild(myGameWorld, myHud);

renderer.render(scene); // this action will actually convert the scene to a render group under the hood
```

Check out the [container example](../../examples/basic/container).

### Best Practices

- **Don't Overuse:** While Render Groups are powerful, using too many can actually degrade performance. The goal is to find a balance that optimizes rendering without overwhelming the system with too many separate groups. Make sure to profile when using them. The majority of the time you won't need to use them at all!
- **Strategic Grouping:** Consider what parts of your scene change together and which parts remain static. Grouping dynamic elements separately from static elements can lead to performance gains.

By understanding and utilizing Render Groups, you can take full advantage of PixiJS's rendering capabilities, making your applications smoother and more efficient. This feature represents a powerful tool in the optimization toolkit offered by PixiJS, enabling developers to create rich, interactive scenes that run smoothly across different devices.

---
sidebar_position: 4
description: Understanding PixiJS Render Layers for controlling rendering order independently of logical hierarchy.
---

import { EmbeddedEditor } from '@site/src/components/Editor/EmbeddedEditor';
import RenderLayerIndexFile from '!!raw-loader!../../examples/ordering/render-layer/index';
import RenderLayerFish from '!!raw-loader!../../examples/ordering/render-layer/Fish';
import RenderLayerCharacterUI from '!!raw-loader!../../examples/ordering/render-layer/CharacterUI';

# Render Layers

The PixiJS Layer API provides a powerful way to control the **rendering order** of objects independently of their **logical parent-child relationships** in the scene graph. With RenderLayers, you can decouple how objects are transformed (via their logical parent) from how they are visually drawn on the screen.

Using RenderLayers ensures these elements are visually prioritized while maintaining logical parent-child relationships. Examples include:

- A character with a health bar: Ensure the health bar always appears on top of the world, even if the character moves behind an object.

- UI elements like score counters or notifications: Keep them visible regardless of the game world’s complexity.

- Highlighting Elements in Tutorials: Imagine a tutorial where you need to push back most game elements while highlighting a specific object. RenderLayers can split these visually. The highlighted object can be placed in a foreground layer to be rendered above a push back layer.

This guide explains the key concepts, provides practical examples, and highlights common gotchas to help you use the Layer API effectively.

---

### **Key Concepts**

1. **Independent Rendering Order**:

   - RenderLayers allow control of the draw order independently of the logical hierarchy, ensuring objects are rendered in the desired order.

2. **Logical Parenting Stays Intact**:

   - Objects maintain transformations (e.g., position, scale, rotation) from their logical parent, even when attached to RenderLayers.

3. **Explicit Object Management**:

   - Objects must be manually reassigned to a layer after being removed from the scene graph or layer, ensuring deliberate control over rendering.

4. **Dynamic Sorting**:

   - Within layers, objects can be dynamically reordered using `zIndex` and `sortChildren` for fine-grained control of rendering order.

---

### **Basic API Usage**

First lets create two items that we want to render, red guy and blue guy.

```typescript
const redGuy = new PIXI.Sprite('red guy');
redGuy.tint = 0xff0000;

const blueGuy = new PIXI.Sprite('blue guy');
blueGuy.tint = 0x0000ff;

stage.addChild(redGuy, blueGuy);
```

![alt text](render-layers/image-1.png)

Now we know that red guy will be rendered first, then blue guy. Now in this simple example you could get away with just sorting the `zIndex` of the red guy and blue guy to help reorder.

But this is a guide about render layers, so lets create one of those.

Use `renderLayer.attach` to assign an object to a layer. This overrides the object’s default render order defined by its logical parent.

```typescript
// a layer..
const layer = new RenderLayer();
stage.addChild(layer);
layer.attach(redGuy);
```

![alt text](render-layers/image-2.png)

So now our scene graph order is:

```
|- stage
    |-- redGuy
    |-- blueGuy
    |-- layer
```

And our render order is:

```
|- stage
    |-- blueGuy
    |-- layer
        |-- redGuy

```

This happens because the layer is now the last child in the stage. Since the red guy is attached to the layer, it will be rendered at the layer's position in the scene graph. However, it still logically remains in the same place in the scene hierarchy.

#### **3. Removing Objects from a Layer**

Now let's remove the red guy from the layer. To stop an object from being rendered in a layer, use `removeFromLayer`. Once removed from the layer, its still going to be in the scene graph, and will be rendered in its scene graph order.

```typescript
layer.detach(redGuy); //  Stop rendering the rect via the layer
```

![alt text](render-layers/image-1.png)

Removing an object from its logical parent (`removeChild`) automatically removes it from the layer.

```typescript
stage.removeChild(redGuy); // if the red guy was removed from the stage, it will also be removed from the layer
```

![alt text](render-layers/image-3.png)

However, if you remove the red guy from the stage and then add it back to the stage, it will not be added to the layer again.

```typescript
// add red guy to his original position
stage.addChildAt(redGuy, 0);
```

![alt text](render-layers/image-1.png)

You will need to reattach it to the layer yourself.

```typescript
layer.attach(redGuy); // re attach it to the layer again!
```

![alt text](render-layers/image-2.png)

This may seem like a pain, but it's actually a good thing. It means that you have full control over the render order of the object, and you can change it at any time. It also means you can't accidentally add an object to a container and have it automatically re-attach to a layer that may or may not still be around - it would be quite confusing and lead to some very hard to debug bugs!

#### **5. Layer Position in Scene Graph**

The layer’s position in the scene graph determines its render priority relative to other layers and objects.

```typescript
// reparent the layer to render first in the stage
stage.addChildAt(layer, 0);
```

## ![alt text](render-layers/image-1.png)

### **Complete Example**

Here’s a real-world example that shows how to use RenderLayers to set ap player ui on top of the world.

{/* embedded:@site/docs/examples/ordering/render-layer/index.js */}
{/* embedded:@site/docs/examples/ordering/render-layer/Fish.js */}
{/* embedded:@site/docs/examples/ordering/render-layer/CharacterUI.js */}
<EmbeddedEditor files={{
    "index.js": RenderLayerIndexFile,
    'Fish.js': RenderLayerFish,
    'CharacterUI.js': RenderLayerCharacterUI,
  }}
/>
<br />

---

### **Gotchas and Things to Watch Out For**

1. **Manual Reassignment**:

   - When an object is re-added to a logical parent, it does not automatically reassociate with its previous layer. Always reassign the object to the layer explicitly.

2. **Nested Children**:

   - If you remove a parent container, all its children are automatically removed from layers. Be cautious with complex hierarchies.

3. **Sorting Within Layers**:

   - Objects in a layer can be sorted dynamically using their `zIndex` property. This is useful for fine-grained control of render order.

   ```javascript
   rect.zIndex = 10; // Higher values render later
   layer.sortableChildren = true; // Enable sorting
   layer.sortRenderLayerChildren(); // Apply the sorting
   ```

4. **Layer Overlap**:
   - If multiple layers overlap, their order in the scene graph determines the render priority. Ensure the layering logic aligns with your desired visual output.

---

### **Best Practices**

1. **Group Strategically**: Minimize the number of layers to optimize performance.
2. **Use for Visual Clarity**: Reserve layers for objects that need explicit control over render order.
3. **Test Dynamic Changes**: Verify that adding, removing, or reassigning objects to layers behaves as expected in your specific scene setup.

By understanding and leveraging RenderLayers effectively, you can achieve precise control over your scene's visual presentation while maintaining a clean and logical hierarchy.

---
sidebar_position: 5
title: Environments
description: Learn how PixiJS adapts to different environments like browsers, Web Workers, and custom execution contexts, and how to configure it for your needs.
---

# Using PixiJS in Different Environments

PixiJS is a highly adaptable library that can run in a variety of environments, including browsers, Web Workers, and custom execution contexts like Node.js. This guide explains how PixiJS handles different environments and how you can configure it to suit your application's needs.

## Running PixiJS in the Browser

For browser environments, PixiJS uses the `BrowserAdapter` by default, you should not need to configure anything

### Example:

```typescript
import { Application } from 'pixi.js';

const app = new Application();

await app.init({
  width: 800,
  height: 600,
});

document.body.appendChild(app.canvas);
```

## Running PixiJS in Web Workers

Web Workers provide a parallel execution environment, ideal for offloading rendering tasks. PixiJS supports Web Workers using the `WebWorkerAdapter`:

### Example:

```typescript
import { DOMAdapter, WebWorkerAdapter } from 'pixi.js';

// Must be set before creating anything in PixiJS
DOMAdapter.set(WebWorkerAdapter);

const app = new Application();

await app.init({
  width: 800,
  height: 600,
});

app.canvas; // OffscreenCanvas
```

## Custom Environments

For non-standard environments, you can create a custom adapter by implementing the `Adapter` interface. This allows PixiJS to function in environments like Node.js or headless testing setups.

### Example Custom Adapter:

```typescript
import { DOMAdapter } from 'pixi.js';

const CustomAdapter = {
  createCanvas: (width, height) => {
    /* custom implementation */
  },
  getCanvasRenderingContext2D: () => {
    /* custom implementation */
  },
  getWebGLRenderingContext: () => {
    /* custom implementation */
  },
  getNavigator: () => ({ userAgent: 'Custom', gpu: null }),
  getBaseUrl: () => 'custom://',
  fetch: async (url, options) => {
    /* custom fetch */
  },
  parseXML: (xml) => {
    /* custom XML parser */
  },
};

DOMAdapter.set(CustomAdapter);
```

---
sidebar_position: 5
title: Garbage Collection
description: Managing GPU resources and garbage collection in PixiJS for optimal performance.
---

# Managing Garbage Collection in PixiJS

Efficient resource management is crucial for maintaining optimal performance in any PixiJS application. This guide explores how PixiJS handles garbage collection, the tools it provides, and best practices for managing GPU resources effectively.

## Explicit Resource Management with `destroy`

PixiJS objects, such as textures, meshes, and other GPU-backed data, hold references that consume memory. To explicitly release these resources, call the `destroy` method on objects you no longer need. For example:

```javascript
import { Sprite } from 'pixi.js';

const sprite = new Sprite(texture);
// Use the sprite in your application

// When no longer needed
sprite.destroy();
```

Calling `destroy` ensures that the object’s GPU resources are freed immediately, reducing the likelihood of memory leaks and improving performance.

## Managing Textures with `texture.unload`

In cases where PixiJS’s automatic texture garbage collection is insufficient, you can manually unload textures from the GPU using `texture.unload()`:

```javascript
import { Texture } from 'pixi.js';

const texture = Texture.from('image.png');

// Use the texture

// When no longer needed
texture.unload();
```

This is particularly useful for applications that dynamically load large numbers of textures and require precise memory control.

## Automatic Texture Garbage Collection with `TextureGCSystem`

PixiJS also includes the `TextureGCSystem`, a system that manages GPU texture memory. By default:

- **Removes textures unused for 3600 frames** (approximately 1 hour at 60 FPS).
- **Checks every 600 frames** for unused textures.

### Customizing `TextureGCSystem`

You can adjust the behavior of `TextureGCSystem` to suit your application:

- **`textureGCActive`**: Enable or disable garbage collection. Default: `true`.
- **`textureGCMaxIdle`**: Maximum idle frames before texture cleanup. Default: `3600` frames.
- **`textureGCCheckCountMax`**: Frequency of garbage collection checks (in frames). Default: `600` frames.

Example configuration:

```javascript
import { Application } from 'pixi.js';

const app = new Application();

await app.init({
  textureGCActive: true, // Enable texture garbage collection
  textureGCMaxIdle: 7200, // 2 hours idle time
  textureGCCheckCountMax: 1200, // Check every 20 seconds at 60 FPS
});
```

## Best Practices for Garbage Collection in PixiJS

1. **Explicitly Destroy Objects:** Always call `destroy` on objects you no longer need to ensure GPU resources are promptly released.
2. **Use Pooling:** Reuse objects with a pooling system to reduce allocation and deallocation overhead.
3. **Proactively Manage Textures:** Use `texture.unload()` for manual memory management when necessary.

By following these practices and understanding PixiJS’s garbage collection mechanisms, you can create high-performance applications that efficiently utilize system resources.

---
sidebar_position: 6
description: Performance tips for optimizing PixiJS applications, covering general practices and specific techniques for maximizing rendering efficiency.
---

# Performance Tips

### General

- Only optimize when you need to! PixiJS can handle a fair amount of content off the bat
- Be mindful of the complexity of your scene. The more objects you add the slower things will end up
- Order can help, for example sprite / graphic / sprite / graphic is slower than sprite / sprite / graphic / graphic
- Some older mobile devices run things a little slower. Passing in the option `useContextAlpha: false` and `antialias: false` to the Renderer or Application can help with performance
- Culling is disabled by default as it's often better to do this at an application level or set objects to be `cullable = true`. If you are GPU-bound it will improve performance; if you are CPU-bound it will degrade performance

### Sprites

- Use Spritesheets where possible to minimize total textures
- Sprites can be batched with up to 16 different textures (dependent on hardware)
- This is the fastest way to render content
- On older devices use smaller low resolution textures
- Add the extention `@0.5x.png` to the 50% scale-down spritesheet so PixiJS will visually-double them automatically
- Draw order can be important

### Graphics

- Graphics objects are fastest when they are not modified constantly (not including the transform, alpha or tint!)
- Graphics objects are batched when under a certain size (100 points or smaller)
- Small Graphics objects are as fast as Sprites (rectangles, triangles)
- Using 100s of graphics complex objects can be slow, in this instance use sprites (you can create a texture)

### Texture

- Textures are automatically managed by a Texture Garbage Collector
- You can also manage them yourself by using `texture.destroy()`
- If you plan to destroy more than one at once add a random delay to their destruction to remove freezing
- Delay texture destroy if you plan to delete a lot of textures yourself

### Text

- Avoid changing it on every frame as this can be expensive (each time it draws to a canvas and then uploads to GPU)
- Bitmap Text gives much better performance for dynamically changing text
- Text resolution matches the renderer resolution, decrease resolution yourself by setting the `resolution` property, which can consume less memory

### Masks

- Masks can be expensive if too many are used: e.g., 100s of masks will really slow things down
- Axis-aligned Rectangle masks are the fastest (as they use scissor rect)
- Graphics masks are second fastest (as they use the stencil buffer)
- Sprite masks are the third fastest (they use filters). They are really expensive. Do not use too many in your scene!

### Filters

- Release memory: `container.filters = null`
- If you know the size of them: `container.filterArea = new Rectangle(x,y,w,h)`. This can speed things up as it means the object does not need to be measured
- Filters are expensive, using too many will start to slow things down!

### BlendModes

- Different blend modes will cause batches to break (de-optimize)
- ScreenSprite / NormalSprite / ScreenSprite / NormalSprite would be 4 draw calls
- ScreenSprite / ScreenSprite / NormalSprite / NormalSprite would be 2 draw calls

### Events

- If an object has no interactive children use `interactiveChildren = false`. The event system will then be able to avoid crawling through the object
- Setting `hitArea = new Rectangle(x,y,w,h)` as above should stop the event system from crawling through the object

---
sidebar_position: 0
description: Learn how to create and configure a PixiJS Application, including options for WebGL/WebGPU rendering, built-in plugins, and custom application plugins.
---

# Application

The `Application` class provides a modern, extensible entry point to set up rendering in PixiJS. It abstracts common tasks like renderer setup and ticker updates, and is designed to support both WebGL and WebGPU via async initialization.

## Creating an Application

Creating an application requires two steps: constructing an instance, then initializing it asynchronously using `.init()`:

```ts
import { Application } from 'pixi.js';

const app = new Application();

await app.init({
  width: 800,
  height: 600,
  backgroundColor: 0x1099bb,
});

document.body.appendChild(app.canvas);
```

### ApplicationOptions Reference

The `.init()` method of `Application` accepts a `Partial<ApplicationOptions>` object with the following configuration options:

| Option                   | Type                                | Default     | Description                                                                                                                              |
| ------------------------ | ----------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `autoStart`              | `boolean`                           | `true`      | Whether to start rendering immediately after initialization. Setting to `false` will not stop the shared ticker if it's already running. |
| `resizeTo`               | `Window \| HTMLElement`             | —           | Element to auto-resize the renderer to match.                                                                                            |
| `sharedTicker`           | `boolean`                           | `false`     | Use the shared ticker instance if `true`; otherwise, a private ticker is created.                                                        |
| `preference`             | `'webgl' \| 'webgpu'`               | `webgl`     | Preferred renderer type.                                                                                                                 |
| `useBackBuffer`          | `boolean`                           | `false`     | _(WebGL only)_ Use the back buffer when required.                                                                                        |
| `forceFallbackAdapter`   | `boolean`                           | `false`     | _(WebGPU only)_ Force usage of fallback adapter.                                                                                         |
| `powerPreference`        | `'high-performance' \| 'low-power'` | `undefined` | Hint for GPU power preference (WebGL & WebGPU).                                                                                          |
| `antialias`              | `boolean`                           | —           | Enables anti-aliasing. May impact performance.                                                                                           |
| `autoDensity`            | `boolean`                           | —           | Adjusts canvas size based on `resolution`. Applies only to `HTMLCanvasElement`.                                                          |
| `background`             | `ColorSource`                       | —           | Alias for `backgroundColor`.                                                                                                             |
| `backgroundAlpha`        | `number`                            | `1`         | Alpha transparency for background (0 = transparent, 1 = opaque).                                                                         |
| `backgroundColor`        | `ColorSource`                       | `'black'`   | Color used to clear the canvas. Accepts hex, CSS color, or array.                                                                        |
| `canvas`                 | `ICanvas`                           | —           | A custom canvas instance (optional).                                                                                                     |
| `clearBeforeRender`      | `boolean`                           | `true`      | Whether the renderer should clear the canvas each frame.                                                                                 |
| `context`                | `WebGL2RenderingContext \| null`    | `null`      | User-supplied rendering context (WebGL).                                                                                                 |
| `depth`                  | `boolean`                           | —           | Enable a depth buffer in the main view. Always `true` for WebGL.                                                                         |
| `height`                 | `number`                            | `600`       | Initial height of the renderer (in pixels).                                                                                              |
| `width`                  | `number`                            | `800`       | Initial width of the renderer (in pixels).                                                                                               |
| `hello`                  | `boolean`                           | `false`     | Log renderer info and version to the console.                                                                                            |
| `multiView`              | `boolean`                           | `false`     | Enable multi-canvas rendering.                                                                                                           |
| `preferWebGLVersion`     | `1 \| 2`                            | `2`         | Preferred WebGL version.                                                                                                                 |
| `premultipliedAlpha`     | `boolean`                           | `true`      | Assume alpha is premultiplied in color buffers.                                                                                          |
| `preserveDrawingBuffer`  | `boolean`                           | `false`     | Preserve buffer between frames. Needed for `toDataURL`.                                                                                  |
| `resolution`             | `number`                            | 1           | The resolution of the renderer.                                                                                                          |
| `skipExtensionImports`   | `boolean`                           | `false`     | Prevent automatic import of default PixiJS extensions.                                                                                   |
| `textureGCActive`        | `boolean`                           | `true`      | Enable garbage collection for GPU textures.                                                                                              |
| `textureGCCheckCountMax` | `number`                            | `600`       | Frame interval between GC runs (textures).                                                                                               |
| `textureGCMaxIdle`       | `number`                            | `3600`      | Max idle frames before destroying a texture.                                                                                             |
| `textureGCAMaxIdle`      | `number`                            | —           | (Appears undocumented; placeholder for internal GC controls.)                                                                            |

### Customizing Application Options Per Renderer Type

You can also override properties based on the renderer type by using the `WebGLOptions` or `WebGPUOptions` interfaces. For example:

```ts
import { Application } from 'pixi.js';

const app = new Application();
await app.init({
  width: 800,
  height: 600,
  backgroundColor: 0x1099bb,
  webgl: {
    antialias: true,
  },
  webgpu: {
    antialias: false,
  },
});
document.body.appendChild(app.canvas);
```

---

## Built-In Plugins

PixiJS includes:

- ✅ **Ticker Plugin** — Updates every frame → [Guide](./ticker-plugin.md)
- ✅ **Resize Plugin** — Resizes renderer/canvas → [Guide](./resize-plugin.md)
- ➕ **Optional: Culler Plugin** - Culls objects that are out of frame → [Guide](./culler-plugin.md)

---

## Creating a Custom Application Plugin

You can create custom plugins for the `Application` class. A plugin must implement the `ApplicationPlugin` interface, which includes `init()` and `destroy()` methods. You can also specify the `extension` type, which is `ExtensionType.Application` for application plugins.

Both functions are called with `this` set as the `Application` instance e.g `this.renderer` or `this.stage` is available.

The `init()` method is called when the application is initialized and passes the options from the `application.init` call, and the `destroy()` method is called when the application is destroyed.

```ts
import type { ApplicationOptions, ApplicationPlugin, ExtensionType } from 'pixi.js';

const myPlugin: ApplicationPlugin = {
    extension: ExtensionType.Application;
    init(options: ApplicationOptions) {
        console.log('Custom plugin init:', this, options);
    },
    destroy() {
        console.log('Custom plugin destroy');
    },
};
```

Register with:

```ts
import { extensions } from 'pixi.js';
extensions.add(myPlugin);
```

### Adding Types

If you are using TypeScript, or are providing a plugin for others to use, you can extend the `ApplicationOptions` interface to include your custom plugins options.

```ts
declare global {
  namespace PixiMixins {
    interface ApplicationOptions {
      myPlugin?: import('./myPlugin').PluginOptions | null;
    }
  }
}

await app.init({
  myPlugin: {
    customOption: true, // Now TypeScript will know about this option
  },
});
```

---

## API Reference

- [Overview](https://pixijs.download/release/docs/app.html)
- [Application](https://pixijs.download/release/docs/app.Application.html)
- [ApplicationOptions](https://pixijs.download/release/docs/app.ApplicationOptions.html)
  - [AutoDetectOptions](https://pixijs.download/release/docs/rendering.AutoDetectOptions.html)
  - [WebGLOptions](https://pixijs.download/release/docs/rendering.WebGLOptions.html)
  - [WebGPUOptions](https://pixijs.download/release/docs/rendering.WebGPUOptions.html)
  - [SharedRendererOptions](https://pixijs.download/release/docs/rendering.SharedRendererOptions.html)
- [TickerPlugin](https://pixijs.download/release/docs/app.TickerPlugin.html)
- [ResizePlugin](https://pixijs.download/release/docs/app.ResizePlugin.html)
- [CullerPlugin](https://pixijs.download/release/docs/app.CullerPlugin.html)

---
sidebar_position: 0
description: Learn how to use the TickerPlugin in PixiJS for efficient rendering and updates in your application.
---

# Ticker Plugin

The `TickerPlugin` provides a built-in update loop for your PixiJS `Application`. This loop calls `.render()` at a regular cadence—by default, once per animation frame—and integrates with PixiJS's `Ticker` system for precise control over frame-based updates.

PixiJS includes this plugin automatically when you initialize an `Application`, but you can also opt out and add it manually.

## Usage

```ts
const app = new Application();

await app.init({
  sharedTicker: false,
  autoStart: true,
});

app.ticker.add((ticker) => {
  // Custom update logic here
  bunny.rotation += 1 * ticker.deltaTime;
});
```

### Default Behavior

The `TickerPlugin` is included automatically unless disabled:

```ts
const app = new Application();

await app.init({
  autoStart: true, // Automatically starts the render loop
  sharedTicker: false, // Use a dedicated ticker
});
```

### Manual Registration

If you're managing extensions yourself:

```ts
import { extensions, TickerPlugin } from 'pixi.js';

extensions.add(TickerPlugin);
```

# Shared vs Custom Ticker

The plugin supports two modes:

| Option                | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `sharedTicker: true`  | Uses `Ticker.shared`, shared across all applications.        |
| `sharedTicker: false` | Creates a private ticker instance scoped to the application. |

### Behavior Differences

- If using a **shared ticker**, other code may also be registering updates, so the order of execution can vary.
- If using a **custom ticker**, you get complete control over timing and update order.

---

## Lifecycle Control

You can manually stop and start the ticker:

```ts
app.stop(); // Stop automatic rendering
app.start(); // Resume
```

This is useful for:

- Pausing the game or animation
- Performance throttling on inactive tabs
- Managing visibility events

---

## API Reference

- [TickerPlugin](https://pixijs.download/release/docs/app.TickerPlugin.html)
- [Ticker](https://pixijs.download/release/docs/ticker.Ticker.html)

---
sidebar_position: 1
description: Learn how to use the Resize Plugin in PixiJS to make your application responsive to window or element size changes.
---

# Resize Plugin

The `ResizePlugin` provides automatic resizing functionality for PixiJS applications. When enabled, it listens to window or element resize events and resizes the application's renderer accordingly.

This is useful for:

- Making the canvas responsive to the browser window
- Maintaining aspect ratio or fitting to containers
- Handling layout changes without manual resize calls

By default, PixiJS adds this plugin when initializing an `Application`, but you can also register it manually if you're using a custom setup.

---

## Usage

```ts
import { Application } from 'pixi.js';

const app = new Application();

await app.init({
  width: 800,
  height: 600,
  resizeTo: window,
});
```

### Default Behavior

- When using `Application.init()` with no overrides, the `ResizePlugin` is installed automatically:
- When `resizeTo` is set, the renderer automatically adjusts to match the dimensions of the target (`window` or `HTMLElement`).
- Resizing is throttled using `requestAnimationFrame` to prevent performance issues during rapid resize events.
- You can trigger a resize manually with `app.resize()` or cancel a scheduled resize with `app.cancelResize()`.

### Manual Registration

If you're managing extensions manually:

```ts
import { extensions, ResizePlugin } from 'pixi.js';

extensions.add(ResizePlugin);
```

### Custom Resize Target

You can specify a custom target for resizing. This is useful if you want to resize the canvas to fit a specific element rather than the entire window.

```ts
await app.init({
  resizeTo: document.getElementById('game-container'),
});
```

---

## API Reference

- [`ResizePlugin`](https://pixijs.download/release/docs/app.ResizePlugin.html)

---
sidebar_position: 2
description: Learn how to use the CullerPlugin in PixiJS to optimize rendering by skipping offscreen objects.
---

# Culler Plugin

The `CullerPlugin` automatically skips rendering for offscreen objects in your scene. It does this by using the renderer's screen bounds to determine whether containers (and optionally their children) intersect the view. If they don't, they are **culled**, reducing rendering and update overhead.

PixiJS does not enable this plugin by default. You must manually register it using the `extensions` system.

## When Should You Use It?

Culling is ideal for:

- Large scenes with many offscreen elements
- Scrollable or camera-driven environments (e.g. tilemaps, world views)
- Optimizing render performance without restructuring your scene graph

## Usage

```ts
const app = new Application();

await app.init({
  width: 800,
  height: 600,
  backgroundColor: 0x222222,
});

extensions.add(CullerPlugin);

const world = new Container();
world.cullable = true;
world.cullableChildren = true;

const sprite = new Sprite.from('path/to/image.png');
sprite.cullable = true; // Enable culling for this sprite
world.addChild(sprite);

app.stage.addChild(world);
```

### Enabling the Culler Plugin

To enable automatic culling in your application:

```ts
import { extensions, CullerPlugin } from 'pixi.js';

extensions.add(CullerPlugin);
```

This will override the default `render()` method on your `Application` instance to call `Culler.shared.cull()` before rendering:

```ts
// Internally replaces:
app.renderer.render({ container: app.stage });
// With:
Culler.shared.cull(app.stage, app.renderer.screen);
app.renderer.render({ container: app.stage });
```

### Configuring Containers for Culling

By default, containers are **not culled**. To enable culling for a container, set the following properties:

```ts
container.cullable = true; // Enables culling for this container
container.cullableChildren = true; // Enables recursive culling for children
```

### Optional: Define a Custom Cull Area

You can define a `cullArea` to override the default bounds check (which uses global bounds):

```ts
container.cullArea = new Rectangle(0, 0, 100, 100);
```

This is useful for containers with many children where bounding box calculations are expensive or inaccurate.

---

## Manual Culling with `Culler`

If you’re not using the plugin but want to manually cull before rendering:

```ts
import { Culler } from 'pixi.js';

const stage = new Container();
// Configure stage and children...

Culler.shared.cull(stage, { x: 0, y: 0, width: 800, height: 600 });
renderer.render({ container: stage });
```

---

## API Reference

- [CullerPlugin](https://pixijs.download/release/docs/app.CullerPlugin.html)

---
sidebar_position: 1
description: Learn how to use PixiJS renderers for high-performance GPU-accelerated rendering in your applications.
---

# Renderers

PixiJS renderers are responsible for drawing your scene to a canvas using either **WebGL/WebGL2** or **WebGPU**. These renderers are high-performance GPU-accelerated engines and are composed of modular systems that manage everything from texture uploads to rendering pipelines.

All PixiJS renderers inherit from a common base, which provides consistent methods such as `.render()`, `.resize()`, and `.clear()` as well as shared systems for managing the canvas, texture GC, events, and more.

## Renderer Types

| Renderer         | Description                                                        | Status          |
| ---------------- | ------------------------------------------------------------------ | --------------- |
| `WebGLRenderer`  | Default renderer using WebGL/WebGL2. Well supported and stable.    | ✅ Recommended  |
| `WebGPURenderer` | Modern GPU renderer using WebGPU. More performant, still maturing. | 🚧 Experimental |
| `CanvasRenderer` | Fallback renderer using 2D canvas.                                 | ❌ Coming-soon  |

:::info
The WebGPU renderer is feature complete, however, inconsistencies in browser implementations may lead to unexpected behavior. It is recommended to use the WebGL renderer for production applications.
:::

## Creating a Renderer

You can use `autoDetectRenderer()` to create the best renderer for the environment:

```ts
import { autoDetectRenderer } from 'pixi.js';

const renderer = await autoDetectRenderer({
  preference: 'webgpu', // or 'webgl'
});
```

Or construct one explicitly:

```ts
import { WebGLRenderer, WebGPURenderer } from 'pixi.js';

const renderer = new WebGLRenderer();
await renderer.init(options);
```

## Rendering a Scene

To render a scene, you can use the `render()` method. This will draw the specified container to the screen or a texture:

```ts
import { Container } from 'pixi.js';

const container = new Container();
renderer.render(container);

// or provide a complete set of options
renderer.render({
  target: container,
  clear: true, // clear the screen before rendering
  transform: new Matrix(), // optional transform to apply to the container
});
```

## Resizing the Renderer

To resize the renderer, use the `resize()` method. This will adjust the canvas size and update the resolution:

```ts
renderer.resize(window.innerWidth, window.innerHeight);
```

## Generating Textures

You can generate textures from containers using the `generateTexture()` method. This is useful for creating textures from dynamic content:

```ts
import { Sprite } from 'pixi.js';

const sprite = new Sprite();
const texture = renderer.generateTexture(sprite);
```

## Resetting State

To reset the renderer's state, use the `resetState()` method. This is useful when mixing PixiJS with other libraries like Three.js:

```ts
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
```

See our full guide on [mixing PixiJS with Three.js](../../third-party/mixing-three-and-pixi.mdx) for more details.

---

## API Reference

- [Overview](https://pixijs.download/release/docs/rendering.html)
- [AbstractRenderer](https://pixijs.download/release/docs/rendering.AbstractRenderer.html)
- [WebGLRenderer](https://pixijs.download/release/docs/rendering.WebGLRenderer.html)
- [WebGPURenderer](https://pixijs.download/release/docs/rendering.WebGPURenderer.html)
- [AutoDetectRenderer](https://pixijs.download/release/docs/rendering.html#autoDetectRenderer)

---
sidebar_position: 6
description: Learn how to use PixiJS's event system for handling user interactions, including mouse and touch events, and how to customize event behavior.
---

# Events / Interaction

PixiJS is primarily a rendering library, but it provides a flexible and performant event system designed for both mouse and touch input. This system replaces the legacy `InteractionManager` from previous versions with a unified, DOM-like federated event model.

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';
sprite.on('pointerdown', () => {
  console.log('Sprite clicked!');
});
```

## Event Modes

To use the event system, set the `eventMode` of a `Container` (or its subclasses like `Sprite`) and subscribe to event listeners.

The `eventMode` property controls how an object interacts with the event system:

| Mode      | Description                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------ |
| `none`    | Ignores all interaction events, including children. Optimized for non-interactive elements.                              |
| `passive` | _(default)_ Ignores self-hit testing and does not emit events, but interactive children still receive events.            |
| `auto`    | Participates in hit testing only if a parent is interactive. Does not emit events.                                       |
| `static`  | Emits events and is hit tested. Suitable for non-moving interactive elements like buttons.                               |
| `dynamic` | Same as `static`, but also receives synthetic events when the pointer is idle. Suitable for animating or moving targets. |

## Event Types

PixiJS supports a rich set of DOM-like event types across mouse, touch, and pointer input. Below is a categorized list.

### Pointer Events (Recommended for general use)

| Event Type          | Description                                                                        |
| ------------------- | ---------------------------------------------------------------------------------- |
| `pointerdown`       | Fired when a pointer (mouse, pen, or touch) is pressed on a display object.        |
| `pointerup`         | Fired when the pointer is released over the display object.                        |
| `pointerupoutside`  | Fired when the pointer is released outside the object that received `pointerdown`. |
| `pointermove`       | Fired when the pointer moves over the display object.                              |
| `pointerover`       | Fired when the pointer enters the boundary of the display object.                  |
| `pointerout`        | Fired when the pointer leaves the boundary of the display object.                  |
| `pointerenter`      | Fired when the pointer enters the display object (does not bubble).                |
| `pointerleave`      | Fired when the pointer leaves the display object (does not bubble).                |
| `pointercancel`     | Fired when the pointer interaction is canceled (e.g. touch lost).                  |
| `pointertap`        | Fired when a pointer performs a quick tap.                                         |
| `globalpointermove` | Fired on every pointer move, regardless of whether any display object is hit.      |

### Mouse Events (Used for mouse-specific input)

| Event Type        | Description                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------- |
| `mousedown`       | Fired when a mouse button is pressed on a display object.                                   |
| `mouseup`         | Fired when a mouse button is released over the object.                                      |
| `mouseupoutside`  | Fired when a mouse button is released outside the object that received `mousedown`.         |
| `mousemove`       | Fired when the mouse moves over the display object.                                         |
| `mouseover`       | Fired when the mouse enters the display object.                                             |
| `mouseout`        | Fired when the mouse leaves the display object.                                             |
| `mouseenter`      | Fired when the mouse enters the object, does not bubble.                                    |
| `mouseleave`      | Fired when the mouse leaves the object, does not bubble.                                    |
| `click`           | Fired when a mouse click (press and release) occurs on the object.                          |
| `rightdown`       | Fired when the right mouse button is pressed on the display object.                         |
| `rightup`         | Fired when the right mouse button is released over the object.                              |
| `rightupoutside`  | Fired when the right mouse button is released outside the object that received `rightdown`. |
| `rightclick`      | Fired when a right mouse click (press and release) occurs on the object.                    |
| `globalmousemove` | Fired on every mouse move, regardless of display object hit.                                |
| `wheel`           | Fired when the mouse wheel is scrolled while over the display object.                       |

### Touch Events

| Event Type        | Description                                                                           |
| ----------------- | ------------------------------------------------------------------------------------- |
| `touchstart`      | Fired when a new touch point is placed on a display object.                           |
| `touchend`        | Fired when a touch point is lifted from the display object.                           |
| `touchendoutside` | Fired when a touch point ends outside the object that received `touchstart`.          |
| `touchmove`       | Fired when a touch point moves across the display object.                             |
| `touchcancel`     | Fired when a touch interaction is canceled (e.g. device gesture).                     |
| `tap`             | Fired when a touch point taps the display object.                                     |
| `globaltouchmove` | Fired on every touch move, regardless of whether a display object is under the touch. |

### Global Events

In previous versions of PixiJS, events such as `pointermove`, `mousemove`, and `touchmove` were fired when any move event was captured by the canvas, even if the pointer was not over a display object. This behavior changed in v8 and now these events are fired only when the pointer is over a display object.

To maintain the old behavior, you can use the `globalpointermove`, `globalmousemove`, and `globaltouchmove` events. These events are fired on every pointer/touch move, regardless of whether any display object is hit.

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';
sprite.on('globalpointermove', (event) => {
  console.log('Pointer moved globally!', event);
});
```

## How Hit Testing Works

When an input event occurs (mouse move, click, etc.), PixiJS walks the display tree to find the top-most interactive element under the pointer:

- If `interactiveChildren` is `false` on a `Container`, its children will be skipped.
- If a `hitArea` is set, it overrides bounds-based hit testing.
- If `eventMode` is `'none'`, the element and its children are skipped.

Once the top-most interactive element is found, the event is dispatched to it. If the event bubbles, it will propagate up the display tree.
If the event is not handled, it will continue to bubble up to parent containers until it reaches the root.

### Custom Hit Area

Custom hit areas can be defined using the `hitArea` property. This property can be set on any scene object, including `Sprite`, `Container`, and `Graphics`.

Using a custom hit area allows you to define a specific area for interaction, which can be different from the object's bounding box. It also can improve performance by reducing the number of objects that need to be checked for interaction.

```ts
import { Rectangle, Sprite } from 'pixi.js';

const sprite = new Sprite(texture);
sprite.hitArea = new Rectangle(0, 0, 100, 100);
sprite.eventMode = 'static';
```

## Listening to Events

PixiJS supports both `on()`/`off()` and `addEventListener()`/`removeEventListener()` and event callbacks (`onclick: ()=> {}`) for adding and removing event listeners. The `on()` method is recommended for most use cases as it provides a more consistent API across different event types used throughout PixiJS.

### Using `on()` (from EventEmitter)

```ts
const eventFn = (e) => console.log('clicked');
sprite.on('pointerdown', eventFn);
sprite.once('pointerdown', eventFn);
sprite.off('pointerdown', eventFn);
```

### Using DOM-style Events

```ts
sprite.addEventListener(
  'click',
  (event) => {
    console.log('Clicked!', event.detail);
  },
  { once: true },
);
```

### Using callbacks

```ts
sprite.onclick = (event) => {
  console.log('Clicked!', event.detail);
};
```

## Checking for Interactivity

You can check if a `Sprite` or `Container` is interactive by using the `isInteractive()` method. This method returns `true` if the object is interactive and can receive events.

```ts
if (sprite.isInteractive()) {
  // true if eventMode is static or dynamic
}
```

## Custom Cursors

PixiJS allows you to set a custom cursor for interactive objects using the `cursor` property. This property accepts a string representing the CSS cursor type.

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';
sprite.cursor = 'pointer'; // Set the cursor to a pointer when hovering over the sprite
```

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';
sprite.cursor = 'url(my-cursor.png), auto'; // Set a custom cursor image
```

### Default Custom Cursors

You can also set default values to be used for all interactive objects.

```ts
// CSS style for icons
const defaultIcon = "url('https://pixijs.com/assets/bunny.png'),auto";
const hoverIcon = "url('https://pixijs.com/assets/bunny_saturated.png'),auto";

// Add custom cursor styles
app.renderer.events.cursorStyles.default = defaultIcon;
app.renderer.events.cursorStyles.hover = hoverIcon;

const sprite = new Sprite(texture);
sprite.eventMode = 'static';
sprite.cursor = 'hover';
```

---

## API Reference

- [Overview](https://pixijs.download/release/docs/events.html)
- [EventSystem](https://pixijs.download/release/docs/events.EventSystem.html)
- [Cursor](https://pixijs.download/release/docs/events.html#Cursor)
- [EventMode](https://pixijs.download/release/docs/events.html#EventMode)
- [Container](https://pixijs.download/release/docs/scene.Container.html)
- [FederatedEvent](https://pixijs.download/release/docs/events.FederatedEvent.html)
- [FederatedMouseEvent](https://pixijs.download/release/docs/events.FederatedMouseEvent.html)
- [FederatedWheelEvent](https://pixijs.download/release/docs/events.FederatedWheelEvent.html)
- [FederatedPointerEvent](https://pixijs.download/release/docs/events.FederatedPointerEvent.html)