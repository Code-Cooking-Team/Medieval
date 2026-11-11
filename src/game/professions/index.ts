import { BuilderProfession } from './BuilderProfession'
import { GuardianProfession } from './GuardianProfession'
import { HunterProfession } from './HunterProfession'
import { type ProfessionClass, ProfessionJSON } from './Profession'
import { ProfessionType } from './types'
import { WoodcutterProfession } from './WoodcutterProfession'

const emptyProfession = () => {
    throw new Error(`[professionByType] Don't use empty profession`)
}

export const professionByType: Record<ProfessionType, ProfessionClass> = {
    [ProfessionType.Empty]: emptyProfession as any,
    [ProfessionType.Builder]: BuilderProfession,
    [ProfessionType.Hunter]: HunterProfession,
    [ProfessionType.Guardian]: GuardianProfession,
    [ProfessionType.Woodcutter]: WoodcutterProfession,
}
