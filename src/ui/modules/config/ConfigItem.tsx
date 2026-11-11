import { ConfigType } from '+config/lib/definitions'
import { color0xToHex, colorHexTo0x } from '+helpers/color'
import { NumberInput } from '+ui/components/form/InputNumber'
import { Switch } from '+ui/components/form/Switch'

import { type FC, type Ref, useRef } from 'react'

import { Input } from '../../components/form/Input'
import { Select } from '../../components/form/Select'
import { Slider } from '../../components/form/Slider'

interface ConfigItemProps<T> {
    value: T
    definition: any
    onChange(value: T): void
    inputRef?: Ref<HTMLInputElement>
}

export const ConfigItem = ({
    name,
    value,
    definition,
    onChange,
}: ConfigItemProps<any> & { name: string }) => {
    const type = definition.__type as ConfigType
    const Component = renderers[type]
    const drag = useRef<{ x: number; value: number } | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const bounded = type === ConfigType.MinMax

    return (
        <div>
            {type === ConfigType.NumberInput || bounded ? (
                <span
                    style={{
                        cursor: 'ew-resize',
                        userSelect: 'none',
                        touchAction: 'none',
                    }}
                    onPointerDown={(event) => {
                        if (!event.isPrimary || event.button !== 0) return
                        event.preventDefault()
                        event.currentTarget.setPointerCapture(event.pointerId)
                        drag.current = {
                            x: event.clientX,
                            value: Number.isFinite(value)
                                ? value
                                : definition.initialValue,
                        }
                    }}
                    onPointerMove={(event) => {
                        const current = drag.current
                        if (
                            !current ||
                            !event.currentTarget.hasPointerCapture(event.pointerId)
                        )
                            return
                        const delta = event.clientX - current.x
                        if (!delta) return

                        const step = event.shiftKey ? 1 : 0.01
                        const next = Number(
                            (current.value + delta * step).toPrecision(15),
                        )
                        current.x = event.clientX
                        current.value = bounded
                            ? Math.min(definition.max, Math.max(definition.min, next))
                            : next
                        const input = inputRef.current
                        if (input) {
                            // Use the native setter so React detects the value change.
                            const setter = Object.getOwnPropertyDescriptor(
                                HTMLInputElement.prototype,
                                'value',
                            )!.set!
                            setter.call(input, String(current.value))
                            input.dispatchEvent(new Event('input', { bubbles: true }))
                        } else {
                            onChange(current.value)
                        }
                    }}
                    onLostPointerCapture={() => {
                        drag.current = null
                    }}
                >
                    {name}
                </span>
            ) : (
                name
            )}
            <div>
                <Component
                    value={value}
                    definition={definition}
                    onChange={onChange}
                    inputRef={inputRef}
                />
            </div>
        </div>
    )
}

const renderers: Record<ConfigType, FC<ConfigItemProps<any>>> = {
    [ConfigType.BooleanCheckbox]: ({ value, onChange }) => {
        return <Switch checked={value} onChange={onChange} />
    },
    [ConfigType.StringInput]: ({ value, onChange }) => {
        return <Input type="text" value={value} onChange={onChange} fullWidth={true} />
    },
    [ConfigType.NumberInput]: ({ value, onChange, inputRef }) => {
        return (
            <NumberInput
                value={value}
                onChange={onChange}
                inputRef={inputRef}
                fullWidth={true}
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
            <div className="flex items-center gap-2">
                <Slider
                    value={value}
                    min={definition.min}
                    max={definition.max}
                    step={definition.step}
                    onChange={onChange}
                />
                <b>{value}</b>
            </div>
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
