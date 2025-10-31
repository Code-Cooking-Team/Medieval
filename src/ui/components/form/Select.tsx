import { cn } from '+helpers/string'
import React from 'react'

interface SelectProps<T> {
    value: T
    items: T[]
    onChange(value: T): void
    getLabel(item: T): string
    fullWidth?: boolean
    className?: string
}

export const Select = <T extends string>({
    value,
    items,
    onChange,
    getLabel = (item) => item,
    fullWidth,
    className,
}: SelectProps<T>) => {
    return (
        <select
            className={cn(
                'bg-[var(--color-black)] border border-solid border-[var(--color-border)] text-base p-2 text-[var(--color-text)]',
                fullWidth ? 'w-full' : 'w-auto',
                className,
            )}
            value={value}
            onChange={(event: any) => onChange(event.target.value)}
        >
            {items.map((item) => (
                <option key={item} value={item}>
                    {getLabel(item)}
                </option>
            ))}
        </select>
    )
}

export const StyledSelect = Select
