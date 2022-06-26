import { config } from '+config'
import { Actor } from '+game/core/Actor'
import { Tile } from '+game/Tile'
import { ActorType, ClockInfo } from '+game/types'
import { DoubleSide, Group, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three'
import { Game } from '../../Game'
import { ItemRenderer } from './ItemRenderer'

export abstract class ActorRenderer extends ItemRenderer {
    public actorType: ActorType = ActorType.Empty
    public moveSpeed = 0.04

    private hpGeometry = new PlaneGeometry(2, 0.2, 1, 1)
    private hpMaterial = new MeshBasicMaterial({ color: 0xff0e00, side: DoubleSide })

    public actorGroupRef: {
        [actorId: string]: {
            group: Group
            actor: Actor
        }
    } = {}

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

    public onAddActor(actor: Actor) {
        const tile = this.game.word.getTile(actor.position)
        const group = this.createActorModel(actor, tile)

        this.actorGroupRef[actor.id] = { group, actor }
        this.group.add(group)
    }

    public onRemoveActor(actor: Actor) {
        const ref = this.actorGroupRef[actor.id]
        if (!ref) return

        this.group.remove(ref.group)
        delete this.actorGroupRef[actor.id]
    }

    public render(clockInfo: ClockInfo) {
        this.updatePosition()
        this.updateHP()
    }

    public updatePosition() {
        Object.values(this.actorGroupRef).forEach(({ group, actor }) => {
            const [x, y] = actor.position
            const tile = this.game.word.getTile(actor.position)
            const tileX = x * config.renderer.tileSize
            const tileY = y * config.renderer.tileSize
            group.position.x += (tileX - group.position.x) * this.moveSpeed
            group.position.z += (tileY - group.position.z) * this.moveSpeed
            group.position.y += (tile.height - group.position.y) * this.moveSpeed
        })
    }

    public updateHP() {
        Object.values(this.actorGroupRef).forEach(({ group, actor }) => {
            const hpMesh = group.getObjectByName('hp') as Mesh
            hpMesh.scale.x = actor.hp / actor.maxHp
            hpMesh.visible = actor.hp < actor.maxHp
        })
    }

    public createActorModel(actor: Actor, tile: Tile): Group {
        const [x, y] = actor.position
        const group = new Group()

        const hp = new Mesh(this.hpGeometry, this.hpMaterial)
        hp.name = 'hp'
        hp.position.y = 5

        group.add(hp)

        group.position.x = x * config.renderer.tileSize
        group.position.y = tile.height
        group.position.z = y * config.renderer.tileSize

        return group
    }
}
