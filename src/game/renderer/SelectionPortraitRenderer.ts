import { isBuildingActor, isHumanActor } from '+game/actors/helpers'
import { Actor } from '+game/core/Actor'

import {
    AmbientLight,
    Box3,
    DirectionalLight,
    Group,
    LOD,
    Mesh,
    Object3D,
    OrthographicCamera,
    Scene,
    SkinnedMesh,
    Vector3,
    WebGLRenderer,
} from 'three'
import { clone } from 'three/addons/utils/SkeletonUtils.js'

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
    private size = new Vector3()

    constructor(
        canvas: HTMLCanvasElement,
        private actor: Actor,
    ) {
        this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true })
        this.renderer.setClearColor(0, 0)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.setSize(160, 180, false)
        this.scene.add(this.root, this.sun, this.sun.target, this.ambient)
        if (isBuildingActor(actor)) {
            const { model, promise } = actor.blueprint.getPlaceholder(actor.seed)
            void promise.then(() => {
                if (this.disposed) return
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
        if (!isBuildingActor(this.actor) && source) {
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
        if (!this.framed) this.frameModel()
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
        const bounds = new Box3().setFromObject(this.root)
        if (bounds.isEmpty()) return
        bounds.getSize(this.size)
        const center = bounds.getCenter(new Vector3())
        const human = isHumanActor(this.actor)
        const height = Math.max(this.size.y, 0.01)
        const target = center.clone()
        if (human) target.y = bounds.max.y - height * 0.19
        this.camera.position
            .copy(target)
            .add(
                new Vector3(human ? 0.15 : 1, human ? 0.02 : 0.65, 1)
                    .normalize()
                    .multiplyScalar(height * 5),
            )
        this.camera.lookAt(target)
        // Humans fill the canvas from chest to crown; buildings fit in full.
        const halfHeight = human
            ? height * 0.23
            : Math.max(height, this.size.length() * 0.8) * 0.62
        this.camera.top = halfHeight
        this.camera.bottom = -halfHeight
        this.camera.left = (-halfHeight * 160) / 180
        this.camera.right = (halfHeight * 160) / 180
        this.camera.far = height * 12 + 100
        this.camera.updateProjectionMatrix()
        this.framed = true
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
