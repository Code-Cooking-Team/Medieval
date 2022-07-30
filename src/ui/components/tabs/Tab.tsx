import { ReactNode } from 'react'

export interface TabProps {
    label: string
    isActive?: boolean
    children: ReactNode
}

export const Tab = ({ children }: TabProps) => <>{children}</>
