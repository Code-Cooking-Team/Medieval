import { config } from '+config'

import { first } from 'lodash'
import Stats from 'stats.js'
import { Clock, PCFSoftShadowMap, Raycaster, Scene, Vector2, WebGLRenderer } from 'three'

import { GuardianActorRenderer } from './actors/guardian/GuardianActorRenderer'
import { LumberjackActorRenderer } from './actors/lumberjack/LumberjackActorRenderer'
import { LumberjackCabinActorRenderer } from './actors/lumberjack/LumberjackCabinActorRenderer'
import { TreeRenderer } from './actors/tree/TreeRenderer'
import { RTSCamera } from './camera/RTSCamera'
import { StaticActor } from './core/StaticActor'
import { WalkableActor } from './core/WalkableActor'
import { Game } from './Game'
import { EnvironmentRenderer } from './renderer/EnvironmentRenderer'
import { GroundRenderer } from './renderer/GroundRenderer'
import { ActorRenderer } from './renderer/lib/ActorRenderer'
import { BasicRenderer } from './renderer/lib/BasicRenderer'
import { WaterRenderer } from './renderer/WaterRenderer'
import { AnyActor, ClockInfo, Position } from './types'

const stats = new Stats()

export class Renderer {
    public webGLRenderer = new WebGLRenderer({ antialias: true })

    private clock = new Clock()
    private scene = new Scene()
    private ground: GroundRenderer
    private environment: EnvironmentRenderer

    public rtsCamera = new RTSCamera(this.webGLRenderer.domElement)

    private basicRendererList: BasicRenderer[] = []
    private actorRendererList: ActorRenderer<AnyActor>[] = []

    constructor(public game: Game) {
        this.webGLRenderer.setPixelRatio(window.devicePixelRatio)
        this.webGLRenderer.setSize(window.innerWidth, window.innerHeight)

        this.webGLRenderer.shadowMap.enabled = true
        this.webGLRenderer.shadowMap.type = PCFSoftShadowMap
        this.webGLRenderer.xr.enabled = true

        this.environment = new EnvironmentRenderer(
            this.game,
            this.scene,
            this.rtsCamera.camera,
        )
        this.ground = new GroundRenderer(this.game)

        this.addRenderers()
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

        const [width, height] = this.game.word.getRealSize()

        const x = Math.round((intersectPoint.x + width / 2) / config.renderer.tileSize)
        const y = Math.round((intersectPoint.z + height / 2) / config.renderer.tileSize)

        return [x, y]
    }

    public selectByMouseEvent = (event: MouseEvent): WalkableActor | StaticActor => {
        const rayCaster = new Raycaster()
        const pointer = new Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
        )
        rayCaster.setFromCamera(pointer, this.rtsCamera.camera)

        const interactionObjectList = this.actorRendererList.flatMap((renderer) =>
            renderer.getInteractionShapes(),
        )

        const intersects = rayCaster.intersectObjects(interactionObjectList, false)
        const intersectObject = first(intersects)
        const actor = intersectObject?.object.userData.actor
        console.log('Selected actor', actor)
        return actor
    }

    public init(el: HTMLElement) {
        el.append(this.webGLRenderer.domElement)

        stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
        el.append(stats.dom)

        this.rtsCamera.init()

        this.animate()

        window.addEventListener('resize', this.resize)
    }

    private addRenderers() {
        this.addBasicRenderer(this.ground)
        this.addBasicRenderer(this.environment)

        this.addBasicRenderer(new WaterRenderer(this.game))
        this.addBasicRenderer(new TreeRenderer(this.game))

        this.addActorRenderer(new LumberjackCabinActorRenderer(this.game))
        this.addActorRenderer(new LumberjackActorRenderer(this.game))

        this.addActorRenderer(new GuardianActorRenderer(this.game))
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
