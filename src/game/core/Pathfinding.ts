import { Path, Position } from '+game/types'
import { World } from '+game/world/World'

import EasyStar from 'easystarjs'

type FindPathResult =
    | {
          x: number
          y: number
      }[]
    | null

export class Pathfinding {
    private easyStar = new EasyStar.js()
    private instanceId?: number

    constructor(private word: World) {
        this.loadTilesGrid()
    }

    public tick() {
        this.easyStar.calculate()
    }

    public update() {
        this.loadTilesGrid()
    }

    public findPath([sx, sy]: Position, [ex, ey]: Position) {
        return new Promise<Path | undefined>((resolve, reject) => {
            try {
                const instanceId = this.easyStar.findPath(
                    sx,
                    sy,
                    ex,
                    ey,
                    (path: FindPathResult) => {
                        this.instanceId = undefined

                        if (!path) {
                            return resolve(undefined)
                        }

                        path.shift() // remove start position
                        resolve(path)
                    },
                )
                this.instanceId = instanceId
            } catch (error) {
                reject(error)
            }
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
        const tiles = this.word.tiles.map((row) =>
            row.map((tile) => (tile.canWalk ? 1 : 0)),
        )

        this.easyStar.removeAllAdditionalPointCosts()

        this.word.forEachTile((tile, [x, y]) => {
            if (!tile.walkCost) return
            this.easyStar.setAdditionalPointCost(x, y, tile.walkCost)
        })

        this.easyStar.setGrid(tiles)
        this.easyStar.setAcceptableTiles([1])
        this.easyStar.enableDiagonals()
        // A diagonal line of wall tiles must block movement between its segments.
        this.easyStar.disableCornerCutting()
        this.easyStar.setIterationsPerCalculation(1000)
    }
}
