import { config, configOptions, resetConfig, saveConfig } from '+config'
import { useLocalStorage } from '+hooks/useLocalStorage'

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

const openConfig: { [key: string]: boolean } = {}

export const ConfigForm = () => {
    const [isOpen, setIsOpen, resetIsOpen] = useLocalStorage(
        'configForm:open',
        openConfig,
    )

    const [, count] = useState(0)
    const render = () => count((n) => n + 1)

    return (
        <>
            {toPairs(configOptions).map(([categoryKey, category]) => {
                const configCategory = (config as any)[categoryKey]

                return (
                    <Accordion
                        expanded={isOpen[categoryKey]}
                        onChange={() => {
                            setIsOpen({
                                ...isOpen,
                                [categoryKey]: !isOpen[categoryKey],
                            })
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
                    <Button
                        onClick={() => {
                            saveConfig()
                            render()
                        }}
                    >
                        Save
                    </Button>

                    <Button
                        onClick={() => {
                            resetConfig()
                            resetIsOpen()
                            render()
                            window.location.reload()
                        }}
                    >
                        Reset
                    </Button>
                </ButtonGroup>
            </Stack>
        </>
    )
}
