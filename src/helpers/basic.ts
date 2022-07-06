export { v4 as uuid } from 'uuid'

export const random = (min: number, max: number, rounded = false) => {
    const value = Math.random() * (max - min) + min
    return rounded ? Math.round(value) : value
}
