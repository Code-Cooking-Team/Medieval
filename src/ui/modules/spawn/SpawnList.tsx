import { type HumanPlayer } from '+game/player/HumanPlayer'
import { type ActorType, actorTypesByCategory } from '+game/types'
import { Button } from '+ui/components/base/Button'
import { ActorIcon } from '+ui/components/icons/ActorIcon'

import { useEffect, useState } from 'react'

interface SpawnListProps {
    humanPlayer: HumanPlayer
}

const categories = Object.entries(actorTypesByCategory)

export const SpawnList = ({ humanPlayer }: SpawnListProps) => {
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
                            label={
                                selectedBuilding === actorType
                                    ? `✓ ${actorType}`
                                    : actorType
                            }
                            onClick={() => humanPlayer.selectBuilding(actorType)}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}
