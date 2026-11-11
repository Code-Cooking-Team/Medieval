import {
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    Mesh,
    ShaderMaterial,
    Vector3,
} from 'three'

const dayZenith = new Color(0x518dcc)
const dayHorizon = new Color(0x9da99b)
const duskZenith = new Color(0x524975)
const dawnZenith = new Color(0x536b91)
const duskHorizon = new Color(0xbe8c71)
const dawnHorizon = new Color(0xc5a58b)
const nightZenith = new Color(0x101c39)
const nightHorizon = new Color(0x283842)
const nightGroundTint = new Color(0x222d2b)
const groundTint = new Color(0x56624f)
const warmSun = new Color(0xffad69)
const daySun = new Color(0xffffff)

export class SkyRenderer {
    private readonly geometry = new BufferGeometry().setAttribute(
        'position',
        new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
    )

    private readonly uniforms = {
        zenith: { value: new Color() },
        horizon: { value: new Color() },
        belowHorizon: { value: new Color() },
        sunDirection: { value: new Vector3() },
        sunColor: { value: new Color() },
        starOpacity: { value: 0 },
    }

    private readonly material = new ShaderMaterial({
        uniforms: this.uniforms,
        depthWrite: false,
        // Three.js applies scene fog after tone mapping on the direct render path.
        toneMapped: false,
        vertexShader: `
            varying vec3 viewRay;

            void main() {
                vec4 view = inverse(projectionMatrix) * vec4(position.xy, 0.0, 1.0);
                viewRay = transpose(mat3(viewMatrix)) * view.xyz;
                gl_Position = vec4(position.xy, 1.0, 1.0);
            }
        `,
        fragmentShader: `
            #include <common>
            uniform vec3 zenith;
            uniform vec3 horizon;
            uniform vec3 belowHorizon;
            uniform vec3 sunDirection;
            uniform vec3 sunColor;
            uniform float starOpacity;
            varying vec3 viewRay;

            float hash(vec2 cell) {
                vec3 p = fract(vec3(cell.xyx) * 0.1031);
                p += dot(p, p.yzx + 33.33);
                return fract((p.x + p.y) * p.z);
            }

            void main() {
                vec3 ray = normalize(viewRay);
                // Lower the sky gradient so it stays visible from the elevated camera.
                float skyElevation = ray.y + 0.35;
                vec3 color = mix(horizon, zenith, smoothstep(0.01, 0.65, skyElevation));
                color = mix(color, belowHorizon, smoothstep(0.16, 0.85, -skyElevation));

                float sunDistance = max(0.0, 1.0 - dot(ray, sunDirection));
                float halo = 0.55 * exp(-sunDistance * 850.0)
                    + 0.24 * exp(-sunDistance * 75.0)
                    + 0.10 * exp(-sunDistance * 14.0);
                color += sunColor * halo * smoothstep(-0.07, 0.035, sunDirection.y);

                float disc = 1.0 - smoothstep(0.000045, 0.000075, sunDistance);
                disc *= smoothstep(0.0, 0.012, sunDirection.y) * step(0.0, ray.y);
                // Keep the daytime core near white after the composer's tone mapping.
                float intensity = mix(1.4, 48.0, smoothstep(0.12, 0.32, sunDirection.y));
                color = mix(color, sunColor * intensity, disc);

                if (starOpacity > 0.0 && skyElevation > 0.0 && ray.y < 0.995) {
                    vec2 grid = vec2(atan(ray.z, ray.x) / (2.0 * PI) + 0.5,
                        asin(ray.y) / PI + 0.5) * vec2(240.0, 120.0);
                    vec2 cell = floor(grid);
                    cell.x = mod(cell.x, 240.0);
                    float seed = hash(cell);
                    vec2 center = 0.25 + 0.5 * vec2(hash(cell + 17.0), hash(cell + 31.0));
                    float star = (1.0 - smoothstep(0.035, 0.12, length(fract(grid) - center)))
                        * smoothstep(0.92, 1.0, seed);
                    float visibility = smoothstep(0.0, 0.12, skyElevation)
                        * (1.0 - smoothstep(0.96, 0.995, ray.y));
                    color += vec3(0.65, 0.76, 1.0) * star * visibility * starOpacity;
                }

                gl_FragColor = vec4(color, 1.0);
                #include <colorspace_fragment>
            }
        `,
    })

    public readonly mesh = new Mesh(this.geometry, this.material)
    public readonly horizon = this.uniforms.horizon.value

    constructor() {
        this.mesh.frustumCulled = false
        // Fill only pixels left by opaque geometry, before transparent water.
        this.mesh.renderOrder = Infinity
        this.mesh.raycast = () => {}
    }

    public update(sun: Vector3, target: Vector3, phase?: number) {
        const { sunDirection, zenith, belowHorizon, sunColor, starOpacity } =
            this.uniforms
        sunDirection.value.subVectors(sun, target).normalize()
        const elevation = phase === undefined ? 1 : sunDirection.value.y
        const daylight = smoothstep(0.02, 0.48, elevation)
        const twilight = smoothstep(-0.26, 0.04, elevation)
        const dawn = phase === undefined ? 0 : smoothstep(-0.3, 0.3, -Math.sin(phase))

        zenith.value
            .copy(duskZenith)
            .lerp(dawnZenith, dawn)
            .lerp(nightZenith, 1 - twilight)
        zenith.value.lerp(dayZenith, daylight)
        this.horizon
            .copy(duskHorizon)
            .lerp(dawnHorizon, dawn)
            .lerp(nightHorizon, 1 - twilight)
        this.horizon.lerp(dayHorizon, daylight)
        belowHorizon.value.copy(nightGroundTint).lerp(groundTint, twilight)
        belowHorizon.value.lerp(this.horizon, 0.65)
        sunColor.value.copy(warmSun).lerp(daySun, smoothstep(0.03, 0.24, elevation))
        starOpacity.value = 1 - smoothstep(-0.23, -0.045, elevation)
    }

    public destroy() {
        this.mesh.removeFromParent()
        this.geometry.dispose()
        this.material.dispose()
    }
}

function smoothstep(min: number, max: number, value: number) {
    const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
    return t * t * (3 - 2 * t)
}
