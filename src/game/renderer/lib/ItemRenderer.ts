import { Clock, Group, Object3D } from 'three'

export abstract class ItemRenderer {
    public group: Object3D = new Group()
    public render(clock: Clock) {}
}
