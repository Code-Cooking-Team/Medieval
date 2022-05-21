import { uuid } from '+helpers/basic'
import { Game } from '../Game'
import { Position } from '../types'

export abstract class ActorStatic {
    public id = uuid()
    public name: string = 'Empty'

    constructor(public game: Game, public position: Position) {}

    public tick() {}
}
