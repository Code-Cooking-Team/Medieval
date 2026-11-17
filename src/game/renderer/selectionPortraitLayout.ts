export const selectionPortraitCenterX = 76

export function selectionPortraitSize(human: boolean) {
    return human ? { width: 280, height: 240 } : { width: 240, height: 180 }
}
