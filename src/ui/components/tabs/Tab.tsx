import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

export interface TabProps {
    label: string
    icon?: LucideIcon
    isActive?: boolean
    children: ReactNode
}

export const Tab = ({ children }: TabProps) => <>{children}</>
