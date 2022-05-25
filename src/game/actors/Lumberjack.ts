import { Game } from '+game/Game'
import { ActorType, Position } from '+game/types'
import { maxValue } from '+helpers/math'
import { assert } from '+helpers/quality'
import { Actor } from '../core/Actor'
import { LumberjackCabin } from './LumberjackCabin'
import { Tree } from './Tree'

enum LumberjackState {
    Idle = 'Idle',
    LookingForPathToATree = 'LookingForPathToATree',
    GoingToATree = 'GoingToATree',
    ChoppingATree = 'ChoppingATree',
    FullINeedCabin = 'FullINeedCabin',
    GoingToCabin = 'GoingToCabin',
    GatheringWood = 'GatheringWood',
}

const choppingSpeed = 20
const gatheringSpeed = 5
const capacity = 50

export class Lumberjack extends Actor {
    public type = ActorType.Lumberjack
    public state = LumberjackState.Idle

    private tree?: Tree
    private collectedTreeHP = 0

    constructor(
        public game: Game,
        public position: Position,
        public cabin: LumberjackCabin,
    ) {
        super(game, position)
    }

    tick(): void {
        console.log(this.state, this.collectedTreeHP)

        if (this.state === LumberjackState.Idle) {
            if (Math.random() > 0.1) return
            const tree = this.game.findClosestActorByType(ActorType.Tree, this.position)
            if (tree) {
                this.state = LumberjackState.LookingForPathToATree
                this.goTo(tree.position).then((path) => {
                    this.state = path
                        ? LumberjackState.GoingToATree
                        : LumberjackState.Idle
                })
            } else if (this.collectedTreeHP > 0) {
                this.state = LumberjackState.FullINeedCabin
            }
        }

        if (this.state === LumberjackState.GoingToATree) {
            const actors = this.game.findActorsByPosition(this.position, 1.7)
            const tree = actors.find((actor) => actor.type === ActorType.Tree)
            if (tree) {
                this.cancelPath()
                this.state = LumberjackState.ChoppingATree
                this.tree = tree as Tree
            } else if (!this.path) {
                this.state = LumberjackState.Idle
            }
        }

        if (this.state === LumberjackState.ChoppingATree) {
            if (this.tree) {
                this.collectedTreeHP += this.tree.hit(choppingSpeed * Math.random())

                if (this.collectedTreeHP >= capacity) {
                    this.state = LumberjackState.FullINeedCabin
                }

                if (this.tree.isDead()) {
                    this.tree = undefined
                    this.state = LumberjackState.Idle
                }
            } else {
                this.state = LumberjackState.Idle
            }
        }

        if (this.state === LumberjackState.FullINeedCabin) {
            this.goTo(this.cabin.position).then((path) => {
                if (path) {
                    this.state = LumberjackState.GoingToCabin
                } else {
                    // TODO?
                }
            })
        }

        if (this.state === LumberjackState.GoingToCabin) {
            const cabin = this.game.findActorByRange(
                this.position,
                0,
                (actor) => actor.type === ActorType.LumberjackCabin,
            )
            if (cabin) {
                this.cancelPath() // Needed?
                this.state = LumberjackState.GatheringWood
            }
        }

        if (this.state === LumberjackState.GatheringWood) {
            const value = maxValue(this.collectedTreeHP, gatheringSpeed)
            this.collectedTreeHP -= value
            this.cabin.collectRawTree(value)

            assert(
                this.collectedTreeHP >= 0,
                '[Lumberjack] collectedTreeHP should be >= 0',
            )

            if (!this.collectedTreeHP) {
                this.state = LumberjackState.Idle
            }
        }

        super.tick()
    }
}
