import { ConfigForm } from '+componets/config/ConfigForm'
import { Lumberjack } from '+game/actors/Lumberjack'
import { LumberjackCabin } from '+game/actors/LumberjackCabin'
import { Tree } from '+game/actors/Tree'
import { Game } from '+game/Game'
import { Renderer } from '+game/Renderer'
import { FootpathTile, InsideTile, WallTile } from '+game/Tile'
import { Position } from '+game/types'
import { Word } from '+game/Word'
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
import { useEffect, useRef, useState } from 'react'

const game = new Game(new Word())
const renderer = new Renderer(game)

const buildings = {
    _LumberjackCabin: ([x, y]: Position) => {
        const cabin = new LumberjackCabin(game, [x, y])
        const lumberjack = new Lumberjack(game, [x, y], cabin)

        game.addActor(cabin)
        game.addActor(lumberjack)

        const currTail = game.word.getTile([x, y])

        const createWallTile = () => {
            const instance = new WallTile()
            instance.height = currTail.height
            return instance
        }

        const createFootpathTile = () => {
            const instance = new FootpathTile()
            instance.height = currTail.height
            return instance
        }

        const createInsideTile = () => {
            const instance = new InsideTile()
            instance.height = currTail.height
            return instance
        }

        const buildingStructure: string[][] = [
            ['.', '.', '.', '.', '.'],
            ['.', 'W', 'W', 'W', '.'],
            ['.', 'W', '!', 'W', '.'],
            ['.', 'W', '!', 'W', '.'],
            ['.', '.', '.', '.', '.'],
        ]

        const centerX = Math.floor(buildingStructure.length / 2)
        const centerY = Math.floor(buildingStructure[0].length / 2)

        game.word.setTiles((tiles) => {
            buildingStructure.forEach((row, localY) => {
                row.forEach((tileCode, localX) => {
                    tiles[y + localY - centerY][x + localX - centerX] =
                        tileCode === 'W'
                            ? createWallTile()
                            : tileCode === '!'
                            ? createInsideTile()
                            : createFootpathTile()
                })
            })
        })
    },
    get LumberjackCabin() {
        return this._LumberjackCabin
    },
    set LumberjackCabin(value) {
        this._LumberjackCabin = value
    },

    Tree: ([x, y]: Position) => {
        game.addActor(new Tree(game, [x, y]))
    },
}

buildings.LumberjackCabin([8, 12])

game.word.tiles.forEach((row, y) => {
    row.forEach((tile, x) => {
        if (tile.canWalk && Math.random() < tile.treeChance) {
            game.addActor(new Tree(game, [x, y]))
        }
    })
})

const anyWindow = window as any
anyWindow.game = game

anyWindow.logStats = () => {
    console.log('Scene polycount:', renderer.webGLRenderer.info.render.triangles)
    console.log('Active Drawcalls:', renderer.webGLRenderer.info.render.calls)
    console.log('Textures in Memory', renderer.webGLRenderer.info.memory.textures)
    console.log('Geometries in Memory', renderer.webGLRenderer.info.memory.geometries)
}

type BuildingKey = keyof typeof buildings
const buildingList = Object.keys(buildings) as BuildingKey[]

function App() {
    const rendererRef = useRef<HTMLDivElement>(null)
    const [selectedBuilding, setSelectedBuilding] = useState<BuildingKey>()

    const [, frameCount] = useState(0)
    const render = () => frameCount((n) => n + 1)

    useEffect(() => {
        game.start()
        const unsubscribe = game.subscribe((type) => {
            render()
        })

        renderer.init(rendererRef.current!)

        return () => {
            game.stop()
            unsubscribe()
        }
    }, [])

    useEffect(() => {
        const addBuilding = (event: MouseEvent): void => {
            const position = renderer.findPositionByMouseEvent(event)
            if (!selectedBuilding || !position) return
            const currTail = game.word.getTile(position)
            if (currTail.canBuild) {
                console.log(currTail)
                buildings[selectedBuilding](position)
            }
        }

        rendererRef.current?.addEventListener('click', addBuilding)

        return () => {
            rendererRef.current?.removeEventListener('click', addBuilding)
        }
    }, [selectedBuilding])

    const isRunning = game.isRunning()

    return (
        <ThemeProvider theme={darkTheme}>
            <Bottom>
                <Stack direction="row" spacing={2}>
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
                                setSelectedBuilding(e.target.value as BuildingKey)
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
                </Stack>
            </Bottom>

            <Right>
                <ConfigForm onChange={() => render()} />
            </Right>

            <RendererDiv ref={rendererRef} />

            {/* <div className="word">
                <div className="word-origin">
                    {game.word.tiles.map((row, y) => (
                        <TileRow
                            key={y}
                            tiles={row}
                            y={y}
                            onClick={(position) => {
                                buildings[selectedBuilding]?.(position)
                            }}
                        />
                    ))}
                    {game.actors.map((actor) => (
                        <ActorView key={actor.id} actor={actor} />
                    ))}
                </div>
            </div> */}
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

const RendererDiv = styled.div({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    'canvas': {},
})

export default App
