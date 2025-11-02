import { cn } from '+helpers/string'
import { type InputHTMLAttributes } from 'react'

export interface InputStyleProps {
    fullWidth?: boolean
    className?: string
}

interface InputProps extends InputStyleProps {
    value?: string
    onChange(value: string): void
    name?: string
    type?: InputHTMLAttributes<HTMLInputElement>['type']
    placeholder?: string
    onBlur?(): void
    autoFocus?: boolean
}

export const Input = ({
    value,
    onChange,
    onBlur,
    name,
    type,
    placeholder,
    autoFocus,
    fullWidth,
    className,
}: InputProps) => {
    const inputClasses = cn(
        'bg-[var(--color-black)] border border-solid border-[var(--color-border)] text-base p-2 max-w-full text-[var(--color-text)]',
        fullWidth ? 'w-full' : 'w-[280px]',
        className,
    )

    if (type === 'number') {
        return (
            <input
                className={inputClasses}
                value={value}
                onChange={(event) => onChange(event.target.valueAsNumber.toString())}
                onBlur={onBlur}
                name={name}
                step={0.01}
                type={type}
                placeholder={placeholder}
                autoFocus={autoFocus}
            />
        )
    } else {
        return (
            <input
                className={inputClasses}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onBlur={onBlur}
                name={name}
                type={type}
                placeholder={placeholder}
                autoFocus={autoFocus}
            />
        )
    }
}

export const StyledInput = Input
