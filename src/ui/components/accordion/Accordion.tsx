import { cn } from '+helpers/string'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { type ReactNode } from 'react'

interface AccordionProps {
    openValue?: string
    children: ReactNode
}

export const Accordion = ({ openValue, children }: AccordionProps) => {
    return (
        <AccordionPrimitive.Root type="single" defaultValue={openValue} collapsible>
            {children}
        </AccordionPrimitive.Root>
    )
}
