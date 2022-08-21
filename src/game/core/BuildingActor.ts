import { buildingTraitFromJSON } from '+game/actors/buildingTraits'
import { BuildingTrait, BuildingTraitJSON } from '+game/actors/buildingTraits/types'
import { ActorBlueprint, Position } from '+game/types'
import { addPosition, rotatePositionOnGrind } from '+helpers'

import { Actor, ActorJSON } from './Actor'

export abstract class BuildingActor extends Actor {
    public selectImportance = 1
    public blueprint = {} as ActorBlueprint

    public traits: BuildingTrait[] = []

    public tick(): void {
        super.tick()
        this.traits.forEach((trait) => trait.tick())
    }

    // TODO Take into account ROTATION
    // Watch out for the fact that interaction mesh needs NOT rotated size
    public getSize() {
        const grid = this.blueprint.getGrid()
        const height = this.blueprint.height

        if (!grid[0]) throw new Error('[BuildingActor] Grid is empty')

        // IMPORTANT:
        // The grid is rotated so te X length is a grid[0].length, and the Y length is a grid.length
        return [grid[0].length, grid.length, height] as [number, number, number]
    }

    public getGlobalPosition() {
        const [sizeX, sizeY] = this.getSize()
        const [x, y] = this.position

        return [x - Math.floor(sizeX / 2), y - Math.floor(sizeY / 2)] as Position
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
