import { config } from '+config'
import { BuildingActor } from '+game/core/BuildingActor'
import { ActorType, Position } from '+game/types'
import { TileCodeGrid } from '+game/world/tileCodes'

export class StakewallActor extends BuildingActor {
    public type = ActorType.Stakewall

    public maxHp = config.wall.hp
    public hp = this.maxHp

    public readonly grid: TileCodeGrid = [
        ['🟢', '🟢', '🟢'],
        ['🟢', '🧱', '🟢'],
        ['🟢', '🟢', '🟢'],
    ]
}
