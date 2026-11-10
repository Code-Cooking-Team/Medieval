import { config } from '+config'

import { afterEach, beforeEach, expect, it, spyOn } from 'bun:test'
import { Plane, Raycaster, Vector2, Vector3 } from 'three'

import { CAMERA_GESTURE_START, RTSCamera } from './RTSCamera'

const ground = new Plane(new Vector3(0, 1, 0), 0)
const scrollToPan = config.camera.scrollToPan
let canvas: HTMLCanvasElement
let rtsCamera: RTSCamera

beforeEach(() => {
    canvas = document.createElement('canvas')
    spyOn(canvas, 'getBoundingClientRect').mockReturnValue(new DOMRect(20, 30, 600, 400))
    config.camera.scrollToPan = false
    rtsCamera = new RTSCamera(canvas)
    rtsCamera.init()
})

afterEach(() => {
    rtsCamera.destroy()
    config.camera.scrollToPan = scrollToPan
})

function scroll(options: WheelEventInit) {
    const event = new WheelEvent('wheel', {
        cancelable: true,
        ...options,
    })
    // Happy DOM's WheelEvent omits the MouseEvent fields.
    Object.defineProperties(event, {
        clientX: { value: 470 },
        clientY: { value: 260 },
        ctrlKey: { value: options.ctrlKey ?? false },
    })
    canvas.dispatchEvent(event)
    return event
}

function groundUnderCursor() {
    rtsCamera.camera.updateMatrixWorld()
    const raycaster = new Raycaster()
    raycaster.setFromCamera(new Vector2(0.5, -0.15), rtsCamera.camera)
    return raycaster.ray.intersectPlane(ground, new Vector3())!
}

it('keeps the ground point under the cursor even when zoom hits the height limit', () => {
    const anchor = groundUnderCursor()
    expect(scroll({ deltaY: -24000 }).defaultPrevented).toBe(true)
    const camera = rtsCamera.camera
    expect(camera.position.y).toBeCloseTo(config.camera.minHeight)
    expect(groundUnderCursor().distanceTo(anchor)).toBeCloseTo(0)

    const atLimit = camera.position.clone()
    scroll({ deltaY: -100 })
    expect(camera.position.distanceTo(atLimit)).toBeCloseTo(0)
})

it('pans on the ground when enabled and still zooms with a pinch wheel event', () => {
    config.camera.scrollToPan = true
    const camera = rtsCamera.camera
    const start = camera.position.clone()
    scroll({ deltaX: 40, deltaY: 60 })
    expect(camera.position.x).toBeGreaterThan(start.x)
    expect(camera.position.z).toBeGreaterThan(start.z)
    expect(camera.position.y).toBe(start.y)

    scroll({ ctrlKey: true, deltaY: -100 })
    expect(camera.position.y).toBeLessThan(start.y)
})

it('pans and pinches with two touches while leaving single taps available', () => {
    let gestures = 0
    canvas.addEventListener(CAMERA_GESTURE_START, () => gestures++)
    const touch = (type: string, points: [number, number][]) => {
        const targetTouches = points.map(
            ([clientX, clientY], identifier) =>
                new Touch({ identifier, target: canvas, clientX, clientY }),
        )
        const event = new TouchEvent(type, { targetTouches, cancelable: true })
        canvas.dispatchEvent(event)
        return event.defaultPrevented
    }
    const camera = rtsCamera.camera
    const start = camera.position.clone()

    expect(touch('touchstart', [[250, 200]])).toBe(false)
    expect(
        touch('touchstart', [
            [250, 200],
            [350, 200],
        ]),
    ).toBe(true)
    expect(
        touch('touchmove', [
            [270, 220],
            [370, 220],
        ]),
    ).toBe(true)
    expect(camera.position.y).toBe(start.y)
    expect(camera.position.x).toBeLessThan(start.x)
    expect(camera.position.z).toBeLessThan(start.z)

    touch('touchmove', [
        [250, 220],
        [390, 220],
    ])
    expect(camera.position.y).toBeLessThan(start.y)
    expect(touch('touchend', [[250, 220]])).toBe(true)
    expect(touch('touchend', [])).toBe(true)
    expect(touch('touchstart', [[250, 220]])).toBe(false)
    expect(gestures).toBe(1)
})
