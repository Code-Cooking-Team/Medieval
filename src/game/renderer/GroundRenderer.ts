import { config } from '+config'
import { Game } from '+game/Game'
import { getPositionByIndex, HorizontalPlaneGeometry } from '+helpers'

import { BufferAttribute, Color, DoubleSide, Mesh, MeshStandardMaterial } from 'three'

import { BasicRenderer } from './lib/BasicRenderer'
import { createWordPlane } from './lib/createWordPlane'

export class GroundRenderer extends BasicRenderer {
    private groundMesh?: Mesh
    private geometry?: HorizontalPlaneGeometry

    constructor(public game: Game) {
        super()

        this.geometry = createWordPlane(this.game.world, 'both')

        const count = this.geometry.attributes.position!.count
        this.geometry.setAttribute(
            'color',
            new BufferAttribute(new Float32Array(count * 3), 3),
        )

        const groundMaterial = new MeshStandardMaterial({
            side: DoubleSide,
            metalness: 0.8,
            roughness: 1,
            vertexColors: true,
        })

        this.groundMesh = new Mesh(this.geometry, groundMaterial)
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
            position.setY(i, tile.height)
            color.setHex(tile.color)
            colors.setXYZ(i, color.r, color.g, color.b)
            colors.needsUpdate = true
        }

        position.needsUpdate = true
    }
}
