import { Color } from 'three'

export const color0xToHex = (color: number) => {
    return `#${color.toString(16)}`
}

export const colorHexTo0x = (color: string) => {
    return parseInt(color.replace('#', ''), 16)
}

export const generateSimilarColor = (
    color: number,
    deviation: number,
    monochromatic?: boolean,
) => {
    const threeColor = new Color(color)

    const r = threeColor.r * 255
    const g = threeColor.g * 255
    const b = threeColor.b * 255

    let nr = Math.round(r + (Math.random() - 0.5) * 2 * deviation)
    let ng = Math.round(g + (Math.random() - 0.5) * 2 * deviation)
    let nb = Math.round(b + (Math.random() - 0.5) * 2 * deviation)

    if (monochromatic) {
        let random = Math.random()
        nr = Math.round(r + (random - 0.5) * 2 * deviation)
        ng = Math.round(g + (random - 0.5) * 2 * deviation)
        nb = Math.round(b + (random - 0.5) * 2 * deviation)
    }

    nr = nr > 255 ? 255 : nr
    ng = ng > 255 ? 255 : ng
    nb = nb > 255 ? 255 : nb

    nr = nr < 0 ? 0 : nr
    ng = ng < 0 ? 0 : ng
    nb = nb < 0 ? 0 : nb

    threeColor.r = nr / 255
    threeColor.g = ng / 255
    threeColor.b = nb / 255

    return threeColor.getHex()
}
