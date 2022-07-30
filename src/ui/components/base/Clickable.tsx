import { resetButtonCSS } from '+ui/styles/snippets'

import styled from '@emotion/styled'
import { ReactNode } from 'react'

import { BoxProps, boxStyledSystem } from './Box'

interface ClickableProps extends BoxProps {
    onClick(): void
    submit?: true
    children?: ReactNode
    title?: string
    hover?: true
}

export const Clickable = ({ submit, ...props }: ClickableProps) => {
    return <StyledButton type={submit ? 'submit' : 'button'} {...props} />
}

export const StyledButton = styled.button<BoxProps & { hover?: true }>(
    resetButtonCSS,
    ({ hover, theme }) => ({
        cursor: 'pointer',
        borderRadius: hover && theme.borderRadius.normal,
        transition: hover && theme.values.transition,
        ':hover, :focus-visible, :active': hover && {
            background: theme.colors.border,
        },
    }),
    boxStyledSystem,
)
