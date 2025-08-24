import { config } from '+config'
import { ClockInfo, Renderable } from '+game/types'
import { normalizeEventKeyName } from '+helpers'

import { MOUSE, PerspectiveCamera, Quaternion, Vector3 } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const CAMERA_SPEED = config.renderer.tileSize * 2

export class RTSCamera implements Renderable {
    public camera = new PerspectiveCamera(
        config.camera.fov,
        window.innerWidth / window.innerHeight,
        config.camera.near,
        config.camera.far,
    )

    private keyPressed: { [key: string]: number } = {}

    constructor(private domElement: HTMLElement) {
        this.camera.position.x = 0
        this.camera.position.y = 5
        this.camera.position.z = 5

        this.camera.rotation.x = -Math.PI / 3
        this.camera.rotation.order = 'YXZ'
    }

    public init() {
        if (config.core.orbitalControls) this.orbitalControls()
        window.document.addEventListener('keydown', this.handleKeyDown)
        window.document.addEventListener('keyup', this.handleKeyUp)
        this.domElement.addEventListener('wheel', this.handleWheel)
    }

    public render({ deltaTime }: ClockInfo) {
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

        controls.enableZoom = false
        controls.mouseButtons = {
            LEFT: undefined as any,
            MIDDLE: MOUSE.ROTATE,
            RIGHT: MOUSE.PAN,
        }
        controls.center
    }

    private handleKeyDown = (event: KeyboardEvent) => {
        if (!this.keyPressed[event.code]) {
            this.keyPressed[event.code] = new Date().getTime()
        }
    }

    private handleKeyUp = (event: KeyboardEvent) => {
        delete this.keyPressed[event.code]
    }

    private handleWheel = (event: WheelEvent) => {
        let delta = (event as any).wheelDelta

        delta = delta / 240
        delta = -delta

        if (delta <= 0) {
            delta -= this.camera.position.y * 0.01
        } else {
            delta += this.camera.position.y * 0.01
        }

        // Calculate where the camera would move
        const direction = new Vector3(0, 0, 1)
        direction.applyQuaternion(this.camera.quaternion)
        const potentialNewPosition = this.camera.position.clone()
        potentialNewPosition.add(direction.multiplyScalar(delta))

        // Check if the movement would violate height limits
        const wouldExceedLimits =
            potentialNewPosition.y < config.camera.minHeight ||
            potentialNewPosition.y > config.camera.maxHeight

        // Only apply the translation if it stays within limits
        if (!wouldExceedLimits) {
            this.camera.translateZ(delta)
        }
    }
}
