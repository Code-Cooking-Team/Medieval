import { config } from '+config'
import Stats from 'stats.js'
import {
    AmbientLight,
    Clock,
    Color,
    DirectionalLight,
    Fog,
    PCFSoftShadowMap,
    Raycaster,
    Scene,
    Vector2,
    WebGLRenderer,
} from 'three'
import { LumberjackCabinRenderer } from './actors/lumberjack/LumberjackCabinRenderer'
import { LumberjackRenderer } from './actors/lumberjack/LumberjackRenderer'
import { TreeRenderer } from './actors/tree/TreeRenderer'
import { RTSCamera } from './camera/RTSCamera'
import { Game } from './Game'
import { GroundRenderer } from './renderer/GroundRenderer'
import { ItemRenderer } from './renderer/lib/ItemRenderer'
import { WaterRenderer } from './renderer/WaterRenderer'
import { ClockInfo, Position } from './types'

const stats = new Stats()

export class Renderer {
    public webGLRenderer = new WebGLRenderer({ antialias: true })

    private clock = new Clock()
    private scene = new Scene()
    private ground: GroundRenderer
    private sun: DirectionalLight
    private ambient: AmbientLight

    public rtsCamera = new RTSCamera(this.webGLRenderer.domElement)

    private rendererList: ItemRenderer[] = []

    constructor(public game: Game) {
        this.webGLRenderer.setPixelRatio(window.devicePixelRatio)
        this.webGLRenderer.setSize(window.innerWidth, window.innerHeight)

        this.webGLRenderer.shadowMap.enabled = true
        this.webGLRenderer.shadowMap.type = PCFSoftShadowMap
        this.webGLRenderer.xr.enabled = true

        this.scene.background = new Color(0xb5fffb)

        if (config.renderer.fog) {
            const fog = new Fog(new Color(0xb5fffb), 0, 150)
            this.scene.fog = fog
        }

        this.sun = new DirectionalLight(0xffffbb, 0.7)

        if (config.renderer.shadow) {
            this.sun.castShadow = true
            this.sun.shadow.mapSize.width = 128 * 10
            this.sun.shadow.mapSize.height = 128 * 10
            this.sun.shadow.camera.near = 0.5
            this.sun.shadow.camera.far = 200
            this.sun.shadow.camera.left = -100
            this.sun.shadow.camera.right = 100
            this.sun.shadow.camera.top = 100
            this.sun.shadow.camera.bottom = -100
        }

        this.sun.position.set(4, 10, 1)
        this.scene.add(this.sun)

        this.ambient = new AmbientLight(0x404040, 2)
        this.scene.add(this.ambient)

        this.ground = new GroundRenderer(this.game)

        this.addRenderers()
    }

    public addRenderer(renderer: ItemRenderer) {
        const [width, height] = this.game.word.getSize()

        renderer.group.position.x = (-width / 2) * config.renderer.tileSize
        renderer.group.position.z = (-height / 2) * config.renderer.tileSize

        this.rendererList.push(renderer)
        this.scene.add(renderer.group)
    }

    public addRenderers() {
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
        rayCaster.setFromCamera(pointer, this.rtsCamera.camera)

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

        stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
        el.append(stats.dom)

        this.rtsCamera.init()

        this.animate()

        window.addEventListener('resize', this.resize)
    }

    private resize = () => {
        this.rtsCamera.camera.aspect = window.innerWidth / window.innerHeight
        this.rtsCamera.camera.updateProjectionMatrix()
        this.webGLRenderer.setSize(window.innerWidth, window.innerHeight)
    }

    private animate = () => {
        stats.begin()
        this.render()
        stats.end()
        requestAnimationFrame(this.animate)
    }

    private render() {
        const deltaTime = this.clock.getDelta()
        const elapsedTime = this.clock.elapsedTime
        const clockInfo: ClockInfo = { deltaTime, elapsedTime }

        this.rendererList.forEach((renderer) => renderer.render(clockInfo))
        this.rtsCamera.render(clockInfo)
        this.webGLRenderer.render(this.scene, this.rtsCamera.camera)

        if (config.renderer.dayAndNightMode) this.updateSun(clockInfo)
    }

    private updateSun = ({ elapsedTime }: ClockInfo) => {
        const time =
            (elapsedTime + config.renderer.dayAndNightTimeStart) /
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

        if (config.renderer.fog) {
            const fogColor = new Color().setHSL(
                10 + Math.sin(time * 1) * 0.1,
                Math.sin(time * 1),
                Math.sin(time * 1 + 1.9) * 0.3 + 0.7,
            )

            this.scene.fog = new Fog(fogColor, 0, Math.sin(time * 1) + 0.5 * 50 + 200)
        }
    }
}
