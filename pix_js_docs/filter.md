Filters / Blend Modes
PixiJS filters allow you to apply post-processing visual effects to any scene object and its children. Filters can be used for effects such as blurring, color adjustments, noise, or custom shader-based operations.

import { Sprite, BlurFilter } from 'pixi.js';

// Apply the filter
sprite.filters = [new BlurFilter({ strength: 8 })];

Applying Filters
Applying filters is straightforward. You can assign a filter instance to the filters property of any scene object, such as Sprite, Container, or Graphics. You can apply multiple filters by passing an array of filter instances.

import { BlurFilter, NoiseFilter } from 'pixi.js';

sprite.filters = new BlurFilter({ strength: 5 });

sprite.filters = [new BlurFilter({ strength: 4 }), new NoiseFilter({ noise: 0.2 })];

info
Order matters — filters are applied in sequence.

Advanced Blend Modes
PixiJS v8 introduces advanced blend modes for filters, allowing for more complex compositing effects. These blend modes can be used to create unique visual styles and effects. To use advanced modes like HARD_LIGHT, you must manually import the advanced blend mode extension:

import 'pixi.js/advanced-blend-modes';
import { HardMixBlend } from 'pixi.js';

sprite.filters = [new HardMixBlend()];

Built-In Filters Overview
PixiJS v8 provides a variety of filters out of the box:

Filter Class	Description
AlphaFilter	Applies transparency to an object.
BlurFilter	Gaussian blur.
ColorMatrixFilter	Applies color transformations via a matrix.
DisplacementFilter	Distorts an object using another texture.
NoiseFilter	Adds random noise for a grainy effect.
info
To explore more community filters, see pixi-filters.

Blend Filters: Used for custom compositing modes

Filter Class	Description
ColorBurnBlend	Darkens the base color to reflect the blend color.
ColorDodgeBlend	Brightens the base color.
DarkenBlend	Retains the darkest color components.
DivideBlend	Divides the base color by the blend color.
HardMixBlend	High-contrast blend.
LinearBurnBlend	Darkens using linear formula.
LinearDodgeBlend	Lightens using linear formula.
LinearLightBlend	Combination of linear dodge and burn.
PinLightBlend	Selective replacement of colors.
SubtractBlend	Subtracts the blend color from base.
Creating a Custom Filter
To define a custom filter in PixiJS v8, you use Filter.from() with shader programs and GPU resources.

import { Filter, GlProgram, Texture } from 'pixi.js';

const vertex = `
  in vec2 aPosition;
  out vec2 vTextureCoord;

  uniform vec4 uInputSize;
  uniform vec4 uOutputFrame;
  uniform vec4 uOutputTexture;

  vec4 filterVertexPosition( void )
  {
      vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;

      position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
      position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

      return vec4(position, 0.0, 1.0);
  }

  vec2 filterTextureCoord( void )
  {
      return aPosition * (uOutputFrame.zw * uInputSize.zw);
  }

  void main(void)
  {
      gl_Position = filterVertexPosition();
      vTextureCoord = filterTextureCoord();
  }
`;

const fragment = `
  in vec2 vTextureCoord;
  in vec4 vColor;

  uniform sampler2D uTexture;
  uniform float uTime;

  void main(void)
  {
      vec2 uvs = vTextureCoord.xy;

      vec4 fg = texture2D(uTexture, vTextureCoord);


      fg.r = uvs.y + sin(uTime);


      gl_FragColor = fg;

  }
`;

const customFilter = new Filter({
  glProgram: new GlProgram({
    fragment,
    vertex,
  }),
  resources: {
    timeUniforms: {
      uTime: { value: 0.0, type: 'f32' },
    },
  },
});

// Apply the filter
sprite.filters = [customFilter];

// Update uniform
app.ticker.add((ticker) => {
  filter.resources.timeUniforms.uniforms.uTime += 0.04 * ticker.deltaTime;
});

Tip
Shaders must be WebGL- or WebGPU-compatible. For dual-renderer support, include a gpuProgram.

API Reference

Overview
Filters
PixiJS filters provide powerful post-processing effects that can be applied to any display object and its children. They enable visual effects ranging from basic color adjustments to complex shader-based operations.

Basic Usage
Apply filters to any display object using its filters property:

import { Sprite, BlurFilter } from 'pixi.js';

const sprite = Sprite.from('image.png');

// Single filter
sprite.filters = new BlurFilter({ strength: 8 });

// Multiple filters (applied in sequence)
sprite.filters = [
    new BlurFilter({ strength: 8 }),
    new NoiseFilter({ noise: 0.5 })
];
Copy
Built-in Filters
Basic Filters
import {
    AlphaFilter,
    BlurFilter,
    ColorMatrixFilter,
    DisplacementFilter,
    NoiseFilter
} from 'pixi.js';

// Transparency
sprite.filters = new AlphaFilter({ alpha: 0.5 });

// Gaussian blur
sprite.filters = new BlurFilter({
    strength: 8,
    quality: 4,
    repeatEdgePixels: false
});

// Color transformation
sprite.filters = new ColorMatrixFilter();
filter.blackAndWhite(); // Preset effect

// Displacement mapping
const displacementSprite = Sprite.from('displacement.png');
sprite.filters = new DisplacementFilter({
    sprite: displacementSprite,
    scale: 20
});

// Random noise
sprite.filters = new NoiseFilter({ noise: 0.5 });
Copy
Blend Modes
Advanced blend modes require importing the blend modes extension:

import 'pixi.js/advanced-blend-modes';
import {
    ColorBurnBlend,
    ColorDodgeBlend,
    HardMixBlend
} from 'pixi.js';

sprite.filters = [
    new ColorBurnBlend(),  // Darkens base colors
    new ColorDodgeBlend(), // Brightens base colors
    new HardMixBlend()     // High contrast blend
];
Copy
Creating Custom Filters
Create custom filters using WebGL/WebGPU shaders:

import { Filter, GlProgram } from 'pixi.js';

// Define shader programs
const vertex = `
    in vec2 aPosition;
    out vec2 vTextureCoord;

    uniform vec4 uInputSize;
    uniform vec4 uOutputFrame;
    uniform vec4 uOutputTexture;

    void main(void) {
        gl_Position = vec4(aPosition * 2.0 - 1.0, 0.0, 1.0);
        vTextureCoord = aPosition;
    }
`;

const fragment = `
    in vec2 vTextureCoord;

    uniform sampler2D uTexture;
    uniform float uWaveAmplitude;
    uniform float uWaveFrequency;
    uniform float uTime;

    void main(void) {
        vec2 coord = vTextureCoord;

        // Create wave effect
        coord.x += sin(coord.y * uWaveFrequency + uTime) * uWaveAmplitude;

        gl_FragColor = texture(uTexture, coord);
    }
`;

// Create the filter
const waveFilter = new Filter({
    // Shader programs
    glProgram: new GlProgram({ vertex, fragment }),

    // Resources (uniforms, textures, etc)
    resources: {
        waveUniforms: {
            uWaveAmplitude: { value: 0.05, type: 'f32' },
            uWaveFrequency: { value: 10.0, type: 'f32' },
            uTime: { value: 0.0, type: 'f32' }
        }
    }
});

// Apply the filter
sprite.filters = [waveFilter];

// Animate the effect
app.ticker.add((time) => {
    waveFilter.resources.waveUniforms.uniforms.uTime += 0.1;
});
Copy
Filter Performance
Optimize filter performance with these techniques:

// Limit filter area
sprite.filterArea = new Rectangle(0, 0, 100, 100);

// Reuse filter instances
const sharedBlur = new BlurFilter({ strength: 4 });
sprite1.filters = [sharedBlur];
sprite2.filters = [sharedBlur];

// Disable when not needed
sprite.filters = null;

// Use appropriate quality settings
const blur = new BlurFilter({
    strength: 8,
    quality: 2, // Lower quality for better performance
});
Copy
Best Practices
Apply filters sparingly - they impact performance
Share filter instances when possible
Set filterArea to limit processing area
Use appropriate quality settings for blur filters
Consider using sprite sheet frames instead of filters for static effects
Clean up filters when destroying objects
Related Documentation
See Filter for base filter class
See FilterSystem for rendering system
See AlphaFilter for transparency
See BlurFilter for Gaussian blur
See ColorMatrixFilter for color transformations
See DisplacementFilter for distortion effects
See NoiseFilter for noise effects
See PixiJS Filters for community filters
See Filter Demo for examples
For detailed implementation requirements and advanced usage, refer to the API documentation of individual filter classes.


Class FilterAdvanced
The Filter class is the base for all filter effects used in Pixi.js As it extends a shader, it requires that a glProgram is parsed in to work with WebGL and a gpuProgram for WebGPU. If you don't proved one, then the filter is skipped and just rendered as if it wasn't there for that renderer.

A filter can be applied to anything that extends Container in Pixi.js which also includes Sprites, Graphics etc.

Its worth noting Performance-wise filters can be pretty expensive if used too much in a single scene. The following happens under the hood when a filter is applied:

.1. Break the current batch
.2. The target is measured using getGlobalBounds (recursively go through all children and figure out how big the object is)
.3. Get the closest Po2 Textures from the texture pool
.4. Render the target to that texture
.5. Render that texture back to the main frame buffer as a quad using the filters program.

Some filters (such as blur) require multiple passes too which can result in an even bigger performance hit. So be careful! Its not generally the complexity of the shader that is the bottle neck, but all the framebuffer / shader switching that has to take place. One filter applied to a container with many objects is MUCH faster than many filter applied to many objects.

Example
import { Filter } from 'pixi.js';

const customFilter = new Filter({
    glProgram: new GlProgram({
        fragment,
        vertex,
    }),
    resources: {
        timeUniforms: {
            uTime: { value: 0.0, type: 'f32' },
        },
    },
});

// Apply the filter
sprite.filters = [customFilter];

// Update uniform
app.ticker.add((ticker) => {
    filter.resources.timeUniforms.uniforms.uTime += 0.04 * ticker.deltaTime;
});
Copy
Hierarchy (View Summary, Expand)
Shader
Filter
AlphaFilter
BlurFilter
BlurFilterPass
ColorMatrixFilter
DisplacementFilter
NoiseFilter
Constructors
C
constructor
Properties
P
antialias
P
blendRequired
P
clipToViewport
P
compatibleRenderers
P
enabled
P
glProgram
P
gpuProgram
P
groups
P
padding
P
resolution
P
resources
P
uid
P
defaultOptions
Accessors
A
blendMode
Methods
M
addResource
M
apply
M
destroy
M
from
constructor
new Filter(options: FilterWithShader): Filter
Parameters
options: FilterWithShader
The optional parameters of this filter.

Returns Filter
Overrides Shader.constructor

antialias
antialias: FilterAntialias
should the filter use antialiasing?

Default
inherit
Copy
blendRequired
blendRequired: boolean
Whether or not this filter requires the previous render texture for blending.

Default
false
Copy
clipToViewport
clipToViewport: boolean
Clip texture into viewport or not

Default
true
Copy
ReadonlycompatibleRenderers
compatibleRenderers: number
A number that uses two bits on whether the shader is compatible with the WebGL renderer and/or the WebGPU renderer. 0b00 - not compatible with either 0b01 - compatible with WebGL 0b10 - compatible with WebGPU This is automatically set based on if a GlProgram or GpuProgram is provided.

Inherited from Shader.compatibleRenderers

enabled
enabled: boolean = true
If enabled is true the filter is applied, if false it will not.

glProgram
glProgram: GlProgram
An instance of the GL program used by the WebGL renderer

Inherited from Shader.glProgram

gpuProgram
gpuProgram: GpuProgram
An instance of the GPU program used by the WebGPU renderer

Inherited from Shader.gpuProgram

groups
groups: Record<number, BindGroup>
Inherited from Shader.groups

padding
padding: number
The padding of the filter. Some filters require extra space to breath such as a blur. Increasing this will add extra width and height to the bounds of the object that the filter is applied to.

Default
0
Copy
resolution
resolution: number | "inherit"
The resolution of the filter. Setting this to be lower will lower the quality but increase the performance of the filter.

Default
1
Copy
resources
resources: Record<string, any>
A record of the resources used by the shader.

Inherited from Shader.resources

Readonlyuid
uid: number = ...
A unique identifier for the shader

Inherited from Shader.uid

StaticdefaultOptions
defaultOptions: FilterOptions = ...
The default filter settings

blendMode
get blendMode(): BLEND_MODES
Get the blend mode of the filter.

Returns BLEND_MODES
Default
"normal"
Copy
set blendMode(value: BLEND_MODES): void
Sets the blend mode of the filter.

Parameters
value: BLEND_MODES
Returns void
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
Inherited from Shader.addResource

apply
apply(
    filterManager: FilterSystem,
    input: Texture,
    output: RenderSurface,
    clearMode: boolean,
): void
Applies the filter

Parameters
filterManager: FilterSystem
The renderer to retrieve the filter from

input: Texture
The input render target.

output: RenderSurface
The target to output to.

clearMode: boolean
Should the output be cleared before rendering to it

Returns void
destroy
destroy(destroyPrograms?: boolean): void
Use to destroy the shader when its not longer needed. It will destroy the resources and remove listeners.

Parameters
destroyPrograms: boolean = false
if the programs should be destroyed as well. Make sure its not being used by other shaders!

Returns void
Inherited from Shader.destroy

Staticfrom
from(options: FilterOptions & ShaderFromResources): Filter
A short hand function to create a filter based of a vertex and fragment shader src.

Parameters
options: FilterOptions & ShaderFromResources
Returns Filter
A shiny new PixiJS filter!

Overrides Shader.from

FilterSystem
Class FilterSystemAdvanced
System that manages the filter pipeline

Implements
System
Constructors
C
constructor
Properties
P
renderer
Accessors
A
activeBackTexture
Methods
M
applyFilter
M
calculateSpriteMatrix
M
destroy
M
generateFilteredTexture
M
getBackTexture
constructor
new FilterSystem(renderer: Renderer): FilterSystem
Parameters
renderer: Renderer
Returns FilterSystem
Readonlyrenderer
renderer: Renderer
activeBackTexture
get activeBackTexture(): Texture<TextureSource<any>>
The back texture of the currently active filter. Requires the filter to have blendRequired set to true.

Returns Texture<TextureSource<any>>
applyFilter
applyFilter(
    filter: Filter,
    input: Texture,
    output: RenderSurface,
    clear: boolean,
): void
Applies a filter to a texture.

Parameters
filter: Filter
The filter to apply.

input: Texture
The input texture.

output: RenderSurface
The output render surface.

clear: boolean
Whether to clear the output surface before applying the filter.

Returns void
calculateSpriteMatrix
calculateSpriteMatrix(outputMatrix: Matrix, sprite: Sprite): Matrix
Multiply input normalized coordinates to this matrix to get sprite texture normalized coordinates.

Use outputMatrix * vTextureCoord in the shader.

Parameters
outputMatrix: Matrix
The matrix to output to.

sprite: Sprite
The sprite to map to.

Returns Matrix
The mapped matrix.

destroy
destroy(): void
Generic destroy methods to be overridden by the subclass

Returns void
Implementation of System.destroy

generateFilteredTexture
generateFilteredTexture(
    params: { filters: Filter[]; texture: Texture },
): Texture
Applies filters to a texture.

This method takes a texture and a list of filters, applies the filters to the texture, and returns the resulting texture.

Parameters
params: { filters: Filter[]; texture: Texture }
The parameters for applying filters.

filters: Filter[]
The filters to apply.

texture: Texture
The texture to apply filters to.

Returns Texture
The resulting texture after all filters have been applied.

Example
// Create a texture and a list of filters
const texture = new Texture(...);
const filters = [new BlurFilter(), new ColorMatrixFilter()];

// Apply the filters to the texture
const resultTexture = filterSystem.applyToTexture({ texture, filters });

// Use the resulting texture
sprite.texture = resultTexture;
Copy
Key Points:

padding is not currently supported here - so clipping may occur with filters that use padding.
If all filters are disabled or skipped, the original texture is returned.
getBackTexture
getBackTexture(
    lastRenderSurface: RenderTarget,
    bounds: Bounds,
    previousBounds?: Bounds,
): Texture<TextureSource<any>>
Copies the last render surface to a texture.

Parameters
lastRenderSurface: RenderTarget
The last render surface to copy from.

bounds: Bounds
The bounds of the area to copy.

OptionalpreviousBounds: Bounds
The previous bounds to use for offsetting the copy.

Returns Texture<TextureSource<any>>

Class AlphaFilter
Simplest filter - applies alpha.

Use this instead of Container's alpha property to avoid visual layering of individual elements. AlphaFilter applies alpha evenly across the entire display object and any opaque elements it contains. If elements are not opaque, they will blend with each other anyway.

Very handy if you want to use common features of all filters:

Assign a blendMode to this filter, blend all elements inside display object with background.

To use clipping in display coordinates, assign a filterArea to the same container that has this filter.

Example
import { AlphaFilter } from 'pixi.js';

const filter = new AlphaFilter({ alpha: 0.5 });
sprite.filters = filter;

// update alpha
filter.alpha = 0.8;
Copy
Hierarchy (View Summary, Expand)
Filter
AlphaFilter
Constructors
C
constructor
Properties
P
defaultOptions
Accessors
A
alpha
constructor
new AlphaFilter(options?: AlphaFilterOptions): AlphaFilter
Parameters
Optionaloptions: AlphaFilterOptions
Returns AlphaFilter
Overrides Filter.constructor

StaticdefaultOptions
defaultOptions: AlphaFilterOptions = ...
Default options for the AlphaFilter.

Example
AlphaFilter.defaultOptions = {
    alpha: 0.5, // Default alpha value
};
// Use default options
const filter = new AlphaFilter(); // Uses default alpha of 0.5
Copy
Overrides Filter.defaultOptions

alpha
get alpha(): number
The alpha value of the filter. Controls the transparency of the filtered display object.

Returns number
Example
// Create filter with initial alpha
const filter = new AlphaFilter({ alpha: 0.5 });

// Update alpha value dynamically
filter.alpha = 0.8;
Copy
Default
1
Copy
Remarks
0 = fully transparent
1 = fully opaque
Values are clamped between 0 and 1
set alpha(value: number): void
Parameters
value: number
Returns void


import { Application, Assets, BlurFilter, Sprite } from 'pixi.js';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  // Load the textures
  await Assets.load([
    'https://pixijs.com/assets/pixi-filters/bg_depth_blur.jpg',
    'https://pixijs.com/assets/pixi-filters/depth_blur_dudes.jpg',
    'https://pixijs.com/assets/pixi-filters/depth_blur_moby.jpg',
  ]);

  const bg = Sprite.from('https://pixijs.com/assets/pixi-filters/bg_depth_blur.jpg');

  bg.width = app.screen.width;
  bg.height = app.screen.height;
  app.stage.addChild(bg);

  const littleDudes = Sprite.from('https://pixijs.com/assets/pixi-filters/depth_blur_dudes.jpg');

  littleDudes.x = app.screen.width / 2 - 315;
  littleDudes.y = 200;
  app.stage.addChild(littleDudes);

  const littleRobot = Sprite.from('https://pixijs.com/assets/pixi-filters/depth_blur_moby.jpg');

  littleRobot.x = app.screen.width / 2 - 200;
  littleRobot.y = 100;
  app.stage.addChild(littleRobot);

  // Create the blur filters
  const blurFilter1 = new BlurFilter();
  const blurFilter2 = new BlurFilter();

  // Apply the filters to the sprites
  littleDudes.filters = [blurFilter1];
  littleRobot.filters = [blurFilter2];

  let count = 0;

  // Animate the blur filters
  app.ticker.add(() => {
    count += 0.005;

    const blurAmount = Math.cos(count);
    const blurAmount2 = Math.sin(count);

    blurFilter1.blur = 20 * blurAmount;
    blurFilter2.blur = 20 * blurAmount2;
  });
})();
import { Application, Assets, ColorMatrixFilter, Container, Sprite, Text } from 'pixi.js';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  // Load the textures
  await Assets.load([
    'https://pixijs.com/assets/bg_rotate.jpg',
    'https://pixijs.com/assets/bg_scene_rotate.jpg',
    'https://pixijs.com/assets/light_rotate_2.png',
    'https://pixijs.com/assets/light_rotate_1.png',
    'https://pixijs.com/assets/panda.png',
  ]);

  app.stage.eventMode = 'static';

  const bg = Sprite.from('https://pixijs.com/assets/bg_rotate.jpg');

  bg.anchor.set(0.5);

  bg.x = app.screen.width / 2;
  bg.y = app.screen.height / 2;

  const container = new Container();

  container.x = app.screen.width / 2;
  container.y = app.screen.height / 2;

  const bgFront = Sprite.from('https://pixijs.com/assets/bg_scene_rotate.jpg');

  bgFront.anchor.set(0.5);

  container.addChild(bgFront);

  const light2 = Sprite.from('https://pixijs.com/assets/light_rotate_2.png');

  light2.anchor.set(0.5);
  container.addChild(light2);

  const light1 = Sprite.from('https://pixijs.com/assets/light_rotate_1.png');

  light1.anchor.set(0.5);
  container.addChild(light1);

  const panda = Sprite.from('https://pixijs.com/assets/panda.png');

  panda.anchor.set(0.5);

  container.addChild(panda);

  app.stage.addChild(container);

  // Create a color matrix filter
  const filter = new ColorMatrixFilter();

  // Apply the Filter
  container.filters = [filter];

  let count = 0;
  let enabled = true;

  app.stage.on('pointertap', () => {
    enabled = !enabled;
    container.filters = enabled ? [filter] : null;
  });

  const help = new Text({
    text: 'Click or tap to turn filters on / off.',
    style: {
      fontFamily: 'Arial',
      fontSize: 12,
      fontWeight: 'bold',
      fill: 'white',
    },
  });

  help.y = app.screen.height - 25;
  help.x = 10;

  app.stage.addChild(help);

  app.ticker.add(() => {
    bg.rotation += 0.01;
    bgFront.rotation -= 0.01;
    light1.rotation += 0.02;
    light2.rotation += 0.01;

    panda.scale.x = 1 + Math.sin(count) * 0.04;
    panda.scale.y = 1 + Math.cos(count) * 0.04;

    count += 0.1;

    // Animate the filter
    const { matrix } = filter;

    matrix[1] = Math.sin(count) * 3;
    matrix[2] = Math.cos(count);
    matrix[3] = Math.cos(count) * 1.5;
    matrix[4] = Math.sin(count / 3) * 2;
    matrix[5] = Math.sin(count / 2);
    matrix[6] = Math.sin(count / 4);
  });
})();
import { Application, Assets, Container, DisplacementFilter, Point, Rectangle, Sprite } from 'pixi.js';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  // Load the textures
  await Assets.load([
    'https://pixijs.com/assets/maggot.png',
    'https://pixijs.com/assets/pixi-filters/displace.png',
    'https://pixijs.com/assets/pixi-filters/ring.png',
    'https://pixijs.com/assets/bg_grass.jpg',
  ]);

  app.stage.eventMode = 'static';

  const container = new Container();

  app.stage.addChild(container);

  const padding = 100;
  const bounds = new Rectangle(-padding, -padding, app.screen.width + padding * 2, app.screen.height + padding * 2);
  const maggots = [];

  for (let i = 0; i < 20; i++) {
    const maggot = Sprite.from('https://pixijs.com/assets/maggot.png');

    maggot.anchor.set(0.5);
    container.addChild(maggot);

    maggot.direction = Math.random() * Math.PI * 2;
    maggot.speed = 1;
    maggot.turnSpeed = Math.random() - 0.8;

    maggot.x = Math.random() * bounds.width;
    maggot.y = Math.random() * bounds.height;

    maggot.scale.set(1 + Math.random() * 0.3);
    maggot.original = new Point();
    maggot.original.copyFrom(maggot.scale);
    maggots.push(maggot);
  }

  const displacementSprite = Sprite.from('https://pixijs.com/assets/pixi-filters/displace.png');

  // Create a displacement filter
  const displacementFilter = new DisplacementFilter({ sprite: displacementSprite, scale: 150 });

  app.stage.addChild(displacementSprite);

  // Apply the filter
  container.filters = [displacementFilter];

  displacementSprite.anchor.set(0.5);

  const ring = Sprite.from('https://pixijs.com/assets/pixi-filters/ring.png');

  ring.anchor.set(0.5);

  ring.visible = false;

  app.stage.addChild(ring);

  const bg = Sprite.from('https://pixijs.com/assets/bg_grass.jpg');

  bg.width = app.screen.width;
  bg.height = app.screen.height;

  bg.alpha = 0.4;

  container.addChild(bg);

  app.stage.on('mousemove', onPointerMove).on('touchmove', onPointerMove);

  function onPointerMove(eventData) {
    ring.visible = true;

    displacementSprite.position.set(eventData.data.global.x - 25, eventData.data.global.y);
    ring.position.copyFrom(displacementSprite.position);
  }

  let count = 0;

  // Animate the maggots
  app.ticker.add(() => {
    count += 0.05;

    for (let i = 0; i < maggots.length; i++) {
      const maggot = maggots[i];

      maggot.direction += maggot.turnSpeed * 0.01;
      maggot.x += Math.sin(maggot.direction) * maggot.speed;
      maggot.y += Math.cos(maggot.direction) * maggot.speed;

      maggot.rotation = -maggot.direction - Math.PI / 2;
      maggot.scale.x = maggot.original.x + Math.sin(count) * 0.2;

      // wrap the maggots around as the crawl
      if (maggot.x < bounds.x) {
        maggot.x += bounds.width;
      } else if (maggot.x > bounds.x + bounds.width) {
        maggot.x -= bounds.width;
      }

      if (maggot.y < bounds.y) {
        maggot.y += bounds.height;
      } else if (maggot.y > bounds.y + bounds.height) {
        maggot.y -= bounds.height;
      }
    }
  });
})();
import { Application, Assets, Container, DisplacementFilter, Sprite, WRAP_MODES } from 'pixi.js';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  // Load the textures
  await Assets.load([
    'https://pixijs.com/assets/pixi-filters/flag.png',
    'https://pixijs.com/assets/pixi-filters/displacement_map_repeat.jpg',
  ]);

  app.stage.eventMode = 'static';

  const container = new Container();

  app.stage.addChild(container);

  const flag = Sprite.from('https://pixijs.com/assets/pixi-filters/flag.png');

  container.addChild(flag);
  flag.x = 100;
  flag.y = 100;

  const displacementSprite = Sprite.from('https://pixijs.com/assets/pixi-filters/displacement_map_repeat.jpg');

  // Make sure the sprite is wrapping.
  displacementSprite.texture.baseTexture.wrapMode = WRAP_MODES.REPEAT;

  // Create a displacement filter
  const displacementFilter = new DisplacementFilter({ sprite: displacementSprite, scale: { x: 60, y: 120 } });

  displacementFilter.padding = 10;

  displacementSprite.position = flag.position;

  app.stage.addChild(displacementSprite);

  // Apply the filter
  flag.filters = [displacementFilter];

  app.ticker.add(() => {
    // Offset the sprite position to make vFilterCoord update to larger value.
    // Repeat wrapping makes sure there's still pixels on the coordinates.
    displacementSprite.x++;
    // Reset x to 0 when it's over width to keep values from going to very huge numbers.
    if (displacementSprite.x > displacementSprite.width) {
      displacementSprite.x = 0;
    }
  });
})();
import { Application, Assets, Container, Filter, GlProgram, Point, Rectangle, Sprite } from 'pixi.js';
import fragment from './mouseBlending.frag';
import vertex from './mouseBlending.vert';

/**
 * https://github.com/pixijs/pixi.js/wiki/v5-Creating-Filters
 */

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ preference: 'webgl', resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  // Load the grass texture
  const texture = await Assets.load('https://pixijs.com/assets/bg_grass.jpg');

  // Create background image
  const background = new Sprite(texture);

  background.width = app.screen.width;
  background.height = app.screen.height;
  app.stage.addChild(background);

  // NOTE: this shader wont work on old devices where mediump precision is forced in fragment shader
  // because v5 default vertex shader uses `inputSize` in it. Same uniform in fragment and vertex shader
  // cant have different precision :(

  const container = new Container();

  container.filterArea = new Rectangle(100, 100, app.screen.width - 200, app.screen.height - 200);
  app.stage.addChild(container);

  const filter = new Filter({
    glProgram: new GlProgram({ vertex, fragment }),
    resources: {
      localUniforms: {
        uMouse: { value: new Point(), type: 'vec2<f32>' },
      },
    },
  });

  container.filters = [filter];

  app.stage.hitArea = app.screen;
  app.stage.eventMode = 'static';
  app.stage.on('pointermove', (event) => {
    filter.resources.localUniforms.uniforms.uMouse.copyFrom(event.global);
  });
})();
import { Application, Assets, Filter, GlProgram, Sprite } from 'pixi.js';
import fragment from './custom.frag';
import vertex from './custom.vert';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({
    resizeTo: window,
    hello: true,
    preference: 'webgl',
  });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  // Load the texture
  const texture = await Assets.load('https://pixijs.com/assets/bg_grass.jpg');

  // Create background image
  const background = Sprite.from(texture);

  background.width = app.screen.width;
  background.height = app.screen.height;
  app.stage.addChild(background);

  // Create the new filter, arguments: (vertexShader, framentSource)
  const filter = new Filter({
    glProgram: new GlProgram({
      fragment,
      vertex,
    }),
    resources: {
      timeUniforms: {
        uTime: { value: 0.0, type: 'f32' },
      },
    },
  });

  // === WARNING ===
  // specify uniforms in filter constructor
  // or set them BEFORE first use
  // filter.uniforms.customUniform = 0.0

  // Add the filter
  background.filters = [filter];

  // Animate the filter
  app.ticker.add((ticker) => {
    filter.resources.timeUniforms.uniforms.uTime += 0.04 * ticker.deltaTime;
  });
})();

PixiJS Filters
Node.js CI npm version

Compatibility
Depending on your version of PixiJS, you'll need to figure out which major version of PixiJS Filters to use.

PixiJS	PixiJS Filters
v5.x	v3.x
v6.x	v4.x
v7.x	v5.x
v8.x	v6.x
Installation
Installation is available using NPM:

npm install pixi-filters
Alternatively, you can use a CDN such as JSDelivr:

<script src="https://cdn.jsdelivr.net/npm/pixi-filters@latest/dist/browser/pixi-filters.min.js"></script>
If all else failes, you can manually download the bundled file from the releases section and include it in your project.

Demo
View the PixiJS Filters Demo to interactively play with filters to see how they work.

Filters
Filter	Preview
AdjustmentFilter
pixi-filters/adjustment
View demo	adjustment
AdvancedBloomFilter
pixi-filters/advanced-bloom
View demo	advanced-bloom
AsciiFilter
pixi-filters/ascii
View demo	ascii
BackdropBlurFilter
pixi-filters/backdrop-blur
View demo	backdrop-blur
BevelFilter
pixi-filters/bevel
View demo	bevel
BloomFilter
pixi-filters/bloom
View demo	bloom
BulgePinchFilter
pixi-filters/bulge-pinch
View demo	bulge-pinch
ColorGradientFilter
pixi-filters/color-gradient
View demo	color-gradient
ColorMapFilter
pixi-filters/color-map
View demo	color-map
ColorOverlayFilter
pixi-filters/color-overlay
View demo	color-overlay
ColorReplaceFilter
pixi-filters/color-replace
View demo	color-replace
ConvolutionFilter
pixi-filters/convolution
View demo	convolution
CrossHatchFilter
pixi-filters/cross-hatch
View demo	cross-hatch
CRTFilter
pixi-filters/crt
View demo	crt
DotFilter
pixi-filters/dot
View demo	dot
DropShadowFilter
pixi-filters/drop-shadow
View demo	drop-shadow
EmbossFilter
pixi-filters/emboss
View demo	emboss
GlitchFilter
pixi-filters/glitch
View demo	glitch
GlowFilter
pixi-filters/glow
View demo	glow
GodrayFilter
pixi-filters/godray
View demo	godray
GrayscaleFilter
pixi-filters/grayscale
View demo	grayscale
HslAdjustmentFilter
pixi-filters/hsl-adjustment
View demo	hsl-adjustment
KawaseBlurFilter
pixi-filters/kawase-blur
View demo	kawase-blur
MotionBlurFilter
pixi-filters/motion-blur
View demo	motion-blur
MultiColorReplaceFilter
pixi-filters/multi-color-replace
View demo	multi-color-replace
OldFilmFilter
pixi-filters/old-film
View demo	old-film
OutlineFilter
pixi-filters/outline
View demo	outline
PixelateFilter
pixi-filters/pixelate
View demo	pixelate
RadialBlurFilter
pixi-filters/radial-blur
View demo	radial-blur
ReflectionFilter
pixi-filters/reflection
View demo	reflection
RGBSplitFilter
pixi-filters/rgb-split
View demo	rgb split
ShockwaveFilter
pixi-filters/shockwave
View demo	shockwave
SimpleLightmapFilter
pixi-filters/simple-lightmap
View demo	simple-lightmap
SimplexNoiseFilter
pixi-filters/simplex-noise
View demo	simplex-noise
TiltShiftFilter
pixi-filters/tilt-shift
View demo	tilt-shift
TwistFilter
pixi-filters/twist
View demo	twist
ZoomBlurFilter
pixi-filters/zoom-blur
View demo	zoom-blur
Built-In Filters
PixiJS has a handful of core filters that are built-in to the PixiJS library.

Filter	Preview
AlphaFilter
View demo	alpha
BlurFilter
View demo	blur
ColorMatrixFilter (contrast)
View demo	color-matrix-contrast
ColorMatrixFilter (desaturate)
View demo	color-matrix-desaturate
ColorMatrixFilter (kodachrome)
View demo	color-matrix-kodachrome
ColorMatrixFilter (lsd)
View demo	color-matrix-lsd
ColorMatrixFilter (negative)
View demo	color-matrix-negative
ColorMatrixFilter (polaroid)
View demo	color-matrix-polaroid
ColorMatrixFilter (predator)
View demo	color-matrix-predator
ColorMatrixFilter (saturate)
View demo	color-matrix-saturate
ColorMatrixFilter (sepia)
View demo	color-matrix-sepia
DisplacementFilter
View demo	displacement
NoiseFilter
View demo	noise
