import { type ClockInfo, type Renderable } from '+game/types'

import { Group, type Object3D } from 'three'

export abstract class BasicRenderer implements Renderable {
    public group: Object3D = new Group()
    public render(clockInfo: ClockInfo) {}
}
