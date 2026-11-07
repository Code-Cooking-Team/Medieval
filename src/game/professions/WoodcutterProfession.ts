import { config } from '+config'
import { WoodCampActor } from '+game/actors/buildings/woodCamp/WoodCampActor'
import { TreeActor } from '+game/actors/flora/tree/TreeActor'
import { HumanActor } from '+game/actors/units/human/HumanActor'
import { MachineInterpreter } from '+game/core/machine/Machine'
import { Game } from '+game/Game'
import { ActorType } from '+game/types'
import { distanceBetweenPoints, isSamePosition } from '+helpers'

import {
    Mesh,
    MeshStandardMaterial,
    NotEqualDepth,
    Object3D,
    SphereGeometry,
} from 'three'

import { woodcutterMachine } from './machines/woodcutterMachine'
import { Profession, ProfessionJSON } from './Profession'
import { ProfessionType } from './types'

export class WoodcutterProfession extends Profession {
    public type = ProfessionType.Woodcutter
    public readonly defaultHeldItem = 'hatchet'
    public selectImportance = 4

    public treeId?: string
    public campId?: string
    private collectedTreeHP = 0

    protected material = new MeshStandardMaterial({ color: config.woodcutter.color })
    protected geometry = new SphereGeometry(0.5, 5, 5)

    private actions = {
        move: this.move.bind(this),
        findTree: this.findTree.bind(this),
        chopTree: this.chopTree.bind(this),
        findCamp: this.findCamp.bind(this),
        gatherWood: this.gatherWood.bind(this),
    }

    private guards = {
        hasPath: this.hasPath.bind(this),
        isEmpty: this.isEmpty.bind(this),
        isFull: this.isFull.bind(this),
        campFull: this.campFull.bind(this),
        waitingAtFullCamp: () => this.nearCamp() && this.campFull(),
        nearTree: this.nearTree.bind(this),
        nearCamp: this.nearCamp.bind(this),
        reachedCamp: this.reachedCamp.bind(this),
    }

    private machine = new MachineInterpreter(woodcutterMachine, this.actions, this.guards)

    constructor(
        public game: Game,
        public actor: HumanActor,
    ) {
        super(game, actor)
    }

    public get hasWood(): boolean {
        return this.collectedTreeHP > 0
    }

    public get isChopping(): boolean {
        const state = this.machine.currentState
        // The machine visits WoodNeeded between successive swings at the same tree.
        return (
            (state === 'ChoppingTree' || state === 'WoodNeeded') &&
            !this.actor.target &&
            !this.hasPath() &&
            !this.isFull() &&
            this.getCamp() !== undefined &&
            !this.campFull() &&
            this.nearTree()
        )
    }

    public getAttackDamage(): number {
        return config.woodcutter.attackDamage
    }

    public async tick() {
        super.tick()
        if (!this.getCamp()) {
            this.move()
            return
        }
        await this.machine.send('TICK')
    }

    public reset() {
        super.reset()
        this.machine.reset()
    }

    public setCamp(camp: WoodCampActor) {
        this.campId = camp.id
    }

    public getModel(): Object3D {
        const group = super.getModel()

        this.material.depthFunc = NotEqualDepth

        const actorModel = new Mesh(this.geometry, this.material)
        actorModel.renderOrder = 1
        actorModel.castShadow = true
        actorModel.receiveShadow = true
        actorModel.scale.y = 2
        actorModel.scale.z = 0.5
        actorModel.position.y = 0.5

        group.add(actorModel)

        return group
    }

    public toJSON(): WoodcutterProfessionJSON {
        const json = super.toJSON()
        return {
            ...json,
            collectedTreeHP: this.collectedTreeHP,
            machineState: this.machine.currentState,
            treeId: this.treeId,
            campId: this.campId,
        }
    }

    public fromJSON({
        machineState,
        collectedTreeHP,
        treeId,
        campId,
        ...json
    }: WoodcutterProfessionJSON) {
        super.fromJSON(json)

        this.machine.setState(machineState)

        Object.assign(this, {
            collectedTreeHP,
            treeId,
            campId,
        })
    }

    private getTree() {
        if (!this.treeId) return
        return this.game.getActorById(this.treeId) as TreeActor
    }

    private getCamp() {
        if (!this.campId) return
        return this.game.getActorById(this.campId) as WoodCampActor
    }

    /*
     * Actions
     */

    private move() {
        this.actor.move()
    }

    private findTree() {
        const tree = this.game.findClosestActorByType(ActorType.Tree, this.actor.position)

        if (!tree) return
        this.actor.cancelPath()
        this.treeId = tree.id

        return this.actor.setPathTo(tree.position, false, true)
    }

    private chopTree() {
        const tree = this.getTree()
        if (!tree || !this.isWithinChoppingRange(tree)) return

        this.actor.recordAction('chop', tree)
        const damage = Math.round(config.woodcutter.choppingDamage * Math.random())
        this.collectedTreeHP += tree.hit(damage)
    }

    private findCamp() {
        const camp = this.getCamp()
        if (!camp) return
        return this.actor.setPathTo(camp.getDeliveryPosition())
    }

    private gatherWood() {
        const camp = this.getCamp()
        if (!camp || camp.isDead()) return

        const amount = Math.min(this.collectedTreeHP, config.woodcutter.gatheringSpeed)
        this.collectedTreeHP -= camp.collectTree(amount)
    }

    private hasPath() {
        return this.actor.hasPath()
    }

    /*
     * Guards
     */

    private isEmpty() {
        return !this.hasWood
    }

    private isFull() {
        return this.collectedTreeHP >= config.woodcutter.capacity
    }

    private campFull() {
        return this.getCamp()?.getFreeWoodStorage() === 0
    }

    private nearTree() {
        const tree = this.getTree()
        return tree !== undefined && this.isWithinChoppingRange(tree)
    }

    private isWithinChoppingRange(tree: TreeActor) {
        return (
            !tree.isDead() &&
            distanceBetweenPoints(this.actor.position, tree.position) <= 1.7
        )
    }

    private nearCamp() {
        const camp = this.getCamp()
        if (!camp) return false
        return isSamePosition(this.actor.position, camp.getDeliveryPosition())
    }

    private reachedCamp() {
        const camp = this.getCamp()
        if (!camp) return false
        return isSamePosition(camp.getDeliveryPosition(), this.actor.position)
    }
}

interface WoodcutterProfessionJSON extends ProfessionJSON {
    collectedTreeHP: number
    machineState: string
    treeId?: string
    campId?: string
}
