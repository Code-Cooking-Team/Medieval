import { config } from '+config'
import { WoodCampActor } from '+game/actors/buildings/woodCamp/WoodCampActor'
import { TreeActor } from '+game/actors/flora/tree/TreeActor'
import { HumanActor } from '+game/actors/units/human/HumanActor'
import { MachineInterpreter } from '+game/core/machine/Machine'
import { Game } from '+game/Game'
import { ActorType } from '+game/types'
import { isSamePosition, maxValue } from '+helpers'

import { GreaterDepth, GreaterEqualDepth, LessEqualDepth, Mesh, MeshStandardMaterial, NeverDepth, NotEqualDepth, Object3D, SphereGeometry } from 'three'

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

    private actions = {
        move: this.move.bind(this),
        findTree: this.findTree.bind(this),
        chopTree: this.chopTree.bind(this),
        putWood: this.putWood.bind(this),
        findCamp: this.findCamp.bind(this),
        gatherWood: this.gatherWood.bind(this),
    }

    private guards = {
        hasPath: this.hasPath.bind(this),
        isEmpty: this.isEmpty.bind(this),
        isFull: this.isFull.bind(this),
        nearTree: this.nearTree.bind(this),
        nearCamp: this.nearCamp.bind(this),
        reachedCamp: this.reachedCamp.bind(this),
    }

    private machine = new MachineInterpreter(woodcutterMachine, this.actions, this.guards)

    constructor(public game: Game, public actor: HumanActor, public camp: WoodCampActor) {
        super(game)
    }

    public getAttackDamage(): number {
        return config.woodcutter.attackDamage
    }

    public async tick() {
        super.tick()
        await this.machine.send('TICK')
    }

    public reset() {
        super.reset()
        this.machine.reset()
    }

    public getModel(): Object3D {
        const group = super.getModel()
        // this.material.depthTest = false;
        this.material.depthFunc = NotEqualDepth;
        const actorModel = new Mesh(this.geometry, this.material)
        actorModel.renderOrder = 1;

        actorModel.castShadow = true
        actorModel.receiveShadow = true
        actorModel.scale.y = 2
        actorModel.scale.z = 0.5
        actorModel.position.y = 0.5

        group.add(actorModel)


        return group
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
        this.tree = tree as TreeActor

        return this.actor.setPathTo(tree.position)
    }

    private chopTree() {
        if (!this.tree) return

        const damage = Math.round(config.woodcutter.choppingDamage * Math.random())
        this.collectedTreeHP += this.tree.hit(damage)
    }

    private putWood() {
        const value = maxValue(this.collectedTreeHP, config.woodcutter.gatheringSpeed)
        this.collectedTreeHP -= value
        this.camp.collectTree(value)
    }

    private findCamp() {
        this.actor.setPathTo(this.camp.getDeliveryPoint())
    }

    private gatherWood() {
        const speed = config.woodcutter.gatheringSpeed
        const amount = this.collectedTreeHP < speed ? this.collectedTreeHP : speed
        this.collectedTreeHP -= amount
        this.camp.collectTree(amount)
    }

    private hasPath() {
        return this.actor.hasPath()
    }

    /*
     * Guards
     */

    private isEmpty() {
        return this.collectedTreeHP === 0
    }

    private isFull() {
        return this.collectedTreeHP >= config.woodcutter.capacity
    }

    private nearTree() {
        const actors = this.game.findActorsByPosition(this.actor.position, 1.7)
        return actors.some((actor) => actor.type === ActorType.Tree)
    }

    private nearCamp() {
        return isSamePosition(this.actor.position, this.camp.getDeliveryPoint())
    }

    private reachedCamp() {
        return isSamePosition(this.camp.getDeliveryPoint(), this.actor.position)
    }
}
