import { ConstructionSiteActor } from '+game/actors/buildings/construction/ConstructionSiteActor'
import {
    constructionCosts,
    ConstructionType,
    isConstructionType,
} from '+game/actors/buildings/construction/costs'
import type { GuildhallActor } from '+game/actors/buildings/guildhall/GuildhallActor'
import type { HunterHutActor } from '+game/actors/buildings/hunterHut/HunterHutActor'
import {
    hasWoodStorage,
    isGuildhallActor,
    isHumanActor,
    isHunterHutActor,
} from '+game/actors/helpers'
import { EquipmentSlot, items } from '+game/actors/units/human/equipment'
import type { HumanActor } from '+game/actors/units/human/HumanActor'
import { Actor } from '+game/core/Actor'
import type { WoodStorageBuilding } from '+game/core/WoodStorageBuilding'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { ProfessionType } from '+game/professions/types'
import type { Renderer } from '+game/Renderer'
import { ActorType, actorTypesByCategory } from '+game/types'
import { Box } from '+ui/components/base/Box'
import { Button } from '+ui/components/base/Button'
import { ActorIcon } from '+ui/components/icons/ActorIcon'

import styled from '@emotion/styled'
import { groupBy } from 'lodash'
import { Axe, Hammer, X } from 'lucide-react'
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'

import { SelectionPortrait } from './SelectionPortrait'

interface SelectedListProps {
    renderer?: Renderer
    humanPlayer: HumanPlayer
}

const noProfession = 'No profession'

export const SelectedList = ({ humanPlayer, renderer }: SelectedListProps) => {
    const subscribe = useCallback(
        (refresh: () => void) =>
            humanPlayer.emitter.on(['selectActors', 'unselectActors'], refresh),
        [humanPlayer],
    )
    const selectedActors = useSyncExternalStore(
        subscribe,
        () => humanPlayer.selectedActors,
    )

    const subscribeProfessions = useCallback(
        (refresh: () => void) =>
            selectedActors[0]?.game?.emitter.on('professionChanged', refresh) ??
            (() => {}),
        [selectedActors],
    )
    useSyncExternalStore(subscribeProfessions, () =>
        selectedActors
            .filter(isHumanActor)
            .map((actor) => actor.profession?.type ?? '')
            .join(','),
    )
    const selectedHumans = selectedActors
        .filter(isHumanActor)
        .filter((actor) => actor.player === humanPlayer && !actor.isDead())

    const selectedTypes = useMemo(() => {
        return Object.entries(groupBy(selectedActors, (actor) => actor.type)) as [
            ActorType,
            Actor[],
        ][]
    }, [selectedActors])

    const selectedCategories = useMemo(
        () =>
            Object.entries(actorTypesByCategory)
                .map(([category, types]) => ({
                    category,
                    actors: selectedTypes.filter(([type]) =>
                        (types as ActorType[]).includes(type),
                    ),
                }))
                .filter(({ actors }) => actors.length),
        [selectedTypes],
    )

    const singleActor = selectedActors.length === 1 ? selectedActors[0] : undefined
    const [showBuildPicker, setShowBuildPicker] = useState(false)
    const [showGroupBuildPicker, setShowGroupBuildPicker] = useState(false)

    if (!selectedActors.length) return null

    if (singleActor) {
        const canBuild =
            isHumanActor(singleActor) &&
            singleActor.player === humanPlayer &&
            !singleActor.isDead()
        return (
            <ActorDetails
                key="single-selection"
                style={{
                    overflow: 'visible',
                    minHeight: showBuildPicker ? 64 : 76,
                    flexDirection: showBuildPicker ? 'column' : 'row',
                    paddingLeft: !showBuildPicker && renderer ? 152 : 16,
                }}
            >
                {!showBuildPicker && renderer && (
                    <SelectionPortrait
                        key={singleActor.id}
                        actor={singleActor}
                        renderer={renderer}
                    />
                )}
                {!showBuildPicker && (
                    <ActorIdentity>
                        <Box
                            as="strong"
                            display="inline-flex"
                            alignItems="center"
                            columnGap={2}
                        >
                            <GoldIcon>
                                <ActorIcon
                                    type={
                                        singleActor instanceof ConstructionSiteActor
                                            ? singleActor.buildingType
                                            : singleActor.type
                                    }
                                />
                            </GoldIcon>
                            {singleActor instanceof ConstructionSiteActor
                                ? `${buildingName(singleActor.buildingType)} Construction Site`
                                : singleActor.type}
                        </Box>
                        <ActorStats>
                            <GoldValue>
                                {singleActor.hp}/{singleActor.maxHp}
                            </GoldValue>{' '}
                            HP
                        </ActorStats>
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
                        {isHumanActor(singleActor) && (
                            <EquippedSlots actor={singleActor} />
                        )}
                        {hasWoodStorage(singleActor) && <CampStock camp={singleActor} />}
                        {(isHunterHutActor(singleActor) ||
                            isGuildhallActor(singleActor)) && (
                            <HutStock hut={singleActor} />
                        )}
                    </ActorIdentity>
                )}
                {canBuild && (
                    <BuildControls
                        humans={[singleActor]}
                        player={humanPlayer}
                        showPicker={showBuildPicker}
                        setShowPicker={setShowBuildPicker}
                    />
                )}
            </ActorDetails>
        )
    }

    return (
        <ActorDetails key="group-selection" style={{ pointerEvents: 'auto' }}>
            <SelectionGroups>
                {selectedCategories.map(({ category, actors }, categoryIndex) => (
                    <SelectionCategory key={category} withDivider={categoryIndex > 0}>
                        {actors.map(([type, typedActors]) => (
                            <Box key={type}>
                                <Button
                                    icon={
                                        <GoldIcon>
                                            <ActorIcon type={type} />
                                        </GoldIcon>
                                    }
                                    label={`${type} (${typedActors.length})`}
                                    onClick={() => selectActorsByType(type)}
                                />
                                <Box
                                    pt={2}
                                    display="flex"
                                    flexWrap="nowrap"
                                    columnGap={2}
                                >
                                    {countProfessions(typedActors).map(
                                        ([professionType, count]) => (
                                            <ProfessionButton
                                                key={professionType}
                                                icon={
                                                    professionType ===
                                                        ProfessionType.Woodcutter && (
                                                        <GoldIcon>
                                                            <Axe
                                                                size={16}
                                                                aria-hidden="true"
                                                            />
                                                        </GoldIcon>
                                                    )
                                                }
                                                label={`${professionType} (${count})`}
                                                onClick={() =>
                                                    selectActorsByProfession(
                                                        typedActors,
                                                        professionType,
                                                    )
                                                }
                                            />
                                        ),
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </SelectionCategory>
                ))}
            </SelectionGroups>
            <BuildControls
                key={selectedHumans.map((actor) => actor.id).join(',')}
                humans={selectedHumans}
                player={humanPlayer}
                showPicker={showGroupBuildPicker}
                setShowPicker={setShowGroupBuildPicker}
            />
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
    const subscribeProfession = useCallback(
        (refresh: () => void) => human.game.emitter.on('professionChanged', refresh),
        [human],
    )
    const profession = useSyncExternalStore(subscribeProfession, () => human.profession)
    return (
        <>
            <Box as="span" display="inline-flex" alignItems="center" columnGap={2}>
                {profession?.type === ProfessionType.Woodcutter && (
                    <GoldIcon>
                        <Axe size={16} aria-hidden="true" />
                    </GoldIcon>
                )}
                {profession?.type || noProfession}
            </Box>
        </>
    )
}

const BuildControls = ({
    humans,
    player,
    showPicker,
    setShowPicker,
}: {
    humans: HumanActor[]
    player: HumanPlayer
    showPicker: boolean
    setShowPicker: (show: boolean) => void
}) => {
    const subscribePlacement = useCallback(
        (refresh: () => void) =>
            player.emitter.on(['selectBuilding', 'unselectBuilding'], refresh),
        [player],
    )
    const placing = useSyncExternalStore(subscribePlacement, () =>
        humans.some((human) => player.constructionBuilders.includes(human))
            ? player.selectedBuilding
            : undefined,
    )
    if (!humans.length) return null
    return (
        <Box
            display="flex"
            alignItems={showPicker ? 'flex-end' : 'center'}
            flexWrap="wrap"
            columnGap={2}
            rowGap={2}
            style={{
                pointerEvents: 'auto',
                marginLeft: 'auto',
                width: showPicker ? '100%' : undefined,
                justifyContent: showPicker ? 'flex-end' : undefined,
            }}
        >
            {showPicker ? (
                <BuildPicker>
                    <BuildCloseButton
                        aria-label="Close build picker"
                        label=""
                        icon={<X size={24} aria-hidden="true" />}
                        onClick={() => setShowPicker(false)}
                    />
                    <BuildOptions>
                        {buildOptions.map((type) => (
                            <Button
                                key={type}
                                icon={<ActorIcon type={type} />}
                                label={buildingName(type)}
                                onClick={() => {
                                    player.selectBuilding(type, humans)
                                    setShowPicker(false)
                                }}
                            />
                        ))}
                    </BuildOptions>
                </BuildPicker>
            ) : (
                <BuildButton
                    aria-label="Build"
                    icon={<Hammer size={30} aria-hidden="true" />}
                    label=""
                    onClick={() => setShowPicker(true)}
                />
            )}
            {placing && isConstructionType(placing) && (
                <span>{buildingName(placing)} · R to rotate · Esc to exit</span>
            )}
        </Box>
    )
}

const BuildButton = styled(Button)({
    width: 64,
    height: 64,
    minWidth: 64,
    padding: 0,
    borderRadius: '50%',
    fontSize: 0,
    justifyContent: 'center',
    flexShrink: 0,
    cursor: 'pointer',
})

const BuildPicker = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    width: '100%',
    gap: 8,
})

const BuildCloseButton = styled(Button)({
    width: 44,
    height: 44,
    minWidth: 44,
    padding: 0,
    borderRadius: '50%',
    justifyContent: 'center',
})

const BuildOptions = styled.div({
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
    width: '100%',
})

const SiteProgress = ({ site }: { site: ConstructionSiteActor }) => {
    const subscribe = useCallback(
        (refresh: () => void) => site.game.emitter.on('constructionProgress', refresh),
        [site],
    )
    const wood = useSyncExternalStore(subscribe, () => site.deliveredWood)
    return (
        <span>
            Wood{' '}
            <GoldValue>
                {wood} / {constructionCosts[site.buildingType]}
            </GoldValue>
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

const CampStock = ({ camp }: { camp: WoodStorageBuilding }) => {
    const subscribe = useCallback(
        (refresh: () => void) => camp.game.emitter.on('woodStockChanged', refresh),
        [camp],
    )
    const woodStock = useSyncExternalStore(subscribe, () => camp.woodStock)
    return (
        <span>
            Wood stock:{' '}
            <GoldValue>
                {woodStock} / {camp.woodCapacity}
            </GoldValue>
        </span>
    )
}

const ProfessionButton = styled(Button)({
    cursor: 'pointer',
})

const ActorDetails = styled(Box)({
    '& > :not(canvas)': { position: 'relative', zIndex: 1 },
    position: 'fixed',
    zIndex: 11,
    bottom: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '4px 16px',
    width: 'max-content',
    minWidth: 'min(360px, calc(100vw - 24px))',
    maxWidth: 'calc(100% - 24px)',
    maxHeight: '35vh',
    overflowX: 'auto',
    overflowY: 'hidden',
    boxSizing: 'border-box',
    padding: '8px 16px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(15px)',
    borderRadius: 8,
    pointerEvents: 'none',
})

const SelectionGroups = styled.div({
    display: 'flex',
    alignItems: 'flex-start',
    flexWrap: 'nowrap',
    gap: 16,
    width: 'max-content',
})

const SelectionCategory = styled.div<{ withDivider: boolean }>(
    ({ withDivider, theme }) => ({
        display: 'flex',
        alignItems: 'flex-start',
        flexWrap: 'nowrap',
        gap: 16,
        paddingLeft: withDivider ? 16 : 0,
        borderLeft: withDivider ? `1px solid ${theme.colors.black}` : 'none',
    }),
)

const ActorIdentity = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    minWidth: 0,
    flex: 1,
})

const ActorStats = styled.span(({ theme }) => ({
    color: theme.colors.primary,
    fontVariantNumeric: 'tabular-nums',
}))

const GoldValue = styled.strong(({ theme }) => ({
    color: theme.colors.primary,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
}))

const GoldIcon = styled.span(({ theme }) => ({
    display: 'inline-flex',
    color: theme.colors.primary,
}))

const HutStock = ({ hut }: { hut: HunterHutActor | GuildhallActor }) => {
    const subscribe = useCallback(
        (refresh: () => void) => hut.game.emitter.on('meatStockChanged', refresh),
        [hut],
    )
    const stock = useSyncExternalStore(subscribe, () => hut.meatStock)
    return (
        <span>
            Meat stock:{' '}
            <GoldValue>
                {stock} / {hut.meatCapacity}
            </GoldValue>
        </span>
    )
}
