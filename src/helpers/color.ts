import { Color, type HSL, SRGBColorSpace } from 'three'

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

    const { r, g, b } = threeColor.getRGB({ r: 0, g: 0, b: 0 }, SRGBColorSpace)

    let nr = Math.round(r * 255 + (Math.random() - 0.5) * 2 * deviation)
    let ng = Math.round(g * 255 + (Math.random() - 0.5) * 2 * deviation)
    let nb = Math.round(b * 255 + (Math.random() - 0.5) * 2 * deviation)

    if (monochromatic) {
        let random = Math.random()
        nr = Math.round(r * 255 + (random - 0.5) * 2 * deviation)
        ng = Math.round(g * 255 + (random - 0.5) * 2 * deviation)
        nb = Math.round(b * 255 + (random - 0.5) * 2 * deviation)
    }

    nr = nr > 255 ? 255 : nr
    ng = ng > 255 ? 255 : ng
    nb = nb > 255 ? 255 : nb

    nr = nr < 0 ? 0 : nr
    ng = ng < 0 ? 0 : ng
    nb = nb < 0 ? 0 : nb

    threeColor.setRGB(nr / 255, ng / 255, nb / 255, SRGBColorSpace)

    return threeColor.getHex()
}

export const changeColorLightnessSaturation = (
    color: number,
    lightness: number | false,
    saturation: number | false,
) => {
    const threeColor = new Color(color)

    let hsl: HSL = { h: 0, s: 0, l: 0 }
    threeColor.getHSL(hsl, SRGBColorSpace)

    if (lightness) hsl.l = lightness
    if (saturation) hsl.s = saturation

    threeColor.setHSL(hsl.h, hsl.s, hsl.l, SRGBColorSpace)

    return threeColor.getHex()
}
