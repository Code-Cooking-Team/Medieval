import { PlaneGeometry } from 'three'

export class HorizontalPlaneGeometry extends PlaneGeometry {
    constructor(...args: any[]) {
        super(...args)
        this.rotateX(-Math.PI / 2)
    }
}
