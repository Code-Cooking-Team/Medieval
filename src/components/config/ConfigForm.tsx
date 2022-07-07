import { config, configOptions, resetConfig, saveConfig } from '+config'
import { useLocalStorage } from '+hooks/useLocalStorage'
import { useTimeoutState } from '+hooks/useTimeoutState'

import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    ButtonGroup,
    Stack,
    Typography,
} from '@mui/material'
import { entries, toPairs } from 'lodash'
import { useState } from 'react'

import { ConfigItem } from './ConfigItem'

export const ConfigForm = () => {
    const [openCategory, setOpenCategory, resetOpenCategory] = useLocalStorage<string>(
        'configForm:openCategory',
        '',
    )

    const [showReload, setShowReload] = useTimeoutState(false)

    const [, count] = useState(0)
    const render = () => count((n) => n + 1)
    const reload = () => window.location.reload()

    return (
        <>
            {toPairs(configOptions).map(([categoryKey, category]) => {
                const configCategory = (config as any)[categoryKey]

                return (
                    <Accordion
                        expanded={categoryKey === openCategory}
                        onChange={() => {
                            if (categoryKey === openCategory) {
                                setOpenCategory('')
                            } else {
                                setOpenCategory(categoryKey)
                            }
                        }}
                        key={categoryKey}
                    >
                        <AccordionSummary>
                            <Typography>{categoryKey}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
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
                            </Stack>
                        </AccordionDetails>
                    </Accordion>
                )
            })}

            <Stack direction="row" marginTop={2} justifyContent="center">
                <ButtonGroup disableElevation variant="contained">
                    {showReload ? (
                        <Button onClick={reload}>Reload</Button>
                    ) : (
                        <Button
                            onClick={() => {
                                saveConfig()
                                render()
                                setShowReload(true)
                            }}
                        >
                            Save
                        </Button>
                    )}

                    <Button
                        onClick={() => {
                            resetConfig()
                            resetOpenCategory()
                            reload()
                        }}
                    >
                        Reset
                    </Button>
                </ButtonGroup>
            </Stack>
        </>
    )
}
