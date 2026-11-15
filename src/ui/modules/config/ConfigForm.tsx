import { config, configOptions, resetConfig, saveConfig } from '+config'
import type { Game } from '+game/Game'
import { Accordion } from '+ui/components/accordion/Accordion'
import { AccordionItem } from '+ui/components/accordion/AccordionItem'
import { useTimeoutState } from '+ui/hooks/useTimeoutState'

import { entries, toPairs } from 'lodash'
import { useState } from 'react'

import { Button } from '../../components/base/Button'
import { ConfigItem } from './ConfigItem'
import { GameClock } from './GameClock'

export const ConfigForm = ({ game }: { game: Game }) => {
    const [showReload, setShowReload] = useTimeoutState(false)

    const [, count] = useState(0)
    const render = () => count((n) => n + 1)
    const reload = () => window.location.reload()

    return (
        <>
            <div className="p-2">
                <Accordion>
                    <AccordionItem value="time" label="Time">
                        <GameClock game={game} editable />
                    </AccordionItem>
                    {toPairs(configOptions).map(([categoryKey, category]) => {
                        const configCategory = (config as any)[categoryKey]

                        return (
                            <AccordionItem
                                key={categoryKey}
                                value={categoryKey}
                                label={categoryKey}
                            >
                                {entries(category).map(([key, definition]) => (
                                    <ConfigItem
                                        key={key}
                                        name={key}
                                        value={configCategory[key]}
                                        definition={definition}
                                        onChange={(value) => {
                                            configCategory[key] = value
                                            render()
                                        }}
                                    />
                                ))}
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            </div>

            <div className="sticky bottom-0 flex justify-center gap-2 py-2">
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
            </div>
        </>
    )
}
