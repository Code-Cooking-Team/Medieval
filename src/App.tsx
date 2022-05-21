import { Lumberjack } from '+game/actors/Lumberjack'
import { Tree } from '+game/actors/Tree'
import { Game } from '+game/Game'
import { Word } from '+game/Word'
import { useEffect, useState } from 'react'

const size = 100

const game = new Game(new Word())

const lumberjack = new Lumberjack(game, [1, 1])
const tree = new Tree(game, [3, 7])

game.addActor(lumberjack)
game.addActor(tree)

function App() {
    const [, render] = useState(0)

    useEffect(() => {
        game.start()
        const unsubscribe = game.subscribe((type) => {
            console.log(type)
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
                    <div className="row">
                        {row.map(({ id, name }, x) => (
                            <div
                                key={id}
                                className={`tile ${name}`}
                                style={{ width: size, height: size }}
                                onClick={() => lumberjack.goTo([x, y])}
                            >{`${x},${y}`}</div>
                        ))}
                    </div>
                ))}
                {game.actors.map(({ id, name, position: [x, y] }) => (
                    <div
                        key={id}
                        className={`actor ${name}`}
                        style={{ left: `${x * size}px`, top: `${y * size}px` }}
                    ></div>
                ))}
            </div>
        </div>
    )
}

export default App
