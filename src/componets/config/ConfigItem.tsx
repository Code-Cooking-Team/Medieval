import {
    ChangeableConfigDefinition,
    ConfigType,
    MinMaxNumberConfigDefinition,
    SelectConfigDefinition,
} from '+config/lib/definitions'
import { FC } from 'react'

interface ConfigItemProps<T> {
    value: T
    definition: ChangeableConfigDefinition
    onChange(value: T): void
}

export const ConfigItem = <T,>({ value, definition, onChange }: ConfigItemProps<T>) => {
    const Component = renderers[definition.__type]
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
        const def = definition as SelectConfigDefinition<any>
        return (
            <select
                value={value}
                onChange={(e) => {
                    onChange(e.target.value)
                }}
            >
                {def.options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        )
    },
    [ConfigType.MinMax]: ({ value, definition, onChange }) => {
        const def = definition as MinMaxNumberConfigDefinition
        return (
            <>
                <input
                    type="range"
                    min={def.min}
                    max={def.max}
                    step={def.step}
                    value={value}
                    onChange={(e) => {
                        onChange(Number(e.target.value))
                    }}
                />{' '}
                {value}
            </>
        )
    },
}
