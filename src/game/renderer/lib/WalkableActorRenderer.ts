import { config } from '+config'
import { type WalkableActor } from '+game/core/WalkableActor'
import { type ClockInfo, type Position } from '+game/types'

import { Quaternion, Vector3 } from 'three'

import { ActorRenderer } from './ActorRenderer'

export abstract class WalkableActorRenderer<
    TActor extends WalkableActor,
> extends ActorRenderer<TActor> {
    private readonly rotationUp = new Vector3(0, 1, 0)
    private readonly targetHeading = new Quaternion()

    protected updatePosition(clockInfo: ClockInfo) {
        this.updateRotation(clockInfo)
        this.actorGroupMap.forEach((group, actor) => {
            const speed = Math.min(
                clockInfo.deltaTime * config.walkableRenderer.movementSmoothness,
                1,
            )
            const [x, y] = actor.position
            const tile = this.game.world.getTile(actor.position)

            const tileX = x * config.renderer.tileSize
            const tileY = y * config.renderer.tileSize
            const tileHeight = tile.height * config.renderer.tileSize

            group.position.x += (tileX - group.position.x) * speed
            group.position.z += (tileY - group.position.z) * speed
            group.position.y += (tileHeight - group.position.y) * speed
        })
    }

    protected getFacingTarget(_actor: TActor): Position | undefined {
        return undefined
    }

    protected updateRotation({ deltaTime }: ClockInfo) {
        const tileSize = config.renderer.tileSize
        const step = deltaTime * config.walkableRenderer.rotationSmoothness

        for (const [actor, group] of this.actorGroupMap) {
            // A strike faces its target on the ground plane while the mesh settles into place.
            const target = this.getFacingTarget(actor)
            const [x, z] = target
                ? [
                      (target[0] - actor.position[0]) * tileSize,
                      (target[1] - actor.position[1]) * tileSize,
                  ]
                : [
                      actor.position[0] * tileSize - group.position.x,
                      actor.position[1] * tileSize - group.position.z,
                  ]
            if (Math.hypot(x, z) < tileSize * 0.025) continue

            this.targetHeading.setFromAxisAngle(this.rotationUp, Math.atan2(x, z))
            // Face the target before the swing starts, even after a full turn.
            if (target) group.quaternion.copy(this.targetHeading)
            else group.quaternion.rotateTowards(this.targetHeading, step)
        }
    }
}
