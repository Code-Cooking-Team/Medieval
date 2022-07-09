import { ConfigForm } from '+components/config/ConfigForm'
import { BarracksActor } from '+game/actors/buildings/barracks/BarracksActor'
import { HouseActor } from '+game/actors/buildings/house/HouseActor'
import { WoodCampActor } from '+game/actors/buildings/woodCamp/WoodCampActor'
import { FloraSpawner } from '+game/actors/flora/FloraSpawner'
import { BoarActor } from '+game/actors/units/boars/BoarActor'
import { HumanActor } from '+game/actors/units/human/HumanActor'
import { Actor } from '+game/core/Actor'
import { Game } from '+game/Game'
import { InteractionsManager } from '+game/player/interaction/InteractionsManager'
import { Player } from '+game/player/Player'
import { Renderer } from '+game/Renderer'
import { ActorType, allActorTypes } from '+game/types'
import { Word } from '+game/word/Word'

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

const gameRoot = document.getElementById('game-root') as HTMLElement

function App() {
    const [selectedBuilding, setSelectedBuilding] = useState<ActorType>()
    const [selectedActors, setSelectedActors] = useState<Actor[]>([])
    const [started, setStarted] = useState(false)

    const { game, player } = useMemo(() => {
        const word = new Word()
        const player = new Player()
        const game = new Game(word, player)
        const renderer = new Renderer(game, gameRoot)
        const interactions = new InteractionsManager(game, renderer)

        interactions.init()
        renderer.init()

        game.spawnActor(HouseActor, [112, 113])

        game.spawnActor(BarracksActor, [102, 93])

        const h1 = game.spawnActor(HumanActor, [112, 120])
        const h2 = game.spawnActor(HumanActor, [110, 120])

        const c1 = game.spawnActor(WoodCampActor, [87, 120])
        const c2 = game.spawnActor(WoodCampActor, [85, 114])

        if (h1) c1?.interact([h1])
        if (h2) c2?.interact([h2])

        game.spawnActor(BoarActor, [95, 120])
        game.spawnActor(BoarActor, [96, 120])
        game.spawnActor(BoarActor, [97, 120])

        // game.spawnActor(GuardianActor, [101, 120])
        // game.spawnActor(GuardianActor, [102, 120])
        // game.spawnActor(GuardianActor, [103, 120])
        // game.spawnActor(GuardianActor, [104, 120])
        // game.spawnActor(GuardianActor, [105, 120])
        // game.spawnActor(GuardianActor, [106, 120])

        // game.spawnActor(GuardianActor, [101, 121])
        // game.spawnActor(GuardianActor, [102, 121])
        // game.spawnActor(GuardianActor, [103, 121])
        // game.spawnActor(GuardianActor, [104, 121])
        // game.spawnActor(GuardianActor, [105, 121])
        // game.spawnActor(GuardianActor, [106, 121])

        // game.spawnActor(GuardianActor, [101, 122])
        // game.spawnActor(GuardianActor, [102, 122])
        // game.spawnActor(GuardianActor, [103, 122])
        // game.spawnActor(GuardianActor, [104, 122])
        // game.spawnActor(GuardianActor, [105, 122])
        // game.spawnActor(GuardianActor, [106, 122])

        const floraSpawner = new FloraSpawner(game)
        floraSpawner.bulkSpawnTrees()

        return { game, player }
    }, [])

    useEffect(() => {
        game.player.emitter.on('selectActors', (actor) => setSelectedActors(actor))
        game.player.emitter.on('unselectActors', () => setSelectedActors([]))

        game.emitter.on('started', () => setStarted(true))
        game.emitter.on('stopped', () => setStarted(false))

        player.emitter.on('selectBuilding', (building) => setSelectedBuilding(building))
        player.emitter.on('unselectBuilding', () => setSelectedBuilding(undefined))
    }, [])

    useEffect(() => {
        game.start()

        const anyWindow = window as any
        anyWindow.game = game

        return () => {
            game.stop()
        }
    }, [])

    const selected = Object.entries(groupBy(selectedActors, (actor) => actor.type)) as [
        ActorType,
        Actor[],
    ][]

    const selectActorsByType = (type: ActorType) => {
        player.selectActors(selectedActors.filter((actor) => actor.type === type))
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
                                player.selectBuilding(target.value as ActorType)
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
