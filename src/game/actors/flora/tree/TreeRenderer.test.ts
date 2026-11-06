import { config } from '+config'
import type { Game } from '+game/Game'

import { InstancedMesh, Matrix4, Vector3 } from 'three'

import { TreeRenderer } from './TreeRenderer'

test('wind moves the crown around a trunk base fixed at ground level', () => {
    const game = {
        findActorsByType: () => [{ position: [2, 3], seed: 42 }],
        world: { getTile: () => ({ height: 1 }) },
    } as unknown as Game
    const renderer = new TreeRenderer(game)
    const previousTreeWaving = config.renderer.treeWaving

    try {
        config.renderer.treeWaving = true
        const ground = new Vector3(2, 1, 3).multiplyScalar(config.renderer.tileSize)
        const matrix = new Matrix4()

        const crownPositionAt = (elapsedTime: number) => {
            renderer.render({ elapsedTime, deltaTime: 0 })
            renderer.group.updateMatrixWorld(true)
            const [trunk, crown] = renderer.group.children as [InstancedMesh, InstancedMesh]
            trunk.geometry.computeBoundingBox()
            const base = new Vector3(0, trunk.geometry.boundingBox!.min.y, 0)
            trunk.getMatrixAt(0, matrix)
            base.applyMatrix4(matrix).applyMatrix4(trunk.matrixWorld)
            expect(base.distanceTo(ground)).toBeCloseTo(0, 5)

            crown.geometry.computeBoundingBox()
            const center = crown.geometry.boundingBox!.getCenter(new Vector3())
            crown.getMatrixAt(0, matrix)
            return center.applyMatrix4(matrix).applyMatrix4(crown.matrixWorld)
        }

        expect(crownPositionAt(0).distanceTo(crownPositionAt(2))).toBeGreaterThan(0.001)
    } finally {
        config.renderer.treeWaving = previousTreeWaving
        renderer.destroy()
    }
})
