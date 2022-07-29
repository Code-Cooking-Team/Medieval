import { ConfigForm } from '+components/config/ConfigForm'
import { FloraSpawner } from '+game/actors/flora/FloraSpawner'
import { Actor } from '+game/core/Actor'
import { Game, GameJSON } from '+game/Game'
// Island, TestMap, TestMapBig, de_grass
import map from '+game/maps/Island'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { InteractionsManager } from '+game/player/interaction/InteractionsManager'
import { NaturePlayer } from '+game/player/NaturePlayer'
import { PlayerType } from '+game/player/types'
import '+game/professions/machines/woodcutterMachine'
import { Renderer } from '+game/Renderer'
import { ActorType, allActorTypes } from '+game/types'
import { createTilesFromGrid, TileCodeGrid } from '+game/world/tileCodes'
import { World } from '+game/world/World'

import styled from '@emotion/styled'
import {
    Button,
    ButtonGroup,
    createTheme,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    ThemeProvider,
} from '@mui/material'
import { groupBy } from 'lodash'
import { useEffect, useMemo, useState } from 'react'

import save from './save.json'

const gameRoot = document.getElementById('game-root') as HTMLElement

function App() {
    const [selectedBuilding, setSelectedBuilding] = useState<ActorType>()
    const [selectedActors, setSelectedActors] = useState<Actor[]>([])
    const [started, setStarted] = useState(false)

    const [savedJson, setSavedJson] = useState<GameJSON>()
    const [toLoadJSON, setToLoadJSON] = useState<GameJSON | undefined>(save as GameJSON)

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

        // Island
        // const h1 = game.spawnActor(HumanActor, humanPlayer, [14, 14])
        // const c1 = game.spawnActor(WoodCampActor, humanPlayer, [15, 15])

        // if (h1) c1?.interact([h1])

        // de_grass
        // game.spawnActor(HouseActor, humanPlayer, [112, 113])
        // game.spawnActor(BarracksActor, humanPlayer, [102, 93])

        // const h1 = game.spawnActor(HumanActor, humanPlayer, [112, 120])
        // const h2 = game.spawnActor(HumanActor, humanPlayer, [68, 120])

        // const c1 = game.spawnActor(WoodCampActor, humanPlayer, [87, 120])
        // const c2 = game.spawnActor(WoodCampActor, humanPlayer, [100, 114])

        // if (h1) c1?.interact([h1])
        // if (h2) c2?.interact([h2])

        // game.spawnActor(BoarActor, humanPlayer, [55, 120])
        // game.spawnActor(BoarActor, humanPlayer, [66, 120])
        // game.spawnActor(BoarActor, humanPlayer, [67, 120])

        const floraSpawner = new FloraSpawner(game, naturePlayer)
        floraSpawner.bulkSpawnTrees()

        return { game, humanPlayer }
    }, [toLoadJSON])

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
        <ThemeProvider theme={darkTheme}>
            <Bottom>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <ButtonGroup>
                        <Button
                            onClick={() => {
                                started ? game.stop() : game.start()
                            }}
                        >
                            {started ? 'Stop' : 'Start'}
                        </Button>
                        {!started && <Button onClick={() => game.tick()}>Tick</Button>}
                    </ButtonGroup>

                    <FormControl style={{ minWidth: 200 }}>
                        <InputLabel>Building</InputLabel>
                        <Select
                            value={selectedBuilding || ''}
                            onChange={({ target }) => {
                                humanPlayer.selectBuilding(target.value as ActorType)
                            }}
                        >
                            <MenuItem value="">-</MenuItem>
                            {allActorTypes.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <ButtonGroup>
                        <Button onClick={() => setSavedJson(game.toJSON())}>Save</Button>
                        {savedJson && (
                            <Button
                                onClick={() => {
                                    setToLoadJSON(savedJson)
                                    setSavedJson(undefined)
                                }}
                            >
                                Load
                            </Button>
                        )}
                        <Button
                            onClick={() => {
                                setToLoadJSON(undefined)
                            }}
                        >
                            New
                        </Button>
                    </ButtonGroup>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={2}>
                    {selected.map(([type, actor]) => (
                        <Button key={type} onClick={() => selectActorsByType(type)}>
                            {type} ({actor.length})
                        </Button>
                    ))}
                </Stack>
            </Bottom>

            <Right>
                <ConfigForm />
            </Right>
        </ThemeProvider>
    )
}

const darkTheme = createTheme({
    palette: { mode: 'dark' },
})

const Bottom = styled.div({
    position: 'absolute',
    zIndex: 10,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: '10px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 0 40px -10px rgba(0, 0, 0, 0.3)',
})

const Right = styled.div({
    position: 'absolute',
    zIndex: 10,
    top: 0,
    right: 0,
    bottom: 0,
    overflow: 'auto',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: '20px',
    backdropFilter: 'blur(15px)',
    maxWidth: '250px',
    width: '90%',
    transform: 'translateX(100%) translateX(-20px)',
    transition: 'transform 1s ease 0.8s',
    boxShadow: '0 0 40px -10px rgba(0, 0, 0, 0.3)',
    ':hover': {
        transform: 'translateX(0%)',
        transition: 'transform 0.35s ease',
    },
    ':after': {
        content: '""',
        position: 'absolute',
        left: '8px',
        top: 0,
        bottom: 0,
        height: '15px',
        width: '4px',
        border: '1px solid rgba(255, 255, 255, 0.596)',
        borderWidth: '0 1px 0 1px',
        margin: 'auto',
    },
})

export default App
