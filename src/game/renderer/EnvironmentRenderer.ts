import { config } from '+config'
import { type Game } from '+game/Game'

import {
    AmbientLight,
    type Camera,
    DirectionalLight,
    EquirectangularReflectionMapping,
    Fog,
    Object3D,
    type Scene,
    TextureLoader,
} from 'three'

import { BasicRenderer } from './lib/BasicRenderer'
import { SkyRenderer } from './SkyRenderer'
import hdrUrl from './textures/bg.jpg'

const SHADOW_SCALE = 3

export class EnvironmentRenderer extends BasicRenderer {
    // Three.js used to multiply these light intensities by PI.
    public readonly sun = new DirectionalLight(0xfff2c7, 3.2 * Math.PI)
    private readonly sky = new SkyRenderer()
    private readonly fog = new Fog(this.sky.horizon)
    private sunTarget = new Object3D()
    public readonly ambient = new AmbientLight(0xdae6e8, 0.1 * Math.PI)

    constructor(
        public game: Game,
        private scene: Scene,
        private camera: Camera,
    ) {
        super()

        this.scene.add(this.sky.mesh)
        this.scene.onBeforeRender = () => {
            // Depth and outline passes use override materials.
            this.sky.mesh.visible = this.scene.overrideMaterial === null
        }

        this.scene.onAfterRender = () => {
            this.sky.mesh.visible = true
        }

        if (config.renderer.shadow) {
            this.sun.castShadow = true
            this.sun.shadow.mapSize.setScalar(Number(config.renderer.shadowResolution))
            this.sun.shadow.camera.near = 0.5
            this.sun.shadow.camera.far = 200
            this.sun.shadow.camera.left = -100
            this.sun.shadow.camera.right = 100
            this.sun.shadow.camera.top = 100
            this.sun.shadow.camera.bottom = -100
            this.sun.shadow.bias = -0.0001 * config.renderer.tileSize
            this.sun.shadow.normalBias = 0.27 * config.renderer.tileSize
        }

        this.sun.position.set(4, 10, 1)

        this.sun.target = this.sunTarget

        // Helper for the sun
        // const shadowHelper = new CameraHelper(this.sun.shadow.camera)
        // this.scene.add(shadowHelper)

        const loader = new TextureLoader()

        loader.load(hdrUrl, (texture) => {
            texture.mapping = EquirectangularReflectionMapping
            this.scene.environment = texture
        })

        this.scene.add(this.sun)
        this.scene.add(this.sunTarget)
        this.scene.add(this.ambient)
    }

    public render() {
        if (!config.renderer.dayAndNightMode) {
            this.sun.intensity = 3.2 * Math.PI
            this.sun.position.set(4, 10, 1)
            this.sunTarget.position.set(0, 0, 0)
            this.sun.color.setHex(0xfff2c7)
            this.ambient.color.setHex(0xdae6e8)
            this.updateSky()
            return
        }

        const time = ((this.game.timeOfDay / 60 - 12) / 24) * 2 * Math.PI
        const daylight = Math.max(0, Math.cos(time))
        this.sun.intensity = 3.2 * Math.PI * daylight

        this.sun.position.x = this.camera.position.x + Math.sin(time * 1) * 50
        this.sun.position.y = Math.cos(time) * 50
        this.sun.position.z = this.camera.position.z + Math.cos(time * 1) * 50 * -1

        this.sunTarget.position.copy(this.camera.position)
        this.sunTarget.position.y = 0

        this.sun.shadow.camera.left = -SHADOW_SCALE * this.camera.position.y
        this.sun.shadow.camera.right = SHADOW_SCALE * this.camera.position.y
        this.sun.shadow.camera.top = SHADOW_SCALE * this.camera.position.y
        this.sun.shadow.camera.bottom = -SHADOW_SCALE * this.camera.position.y

        this.sun.color.setHSL(
            10 + Math.sin(time * 1) * 0.1,
            Math.sin(time * 1),
            0.45 + daylight * 0.4,
        )

        this.ambient.color.setHSL(
            10 + Math.sin(time * 1) * 0.1,
            Math.sin(time * 1),
            0.12 + daylight * 0.18,
        )

        this.updateSky(time)
    }

    private updateSky(phase?: number) {
        this.sky.update(this.sun.position, this.sunTarget.position, phase)
        const { fog, fogTransparency, tileSize } = config.renderer
        this.scene.fog = fog ? this.fog : null
        if (fog) {
            this.fog.color.copy(this.sky.horizon)
            this.fog.near = fogTransparency
            this.fog.far = Math.max(
                fogTransparency + tileSize,
                (fogTransparency * 75 + 65) * tileSize,
            )
        }
    }

    public destroy() {
        this.sky.destroy()
        this.scene.onBeforeRender = () => {}
        this.scene.onAfterRender = () => {}
    }
}
