import { BuildingModel } from '+game/renderer/lib/BuildingModel'
import { ActorBlueprint } from '+game/types'
import { TileCodeGrid } from '+game/world/tileCodes'

import { createHunterHutModel } from './createHunterHutModel'

export class HunterHutBlueprint implements ActorBlueprint {
    public readonly height = 3.4
    public readonly grid: TileCodeGrid = [
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', '=', '=', '=', '=', '=', ' ', ' '],
        [' ', ' ', '=', '!', '!', '!', '=', ' ', ' '],
        [' ', ' ', '=', '!', '!', '!', '=', ' ', ' '],
        [' ', ' ', '=', '!', '!', '!', '=', ' ', ' '],
        [' ', ' ', '=', '=', ',', '=', '=', '=', '='],
        [' ', ' ', '=', ',', ',', ',', '=', '=', '='],
        [' ', ' ', ' ', ',', ',', ',', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    ]
    public readonly buildingModel = new BuildingModel(
        Promise.resolve(createHunterHutModel()),
    )

    public getPlaceholder(seed?: number) {
        return this.buildingModel.createModel(seed)
    }

    public getGrid() {
        return this.grid
    }
}
