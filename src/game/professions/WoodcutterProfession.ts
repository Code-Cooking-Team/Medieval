import { config } from '+config'
import { colorInput } from '+config/lib/definitions'
import { WoodCampActor } from '+game/actors/buildings/woodCamp/WoodCampActor'
import { TreeActor } from '+game/actors/flora/tree/TreeActor'
import { HumanActor } from '+game/actors/units/human/HumanActor'
import { Game } from '+game/Game'
import { ActorType } from '+game/types'
import { isSamePositon, maxValue } from '+helpers'

import { Event, Mesh, MeshStandardMaterial, Object3D, SphereGeometry } from 'three'

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

    constructor(public game: Game, public actor: HumanActor, public camp: WoodCampActor) {
        super(game)
    }

    tick(): void {
        if (this.state === WoodcutterState.Idle) {
            if (Math.random() > 0.3) return
            const tree = this.game.findClosestActorByType(
                ActorType.Tree,
                this.actor.position,
            )
            if (tree) {
                this.state = WoodcutterState.LookingForPathToATree
                this.actor.goTo(tree.position).then((path) => {
                    this.state = path
                        ? WoodcutterState.GoingToATree
                        : WoodcutterState.Idle
                })
            } else if (this.collectedTreeHP > 0) {
                this.state = WoodcutterState.FullINeedCabin
            }
        }

        if (this.state === WoodcutterState.GoingToATree) {
            const actors = this.game.findActorsByPosition(this.actor.position, 1.7)
            const tree = actors.find((actor) => actor.type === ActorType.Tree)
            if (tree) {
                this.actor.cancelPath()
                this.state = WoodcutterState.ChoppingATree
                this.tree = tree as TreeActor
            } else if (!this.actor.path) {
                this.state = WoodcutterState.Idle
            }
        }

        if (this.state === WoodcutterState.ChoppingATree) {
            if (this.tree) {
                const damage = Math.round(
                    config.woodCutter.choppingDamage * Math.random(),
                )
                this.collectedTreeHP += this.tree.hit(damage)

                if (this.collectedTreeHP >= config.woodCutter.capacity) {
                    this.state = WoodcutterState.FullINeedCabin
                }

                if (this.tree.isDead()) {
                    this.tree = undefined
                    this.state = WoodcutterState.Idle
                }
            } else {
                this.state = WoodcutterState.Idle
            }
        }

        if (this.state === WoodcutterState.FullINeedCabin) {
            this.actor.goTo(this.camp.getDeliveryPoint()).then((path) => {
                if (path) {
                    this.state = WoodcutterState.GoingToCabin
                } else {
                    // TODO?
                }
            })
        }

        if (this.state === WoodcutterState.GoingToCabin) {
            if (isSamePositon(this.camp.getDeliveryPoint(), this.actor.position)) {
                this.actor.cancelPath() // Needed?
                this.state = WoodcutterState.GatheringWood
            }
        }

        if (this.state === WoodcutterState.GatheringWood) {
            const value = maxValue(this.collectedTreeHP, config.woodCutter.gatheringSpeed)
            this.collectedTreeHP -= value
            this.camp.collectTree(value)

            if (!this.collectedTreeHP) {
                this.state = WoodcutterState.Idle
            }
        }
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
