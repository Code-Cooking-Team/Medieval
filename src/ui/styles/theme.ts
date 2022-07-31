export const colors = {
    primary: '#C8A13C',

    text: '#EEE',
    textMuted: '#CCC',

    border: '#444',

    white: '#FFF',
    lightGray: '#CCC',

    black: '#0c0c0c',
    black70: 'rgba(0,0,0,.7)',
    black10: 'rgba(0,0,0,.1)',

    danger: 'red',
    transparent: 'transparent',
}

export type Color = keyof typeof colors

export interface ThemedColorProps {
    color?: Color
    bg?: Color
}

const breakpoints = ['40em', '52em', '64em']
const fontSizes = [12, 14, 16, 20, 24, 32, 48]
const space = [0, 4, 8, 16, 32, 64, 128, 256, 512]

const borderRadius = {
    normal: 4,
    small: 3,
}

const values = {
    transition: 'all 0.2s cubic-bezier(.09,.88,.23,1)',
    shadowSmall: '2px 2px 8px rgba(0,0,0,0.5)',
    shadowLarge: '4px 4px 18px rgba(0,0,0,0.55)',
}

export const theme = {
    colors,
    breakpoints,
    fontSizes,
    space,
    values,
    borderRadius,
}

export type Theme = typeof theme
