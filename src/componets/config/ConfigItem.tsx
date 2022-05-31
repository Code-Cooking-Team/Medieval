import { ConfigType } from '+config/lib/definitions'
import { color0xToHex, colorHexTo0x } from '+helpers/color'
import { FC } from 'react'

interface ConfigItemProps<T> {
    value: T
    definition: any
    onChange(value: T): void
}

export const ConfigItem = <T,>({ value, definition, onChange }: ConfigItemProps<T>) => {
    const Component = renderers[definition.__type as ConfigType]
    return (
        <div>
            <Component value={value} definition={definition} onChange={onChange} />
        </div>
    )
}

const renderers: Record<ConfigType, FC<ConfigItemProps<any>>> = {
    [ConfigType.BooleanCheckbox]: ({ value, onChange }) => {
        return (
            <input
                type="checkbox"
                checked={value}
                onChange={(e) => {
                    onChange(e.target.checked)
                }}
            />
        )
    },
    [ConfigType.StringInput]: ({ value, onChange }) => {
        return (
            <input
                type="text"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value)
                }}
            />
        )
    },
    [ConfigType.NumberInput]: ({ value, onChange }) => {
        return (
            <input
                type="number"
                value={value}
                onChange={(e) => {
                    onChange(Number(e.target.value))
                }}
            />
        )
    },
    [ConfigType.Select]: ({ value, definition, onChange }) => {
        return (
            <select
                value={value}
                onChange={(e) => {
                    onChange(e.target.value)
                }}
            >
                {definition.options.map((option: any) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        )
    },
    [ConfigType.MinMax]: ({ value, definition, onChange }) => {
        return (
            <>
                <input
                    type="range"
                    min={definition.min}
                    max={definition.max}
                    step={definition.step}
                    value={value}
                    onChange={(e) => {
                        onChange(parseInt(e.target.value, 10))
                    }}
                />
                {' ' + value}
            </>
        )
    },
    [ConfigType.Color]: ({ value, onChange }) => {
        return (
            <input
                type="color"
                value={color0xToHex(value)}
                onChange={(e) => {
                    onChange(colorHexTo0x(e.target.value))
                }}
            />
        )
    },
}
