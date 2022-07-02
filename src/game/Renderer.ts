import Stats from 'stats.js'
import { Clock, Group, Mesh, PCFSoftShadowMap, Scene, WebGLRenderer } from 'three'

import { GuardianActorRenderer } from './actors/guardian/GuardianActorRenderer'
import { HouseActorRenderer } from './actors/house/HouseRenderer'
import { LumberjackActorRenderer } from './actors/lumberjack/LumberjackActorRenderer'
import { LumberjackCabinActorRenderer } from './actors/lumberjack/LumberjackCabinActorRenderer'
import { TreeRenderer } from './actors/tree/TreeRenderer'
import { RTSCamera } from './camera/RTSCamera'
import { Game } from './Game'
import { EnvironmentRenderer } from './renderer/EnvironmentRenderer'
import { GroundRenderer } from './renderer/GroundRenderer'
import { ActorRenderer } from './renderer/lib/ActorRenderer'
import { BasicRenderer } from './renderer/lib/BasicRenderer'
import { WaterRenderer } from './renderer/WaterRenderer'
import { AnyActor, ClockInfo } from './types'

const stats = new Stats()

export class Renderer {
    public webGLRenderer = new WebGLRenderer({ antialias: true })
    public rtsCamera = new RTSCamera(this.webGLRenderer.domElement)
    public scene = new Scene()

    private clock = new Clock()
    private environment: EnvironmentRenderer
    private ground: GroundRenderer

    private basicRendererList: BasicRenderer[] = []
    private actorRendererList: ActorRenderer<AnyActor>[] = []

    constructor(public game: Game, public el: HTMLElement) {
        this.webGLRenderer.setPixelRatio(window.devicePixelRatio)
        this.webGLRenderer.setSize(window.innerWidth, window.innerHeight)

        this.webGLRenderer.shadowMap.enabled = true
        this.webGLRenderer.shadowMap.type = PCFSoftShadowMap
        this.webGLRenderer.xr.enabled = true

        el.append(this.webGLRenderer.domElement)

        stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
        el.append(stats.dom)

        this.environment = new EnvironmentRenderer(
            this.game,
            this.scene,
            this.rtsCamera.camera,
        )
        this.ground = new GroundRenderer(this.game)

        this.addRenderers()
    }

    public init() {
        this.rtsCamera.init()
        this.animate()
        window.addEventListener('resize', this.resize)

        const anyWindow = window as any

        anyWindow.logStats = () => {
            console.log('Scene polycount:', this.webGLRenderer.info.render.triangles)
            console.log('Active Drawcalls:', this.webGLRenderer.info.render.calls)
            console.log('Textures in Memory', this.webGLRenderer.info.memory.textures)
            console.log('Geometries in Memory', this.webGLRenderer.info.memory.geometries)
        }
    }

    public getGroundChildren() {
        return this.ground!.group.children
    }

    public getInteractionObjectList() {
        return this.actorRendererList.flatMap((renderer) =>
            renderer.getInteractionShapes(),
        )
    }

    private addRenderers() {
        this.addBasicRenderer(this.ground)
        this.addBasicRenderer(this.environment)

        this.addBasicRenderer(new WaterRenderer(this.game))
        this.addBasicRenderer(new TreeRenderer(this.game))

        this.addActorRenderer(new LumberjackCabinActorRenderer(this.game))
        this.addActorRenderer(new LumberjackActorRenderer(this.game))

        this.addActorRenderer(new GuardianActorRenderer(this.game))

        this.addActorRenderer(new HouseActorRenderer(this.game))
    }

    private addBasicRenderer(renderer: BasicRenderer) {
        this.centerRenderer(renderer)
        this.basicRendererList.push(renderer)
        this.scene.add(renderer.group)
    }

    private addActorRenderer(renderer: ActorRenderer<AnyActor>) {
        this.centerRenderer(renderer)
        this.actorRendererList.push(renderer)
        this.scene.add(renderer.group)
    }

    private centerRenderer(renderer: BasicRenderer) {
        const [width, height] = this.game.word.getRealSize()
        renderer.group.position.x = -width / 2
        renderer.group.position.z = -height / 2
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

        this.basicRendererList.forEach((renderer) => renderer.render(clockInfo))
        this.actorRendererList.forEach((renderer) => renderer.render(clockInfo))

        this.rtsCamera.render(clockInfo)
        this.webGLRenderer.render(this.scene, this.rtsCamera.camera)
    }
}
