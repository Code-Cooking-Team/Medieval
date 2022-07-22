import { Position } from '+game/types'

export const createArray = (length: number) => {
    return Array.from({ length }, (_, i) => i)
}

export const randomArrayItem = <T>(arr: T[]) => {
    return arr[Math.floor(Math.random() * arr.length)]
}

export const getPositionByIndex = (index: number, size: number) => {
    const x = index % size
    const y = Math.floor(index / size)
    return [x, y] as Position
}

export const removeArrayItem = <T>(array: T[], item: T) => {
    const index = array.indexOf(item)
    if (index !== -1) array.splice(index, 1)
}

export const asArray = <T>(value: T | T[]): NonNullable<T>[] => {
    if (value === undefined) return []
    if (Array.isArray(value)) return value as NonNullable<T>[]
    return [value!]
}
