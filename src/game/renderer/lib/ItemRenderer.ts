import { ClockInfo, Renderable } from '+game/types'
import { Clock, Group } from 'three'

export abstract class ItemRenderer implements Renderable {
    public group = new Group()
    public render(clockInfo: ClockInfo) {}
}
