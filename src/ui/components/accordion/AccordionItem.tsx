import { cn } from '+helpers/string'
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
        <AccordionPrimitive.Item value={value}>
            <AccordionPrimitive.Header className="m-0 font-normal">
                <AccordionPrimitive.Trigger
                    className={cn(
                        'font-inherit text-inherit bg-none cursor-inherit outline-none m-0 leading-inherit block w-full overflow-visible p-2 text-left border-l-2 border-solid border-[var(--color-black-10)]',
                        'hover:border-[var(--color-black-70)]',
                        'focus-visible:border-[var(--color-black-70)]',
                        'data-[state=open]:border-[var(--color-primary)]',
                        'data-[state=open]:text-[var(--color-primary)]',
                    )}
                >
                    {label}
                </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content
                className={cn(
                    'overflow-hidden border-l-2 border-solid border-[var(--color-black-10)]',
                    'data-[state=open]:border-[var(--color-primary)]',
                )}
            >
                <Box p={2}>{children}</Box>
            </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
    )
}
