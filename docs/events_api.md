Overview
Events
PixiJS provides a flexible and performant event system designed for both mouse and touch input. The system uses a unified, DOM-like federated event model that supports bubbling, capturing, and delegation.

Basic Usage
Enable interaction on any display object by setting its eventMode:

import { Sprite } from 'pixi.js';

const sprite = Sprite.from('image.png');
sprite.eventMode = 'static';
sprite.on('pointerdown', (event) => {
    console.log('Clicked at:', event.global.x, event.global.y);
});

// check if the sprite is interactive
if (sprite.isInteractive()) {
    console.log('Sprite is interactive');
}
Copy
Event Modes
The eventMode property controls how objects interact with the event system:

import { Container } from 'pixi.js';

const container = new Container();

// Different interaction modes
container.eventMode = 'none';      // No events (optimized)
container.eventMode = 'passive';   // Only children receive events
container.eventMode = 'auto';      // Events when parent is interactive
container.eventMode = 'static';    // Standard interaction events
container.eventMode = 'dynamic';   // Events + synthetic updates for moving objects
Copy
Event Types
Pointer Events (Recommended)
sprite.on('pointerdown', (event) => {/* Press */});
sprite.on('pointerup', (event) => {/* Release */});
sprite.on('pointermove', (event) => {/* Movement */});
sprite.on('pointerover', (event) => {/* Enter */});
sprite.on('pointerout', (event) => {/* Exit */});
sprite.on('globalpointermove', (event) => {/* Any movement */});
Copy
Mouse Events
sprite.on('mousedown', (event) => {/* Mouse press */});
sprite.on('mouseup', (event) => {/* Mouse release */});
sprite.on('mousemove', (event) => {/* Mouse movement */});
sprite.on('click', (event) => {/* Click */});
sprite.on('rightclick', (event) => {/* Right click */});
sprite.on('wheel', (event) => {/* Scroll */});
Copy
Touch Events
sprite.on('touchstart', (event) => {/* Touch begin */});
sprite.on('touchend', (event) => {/* Touch end */});
sprite.on('touchmove', (event) => {/* Touch movement */});
sprite.on('tap', (event) => {/* Quick tap */});
Copy
Global Events
In previous versions of PixiJS, events such as pointermove, mousemove, and touchmove were fired when any move event was captured by the canvas, even if the pointer was not over a display object. This behavior changed in v8 and now these events are fired only when the pointer is over a display object.

To maintain the old behavior, you can use the globalpointermove, globalmousemove, and globaltouchmove events. These events are fired on every pointer/touch move, regardless of whether any display object is hit.

sprite.on('globalpointermove', (event) => {
    console.log('Pointer moved globally!', event);
});
Copy
Event Handling
Multiple ways to listen for events:

// Using EventEmitter style (recommended)
sprite.on('pointerdown', onDown);          // Add listener
sprite.once('pointerdown', onDown);        // One-time listener
sprite.off('pointerdown', onDown);         // Remove listener

// Using DOM style
sprite.addEventListener('click', onClick);
sprite.removeEventListener('click', onClick);

// Using event properties
sprite.onclick = (event) => console.log('clicked');
Copy
Optimizations
To optimize event handling and performance, consider the following:

Use eventMode = 'none' for non-interactive objects to skip hit testing.
Use a hitArea for hit testing instead of using the objects bounding box. This can improve performance, especially for complex shapes.
Set interactiveChildren = false on containers to skip hit testing of child objects. This stops the event system from checking children for interaction, which can improve performance when you only need to interact with the container itself.
import { Rectangle } from 'pixi.js';

// Custom hit area
sprite.hitArea = new Rectangle(0, 0, 100, 100);
sprite.hitArea = new Circle(50, 50, 50); // Circle hit area
sprite.hitArea = new Polygon([0, 0, 100, 0, 50, 100]); // Polygon hit area

// Control child hit testing
container.interactiveChildren = false; // Skip children
Copy
Event Features
Configuring different event system features through renderer options can help optimize performance and control behavior. You can enable or disable specific event features globally or per object.

await app.init({
    eventFeatures: {
        // Core features
        move: true,           // Enable movement events
        click: true,          // Enable click events
        wheel: true,          // Enable scroll events

        // Global tracking
        globalMove: false,    // Disable global movement
    }
});

// Or configure after initialization
app.renderer.events.features.globalMove = true;
Copy
Cursor Management
Customize cursor appearance for interactive objects:

// Basic cursor styles
sprite.cursor = 'pointer';    // Hand cursor
sprite.cursor = 'grab';       // Grab cursor
sprite.cursor = 'crosshair';  // Precise selection

// Custom cursor image
sprite.cursor = 'url("custom.png"), auto';

// Global cursor styles
app.renderer.events.cursorStyles.default = 'pointer';
app.renderer.events.cursorStyles.hover = 'url("hover.png"), auto';
Copy
Best Practices
Use pointerdown/up/move events instead of mouse/touch for better cross-device support
Set eventMode = 'none' on non-interactive elements for better performance
Use static mode for stationary interactive elements
Use dynamic mode only for moving interactive elements
Consider using hitArea for precise or optimized hit testing
Clean up event listeners when destroying objects
Related Documentation
See EventSystem for the event management system
See EventMode for interaction mode details
See Cursor for cursor customization options
See FederatedEvent for base event properties
See FederatedPointerEvent for pointer event details
See FederatedMouseEvent for mouse event details
See FederatedWheelEvent for wheel event details
See Container for display object event handling
See EventBoundary for event propagation control
For more specific implementation details and advanced usage, refer to the API documentation of individual classes and interfaces.

Member Visibility
Theme
OS
Events
Basic Usage
Event Modes
Event Types
Pointer Events (Recommended)
Mouse Events
Touch Events
Global Events
Event Handling
Optimizations
Event Features
Cursor Management
Best Practices
EventSystem
Class EventSystem
The system for handling UI events in PixiJS applications. This class manages mouse, touch, and pointer events, normalizing them into a consistent event model.

Example
// Access event system through renderer
const eventSystem = app.renderer.events;

// Configure event features
eventSystem.features.globalMove = false;  // Disable global move events
eventSystem.features.click = true;        // Enable click events

// Set custom cursor styles
eventSystem.cursorStyles.default = 'pointer';
eventSystem.cursorStyles.grab = 'grab';

// Get current pointer position
const pointer = eventSystem.pointer;
console.log(pointer.global.x, pointer.global.y);
Copy
Features:

Normalizes browser events into consistent format
Supports mouse, touch, and pointer events
Handles event delegation and bubbling
Provides cursor management
Configurable event features
See
EventBoundary For event propagation and handling
FederatedEvent For the base event class
EventMode For interaction modes
Implements
System<EventSystemOptions>
Constructors
C
constructor
Properties
P
autoPreventDefault
P
cursorStyles
P
domElement
P
features
P
renderer
P
resolution
P
supportsPointerEvents
P
supportsTouchEvents
P
defaultEventFeatures
Accessors
A
pointer
A
defaultEventMode
Methods
M
destroy
M
mapPositionToPoint
M
setCursor
M
setTargetElement
constructor
new EventSystem(renderer: Renderer): EventSystem
Parameters
renderer: Renderer
Returns EventSystem
autoPreventDefault
autoPreventDefault: boolean
Controls whether default browser actions are automatically prevented on pointer events. When true, prevents default browser actions from occurring on pointer events.

Remarks
Does not apply to pointer events for backwards compatibility
preventDefault on pointer events stops mouse events from firing
For every pointer event, there will always be either a mouse or touch event alongside it
Setting this to false allows default browser actions (text selection, dragging images, etc.)
Example
// Allow default browser actions
app.renderer.events.autoPreventDefault = false;

// Block default actions (default)
app.renderer.events.autoPreventDefault = true;

// Example with text selection
const text = new Text('Selectable text');
text.eventMode = 'static';
app.renderer.events.autoPreventDefault = false; // Allow text selection
Copy
Default
true
Copy
cursorStyles
cursorStyles: Record<
    string,
    string
    | CSSStyleDeclaration
    | ((mode: string) => void),
>
Dictionary of custom cursor styles that can be used across the application. Used to define how different cursor modes are handled when interacting with display objects.

Example
// Access event system through renderer
const eventSystem = app.renderer.events;

// Set string-based cursor styles
eventSystem.cursorStyles.default = 'pointer';
eventSystem.cursorStyles.hover = 'grab';
eventSystem.cursorStyles.drag = 'grabbing';

// Use CSS object for complex styling
eventSystem.cursorStyles.custom = {
    cursor: 'url("custom.png") 2 2, auto',
    userSelect: 'none'
};

// Use a url for custom cursors
const defaultIcon = 'url(\'https://pixijs.com/assets/bunny.png\'),auto';
eventSystem.cursorStyles.icon = defaultIcon;

// Use callback function for dynamic cursors
eventSystem.cursorStyles.dynamic = (mode) => {
    // Update cursor based on mode
    document.body.style.cursor = mode === 'hover'
        ? 'pointer'
        : 'default';
};

// Apply cursor style to a sprite
sprite.cursor = 'hover'; // Will use the hover style defined above
sprite.cursor = 'icon'; // Will apply the icon cursor
sprite.cursor = 'custom'; // Will apply the custom CSS styles
sprite.cursor = 'drag'; // Will apply the grabbing cursor
sprite.cursor = 'default'; // Will apply the default pointer cursor
sprite.cursor = 'dynamic'; // Will call the dynamic function
Copy
Remarks
Strings are treated as CSS cursor values
Objects are applied as CSS styles to the DOM element
Functions are called directly for custom cursor handling
Default styles for 'default' and 'pointer' are provided
Default
{
    default: 'inherit',
    pointer: 'pointer' // Default cursor styles
}
Copy
domElement
domElement: HTMLElement = null
The DOM element to which the root event listeners are bound. This is automatically set to the renderer's view.

Readonlyfeatures
features: EventSystemFeatures
The event features that are enabled by the EventSystem

Since
7.2.0

Example
const app = new Application()
app.renderer.events.features.globalMove = false

// to override all features use Object.assign
Object.assign(app.renderer.events.features, {
 move: false,
 globalMove: false,
 click: false,
 wheel: false,
})
Copy
renderer
renderer: Renderer
The renderer managing this EventSystem.

resolution
resolution: number = 1
The resolution used to convert between the DOM client space into world space.

ReadonlysupportsPointerEvents
supportsPointerEvents: boolean = !!globalThis.PointerEvent
Indicates whether the current device supports pointer events according to the W3C Pointer Events spec. Used to optimize event handling and provide more consistent cross-device interaction.

See
https://www.w3.org/TR/pointerevents/ W3C Pointer Events Specification

Default
!!globalThis.PointerEvent
Copy
ReadonlysupportsTouchEvents
supportsTouchEvents: boolean = ...
Indicates whether the current device supports touch events according to the W3C Touch Events spec. This is used to determine the appropriate event handling strategy.

See
https://www.w3.org/TR/touch-events/ W3C Touch Events Specification

Default
'ontouchstart' in globalThis
Copy
StaticdefaultEventFeatures
defaultEventFeatures: EventSystemFeatures = ...
The event features that are enabled by the EventSystem

Since
7.2.0

Example
import { EventSystem, EventSystemFeatures } from 'pixi.js';
// Access the default event features
EventSystem.defaultEventFeatures = {
    // Enable pointer movement events
    move: true,
    // Enable global pointer move events
    globalMove: true,
    // Enable click events
    click: true,
    // Enable wheel events
    wheel: true,
};
Copy
pointer
get pointer(): Readonly<FederatedPointerEvent>
The global pointer event instance containing the most recent pointer state. This is useful for accessing pointer information without listening to events.

Returns Readonly<FederatedPointerEvent>
Example
// Access current pointer position at any time
const eventSystem = app.renderer.events;
const pointer = eventSystem.pointer;

// Get global coordinates
console.log('Position:', pointer.global.x, pointer.global.y);

// Check button state
console.log('Buttons pressed:', pointer.buttons);

// Get pointer type and pressure
console.log('Type:', pointer.pointerType);
console.log('Pressure:', pointer.pressure);
Copy
Since
7.2.0

See
FederatedPointerEvent For all available pointer properties

StaticdefaultEventMode
get defaultEventMode(): EventMode
The default interaction mode for all display objects.

Returns EventMode
See
Container.eventMode

Since
7.2.0

destroy
destroy(): void
Destroys all event listeners and detaches the renderer.

Returns void
Implementation of System.destroy

mapPositionToPoint
mapPositionToPoint(point: PointData, x: number, y: number): void
Maps coordinates from DOM/screen space into PixiJS normalized coordinates. This takes into account the current scale, position, and resolution of the DOM element.

Parameters
point: PointData
The point to store the mapped coordinates in

x: number
The x coordinate in DOM/client space

y: number
The y coordinate in DOM/client space

Returns void
Example
// Map mouse coordinates to PixiJS space
const point = new Point();
app.renderer.events.mapPositionToPoint(
    point,
    event.clientX,
    event.clientY
);
console.log('Mapped position:', point.x, point.y);

// Using with pointer events
sprite.on('pointermove', (event) => {
    // event.global already contains mapped coordinates
    console.log('Global:', event.global.x, event.global.y);

    // Map to local coordinates
    const local = event.getLocalPosition(sprite);
    console.log('Local:', local.x, local.y);
});
Copy
Remarks
Accounts for element scaling and positioning
Adjusts for device pixel ratio/resolution
setCursor
setCursor(mode: string): void
Sets the current cursor mode, handling any callbacks or CSS style changes. The cursor can be a CSS cursor string, a custom callback function, or a key from the cursorStyles dictionary.

Parameters
mode: string
Cursor mode to set. Can be:

A CSS cursor string (e.g., 'pointer', 'grab')
A key from the cursorStyles dictionary
null/undefined to reset to default
Returns void
Example
// Using predefined cursor styles
app.renderer.events.setCursor('pointer');    // Set standard pointer cursor
app.renderer.events.setCursor('grab');       // Set grab cursor
app.renderer.events.setCursor(null);         // Reset to default

// Using custom cursor styles
app.renderer.events.cursorStyles.custom = 'url("cursor.png"), auto';
app.renderer.events.setCursor('custom');     // Apply custom cursor

// Using callback-based cursor
app.renderer.events.cursorStyles.dynamic = (mode) => {
    document.body.style.cursor = mode === 'hover' ? 'pointer' : 'default';
};
app.renderer.events.setCursor('dynamic');    // Trigger cursor callback
Copy
Remarks
Has no effect on OffscreenCanvas except for callback-based cursors
Caches current cursor to avoid unnecessary DOM updates
Supports CSS cursor values, style objects, and callback functions
See
EventSystem.cursorStyles For defining custom cursor styles
https://developer.mozilla.org/en-US/docs/Web/CSS/cursor MDN Cursor Reference
setTargetElement
setTargetElement(element: HTMLElement): void
Sets the domElement and binds event listeners. This method manages the DOM event bindings for the event system, allowing you to change or remove the target element that receives input events.

Important
This will default to the canvas element of the renderer, so you should not need to call this unless you are using a custom element.

Parameters
element: HTMLElement
The new DOM element to bind events to, or null to remove all event bindings

Returns void
Example
// Set a new canvas element as the target
const canvas = document.createElement('canvas');
app.renderer.events.setTargetElement(canvas);

// Remove all event bindings
app.renderer.events.setTargetElement(null);

// Switch to a different canvas
const newCanvas = document.querySelector('#game-canvas');
app.renderer.events.setTargetElement(newCanvas);
Copy
Remarks
Automatically removes event listeners from previous element
Required for the event system to function
Safe to call multiple times
See
EventSystem#domElement The current DOM element
EventsTicker For the ticker system that tracks pointer movement


Website
GitHub
Discord

FederatedEvent
Class FederatedEvent<N>
A DOM-compatible synthetic event implementation for PixiJS's event system. This class implements the standard DOM Event interface while providing additional functionality specific to PixiJS events.

Note
You wont receive an instance of this class directly, but rather a subclass of this class, such as FederatedPointerEvent, FederatedMouseEvent, or FederatedWheelEvent. This class is the base for all federated events.

Example
// Basic event handling
sprite.on('pointerdown', (event: FederatedEvent) => {
    // Access standard DOM event properties
    console.log('Target:', event.target);
    console.log('Phase:', event.eventPhase);
    console.log('Type:', event.type);

    // Control propagation
    event.stopPropagation();
});
Copy
Remarks
Implements the standard DOM UIEvent interface
Provides event bubbling and capturing phases
Supports propagation control
Manages event paths through display tree
Normalizes native browser events
See
https://dom.spec.whatwg.org/#event DOM Event Specification
FederatedPointerEvent For pointer-specific events
FederatedMouseEvent For mouse-specific events
FederatedWheelEvent For wheel-specific events
Type Parameters
N extends UIEvent | PixiTouch = UIEvent | PixiTouch
The type of native event held. Can be either a UIEvent or PixiTouch.

Hierarchy (View Summary, Expand)
FederatedEvent
FederatedMouseEvent
Implements
UIEvent
Constructors
C
constructor
Properties
P
bubbles
P
cancelable
P
cancelBubble
P
currentTarget
P
defaultPrevented
P
detail
P
eventPhase
P
isTrusted
P
layer
P
manager
P
nativeEvent
P
originalEvent
P
page
P
path
P
propagationImmediatelyStopped
P
propagationStopped
P
returnValue
P
srcElement
P
target
P
timeStamp
P
type
P
view
Accessors
A
data
A
layerX
A
layerY
A
pageX
A
pageY
Methods
M
preventDefault
M
stopImmediatePropagation
M
stopPropagation
constructor
new FederatedEvent<N extends UIEvent | PixiTouch = UIEvent | PixiTouch>(
    manager: EventBoundary,
): FederatedEvent<N>
Type Parameters
N extends UIEvent | PixiTouch = UIEvent | PixiTouch
Parameters
manager: EventBoundary
The event boundary which manages this event. Propagation can only occur within the boundary's jurisdiction.

Returns FederatedEvent<N>
bubbles
bubbles: boolean = true
Flags whether this event bubbles. This will take effect only if it is set before propagation.

Implementation of UIEvent.bubbles

Readonlycancelable
cancelable: false
Flags whether this event can be canceled using FederatedEvent.preventDefault. This is always false (for now).

Implementation of UIEvent.cancelable

cancelBubble
cancelBubble: boolean = true
Deprecated
since 7.0.0

Implementation of UIEvent.cancelBubble

currentTarget
currentTarget: Container
The listeners of the event target that are being notified.

Implementation of UIEvent.currentTarget

defaultPrevented
defaultPrevented: boolean = false
Flags whether the default response of the user agent was prevent through this event.

Implementation of UIEvent.defaultPrevented

detail
detail: number
Event-specific detail

Implementation of UIEvent.detail

eventPhase
eventPhase: number = FederatedEvent.prototype.NONE
The propagation phase.

Default
FederatedEvent.NONE

Implementation of UIEvent.eventPhase

isTrusted
isTrusted: boolean
Flags whether this is a user-trusted event

Implementation of UIEvent.isTrusted

layer
layer: Point = ...
The coordinates of the event relative to the nearest DOM layer. This is a non-standard property.

Readonlymanager
manager: EventBoundary
The EventBoundary that manages this event. Null for root events.

nativeEvent
nativeEvent: N
The native event that caused the foremost original event.

originalEvent
originalEvent: FederatedEvent<N>
The original event that caused this event, if any.

page
page: Point = ...
The coordinates of the event relative to the DOM document. This is a non-standard property.

path
path: Container<ContainerChild>[]
The composed path of the event's propagation. The target is at the end.

propagationImmediatelyStopped
propagationImmediatelyStopped: boolean = false
Flags whether propagation was immediately stopped.

propagationStopped
propagationStopped: boolean = false
Flags whether propagation was stopped.

returnValue
returnValue: boolean
Deprecated
since 7.0.0

Implementation of UIEvent.returnValue

srcElement
srcElement: EventTarget
Deprecated
since 7.0.0

Implementation of UIEvent.srcElement

target
target: Container
The event target that this will be dispatched to.

Implementation of UIEvent.target

timeStamp
timeStamp: number
The timestamp of when the event was created.

Implementation of UIEvent.timeStamp

type
type: string
The type of event, e.g. "mouseup".

Implementation of UIEvent.type

view
view: Window
The global Window object.

Implementation of UIEvent.view

data
get data(): this
Fallback for the deprecated InteractionEvent.data.

Returns this
Deprecated
since 7.0.0

layerX
get layerX(): number
Returns number
layerY
get layerY(): number
Returns number
pageX
get pageX(): number
Returns number
pageY
get pageY(): number
Returns number
preventDefault
preventDefault(): void
Prevent default behavior of both PixiJS and the user agent.

Returns void
Example
sprite.on('click', (event) => {
    // Prevent both browser's default click behavior
    // and PixiJS's default handling
    event.preventDefault();

    // Custom handling
    customClickHandler();
});
Copy
Remarks
Only works if the native event is cancelable
Does not stop event propagation
Implementation of UIEvent.preventDefault

stopImmediatePropagation
stopImmediatePropagation(): void
Stop this event from propagating to any additional listeners, including those on the current target and any following targets in the propagation path.

Returns void
Example
container.on('pointerdown', (event) => {
    // Stop all further event handling
    event.stopImmediatePropagation();

    // These handlers won't be called:
    // - Other pointerdown listeners on this container
    // - Any pointerdown listeners on parent containers
});
Copy
Remarks
Immediately stops all event propagation
Prevents other listeners on same target from being called
More aggressive than stopPropagation()
Implementation of UIEvent.stopImmediatePropagation

stopPropagation
stopPropagation(): void
Stop this event from propagating to the next target in the propagation path. The rest of the listeners on the current target will still be notified.

Returns void
Example
child.on('pointermove', (event) => {
    // Handle event on child
    updateChild();

    // Prevent parent handlers from being called
    event.stopPropagation();
});

// This won't be called if child handles the event
parent.on('pointermove', (event) => {
    updateParent();
});
Copy
Remarks
Stops event bubbling to parent containers
Does not prevent other listeners on same target
Less aggressive than stopImmediatePropagation()
Implementation of UIEvent.stopPropagation

FederatedMouseEvent
Class FederatedMouseEvent
A specialized event class for mouse interactions in PixiJS applications. Extends FederatedEvent to provide mouse-specific properties and methods while maintaining compatibility with the DOM MouseEvent interface.

Key features:

Tracks mouse button states
Provides modifier key states
Supports coordinate systems (client, screen, global)
Enables precise position tracking
Example
// Basic mouse event handling
sprite.on('mousemove', (event: FederatedMouseEvent) => {
    // Get coordinates in different spaces
    console.log('Global position:', event.global.x, event.global.y);
    console.log('Client position:', event.client.x, event.client.y);
    console.log('Screen position:', event.screen.x, event.screen.y);

    // Check button and modifier states
    if (event.buttons === 1 && event.ctrlKey) {
        console.log('Left click + Control key');
    }

    // Get local coordinates relative to any container
    const localPos = event.getLocalPosition(container);
    console.log('Local position:', localPos.x, localPos.y);
});

// Handle mouse button states
sprite.on('mousedown', (event: FederatedMouseEvent) => {
    console.log('Mouse button:', event.button); // 0=left, 1=middle, 2=right
    console.log('Active buttons:', event.buttons);
});
Copy
See
FederatedEvent For base event functionality
https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent DOM MouseEvent Interface
Hierarchy (View Summary)
FederatedEvent<MouseEvent | PointerEvent | PixiTouch>
FederatedMouseEvent
FederatedPointerEvent
FederatedWheelEvent
Implements
MouseEvent
Constructors
C
constructor
Properties
P
altKey
P
bubbles
P
button
P
buttons
P
cancelable
P
cancelBubble
P
client
P
ctrlKey
P
currentTarget
P
defaultPrevented
P
detail
P
eventPhase
P
global
P
isTrusted
P
layer
P
manager
P
metaKey
P
movement
P
nativeEvent
P
offset
P
originalEvent
P
page
P
path
P
propagationImmediatelyStopped
P
propagationStopped
P
relatedTarget
P
returnValue
P
screen
P
shiftKey
P
srcElement
P
target
P
timeStamp
P
type
P
view
Accessors
A
clientX
A
clientY
A
data
A
globalX
A
globalY
A
layerX
A
layerY
A
movementX
A
movementY
A
offsetX
A
offsetY
A
pageX
A
pageY
A
screenX
A
screenY
A
x
A
y
Methods
M
getLocalPosition
M
getModifierState
M
preventDefault
M
stopImmediatePropagation
M
stopPropagation
constructor
new FederatedMouseEvent(manager: EventBoundary): FederatedMouseEvent
Parameters
manager: EventBoundary
The event boundary which manages this event. Propagation can only occur within the boundary's jurisdiction.

Returns FederatedMouseEvent
Inherited from FederatedEvent.constructor

altKey
altKey: boolean
Whether the "alt" key was pressed when this mouse event occurred.

Implementation of MouseEvent.altKey

bubbles
bubbles: boolean = true
Flags whether this event bubbles. This will take effect only if it is set before propagation.

Implementation of MouseEvent.bubbles

Inherited from FederatedEvent.bubbles

button
button: number
The specific button that was pressed in this mouse event.

Implementation of MouseEvent.button

buttons
buttons: number
The button depressed when this event occurred.

Implementation of MouseEvent.buttons

Readonlycancelable
cancelable: false
Flags whether this event can be canceled using FederatedEvent.preventDefault. This is always false (for now).

Implementation of MouseEvent.cancelable

Inherited from FederatedEvent.cancelable

cancelBubble
cancelBubble: boolean = true
Deprecated
since 7.0.0

Implementation of MouseEvent.cancelBubble

Inherited from FederatedEvent.cancelBubble

client
client: Point = ...
The coordinates of the mouse event relative to the canvas.

ctrlKey
ctrlKey: boolean
Whether the "control" key was pressed when this mouse event occurred.

Implementation of MouseEvent.ctrlKey

currentTarget
currentTarget: Container
The listeners of the event target that are being notified.

Implementation of MouseEvent.currentTarget

Inherited from FederatedEvent.currentTarget

defaultPrevented
defaultPrevented: boolean = false
Flags whether the default response of the user agent was prevent through this event.

Implementation of MouseEvent.defaultPrevented

Inherited from FederatedEvent.defaultPrevented

detail
detail: number
This is the number of clicks that occurs in 200ms/click of each other.

Implementation of MouseEvent.detail

Overrides FederatedEvent.detail

eventPhase
eventPhase: number = FederatedEvent.prototype.NONE
The propagation phase.

Default
FederatedEvent.NONE

Implementation of MouseEvent.eventPhase

Inherited from FederatedEvent.eventPhase

global
global: Point = ...
The pointer coordinates in world space.

isTrusted
isTrusted: boolean
Flags whether this is a user-trusted event

Implementation of MouseEvent.isTrusted

Inherited from FederatedEvent.isTrusted

layer
layer: Point = ...
The coordinates of the event relative to the nearest DOM layer. This is a non-standard property.

Inherited from FederatedEvent.layer

Readonlymanager
manager: EventBoundary
The EventBoundary that manages this event. Null for root events.

Inherited from FederatedEvent.manager

metaKey
metaKey: boolean
Whether the "meta" key was pressed when this mouse event occurred.

Implementation of MouseEvent.metaKey

movement
movement: Point = ...
The movement in this pointer relative to the last mousemove event.

nativeEvent
nativeEvent: MouseEvent | PointerEvent | PixiTouch
The native event that caused the foremost original event.

Inherited from FederatedEvent.nativeEvent

offset
offset: Point = ...
The offset of the pointer coordinates w.r.t. target Container in world space. This is not supported at the moment.

originalEvent
originalEvent: FederatedEvent<MouseEvent | PointerEvent | PixiTouch>
The original event that caused this event, if any.

Inherited from FederatedEvent.originalEvent

page
page: Point = ...
The coordinates of the event relative to the DOM document. This is a non-standard property.

Inherited from FederatedEvent.page

path
path: Container<ContainerChild>[]
The composed path of the event's propagation. The target is at the end.

Inherited from FederatedEvent.path

propagationImmediatelyStopped
propagationImmediatelyStopped: boolean = false
Flags whether propagation was immediately stopped.

Inherited from FederatedEvent.propagationImmediatelyStopped

propagationStopped
propagationStopped: boolean = false
Flags whether propagation was stopped.

Inherited from FederatedEvent.propagationStopped

relatedTarget
relatedTarget: EventTarget
This is currently not implemented in the Federated Events API.

Implementation of MouseEvent.relatedTarget

returnValue
returnValue: boolean
Deprecated
since 7.0.0

Implementation of MouseEvent.returnValue

Inherited from FederatedEvent.returnValue

screen
screen: Point = ...
The pointer coordinates in the renderer's screen. This has slightly different semantics than native PointerEvent screenX/screenY.

shiftKey
shiftKey: boolean
Whether the "shift" key was pressed when this mouse event occurred.

Implementation of MouseEvent.shiftKey

srcElement
srcElement: EventTarget
Deprecated
since 7.0.0

Implementation of MouseEvent.srcElement

Inherited from FederatedEvent.srcElement

target
target: Container
The event target that this will be dispatched to.

Implementation of MouseEvent.target

Inherited from FederatedEvent.target

timeStamp
timeStamp: number
The timestamp of when the event was created.

Implementation of MouseEvent.timeStamp

Inherited from FederatedEvent.timeStamp

type
type: string
The type of event, e.g. "mouseup".

Implementation of MouseEvent.type

Inherited from FederatedEvent.type

view
view: Window
The global Window object.

Implementation of MouseEvent.view

Inherited from FederatedEvent.view

clientX
get clientX(): number
Returns number
Implementation of MouseEvent.clientX

clientY
get clientY(): number
Returns number
Implementation of MouseEvent.clientY

data
get data(): this
Fallback for the deprecated InteractionEvent.data.

Returns this
Deprecated
since 7.0.0

Inherited from FederatedEvent.data

globalX
get globalX(): number
Returns number
globalY
get globalY(): number
Returns number
layerX
get layerX(): number
Returns number
Inherited from FederatedEvent.layerX

layerY
get layerY(): number
Returns number
Inherited from FederatedEvent.layerY

movementX
get movementX(): number
Returns number
Implementation of MouseEvent.movementX

movementY
get movementY(): number
Returns number
Implementation of MouseEvent.movementY

offsetX
get offsetX(): number
Returns number
Implementation of MouseEvent.offsetX

offsetY
get offsetY(): number
Returns number
Implementation of MouseEvent.offsetY

pageX
get pageX(): number
Returns number
Implementation of MouseEvent.pageX

Inherited from FederatedEvent.pageX

pageY
get pageY(): number
Returns number
Implementation of MouseEvent.pageY

Inherited from FederatedEvent.pageY

screenX
get screenX(): number
The pointer coordinates in the renderer's screen. Alias for screen.x.

Returns number
Implementation of MouseEvent.screenX

screenY
get screenY(): number
The pointer coordinates in the renderer's screen. Alias for screen.y.

Returns number
Implementation of MouseEvent.screenY

x
get x(): number
Alias for this.clientX.

Returns number
Implementation of MouseEvent.x

y
get y(): number
Alias for this.clientY.

Returns number
Implementation of MouseEvent.y

getLocalPosition
getLocalPosition<P extends PointData = Point>(
    container: Container,
    point?: P,
    globalPos?: PointData,
): P
Converts global coordinates into container-local coordinates.

This method transforms coordinates from world space to a container's local space, useful for precise positioning and hit testing.

Type Parameters
P extends PointData = Point
Parameters
container: Container
The Container to get local coordinates for

Optionalpoint: P
Optional Point object to store the result. If not provided, a new Point will be created

OptionalglobalPos: PointData
Optional custom global coordinates. If not provided, the event's global position is used

Returns P
The local coordinates as a Point object

Example
// Basic usage - get local coordinates relative to a container
sprite.on('pointermove', (event: FederatedMouseEvent) => {
    // Get position relative to the sprite
    const localPos = event.getLocalPosition(sprite);
    console.log('Local position:', localPos.x, localPos.y);
});
// Using custom global coordinates
const customGlobal = new Point(100, 100);
sprite.on('pointermove', (event: FederatedMouseEvent) => {
    // Transform custom coordinates
    const localPos = event.getLocalPosition(sprite, undefined, customGlobal);
    console.log('Custom local position:', localPos.x, localPos.y);
});
Copy
See
Container.worldTransform For the transformation matrix
Point For the point class used to store coordinates
getModifierState
getModifierState(key: string): boolean
Whether the modifier key was pressed when this event natively occurred.

Parameters
key: string
The modifier key.

Returns boolean
Implementation of MouseEvent.getModifierState

preventDefault
preventDefault(): void
Prevent default behavior of both PixiJS and the user agent.

Returns void
Example
sprite.on('click', (event) => {
    // Prevent both browser's default click behavior
    // and PixiJS's default handling
    event.preventDefault();

    // Custom handling
    customClickHandler();
});
Copy
Remarks
Only works if the native event is cancelable
Does not stop event propagation
Implementation of MouseEvent.preventDefault

Inherited from FederatedEvent.preventDefault

stopImmediatePropagation
stopImmediatePropagation(): void
Stop this event from propagating to any additional listeners, including those on the current target and any following targets in the propagation path.

Returns void
Example
container.on('pointerdown', (event) => {
    // Stop all further event handling
    event.stopImmediatePropagation();

    // These handlers won't be called:
    // - Other pointerdown listeners on this container
    // - Any pointerdown listeners on parent containers
});
Copy
Remarks
Immediately stops all event propagation
Prevents other listeners on same target from being called
More aggressive than stopPropagation()
Implementation of MouseEvent.stopImmediatePropagation

Inherited from FederatedEvent.stopImmediatePropagation

stopPropagation
stopPropagation(): void
Stop this event from propagating to the next target in the propagation path. The rest of the listeners on the current target will still be notified.

Returns void
Example
child.on('pointermove', (event) => {
    // Handle event on child
    updateChild();

    // Prevent parent handlers from being called
    event.stopPropagation();
});

// This won't be called if child handles the event
parent.on('pointermove', (event) => {
    updateParent();
});
Copy
Remarks
Stops event bubbling to parent containers
Does not prevent other listeners on same target
Less aggressive than stopImmediatePropagation()
Implementation of MouseEvent.stopPropagation

Inherited from FederatedEvent.stopPropagation
Class FederatedWheelEvent
A specialized event class for wheel/scroll interactions in PixiJS applications. Extends FederatedMouseEvent to provide wheel-specific properties while maintaining compatibility with the DOM WheelEvent interface.

Key features:

Provides scroll delta information
Supports different scroll modes (pixel, line, page)
Inherits mouse event properties
Normalizes cross-browser wheel events
Example
// Basic wheel event handling
sprite.on('wheel', (event: FederatedWheelEvent) => {
    // Get scroll amount
    console.log('Vertical scroll:', event.deltaY);
    console.log('Horizontal scroll:', event.deltaX);

    // Check scroll mode
    if (event.deltaMode === FederatedWheelEvent.DOM_DELTA_LINE) {
        console.log('Scrolling by lines');
    } else if (event.deltaMode === FederatedWheelEvent.DOM_DELTA_PAGE) {
        console.log('Scrolling by pages');
    } else {
        console.log('Scrolling by pixels');
    }

    // Get scroll position
    console.log('Scroll at:', event.global.x, event.global.y);
});

// Common use case: Zoom control
container.on('wheel', (event: FederatedWheelEvent) => {
    // Prevent page scrolling
    event.preventDefault();

    // Zoom in/out based on scroll direction
    const zoomFactor = 1 + (event.deltaY / 1000);
    container.scale.set(container.scale.x * zoomFactor);
});
Copy
See
FederatedMouseEvent For base mouse event functionality
https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent DOM WheelEvent Interface
EventSystem For the event management system
Hierarchy (View Summary, Expand)
FederatedMouseEvent
FederatedWheelEvent
Implements
WheelEvent
Constructors
C
constructor
Properties
P
altKey
P
bubbles
P
button
P
buttons
P
cancelable
P
cancelBubble
P
client
P
ctrlKey
P
currentTarget
P
defaultPrevented
P
deltaMode
P
deltaX
P
deltaY
P
deltaZ
P
detail
P
eventPhase
P
global
P
isTrusted
P
layer
P
manager
P
metaKey
P
movement
P
nativeEvent
P
offset
P
originalEvent
P
page
P
path
P
propagationImmediatelyStopped
P
propagationStopped
P
relatedTarget
P
returnValue
P
screen
P
shiftKey
P
srcElement
P
target
P
timeStamp
P
type
P
view
Accessors
A
clientX
A
clientY
A
data
A
globalX
A
globalY
A
layerX
A
layerY
A
movementX
A
movementY
A
offsetX
A
offsetY
A
pageX
A
pageY
A
screenX
A
screenY
A
x
A
y
Methods
M
getLocalPosition
M
getModifierState
M
preventDefault
M
stopImmediatePropagation
M
stopPropagation
constructor
new FederatedWheelEvent(manager: EventBoundary): FederatedWheelEvent
Parameters
manager: EventBoundary
The event boundary which manages this event. Propagation can only occur within the boundary's jurisdiction.

Returns FederatedWheelEvent
Inherited from FederatedMouseEvent.constructor

altKey
altKey: boolean
Whether the "alt" key was pressed when this mouse event occurred.

Implementation of WheelEvent.altKey

Inherited from FederatedMouseEvent.altKey

bubbles
bubbles: boolean = true
Flags whether this event bubbles. This will take effect only if it is set before propagation.

Implementation of WheelEvent.bubbles

Inherited from FederatedMouseEvent.bubbles

button
button: number
The specific button that was pressed in this mouse event.

Implementation of WheelEvent.button

Inherited from FederatedMouseEvent.button

buttons
buttons: number
The button depressed when this event occurred.

Implementation of WheelEvent.buttons

Inherited from FederatedMouseEvent.buttons

Readonlycancelable
cancelable: false
Flags whether this event can be canceled using FederatedEvent.preventDefault. This is always false (for now).

Implementation of WheelEvent.cancelable

Inherited from FederatedMouseEvent.cancelable

cancelBubble
cancelBubble: boolean = true
Deprecated
since 7.0.0

Implementation of WheelEvent.cancelBubble

Inherited from FederatedMouseEvent.cancelBubble

client
client: Point = ...
The coordinates of the mouse event relative to the canvas.

Inherited from FederatedMouseEvent.client

ctrlKey
ctrlKey: boolean
Whether the "control" key was pressed when this mouse event occurred.

Implementation of WheelEvent.ctrlKey

Inherited from FederatedMouseEvent.ctrlKey

currentTarget
currentTarget: Container
The listeners of the event target that are being notified.

Implementation of WheelEvent.currentTarget

Inherited from FederatedMouseEvent.currentTarget

defaultPrevented
defaultPrevented: boolean = false
Flags whether the default response of the user agent was prevent through this event.

Implementation of WheelEvent.defaultPrevented

Inherited from FederatedMouseEvent.defaultPrevented

deltaMode
deltaMode: number
The units of deltaX, deltaY, and deltaZ. This is one of DOM_DELTA_LINE, DOM_DELTA_PAGE, DOM_DELTA_PIXEL.

Implementation of WheelEvent.deltaMode

deltaX
deltaX: number
Horizontal scroll amount

Implementation of WheelEvent.deltaX

deltaY
deltaY: number
Vertical scroll amount

Implementation of WheelEvent.deltaY

deltaZ
deltaZ: number
z-axis scroll amount.

Implementation of WheelEvent.deltaZ

detail
detail: number
This is the number of clicks that occurs in 200ms/click of each other.

Implementation of WheelEvent.detail

Inherited from FederatedMouseEvent.detail

eventPhase
eventPhase: number = FederatedEvent.prototype.NONE
The propagation phase.

Default
FederatedEvent.NONE

Implementation of WheelEvent.eventPhase

Inherited from FederatedMouseEvent.eventPhase

global
global: Point = ...
The pointer coordinates in world space.

Inherited from FederatedMouseEvent.global

isTrusted
isTrusted: boolean
Flags whether this is a user-trusted event

Implementation of WheelEvent.isTrusted

Inherited from FederatedMouseEvent.isTrusted

layer
layer: Point = ...
The coordinates of the event relative to the nearest DOM layer. This is a non-standard property.

Inherited from FederatedMouseEvent.layer

Readonlymanager
manager: EventBoundary
The EventBoundary that manages this event. Null for root events.

Inherited from FederatedMouseEvent.manager

metaKey
metaKey: boolean
Whether the "meta" key was pressed when this mouse event occurred.

Implementation of WheelEvent.metaKey

Inherited from FederatedMouseEvent.metaKey

movement
movement: Point = ...
The movement in this pointer relative to the last mousemove event.

Inherited from FederatedMouseEvent.movement

nativeEvent
nativeEvent: MouseEvent | PointerEvent | PixiTouch
The native event that caused the foremost original event.

Inherited from FederatedMouseEvent.nativeEvent

offset
offset: Point = ...
The offset of the pointer coordinates w.r.t. target Container in world space. This is not supported at the moment.

Inherited from FederatedMouseEvent.offset

originalEvent
originalEvent: FederatedEvent<MouseEvent | PointerEvent | PixiTouch>
The original event that caused this event, if any.

Inherited from FederatedMouseEvent.originalEvent

page
page: Point = ...
The coordinates of the event relative to the DOM document. This is a non-standard property.

Inherited from FederatedMouseEvent.page

path
path: Container<ContainerChild>[]
The composed path of the event's propagation. The target is at the end.

Inherited from FederatedMouseEvent.path

propagationImmediatelyStopped
propagationImmediatelyStopped: boolean = false
Flags whether propagation was immediately stopped.

Inherited from FederatedMouseEvent.propagationImmediatelyStopped

propagationStopped
propagationStopped: boolean = false
Flags whether propagation was stopped.

Inherited from FederatedMouseEvent.propagationStopped

relatedTarget
relatedTarget: EventTarget
This is currently not implemented in the Federated Events API.

Implementation of WheelEvent.relatedTarget

Inherited from FederatedMouseEvent.relatedTarget

returnValue
returnValue: boolean
Deprecated
since 7.0.0

Implementation of WheelEvent.returnValue

Inherited from FederatedMouseEvent.returnValue

screen
screen: Point = ...
The pointer coordinates in the renderer's screen. This has slightly different semantics than native PointerEvent screenX/screenY.

Inherited from FederatedMouseEvent.screen

shiftKey
shiftKey: boolean
Whether the "shift" key was pressed when this mouse event occurred.

Implementation of WheelEvent.shiftKey

Inherited from FederatedMouseEvent.shiftKey

srcElement
srcElement: EventTarget
Deprecated
since 7.0.0

Implementation of WheelEvent.srcElement

Inherited from FederatedMouseEvent.srcElement

target
target: Container
The event target that this will be dispatched to.

Implementation of WheelEvent.target

Inherited from FederatedMouseEvent.target

timeStamp
timeStamp: number
The timestamp of when the event was created.

Implementation of WheelEvent.timeStamp

Inherited from FederatedMouseEvent.timeStamp

type
type: string
The type of event, e.g. "mouseup".

Implementation of WheelEvent.type

Inherited from FederatedMouseEvent.type

view
view: Window
The global Window object.

Implementation of WheelEvent.view

Inherited from FederatedMouseEvent.view

clientX
get clientX(): number
Returns number
Implementation of WheelEvent.clientX

Inherited from FederatedMouseEvent.clientX

clientY
get clientY(): number
Returns number
Implementation of WheelEvent.clientY

Inherited from FederatedMouseEvent.clientY

data
get data(): this
Fallback for the deprecated InteractionEvent.data.

Returns this
Deprecated
since 7.0.0

Inherited from FederatedMouseEvent.data

globalX
get globalX(): number
Returns number
Inherited from FederatedMouseEvent.globalX

globalY
get globalY(): number
Returns number
Inherited from FederatedMouseEvent.globalY

layerX
get layerX(): number
Returns number
Inherited from FederatedMouseEvent.layerX

layerY
get layerY(): number
Returns number
Inherited from FederatedMouseEvent.layerY

movementX
get movementX(): number
Returns number
Implementation of WheelEvent.movementX

Inherited from FederatedMouseEvent.movementX

movementY
get movementY(): number
Returns number
Implementation of WheelEvent.movementY

Inherited from FederatedMouseEvent.movementY

offsetX
get offsetX(): number
Returns number
Implementation of WheelEvent.offsetX

Inherited from FederatedMouseEvent.offsetX

offsetY
get offsetY(): number
Returns number
Implementation of WheelEvent.offsetY

Inherited from FederatedMouseEvent.offsetY

pageX
get pageX(): number
Returns number
Implementation of WheelEvent.pageX

Inherited from FederatedMouseEvent.pageX

pageY
get pageY(): number
Returns number
Implementation of WheelEvent.pageY

Inherited from FederatedMouseEvent.pageY

screenX
get screenX(): number
The pointer coordinates in the renderer's screen. Alias for screen.x.

Returns number
Implementation of WheelEvent.screenX

Inherited from FederatedMouseEvent.screenX

screenY
get screenY(): number
The pointer coordinates in the renderer's screen. Alias for screen.y.

Returns number
Implementation of WheelEvent.screenY

Inherited from FederatedMouseEvent.screenY

x
get x(): number
Alias for this.clientX.

Returns number
Implementation of WheelEvent.x

Inherited from FederatedMouseEvent.x

y
get y(): number
Alias for this.clientY.

Returns number
Implementation of WheelEvent.y

Inherited from FederatedMouseEvent.y

getLocalPosition
getLocalPosition<P extends PointData = Point>(
    container: Container,
    point?: P,
    globalPos?: PointData,
): P
Converts global coordinates into container-local coordinates.

This method transforms coordinates from world space to a container's local space, useful for precise positioning and hit testing.

Type Parameters
P extends PointData = Point
Parameters
container: Container
The Container to get local coordinates for

Optionalpoint: P
Optional Point object to store the result. If not provided, a new Point will be created

OptionalglobalPos: PointData
Optional custom global coordinates. If not provided, the event's global position is used

Returns P
The local coordinates as a Point object

Example
// Basic usage - get local coordinates relative to a container
sprite.on('pointermove', (event: FederatedMouseEvent) => {
    // Get position relative to the sprite
    const localPos = event.getLocalPosition(sprite);
    console.log('Local position:', localPos.x, localPos.y);
});
// Using custom global coordinates
const customGlobal = new Point(100, 100);
sprite.on('pointermove', (event: FederatedMouseEvent) => {
    // Transform custom coordinates
    const localPos = event.getLocalPosition(sprite, undefined, customGlobal);
    console.log('Custom local position:', localPos.x, localPos.y);
});
Copy
See
Container.worldTransform For the transformation matrix
Point For the point class used to store coordinates
Inherited from FederatedMouseEvent.getLocalPosition

getModifierState
getModifierState(key: string): boolean
Whether the modifier key was pressed when this event natively occurred.

Parameters
key: string
The modifier key.

Returns boolean
Implementation of WheelEvent.getModifierState

Inherited from FederatedMouseEvent.getModifierState

preventDefault
preventDefault(): void
Prevent default behavior of both PixiJS and the user agent.

Returns void
Example
sprite.on('click', (event) => {
    // Prevent both browser's default click behavior
    // and PixiJS's default handling
    event.preventDefault();

    // Custom handling
    customClickHandler();
});
Copy
Remarks
Only works if the native event is cancelable
Does not stop event propagation
Implementation of WheelEvent.preventDefault

Inherited from FederatedMouseEvent.preventDefault

stopImmediatePropagation
stopImmediatePropagation(): void
Stop this event from propagating to any additional listeners, including those on the current target and any following targets in the propagation path.

Returns void
Example
container.on('pointerdown', (event) => {
    // Stop all further event handling
    event.stopImmediatePropagation();

    // These handlers won't be called:
    // - Other pointerdown listeners on this container
    // - Any pointerdown listeners on parent containers
});
Copy
Remarks
Immediately stops all event propagation
Prevents other listeners on same target from being called
More aggressive than stopPropagation()
Implementation of WheelEvent.stopImmediatePropagation

Inherited from FederatedMouseEvent.stopImmediatePropagation

stopPropagation
stopPropagation(): void
Stop this event from propagating to the next target in the propagation path. The rest of the listeners on the current target will still be notified.

Returns void
Example
child.on('pointermove', (event) => {
    // Handle event on child
    updateChild();

    // Prevent parent handlers from being called
    event.stopPropagation();
});

// This won't be called if child handles the event
parent.on('pointermove', (event) => {
    updateParent();
});
Copy
Remarks
Stops event bubbling to parent containers
Does not prevent other listeners on same target
Less aggressive than stopImmediatePropagation()
Implementation of WheelEvent.stopPropagation

Inherited from FederatedMouseEvent.stopPropagation

Interface FederatedOptions
The properties available for any interactive object. This interface defines the core interaction properties and event handlers that can be set on any Container in PixiJS.

Example
// Basic interactive setup
const sprite = new Sprite(texture);
sprite.eventMode = 'static';
sprite.cursor = 'pointer';

// Using event handlers
sprite.on('click', (event) => console.log('Sprite clicked!', event));
sprite.on('pointerdown', (event) => console.log('Pointer down!', event));

// Using property-based event handlers
sprite.onclick = (event) => console.log('Clicked!');
sprite.onpointerenter = () => sprite.alpha = 0.7;
sprite.onpointerleave = () => sprite.alpha = 1.0;

// Custom hit area
sprite.hitArea = new Rectangle(0, 0, 100, 100);
Copy
Core Properties:

eventMode: Controls how the object handles interaction events
cursor: Sets the mouse cursor when hovering
hitArea: Defines custom hit testing area
interactive: Alias for eventMode to enable interaction with "static" or "passive" modes
interactiveChildren: Controls hit testing on children
Event Handlers:

Mouse: click, mousedown, mouseup, mousemove, mouseenter, mouseleave
Touch: touchstart, touchend, touchmove, tap
Pointer: pointerdown, pointerup, pointermove, pointerover
Global: globalpointermove, globalmousemove, globaltouchmove
Important
Global events are fired when the pointer moves even if it is outside the bounds of the Container.

See
EventMode For interaction mode details
Cursor For cursor style options
IHitArea For hit area implementation
interface FederatedOptions {
    cursor?: string & {} | Cursor;
    eventMode?: EventMode;
    hitArea?: IHitArea;
    interactive?: boolean;
    interactiveChildren?: boolean;
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
}
Hierarchy (View Summary)
FederatedOptions
IFederatedContainer
Properties
P
cursor?
P
eventMode?
P
hitArea?
P
interactive?
P
interactiveChildren?
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
EventMode
Type Alias EventMode
EventMode: "none" | "passive" | "auto" | "static" | "dynamic"
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