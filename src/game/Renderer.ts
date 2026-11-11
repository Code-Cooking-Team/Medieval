import { config } from '+config'

import Stats from 'stats.js'
import {
    MathUtils,
    PCFShadowMap,
    Raycaster,
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
import { type Actor } from './core/Actor'
import { RTSCamera } from './core/RTSCamera'
import { type Game } from './Game'
import { type HumanPlayer } from './player/HumanPlayer'
import { EnvironmentRenderer } from './renderer/EnvironmentRenderer'
import { GroundRenderer } from './renderer/GroundRenderer'
import { type ActorRenderer } from './renderer/lib/ActorRenderer'
import { type BasicRenderer } from './renderer/lib/BasicRenderer'
import { SelectionPortraitRenderer } from './renderer/SelectionPortraitRenderer'
import { WaterRenderer } from './renderer/WaterRenderer'
import { type ClockInfo } from './types'

const stats = new Stats()
const SHOWCASE_BOKEH_APERTURE = 0.0025
const SHOWCASE_BOKEH_MAX_BLUR = 0.012
const AUTOFOCUS_INTERVAL = 0.125

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
    private showcase = false
    private focusRay = new Raycaster()
    private focusCenter = new Vector2()
    private nextFocusSample = 0
    private focusTarget?: number
    private focusDistance?: number

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
        this.water = new WaterRenderer(this.game.world)
    }

    public init(showcase = false) {
        this.showcase = showcase
        if (showcase || config.postProcessing.postprocessingEnabled) {
            this.addComposerPasses()
        }

        this.rootEl.append(this.webGLRenderer.domElement)

        stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
        if (!showcase) this.rootEl.append(stats.dom)

        this.loadRenderers()
        this.rtsCamera.init(showcase ? this.game.world : undefined)
        this.ground.init()
        this.resize()

        if (this.isWindowFocused) this.animate()
        else this.throttledAnimate()

        window.addEventListener('resize', this.resize)
        window.addEventListener('focus', this.handleWindowFocus)
        window.addEventListener('blur', this.handleWindowBlur)

        const anyWindow = window as any

        anyWindow.logStats = () => {
            console.log('Device pixel ratio', window.devicePixelRatio)
            console.log('Scene polycount:', this.webGLRenderer.info.render.triangles)
            console.log('Active drawcalls:', this.webGLRenderer.info.render.calls)
            console.log('Textures in Memory', this.webGLRenderer.info.memory.textures)
            console.log('Geometries in Memory', this.webGLRenderer.info.memory.geometries)
        }
    }

    private portrait?: { view: SelectionPortraitRenderer; actor: Actor }

    public attachPortrait(canvas: HTMLCanvasElement, actor: Actor) {
        this.portrait?.view.destroy()
        const view = new SelectionPortraitRenderer(canvas, actor)
        this.portrait = { view, actor }
        return () => {
            if (this.portrait?.view !== view) return
            view.destroy()
            this.portrait = undefined
        }
    }

    public destroy() {
        this.portrait?.view.destroy()
        this.portrait = undefined
        this.actorRendererList.forEach((renderer) => {
            renderer.destroy()
        })

        // TODO fix "WARNING: Too many active WebGL contexts three"
        this.basicRendererList.forEach((renderer) => renderer.destroy?.())
        this.composer.passes.forEach((pass) => pass.dispose())
        this.composer.dispose()
        this.rtsCamera.destroy()
        this.clock.dispose()
        this.webGLRenderer.dispose() // TODO needed?

        this.rootEl.removeChild(this.webGLRenderer.domElement)
        if (stats.dom.parentElement === this.rootEl) stats.dom.remove()

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

    private autofocus(fallback: number, { deltaTime, elapsedTime }: ClockInfo) {
        const camera = this.rtsCamera.camera
        if (elapsedTime >= this.nextFocusSample) {
            this.nextFocusSample = elapsedTime + AUTOFOCUS_INTERVAL
            camera.updateMatrixWorld()
            this.focusRay.near = camera.near
            this.focusRay.far = Math.min(camera.far, config.camera.maxHeight * 4)
            this.focusRay.setFromCamera(this.focusCenter, camera)

            const terrainDistance = this.ground.focusDistance(this.focusRay)
            if (terrainDistance !== undefined) this.focusRay.far = terrainDistance

            const shapes = this.getInteractionObjectList()
            for (const shape of shapes) shape.updateWorldMatrix(true, false)
            const actorHit = this.focusRay.intersectObjects(shapes, false)[0]
            // The center ray measures depth along the camera's view axis.
            this.focusTarget = actorHit?.distance ?? terrainDistance ?? fallback
        }
        const target = this.focusTarget ?? fallback
        this.focusDistance = MathUtils.damp(
            this.focusDistance ?? target,
            target,
            8,
            deltaTime,
        )
        return this.focusDistance
    }

    private addComposerPasses() {
        const width = window.innerWidth
        const height = window.innerHeight
        const camera = this.rtsCamera.camera
        const gameEffects = config.postProcessing.postprocessingEnabled

        this.composer.addPass(new RenderPass(this.scene, camera))

        // Outline
        if (gameEffects && config.postProcessing.outlineEnabled) {
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
        if (gameEffects && config.postProcessing.bloomEnabled) {
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
        if (this.showcase || config.postProcessing.bokehEnable) {
            this.bokehPass = new BokehPass(this.scene, camera, {
                focus: 5,
                aperture: this.showcase
                    ? SHOWCASE_BOKEH_APERTURE
                    : config.postProcessing.bokehAperture,
                maxblur: this.showcase
                    ? SHOWCASE_BOKEH_MAX_BLUR
                    : config.postProcessing.bokehMaxBlur,
            })
            if (this.showcase) {
                const material = this.bokehPass.materialBokeh
                material.fragmentShader = material.fragmentShader.replace(
                    'vec2 dofblur9',
                    `
                        float edgeFade = smoothstep(0.12, 0.52, length(vUv - vec2(0.5)));
                        vec2 blur = abs(dofblur);
                        dofblur = mix(blur * 0.12, max(blur, vec2(maxblur * 0.4)) * 0.8, edgeFade);
                        vec2 dofblur9
                    `,
                )
            }
            this.composer.addPass(this.bokehPass)
        }

        this.composer.addPass(new OutputPass())

        // FXAA
        if (gameEffects && config.postProcessing.FXAAEnabled) {
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
        this.rtsCamera.render(clockInfo)
        this.actorRendererList.forEach((renderer) =>
            renderer.render(clockInfo, this.rtsCamera.camera),
        )
        if (this.portrait) {
            const { view, actor } = this.portrait
            const source = this.actorRendererList
                .find((renderer) => renderer.actorType === actor.type)
                ?.getPortraitModel(actor)
            view.render(
                source,
                this.webGLRenderer,
                this.scene,
                this.environment.sun,
                this.environment.ambient,
            )
        }
        if (this.outlinePass) {
            this.outlinePass.selectedObjects = this.player.selectedActors.length
                ? this.getSelectedGroupList()
                : []
        }

        if (this.showcase || config.postProcessing.postprocessingEnabled) {
            if (this.bokehPass) {
                const camera = this.rtsCamera.camera
                const pitch = camera.rotation.x
                // Focus where the center ray meets the ground, with a limit near the horizon.
                const down = Math.max(0.25, -Math.sin(pitch))
                const focus = camera.position.y / down
                const bottomRayDrop =
                    (Math.cos(pitch) * Math.cos(camera.rotation.z)) /
                    camera.projectionMatrix.elements[5]!
                const foregroundDepth =
                    camera.position.y / (down + Math.abs(bottomRayDrop))
                // Keep the foreground blur consistent across zoom levels and soften it overhead.
                const depthSpan = Math.max(focus - foregroundDepth, focus * 0.2)
                const uniforms = this.bokehPass.uniforms as Record<
                    string,
                    { value: number }
                >
                uniforms.focus!.value =
                    !this.showcase && config.postProcessing.bokehAutofocus
                        ? this.autofocus(focus, clockInfo)
                        : focus
                const aperture = this.showcase
                    ? SHOWCASE_BOKEH_APERTURE
                    : config.postProcessing.bokehAperture
                uniforms.aperture!.value = (6 * aperture) / depthSpan
            }
            this.composer.render()
        } else {
            this.webGLRenderer.render(this.scene, this.rtsCamera.camera)
        }
    }
}
