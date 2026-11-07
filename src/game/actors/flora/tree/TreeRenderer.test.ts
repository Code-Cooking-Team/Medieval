import { config } from '+config'
import type { Game } from '+game/Game'

import { InstancedMesh, Matrix4, Vector3 } from 'three'

import { TreeRenderer } from './TreeRenderer'

test.each([0, 3, 7, 11])('tree %i sways around a fixed trunk base', (seed) => {
    const game = {
        findActorsByType: () => [{ position: [2, 3], seed }],
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
            const meshes = renderer.group.children as InstancedMesh[]
            const activeMeshes = meshes.filter((mesh) => mesh.count > 0)
            expect(activeMeshes).toHaveLength(2)
            const [trunk, crown] = activeMeshes as [InstancedMesh, InstancedMesh]
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

test('trees fall after losing ten HP and stay propped up while being chopped', () => {
    const trees = [9, 21].map((seed) => ({
        position: [2, 3],
        seed,
        hp: 100,
        maxHp: 100,
    }))
    const game = {
        findActorsByType: () => trees,
        world: { getTile: () => ({ height: 1 }) },
    } as unknown as Game
    const renderer = new TreeRenderer(game)
    const previousTreeWaving = config.renderer.treeWaving

    try {
        config.renderer.treeWaving = false
        const trunkAxis = (index: number) => {
            const trunk = renderer.group.children.find(
                (child) => (child as InstancedMesh).count === trees.length,
            ) as InstancedMesh
            const matrix = new Matrix4()
            trunk.getMatrixAt(index, matrix)
            return new Vector3(0, 1, 0).transformDirection(matrix)
        }

        renderer.render({ elapsedTime: 0, deltaTime: 0 })
        const standing = trunkAxis(0)
        trees.forEach((tree) => (tree.hp = 91))
        renderer.render({ elapsedTime: 1, deltaTime: 1 })
        expect(standing.angleTo(trunkAxis(0))).toBeCloseTo(0)

        trees.forEach((tree) => (tree.hp = 90))
        renderer.render({ elapsedTime: 1.2, deltaTime: 0.2 })
        const startingToFall = trunkAxis(0)
        const firstStep = standing.angleTo(startingToFall)
        expect(firstStep).toBeGreaterThan(0)
        renderer.render({ elapsedTime: 1.4, deltaTime: 0.2 })
        expect(startingToFall.angleTo(trunkAxis(0))).toBeGreaterThan(firstStep)

        renderer.render({ elapsedTime: 2, deltaTime: 0.6 })
        const fallen = trunkAxis(0)
        expect(fallen.y).toBeCloseTo(Math.cos((80 * Math.PI) / 180))
        expect(fallen.angleTo(trunkAxis(1))).toBeGreaterThan(0.1)

        trees.forEach((tree) => (tree.hp = 0))
        renderer.render({ elapsedTime: 3, deltaTime: 1 })
        expect(fallen.angleTo(trunkAxis(0))).toBeCloseTo(0)
    } finally {
        config.renderer.treeWaving = previousTreeWaving
        renderer.destroy()
    }
})
