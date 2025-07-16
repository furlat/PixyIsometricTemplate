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

Optionalaccessible
accessible?: boolean
Flag for if the object is accessible. If true AccessibilityManager will overlay a shadow div with attributes set

Default
false
Copy
Example
const container = new Container();
container.accessible = true;
Copy
Inherited from Mesh.accessible

OptionalaccessibleChildren
accessibleChildren?: boolean
Setting to false will prevent any children inside this container to be accessible. Defaults to true.

Default
true
Copy
Example
const container = new Container();
container.accessible = true;
container.accessibleChildren = false; // This will prevent any children from being accessible

const sprite = new Sprite(texture);
sprite.accessible = true; // This will not work since accessibleChildren is false
Copy
Inherited from Mesh.accessibleChildren

OptionalaccessibleText
accessibleText?: string
Sets the text content of the shadow

Default
null
Copy
Example
const container = new Container();
container.accessible = true;
container.accessibleText = 'This is a container';
Copy
Inherited from Mesh.accessibleText

OptionalaccessibleTitle
accessibleTitle?: string
Sets the title attribute of the shadow div If accessibleTitle AND accessibleHint has not been this will default to 'container [tabIndex]'

Default
null
Copy
Example
const container = new Container();
container.accessible = true;
container.accessibleTitle = 'My Container';
Copy
Inherited from Mesh.accessibleTitle

autoUpdate
autoUpdate: boolean
Controls whether the mesh's vertex buffer is automatically updated each frame. When true, vertex changes will be reflected immediately. When false, manual updates are required.

Example
// Auto-update mode (default)
mesh.autoUpdate = true;
app.ticker.add(() => {
    // Vertices update automatically each frame
    const vertices = mesh.vertices;
    vertices[1] = Math.sin(performance.now() / 1000) * 20;
    mesh.vertices = vertices;
});

// Manual update mode
mesh.autoUpdate = false;
app.ticker.add(() => {
    // Update vertices
    const vertices = mesh.vertices;
    vertices[1] = Math.sin(performance.now() / 1000) * 20;
    mesh.vertices = vertices;

    // Manually trigger buffer update
    mesh.geometry.getBuffer('aPosition').update();
});
Copy
Default
true
Copy
See
MeshGeometry#getBuffer For manual buffer updates
MeshSimple#vertices For accessing vertex data
boundsArea
boundsArea: Rectangle
An optional bounds area for this container. Setting this rectangle will stop the renderer from recursively measuring the bounds of each children and instead use this single boundArea.

Important
This is great for optimisation! If for example you have a 1000 spinning particles and you know they all sit within a specific bounds, then setting it will mean the renderer will not need to measure the 1000 children to find the bounds. Instead it will just use the bounds you set.

Example
const container = new Container();
container.boundsArea = new Rectangle(0, 0, 500, 500);
Copy
Inherited from Mesh.boundsArea

cacheAsBitmap
cacheAsBitmap: boolean
Legacy property for backwards compatibility with PixiJS v7 and below. Use cacheAsTexture instead.

Deprecated
since 8.0.0

Inherited from Mesh.cacheAsBitmap

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
Inherited from Mesh.cacheAsTexture

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
Inherited from Mesh.children

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
Inherited from Mesh.cullable

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
true
Copy
Inherited from Mesh.cullableChildren

OptionalcullArea
cullArea?: Rectangle
Custom shape used for culling calculations instead of object bounds. Defined in local space coordinates relative to the object.

Note
Setting this to a custom Rectangle allows you to define a specific area for culling, which can improve performance by avoiding expensive bounds calculations.

Example
const container = new Container();

// Define custom culling boundary
container.cullArea = new Rectangle(0, 0, 800, 600);

// Reset to use object bounds
container.cullArea = null;
Copy
Remarks
Improves performance by avoiding bounds calculations
Useful for containers with many children
Set to null to use object bounds
Default
null
Copy
Inherited from Mesh.cullArea

Optionalcursor
cursor?: string & {} | Cursor
The cursor style to display when the mouse pointer is hovering over the object. Accepts any valid CSS cursor value or custom cursor URL.

Example
// Common cursor types
sprite.cursor = 'pointer';     // Hand cursor for clickable elements
sprite.cursor = 'grab';        // Grab cursor for draggable elements
sprite.cursor = 'crosshair';   // Precise cursor for selection
sprite.cursor = 'not-allowed'; // Indicate disabled state

// Direction cursors
sprite.cursor = 'n-resize';    // North resize
sprite.cursor = 'ew-resize';   // East-west resize
sprite.cursor = 'nesw-resize'; // Northeast-southwest resize

// Custom cursor with fallback
sprite.cursor = 'url("custom.png"), auto';
sprite.cursor = 'url("cursor.cur") 2 2, pointer'; // With hotspot offset
Copy
Default
undefined
Copy
See
EventSystem.cursorStyles For setting global cursor styles
https://developer.mozilla.org/en-US/docs/Web/CSS/cursor MDN Cursor Documentation
Inherited from Mesh.cursor

destroyed
destroyed: boolean = false
Whether this object has been destroyed. If true, the object should no longer be used. After an object is destroyed, all of its functionality is disabled and references are removed.

Example
// Cleanup with destroy
sprite.destroy();
console.log(sprite.destroyed); // true
Copy
Default
false
Copy
See
Container#destroy For destroying objects

Inherited from Mesh.destroyed

OptionaleventMode
eventMode?: EventMode
Enable interaction events for the Container. Touch, pointer and mouse events are supported.

Example
const sprite = new Sprite(texture);

// Enable standard interaction (like buttons)
sprite.eventMode = 'static';
sprite.on('pointerdown', () => console.log('clicked!'));

// Enable for moving objects
sprite.eventMode = 'dynamic';
sprite.on('pointermove', () => updatePosition());

// Disable all interaction
sprite.eventMode = 'none';

// Only allow child interactions
sprite.eventMode = 'passive';
Copy
Available modes:

'none': Ignores all interaction events, even on its children. Best for pure visuals.
'passive': (default) Does not emit events and ignores hit testing on itself and non-interactive children. Interactive children will still emit events.
'auto': Does not emit events but is hit tested if parent is interactive. Same as interactive = false in v7.
'static': Emit events and is hit tested. Same as interactive = true in v7. Best for buttons/UI.
'dynamic': Like static but also receives synthetic events when pointer is idle. Best for moving objects.
Performance tips:

Use 'none' for pure visual elements
Use 'passive' for containers with some interactive children
Use 'static' for standard UI elements
Use 'dynamic' only when needed for moving/animated elements
Since
7.2.0

Inherited from Mesh.eventMode

OptionalfilterArea
filterArea?: Rectangle
The area the filter is applied to. This is used as an optimization to define a specific region for filter effects instead of calculating the display object bounds each frame.

Note
Setting this to a custom Rectangle allows you to define a specific area for filter effects, which can improve performance by avoiding expensive bounds calculations.

Example
// Set specific filter area
container.filterArea = new Rectangle(0, 0, 100, 100);

// Optimize filter region
const screen = app.screen;
container.filterArea = new Rectangle(
    screen.x,
    screen.y,
    screen.width,
    screen.height
);
Copy
See
Container#filters For applying filters
Rectangle For area definition
Inherited from Mesh.filterArea

OptionalhitArea
hitArea?: IHitArea
Defines a custom hit area for pointer interaction testing. When set, this shape will be used for hit testing instead of the container's standard bounds.

Example
import { Rectangle, Circle, Sprite } from 'pixi.js';

// Rectangular hit area
const button = new Sprite(texture);
button.eventMode = 'static';
button.hitArea = new Rectangle(0, 0, 100, 50);

// Circular hit area
const icon = new Sprite(texture);
icon.eventMode = 'static';
icon.hitArea = new Circle(32, 32, 32);

// Custom hit area with polygon
const custom = new Sprite(texture);
custom.eventMode = 'static';
custom.hitArea = new Polygon([0,0, 100,0, 100,100, 0,100]);

// Custom hit testing logic
sprite.hitArea = {
    contains(x: number, y: number) {
        // Custom collision detection
        return x >= 0 && x <= width && y >= 0 && y <= height;
    }
};
Copy
Remarks
Takes precedence over the container's bounds for hit testing
Can improve performance by simplifying collision checks
Useful for irregular shapes or precise click areas
Inherited from Mesh.hitArea

Optionalinteractive
interactive?: boolean
Whether this object should fire UI events. This is an alias for eventMode set to 'static' or 'passive'. Setting this to true will enable interaction events like pointerdown, click, etc. Setting it to false will disable all interaction events on this object.

See
Container.eventMode

Example
// Enable interaction events
sprite.interactive = true;  // Sets eventMode = 'static'
sprite.interactive = false; // Sets eventMode = 'passive'
Copy
Inherited from Mesh.interactive

OptionalinteractiveChildren
interactiveChildren?: boolean
Controls whether children of this container can receive pointer events.

Setting this to false allows PixiJS to skip hit testing on all children, improving performance for containers with many non-interactive children.

Default
true
Copy
Example
// Container with many visual-only children
const container = new Container();
container.interactiveChildren = false; // Skip hit testing children

// Menu with interactive buttons
const menu = new Container();
menu.interactiveChildren = true; // Test all children
menu.addChild(button1, button2, button3);

// Performance optimization
background.interactiveChildren = false;
foreground.interactiveChildren = true;
Copy
Inherited from Mesh.interactiveChildren

ReadonlyisCachedAsTexture
isCachedAsTexture: boolean
Whether this container is currently cached as a texture.

Example
// Check cache state
if (container.isCachedAsTexture) {
    console.log('Container is cached');
}
Copy
See
Container#cacheAsTexture For enabling caching
Container#updateCacheTexture For updating cache
Inherited from Mesh.isCachedAsTexture

isInteractive
isInteractive: () => boolean
Determines if the container is interactive or not

Type declaration
(): boolean
Returns boolean
Whether the container is interactive or not

Since
7.2.0

Example
import { Sprite } from 'pixi.js';

const sprite = new Sprite(texture);
sprite.eventMode = 'static';
sprite.isInteractive(); // true

sprite.eventMode = 'dynamic';
sprite.isInteractive(); // true

sprite.eventMode = 'none';
sprite.isInteractive(); // false

sprite.eventMode = 'passive';
sprite.isInteractive(); // false

sprite.eventMode = 'auto';
sprite.isInteractive(); // false
Copy
Inherited from Mesh.isInteractive

label
label: string
The instance label of the object.

Default
null
Copy
Inherited from Mesh.label

ReadonlylocalTransform
localTransform: Matrix = ...
Current transform of the object based on local factors: position, scale, other stuff. This matrix represents the local transformation without any parent influence.

Example
// Basic transform access
const localMatrix = sprite.localTransform;
console.log(localMatrix.toString());
Copy
See
Container#worldTransform For global transform
Container#groupTransform For render group transform
Inherited from Mesh.localTransform

mask
mask: Mask
Sets a mask for the displayObject. A mask is an object that limits the visibility of an object to the shape of the mask applied to it.

Important
In PixiJS a regular mask must be a Graphics or a Sprite object. This allows for much faster masking in canvas as it utilities shape clipping. Furthermore, a mask of an object must be in the subtree of its parent. Otherwise, getLocalBounds may calculate incorrect bounds, which makes the container's width and height wrong.

For sprite mask both alpha and red channel are used. Black mask is the same as transparent mask.

Example
// Apply mask to sprite
const sprite = new Sprite(texture);
sprite.mask = graphics;

// Remove mask
sprite.mask = null;
Copy
See
Graphics For creating mask shapes
Sprite For texture-based masks
Container#setMask For advanced mask options
Inherited from Mesh.mask

name
name: string
The instance name of the object.

Deprecated
since 8.0.0

See
Container#label

Default
null
Copy
Inherited from Mesh.name

Optionalonclick
onclick?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the click event. Fired when a pointer device (mouse, touch, etc.) completes a click action.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('click', (event) => {
   console.log('Sprite clicked at:', event.global.x, event.global.y);
});
// Using property-based handler
sprite.onclick = (event) => {
    console.log('Clicked at:', event.global.x, event.global.y);
};
Copy
Default
null
Copy
Inherited from Mesh.onclick

Optionalonglobalmousemove
onglobalmousemove?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the globalmousemove event.

Fired when the mouse moves anywhere, regardless of whether the pointer is over this object. The object must have eventMode set to 'static' or 'dynamic' to receive this event.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('globalmousemove', (event) => {
    // Move sprite to mouse position
    sprite.position.copyFrom(event.global);
});
// Using property-based handler
sprite.onglobalmousemove = (event) => {
    // Move sprite to mouse position
    sprite.position.copyFrom(event.global);
};
Copy
Default
null
Copy
Remarks
Fires even when the mouse is outside the object's bounds
Useful for drag operations or global mouse tracking
Must have eventMode set appropriately to receive events
Part of the global move events family along with globalpointermove and globaltouchmove
Inherited from Mesh.onglobalmousemove

Optionalonglobalpointermove
onglobalpointermove?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the globalpointermove event.

Fired when the pointer moves anywhere, regardless of whether the pointer is over this object. The object must have eventMode set to 'static' or 'dynamic' to receive this event.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('globalpointermove', (event) => {
    sprite.position.set(event.global.x, event.global.y);
});
// Using property-based handler
sprite.onglobalpointermove = (event) => {
    sprite.position.set(event.global.x, event.global.y);
};
Copy
Default
null
Copy
Remarks
Fires even when the mouse is outside the object's bounds
Useful for drag operations or global mouse tracking
Must have eventMode set appropriately to receive events
Part of the global move events family along with globalpointermove and globaltouchmove
Inherited from Mesh.onglobalpointermove

Optionalonglobaltouchmove
onglobaltouchmove?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the globaltouchmove event.

Fired when a touch interaction moves anywhere, regardless of whether the pointer is over this object. The object must have eventMode set to 'static' or 'dynamic' to receive this event.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('globaltouchmove', (event) => {
    sprite.position.set(event.global.x, event.global.y);
});
// Using property-based handler
sprite.onglobaltouchmove = (event) => {
    sprite.position.set(event.global.x, event.global.y);
};
Copy
Default
null
Copy
Remarks
Fires even when the touch is outside the object's bounds
Useful for drag operations or global touch tracking
Must have eventMode set appropriately to receive events
Part of the global move events family along with globalpointermove and globalmousemove
Inherited from Mesh.onglobaltouchmove

Optionalonmousedown
onmousedown?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the mousedown event. Fired when a mouse button is pressed while the pointer is over the object.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('mousedown', (event) => {
   sprite.alpha = 0.5; // Visual feedback
   console.log('Mouse button:', event.button);
});
// Using property-based handler
sprite.onmousedown = (event) => {
    sprite.alpha = 0.5; // Visual feedback
    console.log('Mouse button:', event.button);
};
Copy
Default
null
Copy
Inherited from Mesh.onmousedown

Optionalonmouseenter
onmouseenter?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the mouseenter event. Fired when the mouse pointer enters the bounds of the object. Does not bubble.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('mouseenter', (event) => {
    sprite.scale.set(1.1);
});
// Using property-based handler
sprite.onmouseenter = (event) => {
    sprite.scale.set(1.1);
};
Copy
Default
null
Copy
Inherited from Mesh.onmouseenter

Optionalonmouseleave
onmouseleave?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the mouseleave event. Fired when the pointer leaves the bounds of the display object. Does not bubble.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('mouseleave', (event) => {
   sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onmouseleave = (event) => {
    sprite.scale.set(1.0);
};
Copy
Default
null
Copy
Inherited from Mesh.onmouseleave

Optionalonmousemove
onmousemove?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the mousemove event. Fired when the pointer moves while over the display object.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('mousemove', (event) => {
   // Get coordinates relative to the sprite
  console.log('Local:', event.getLocalPosition(sprite));
});
// Using property-based handler
sprite.onmousemove = (event) => {
    // Get coordinates relative to the sprite
    console.log('Local:', event.getLocalPosition(sprite));
};
Copy
Default
null
Copy
Inherited from Mesh.onmousemove

Optionalonmouseout
onmouseout?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the mouseout event. Fired when the pointer moves out of the bounds of the display object.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('mouseout', (event) => {
   sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onmouseout = (event) => {
    sprite.scale.set(1.0);
};
Copy
Default
null
Copy
Inherited from Mesh.onmouseout

Optionalonmouseover
onmouseover?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the mouseover event. Fired when the pointer moves onto the bounds of the display object.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('mouseover', (event) => {
     sprite.scale.set(1.1);
});
// Using property-based handler
sprite.onmouseover = (event) => {
    sprite.scale.set(1.1);
};
Copy
Default
null
Copy
Inherited from Mesh.onmouseover

Optionalonmouseup
onmouseup?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the mouseup event. Fired when a mouse button is released over the display object.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('mouseup', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onmouseup = (event) => {
     sprite.scale.set(1.0);
};
Copy
Default
null
Copy
Inherited from Mesh.onmouseup

Optionalonmouseupoutside
onmouseupoutside?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the mouseupoutside event. Fired when a mouse button is released outside the display object that initially registered a mousedown.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('mouseupoutside', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onmouseupoutside = (event) => {
    sprite.scale.set(1.0);
};
Copy
Default
null
Copy
Inherited from Mesh.onmouseupoutside

Optionalonpointercancel
onpointercancel?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the pointercancel event. Fired when a pointer device interaction is canceled or lost.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('pointercancel', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onpointercancel = (event) => {
    sprite.scale.set(1.0);
};
Copy
Default
null
Copy
Inherited from Mesh.onpointercancel

Optionalonpointerdown
onpointerdown?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the pointerdown event. Fired when a pointer device button (mouse, touch, pen, etc.) is pressed.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('pointerdown', (event) => {
    sprite.position.set(event.global.x, event.global.y);
});
// Using property-based handler
sprite.onpointerdown = (event) => {
    sprite.position.set(event.global.x, event.global.y);
};
Copy
Default
null
Copy
Inherited from Mesh.onpointerdown

Optionalonpointerenter
onpointerenter?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the pointerenter event. Fired when a pointer device enters the bounds of the display object. Does not bubble.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('pointerenter', (event) => {
    sprite.scale.set(1.2);
});
// Using property-based handler
sprite.onpointerenter = (event) => {
    sprite.scale.set(1.2);
};
Copy
Default
null
Copy
Inherited from Mesh.onpointerenter

Optionalonpointerleave
onpointerleave?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the pointerleave event. Fired when a pointer device leaves the bounds of the display object. Does not bubble.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';
// Using emitter handler
sprite.on('pointerleave', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onpointerleave = (event) => {
    sprite.scale.set(1.0);
};
Copy
Default
null
Copy
Inherited from Mesh.onpointerleave

Optionalonpointermove
onpointermove?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the pointermove event. Fired when a pointer device moves while over the display object.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('pointermove', (event) => {
    sprite.position.set(event.global.x, event.global.y);
});
// Using property-based handler
sprite.onpointermove = (event) => {
    sprite.position.set(event.global.x, event.global.y);
};
Copy
Default
null
Copy
Inherited from Mesh.onpointermove

Optionalonpointerout
onpointerout?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the pointerout event. Fired when the pointer moves out of the bounds of the display object.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('pointerout', (event) => {
   sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onpointerout = (event) => {
   sprite.scale.set(1.0);
};
Copy
Default
null
Copy
Inherited from Mesh.onpointerout

Optionalonpointerover
onpointerover?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the pointerover event. Fired when the pointer moves over the bounds of the display object.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('pointerover', (event) => {
    sprite.scale.set(1.2);
});
// Using property-based handler
sprite.onpointerover = (event) => {
    sprite.scale.set(1.2);
};
Copy
Default
null
Copy
Inherited from Mesh.onpointerover

Optionalonpointertap
onpointertap?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the pointertap event. Fired when a pointer device completes a tap action (e.g., touch or mouse click).

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('pointertap', (event) => {
    console.log('Sprite tapped at:', event.global.x, event.global.y);
});
// Using property-based handler
sprite.onpointertap = (event) => {
    console.log('Sprite tapped at:', event.global.x, event.global.y);
};
Copy
Default
null
Copy
Inherited from Mesh.onpointertap

Optionalonpointerup
onpointerup?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the pointerup event. Fired when a pointer device button (mouse, touch, pen, etc.) is released.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('pointerup', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onpointerup = (event) => {
    sprite.scale.set(1.0);
};
Copy
Default
null
Copy
Inherited from Mesh.onpointerup

Optionalonpointerupoutside
onpointerupoutside?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the pointerupoutside event. Fired when a pointer device button is released outside the bounds of the display object that initially registered a pointerdown.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('pointerupoutside', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onpointerupoutside = (event) => {
    sprite.scale.set(1.0);
};
Copy
Default
null
Copy
Inherited from Mesh.onpointerupoutside

onRender
onRender: (renderer: Renderer) => void
This callback is used when the container is rendered. It runs every frame during the render process, making it ideal for per-frame updates and animations.

Note
In v7 many users used updateTransform for this, however the way v8 renders objects is different and "updateTransform" is no longer called every frame

Type declaration
(renderer: Renderer): void
Parameters
renderer: Renderer
The renderer instance

Returns void
Example
// Basic rotation animation
const container = new Container();
container.onRender = () => {
    container.rotation += 0.01;
};

// Cleanup when done
container.onRender = null; // Removes callback
Copy
See
Renderer For renderer capabilities

Inherited from Mesh.onRender

Optionalonrightclick
onrightclick?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the rightclick event. Fired when a right-click (context menu) action is performed on the object.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('rightclick', (event) => {
    console.log('Right-clicked at:', event.global.x, event.global.y);
});
// Using property-based handler
sprite.onrightclick = (event) => {
    console.log('Right-clicked at:', event.global.x, event.global.y);
};
Copy
Default
null
Copy
Inherited from Mesh.onrightclick

Optionalonrightdown
onrightdown?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the rightdown event. Fired when a right mouse button is pressed down over the display object.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('rightdown', (event) => {
    sprite.scale.set(0.9);
});
// Using property-based handler
sprite.onrightdown = (event) => {
    sprite.scale.set(0.9);
};
Copy
Default
null
Copy
Inherited from Mesh.onrightdown

Optionalonrightup
onrightup?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the rightup event. Fired when a right mouse button is released over the display object.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('rightup', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onrightup = (event) => {
    sprite.scale.set(1.0);
};
Copy
Default
null
Copy
Inherited from Mesh.onrightup

Optionalonrightupoutside
onrightupoutside?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the rightupoutside event. Fired when a right mouse button is released outside the bounds of the display object that initially registered a rightdown.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('rightupoutside', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onrightupoutside = (event) => {
    sprite.scale.set(1.0);
};
Copy
Default
null
Copy
Inherited from Mesh.onrightupoutside

Optionalontap
ontap?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the tap event. Fired when a tap action (touch) is completed on the object.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('tap', (event) => {
    console.log('Sprite tapped at:', event.global.x, event.global.y);
});
// Using property-based handler
sprite.ontap = (event) => {
    console.log('Sprite tapped at:', event.global.x, event.global.y);
};
Copy
Default
null
Copy
Inherited from Mesh.ontap

Optionalontouchcancel
ontouchcancel?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the touchcancel event. Fired when a touch interaction is canceled, such as when the touch is interrupted.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('touchcancel', (event) => {
    console.log('Touch canceled at:', event.global.x, event.global.y);
});
// Using property-based handler
sprite.ontouchcancel = (event) => {
    console.log('Touch canceled at:', event.global.x, event.global.y);
};
Copy
Default
null
Copy
Inherited from Mesh.ontouchcancel

Optionalontouchend
ontouchend?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the touchend event. Fired when a touch interaction ends, such as when the finger is lifted from the screen.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('touchend', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.ontouchend = (event) => {
   sprite.scale.set(1.0);
};
Copy
Default
null
Copy
Inherited from Mesh.ontouchend

Optionalontouchendoutside
ontouchendoutside?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the touchendoutside event. Fired when a touch interaction ends outside the bounds of the display object that initially registered a touchstart.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('touchendoutside', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.ontouchendoutside = (event) => {
    sprite.scale.set(1.0);
};
Copy
Default
null
Copy
Inherited from Mesh.ontouchendoutside

Optionalontouchmove
ontouchmove?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the touchmove event. Fired when a touch interaction moves while over the display object.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('touchmove', (event) => {
    sprite.position.set(event.global.x, event.global.y);
});
// Using property-based handler
sprite.ontouchmove = (event) => {
    sprite.position.set(event.global.x, event.global.y);
};
Copy
Default
null
Copy
Inherited from Mesh.ontouchmove

Optionalontouchstart
ontouchstart?: FederatedEventHandler<FederatedPointerEvent>
Property-based event handler for the touchstart event. Fired when a touch interaction starts, such as when a finger touches the screen.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('touchstart', (event) => {
    sprite.scale.set(0.9);
});
// Using property-based handler
sprite.ontouchstart = (event) => {
    sprite.scale.set(0.9);
};
Copy
Default
null
Copy
Inherited from Mesh.ontouchstart

Optionalonwheel
onwheel?: FederatedEventHandler<FederatedWheelEvent>
Property-based event handler for the wheel event. Fired when the mouse wheel is scrolled while over the display object.

Example
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('wheel', (event) => {
    sprite.scale.x += event.deltaY * 0.01; // Zoom in/out
    sprite.scale.y += event.deltaY * 0.01; // Zoom in/out
});
// Using property-based handler
sprite.onwheel = (event) => {
    sprite.scale.x += event.deltaY * 0.01; // Zoom in/out
    sprite.scale.y += event.deltaY * 0.01; // Zoom in/out
};
Copy
Default
null
Copy
Inherited from Mesh.onwheel

Readonlyparent
parent: Container = null
The display object container that contains this display object. This represents the parent-child relationship in the display tree.

Example
// Basic parent access
const parent = sprite.parent;

// Walk up the tree
let current = sprite;
while (current.parent) {
    console.log('Level up:', current.parent.constructor.name);
    current = current.parent;
}
Copy
See
Container#addChild For adding to a parent
Container#removeChild For removing from parent
Inherited from Mesh.parent

sortableChildren
sortableChildren: boolean
If set to true, the container will sort its children by zIndex value when the next render is called, or manually if sortChildren() is called.

This actually changes the order of elements in the array of children, so it will affect the rendering order.

Note
Also be aware of that this may not work nicely with the addChildAt() function, as the zIndex sorting may cause the child to automatically sorted to another position.

Example
container.sortableChildren = true;
Copy
Default
false
Copy
Inherited from Mesh.sortableChildren

sortChildren
sortChildren: () => void
Sorts children by zIndex value. Only sorts if container is marked as dirty.

Example
// Basic sorting
particles.zIndex = 2;     // Will mark as dirty
container.sortChildren();
Copy
See
Container#sortableChildren For enabling automatic sorting
Container#zIndex For setting child order
Inherited from Mesh.sortChildren

state
state: State
Inherited from Mesh.state

OptionaltabIndex
tabIndex?: number
Sets the tabIndex of the shadow div. You can use this to set the order of the elements when using the tab key to navigate.

Default
0
Copy
Example
const container = new Container();
container.accessible = true;
container.tabIndex = 0;

const sprite = new Sprite(texture);
sprite.accessible = true;
sprite.tabIndex = 1;
Copy
Inherited from Mesh.tabIndex

updateCacheTexture
updateCacheTexture: () => void
Updates the cached texture of this container. This will flag the container's cached texture to be redrawn on the next render.

Example
// Basic update after changes
container.updateCacheTexture();
Copy
Inherited from Mesh.updateCacheTexture

zIndex
zIndex: number
The zIndex of the container.

Controls the rendering order of children within their parent container.

A higher value will mean it will be moved towards the front of the rendering order.

Example
// Add in any order
container.addChild(character, background, foreground);

// Adjust rendering order
background.zIndex = 0;
character.zIndex = 1;
foreground.zIndex = 2;
Copy
See
Container#sortableChildren For enabling sorting
Container#sortChildren For manual sorting
Default
0
Copy
Inherited from Mesh.zIndex

alpha
get alpha(): number
The opacity of the object relative to its parent's opacity. Value ranges from 0 (fully transparent) to 1 (fully opaque).

Returns number
Example
// Basic transparency
sprite.alpha = 0.5; // 50% opacity

// Inherited opacity
container.alpha = 0.5;
const child = new Sprite(texture);
child.alpha = 0.5;
container.addChild(child);
// child's effective opacity is 0.25 (0.5 * 0.5)
Copy
Default
1
Copy
See
Container#visible For toggling visibility
Container#renderable For render control
Inherited from Mesh.alpha

set alpha(value: number): void
Parameters
value: number
Returns void
Inherited from Mesh.alpha

angle
get angle(): number
The angle of the object in degrees.

Note
'rotation' and 'angle' have the same effect on a display object; rotation is in radians, angle is in degrees.

Returns number
Example
// Basic angle rotation
sprite.angle = 45; // 45 degrees

// Rotate around center
sprite.pivot.set(sprite.width / 2, sprite.height / 2);
sprite.angle = 180; // Half rotation

// Reset rotation
sprite.angle = 0;
Copy
Inherited from Mesh.angle

set angle(value: number): void
Parameters
value: number
Returns void
Inherited from Mesh.angle

blendMode
get blendMode(): BLEND_MODES
The blend mode to be applied to the sprite. Controls how pixels are blended when rendering.

Setting to 'normal' will reset to default blending.

Note
More blend modes are available after importing the pixi.js/advanced-blend-modes sub-export.

Returns BLEND_MODES
Example
// Basic blend modes
sprite.blendMode = 'add';        // Additive blending
sprite.blendMode = 'multiply';   // Multiply colors
sprite.blendMode = 'screen';     // Screen blend

// Reset blend mode
sprite.blendMode = 'normal';     // Normal blending
Copy
Default
'normal'
Copy
See
Container#alpha For transparency
Container#tint For color adjustments
Inherited from Mesh.blendMode

set blendMode(value: BLEND_MODES): void
Parameters
value: BLEND_MODES
Returns void
Inherited from Mesh.blendMode

bounds
get bounds(): Bounds
The local bounds of the mesh.

Returns Bounds
Inherited from Mesh.bounds

filters
get filters(): readonly Filter[]
Sets the filters for the displayObject. Filters are visual effects that can be applied to any display object and its children.

Important
This is a WebGL/WebGPU only feature and will be ignored by the canvas renderer.

Returns readonly Filter[]
Example
new Container({
    filters: [new BlurFilter(2), new ColorMatrixFilter()],
});
Copy
See
Filter For filter base class

Inherited from Mesh.filters

set filters(value: Filter | Filter[]): void
Sets the filters for the displayObject. Filters are visual effects that can be applied to any display object and its children.

Important
This is a WebGL/WebGPU only feature and will be ignored by the canvas renderer.

Parameters
value: Filter | Filter[]
Returns void
Example
// Add a single filter
sprite.filters = new BlurFilter(2);

// Apply multiple filters
container.filters = [
    new BlurFilter(2),
    new ColorMatrixFilter(),
];

// Remove filters
sprite.filters = null;
Copy
See
Filter For filter base class

Inherited from Mesh.filters

geometry
get geometry(): GEOMETRY
Returns GEOMETRY
Inherited from Mesh.geometry

set geometry(value: GEOMETRY): void
Includes vertex positions, face indices, colors, UVs, and custom attributes within buffers, reducing the cost of passing all this data to the GPU. Can be shared between multiple Mesh objects.

Parameters
value: GEOMETRY
Returns void
Inherited from Mesh.geometry

height
get height(): number
The height of the Container,

Note
Changing the height will adjust the scale.y property of the container while maintaining its aspect ratio. [!NOTE] If you want to set both width and height at the same time, use Container#setSize as it is more optimized by not recalculating the local bounds twice.

Returns number
Example
// Basic height setting
container.height = 200;
// Optimized height setting
container.setSize(100, 200);
Copy
Inherited from Mesh.height

set height(value: number): void
Parameters
value: number
Returns void
Inherited from Mesh.height

isRenderGroup
get isRenderGroup(): boolean
Advanced
Returns true if this container is a render group. This means that it will be rendered as a separate pass, with its own set of instructions

Returns boolean
Inherited from Mesh.isRenderGroup

set isRenderGroup(value: boolean): void
Parameters
value: boolean
Returns void
Inherited from Mesh.isRenderGroup

material
get material(): SHADER
Alias for Mesh#shader.

Returns SHADER
Inherited from Mesh.material

pivot
get pivot(): ObservablePoint
The center of rotation, scaling, and skewing for this display object in its local space. The position is the projection of pivot in the parent's local space.

By default, the pivot is the origin (0, 0).

Returns ObservablePoint
Example
// Rotate around center
container.pivot.set(container.width / 2, container.height / 2);
container.rotation = Math.PI; // Rotates around center
Copy
Since
4.0.0

Inherited from Mesh.pivot

set pivot(value: number | PointData): void
Parameters
value: number | PointData
Returns void
Inherited from Mesh.pivot

position
get position(): ObservablePoint
The coordinate of the object relative to the local coordinates of the parent.

Returns ObservablePoint
Example
// Basic position setting
container.position.set(100, 200);
container.position.set(100); // Sets both x and y to 100
// Using point data
container.position = { x: 50, y: 75 };
Copy
Since
4.0.0

Inherited from Mesh.position

set position(value: PointData): void
Parameters
value: PointData
Returns void
Inherited from Mesh.position

renderable
get renderable(): boolean
Controls whether this object can be rendered. If false the object will not be drawn, but the transform will still be updated. This is different from visible, which skips transform updates.

Returns boolean
Example
// Basic render control
sprite.renderable = false; // Skip rendering
sprite.renderable = true;  // Enable rendering
Copy
Default
true
Copy
See
Container#visible For skipping transform updates
Container#alpha For transparency
Inherited from Mesh.renderable

set renderable(value: boolean): void
Parameters
value: boolean
Returns void
Inherited from Mesh.renderable

rotation
get rotation(): number
The rotation of the object in radians.

Note
'rotation' and 'angle' have the same effect on a display object; rotation is in radians, angle is in degrees.

Returns number
Example
// Basic rotation
container.rotation = Math.PI / 4; // 45 degrees

// Convert from degrees
const degrees = 45;
container.rotation = degrees * Math.PI / 180;

// Rotate around center
container.pivot.set(container.width / 2, container.height / 2);
container.rotation = Math.PI; // 180 degrees
Copy
Inherited from Mesh.rotation

set rotation(value: number): void
Parameters
value: number
Returns void
Inherited from Mesh.rotation

roundPixels
get roundPixels(): boolean
Whether or not to round the x/y position of the sprite.

Returns boolean
Example
// Enable pixel rounding for crisp rendering
view.roundPixels = true;
Copy
Default
false
Copy
Inherited from Mesh.roundPixels

set roundPixels(value: boolean): void
Whether or not to round the x/y position of the object.

Parameters
value: boolean
Returns void
Inherited from Mesh.roundPixels

scale
get scale(): ObservablePoint
The scale factors of this object along the local coordinate axes.

The default scale is (1, 1).

Returns ObservablePoint
Example
// Basic scaling
container.scale.set(2, 2); // Scales to double size
container.scale.set(2); // Scales uniformly to double size
container.scale = 2; // Scales uniformly to double size
// Scale to a specific width and height
container.setSize(200, 100); // Sets width to 200 and height to 100
Copy
Since
4.0.0

Inherited from Mesh.scale

set scale(value: number | PointData): void
Parameters
value: number | PointData
Returns void
Inherited from Mesh.scale

shader
get shader(): SHADER
Returns SHADER
Inherited from Mesh.shader

set shader(value: SHADER): void
Represents the vertex and fragment shaders that processes the geometry and runs on the GPU. Can be shared between multiple Mesh objects.

Parameters
value: SHADER
Returns void
Inherited from Mesh.shader

skew
get skew(): ObservablePoint
The skew factor for the object in radians. Skewing is a transformation that distorts the object by rotating it differently at each point, creating a non-uniform shape.

Returns ObservablePoint
Example
// Basic skewing
container.skew.set(0.5, 0); // Skew horizontally
container.skew.set(0, 0.5); // Skew vertically

// Skew with point data
container.skew = { x: 0.3, y: 0.3 }; // Diagonal skew

// Reset skew
container.skew.set(0, 0);

// Animate skew
app.ticker.add(() => {
    // Create wave effect
    container.skew.x = Math.sin(Date.now() / 1000) * 0.3;
});

// Combine with rotation
container.rotation = Math.PI / 4; // 45 degrees
container.skew.set(0.2, 0.2); // Skew the rotated object
Copy
Since
4.0.0

Default
{x: 0, y: 0}
Copy
Inherited from Mesh.skew

set skew(value: PointData): void
Parameters
value: PointData
Returns void
Inherited from Mesh.skew

texture
get texture(): Texture<TextureSource<any>>
Returns Texture<TextureSource<any>>
Inherited from Mesh.texture

set texture(value: Texture): void
The texture that the Mesh uses. Null for non-MeshMaterial shaders

Parameters
value: Texture
Returns void
Inherited from Mesh.texture

tint
get tint(): number
The tint applied to the sprite.

This can be any valid ColorSource.

Returns number
Example
// Basic color tinting
container.tint = 0xff0000; // Red tint
container.tint = 'red';    // Same as above
container.tint = '#00ff00'; // Green
container.tint = 'rgb(0,0,255)'; // Blue

// Remove tint
container.tint = 0xffffff; // White = no tint
container.tint = null;     // Also removes tint
Copy
Default
0xFFFFFF
Copy
See
Container#alpha For transparency
Container#visible For visibility control
Inherited from Mesh.tint

set tint(value: ColorSource): void
Parameters
value: ColorSource
Returns void
Inherited from Mesh.tint

vertices
get vertices(): TypedArray
The vertex positions of the mesh as a TypedArray. Each vertex is represented by two consecutive values (x, y) in the array. Changes to these values will update the mesh's shape.

Returns TypedArray
Example
// Read vertex positions
const vertices = mesh.vertices;
console.log('First vertex:', vertices[0], vertices[1]);

// Modify vertices directly
vertices[0] += 10;  // Move first vertex right
vertices[1] -= 20;  // Move first vertex up

// Animate vertices
app.ticker.add(() => {
    const time = performance.now() / 1000;
    const vertices = mesh.vertices;

    // Wave motion
    for (let i = 0; i < vertices.length; i += 2) {
        vertices[i + 1] = Math.sin(time + i * 0.5) * 20;
    }
});
Copy
See
MeshSimple#autoUpdate For controlling vertex buffer updates
MeshGeometry#getBuffer For direct buffer access
set vertices(value: TypedArray): void
Parameters
value: TypedArray
Returns void
visible
get visible(): boolean
The visibility of the object. If false the object will not be drawn, and the transform will not be updated.

Returns boolean
Example
// Basic visibility toggle
sprite.visible = false; // Hide sprite
sprite.visible = true;  // Show sprite
Copy
Default
true
Copy
See
Container#renderable For render-only control
Container#alpha For transparency
Inherited from Mesh.visible

set visible(value: boolean): void
Parameters
value: boolean
Returns void
Inherited from Mesh.visible

width
get width(): number
The width of the Container, setting this will actually modify the scale to achieve the value set.

Note
Changing the width will adjust the scale.x property of the container while maintaining its aspect ratio. [!NOTE] If you want to set both width and height at the same time, use Container#setSize as it is more optimized by not recalculating the local bounds twice.

Returns number
Example
// Basic width setting
container.width = 100;
// Optimized width setting
container.setSize(100, 100);
Copy
Inherited from Mesh.width

set width(value: number): void
Parameters
value: number
Returns void
Inherited from Mesh.width

worldTransform
get worldTransform(): Matrix
Current transform of the object based on world (parent) factors.

This matrix represents the absolute transformation in the scene graph.

Returns Matrix
Example
// Get world position
const worldPos = container.worldTransform;
console.log(`World position: (${worldPos.tx}, ${worldPos.ty})`);
Copy
See
Container#localTransform For local space transform

Inherited from Mesh.worldTransform

x
get x(): number
The position of the container on the x axis relative to the local coordinates of the parent.

An alias to position.x

Returns number
Example
// Basic position
container.x = 100;
Copy
Inherited from Mesh.x

set x(value: number): void
Parameters
value: number
Returns void
Inherited from Mesh.x

y
get y(): number
The position of the container on the y axis relative to the local coordinates of the parent.

An alias to position.y

Returns number
Example
// Basic position
container.y = 200;
Copy
Inherited from Mesh.y

set y(value: number): void
Parameters
value: number
Returns void
Inherited from Mesh.y

addChild
addChild<U extends (ContainerChild | IRenderLayer)[]>(...children: U): U[0]
Adds one or more children to the container. The children will be rendered as part of this container's display list.

Type Parameters
U extends (ContainerChild | IRenderLayer)[]
Parameters
...children: U
The Container(s) to add to the container

Returns U[0]
The first child that was added

Example
// Add a single child
container.addChild(sprite);

// Add multiple children
container.addChild(background, player, foreground);

// Add with type checking
const sprite = container.addChild<Sprite>(new Sprite(texture));
sprite.tint = 'red';
Copy
See
Container#removeChild For removing children
Container#addChildAt For adding at specific index
Inherited from Mesh.addChild

addChildAt
addChildAt<U extends ContainerChild | IRenderLayer>(child: U, index: number): U
Adds a child to the container at a specified index. If the index is out of bounds an error will be thrown. If the child is already in this container, it will be moved to the specified index.

Type Parameters
U extends ContainerChild | IRenderLayer
Parameters
child: U
The child to add

index: number
The index where the child will be placed

Returns U
The child that was added

Example
// Add at specific index
container.addChildAt(sprite, 0); // Add to front

// Move existing child
const index = container.children.length - 1;
container.addChildAt(existingChild, index); // Move to back

// With error handling
try {
    container.addChildAt(sprite, 1000);
} catch (e) {
    console.warn('Index out of bounds');
}
Copy
Throws
If index is out of bounds

See
Container#addChild For adding to the end
Container#setChildIndex For moving existing children
Inherited from Mesh.addChildAt

addEventListener
addEventListener<
    K extends (keyof FederatedEventMap)
    | (keyof GlobalFederatedEventMap),
>(
    type: K,
    listener: (e: AllFederatedEventMap[K]) => any,
    options?: AddListenerOptions,
): void
Unlike on or addListener which are methods from EventEmitter, addEventListener seeks to be compatible with the DOM's addEventListener with support for options.

Type Parameters
K extends (keyof FederatedEventMap) | (keyof GlobalFederatedEventMap)
Parameters
type: K
The type of event to listen to.

listener: (e: AllFederatedEventMap[K]) => any
The listener callback or object.

Optionaloptions: AddListenerOptions
Listener options, used for capture phase.

Returns void
Example
// Tell the user whether they did a single, double, triple, or nth click.
button.addEventListener('click', {
    handleEvent(e): {
        let prefix;

        switch (e.detail) {
            case 1: prefix = 'single'; break;
            case 2: prefix = 'double'; break;
            case 3: prefix = 'triple'; break;
            default: prefix = e.detail + 'th'; break;
        }

        console.log('That was a ' + prefix + 'click');
    }
});

// But skip the first click!
button.parent.addEventListener('click', function blockClickOnce(e) {
    e.stopImmediatePropagation();
    button.parent.removeEventListener('click', blockClickOnce, true);
}, {
    capture: true,
});
Copy
Inherited from Mesh.addEventListener

addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddListenerOptions,
): void
Parameters
type: string
listener: EventListenerOrEventListenerObject
Optionaloptions: AddListenerOptions
Returns void
Inherited from Mesh.addEventListener

containsPoint
containsPoint(point: PointData): boolean
Checks if the object contains the given point.

Parameters
point: PointData
The point to check

Returns boolean
Inherited from Mesh.containsPoint

destroy
destroy(options?: DestroyOptions): void
Destroys this sprite renderable and optionally its texture.

Parameters
Optionaloptions: DestroyOptions
Options parameter. A boolean will act as if all options have been set to that value

Returns void
Example
mesh.destroy();
mesh.destroy(true);
mesh.destroy({ texture: true, textureSource: true });
Copy
Inherited from Mesh.destroy

dispatchEvent
dispatchEvent(e: FederatedEvent): boolean
Dispatch the event on this Container using the event's EventBoundary.

The target of the event is set to this and the defaultPrevented flag is cleared before dispatch.

Parameters
e: FederatedEvent
The event to dispatch.

Returns boolean
Whether the preventDefault() method was not invoked.

Example
// Reuse a click event!
button.dispatchEvent(clickEvent);
Copy
Inherited from Mesh.dispatchEvent

getBounds
getBounds(skipUpdate?: boolean, bounds?: Bounds): Bounds
Calculates and returns the (world) bounds of the display object as a Rectangle. Takes into account transforms and child bounds.

Parameters
OptionalskipUpdate: boolean
Setting to true will stop the transforms of the scene graph from being updated. This means the calculation returned MAY be out of date BUT will give you a nice performance boost.

Optionalbounds: Bounds
Optional bounds to store the result of the bounds calculation

Returns Bounds
The minimum axis-aligned rectangle in world space that fits around this object

Example
// Basic bounds calculation
const bounds = sprite.getBounds();
console.log(`World bounds: ${bounds.x}, ${bounds.y}, ${bounds.width}, ${bounds.height}`);

// Reuse bounds object for performance
const recycleBounds = new Bounds();
sprite.getBounds(false, recycleBounds);

// Skip update for performance
const fastBounds = sprite.getBounds(true);
Copy
Remarks
Includes transform calculations
Updates scene graph by default
Can reuse bounds objects
Common in hit testing
See
Container#getLocalBounds For untransformed bounds
Bounds For bounds properties
Inherited from Mesh.getBounds

getChildAt
getChildAt<U extends ContainerChild | IRenderLayer>(index: number): U
Returns the child at the specified index.

Type Parameters
U extends ContainerChild | IRenderLayer
Parameters
index: number
The index to get the child from

Returns U
The child at the given index

Example
// Get first child
const first = container.getChildAt(0);

// Type-safe access
const sprite = container.getChildAt<Sprite>(1);

// With error handling
try {
    const child = container.getChildAt(10);
} catch (e) {
    console.warn('Index out of bounds');
}
Copy
Throws
If index is out of bounds

See
Container#children For direct array access
Container#getChildByLabel For name-based lookup
Inherited from Mesh.getChildAt

getChildByLabel
getChildByLabel(
    label: string | RegExp,
    deep?: boolean,
): Container<ContainerChild>
Returns the first child in the container with the specified label. Recursive searches are done in a pre-order traversal.

Parameters
label: string | RegExp
Instance label to search for

Optionaldeep: boolean
Whether to search recursively through children

Returns Container<ContainerChild>
The first child with the specified label, or null if none found

Example
// Basic label search
const child = container.getChildByLabel('player');

// Search with regular expression
const enemy = container.getChildByLabel(/enemy-\d+/);

// Deep search through children
const deepChild = container.getChildByLabel('powerup', true);
Copy
See
Container#getChildrenByLabel For finding all matches
Container#label For setting labels
Inherited from Mesh.getChildByLabel

getChildByName
getChildByName(
    label: string | RegExp,
    deep?: boolean,
): Container<ContainerChild>
Parameters
label: string | RegExp
Instance name.

Optionaldeep: boolean
Whether to search recursively

Returns Container<ContainerChild>
The child with the specified name.

Deprecated
since 8.0.0

See
Container#getChildByLabel

Inherited from Mesh.getChildByName

getChildIndex
getChildIndex(child: ContainerChild | IRenderLayer): number
Returns the index position of a child Container instance.

Parameters
child: ContainerChild | IRenderLayer
The Container instance to identify

Returns number
The index position of the child container

Example
// Basic index lookup
const index = container.getChildIndex(sprite);
console.log(`Sprite is at index ${index}`);

// With error handling
try {
    const index = container.getChildIndex(sprite);
} catch (e) {
    console.warn('Child not found in container');
}
Copy
Throws
If child is not in this container

See
Container#setChildIndex For changing index
Container#children For direct array access
Inherited from Mesh.getChildIndex

getChildrenByLabel
getChildrenByLabel(
    label: string | RegExp,
    deep?: boolean,
    out?: Container<ContainerChild>[],
): Container<ContainerChild>[]
Returns all children in the container with the specified label. Recursive searches are done in a pre-order traversal.

Parameters
label: string | RegExp
Instance label to search for

Optionaldeep: boolean
Whether to search recursively through children

Optionalout: Container<ContainerChild>[]
Optional array to store matching children in

Returns Container<ContainerChild>[]
An array of children with the specified label

Example
// Basic label search
const enemies = container.getChildrenByLabel('enemy');
// Search with regular expression
const powerups = container.getChildrenByLabel(/powerup-\d+/);
// Deep search with collection
const buttons = [];
container.getChildrenByLabel('button', true, buttons);
Copy
See
Container#getChildByLabel For finding first match
Container#label For setting labels
Inherited from Mesh.getChildrenByLabel

getGlobalAlpha
getGlobalAlpha(skipUpdate: boolean): number
Returns the global (compound) alpha of the container within the scene.

Parameters
skipUpdate: boolean
Performance optimization flag:

If false (default): Recalculates the entire alpha chain through parents for accuracy
If true: Uses cached worldAlpha from the last render pass for better performance
Returns number
The resulting alpha value (between 0 and 1)

Example
// Accurate but slower - recalculates entire alpha chain
const preciseAlpha = container.getGlobalAlpha();

// Faster but may be outdated - uses cached alpha
const cachedAlpha = container.getGlobalAlpha(true);
Copy
Inherited from Mesh.getGlobalAlpha

getGlobalPosition
getGlobalPosition(point?: Point, skipUpdate?: boolean): Point
Returns the global position of the container, taking into account the container hierarchy.

Parameters
Optionalpoint: Point
The optional point to write the global value to

OptionalskipUpdate: boolean
Should we skip the update transform

Returns Point
The updated point

Example
// Basic position check
const globalPos = sprite.getGlobalPosition();
console.log(`Global: (${globalPos.x}, ${globalPos.y})`);

// Reuse point object
const point = new Point();
sprite.getGlobalPosition(point);

// Skip transform update for performance
const fastPos = container.getGlobalPosition(undefined, true);
Copy
See
Container#toGlobal For converting specific points
Container#toLocal For converting to local space
Inherited from Mesh.getGlobalPosition

getGlobalTint
getGlobalTint(skipUpdate?: boolean): number
Returns the global (compound) tint color of the container within the scene.

Parameters
OptionalskipUpdate: boolean
Performance optimization flag:

If false (default): Recalculates the entire tint chain through parents for accuracy
If true: Uses cached worldColor from the last render pass for better performance
Returns number
The resulting tint color as a 24-bit RGB number (0xRRGGBB)

Example
// Accurate but slower - recalculates entire tint chain
const preciseTint = container.getGlobalTint();

// Faster but may be outdated - uses cached tint
const cachedTint = container.getGlobalTint(true);
Copy
Inherited from Mesh.getGlobalTint

getGlobalTransform
getGlobalTransform(matrix: Matrix, skipUpdate: boolean): Matrix
Returns the global transform matrix of the container within the scene.

Parameters
matrix: Matrix
Optional matrix to store the result. If not provided, a new Matrix will be created.

skipUpdate: boolean
Performance optimization flag:

If false (default): Recalculates the entire transform chain for accuracy
If true: Uses cached worldTransform from the last render pass for better performance
Returns Matrix
The resulting transformation matrix (either the input matrix or a new one)

Example
// Accurate but slower - recalculates entire transform chain
const preciseTransform = container.getGlobalTransform();

// Faster but may be outdated - uses cached transform
const cachedTransform = container.getGlobalTransform(undefined, true);

// Reuse existing matrix
const existingMatrix = new Matrix();
container.getGlobalTransform(existingMatrix);
Copy
Inherited from Mesh.getGlobalTransform

getLocalBounds
getLocalBounds(): Bounds
Retrieves the local bounds of the container as a Bounds object. Uses cached values when possible for better performance.

Returns Bounds
The bounding area

Example
// Basic bounds check
const bounds = container.getLocalBounds();
console.log(`Width: ${bounds.width}, Height: ${bounds.height}`);
// subsequent calls will reuse the cached bounds
const cachedBounds = container.getLocalBounds();
console.log(bounds === cachedBounds); // true
Copy
See
Container#getBounds For world space bounds
Bounds For bounds properties
Inherited from Mesh.getLocalBounds

getSize
getSize(out?: Size): Size
Retrieves the size of the container as a [Size]Size object.

This is faster than get the width and height separately.

Parameters
Optionalout: Size
Optional object to store the size in.

Returns Size
The size of the container.
Example
// Basic size retrieval
const size = container.getSize();
console.log(`Size: ${size.width}x${size.height}`);

// Reuse existing size object
const reuseSize = { width: 0, height: 0 };
container.getSize(reuseSize);
Copy
Inherited from Mesh.getSize

removeChild
removeChild<U extends (ContainerChild | IRenderLayer)[]>(...children: U): U[0]
Removes one or more children from the container. When removing multiple children, events will be triggered for each child in sequence.

Type Parameters
U extends (ContainerChild | IRenderLayer)[]
Parameters
...children: U
The Container(s) to remove

Returns U[0]
The first child that was removed

Example
// Remove a single child
const removed = container.removeChild(sprite);

// Remove multiple children
const bg = container.removeChild(background, player, userInterface);

// Remove with type checking
const sprite = container.removeChild<Sprite>(childSprite);
sprite.texture = newTexture;
Copy
See
Container#addChild For adding children
Container#removeChildren For removing multiple children
Inherited from Mesh.removeChild

removeChildAt
removeChildAt<U extends ContainerChild | IRenderLayer>(index: number): U
Removes a child from the specified index position.

Type Parameters
U extends ContainerChild | IRenderLayer
Parameters
index: number
The index to remove the child from

Returns U
The child that was removed

Example
// Remove first child
const removed = container.removeChildAt(0);

// type safe access
const sprite = container.removeChildAt<Sprite>(1);

// With error handling
try {
    const child = container.removeChildAt(10);
} catch (e) {
    console.warn('Index out of bounds');
}
Copy
Throws
If index is out of bounds

See
Container#removeChild For removing specific children
Container#removeChildren For removing multiple children
Inherited from Mesh.removeChildAt

removeChildren
removeChildren(beginIndex?: number, endIndex?: number): ContainerChild[]
Removes all children from this container that are within the begin and end indexes.

Parameters
OptionalbeginIndex: number
The beginning position

OptionalendIndex: number
The ending position. Default is container size

Returns ContainerChild[]
List of removed children

Example
// Remove all children
container.removeChildren();

// Remove first 3 children
const removed = container.removeChildren(0, 3);
console.log('Removed:', removed.length); // 3

// Remove children from index 2 onwards
container.removeChildren(2);

// Remove specific range
const middle = container.removeChildren(1, 4);
Copy
Throws
If begin/end indexes are invalid

See
Container#addChild For adding children
Container#removeChild For removing specific children
Inherited from Mesh.removeChildren

removeEventListener
removeEventListener<
    K extends (keyof FederatedEventMap)
    | (keyof GlobalFederatedEventMap),
>(
    type: K,
    listener: (e: AllFederatedEventMap[K]) => any,
    options?: RemoveListenerOptions,
): void
Unlike off or removeListener which are methods from EventEmitter, removeEventListener seeks to be compatible with the DOM's removeEventListener with support for options.

Type Parameters
K extends (keyof FederatedEventMap) | (keyof GlobalFederatedEventMap)
Parameters
type: K
The type of event the listener is bound to.

listener: (e: AllFederatedEventMap[K]) => any
The listener callback or object.

Optionaloptions: RemoveListenerOptions
The original listener options. This is required to deregister a capture phase listener.

Returns void
Inherited from Mesh.removeEventListener

removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: RemoveListenerOptions,
): void
Parameters
type: string
listener: EventListenerOrEventListenerObject
Optionaloptions: RemoveListenerOptions
Returns void
Inherited from Mesh.removeEventListener

removeFromParent
removeFromParent(): void
Remove the Container from its parent Container. If the Container has no parent, do nothing.

Returns void
Example
// Basic removal
sprite.removeFromParent();

// With validation
if (sprite.parent) {
    sprite.removeFromParent();
}
Copy
See
Container#addChild For adding to a new parent
Container#removeChild For parent removing children
Inherited from Mesh.removeFromParent

reparentChild
reparentChild<U extends ContainerChild[]>(...child: U): U[0]
Reparent a child or multiple children to this container while preserving their world transform. This ensures that the visual position and rotation of the children remain the same even when changing parents.

Type Parameters
U extends ContainerChild[]
Parameters
...child: U
The child or children to reparent

Returns U[0]
The first child that was reparented

Example
// Basic reparenting
const sprite = new Sprite(texture);
oldContainer.addChild(sprite);
// Move to new parent, keeping visual position
newContainer.reparentChild(sprite);

// Reparent multiple children
const batch = [sprite1, sprite2, sprite3];
newContainer.reparentChild(...batch);
Copy
See
Container#reparentChildAt For index-specific reparenting
Container#addChild For simple parenting
Inherited from Mesh.reparentChild

reparentChildAt
reparentChildAt<U extends ContainerChild>(child: U, index: number): U
Reparent the child to this container at the specified index while preserving its world transform. This ensures that the visual position and rotation of the child remain the same even when changing parents.

Type Parameters
U extends ContainerChild
Parameters
child: U
The child to reparent

index: number
The index to reparent the child to

Returns U
The reparented child

Example
// Basic index-specific reparenting
const sprite = new Sprite(texture);
oldContainer.addChild(sprite);
// Move to new parent at index 0 (front)
newContainer.reparentChildAt(sprite, 0);
Copy
Throws
If index is out of bounds

See
Container#reparentChild For appending reparented children
Container#addChildAt For simple indexed parenting
Inherited from Mesh.reparentChildAt

setChildIndex
setChildIndex(child: ContainerChild | IRenderLayer, index: number): void
Changes the position of an existing child in the container.

Parameters
child: ContainerChild | IRenderLayer
The child Container instance to reposition

index: number
The resulting index number for the child

Returns void
Example
// Basic index change
container.setChildIndex(sprite, 0); // Move to front
container.setChildIndex(sprite, container.children.length - 1); // Move to back

// With error handling
try {
    container.setChildIndex(sprite, 5);
} catch (e) {
    console.warn('Invalid index or child not found');
}
Copy
Throws
If index is out of bounds

Throws
If child is not in container

See
Container#getChildIndex For getting current index
Container#swapChildren For swapping positions
Inherited from Mesh.setChildIndex

setFromMatrix
setFromMatrix(matrix: Matrix): void
Updates the local transform properties by decomposing the given matrix. Extracts position, scale, rotation, and skew from a transformation matrix.

Parameters
matrix: Matrix
The matrix to use for updating the transform

Returns void
Example
// Basic matrix transform
const matrix = new Matrix()
    .translate(100, 100)
    .rotate(Math.PI / 4)
    .scale(2, 2);

container.setFromMatrix(matrix);

// Copy transform from another container
const source = new Container();
source.position.set(100, 100);
source.rotation = Math.PI / 2;

target.setFromMatrix(source.localTransform);

// Reset transform
container.setFromMatrix(Matrix.IDENTITY);
Copy
See
Container#updateTransform For property-based updates
Matrix#decompose For matrix decomposition details
Inherited from Mesh.setFromMatrix

setMask
setMask(options: Partial<MaskOptionsAndMask>): void
Used to set mask and control mask options on a display object. Allows for more detailed control over masking behavior compared to the mask property.

Parameters
options: Partial<MaskOptionsAndMask>
Configuration options for the mask

Returns void
Example
import { Graphics, Sprite } from 'pixi.js';

// Create a circular mask
const graphics = new Graphics()
    .beginFill(0xFF3300)
    .drawCircle(100, 100, 50)
    .endFill();

// Apply mask with options
sprite.setMask({
    mask: graphics,
    inverse: true, // Create a hole effect
});

// Clear existing mask
sprite.setMask({ mask: null });
Copy
See
Container#mask For simple masking
MaskOptionsAndMask For full options API
Inherited from Mesh.setMask

setSize
setSize(value: number | Optional<Size, "height">, height?: number): void
Sets the size of the container to the specified width and height. This is more efficient than setting width and height separately as it only recalculates bounds once.

Parameters
value: number | Optional<Size, "height">
This can be either a number or a [Size]Size object.

Optionalheight: number
The height to set. Defaults to the value of width if not provided.

Returns void
Example
// Basic size setting
container.setSize(100, 200);

// Set uniform size
container.setSize(100); // Sets both width and height to 100
Copy
Inherited from Mesh.setSize

swapChildren
swapChildren<U extends ContainerChild | IRenderLayer>(child: U, child2: U): void
Swaps the position of 2 Containers within this container.

Type Parameters
U extends ContainerChild | IRenderLayer
Parameters
child: U
First container to swap

child2: U
Second container to swap

Returns void
Example
// Basic swap
container.swapChildren(sprite1, sprite2);

// With error handling
try {
    container.swapChildren(sprite1, sprite2);
} catch (e) {
    console.warn('One or both children not found in container');
}
Copy
Remarks
Updates render groups
No effect if same child
Triggers container changes
Common in z-ordering
Throws
If either child is not in container

See
Container#setChildIndex For direct index placement
Container#getChildIndex For getting current positions
Inherited from Mesh.swapChildren

toGlobal
toGlobal<P extends PointData = Point>(
    position: PointData,
    point?: P,
    skipUpdate?: boolean,
): P
Calculates the global position of a point relative to this container. Takes into account the container hierarchy and transforms.

Type Parameters
P extends PointData = Point
Parameters
position: PointData
The local point to convert

Optionalpoint: P
Optional point to store the result

OptionalskipUpdate: boolean
Whether to skip transform updates

Returns P
The global position

Example
// Basic point conversion
const localPoint = { x: 10, y: 20 };
const globalPoint = container.toGlobal(localPoint);

// With point reuse
const reusePoint = new Point();
container.toGlobal(localPoint, reusePoint);

// Performance optimization
const fastPoint = container.toGlobal(
    { x: 50, y: 50 },
    undefined,
    true // Skip transform update
);
Copy
See
Container#toLocal For reverse conversion
Container#getGlobalPosition For container position
Inherited from Mesh.toGlobal

toLocal
toLocal<P extends PointData = Point>(
    position: PointData,
    from?: Container,
    point?: P,
    skipUpdate?: boolean,
): P
Calculates the local position of the container relative to another point. Converts coordinates from any coordinate space to this container's local coordinate space.

Type Parameters
P extends PointData = Point
Parameters
position: PointData
The world origin to calculate from

Optionalfrom: Container
The Container to calculate the global position from

Optionalpoint: P
A Point object in which to store the value

OptionalskipUpdate: boolean
Should we skip the update transform

Returns P
A point object representing the position in local space

Example
// Basic coordinate conversion
const worldPoint = { x: 100, y: 100 };
const localPos = container.toLocal(worldPoint);

// Convert from another container
const fromSprite = new Sprite(texture);
fromSprite.position.set(50, 50);
const pointInSprite = { x: 10, y: 10 };
const localPoint = container.toLocal(pointInSprite, fromSprite);

// With point reuse for performance
const reusePoint = new Point();
container.toLocal(worldPoint, undefined, reusePoint);

// Skip transform update for static objects
const fastLocal = container.toLocal(
    worldPoint,
    undefined,
    undefined,
    true
);
Copy
See
Container#toGlobal For reverse conversion
Container#getGlobalPosition For container position
Inherited from Mesh.toLocal

updateLocalTransform
updateLocalTransform(): void
Updates the local transform.

Returns void
Inherited from Mesh.updateLocalTransform

updateTransform
updateTransform(opts: Partial<UpdateTransformOptions>): this
Updates the transform properties of the container. Allows partial updates of transform properties for optimized manipulation.

Parameters
opts: Partial<UpdateTransformOptions>
Transform options to update

x
The x position

y
The y position

scaleX
The x-axis scale factor

scaleY
The y-axis scale factor

rotation
The rotation in radians

skewX
The x-axis skew factor

skewY
The y-axis skew factor

pivotX
The x-axis pivot point

pivotY
The y-axis pivot point

Returns this
This container, for chaining

Example
// Basic transform update
container.updateTransform({
    x: 100,
    y: 200,
    rotation: Math.PI / 4
});

// Scale and rotate around center
sprite.updateTransform({
    pivotX: sprite.width / 2,
    pivotY: sprite.height / 2,
    scaleX: 2,
    scaleY: 2,
    rotation: Math.PI
});

// Update position only
button.updateTransform({
    x: button.x + 10, // Move right
    y: button.y      // Keep same y
});
Copy
See
Container#setFromMatrix For matrix-based transforms
Container#position For direct position access
Inherited from Mesh.updateTransform

Staticmixin
mixin(source: Dict<any>): void
Mixes all enumerable properties and methods from a source object to Container.

Parameters
source: Dict<any>
The source of properties and methods to mix in.

Returns void