import { config } from '+config'
import { Game } from '+game/Game'
import { getPositionByIndex, HorizontalPlaneGeometry } from '+helpers'

import {
    BufferAttribute,
    Color,
    DoubleSide,
    LinearSRGBColorSpace,
    Mesh,
    MeshStandardMaterial,
    RepeatWrapping,
    TextureLoader,
} from 'three'

import { BasicRenderer } from './lib/BasicRenderer'
import { createWordPlane } from './lib/createWordPlane'
import colorUrl from './textures/test4color.png'
import heightUrl from './textures/test4height.png'

export class GroundRenderer extends BasicRenderer {
    private groundMesh?: Mesh
    private groundMaterial: MeshStandardMaterial
    private geometry?: HorizontalPlaneGeometry

    constructor(public game: Game) {
        super()

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
        }

        this.game.world.emitter.on('tailUpdate', () => {
            this.render()
        })
    }

    private loadGroundTextures() {
        const loader = new TextureLoader()
        const [width, height] = this.game.world.getSize()

        this.groundMaterial.onBeforeCompile = (shader) => {
            shader.uniforms.groundTextureSpan = { value: config.renderer.tileSize * 38 }
            shader.vertexShader = 'varying vec3 vGroundPosition;\n' + shader.vertexShader
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                '#include <begin_vertex>\n vGroundPosition = transformed;',
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
            this.groundMaterial.map = texture
            this.groundMaterial.needsUpdate = true
        })
        loader.load(heightUrl, (texture) => {
            texture.wrapS = RepeatWrapping
            texture.wrapT = RepeatWrapping
            texture.repeat.set(width / 20, height / 20)
            this.groundMaterial.bumpMap = texture
            this.groundMaterial.bumpScale = 0.007
            this.groundMaterial.needsUpdate = true
        })
    }

    public init() {
        this.render()
    }

    public render() {
        if (!this.groundMesh || !this.geometry) return

        const [wordWidth] = this.game.world.getSize()

        const position = this.groundMesh.geometry.attributes.position!
        const colors = this.geometry.attributes.color!
        const color = new Color()

        for (let i = 0; i < position.count; i++) {
            const tile = this.game.world.getTile(getPositionByIndex(i, wordWidth))
            position.setY(i, tile.height * config.renderer.tileSize)
            // Saved tile palettes were authored as linear RGB.
            color.setHex(tile.color, LinearSRGBColorSpace)
            colors.setXYZ(i, color.r, color.g, color.b)
        }

        colors.needsUpdate = true
        position.needsUpdate = true
        this.geometry.computeBoundingSphere()
    }
}
