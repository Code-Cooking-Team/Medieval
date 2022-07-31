import { config } from '+config'
import { ClockInfo, Renderable } from '+game/types'

import { MOUSE, PerspectiveCamera, Quaternion, Vector3 } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export class RTSCamera implements Renderable {
    public camera = new PerspectiveCamera(
        config.core.cameraFov,
        window.innerWidth / window.innerHeight,
        config.core.cameraNear,
        config.core.cameraFar,
    )

    private keyPressed: { [key: string]: number } = {}

    constructor(private domElement: HTMLElement) {
        this.camera.position.x = 0
        this.camera.position.y = 25
        this.camera.position.z = 25

        this.camera.rotation.x = -Math.PI / 3
    }

    public init() {
        if (config.core.orbitalControls) this.orbitalControls()
        window.document.addEventListener('keydown', this.handleKeyDown)
        window.document.addEventListener('keyup', this.handleKeyUp)
        this.domElement.addEventListener('wheel', this.handleWheel)
    }

    public render({ deltaTime }: ClockInfo) {
        const now = new Date().getTime()

        Object.entries(this.keyPressed).forEach(([key, start]) => {
            const momentum = this.getMomentum(now, start, deltaTime)
            const zoomOutBust = this.camera.position.y / 100
            const momentumTranslate = momentum + zoomOutBust

            switch (key) {
                case 'w':
                    this.camera.translateY(momentumTranslate / 1.5)
                    this.camera.translateZ(-momentumTranslate / 3)
                    break
                case 's':
                    this.camera.translateY(-momentumTranslate / 1.5)
                    this.camera.translateZ(momentumTranslate / 3)
                    break
                case 'd':
                    this.camera.translateX(momentumTranslate)
                    break
                case 'a':
                    this.camera.translateX(-momentumTranslate)
                    break
                case 'q':
                    this.rotateCamera(-momentum)
                    break
                case 'e':
                    this.rotateCamera(momentum)
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

    private rotateCamera(momentum: number) {
        const quat = new Quaternion()
        const v3 = new Vector3(0, 1, 0)

        quat.setFromAxisAngle(v3, momentum * 0.1)
        this.camera.applyQuaternion(quat)
        this.camera.translateX(momentum)
    }

    private orbitalControls() {
        const controls = new OrbitControls(this.camera, this.domElement)

        controls.enableZoom = true
        controls.mouseButtons = {
            LEFT: undefined as any,
            MIDDLE: MOUSE.ROTATE,
            RIGHT: MOUSE.PAN,
        }
    }

    private handleKeyDown = (event: KeyboardEvent) => {
        if (!this.keyPressed[event.key]) {
            this.keyPressed[event.key] = new Date().getTime()
        }
    }

    private handleKeyUp = (event: KeyboardEvent) => {
        delete this.keyPressed[event.key]
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

        this.camera.translateZ(delta)
    }
}
