import { config } from '+config'
import { actorByType } from '+game/actors'
import { BuildingActor } from '+game/core/BuildingActor'
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
    LOD,
    Matrix4,
    Mesh,
    MeshStandardMaterial,
    Object3D,
    PlaneGeometry,
    PointLight,
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

const { BarracksActor } = await import('+game/actors/buildings/barracks/BarracksActor')
const { GuildhallActor } = await import('+game/actors/buildings/guildhall/GuildhallActor')
const { WoodCampActor } = await import('+game/actors/buildings/woodCamp/WoodCampActor')
const { BarracksRenderer } =
    await import('+game/actors/buildings/barracks/BarracksRenderer')
const { GuildhallRenderer } =
    await import('+game/actors/buildings/guildhall/GuildhallRenderer')
const { WoodCampRenderer } =
    await import('+game/actors/buildings/woodCamp/WoodCampRenderer')

const buildings = {
    house: [HouseActor, HouseRenderer],
    stakewall: [StakewallActor, StakewallRenderer],
    barracks: [BarracksActor, BarracksRenderer],
    guildhall: [GuildhallActor, GuildhallRenderer],
    woodCamp: [WoodCampActor, WoodCampRenderer],
} as const
type BuildingLayout = keyof typeof buildings
const buildingLayouts = Object.keys(buildings) as BuildingLayout[]
type FixtureActor = InstanceType<(typeof buildings)[BuildingLayout][0]>

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

const actorRenderers = Object.values(buildings).map(
    ([, Renderer]) => new Renderer(game, player),
)
for (const actors of actorRenderers) {
    actors.group.position.set(-8, 0, -8)
    actors.init()
}
renderer.getInteractionObjectList = () =>
    actorRenderers.flatMap((item) => item.getInteractionShapes())
renderer.getGroundChildren = () => [ground]

type Layout = 'empty' | BuildingLayout | 'mixed'
type View = 'near' | 'mixed' | 'far'
type Mode = 'clones' | 'instances'

const clones = new Group()
clones.position.set(-8, 0, -8)
scene.add(clones)
const models = new Map<
    FixtureActor,
    ReturnType<FixtureActor['blueprint']['getPlaceholder']>['model']
>()
let actors: FixtureActor[] = []

async function load(layout: Layout) {
    player.unselectActor()
    actors.forEach((actor) => game.removeActor(actor))
    actors = []
    models.clear()
    clones.clear()
    const pending: Promise<void>[] = []
    for (let index = 0; index < (layout === 'empty' ? 0 : 100); index++) {
        if (layout === 'empty') break
        const Actor =
            buildings[
                layout === 'mixed' ? (index % 2 === 0 ? 'house' : 'stakewall') : layout
            ][0]
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
    // Keep the fixture light rig identical across all building types.
    const lights: PointLight[] = []
    for (const { group } of actorRenderers) {
        group.traverse((object) => {
            if (object instanceof PointLight) lights.push(object)
        })
    }
    lights.forEach((light) => light.removeFromParent())
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

function signature(actor: FixtureActor, level = 0) {
    return actor.blueprint.buildingModel
        .getPrimitives(level, actor.seed)
        .map(({ mesh, matrix }) => [mesh.geometry.id, matrix.elements] as const)
}

function checkActiveLevels() {
    const expected = new Map<string, number>()
    const pose = new Object3D()
    const matrix = new Matrix4()
    const center = new Vector3()
    const mapOffset = new Vector3(8, 0, 8)
    const key = (geometry: number) =>
        `${geometry}:${matrix.elements.map(Math.fround).join(',')}`
    for (const actor of actors) {
        updateObjectPosition(
            pose,
            actor.position,
            game.world.getTile(actor.position).height,
        )
        pose.rotation.y = rotationIndexToDeg(actor.rotation)
        pose.updateMatrix()
        const distance = camera.position.distanceTo(
            center.copy(pose.position).sub(mapOffset),
        )
        const model = actor.blueprint.buildingModel
        const level = model.levels.findLastIndex(
            ({ distanceInTiles }) => distance >= distanceInTiles * tileSize,
        )
        for (const primitive of model.getPrimitives(level, actor.seed)) {
            matrix.multiplyMatrices(pose.matrix, primitive.matrix)
            const id = key(primitive.mesh.geometry.id)
            expected.set(id, (expected.get(id) ?? 0) + 1)
        }
    }
    for (const batch of batches()) {
        for (let slot = 0; slot < batch.count; slot++) {
            batch.getMatrixAt(slot, matrix)
            const id = key(batch.geometry.id)
            expected.set(id, (expected.get(id) ?? 0) - 1)
        }
        assert(batch.castShadow && batch.receiveShadow, 'Building shadows are disabled')
    }
    assert(
        [...expected.values()].every((count) => count === 0),
        'Incorrect active LOD slots',
    )
}

function checkThresholds(target: FixtureActor) {
    const [x, y] = target.position
    const height = game.world.getTile(target.position).height
    const center = new Vector3(x * tileSize - 8, height * tileSize, y * tileSize - 8)
    const { levels } = target.blueprint.buildingModel
    const expectLevel = (distance: number, level: number) => {
        camera.position.copy(center).add(new Vector3(0, distance * tileSize, 0.01))
        camera.lookAt(center)
        camera.updateMatrixWorld()
        actorRenderers.forEach((renderer) => renderer.render(clock, camera))
        const expected = signature(target, level)
            .map(([geometry]) => geometry)
            .sort()
        const actual = actorRenderers
            .flatMap((renderer) =>
                renderer
                    .getSelectedGroups()
                    .flatMap((batch) =>
                        Array.from({ length: batch.count }, () => batch.geometry.id),
                    ),
            )
            .sort()
        assert(
            JSON.stringify(actual) === JSON.stringify(expected),
            'Selected LOD mismatch',
        )
    }
    for (let level = 1; level < levels.length; level++) {
        const distance = levels[level]!.distanceInTiles
        expectLevel(distance * 0.95, level - 1)
        expectLevel(distance * 1.01, level)
        expectLevel(distance * 0.99, level)
        expectLevel(distance * 0.91, level)
        expectLevel(distance * 0.89, level - 1)
    }
}

function point(position: Vector3) {
    position.project(camera)
    return { clientX: (position.x + 1) * 400, clientY: (1 - position.y) * 300 }
}

async function check(layout: BuildingLayout | 'mixed') {
    await load(layout)
    aim('near')
    draw('instances')
    checkActiveLevels()
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
    checkActiveLevels()
    assert(
        player.selectedActors[0] === target && outline.selectedObjects.length > 0,
        'Selection lost at far view',
    )
    assert(far < near, 'Far LOD must submit fewer triangles')
    // Reset hysteresis for corner actors before approaching the mixed view.
    aim('near')
    camera.position.y = 1
    camera.updateMatrixWorld()
    actorRenderers.forEach((renderer) => renderer.render(clock, camera))
    aim('mixed')
    draw('instances')
    checkActiveLevels()
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
    checkThresholds(target)
    camera.position.set(0, 1, 0)
    camera.updateMatrixWorld()
    actorRenderers.forEach((renderer) => renderer.render(clock, camera))
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
    const beforeFar = signature(target, 1)
    const loaded = Game.fromJSON(JSON.parse(JSON.stringify(game.toJSON())))
    const restored = loaded.getActorById(target.id) as typeof target
    assert(
        JSON.stringify(signature(restored)) === JSON.stringify(before),
        'Near variant changed after save/load',
    )
    assert(
        JSON.stringify(signature(restored, 1)) === JSON.stringify(beforeFar),
        'Far variant changed after save/load',
    )
    const loadedPlayer = loaded.players[0] as HumanPlayer
    loadedPlayer.selectActors([restored])
    const [Actor, ActorRenderer] = buildings[layout === 'mixed' ? 'house' : layout]
    const loadedRenderer = new ActorRenderer(loaded, loadedPlayer)
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
    const sourceRenderer = actorRenderers.find(
        ({ actorType }) => actorType === target.type,
    )!
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
    const replacement = new Actor(game, player, target.position)
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
        const signatures = actors.map((actor) => signature(actor))
        for (const actor of actors) {
            const near = signature(actor)
            const far = signature(actor, 1)
            assert(
                JSON.stringify(near.map(([, matrix]) => matrix)) ===
                    JSON.stringify(far.map(([, matrix]) => matrix)),
                'Stakewall variant transforms changed across LODs',
            )
        }
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

async function checkPreview(type: ActorType, view: View) {
    await load('empty')
    aim(view)
    draw('instances')
    const interactions = new InteractionsManager(game, renderer, player)
    interactions.init()
    player.selectBuilding(type)
    await Promise.resolve()
    const preview = scene.children.at(-1)!.children[0]!
    const model = preview.children[0] as LOD
    await actorByType[type].blueprint!.getPlaceholder().promise
    await Promise.resolve()
    player.rotateBuilding()
    await Promise.resolve()
    const rotation = player.selectedBuildingRotation
    const center = point(new Vector3())
    webgl.domElement.dispatchEvent(new PointerEvent('pointermove', center))
    webgl.domElement.dispatchEvent(
        new PointerEvent('pointermove', { ...center, clientX: center.clientX + 2 }),
    )
    assert(preview.children[0] === model, 'Pointer movement or rotation rerolled preview')
    const expected: number[][] = []
    model.updateWorldMatrix(true, true)
    model.update(camera)
    model.traverseVisible((object) => {
        if (object instanceof Mesh) expected.push(object.matrixWorld.elements.slice())
    })
    webgl.domElement.dispatchEvent(
        new MouseEvent('click', { ...center, clientX: center.clientX + 2 }),
    )
    await Promise.resolve()
    const placed = game.findActorsByType(type)[0] as BuildingActor
    assert(placed?.rotation === rotation, 'Placement lost gameplay rotation')
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
        `Placement changed ${type} preview variant or transform in ${view} view`,
    )
    interactions.destroy()
    player.unselectBuilding()
    game.removeActor(placed)
}

Object.assign(window, {
    buildingBenchmark: {
        async run(sampleCount = 24) {
            const rows = []
            for (const layout of ['empty', ...buildingLayouts, 'mixed'] as const) {
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
            for (const layout of [...buildingLayouts, 'mixed'] as const)
                await check(layout)
            for (const { actorType } of actorRenderers) {
                await checkPreview(actorType, 'near')
                await checkPreview(actorType, 'far')
            }
            return 'LOD slots, hysteresis, click, box, outline, save, removal, replacement, bounds and previews passed'
        },
        async screenshot(layout: Layout, view: View, selected = false) {
            await load(layout)
            aim(view)
            if (selected) player.selectActors([actors[44]!])
            draw('instances')
        },
    },
})
