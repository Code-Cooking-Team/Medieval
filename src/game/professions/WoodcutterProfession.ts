import { config } from '+config'
import { colorInput } from '+config/lib/definitions'
import { WoodCampActor } from '+game/actors/buildings/woodCamp/WoodCampActor'
import { TreeActor } from '+game/actors/flora/tree/TreeActor'
import { HumanActor } from '+game/actors/units/human/HumanActor'
import { MachineInterpreter } from '+game/core/Machine'
import { Game } from '+game/Game'
import { ActorType } from '+game/types'
import { isSamePosition, maxValue } from '+helpers'

import { interpret, StateMachine } from '@xstate/fsm'
import { Event, Mesh, MeshStandardMaterial, Object3D, SphereGeometry } from 'three'

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

    protected material = new MeshStandardMaterial({ color: 0x00ff00 })
    protected geometry = new SphereGeometry(0.5, 5, 5)

    private machine = new MachineInterpreter(
        woodcutterMachine,
        {
            move: () => {
                console.log('Action: move')
                this.actor.move()
            },
            findTree: () => {
                console.log('Action: findTree')
                const tree = this.game.findClosestActorByType(
                    ActorType.Tree,
                    this.actor.position,
                )

                if (!tree) return
                this.actor.cancelPath()
                this.tree = tree as TreeActor

                this.actor.goTo(tree.position)
            },
            chopTree: () => {
                console.log('Action: chopTree')
                if (!this.tree) return

                const damage = Math.round(
                    config.woodCutter.choppingDamage * Math.random(),
                )
                this.collectedTreeHP += this.tree.hit(damage)
            },
            putWood: () => {
                console.log('Action: putWood')
                const value = maxValue(
                    this.collectedTreeHP,
                    config.woodCutter.gatheringSpeed,
                )
                this.collectedTreeHP -= value
                this.camp.collectTree(value)
            },
        },
        {
            hasPath: () => {
                console.log('Guard: hasPath')
                return !!this.actor.path
            },
            isFull: () => {
                console.log('Guard: isFull')
                return this.collectedTreeHP >= config.woodCutter.capacity
            },
            nearTree: () => {
                console.log('Guard: nearTree')
                const actors = this.game.findActorsByPosition(this.actor.position, 1.7)
                return actors.some((actor) => actor.type === ActorType.Tree)
            },

            reachedCamp: () => {
                console.log('Guard: reachedCamp')
                return isSamePosition(this.camp.getDeliveryPoint(), this.actor.position)
            },
        },
    )

    constructor(public game: Game, public actor: HumanActor, public camp: WoodCampActor) {
        super(game)
    }

    public getAttackDamage(): number {
        return config.woodCutter.attackDamage
    }

    public tick(): void {
        this.machine.send('TICK')
        console.log(this.machine.currentState)
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
