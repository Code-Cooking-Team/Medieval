import { AnimationClip, QuaternionKeyframeTrack } from 'three'

export const humanMotionTransitionTime = 1

// Keep the relaxed idle wrists while the walk clip moves the arms and fingers.
// The source walk contains inward wrist rotations that also tilt held tools.
export function prepareHumanAnimations(clips: readonly AnimationClip[]) {
    const idle = AnimationClip.findByName([...clips], 'Idle')
    return clips.map((clip) => {
        if (clip.name !== 'walk' || !idle) return clip
        const walk = clip.clone()
        walk.tracks = walk.tracks.map((track) => {
            if (!/^mixamorig(?:Colon|:)?(?:Left|Right)Hand\.quaternion$/.test(track.name))
                return track
            const reference = idle.tracks.find(
                (candidate) => candidate.name === track.name,
            )
            if (!reference) return track
            return new QuaternionKeyframeTrack(
                track.name,
                [0, clip.duration],
                [...reference.values.slice(0, 4), ...reference.values.slice(0, 4)],
            )
        })
        return walk
    })
}
