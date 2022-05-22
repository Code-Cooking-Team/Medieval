export { v4 as uuid } from 'uuid'

export const randomNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
}
