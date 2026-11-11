import * as TabsPrimitive from '@radix-ui/react-tabs'
import { Children, type ReactElement, type ReactNode } from 'react'

import { type TabProps } from './Tab'

interface TabsProps {
    children: ReactNode
}

export const Tabs = (props: TabsProps) => {
    const items = Children.toArray(props.children) as ReactElement<TabProps>[]

    const currentIndex = items.findIndex((el) => el.props.isActive)
    const openIndex = currentIndex !== -1 ? currentIndex : 0

    return (
        <TabsPrimitive.Root defaultValue={openIndex.toString()}>
            <TabsPrimitive.List className="grid auto-cols-fr grid-flow-col">
                {items.map((el, index) => (
                    <TabsPrimitive.Trigger
                        key={index}
                        value={index.toString()}
                        className="game-tab flex flex-col items-center justify-center gap-1 truncate rounded-t-sm border-b-2 px-4 py-2 text-center data-[state=active]:border-game-gold"
                    >
                        {el.props.icon && <el.props.icon size={18} aria-hidden="true" />}
                        <span className="text-xs">{el.props.label}</span>
                    </TabsPrimitive.Trigger>
                ))}
            </TabsPrimitive.List>
            {items.map((el, index) => (
                <TabsPrimitive.Content key={index} value={index.toString()}>
                    {el.props.children}
                </TabsPrimitive.Content>
            ))}
        </TabsPrimitive.Root>
    )
}
