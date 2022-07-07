import { Game } from '+game/Game'

export abstract class Profession {
    constructor(public game: Game) {}

    tick(): void {}
}
