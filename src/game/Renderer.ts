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

export class Renderer {
    private webGLRenderer = new WebGLRenderer({ antialias: true })
    private clock = new Clock()
    private scene = new Scene()
    private ground?: GroundRenderer

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
        this.ground = new GroundRenderer(this.game)
        this.addRenderer(this.ground)
        this.addRenderer(new WaterRenderer(this.game))
        this.addRenderer(new TreeRenderer(this.game))
        this.addRenderer(new LumberjackCabinRenderer(this.game))
        this.addRenderer(new LumberjackRenderer(this.game))
    }

    public findPositionByMouseEvent = (event: MouseEvent): Position => {
        const rayCaster = new Raycaster()
        const pointer = new Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
        )
        rayCaster.setFromCamera(pointer, this.camera)

        const intersects = rayCaster.intersectObjects(this.ground!.group.children)
        const intersectPoint = intersects[0]?.point

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
