import { compress, decompress } from 'lz-string'

export const localStorageKey = <T>(key: string, defaultValue?: T) => ({
    get: (): T => {
        const value = localStorage.getItem(key)
        return value ? JSON.parse(value) : defaultValue
    },
    set: (value: T) => {
        localStorage.setItem(key, JSON.stringify(value))
    },
    remove: () => localStorage.removeItem(key),
})

export const compressedLocalStorageKey = <T>(key: string, defaultValue?: T) => ({
    get: (): T => {
        const value = localStorage.getItem(key)
        const decompressed = typeof value === 'string' ? decompress(value) : undefined
        return typeof decompressed === 'string' ? JSON.parse(decompressed) : defaultValue
    },
    set: (value: T) => {
        const data = compress(JSON.stringify(value))
        localStorage.setItem(key, data)
    },
    remove: () => localStorage.removeItem(key),
})
