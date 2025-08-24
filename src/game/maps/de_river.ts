// TS-ignore for all file because this is vibe coded
// @ts-nocheck

import { randomInt } from '../../utils/math'
import { TileCodeGrid } from '../world/tileCodes'

// Map generation configuration
const MAP_SIZE = 312
const RIVER_WIDTH_MIN = 0
const RIVER_WIDTH_MAX = 3
const FOREST_DENSITY = 0.7
const STONE_DENSITY = 0.4 // Significantly increase from 0.03
const NOISE_SCALE = 0.03
const MIN_LAKES = 2 // Min number of lakes
const MAX_LAKES = 5 // Max number of lakes
const FORCE_STONE_COUNT = 300 // Force this many stones to appear
const LAKE_SIZE_MIN = 0
const LAKE_SIZE_MAX = 25
const RIVER_POINTS_MIN = 20
const RIVER_POINTS_MAX = 50

// For multi-layer noise - creates more natural patterns
const DETAIL_NOISE_SCALE = 0.03
const LARGE_SCALE_NOISE = 0.02

// Tile types
const WATER = 'W'
const GRASS = '.'
const FOREST = 'F'
const STONE = '#'
const SAND = '_'

// New configuration options for natural border
const BORDER_MIN_WIDTH = 12
const BORDER_MAX_WIDTH = 20
const BORDER_NOISE_SCALE = 0.1
const BORDER_IRREGULARITY = 4 // Higher values = more irregular borders

// Add these new parameters at the top with the other constants
const RIVER_SMOOTHNESS = 8 // Higher values = smoother rivers
const RIVER_MEANDERING = 2.5 // Higher values = more meandering rivers
const RIVER_CURVE_TENSION = 0.5 // Controls curvature (0.5 is natural, higher values create sharper curves)

// Add these new parameters for river system and enhanced stones
const RIVER_COUNT = 1 // Number of main rivers to generate
const BRANCH_CHANCE = 0.7 // Probability of a river having branches (0-1)
const MAX_BRANCHES_PER_RIVER = 10 // Maximum branches per river
const BRANCH_LENGTH_FACTOR = 5 // How long branches are compared to main river (0-1)

// Stone formation parameters for less blocky, more natural look
const STONE_SMOOTHING = 0.7 // Higher values = smoother stone formations
const STONE_CLUSTER_MIN_SIZE = 1 // Minimum size for stone clusters
const STONE_CLUSTER_MAX_SIZE = 22 // Maximum size for stone clusters
const STONE_SMALL_DETAIL_NOISE = 0.25 // Amount of small detail in stone formations

// Add these new constants for sandy plains and enhanced river features
const SANDY_PLAINS_DENSITY = 0.3 // How much of non-water terrain is sandy
const SANDY_PLAINS_SIZE_MIN = 15 // Min size of sand regions
const SANDY_PLAINS_SIZE_MAX = 40 // Max size of sand regions
const SANDY_PLAINS_COUNT = 12 // Number of sandy regions to generate
const RIVER_VARIANCE_FACTOR = 0.8 // How much river width can vary (0-1)
const BRANCH_WIDTH_FACTOR = 0.4 // Branch width compared to main river

// Update these constants for more natural sand formations
const SAND_NOISE_SCALE = 0.08 // Base noise scale for sand regions
const SAND_DETAIL_SCALE = 0.2 // Detail noise scale for sand regions
const SAND_MICRO_SCALE = 0.5 // Micro detail scale for sand edges
const SAND_SHAPE_VARIETY = 0.7 // How much the base shape can vary (0-1)
const SAND_EDGE_ROUGHNESS = 0.6 // How rough/irregular sand edges are (0-1)

// Add constants for additional random sand features
const RANDOM_SAND_PATCHES_COUNT = 20 // Number of small random sand patches to add
const RANDOM_SAND_CHANCE = 0.4 // Chance for a lake to have sandy shores
const SANDY_OASIS_COUNT = 3 // Number of sandy oasis spots to create
const DESERT_PATCH_CHANCE = 0.15 // Chance to create a desert-like area on the map

/**
 * Shows a console progress bar
 */
function showProgress(step: string, current: number, total: number) {
    const percent = Math.floor((current / total) * 100)
    const bar =
        '#'.repeat(Math.floor(percent / 5)) + '-'.repeat(20 - Math.floor(percent / 5))
    console.log(`[${bar}] ${percent}% - ${step}`)
}

/**
 * Enhanced multi-octave noise implementation for more natural terrain
 */
class EnhancedNoise {
    private seeds: number[] = []

    constructor(baseSeed = Math.random() * 10000) {
        // Generate multiple seeds for different octaves of noise
        for (let i = 0; i < 4; i++) {
            this.seeds.push(baseSeed * (i + 1) * 1.5)
        }
    }

    // Basic noise function
    private simpleNoise(x: number, y: number, seed: number): number {
        const X = Math.floor(x) & 255
        const Y = Math.floor(y) & 255
        const value = Math.sin(X * 12.9898 + Y * 78.233 + seed) * 43758.5453
        return (value - Math.floor(value)) * 2 - 1
    }

    /**
     * Get noise value with multiple octaves for more natural detail
     * This creates more natural-looking patterns with both large and small features
     */
    public noise(x: number, y: number): number {
        let value = 0
        let amplitude = 1
        let frequency = 1
        let totalAmplitude = 0

        // Combine multiple noise frequencies
        for (let i = 0; i < this.seeds.length; i++) {
            value +=
                this.simpleNoise(x * frequency, y * frequency, this.seeds[i]) * amplitude
            totalAmplitude += amplitude
            amplitude *= 0.5 // Each successive layer has less influence
            frequency *= 2 // Each successive layer has more detail
        }

        // Normalize result to -1 to 1 range
        return value / totalAmplitude
    }

    /**
     * Get noise with specific parameters for terrain features
     */
    public terrainNoise(
        x: number,
        y: number,
        scale: number,
        octaves: number = 3,
    ): number {
        let value = 0
        let amplitude = 1
        let frequency = 1
        let totalAmplitude = 0

        for (let i = 0; i < Math.min(octaves, this.seeds.length); i++) {
            value +=
                this.simpleNoise(
                    x * frequency * scale,
                    y * frequency * scale,
                    this.seeds[i],
                ) * amplitude
            totalAmplitude += amplitude
            amplitude *= 0.5
            frequency *= 2
        }

        return value / totalAmplitude
    }

    /**
     * Special version that creates ridged noise, good for coastlines and transitions
     */
    public ridgedNoise(x: number, y: number, scale: number): number {
        // Get basic multi-octave noise
        let noise = this.terrainNoise(x, y, scale)

        // Transform into ridged noise (1 - abs())
        noise = 1 - Math.abs(noise)
        noise = noise * noise // Square to emphasize ridges

        return noise
    }
}

/**
 * Generate a procedural map with a river running through it
 */
function generateRiverMap(): string[][] {
    console.log('Starting map generation...')

    // Create empty map with grass
    console.log('Creating base map...')
    const map: string[][] = Array(MAP_SIZE)
        .fill(0)
        .map(() => Array(MAP_SIZE).fill(GRASS))

    // Create base terrain using noise
    console.log('Generating base terrain...')
    const baseNoiseGen = new EnhancedNoise(Math.random() * 10000)
    const detailNoiseGen = new EnhancedNoise(Math.random() * 20000)

    // Add natural border with varying width
    console.log('Adding natural border...')
    createNaturalBorder(map, baseNoiseGen)

    // Generate multiple rivers rather than a single one
    console.log('Generating river system...')
    generateRiverSystem(map, baseNoiseGen)

    // Add sandy plains before adding other terrain features
    console.log('Adding sandy plains...')
    addSandyPlains(map, baseNoiseGen)

    // Add random sand patches throughout the map
    console.log('Adding random sand patches...')
    addRandomSandPatches(map, detailNoiseGen)

    // Generate a random number of lakes
    const lakeCount = randomInt(MIN_LAKES, MAX_LAKES)
    console.log(`Adding ${lakeCount} lakes...`)
    for (let i = 0; i < lakeCount; i++) {
        showProgress('Creating lake', i + 1, lakeCount)
        // Pass addSand parameter randomly to sometimes create sandy shores
        createNaturalLake(
            map,
            randomInt(LAKE_SIZE_MIN, LAKE_SIZE_MAX),
            baseNoiseGen,
            false,
            Math.random() < RANDOM_SAND_CHANCE,
        )
    }

    // Pre-place stones BEFORE forests to ensure they appear
    console.log('Pre-placing stone formations...')
    forcePlaceStones(map, detailNoiseGen)

    // Distribute forests and stones using multi-layer noise
    console.log('Adding terrain features...')
    const forestNoiseGen = new EnhancedNoise(Math.random() * 30000)
    const stoneNoiseGen = new EnhancedNoise(Math.random() * 40000)

    const totalCells = MAP_SIZE * MAP_SIZE
    let cellsProcessed = 0
    let lastPercent = 0

    // Pre-calculate a terrain suitability layer
    // This will help forests and stones appear in more natural groupings
    const terrainSuitability = Array(MAP_SIZE)
        .fill(0)
        .map(() => Array(MAP_SIZE).fill(0))

    // Calculate terrain suitability first
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            // Skip water tiles
            if (map[y][x] === WATER) continue

            // Multi-layer noise for more natural patterns
            const largeScale =
                baseNoiseGen.noise(x * LARGE_SCALE_NOISE, y * LARGE_SCALE_NOISE) * 0.6
            const mediumScale =
                detailNoiseGen.noise(x * NOISE_SCALE, y * NOISE_SCALE) * 0.3
            const smallScale =
                detailNoiseGen.noise(x * DETAIL_NOISE_SCALE, y * DETAIL_NOISE_SCALE) * 0.1

            terrainSuitability[y][x] = largeScale + mediumScale + smallScale
        }
    }

    // Use terrain suitability to place features
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            cellsProcessed++

            // Show progress updates every 10%
            const percent = Math.floor((cellsProcessed / totalCells) * 100)
            if (percent % 10 === 0 && percent !== lastPercent) {
                showProgress('Generating terrain', cellsProcessed, totalCells)
                lastPercent = percent
            }

            // Skip if already water, stone, or border
            if (
                map[y][x] === WATER ||
                map[y][x] === STONE || // Skip if already stone
                x === 0 ||
                x === MAP_SIZE - 1 ||
                y === 0 ||
                y === MAP_SIZE - 1
            )
                continue

            // Base suitability from pre-calculated layer
            const baseSuitability = terrainSuitability[y][x]

            // Calculate distance to water - features often cluster differently near water
            let waterDistance = 100
            for (let dy = -10; dy <= 10; dy++) {
                for (let dx = -10; dx <= 10; dx++) {
                    const nx = x + dx
                    const ny = y + dy
                    if (
                        nx >= 0 &&
                        nx < MAP_SIZE &&
                        ny >= 0 &&
                        ny < MAP_SIZE &&
                        map[ny][nx] === WATER
                    ) {
                        const dist = Math.sqrt(dx * dx + dy * dy)
                        waterDistance = Math.min(waterDistance, dist)
                    }
                }
            }

            // Forests tend to grow better near water but not too close
            const waterFactor = waterDistance < 2 ? 0 : waterDistance < 6 ? 0.3 : 0.1

            // Add specific noise for forest and stone distributions
            const forestNoise = forestNoiseGen.terrainNoise(
                x * NOISE_SCALE * 0.7,
                y * NOISE_SCALE * 0.7,
                1,
                4,
            )
            const stoneNoise = stoneNoiseGen.terrainNoise(
                x * NOISE_SCALE * 1.2,
                y * NOISE_SCALE * 1.2,
                1,
                3,
            )

            // Calculate final values with all factors
            const forestValue = forestNoise * 0.6 + baseSuitability * 0.3 + waterFactor
            const stoneValue =
                stoneNoise * 0.7 + baseSuitability * 0.2 + (1.0 - waterFactor) * 0.1

            // Use threshold values that correspond to desired densities
            // CHECK FOR STONE FIRST to give it priority
            if (stoneValue > 0.85) {
                // Higher threshold for clear stone clusters
                map[y][x] = STONE
            } else if (forestValue > 1.0 - FOREST_DENSITY) {
                map[y][x] = FOREST
            }
        }
    }

    // Add organic transitions around terrain features
    console.log('Adding feature transitions...')
    addOrganicTransitions(map, detailNoiseGen)

    // Add some natural shorelines with noise
    console.log('Refining shorelines...')
    addNaturalShorelines(map, detailNoiseGen)

    // Add natural stone formations
    console.log('Adding natural stone formations...')
    addStoneFormations(map, baseNoiseGen, stoneNoiseGen, terrainSuitability)

    // After terrain generation, do a pass to refine transitions
    console.log('Refining terrain transitions...')
    refineTerrainTransitions(map, detailNoiseGen)

    console.log('Map generation complete!')
    return map
}

/**
 * Force a minimum number of stone tiles to appear on the map
 */
function forcePlaceStones(map: string[][], noiseGen: EnhancedNoise) {
    console.log(`Ensuring at least ${FORCE_STONE_COUNT} stones appear on the map...`)

    // Track how many stones we've placed
    let stonesPlaced = 0
    let attempts = 0

    // First create major stone clusters
    while (stonesPlaced < FORCE_STONE_COUNT && attempts < FORCE_STONE_COUNT * 2) {
        attempts++

        // Pick a random location that isn't water
        const x = randomInt(20, MAP_SIZE - 20)
        const y = randomInt(20, MAP_SIZE - 20)

        if (map[y][x] !== WATER) {
            // Create a stone cluster here
            const clusterSize = randomInt(5, 15)
            const stonesInCluster = placeStoneCluster(map, x, y, clusterSize, noiseGen)
            stonesPlaced += stonesInCluster
        }

        if (attempts % 50 === 0) {
            showProgress('Placing stones', stonesPlaced, FORCE_STONE_COUNT)
        }
    }

    console.log(`Placed ${stonesPlaced} stones in ${attempts} attempts`)
}

/**
 * Place a stone cluster and return how many stones were placed
 */
function placeStoneCluster(
    map: string[][],
    centerX: number,
    centerY: number,
    radius: number,
    noiseGen: EnhancedNoise,
): number {
    let stonesPlaced = 0

    // Base cluster
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const nx = centerX + dx
            const ny = centerY + dy

            // Skip out of bounds or water
            if (
                nx < 0 ||
                nx >= MAP_SIZE ||
                ny < 0 ||
                ny >= MAP_SIZE ||
                map[ny][nx] === WATER
            ) {
                continue
            }

            // Calculate distance from center
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist > radius) continue

            // Use noise for organic shape
            const noise = noiseGen.noise(nx * 0.2, ny * 0.2) * 0.5

            // Core of the cluster is solid
            if (dist < radius * 0.5) {
                map[ny][nx] = STONE
                stonesPlaced++
            }
            // Outer parts are noisier
            else if (0.7 - dist / radius > noise) {
                map[ny][nx] = STONE
                stonesPlaced++
            }
        }
    }

    // Add some standalone stones around the cluster
    for (let i = 0; i < radius * 2; i++) {
        const angle = Math.random() * Math.PI * 2
        const distance = radius * (1.0 + Math.random() * 0.5)
        const x = Math.floor(centerX + Math.cos(angle) * distance)
        const y = Math.floor(centerY + Math.sin(angle) * distance)

        if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE && map[y][x] !== WATER) {
            map[y][x] = STONE
            stonesPlaced++
        }
    }

    return stonesPlaced
}

/**
 * Add organic transitions around terrain features to avoid blocky appearance
 */
function addOrganicTransitions(map: string[][], noiseGen: EnhancedNoise) {
    // First pass: Identify feature edges
    const edgeTiles: Array<{ x: number; y: number; type: string }> = []

    for (let y = 1; y < MAP_SIZE - 1; y++) {
        for (let x = 1; x < MAP_SIZE - 1; x++) {
            if (map[y][x] === FOREST || map[y][x] === STONE) {
                // Check if this is an edge tile (has a different neighbor)
                let isEdge = false
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue
                        if (map[y + dy][x + dx] !== map[y][x]) {
                            isEdge = true
                            break
                        }
                    }
                    if (isEdge) break
                }

                if (isEdge) {
                    edgeTiles.push({ x, y, type: map[y][x] })
                }
            }
        }
    }

    // Second pass: Add or remove tiles around edges based on noise for organic transitions
    for (const edgeTile of edgeTiles) {
        const { x, y, type } = edgeTile

        // Process surrounding tiles to add organic transitions
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                if (dx === 0 && dy === 0) continue

                const nx = x + dx
                const ny = y + dy

                if (nx <= 0 || nx >= MAP_SIZE - 1 || ny <= 0 || ny >= MAP_SIZE - 1)
                    continue
                if (map[ny][nx] === WATER) continue

                // Calculate distance from the edge tile
                const dist = Math.sqrt(dx * dx + dy * dy)
                if (dist > 2.5) continue

                // Use noise to decide whether to extend the feature
                const noiseValue = noiseGen.noise(nx * 0.3, ny * 0.3)

                // The closer to the edge, the more likely to extend the feature
                const threshold = (dist / 2.5) * 0.6 + 0.2

                // Create an organic boundary between features
                if (map[ny][nx] === GRASS && noiseValue > threshold) {
                    map[ny][nx] = type
                } else if (map[ny][nx] === type && noiseValue < -threshold) {
                    map[ny][nx] = GRASS
                }
            }
        }
    }

    // After normal transitions, specifically enhance stone visibility
    console.log('Enhancing stone formations...')

    // Count how many stones we have
    let stoneCount = 0
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            if (map[y][x] === STONE) stoneCount++
        }
    }

    console.log(`Map has ${stoneCount} stone tiles`)

    // If we don't have enough stones, add some more
    if (stoneCount < FORCE_STONE_COUNT / 2) {
        console.log(`Not enough stones, adding more...`)
        forcePlaceStones(map, noiseGen)
    }
}

/**
 * Generates a random river path with multiple control points
 * and smooth curves between them
 */
function generateRandomRiverPath(): { x: number; y: number }[] {
    // Generate the main control points as before
    const controlPoints: { x: number; y: number }[] = []

    // Decide river orientation (0=horizontal, 1=vertical, 2=diagonal)
    const orientation = randomInt(0, 2)

    // Set start and end points based on orientation
    let startX, startY, endX, endY

    if (orientation === 0) {
        // Horizontal river
        startX = 0
        endX = MAP_SIZE - 1
        startY = randomInt(MAP_SIZE * 0.3, MAP_SIZE * 0.7)
        endY = randomInt(MAP_SIZE * 0.3, MAP_SIZE * 0.7)
    } else if (orientation === 1) {
        // Vertical river
        startY = 0
        endY = MAP_SIZE - 1
        startX = randomInt(MAP_SIZE * 0.3, MAP_SIZE * 0.7)
        endX = randomInt(MAP_SIZE * 0.3, MAP_SIZE * 0.7)
    } else {
        // Diagonal river
        // Pick a corner to start from
        const corner = randomInt(0, 3)
        if (corner === 0) {
            startX = 0
            startY = 0
            endX = MAP_SIZE - 1
            endY = MAP_SIZE - 1
        } else if (corner === 1) {
            startX = 0
            startY = MAP_SIZE - 1
            endX = MAP_SIZE - 1
            endY = 0
        } else if (corner === 2) {
            startX = MAP_SIZE - 1
            startY = 0
            endX = 0
            endY = MAP_SIZE - 1
        } else {
            startX = MAP_SIZE - 1
            startY = MAP_SIZE - 1
            endX = 0
            endY = 0
        }
    }

    controlPoints.push({ x: startX, y: startY })

    // Generate random number of control points
    const numPoints = randomInt(RIVER_POINTS_MIN, RIVER_POINTS_MAX)

    // For each control point, add some interesting variation
    for (let i = 1; i < numPoints - 1; i++) {
        const t = i / (numPoints - 1)

        // Base point along the straight line from start to end
        const baseX = startX + (endX - startX) * t
        const baseY = startY + (endY - startY) * t

        // Add sinusoidal variation for S-curves with some randomness
        let offsetX, offsetY

        // Calculate offset perpendicular to the main river direction
        if (orientation === 0) {
            // Horizontal river
            // Create variation in the Y direction
            offsetX = 0
            offsetY = Math.sin(t * Math.PI * 2) * MAP_SIZE * 0.15 * RIVER_MEANDERING

            // Add some random variation
            offsetY += (Math.random() - 0.5) * MAP_SIZE * 0.1
        } else if (orientation === 1) {
            // Vertical river
            // Create variation in the X direction
            offsetX = Math.sin(t * Math.PI * 2) * MAP_SIZE * 0.15 * RIVER_MEANDERING
            offsetY = 0

            // Add some random variation
            offsetX += (Math.random() - 0.5) * MAP_SIZE * 0.1
        } else {
            // Diagonal river
            // For diagonals, vary both X and Y but in complementary waves
            offsetX = Math.sin(t * Math.PI * 2) * MAP_SIZE * 0.1 * RIVER_MEANDERING
            offsetY = Math.cos(t * Math.PI * 2) * MAP_SIZE * 0.1 * RIVER_MEANDERING

            // Add some random variation
            offsetX += (Math.random() - 0.5) * MAP_SIZE * 0.05
            offsetY += (Math.random() - 0.5) * MAP_SIZE * 0.05
        }

        // Apply the offsets to create the control point
        const point = {
            x: baseX + offsetX,
            y: baseY + offsetY,
        }

        // Keep points within map boundaries
        point.x = Math.max(5, Math.min(MAP_SIZE - 5, point.x))
        point.y = Math.max(5, Math.min(MAP_SIZE - 5, point.y))

        controlPoints.push(point)
    }

    controlPoints.push({ x: endX, y: endY })

    // Generate a smooth curve through the control points
    return generateSmoothCurve(controlPoints, RIVER_SMOOTHNESS, RIVER_CURVE_TENSION)
}

/**
 * Generates a smooth curve through the given control points using Catmull-Rom splines
 * @param controlPoints - Array of control points
 * @param smoothness - Number of points to generate between each control point
 * @param tension - Controls how tightly the curve bends at the control points (0.5 is natural)
 * @returns Array of points forming a smooth curve
 */
function generateSmoothCurve(
    controlPoints: { x: number; y: number }[],
    smoothness: number,
    tension: number = 0.5,
): { x: number; y: number }[] {
    if (controlPoints.length < 2) return controlPoints

    const curvePoints: { x: number; y: number }[] = []

    // Add the first control point
    curvePoints.push(controlPoints[0])

    // For each segment between control points
    for (let i = 0; i < controlPoints.length - 1; i++) {
        // Get the points needed for this segment of the curve
        const p0 = i > 0 ? controlPoints[i - 1] : controlPoints[i]
        const p1 = controlPoints[i]
        const p2 = controlPoints[i + 1]
        const p3 = i < controlPoints.length - 2 ? controlPoints[i + 2] : p2

        // Generate smoothness number of points along this segment
        for (let j = 1; j <= smoothness; j++) {
            const t = j / smoothness

            // Catmull-Rom spline calculation
            const t2 = t * t
            const t3 = t2 * t

            // Calculate the x and y coordinates along the curve
            let x =
                0.5 *
                (2 * p1.x +
                    (-p0.x + p2.x) * t +
                    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3)

            let y =
                0.5 *
                (2 * p1.y +
                    (-p0.y + p2.y) * t +
                    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)

            // Apply tension to affect curvature
            x = p1.x + (x - p1.x) * tension
            y = p1.y + (y - p1.y) * tension

            // Keep points within map boundaries
            x = Math.max(0, Math.min(MAP_SIZE - 1, x))
            y = Math.max(0, Math.min(MAP_SIZE - 1, y))

            curvePoints.push({ x, y })
        }
    }

    // Add the last control point
    curvePoints.push(controlPoints[controlPoints.length - 1])

    return curvePoints
}

/**
 * Draw the river path with varying width and natural edges
 * @param isBranch Whether this is a branch river (affects width)
 */
function drawRiverPath(
    map: string[][],
    riverPoints: { x: number; y: number }[],
    isBranch: boolean = false,
) {
    console.log(`Drawing ${isBranch ? 'branch' : 'main'} river...`)

    // Generate random width variation points along the river
    const widthVariationPoints: number[] = []
    const variationCount = Math.max(2, Math.floor(riverPoints.length / 20))

    for (let i = 0; i < variationCount; i++) {
        widthVariationPoints.push(randomInt(0, riverPoints.length - 1))
    }

    // Sort them to ensure they're in order along the river
    widthVariationPoints.sort((a, b) => a - b)

    // Generate random width multiplier at each variation point
    const widthMultipliers: number[] = []
    for (let i = 0; i < variationCount; i++) {
        // Random multiplier between 0.5 and 1.5 for main river
        // For branches, use smaller range: 0.3 to 0.8
        if (isBranch) {
            widthMultipliers.push(0.3 + Math.random() * 0.5 * BRANCH_WIDTH_FACTOR)
        } else {
            widthMultipliers.push(0.5 + Math.random() * RIVER_VARIANCE_FACTOR)
        }
    }

    // Use more points for smoother river segments
    for (let i = 0; i < riverPoints.length - 1; i++) {
        const start = riverPoints[i]
        const end = riverPoints[i + 1]

        if (i % 10 === 0) {
            // Update progress less often to avoid console spam
            showProgress(
                `Drawing ${isBranch ? 'branch' : 'main'} river segment`,
                i + 1,
                riverPoints.length - 1,
            )
        }

        // Calculate standard river width based on position along the river
        const riverProgress = i / (riverPoints.length - 1)
        let widthFactor = Math.sin(riverProgress * Math.PI) * 0.5 + 0.5 // 0 to 1

        // Enhanced width variation - interpolate between variation points
        for (let j = 0; j < widthVariationPoints.length - 1; j++) {
            if (i >= widthVariationPoints[j] && i <= widthVariationPoints[j + 1]) {
                const segmentProgress =
                    (i - widthVariationPoints[j]) /
                    (widthVariationPoints[j + 1] - widthVariationPoints[j])

                // Interpolate between the two multipliers
                const interpolatedMultiplier =
                    widthMultipliers[j] * (1 - segmentProgress) +
                    widthMultipliers[j + 1] * segmentProgress

                widthFactor *= interpolatedMultiplier
                break
            }
        }

        // If this is a branch, reduce width
        if (isBranch) {
            widthFactor *= BRANCH_WIDTH_FACTOR
        }

        // Base width with significant variation
        const width =
            RIVER_WIDTH_MIN +
            (RIVER_WIDTH_MAX - RIVER_WIDTH_MIN) * widthFactor +
            Math.sin(riverProgress * Math.PI * 8) * 0.5 // Add small variations

        // Draw river segment with natural edges
        drawNaturalRiver(
            map,
            Math.floor(start.x),
            Math.floor(start.y),
            Math.floor(end.x),
            Math.floor(end.y),
            width,
        )
    }
}

/**
 * Draw a river segment with natural edges
 */
function drawNaturalRiver(
    map: string[][],
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    width: number,
) {
    const dx = Math.abs(x1 - x0)
    const dy = Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx - dy

    // Create noise for natural river edges
    const noiseGen = new EnhancedNoise(x0 * 1000 + y0)
    let x = x0
    let y = y0

    // Safety counter
    let steps = 0
    const maxSteps = MAP_SIZE * 2

    while (steps < maxSteps) {
        steps++

        // Add water at the current point
        if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
            map[y][x] = WATER

            // Add width to the river with natural edges
            for (let wx = -Math.ceil(width); wx <= Math.ceil(width); wx++) {
                for (let wy = -Math.ceil(width); wy <= Math.ceil(width); wy++) {
                    const nx = x + wx
                    const ny = y + wy

                    if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
                        // Distance from center
                        const dist = Math.sqrt(wx * wx + wy * wy)

                        // Noise based on position for natural edge
                        const edgeNoise = noiseGen.noise(nx * 0.1, ny * 0.1) * 0.5 + 0.5

                        // Variable width with noise for irregular edges
                        if (dist < width * (1 + edgeNoise * 0.5)) {
                            map[ny][nx] = WATER
                        }
                    }
                }
            }
        }

        // Break if we've reached the endpoint
        if (x === x1 && y === y1) break

        // Move to next point using Bresenham's
        const e2 = 2 * err
        if (e2 > -dy) {
            err -= dy
            x += sx
        }
        if (e2 < dx) {
            err += dx
            y += sy
        }
    }
}

/**
 * Create a natural looking lake with irregular shorelines
 * @param addSand Whether to add sandy shores around this lake
 */
function createNaturalLake(
    map: string[][],
    size: number,
    noiseGen: EnhancedNoise,
    isIsland = false,
    addSand = false,
) {
    // Find a suitable location for the lake
    let x,
        y,
        attempts = 0
    do {
        x = Math.floor(randomInt(Math.floor(MAP_SIZE * 0.1), Math.floor(MAP_SIZE * 0.9)))
        y = Math.floor(randomInt(Math.floor(MAP_SIZE * 0.1), Math.floor(MAP_SIZE * 0.9)))
        attempts++

        // Safety check to ensure valid coordinates
        if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) continue
    } while (map[y][x] === WATER && attempts < 100)

    // If we couldn't find a good spot, skip this lake
    if (attempts >= 100) return

    // Create irregular lake shape using multiple noise functions
    const maxRadius = size

    // Use different frequencies of noise for varied shorelines
    const primaryNoiseSeed = Math.random() * 10000
    const secondaryNoiseSeed = Math.random() * 20000
    const tertiaryNoiseSeed = Math.random() * 30000

    // Make the lake shape more interesting with varying axes
    const verticalStretch = 0.8 + Math.random() * 0.4 // Between 0.8 and 1.2
    const horizontalStretch = 0.8 + Math.random() * 0.4

    // Create the irregular lake
    for (let dy = -maxRadius * 1.5; dy <= maxRadius * 1.5; dy++) {
        for (let dx = -maxRadius * 1.5; dx <= maxRadius * 1.5; dx++) {
            const nx = Math.floor(x + dx)
            const ny = Math.floor(y + dy)

            if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
                // Calculate distance with stretching for more interesting shapes
                const stretchedDx = dx / horizontalStretch
                const stretchedDy = dy / verticalStretch
                const distanceRatio =
                    Math.sqrt(stretchedDx * stretchedDx + stretchedDy * stretchedDy) /
                    maxRadius

                if (distanceRatio > 1.5) continue // Skip if far outside the lake area

                // Angle-based deformations for inlets and peninsulas
                const angle = Math.atan2(dy, dx)
                const angleFactor = Math.sin(angle * 3) * 0.15 // Create 3 "lobes" around the lake

                // Get multi-layer noise for the lake edge
                const primaryNoise = noiseGen.noise(nx * 0.1, ny * 0.1) * 0.2
                const secondaryNoise = noiseGen.noise(nx * 0.2, ny * 0.2) * 0.1
                const detailNoise = noiseGen.noise(nx * 0.4, ny * 0.4) * 0.05

                // Combine all factors
                const combinedNoise =
                    primaryNoise + secondaryNoise + detailNoise + angleFactor

                // Create a lake with irregular edges
                if (distanceRatio < 0.9 + combinedNoise) {
                    map[ny][nx] = WATER
                }
            }
        }
    }

    // After creating the lake, possibly add sandy shores around it
    if (addSand) {
        console.log('Adding sandy shores to lake...')
        addSandyLakeShores(map, x, y, maxRadius * 1.2, noiseGen)
    }

    // Sometimes connect the lake to a nearby water body
    if (Math.random() < 0.7) {
        connectLakeToWater(map, x, y, maxRadius)
    }
}

/**
 * Connect a lake to nearby water with a small stream
 */
function connectLakeToWater(
    map: string[][],
    lakeX: number,
    lakeY: number,
    radius: number,
) {
    // Find the closest water tile within search range
    const searchRadius = radius * 3
    let closestWaterX = -1
    let closestWaterY = -1
    let minDistance = searchRadius * searchRadius

    // Search in a spiral pattern outward from the lake
    for (let r = radius + 1; r <= searchRadius; r++) {
        for (let i = 0; i < r * 8; i++) {
            // Calculate point on the circle
            const angle = (i / (r * 8)) * 2 * Math.PI
            const dx = Math.floor(Math.cos(angle) * r)
            const dy = Math.floor(Math.sin(angle) * r)
            const x = lakeX + dx
            const y = lakeY + dy

            if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE && map[y][x] === WATER) {
                const dist = dx * dx + dy * dy
                if (dist < minDistance) {
                    minDistance = dist
                    closestWaterX = x
                    closestWaterY = y
                    break // Found water, no need to search further in this radius
                }
            }
        }

        if (closestWaterX !== -1) break // Found water, exit the search
    }

    // If we found water, connect to it
    if (closestWaterX !== -1 && closestWaterY !== -1) {
        // Draw a meandering stream
        const streamWidth = randomInt(1, 2)
        const noiseGen = new EnhancedNoise(lakeX * 3.7 + lakeY * 1.5)

        // Create control points for the stream
        const points = []
        points.push({ x: lakeX, y: lakeY })

        // Add some midpoints for a natural curve
        const numPoints = randomInt(3, 5)
        for (let i = 1; i < numPoints; i++) {
            const t = i / numPoints
            const baseX = lakeX + t * (closestWaterX - lakeX)
            const baseY = lakeY + t * (closestWaterY - lakeY)

            // Add some noise to the path
            const noiseAmp = 5.0
            const noiseX = noiseGen.noise(t * 10, 0) * noiseAmp
            const noiseY = noiseGen.noise(0, t * 10) * noiseAmp

            points.push({
                x: Math.floor(baseX + noiseX),
                y: Math.floor(baseY + noiseY),
            })
        }

        points.push({ x: closestWaterX, y: closestWaterY })

        // Draw the stream
        for (let i = 0; i < points.length - 1; i++) {
            addSimpleRiverWidth(
                map,
                points[i].x,
                points[i].y,
                points[i + 1].x,
                points[i + 1].y,
                streamWidth,
            )
        }
    }
}

/**
 * Add natural-looking shorelines to water bodies
 */
function addNaturalShorelines(map: string[][], noiseGen: EnhancedNoise) {
    // First pass: identify shoreline tiles
    const shorelines: Array<{ x: number; y: number }> = []

    for (let y = 1; y < MAP_SIZE - 1; y++) {
        for (let x = 1; x < MAP_SIZE - 1; x++) {
            // Only process land tiles that border water
            if (map[y][x] !== WATER) {
                let adjacentWater = false
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue
                        if (map[y + dy] && map[y + dy][x + dx] === WATER) {
                            adjacentWater = true
                            break
                        }
                    }
                    if (adjacentWater) break
                }

                if (adjacentWater) {
                    shorelines.push({ x, y })
                }
            }
        }
    }

    // Second pass: process shorelines with noise for organic look
    for (const tile of shorelines) {
        const { x, y } = tile

        // Multi-frequency noise for natural variation
        const noiseVal =
            noiseGen.terrainNoise(x * 0.2, y * 0.2, 1) * 0.6 +
            noiseGen.terrainNoise(x * 0.4, y * 0.4, 1) * 0.3 +
            noiseGen.terrainNoise(x * 0.8, y * 0.8, 1) * 0.1

        // Use ridged noise for interesting shoreline patterns
        const ridgeNoise = noiseGen.ridgedNoise(x * 0.3, y * 0.3, 1)

        // Calculate distance to nearest water
        let minWaterDist = 1
        for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                if (dx === 0 && dy === 0) continue
                if (y + dy < 0 || y + dy >= MAP_SIZE || x + dx < 0 || x + dx >= MAP_SIZE)
                    continue

                if (map[y + dy][x + dx] === WATER) {
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < minWaterDist) {
                        minWaterDist = dist
                    }
                }
            }
        }

        // Closer to water = more likely to become water
        const distFactor = (1.1 - Math.min(1, minWaterDist / 1.5)) * 0.4

        // Combine factors for final decision
        if (noiseVal + distFactor + ridgeNoise * 0.2 > 0.4) {
            map[y][x] = WATER
        }
    }
}

/**
 * Adds a simple width to the river (for smaller streams)
 */
function addSimpleRiverWidth(
    map: string[][],
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    width: number,
) {
    const dx = Math.abs(x1 - x0)
    const dy = Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx - dy

    // Safety counter to prevent infinite loops
    let steps = 0
    const maxSteps = MAP_SIZE * 2

    while (steps < maxSteps) {
        steps++

        // Add width around this point
        for (let i = -width; i <= width; i++) {
            for (let j = -width; j <= width; j++) {
                const nx = x0 + i
                const ny = y0 + j

                // Simple circle shape for river
                if (i * i + j * j <= width * width) {
                    if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
                        map[ny][nx] = WATER
                    }
                }
            }
        }

        // Check if we've reached the end
        if (x0 === x1 && y0 === y1) break

        const e2 = 2 * err
        if (e2 > -dy) {
            err -= dy
            x0 += sx
        }
        if (e2 < dx) {
            err += dx
            y0 += sy
        }
    }
}

/**
 * Create a natural-looking border with varying width
 */
function createNaturalBorder(map: string[][], noiseGen: EnhancedNoise) {
    // First create a basic border for safety (ensure map is fully enclosed)
    for (let i = 0; i < MAP_SIZE; i++) {
        map[0][i] = WATER
        map[MAP_SIZE - 1][i] = WATER
        map[i][0] = WATER
        map[i][MAP_SIZE - 1] = WATER
    }

    // Create a more natural border with varying width
    console.log('Creating natural border with varying width...')

    // Top border
    for (let x = 0; x < MAP_SIZE; x++) {
        // Determine border width for this column using noise
        const noiseValue = noiseGen.noise(x * BORDER_NOISE_SCALE, 0) * BORDER_IRREGULARITY
        const borderWidth = Math.floor(
            BORDER_MIN_WIDTH + (BORDER_MAX_WIDTH - BORDER_MIN_WIDTH) * (0.5 + noiseValue),
        )

        // Create jagged edge with secondary noise
        for (let y = 0; y < borderWidth; y++) {
            // Add noise to create irregular inner edge
            const edgeNoise = noiseGen.noise(x * 0.2, y * 0.5) * 3
            const depthOffset = Math.floor(edgeNoise)

            // Calculate actual depth with noise offset
            const actualDepth = borderWidth - y + depthOffset

            if (actualDepth > 0 && y < MAP_SIZE) {
                map[y][x] = WATER

                // Sometimes add small islands near the coastline
                if (actualDepth < 3 && Math.random() < 0.05) {
                    map[y][x] = GRASS
                }
            }
        }
    }

    // Bottom border
    for (let x = 0; x < MAP_SIZE; x++) {
        const noiseValue =
            noiseGen.noise(x * BORDER_NOISE_SCALE, 1000) * BORDER_IRREGULARITY
        const borderWidth = Math.floor(
            BORDER_MIN_WIDTH + (BORDER_MAX_WIDTH - BORDER_MIN_WIDTH) * (0.5 + noiseValue),
        )

        for (let y = 0; y < borderWidth; y++) {
            const edgeNoise = noiseGen.noise((MAP_SIZE - x) * 0.2, y * 0.5) * 3
            const depthOffset = Math.floor(edgeNoise)
            const actualDepth = borderWidth - y + depthOffset

            if (actualDepth > 0) {
                const mapY = MAP_SIZE - 1 - y
                if (mapY >= 0) {
                    map[mapY][x] = WATER

                    // Small islands
                    if (actualDepth < 3 && Math.random() < 0.05) {
                        map[mapY][x] = GRASS
                    }
                }
            }
        }
    }

    // Left border
    for (let y = 0; y < MAP_SIZE; y++) {
        const noiseValue = noiseGen.noise(0, y * BORDER_NOISE_SCALE) * BORDER_IRREGULARITY
        const borderWidth = Math.floor(
            BORDER_MIN_WIDTH + (BORDER_MAX_WIDTH - BORDER_MIN_WIDTH) * (0.5 + noiseValue),
        )

        for (let x = 0; x < borderWidth; x++) {
            const edgeNoise = noiseGen.noise(x * 0.5, y * 0.2) * 3
            const depthOffset = Math.floor(edgeNoise)
            const actualDepth = borderWidth - x + depthOffset

            if (actualDepth > 0 && x < MAP_SIZE) {
                map[y][x] = WATER

                // Small islands
                if (actualDepth < 3 && Math.random() < 0.05) {
                    map[y][x] = GRASS
                }
            }
        }
    }

    // Right border
    for (let y = 0; y < MAP_SIZE; y++) {
        const noiseValue =
            noiseGen.noise(1000, y * BORDER_NOISE_SCALE) * BORDER_IRREGULARITY
        const borderWidth = Math.floor(
            BORDER_MIN_WIDTH + (BORDER_MAX_WIDTH - BORDER_MIN_WIDTH) * (0.5 + noiseValue),
        )

        for (let x = 0; x < borderWidth; x++) {
            const edgeNoise = noiseGen.noise(x * 0.5, (MAP_SIZE - y) * 0.2) * 3
            const depthOffset = Math.floor(edgeNoise)
            const actualDepth = borderWidth - x + depthOffset

            if (actualDepth > 0) {
                const mapX = MAP_SIZE - 1 - x
                if (mapX >= 0) {
                    map[y][mapX] = WATER

                    // Small islands
                    if (actualDepth < 3 && Math.random() < 0.05) {
                        map[y][mapX] = GRASS
                    }
                }
            }
        }
    }

    // Create some interesting coastal features
    addCoastalFeatures(map, noiseGen)
}

/**
 * Add interesting coastal features like bays, peninsulas, and small islands
 */
function addCoastalFeatures(map: string[][], noiseGen: EnhancedNoise) {
    const coastalZone = Math.max(BORDER_MAX_WIDTH + 5, Math.floor(MAP_SIZE * 0.1))

    // Add peninsula features
    const peninsulaCount = randomInt(3, 7)
    for (let i = 0; i < peninsulaCount; i++) {
        // Choose one of the four sides for the peninsula
        const side = randomInt(0, 3) // 0=top, 1=right, 2=bottom, 3=left

        let x, y
        if (side === 0) {
            x = randomInt(coastalZone, MAP_SIZE - coastalZone)
            y = randomInt(5, coastalZone)
        } else if (side === 1) {
            x = randomInt(MAP_SIZE - coastalZone, MAP_SIZE - 5)
            y = randomInt(coastalZone, MAP_SIZE - coastalZone)
        } else if (side === 2) {
            x = randomInt(coastalZone, MAP_SIZE - coastalZone)
            y = randomInt(MAP_SIZE - coastalZone, MAP_SIZE - 5)
        } else {
            x = randomInt(5, coastalZone)
            y = randomInt(coastalZone, MAP_SIZE - coastalZone)
        }

        // Create a peninsula formation (land extending into water)
        const peninsulaSize = randomInt(5, 15)
        const peninsulaNoiseGen = new EnhancedNoise(Math.random() * 50000)

        for (let dy = -peninsulaSize; dy <= peninsulaSize; dy++) {
            for (let dx = -peninsulaSize; dx <= peninsulaSize; dx++) {
                const nx = x + dx
                const ny = y + dy

                if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE) continue

                // Basic distance check
                const dist = Math.sqrt(dx * dx + dy * dy) / peninsulaSize
                if (dist > 1) continue

                // Use noise to create natural peninsula shape
                const noiseVal = peninsulaNoiseGen.noise(nx * 0.1, ny * 0.1) * 0.5

                // Only if we're in water, potentially convert to land
                if (map[ny][nx] === WATER && dist < 0.7 + noiseVal) {
                    map[ny][nx] = GRASS
                }
            }
        }
    }

    // Add offshore islands
    const islandCount = randomInt(4, 8)
    for (let i = 0; i < islandCount; i++) {
        // Position island near the border
        let x, y
        const side = randomInt(0, 3)

        if (side === 0) {
            x = randomInt(coastalZone, MAP_SIZE - coastalZone)
            y = randomInt(5, coastalZone * 0.7)
        } else if (side === 1) {
            x = randomInt(MAP_SIZE - coastalZone * 0.7, MAP_SIZE - 5)
            y = randomInt(coastalZone, MAP_SIZE - coastalZone)
        } else if (side === 2) {
            x = randomInt(coastalZone, MAP_SIZE - coastalZone)
            y = randomInt(MAP_SIZE - coastalZone * 0.7, MAP_SIZE - 5)
        } else {
            x = randomInt(5, coastalZone * 0.7)
            y = randomInt(coastalZone, MAP_SIZE - coastalZone)
        }

        // Create a small island
        const islandSize = randomInt(3, 8)
        createNaturalLake(map, islandSize, noiseGen, true) // true = create island instead of lake
    }
}

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
    // Fix: Ensure min and max are integers
    min = Math.floor(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generates a system of rivers with possible branching
 */
function generateRiverSystem(map: string[][], noiseGen: EnhancedNoise) {
    // Generate main rivers
    const riverCount = Math.max(1, RIVER_COUNT)

    for (let r = 0; r < riverCount; r++) {
        // Generate main river path with random start/end points
        console.log(`Generating river ${r + 1} of ${riverCount}...`)
        const mainRiverPoints = generateRandomRiverPath()

        // Draw the main river with full width
        drawRiverPath(map, mainRiverPoints, false)

        // Decide if this river should have branches
        if (Math.random() < BRANCH_CHANCE) {
            const branchCount = randomInt(1, MAX_BRANCHES_PER_RIVER)
            console.log(`Adding ${branchCount} branches to river ${r + 1}...`)

            // Generate branches for this river
            for (let b = 0; b < branchCount; b++) {
                // Pick a point along the main river to start the branch
                const branchIndex = randomInt(
                    Math.floor(mainRiverPoints.length * 0.2),
                    Math.floor(mainRiverPoints.length * 0.8),
                )

                const branchStart = mainRiverPoints[branchIndex]

                // Create a branch river
                const branchPoints = generateRiverBranch(
                    branchStart,
                    mainRiverPoints,
                    branchIndex,
                    noiseGen,
                )

                // Draw the branch with reduced width (passing true for isBranch)
                drawRiverPath(map, branchPoints, true)
            }
        }
    }
}

/**
 * Generates a branch river starting from a point on the main river
 */
function generateRiverBranch(
    startPoint: { x: number; y: number },
    mainRiverPoints: { x: number; y: number }[],
    startIndex: number,
    noiseGen: EnhancedNoise,
): { x: number; y: number }[] {
    // Determine direction perpendicular to the main river at this point
    let directionX = 0,
        directionY = 0

    // Calculate the direction vector of the main river at this point
    if (startIndex > 0 && startIndex < mainRiverPoints.length - 1) {
        const prevPoint = mainRiverPoints[startIndex - 1]
        const nextPoint = mainRiverPoints[startIndex + 1]

        // Calculate main river direction vector
        const mainDirX = nextPoint.x - prevPoint.x
        const mainDirY = nextPoint.y - prevPoint.y

        // Perpendicular vector (rotate 90 degrees)
        directionX = -mainDirY
        directionY = mainDirX
    } else {
        // Fallback if we're at the start/end - just pick a random direction
        const angle = Math.random() * Math.PI * 2
        directionX = Math.cos(angle)
        directionY = Math.sin(angle)
    }

    // Normalize the direction vector
    const magnitude = Math.sqrt(directionX * directionX + directionY * directionY)
    if (magnitude > 0) {
        directionX /= magnitude
        directionY /= magnitude
    }

    // Randomly choose which side to branch toward
    if (Math.random() < 0.5) {
        directionX = -directionX
        directionY = -directionY
    }

    // Calculate branch length
    const branchLength =
        MAP_SIZE * 0.1 * (0.5 + Math.random() * 0.5) * BRANCH_LENGTH_FACTOR

    // Calculate end point
    const endPoint = {
        x: Math.max(0, Math.min(MAP_SIZE - 1, startPoint.x + directionX * branchLength)),
        y: Math.max(0, Math.min(MAP_SIZE - 1, startPoint.y + directionY * branchLength)),
    }

    // Generate control points for a meandering branch
    const controlPoints = []
    controlPoints.push(startPoint)

    // Add some midpoints with noise for natural meandering
    const numPoints = randomInt(3, 6)
    for (let i = 1; i < numPoints; i++) {
        const t = i / numPoints

        // Base position along straight line
        const baseX = startPoint.x + (endPoint.x - startPoint.x) * t
        const baseY = startPoint.y + (endPoint.y - startPoint.y) * t

        // Add perpendicular noise
        const perpX = -directionY // perpendicular to direction
        const perpY = directionX

        // Calculate noise offset
        const noiseVal = noiseGen.noise(baseX * 0.01, baseY * 0.01) * branchLength * 0.3

        // Apply offset
        const point = {
            x: baseX + perpX * noiseVal,
            y: baseY + perpY * noiseVal,
        }

        // Keep within map bounds
        point.x = Math.max(0, Math.min(MAP_SIZE - 1, point.x))
        point.y = Math.max(0, Math.min(MAP_SIZE - 1, point.y))

        controlPoints.push(point)
    }

    // Add end point
    controlPoints.push(endPoint)

    // Generate smooth curve through control points
    return generateSmoothCurve(controlPoints, RIVER_SMOOTHNESS, RIVER_CURVE_TENSION)
}

/**
 * Add natural stone formations with smoother, less blocky appearance
 */
function addStoneFormations(
    map: string[][],
    baseNoiseGen: EnhancedNoise,
    stoneNoiseGen: EnhancedNoise,
    terrainSuitability: number[][],
) {
    // Create large-scale stone region noise
    const stoneRegionNoise = Array(MAP_SIZE)
        .fill(0)
        .map(() => Array(MAP_SIZE).fill(0))

    // Calculate stone region noise - this controls overall stone distribution
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            // Skip water
            if (map[y][x] === WATER) continue

            // Multiple layers of noise for natural stone regions
            stoneRegionNoise[y][x] =
                stoneNoiseGen.terrainNoise(
                    x * NOISE_SCALE * 0.5,
                    y * NOISE_SCALE * 0.5,
                    1,
                    2,
                ) *
                    0.6 +
                stoneNoiseGen.terrainNoise(
                    x * NOISE_SCALE * 1.5,
                    y * NOISE_SCALE * 1.5,
                    1,
                    3,
                ) *
                    0.3 +
                stoneNoiseGen.terrainNoise(
                    x * NOISE_SCALE * 4,
                    y * NOISE_SCALE * 4,
                    1,
                    1,
                ) *
                    0.1
        }
    }

    // Create stone clusters based on the region noise
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            // Skip water or existing stone
            if (map[y][x] === WATER || map[y][x] === STONE) continue

            // Check if this is a potential cluster center
            if (stoneRegionNoise[y][x] > 1 - STONE_DENSITY * 0.8) {
                // Generate a stone cluster here
                const clusterSize = randomInt(
                    STONE_CLUSTER_MIN_SIZE,
                    STONE_CLUSTER_MAX_SIZE,
                )
                generateOrganicStoneCluster(map, x, y, clusterSize, stoneNoiseGen)
            }
            // Individual stones based on noise
            else if (stoneRegionNoise[y][x] > 1 - STONE_DENSITY) {
                map[y][x] = STONE
            }
        }
    }

    // Add smooth transitions around stone formations
    smoothStoneTransitions(map, stoneNoiseGen)
}

/**
 * Generate an organic-looking stone cluster with smooth edges
 */
function generateOrganicStoneCluster(
    map: string[][],
    centerX: number,
    centerY: number,
    size: number,
    noiseGen: EnhancedNoise,
) {
    // Base cluster shape
    const maxRadius = size

    // Create stone cluster with organic shape
    for (let dy = -maxRadius; dy <= maxRadius; dy++) {
        for (let dx = -maxRadius; dx <= maxRadius; dx++) {
            const nx = centerX + dx
            const ny = centerY + dy

            if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE) continue
            if (map[ny][nx] === WATER) continue

            // Distance from center - use sqrt for circular base shape
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist > maxRadius) continue

            // Generate noise for organic edges
            const edgeNoise =
                noiseGen.noise(nx * 0.2, ny * 0.2) * 0.5 + // Medium detail
                noiseGen.noise(nx * 0.5, ny * 0.5) * 0.3 + // Small detail
                noiseGen.noise(nx * 1.0, ny * 1.0) * 0.2 // Fine detail

            // Distance factor - stones are more likely near the center
            const distFactor = (1 - dist / maxRadius) * STONE_SMOOTHING

            // Combine factors to determine if this should be stone
            if (distFactor + edgeNoise * (1 - STONE_SMOOTHING) > 0.5) {
                map[ny][nx] = STONE
            }
            // Sometimes add small detail stones on the edges
            else if (
                distFactor + edgeNoise > 0.45 &&
                Math.random() < STONE_SMALL_DETAIL_NOISE
            ) {
                map[ny][nx] = STONE
            }
        }
    }
}

/**
 * Add smooth transitions between stone and other terrain types
 */
function smoothStoneTransitions(map: string[][], noiseGen: EnhancedNoise) {
    // First identify all stone edges
    const stoneEdges = []

    for (let y = 1; y < MAP_SIZE - 1; y++) {
        for (let x = 1; x < MAP_SIZE - 1; x++) {
            if (map[y][x] === STONE) {
                // Check if this is an edge stone (has non-stone neighbor)
                let isEdge = false
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (
                            map[y + dy][x + dx] !== STONE &&
                            map[y + dy][x + dx] !== WATER
                        ) {
                            isEdge = true
                            break
                        }
                    }
                    if (isEdge) break
                }

                if (isEdge) {
                    stoneEdges.push({ x, y })
                }
            }
        }
    }

    // Then process each edge to add smooth transitions
    for (const edge of stoneEdges) {
        const { x, y } = edge

        // Look at surrounding tiles
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                if (dx === 0 && dy === 0) continue

                const nx = x + dx
                const ny = y + dy

                if (nx <= 0 || nx >= MAP_SIZE - 1 || ny <= 0 || ny >= MAP_SIZE - 1)
                    continue
                if (map[ny][nx] === WATER || map[ny][nx] === STONE) continue

                // Calculate distance from edge
                const dist = Math.sqrt(dx * dx + dy * dy)
                if (dist > 2) continue // Only affect tiles within distance 2

                // Get noise for this position
                const noise = noiseGen.noise(nx * 0.3, ny * 0.3)

                // Distance factor - closer means more likely to be stone
                const distFactor = Math.max(0, 1 - dist / 2)

                // Combine noise and distance to determine if this becomes stone
                if (noise * 0.6 + distFactor * 0.4 > 0.65) {
                    map[ny][nx] = STONE
                }
            }
        }
    }
}

/**
 * Add large patches of sandy plains to the map
 */
function addSandyPlains(map: string[][], noiseGen: EnhancedNoise) {
    console.log(`Creating ${SANDY_PLAINS_COUNT} sandy regions...`)

    let successfulRegions = 0
    let attempts = 0
    const maxAttempts = SANDY_PLAINS_COUNT * 2

    // Fix: Use a more robust approach to create sand regions
    while (successfulRegions < SANDY_PLAINS_COUNT && attempts < maxAttempts) {
        attempts++

        try {
            // Find a suitable location for sandy region away from edges
            let x = randomInt(30, MAP_SIZE - 30)
            let y = randomInt(30, MAP_SIZE - 30)

            // Skip if this is water or outside map bounds
            if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE || map[y][x] === WATER) {
                continue
            }

            const size = randomInt(SANDY_PLAINS_SIZE_MIN, SANDY_PLAINS_SIZE_MAX)
            createSandyRegion(map, x, y, size, noiseGen)

            successfulRegions++
            showProgress('Creating sandy region', successfulRegions, SANDY_PLAINS_COUNT)
        } catch (error) {
            console.warn('Error creating sand region:', error)
            // Continue to next attempt rather than failing
        }
    }

    console.log(
        `Created ${successfulRegions}/${SANDY_PLAINS_COUNT} sandy regions after ${attempts} attempts`,
    )

    // Add sand transitions near water (like beaches)
    addSandyShores(map, noiseGen)
}

/**
 * Create an organic sandy region with natural shape
 * Modified to avoid circular patterns and add more noise
 */
function createSandyRegion(
    map: string[][],
    centerX: number,
    centerY: number,
    size: number,
    noiseGen: EnhancedNoise,
) {
    // Fix: Ensure center coordinates are valid integers within map bounds
    centerX = Math.min(Math.max(Math.floor(centerX), 0), MAP_SIZE - 1)
    centerY = Math.min(Math.max(Math.floor(centerY), 0), MAP_SIZE - 1)

    // Create directional warping to break circular symmetry
    const stretchX = 0.7 + Math.random() * 0.6
    const stretchY = 0.7 + Math.random() * 0.6
    const rotation = Math.random() * Math.PI * 2

    // Generate unique noise patterns for this region
    const regSeed1 = Math.random() * 1000
    const regSeed2 = Math.random() * 1000
    const regionNoiseGen = new EnhancedNoise(regSeed1)
    const detailNoiseGen = new EnhancedNoise(regSeed2)

    // Extended size with safety limit to avoid going too far out
    const extendedSize = Math.min(size * 1.5, MAP_SIZE / 4)

    // Create sandy region with highly organic shape
    for (let dy = -extendedSize; dy <= extendedSize; dy++) {
        for (let dx = -extendedSize; dx <= extendedSize; dx++) {
            // Fix: Calculate coordinates and ensure they're valid integers
            const nx = Math.floor(centerX + dx)
            const ny = Math.floor(centerY + dy)

            // Fix: Better bounds checking
            if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE) continue
            if (map[ny] === undefined || map[ny][nx] === undefined) continue // Safety check
            if (map[ny][nx] === WATER) continue

            try {
                // Apply rotation and stretching to break circular shape
                const rotX = dx * Math.cos(rotation) - dy * Math.sin(rotation)
                const rotY = dx * Math.sin(rotation) + dy * Math.cos(rotation)
                const stretchedX = rotX / stretchX
                const stretchedY = rotY / stretchY

                // Base distance using stretched coordinates
                const baseDist = Math.sqrt(
                    stretchedX * stretchedX + stretchedY * stretchedY,
                )
                if (baseDist > extendedSize) continue

                // Multiple layers of noise at different frequencies
                const baseNoise =
                    regionNoiseGen.noise(nx * SAND_NOISE_SCALE, ny * SAND_NOISE_SCALE) *
                    0.5
                const detailNoise =
                    detailNoiseGen.noise(nx * SAND_DETAIL_SCALE, ny * SAND_DETAIL_SCALE) *
                    0.3
                const microNoise =
                    noiseGen.noise(nx * SAND_MICRO_SCALE, ny * SAND_MICRO_SCALE) * 0.2

                // Rest of function remains the same
                // ...existing code...
            } catch (error) {
                // Skip problematic tiles rather than crashing
                console.warn(`Error processing sand tile at [${nx}, ${ny}]:`, error)
                continue
            }
        }
    }
}

/**
 * Add scattered small patches of sand around the main region
 */
function addSandPatches(
    map: string[][],
    centerX: number,
    centerY: number,
    size: number,
    noiseGen: EnhancedNoise,
) {
    // Fix: Ensure center coordinates are valid integers
    centerX = Math.floor(centerX)
    centerY = Math.floor(centerY)

    const patchCount = Math.min(Math.floor(size / 3), 15) // Limit max patches

    for (let i = 0; i < patchCount; i++) {
        try {
            // Random angle and distance from center
            const angle = Math.random() * Math.PI * 2
            const dist = size * (0.8 + Math.random() * 0.8)

            // Calculate patch position with bounds checking
            const patchX = Math.min(
                Math.max(Math.floor(centerX + Math.cos(angle) * dist), 5),
                MAP_SIZE - 5,
            )
            const patchY = Math.min(
                Math.max(Math.floor(centerY + Math.sin(angle) * dist), 5),
                MAP_SIZE - 5,
            )

            // Skip if out of bounds
            if (patchX < 0 || patchX >= MAP_SIZE || patchY < 0 || patchY >= MAP_SIZE)
                continue
            if (map[patchY] === undefined || map[patchY][patchX] === undefined) continue
            if (map[patchY][patchX] === WATER) continue

            // Rest of function remains the same
            // ...existing code...
        } catch (error) {
            console.warn('Error adding sand patch:', error)
            // Skip this patch and continue
        }
    }
}

/**
 * Add sandy shores/beaches along water edges with more natural shapes
 */
function addSandyShores(map: string[][], noiseGen: EnhancedNoise) {
    // Create specialized noise generators for beaches
    const shoreNoiseGen = new EnhancedNoise(Math.random() * 5000)
    const detailShoreNoiseGen = new EnhancedNoise(Math.random() * 7000)

    // Find all water edges
    for (let y = 1; y < MAP_SIZE - 1; y++) {
        for (let x = 1; x < MAP_SIZE - 1; x++) {
            if (map[y][x] !== WATER) {
                // Skip existing sand - no need to process again
                if (map[y][x] === SAND) continue

                // Check water proximity in a wider radius
                let minWaterDist = 999
                let waterCount = 0
                let waterDirection = { dx: 0, dy: 0 }

                // Search in a wider radius for water tiles
                const searchRadius = 4
                for (let dy = -searchRadius; dy <= searchRadius; dy++) {
                    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                        const nx = x + dx
                        const ny = y + dy
                        if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE) continue

                        if (map[ny][nx] === WATER) {
                            waterCount++
                            const dist = Math.sqrt(dx * dx + dy * dy)
                            if (dist < minWaterDist) {
                                minWaterDist = dist
                                waterDirection = { dx, dy }
                            }
                        }
                    }
                }

                // Process tiles near water
                if (minWaterDist < searchRadius) {
                    // Multiple layers of noise for more natural beaches
                    const baseNoise = shoreNoiseGen.noise(x * 0.1, y * 0.1) * 0.5
                    const detailNoise = detailShoreNoiseGen.noise(x * 0.3, y * 0.3) * 0.3
                    const directionNoise = Math.sin(x * 0.07 + y * 0.05) * 0.2 // Directional pattern

                    // Combine noise layers
                    const combinedNoise = baseNoise + detailNoise + directionNoise

                    // Distance factor - stronger effect closer to water
                    const distFactor = Math.max(
                        0,
                        (searchRadius - minWaterDist) / searchRadius,
                    )

                    // Water angle effects - beaches tend to form in certain orientations relative to water
                    const waterAngle = Math.atan2(waterDirection.dy, waterDirection.dx)
                    const angleEffect = Math.sin(waterAngle * 3) * 0.2 // Natural wave patterns

                    // Density based on water tiles nearby - more water = more likely beach
                    const waterDensity = Math.min(1.0, waterCount / 10) * 0.3

                    // Combined probability for sand formation
                    const sandProbability =
                        0.3 + // Base chance
                        distFactor * 0.4 + // Distance effect
                        combinedNoise * 0.3 + // Noise variation
                        angleEffect + // Water orientation effect
                        waterDensity // Water density effect

                    // Place sand based on all factors
                    if (
                        sandProbability > 0.55 ||
                        (minWaterDist <= 1 && combinedNoise > -0.2)
                    ) {
                        map[y][x] = SAND
                    }
                }
            }
        }
    }
}

/**
 * Refine transitions between different terrain types
 */
function refineTerrainTransitions(map: string[][], noiseGen: EnhancedNoise) {
    // Find edges between different terrain types
    for (let y = 1; y < MAP_SIZE - 1; y++) {
        for (let x = 1; x < MAP_SIZE - 1; x++) {
            const currentTile = map[y][x]
            if (currentTile === WATER) continue // Skip water

            // Check neighbors for different terrain types
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue
                    const nx = x + dx
                    const ny = y + dy

                    if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE) continue

                    const neighborTile = map[ny][nx]
                    // If the neighbor is a different terrain type
                    if (neighborTile !== currentTile && neighborTile !== WATER) {
                        // Use noise to create more organic transitions
                        const noise = noiseGen.noise(x * 0.3 + y * 0.1, y * 0.3)

                        // Sometimes swap tiles to create fuzzy edges between terrain types
                        if (noise > 0.6) {
                            map[y][x] = neighborTile
                        }
                    }
                }
            }
        }
    }
}

/**
 * Add sandy shores around a lake
 */
function addSandyLakeShores(
    map: string[][],
    lakeX: number,
    lakeY: number,
    radius: number,
    noiseGen: EnhancedNoise,
) {
    const sandNoiseGen = new EnhancedNoise(Math.random() * 8000)
    const shoreWidth = Math.floor(radius * 0.4) + 1

    // Create irregular sandy shores around the lake
    for (let dy = -radius - shoreWidth; dy <= radius + shoreWidth; dy++) {
        for (let dx = -radius - shoreWidth; dx <= radius + shoreWidth; dx++) {
            const nx = Math.floor(lakeX + dx)
            const ny = Math.floor(lakeY + dy)

            // Skip if out of bounds
            if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE) continue

            // Skip if it's water (part of the lake)
            if (map[ny][nx] === WATER) {
                // Sometimes add underwater sand patches
                if (Math.random() < 0.05) {
                    // Create small underwater sand patches
                    const underwaterPatchSize = randomInt(1, 3)
                    for (let sy = -underwaterPatchSize; sy <= underwaterPatchSize; sy++) {
                        for (
                            let sx = -underwaterPatchSize;
                            sx <= underwaterPatchSize;
                            sx++
                        ) {
                            const sandX = nx + sx
                            const sandY = ny + sy
                            if (
                                sandX >= 0 &&
                                sandX < MAP_SIZE &&
                                sandY >= 0 &&
                                sandY < MAP_SIZE &&
                                map[sandY][sandX] === WATER &&
                                Math.random() < 0.7
                            ) {
                                map[sandY][sandX] = SAND
                            }
                        }
                    }
                }
                continue
            }

            // Calculate distance from lake center
            const dist = Math.sqrt(dx * dx + dy * dy)

            // Find the nearest water tile (lake edge)
            let nearestWaterDist = 999
            for (let wy = -3; wy <= 3; wy++) {
                for (let wx = -3; wx <= 3; wx++) {
                    const waterX = nx + wx
                    const waterY = ny + wy
                    if (
                        waterX >= 0 &&
                        waterX < MAP_SIZE &&
                        waterY >= 0 &&
                        waterY < MAP_SIZE &&
                        map[waterY][waterX] === WATER
                    ) {
                        const waterDist = Math.sqrt(wx * wx + wy * wy)
                        nearestWaterDist = Math.min(nearestWaterDist, waterDist)
                    }
                }
            }

            // If we're near water but not in it
            if (nearestWaterDist < 999) {
                // Calculate probability of sand based on distance from water
                const sandProb = 1 - nearestWaterDist / shoreWidth

                // Add noise for natural, non-uniform shores
                const sandNoise = sandNoiseGen.noise(nx * 0.2, ny * 0.2) * 0.5

                // Create sandy shore with noisy edges
                if (
                    sandProb + sandNoise > 0.5 ||
                    (nearestWaterDist <= 1 && Math.random() < 0.7)
                ) {
                    map[ny][nx] = SAND
                }
            }
        }
    }
}

/**
 * Add random sand patches throughout the map
 */
function addRandomSandPatches(map: string[][], noiseGen: EnhancedNoise) {
    // Add some small random sand patches
    for (let i = 0; i < RANDOM_SAND_PATCHES_COUNT; i++) {
        // Find a random location
        const x = randomInt(20, MAP_SIZE - 20)
        const y = randomInt(20, MAP_SIZE - 20)

        // Skip if water
        if (map[y][x] === WATER) continue

        // Create a small random sand patch
        const patchSize = randomInt(2, 7)
        createMiniSandPatch(map, x, y, patchSize, noiseGen)
    }

    // Maybe create a larger desert-like area
    if (Math.random() < DESERT_PATCH_CHANCE) {
        // Find a suitable location for a desert
        const desertX = randomInt(MAP_SIZE * 0.2, MAP_SIZE * 0.8)
        const desertY = randomInt(MAP_SIZE * 0.2, MAP_SIZE * 0.8)

        // Create a large sandy area
        console.log('Creating desert-like area...')
        createDesertArea(map, desertX, desertY, randomInt(40, 70), noiseGen)
    }

    // Create sandy oases (wet areas with water surrounded by sand)
    for (let i = 0; i < SANDY_OASIS_COUNT; i++) {
        if (Math.random() < 0.7) {
            // 70% chance for each potential oasis
            // Find a suitable location away from map edges
            const oasisX = randomInt(MAP_SIZE * 0.2, MAP_SIZE * 0.8)
            const oasisY = randomInt(MAP_SIZE * 0.2, MAP_SIZE * 0.8)

            // Skip if already water
            if (map[oasisY][oasisX] === WATER) continue

            // Create an oasis - a small water body surrounded by sand
            createOasis(map, oasisX, oasisY, noiseGen)
        }
    }
}

/**
 * Create a mini sand patch
 */
function createMiniSandPatch(
    map: string[][],
    x: number,
    y: number,
    size: number,
    noiseGen: EnhancedNoise,
) {
    const patchNoiseGen = new EnhancedNoise(x * y + Math.random() * 1000)

    for (let dy = -size; dy <= size; dy++) {
        for (let dx = -size; dx <= size; dx++) {
            const nx = x + dx
            const ny = y + dy

            // Skip if out of bounds or water
            if (
                nx < 0 ||
                nx >= MAP_SIZE ||
                ny < 0 ||
                ny >= MAP_SIZE ||
                map[ny][nx] === WATER
            )
                continue

            // Distance from center with some noise
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist > size) continue

            // Add noise for organic shape
            const noise = patchNoiseGen.noise(nx * 0.5, ny * 0.5) * 0.5

            // Create sand patch with fuzzy edges
            if (dist < size * 0.5 || (dist < size && noise > 0.0)) {
                map[ny][nx] = SAND
            }
        }
    }
}

/**
 * Create a desert-like area with extensive sand
 */
function createDesertArea(
    map: string[][],
    x: number,
    y: number,
    size: number,
    noiseGen: EnhancedNoise,
) {
    // Specialized noise generators for desert features
    const desertNoiseGen = new EnhancedNoise(Math.random() * 9000)
    const duneNoiseGen = new EnhancedNoise(Math.random() * 5000)

    // Create sand dune patterns
    const duneAngle = Math.random() * Math.PI * 2 // Random orientation for dunes
    const duneFrequency = 0.05 + Math.random() * 0.1 // Random frequency

    for (let dy = -size; dy <= size; dy++) {
        for (let dx = -size; dx <= size; dx++) {
            const nx = x + dx
            const ny = y + dy

            // Skip if out of bounds or water
            if (
                nx < 0 ||
                nx >= MAP_SIZE ||
                ny < 0 ||
                ny >= MAP_SIZE ||
                map[ny][nx] === WATER
            )
                continue

            // Elliptical shape for the desert
            const stretchX = 1.0 + Math.random() * 0.5
            const stretchY = 1.0 + Math.random() * 0.5
            const dist = Math.sqrt(
                (dx / stretchX) * (dx / stretchX) + (dy / stretchY) * (dy / stretchY),
            )
            if (dist > size) continue

            // Large scale noise for desert area
            const baseNoise = desertNoiseGen.noise(nx * 0.02, ny * 0.02)

            // Dune patterns (directional noise)
            const duneX = Math.cos(duneAngle) * nx + Math.sin(duneAngle) * ny
            const duneNoise = Math.sin(duneX * duneFrequency) * 0.5

            // Detail noise for smaller features
            const detailNoise = duneNoiseGen.noise(nx * 0.1, ny * 0.1) * 0.3

            // Combine different noise patterns
            const combinedNoise = baseNoise + duneNoise + detailNoise

            // Center is definitely desert, edges are more noise-dependent
            if (dist < size * 0.7 || (dist < size && combinedNoise > -0.2)) {
                map[ny][nx] = SAND
            }
        }
    }
}

/**
 * Create an oasis - a small water body surrounded by sand
 */
function createOasis(map: string[][], x: number, y: number, noiseGen: EnhancedNoise) {
    // First create a sandy area
    const sandRadius = randomInt(8, 15)
    createMiniSandPatch(map, x, y, sandRadius, noiseGen)

    // Then create a small water body in the center
    const waterRadius = randomInt(2, 4)

    for (let dy = -waterRadius; dy <= waterRadius; dy++) {
        for (let dx = -waterRadius; dx <= waterRadius; dx++) {
            const nx = x + dx
            const ny = y + dy

            // Skip if out of bounds
            if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE) continue

            // Distance from center with some noise
            const dist = Math.sqrt(dx * dx + dy * dy)

            // Add noise for organic shape
            const noise = noiseGen.noise(nx * 0.5, ny * 0.5) * 0.3

            // Create water in center with fuzzy edges
            if (dist < waterRadius * 0.7 || (dist < waterRadius && noise > 0.0)) {
                map[ny][nx] = WATER
            }
        }
    }

    // Add more sand right at the water's edge
    for (let dy = -waterRadius - 3; dy <= waterRadius + 3; dy++) {
        for (let dx = -waterRadius - 3; dx <= waterRadius + 3; dx++) {
            const nx = x + dx
            const ny = y + dy

            // Skip if out of bounds or already water
            if (
                nx < 0 ||
                nx >= MAP_SIZE ||
                ny < 0 ||
                ny >= MAP_SIZE ||
                map[ny][nx] === WATER
            )
                continue

            // Calculate distance to nearest water
            let nearWater = false
            for (let wy = -1; wy <= 1; wy++) {
                for (let wx = -1; wx <= 1; wx++) {
                    const waterX = nx + wx
                    const waterY = ny + wy
                    if (
                        waterX >= 0 &&
                        waterX < MAP_SIZE &&
                        waterY >= 0 &&
                        waterY < MAP_SIZE &&
                        map[waterY][waterX] === WATER
                    ) {
                        nearWater = true
                        break
                    }
                }
                if (nearWater) break
            }

            // If near water, definitely make it sand
            if (nearWater) {
                map[ny][nx] = SAND
            }
        }
    }
}

// Generate and export the map with progress tracking
console.log('Starting de_river map generation...')
const riverMap: TileCodeGrid = generateRiverMap() as TileCodeGrid
console.log('Finished de_river map generation!')
export default riverMap
