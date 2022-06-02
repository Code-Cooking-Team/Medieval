export const color0xToHex = (color: number) => {
    return `#${color.toString(16)}`
}

export const colorHexTo0x = (color: string) => {
    return parseInt(color.replace('#', ''), 16)
}

export const generateSimilarColor = (color: number, deviation: number) => {
    const [r, g, b] = color
        .toString(16)
        .match(/.{2}/g)!
        .map((v) => parseInt(v, 16))

    let nr = Math.round(r + (Math.random() - 0.5) * 2 * deviation)
    let ng = Math.round(g + (Math.random() - 0.5) * 2 * deviation)
    let nb = Math.round(b + (Math.random() - 0.5) * 2 * deviation)

    nr = nr > 255 ? 255 : nr
    ng = ng > 255 ? 255 : ng
    nb = nb > 255 ? 255 : nb

    nr = nr < 0 ? 0 : nr
    ng = ng < 0 ? 0 : ng
    nb = nb < 0 ? 0 : nb

    return parseInt('0x' + nr.toString(16) + ng.toString(16) + nb.toString(16), 16)
}
