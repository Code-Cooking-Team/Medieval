import { Game } from '+game/Game'

export abstract class Profession {
    public selectImportance = 4
    constructor(public game: Game) {}

    tick(): void {}
}
