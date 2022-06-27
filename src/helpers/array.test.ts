import { createArray, getPositionByIndex } from './array'

it('should create an array', () => {
    const array = createArray(3)
    expect(array).toEqual([0, 1, 2])
})

it('should get position by index', () => {
    const item = getPositionByIndex(5, 3)
    expect(item).toEqual([2, 1])
})
