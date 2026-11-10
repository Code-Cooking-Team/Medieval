import { config } from '+config'
import { ClockInfo, Renderable } from '+game/types'
import { World } from '+game/world/World'

import {
    MathUtils,
    MOUSE,
    PerspectiveCamera,
    Quaternion,
    Raycaster,
    Vector2,
    Vector3,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const CAMERA_SPEED = config.renderer.tileSize * 2
const SCROLL_PAN_SPEED = CAMERA_SPEED * 0.02
const UP = new Vector3(0, 1, 0)

export class RTSCamera implements Renderable {
    public camera = new PerspectiveCamera(
        config.camera.fov,
        window.innerWidth / window.innerHeight,
        config.camera.near,
        config.camera.far,
    )

    private showcaseOrbit?: { radius: number; height: number }
    private controls?: OrbitControls
    private keyPressed: { [key: string]: number } = {}
    private wheelRay = new Raycaster()
    private wheelPointer = new Vector2()
    private scrollMovement = new Vector3()

    constructor(private domElement: HTMLElement) {
        this.camera.position.x = 0
        this.camera.position.y = 5
        this.camera.position.z = 5

        this.camera.rotation.x = -Math.PI / 3
        this.camera.rotation.order = 'YXZ'
    }

    public init(showcaseWorld?: World) {
        if (showcaseWorld) {
            const [width, depth] = showcaseWorld.getSize()
            const tileSize = config.renderer.tileSize
            const span = Math.min(width, depth)
            const radius = span * 0.2
            const corridor = span * 0.035
            let peak = 0
            showcaseWorld.forEachTile((tile, [x, y]) => {
                const distance = Math.hypot(x - width / 2, y - depth / 2)
                if (Math.abs(distance - radius) <= corridor) {
                    peak = Math.max(peak, tile.height)
                }
            })
            // Leave more room above flat terrain and fly closer to mountain ridges.
            const mountainRelief = MathUtils.smoothstep(peak, 7, 23)
            const clearance = span * MathUtils.lerp(0.056, 0.026, mountainRelief)
            this.showcaseOrbit = {
                radius: radius * tileSize,
                height: (peak + clearance) * tileSize,
            }
            return
        }

        if (config.core.orbitalControls) this.orbitalControls()
        window.document.addEventListener('keydown', this.handleKeyDown)
        window.document.addEventListener('keyup', this.handleKeyUp)
        this.domElement.addEventListener('wheel', this.handleWheel, { passive: false })
    }

    public destroy() {
        this.controls?.dispose()
        window.document.removeEventListener('keydown', this.handleKeyDown)
        window.document.removeEventListener('keyup', this.handleKeyUp)
        this.domElement.removeEventListener('wheel', this.handleWheel)
    }

    public render({ deltaTime, elapsedTime }: ClockInfo) {
        if (this.showcaseOrbit) {
            const { radius, height } = this.showcaseOrbit
            const angle = Math.PI / 4 - (elapsedTime / 65) * 2 * Math.PI
            const sin = Math.sin(angle)
            const cos = Math.cos(angle)
            const x = sin * radius
            const z = cos * radius
            this.camera.position.set(x, height, z)

            // Look ahead along the flight path and into the right turn.
            const ahead = radius * 0.62
            const inward = radius * 0.49
            this.camera.lookAt(
                x - cos * ahead - sin * inward,
                height - Math.hypot(ahead, inward) * 0.98,
                z + sin * ahead - cos * inward,
            )
            this.camera.rotateZ(-Math.PI / 36)
            return
        }

        const now = new Date().getTime()

        Object.entries(this.keyPressed).forEach(([keyCode, start]) => {
            const momentum = this.getMomentum(now, start, deltaTime)
            const zoomOutBust = this.camera.position.y * config.renderer.tileSize
            const cameraRotation = this.camera.rotation.x

            let momentumTranslate = (momentum + zoomOutBust) * CAMERA_SPEED

            if (this.keyPressed['ShiftLeft'] || this.keyPressed['ShiftRight']) {
                momentumTranslate *= 2
            }

            switch (keyCode) {
                case 'KeyW':
                case 'ArrowUp':
                    this.camera.translateY(momentumTranslate * -cameraRotation)
                    this.camera.translateZ(
                        momentumTranslate * (-cameraRotation - Math.PI / 2),
                    )

                    break
                case 'KeyS':
                case 'ArrowDown':
                    this.camera.translateY(-momentumTranslate * -cameraRotation)
                    this.camera.translateZ(
                        -momentumTranslate * (-cameraRotation - Math.PI / 2),
                    )
                    break
                case 'KeyD':
                case 'ArrowRight':
                    this.camera.translateX(momentumTranslate)
                    break
                case 'KeyA':
                case 'ArrowLeft':
                    this.camera.translateX(-momentumTranslate)
                    break
                case 'KeyQ':
                    this.rotateCameraY(-momentum)
                    break
                case 'KeyE':
                    this.rotateCameraY(momentum)
                    break
                case 'KeyZ':
                    this.rotateCameraX(momentum)
                    break
                case 'KeyX':
                    this.rotateCameraX(-momentum)
                    break
                default:
            }
        })
    }

    private getMomentum(now: number, start: number, deltaTime: number) {
        const duration = now - start
        // increase momentum if key pressed longer
        let momentum = Math.sqrt(duration + 800) * 0.01
        // adjust for actual time passed
        return (momentum * deltaTime) / 0.016
    }

    private rotateCameraY(momentum: number) {
        const quat = new Quaternion()
        const v3 = new Vector3(0, 1, 0)

        quat.setFromAxisAngle(v3, momentum * 0.1)
        this.camera.applyQuaternion(quat)
        this.camera.translateX(
            ((momentum * this.camera.position.y) / 8) *
                (this.camera.rotation.x + Math.PI / 2),
        )

        // Clamp the Y position to stay within limits while preserving rotation
        this.camera.position.y = Math.max(
            config.camera.minHeight,
            Math.min(config.camera.maxHeight, this.camera.position.y),
        )
    }

    private rotateCameraX(momentum: number) {
        this.camera.rotateX(momentum * 0.1)
        this.camera.translateY((-momentum * this.camera.position.y) / 8)

        // Clamp the Y position to stay within limits while preserving rotation
        this.camera.position.y = Math.max(
            config.camera.minHeight,
            Math.min(config.camera.maxHeight, this.camera.position.y),
        )
    }

    private orbitalControls() {
        const controls = new OrbitControls(this.camera, this.domElement)
        this.controls = controls

        controls.enableZoom = false
        controls.mouseButtons = {
            LEFT: undefined as any,
            MIDDLE: MOUSE.ROTATE,
            RIGHT: MOUSE.PAN,
        }
    }

    private handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') return
        if (!this.keyPressed[event.code]) {
            this.keyPressed[event.code] = new Date().getTime()
        }
    }

    private handleKeyUp = (event: KeyboardEvent) => {
        delete this.keyPressed[event.code]
    }

    private handleWheel = (event: WheelEvent) => {
        event.preventDefault()

        const bounds = this.domElement.getBoundingClientRect()
        const deltaMode = event.deltaMode
        const scale =
            deltaMode === WheelEvent.DOM_DELTA_LINE
                ? 16
                : deltaMode === WheelEvent.DOM_DELTA_PAGE
                  ? bounds.height
                  : 1
        const deltaY = event.deltaY * scale

        // Browsers can report trackpad scroll and mouse wheel input identically.
        if (config.camera.scrollToPan && !event.ctrlKey && !event.metaKey) {
            this.scrollMovement
                .set(event.deltaX * scale, 0, deltaY)
                .applyAxisAngle(UP, this.camera.rotation.y)
                .multiplyScalar(SCROLL_PAN_SPEED)
            this.camera.position.add(this.scrollMovement)
            return
        }

        if (deltaY === 0 || bounds.width === 0 || bounds.height === 0) return

        this.camera.updateMatrixWorld()
        this.wheelPointer.set(
            ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
            1 - ((event.clientY - bounds.top) / bounds.height) * 2,
        )
        this.wheelRay.setFromCamera(this.wheelPointer, this.camera)
        const direction = this.wheelRay.ray.direction
        if (direction.y >= -1e-6) this.camera.getWorldDirection(direction)
        if (direction.y >= -1e-6) return

        const currentHeight = this.camera.position.y
        const distance = (-deltaY / 240) * (1 + currentHeight * 0.02)
        const nextHeight = MathUtils.clamp(
            currentHeight + direction.y * distance,
            config.camera.minHeight,
            config.camera.maxHeight,
        )
        this.camera.position.addScaledVector(
            direction,
            (nextHeight - currentHeight) / direction.y,
        )
    }
}
