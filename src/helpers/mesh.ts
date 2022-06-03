import { DiagonalsPlaneGeometry } from '+game/renderer/lib/DiagonalsPlaneGeometry'

export class HorizontalPlaneGeometry extends DiagonalsPlaneGeometry {
    constructor(...args: any[]) {
        super(...args)
        this.rotateX(-Math.PI / 2)
    }
}
