import { BuildingActor } from '+game/core/BuildingActor'
import { InstancedBuildingRenderer } from '+game/renderer/lib/InstancedBuildingRenderer'
import { ActorType } from '+game/types'

import { galleryBlueprint, galleryStairsBlueprint } from './galleryBlueprints'

export class GalleryActor extends BuildingActor {
    public type = ActorType.Gallery
    public blueprint = galleryBlueprint
}

export class GalleryStairsActor extends BuildingActor {
    public type = ActorType.GalleryStairs
    public blueprint = galleryStairsBlueprint
}

export class GalleryRenderer extends InstancedBuildingRenderer<GalleryActor> {
    public actorType = ActorType.Gallery
    protected buildingModel = galleryBlueprint.buildingModel
}

export class GalleryStairsRenderer extends InstancedBuildingRenderer<GalleryStairsActor> {
    public actorType = ActorType.GalleryStairs
    protected buildingModel = galleryStairsBlueprint.buildingModel
}
