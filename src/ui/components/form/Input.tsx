import styled from '@emotion/styled'
import { InputHTMLAttributes } from 'react'
import { margin, MarginProps } from 'styled-system'

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

interface InputStyleProps extends MarginProps {
    fullWidth?: boolean
}

export const StyledInput = styled.input<InputStyleProps>(
    margin,
    ({ theme, fullWidth }) => ({
        background: theme.colors.black,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: theme.colors.border,
        fontSize: theme.fontSizes[2],
        padding: theme.space[2],
        width: fullWidth ? '100%' : '280px',
        maxWidth: '100%',
        color: theme.colors.text,
    }),
)
