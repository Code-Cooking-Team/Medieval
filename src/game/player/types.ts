export interface Player {
    id: string
    name: string
    type: PlayerType

    toJSON(): PlayerJSON
    fromJSON(json: PlayerJSON): void
}

export enum PlayerType {
    Human = 'Human',
    Nature = 'Nature',
}

export interface PlayerJSON {
    id: string
    name: string
    type: PlayerType
}
