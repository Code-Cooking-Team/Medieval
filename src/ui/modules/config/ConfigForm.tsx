import { config, configOptions, resetConfig, saveConfig } from '+config'
import { Accordion } from '+ui/components/accordion/Accordion'
import { AccordionItem } from '+ui/components/accordion/AccordionItem'
import { useTimeoutState } from '+ui/hooks/useTimeoutState'

import { entries, toPairs } from 'lodash'
import { useState } from 'react'

import { Box } from '../../components/base/Box'
import { Button } from '../../components/base/Button'
import { ConfigItem } from './ConfigItem'

export const ConfigForm = () => {
    const [showReload, setShowReload] = useTimeoutState(false)

    const [, count] = useState(0)
    const render = () => count((n) => n + 1)
    const reload = () => window.location.reload()

    return (
        <>
            <Box p={2}>
                <Accordion>
                    {toPairs(configOptions).map(([categoryKey, category]) => {
                        const configCategory = (config as any)[categoryKey]

                        return (
                            <AccordionItem
                                key={categoryKey}
                                value={categoryKey}
                                label={categoryKey}
                            >
                                {entries(category).map(([key, definition]) => (
                                    <div key={key}>
                                        {key}
                                        <ConfigItem
                                            value={configCategory[key]}
                                            definition={definition}
                                            onChange={(value) => {
                                                configCategory[key] = value
                                                render()
                                            }}
                                        />
                                    </div>
                                ))}
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            </Box>

            <Box
                display="flex"
                flexDirection="row"
                marginTop={2}
                justifyContent="center"
                columnGap={2}
            >
                {showReload ? (
                    <Button label="Reload" onClick={reload} />
                ) : (
                    <Button
                        label="Save"
                        onClick={() => {
                            saveConfig()
                            render()
                            setShowReload(true)
                        }}
                    />
                )}

                <Button
                    label="Reset"
                    onClick={() => {
                        resetConfig()
                        reload()
                    }}
                />
            </Box>
        </>
    )
}
