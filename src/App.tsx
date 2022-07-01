import { ConfigForm } from '+components/config/ConfigForm'
import { GuardianActor } from '+game/actors/guardian/GuardianActor'
import { LumberjackActor } from '+game/actors/lumberjack/LumberjackActor'
import { LumberjackCabinActor } from '+game/actors/lumberjack/LumberjackCabinActor'
import { TreeActor } from '+game/actors/tree/TreeActor'
import { StaticActor } from '+game/core/StaticActor'
import { WalkableActor } from '+game/core/WalkableActor'
import { Game } from '+game/Game'
import { Builder, BuildingKey, buildingList } from '+game/player/Builder'
import { Interactions } from '+game/player/Interactions'
import { Player } from '+game/player/Player'
import { Renderer } from '+game/Renderer'
import { FootpathTile, InsideTile, WallTile } from '+game/Tile'
import { Word } from '+game/Word'
import { seededRandom } from '+helpers/random'

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
import { useEffect, useMemo, useRef, useState } from 'react'
import { VRButton } from 'three/examples/jsm/webxr/VRButton'

import { createTileGrid } from './lib/createTileGrid'

const gameRoot = document.getElementById('game-root') as HTMLElement

function App() {
    const [selectedBuilding, setSelectedBuilding] = useState<BuildingKey>()
    const [selectedActor, setSelectedActor] = useState<WalkableActor | StaticActor>()

    const [, frameCount] = useState(0)
    const render = () => frameCount((n) => n + 1)

    const { game, interactions } = useMemo(() => {
        const word = new Word()
        const player = new Player()
        const game = new Game(word, player)
        const renderer = new Renderer(game, gameRoot)
        const interactions = new Interactions(game, renderer)

        renderer.init()

        // buildings.Guardian([100, 120])
        // buildings.LumberjackCabin([107, 120])
        // buildings.LumberjackCabin([117, 100])

        return { game, interactions }
    }, [])

    useEffect(() => {
        game.start()
        render()

        const anyWindow = window as any
        anyWindow.game = game

        // TODO move planting to a separate class
        const rng = seededRandom(1234567)

        game.word.tiles.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile.canWalk && rng() < tile.treeChance) {
                    game.addActor(new TreeActor(game, [x, y]))
                }
            })
        })

        return () => {
            game.stop()
        }
    }, [])

    useEffect(() => {
        game.player.emitter.on('selectActor', setSelectedActor)
        game.player.emitter.on('unselectActor', setSelectedActor)
    }, [])

    const isRunning = game.isRunning()

    return (
        <ThemeProvider theme={darkTheme}>
            <Bottom>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <ButtonGroup>
                        <Button
                            onClick={() => {
                                isRunning ? game.stop() : game.start()
                                render()
                            }}
                        >
                            {isRunning ? 'Stop' : 'Start'}
                        </Button>
                        {!isRunning && <Button onClick={() => game.tick()}>Tick</Button>}
                    </ButtonGroup>

                    <FormControl style={{ minWidth: 200 }}>
                        <InputLabel>Actor</InputLabel>
                        <Select
                            value={selectedBuilding || ''}
                            onChange={(e) => {
                                const building = e.target.value as BuildingKey
                                setSelectedBuilding(building)
                                interactions.selectBulding(building)
                                game.player.emitter.once('unselectBuilding').then(() => {
                                    setSelectedBuilding(undefined)
                                })
                            }}
                        >
                            <MenuItem value="">-</MenuItem>
                            {buildingList.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {selectedActor && <b>{selectedActor.type}</b>}
                </Stack>
            </Bottom>

            <Right>
                <ConfigForm onChange={() => render()} />
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
