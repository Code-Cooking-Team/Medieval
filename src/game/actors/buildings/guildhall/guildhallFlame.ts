import { Color, DoubleSide, Group, Mesh, ShaderMaterial, Vector2, Vector3 } from 'three'

export const guildhallFlameTime = { value: 0 }

export function applyGuildhallFlame(model: Group) {
    let material: ShaderMaterial | undefined
    model.traverse((node) => {
        if (!(node instanceof Mesh) || node.material.name !== 'fire') return

        node.geometry.computeBoundingBox()
        const bounds = node.geometry.boundingBox!
        const { min, max } = bounds
        const scale = new Vector3(1.1, 1.15, 1.1)
        // Scale around the base so the flame stays seated in the hearth.
        const base = bounds.getCenter(new Vector3())
        base.y = min.y
        const offset = base.clone().multiply(scale).sub(base)
        node.position.sub(offset.multiply(node.scale).applyQuaternion(node.quaternion))
        node.scale.multiply(scale)

        material ??= new ShaderMaterial({
            name: 'fire',
            side: DoubleSide,
            uniforms: {
                time: guildhallFlameTime,
                heightRange: { value: new Vector2(min.y, max.y - min.y) },
                ember: { value: new Color(0xf33e0b) },
                orange: { value: new Color(0xff871e) },
                gold: { value: new Color(0xffdb71) },
            },
            vertexShader: /* glsl */ `
                uniform float time;
                uniform vec2 heightRange;
                varying vec3 flamePosition;
                varying float phase;

                void main() {
                    float height = clamp((position.y - heightRange.x) / heightRange.y, 0.0, 1.0);
                    flamePosition = vec3(position.x, height, position.z);
                    phase = time;
                    #ifdef USE_INSTANCING
                        phase += dot(instanceMatrix[3].xz, vec2(1.7, 2.3));
                    #endif

                    // Keep the base in the hearth and let the tip sway and stretch.
                    float tip = height * height;
                    vec3 transformed = position;
                    transformed.x += tip * 0.13 * sin(phase * 3.2 - height * 4.0);
                    transformed.z += tip * 0.11 * sin(phase * 2.7 - height * 3.0);
                    transformed.y += tip * 0.14 * sin(phase * 4.1);
                    #include <project_vertex>
                }
            `,
            fragmentShader: /* glsl */ `
                uniform vec3 ember;
                uniform vec3 orange;
                uniform vec3 gold;
                varying vec3 flamePosition;
                varying float phase;

                void main() {
                    // Warm streaks travel up through the orange body of the flame.
                    float height = flamePosition.y;
                    float flow = sin(height * 14.0 - phase * 5.0
                        + 1.2 * sin(flamePosition.x * 8.0 + flamePosition.z * 5.0));
                    float heat = clamp(1.05 - height + flow * 0.14, 0.0, 1.0);
                    vec3 color = mix(ember, orange, smoothstep(0.05, 0.56, heat));
                    color = mix(color, gold * 1.4, smoothstep(0.46, 0.95, heat));
                    gl_FragColor = vec4(color, 1.0);
                    #include <tonemapping_fragment>
                    #include <colorspace_fragment>
                }
            `,
        })
        node.material = material
        node.castShadow = false
    })
    return model
}
