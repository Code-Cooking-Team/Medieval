import { ActorBlueprint, Position } from '+game/types'

import { Actor } from './Actor'

export abstract class BuildingActor extends Actor {
    public selectImportance = 1
    public blueprint = {} as ActorBlueprint

    // TODO Take into account ROTATION
    // Watch out for the fact that interaction mesh needs NOT rotated size
    public getSize() {
        const grid = this.blueprint.getGrid()
        const height = this.blueprint.height

        if (!grid[0]) throw new Error('[BuildingActor] Grid is empty')
        return [grid[0].length, grid.length, height] as [number, number, number]
    }

    public getGlobalPosition() {
        const [sizeX, sizeY] = this.getSize()
        const [x, y] = this.position

        return [x - Math.floor(sizeX / 2), y - Math.floor(sizeY / 2)] as Position
    }
}
