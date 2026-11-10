import { expect, test } from 'bun:test'
import { accumulateRunoff, drainTerrain } from './drainage'

test('runoff escapes a depression and joins a single downhill network', () => {
    const terrain = [
        [5, 6, 6, 6, 8],
        [1, 2, 0, 5, 7],
        [5, 6, 6, 6, 8],
    ]
    const { root, order, downstream, minimum } = drainTerrain(terrain, [0, 1], 0, 0)
    const area = accumulateRunoff(order, downstream, 9, 30)

    expect(order).toHaveLength(15)
    expect(area[root]).toBe(45)
    expect(downstream[7]).toBe(6)
    expect(downstream[6]).toBe(root)
    for (const cell of order.slice(1)) {
        const parent = downstream[cell]!
        expect(minimum[cell]!).toBeGreaterThan(minimum[parent]!)
        expect(area[parent]!).toBeGreaterThan(area[cell]!)
    }
})
