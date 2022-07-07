import { config } from '+config'
import { StaticActor } from '+game/core/StaticActor'
import { WalkableActor } from '+game/core/WalkableActor'
import { Game } from '+game/Game'
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

    protected updatePosition() {
        this.actorGroupMap.forEach((group, actor) => {
            const [x, y] = actor.position
            const tile = this.game.word.getTile(actor.position)
            const tileX = x * config.renderer.tileSize
            const tileY = y * config.renderer.tileSize
            group.position.x += (tileX - group.position.x) * this.moveSpeed
            group.position.z += (tileY - group.position.z) * this.moveSpeed
            group.position.y += (tile.height - group.position.y) * this.moveSpeed
        })
    }

    protected updateRotation(clockInfo: ClockInfo) {
        this.actorGroupMap.forEach((group, actor) => {
            const [x, y] = actor.position

            const tile = this.game.word.getTile(actor.position)
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
                    var step = clockInfo.deltaTime * 3
                    group.quaternion.rotateTowards(targetQuaternion, step)
                }
            }
        })
    }
}
