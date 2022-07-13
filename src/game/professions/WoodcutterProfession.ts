import { config } from '+config'
import { colorInput } from '+config/lib/definitions'
import { WoodCampActor } from '+game/actors/buildings/woodCamp/WoodCampActor'
import { TreeActor } from '+game/actors/flora/tree/TreeActor'
import { HumanActor } from '+game/actors/units/human/HumanActor'
import { Game } from '+game/Game'
import { ActorType } from '+game/types'
import { isSamePositon, maxValue } from '+helpers'

import { Event, Mesh, MeshStandardMaterial, Object3D, SphereGeometry } from 'three'
import { interpret, Interpreter } from 'xstate'

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

    private machineService: Interpreter<any, any, any, any, any>

    constructor(public game: Game, public actor: HumanActor, public camp: WoodCampActor) {
        super(game)

        this.machineService = interpret(
            woodcutterMachine.withConfig({
                actions: {
                    move: () => {
                        console.log('Sction: move')
                        this.actor.move()
                    },
                },
                services: {
                    findTree: () => {
                        console.log('Service: findTree')
                        return new Promise<void>((resolve, reject) => {
                            const tree = this.game.findClosestActorByType(
                                ActorType.Tree,
                                this.actor.position,
                            )

                            if (!tree) return reject()

                            this.actor.cancelPath()
                            this.tree = tree as TreeActor

                            return this.actor
                                .goTo(tree.position)
                                .then((path) => {
                                    resolve()
                                })
                                .catch(() => {
                                    reject()
                                })
                        })
                    },
                    chopTree: () => {
                        return new Promise<void>((resolve, reject) => {
                            if (!this.tree) return reject()

                            const damage = Math.round(
                                config.woodCutter.choppingDamage * Math.random(),
                            )
                            this.collectedTreeHP += this.tree.hit(damage)

                            resolve()
                        })
                    },
                    goToCamp: () => {
                        return new Promise<void>((resolve, reject) => {
                            this.actor.cancelPath()
                            this.actor
                                .goTo(this.camp.getDeliveryPoint())
                                .then((path) => {
                                    resolve()
                                })
                                .catch(() => {
                                    reject()
                                })
                        })
                    },
                    putWood: () => {
                        return new Promise<void>((resolve, reject) => {
                            const value = maxValue(
                                this.collectedTreeHP,
                                config.woodCutter.gatheringSpeed,
                            )
                            this.collectedTreeHP -= value
                            this.camp.collectTree(value)
                            resolve()
                        })
                    },
                },
                guards: {
                    reachedTree: () => {
                        console.log('Guard: reachedTree')
                        const actors = this.game.findActorsByPosition(
                            this.actor.position,
                            1.7,
                        )
                        return actors.some((actor) => actor.type === ActorType.Tree)
                    },

                    reachedCamp: () => {
                        console.log('Guard: reachedCamp')
                        return isSamePositon(
                            this.camp.getDeliveryPoint(),
                            this.actor.position,
                        )
                    },
                    hasPath: () => {
                        console.log('Guard: hasPath')
                        return !!this.actor.path
                    },
                    hasSpace: () => {
                        console.log('Guard: hasSpace')
                        return this.collectedTreeHP < config.woodCutter.capacity
                    },
                    hasWood: () => {
                        console.log('Guard: hasWood')
                        return this.collectedTreeHP > 0
                    },
                },
            }),
        )
            .onTransition((state) => {
                console.log(state.value)
            })
            .start()
    }

    public getAttackDamage(): number {
        return config.woodCutter.attackDamage
    }

    public tick(): void {
        this.machineService.send('TICK')
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
