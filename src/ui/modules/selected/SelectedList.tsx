import { ConstructionSiteActor } from '+game/actors/buildings/construction/ConstructionSiteActor'
import {
    constructionCosts,
    ConstructionType,
    isConstructionType,
} from '+game/actors/buildings/construction/costs'
import type { WoodCampActor } from '+game/actors/buildings/woodCamp/WoodCampActor'
import { isHumanActor, isWoodCampActor } from '+game/actors/helpers'
import { EquipmentSlot, items } from '+game/actors/units/human/equipment'
import type { HumanActor } from '+game/actors/units/human/HumanActor'
import { Actor } from '+game/core/Actor'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { ProfessionType } from '+game/professions/types'
import { ActorType } from '+game/types'
import { Box } from '+ui/components/base/Box'
import { Button } from '+ui/components/base/Button'
import { ActorIcon } from '+ui/components/icons/ActorIcon'

import styled from '@emotion/styled'
import { groupBy } from 'lodash'
import { Axe } from 'lucide-react'
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'

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
                    {singleActor instanceof ConstructionSiteActor ? (
                        <>
                            <ActorIcon type={singleActor.buildingType} />
                            {buildingName(singleActor.buildingType)} Construction Site
                        </>
                    ) : (
                        <>
                            <ActorIcon type={singleActor.type} />
                            {singleActor.type}
                        </>
                    )}
                </Box>
                {isHumanActor(singleActor) && (
                    <HumanDetails
                        key={singleActor.id}
                        human={singleActor}
                        player={humanPlayer}
                    />
                )}
                {singleActor instanceof ConstructionSiteActor && (
                    <SiteProgress site={singleActor} />
                )}
                <span>
                    {singleActor.hp}/{singleActor.maxHp} HP
                </span>
                {isHumanActor(singleActor) && <EquippedSlots actor={singleActor} />}
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

const buildOptions = Object.keys(constructionCosts) as ConstructionType[]

function buildingName(type: ConstructionType) {
    return type === ActorType.WoodCamp ? 'Wood Camp' : type
}

const HumanDetails = ({ human, player }: { human: HumanActor; player: HumanPlayer }) => {
    const [showPicker, setShowPicker] = useState(false)
    const subscribeProfession = useCallback(
        (refresh: () => void) => human.game.emitter.on('professionChanged', refresh),
        [human],
    )
    const profession = useSyncExternalStore(subscribeProfession, () => human.profession)
    const subscribePlacement = useCallback(
        (refresh: () => void) =>
            player.emitter.on(['selectBuilding', 'unselectBuilding'], refresh),
        [player],
    )
    const placing = useSyncExternalStore(subscribePlacement, () =>
        player.constructionBuilder === human ? player.selectedBuilding : undefined,
    )

    return (
        <>
            <Box as="span" display="inline-flex" alignItems="center" columnGap={2}>
                {profession?.type === ProfessionType.Woodcutter && (
                    <Axe size={16} aria-hidden="true" />
                )}
                {profession?.type || noProfession}
            </Box>
            {human.player === player && !human.isDead() && (
                <Box
                    display="flex"
                    alignItems="center"
                    flexWrap="wrap"
                    columnGap={2}
                    rowGap={2}
                    style={{ pointerEvents: 'auto' }}
                >
                    <Button label="Build" onClick={() => setShowPicker(!showPicker)} />
                    {showPicker &&
                        buildOptions.map((type) => (
                            <Button
                                key={type}
                                icon={<ActorIcon type={type} />}
                                label={buildingName(type)}
                                onClick={() => {
                                    player.selectBuilding(type, human)
                                    setShowPicker(false)
                                }}
                            />
                        ))}
                    {placing && isConstructionType(placing) && (
                        <span>{buildingName(placing)} · R to rotate · Esc to exit</span>
                    )}
                </Box>
            )}
        </>
    )
}

const SiteProgress = ({ site }: { site: ConstructionSiteActor }) => {
    const subscribe = useCallback(
        (refresh: () => void) => site.game.emitter.on('constructionProgress', refresh),
        [site],
    )
    const wood = useSyncExternalStore(subscribe, () => site.deliveredWood)
    return (
        <span>
            Wood {wood} / {constructionCosts[site.buildingType]}
        </span>
    )
}

const equipmentSlots: EquipmentSlot[] = ['Hands', 'Armor']

const EquippedSlots = ({ actor }: { actor: HumanActor }) => {
    const subscribe = useCallback(
        (refresh: () => void) =>
            actor.game.emitter.on('equipmentChanged', ({ data }) => {
                if (data === actor) refresh()
            }),
        [actor],
    )
    const description = useSyncExternalStore(subscribe, () =>
        equipmentSlots
            .flatMap((slot) => {
                const id = actor.getEquippedItem(slot)
                return id ? [`${slot}: ${items[id].name}`] : []
            })
            .join(' · '),
    )
    return description ? <span>{description}</span> : null
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
