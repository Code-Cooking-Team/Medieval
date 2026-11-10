import type { ComponentProps, InputHTMLAttributes } from 'react'

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
    ...props
}: InputProps) => {
    if (type === 'number') {
        return (
            <StyledInput
                value={value}
                onChange={(event) => onChange(event.target.valueAsNumber.toString())}
                onBlur={onBlur}
                name={name}
                step={0.01}
                type={type}
                placeholder={placeholder}
                autoFocus={autoFocus}
                {...props}
            />
        )
    } else {
        return (
            <StyledInput
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onBlur={onBlur}
                name={name}
                type={type}
                placeholder={placeholder}
                autoFocus={autoFocus}
                {...props}
            />
        )
    }
}

export interface InputStyleProps {
    fullWidth?: boolean
}

export const StyledInput = ({
    fullWidth,
    ...props
}: ComponentProps<'input'> & InputStyleProps) => (
    <input
        className={`game-input max-w-full ${fullWidth ? 'w-full' : 'w-[280px]'}`}
        {...props}
    />
)
