import { config } from '+config'
import { getPositionByIndex } from '+helpers/array'
import { HorizontalPlaneGeometry } from '+helpers/mesh'
import { BufferAttribute, Color, DoubleSide, Mesh, MeshStandardMaterial } from 'three'
import { Game } from '../Game'
import { BasicRenderer } from './lib/BasicRenderer'
import { createWordPlane } from './lib/createWordPlane'

export class GroundRenderer extends BasicRenderer {
    private groundMesh?: Mesh
    private geometry?: HorizontalPlaneGeometry

    constructor(public game: Game) {
        super()

        this.geometry = createWordPlane(this.game.word, 'both')

        const count = this.geometry.attributes.position.count
        this.geometry.setAttribute(
            'color',
            new BufferAttribute(new Float32Array(count * 3), 3),
        )

        const groundMaterial = new MeshStandardMaterial({
            side: DoubleSide,
            vertexColors: true,
        })

        const groundWireframeMaterial = new MeshStandardMaterial({
            color: 0x000000,
            wireframe: true,
            transparent: true,
            opacity: 0.05,
            visible: config.renderer.wireframe,
        })

        this.groundMesh = new Mesh(this.geometry, groundMaterial)
        this.groundMesh.receiveShadow = true

        const wireframeMesh = new Mesh(this.groundMesh.geometry, groundWireframeMaterial)
        wireframeMesh.receiveShadow = true
        wireframeMesh.position.y = 0.01

        this.render()

        this.group.add(this.groundMesh)
        this.group.add(wireframeMesh)

        this.game.word.emitter.on('tailUpdate', () => {
            this.render()
        })
    }

    public render() {
        if (!this.groundMesh || !this.geometry) return

        const [wordWidth] = this.game.word.getSize()

        const position = this.groundMesh.geometry.attributes.position
        const colors = this.geometry.attributes.color
        const color = new Color()

        for (let i = 0; i < position.count; i++) {
            const tile = this.game.word.getTile(getPositionByIndex(i, wordWidth))
            position.setY(i, tile.height)
            color.setHex(tile.color)
            colors.setXYZ(i, color.r, color.g, color.b)
            colors.needsUpdate = true
        }
        position.needsUpdate = true
    }
}
