import { config } from '+config'
import { updateScale } from '+helpers/three'

import { Group, LOD, Matrix4, Mesh, Object3D } from 'three'

export interface BuildingLevel {
    distanceInTiles: number
    node?: string
}

export interface BuildingPrimitive {
    mesh: Pick<Mesh, 'geometry' | 'material' | 'castShadow' | 'receiveShadow'>
    matrix: Matrix4
}

export class BuildingModel {
    private source?: Object3D[]
    private readonly sharedPrimitives = new Map<number, BuildingPrimitive[]>()
    public readonly ready: Promise<void>

    constructor(
        model: Promise<Group>,
        public readonly levels: readonly BuildingLevel[] = [{ distanceInTiles: 0 }],
        private readonly configureVariant?: (seed: number) => (node: Object3D) => boolean,
    ) {
        this.ready = model.then((root) => {
            this.source = levels.map(({ node }) => {
                if (node === undefined) return root
                const level = root.children.find((child) => child.name === node)
                if (!level) throw new Error(`Missing building LOD node: ${node}`)
                return root.clone(false).add(level.clone())
            })
        })
    }

    private createLevel(level: number, seed: number) {
        const root = this.source![level]!.clone()
        if (this.configureVariant) {
            const pieces =
                this.levels[level]!.node === undefined ? root : root.children[0]!
            const configure = this.configureVariant(seed)
            for (const child of [...pieces.children]) {
                if (!configure(child)) pieces.remove(child)
            }
        }
        return root
    }

    public getPrimitives(level: number, seed: number) {
        const shared = this.sharedPrimitives.get(level)
        if (shared) return shared

        const root = new Group()
        updateScale(root)
        root.add(this.createLevel(level, seed))
        root.updateMatrixWorld(true)

        const primitives: BuildingPrimitive[] = []
        root.traverse((object) => {
            if (object instanceof Mesh) {
                const { geometry, material, castShadow, receiveShadow, matrixWorld } =
                    object
                primitives.push({
                    mesh: { geometry, material, castShadow, receiveShadow },
                    matrix: matrixWorld,
                })
            }
        })
        if (!this.configureVariant) this.sharedPrimitives.set(level, primitives)
        return primitives
    }

    public createModel(seed = 0) {
        const model = new LOD()
        updateScale(model)
        const promise = this.ready.then(() => {
            this.levels.forEach(({ distanceInTiles }, index) => {
                const level = this.createLevel(index, seed)
                model.addLevel(level, distanceInTiles * config.renderer.tileSize, 0.1)
                level.visible = index === 0
            })
        })
        return { model, promise }
    }
}
