import { config, configOptions, resetConfig, saveConfig } from '+config'
import { entries, toPairs } from 'lodash'
import React from 'react'
import { ConfigItem } from './ConfigItem'

interface ConfigFormProps {
    onChange(): void
}

export const ConfigForm = ({ onChange }: ConfigFormProps) => {
    return (
        <>
            {toPairs(configOptions).map(([categoryKey, category]) => {
                const configCategory = (config as any)[categoryKey]
                return (
                    <details key={categoryKey}>
                        <summary>{categoryKey}</summary>
                        {entries(category).map(([key, definition]) => (
                            <div key={key}>
                                {key}
                                <ConfigItem
                                    value={configCategory[key]}
                                    definition={definition}
                                    onChange={(value) => {
                                        configCategory[key] = value
                                        onChange()
                                    }}
                                />
                            </div>
                        ))}
                    </details>
                )
            })}

            <button
                onClick={() => {
                    saveConfig()
                    onChange()
                }}
            >
                Save
            </button>

            <button
                onClick={() => {
                    resetConfig()
                    onChange()
                }}
            >
                Reset
            </button>
        </>
    )
}
