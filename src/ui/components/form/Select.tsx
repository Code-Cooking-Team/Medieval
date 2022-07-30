import styled from '@emotion/styled'
import React from 'react'
import { margin, MarginProps } from 'styled-system'

interface SelectProps<T> extends MarginProps {
    value: T
    items: T[]
    onChange(value: T): void
    getLabel(item: T): string
}

export const Select = <T extends string>({
    value,
    items,
    onChange,
    getLabel = (item) => item,
    ...props
}: SelectProps<T>) => {
    return (
        <StyledSelect
            value={value}
            onChange={(event: any) => onChange(event.target.value)}
            {...props}
        >
            {items.map((item) => (
                <option key={item} value={item}>
                    {getLabel(item)}
                </option>
            ))}
        </StyledSelect>
    )
}

interface StyledSelectProps extends MarginProps {
    fullWidth?: boolean
}

export const StyledSelect = styled.select<StyledSelectProps>(
    margin,
    ({ theme, fullWidth }) => ({
        background: theme.colors.black,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: theme.colors.border,
        fontSize: theme.fontSizes[2],
        padding: theme.space[2],
        color: theme.colors.text,
        width: fullWidth ? '100%' : 'auto',
    }),
)
