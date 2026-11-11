import { config } from '+config/config'
import { isHumanActor } from '+game/actors/helpers'
import { Actor } from '+game/core/Actor'
import { WalkableActor } from '+game/core/WalkableActor'
import { ActorType } from '+game/types'
import { distanceBetweenPoints, random } from '+helpers'

import { HumanActor } from '../human/HumanActor'

export class BoarActor extends WalkableActor {
    public type = ActorType.Boar
    public maxHp = config.boar.hp
    public hp = this.maxHp
    public target?: Actor
    private retryTicks = 0

    public tick(): void {
        super.tick()

        const human = this.game.findActorByRange(
            this.position,
            config.boar.lookEnemyDistance,
            (actor) => actor.type === ActorType.Human,
        ) as HumanActor

        if (human) this.setTarget(human)
        const pursuitRadius = Math.ceil(config.boar.lookEnemyDistance) + 4
        if (
            this.target &&
            (this.target.isDead() ||
                distanceBetweenPoints(this.position, this.target.position) >
                    pursuitRadius)
        ) {
            this.target = undefined
            this.cancelPath()
        }

        if (this.target) {
            this.fight(pursuitRadius)
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
        if (target === this.target) return
        this.cancelPath()
        this.target = target
        this.retryTicks = 0
    }

    private walkAround() {
        this.move()
        if (this.hasPath() || this.isFindingPath) return
        if (Math.random() > 0.1) return

        this.path = this.game.pf.findIdleStep(this.position)
    }

    private fight(pursuitRadius: number) {
        if (!this.target) return
        this.move()

        const distance = distanceBetweenPoints(this.position, this.target.position)
        if (distance < config.boar.attackDistance) {
            this.cancelPath()
            this.target.hit(config.boar.attackDamage, this)
            if (this.target.isDead()) {
                this.target = undefined
            }
        } else if (!this.hasPath() && !this.isFindingPath && --this.retryTicks <= 0) {
            const route = this.game.pf.findRoute(
                this.position,
                [{ target: this.target, positions: [this.target.position] }],
                true,
                pursuitRadius,
            )
            if (route) {
                this.path = route.path
                this.clipPath()
                if (this.hasPath()) return
            }
            this.path = this.game.pf.findIdleStep(this.position)
            this.retryTicks = random(4, 8, true)
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
