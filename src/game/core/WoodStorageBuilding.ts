import { type Position } from '+game/types'
import { addPosition, rotatePositionOnGrind } from '+helpers/math'

import { BuildingActor, type BuildingActorJSON } from './BuildingActor'

export abstract class WoodStorageBuilding extends BuildingActor {
    public readonly woodCapacity = 500
    public woodStock = 0

    protected abstract readonly deliveryOffsets: readonly Position[]

    public getDeliveryPositions(): Position[] {
        return this.deliveryOffsets.map((offset) =>
            addPosition(
                this.position,
                rotatePositionOnGrind(offset, [0, 0], this.rotation),
            ),
        )
    }

    public getDeliveryPosition(): Position {
        return this.getDeliveryPositions()[0]!
    }

    public getFreeWoodStorage() {
        return this.woodCapacity - this.woodStock
    }

    public collectTree(amount: number): number {
        const accepted = Math.min(amount, this.getFreeWoodStorage())
        if (accepted <= 0) return 0

        this.woodStock += accepted
        this.game.emitter.emit('woodStockChanged', this)
        return accepted
    }

    public withdrawWood(amount: number): number {
        const withdrawn = Math.min(this.woodStock, amount)
        if (withdrawn <= 0) return 0

        this.woodStock -= withdrawn
        this.game.emitter.emit('woodStockChanged', this)
        return withdrawn
    }

    public toJSON(): WoodStorageJSON {
        return { ...super.toJSON(), woodStock: this.woodStock }
    }

    public fromJSON(json: WoodStorageJSON): void {
        super.fromJSON(json)
        this.woodStock = Math.min(json.woodStock ?? this.woodStock, this.woodCapacity)
    }
}

interface WoodStorageJSON extends BuildingActorJSON {
    woodStock?: number
}
