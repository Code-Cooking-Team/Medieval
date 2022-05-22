import { Game } from '+game/Game'
import { Path, Position } from '+game/types'
import EasyStar from 'easystarjs'

export class Pathfinding {
    private easystar = new EasyStar.js()
    private instanceId?: number

    private unsubscribe: () => void

    constructor(private game: Game) {
        this.unsubscribe = this.game.word.subscribe(() => {
            this.loadTilesGrid()
        })
        this.loadTilesGrid()
    }

    public tick() {
        this.easystar.calculate()
    }

    public destruct() {
        this.unsubscribe()
    }

    public findPath([sx, sy]: Position, [ex, ey]: Position) {
        this.loadTilesGrid()

        if (this.isFinding())
            throw new Error(
                '[Pathfinding] findPath is already in use, call cancelPath() first',
            )

        return new Promise<Path>((resolve) => {
            const instanceId = this.easystar.findPath(sx, sy, ex, ey, (path) => {
                this.instanceId = undefined
                path?.shift()
                resolve(path)
            })
            this.instanceId = instanceId
        })
    }

    public cancelPath() {
        if (this.isFinding()) this.easystar.cancelPath(this.instanceId!)
        this.instanceId = undefined
    }

    public isFinding() {
        return this.instanceId !== undefined
    }

    public loadTilesGrid() {
        const tiles = this.game.word.tiles.map((row) =>
            row.map((tile) => (tile.walkable ? 1 : 0)),
        )

        this.easystar.removeAllAdditionalPointCosts()

        this.game.actors.forEach((actor) => {
            const [x, y] = actor.position
            this.easystar.setAdditionalPointCost(x, y, 3)
        })

        this.easystar.setGrid(tiles)
        this.easystar.setAcceptableTiles([1])
        this.easystar.enableDiagonals()
        this.easystar.enableCornerCutting()
    }
}
