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
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js'
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
        // logarithmicDepthBuffer: true, // TODO needed? (-20 fps)
    })

    private composer = new EffectComposer(this.webGLRenderer)
    private outlinePass?: OutlinePass
    private FXAAPass?: any
    private GammaCorrectionPass?: any
    private bokehPass?: BokehPass

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

        this.webGLRenderer.toneMapping = ReinhardToneMapping
        this.webGLRenderer.toneMappingExposure = Math.pow(config.renderer.exposure, 4.0)

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
        const width = window.innerWidth
        const height = window.innerHeight
        const camera = this.rtsCamera.camera

        const renderPass = new RenderPass(this.scene, camera)

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
            this.composer.addPass(renderPass)
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

        // GammaCorrection
        if (config.postProcessing.gammaCorrectionShader) {
            this.GammaCorrectionPass = new ShaderPass(GammaCorrectionShader)
            this.composer.addPass(this.GammaCorrectionPass)
        }

        // FXAA
        if (config.postProcessing.FXAAEnabled) {
            this.FXAAPass = new ShaderPass(FXAAShader)
            this.composer.addPass(this.FXAAPass)
        }

        // Bokeh
        if (config.postProcessing.bokehEnable) {
            this.bokehPass = new BokehPass(this.scene, camera, {
                focus: 5,
                aperture: config.postProcessing.bokehAperture,
                maxblur: config.postProcessing.bokehMaxBlur,
                width: width,
                height: height,
            })
            this.composer.addPass(this.bokehPass)
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
            this.FXAAPass.material.uniforms.resolution.value.x = 1 / (width * pixelRatio)
            this.FXAAPass.material.uniforms.resolution.value.y = 1 / (height * pixelRatio)
        }

        if (this.bokehPass) {
            this.bokehPass.setSize(width, height)
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
                console.log(uniform.aperture.value)

                this.composer.render()
            }
        } else {
            this.webGLRenderer.render(this.scene, this.rtsCamera.camera)
        }
    }
}
