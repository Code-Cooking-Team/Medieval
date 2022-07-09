import { config } from '+config'
import { WoodCampActor } from '+game/actors/buildings/woodCamp/WoodCampActor'
import { TreeActor } from '+game/actors/flora/tree/TreeActor'
import { HumanActor } from '+game/actors/units/human/HumanActor'
import { Game } from '+game/Game'
import { ActorType } from '+game/types'
import { maxValue } from '+helpers'

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
    public state = WoodcutterState.Idle
    public selectImportance = 4
    private tree?: TreeActor
    private collectedTreeHP = 0

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
                    config.lumberjack.choppingDamage * Math.random(),
                )
                this.collectedTreeHP += this.tree.hit(damage)

                if (this.collectedTreeHP >= config.lumberjack.capacity) {
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
            this.actor.goTo(this.camp.position).then((path) => {
                if (path) {
                    this.state = WoodcutterState.GoingToCabin
                } else {
                    // TODO?
                }
            })
        }

        if (this.state === WoodcutterState.GoingToCabin) {
            const cabin = this.game.findActorByRange(
                this.actor.position,
                0,
                (actor) => actor === this.camp,
            )
            if (cabin) {
                this.actor.cancelPath() // Needed?
                this.state = WoodcutterState.GatheringWood
            }
        }

        if (this.state === WoodcutterState.GatheringWood) {
            const value = maxValue(this.collectedTreeHP, config.lumberjack.gatheringSpeed)
            this.collectedTreeHP -= value
            this.camp.collectTree(value)

            if (!this.collectedTreeHP) {
                this.state = WoodcutterState.Idle
            }
        }
    }
}
