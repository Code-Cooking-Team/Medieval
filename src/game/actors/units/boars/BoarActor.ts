import { config } from '+config/config'
import { isHumanActor } from '+game/actors/helpers'
import { Actor } from '+game/core/Actor'
import { WalkableActor } from '+game/core/WalkableActor'
import { Game } from '+game/Game'
import { ActorType, Position } from '+game/types'
import { addPosition, distanceBetweenPoints, random } from '+helpers'

import { HumanActor } from '../human/HumanActor'

export class BoarActor extends WalkableActor {
    public type = ActorType.Boar
    public maxHp = config.boar.hp
    public hp = this.maxHp
    public target?: Actor

    public tick(): void {
        super.tick()

        const human = this.game.findActorByRange(
            this.position,
            config.boar.lookEnemyDistance,
            (actor) => actor.type === ActorType.Human,
        ) as HumanActor

        if (human) {
            this.setTarget(human)
        }

        if (this.target) {
            this.fight()
        } else {
            this.walkAround()
        }
    }

    public hitBy(actor?: Actor): void {
        if (actor && !this.target) {
            this.setTarget(actor)
        }
    }

    public setTarget(target: Actor) {
        this.target = target
    }

    private walkAround() {
        this.move()
        if (this.hasPath()) return
        if (Math.random() > 0.1) return

        const dis = 5
        const vector = [random(dis, -dis, true), random(dis, -dis, true)] as Position
        const position = addPosition(this.position, vector)

        if (this.game.world.hasTile(position)) {
            this.setPathTo(position)
        }
    }

    private fight() {
        if (!this.target) return
        this.move()

        const distance = distanceBetweenPoints(this.position, this.target.position)
        if (distance < config.boar.attackDistance) {
            this.cancelPath()
            this.target.hit(config.boar.attackDamage, this)
            if (this.target.isDead()) {
                this.target = undefined
            }
        } else {
            this.setPathTo(this.target.position, true)
        }
    }

    public interact(actors: Actor[]): boolean {
        const humans = actors.filter(isHumanActor)
        for (const human of humans) {
            human.setTarget(this)
        }
        return false
    }
}
