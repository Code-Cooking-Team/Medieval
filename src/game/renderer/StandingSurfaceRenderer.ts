import { config } from '+config'
import {
    type StandingSurface,
    type StandingSurfaces,
    toStep,
} from '+game/core/StandingSurfaces'

import {
    DoubleSide,
    InstancedMesh,
    MeshBasicMaterial,
    Object3D,
    PlaneGeometry,
    type Raycaster,
} from 'three'

import { BasicRenderer } from './lib/BasicRenderer'

export class StandingSurfaceRenderer extends BasicRenderer {
    private readonly geometry = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
    private readonly material = new MeshBasicMaterial({
        color: 0xff43a8,
        side: DoubleSide,
        transparent: true,
        opacity: 0.55,
        depthTest: false,
        depthWrite: false,
    })
    private markers?: InstancedMesh
    private revision = -1
    private displayed: StandingSurface[] = []

    constructor(private readonly surfaces: StandingSurfaces) {
        super()
    }

    public render() {
        const visible = config.debug.standingSurfaceMarkers === true
        if (this.markers) this.markers.visible = visible
        if (this.revision === this.surfaces.revision) return
        this.revision = this.surfaces.revision
        this.clearMarkers()

        const surfaces = [...this.surfaces.all()]
        this.displayed = surfaces
        if (!surfaces.length) return

        const markers = new InstancedMesh(this.geometry, this.material, surfaces.length)
        markers.renderOrder = 10
        markers.visible = visible
        const tileSize = config.renderer.tileSize
        const transform = new Object3D()
        surfaces.forEach(({ position: [x, y], height, halfWidth }, index) => {
            const size = (halfWidth ?? 0.49) * 2 * tileSize
            transform.position.set(x * tileSize, height * tileSize, y * tileSize)
            transform.scale.set(size, 1, size)
            transform.updateMatrix()
            markers.setMatrixAt(index, transform.matrix)
        })
        markers.instanceMatrix.needsUpdate = true
        this.markers = markers
        this.group.add(markers)
    }

    public pick(raycaster: Raycaster) {
        this.render()
        if (!this.markers) return
        this.markers.updateWorldMatrix(true, false)
        const hit = raycaster.intersectObject(this.markers, false)[0]
        const surface =
            hit?.instanceId === undefined ? undefined : this.displayed[hit.instanceId]
        return surface && toStep(surface)
    }

    public destroy() {
        this.clearMarkers()
        this.geometry.dispose()
        this.material.dispose()
    }

    private clearMarkers() {
        this.markers?.removeFromParent()
        this.markers?.dispose()
        this.markers = undefined
    }
}
