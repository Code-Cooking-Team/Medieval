export type EquipmentSlot = 'Hands' | 'Armor'
export type ItemId = 'spear' | 'sword' | 'hatchet' | 'hammer' | 'paddedArmor'
export type Equipment = Record<EquipmentSlot, ItemId | null>

interface Item {
    name: string
    slot: EquipmentSlot
    damageBonus: number
    healthBonus: number
}

export const items: Record<ItemId, Item> = {
    spear: { name: 'Spear', slot: 'Hands', damageBonus: 8, healthBonus: 0 },
    sword: { name: 'Sword', slot: 'Hands', damageBonus: 10, healthBonus: 0 },
    hatchet: { name: 'Hatchet', slot: 'Hands', damageBonus: 5, healthBonus: 0 },
    hammer: { name: 'Hammer', slot: 'Hands', damageBonus: 0, healthBonus: 0 },
    paddedArmor: { name: 'Padded armor', slot: 'Armor', damageBonus: 0, healthBonus: 25 },
}
