import { Path, Position } from '+game/types'
import { Word } from '+game/Word'
import EasyStar from 'easystarjs'

export class Pathfinding {
    private easystar = new EasyStar.js()

    private unsubscribe: () => void

    constructor(private word: Word) {
        this.unsubscribe = this.word.subscribe(() => {
            this.recalculate()
        })
    }

    public tick() {
        this.easystar.calculate()
    }

    public destruct() {
        this.unsubscribe()
    }

    public path([sx, sy]: Position, [ex, ey]: Position) {
        return new Promise<Path>((resolve) => {
            this.easystar.findPath(sx, sy, ex, ey, (path) => {
                path?.shift()
                resolve(path)
            })
        })
    }

    public recalculate() {
        const tiles = this.word.tiles.map((row) =>
            row.map((tile) => (tile.walkable ? 1 : 0)),
        )
        this.easystar.setGrid(tiles)
        this.easystar.setAcceptableTiles([1])
        this.easystar.enableDiagonals()
    }
}
