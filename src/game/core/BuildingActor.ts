import { buildingTraitFromJSON } from '+game/actors/buildingTraits'
import { BuildingTrait, BuildingTraitJSON } from '+game/actors/buildingTraits/types'
import { ActorBlueprint, Position } from '+game/types'
import { addPosition, rotateGridLength, rotatePositionOnGrind } from '+helpers'

import { Actor, ActorJSON } from './Actor'

export abstract class BuildingActor extends Actor {
    public selectImportance = 1
    public blueprint = {} as ActorBlueprint

    public traits: BuildingTrait[] = []

    public tick(): void {
        super.tick()
        this.traits.forEach((trait) => trait.tick())
    }

    // Watch out for the fact that interaction mesh needs NOT rotated size
    public getSize(withRotation = true): [number, number, number] {
        const grid = this.blueprint.getGrid()
        const height = this.blueprint.height

        if (!grid[0]) throw new Error('[BuildingActor] Grid is empty')

        const [sizeX, sizeY] = rotateGridLength(
            [grid[0].length, grid.length],
            withRotation ? this.rotation : 0,
        )

        // IMPORTANT:
        // The grid is rotated so te 'sizeX' is a grid[0].length, and the 'sizeY' is a grid.length
        return [sizeX, sizeY, height]
    }

    // Left top corner of the building
    public getGlobalPosition() {
        const [sizeX, sizeY] = this.getSize(false)
        const [x, y] = this.position

        const [centerX, centerY] = rotatePositionOnGrind(
            [Math.floor(sizeX / 2), Math.floor(sizeY / 2)],
            [sizeX, sizeY],
            this.rotation,
        )

        return [x - centerX, y - centerY] as Position
    }

    public getGlobalPositionOfLocalPoint(point: Position) {
        const transposedPoint = rotatePositionOnGrind(
            point,
            this.getSize(),
            this.rotation,
        )
        return addPosition(this.getGlobalPosition(), transposedPoint)
    }

    public toJSON(): BuildingActorJSON {
        return {
            ...super.toJSON(),
            traits: this.traits.map((trait) => trait.toJSON()),
        }
    }

    public fromJSON(json: BuildingActorJSON): void {
        super.fromJSON(json)
        this.traits = json.traits.map((trait) => buildingTraitFromJSON(trait, this))
    }
}

interface BuildingActorJSON extends ActorJSON {
    traits: BuildingTraitJSON[]
}
