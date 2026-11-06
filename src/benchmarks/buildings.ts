import { config } from '+config'
import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { InteractionsManager } from '+game/player/interaction/InteractionsManager'
import { SelectInteractions } from '+game/player/interaction/methods/SelectInteractions'
import { Renderer } from '+game/Renderer'
import { ActorType } from '+game/types'
import { Tile } from '+game/world/Tile'
import { World } from '+game/world/World'
import { rotationIndexToDeg, updateObjectPosition } from '+helpers'

import {
    AmbientLight,
    Color,
    DirectionalLight,
    Group,
    InstancedMesh,
    Matrix4,
    Mesh,
    MeshStandardMaterial,
    PlaneGeometry,
    Sphere,
    Vector2,
    Vector3,
} from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'

const { HouseActor } = await import('+game/actors/buildings/house/HouseActor')
const { StakewallActor } = await import('+game/actors/buildings/stakewall/StakewallActor')
const { HouseRenderer } = await import('+game/actors/buildings/house/HouseRenderer')
const { StakewallRenderer } =
    await import('+game/actors/buildings/stakewall/StakewallRenderer')

type HouseActor = InstanceType<typeof HouseActor>
type StakewallActor = InstanceType<typeof StakewallActor>

const tileSize = config.renderer.tileSize
config.renderer.light = false
config.debug.wireModel = false
config.postProcessing.postprocessingEnabled = true
config.postProcessing.outlineEnabled = true

const clock = { deltaTime: 1 / 60, elapsedTime: 0 }
const player = new HumanPlayer()
const game = new Game(
    new World(
        Array.from({ length: 160 }, () => Array.from({ length: 160 }, () => new Tile())),
    ),
    [player],
)
const renderer = new Renderer(game, player, document.body)
const {
    scene,
    webGLRenderer: webgl,
    rtsCamera: { camera },
} = renderer
scene.clear()
scene.background = new Color(0x859fb4)
webgl.setPixelRatio(1)
webgl.setSize(800, 600)
webgl.shadowMap.enabled = true
webgl.info.autoReset = false
document.body.append(webgl.domElement)

const ground = new Mesh(
    new PlaneGeometry(80, 80),
    new MeshStandardMaterial({ color: 0x69744c }),
)
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground, new AmbientLight(0xffffff, 2))
const sun = new DirectionalLight(0xffffff, 3)
sun.position.set(6, 11, 4)
sun.castShadow = true
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, far: 32 })
sun.shadow.camera.updateProjectionMatrix()
sun.shadow.mapSize.set(1024, 1024)
sun.shadow.normalBias = 0.015
scene.add(sun)

const composer = new EffectComposer(webgl)
composer.addPass(new RenderPass(scene, camera))
const outline = new OutlinePass(new Vector2(800, 600), scene, camera)
outline.visibleEdgeColor.setHex(0x5eff64)
outline.hiddenEdgeColor.setHex(0x5eff64)
composer.addPass(outline)
composer.addPass(new OutputPass())

const actorRenderers = [
    new HouseRenderer(game, player),
    new StakewallRenderer(game, player),
]
for (const actors of actorRenderers) {
    actors.group.position.set(-8, 0, -8)
    actors.init()
}
renderer.getInteractionObjectList = () =>
    actorRenderers.flatMap((item) => item.getInteractionShapes())
renderer.getGroundChildren = () => [ground]

type Layout = 'empty' | 'house' | 'stakewall' | 'mixed'
type View = 'near' | 'mixed' | 'far'
type Mode = 'clones' | 'instances'

const clones = new Group()
clones.position.set(-8, 0, -8)
scene.add(clones)
const models = new Map<
    HouseActor | StakewallActor,
    ReturnType<HouseActor['blueprint']['getPlaceholder']>['model']
>()
let actors: (HouseActor | StakewallActor)[] = []

async function load(layout: Layout) {
    player.unselectActor()
    actors.forEach((actor) => game.removeActor(actor))
    actors = []
    models.clear()
    clones.clear()
    const pending: Promise<void>[] = []
    for (let index = 0; index < (layout === 'empty' ? 0 : 100); index++) {
        const Actor =
            layout === 'house' || (layout === 'mixed' && index % 2 === 0)
                ? HouseActor
                : StakewallActor
        const actor = new Actor(game, player, [
            26 + (index % 10) * 12,
            26 + Math.floor(index / 10) * 12,
        ])
        actor.seed = 93291 + index
        actor.setRotation(index % 4)
        game.addActor(actor)
        actors.push(actor)

        // Equivalent-LOD clone baseline: same primitives and seeds, one visible
        // mesh hierarchy per actor. This isolates the effect of instancing.
        const { model, promise } = actor.blueprint.getPlaceholder(actor.seed)
        updateObjectPosition(
            model,
            actor.position,
            game.world.getTile(actor.position).height,
        )
        model.rotation.y = rotationIndexToDeg(actor.rotation)
        model.autoUpdate = false
        clones.add(model)
        models.set(actor, model)
        pending.push(promise)
    }
    await Promise.all(pending)
}

function aim(view: View, offset = 0) {
    if (view === 'near') camera.position.set(offset, 6, 0.02)
    if (view === 'mixed') camera.position.set(offset, 7, 10)
    if (view === 'far') camera.position.set(offset, 22, 0.02)
    camera.fov = view === 'near' ? 102 : view === 'mixed' ? 65 : 43
    camera.aspect = 800 / 600
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()
}

const clonePosition = new Vector3()

function draw(mode: Mode) {
    const instanced = mode === 'instances'
    if (instanced !== (clones.parent === null)) {
        if (instanced) {
            clones.removeFromParent()
            scene.add(...actorRenderers.map(({ group }) => group))
        } else {
            actorRenderers.forEach(({ group }) => group.removeFromParent())
            scene.add(clones)
        }
    }
    if (instanced) {
        actorRenderers.forEach((actors) => actors.render(clock, camera))
        outline.selectedObjects = actorRenderers.flatMap((actors) =>
            actors.getSelectedGroups(),
        )
    } else {
        outline.selectedObjects = []
        for (const model of models.values()) {
            model.updateMatrixWorld()
            // Fixtures start a fresh camera path per sample. Match the
            // instanced thresholds and hysteresis, including multi-level jumps.
            const distance = camera.position.distanceTo(
                model.getWorldPosition(clonePosition),
            )
            const previous = model.levels.findIndex(({ object }) => object.visible)
            const level = model.levels.findLastIndex(
                ({ distance: threshold }, index) =>
                    distance >= threshold * (previous >= index ? 0.9 : 1),
            )
            model.levels.forEach(({ object }, index) => {
                object.visible = index === level
            })
        }
    }
    webgl.info.reset()
    composer.render()
    return { calls: webgl.info.render.calls, triangles: webgl.info.render.triangles }
}

const gl = webgl.getContext()
const readback = new Uint8Array(4)
function measure(mode: Mode, view: View, sampleCount: number) {
    const samples: number[] = []
    let calls = 0
    let triangles = 0
    for (let i = -8; i < sampleCount; i++) {
        aim(view, 0.2 * Math.sin(i * 0.25))
        const start = performance.now()
        const counters = draw(mode)
        gl.readPixels(400, 300, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, readback)
        if (i < 0) continue
        samples.push(performance.now() - start)
        calls += counters.calls
        triangles += counters.triangles
    }
    samples.sort((a, b) => a - b)
    return {
        calls: calls / sampleCount,
        triangles: triangles / sampleCount,
        median: samples[Math.ceil(sampleCount * 0.5) - 1],
        p95: samples[Math.ceil(sampleCount * 0.95) - 1],
    }
}

function assert(condition: unknown, description: string): asserts condition {
    if (!condition) throw new Error(description)
}

function batches(visibleOnly = true) {
    return actorRenderers.flatMap(({ group }) =>
        group.children.filter(
            (object): object is InstancedMesh =>
                object instanceof InstancedMesh && (!visibleOnly || object.visible),
        ),
    )
}

function signature(actor: HouseActor | StakewallActor) {
    return actor.blueprint.buildingModel
        .getPrimitives(0, actor.seed)
        .map(({ mesh, matrix }) => [mesh.geometry.id, matrix.elements])
}

function point(position: Vector3) {
    position.project(camera)
    return { clientX: (position.x + 1) * 400, clientY: (1 - position.y) * 300 }
}

async function check(layout: 'house' | 'stakewall' | 'mixed') {
    await load(layout)
    aim('near')
    draw('instances')
    const target = actors[44]!
    const position = new Vector3(
        target.position[0] * tileSize - 8,
        0.15,
        target.position[1] * tileSize - 8,
    )
    const center = point(position.clone())
    const input = new SelectInteractions(game, renderer, player)
    input.enable()
    const pointer = (
        type: string,
        x: number,
        y: number,
        receiver: EventTarget = document,
    ) => {
        receiver.dispatchEvent(
            new PointerEvent(type, { clientX: x, clientY: y, button: 0, bubbles: true }),
        )
    }
    const click = () => {
        pointer('pointerdown', center.clientX, center.clientY, webgl.domElement)
        pointer('pointerup', center.clientX, center.clientY)
    }
    click()
    assert(
        player.selectedActors.length === 1 && player.selectedActors[0] === target,
        'Click must pick target proxy',
    )
    draw('instances')
    assert(outline.selectedObjects.length > 0, 'Outline batches missing')
    assert(
        outline.selectedObjects.every((mesh) => (mesh as InstancedMesh).count === 1),
        'Outline includes unselected actors',
    )
    const near = draw('instances').triangles
    aim('far')
    const far = draw('instances').triangles
    assert(
        player.selectedActors[0] === target && outline.selectedObjects.length > 0,
        'Selection lost at far view',
    )
    if (layout !== 'stakewall')
        assert(far < near, 'Far House LOD must submit fewer triangles')
    aim('mixed')
    draw('instances')
    if (layout === 'house') {
        const triangleLevels = new Set(
            batches().map(({ geometry }) => (geometry.index?.count ?? 0) / 3),
        )
        assert(
            [2304, 567, 17].every((count) => triangleLevels.has(count)),
            'Mixed view must use all three House levels',
        )
    }
    aim('near')
    draw('instances')
    const boxSelect = () => {
        pointer('pointerdown', center.clientX - 8, center.clientY - 8, webgl.domElement)
        for (let i = 0; i < 10; i++)
            pointer('pointermove', center.clientX + i, center.clientY + i)
        pointer('pointerup', center.clientX + 8, center.clientY + 8)
    }
    player.unselectActor()
    boxSelect()
    assert(
        player.selectedActors.length === 1 && player.selectedActors[0] === target,
        'Box selection must pick target proxy',
    )
    const before = signature(target)
    const loaded = Game.fromJSON(JSON.parse(JSON.stringify(game.toJSON())))
    const restored = loaded.getActorById(target.id) as typeof target
    assert(
        JSON.stringify(signature(restored)) === JSON.stringify(before),
        'Variant changed after save/load',
    )
    const loadedPlayer = loaded.players[0] as HumanPlayer
    loadedPlayer.selectActors([restored])
    const loadedRenderer =
        restored instanceof HouseActor
            ? new HouseRenderer(loaded, loadedPlayer)
            : new StakewallRenderer(loaded, loadedPlayer)
    loadedRenderer.group.position.set(-8, 0, -8)
    loadedRenderer.init()
    await Promise.resolve()
    loadedRenderer.render(clock, camera)
    assert(
        loadedRenderer
            .getInteractionShapes()
            .some(({ userData }) => userData.actor === restored),
        'Reloaded actor has no picking proxy',
    )
    const snapshot = (objects: InstancedMesh[]) =>
        objects
            .map((object) => ({
                geometry: object.geometry.id,
                matrices: Array.from(
                    object.instanceMatrix.array.slice(0, object.count * 16),
                ),
            }))
            .sort((a, b) => a.geometry - b.geometry)
    const sourceRenderer =
        target instanceof HouseActor ? actorRenderers[0]! : actorRenderers[1]!
    assert(
        JSON.stringify(snapshot(loadedRenderer.getSelectedGroups())) ===
            JSON.stringify(snapshot(sourceRenderer.getSelectedGroups())),
        'Reloaded instance matrices differ',
    )
    loadedRenderer.destroy()
    const beforeCount = batches().reduce((total, batch) => total + batch.count, 0)
    const matrix = new Matrix4()
    game.removeActor(target)
    await Promise.resolve()
    draw('instances')
    assert(
        !renderer
            .getInteractionObjectList()
            .some(({ userData }) => userData.actor === target),
        'Removed proxy still pickable',
    )
    assert(outline.selectedObjects.length === 0, 'Removed actor still outlined')
    assert(
        batches().reduce((total, batch) => total + batch.count, 0) ===
            beforeCount - before.length,
        'Removed actor left active primitives',
    )
    const replacement =
        target instanceof HouseActor
            ? new HouseActor(game, player, target.position)
            : new StakewallActor(game, player, target.position)
    replacement.seed = target.seed + 1000
    replacement.rotation = target.rotation
    game.addActor(replacement)
    actors = actors.map((actor) => (actor === target ? replacement : actor))
    await Promise.resolve()
    draw('instances')
    click()
    assert(
        player.selectedActors[0]?.id === replacement.id,
        'Reused slot must select replacement',
    )
    player.unselectActor()
    boxSelect()
    assert(
        player.selectedActors[0]?.id === replacement.id,
        'Box selection failed after slot reuse',
    )
    assert(
        batches().reduce((total, batch) => total + batch.count, 0) ===
            beforeCount - before.length + signature(replacement).length,
        'Replacement has incorrect primitive count',
    )
    for (const batch of batches()) {
        assert(batch.boundingSphere, 'Missing bounds')
        const bounds = batch.boundingSphere.clone()
        const primitiveBounds = new Sphere()
        batch.geometry.computeBoundingSphere()
        for (let slot = 0; slot < batch.count; slot++) {
            batch.getMatrixAt(slot, matrix)
            primitiveBounds.copy(batch.geometry.boundingSphere!).applyMatrix4(matrix)
            assert(
                bounds.center.distanceTo(primitiveBounds.center) +
                    primitiveBounds.radius <=
                    bounds.radius + 1e-5,
                'Bounds omit active instance',
            )
        }
    }
    if (layout === 'stakewall') {
        const signatures = actors.map(signature)
        assert(
            signatures.every((value) => value.length >= 2),
            'Missing Main post',
        )
        assert(
            new Set(
                signatures.map((value) =>
                    JSON.stringify(value.map(([geometry]) => geometry)),
                ),
            ).size > 80,
            'Optional layouts lack variation',
        )
        assert(
            new Set(signatures.map((value) => JSON.stringify(value[0]))).size === 100,
            'Main post transforms lack variation',
        )
    }
    input.disable()
}

async function checkPreview() {
    await load('empty')
    aim('near')
    draw('instances')
    const interactions = new InteractionsManager(game, renderer, player)
    interactions.init()
    player.selectBuilding(ActorType.Stakewall)
    await Promise.resolve()
    const preview = scene.children.at(-1)!.children[0]!
    const model = preview.children[0]!
    await new StakewallActor(game, player).blueprint.buildingModel.ready
    await Promise.resolve()
    player.rotateBuilding()
    await Promise.resolve()
    const center = point(new Vector3())
    webgl.domElement.dispatchEvent(new PointerEvent('pointermove', center))
    webgl.domElement.dispatchEvent(
        new PointerEvent('pointermove', { ...center, clientX: center.clientX + 2 }),
    )
    assert(preview.children[0] === model, 'Pointer movement or rotation rerolled preview')
    const expected: number[][] = []
    model.updateWorldMatrix(true, true)
    model.traverse((object) => {
        if (object instanceof Mesh) expected.push(object.matrixWorld.elements.slice())
    })
    webgl.domElement.dispatchEvent(
        new MouseEvent('click', { ...center, clientX: center.clientX + 2 }),
    )
    await Promise.resolve()
    const placed = game.findActorsByType(ActorType.Stakewall)[0] as StakewallActor
    assert(placed?.rotation === 1, 'Placement lost gameplay rotation')
    draw('instances')
    const actual = batches().map((batch) => {
        const matrix = new Matrix4()
        batch.getMatrixAt(0, matrix)
        return matrix.premultiply(batch.matrixWorld).elements
    })
    assert(
        expected.length === actual.length &&
            expected.every((matrix) =>
                actual.some((other) =>
                    matrix.every(
                        (value, index) => Math.abs(value - other[index]!) < 1e-6,
                    ),
                ),
            ),
        'Placement changed preview variant or transform',
    )
    interactions.destroy()
    player.unselectBuilding()
    game.removeActor(placed)
}

Object.assign(window, {
    buildingBenchmark: {
        async run(sampleCount = 24) {
            const rows = []
            for (const layout of ['empty', 'house', 'stakewall', 'mixed'] as const) {
                for (const view of ['near', 'mixed', 'far'] as const) {
                    for (const mode of ['clones', 'instances'] as const) {
                        await load(layout)
                        rows.push({
                            layout,
                            view,
                            mode,
                            ...measure(mode, view, sampleCount),
                        })
                    }
                }
            }
            const extension = gl.getExtension('WEBGL_debug_renderer_info')
            return {
                gpu: extension
                    ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)
                    : 'Unknown',
                rows,
            }
        },
        async check() {
            for (const layout of ['house', 'stakewall', 'mixed'] as const)
                await check(layout)
            await checkPreview()
            return 'Click, box, outline, all House LODs, save, removal, replacement, bounds and preview passed'
        },
        async screenshot(layout: Layout, view: View, selected = false) {
            await load(layout)
            aim(view)
            if (selected) player.selectActors([actors[44]!])
            draw('instances')
        },
    },
})
