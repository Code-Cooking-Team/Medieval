import { localStorageKey } from '+helpers/storage'

import { useState } from 'react'

export const useLocalStorage = <T>(key: string, initial: T) => {
    const openStorage = localStorageKey<T>(key, initial)
    const [items, setItems] = useState<T>(openStorage.get())

    return [
        items,
        (value: T) => {
            openStorage.set(value)
            setItems(value)
        },
        () => {
            openStorage.remove()
            setItems(initial)
        },
    ] as const
}
