import { config } from '+config'
import { Path, Position } from '+game/types'
import { Word } from '+game/Word'

import EasyStar from 'easystarjs'

export class Pathfinding {
    private easyStar = new EasyStar.js()
    private instanceId?: number

    constructor(private word: Word) {
        this.loadTilesGrid()
    }

    public tick() {
        this.easyStar.calculate()
    }

    public update() {
        this.loadTilesGrid()
    }

    public findPath([sx, sy]: Position, [ex, ey]: Position) {
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
        const tiles = this.word.tiles.map((row) =>
            row.map((tile) => (tile.canWalk ? 1 : 0)),
        )

        this.easyStar.removeAllAdditionalPointCosts()

        this.word.tiles.forEach((row, y) =>
            row.forEach((tile, x) => {
                if (!tile.walkCost) return
                this.easyStar.setAdditionalPointCost(x, y, tile.walkCost)
            }),
        )

        this.easyStar.setGrid(tiles)
        this.easyStar.setAcceptableTiles([1])
        if (config.pathfinding.enableDiagonals) this.easyStar.enableDiagonals()
        if (config.pathfinding.enableCornerCutting) this.easyStar.enableCornerCutting()
    }
}
