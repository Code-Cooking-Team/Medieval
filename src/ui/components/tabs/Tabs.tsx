import { resetButtonCSS } from '+ui/styles/snippets'

import styled from '@emotion/styled'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { Children, ReactElement, ReactNode } from 'react'

import { TabProps } from './Tab'

interface TabsProps {
    children: ReactNode
}

export const Tabs = (props: TabsProps) => {
    const items = Children.toArray(props.children) as ReactElement<TabProps>[]

    const currentIndex = items.findIndex((el) => el.props.isActive)
    const openIndex = currentIndex !== -1 ? currentIndex : 0

    return (
        <TabsPrimitive.Root defaultValue={openIndex.toString()}>
            <List>
                {items.map((el, index) => (
                    <Trigger key={index} value={index.toString()}>
                        {el.props.icon && <el.props.icon size={18} aria-hidden="true" />}
                        <Label>{el.props.label}</Label>
                    </Trigger>
                ))}
            </List>
            {items.map((el, index) => (
                <TabsPrimitive.Content key={index} value={index.toString()}>
                    {el.props.children}
                </TabsPrimitive.Content>
            ))}
        </TabsPrimitive.Root>
    )
}

const List = styled(TabsPrimitive.List)({
    display: 'grid',
    gridAutoColumns: '1fr',
    gridAutoFlow: 'column',
})

const Label = styled.span({ fontSize: 12 })

const Trigger = styled(TabsPrimitive.Trigger)(resetButtonCSS, ({ theme }) => ({
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    borderBottom: '2px solid',
    borderRadius: `${theme.borderRadius.normal}px ${theme.borderRadius.normal}px 0 0`,
    borderColor: theme.colors.black10,
    textAlign: 'center',
    padding: `${theme.space[2]}px ${theme.space[3]}px`,
    ':hover, :focus-visible': {
        borderColor: `${theme.colors.primary}99`,
    },
    '&[data-state="active"]': {
        borderColor: theme.colors.primary,
    },
}))
