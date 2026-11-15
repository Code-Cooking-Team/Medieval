import { config } from '+config'
import { type Actor } from '+game/core/Actor'
import { toStep } from '+game/core/StandingSurfaces'
import { type Game } from '+game/Game'
import { pickCliffShelfTop } from '+game/renderer/lib/createCliffShelfGeometry'
import { type Renderer } from '+game/Renderer'
import { type Position } from '+game/types'

import { InstancedMesh, Matrix3, Matrix4, Raycaster, Vector2 } from 'three'

export class RaycastFinder {
    constructor(
        public game: Game,
        public renderer: Renderer,
    ) {}

    public findPositionByMouseEvent = (event: MouseEvent): Position | undefined => {
        const rayCaster = new Raycaster()
        const pointer = new Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
        )
        this.renderer.rtsCamera.camera.updateMatrixWorld()
        rayCaster.setFromCamera(pointer, this.renderer.rtsCamera.camera)

        const intersects = rayCaster.intersectObjects(this.renderer.getGroundChildren())
        const intersectPoint = intersects[0]?.point

        if (!intersectPoint) return

        const [width, height] = this.game.world.getRealSize()

        const x = Math.round((intersectPoint.x + width / 2) / config.renderer.tileSize)
        const y = Math.round((intersectPoint.z + height / 2) / config.renderer.tileSize)

        return [x, y]
    }

    public findStandingSurfaceByMouseEvent(event: MouseEvent) {
        const raycaster = new Raycaster()
        this.renderer.rtsCamera.camera.updateMatrixWorld()
        raycaster.setFromCamera(
            new Vector2(
                (event.clientX / window.innerWidth) * 2 - 1,
                -(event.clientY / window.innerHeight) * 2 + 1,
            ),
            this.renderer.rtsCamera.camera,
        )
        const marker = this.renderer.pickStandingSurfaceMarker(raycaster)
        if (marker) return marker
        const { origin, direction } = raycaster.ray
        if (direction.y >= 0) return
        const [width, depth] = this.game.world.getRealSize()
        const size = config.renderer.tileSize
        const hit = this.renderer.getStandingSurfaceHit(raycaster)
        if (!hit?.face) return
        const x = (hit.point.x + width / 2) / size
        const y = (hit.point.z + depth / 2) / size
        const shelf = pickCliffShelfTop(hit, x, y)
        if (shelf) return toStep(shelf)
        const candidates = [...this.game.pf.surfaces.all()].filter((surface) => {
            const distance = (surface.height * size - origin.y) / direction.y
            if (distance < 0) return false
            const x = (origin.x + direction.x * distance + width / 2) / size
            const y = (origin.z + direction.z * distance + depth / 2) / size
            return (
                Math.abs(surface.position[0] - x) <= 0.6 &&
                Math.abs(surface.position[1] - y) <= 0.6
            )
        })
        if (!candidates.length) return
        // Check actual visible geometry. A roof or solid side in front of a
        // floor must not turn into a movement order for that floor.
        const transform = hit.object.matrixWorld.clone()
        if (hit.object instanceof InstancedMesh && hit.instanceId !== undefined) {
            const instance = new Matrix4()
            hit.object.getMatrixAt(hit.instanceId, instance)
            transform.multiply(instance)
        }
        const normal = hit.face.normal
            .clone()
            .applyNormalMatrix(new Matrix3().getNormalMatrix(transform))
        if (normal.y < 0.55) return
        const height = hit.point.y / size
        const nearest = candidates
            .filter(
                (surface) =>
                    Math.abs(surface.height - height) <= 0.16 &&
                    Math.abs(surface.position[0] - x) <= (surface.halfWidth ?? 0.5) &&
                    Math.abs(surface.position[1] - y) <= (surface.halfWidth ?? 0.5),
            )
            .sort((a, b) => Math.abs(a.height - height) - Math.abs(b.height - height))[0]
        return nearest && toStep(nearest)
    }

    public findActorsByMouseEvent = (event: MouseEvent): Actor[] => {
        // TODO: Optimize intersectObjects execution
        const rayCaster = new Raycaster()
        const pointer = new Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
        )
        this.renderer.rtsCamera.camera.updateMatrixWorld()
        rayCaster.setFromCamera(pointer, this.renderer.rtsCamera.camera)

        const interactionObjectList = this.renderer.getInteractionObjectList()

        interactionObjectList.forEach((object) => object.updateWorldMatrix(true, false))
        const intersects = rayCaster.intersectObjects(interactionObjectList, false)

        const intersectActors = intersects
            .map((intersect) => intersect.object.userData.actor as Actor)
            .filter((actor) => !!actor)

        intersectActors.sort(
            (a, b) => b.getSelectedImportance() - a.getSelectedImportance(),
        )

        return intersectActors
    }

    public findSingleActorByMouseEvent(event: MouseEvent): Actor | undefined {
        const actors = this.findActorsByMouseEvent(event)

        if (!actors.length) return

        return actors.reduce((prev, current) => {
            if (!prev) return current
            return prev.getSelectedImportance() < current.getSelectedImportance()
                ? current
                : prev
        })
    }
}
