import { config } from '+config'
import { Word } from '+game/word/Word'
import { HorizontalPlaneGeometry } from '+helpers'

export const createWordPlane = (word: Word, diagonals: string, multiply: number = 1) => {
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
