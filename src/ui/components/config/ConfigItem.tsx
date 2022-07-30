import { ConfigType } from '+config/lib/definitions'
import { color0xToHex, colorHexTo0x } from '+helpers'

import { FC } from 'react'

import { Checkbox } from '../form/Checkbox'
import { Input } from '../form/Input'
import { Select } from '../form/Select'

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
        return <Checkbox checked={value} onChange={onChange} />
    },
    [ConfigType.StringInput]: ({ value, onChange }) => {
        return <Input type="text" value={value} onChange={onChange} />
    },
    [ConfigType.NumberInput]: ({ value, onChange }) => {
        return (
            <Input
                type="number"
                value={value}
                onChange={(val) => {
                    onChange(+val)
                }}
            />
        )
    },
    [ConfigType.Select]: ({ value, definition, onChange }) => {
        return (
            <Select
                items={definition.options}
                value={value}
                onChange={onChange}
                getLabel={(item) => item}
            />
        )
    },
    [ConfigType.MinMax]: ({ value, definition, onChange }) => {
        return (
            // TODO use Slider
            <Input
                type="number"
                value={value}
                onChange={(val) => {
                    onChange(+val)
                }}
            />
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
