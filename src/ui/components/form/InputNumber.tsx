import { InputStyleProps, StyledInput } from './Input'

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
    ...props
}: NumberInputProps) => {
    const val = Number.isNaN(value) ? '' : value

    return (
        <StyledInput
            value={val}
            onChange={({ target }) => {
                onChange(parseFloat(target.value))
            }}
            onBlur={onBlur}
            name={name}
            step={step}
            placeholder={placeholder}
            autoFocus={autoFocus}
            {...props}
        />
    )
}
