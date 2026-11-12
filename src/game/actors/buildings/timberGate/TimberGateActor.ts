import { BuildingActor, type BuildingActorJSON } from '+game/core/BuildingActor'
import { WalkableActor } from '+game/core/WalkableActor'
import { ActorType, type Position } from '+game/types'
import { type Tile, WallTile } from '+game/world/Tile'

import { timberGateBlueprint } from './timberGateBlueprint'

interface TimberGateJSON extends BuildingActorJSON {
    open?: boolean
}

export class TimberGateActor extends BuildingActor {
    public type = ActorType.TimberGate
    public blueprint = timberGateBlueprint
    public open = true

    private get approach(): Position {
        const [x, y] = this.position
        const dx = [0, -1, 0, 1][this.rotation]!
        const dy = [1, 0, -1, 0][this.rotation]!
        return [x + dx, y + dy]
    }

    public setOpen(open: boolean) {
        if (open === this.open) return true

        const { world, actors } = this.game
        const approach = this.approach
        const doorway = [this.position, approach]
        const isDoorway = (x: number, y: number) =>
            doorway.some(([tx, ty]) => tx === x && ty === y)

        if (
            !open &&
            actors.some(
                (actor) =>
                    actor instanceof WalkableActor &&
                    !actor.surface &&
                    !actor.isDead() &&
                    isDoorway(...actor.position),
            )
        )
            return false

        this.open = open
        world.setMultipleTiles((set, get) => {
            const center = get(this.position)
            let threshold: Tile | undefined = center
            while (threshold && threshold.buildingId !== this.id) {
                threshold = threshold.previousTile
            }
            if (threshold) {
                threshold.canWalk = open
                set(this.position, center)
            }

            const front = world.hasTile(approach)
            if (!front) return
            if (!open) {
                const owner = front.buildingId && this.game.getActorById(front.buildingId)
                if (!front.canWalk && !(owner instanceof TimberGateActor)) return
                const blocked = new WallTile(front)
                blocked.buildingId = this.id
                blocked.height = front.height
                blocked.color = front.color
                set(approach, blocked)
            } else {
                let layer: Tile | undefined = front
                let above: Tile | undefined
                while (layer && layer.buildingId !== this.id) {
                    above = layer
                    layer = layer.previousTile
                }
                if (!layer?.previousTile) return
                if (above) above.previousTile = layer.previousTile
                set(approach, above ? front : layer.previousTile)
            }
        })

        if (!open) {
            for (const actor of actors) {
                if (
                    actor instanceof WalkableActor &&
                    actor.path.some(({ x, y, surface }) => !surface && isDoorway(x, y))
                )
                    actor.cancelPath()
            }
        }
        return true
    }

    public override toJSON(): TimberGateJSON {
        return { ...super.toJSON(), open: this.open }
    }

    public override fromJSON(json: TimberGateJSON) {
        super.fromJSON(json)
        this.open = json.open ?? true
    }
}
