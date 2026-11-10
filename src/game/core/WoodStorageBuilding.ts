import { type Position } from '+game/types'

import { BuildingActor, type BuildingActorJSON } from './BuildingActor'

export abstract class WoodStorageBuilding extends BuildingActor {
    public readonly woodCapacity = 500
    public woodStock = 0

    public abstract getDeliveryPosition(): Position

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
