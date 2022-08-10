export const normalizeEventKeyName = (key: string) => {
    if (key.length === 1) {
        // Single key like [W] or [S]
        return key.toLowerCase()
    }

    return key
}
