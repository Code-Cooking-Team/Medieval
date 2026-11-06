import type { WoodCampActor } from '+game/actors/buildings/woodCamp/WoodCampActor'
import { isBuildingActor, isHumanActor, isWoodCampActor } from '+game/actors/helpers'
import { Actor } from '+game/core/Actor'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { ActorType } from '+game/types'
import { Box } from '+ui/components/base/Box'
import { Button } from '+ui/components/base/Button'

import styled from '@emotion/styled'
import { groupBy } from 'lodash'
import { useCallback, useMemo, useSyncExternalStore } from 'react'

interface SelectedListProps {
    humanPlayer: HumanPlayer
    buildingsOnly?: boolean
}

const noProfession = 'No profession'

export const SelectedList = ({ humanPlayer, buildingsOnly = false }: SelectedListProps) => {
    const subscribe = useCallback(
        (refresh: () => void) =>
            humanPlayer.emitter.on(['selectActors', 'unselectActors'], refresh),
        [humanPlayer],
    )
    const selectedActors = useSyncExternalStore(
        subscribe,
        () => humanPlayer.selectedActors,
    )

    const selectedTypes = useMemo(() => {
        return Object.entries(groupBy(selectedActors, (actor) => actor.type)) as [
            ActorType,
            Actor[],
        ][]
    }, [selectedActors])

    const singleActor = selectedActors.length === 1 ? selectedActors[0] : undefined

    const building = singleActor && isBuildingActor(singleActor) ? singleActor : undefined

    if (buildingsOnly) {
        if (!building) return null

        return (
            <BuildingDetails>
                <strong>{building.type}</strong>
                <span>{building.hp}/{building.maxHp} HP</span>
                {isWoodCampActor(building) && <CampStock camp={building} />}
            </BuildingDetails>
        )
    }
    if (building) return null

    return (
        <>
            {singleActor ? (
                <Box>
                    <h3>{singleActor.type}</h3>
                    <p>
                        {isHumanActor(singleActor) && (
                            <b>
                                {singleActor.profession?.type || noProfession}
                                <br />
                            </b>
                        )}
                        {singleActor.hp}/{singleActor.maxHp} HP
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
        const count = humanActors.filter(isHumanActor).reduce(
            (acc, humanActor) => {
                const prof = humanActor.profession?.type || noProfession
                acc[prof] = (acc[prof] || 0) + 1
                return acc
            },
            {} as { [profession: string]: number },
        )

        return Object.entries(count)
    }

    function selectActorsByType(type: ActorType) {
        humanPlayer.selectActors(selectedActors.filter((actor) => actor.type === type))
    }
}

const CampStock = ({ camp }: { camp: WoodCampActor }) => {
    const subscribe = useCallback(
        (refresh: () => void) => camp.game.emitter.on('woodStockChanged', refresh),
        [camp],
    )
    const woodStock = useSyncExternalStore(subscribe, () => camp.woodStock)
    return <span>Wood stock: {woodStock} / {camp.woodCapacity}</span>
}

const BuildingDetails = styled(Box)({
    position: 'fixed',
    zIndex: 11,
    bottom: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '4px 16px',
    width: 'max-content',
    maxWidth: 'calc(100% - 24px)',
    padding: '8px 16px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(15px)',
    borderRadius: 8,
    pointerEvents: 'none',
})
