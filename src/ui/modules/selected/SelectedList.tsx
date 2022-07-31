import { isHumanActor } from '+game/actors/helpers'
import { HumanActor } from '+game/actors/units/human/HumanActor'
import { Actor } from '+game/core/Actor'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { ActorType } from '+game/types'
import { Box } from '+ui/components/base/Box'
import { Button } from '+ui/components/base/Button'

import { groupBy } from 'lodash'
import { useEffect, useMemo, useState } from 'react'

interface SelectedListProps {
    humanPlayer: HumanPlayer
}

export const SelectedList = ({ humanPlayer }: SelectedListProps) => {
    const [selectedActors, setSelectedActors] = useState<Actor[]>([])

    const selectedTypes = useMemo(() => {
        return Object.entries(groupBy(selectedActors, (actor) => actor.type)) as [
            ActorType,
            Actor[],
        ][]
    }, [selectedActors])

    const selectActorsByType = (type: ActorType) => {
        humanPlayer.selectActors(selectedActors.filter((actor) => actor.type === type))
    }

    useEffect(() => {
        const selectActors = (actor: Actor[]) => setSelectedActors(actor)
        const unselectActors = () => setSelectedActors([])

        humanPlayer.emitter.on('selectActors', selectActors)
        humanPlayer.emitter.on('unselectActors', unselectActors)

        return () => {
            humanPlayer.emitter.off('selectActors', selectActors)
            humanPlayer.emitter.off('unselectActors', unselectActors)
        }
    }, [humanPlayer])

    const noProfession = 'No profession'

    const countProfessions = (humanActors: Actor[]) => {
        const count = humanActors.filter(isHumanActor).reduce((acc, humanActor) => {
            const prof = humanActor.profession?.type || noProfession
            acc[prof] = (acc[prof] || 0) + 1
            return acc
        }, {} as { [profession: string]: number })

        return Object.entries(count)
    }

    return (
        <>
            {selectedTypes.map(([type, actors]) => (
                <Box key={type}>
                    <Button
                        label={`${type} (${actors.length})`}
                        onClick={() => selectActorsByType(type)}
                    />

                    <Box p={2}>
                        {countProfessions(actors).map(([professionType, count]) => (
                            <Box
                                key={professionType}
                                onClick={() =>
                                    humanPlayer.selectActors(
                                        actors
                                            .filter(isHumanActor)
                                            .filter((actor) =>
                                                professionType === noProfession
                                                    ? !actor.profession
                                                    : actor.profession?.type ===
                                                      professionType,
                                            ),
                                    )
                                }
                            >
                                {`${professionType} (${count})`}
                            </Box>
                        ))}
                    </Box>
                </Box>
            ))}
        </>
    )
}
