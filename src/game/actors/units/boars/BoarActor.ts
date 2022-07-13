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
    public target?: Actor

    constructor(public game: Game, public position: Position) {
        super(game, position)
    }

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
            const distance = distanceBetweenPoints(this.position, this.target.position)
            if (distance < config.human.attackDistance) {
                this.cancelPath()
                this.target.hit(config.human.attackDamage, this)
                if (this.target.isDead()) {
                    this.target = undefined
                }
            } else {
                this.goTo(this.target.position)
            }
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
        if (this.path) return
        if (Math.random() > 0.1) return

        const dis = 5
        const vector = [random(dis, -dis, true), random(dis, -dis, true)] as Position
        const position = addPosition(this.position, vector)

        if (this.game.world.hasTile(position)) {
            this.goTo(position)
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
