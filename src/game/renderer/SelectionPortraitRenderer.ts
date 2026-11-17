import { isBuildingActor, isHumanActor } from '+game/actors/helpers'
import { type Actor } from '+game/core/Actor'

import {
    AmbientLight,
    Box3,
    DirectionalLight,
    Group,
    LOD,
    Mesh,
    type Object3D,
    OrthographicCamera,
    Scene,
    SkinnedMesh,
    Vector3,
    WebGLRenderer,
} from 'three'
import { clone } from 'three/addons/utils/SkeletonUtils.js'

import { selectionPortraitSize } from './selectionPortraitLayout'

/** A transparent, shadow-free view. Geometry/materials remain owned by the game. */
export class SelectionPortraitRenderer {
    private renderer: WebGLRenderer
    private scene = new Scene()
    private camera = new OrthographicCamera(-1, 1, 1, -1, 0.01, 1000)
    private root = new Group()
    private sun = new DirectionalLight()
    private ambient = new AmbientLight()
    private model?: Object3D
    private sources: Object3D[] = []
    private copies: Object3D[] = []
    private disposed = false
    private framed = false
    private human: boolean
    private aspect: number
    private bounds = new Box3()
    private bodyBounds = new Box3()
    private size = new Vector3()

    constructor(canvas: HTMLCanvasElement, actor: Actor) {
        this.human = isHumanActor(actor)
        const { width, height } = selectionPortraitSize(this.human)
        this.aspect = width / height
        this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true })
        this.renderer.setClearColor(0, 0)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.setSize(width, height, false)
        this.scene.add(this.root, this.sun, this.sun.target, this.ambient)
        if (isBuildingActor(actor)) {
            const { model, promise } = actor.blueprint.getPlaceholder(actor.seed)
            void promise.then(() => {
                if (this.disposed || this.model) return
                model.traverse((node) => {
                    if (node instanceof LOD) node.autoUpdate = false
                })
                this.model = model
                this.root.add(model)
            })
        }
    }

    public render(
        source: Object3D | undefined,
        main: WebGLRenderer,
        environment: Scene,
        sun: DirectionalLight,
        ambient: AmbientLight,
    ) {
        if (source) {
            const nodes: Object3D[] = []
            source.traverse((node) => nodes.push(node))
            if (
                nodes.length !== this.sources.length ||
                nodes.some((node, i) => node !== this.sources[i])
            ) {
                this.releaseModel()
                this.model = clone(source)
                this.root.add(this.model)
                this.sources = nodes
                this.copies = []
                this.model.traverse((node) => this.copies.push(node))
            }
            this.sources.forEach((node, i) => {
                const copy = this.copies[i]!
                copy.position.copy(node.position)
                copy.quaternion.copy(node.quaternion)
                copy.scale.copy(node.scale)
                copy.visible = node.visible
                if (copy instanceof Mesh && node instanceof Mesh)
                    copy.material = node.material
            })
        }
        if (!this.model) return
        if (this.human || !this.framed) this.frameModel()
        this.sun.color.copy(sun.color)
        this.sun.intensity = sun.intensity
        this.sun.position.copy(sun.position).sub(sun.target.position)
        this.ambient.color.copy(ambient.color)
        this.ambient.intensity = ambient.intensity
        this.scene.environment = environment.environment
        this.renderer.toneMapping = main.toneMapping
        this.renderer.toneMappingExposure = main.toneMappingExposure
        this.renderer.outputColorSpace = main.outputColorSpace
        this.renderer.render(this.scene, this.camera)
    }

    private frameModel() {
        this.root.updateMatrixWorld(true)
        const bounds = this.bounds.setFromObject(this.root, this.human)
        if (bounds.isEmpty()) return
        if (!this.framed) {
            const frameBounds = this.human ? this.humanBodyBounds() : bounds
            frameBounds.getSize(this.size)
            const height = Math.max(this.size.y, 0.01)
            const target = frameBounds.getCenter(new Vector3())
            // Aim at the bust's lower edge, which lines up with the panel bottom.
            if (this.human) target.y = frameBounds.max.y - height * 0.42
            this.camera.position
                .copy(target)
                .add(
                    new Vector3(this.human ? 0.15 : 1, this.human ? 0.02 : 0.65, 1)
                        .normalize()
                        .multiplyScalar(height * 5),
                )
            this.camera.lookAt(target)
            this.camera.updateMatrixWorld()
            this.camera.far = height * 12 + 100
            const halfHeight = Math.max(height, this.size.length() * 0.8) * 0.62
            if (this.human) this.resizeFrame(0, height * 0.66)
            else this.resizeFrame(-halfHeight, halfHeight)
            this.framed = true
        }
        if (!this.human) return

        bounds.applyMatrix4(this.camera.matrixWorldInverse)
        // Grow from the bottom edge so raised tools fit without revealing the legs.
        const top = Math.max(
            bounds.max.y * 1.16,
            (Math.max(-bounds.min.x, bounds.max.x) * 2.32) / this.aspect,
        )
        if (top > this.camera.top) this.resizeFrame(0, top)
    }

    private humanBodyBounds() {
        this.bodyBounds.makeEmpty()
        this.root.traverse((node) => {
            if (node instanceof SkinnedMesh) this.bodyBounds.expandByObject(node, true)
        })
        return this.bodyBounds.isEmpty() ? this.bounds : this.bodyBounds
    }

    private resizeFrame(bottom: number, top: number) {
        const halfWidth = ((top - bottom) * this.aspect) / 2
        this.camera.top = top
        this.camera.bottom = bottom
        this.camera.left = -halfWidth
        this.camera.right = halfWidth
        this.camera.updateProjectionMatrix()
    }

    private releaseModel() {
        this.model?.traverse((node) => {
            if (node instanceof SkinnedMesh) node.skeleton.dispose()
        })
        this.root.clear()
        this.model = undefined
    }

    public destroy() {
        this.disposed = true
        this.releaseModel()
        this.renderer.dispose()
        this.renderer.forceContextLoss()
    }
}
