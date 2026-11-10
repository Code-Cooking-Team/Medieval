import { config } from '+config'
import { MeadowTile } from '+game/world/Tile'
import { World } from '+game/world/World'

import { expect, it } from 'bun:test'
import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three'

import { createWordPlane } from './createWordPlane'
import { raycastGround } from './raycastGround'

it.each(['left', 'right', 'both', 'random'] as const)(
    'matches the rendered terrain using %s diagonals',
    (diagonals) => {
        const tileSize = config.renderer.tileSize
        const world = new World(
            Array.from({ length: 7 }, () =>
                Array.from({ length: 8 }, () => new MeadowTile()),
            ),
            [],
        )
        const geometry = createWordPlane(world, diagonals)
        const positions = geometry.getAttribute('position')
        for (let i = 0; i < positions.count; i++)
            positions.setY(i, Math.sin(i * 0.8) * 0.1)
        const mesh = new Mesh(geometry, new MeshBasicMaterial({ side: DoubleSide }))
        const rays = [
            [
                [0.15, 0.4, 0.26],
                [0, -1, 0],
            ],
            [
                [-0.1, 0.25, 0.18],
                [1, -0.8, 0.2],
            ],
            [
                [0.73, 0.25, 0.63],
                [-1, -1, -1],
            ],
            [
                [0.73, 0.25, 0.63],
                [1, -1, 1],
            ],
            [
                [0.45, 0.12, 0.22],
                [-0.25, -0.15, 0.55],
            ],
        ] as const

        for (const [origin, direction] of rays) {
            const raycaster = new Raycaster(
                new Vector3(...origin),
                new Vector3(...direction).normalize(),
            )
            for (const far of [0.15, 2]) {
                raycaster.far = far
                const expected = raycaster.intersectObject(mesh, false)[0]?.distance
                const actual = raycastGround(raycaster.ray, geometry, 7, 6, tileSize, far)
                if (expected === undefined) expect(actual).toBeUndefined()
                else expect(actual).toBeCloseTo(expected, 7)
            }
        }
        geometry.dispose()
        mesh.material.dispose()
    },
)
