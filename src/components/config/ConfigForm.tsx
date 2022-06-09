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
import { ConfigItem } from './ConfigItem'

interface ConfigFormProps {
    onChange(): void
}

const openConfig: { [key: string]: boolean } = {}

export const ConfigForm = ({ onChange }: ConfigFormProps) => {
    const [isOpen, setIsOpen] = useLocalStorage('configForm:open', openConfig)

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
                                                onChange()
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
                            onChange()
                        }}
                    >
                        Save
                    </Button>

                    <Button
                        onClick={() => {
                            resetConfig()
                            onChange()
                        }}
                    >
                        Reset
                    </Button>
                </ButtonGroup>
            </Stack>
        </>
    )
}
