import { config } from '+config'
import { isBuildingActor } from '+game/actors/helpers'
import { Actor } from '+game/core/Actor'
import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { Tile } from '+game/Tile'
import { ActorType, ClockInfo } from '+game/types'

import {
    BoxGeometry,
    CircleGeometry,
    DoubleSide,
    EdgesGeometry,
    Group,
    LineBasicMaterial,
    LineSegments,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    PlaneGeometry,
} from 'three'

import { BasicRenderer } from './BasicRenderer'

export abstract class ActorRenderer<TActor extends Actor> extends BasicRenderer {
    public actorType: ActorType = ActorType.Empty

    private hpGeometry = new PlaneGeometry(2, 0.2, 1, 1)
    private hpMaterial = new MeshBasicMaterial({ color: 0xff0e00, side: DoubleSide })

    protected actorGroupMap = new Map<TActor, Group>()
    private actorInteractionShapeMap = new Map<Mesh, TActor>()

    constructor(public game: Game, public player: HumanPlayer) {
        super()

        this.game.emitter.on('actorAdded', (actor) => {
            if (actor.type === this.actorType) this.onAddActor(actor as TActor)
        })

        this.game.emitter.on('actorRemoved', (actor) => {
            if (actor.type === this.actorType) this.onRemoveActor(actor as TActor)
        })

        const treeActors = this.game.findActorsByType(this.actorType) as TActor[]

        treeActors.forEach((actor) => {
            this.onAddActor(actor)
        })
    }

    public createActorModel(
        actor: TActor,
        tile: Tile,
    ): { group: Group; interactionShape: Mesh } {
        const [x, y] = actor.position
        const group = new Group()

        const hp = new Mesh(this.hpGeometry, this.hpMaterial)
        hp.name = 'hp'
        hp.position.y = 5

        group.add(hp)

        const interactionShape = this.createInteractionMesh(actor)
        group.add(interactionShape)

        group.position.x = x * config.renderer.tileSize
        group.position.y = tile.height
        group.position.z = y * config.renderer.tileSize

        return { group, interactionShape }
    }

    public render(clockInfo: ClockInfo) {
        this.updatePosition(clockInfo)
        this.updateHP()
        this.updateSelect()
    }

    public getInteractionShapes(): Object3D[] {
        return Array.from(this.actorInteractionShapeMap.keys())
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
            new MeshBasicMaterial({ color: 0xffffff, wireframe: true, visible: false }),
        )

        interactionShape.position.x = width / 2 - ts / 2
        interactionShape.position.z = depth / 2 - ts / 2
        interactionShape.position.y = height / 2

        interactionShape.userData = { actor }

        const edges = new EdgesGeometry(
            new CircleGeometry((width + height / 2.2) / 2.2, 64),
        )
        edges.rotateX(Math.PI / 2)

        const interactionSelect = new LineSegments(
            edges,
            new LineBasicMaterial({ color: 0x5eff64, linewidth: 2 }),
        )

        interactionSelect.position.x = 0
        interactionSelect.position.z = 0
        interactionSelect.position.y = 0.3 - height / 2

        interactionShape.add(interactionSelect)

        return interactionShape
    }

    protected updatePosition(clockInfo: ClockInfo) {
        this.actorGroupMap.forEach((group, actor) => {
            const [x, y] = actor.position
            const tile = this.game.world.getTile(actor.position)
            const tileX = x * config.renderer.tileSize
            const tileY = y * config.renderer.tileSize
            group.position.x = tileX
            group.position.z = tileY
            group.position.y = tile.height
        })
    }

    protected updateHP() {
        this.actorGroupMap.forEach((group, actor) => {
            const hpMesh = group.getObjectByName('hp') as Mesh
            hpMesh.scale.x = actor.hp / actor.maxHp
            hpMesh.visible = actor.hp < actor.maxHp
        })
    }

    protected updateSelect() {
        this.actorInteractionShapeMap.forEach((actor, shape) => {
            shape.visible = this.player.selectedActors.includes(actor)
        })
    }
}
