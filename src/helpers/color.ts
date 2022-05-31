export const color0xToHex = (color: number) => {
    return `#${color.toString(16)}`
}

export const colorHexTo0x = (color: string) => {
    return parseInt(color.replace('#', ''), 16)
}
