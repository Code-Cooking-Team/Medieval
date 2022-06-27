import { color0xToHex, colorHexTo0x } from './color'

it('should convert 0x to hex', () => {
    const color = 0xff0000
    const hex = color0xToHex(color)
    expect(hex).toEqual('#ff0000')
})

it('should convert hex to 0x', () => {
    const color = '#ff0000'
    const hex = colorHexTo0x(color)
    expect(hex).toEqual(0xff0000)
})
