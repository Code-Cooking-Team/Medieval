import { ConfigType } from '+config/lib/definitions'
import { color0xToHex, colorHexTo0x } from '+helpers/color'
import {
    FormControl,
    Input,
    MenuItem,
    Select,
    Slider,
    Switch,
    TextField,
} from '@mui/material'
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
            <Switch
                checked={value}
                onChange={(e) => {
                    onChange(e.target.checked)
                }}
            />
        )
    },
    [ConfigType.StringInput]: ({ value, onChange }) => {
        return (
            <TextField
                type="text"
                size="small"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value)
                }}
            />
        )
    },
    [ConfigType.NumberInput]: ({ value, onChange }) => {
        return (
            <TextField
                type="number"
                size="small"
                value={value}
                onChange={(e) => {
                    onChange(Number(e.target.value))
                }}
            />
        )
    },
    [ConfigType.Select]: ({ value, definition, onChange }) => {
        return (
            <FormControl fullWidth>
                <Select
                    size="small"
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value)
                    }}
                >
                    <MenuItem value={10}>Ten</MenuItem>
                    <MenuItem value={20}>Twenty</MenuItem>
                    <MenuItem value={30}>Thirty</MenuItem>
                    {definition.options.map((option: any) => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        )
    },
    [ConfigType.MinMax]: ({ value, definition, onChange }) => {
        return (
            <>
                <Slider
                    value={value}
                    onChange={(event, sliderValue) => {
                        onChange(sliderValue as number)
                    }}
                />
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
