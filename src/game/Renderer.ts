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
// Post processing
import { EffectComposer, Pass } from 'three/examples/jsm/postprocessing/EffectComposer'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader'

import { actorRenderers, basicRenderers } from './actors'
import { Actor } from './core/Actor'
import { RTSCamera } from './core/RTSCamera'
import { Game } from './Game'
import { EnvironmentRenderer } from './renderer/EnvironmentRenderer'
import { GroundRenderer } from './renderer/GroundRenderer'
import { ActorRenderer } from './renderer/lib/ActorRenderer'
import { BasicRenderer } from './renderer/lib/BasicRenderer'
import { WaterRenderer } from './renderer/WaterRenderer'
import { ActorType, ClockInfo } from './types'

const stats = new Stats()

export class Renderer {
    public webGLRenderer = new WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        logarithmicDepthBuffer: true,
    })

    public composer = new EffectComposer(this.webGLRenderer)
    public outlinePass?: OutlinePass
    public FXAAPass?: any

    public rtsCamera = new RTSCamera(this.webGLRenderer.domElement)
    public scene = new Scene()

    private clock = new Clock()
    private ground: GroundRenderer
    private environment: EnvironmentRenderer
    private water: WaterRenderer

    private basicRendererList: BasicRenderer[] = []
    private actorRendererList: ActorRenderer<Actor>[] = []

    constructor(public game: Game, public el: HTMLElement) {
        // Better visual but don't work with composer
        // this.webGLRenderer.outputEncoding = sRGBEncoding
        // this.webGLRenderer.toneMapping = NoToneMapping
        // this.webGLRenderer.toneMappingExposure = 1
        this.webGLRenderer.toneMapping = ReinhardToneMapping
        this.webGLRenderer.toneMappingExposure = Math.pow(
            config.postProcessing.exposure,
            4.0,
        )

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
        this.water = new WaterRenderer(this.game)
    }

    public init() {
        if (config.postProcessing.postprocessingEnable) this.addComposerPasses()
        this.addRenderers()
        this.rtsCamera.init()
        this.ground.init()
        this.animate()

        this.resize()
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
    }

    private addRenderers() {
        this.addBasicRenderer(this.ground, false)
        this.addBasicRenderer(this.environment)
        this.addBasicRenderer(this.water)

        basicRenderers.forEach((BasicRenderer) => {
            this.addBasicRenderer(new BasicRenderer(this.game))
        })

        actorRenderers.forEach((ActorRenderer) => {
            this.addActorRenderer(new ActorRenderer(this.game))
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

        // TODO refactor this to renderer.hasOutline or something
        // if (renderer.actorType === ActorType.Human) {
        //     this.outlinePass?.selectedObjects.push(renderer.group)
        // }
    }

    private centerRenderer(renderer: BasicRenderer) {
        const [width, height] = this.game.world.getRealSize()
        renderer.group.position.x = -width / 2
        renderer.group.position.z = -height / 2
    }

    private resize = () => {
        this.rtsCamera.camera.aspect = window.innerWidth / window.innerHeight
        this.rtsCamera.camera.updateProjectionMatrix()
        this.webGLRenderer.setPixelRatio(window.devicePixelRatio)
        this.webGLRenderer.setSize(window.innerWidth, window.innerHeight)

        if (config.postProcessing.postprocessingEnable)
            this.composer.setSize(window.innerWidth, window.innerHeight)

        if (this.FXAAPass) {
            this.FXAAPass.material.uniforms.resolution.value.x =
                1 / (window.innerWidth * window.devicePixelRatio)

            this.FXAAPass.material.uniforms.resolution.value.y =
                1 / (window.innerHeight * window.devicePixelRatio)
        }
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

        if (config.postProcessing.postprocessingEnable) {
            this.composer.render()
        } else {
            this.webGLRenderer.render(this.scene, this.rtsCamera.camera)
        }
    }
}
