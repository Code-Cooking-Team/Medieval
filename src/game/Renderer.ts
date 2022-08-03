import { config } from '+config'

import Stats from 'stats.js'
import {
    Clock,
    NoToneMapping,
    PCFSoftShadowMap,
    ReinhardToneMapping,
    Scene,
    sRGBEncoding,
    Vector2,
    WebGLRenderer,
} from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'

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
        logarithmicDepthBuffer: true,
    })

    private composer = new EffectComposer(this.webGLRenderer)
    private outlinePass?: OutlinePass
    private FXAAPass?: any
    private GammaCorrectionPass?: any

    public rtsCamera = new RTSCamera(this.webGLRenderer.domElement)
    public scene = new Scene()

    private clock = new Clock()
    private ground: GroundRenderer
    private environment: EnvironmentRenderer
    private water: WaterRenderer

    private basicRendererList: BasicRenderer[] = []
    private actorRendererList: ActorRenderer<Actor>[] = []

    constructor(
        public game: Game,
        public player: HumanPlayer,
        public rootEl: HTMLElement,
    ) {
        // Better visual but don't work with composer
        this.webGLRenderer.outputEncoding = sRGBEncoding
        this.webGLRenderer.toneMapping = NoToneMapping
        this.webGLRenderer.toneMappingExposure = 10

        this.webGLRenderer.toneMapping = ReinhardToneMapping
        this.webGLRenderer.toneMappingExposure = Math.pow(
            config.postProcessing.exposure,
            4.0,
        )

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
        if (config.postProcessing.postprocessingEnable) this.addComposerPasses()

        this.rootEl.append(this.webGLRenderer.domElement)

        stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
        this.rootEl.append(stats.dom)

        this.loadRenderers()
        this.rtsCamera.init()
        this.ground.init()
        this.animate()

        this.resize()
        window.addEventListener('resize', this.resize)

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

        cancelAnimationFrame(this.raf)
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

    private getSelectedGroupList() {
        return this.actorRendererList.flatMap((renderer) => renderer.getSelectedGroups())
    }

    private addComposerPasses() {
        const camera = this.rtsCamera.camera

        const renderPass = new RenderPass(this.scene, camera)

        // OUTLINE
        if (config.postProcessing.outlineEnable) {
            const outlineParams = {
                edgeStrength: config.postProcessing.outlineEdgeStrength,
                edgeGlow: config.postProcessing.outlineEdgeGlow,
                edgeThickness: config.postProcessing.outlineEdgeThickness,
                pulsePeriod: config.postProcessing.outlinePulsePeriod,
            }
            this.outlinePass = new OutlinePass(
                new Vector2(window.innerWidth, window.innerHeight),
                this.scene,
                camera,
            )
            this.outlinePass.edgeStrength = outlineParams.edgeStrength
            this.outlinePass.edgeGlow = outlineParams.edgeGlow
            this.outlinePass.edgeThickness = outlineParams.edgeThickness
            this.outlinePass.pulsePeriod = outlineParams.pulsePeriod
            this.outlinePass.visibleEdgeColor.set(0x5eff64)
            this.outlinePass.hiddenEdgeColor.set(0x5eff64)
            this.composer.addPass(renderPass)
            this.composer.addPass(this.outlinePass)
        }

        //BLOOM
        const bloomPassParams = {
            bloomStrength: config.postProcessing.bloomStrength,
            bloomThreshold: config.postProcessing.bloomThreshold,
            bloomRadius: config.postProcessing.bloomRadius,
        }
        if (config.postProcessing.bloom) {
            const bloomPass = new UnrealBloomPass(
                new Vector2(window.innerWidth, window.innerHeight),
                1.5,
                0.4,
                0.85,
            )
            bloomPass.threshold = bloomPassParams.bloomThreshold
            bloomPass.strength = bloomPassParams.bloomStrength
            bloomPass.radius = bloomPassParams.bloomRadius
            this.composer.addPass(bloomPass)
        }

        // FXAA
        if (config.postProcessing.FXAAEnable) {
            this.FXAAPass = new ShaderPass(FXAAShader)
            this.composer.addPass(this.FXAAPass)
        }

        // FXAA
        if (config.postProcessing.GammaCorrectionShader) {
            this.GammaCorrectionPass = new ShaderPass(GammaCorrectionShader)
            this.composer.addPass(this.GammaCorrectionPass)
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
        this.rtsCamera.camera.aspect = window.innerWidth / window.innerHeight
        this.rtsCamera.camera.updateProjectionMatrix()

        const pixelRatio = window.devicePixelRatio
        this.webGLRenderer.setPixelRatio(window.devicePixelRatio * pixelRatio)
        this.webGLRenderer.setSize(window.innerWidth, window.innerHeight)

        if (config.postProcessing.postprocessingEnable) {
            this.composer.setSize(window.innerWidth, window.innerHeight)
            this.composer.setPixelRatio(window.devicePixelRatio)
        }

        if (this.FXAAPass) {
            this.FXAAPass.material.uniforms.resolution.value.x =
                1 / (window.innerWidth * window.devicePixelRatio)

            this.FXAAPass.material.uniforms.resolution.value.y =
                1 / (window.innerHeight * window.devicePixelRatio)
        }
    }

    private raf: any

    private animate = () => {
        stats.begin()
        this.render()
        stats.end()
        this.raf = requestAnimationFrame(this.animate)
    }

    private render() {
        const deltaTime = this.clock.getDelta()
        const elapsedTime = this.clock.elapsedTime
        const clockInfo: ClockInfo = { deltaTime, elapsedTime }

        this.basicRendererList.forEach((renderer) => renderer.render(clockInfo))
        this.actorRendererList.forEach((renderer) => renderer.render(clockInfo))

        this.rtsCamera.render(clockInfo)

        if (config.postProcessing.postprocessingEnable) {
            this.composer.render()
        } else {
            this.webGLRenderer.render(this.scene, this.rtsCamera.camera)
        }
    }
}
