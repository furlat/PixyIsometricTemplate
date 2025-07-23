/**
 * Geometry Transform Test Script - Isolated Math Testing
 * 
 * Tests the vertex authority architecture with clean forward/backward transforms
 * No PIXI dependencies, no store dependencies - pure geometry math
 */

// ================================
// TYPES
// ================================

type Coordinate = { x: number, y: number }

type CircleProperties = {
  center: Coordinate
  radius: number
  diameter: number
  circumference: number
  area: number
}

type RectangleProperties = {
  center: Coordinate
  width: number
  height: number
  topLeft: Coordinate
  bottomRight: Coordinate
  area: number
  perimeter: number
}

type DiamondProperties = {
  center: Coordinate
  width: number
  height: number
  west: Coordinate
  north: Coordinate
  east: Coordinate
  south: Coordinate
  area: number
  perimeter: number
}

// ================================
// FORWARD TRANSFORMS: vertices → properties
// ================================

/**
 * Compute circle properties from vertices (8 circumference points)
 */
function computeCircleProperties(vertices: Coordinate[]): CircleProperties {
  if (vertices.length < 8) {
    throw new Error('Circle requires 8 vertices')
  }
  
  // Use simple centroid for center (more stable than circumcenter)
  const center = {
    x: vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length,
    y: vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length
  }
  
  // Calculate radius as average distance from center to all vertices
  const distances = vertices.map(v => 
    Math.sqrt(Math.pow(v.x - center.x, 2) + Math.pow(v.y - center.y, 2))
  )
  const radius = distances.reduce((sum, d) => sum + d, 0) / distances.length
  
  return {
    center,
    radius,
    diameter: radius * 2,
    circumference: 2 * Math.PI * radius,
    area: Math.PI * radius * radius
  }
}

/**
 * Compute rectangle properties from 4 corner vertices
 */
function computeRectangleProperties(vertices: Coordinate[]): RectangleProperties {
  if (vertices.length !== 4) {
    throw new Error('Rectangle requires 4 vertices')
  }
  
  // Find min/max coordinates
  const xs = vertices.map(v => v.x)
  const ys = vertices.map(v => v.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  
  const topLeft = { x: minX, y: minY }
  const bottomRight = { x: maxX, y: maxY }
  const width = maxX - minX
  const height = maxY - minY
  const center = {
    x: minX + width / 2,
    y: minY + height / 2
  }
  
  return {
    center,
    width,
    height,
    topLeft,
    bottomRight,
    area: width * height,
    perimeter: 2 * (width + height)
  }
}

/**
 * Compute diamond properties from 4 cardinal vertices [west, north, east, south]
 */
function computeDiamondProperties(vertices: Coordinate[]): DiamondProperties {
  if (vertices.length !== 4) {
    throw new Error('Diamond requires 4 vertices')
  }
  
  const [west, north, east, south] = vertices
  
  const center = {
    x: (west.x + east.x) / 2,
    y: (north.y + south.y) / 2
  }
  
  const width = east.x - west.x
  const height = south.y - north.y
  
  return {
    center,
    width,
    height,
    west,
    north,
    east,
    south,
    area: (width * height) / 2, // Diamond area formula
    perimeter: 2 * Math.sqrt(Math.pow(width/2, 2) + Math.pow(height/2, 2))
  }
}

// ================================
// BACKWARD TRANSFORMS: properties → vertices
// ================================

/**
 * Generate circle vertices from properties (8 circumference points)
 */
function computeCircleVertices(props: CircleProperties): Coordinate[] {
  const { center, radius } = props
  const vertices: Coordinate[] = []
  
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8
    vertices.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    })
  }
  
  return vertices
}

/**
 * Generate rectangle vertices from properties [topLeft, topRight, bottomRight, bottomLeft]
 */
function computeRectangleVertices(props: RectangleProperties): Coordinate[] {
  const { center, width, height } = props
  const halfWidth = width / 2
  const halfHeight = height / 2
  
  return [
    { x: center.x - halfWidth, y: center.y - halfHeight }, // top-left
    { x: center.x + halfWidth, y: center.y - halfHeight }, // top-right
    { x: center.x + halfWidth, y: center.y + halfHeight }, // bottom-right
    { x: center.x - halfWidth, y: center.y + halfHeight }  // bottom-left
  ]
}

/**
 * Generate diamond vertices from properties [west, north, east, south]
 */
function computeDiamondVertices(props: DiamondProperties): Coordinate[] {
  const { center, width, height } = props
  const halfWidth = width / 2
  const halfHeight = height / 2
  
  return [
    { x: center.x - halfWidth, y: center.y },             // west
    { x: center.x, y: center.y - halfHeight },            // north  
    { x: center.x + halfWidth, y: center.y },             // east
    { x: center.x, y: center.y + halfHeight }             // south
  ]
}

// ================================
// TESTING UTILITIES
// ================================

function coordinatesEqual(a: Coordinate, b: Coordinate, tolerance = 0.001): boolean {
  return Math.abs(a.x - b.x) < tolerance && Math.abs(a.y - b.y) < tolerance
}

function verticesEqual(a: Coordinate[], b: Coordinate[], tolerance = 0.001): boolean {
  if (a.length !== b.length) return false
  return a.every((coord, i) => coordinatesEqual(coord, b[i], tolerance))
}

function propertiesEqual(a: any, b: any, tolerance = 0.001): boolean {
  for (const key in a) {
    if (typeof a[key] === 'object' && a[key] !== null) {
      if (!coordinatesEqual(a[key], b[key], tolerance)) return false
    } else if (typeof a[key] === 'number') {
      if (Math.abs(a[key] - b[key]) >= tolerance) return false
    }
  }
  return true
}

// ================================
// TEST FUNCTIONS
// ================================

function testCircle(testName: string, properties: CircleProperties): boolean {
  console.log(`\n=== TESTING CIRCLE: ${testName} ===`)
  
  console.log('Input properties:', properties)
  
  // Forward: properties → vertices
  const vertices = computeCircleVertices(properties)
  console.log('Generated vertices:', vertices)
  
  // Backward: vertices → properties
  const recomputed = computeCircleProperties(vertices)
  console.log('Recomputed properties:', recomputed)
  
  // Check invertibility
  const isInvertible = propertiesEqual(properties, recomputed, 0.001)
  
  console.log('✓ Test Result:', isInvertible ? 'PASS' : 'FAIL')
  if (!isInvertible) {
    console.log('❌ Properties do not match!')
    console.log('Original center:', properties.center)
    console.log('Recomputed center:', recomputed.center)
    console.log('Original radius:', properties.radius)
    console.log('Recomputed radius:', recomputed.radius)
  }
  
  return isInvertible
}

function testRectangle(testName: string, properties: RectangleProperties): boolean {
  console.log(`\n=== TESTING RECTANGLE: ${testName} ===`)
  
  console.log('Input properties:', properties)
  
  // Forward: properties → vertices
  const vertices = computeRectangleVertices(properties)
  console.log('Generated vertices:', vertices)
  
  // Backward: vertices → properties  
  const recomputed = computeRectangleProperties(vertices)
  console.log('Recomputed properties:', recomputed)
  
  // Check invertibility
  const isInvertible = propertiesEqual(properties, recomputed, 0.001)
  
  console.log('✓ Test Result:', isInvertible ? 'PASS' : 'FAIL')
  if (!isInvertible) {
    console.log('❌ Properties do not match!')
  }
  
  return isInvertible
}

function testDiamond(testName: string, properties: DiamondProperties): boolean {
  console.log(`\n=== TESTING DIAMOND: ${testName} ===`)
  
  console.log('Input properties:', properties)
  
  // Forward: properties → vertices
  const vertices = computeDiamondVertices(properties)
  console.log('Generated vertices:', vertices)
  
  // Backward: vertices → properties
  const recomputed = computeDiamondProperties(vertices)
  console.log('Recomputed properties:', recomputed)
  
  // Check invertibility
  const isInvertible = propertiesEqual(properties, recomputed, 0.001)
  
  console.log('✓ Test Result:', isInvertible ? 'PASS' : 'FAIL')
  if (!isInvertible) {
    console.log('❌ Properties do not match!')
  }
  
  return isInvertible
}

// ================================
// RUN ALL TESTS
// ================================

function runAllTests(): void {
  console.log('🧪 GEOMETRY TRANSFORM INVERTIBILITY TESTS')
  console.log('==========================================')
  
  let totalTests = 0
  let passedTests = 0
  
  // Circle tests
  totalTests++
  if (testCircle('Basic Circle', {
    center: { x: 100, y: 100 },
    radius: 50,
    diameter: 100,
    circumference: 2 * Math.PI * 50,
    area: Math.PI * 50 * 50
  })) passedTests++
  
  totalTests++
  if (testCircle('Bug Case - Radius 100→78', {
    center: { x: 0, y: 0 },
    radius: 100,
    diameter: 200,
    circumference: 2 * Math.PI * 100,
    area: Math.PI * 100 * 100
  })) passedTests++
  
  totalTests++
  if (testCircle('Small Circle', {
    center: { x: 25, y: 25 },
    radius: 10,
    diameter: 20,
    circumference: 2 * Math.PI * 10,
    area: Math.PI * 10 * 10
  })) passedTests++
  
  // Rectangle tests
  totalTests++
  if (testRectangle('Basic Rectangle', {
    center: { x: 50, y: 50 },
    width: 100,
    height: 60,
    topLeft: { x: 0, y: 20 },
    bottomRight: { x: 100, y: 80 },
    area: 100 * 60,
    perimeter: 2 * (100 + 60)
  })) passedTests++
  
  totalTests++
  if (testRectangle('Bug Case - Flying Rectangle', {
    center: { x: 0, y: 0 },
    width: 50,
    height: 30,
    topLeft: { x: -25, y: -15 },
    bottomRight: { x: 25, y: 15 },
    area: 50 * 30,
    perimeter: 2 * (50 + 30)
  })) passedTests++
  
  // Diamond tests
  totalTests++
  if (testDiamond('Basic Diamond', {
    center: { x: 0, y: 0 },
    width: 40,
    height: 20,
    west: { x: -20, y: 0 },
    north: { x: 0, y: -10 },
    east: { x: 20, y: 0 },
    south: { x: 0, y: 10 },
    area: (40 * 20) / 2,
    perimeter: 2 * Math.sqrt(Math.pow(20, 2) + Math.pow(10, 2))
  })) passedTests++
  
  totalTests++
  if (testDiamond('Bug Case - Isometric Ratios', {
    center: { x: 100, y: 100 },
    width: 60,
    height: 30, // 2:1 isometric ratio
    west: { x: 70, y: 100 },
    north: { x: 100, y: 85 },
    east: { x: 130, y: 100 },
    south: { x: 100, y: 115 },
    area: (60 * 30) / 2,
    perimeter: 2 * Math.sqrt(Math.pow(30, 2) + Math.pow(15, 2))
  })) passedTests++
  
  // Final results
  console.log('\n🎯 FINAL RESULTS')
  console.log('================')
  console.log(`✅ Tests passed: ${passedTests}/${totalTests}`)
  console.log(`❌ Tests failed: ${totalTests - passedTests}/${totalTests}`)
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED!')
    console.log('✅ Geometry transforms are perfectly invertible')
    console.log('✅ The bug is NOT in the geometry math')
    console.log('✅ The bug is in how the store/UI uses these transforms')
  } else {
    console.log('\n💥 TESTS FAILED!')
    console.log('❌ Geometry transforms have invertibility issues')
    console.log('❌ The bug IS in the geometry math')
    console.log('❌ Need to fix the transform algorithms')
  }
}

// Run the tests
runAllTests()