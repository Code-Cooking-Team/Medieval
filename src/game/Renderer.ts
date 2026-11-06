import { config } from '+config'

import Stats from 'stats.js'
import {
    PCFShadowMap,
    ReinhardToneMapping,
    Scene,
    Timer,
    Vector2,
    WebGLRenderer,
} from 'three'
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js'

import { actorRenderers, basicRenderers } from './actors'
import { Actor } from './core/Actor'
import { RTSCamera } from './core/RTSCamera'
import { Game } from './Game'
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
    private outlinePass?: OutlinePass
    private FXAAPass?: ShaderPass
    private bokehPass?: BokehPass

    public rtsCamera = new RTSCamera(this.webGLRenderer.domElement)
    public scene = new Scene()

    private clock = new Timer()
    private ground: GroundRenderer
    private environment: EnvironmentRenderer
    private water: WaterRenderer

    private basicRendererList: BasicRenderer[] = []
    private actorRendererList: ActorRenderer<Actor>[] = []

    private isWindowFocused = window.document.hasFocus()

    constructor(
        public game: Game,
        public player: HumanPlayer,
        public rootEl: HTMLElement,
    ) {
        this.webGLRenderer.toneMapping = ReinhardToneMapping
        this.webGLRenderer.toneMappingExposure = Math.pow(config.renderer.exposure, 4.0)

        this.webGLRenderer.shadowMap.enabled = true
        this.webGLRenderer.shadowMap.type = PCFShadowMap
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
        this.basicRendererList.forEach((renderer) => renderer.destroy?.())
        this.composer.passes.forEach((pass) => pass.dispose())
        this.composer.dispose()
        this.clock.dispose()
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
        if (this.outlinePass) {
            this.outlinePass.selectedObjects = this.getSelectedGroupList()
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

        this.composer.addPass(new RenderPass(this.scene, camera))

        // Outline
        if (config.postProcessing.outlineEnabled) {
            const outlineParams = {
                edgeStrength: config.postProcessing.outlineEdgeStrength,
                edgeGlow: config.postProcessing.outlineEdgeGlow,
                edgeThickness: config.postProcessing.outlineEdgeThickness,
                pulsePeriod: config.postProcessing.outlinePulsePeriod,
            }
            this.outlinePass = new OutlinePass(
                new Vector2(width, height),
                this.scene,
                camera,
            )

            this.outlinePass.edgeStrength = outlineParams.edgeStrength
            this.outlinePass.edgeGlow = outlineParams.edgeGlow
            this.outlinePass.edgeThickness = outlineParams.edgeThickness
            this.outlinePass.pulsePeriod = outlineParams.pulsePeriod
            this.outlinePass.visibleEdgeColor.set(0x5eff64)
            this.outlinePass.hiddenEdgeColor.set(0x5eff64)
            this.composer.addPass(this.outlinePass)
        }

        // Bloom
        if (config.postProcessing.bloomEnabled) {
            const bloomPass = new UnrealBloomPass(
                new Vector2(width, height),
                1.5,
                0.4,
                0.85,
            )
            bloomPass.strength = config.postProcessing.bloomStrength
            bloomPass.threshold = config.postProcessing.bloomThreshold
            bloomPass.radius = config.postProcessing.bloomRadius
            this.composer.addPass(bloomPass)
        }

        // Bokeh
        if (config.postProcessing.bokehEnable) {
            this.bokehPass = new BokehPass(this.scene, camera, {
                focus: 5,
                aperture: config.postProcessing.bokehAperture,
                maxblur: config.postProcessing.bokehMaxBlur,
            })
            this.composer.addPass(this.bokehPass)
        }

        this.composer.addPass(new OutputPass())

        // FXAA
        if (config.postProcessing.FXAAEnabled) {
            this.FXAAPass = new ShaderPass(FXAAShader)
            this.composer.addPass(this.FXAAPass)
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
            this.composer.setPixelRatio(pixelRatio)
        }

        if (this.FXAAPass) {
            this.FXAAPass.uniforms.resolution!.value.x = 1 / (width * pixelRatio)
            this.FXAAPass.uniforms.resolution!.value.y = 1 / (height * pixelRatio)
        }

        if (this.bokehPass) {
            this.bokehPass.setSize(width, height)
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
        this.clock.update()
        const deltaTime = this.clock.getDelta()
        const elapsedTime = this.clock.getElapsed()
        const clockInfo: ClockInfo = { deltaTime, elapsedTime }

        this.basicRendererList.forEach((renderer) => renderer.render(clockInfo))
        this.actorRendererList.forEach((renderer) => renderer.render(clockInfo))

        this.rtsCamera.render(clockInfo)

        if (config.postProcessing.postprocessingEnabled) {
            if (this.bokehPass) {
                const cameraY = this.rtsCamera.camera.position.y
                const cameraRotation =
                    (this.rtsCamera.camera.rotation.x + Math.PI / 2) *
                    1.5 *
                    (cameraY * 0.2)
                const uniform = this.bokehPass.uniforms as any
                uniform.focus.value = cameraY + cameraRotation
                uniform.aperture.value =
                    (10 - cameraY + cameraRotation) *
                    config.postProcessing.bokehAperture *
                    0.2
            }
            this.composer.render()
        } else {
            this.webGLRenderer.render(this.scene, this.rtsCamera.camera)
        }
    }
}
