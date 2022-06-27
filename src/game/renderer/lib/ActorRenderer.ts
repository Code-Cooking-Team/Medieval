import { config } from '+config'
import { Actor } from '+game/core/Actor'
import { Tile } from '+game/Tile'
import { ActorType, ClockInfo } from '+game/types'
import {
    BoxGeometry,
    DoubleSide,
    Group,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    PlaneGeometry,
    SphereGeometry,
} from 'three'
import { Game } from '../../Game'
import { BasicRenderer } from './BasicRenderer'

export abstract class ActorRenderer extends BasicRenderer {
    public actorType: ActorType = ActorType.Empty
    public moveSpeed = 0.04

    private hpGeometry = new PlaneGeometry(2, 0.2, 1, 1)
    private hpMaterial = new MeshBasicMaterial({ color: 0xff0e00, side: DoubleSide })

    private actorGroupMap = new Map<Actor, Group>()
    private actorInteractionShapeMap = new Map<Object3D, Actor>()

    constructor(public game: Game) {
        super()
        this.game.subscribe((action, [actor]) => {
            if (!actor || actor.type !== this.actorType) return
            if (action === 'actorAdded') this.onAddActor(actor)
            if (action === 'actorRemoved') this.onRemoveActor(actor)
        })

        const treeActors = this.game.findActorsByType(this.actorType) as Actor[]

        treeActors.forEach((actor) => {
            this.onAddActor(actor)
        })
    }

    public createActorModel(
        actor: Actor,
        tile: Tile,
    ): { group: Group; interactionShape: Object3D } {
        const [x, y] = actor.position
        const group = new Group()

        const hp = new Mesh(this.hpGeometry, this.hpMaterial)
        hp.name = 'hp'
        hp.position.y = 5

        group.add(hp)

        const interactionShape = new Mesh(
            new BoxGeometry(2, 2, 2),
            new MeshBasicMaterial({ color: 0xffffff, wireframe: true }),
        )

        interactionShape.userData = { actor } // TODO remove
        group.add(interactionShape)

        group.position.x = x * config.renderer.tileSize
        group.position.y = tile.height
        group.position.z = y * config.renderer.tileSize

        return { group, interactionShape }
    }

    public render(clockInfo: ClockInfo) {
        this.updatePosition()
        this.updateHP()
    }

    public getInteractionShapes(): Object3D[] {
        return Array.from(this.actorInteractionShapeMap.keys())
    }

    private onAddActor(actor: Actor) {
        const tile = this.game.word.getTile(actor.position)
        const { group, interactionShape } = this.createActorModel(actor, tile)

        this.actorGroupMap.set(actor, group)
        this.actorInteractionShapeMap.set(interactionShape, actor)
        this.group.add(group)
    }

    private onRemoveActor(actor: Actor) {
        const group = this.actorGroupMap.get(actor)

        if (!group) {
            throw new Error(`[ActorRenderer] Unable to remove actor ${actor.id}`)
        }

        this.group.remove(group)
        this.actorGroupMap.delete(actor)
    }

    private updatePosition() {
        this.actorGroupMap.forEach((group, actor) => {
            const [x, y] = actor.position
            const tile = this.game.word.getTile(actor.position)
            const tileX = x * config.renderer.tileSize
            const tileY = y * config.renderer.tileSize
            group.position.x += (tileX - group.position.x) * this.moveSpeed
            group.position.z += (tileY - group.position.z) * this.moveSpeed
            group.position.y += (tile.height - group.position.y) * this.moveSpeed
        })
    }

    private updateHP() {
        this.actorGroupMap.forEach((group, actor) => {
            const hpMesh = group.getObjectByName('hp') as Mesh
            hpMesh.scale.x = actor.hp / actor.maxHp
            hpMesh.visible = actor.hp < actor.maxHp
        })
    }
}
