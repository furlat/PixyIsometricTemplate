# Phase 3A Dependency Leak Analysis

## Critical Issue Found

Our Phase 3A implementation was supposed to be completely isolated, but it's accidentally importing OLD UI components that depend on the missing `gameStore.ts`.

## Root Cause

In `app/src/main.ts` line 4:
```typescript
import { UIControlBar, LayerToggleBar } from './ui'
```

These are the OLD UI components that have dependencies on the old gameStore:

### LayerToggleBar.ts (Line 1)
```typescript
import { updateGameStore } from '../store/gameStore'  // ❌ This file doesn't exist
```

### UIControlBar.ts 
- Has no direct gameStore import but expects old UI components as dependencies

## The Problem Chain

1. **main.ts** imports old `UIControlBar` and `LayerToggleBar` from `./ui`
2. **LayerToggleBar.ts** imports `updateGameStore` from `../store/gameStore`
3. **gameStore.ts** doesn't exist (renamed to `gameStore.ts.backup`)
4. **Vite fails** because it can't resolve the import

## Solution

Phase 3A should be completely isolated and NOT import ANY old UI components. We need to:

### Option 1: Remove Old UI Component Dependencies
Remove the problematic imports from `main.ts`:

```typescript
// ❌ Remove these - they depend on old gameStore
import { UIControlBar, LayerToggleBar } from './ui'

// ✅ Keep only Phase 3A specific components
import { StorePanel_3a } from './ui/StorePanel_3a'
```

### Option 2: Create Phase 3A Specific UI Components
Create isolated versions:
- `UIControlBar_3a.ts` - No gameStore dependencies
- `LayerToggleBar_3a.ts` - Uses `gameStore_3a` instead

## Why This Happened

We assumed Phase 3A was isolated, but we accidentally imported old UI components that have hidden dependencies on the old architecture.

## Fix Strategy

Phase 3A should handle its own UI logic directly in `main.ts` without depending on ANY old UI components. This maintains complete isolation.

## Files That Need Changes

1. `app/src/main.ts` - Remove old UI component imports
2. Handle UI logic directly in main.ts using `gameStore_3a_methods`
3. Test that Phase 3A runs without ANY old dependencies

This ensures our Phase 3A foundation is truly isolated and doesn't accidentally pull in the old system.