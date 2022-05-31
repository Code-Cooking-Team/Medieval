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
