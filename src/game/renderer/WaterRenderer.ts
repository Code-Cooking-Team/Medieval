import { config } from '+config'
import { Game } from '+game/Game'
import { ClockInfo } from '+game/types'

import { DoubleSide, Mesh, MeshStandardMaterial } from 'three'

import { BasicRenderer } from './lib/BasicRenderer'
import { createWordPlane } from './lib/createWordPlane'

export class WaterRenderer extends BasicRenderer {
    private mesh?: Mesh

    constructor(public game: Game) {
        super()
        const geometry = createWordPlane(this.game.world, 'random', 0.8)

        const material = new MeshStandardMaterial({
            color: 0xa2d3e8,
            // side: DoubleSide,
            transparent: true,
            opacity: 0.6,
            roughness: 0,
            metalness: 1,
            flatShading: true,
            depthTest: true,
            depthWrite: false,
        })

        this.mesh = new Mesh(geometry, material)
        this.mesh.position.y = -0.5 * config.renderer.tileSize
        this.mesh.renderOrder = 0
        this.group.add(this.mesh)
    }

    public render({ elapsedTime }: ClockInfo) {
        const time = elapsedTime * 10
        if (!this.mesh) return
        const position = this.mesh.geometry.attributes.position!
        for (let i = 0; i < position.count; i++) {
            let y =
                0.15 * Math.sin(i / 2 + (time + i) / 8) +
                0.15 * Math.sin(i / 1.2 + (time / 10 + i) / 8)
            position.setY(i, y * config.renderer.tileSize)
        }
        position.needsUpdate = true
    }
}
