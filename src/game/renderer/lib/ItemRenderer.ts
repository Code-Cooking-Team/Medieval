import { ClockInfo, Renderable } from '+game/types'
import { Group, Object3D } from 'three'

export abstract class ItemRenderer implements Renderable {
    public group: Object3D = new Group()
    public render(clockInfo: ClockInfo) {}
}
