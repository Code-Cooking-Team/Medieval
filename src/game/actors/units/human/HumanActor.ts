import { config } from '+config/config'
import { Actor } from '+game/core/Actor'
import { WalkableActor, WalkableActorJSON } from '+game/core/WalkableActor'
import { professionByType } from '+game/professions'
import { Profession, ProfessionJSON } from '+game/professions/Profession'
import { ProfessionType } from '+game/professions/types'
import { ActorType, Position } from '+game/types'
import { addPosition, distanceBetweenPoints, random } from '+helpers'

import { AnimationMixer } from 'three'

import { HouseActor } from '../../buildings/house/HouseActor'

export class HumanActor extends WalkableActor {
    public type = ActorType.Human
    public maxHp = config.human.hp
    public profession?: Profession
    public target?: Actor
    public home?: HouseActor
    public animationMixer?: AnimationMixer
    public actorState: 'idle' | 'walking' = 'idle'

    public tick(): void {
        super.tick()

        if (this.target) {
            this.cancelProfession()
            this.fight()
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

    public setPathTo(position: Position, cancelTarget = true, clip = false) {
        if (cancelTarget) {
            this.target = undefined
        }
        return super.setPathTo(position, clip)
    }

    public getSelectedImportance(): number {
        if (this.profession) {
            return this.profession.selectImportance
        }
        return super.getSelectedImportance()
    }

    public toJSON(): HumanActorJSON {
        const json = super.toJSON()

        return {
            ...json,
            profession: this.profession?.toJSON(),
        }
    }

    public fromJSON(json: HumanActorJSON) {
        super.fromJSON(json)

        if (json.profession) {
            const Profession = professionByType[json.profession.type]

            const instance = new Profession(this.game, this)
            instance.fromJSON(json.profession)

            this.setProfession(instance)
        }
    }

    private cancelProfession() {
        if (!this.profession || this.profession.isPristine) return
        this.profession.reset()
    }

    private walkAround() {
        this.move()
        if (this.hasPath()) return
        if (Math.random() > config.human.randomWalkChance) return
        if (!this.home) return

        const dis = config.human.walkAroundHomeDistance
        const vector = [random(dis, -dis, true), random(dis, -dis, true)] as Position
        const position = addPosition(this.home.position, vector)

        if (this.game.world.hasTile(position)) {
            this.setPathTo(position)
        }
    }

    private fight() {
        if (!this.target) return

        this.move()

        const distance = distanceBetweenPoints(this.position, this.target.position)
        if (distance < config.human.attackDistance) {
            this.cancelPath()
            const damage = this.getAttackDamage()
            this.target.hit(damage, this)
            if (this.target.isDead()) {
                this.target = undefined
            }
        } else {
            if (this.hasPath()) return
            this.setPathTo(this.target.position, false, true)
        }
    }
}

export interface HumanActorJSON extends WalkableActorJSON {
    profession?: ProfessionJSON
}
