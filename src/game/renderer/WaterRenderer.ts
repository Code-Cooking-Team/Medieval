import { Clock, DoubleSide, Mesh, MeshStandardMaterial } from 'three'
import { Game } from '../Game'
import { createWordPlane } from './lib/createWordPlane'
import { ItemRenderer } from './lib/ItemRenderer'

export class WaterRenderer extends ItemRenderer {
    private mesh?: Mesh

    constructor(public game: Game) {
        super()
        const geometry = createWordPlane(this.game.word)

        const material = new MeshStandardMaterial({
            color: 0x5dd1e8,
            side: DoubleSide,
            transparent: true,
            opacity: 0.7,
            roughness: 0.2,
            metalness: 0.2
            
        })

        this.mesh = new Mesh(geometry, material)
        this.mesh.position.y = -0.5

        this.group.add(this.mesh)
    }

    public render(clock: Clock) {
        const time = clock.getElapsedTime() * 10

        if (!this.mesh) return

        const position = this.mesh.geometry.attributes.position
        for (let i = 0; i < position.count; i++) {
            const y = 0.12 * Math.sin(i / 1 + (time + i) / 8)
            position.setY(i, y)
        }
        position.needsUpdate = true
    }
}
