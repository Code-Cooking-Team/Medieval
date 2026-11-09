import { FloraSpawner } from '+game/actors/flora/FloraSpawner'
import { isHunterHutActor, isWoodCampActor } from '+game/actors/helpers'
import { Game, GameJSON } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { InteractionsManager } from '+game/player/interaction/InteractionsManager'
import { NaturePlayer } from '+game/player/NaturePlayer'
import { PlayerType } from '+game/player/types'
import '+game/professions/machines/woodcutterMachine'
import { Renderer } from '+game/Renderer'
import { ActorType } from '+game/types'
import { generateWorld } from '+game/world/generateWorld'
import { random } from '+helpers/random'
import { Box } from '+ui/components/base/Box'
import { Button } from '+ui/components/base/Button'
import { WoodIcon } from '+ui/components/icons/WoodIcon'
import { Tab } from '+ui/components/tabs/Tab'
import { Tabs } from '+ui/components/tabs/Tabs'
import { useLocalStorage } from '+ui/hooks/useLocalStorage'
import { ConfigForm } from '+ui/modules/config/ConfigForm'
import { SelectedList } from '+ui/modules/selected/SelectedList'
import { SpawnList } from '+ui/modules/spawn/SpawnList'

import styled from '@emotion/styled'
import { Beef, FilePlus, FolderOpen, Save, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'

const gameRootEl = document.getElementById('game-root') as HTMLElement

function App() {
    const [selectedBuilding, setSelectedBuilding] = useState<ActorType>()
    const [renderer, setRenderer] = useState<Renderer>()
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

        const seedParam = new URLSearchParams(window.location.search).get('seed')?.trim()
        const requestedSeed = seedParam ? Number(seedParam) : NaN
        const seed = Number.isSafeInteger(requestedSeed)
            ? requestedSeed
            : Math.floor(random(0, 2 ** 32))
        const world = generateWorld(seed)
        const humanPlayer = new HumanPlayer()
        const naturePlayer = new NaturePlayer()
        const game = new Game(world, [humanPlayer, naturePlayer])

        const floraSpawner = new FloraSpawner(game, naturePlayer, seed)
        floraSpawner.bulkSpawnPlants()

        return { game, humanPlayer }
    }, [toLoadJSON, forceReloadCount])

    useEffect(() => {
        const renderer = new Renderer(game, humanPlayer, gameRootEl)
        const interactions = new InteractionsManager(game, renderer, humanPlayer)

        renderer.init()
        setRenderer(renderer)
        interactions.init()

        const started = () => setStarted(true)
        const stopped = () => setStarted(false)

        game.emitter.on('started', started)
        game.emitter.on('stopped', stopped)

        const selectBuilding = ({ data }: { data: ActorType }) =>
            setSelectedBuilding(data)
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

            humanPlayer.emitter.off('selectBuilding', selectBuilding)
            humanPlayer.emitter.off('unselectBuilding', unselectBuilding)
        }
    }, [game, humanPlayer])

    return (
        <>
            <SettlementStatus game={game} humanPlayer={humanPlayer} />
            <SelectedList humanPlayer={humanPlayer} renderer={renderer} />
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
                            flexWrap="wrap"
                            columnGap={2}
                            rowGap={2}
                        >
                            <GameActionButton
                                label="Save"
                                icon={<Save size={14} aria-hidden="true" />}
                                onClick={() => setSavedJson(game.toJSON())}
                            />
                            {savedJson && (
                                <GameActionButton
                                    label="Load"
                                    icon={<FolderOpen size={14} aria-hidden="true" />}
                                    onClick={() => {
                                        setToLoadJSON(savedJson)
                                        forceReload()
                                    }}
                                />
                            )}
                            <GameActionButton
                                label="New"
                                icon={<FilePlus size={14} aria-hidden="true" />}
                                onClick={() => {
                                    setToLoadJSON(undefined)
                                    forceReload()
                                }}
                            />
                        </Box>
                    </Tab>

                    <Tab label="Spawn">
                        <SpawnList humanPlayer={humanPlayer} />
                    </Tab>

                    <Tab label="Config">
                        <ConfigForm />
                    </Tab>
                </Tabs>
            </Right>
        </>
    )
}

const SettlementStatus = ({
    game,
    humanPlayer,
}: {
    game: Game
    humanPlayer: HumanPlayer
}) => {
    const subscribe = useCallback(
        (refresh: () => void) =>
            game.emitter.on(
                [
                    'actorAdded',
                    'actorRemoved',
                    'started',
                    'woodStockChanged',
                    'meatStockChanged',
                ],
                refresh,
            ),
        [game],
    )
    const population = useSyncExternalStore(
        subscribe,
        () =>
            game
                .findActorsByType(ActorType.Human)
                .filter((actor) => actor.player === humanPlayer).length,
    )

    const wood = useSyncExternalStore(subscribe, () =>
        game.actors.reduce((total, actor) => {
            if (isWoodCampActor(actor) && actor.player === humanPlayer) {
                return total + actor.woodStock
            }
            return total
        }, 0),
    )

    const meat = useSyncExternalStore(subscribe, () =>
        game.actors.reduce(
            (total, actor) =>
                total +
                (isHunterHutActor(actor) && actor.player === humanPlayer
                    ? actor.meatStock
                    : 0),
            0,
        ),
    )

    return (
        <SettlementStatusBox p={2} px={3} display="flex" columnGap={3}>
            <Box as="span" display="inline-flex" alignItems="center" columnGap={2}>
                <Users size={16} aria-hidden="true" />
                Population: {population}
            </Box>
            <Box as="span" display="inline-flex" alignItems="center" columnGap={2}>
                <WoodIcon />
                Wood: {wood}
            </Box>
            <Box as="span" display="inline-flex" alignItems="center" columnGap={2}>
                <Beef size={16} aria-hidden="true" />
                Meat: {meat}
            </Box>
        </SettlementStatusBox>
    )
}

const SettlementStatusBox = styled(Box)({
    position: 'fixed',
    zIndex: 10,
    top: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(15px)',
    borderRadius: 8,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
})

const GameActionButton = styled(Button)({
    paddingInline: 10,
})

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
    '@media (max-width: 800px)': { top: 72 },
})

export default App
