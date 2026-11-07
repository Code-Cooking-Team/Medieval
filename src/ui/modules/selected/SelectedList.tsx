import type { WoodCampActor } from '+game/actors/buildings/woodCamp/WoodCampActor'
import { isHumanActor, isWoodCampActor } from '+game/actors/helpers'
import { Actor } from '+game/core/Actor'
import { ProfessionType } from '+game/professions/types'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { ActorType } from '+game/types'
import { Box } from '+ui/components/base/Box'
import { Button } from '+ui/components/base/Button'
import { ActorIcon } from '+ui/components/icons/ActorIcon'

import styled from '@emotion/styled'
import { groupBy } from 'lodash'
import { Axe } from 'lucide-react'
import { useCallback, useMemo, useSyncExternalStore } from 'react'

interface SelectedListProps {
    humanPlayer: HumanPlayer
}

const noProfession = 'No profession'

export const SelectedList = ({ humanPlayer }: SelectedListProps) => {
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

    if (!selectedActors.length) return null

    if (singleActor) {
        return (
            <ActorDetails>
                <Box as="strong" display="inline-flex" alignItems="center" columnGap={2}>
                    <ActorIcon type={singleActor.type} />
                    {singleActor.type}
                </Box>
                {isHumanActor(singleActor) && (
                    <Box as="span" display="inline-flex" alignItems="center" columnGap={2}>
                        {singleActor.profession?.type === ProfessionType.Woodcutter && (
                            <Axe size={16} aria-hidden="true" />
                        )}
                        {singleActor.profession?.type || noProfession}
                    </Box>
                )}
                <span>
                    {singleActor.hp}/{singleActor.maxHp} HP
                </span>
                {isWoodCampActor(singleActor) && <CampStock camp={singleActor} />}
            </ActorDetails>
        )
    }

    return (
        <ActorDetails style={{ pointerEvents: 'auto' }}>
            {selectedTypes.map(([type, actors]) => (
                <Box key={type}>
                    <Button
                        icon={<ActorIcon type={type} />}
                        label={`${type} (${actors.length})`}
                        onClick={() => selectActorsByType(type)}
                    />
                    <Box pt={2} display="flex" flexWrap="wrap" rowGap={2} columnGap={2}>
                        {countProfessions(actors).map(([professionType, count]) => (
                            <ProfessionButton
                                key={professionType}
                                icon={
                                    professionType === ProfessionType.Woodcutter && (
                                        <Axe size={16} aria-hidden="true" />
                                    )
                                }
                                label={`${professionType} (${count})`}
                                onClick={() =>
                                    selectActorsByProfession(actors, professionType)
                                }
                            />
                        ))}
                    </Box>
                </Box>
            ))}
        </ActorDetails>
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
    return (
        <span>
            Wood stock: {woodStock} / {camp.woodCapacity}
        </span>
    )
}

const ProfessionButton = styled(Button)({
    cursor: 'pointer',
})

const ActorDetails = styled(Box)({
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
    maxHeight: '35vh',
    overflow: 'auto',
    boxSizing: 'border-box',
    padding: '8px 16px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(15px)',
    borderRadius: 8,
    pointerEvents: 'none',
})
