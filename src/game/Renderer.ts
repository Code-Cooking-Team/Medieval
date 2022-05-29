import { config } from '+config'
import { getPositionByIndex } from '+helpers/array'
import { random } from '+helpers/basic'
import { HorizontalPlaneGeometry } from '+helpers/mesh'
import {
    Clock,
    Color,
    DoubleSide,
    Mesh,
    MeshStandardMaterial,
    PerspectiveCamera,
    PointLight,
    Scene,
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

const fov = 60
const far = 10000
const near = 0.1

export class Renderer {
    private webGLRenderer = new WebGLRenderer({ antialias: true })
    private clock = new Clock()
    private scene = new Scene()

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

        this.camera.position.x = 0
        this.camera.position.y = 25
        this.camera.position.z = 25
        this.scene.background = new Color(0xb5fffb)

        const light = new PointLight(0xffffbb, 1, 200)

        light.position.set(1, 10, 2)
        this.scene.add(light)

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
        this.addRenderer(new WaterRenderer(this.game))
        this.addRenderer(new GroundRenderer(this.game))
        this.addRenderer(new TreeRenderer(this.game))
        this.addRenderer(new LumberjackCabinRenderer(this.game))
        this.addRenderer(new LumberjackRenderer(this.game))
    }

    public init(el: HTMLElement) {
        el.append(this.webGLRenderer.domElement)

        const controls = new OrbitControls(this.camera, this.webGLRenderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.25
        controls.enableZoom = true

        this.animate()
    }

    private animate = () => {
        requestAnimationFrame(this.animate)
        this.render()
    }

    private render() {
        this.rendererList.forEach((renderer) => renderer.render(this.clock))
        this.webGLRenderer.render(this.scene, this.camera)
    }
}
