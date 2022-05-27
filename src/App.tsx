import { ActorView } from '+componets/actors/ActorView'
import { TileRow } from '+componets/word/TileRow'
import { DEV_TILES_SIZE } from '+config'
import { Lumberjack } from '+game/actors/Lumberjack'
import { LumberjackCabin } from '+game/actors/LumberjackCabin'
import { Tree } from '+game/actors/Tree'
import { Game } from '+game/Game'
import { Position } from '+game/types'
import { Word } from '+game/Word'
import styled from '@emotion/styled'
import { useEffect, useState } from 'react'

const game = new Game(new Word())

game.addActor(new Tree(game, [3, 7]))
game.addActor(new Tree(game, [7, 0]))
game.addActor(new Tree(game, [6, 0]))
game.addActor(new Tree(game, [5, 0]))
game.addActor(new Tree(game, [6, 5]))
game.addActor(new Tree(game, [11, 11]))
game.addActor(new Tree(game, [11, 10]))
game.addActor(new Tree(game, [11, 13]))
game.addActor(new Tree(game, [0, 13]))
game.addActor(new Tree(game, [0, 10]))

const buildings = {
    LumberjackCabin: ([x, y]: Position) => {
        const cabin = new LumberjackCabin(game, [x, y])
        const lumberjack = new Lumberjack(game, [x - 1, y], cabin)

        game.addActor(cabin)
        game.addActor(lumberjack)
    },
    Tree: ([x, y]: Position) => {
        game.addActor(new Tree(game, [x, y]))
    },
}

type BuildingKey = keyof typeof buildings

const buildingList = Object.keys(buildings) as BuildingKey[]

function App() {
    const [, render] = useState(0)
    const [selectedBuilding, setSelectedBuilding] = useState<BuildingKey>(buildingList[0])

    useEffect(() => {
        game.start()
        const unsubscribe = game.subscribe((type) => {
            console.log('-----------------', type)
            render((n) => n + 1)
        })

        return () => {
            game.stop()
            unsubscribe()
        }
    }, [])

    const isRunning = game.isRunning()

    return (
        <>
            <Interface>
                <button
                    onClick={() => {
                        isRunning ? game.stop() : game.start()
                        render((n) => n + 1)
                    }}
                >
                    {isRunning ? 'Stop' : 'Start'}
                </button>

                <select
                    value={selectedBuilding}
                    onChange={(e) => {
                        setSelectedBuilding(e.target.value as BuildingKey)
                    }}
                >
                    {buildingList.map((building) => (
                        <option key={building} value={building}>
                            {building}
                        </option>
                    ))}
                </select>

                {!isRunning && <button onClick={() => game.tick()}>Tick</button>}
            </Interface>
            <div className="word">
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
            </div>
        </>
    )
}

const Interface = styled.div({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: '10px',
})

export default App
