import App from '+App'
import { theme } from '+ui/styles/theme'

import { ThemeProvider } from '@emotion/react'

export const Root = () => {
    return (
        <ThemeProvider theme={theme}>
            <App />
        </ThemeProvider>
    )
}
