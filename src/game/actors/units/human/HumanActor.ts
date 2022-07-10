import { config } from '+config/config'
import { Actor } from '+game/core/Actor'
import { WalkableActor } from '+game/core/WalkableActor'
import { Game } from '+game/Game'
import { Profession } from '+game/professions/Profession'
import { ActorType, Path, Position } from '+game/types'
import { addPosition, distanceBetweenPoints, random } from '+helpers'

import { HouseActor } from '../../buildings/house/HouseActor'

export class HumanActor extends WalkableActor {
    public type = ActorType.Human
    public maxHp = config.human.hp
    public profession?: Profession
    public target?: Actor
    public home?: HouseActor

    constructor(public game: Game, public position: Position) {
        super(game, position)
    }

    public tick(): void {
        super.tick()

        if (this.target) {
            const distance = distanceBetweenPoints(this.position, this.target.position)
            if (distance < config.human.attackDistance) {
                this.cancelPath()
                const damage = this.getAttackDamage()
                this.target.hit(damage, this)
                if (this.target.isDead()) {
                    this.target = undefined
                }
            } else {
                this.goTo(this.target.position)
            }
        } else if (this.profession) {
            this.profession.tick()
        } else {
            this.walkAround()
        }
    }

    public setHome(home: HouseActor) {
        this.home = home
    }

    public setProfession(profession: Profession) {
        this.profession = profession
        this.selectImportance = profession.selectImportance
    }

    public setTarget(target: Actor) {
        this.target = target
    }

    public hitBy(actor?: Actor) {
        super.hitBy(actor)
        if (actor && !this.target) {
            this.setTarget(actor)
        }
    }

    public getAttackDamage(): number {
        let damage = config.human.attackDamage
        if (this.profession) {
            const professionDamage = this.profession.getAttackDamage()
            damage += professionDamage
        }
        return damage
    }

    public goTo(position: Position, cancelTarget = true) {
        if (cancelTarget) {
            this.target = undefined
        }
        return super.goTo(position)
    }

    public getSelectedImportance(): number {
        if (this.profession) {
            return this.profession.selectImportance
        }
        return super.getSelectedImportance()
    }

    private walkAround() {
        if (this.path) return
        if (Math.random() > config.human.randomWalkChance) return
        if (!this.home) return

        const dis = config.human.walkAroundHomeDistance
        const vector = [random(dis, -dis, true), random(dis, -dis, true)] as Position
        const position = addPosition(this.home.position, vector)

        if (this.game.word.hasTile(position)) {
            this.goTo(position)
        }
    }
}
