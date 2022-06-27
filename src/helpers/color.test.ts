import { color0xToHex, colorHexTo0x } from './color'

const colors = [
    ['#ff0000', 0xff0000],
    ['#2b360a', 0x2b360a],
    ['#274517', 0x274517],
] as [string, number][]

test.each(colors)('convert 0x to hex', (stringColor, hexColor) => {
    expect(colorHexTo0x(stringColor)).toEqual(hexColor)
})

test.each(colors)('convert hex to 0x', (stringColor, hexColor) => {
    expect(color0xToHex(hexColor)).toEqual(stringColor)
})
