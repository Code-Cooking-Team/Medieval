import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { ActorType } from '+game/types'
import { type Tile } from '+game/world/Tile'

import { Mesh, MeshBasicMaterial } from 'three'

import { type ConstructionSiteActor } from './ConstructionSiteActor'

export class ConstructionSiteRenderer extends ActorRenderer<ConstructionSiteActor> {
    public actorType = ActorType.ConstructionSite

    private material = new MeshBasicMaterial({
        color: 0xe5c47f,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
    })

    public destroy() {
        super.destroy()
        this.material.dispose()
    }

    public createActorModel(actor: ConstructionSiteActor, tile: Tile) {
        const result = super.createActorModel(actor, tile)
        const { model, promise } = actor.blueprint.getPlaceholder(actor.seed)
        result.group.add(model)
        void promise.then(() => {
            model.traverse((object) => {
                if (object instanceof Mesh) {
                    object.material = this.material
                    object.castShadow = false
                    object.receiveShadow = false
                }
            })
        })
        return result
    }
}
