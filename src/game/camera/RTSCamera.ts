import { config } from '+config'
import { ClockInfo, Renderable } from '+game/types'
import { MOUSE, PerspectiveCamera, Quaternion, Vector3 } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const fov = 60
const far = 200
const near = 0.1

export class RTSCamera implements Renderable {
    public camera = new PerspectiveCamera(
        fov,
        window.innerWidth / window.innerHeight,
        near,
        far,
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
        window.addEventListener('keydown', this.handleKeyDown)
        window.addEventListener('keyup', this.handleKeyUp)
        window.addEventListener('wheel', this.handleWheel)
    }

    public render({ deltaTime }: ClockInfo) {
        const now = new Date().getTime()

        Object.entries(this.keyPressed).forEach(([key, start]) => {
            const duration = now - start
            // increase momentum if key pressed longer
            let speedBustByDistance = this.camera.position.y / 100
            let momentum = Math.sqrt(duration + 800) * 0.01
            // adjust for actual time passed
            momentum = (momentum * deltaTime) / 0.016
            let momentumTranslate = momentum + speedBustByDistance

            let q = new Quaternion()
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
                case 'e':
                    q.setFromAxisAngle(new Vector3(0, 1, 0), -momentum * 0.1)
                    this.camera.applyQuaternion(q)
                    this.camera.translateX(-momentumTranslate)
                    break
                case 'q':
                    q.setFromAxisAngle(new Vector3(0, 1, 0), momentum * 0.1)
                    this.camera.applyQuaternion(q)
                    this.camera.translateX(momentumTranslate)
                    break
                default:
            }
        })
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
            delta -= this.camera.position.z * 0.01
        } else {
            delta += this.camera.position.z * 0.01
        }

        this.camera.translateZ(delta)
    }
}
