import { FloraSpawner } from '+game/actors/flora/FloraSpawner'
import { Actor } from '+game/core/Actor'
import { Game, GameJSON } from '+game/Game'
// Island, TestMap, TestMapBig, de_grass
import map from '+game/maps/de_grass'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { InteractionsManager } from '+game/player/interaction/InteractionsManager'
import { NaturePlayer } from '+game/player/NaturePlayer'
import { PlayerType } from '+game/player/types'
import '+game/professions/machines/woodcutterMachine'
import { Renderer } from '+game/Renderer'
import { ActorType, allActorTypes } from '+game/types'
import { createTilesFromGrid, TileCodeGrid } from '+game/world/tileCodes'
import { World } from '+game/world/World'
import { Box } from '+ui/components/base/Box'
import { Button } from '+ui/components/base/Button'
import { ConfigForm } from '+ui/components/config/ConfigForm'
import { Tab } from '+ui/components/tabs/Tab'
import { Tabs } from '+ui/components/tabs/Tabs'
import { useLocalStorage } from '+ui/hooks/useLocalStorage'

import styled from '@emotion/styled'
import { groupBy } from 'lodash'
import { useEffect, useMemo, useState } from 'react'

const gameRoot = document.getElementById('game-root') as HTMLElement

function App() {
    const [selectedBuilding, setSelectedBuilding] = useState<ActorType>()
    const [selectedActors, setSelectedActors] = useState<Actor[]>([])
    const [started, setStarted] = useState(false)

    const [forceReloadCount, setForceReloadCount] = useState(0)
    const forceReload = () => setForceReloadCount((v) => v + 1)

    const [savedJson, setSavedJson] = useLocalStorage<GameJSON>(
        'saved-game2',
        undefined,
        true,
    )
    const [toLoadJSON, setToLoadJSON] = useState<GameJSON | undefined>()

    const { game, humanPlayer } = useMemo(() => {
        if (toLoadJSON) {
            const game = Game.fromJSON(toLoadJSON)

            const humanPlayer = game.players.find(
                (player) => player.type === PlayerType.Human,
            ) as HumanPlayer

            return { game, humanPlayer }
        }

        const tiles = createTilesFromGrid(map as TileCodeGrid)
        const word = new World(tiles)
        const humanPlayer = new HumanPlayer()
        const naturePlayer = new NaturePlayer()
        const game = new Game(word, [humanPlayer, naturePlayer])

        const floraSpawner = new FloraSpawner(game, naturePlayer)
        floraSpawner.bulkSpawnTrees()

        return { game, humanPlayer }
    }, [toLoadJSON, forceReloadCount])

    useEffect(() => {
        const renderer = new Renderer(game, humanPlayer, gameRoot)
        const interactions = new InteractionsManager(game, renderer, humanPlayer)

        renderer.init()
        interactions.init()

        const started = () => setStarted(true)
        const stopped = () => setStarted(false)

        game.emitter.on('started', started)
        game.emitter.on('stopped', stopped)

        const selectActors = (actor: Actor[]) => setSelectedActors(actor)
        const unselectActors = () => setSelectedActors([])

        humanPlayer.emitter.on('selectActors', selectActors)
        humanPlayer.emitter.on('unselectActors', unselectActors)

        const selectBuilding = (building: ActorType) => setSelectedBuilding(building)
        const unselectBuilding = () => setSelectedBuilding(undefined)

        humanPlayer.emitter.on('selectBuilding', selectBuilding)
        humanPlayer.emitter.on('unselectBuilding', unselectBuilding)

        game.start()

        const anyWindow = window as any
        anyWindow.game = game

        return () => {
            game.stop()

            interactions.destroy()
            renderer.destroy()

            game.emitter.off('started', started)
            game.emitter.off('stopped', stopped)

            humanPlayer.emitter.off('selectActors', selectActors)
            humanPlayer.emitter.off('unselectActors', unselectActors)

            humanPlayer.emitter.off('selectBuilding', selectBuilding)
            humanPlayer.emitter.off('unselectBuilding', unselectBuilding)
        }
    }, [game, humanPlayer])

    const selected = Object.entries(groupBy(selectedActors, (actor) => actor.type)) as [
        ActorType,
        Actor[],
    ][]

    const selectActorsByType = (type: ActorType) => {
        humanPlayer.selectActors(selectedActors.filter((actor) => actor.type === type))
    }

    return (
        <>
            <Right>
                <Box
                    p={3}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    columnGap={2}
                >
                    <Button
                        label={started ? 'Stop' : 'Start'}
                        onClick={() => {
                            started ? game.stop() : game.start()
                        }}
                    />
                    {!started && <Button label="Tick" onClick={() => game.tick()} />}
                </Box>

                <Tabs>
                    <Tab label="Game">
                        <Box
                            p={3}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            columnGap={2}
                        >
                            <Button
                                label="Save"
                                onClick={() => setSavedJson(game.toJSON())}
                            />
                            {savedJson && (
                                <Button
                                    label="Load"
                                    onClick={() => {
                                        setToLoadJSON(savedJson)
                                        forceReload()
                                    }}
                                />
                            )}
                            <Button
                                label="New"
                                onClick={() => {
                                    setToLoadJSON(undefined)
                                }}
                            />
                        </Box>

                        <Box p={3} display="flex" flexDirection="column" rowGap={3}>
                            {selected.map(([type, actor]) => (
                                <Button
                                    key={type}
                                    label={`${type} (${actor.length})`}
                                    onClick={() => selectActorsByType(type)}
                                />
                            ))}
                        </Box>
                    </Tab>

                    <Tab label="Spawn">
                        <Box p={3} display="flex" flexDirection="column" rowGap={3}>
                            {allActorTypes.map((option) => (
                                <Button
                                    key={option}
                                    label={
                                        selectedBuilding === option
                                            ? `✓ ${option}`
                                            : option
                                    }
                                    onClick={() => {
                                        humanPlayer.selectBuilding(option)
                                    }}
                                />
                            ))}
                        </Box>
                    </Tab>

                    <Tab label="Config">
                        <ConfigForm />
                    </Tab>
                </Tabs>
            </Right>
        </>
    )
}

const Right = styled(Box)({
    position: 'absolute',
    zIndex: 10,
    top: 0,
    right: 0,
    bottom: 0,
    overflow: 'auto',
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(15px)',
    maxWidth: 280,
    width: '90%',
})

export default App
