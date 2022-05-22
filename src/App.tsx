import { ActorView } from '+componets/actors/ActorView'
import { DEV_TILES_SIZE } from '+config'
import { Lumberjack } from '+game/actors/Lumberjack'
import { LumberjackCabin } from '+game/actors/LumberjackCabin'
import { Tree } from '+game/actors/Tree'
import { Game } from '+game/Game'
import { Word } from '+game/Word'
import { useEffect, useState } from 'react'

const game = new Game(new Word())

const cabin = new LumberjackCabin(game, [0, 0])
const cabin2 = new LumberjackCabin(game, [14, 13])

const lumberjack = new Lumberjack(game, [1, 1], cabin)

game.addActor(cabin)
game.addActor(cabin2)
game.addActor(lumberjack)

game.addActor(new Lumberjack(game, [0, 4], cabin2))
game.addActor(new Lumberjack(game, [1, 4], cabin2))

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

function App() {
    const [, render] = useState(0)

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

    return (
        <div className="word">
            <div className="word-origin">
                {game.word.tiles.map((row, y) => (
                    <div key={y} className="row">
                        {row.map(({ id, name }, x) => (
                            <div
                                key={id}
                                className={`tile ${name}`}
                                style={{ width: DEV_TILES_SIZE, height: DEV_TILES_SIZE }}
                                onClick={() => lumberjack.goTo([x, y])}
                            >{`${x},${y}`}</div>
                        ))}
                    </div>
                ))}
                {game.actors.map((actor) => (
                    <ActorView key={actor.id} actor={actor} />
                ))}
            </div>
        </div>
    )
}

export default App
