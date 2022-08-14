import { config } from '+config'
import { WalkableActor } from '+game/core/WalkableActor'
import { ClockInfo } from '+game/types'

import { Quaternion, Vector3 } from 'three'

import { ActorRenderer } from './ActorRenderer'

export abstract class WalkableActorRenderer<
    TActor extends WalkableActor,
> extends ActorRenderer<TActor> {
    public render(clockInfo: ClockInfo) {
        super.render(clockInfo)
        this.updateRotation(clockInfo)
    }

    protected updatePosition(clockInfo: ClockInfo) {
        this.actorGroupMap.forEach((group, actor) => {
            const speed = clockInfo.deltaTime * config.walkableRenderer.movementSmoothness
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

    protected updateRotation(clockInfo: ClockInfo) {
        this.actorGroupMap.forEach((group, actor) => {
            const [x, y] = actor.position

            const tile = this.game.world.getTile(actor.position)
            const tileX = x * config.renderer.tileSize
            const tileY = y * config.renderer.tileSize
            const actorPosition = group.position
            const targetPosition = new Vector3(tileX, tile.height, tileY)

            const distance = targetPosition.distanceTo(actorPosition)

            if (distance > 0.1) {
                const direction = targetPosition.clone().sub(actorPosition)
                const rotation = direction.angleTo(new Vector3(0, 0, 1))
                let newRotation = direction.x > 0 ? rotation : rotation * -1

                const targetQuaternion = new Quaternion().setFromAxisAngle(
                    new Vector3(0, 1, 0),
                    newRotation,
                )
                if (!group.quaternion.equals(targetQuaternion)) {
                    const step =
                        clockInfo.deltaTime * config.walkableRenderer.rotationSmoothness
                    group.quaternion.rotateTowards(targetQuaternion, step)
                }
            }
        })
    }
}
