import { type Game } from '+game/Game'
import { type HumanPlayer } from '+game/player/HumanPlayer'
import { ActorType, actorTypesByCategory } from '+game/types'
import { Button } from '+ui/components/base/Button'
import { ActorIcon } from '+ui/components/icons/ActorIcon'

import { useEffect, useState } from 'react'

interface SpawnListProps {
    game: Game
    humanPlayer: HumanPlayer
}

const actorLabels: Partial<Record<ActorType, string>> = {
    [ActorType.Gallery]: 'Timber Gallery',
    [ActorType.GalleryStairs]: 'Gallery Stairs',
    [ActorType.SmallRock]: 'Small rock (1 × 1)',
    [ActorType.MediumRock]: 'Medium rock (2 × 2)',
    [ActorType.LargeRock]: 'Large rock (3 × 3)',
}

const categories = Object.entries(actorTypesByCategory)

function countActors(game: Game) {
    const counts: Partial<Record<ActorType, number>> = {}
    for (const { type } of game.actors) {
        counts[type] = (counts[type] ?? 0) + 1
    }
    return counts
}

export const SpawnList = ({ game, humanPlayer }: SpawnListProps) => {
    const [counts, setCounts] = useState(() => countActors(game))

    useEffect(() => {
        const updateCounts = () => setCounts(countActors(game))
        game.emitter.on('actorAdded', updateCounts)
        game.emitter.on('actorRemoved', updateCounts)
        updateCounts()
        return () => {
            game.emitter.off('actorAdded', updateCounts)
            game.emitter.off('actorRemoved', updateCounts)
        }
    }, [game])

    const [selectedBuilding, setSelectedBuilding] = useState<ActorType | undefined>(
        humanPlayer.selectedBuilding,
    )

    const [removingBuildings, setRemovingBuildings] = useState(
        humanPlayer.removingBuildings,
    )

    useEffect(() => {
        const updateRemovalMode = () =>
            setRemovingBuildings(humanPlayer.removingBuildings)
        setSelectedBuilding(
            humanPlayer.constructionBuilder ? undefined : humanPlayer.selectedBuilding,
        )
        updateRemovalMode()
        humanPlayer.emitter.on('removalModeChanged', updateRemovalMode)
        const selectBuilding = ({ data }: { data: ActorType }) =>
            setSelectedBuilding(humanPlayer.constructionBuilder ? undefined : data)
        const unselectBuilding = () => setSelectedBuilding(undefined)

        humanPlayer.emitter.on('selectBuilding', selectBuilding)
        humanPlayer.emitter.on('unselectBuilding', unselectBuilding)

        return () => {
            humanPlayer.emitter.off('removalModeChanged', updateRemovalMode)
            humanPlayer.setBuildingRemoval(false)
            humanPlayer.emitter.off('selectBuilding', selectBuilding)
            humanPlayer.emitter.off('unselectBuilding', unselectBuilding)
        }
    }, [humanPlayer])

    return (
        <div className="flex flex-col gap-4 p-4">
            <Button
                label={removingBuildings ? '✓ Remove buildings' : 'Remove buildings'}
                onClick={() =>
                    humanPlayer.setBuildingRemoval(!humanPlayer.removingBuildings)
                }
            />
            {removingBuildings && (
                <div>Click a building to remove it. Press Esc to cancel.</div>
            )}
            {categories.map(([category, actorTypes]) => (
                <div key={category} className="flex flex-col gap-2">
                    <div>{category}</div>
                    {actorTypes.map((actorType) => (
                        <Button
                            key={actorType}
                            icon={<ActorIcon type={actorType} />}
                            label={`${selectedBuilding === actorType ? '✓ ' : ''}${actorLabels[actorType] ?? actorType} (${counts[actorType] ?? 0})`}
                            onClick={() => humanPlayer.selectBuilding(actorType)}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}
