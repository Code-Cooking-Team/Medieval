export const createArray = (length: number) => {
    return Array.from({ length }, (_, i) => i)
}

export const randomArrayItem = <T>(arr: T[]) => {
    return arr[Math.floor(Math.random() * arr.length)]
}
