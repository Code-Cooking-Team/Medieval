import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { bindCarryPose } from '../game/actors/units/human/carryPose'
import { type ItemId } from '../game/actors/units/human/equipment'
import {
    carriedLogModel,
    equipmentModels,
} from '../game/actors/units/human/equipmentModels'
import humanUrl from '../game/actors/units/human/models/human.gltf'
import {
    humanMotionTransitionTime,
    prepareHumanAnimations,
} from '../game/actors/units/human/prepareHumanAnimations'
import '../index.css'
import './humanAnimations.css'

document.body.innerHTML = `
<main><section id="viewport"><div class="badge">MEDIEVAL / ANIMATION LAB</div><div class="hint">Drag to orbit · Scroll to zoom</div></section>
<aside><h1>Human animations</h1><p>Switch animations and watch them blend into one another.</p>
<h2>Equipment</h2>
<label class="equipment-label" for="equipment">Held item</label><select id="equipment"><option value="">Empty hands</option><option value="sword">Sword</option><option value="spear">Spear</option><option value="hatchet">Hatchet</option><option value="hammer">Hammer</option><option value="carriedLog">Log</option><option disabled>Padded armor — no model</option></select>
<label class="check"><input id="carryPose" type="checkbox" checked> Log carry pose</label><p class="note">Applies while holding a log. Turn off to inspect the grip during animations.</p>
<h2>Animation</h2><div id="clips">Loading model…</div>
<label>Fade duration <output id="fadeValue">${humanMotionTransitionTime.toFixed(2)} s</output><input id="fade" type="range" min="0" max="2" step="0.01" value="${humanMotionTransitionTime}"></label>
<label>Playback speed <output id="speedValue">1.00×</output><input id="speed" type="range" min="0.1" max="2" step="0.05" value="1"></label>
<div class="row"><button id="pause">Pause</button><button id="step">Step +1/60 s</button><button id="restart">Restart</button></div>
<h2>A ↔ B transition test</h2><div class="row"><select id="from" aria-label="Animation A"></select><select id="to" aria-label="Animation B"></select></div>
<label>Switch every <output id="intervalValue">3.0 s</output><input id="interval" type="range" min="0.5" max="8" step="0.5" value="3"></label>
<button id="auto">Start A ↔ B</button>
<h2>Animation weights</h2><div id="weights"></div><p id="status" role="status">Loading…</p><p class="note">Preview the model’s animation clips. This view uses the fade slider; the game blends animations based on movement and work.</p>
</aside></main>`

document
    .querySelectorAll('button')
    .forEach((button) => button.classList.add('game-button'))
document
    .querySelectorAll('select')
    .forEach((select) => select.classList.add('game-input'))

function element<T extends HTMLElement>(id: string) {
    return document.getElementById(id)! as T
}
const viewport = element('viewport')
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
viewport.append(renderer.domElement)
const scene = new THREE.Scene()
scene.background = new THREE.Color('#202a2c')
const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 200)
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
scene.add(new THREE.HemisphereLight(0xe8f4ff, 0x7d735b, 2.5))
const light = new THREE.DirectionalLight(0xffe8cf, 3)
light.position.set(3, 6, 4)
light.castShadow = true
light.shadow.mapSize.set(2048, 2048)
scene.add(light)

async function start() {
    const gltf = await new GLTFLoader().loadAsync(humanUrl)
    const model = gltf.scene
    scene.add(model)
    model.traverse((object) => {
        if (object instanceof THREE.Mesh) object.castShadow = true
    })
    const box = new THREE.Box3().setFromObject(model)
    const height = box.max.y - box.min.y
    const center = box.getCenter(new THREE.Vector3())
    controls.target.set(center.x, box.min.y + height * 0.5, center.z)
    camera.position
        .copy(controls.target)
        .add(new THREE.Vector3(height * 1.5, height * 0.5, height * 2.8))
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(height * 100, height * 100),
        new THREE.MeshStandardMaterial({ color: '#293638', roughness: 1 }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = box.min.y - height * 0.005
    floor.receiveShadow = true
    scene.add(floor)
    const grid = new THREE.GridHelper(height * 10, 40, 0x526261, 0x354544)
    grid.position.y = floor.position.y + height * 0.001
    scene.add(grid)

    const carryPose = bindCarryPose(model)
    let attachment: THREE.Object3D | undefined
    let carrying = false
    const equipment = element<HTMLSelectElement>('equipment')
    const carryToggle = element<HTMLInputElement>('carryPose')
    function restoreArm() {
        if (!carrying) return
        for (const { bone, animatedRotation } of carryPose) {
            bone.quaternion.copy(animatedRotation)
        }
        carrying = false
    }
    function applyCarryPose() {
        if (equipment.value !== 'carriedLog' || !carryToggle.checked) return
        for (const { bone, rotation, animatedRotation } of carryPose) {
            animatedRotation.copy(bone.quaternion)
            bone.quaternion.copy(rotation)
        }
        carrying = true
    }
    equipment.onchange = () => {
        restoreArm()
        attachment?.removeFromParent()
        attachment = undefined
        const visual =
            equipment.value === 'carriedLog'
                ? carriedLogModel
                : equipmentModels[equipment.value as ItemId]
        if (visual) {
            const bone = model.getObjectByName(
                THREE.PropertyBinding.sanitizeNodeName(visual.bone),
            )
            if (bone) {
                attachment = visual.model.clone()
                attachment.position.set(...visual.position)
                attachment.rotation.set(...visual.rotation)
                attachment.scale.set(...visual.scale)
                bone.add(attachment)
            }
        }
        applyCarryPose()
    }
    carryToggle.onchange = () => {
        restoreArm()
        applyCarryPose()
    }

    const mixer = new THREE.AnimationMixer(model)
    const actions = prepareHumanAnimations(gltf.animations).map((clip) =>
        mixer.clipAction(clip).setEffectiveWeight(0).play(),
    )
    if (!actions.length) throw new Error('The model contains no animations.')
    const labels: Record<string, string> = {
        Idle: 'Idle',
        walk: 'Walk',
        chop: 'Chop',
        swordAttack: 'Sword attack',
    }
    let selected = 0
    let elapsed = 0
    let duration = 0
    let starts = actions.map(() => 0)
    let paused = false
    let automatic = false
    let autoElapsed = 0
    actions[0]!.setEffectiveWeight(1)
    const buttons = actions.map((action, index) => {
        const button = document.createElement('button')
        button.className = 'game-button'
        button.textContent = labels[action.getClip().name] ?? action.getClip().name
        button.onclick = () => {
            automatic = false
            updateAuto()
            choose(index)
        }
        return button
    })
    element('clips').replaceChildren(...buttons)
    const bars = actions.map((action, index) => {
        const row = document.createElement('div')
        row.className = 'weight'
        row.innerHTML = `<div><span>${buttons[index]!.textContent}</span><output>0%</output></div><progress max="1" value="0"></progress>`
        element('weights').append(row)
        return {
            progress: row.querySelector('progress')!,
            value: row.querySelector('output')!,
            action,
        }
    })
    const from = element<HTMLSelectElement>('from')
    const to = element<HTMLSelectElement>('to')
    for (const select of [from, to])
        actions.forEach((_, index) =>
            select.add(new Option(buttons[index]!.textContent!, String(index))),
        )
    to.value = String(Math.min(1, actions.length - 1))
    function choose(index: number) {
        if (index === selected && duration > elapsed) return
        starts = actions.map((action) => action.getEffectiveWeight())
        selected = index
        elapsed = 0
        duration = Number(element<HTMLInputElement>('fade').value)
        if (starts[index]! < 0.001) actions[index]!.reset().play()
        buttons.forEach((button, i) =>
            button.setAttribute('aria-pressed', String(i === index)),
        )
        element('status').textContent =
            `${buttons[index]!.textContent} · clip ${actions[index]!.getClip().duration.toFixed(2)} s`
        blend(0)
    }
    function blend(dt: number) {
        elapsed += dt
        const t =
            duration === 0 ? 1 : THREE.MathUtils.smoothstep(elapsed / duration, 0, 1)
        actions.forEach((action, index) =>
            action.setEffectiveWeight(
                THREE.MathUtils.lerp(starts[index]!, index === selected ? 1 : 0, t),
            ),
        )
    }
    function updateAuto() {
        element('auto').textContent = automatic ? 'Stop A ↔ B' : 'Start A ↔ B'
    }
    element('auto').onclick = () => {
        automatic = !automatic
        autoElapsed = 0
        if (automatic) choose(Number(from.value))
        updateAuto()
    }
    element('pause').onclick = () => {
        paused = !paused
        element('pause').textContent = paused ? 'Resume' : 'Pause'
    }
    element('restart').onclick = () => {
        actions[selected]!.time = 0
        restoreArm()
        mixer.update(0)
        applyCarryPose()
    }
    element('step').onclick = () => {
        paused = true
        element('pause').textContent = 'Resume'
        update(1 / 60)
    }
    for (const [id, suffix, decimals] of [
        ['fade', ' s', 2],
        ['speed', '×', 2],
        ['interval', ' s', 1],
    ] as const) {
        element<HTMLInputElement>(id).oninput = () => {
            element(`${id}Value`).textContent =
                Number(element<HTMLInputElement>(id).value).toFixed(decimals) + suffix
        }
    }
    function update(dt: number) {
        dt *= Number(element<HTMLInputElement>('speed').value)
        if (automatic) {
            autoElapsed += dt
            if (autoElapsed >= Number(element<HTMLInputElement>('interval').value)) {
                autoElapsed = 0
                choose(
                    selected === Number(from.value)
                        ? Number(to.value)
                        : Number(from.value),
                )
            }
        }
        blend(dt)
        restoreArm()
        mixer.update(dt)
        applyCarryPose()
    }
    choose(0)
    const clock = new THREE.Clock()
    renderer.setAnimationLoop(() => {
        const dt = Math.min(clock.getDelta(), 0.1)
        if (!paused) update(dt)
        bars.forEach(({ progress, value, action }) => {
            progress.value = action.getEffectiveWeight()
            value.textContent = `${Math.round(progress.value * 100)}%`
        })
        controls.update()
        renderer.render(scene, camera)
    })
}
new ResizeObserver(() => {
    camera.aspect = viewport.clientWidth / viewport.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(viewport.clientWidth, viewport.clientHeight)
}).observe(viewport)
start().catch((error: unknown) => {
    element('status').textContent = String(error)
    console.error(error)
})
