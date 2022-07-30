import '@emotion/react'

import { Theme as AppTheme } from '../ui/styles/theme'

declare module '@emotion/react' {
    export interface Theme extends AppTheme {}
}
