import { expect, it } from 'bun:test'
import { AnimationClip, QuaternionKeyframeTrack } from 'three'

import { prepareHumanAnimations } from './prepareHumanAnimations'

it('relaxes both walking wrists without changing arm swings, fingers or other clips', () => {
    const wristNames = ['mixamorigLeftHand.quaternion', 'mixamorigRightHand.quaternion']
    const neutral = [0, 0, 0, 1]
    const bent = [0.2, 0, 0, Math.sqrt(0.96)]
    const idle = new AnimationClip(
        'Idle',
        2,
        wristNames.map(
            (name) => new QuaternionKeyframeTrack(name, [0, 2], [...neutral, ...neutral]),
        ),
    )
    const arm = new QuaternionKeyframeTrack(
        'mixamorigRightArm.quaternion',
        [0, 1],
        [...neutral, ...bent],
    )
    const fingers = new QuaternionKeyframeTrack(
        'mixamorigRightHandIndex1.quaternion',
        [0, 1],
        [...bent, ...neutral],
    )
    const walk = new AnimationClip('walk', 1, [
        ...wristNames.map(
            (name) => new QuaternionKeyframeTrack(name, [0, 1], [...bent, ...bent]),
        ),
        arm,
        fingers,
    ])
    const chop = new AnimationClip('chop', 1, [arm])
    const result = prepareHumanAnimations([idle, walk, chop])
    expect(result[0]).toBe(idle)
    expect(result[2]).toBe(chop)
    for (const name of wristNames) {
        const fixed = result[1]!.tracks.find((track) => track.name === name)!
        expect([...fixed.values]).toEqual([...neutral, ...neutral])
        expect([...walk.tracks.find((track) => track.name === name)!.values]).not.toEqual(
            [...fixed.values],
        )
    }
    for (const source of [arm, fingers]) {
        expect([
            ...result[1]!.tracks.find((track) => track.name === source.name)!.values,
        ]).toEqual([...source.values])
    }
})
