import { system } from 'styled-system'

export interface FlexGapProps {
    columnGap?: number
    rowGap?: number
}

export const flexGap = system({
    columnGap: {
        property: 'columnGap',
        scale: 'space',
    },
    rowGap: {
        property: 'rowGap',
        scale: 'space',
    },
})
