# PixiJS Isometric Template - Implementation TODO

Based on the detailed study of [`docs/app.md`](docs/app.md), here's what needs to be implemented for a proper modern PixiJS v8+ application:

## 🚨 Critical Issues to Fix

### 1. **"Illegal Invocation" Errors**
- [ ] Use proper latest stable versions (not bleeding edge "latest")
- [ ] Fix Application initialization with correct modern API
- [ ] Ensure proper plugin registration and usage
- [ ] Use correct Text API (avoid deprecated constructor patterns)

### 2. **Modern Application Setup**
- [ ] Implement proper async `app.init()` pattern (✅ partially done)
- [ ] Use correct ApplicationOptions interface
- [ ] Add proper error handling and fallbacks

## 🔧 Core Plugins Implementation

### 3. **TickerPlugin Integration** 
- [ ] Configure `autoStart` and `sharedTicker` options properly
- [ ] Use `app.ticker.add()` for game loop instead of manual render calls
- [ ] Implement proper ticker-based animation system
- [ ] Add FPS monitoring and delta time usage
- [ ] Use `UPDATE_PRIORITY` for proper update order

### 4. **ResizePlugin Integration**
- [ ] Use `resizeTo: window` option in app.init()
- [ ] Remove manual resize handling code
- [ ] Let PixiJS handle responsive behavior automatically
- [ ] Test resize behavior on different screen sizes

### 5. **CullerPlugin Integration** (Performance Optimization)
- [ ] Add CullerPlugin for off-screen object culling
- [ ] Configure `cullable` and `cullableChildren` properties
- [ ] Set up proper `cullArea` for containers with many children
- [ ] Test performance improvements with large numbers of objects

## 📱 Responsive Design

### 6. **Modern Responsive Setup**
- [ ] Replace manual resize logic with PixiJS ResizePlugin
- [ ] Use `autoDensity: true` for device pixel ratio handling
- [ ] Configure proper `resolution` handling
- [ ] Test on different device pixel ratios

## 🎮 Game Architecture

### 7. **Scene Management System**
- [ ] Create proper scene container hierarchy
- [ ] Implement scene switching with proper cleanup
- [ ] Use `app.stage` as root container correctly
- [ ] Add scene preloading and asset management

### 8. **State Management Integration**
- [ ] Better integration between Valtio store and PixiJS lifecycle
- [ ] Store ticker reference and timing info in state
- [ ] Add proper cleanup when destroying application
- [ ] Sync application state with PixiJS events

## 🛠️ Technical Implementation

### 9. **Modern PixiJS v8+ API Usage**
- [ ] Use new Text constructor: `new Text({ text: "...", style: ... })`
- [ ] Use proper TextStyle with correct property names
- [ ] Implement modern Application configuration options
- [ ] Use `preference: 'webgl'` or `'webgpu'` correctly

### 10. **Package Management**
- [ ] Use specific stable versions instead of "latest"
- [ ] Suggested versions:
  - `"pixi.js": "^8.4.1"` (latest stable 8.x)
  - `"valtio": "^1.13.2"` (latest stable 1.x)
  - `"vite": "^5.4.10"` (latest stable 5.x)
  - `"typescript": "^5.6.3"` (latest stable 5.x)

### 11. **Application Lifecycle**
- [ ] Proper initialization sequence:
  1. Create Application instance
  2. Await app.init() with all options
  3. Append canvas to DOM
  4. Set up scenes and content
  5. Use built-in ticker system
- [ ] Proper cleanup with `app.destroy()` options
- [ ] Handle application pause/resume states

## 🎯 Isometric Game Foundation

### 12. **Isometric Helper Systems**
- [ ] Create isometric coordinate conversion utilities
- [ ] Implement isometric camera/viewport system
- [ ] Add isometric tile/grid helper classes
- [ ] Create depth sorting system for isometric objects

### 13. **Performance Optimizations**
- [ ] Use CullerPlugin for large worlds
- [ ] Implement object pooling for frequently created/destroyed objects
- [ ] Use `app.ticker` efficiently with proper priority system
- [ ] Add texture atlasing for isometric tiles/sprites

## 📚 Code Quality

### 14. **Error Handling**
- [ ] Add proper try-catch blocks around async operations
- [ ] Implement graceful fallbacks for WebGL/WebGPU failures
- [ ] Add validation for required DOM elements
- [ ] Proper TypeScript error types

### 15. **Documentation**
- [ ] Update README with correct modern PixiJS patterns
- [ ] Add code comments explaining plugin usage
- [ ] Document isometric coordinate system
- [ ] Add examples of proper ticker usage

## 🧪 Testing & Validation

### 16. **Browser Compatibility**
- [ ] Test WebGL vs WebGPU preference handling
- [ ] Validate on different screen sizes and pixel ratios
- [ ] Test performance with many objects (CullerPlugin validation)
- [ ] Cross-browser testing for "Illegal invocation" fixes

## 📋 Implementation Priority

**Phase 1 (Critical - Fix Current Issues):**
- Fix package versions and "Illegal invocation" errors
- Implement proper modern Application initialization
- Fix Text API usage

**Phase 2 (Core Features):**
- Implement TickerPlugin properly
- Add ResizePlugin integration  
- Basic scene management

**Phase 3 (Performance & Polish):**
- Add CullerPlugin
- Implement isometric helpers
- Performance optimizations

**Phase 4 (Enhancement):**
- Advanced features
- Better error handling
- Documentation improvements

---

## 💡 Key Insights from docs/app.md:

1. **Modern Pattern**: `const app = new Application(); await app.init({...})`
2. **Plugin-Based**: TickerPlugin, ResizePlugin, CullerPlugin are key
3. **Automatic Management**: Let PixiJS handle ticker and resize instead of manual
4. **Performance**: Use built-in culling and proper update priorities
5. **Responsive**: Use `resizeTo` option instead of manual resize handling