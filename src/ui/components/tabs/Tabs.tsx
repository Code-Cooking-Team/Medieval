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
                        {el.props.label}
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

const Trigger = styled(TabsPrimitive.Trigger)(resetButtonCSS, ({ theme }) => ({
    cursor: 'pointer',
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    borderBottom: '2px solid',
    borderColor: theme.colors.black10,
    textAlign: 'center',
    padding: theme.space[3],
    ':hover, :focus-visible': {
        borderColor: theme.colors.black70,
    },
    '&[data-state="active"]': {
        borderColor: theme.colors.primary,
    },
}))
