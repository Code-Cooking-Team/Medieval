import { cn } from '+helpers/string'
import { InputStyleProps } from './Input'

interface NumberInputProps extends InputStyleProps {
    value?: number
    onChange(value: number): void
    step?: number
    name?: string
    placeholder?: string
    onBlur?(): void
    autoFocus?: boolean
}

export const NumberInput = ({
    value,
    onChange,
    step = 1,
    name,
    placeholder,
    onBlur,
    autoFocus,
    fullWidth,
    className,
}: NumberInputProps) => {
    const val = value === undefined || Number.isNaN(value) ? '' : value.toString()

    const inputClasses = cn(
        'bg-[var(--color-black)] border border-solid border-[var(--color-border)] text-base p-2 max-w-full text-[var(--color-text)]',
        fullWidth ? 'w-full' : 'w-[280px]',
        className,
    )

    return (
        <input
            className={inputClasses}
            value={val}
            onChange={(event) => {
                onChange(parseFloat(event.target.value))
            }}
            onBlur={onBlur}
            name={name}
            step={step}
            type="number"
            placeholder={placeholder}
            autoFocus={autoFocus}
        />
    )
}
