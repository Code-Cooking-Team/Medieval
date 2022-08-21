import { rotatePositionOnGrind } from './math'

it('should not rotate a point', () => {
    const position = rotatePositionOnGrind([0, 0], [2, 2], 0)
    expect(position).toEqual([0, 0])
})

it('should rotate point once', () => {
    // 1 0 0
    // 0 0 0
    // 0 0 0
    const position = rotatePositionOnGrind([0, 0], [3, 3], 1)

    // 0 0 1
    // 0 0 0
    // 0 0 0
    expect(position).toEqual([2, 0])
})

it('should rotate point twice', () => {
    // 0 0 0 0
    // 1 0 0 0
    // 0 0 0 0
    const position = rotatePositionOnGrind([0, 1], [4, 3], 2)

    // 0 0 0 0
    // 0 0 0 1
    // 0 0 0 0
    expect(position).toEqual([3, 1])
})

it('should rotate point thrice', () => {
    // 0 0 0 0
    // 0 0 0 0
    // 1 0 0 0
    // 0 0 0 0
    const position = rotatePositionOnGrind([0, 2], [4, 4], 3)

    // 0 0 0 0
    // 0 0 0 0
    // 0 0 0 0
    // 0 0 1 0
    expect(position).toEqual([2, 3])
})

it('should rotate point on big space', () => {
    // 0 0 0
    // 0 0 0
    // 1 0 0
    // 0 0 0
    // 0 0 0
    // 0 0 0
    // 0 0 0
    // 0 0 0
    const position = rotatePositionOnGrind([0, 2], [3, 8], 1)

    // 0 0 0 0 0 1 0 0
    // 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0
    expect(position).toEqual([5, 0])
})
