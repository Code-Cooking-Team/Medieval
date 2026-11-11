import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { type ReactNode } from 'react'

interface AccordionItemProps {
    value: string
    label: ReactNode
    children: ReactNode
}

export const AccordionItem = ({ value, label, children }: AccordionItemProps) => {
    return (
        <AccordionPrimitive.Item value={value}>
            <AccordionPrimitive.Header className="m-0 font-normal">
                <AccordionPrimitive.Trigger className="game-tab block w-full rounded-sm border-l-2 px-2 py-2 text-left data-[state=open]:border-game-gold data-[state=open]:text-game-gold">
                    {label}
                </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content className="game-accordion-content overflow-hidden border-0 border-l-2 border-solid border-black/10 data-[state=open]:border-game-gold">
                <div className="p-2">{children}</div>
            </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
    )
}
