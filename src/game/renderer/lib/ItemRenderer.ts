import { Clock, Group } from 'three'

export abstract class ItemRenderer {
    public group = new Group()
    public render(clock: Clock) {}
}
