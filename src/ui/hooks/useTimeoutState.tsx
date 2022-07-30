import { useRef, useState } from 'react'

export const useTimeoutState = <T,>(initialState: T, delay = 1000) => {
    const [state, setState] = useState(initialState)
    const ref = useRef<any>()

    const set = (newState: T) => {
        if (ref.current) {
            clearTimeout(ref.current)
            ref.current = undefined
        }
        setState(newState)
        ref.current = setTimeout(() => set(initialState), delay)
    }

    return [state, set] as const
}
