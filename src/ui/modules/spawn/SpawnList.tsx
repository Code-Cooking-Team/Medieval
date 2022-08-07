import { HumanPlayer } from '+game/player/HumanPlayer'
import { ActorType, actorTypesByCategory } from '+game/types'
import { Box } from '+ui/components/base/Box'
import { Button } from '+ui/components/base/Button'

import { useEffect, useState } from 'react'

interface SpawnListProps {
    humanPlayer: HumanPlayer
}

const categories = Object.entries(actorTypesByCategory)

export const SpawnList = ({ humanPlayer }: SpawnListProps) => {
    const [selectedBuilding, setSelectedBuilding] = useState<ActorType | undefined>(
        humanPlayer.selectedBuilding,
    )

    useEffect(() => {
        const selectBuilding = (building: ActorType) => setSelectedBuilding(building)
        const unselectBuilding = () => setSelectedBuilding(undefined)

        humanPlayer.emitter.on('selectBuilding', selectBuilding)
        humanPlayer.emitter.on('unselectBuilding', unselectBuilding)

        return () => {
            humanPlayer.emitter.off('selectBuilding', selectBuilding)
            humanPlayer.emitter.off('unselectBuilding', unselectBuilding)
        }
    }, [])

    return (
        <Box p={3} display="flex" flexDirection="column" rowGap={3}>
            {categories.map(([category, actorTypes]) => (
                <Box key={category} display="flex" flexDirection="column" rowGap={2}>
                    <Box>{category}</Box>
                    {actorTypes.map((actorType) => (
                        <Button
                            key={actorType}
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
