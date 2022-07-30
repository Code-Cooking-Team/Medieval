import { compressedLocalStorageKey, localStorageKey } from '+helpers'

import { useState } from 'react'

export const useLocalStorage = <T>(key: string, initial?: T, compressed = false) => {
    const lib = compressed ? compressedLocalStorageKey : localStorageKey
    const openStorage = lib<T>(key, initial)
    const [items, setItems] = useState<T>(() => openStorage.get())

    return [
        items,
        (value: T) => {
            openStorage.set(value)
            setItems(value)
        },
        () => {
            openStorage.remove()
            setItems(initial!)
        },
    ] as const
}
