Overview
Application
The Application class provides a modern, extensible entry point to set up rendering in PixiJS. It abstracts common tasks like renderer setup, display management, and automatic updates while supporting both WebGL and WebGPU rendering backends.

Creating an Application
Creating an application requires two steps: constructing an instance, then initializing it asynchronously using .init():

import { Application } from 'pixi.js';

const app = new Application();

await app.init({
    width: 800,
    height: 600,
    backgroundColor: 0x1099bb,
});

document.body.appendChild(app.canvas);
Copy
Core Features
Scene Management
The application provides a root container (stage) where you can add all your visual elements:

import { Sprite } from 'pixi.js';

const sprite = Sprite.from('image.png');
app.stage.addChild(sprite);
Copy
Automatic Updates
By default, the application includes the TickerPlugin which handles the rendering loop:

// Configure ticker on init
await app.init({
    autoStart: true, // Start ticker automatically
    sharedTicker: false, // Use dedicated ticker instance
});

// (Optional) Start/stop the rendering loop
app.start();
app.stop();

// Access ticker properties
console.log(app.ticker.FPS); // Current FPS
console.log(app.ticker.deltaMS); // MS since last update

// Add update callbacks
app.ticker.add(() => {
    // Animation logic here
});

app.ticker.addOnce(() => {
    // Logic to run once after the next frame
});
Copy
Responsive Design
The ResizePlugin enables automatic resizing of the application to fit different containers or the window. You can specify a target element for resizing:

// Auto-resize to window
await app.init({ resizeTo: window });

// Auto-resize to container element
await app.init({ resizeTo: document.querySelector('#game') });

// Manual resize control
app.resize(); // Immediate resize
app.queueResize(); // Throttled resize
app.cancelResize(); // Cancel pending resize
Copy
Configuration Options
The application can be configured with various options during initialization:

await app.init({
    // Rendering options
    width: 800, // Canvas width
    height: 600, // Canvas height
    backgroundColor: 0x1099bb, // Background color
    antialias: true, // Enable antialiasing
    resolution: window.devicePixelRatio, // Screen resolution
    preference: 'webgl', // 'webgl' or 'webgpu'

    // Plugin options
    autoStart: true, // Start ticker automatically
    sharedTicker: false, // Use dedicated ticker
    resizeTo: window, // Auto-resize target
});
Copy
Cleanup
When you're done with the application, make sure to clean up resources:

// Basic cleanup
app.destroy();

// Full cleanup with options
app.destroy(
    { removeView: true }, // Renderer options
    {
        // Display options
        children: true,
        texture: true,
        textureSource: true,
    },
);
Copy
Extending Functionality
The Application class is designed to be extensible through plugins. Each plugin can add new features and properties to the Application instance:

import { Application, ExtensionType, extensions } from 'pixi.js';

class MyPlugin {
    static extension = ExtensionType.Application;

    static init(options) {
        // Add features to Application instance
        Object.defineProperty(this, 'myFeature', {
            value: () => console.log('My feature!'),
        });
    }

    static destroy() {
        // Cleanup when application is destroyed
    }
}

// Register the plugin
extensions.add(MyPlugin);

// Initialize the application with the plugin
const app = new Application();
await app.init({...});

app.myFeature(); // Use the plugin feature
Copy
Best Practices
Always await app.init() before using the application
Use app.ticker for animation updates rather than requestAnimationFrame
Clean up resources with app.destroy() when the application is no longer needed
Consider using resizeTo for responsive applications
Related Documentation
See Application for the full API reference
See ApplicationOptions for all available configuration options
See ApplicationPlugin for creating custom plugins
See TickerPlugin for details on the ticker system
See ResizePlugin for responsive design features
See CullerPlugin for managing visible objects
See ExtensionType for understanding extension types
See Renderer for renderer-specific options and methods
See Container for managing display objects
For more specific implementation details and advanced usage, refer to the API documentation of individual classes and interfaces.

Application
Class Application<R>
Convenience class to create a new PixiJS application.

The Application class is the main entry point for creating a PixiJS application. It handles the setup of all core components needed to start rendering and managing your game or interactive experience.

Key features:

Automatically creates and manages the renderer
Provides a stage (root container) for your display objects
Handles canvas creation and management
Supports plugins for extending functionality
ResizePlugin for automatic resizing
TickerPlugin for managing frame updates
CullerPlugin for culling off-screen objects
Example
import { Assets, Application, Sprite } from 'pixi.js';

// Create a new application
const app = new Application();

// Initialize with options
await app.init({
    width: 800,           // Canvas width
    height: 600,          // Canvas height
    backgroundColor: 0x1099bb, // Background color
    antialias: true,     // Enable antialiasing
    resolution: 1,       // Resolution / device pixel ratio
    preference: 'webgl', // or 'webgpu' // Renderer preference
});

// Add the canvas to your webpage
document.body.appendChild(app.canvas);

// Start adding content to your application
const texture - await Assets.load('your-image.png');
const sprite = new Sprite(texture);
app.stage.addChild(sprite);
Copy
Important
From PixiJS v8.0.0, the application must be initialized using the async init() method rather than passing options to the constructor.

See
ApplicationOptions For all available initialization options
Container For information about the stage container
Renderer For details about the rendering system
Type Parameters
R extends Renderer = Renderer
Hierarchy
Application
Application
Properties
P
renderer
P
resizeTo
P
stage
P
ticker
Accessors
A
canvas
A
screen
A
view
Methods
M
cancelResize
M
destroy
M
init
M
queueResize
M
render
M
resize
M
start
M
stop
renderer
renderer: R
The renderer instance that handles all drawing operations.

Unless specified, it will automatically create a WebGL renderer if available. If WebGPU is available and the preference is set to webgpu, it will create a WebGPU renderer.

Example
// Create a new application
const app = new Application();
await app.init({
    width: 800,
    height: 600,
    preference: 'webgl', // or 'webgpu'
});

// Access renderer properties
console.log(app.renderer.width, app.renderer.height);
Copy
resizeTo
resizeTo: HTMLElement | Window
Element to automatically resize the renderer to.

Example
const app = new Application();
await app.init({
    resizeTo: window, // Resize to the entire window
    // or
    resizeTo: document.querySelector('#game-container'), // Resize to a specific element
    // or
    resizeTo: null, // Disable auto-resize
});
Copy
Default
null
Copy
Inherited from PixiMixins.Application.resizeTo

stage
stage: Container = ...
The root display container for your application. All visual elements should be added to this container or its children.

Example
// Create a sprite and add it to the stage
const sprite = Sprite.from('image.png');
app.stage.addChild(sprite);

// Create a container for grouping objects
const container = new Container();
app.stage.addChild(container);
Copy
ticker
ticker: Ticker
The application's ticker instance that manages the update/render loop.

Example
// Basic animation
app.ticker.add((ticker) => {
    sprite.rotation += 0.1 * ticker.deltaTime;
});

// Control update priority
app.ticker.add(
    (ticker) => {
        // Physics update (runs first)
    },
    undefined,
    UPDATE_PRIORITY.HIGH
);

// One-time update
app.ticker.addOnce(() => {
    console.log('Runs next frame only');
});

// Access timing info
console.log(app.ticker.FPS);      // Current FPS
console.log(app.ticker.deltaTime); // Scaled time delta
console.log(app.ticker.deltaMS);   // MS since last update
Copy
See
Ticker For detailed ticker functionality
UPDATE_PRIORITY For priority constants
Inherited from PixiMixins.Application.ticker

canvas
get canvas(): R["canvas"]
Reference to the renderer's canvas element. This is the HTML element that displays your application's graphics.

Returns R["canvas"]
Example
// Create a new application
const app = new Application();
// Initialize the application
await app.init({...});
// Add canvas to the page
document.body.appendChild(app.canvas);

// Access the canvas directly
console.log(app.canvas); // HTMLCanvasElement
Copy
screen
get screen(): Rectangle
Reference to the renderer's screen rectangle. This represents the visible area of your application.

It's commonly used for:

Setting filter areas for full-screen effects
Defining hit areas for screen-wide interaction
Determining the visible bounds of your application
Returns Rectangle
Example
// Use as filter area for a full-screen effect
const blurFilter = new BlurFilter();
sprite.filterArea = app.screen;

// Use as hit area for screen-wide interaction
const screenSprite = new Sprite();
screenSprite.hitArea = app.screen;

// Get screen dimensions
console.log(app.screen.width, app.screen.height);
Copy
See
Rectangle For all available properties and methods

view
get view(): R["canvas"]
Reference to the renderer's canvas element.

Returns R["canvas"]
Deprecated
since 8.0.0

See
Application#canvas

cancelResize
cancelResize(): void
Cancel any pending resize operation that was queued with queueResize().

Returns void
Remarks
Clears the resize operation queued for next frame
Example
// Queue a resize
app.queueResize();

// Cancel if needed
app.cancelResize();
Copy
Inherited from PixiMixins.Application.cancelResize

destroy
destroy(
    rendererDestroyOptions?: RendererDestroyOptions,
    options?: DestroyOptions,
): void
Destroys the application and all of its resources.

This method should be called when you want to completely clean up the application and free all associated memory.

Parameters
rendererDestroyOptions: RendererDestroyOptions = false
Options for destroying the renderer:

false or undefined: Preserves the canvas element (default)
true: Removes the canvas element
{ removeView: boolean }: Object with removeView property to control canvas removal
options: DestroyOptions = false
Options for destroying the application:

false or undefined: Basic cleanup (default)
true: Complete cleanup including children
Detailed options object:
children: Remove children
texture: Destroy textures
textureSource: Destroy texture sources
context: Destroy WebGL context
Returns void
Example
// Basic cleanup
app.destroy();

// Remove canvas and do complete cleanup
app.destroy(true, true);

// Remove canvas with explicit options
app.destroy({ removeView: true }, true);

// Detailed cleanup with specific options
app.destroy(
    { removeView: true },
    {
        children: true,
        texture: true,
        textureSource: true,
        context: true
    }
);
Copy
Warning
After calling destroy, the application instance should no longer be used. All properties will be null and further operations will throw errors.

init
init(options?: Partial<ApplicationOptions>): Promise<void>
Initializes the PixiJS application with the specified options.

This method must be called after creating a new Application instance.

Parameters
Optionaloptions: Partial<ApplicationOptions>
Configuration options for the application and renderer

Returns Promise<void>
A promise that resolves when initialization is complete

Example
const app = new Application();

// Initialize with custom options
await app.init({
    width: 800,
    height: 600,
    backgroundColor: 0x1099bb,
    preference: 'webgl', // or 'webgpu'
});
Copy
queueResize
queueResize(): void
Queue a resize operation for the next animation frame. This method is throttled and optimized for frequent calls.

Important
You do not need to call this method manually in most cases. A resize event will be dispatched automatically when the resizeTo element changes size.

Returns void
Remarks
Safe to call multiple times per frame
Only one resize will occur on next frame
Cancels any previously queued resize
Example
app.queueResize(); // Queue for next frame
Copy
Inherited from PixiMixins.Application.queueResize

render
render(): void
Renders the current stage to the screen.

When using the default setup with TickerPlugin (enabled by default), you typically don't need to call this method directly as rendering is handled automatically.

Only use this method if you've disabled the TickerPlugin or need custom render timing control.

Returns void
Example
// Example 1: Default setup (TickerPlugin handles rendering)
const app = new Application();
await app.init();
// No need to call render() - TickerPlugin handles it

// Example 2: Custom rendering loop (if TickerPlugin is disabled)
const app = new Application();
await app.init({ autoStart: false }); // Disable automatic rendering

function animate() {
    app.render();
    requestAnimationFrame(animate);
}
animate();
Copy
resize
resize(): void
Element to automatically resize the renderer to.

Important
You do not need to call this method manually in most cases. A resize event will be dispatched automatically when the resizeTo element changes size.

Returns void
Remarks
Automatically resizes the renderer to match the size of the resizeTo element
If resizeTo is null, auto-resizing is disabled
If resizeTo is a Window, it resizes to the full window size
If resizeTo is an HTMLElement, it resizes to the element's bounding client rectangle
Example
const app = new Application();
await app.init({
    resizeTo: window, // Resize to the entire window
    // or
    resizeTo: document.querySelector('#game-container'), // Resize to a specific element
    // or
    resizeTo: null, // Disable auto-resize
});

// Manually trigger a resize
app.resize();
Copy
Default
null
Copy
Inherited from PixiMixins.Application.resize

start
start(): void
Starts the render/update loop.

Returns void
Example
// Initialize without auto-start
await app.init({ autoStart: false });

// Start when ready
app.start();
Copy
Inherited from PixiMixins.Application.start

stop
stop(): void
Stops the render/update loop.

Returns void
Example
// Stop the application
app.stop();
// ... custom update logic ...
app.render(); // Manual render


Class CullerPlugin
An Application plugin that automatically culls (hides) display objects that are outside the visible screen area. This improves performance by not rendering objects that aren't visible.

Key Features:

Automatic culling based on screen boundaries
Configurable culling areas and behavior per container
Can improve rendering performance
Example
import { Application, CullerPlugin, Container, Rectangle } from 'pixi.js';

// Register the plugin
extensions.add(CullerPlugin);

// Create application
const app = new Application();
await app.init({...});

// Create a container with culling enabled
const container = new Container();
container.cullable = true;         // Enable culling for this container
container.cullableChildren = true; // Enable culling for children (default)
app.stage.addChild(container);

// Optional: Set custom cull area to avoid expensive bounds calculations
container.cullArea = new Rectangle(0, 0, app.screen.width, app.screen.height);

// Add many sprites to the group
for (let j = 0; j < 100; j++) {
    const sprite = Sprite.from('texture.png');
    sprite.x = Math.random() * 2000;
    sprite.y = Math.random() * 2000;

    sprite.cullable = true; // Enable culling for each sprite

    // Set cullArea if needed
    // sprite.cullArea = new Rectangle(0, 0, 100, 100); // Optional

    // Add to container
    container.addChild(sprite);
}
Copy
Remarks
To enable culling, you must set the following properties on your containers:

cullable: Set to true to enable culling for the container
cullableChildren: Set to true to enable culling for children (default)
cullArea: Optional custom Rectangle for culling bounds
Performance Tips:

Group objects that are spatially related
Use cullArea for containers with many children to avoid bounds calculations
Set cullableChildren = false for containers that are always fully visible
See
Culler For the underlying culling implementation
CullingMixinConstructor For culling properties documentation
Constructors
C
constructor
constructor
new CullerPlugin(): CullerPlugin
Returns CullerPlugin

Class ResizePlugin
Middleware for Application's resize functionality. This plugin handles automatic and manual resizing of your PixiJS application.

Adds the following features to Application:

resizeTo: Set an element to automatically resize to
resize: Manually trigger a resize
queueResize: Queue a resize for the next animation frame
cancelResize: Cancel a queued resize
Example
import { Application, ResizePlugin } from 'pixi.js';

// Create application
const app = new Application();

// Example 1: Auto-resize to window
await app.init({ resizeTo: window });

// Example 2: Auto-resize to specific element
const container = document.querySelector('#game-container');
await app.init({ resizeTo: container });

// Example 3: Change resize target at runtime
app.resizeTo = window;                    // Enable auto-resize to window
app.resizeTo = null;                      // Disable auto-resize
Copy
Constructors
C
constructor
constructor
new ResizePlugin(): ResizePlugin
Returns ResizePlugin

Class TickerPlugin
Middleware for Application's Ticker functionality. This plugin manages the animation loop and update cycle of your PixiJS application.

Adds the following features to Application:

ticker: Access to the application's ticker
start: Start the animation loop
stop: Stop the animation loop
Example
import { Application, TickerPlugin, extensions } from 'pixi.js';

// Create application
const app = new Application();

// Example 1: Basic ticker usage (default autoStart)
await app.init({ autoStart: true });      // Starts ticker automatically

// Example 2: Manual ticker control
await app.init({ autoStart: false });     // Don't start automatically
app.start();                              // Start manually
app.stop();                               // Stop manually

// Example 3: Add custom update logic
app.ticker.add((ticker) => {
    // Run every frame, delta is the time since last update
    sprite.rotation += 0.1 * ticker.deltaTime;
});

// Example 4: Control update priority
import { UPDATE_PRIORITY } from 'pixi.js';

app.ticker.add(
    (ticker) => {
        // Run before normal priority updates
    },
    null,
    UPDATE_PRIORITY.HIGH
);

// Example 5: One-time update
app.ticker.addOnce(() => {
    console.log('Runs next frame only');
});
Copy
See
Ticker For detailed ticker functionality
UPDATE_PRIORITY For priority constants
Constructors
C
constructor
constructor
new TickerPlugin(): TickerPlugin
Returns TickerPlugin

ApplicationOptions
Interface ApplicationOptions
Application options supplied to the Application#init method. These options configure how your PixiJS application behaves.

Example
import { Application } from 'pixi.js';

const app = new Application();

// Initialize with common options
await app.init({
   // Rendering options
   width: 800,                    // Canvas width
   height: 600,                   // Canvas height
   backgroundColor: 0x1099bb,     // Background color
   antialias: true,              // Enable antialiasing
   resolution: window.devicePixelRatio, // Screen resolution

   // Performance options
   autoStart: true,              // Auto-starts the render loop
   sharedTicker: true,           // Use shared ticker for better performance

   // Automatic resize options
   resizeTo: window,             // Auto-resize to window
   autoDensity: true,           // Adjust for device pixel ratio

   // Advanced options
   preference: 'webgl',         // Renderer preference ('webgl' or 'webgpu')
   powerPreference: 'high-performance' // GPU power preference
});
Copy
See
WebGLOptions For resize-related options
WebGPUOptions For resize-related options
TickerPlugin For ticker-related options
ResizePlugin For resize-related options
interface ApplicationOptions {
    antialias?: boolean;
    autoDensity?: boolean;
    autoStart?: boolean;
    background?: ColorSource;
    backgroundAlpha?: number;
    backgroundColor: ColorSource;
    bezierSmoothness: number;
    canvas?: ICanvas;
    clearBeforeRender?: boolean;
    context: WebGL2RenderingContext;
    depth?: boolean;
    eventFeatures?: Partial<EventSystemFeatures>;
    eventMode?: EventMode;
    failIfMajorPerformanceCaveat?: boolean;
    forceFallbackAdapter: boolean;
    height?: number;
    hello: boolean;
    manageImports?: boolean;
    multiView: boolean;
    powerPreference?: GpuPowerPreference;
    preference?: "webgl" | "webgpu";
    preferWebGLVersion?: 1 | 2;
    premultipliedAlpha: boolean;
    preserveDrawingBuffer: boolean;
    renderableGCActive: boolean;
    renderableGCFrequency: number;
    renderableGCMaxUnusedTime: number;
    resizeTo?: HTMLElement | Window;
    resolution?: number;
    roundPixels?: boolean;
    sharedTicker?: boolean;
    skipExtensionImports?: boolean;
    textureGCActive: boolean;
    textureGCAMaxIdle: number;
    textureGCCheckCountMax: number;
    textureGCMaxIdle: number;
    useBackBuffer?: boolean;
    view?: ICanvas;
    webgl?: Partial<WebGLOptions>;
    webgpu?: Partial<WebGPUOptions>;
    width?: number;
}
Hierarchy (View Summary, Expand)
AutoDetectOptions
ApplicationOptions
ApplicationOptions
Properties
P
antialias?
P
autoDensity?
P
autoStart?
P
background?
P
backgroundAlpha?
P
backgroundColor
P
bezierSmoothness
P
canvas?
P
clearBeforeRender?
P
context
P
depth?
P
eventFeatures?
P
eventMode?
P
failIfMajorPerformanceCaveat?
P
forceFallbackAdapter
P
height?
P
hello
P
manageImports?
P
multiView
P
powerPreference?
P
preference?
P
preferWebGLVersion?
P
premultipliedAlpha
P
preserveDrawingBuffer
P
renderableGCActive
P
renderableGCFrequency
P
renderableGCMaxUnusedTime
P
resizeTo?
P
resolution?
P
roundPixels?
P
sharedTicker?
P
skipExtensionImports?
P
textureGCActive
P
textureGCAMaxIdle
P
textureGCCheckCountMax
P
textureGCMaxIdle
P
useBackBuffer?
P
view?
P
webgl?
P
webgpu?
P
width?
Optionalantialias
antialias?: boolean
Whether to enable anti-aliasing. This may affect performance.

Inherited from AutoDetectOptions.antialias

OptionalautoDensity
autoDensity?: boolean
Resizes renderer view in CSS pixels to allow for resolutions other than 1.

This is only supported for HTMLCanvasElement and will be ignored if the canvas is an OffscreenCanvas.

Inherited from AutoDetectOptions.autoDensity

OptionalautoStart
autoStart?: boolean
Controls whether the animation loop starts automatically after initialization.

Important
Setting this to false does NOT stop the shared ticker even if sharedTicker is true. You must stop the shared ticker manually if needed.

Example
// Auto-start (default behavior)
await app.init({ autoStart: true });

// Manual start
await app.init({ autoStart: false });
app.start(); // Start when ready
Copy
Default
true
Copy
Inherited from PixiMixins.ApplicationOptions.autoStart

Optionalbackground
background?: ColorSource
Alias for backgroundColor

Inherited from AutoDetectOptions.background

OptionalbackgroundAlpha
backgroundAlpha?: number
Transparency of the background color, value from 0 (fully transparent) to 1 (fully opaque).

Default
1
Copy
Inherited from AutoDetectOptions.backgroundAlpha

backgroundColor
backgroundColor: ColorSource
The background color used to clear the canvas. See ColorSource for accepted color values.

Default
'black'
Copy
Inherited from AutoDetectOptions.backgroundColor

bezierSmoothness
bezierSmoothness: number
A value from 0 to 1 that controls the smoothness of bezier curves (the higher the smoother)

Default
0.5
Copy
Inherited from AutoDetectOptions.bezierSmoothness

Optionalcanvas
canvas?: ICanvas
The canvas to use as a view, optional.

Inherited from AutoDetectOptions.canvas

OptionalclearBeforeRender
clearBeforeRender?: boolean
Whether to clear the canvas before new render passes.

Default
true
Copy
Inherited from AutoDetectOptions.clearBeforeRender

context
context: WebGL2RenderingContext
User-provided WebGL rendering context object.

Default
null
Copy
Inherited from AutoDetectOptions.context

Optionaldepth
depth?: boolean
Whether to ensure the main view has can make use of the depth buffer. Always true for WebGL renderer.

Inherited from AutoDetectOptions.depth

OptionaleventFeatures
eventFeatures?: Partial<EventSystemFeatures>
Configuration for enabling/disabling specific event features. Use this to optimize performance by turning off unused functionality.

Example
const app = new Application();
await app.init({
    eventFeatures: {
        // Core interaction events
        move: true,        // Pointer/mouse/touch movement
        click: true,       // Click/tap events
        wheel: true,       // Mouse wheel/scroll events
        // Global tracking
        globalMove: false  // Global pointer movement
    }
});
Copy
Since
7.2.0

Inherited from AutoDetectOptions.eventFeatures

OptionaleventMode
eventMode?: EventMode
The type of interaction behavior for a Container. This is set via the Container#eventMode property.

Example
// Basic event mode setup
const sprite = new Sprite(texture);
sprite.eventMode = 'static';    // Enable standard interaction
sprite.on('pointerdown', () => { console.log('clicked!'); });

// Different event modes
sprite.eventMode = 'none';      // Disable all interaction
sprite.eventMode = 'passive';   // Only allow interaction on children
sprite.eventMode = 'auto';      // Like DOM pointer-events: auto
sprite.eventMode = 'dynamic';   // For moving/animated objects
Copy
Available modes:

'none': Ignores all interaction events, even on its children
'passive': (default) Does not emit events and ignores hit testing on itself and non-interactive children. Interactive children will still emit events.
'auto': Does not emit events but is hit tested if parent is interactive. Same as interactive = false in v7
'static': Emit events and is hit tested. Same as interactive = true in v7
'dynamic': Emits events and is hit tested but will also receive mock interaction events fired from a ticker to allow for interaction when the mouse isn't moving
Performance tips:

Use 'none' for pure visual elements
Use 'passive' for containers with some interactive children
Use 'static' for standard buttons/controls
Use 'dynamic' only for moving/animated interactive elements
Since
7.2.0

Inherited from AutoDetectOptions.eventMode

OptionalfailIfMajorPerformanceCaveat
failIfMajorPerformanceCaveat?: boolean
Inherited from AutoDetectOptions.failIfMajorPerformanceCaveat

forceFallbackAdapter
forceFallbackAdapter: boolean
Force the use of the fallback adapter

Default
false
Copy
Inherited from AutoDetectOptions.forceFallbackAdapter

Optionalheight
height?: number
The height of the screen.

Default
600
Copy
Inherited from AutoDetectOptions.height

hello
hello: boolean
Whether to log the version and type information of renderer to console.

Default
false
Copy
Inherited from AutoDetectOptions.hello

OptionalmanageImports
manageImports?: boolean
Default
true
Copy
Deprecated
since 8.1.6

See
skipExtensionImports

Inherited from AutoDetectOptions.manageImports

multiView
multiView: boolean
Whether to enable multi-view rendering. Set to true when rendering to multiple canvases on the dom.

Default
false
Copy
Inherited from AutoDetectOptions.multiView

OptionalpowerPreference
powerPreference?: GpuPowerPreference
An optional hint indicating what configuration of GPU is suitable for the WebGL context, can be 'high-performance' or 'low-power'. Setting to 'high-performance' will prioritize rendering performance over power consumption, while setting to 'low-power' will prioritize power saving over rendering performance.

Default
undefined
Copy
Inherited from AutoDetectOptions.powerPreference

Optionalpreference
preference?: "webgl" | "webgpu"
The preferred renderer type. WebGPU is recommended as its generally faster than WebGL.

Inherited from AutoDetectOptions.preference

OptionalpreferWebGLVersion
preferWebGLVersion?: 1 | 2
The preferred WebGL version to use.

Default
2
Copy
Inherited from AutoDetectOptions.preferWebGLVersion

premultipliedAlpha
premultipliedAlpha: boolean
Whether the compositor will assume the drawing buffer contains colors with premultiplied alpha.

Default
true
Copy
Inherited from AutoDetectOptions.premultipliedAlpha

preserveDrawingBuffer
preserveDrawingBuffer: boolean
Whether to enable drawing buffer preservation. If enabled, the drawing buffer will preserve its value until cleared or overwritten. Enable this if you need to call toDataUrl on the WebGL context.

Default
false
Copy
Inherited from AutoDetectOptions.preserveDrawingBuffer

renderableGCActive
renderableGCActive: boolean
If set to true, this will enable the garbage collector on the GPU.

Default
true
Copy
Inherited from AutoDetectOptions.renderableGCActive

renderableGCFrequency
renderableGCFrequency: number
Frames between two garbage collections.

Default
600
Copy
Inherited from AutoDetectOptions.renderableGCFrequency

renderableGCMaxUnusedTime
renderableGCMaxUnusedTime: number
The maximum idle frames before a texture is destroyed by garbage collection.

Default
60 * 60
Copy
Inherited from AutoDetectOptions.renderableGCMaxUnusedTime

OptionalresizeTo
resizeTo?: HTMLElement | Window
Element to automatically resize the renderer to.

Example
const app = new Application();
await app.init({
    resizeTo: window, // Resize to the entire window
    // or
    resizeTo: document.querySelector('#game-container'), // Resize to a specific element
    // or
    resizeTo: null, // Disable auto-resize
});
Copy
Default
null
Copy
Inherited from PixiMixins.ApplicationOptions.resizeTo

Optionalresolution
resolution?: number
The resolution / device pixel ratio of the renderer.

Inherited from AutoDetectOptions.resolution

OptionalroundPixels
roundPixels?: boolean
Inherited from AutoDetectOptions.roundPixels

OptionalsharedTicker
sharedTicker?: boolean
Controls whether to use the shared global ticker or create a new instance.

The shared ticker is useful when you have multiple instances that should sync their updates. However, it has some limitations regarding update order control.

Update Order:

System ticker (always runs first)
Shared ticker (if enabled)
App ticker (if using own ticker)
Example
// Use shared ticker (global instance)
await app.init({ sharedTicker: true });

// Use dedicated ticker (default)
await app.init({ sharedTicker: false });

// Access ticker properties
console.log(app.ticker.FPS);    // Current FPS
console.log(app.ticker.deltaMS); // MS since last update
Copy
Default
false
Copy
Inherited from PixiMixins.ApplicationOptions.sharedTicker

OptionalskipExtensionImports
skipExtensionImports?: boolean
Whether to stop PixiJS from dynamically importing default extensions for the renderer. It is false by default, and means PixiJS will load all the default extensions, based on the environment e.g browser/webworker. If you set this to true, then you will need to manually import the systems and extensions you need.

e.g.

import 'accessibility';
import 'app';
import 'events';
import 'spritesheet';
import 'graphics';
import 'mesh';
import 'text';
import 'text-bitmap';
import 'text-html';
import { autoDetectRenderer } from 'pixi.js';

const renderer = await autoDetectRenderer({
  width: 800,
  height: 600,
  skipExtensionImports: true,
});
Copy
Default
false
Copy
Inherited from AutoDetectOptions.skipExtensionImports

textureGCActive
textureGCActive: boolean
If set to true, this will enable the garbage collector on the GPU.

Default
true
Copy
Inherited from AutoDetectOptions.textureGCActive

textureGCAMaxIdle
textureGCAMaxIdle: number
Deprecated
since 8.3.0

See
TextureGCSystemOptions.textureGCMaxIdle

Inherited from AutoDetectOptions.textureGCAMaxIdle

textureGCCheckCountMax
textureGCCheckCountMax: number
Frames between two garbage collections.

Default
600
Copy
Inherited from AutoDetectOptions.textureGCCheckCountMax

textureGCMaxIdle
textureGCMaxIdle: number
The maximum idle frames before a texture is destroyed by garbage collection.

Default
60 * 60
Copy
Inherited from AutoDetectOptions.textureGCMaxIdle

OptionaluseBackBuffer
useBackBuffer?: boolean
if true will use the back buffer where required

Default
false
Copy
Inherited from AutoDetectOptions.useBackBuffer

Optionalview
view?: ICanvas
Alias for canvas.

Deprecated
since 8.0.0

Inherited from AutoDetectOptions.view

Optionalwebgl
webgl?: Partial<WebGLOptions>
Optional WebGLOptions to pass only to the WebGL renderer

Inherited from AutoDetectOptions.webgl

Optionalwebgpu
webgpu?: Partial<WebGPUOptions>
Optional WebGPUOptions to pass only to WebGPU renderer.

Inherited from AutoDetectOptions.webgpu

Optionalwidth
width?: number
The width of the screen.

Default
800

ResizePluginOptions
Interface ResizePluginOptions
Application options for the ResizePlugin. These options control how your application handles window and element resizing.

Example
// Auto-resize to window
await app.init({ resizeTo: window });

// Auto-resize to container element
await app.init({ resizeTo: document.querySelector('#game') });
Copy
interface ResizePluginOptions {
    resizeTo?: HTMLElement | Window;
}
Properties
P
resizeTo?
OptionalresizeTo
resizeTo?: HTMLElement | Window
Element to automatically resize the renderer to.

Example
const app = new Application();
await app.init({
    resizeTo: window, // Resize to the entire window
    // or
    resizeTo: document.querySelector('#game-container'), // Resize to a specific element
    // or
    resizeTo: null, // Disable auto-resize
});
Copy
Default
null
TickerPluginOptions
Interface TickerPluginOptions
Application options for the TickerPlugin. These options control the animation loop and update cycle of your PixiJS application.

Example
import { Application } from 'pixi.js';

// Basic setup with default options
const app = new Application();
await app.init({
    autoStart: true,     // Start animation loop automatically
    sharedTicker: false  // Use dedicated ticker instance
});

// Advanced setup with shared ticker
const app2 = new Application();
await app2.init({
    autoStart: false,    // Don't start automatically
    sharedTicker: true   // Use global shared ticker
});

// Start animation when ready
app2.start();
Copy
Remarks
The ticker is the heart of your application's animation system. It:

Manages the render loop
Provides accurate timing information
Handles frame-based updates
Supports priority-based execution order
See
Ticker For detailed ticker functionality
UPDATE_PRIORITY For update priority constants
interface TickerPluginOptions {
    autoStart?: boolean;
    sharedTicker?: boolean;
}
Properties
P
autoStart?
P
sharedTicker?
OptionalautoStart
autoStart?: boolean
Controls whether the animation loop starts automatically after initialization.

Important
Setting this to false does NOT stop the shared ticker even if sharedTicker is true. You must stop the shared ticker manually if needed.

Example
// Auto-start (default behavior)
await app.init({ autoStart: true });

// Manual start
await app.init({ autoStart: false });
app.start(); // Start when ready
Copy
Default
true
Copy
OptionalsharedTicker
sharedTicker?: boolean
Controls whether to use the shared global ticker or create a new instance.

The shared ticker is useful when you have multiple instances that should sync their updates. However, it has some limitations regarding update order control.

Update Order:

System ticker (always runs first)
Shared ticker (if enabled)
App ticker (if using own ticker)
Example
// Use shared ticker (global instance)
await app.init({ sharedTicker: true });

// Use dedicated ticker (default)
await app.init({ sharedTicker: false });

// Access ticker properties
console.log(app.ticker.FPS);    // Current FPS
console.log(app.ticker.deltaMS); // MS since last update
Copy
Default
false