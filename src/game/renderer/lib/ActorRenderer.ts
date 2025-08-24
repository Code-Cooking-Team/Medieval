import { config } from '+config'
import { isBuildingActor } from '+game/actors/helpers'
import { Actor } from '+game/core/Actor'
import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { ActorType, ClockInfo, Position } from '+game/types'
import { Tile } from '+game/world/Tile'
import { multiplyPosition, rotationIndexToDeg, updateObjectPosition } from '+helpers'

import {
    BoxGeometry,
    CircleGeometry,
    EdgesGeometry,
    Group,
    LineBasicMaterial,
    LineSegments,
    Mesh,
    MeshBasicMaterial,
    NotEqualDepth,
    Object3D,
    Sprite,
    SpriteMaterial,
} from 'three'

import { BasicRenderer } from './BasicRenderer'

export abstract class ActorRenderer<TActor extends Actor> extends BasicRenderer {
    public actorType = ActorType.Empty

    private hpMaterial = new SpriteMaterial({ color: 0xff0e00 })
    private hpBgMaterial = new SpriteMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.5,
    })

    protected actorGroupMap = new Map<TActor, Group>()
    private actorInteractionShapeMap = new Map<Mesh, TActor>()

    constructor(public game: Game, public player: HumanPlayer) {
        super()
    }

    public init() {
        this.game.emitter.on('actorAdded', this.handleActorAdded)
        this.game.emitter.on('actorRemoved', this.handleActorRemoved)

        const currentActors = this.game.findActorsByType(this.actorType) as TActor[]

        currentActors.forEach((actor) => {
            this.onAddActor(actor)
        })
    }

    public destroy() {
        this.game.emitter.off('actorAdded', this.handleActorAdded)
        this.game.emitter.off('actorRemoved', this.handleActorRemoved)
    }

    public createActorModel(
        actor: TActor,
        tile: Tile,
    ): { group: Group; interactionShape: Mesh } {
        const group = new Group()
        const hp = new Sprite(this.hpMaterial.clone())
        const hpBg = new Sprite(this.hpBgMaterial)
        hpBg.renderOrder = 1
        hp.renderOrder = 2

        // hp.center.set(0, 0.5)
        // Transform origin to left middle in screen space
        // hpBg.center.set(0, 0.5)
        // hpBg.translateX(-0.55)
        // hpBg.center.set(0, 0.5)

        hp.scale.x = 2 * config.renderer.tileSize
        hp.scale.y = 0.2 * config.renderer.tileSize

        hpBg.scale.x = 2.1 * config.renderer.tileSize
        hpBg.scale.y = 0.3 * config.renderer.tileSize

        hp.name = 'hp'
        hpBg.name = 'hpBg'
        hp.position.y = 3 * config.renderer.tileSize
        hpBg.position.y = hp.position.y
        group.add(hpBg)
        group.add(hp)

        const interactionShape = this.createInteractionMesh(actor)
        group.add(interactionShape)

        updateObjectPosition(group, actor.position, tile.height)

        group.rotation.y = rotationIndexToDeg(actor.rotation)

        return { group, interactionShape }
    }

    public render(clockInfo: ClockInfo) {
        this.updatePosition(clockInfo)
        this.updateHP()
        this.updateSelect()
    }

    public getSelectedGroups() {
        const selected: Object3D[] = []
        this.actorGroupMap.forEach((group, actor) => {
            if (this.player.selectedActors.includes(actor)) {
                selected.push(group)
            }
        })
        return selected
    }

    public getInteractionShapes(): Object3D[] {
        return Array.from(this.actorInteractionShapeMap.keys())
    }

    private handleActorAdded = (actor: Actor) => {
        if (actor.type === this.actorType) this.onAddActor(actor as TActor)
    }

    private handleActorRemoved = (actor: Actor) => {
        if (actor.type === this.actorType) this.onRemoveActor(actor as TActor)
    }

    private onAddActor(actor: TActor) {
        const tile = this.game.world.getTile(actor.position)

        const { group, interactionShape } = this.createActorModel(actor, tile)

        this.actorGroupMap.set(actor, group)
        this.actorInteractionShapeMap.set(interactionShape, actor)
        this.group.add(group)
    }

    private onRemoveActor(actor: TActor) {
        const group = this.actorGroupMap.get(actor)

        if (!group) {
            throw new Error(`[ActorRenderer] Unable to remove actor ${actor.id}`)
        }

        this.group.remove(group)
        this.actorGroupMap.delete(actor)
    }

    protected createInteractionMesh(actor: TActor) {
        let width = 1
        let height = 1
        let depth = 1

        const ts = config.renderer.tileSize

        if (isBuildingActor(actor)) {
            ;[width, depth, height] = actor.getSize()
        }

        width *= ts
        height *= ts
        depth *= ts

        const interactionShape = new Mesh(
            new BoxGeometry(width, height, depth),
            new MeshBasicMaterial({
                color: 0xffffff,
                wireframe: true,
                visible: config.debug.wireModel,
            }),
        )

        interactionShape.position.y = height / 2

        interactionShape.userData = { actor }

        const ring = new EdgesGeometry(
            new CircleGeometry((width + height / 2.2) / 2.2, 64),
        )
        ring.rotateX(Math.PI / 2)

        const interactionSelect = new LineSegments(
            ring,
            new LineBasicMaterial({
                color: 0x5eff64,
                linewidth: 2 * window.devicePixelRatio,
                depthFunc: NotEqualDepth,
            }),
        )

        const offset = 0.2 * ts

        interactionSelect.position.x = 0
        interactionSelect.position.z = 0
        interactionSelect.position.y = offset - height / 2

        interactionShape.add(interactionSelect)

        return interactionShape
    }

    protected updatePosition(clockInfo: ClockInfo) {
        this.actorGroupMap.forEach((group, actor) => {
            const tile = this.game.world.getTile(actor.position)
            updateObjectPosition(group, actor.position, tile.height)
        })
    }

    protected updateHP() {
        this.actorGroupMap.forEach((group, actor) => {
            const hpMesh = group.getObjectByName('hp') as Mesh
            const hpBgMesh = group.getObjectByName('hpBg') as Mesh
            hpMesh.scale.x = (actor.hp / actor.maxHp) * 2 * config.renderer.tileSize

            if (hpMesh.material instanceof SpriteMaterial) {
                // Green to red larp based on hp
                const healthPercent = actor.hp / actor.maxHp
                const red = 1 * (1 - healthPercent) * 2
                const green = 1 * healthPercent - 0.5
                const blue = 0.2 * healthPercent
                hpMesh.material.color.setRGB(red, green, blue)
            }
            hpMesh.visible = actor.hp < actor.maxHp
            hpBgMesh.visible = hpMesh.visible
        })
    }

    protected updateSelect() {
        this.actorInteractionShapeMap.forEach((actor, shape) => {
            shape.visible = this.player.selectedActors.includes(actor)
        })
    }
}
