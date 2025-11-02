import { config } from '+config'
import { ClockInfo, Renderable } from '+game/types'
import { normalizeEventKeyName } from '+helpers'

import {
    MOUSE,
    PerspectiveCamera,
    Plane,
    Quaternion,
    Raycaster,
    Vector2,
    Vector3,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const CAMERA_SPEED = config.renderer.tileSize * 2

interface ScreenPosition {
    x: number
    y: number
}

export class RTSCamera implements Renderable {
    public camera = new PerspectiveCamera(
        config.camera.fov,
        window.innerWidth / window.innerHeight,
        config.camera.near,
        config.camera.far,
    )

    private keyPressed: { [key: string]: number } = {}
    private touchpadPanDelta: { x: number; y: number } = { x: 0, y: 0 }
    private isTwoFingerPanning = false
    private lastTouchPositions: Map<number, { x: number; y: number }> = new Map()
    private lastCenterPoint: { x: number; y: number } | null = null
    private initialPinchDistance: number | null = null
    private pinchZoomDelta: number = 0
    private isPinching = false
    private groundPlane = new Plane(new Vector3(0, 1, 0), 0)
    private zoomRaycaster = new Raycaster()
    private pointerNdc = new Vector2()
    private pinchZoomTarget: Vector3 | null = null

    constructor(private domElement: HTMLElement) {
        this.camera.position.x = 0
        this.camera.position.y = 5
        this.camera.position.z = 5

        this.camera.rotation.x = -Math.PI / 3
        this.camera.rotation.order = 'YXZ'
    }

    public init() {
        if (config.core.orbitalControls) this.orbitalControls()
        window.document.addEventListener('keydown', this.handleKeyDown)
        window.document.addEventListener('keyup', this.handleKeyUp)
        this.domElement.addEventListener('wheel', this.handleWheel, { passive: false })
        this.domElement.addEventListener('pointerdown', this.handlePointerDown)
        this.domElement.addEventListener('pointermove', this.handlePointerMove)
        this.domElement.addEventListener('pointerup', this.handlePointerUp)
        this.domElement.addEventListener('pointercancel', this.handlePointerUp)
        this.domElement.addEventListener('touchstart', this.handleTouchStart, {
            passive: false,
        })
        this.domElement.addEventListener('touchmove', this.handleTouchMove, {
            passive: false,
        })
        this.domElement.addEventListener('touchend', this.handleTouchEnd)
        this.domElement.addEventListener('touchcancel', this.handleTouchEnd)
    }

    public render({ deltaTime }: ClockInfo) {
        const now = new Date().getTime()

        Object.entries(this.keyPressed).forEach(([keyCode, start]) => {
            const momentum = this.getMomentum(now, start, deltaTime)
            const zoomOutBust = this.camera.position.y * config.renderer.tileSize
            const cameraRotation = this.camera.rotation.x

            let momentumTranslate = (momentum + zoomOutBust) * CAMERA_SPEED

            if (this.keyPressed['ShiftLeft'] || this.keyPressed['ShiftRight']) {
                momentumTranslate *= 2
            }

            switch (keyCode) {
                case 'KeyW':
                case 'ArrowUp':
                    this.camera.translateY(momentumTranslate * -cameraRotation)
                    this.camera.translateZ(
                        momentumTranslate * (-cameraRotation - Math.PI / 2),
                    )

                    break
                case 'KeyS':
                case 'ArrowDown':
                    this.camera.translateY(-momentumTranslate * -cameraRotation)
                    this.camera.translateZ(
                        -momentumTranslate * (-cameraRotation - Math.PI / 2),
                    )
                    break
                case 'KeyD':
                case 'ArrowRight':
                    this.camera.translateX(momentumTranslate)
                    break
                case 'KeyA':
                case 'ArrowLeft':
                    this.camera.translateX(-momentumTranslate)
                    break
                case 'KeyQ':
                    this.rotateCameraY(-momentum)
                    break
                case 'KeyE':
                    this.rotateCameraY(momentum)
                    break
                case 'KeyZ':
                    this.rotateCameraX(momentum)
                    break
                case 'KeyX':
                    this.rotateCameraX(-momentum)
                    break
                default:
            }
        })

        if (
            this.isTwoFingerPanning &&
            (this.touchpadPanDelta.x !== 0 || this.touchpadPanDelta.y !== 0)
        ) {
            const zoomOutBust = this.camera.position.y * config.renderer.tileSize
            const cameraRotation = this.camera.rotation.x
            const panSpeed = CAMERA_SPEED * config.camera.scrollSpeed * 10

            const translateX = this.touchpadPanDelta.x * panSpeed
            const translateY = this.touchpadPanDelta.y * panSpeed

            if (translateX !== 0) {
                this.camera.translateX(-translateX)
            }

            if (translateY !== 0) {
                this.camera.translateY(translateY * -cameraRotation)
                this.camera.translateZ(translateY * (-cameraRotation - Math.PI / 2))
            }

            this.touchpadPanDelta.x = 0
            this.touchpadPanDelta.y = 0
        }

        if (this.isPinching && this.pinchZoomDelta !== 0) {
            const pinchDelta = this.pinchZoomDelta * 0.01 * config.camera.zoomSpeed

            let finalDelta = pinchDelta
            if (pinchDelta <= 0) {
                finalDelta -= this.camera.position.y * 0.01
            } else {
                finalDelta += this.camera.position.y * 0.01
            }

            this.applyZoomMovement(finalDelta, this.pinchZoomTarget)

            this.pinchZoomDelta = 0
        }
    }

    private updatePinchTarget = (screenPosition: ScreenPosition | null) => {
        if (!screenPosition) {
            this.pinchZoomTarget = null
            return
        }

        this.pinchZoomTarget = this.getWorldPointFromScreen(screenPosition)
    }

    private getWorldPointFromScreen = (
        screenPosition: ScreenPosition,
    ): Vector3 | null => {
        const bounds = this.domElement.getBoundingClientRect()

        if (bounds.width === 0 || bounds.height === 0) {
            return null
        }

        const normalizedDeviceX =
            ((screenPosition.x - bounds.left) / bounds.width) * 2 - 1
        const normalizedDeviceY =
            -((screenPosition.y - bounds.top) / bounds.height) * 2 + 1

        this.pointerNdc.set(normalizedDeviceX, normalizedDeviceY)
        this.zoomRaycaster.setFromCamera(this.pointerNdc, this.camera)

        const intersectionPoint = new Vector3()

        if (this.zoomRaycaster.ray.intersectPlane(this.groundPlane, intersectionPoint)) {
            return intersectionPoint
        }

        return null
    }

    private applyZoomMovement = (finalDelta: number, targetPoint: Vector3 | null) => {
        const forwardDirection = new Vector3(0, 0, 1).applyQuaternion(
            this.camera.quaternion,
        )

        const directionToTarget = targetPoint
            ? targetPoint.clone().sub(this.camera.position)
            : null

        const normalizedDirection =
            directionToTarget && directionToTarget.lengthSq() > 0.000001
                ? directionToTarget.normalize()
                : forwardDirection.normalize()

        const movementVector = normalizedDirection.clone().multiplyScalar(-finalDelta)
        const potentialPosition = this.camera.position.clone().add(movementVector)

        const heightBelowMinimum = potentialPosition.y < config.camera.minHeight
        const heightAboveMaximum = potentialPosition.y > config.camera.maxHeight

        if (heightBelowMinimum || heightAboveMaximum) {
            return false
        }

        this.camera.position.copy(potentialPosition)

        return true
    }

    private getMomentum(now: number, start: number, deltaTime: number) {
        const duration = now - start
        // increase momentum if key pressed longer
        let momentum = Math.sqrt(duration + 800) * 0.01
        // adjust for actual time passed
        return (momentum * deltaTime) / 0.016
    }

    private rotateCameraY(momentum: number) {
        const quat = new Quaternion()
        const v3 = new Vector3(0, 1, 0)

        quat.setFromAxisAngle(v3, momentum * 0.1)
        this.camera.applyQuaternion(quat)
        this.camera.translateX(
            ((momentum * this.camera.position.y) / 8) *
                (this.camera.rotation.x + Math.PI / 2),
        )

        // Clamp the Y position to stay within limits while preserving rotation
        this.camera.position.y = Math.max(
            config.camera.minHeight,
            Math.min(config.camera.maxHeight, this.camera.position.y),
        )
    }

    private rotateCameraX(momentum: number) {
        this.camera.rotateX(momentum * 0.1)
        this.camera.translateY((-momentum * this.camera.position.y) / 8)

        // Clamp the Y position to stay within limits while preserving rotation
        this.camera.position.y = Math.max(
            config.camera.minHeight,
            Math.min(config.camera.maxHeight, this.camera.position.y),
        )
    }

    private orbitalControls() {
        const controls = new OrbitControls(this.camera, this.domElement)

        controls.enableZoom = false
        controls.mouseButtons = {
            LEFT: undefined as any,
            MIDDLE: MOUSE.ROTATE,
            RIGHT: MOUSE.PAN,
        }
    }

    private handleKeyDown = (event: KeyboardEvent) => {
        if (!this.keyPressed[event.code]) {
            this.keyPressed[event.code] = new Date().getTime()
        }
    }

    private handleKeyUp = (event: KeyboardEvent) => {
        delete this.keyPressed[event.code]
    }

    private handleWheel = (event: WheelEvent) => {
        event.preventDefault()

        if (event.ctrlKey || event.metaKey) {
            const delta = (event.deltaY / 240) * config.camera.zoomSpeed
            const zoomDelta = delta

            let finalDelta = zoomDelta
            if (zoomDelta <= 0) {
                finalDelta -= this.camera.position.y * 0.01
            } else {
                finalDelta += this.camera.position.y * 0.01
            }

            const pointerPosition: ScreenPosition = {
                x: event.clientX,
                y: event.clientY,
            }

            const targetPoint = this.getWorldPointFromScreen(pointerPosition)

            this.applyZoomMovement(finalDelta, targetPoint)
        } else {
            const cameraRotation = this.camera.rotation.x
            const panSpeed = CAMERA_SPEED * config.camera.scrollSpeed

            const translateX = event.deltaX * panSpeed
            const translateY = -event.deltaY * panSpeed

            if (translateX !== 0) {
                this.camera.translateX(translateX)
            }

            if (translateY !== 0) {
                this.camera.translateY(translateY * -cameraRotation)
                this.camera.translateZ(translateY * (-cameraRotation - Math.PI / 2))
            }
        }
    }

    private getDistance(
        pos1: { x: number; y: number },
        pos2: { x: number; y: number },
    ): number {
        const dx = pos2.x - pos1.x
        const dy = pos2.y - pos1.y
        return Math.sqrt(dx * dx + dy * dy)
    }

    private handlePointerDown = (event: PointerEvent) => {
        if (event.pointerType === 'touch' || event.pointerType === 'mouse') {
            this.lastTouchPositions.set(event.pointerId, {
                x: event.clientX,
                y: event.clientY,
            })

            if (this.lastTouchPositions.size === 2) {
                event.preventDefault()

                const positions = Array.from(this.lastTouchPositions.values())
                const pos1 = positions[0]
                const pos2 = positions[1]
                if (!pos1 || !pos2) return

                this.lastCenterPoint = {
                    x: positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length,
                    y: positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length,
                }
                this.initialPinchDistance = this.getDistance(pos1, pos2)
                this.isPinching = false
                this.isTwoFingerPanning = false
                this.updatePinchTarget(this.lastCenterPoint)
            }
        }
    }

    private handlePointerMove = (event: PointerEvent) => {
        if (
            this.lastTouchPositions.size !== 2 ||
            !this.lastCenterPoint ||
            !this.initialPinchDistance
        )
            return

        event.preventDefault()

        this.lastTouchPositions.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
        })

        const positions = Array.from(this.lastTouchPositions.values())
        const pos1 = positions[0]
        const pos2 = positions[1]
        if (!pos1 || !pos2) return

        const currentCenter = {
            x: positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length,
            y: positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length,
        }

        const currentDistance = this.getDistance(pos1, pos2)
        const distanceChange = currentDistance - this.initialPinchDistance
        const centerMoveX = currentCenter.x - this.lastCenterPoint.x
        const centerMoveY = currentCenter.y - this.lastCenterPoint.y
        const centerMoveDistance = Math.sqrt(
            centerMoveX * centerMoveX + centerMoveY * centerMoveY,
        )

        if (Math.abs(distanceChange) > 10 || this.isPinching) {
            if (!this.isTwoFingerPanning) {
                this.isPinching = true
                this.pinchZoomDelta += distanceChange
                this.initialPinchDistance = currentDistance
                this.lastCenterPoint = currentCenter
                this.updatePinchTarget(currentCenter)
            }
        } else if (centerMoveDistance > 5 || this.isTwoFingerPanning) {
            if (!this.isPinching) {
                this.isTwoFingerPanning = true
                this.touchpadPanDelta.x += centerMoveX
                this.touchpadPanDelta.y += centerMoveY
                this.lastCenterPoint = currentCenter
                this.updatePinchTarget(currentCenter)
            }
        }
    }

    private handlePointerUp = (event: PointerEvent) => {
        if (this.isPinching || this.isTwoFingerPanning) {
            event.preventDefault()
        }

        this.lastTouchPositions.delete(event.pointerId)

        if (this.lastTouchPositions.size < 2) {
            this.isTwoFingerPanning = false
            this.isPinching = false
            this.touchpadPanDelta = { x: 0, y: 0 }
            this.lastCenterPoint = null
            this.initialPinchDistance = null
            this.pinchZoomDelta = 0
            this.pinchZoomTarget = null
        } else if (this.lastTouchPositions.size === 2) {
            const positions = Array.from(this.lastTouchPositions.values())
            const pos1 = positions[0]
            const pos2 = positions[1]
            if (!pos1 || !pos2) return

            this.lastCenterPoint = {
                x: positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length,
                y: positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length,
            }
            this.initialPinchDistance = this.getDistance(pos1, pos2)
            this.isPinching = false
            this.isTwoFingerPanning = false
            this.updatePinchTarget(this.lastCenterPoint)
        }
    }

    private handleTouchStart = (event: TouchEvent) => {
        if (event.touches.length === 2) {
            event.preventDefault()

            const touch1 = event.touches[0]
            const touch2 = event.touches[1]
            if (!touch1 || !touch2) return

            this.lastTouchPositions.clear()
            this.lastTouchPositions.set(0, { x: touch1.clientX, y: touch1.clientY })
            this.lastTouchPositions.set(1, { x: touch2.clientX, y: touch2.clientY })

            this.lastCenterPoint = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2,
            }
            this.initialPinchDistance = this.getDistance(
                { x: touch1.clientX, y: touch1.clientY },
                { x: touch2.clientX, y: touch2.clientY },
            )
            this.isPinching = false
            this.isTwoFingerPanning = false
            this.updatePinchTarget(this.lastCenterPoint)
        }
    }

    private handleTouchMove = (event: TouchEvent) => {
        if (event.touches.length === 2) {
            event.preventDefault()

            const touch1 = event.touches[0]
            const touch2 = event.touches[1]
            if (!touch1 || !touch2) return

            if (!this.lastCenterPoint || !this.initialPinchDistance) {
                this.lastCenterPoint = {
                    x: (touch1.clientX + touch2.clientX) / 2,
                    y: (touch1.clientY + touch2.clientY) / 2,
                }
                this.initialPinchDistance = this.getDistance(
                    { x: touch1.clientX, y: touch1.clientY },
                    { x: touch2.clientX, y: touch2.clientY },
                )
                this.updatePinchTarget(this.lastCenterPoint)
                return
            }

            const currentCenter = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2,
            }

            const currentDistance = this.getDistance(
                { x: touch1.clientX, y: touch1.clientY },
                { x: touch2.clientX, y: touch2.clientY },
            )

            const distanceChange = currentDistance - this.initialPinchDistance
            const centerMoveX = currentCenter.x - this.lastCenterPoint.x
            const centerMoveY = currentCenter.y - this.lastCenterPoint.y
            const centerMoveDistance = Math.sqrt(
                centerMoveX * centerMoveX + centerMoveY * centerMoveY,
            )

            if (Math.abs(distanceChange) > 10 || this.isPinching) {
                if (!this.isTwoFingerPanning) {
                    this.isPinching = true
                    this.pinchZoomDelta += distanceChange
                    this.initialPinchDistance = currentDistance
                    this.lastCenterPoint = currentCenter
                    this.updatePinchTarget(currentCenter)
                }
            } else if (centerMoveDistance > 5 || this.isTwoFingerPanning) {
                if (!this.isPinching) {
                    this.isTwoFingerPanning = true
                    this.touchpadPanDelta.x += centerMoveX
                    this.touchpadPanDelta.y += centerMoveY
                    this.lastCenterPoint = currentCenter
                    this.updatePinchTarget(currentCenter)
                }
            }
        }
    }

    private handleTouchEnd = (event: TouchEvent) => {
        if (event.touches.length < 2) {
            if (this.isPinching || this.isTwoFingerPanning) {
                event.preventDefault()
            }

            this.isTwoFingerPanning = false
            this.isPinching = false
            this.touchpadPanDelta = { x: 0, y: 0 }
            this.lastCenterPoint = null
            this.initialPinchDistance = null
            this.pinchZoomDelta = 0
            this.lastTouchPositions.clear()
            this.pinchZoomTarget = null
        }
    }
}
