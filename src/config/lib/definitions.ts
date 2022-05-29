export enum ConfigType {
    NumberInput = 'NumberInput',
    StringInput = 'StringInput',
    Select = 'Select',
    MinMax = 'MinMax',
    BooleanCheckbox = 'BooleanCheckbox',
}

interface ConfigDefinition<T> {
    __type: ConfigType
    initialValue: T
}

export interface BooleanCheckboxConfigDefinition extends ConfigDefinition<boolean> {
    __type: ConfigType.BooleanCheckbox
}

export const booleanCheckbox = (
    initialValue: boolean,
): BooleanCheckboxConfigDefinition => ({
    __type: ConfigType.BooleanCheckbox,
    initialValue,
})

export const stringInput = (initialValue: string): StringInputConfigDefinition => ({
    __type: ConfigType.StringInput,
    initialValue,
})
export interface SelectConfigDefinition<T> extends ConfigDefinition<T> {
    __type: ConfigType.Select
    options: T[]
}

export interface NumberInputConfigDefinition extends ConfigDefinition<number> {
    __type: ConfigType.NumberInput
}

export const numberInput = (initialValue: number): NumberInputConfigDefinition => ({
    __type: ConfigType.NumberInput,
    initialValue,
})

export interface StringInputConfigDefinition extends ConfigDefinition<string> {
    __type: ConfigType.StringInput
}

export const select = <T>(initialValue: T, options: T[]): SelectConfigDefinition<T> => ({
    __type: ConfigType.Select,
    initialValue,
    options,
})

export interface MinMaxNumberConfigDefinition extends ConfigDefinition<number> {
    __type: ConfigType.MinMax
    min: number
    max: number
    step: number
}

export const minMaxNumber = (
    initialValue: number,
    min: number,
    max: number,
    step = 1,
): MinMaxNumberConfigDefinition => ({
    __type: ConfigType.MinMax,
    initialValue,
    min,
    max,
    step,
})

export type ChangeableConfigDefinition =
    | BooleanCheckboxConfigDefinition
    | StringInputConfigDefinition
    | NumberInputConfigDefinition
    | SelectConfigDefinition<string>
    | SelectConfigDefinition<number>
    | MinMaxNumberConfigDefinition
