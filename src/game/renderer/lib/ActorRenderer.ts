import { config } from '+config'
import { Actor } from '+game/core/Actor'
import { ActorType } from '+game/types'
import { Tile } from '+game/Word'
import { Group } from 'three'
import { Game } from '../../Game'
import { ItemRenderer } from './ItemRenderer'

export abstract class ActorRenderer extends ItemRenderer {
    public actorType: ActorType = ActorType.Empty

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

    public updatePosition() {
        Object.values(this.actorGroupRef).forEach(({ group, actor }) => {
            const [x, y] = actor.position
            const tile = this.game.word.getTile(actor.position)
            group.position.x = x * config.renderer.tileSize
            group.position.y = tile.height
            group.position.z = y * config.renderer.tileSize
        })
    }

    public createActorModel(actor: Actor, tile: Tile): Group {
        const [x, y] = actor.position
        const group = new Group()

        group.position.x = x * config.renderer.tileSize
        group.position.y = tile.height
        group.position.z = y * config.renderer.tileSize

        return group
    }
}
