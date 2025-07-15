# DELETED REACT HOOKS - ARCHITECTURE MISMATCH

The following React hooks were incorrectly created for a vanilla TypeScript + Valtio application:

## Deleted Files:
- `useECSDataLayer.ts` - React hook for data layer (WRONG ARCHITECTURE)
- `useECSMirrorLayer.ts` - React hook for mirror layer (WRONG ARCHITECTURE)

## Correct Architecture:
This is a **vanilla TypeScript + PixiJS + Valtio** application:
- Uses `proxy()` from Valtio for reactive state
- UI classes use `subscribe(gameStore, () => { this.updateValues() })`
- Direct DOM manipulation, no React components

## Phase 2C Implementation:
Should create vanilla TypeScript coordination controller that follows the existing Valtio + DOM pattern.