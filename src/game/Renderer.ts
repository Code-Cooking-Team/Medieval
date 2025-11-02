import { config } from '+config'

import {
    BloomEffect,
    DepthOfFieldEffect,
    EffectComposer,
    EffectPass,
    OutlineEffect,
    RenderPass,
    ToneMappingEffect,
    ToneMappingMode,
} from 'postprocessing'
import Stats from 'stats.js'
import {
    Clock,
    Mesh,
    PCFSoftShadowMap,
    Raycaster,
    ReinhardToneMapping,
    Scene,
    Vector2,
    Vector3,
    WebGLRenderer,
} from 'three'

import { actorRenderers, basicRenderers } from './actors'
import { Actor } from './core/Actor'
import { ActorLike } from './core/ActorLike'
import { RTSCamera } from './core/RTSCamera'
import { GameLike } from './GameLike'
import { HumanPlayer } from './player/HumanPlayer'
import { EnvironmentRenderer } from './renderer/EnvironmentRenderer'
import { GroundRenderer } from './renderer/GroundRenderer'
import { ActorRenderer } from './renderer/lib/ActorRenderer'
import { BasicRenderer } from './renderer/lib/BasicRenderer'
import { WaterRenderer } from './renderer/WaterRenderer'
import { ClockInfo } from './types'

const stats = new Stats()

export class Renderer {
    public webGLRenderer = new WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        // logarithmicDepthBuffer: true, // TODO needed? (-20 fps)
    })

    private composer = new EffectComposer(this.webGLRenderer)
    private outlineEffect?: OutlineEffect
    private bloomEffect?: BloomEffect
    private depthOfFieldEffect?: DepthOfFieldEffect

    private raycaster = new Raycaster()
    private smoothFocusTarget = new Vector3()
    private currentFocusTarget = new Vector3()

    public rtsCamera = new RTSCamera(this.webGLRenderer.domElement)
    public scene = new Scene()

    private clock = new Clock()
    private ground: GroundRenderer
    private environment: EnvironmentRenderer
    private water: WaterRenderer

    private basicRendererList: BasicRenderer[] = []
    private actorRendererList: ActorRenderer<Actor>[] = []

    private isWindowFocused = window.document.hasFocus()

    constructor(
        public game: GameLike,
        public player: HumanPlayer,
        public rootEl: HTMLElement,
    ) {
        this.webGLRenderer.toneMapping = ReinhardToneMapping
        // this.webGLRenderer.toneMapping = ACESFilmicToneMapping
        this.webGLRenderer.toneMappingExposure = config.renderer.exposure * 2.2

        this.webGLRenderer.shadowMap.enabled = true
        this.webGLRenderer.shadowMap.type = PCFSoftShadowMap
        this.webGLRenderer.xr.enabled = true

        this.environment = new EnvironmentRenderer(
            this.game,
            this.scene,
            this.rtsCamera.camera,
        )

        this.ground = new GroundRenderer(this.game)
        this.water = new WaterRenderer(this.game)
    }

    public init() {
        if (config.postProcessing.postprocessingEnabled) this.addComposerPasses()

        this.rootEl.append(this.webGLRenderer.domElement)

        stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
        this.rootEl.append(stats.dom)

        this.loadRenderers()
        this.rtsCamera.init()
        this.ground.init()
        this.animate()

        this.resize()
        window.addEventListener('resize', this.resize)
        window.addEventListener('focus', this.handleWindowFocus)
        window.addEventListener('blur', this.handleWindowBlur)

        this.player.emitter.on(
            ['selectActors', 'unselectActors'],
            this.handleSelectChange,
        )

        const anyWindow = window as any

        anyWindow.logStats = () => {
            console.log('Device pixel ratio', window.devicePixelRatio)
            console.log('Scene polycount:', this.webGLRenderer.info.render.triangles)
            console.log('Active drawcalls:', this.webGLRenderer.info.render.calls)
            console.log('Textures in Memory', this.webGLRenderer.info.memory.textures)
            console.log('Geometries in Memory', this.webGLRenderer.info.memory.geometries)
        }
    }

    public destroy() {
        this.player.emitter.off(
            ['selectActors', 'unselectActors'],
            this.handleSelectChange,
        )

        this.actorRendererList.forEach((renderer) => {
            renderer.destroy()
        })

        // TODO fix "WARNING: Too many active WebGL contexts three"
        this.webGLRenderer.dispose() // TODO needed?

        this.rootEl.removeChild(this.webGLRenderer.domElement)
        this.rootEl.removeChild(stats.dom)

        window.removeEventListener('resize', this.resize)
        window.removeEventListener('focus', this.handleWindowFocus)
        window.removeEventListener('blur', this.handleWindowBlur)

        if (this.throttledTimeoutId) {
            window.clearTimeout(this.throttledTimeoutId)
        }
        if (this.rafId) {
            window.cancelAnimationFrame(this.rafId)
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

    private handleSelectChange = () => {
        if (this.outlineEffect) {
            // OutlineEffect uses a selection property to set selected objects
            // We need to collect all meshes from selected groups, as OutlineEffect
            // works best with Mesh objects that have geometry
            const selectedGroups = this.getSelectedGroupList()
            this.outlineEffect.selection.clear()

            selectedGroups.forEach((group) => {
                // Add the group itself (OutlineEffect can traverse it)
                this.outlineEffect?.selection.add(group)

                // Also collect and add all meshes within the group
                group.traverse((child) => {
                    if (child instanceof Mesh) {
                        this.outlineEffect?.selection.add(child)
                    }
                })
            })
        }
    }

    private handleWindowFocus = () => {
        this.isWindowFocused = true
        if (this.throttledTimeoutId) {
            window.clearTimeout(this.throttledTimeoutId)
            this.throttledTimeoutId = null
        }
        // Resume normal animation loop
        this.animate()
    }

    private handleWindowBlur = () => {
        this.isWindowFocused = false
        // Cancel the normal animation loop
        if (this.rafId) {
            window.cancelAnimationFrame(this.rafId)
            this.rafId = null
        }
        // Start throttled rendering
        this.throttledAnimate()
    }

    private getSelectedGroupList() {
        return this.actorRendererList.flatMap((renderer) => renderer.getSelectedGroups())
    }

    private addComposerPasses() {
        const width = window.innerWidth
        const height = window.innerHeight
        const camera = this.rtsCamera.camera

        const renderPass = new RenderPass(this.scene, camera)
        this.composer.addPass(renderPass)

        // Outline
        if (config.postProcessing.outlineEnabled) {
            this.outlineEffect = new OutlineEffect(this.scene, camera, {
                edgeStrength: config.postProcessing.outlineEdgeStrength,
                visibleEdgeColor: 0x5eff64,
                hiddenEdgeColor: 0x5eff64,
            })
        }

        // Bloom
        if (config.postProcessing.bloomEnabled) {
            this.bloomEffect = new BloomEffect({
                intensity: config.postProcessing.bloomStrength,
                luminanceThreshold: config.postProcessing.bloomThreshold,
                luminanceSmoothing: 1,
                radius: config.postProcessing.bloomRadius,
            })
        }

        // Depth of Field (Bokeh)
        if (config.postProcessing.bokehEnable) {
            this.depthOfFieldEffect = new DepthOfFieldEffect(camera, {
                // focusRange: 0.5,
                // focusDistance: 0.02,
                focalLength: 0.03,
                bokehScale: 10,
            })

            // Initialize smooth focus target to a point in front of camera
            const initialForward = new Vector3()
            camera.getWorldDirection(initialForward)
            this.smoothFocusTarget.copy(camera.position)
            this.smoothFocusTarget.add(initialForward.multiplyScalar(10))
            this.currentFocusTarget.copy(this.smoothFocusTarget)
        }

        // Combine effects into a single pass
        const effects = []
        if (this.bloomEffect) effects.push(this.bloomEffect)
        if (this.depthOfFieldEffect) effects.push(this.depthOfFieldEffect)
        if (this.outlineEffect) effects.push(this.outlineEffect)

        // Tone mapping effect wrapped in EffectPass
        const toneMappingEffect = new ToneMappingEffect({
            mode: ToneMappingMode.REINHARD,
        })
        effects.push(toneMappingEffect)

        if (effects.length > 0) {
            const effectPass = new EffectPass(camera, ...effects)
            this.composer.addPass(effectPass)
        }
    }

    private loadRenderers() {
        this.addBasicRenderer(this.ground, false)
        this.addBasicRenderer(this.environment)
        this.addBasicRenderer(this.water)

        basicRenderers.forEach((BasicRenderer) => {
            this.addBasicRenderer(new BasicRenderer(this.game))
        })

        actorRenderers.forEach((ActorRenderer) => {
            const renderer = new ActorRenderer(this.game, this.player)
            this.addActorRenderer(renderer)
            renderer.init()
        })
    }

    private addBasicRenderer(renderer: BasicRenderer, addToRenderList = true) {
        this.centerRenderer(renderer)
        if (addToRenderList) {
            this.basicRendererList.push(renderer)
        }
        this.scene.add(renderer.group)
    }

    private addActorRenderer(renderer: ActorRenderer<Actor>) {
        this.centerRenderer(renderer)
        this.actorRendererList.push(renderer)
        this.scene.add(renderer.group)
    }

    private centerRenderer(renderer: BasicRenderer) {
        const [width, height] = this.game.world.getRealSize()
        renderer.group.position.x = -width / 2
        renderer.group.position.z = -height / 2
    }

    private resize = () => {
        const width = window.innerWidth
        const height = window.innerHeight
        const aspect = width / height
        const pixelRatio = window.devicePixelRatio

        this.rtsCamera.camera.aspect = aspect
        this.rtsCamera.camera.updateProjectionMatrix()

        this.webGLRenderer.setPixelRatio(pixelRatio)
        this.webGLRenderer.setSize(width, height)

        if (config.postProcessing.postprocessingEnabled) {
            this.composer.setSize(width, height)
        }
    }

    private rafId: number | null = null
    private animate = () => {
        if (!this.isWindowFocused) {
            return
        }
        stats.begin()
        this.render()
        stats.end()
        this.rafId = window.requestAnimationFrame(this.animate)
    }

    private throttledTimeoutId: number | null = null
    private throttledAnimate = () => {
        if (this.isWindowFocused) {
            return
        }
        stats.begin()
        this.render()
        stats.end()

        const frameTime = 1000 / config.core.unfocusedFpsLimit
        this.throttledTimeoutId = window.setTimeout(this.throttledAnimate, frameTime)
    }

    private render() {
        const deltaTime = this.clock.getDelta()
        const elapsedTime = this.clock.elapsedTime
        const clockInfo: ClockInfo = { deltaTime, elapsedTime }

        this.basicRendererList.forEach((renderer) => renderer.render(clockInfo))
        this.actorRendererList.forEach((renderer) => renderer.render(clockInfo))

        this.rtsCamera.render(clockInfo)

        if (config.postProcessing.postprocessingEnabled) {
            // Auto-focus using raycast from center of screen
            if (this.depthOfFieldEffect) {
                // Cast ray from center of screen
                const centerScreen = new Vector2(0, 0)
                this.raycaster.setFromCamera(centerScreen, this.rtsCamera.camera)

                // Get all objects that can be hit
                const raycastObjects = [
                    ...this.getGroundChildren(),
                    ...this.getInteractionObjectList(),
                ]

                // Find intersection
                const intersects = this.raycaster.intersectObjects(raycastObjects, false)
                const hitPoint = intersects[0]?.point

                if (hitPoint) {
                    // Update current target to hit point
                    this.currentFocusTarget.copy(hitPoint)
                }

                // Smoothly interpolate towards current target
                // Adjust lerp speed (0.1 = smooth, 0.3 = faster, 0.05 = slower)
                const lerpSpeed = 0.15
                this.smoothFocusTarget.lerp(this.currentFocusTarget, lerpSpeed)

                // Set the smooth target to depth of field effect
                this.depthOfFieldEffect.target = this.smoothFocusTarget.clone()
            }
            this.composer.render()
        } else {
            this.webGLRenderer.render(this.scene, this.rtsCamera.camera)
        }
    }
}
