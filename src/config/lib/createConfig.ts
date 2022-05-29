import { mapValues } from 'lodash'
import { Config, ConfigOptions } from '../types'
import {
    booleanCheckbox,
    ChangeableConfigDefinition,
    minMaxNumber,
    numberInput,
    stringInput,
} from './definitions'

export const configOptions: ConfigOptions = {}

const addConfigOption = <T>(
    category: string,
    key: string,
    value: ChangeableConfigDefinition,
) => {
    if (!configOptions[category]) {
        configOptions[category] = {}
    }
    configOptions[category][key] = value
}

export const createConfig = <T extends Config>(config: T): T => {
    return mapValues(config, (category, categoryKey) =>
        mapValues(category, (value, key) => {
            if (typeof value === 'object' && '__type' in value) {
                const anyVal = value as any
                addConfigOption(categoryKey, key, anyVal)
                return anyVal.initialValue
            }

            if (typeof value === 'boolean') {
                addConfigOption(categoryKey, key, booleanCheckbox(value))
            }

            if (typeof value === 'string') {
                addConfigOption(categoryKey, key, stringInput(value))
            }

            if (typeof value === 'number') {
                if (key.toLowerCase().includes('hp')) {
                    addConfigOption(categoryKey, key, minMaxNumber(value, 1, value * 3))
                } else {
                    addConfigOption(categoryKey, key, numberInput(value))
                }
            }

            return value
        }),
    ) as T
}
