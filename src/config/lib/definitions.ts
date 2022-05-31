export enum ConfigType {
    NumberInput = 'NumberInput',
    StringInput = 'StringInput',
    Select = 'Select',
    MinMax = 'MinMax',
    BooleanCheckbox = 'BooleanCheckbox',
    Color = 'Color',
}

export const booleanCheckbox = (initialValue: boolean) =>
    ({
        __type: ConfigType.BooleanCheckbox,
        initialValue,
    } as unknown as boolean)

export const stringInput = (initialValue: string) =>
    ({
        __type: ConfigType.StringInput,
        initialValue,
    } as unknown as string)

export const numberInput = (initialValue: number) =>
    ({
        __type: ConfigType.NumberInput,
        initialValue,
    } as unknown as number)

export const colorInput = (initialValue: number) =>
    ({
        __type: ConfigType.Color,
        initialValue,
    } as unknown as number)

export const select = <T>(initialValue: T, options: T[]) =>
    ({
        __type: ConfigType.Select,
        initialValue,
        options,
    } as unknown as T)

export const minMaxNumber = (initialValue: number, min: number, max: number, step = 1) =>
    ({
        __type: ConfigType.MinMax,
        initialValue,
        min,
        max,
        step,
    } as unknown as number)
