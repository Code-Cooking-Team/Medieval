import styled from '@emotion/styled'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ReactNode } from 'react'

interface AccordionProps {
    openValue?: string
    children: ReactNode
}

export const Accordion = ({ openValue, children }: AccordionProps) => {
    return (
        <Root type="single" defaultValue={openValue} collapsible>
            {children}
        </Root>
    )
}

const Root = styled(AccordionPrimitive.Root)({})
