export interface BuildingTrait {
    type: BuildingTraitType
    tick(): void
    toJSON(): any
    fromJSON(json: any): void
}

export enum BuildingTraitType {
    Residence = 'Residence',
}

export interface BuildingTraitJSON {
    type: BuildingTraitType
}
