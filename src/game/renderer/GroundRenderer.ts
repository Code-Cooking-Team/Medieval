import { getPositionByIndex } from '+helpers/array'
import { DoubleSide, Mesh, MeshStandardMaterial } from 'three'
import { Game } from '../Game'
import { createWordPlane } from './lib/createWordPlane'
import { ItemRenderer } from './lib/ItemRenderer'

export class GroundRenderer extends ItemRenderer {
    constructor(public game: Game) {
        super()

        const geometry = createWordPlane(this.game.word)

        const groundMaterial = new MeshStandardMaterial({
            color: 0x00660a,
            side: DoubleSide,
        })

        const groundWireframeMaterial = new MeshStandardMaterial({
            color: 0x005c09,
            wireframe: true,
        })

        const groundMesh = new Mesh(geometry, groundMaterial)
        const wireframeMesh = new Mesh(groundMesh.geometry, groundWireframeMaterial)
        wireframeMesh.position.y = 0.01

        const position = groundMesh.geometry.attributes.position
        const [wordWidth] = this.game.word.getSize()

        for (let i = 0; i < position.count; i++) {
            const tile = this.game.word.getTile(getPositionByIndex(i, wordWidth))
            position.setY(i, tile.height)
        }
        position.needsUpdate = true

        this.group.add(groundMesh)
        this.group.add(wireframeMesh)
    }
}
