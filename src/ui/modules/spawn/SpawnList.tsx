import { HumanPlayer } from '+game/player/HumanPlayer'
import { ActorType, actorTypesByCategory } from '+game/types'
import { Box } from '+ui/components/base/Box'
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
        <Box p={3} display="flex" flexDirection="column" rowGap={3}>
            <Button
                label={removingBuildings ? '✓ Remove buildings' : 'Remove buildings'}
                onClick={() =>
                    humanPlayer.setBuildingRemoval(!humanPlayer.removingBuildings)
                }
            />
            {removingBuildings && (
                <Box>Click a building to remove it. Press Esc to cancel.</Box>
            )}
            {categories.map(([category, actorTypes]) => (
                <Box key={category} display="flex" flexDirection="column" rowGap={2}>
                    <Box>{category}</Box>
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
                </Box>
            ))}
        </Box>
    )
}
