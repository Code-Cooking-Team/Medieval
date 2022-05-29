import { config } from '+config'
import { Word } from '+game/Word'
import { HorizontalPlaneGeometry } from '+helpers/mesh'

export const createWordPlane = (word: Word) => {
    const [wordWidth, wordHeight] = word.getSize()

    const width = (wordWidth - 1) * config.renderer.tileSize
    const height = (wordHeight - 1) * config.renderer.tileSize

    const geometry = new HorizontalPlaneGeometry(
        width,
        height,
        wordWidth - 1,
        wordHeight - 1,
    )

    geometry.translate(width / 2, 0, height / 2)

    return geometry
}
