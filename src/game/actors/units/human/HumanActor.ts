import { config } from '+config/config'
import { Actor } from '+game/core/Actor'
import { BuildingActor } from '+game/core/BuildingActor'
import { WalkableActor, WalkableActorJSON } from '+game/core/WalkableActor'
import { professionByType } from '+game/professions'
import { Profession, ProfessionJSON } from '+game/professions/Profession'
import { ProfessionType } from '+game/professions/types'
import { ActorType, Position } from '+game/types'
import { addPosition, distanceBetweenPoints, random } from '+helpers'

import { Equipment, EquipmentSlot, ItemId, items } from './equipment'

type HumanAction = 'attack' | 'chop' | 'build'

export class HumanActor extends WalkableActor {
    public type = ActorType.Human
    public maxHp = config.human.hp
    private equipment: Equipment = { Hands: null, Armor: null }
    public lastAction?: { kind: HumanAction; origin: Position; target: Position }
    public profession?: Profession
    public target?: Actor
    public home?: BuildingActor

    public tick(): void {
        super.tick()

        if (this.profession?.controlsCombat) {
            void this.profession.tick()
        } else if (this.target) {
            this.cancelProfession()
            this.fight()
        } else if (this.profession) {
            this.profession.tick()
        } else {
            this.walkAround()
        }
    }

    public recordAction(kind: HumanAction, target: Actor) {
        // Keep the strike direction available even if the hit removes the target.
        this.lastAction = {
            kind,
            origin: [...this.position],
            target: [...target.position],
        }
    }

    public setHome(home: BuildingActor) {
        this.home = home
    }

    public setProfession(profession: Profession) {
        if (
            this.profession &&
            (this.profession.type === ProfessionType.Builder ||
                profession.type === ProfessionType.Builder)
        ) {
            this.cancelPath()
        }
        this.profession = profession
        this.selectImportance = profession.selectImportance
        this.equip('Hands', profession.defaultHeldItem)
        this.game.emitter.emit('professionChanged', this)
    }

    public getEquippedItem(slot: EquipmentSlot) {
        return this.equipment[slot]
    }

    public equip(slot: EquipmentSlot, id: ItemId | null) {
        if (id !== null && items[id]?.slot !== slot) return

        const previous = this.equipment[slot]
        this.equipment[slot] = id

        if (slot === 'Armor') {
            this.maxHp +=
                (id ? items[id].healthBonus : 0) -
                (previous ? items[previous].healthBonus : 0)
            this.hp = Math.min(this.hp, this.maxHp)
        }
        if (previous !== id) this.game.emitter.emit('equipmentChanged', this)
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
        const heldItem = this.equipment.Hands
        return damage + (heldItem ? items[heldItem].damageBonus : 0)
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
            equipment: { ...this.equipment },
            profession: this.profession?.toJSON(),
        }
    }

    public fromJSON({ profession, equipment, ...json }: HumanActorJSON) {
        super.fromJSON(json)
        this.equipment = { Hands: null, Armor: null }

        if (profession) {
            const Profession = professionByType[profession.type]

            const instance = new Profession(this.game, this)
            instance.fromJSON(profession)

            this.setProfession(instance)
        }

        if (equipment) {
            this.equip('Hands', equipment.Hands)
            const armor = equipment.Armor
            // Actor snapshots store the effective maximum, including armor.
            if (armor && items[armor]?.slot === 'Armor') {
                this.maxHp -= items[armor].healthBonus
                this.equip('Armor', armor)
            }
        }
    }

    private cancelProfession() {
        if (!this.profession || this.profession.isPristine) return
        this.profession.reset()
    }

    private walkAround() {
        this.move()
        if (this.hasPath() || this.isFindingPath) return
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
            this.recordAction('attack', this.target)
            this.target.hit(damage, this)
            if (this.target.isDead()) {
                this.target = undefined
            }
        } else {
            if (this.hasPath() || this.isFindingPath) return
            this.setPathTo(this.target.position, false, true)
        }
    }
}

export interface HumanActorJSON extends WalkableActorJSON {
    equipment?: Equipment
    profession?: ProfessionJSON
}
