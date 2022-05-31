import { localStorageKey } from '+helpers/storage'
import { cloneDeep } from 'lodash'
import { Config, ConfigOptions } from '../types'
import { booleanCheckbox, minMaxNumber, numberInput, stringInput } from './definitions'

export const configOptions: ConfigOptions = {}

export const createConfig = <T extends Config>(initialConfig: T) => {
    const cloned = cloneDeep(initialConfig)
    const configLocalStorage = localStorageKey('config', cloned)
    const config = simplifyConfigValues(configLocalStorage.get(), cloned)

    return {
        config,
        saveConfig: () => {
            configLocalStorage.set(config)
        },
        resetConfig: () => {
            Object.assign(config, simplifyConfigValues(initialConfig))
            configLocalStorage.remove()
        },
    }
}

const simplifyConfigValues = <T extends {}>(config: T, configTemplate = config) => {
    for (let categoryKey in configTemplate) {
        if (!configTemplate.hasOwnProperty(categoryKey)) continue
        for (let key in configTemplate[categoryKey]) {
            if (!configTemplate.hasOwnProperty(categoryKey)) continue

            const templateValue = configTemplate[categoryKey][key]

            if (typeof templateValue === 'object' && '__type' in templateValue) {
                const configValue = config[categoryKey][key] as any
                const anyTemplateValue = templateValue as any

                addConfigOption(categoryKey, key, anyTemplateValue)
                const value =
                    typeof configValue === 'object' && '__type' in configValue
                        ? configValue.initialValue
                        : configValue

                console.log({ templateValue, configValue })

                config[categoryKey][key] = value
            }

            if (typeof templateValue === 'boolean') {
                addConfigOption(categoryKey, key, booleanCheckbox(templateValue))
            }

            if (typeof templateValue === 'string') {
                addConfigOption(categoryKey, key, stringInput(templateValue))
            }

            if (typeof templateValue === 'number') {
                if (key.toLowerCase().includes('hp')) {
                    addConfigOption(
                        categoryKey,
                        key,
                        minMaxNumber(templateValue, 1, templateValue * 3),
                    )
                } else {
                    addConfigOption(categoryKey, key, numberInput(templateValue))
                }
            }
        }
    }

    return config
}

const addConfigOption = (category: string, key: string, value: any) => {
    if (!configOptions[category]) {
        configOptions[category] = {}
    }
    configOptions[category][key] = value
}
