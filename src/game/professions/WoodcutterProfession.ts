import { config } from '+config'
import { WoodCampActor } from '+game/actors/buildings/woodCamp/WoodCampActor'
import { TreeActor } from '+game/actors/flora/tree/TreeActor'
import { HumanActor } from '+game/actors/units/human/HumanActor'
import { MachineInterpreter } from '+game/core/machine/Machine'
import { Game } from '+game/Game'
import { ActorType } from '+game/types'
import { isSamePosition, maxValue } from '+helpers'

import { Mesh, MeshStandardMaterial, Object3D, SphereGeometry } from 'three'

import { woodcutterMachine } from './machines/woodcutterMachine'
import { Profession } from './Profession'

enum WoodcutterState {
    Idle = 'Idle',
    LookingForPathToATree = 'LookingForPathToATree',
    GoingToATree = 'GoingToATree',
    ChoppingATree = 'ChoppingATree',
    FullINeedCabin = 'FullINeedCabin',
    GoingToCabin = 'GoingToCabin',

    GatheringWood = 'GatheringWood',
}

export class WoodcutterProfession extends Profession {
    public name = 'Guardian'
    public state = WoodcutterState.Idle
    public selectImportance = 4
    private tree?: TreeActor
    private collectedTreeHP = 0

    protected material = new MeshStandardMaterial({ color: config.woodcutter.color })
    protected geometry = new SphereGeometry(0.5, 5, 5)

    private machine = new MachineInterpreter(
        woodcutterMachine,
        {
            move: () => {
                this.actor.move()
            },
            findTree: () => {
                const tree = this.game.findClosestActorByType(
                    ActorType.Tree,
                    this.actor.position,
                )

                if (!tree) return
                this.actor.cancelPath()
                this.tree = tree as TreeActor

                return this.actor
                    .setPathTo(tree.position)
                    .then(() => {})
                    .catch(() => {})
            },
            chopTree: () => {
                if (!this.tree) return

                const damage = Math.round(
                    config.woodcutter.choppingDamage * Math.random(),
                )
                this.collectedTreeHP += this.tree.hit(damage)
            },
            putWood: () => {
                const value = maxValue(
                    this.collectedTreeHP,
                    config.woodcutter.gatheringSpeed,
                )
                this.collectedTreeHP -= value
                this.camp.collectTree(value)
            },
            findCamp: () => {
                this.actor.setPathTo(this.camp.getDeliveryPoint())
            },
            gatherWood: () => {
                const amount = this.gatherWood()
                this.camp.collectTree(amount)
            },
        },
        {
            hasPath: () => {
                return this.actor.hasPath()
            },
            isEmpty: () => {
                return this.collectedTreeHP === 0
            },

            isFull: () => {
                return this.collectedTreeHP >= config.woodcutter.capacity
            },
            nearTree: () => {
                const actors = this.game.findActorsByPosition(this.actor.position, 1.7)
                return actors.some((actor) => actor.type === ActorType.Tree)
            },
            nearCamp: () => {
                return isSamePosition(this.actor.position, this.camp.getDeliveryPoint())
            },

            reachedCamp: () => {
                return isSamePosition(this.camp.getDeliveryPoint(), this.actor.position)
            },
        },
    )

    constructor(public game: Game, public actor: HumanActor, public camp: WoodCampActor) {
        super(game)
    }

    public getAttackDamage(): number {
        return config.woodcutter.attackDamage
    }

    private gatherWood(): number {
        const speed = config.woodcutter.gatheringSpeed
        const amount = this.collectedTreeHP < speed ? this.collectedTreeHP : speed
        this.collectedTreeHP -= amount
        return amount
    }

    public async tick() {
        await this.machine.send('TICK')
    }

    public getModel(): Object3D {
        const group = super.getModel()
        const actorModel = new Mesh(this.geometry, this.material)

        actorModel.castShadow = true
        actorModel.receiveShadow = true
        actorModel.scale.y = 2
        actorModel.scale.z = 0.5
        actorModel.position.y = 0.5

        group.add(actorModel)
        return group
    }
}
