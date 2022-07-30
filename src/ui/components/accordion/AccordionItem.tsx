import { resetButtonCSS } from '+ui/styles/snippets'

import { keyframes } from '@emotion/react'
import styled from '@emotion/styled'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ReactNode } from 'react'

import { Box } from '../base/Box'

interface AccordionItemProps {
    value: string
    label: ReactNode
    children: ReactNode
}

export const AccordionItem = ({ value, label, children }: AccordionItemProps) => {
    return (
        <Item value={value}>
            <Header>
                <Trigger>{label}</Trigger>
            </Header>
            <Content>
                <Box p={2}>{children}</Box>
            </Content>
        </Item>
    )
}

const slideDown = keyframes({
    from: { height: 0 },
    to: { height: 'var(--radix-accordion-content-height)' },
})

const slideUp = keyframes({
    from: { height: 'var(--radix-accordion-content-height)' },
    to: { height: 0 },
})

const Item = styled(AccordionPrimitive.Item)({})

const Header = styled(AccordionPrimitive.Header)({
    margin: 0,
    fontWeight: 'normal',
})

const Trigger = styled(AccordionPrimitive.Trigger)(resetButtonCSS, ({ theme }) => ({
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: theme.space[2],
    borderLeft: '2px solid',
    borderColor: theme.colors.black10,
    ':hover, :focus-visible': {
        borderColor: theme.colors.black70,
    },
    '&[data-state="open"]': {
        borderColor: theme.colors.primary,
        color: theme.colors.primary,
    },
}))

const Content = styled(AccordionPrimitive.Content)(({ theme }) => ({
    overflow: 'hidden',
    borderLeft: '2px solid',
    borderColor: theme.colors.black10,
    '&[data-state="open"]': {
        borderColor: theme.colors.primary,
        animation: `${slideDown} 300ms cubic-bezier(0.87, 0, 0.13, 1)`,
    },
    '&[data-state="closed"]': {
        animation: `${slideUp} 300ms cubic-bezier(0.87, 0, 0.13, 1)`,
    },
}))
