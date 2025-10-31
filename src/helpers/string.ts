export const normalizeEventKeyName = (key: string) => {
    if (key.length === 1) {
        // Single key like [W] or [S]
        return key.toLowerCase()
    }

    return key
}

export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ')
}
