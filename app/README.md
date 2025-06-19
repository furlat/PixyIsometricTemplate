# Pixy Isometric Template

A modern, production-ready template for isometric games featuring an **infinite canvas system**, **reactive state management**, and **professional development tools**.

## 🚀 Core Technologies

- **PixiJS 8.x** - High-performance WebGL renderer with modern v8 API
- **TypeScript** - Strict type safety with centralized type definitions  
- **Valtio** - Reactive proxy-based state management
- **Vite** - Lightning-fast build tool with HMR
- **Tailwind CSS + DaisyUI** - Utility-first styling with component library
- **PostCSS + Autoprefixer** - Modern CSS processing pipeline

## ✨ Key Features

### 🎮 Infinite Canvas System
- **Pixeloid Coordinate System** - Custom grid-based units for precise positioning
- **Smooth Camera Controls** - WASD movement with configurable speed (50 pixeloids/sec)
- **Integer Zoom Levels** - Clean zoom from 10x to 100x pixels per pixeloid
- **Grid Visualization** - Dynamic checkered pattern with origin marker
- **Viewport Culling** - Efficient rendering of visible grid areas only

### 🔄 Reactive Architecture
- **Centralized State Store** - Valtio-powered reactive game state
- **Real-time UI Updates** - Automatic UI synchronization with store changes
- **Type-Safe Development** - Centralized type definitions in `src/types/`
- **Coordinate Transformations** - Dedicated helper for screen↔pixeloid conversions

### 🛠️ Professional Development Tools
- **Store Panel** - Real-time debugging interface for all application state
- **UI Control Bar** - Horizontal control center for toggling debug panels
- **Glassmorphic Design** - Modern backdrop-blur interface components
- **Extensible Architecture** - Ready for additional debug panels and tools

### 🎯 Input & Interaction
- **Multi-Input Support** - Keyboard (WASD + Space) and mouse wheel
- **Mouse Tracking** - Real-time cursor position in both screen and pixeloid coordinates
- **Responsive Design** - Automatic viewport size handling and camera adjustment
- **Input State Visualization** - Live display of all input states in debug panel

## 📦 Installation

```bash
npm install
```

## 🛠️ Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - the page opens automatically.

## 🏗️ Build

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 📁 Project Architecture

```
app/
├── src/
│   ├── game/                    # Core game systems
│   │   ├── Game.ts              # Main game class & PixiJS app lifecycle
│   │   ├── InfiniteCanvas.ts    # Infinite grid system & camera controls
│   │   ├── InputManager.ts      # Input handling & event management  
│   │   ├── CoordinateHelper.ts  # Coordinate transformation utilities
│   │   └── index.ts             # Game module exports
│   ├── store/                   # Reactive state management
│   │   └── gameStore.ts         # Valtio store & update functions
│   ├── types/                   # TypeScript definitions
│   │   └── index.ts             # Centralized type definitions
│   ├── ui/                      # User interface components
│   │   ├── StorePanel.ts        # Debug panel for store visualization
│   │   ├── UIControlBar.ts      # Horizontal control bar component
│   │   ├── handlers/            # UI utility functions
│   │   │   └── UIHandlers.ts    # Reusable UI formatting & update logic
│   │   └── index.ts             # UI module exports
│   ├── styles/                  # CSS & styling
│   │   ├── main.css             # Global styles & Tailwind directives
│   │   └── store-panel.css      # Store panel specific styles
│   └── main.ts                  # Application entry point
├── public/assets/               # Isometric game assets
│   ├── tiles/                   # Floor & block tiles
│   ├── walls/                   # Wall & window components  
│   ├── stairs/                  # Staircase elements
│   └── analysis_data/           # JSON metadata for each asset
├── index.html                   # HTML template with UI structure
├── package.json                 # Dependencies & scripts
├── tailwind.config.js           # Tailwind & DaisyUI configuration
├── postcss.config.js            # PostCSS pipeline setup
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite build configuration
└── README.md                   # This documentation
```

## 🎮 Game Development Guide

### Coordinate System

The template uses a **pixeloid coordinate system** where:
- 1 pixeloid = variable screen pixels (controlled by zoom level)
- Zoom levels: 10-100 pixels per pixeloid
- Origin (0,0) can be placed at top-left via Space key
- Screen coordinates automatically convert to/from pixeloid coordinates

```typescript
// Convert screen position to pixeloid coordinates
const pixeloidPos = infiniteCanvas.screenToPixeloid(mouseX, mouseY)

// Convert pixeloid position to screen coordinates  
const screenPos = infiniteCanvas.pixeloidToScreen(pixeloidX, pixeloidY)
```

### State Management

Reactive state management with Valtio:

```typescript
import { gameStore, updateGameStore } from './store/gameStore'

// Read reactive state
console.log(gameStore.camera.position) // { x: number, y: number }
console.log(gameStore.mousePixeloidPosition) // Current mouse in pixeloids

// Update state (triggers automatic UI updates)
updateGameStore.setCameraPosition(10, 5)
updateGameStore.updateMousePosition(clientX, clientY)
```

### Camera Controls

The infinite canvas provides smooth camera movement:

```typescript
// Camera moves at 50 pixeloids per second
// WASD keys control movement direction
// Mouse wheel controls zoom (integer levels 10-100)
// Space key recenters to place (0,0) at top-left

// Manual camera control
infiniteCanvas.updateCamera(deltaTime)
infiniteCanvas.handleZoom(wheelDelta)
```

### Adding New UI Components

The template's control bar system is designed for extensibility:

```typescript
// 1. Create your component class
export class MyDebugPanel {
  public toggle(): void { /* toggle visibility */ }
  public getVisible(): boolean { /* return state */ }
}

// 2. Register with control bar
const myPanel = new MyDebugPanel()
uiControlBar.registerMyPanel(myPanel) // Add to UIControlBar.ts

// 3. Add button to HTML control bar
<button id="toggle-my-panel" class="btn btn-sm btn-primary rounded-full">
  <span class="button-text">My Panel</span>
</button>
```

### Working with Assets

Pre-structured isometric assets are included:

```typescript
// Assets organized by category:
// - tiles/ (floors, blocks, garden elements)
// - walls/ (walls, windows, doors, arches)  
// - stairs/ (straight, L-shaped, chunks)

// Each asset includes:
// - PNG image file
// - JSON analysis data with dimensions & metadata

// Example: Loading a floor tile
const texture = await Assets.load('/assets/tiles/Floor_01.png')
const metadata = await fetch('/assets/analysis_data/tiles/Floor_01_analysis.json')
```

## 🎨 Styling & Theming

### Custom Dark Theme
The template uses a custom DaisyUI dark theme with carefully chosen colors:
- **Primary**: `#00d9ff` (Cyan) - Main actions & highlights
- **Secondary**: `#00a96e` (Green) - Secondary actions
- **Accent**: `#ff6b35` (Orange) - Attention & mouse tracking
- **Base**: `#0f172a` (Dark Blue) - Background & surfaces

### Status Color System
Consistent color coding for different data types:
- **Success Green**: Active states, true values
- **Warning Yellow**: Camera & position data  
- **Accent Orange**: Mouse & interaction data
- **Info Blue**: System information
- **Muted Gray**: Inactive states, false values

### Glassmorphic UI
Modern glass-effect interface with:
- `backdrop-blur-md` for background blur effects
- `bg-base-100/95` for semi-transparent surfaces
- Smooth animations with custom Tailwind keyframes
- Responsive design with mobile-first approach

## 🔧 Configuration

### TypeScript Configuration
- Strict mode enabled for maximum type safety
- Path alias `@/` maps to `src/`
- Modern ES2020+ target with module resolution

### Vite Configuration  
- Auto-open development server on port 3000
- Source maps enabled for debugging
- Optimized build output with tree shaking

### Tailwind Configuration
- Custom animations (fade-in, slide-in, pulse-slow)
- Extended font family with JetBrains Mono
- DaisyUI integration with custom dark theme
- Component layer for reusable UI patterns

## 🎯 Development Workflow

### Debug Tools Usage
1. **Store Panel** - Monitor all application state in real-time
   - System status (initialized, loading, current scene)
   - Camera data (position, zoom, viewport corners)
   - Mouse tracking (screen & pixeloid coordinates)
   - Input states (WASD + Space key status)

2. **UI Control Bar** - Toggle debug panels
   - Located at top-center of screen
   - Expandable for additional debug tools
   - Color-coded active/inactive states

3. **Browser DevTools** - Advanced debugging
   - Valtio store inspection in console
   - PixiJS scene graph debugging
   - Performance monitoring with renderer stats

### Hot Module Replacement
- Instant feedback during development
- State preservation across code changes
- CSS updates without page reload
- TypeScript compilation in watch mode

## 📖 Resources

- [PixiJS 8.x Documentation](https://pixijs.download/dev/docs/index.html)
- [Valtio Documentation](https://valtio.pmnd.rs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [DaisyUI Components](https://daisyui.com/components/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this template for your projects!

---

**Ready to build your isometric game?** This template provides a solid foundation with professional development tools, reactive architecture, and modern web technologies. Start by exploring the Store Panel to understand the real-time data flow, then dive into the game systems to implement your vision.