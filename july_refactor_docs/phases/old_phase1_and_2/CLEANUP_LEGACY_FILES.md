# Cleanup Legacy Files - PowerShell Commands

## 🎯 **Overview**

This document provides PowerShell commands to clean up legacy files and organize the project structure based on the Phase 3 actual readiness analysis. The cleanup includes:

1. **Phase 3 Documentation Cleanup** - Move old Phase 3 docs to archive folder
2. **Legacy Store/Types Backup** - Rename unused store and types files to .backup
3. **Project Organization** - Clean up the workspace for actual Phase 3 implementation

## 📁 **Phase 3 Documentation Cleanup**

### **Files to Keep (Current and Useful)**
```powershell
# These files should remain in july_refactor_docs/phases/
# ✅ PHASE_3_ACTUAL_READINESS_ANALYSIS.md - Current readiness analysis
# ✅ PHASE_3_COMPLETE_ROADMAP.md - Comprehensive roadmap (might be useful)
```

### **Files to Move to old_phase3 Archive**
```powershell
# Create old_phase3 directory
New-Item -ItemType Directory -Path "july_refactor_docs\phases\old_phase3" -Force

# Move outdated Phase 3 documents
Move-Item "july_refactor_docs\phases\PHASE_3_INTEGRATION_IMPLEMENTATION_PLAN.md" "july_refactor_docs\phases\old_phase3\"
Move-Item "july_refactor_docs\phases\PHASE_3_MVP_PRAGMATIC_APPROACH.md" "july_refactor_docs\phases\old_phase3\"
Move-Item "july_refactor_docs\phases\PHASE_3_CURRENT_APP_ANALYSIS.md" "july_refactor_docs\phases\old_phase3\"
Move-Item "july_refactor_docs\phases\PHASE_3_FIRST_PRINCIPLES_MVP.md" "july_refactor_docs\phases\old_phase3\"
Move-Item "july_refactor_docs\phases\PHASE_3_REVISED_MVP_SALVAGE_APPROACH.md" "july_refactor_docs\phases\old_phase3\"
Move-Item "july_refactor_docs\phases\PHASE_3_FINAL_LAYER_HIERARCHY.md" "july_refactor_docs\phases\old_phase3\"
Move-Item "july_refactor_docs\phases\PHASE_3_MESH_DATA_ARCHITECTURE.md" "july_refactor_docs\phases\old_phase3\"
Move-Item "july_refactor_docs\phases\PHASE_3_READINESS_ANALYSIS_scrapped.md" "july_refactor_docs\phases\old_phase3\"
```

### **Files That May Need Assessment**
```powershell
# Check if PHASE_3_COMPREHENSIVE_ROADMAP.md exists and decide whether to keep or move
if (Test-Path "july_refactor_docs\phases\PHASE_3_COMPREHENSIVE_ROADMAP.md") {
    # Move to old_phase3 if it's outdated
    Move-Item "july_refactor_docs\phases\PHASE_3_COMPREHENSIVE_ROADMAP.md" "july_refactor_docs\phases\old_phase3\"
}
```

## 🗂️ **Legacy Store and Types Cleanup**

### **Current Architecture Analysis**

Based on the Phase-by-Phase Implementation Analysis, the **current, production-ready files** are:

#### **✅ Keep (Current ECS Architecture)**
```powershell
# These files are part of the current ECS architecture - DO NOT BACKUP
# app/src/types/ecs-coordinates.ts
# app/src/types/ecs-data-layer.ts
# app/src/types/ecs-mirror-layer.ts
# app/src/types/ecs-coordination.ts
# app/src/types/mesh-system.ts
# app/src/types/filter-pipeline.ts
# app/src/types/index.ts
# app/src/store/ecs-data-layer-store.ts
# app/src/store/ecs-data-layer-integration.ts
# app/src/store/ecs-mirror-layer-store.ts
# app/src/store/ecs-mirror-layer-integration.ts
# app/src/store/ecs-coordination-controller.ts
# app/src/store/ecs-coordination-functions.ts
# app/src/store/ecs-system-validator.ts
# app/src/store/gameStore.ts (still in use, will be modified in Phase 3)
```

#### **🔍 Check for Legacy Files to Backup**

```powershell
# Check for any legacy or unused files that should be backed up
# These would be files that are NOT part of the current ECS architecture

# Check store/types directory for any legacy files
$legacyStoreFiles = Get-ChildItem "app\src\store\" -Name | Where-Object {
    $_ -notmatch "ecs-" -and 
    $_ -ne "gameStore.ts" -and 
    $_ -ne "hooks" -and 
    $_ -ne "types" -and 
    $_ -ne "utils"
}

# Check types directory for any legacy files
$legacyTypeFiles = Get-ChildItem "app\src\types\" -Name | Where-Object {
    $_ -notmatch "ecs-" -and 
    $_ -ne "mesh-system.ts" -and 
    $_ -ne "filter-pipeline.ts" -and 
    $_ -ne "index.ts"
}

# Display findings
Write-Host "Legacy store files found:"
$legacyStoreFiles | ForEach-Object { Write-Host "  - $_" }

Write-Host "Legacy type files found:"
$legacyTypeFiles | ForEach-Object { Write-Host "  - $_" }
```

#### **⚠️ Likely Legacy Files to Backup**

Based on common patterns, these files might be legacy and should be backed up:

```powershell
# Backup legacy store files (if they exist)
if (Test-Path "app\src\store\legacy-store.ts") {
    Rename-Item "app\src\store\legacy-store.ts" "app\src\store\legacy-store.ts.backup"
}

# Backup legacy type files (if they exist)
if (Test-Path "app\src\types\legacy-types.ts") {
    Rename-Item "app\src\types\legacy-types.ts" "app\src\types\legacy-types.ts.backup"
}

# Check for any files with "old" or "legacy" in the name
Get-ChildItem "app\src\store\" -Name | Where-Object { $_ -match "old|legacy" } | ForEach-Object {
    if (-not $_.EndsWith(".backup")) {
        Rename-Item "app\src\store\$_" "app\src\store\$_.backup"
        Write-Host "Backed up: app\src\store\$_"
    }
}

Get-ChildItem "app\src\types\" -Name | Where-Object { $_ -match "old|legacy" } | ForEach-Object {
    if (-not $_.EndsWith(".backup")) {
        Rename-Item "app\src\types\$_" "app\src\types\$_.backup"
        Write-Host "Backed up: app\src\types\$_"
    }
}
```

## 🎯 **Complete Cleanup Script**

### **Run This Complete Script**

```powershell
# ================================
# COMPLETE CLEANUP SCRIPT
# ================================

Write-Host "=== PHASE 3 CLEANUP STARTING ===" -ForegroundColor Green

# 1. Create old_phase3 directory
Write-Host "Creating old_phase3 directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "july_refactor_docs\phases\old_phase3" -Force

# 2. Move outdated Phase 3 documents
Write-Host "Moving outdated Phase 3 documents..." -ForegroundColor Yellow
$phase3FilesToMove = @(
    "PHASE_3_INTEGRATION_IMPLEMENTATION_PLAN.md",
    "PHASE_3_MVP_PRAGMATIC_APPROACH.md",
    "PHASE_3_CURRENT_APP_ANALYSIS.md",
    "PHASE_3_FIRST_PRINCIPLES_MVP.md",
    "PHASE_3_REVISED_MVP_SALVAGE_APPROACH.md",
    "PHASE_3_FINAL_LAYER_HIERARCHY.md",
    "PHASE_3_MESH_DATA_ARCHITECTURE.md",
    "PHASE_3_READINESS_ANALYSIS_scrapped.md",
    "PHASE_3_COMPREHENSIVE_ROADMAP.md"
)

foreach ($file in $phase3FilesToMove) {
    $sourcePath = "july_refactor_docs\phases\$file"
    if (Test-Path $sourcePath) {
        Move-Item $sourcePath "july_refactor_docs\phases\old_phase3\"
        Write-Host "  Moved: $file" -ForegroundColor Cyan
    } else {
        Write-Host "  Not found: $file" -ForegroundColor Gray
    }
}

# 3. Check for legacy files to backup
Write-Host "Checking for legacy files to backup..." -ForegroundColor Yellow

# Check store directory
$storeDir = "app\src\store"
if (Test-Path $storeDir) {
    Get-ChildItem $storeDir -Name | Where-Object { 
        $_ -match "old|legacy" -and -not $_.EndsWith(".backup") 
    } | ForEach-Object {
        Rename-Item "$storeDir\$_" "$storeDir\$_.backup"
        Write-Host "  Backed up: store\$_" -ForegroundColor Cyan
    }
}

# Check types directory
$typesDir = "app\src\types"
if (Test-Path $typesDir) {
    Get-ChildItem $typesDir -Name | Where-Object { 
        $_ -match "old|legacy" -and -not $_.EndsWith(".backup") 
    } | ForEach-Object {
        Rename-Item "$typesDir\$_" "$typesDir\$_.backup"
        Write-Host "  Backed up: types\$_" -ForegroundColor Cyan
    }
}

# 4. Display final status
Write-Host "=== CLEANUP COMPLETE ===" -ForegroundColor Green
Write-Host "Current Phase 3 files:" -ForegroundColor Yellow
Get-ChildItem "july_refactor_docs\phases" -Name | Where-Object { $_ -match "PHASE_3" } | ForEach-Object {
    Write-Host "  ✅ $_" -ForegroundColor Green
}

Write-Host "Archived Phase 3 files:" -ForegroundColor Yellow
Get-ChildItem "july_refactor_docs\phases\old_phase3" -Name | ForEach-Object {
    Write-Host "  📁 $_" -ForegroundColor Gray
}

Write-Host "=== READY FOR PHASE 3 IMPLEMENTATION ===" -ForegroundColor Green
```

## 📊 **Final Project Structure**

After cleanup, the project should have:

### **Current Phase 3 Files (Keep)**
```
july_refactor_docs/phases/
├── PHASE_3_ACTUAL_READINESS_ANALYSIS.md ✅ (Current readiness analysis)
└── PHASE_3_COMPLETE_ROADMAP.md ✅ (Comprehensive roadmap - if useful)
```

### **Archived Phase 3 Files**
```
july_refactor_docs/phases/old_phase3/
├── PHASE_3_INTEGRATION_IMPLEMENTATION_PLAN.md
├── PHASE_3_MVP_PRAGMATIC_APPROACH.md
├── PHASE_3_CURRENT_APP_ANALYSIS.md
├── PHASE_3_FIRST_PRINCIPLES_MVP.md
├── PHASE_3_REVISED_MVP_SALVAGE_APPROACH.md
├── PHASE_3_FINAL_LAYER_HIERARCHY.md
├── PHASE_3_MESH_DATA_ARCHITECTURE.md
├── PHASE_3_READINESS_ANALYSIS_scrapped.md
└── PHASE_3_COMPREHENSIVE_ROADMAP.md
```

### **Current ECS Architecture Files (Keep)**
```
app/src/types/
├── ecs-coordinates.ts ✅
├── ecs-data-layer.ts ✅
├── ecs-mirror-layer.ts ✅
├── ecs-coordination.ts ✅
├── mesh-system.ts ✅
├── filter-pipeline.ts ✅
└── index.ts ✅

app/src/store/
├── ecs-data-layer-store.ts ✅
├── ecs-data-layer-integration.ts ✅
├── ecs-mirror-layer-store.ts ✅
├── ecs-mirror-layer-integration.ts ✅
├── ecs-coordination-controller.ts ✅
├── ecs-coordination-functions.ts ✅
├── ecs-system-validator.ts ✅
└── gameStore.ts ✅
```

## 🎉 **Ready for Phase 3**

After running this cleanup:
- ✅ **Phase 3 documentation is organized** with only current files
- ✅ **Legacy files are backed up** (if any existed)
- ✅ **ECS architecture is intact** and ready for integration
- ✅ **Project structure is clean** and ready for Phase 3 implementation

The project is now ready for **Phase 3: Main System Integration** as defined in the **PHASE_3_ACTUAL_READINESS_ANALYSIS.md**.