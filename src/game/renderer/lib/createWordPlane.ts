import { config } from '+config'
import { World } from '+game/world/World'
import { HorizontalPlaneGeometry } from '+helpers'

import { Diagonals } from './DiagonalsPlaneGeometry'

export const createWordPlane = (
    word: World,
    diagonals: Diagonals,
    multiply: number = 1,
) => {
    const [wordWidth, wordHeight] = word.getSize()

    const width = (wordWidth - 1) * config.renderer.tileSize
    const height = (wordHeight - 1) * config.renderer.tileSize

    const geometry = new HorizontalPlaneGeometry(
        width,
        height,
        multiply * wordWidth - 1,
        multiply * wordHeight - 1,
        diagonals,
    )

    geometry.translate(width / 2, 0, height / 2)

    return geometry
}
