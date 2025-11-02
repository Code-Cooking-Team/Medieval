import { cn } from '+helpers/string'
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
            <TabsPrimitive.List
                className={cn('grid grid-flow-col auto-cols-fr')}
            >
                {items.map((el, index) => (
                    <TabsPrimitive.Trigger
                        key={index}
                        value={index.toString()}
                        className={cn(
                            'font-inherit text-inherit bg-none cursor-inherit outline-none m-0 leading-inherit cursor-pointer block whitespace-nowrap overflow-hidden text-ellipsis border-b-2 border-solid border-[var(--color-black-10)] text-center p-3',
                            'hover:border-[var(--color-black-70)]',
                            'focus-visible:border-[var(--color-black-70)]',
                            'data-[state=active]:border-[var(--color-primary)]',
                        )}
                    >
                        {el.props.label}
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
