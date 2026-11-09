import { type Ref, useState } from 'react'

import { InputStyleProps, StyledInput } from './Input'

interface NumberInputProps extends InputStyleProps {
    value?: number
    onChange(value: number): void
    step?: number
    name?: string
    placeholder?: string
    onBlur?(): void
    autoFocus?: boolean
    inputRef?: Ref<HTMLInputElement>
}

export const NumberInput = ({
    value,
    onChange,
    step = 1,
    name,
    placeholder,
    onBlur,
    autoFocus,
    inputRef,
    ...props
}: NumberInputProps) => {
    const [draft, setDraft] = useState<{ text: string; value?: number }>()
    const displayValue =
        draft && Object.is(draft.value, value)
            ? draft.text
            : Number.isFinite(value)
              ? String(value)
              : ''

    return (
        <StyledInput
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={({ target }) => {
                const text = target.value.replaceAll(',', '.')
                if (!/^[+-]?(?:(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d*)?|\.)?$/.test(text))
                    return

                if (text !== target.value) {
                    const { selectionStart, selectionEnd } = target
                    target.value = text
                    target.setSelectionRange(selectionStart, selectionEnd)
                }

                const parsed = text === '' ? NaN : Number(text)
                const nextValue = Number.isFinite(parsed) ? parsed : value
                setDraft({ text, value: nextValue })
                if (Number.isFinite(parsed) && !Object.is(parsed, value)) onChange(parsed)
            }}
            onBlur={() => {
                setDraft(undefined)
                onBlur?.()
            }}
            name={name}
            step={step}
            placeholder={placeholder}
            autoFocus={autoFocus}
            {...props}
        />
    )
}
