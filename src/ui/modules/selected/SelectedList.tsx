import { ConstructionSiteActor } from '+game/actors/buildings/construction/ConstructionSiteActor'
import {
    constructionCosts,
    type ConstructionType,
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
import { type EquipmentSlot, items } from '+game/actors/units/human/equipment'
import type { HumanActor } from '+game/actors/units/human/HumanActor'
import { type Actor } from '+game/core/Actor'
import type { WoodStorageBuilding } from '+game/core/WoodStorageBuilding'
import { type HumanPlayer } from '+game/player/HumanPlayer'
import { ProfessionType } from '+game/professions/types'
import type { Renderer } from '+game/Renderer'
import { ActorType, actorTypesByCategory } from '+game/types'
import { Button } from '+ui/components/base/Button'
import { ActorIcon } from '+ui/components/icons/ActorIcon'

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
            <div
                className="game-actor-details"
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
                    <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                        <strong className="inline-flex items-center gap-2">
                            <span className="inline-flex text-game-gold">
                                <ActorIcon
                                    type={
                                        singleActor instanceof ConstructionSiteActor
                                            ? singleActor.buildingType
                                            : singleActor.type
                                    }
                                />
                            </span>
                            {singleActor instanceof ConstructionSiteActor
                                ? `${buildingName(singleActor.buildingType)} Construction Site`
                                : singleActor.type}
                        </strong>
                        <span className="text-game-gold tabular-nums">
                            <strong className="font-bold text-game-gold tabular-nums">
                                {singleActor.hp}/{singleActor.maxHp}
                            </strong>{' '}
                            HP
                        </span>
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
                    </div>
                )}
                {canBuild && (
                    <BuildControls
                        humans={[singleActor]}
                        player={humanPlayer}
                        showPicker={showBuildPicker}
                        setShowPicker={setShowBuildPicker}
                    />
                )}
            </div>
        )
    }

    return (
        <div
            className="game-actor-details"
            key="group-selection"
            style={{ pointerEvents: 'auto' }}
        >
            <div className="flex w-max flex-nowrap items-start gap-4">
                {selectedCategories.map(({ category, actors }, categoryIndex) => (
                    <div
                        key={category}
                        className={`flex flex-nowrap items-start gap-4 ${categoryIndex > 0 ? 'border-0 border-l border-solid border-game-ink pl-4' : ''}`}
                    >
                        {actors.map(([type, typedActors]) => (
                            <div key={type}>
                                <Button
                                    icon={
                                        <span className="inline-flex text-game-gold">
                                            <ActorIcon type={type} />
                                        </span>
                                    }
                                    label={`${type} (${typedActors.length})`}
                                    onClick={() => selectActorsByType(type)}
                                />
                                <div className="flex flex-nowrap gap-2 pt-2">
                                    {countProfessions(typedActors).map(
                                        ([professionType, count]) => (
                                            <Button
                                                key={professionType}
                                                icon={
                                                    professionType ===
                                                        ProfessionType.Woodcutter && (
                                                        <span className="inline-flex text-game-gold">
                                                            <Axe
                                                                size={16}
                                                                aria-hidden="true"
                                                            />
                                                        </span>
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
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <BuildControls
                key={selectedHumans.map((actor) => actor.id).join(',')}
                humans={selectedHumans}
                player={humanPlayer}
                showPicker={showGroupBuildPicker}
                setShowPicker={setShowGroupBuildPicker}
            />
        </div>
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
    if (type === ActorType.Gallery) return 'Timber Gallery'
    if (type === ActorType.GalleryStairs) return 'Gallery Stairs'
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
            <span className="inline-flex items-center gap-2">
                {profession?.type === ProfessionType.Woodcutter && (
                    <span className="inline-flex text-game-gold">
                        <Axe size={16} aria-hidden="true" />
                    </span>
                )}
                {profession?.type || noProfession}
            </span>
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
        <div
            className={`pointer-events-auto ml-auto flex flex-wrap gap-2 ${showPicker ? 'w-full items-end justify-end' : 'items-center'}`}
        >
            {showPicker ? (
                <div className="flex w-full flex-col items-end gap-2">
                    <Button
                        className="size-11 min-w-11 rounded-full p-0"
                        aria-label="Close build picker"
                        label=""
                        icon={<X size={24} aria-hidden="true" />}
                        onClick={() => setShowPicker(false)}
                    />
                    <div className="flex w-full flex-wrap justify-end gap-2">
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
                    </div>
                </div>
            ) : (
                <Button
                    className="size-16 min-w-16 shrink-0 rounded-full p-0 text-[0px]"
                    aria-label="Build"
                    icon={<Hammer size={30} aria-hidden="true" />}
                    label=""
                    onClick={() => setShowPicker(true)}
                />
            )}
            {placing && isConstructionType(placing) && (
                <span>{buildingName(placing)} · R to rotate · Esc to exit</span>
            )}
        </div>
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
            Wood{' '}
            <strong className="font-bold text-game-gold tabular-nums">
                {wood} / {constructionCosts[site.buildingType]}
            </strong>
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
            <strong className="font-bold text-game-gold tabular-nums">
                {woodStock} / {camp.woodCapacity}
            </strong>
        </span>
    )
}

const HutStock = ({ hut }: { hut: HunterHutActor | GuildhallActor }) => {
    const subscribe = useCallback(
        (refresh: () => void) => hut.game.emitter.on('meatStockChanged', refresh),
        [hut],
    )
    const stock = useSyncExternalStore(subscribe, () => hut.meatStock)
    return (
        <span>
            Meat stock:{' '}
            <strong className="font-bold text-game-gold tabular-nums">
                {stock} / {hut.meatCapacity}
            </strong>
        </span>
    )
}
