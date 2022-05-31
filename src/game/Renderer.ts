import { config } from '+config'
import Stats from 'stats.js'
import {
    AmbientLight,
    Clock,
    Color,
    DirectionalLight,
    Fog,
    LineStrip,
    MOUSE,
    PCFSoftShadowMap,
    PerspectiveCamera,
    PointLight,
    Raycaster,
    Scene,
    Vector2,
    WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Game } from './Game'
import { GroundRenderer } from './renderer/GroundRenderer'
import { ItemRenderer } from './renderer/lib/ItemRenderer'
import { LumberjackCabinRenderer } from './renderer/LumberjackCabinRenderer'
import { LumberjackRenderer } from './renderer/LumberjackRenderer'
import { TreeRenderer } from './renderer/TreeRenderer'
import { WaterRenderer } from './renderer/WaterRenderer'
import { Position } from './types'

const fov = 60
const far = 10000
const near = 0.1

const stats = new Stats()

export class Renderer {
    private webGLRenderer = new WebGLRenderer({ antialias: true })

    private clock = new Clock()
    private scene = new Scene()
    private ground?: GroundRenderer
    private sun: DirectionalLight
    private ambient: AmbientLight

    private camera = new PerspectiveCamera(
        fov,
        window.innerWidth / window.innerHeight,
        near,
        far,
    )

    private rendererList: ItemRenderer[] = []

    constructor(public game: Game) {
        this.webGLRenderer.setPixelRatio(window.devicePixelRatio)
        this.webGLRenderer.setSize(window.innerWidth, window.innerHeight)

        this.webGLRenderer.shadowMap.enabled = true
        this.webGLRenderer.shadowMap.type = PCFSoftShadowMap

        this.camera.position.x = 0
        this.camera.position.y = 25
        this.camera.position.z = 25
        this.scene.background = new Color(0xb5fffb)

        const fog = new Fog(new Color(0xb5fffb), 0, 150)
        this.scene.fog = fog

        this.sun = new DirectionalLight(0xffffbb, 0.7)
        this.sun.castShadow = true
        this.sun.shadow.mapSize.width = 128 * 10
        this.sun.shadow.mapSize.height = 128 * 10
        this.sun.shadow.camera.near = 0.5
        this.sun.shadow.camera.far = 200
        this.sun.shadow.camera.left = -100
        this.sun.shadow.camera.right = 100
        this.sun.shadow.camera.top = 100
        this.sun.shadow.camera.bottom = -100

        this.sun.position.set(4, 10, 1)

        this.scene.add(this.sun)

        this.ambient = new AmbientLight(0x404040, 2)
        this.scene.add(this.ambient)

        this.createGround()
    }

    public addRenderer(renderer: ItemRenderer) {
        const [width, height] = this.game.word.getSize()

        renderer.group.position.x = (-width / 2) * config.renderer.tileSize
        renderer.group.position.z = (-height / 2) * config.renderer.tileSize

        this.rendererList.push(renderer)
        this.scene.add(renderer.group)
    }

    public createGround() {
        this.ground = new GroundRenderer(this.game)
        this.addRenderer(this.ground)
        this.addRenderer(new WaterRenderer(this.game))
        this.addRenderer(new TreeRenderer(this.game))
        this.addRenderer(new LumberjackCabinRenderer(this.game))
        this.addRenderer(new LumberjackRenderer(this.game))
    }

    public findPositionByMouseEvent = (event: MouseEvent): Position | undefined => {
        const rayCaster = new Raycaster()
        const pointer = new Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
        )
        rayCaster.setFromCamera(pointer, this.camera)

        const intersects = rayCaster.intersectObjects(this.ground!.group.children)
        const intersectPoint = intersects[0]?.point

        if (!intersectPoint) return

        const [width, height] = this.game.word
            .getSize()
            .map((v) => v * config.renderer.tileSize)

        const x = Math.round((intersectPoint.x + width / 2) / config.renderer.tileSize)
        const y = Math.round((intersectPoint.z + height / 2) / config.renderer.tileSize)

        return [x, y]
    }

    public init(el: HTMLElement) {
        el.append(this.webGLRenderer.domElement)

        const controls = new OrbitControls(this.camera, this.webGLRenderer.domElement)
        controls.enableZoom = true
        controls.mouseButtons = {
            LEFT: undefined as any,
            MIDDLE: MOUSE.ROTATE,
            RIGHT: MOUSE.PAN,
        }

        stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
        el.append(stats.dom)

        this.animate()
    }

    private animate = () => {
        stats.begin()
        this.render()
        stats.end()
        requestAnimationFrame(this.animate)
    }

    private upDateSun = () => {
        const time =
            (this.clock.getElapsedTime() + config.renderer.dayAndNightTimeStart) /
            config.renderer.dayAndNightTimeScale

        this.sun.position.x = Math.sin(time * 1) * 10
        this.sun.position.y = Math.cos(time * 1) * 10
        this.sun.position.z = Math.cos(time * 1) * 10

        this.sun.color.setHSL(
            10 + Math.sin(time * 1) * 0.1,
            Math.sin(time * 1),
            Math.sin(time * 1 + 1.9) * 0.5 + 0.12,
        )

        this.ambient.color.setHSL(
            10 + Math.sin(time * 1) * 0.1,
            Math.sin(time * 1),
            (Math.sin(time * 1 + 1.9) * 0.5 + 0.6) / 4,
        )
        const backgroundColor = new Color().setHSL(
            10 + Math.sin(time * 1) * 0.1,
            Math.sin(time * 1),
            Math.sin(time * 1 + 1.9) * 0.4 + 0.5,
        )
        this.scene.background = backgroundColor

        const fogColor = new Color().setHSL(
            10 + Math.sin(time * 1) * 0.1,
            Math.sin(time * 1),
            Math.sin(time * 1 + 1.9) * 0.3 + 0.7,
        )
        this.scene.fog = new Fog(fogColor, 0, Math.sin(time * 1) + 0.5 * 50 + 200)
    }

    private render() {
        this.rendererList.forEach((renderer) => renderer.render(this.clock))
        this.webGLRenderer.render(this.scene, this.camera)

        if (config.renderer.dayAndNightMode) this.upDateSun()
    }
}
