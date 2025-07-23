/**
 * MeshVertexHelper - Helper functions for converting geometric shapes to mesh vertex data
 * Provides vertex, UV, and index calculations for all geometric shapes used in GeometryRenderer
 */

export interface MeshVertexData {
  vertices: Float32Array
  uvs: Float32Array
  indices: Uint32Array
}

/**
 * Calculate vertices for a rectangle shape
 * Returns 4 vertices forming 2 triangles
 */
export function calculateRectangleVertices(
  x: number, 
  y: number, 
  width: number, 
  height: number
): MeshVertexData {
  // 4 vertices for rectangle corners
  const vertices = new Float32Array([
    x, y,                    // Top-left
    x + width, y,            // Top-right  
    x + width, y + height,   // Bottom-right
    x, y + height           // Bottom-left
  ])
  
  // UV coordinates for texture mapping
  const uvs = new Float32Array([
    0, 0,  // Top-left
    1, 0,  // Top-right
    1, 1,  // Bottom-right
    0, 1   // Bottom-left
  ])
  
  // Indices for 2 triangles (counter-clockwise winding)
  const indices = new Uint32Array([
    0, 1, 2,  // First triangle
    0, 2, 3   // Second triangle
  ])
  
  return { vertices, uvs, indices }
}

/**
 * Calculate vertices for a circle shape
 * Uses tessellation with configurable segment count
 */
export function calculateCircleVertices(
  centerX: number,
  centerY: number, 
  radius: number,
  segments: number = 32
): MeshVertexData {
  // Center vertex + perimeter vertices
  const vertexCount = segments + 1
  const vertices = new Float32Array(vertexCount * 2)
  const uvs = new Float32Array(vertexCount * 2)
  
  // Center vertex
  vertices[0] = centerX
  vertices[1] = centerY
  uvs[0] = 0.5
  uvs[1] = 0.5
  
  // Perimeter vertices
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    
    vertices[(i + 1) * 2] = x
    vertices[(i + 1) * 2 + 1] = y
    
    // UV coordinates map to unit circle
    uvs[(i + 1) * 2] = 0.5 + Math.cos(angle) * 0.5
    uvs[(i + 1) * 2 + 1] = 0.5 + Math.sin(angle) * 0.5
  }
  
  // Indices for triangles from center to perimeter
  const indices = new Uint32Array(segments * 3)
  for (let i = 0; i < segments; i++) {
    const nextI = (i + 1) % segments
    indices[i * 3] = 0          // Center vertex
    indices[i * 3 + 1] = i + 1  // Current perimeter vertex
    indices[i * 3 + 2] = nextI + 1  // Next perimeter vertex
  }
  
  return { vertices, uvs, indices }
}

/**
 * Calculate vertices for a line shape
 * Creates a thick line as a rectangle with specified thickness
 */
export function calculateLineVertices(
  startX: number,
  startY: number,
  endX: number, 
  endY: number,
  thickness: number = 1
): MeshVertexData {
  // Calculate line direction and perpendicular
  const dx = endX - startX
  const dy = endY - startY
  const length = Math.sqrt(dx * dx + dy * dy)
  
  if (length === 0) {
    // Degenerate line - return point
    return calculatePointVertices(startX, startY, thickness)
  }
  
  // Normalized direction and perpendicular vectors
  const dirX = dx / length
  const dirY = dy / length
  const perpX = -dirY * thickness * 0.5
  const perpY = dirX * thickness * 0.5
  
  // 4 vertices for thick line rectangle
  const vertices = new Float32Array([
    startX + perpX, startY + perpY,  // Start top
    endX + perpX, endY + perpY,      // End top
    endX - perpX, endY - perpY,      // End bottom
    startX - perpX, startY - perpY   // Start bottom
  ])
  
  // UV coordinates along the line
  const uvs = new Float32Array([
    0, 0,  // Start top
    1, 0,  // End top
    1, 1,  // End bottom
    0, 1   // Start bottom
  ])
  
  // Indices for 2 triangles
  const indices = new Uint32Array([
    0, 1, 2,  // First triangle
    0, 2, 3   // Second triangle
  ])
  
  return { vertices, uvs, indices }
}

/**
 * Calculate vertices for a point shape
 * Creates a small circle for point visualization
 */
export function calculatePointVertices(
  x: number,
  y: number, 
  radius: number = 2,
  segments: number = 8
): MeshVertexData {
  // Reuse circle calculation with small radius
  return calculateCircleVertices(x, y, radius, segments)
}

/**
 * Calculate vertices for a diamond shape
 * Uses 4 vertices in isometric diamond configuration
 * anchorX = west vertex X position, anchorY = center Y position (east/west level)
 */
export function calculateDiamondVertices(
  anchorX: number,
  anchorY: number,
  width: number,
  height: number
): MeshVertexData {
  // Calculate center position for north/south vertices
  const centerX = anchorX + width / 2
  
  const vertices = new Float32Array([
    anchorX, anchorY,              // West vertex
    centerX, anchorY - height,     // North vertex
    anchorX + width, anchorY,      // East vertex
    centerX, anchorY + height      // South vertex
  ])
  
  // UV coordinates for diamond
  const uvs = new Float32Array([
    0, 0.5,    // West
    0.5, 0,    // North
    1, 0.5,    // East
    0.5, 1     // South
  ])
  
  // Indices for 2 triangles forming diamond
  const indices = new Uint32Array([
    0, 1, 2,  // West-North-East triangle
    0, 2, 3   // West-East-South triangle
  ])
  
  return { vertices, uvs, indices }
}

/**
 * Calculate vertices for a polygon shape
 * Generic polygon tessellation using ear clipping algorithm
 */
export function calculatePolygonVertices(points: { x: number, y: number }[]): MeshVertexData {
  if (points.length < 3) {
    throw new Error('Polygon must have at least 3 points')
  }
  
  // Simple fan triangulation for convex polygons
  const vertices = new Float32Array(points.length * 2)
  const uvs = new Float32Array(points.length * 2)
  
  // Calculate bounding box for UV mapping
  let minX = points[0].x, maxX = points[0].x
  let minY = points[0].y, maxY = points[0].y
  
  for (const point of points) {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  }
  
  const width = maxX - minX
  const height = maxY - minY
  
  // Set vertices and UV coordinates
  for (let i = 0; i < points.length; i++) {
    vertices[i * 2] = points[i].x
    vertices[i * 2 + 1] = points[i].y
    
    // Map to UV space [0,1]
    uvs[i * 2] = width > 0 ? (points[i].x - minX) / width : 0
    uvs[i * 2 + 1] = height > 0 ? (points[i].y - minY) / height : 0
  }
  
  // Fan triangulation from first vertex
  const triangleCount = points.length - 2
  const indices = new Uint32Array(triangleCount * 3)
  
  for (let i = 0; i < triangleCount; i++) {
    indices[i * 3] = 0      // First vertex
    indices[i * 3 + 1] = i + 1  // Current vertex
    indices[i * 3 + 2] = i + 2  // Next vertex
  }
  
  return { vertices, uvs, indices }
}

/**
 * Utility function to combine multiple mesh vertex data into a single mesh
 * Useful for batching multiple shapes into one draw call
 */
export function combineMeshVertexData(meshDataArray: MeshVertexData[]): MeshVertexData {
  if (meshDataArray.length === 0) {
    return {
      vertices: new Float32Array(0),
      uvs: new Float32Array(0),
      indices: new Uint32Array(0)
    }
  }
  
  if (meshDataArray.length === 1) {
    return meshDataArray[0]
  }
  
  // Calculate total sizes
  let totalVertices = 0
  let totalIndices = 0
  
  for (const meshData of meshDataArray) {
    totalVertices += meshData.vertices.length
    totalIndices += meshData.indices.length
  }
  
  // Combine all data
  const combinedVertices = new Float32Array(totalVertices)
  const combinedUvs = new Float32Array(totalVertices)
  const combinedIndices = new Uint32Array(totalIndices)
  
  let vertexOffset = 0
  let indexOffset = 0
  let vertexIndexOffset = 0
  
  for (const meshData of meshDataArray) {
    // Copy vertices and UVs
    combinedVertices.set(meshData.vertices, vertexOffset)
    combinedUvs.set(meshData.uvs, vertexOffset)
    
    // Copy indices with offset
    for (let i = 0; i < meshData.indices.length; i++) {
      combinedIndices[indexOffset + i] = meshData.indices[i] + vertexIndexOffset
    }
    
    vertexOffset += meshData.vertices.length
    indexOffset += meshData.indices.length
    vertexIndexOffset += meshData.vertices.length / 2 // 2 coordinates per vertex
  }
  
  return {
    vertices: combinedVertices,
    uvs: combinedUvs,
    indices: combinedIndices
  }
}

/**
 * Calculate vertices for rectangle stroke outline
 * Creates 4 thick lines forming the rectangle border
 */
export function calculateRectangleStrokeVertices(
  x: number,
  y: number,
  width: number,
  height: number,
  strokeWidth: number
): MeshVertexData {
  const halfStroke = strokeWidth * 0.5
  
  // Create 4 rectangles for each side of the border
  const topLine = calculateRectangleVertices(x - halfStroke, y - halfStroke, width + strokeWidth, strokeWidth)
  const rightLine = calculateRectangleVertices(x + width - halfStroke, y + halfStroke, strokeWidth, height - strokeWidth)
  const bottomLine = calculateRectangleVertices(x - halfStroke, y + height - halfStroke, width + strokeWidth, strokeWidth)
  const leftLine = calculateRectangleVertices(x - halfStroke, y + halfStroke, strokeWidth, height - strokeWidth)
  
  return combineMeshVertexData([topLine, rightLine, bottomLine, leftLine])
}

/**
 * Calculate vertices for circle stroke outline
 * Creates a ring/annulus shape (outer circle minus inner circle)
 */
export function calculateCircleStrokeVertices(
  centerX: number,
  centerY: number,
  radius: number,
  strokeWidth: number,
  segments: number = 32
): MeshVertexData {
  const outerRadius = radius + strokeWidth * 0.5
  const innerRadius = Math.max(0, radius - strokeWidth * 0.5)
  
  // Create vertices for ring
  const vertexCount = segments * 2 // Inner and outer vertices
  const vertices = new Float32Array(vertexCount * 2)
  const uvs = new Float32Array(vertexCount * 2)
  
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    
    // Outer vertex
    vertices[i * 4] = centerX + cos * outerRadius
    vertices[i * 4 + 1] = centerY + sin * outerRadius
    uvs[i * 4] = 0.5 + cos * 0.5
    uvs[i * 4 + 1] = 0.5 + sin * 0.5
    
    // Inner vertex
    vertices[i * 4 + 2] = centerX + cos * innerRadius
    vertices[i * 4 + 3] = centerY + sin * innerRadius
    uvs[i * 4 + 2] = 0.5 + cos * 0.3 // Slightly smaller UV for inner ring
    uvs[i * 4 + 3] = 0.5 + sin * 0.3
  }
  
  // Indices for ring triangles
  const indices = new Uint32Array(segments * 6)
  for (let i = 0; i < segments; i++) {
    const nextI = (i + 1) % segments
    const outerCurrent = i * 2
    const innerCurrent = i * 2 + 1
    const outerNext = nextI * 2
    const innerNext = nextI * 2 + 1
    
    // Two triangles per segment
    indices[i * 6] = outerCurrent
    indices[i * 6 + 1] = innerCurrent
    indices[i * 6 + 2] = outerNext
    
    indices[i * 6 + 3] = innerCurrent
    indices[i * 6 + 4] = innerNext
    indices[i * 6 + 5] = outerNext
  }
  
  return { vertices, uvs, indices }
}

/**
 * Calculate vertices for diamond stroke outline
 * Creates 4 thick lines forming the diamond border
 * anchorX = west vertex X position, anchorY = center Y position (east/west level)
 */
export function calculateDiamondStrokeVertices(
  anchorX: number,
  anchorY: number,
  width: number,
  height: number,
  strokeWidth: number
): MeshVertexData {
  // Calculate center position for north/south vertices
  const centerX = anchorX + width / 2
  
  // Diamond vertices
  const west = { x: anchorX, y: anchorY }
  const north = { x: centerX, y: anchorY - height }
  const east = { x: anchorX + width, y: anchorY }
  const south = { x: centerX, y: anchorY + height }
  
  // Create 4 lines for diamond edges
  const topLine = calculateLineVertices(west.x, west.y, north.x, north.y, strokeWidth)
  const rightLine = calculateLineVertices(north.x, north.y, east.x, east.y, strokeWidth)
  const bottomLine = calculateLineVertices(east.x, east.y, south.x, south.y, strokeWidth)
  const leftLine = calculateLineVertices(south.x, south.y, west.x, west.y, strokeWidth)
  
  return combineMeshVertexData([topLine, rightLine, bottomLine, leftLine])
}