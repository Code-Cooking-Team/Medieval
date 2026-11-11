import type { ReactNode } from 'react'

interface ButtonProps {
    label: string
    'aria-label'?: string
    icon?: ReactNode
    onClick: () => void
    submit?: boolean
    className?: string
}

export const Button = ({
    label,
    icon,
    onClick,
    submit,
    className = '',
    ...props
}: ButtonProps) => (
    <button
        className={`game-button ${className}`}
        onClick={onClick}
        type={submit ? 'submit' : 'button'}
        {...props}
    >
        {icon}
        {label}
    </button>
)
