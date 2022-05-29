export { v4 as uuid } from 'uuid'

export const random = (min: number, max: number) => {
    return Math.random() * (max - min) + min
}
