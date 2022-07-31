import { isHumanActor } from '+game/actors/helpers'
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

const noProfession = 'No profession'

export const SelectedList = ({ humanPlayer }: SelectedListProps) => {
    const [selectedActors, setSelectedActors] = useState<Actor[]>([])

    const selectedTypes = useMemo(() => {
        return Object.entries(groupBy(selectedActors, (actor) => actor.type)) as [
            ActorType,
            Actor[],
        ][]
    }, [selectedActors])

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

    const singeActor = selectedActors.length === 1 ? selectedActors[0] : undefined

    return (
        <>
            {singeActor ? (
                <Box>
                    <h3>{singeActor.type}</h3>
                    <p>
                        {isHumanActor(singeActor) && (
                            <b>
                                {singeActor.profession?.type || noProfession}
                                <br />
                            </b>
                        )}
                        {singeActor.hp}/{singeActor.maxHp} HP
                        <br />
                    </p>
                </Box>
            ) : (
                selectedTypes.map(([type, actors]) => (
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
                                        selectActorsByProfession(actors, professionType)
                                    }
                                >
                                    {`${professionType} (${count})`}
                                </Box>
                            ))}
                        </Box>
                    </Box>
                ))
            )}
        </>
    )

    function selectActorsByProfession(actors: Actor[], professionType: string): void {
        return humanPlayer.selectActors(
            actors
                .filter(isHumanActor)
                .filter((actor) =>
                    professionType === noProfession
                        ? !actor.profession
                        : actor.profession?.type === professionType,
                ),
        )
    }

    function countProfessions(humanActors: Actor[]) {
        const count = humanActors.filter(isHumanActor).reduce((acc, humanActor) => {
            const prof = humanActor.profession?.type || noProfession
            acc[prof] = (acc[prof] || 0) + 1
            return acc
        }, {} as { [profession: string]: number })

        return Object.entries(count)
    }

    function selectActorsByType(type: ActorType) {
        humanPlayer.selectActors(selectedActors.filter((actor) => actor.type === type))
    }
}
