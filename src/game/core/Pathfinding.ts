import { Game } from '+game/Game'
import { Path, Position } from '+game/types'
import EasyStar from 'easystarjs'

export class Pathfinding {
    private easyStar = new EasyStar.js()
    private instanceId?: number

    private unsubscribe: () => void

    constructor(private game: Game) {
        this.unsubscribe = this.game.word.subscribe(() => {
            this.loadTilesGrid()
        })
        this.loadTilesGrid()
    }

    public tick() {
        this.easyStar.calculate()
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
            const instanceId = this.easyStar.findPath(sx, sy, ex, ey, (path) => {
                this.instanceId = undefined
                path?.shift()
                resolve(path)
            })
            this.instanceId = instanceId
        })
    }

    public cancelPath() {
        if (this.isFinding()) this.easyStar.cancelPath(this.instanceId!)
        this.instanceId = undefined
    }

    public isFinding() {
        return this.instanceId !== undefined
    }

    public loadTilesGrid() {
        const tiles = this.game.word.tiles.map((row) =>
            row.map((tile) => (tile.canWalk ? 1 : 0)),
        )

        this.easyStar.removeAllAdditionalPointCosts()

        this.game.actors.forEach((actor) => {
            const [x, y] = actor.position
            this.easyStar.setAdditionalPointCost(x, y, 3)
        })

        this.game.word.tiles.forEach((row, y) =>
            row.forEach((tile, x) => {
                if (tile.walkCost) return
                this.easyStar.setAdditionalPointCost(x, y, tile.walkCost)
            }),
        )

        this.easyStar.setGrid(tiles)
        this.easyStar.setAcceptableTiles([1])
        this.easyStar.enableDiagonals()
        this.easyStar.enableCornerCutting()
    }
}
