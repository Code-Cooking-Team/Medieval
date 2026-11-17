import { config } from '+config'
import { type Game } from '+game/Game'
import { createTerrainNoise } from '+game/world/terrainNoise'
import { TileType } from '+game/world/types'
import { getPositionByIndex } from '+helpers/array'
import { type HorizontalPlaneGeometry } from '+helpers/three'

import {
    BufferAttribute,
    Color,
    DoubleSide,
    LinearSRGBColorSpace,
    Mesh,
    MeshStandardMaterial,
    Ray,
    type Raycaster,
    RepeatWrapping,
    SRGBColorSpace,
    TextureLoader,
    Vector3,
} from 'three'

import { BasicRenderer } from './lib/BasicRenderer'
import { createWordPlane } from './lib/createWordPlane'
import { raycastGround } from './lib/raycastGround'
import { TerrainRocks } from './lib/TerrainRocks'
import colorUrl from './textures/test4color.png'
import heightUrl from './textures/test4height.png'

export class GroundRenderer extends BasicRenderer {
    private groundMesh?: Mesh
    private groundMaterial: MeshStandardMaterial
    private readonly unsubscribeTileUpdate: () => void
    private readonly untrackTileChanges: () => void
    private readonly changedTiles = new Set<number>()
    private rockRevision = -1
    private cliffRevision = -1
    private wireframeMesh?: Mesh
    private readonly leafLitter: ReturnType<typeof createTerrainNoise>
    private readonly rocks: TerrainRocks
    private geometry?: HorizontalPlaneGeometry

    constructor(public game: Game) {
        super()
        this.leafLitter = createTerrainNoise((game.world.seed ?? 0) ^ 0x312c85)

        this.geometry = createWordPlane(this.game.world, config.renderer.diagonals)

        const count = this.geometry.attributes.position!.count
        this.geometry.setAttribute(
            'color',
            new BufferAttribute(new Float32Array(count * 3), 3),
        )

        this.groundMaterial = new MeshStandardMaterial({
            side: DoubleSide,
            metalness: 0.1,
            roughness: 0.9,
            vertexColors: true,
            flatShading: true,
        })

        if (config.renderer.texture) {
            this.loadGroundTextures()
        }

        this.groundMesh = new Mesh(this.geometry, this.groundMaterial)
        this.groundMesh.receiveShadow = true
        this.group.add(this.groundMesh)
        this.rocks = new TerrainRocks(
            game.world,
            config.renderer.tileSize,
            this.groundMaterial,
        )
        this.group.add(this.rocks.group)

        if (config.debug.groundWireframe) {
            const groundWireframeMaterial = new MeshStandardMaterial({
                color: 0x000000,
                wireframe: true,
                transparent: true,
                opacity: 0.05,
                depthWrite: false,
            })

            const wireframeMesh = new Mesh(
                this.groundMesh.geometry,
                groundWireframeMaterial,
            )

            wireframeMesh.renderOrder = 1
            wireframeMesh.receiveShadow = true
            wireframeMesh.position.y = 0.01
            this.group.add(wireframeMesh)
            this.wireframeMesh = wireframeMesh
        }

        this.untrackTileChanges = game.world.trackTileChanges(this.changedTiles)
        this.unsubscribeTileUpdate = game.world.emitter.on('tailUpdate', () => {
            if (this.changedTiles.size) this.renderTiles(this.changedTiles)
            this.changedTiles.clear()
        })
    }

    public raycastRocks(raycaster: Raycaster) {
        return this.rocks.raycast(raycaster)
    }

    private loadGroundTextures() {
        const loader = new TextureLoader()
        const [width, height] = this.game.world.getSize()

        this.groundMaterial.onBeforeCompile = (shader) => {
            shader.uniforms.groundTextureSpan = { value: config.renderer.tileSize * 38 }
            shader.vertexShader = 'varying vec3 vGroundPosition;\n' + shader.vertexShader
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
                vGroundPosition = transformed;
                #ifdef USE_INSTANCING
                    vGroundPosition = (instanceMatrix * vec4(transformed, 1.0)).xyz;
                #endif`,
            )
            shader.fragmentShader =
                'varying vec3 vGroundPosition;\n uniform float groundTextureSpan;\n' +
                shader.fragmentShader
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <map_fragment>',
                /* glsl */ `
                    #ifdef USE_MAP
                        // Blend three projections so rock faces keep their grain on steep slopes.
                        vec3 weights = abs(normalize(cross(dFdx(vGroundPosition), dFdy(vGroundPosition))));
                        weights = pow(weights, vec3(4.0));
                        weights /= weights.x + weights.y + weights.z;
                        vec3 p = vGroundPosition / groundTextureSpan;
                        vec3 grain = texture2D(map, p.zy).rgb * weights.x
                            + texture2D(map, p.xz).rgb * weights.y
                            + texture2D(map, p.xy).rgb * weights.z;
                        diffuseColor.rgb *= mix(vec3(1.0), grain, 0.68);
                    #endif
                `,
            )
        }

        loader.load(colorUrl, (texture) => {
            texture.wrapS = RepeatWrapping
            texture.wrapT = RepeatWrapping
            texture.colorSpace = SRGBColorSpace
            this.groundMaterial.map = texture
            this.groundMaterial.needsUpdate = true
        })
        loader.load(heightUrl, (texture) => {
            texture.wrapS = RepeatWrapping
            texture.wrapT = RepeatWrapping
            texture.repeat.set(width / 34, height / 34)
            this.groundMaterial.bumpMap = texture
            this.groundMaterial.bumpScale = 0.038
            this.groundMaterial.needsUpdate = true
        })
    }

    public groundDistance(raycaster: Raycaster) {
        const ground = this.focusDistance(raycaster)
        if (!this.wireframeMesh) return ground
        const wireframe = this.focusDistance(raycaster, this.wireframeMesh.position.y)
        return wireframe === undefined ? ground : Math.min(ground ?? Infinity, wireframe)
    }

    public focusDistance({ ray, near, far }: Raycaster, verticalOffset = 0) {
        if (!this.groundMesh || !this.geometry || far <= near) return
        // The ground is translated to the center of the map without rotation or scale.
        const offset = this.groundMesh.getWorldPosition(new Vector3())
        offset.y += verticalOffset
        const start = ray.at(near, new Vector3()).sub(offset)
        const [width, height] = this.game.world.getSize()
        const distance = raycastGround(
            new Ray(start, ray.direction),
            this.geometry,
            width - 1,
            height - 1,
            config.renderer.tileSize,
            far - near,
        )
        return distance === undefined ? undefined : distance + near
    }

    public init() {
        this.renderTiles()
    }

    public destroy() {
        this.unsubscribeTileUpdate()
        this.untrackTileChanges()
        this.rocks.dispose()
    }

    private renderTiles(indices?: Iterable<number>) {
        if (!this.groundMesh || !this.geometry) return

        const { world } = this.game
        const [wordWidth] = world.getSize()

        const position = this.geometry.attributes.position as BufferAttribute
        const colors = this.geometry.attributes.color as BufferAttribute
        const color = new Color()

        let heightsChanged = false
        let rocksChanged = this.rockRevision !== world.rockRevision
        const vertex = new Vector3()
        const bounds = this.geometry.boundingSphere
        for (const i of indices ?? Array.from({ length: position.count }, (_, i) => i)) {
            const positionOnMap = getPositionByIndex(i, wordWidth)
            const tile = world.getTile(positionOnMap)
            const height = Math.fround(tile.height * config.renderer.tileSize)
            if (position.getY(i) !== height) {
                position.setY(i, height)
                heightsChanged = true
                if (indices) {
                    position.addUpdateRange(i * 3, 3)
                    if (bounds) {
                        // Keep frustum culling conservative without scanning every vertex.
                        vertex.fromBufferAttribute(position, i)
                        bounds.radius = Math.max(
                            bounds.radius,
                            bounds.center.distanceTo(vertex),
                        )
                    }
                    // Rock bases sample the terrain under their footprint.
                    rocksChanged ||= world.hasTileTypeNear(
                        ...positionOnMap,
                        TileType.Rock,
                        6,
                    )
                }
            }
            // Saved tile palettes were authored as linear RGB.
            const wornPath =
                tile.type === TileType.ImportantFootpath ||
                (tile.type === TileType.Footpath && tile.buildingId !== undefined)
            const ground = wornPath ? (tile.previousTile ?? tile) : tile
            color.setHex(ground.color, LinearSRGBColorSpace)
            if (ground.type === TileType.Forest) {
                const [x, y] = positionOnMap
                // Mix fresh olive leaves and dark litter at two scales.
                const litter =
                    0.44 +
                    this.leafLitter.sample(x / 2.5, y / 2.5) * 0.24 +
                    this.leafLitter.sample(x, y) * 0.32
                const decay = Math.min(1, Math.max(0, litter))
                const brightness = color.g
                color.setRGB(
                    color.r * 0.82 * (1 - decay) + brightness * 0.68 * decay,
                    brightness * (0.82 - 0.39 * decay),
                    color.b * 0.68 * (1 - decay) + brightness * 0.21 * decay,
                )
            } else if (ground.type === TileType.Meadow) {
                color.setRGB(color.r * 0.79, color.g * 0.7, color.b * 0.41)
            }
            if (wornPath) {
                const [x, y] = positionOnMap
                const variation =
                    this.leafLitter.sample(x / 2, y / 2) * 0.22 +
                    this.leafLitter.sample(x, y) * 0.13
                const wear =
                    (tile.type === TileType.ImportantFootpath ? 0.76 : 0.56) + variation
                const { r, g, b } = color
                // Shift the original ground toward warm soil while keeping its local value.
                color.setRGB(
                    r * (1 - 0.14 * wear) + g * 0.24 * wear,
                    g * (1 - 0.46 * wear),
                    b * (1 - 0.3 * wear),
                )
            }
            colors.setXYZ(i, color.r, color.g, color.b)
            if (indices) colors.addUpdateRange(i * 3, 3)
        }

        colors.needsUpdate = true
        if (heightsChanged) position.needsUpdate = true
        if (!indices) this.geometry.computeBoundingSphere()
        if (rocksChanged || this.cliffRevision !== world.cliffRevision) {
            this.rocks.update(rocksChanged)
            this.rockRevision = world.rockRevision
            this.cliffRevision = world.cliffRevision
        }
    }
}
