import { cn } from '+helpers/string'

interface ButtonProps {
    label: string
    onClick: () => void
    submit?: boolean
    className?: string
}

export const Button = ({ label, onClick, submit, className }: ButtonProps) => {
    return (
        <button
            type={submit ? 'submit' : 'button'}
            onClick={onClick}
            className={cn(
                'bg-[var(--color-black-70)] text-[var(--color-text)] border-2 border-[var(--color-primary)] rounded-[var(--radius-small)] px-3 py-2 select-none',
                'hover:bg-[var(--color-primary)]',
                'hover:text-[var(--color-black)]',
                'focus-visible:bg-[var(--color-primary)]',
                'focus-visible:text-[var(--color-black)]',
                className,
            )}
        >
            {label}
        </button>
    )
}
